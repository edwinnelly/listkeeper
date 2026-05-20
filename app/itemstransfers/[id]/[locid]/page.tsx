"use client";

import { withAuth } from "@/hoc/withAuth";
import { apiGet, apiPost } from "@/lib/axios";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  ArrowLeft,
  Save,
  Loader2,
  Package,
  AlertCircle,
  MapPin,
  Calendar,
  Warehouse,
  ArrowRightLeft,
  ChevronDown,
  Hash,
  StickyNote,
  Building2,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { toast } from "react-hot-toast";
import { motion } from "framer-motion";

// ==============================================
// Type Definitions
// ==============================================

/** Represents a product at a specific location from the API */
interface ProductLocation {
  id: number;
  owner_id: number;
  business_key: string;
  location_id: number;
  product_id: number;
  category_id: number;
  supplier_id: number | null;
  price: number;
  cost_price: number;
  sale_price: number;
  stock_quantity: number;
  low_stock_threshold: number;
  manufactured_at: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
  encrypted_id: string;
  /** Computed: Derived from location object for convenience */
  location_name?: string;
  /** Computed: Whether the product is out of stock */
  is_out_of_stock?: boolean;
  product: {
    id: number;
    name: string;
    slug: string;
    description: string;
    sku: string;
    dimensions: string;
    image: string | null;
    barcode: string;
    is_active: boolean;
  };
  category: {
    id: number;
    name: string;
  };
  location: {
    id: number;
    location_name: string;
    address: string;
    city: string;
    state: string;
    country: string;
    postal_code: string;
    head_office: string;
  };
}

/** Represents a single transfer line item */
interface TransferItem {
  product_id: number;
  product_name: string;
  sku: string;
  stock_quantity: number;
  unit_cost: number;
  total: number;
  available_stock: number;
}

/** Form state for the stock transfer */
interface FormData {
  from_location_id: string;
  to_location_id: string;
  transfer_date: string;
  expected_delivery_date: string;
  notes: string;
  reference_number: string;
  items: TransferItem[];
}

/** Authenticated user object with business settings */
interface User {
  businesses_one?: Array<{
    currency?: string;
    name?: string;
  }>;
}

/** Location entity from the locations API */
interface Location {
  id: number;
  encrypted_id: string;
  location_name: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  head_office?: string;
  location_status?: string;
  phone?: string;
  postal_code?: string;
}

// ==============================================
// Constants
// ==============================================

const CURRENCY_LOCALE = "en-US";
const DEFAULT_CURRENCY = "USD";
const API_STORAGE_BASE_URL = process.env.NEXT_PUBLIC_STORAGE_URL || "http://localhost:8000/storage";

// ==============================================
// Utility Functions
// ==============================================

/**
 * Formats a Date object to YYYY-MM-DD string for date inputs
 */
const formatDateForInput = (date: Date): string => date.toISOString().split("T")[0];

/**
 * Formats a number as currency with the given symbol
 */
const formatCurrency = (amount: number, symbol: string = "$"): string => {
  return new Intl.NumberFormat(CURRENCY_LOCALE, {
    style: "currency",
    currency: DEFAULT_CURRENCY,
    minimumFractionDigits: 2,
  })
    .format(amount)
    .replace(/^\$/, symbol);
};

/**
 * Safely extracts an array from API response by trying multiple paths
 */
const extractDataFromResponse = <T,>(response: unknown, paths: string[]): T[] => {
  for (const path of paths) {
    const data = path.split(".").reduce((obj: any, key) => obj?.[key], response);
    if (Array.isArray(data)) return data;
  }
  return [];
};

/**
 * Builds a full address string from location parts
 */
const getFullAddress = (location: Location): string => {
  const parts = [
    location.address,
    location.city,
    location.state,
    location.country,
    location.postal_code,
  ].filter(Boolean);
  return parts.length ? parts.join(", ") : "No address available";
};

/**
 * Constructs the full image URL from a relative path
 */
const getImageUrl = (src: string | null): string => {
  if (!src) return "";
  return `${API_STORAGE_BASE_URL}/${src}`;
};

/**
 * Transforms raw API product data to the frontend ProductLocation type,
 * adding computed fields and defaults for missing nested objects
 */
const transformProductData = (apiData: any): ProductLocation => {
  if (!apiData) return apiData;
  
  return {
    ...apiData,
    location_name: apiData.location?.location_name || "Unknown Location",
    is_out_of_stock: apiData.stock_quantity === 0,
    product: apiData.product || {
      id: apiData.product_id,
      name: "Unknown Product",
      slug: "",
      description: "",
      sku: "N/A",
      dimensions: "",
      image: null,
      barcode: "",
      is_active: true,
    },
  };
};

// ==============================================
// Main Component
// ==============================================

/**
 * NewTransferPage component for creating a stock transfer
 * URL Pattern: /itemstransfers/[encryptedPid]/[locid]
 * - encryptedPid: Encrypted product ID
 * - locid: Encrypted source location ID
 */
const NewTransferPage = ({ user }: { user: User }) => {
  const router = useRouter();
  const params = useParams();
  
  // Extract URL parameters
  const encryptedPid = params?.id as string || "";
  const sourceLocationId = params?.locid as string || "";
  
  // Get currency symbol from user's business settings
  const currencySymbol = user?.businesses_one?.[0]?.currency || "$";

  // Form state
  const [formData, setFormData] = useState<FormData>({
    from_location_id: sourceLocationId,
    to_location_id: "",
    transfer_date: formatDateForInput(new Date()),
    expected_delivery_date: "",
    notes: "",
    reference_number: "",
    items: [],
  });

  // Data state
  const [locations, setLocations] = useState<Location[]>([]);
  const [preloadedProduct, setPreloadedProduct] = useState<ProductLocation | null>(null);
  
  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // ==============================================
  // Data Fetching
  // ==============================================

  /**
   * Fetches locations and product data on mount
   * Only runs when both URL parameters are present
   */
  useEffect(() => {
    if (encryptedPid && sourceLocationId) {
      fetchInitialData();
    }
  }, [encryptedPid, sourceLocationId]);

  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
      // Fetch locations and product data in parallel
      const [locationsRes, productRes] = await Promise.all([
        apiGet("/locations", {}, false),
        apiGet(`/product_location_single/${encryptedPid}/${sourceLocationId}`, {}, false),
      ]);

      // Process locations
      const allLocations = extractDataFromResponse<Location>(locationsRes, [
        "data",
        "data.data",
        "data.locations",
      ]);
      setLocations(allLocations);

      // Process product data
      const rawProductData = productRes.data?.data || productRes.data;

      if (rawProductData?.product_id) {
        const transformedProduct = transformProductData(rawProductData);
        setPreloadedProduct(transformedProduct);
        
        // Auto-add the product to transfer with quantity 1
        const transferItem: TransferItem = {
          product_id: transformedProduct.product_id,
          product_name: transformedProduct.product?.name || "Unknown Product",
          sku: transformedProduct.product?.sku || "N/A",
          stock_quantity: 1,
          unit_cost: transformedProduct.cost_price || 0,
          total: (transformedProduct.cost_price || 0) * 1,
          available_stock: transformedProduct.stock_quantity || 0,
        };

        setFormData(prev => ({
          ...prev,
          items: [transferItem],
        }));
      } else {
        toast.error("Product not found at this location");
      }
    } catch (error: any) {
      const message = error?.response?.data?.message || "Failed to load product details";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  // ==============================================
  // Form Handlers
  // ==============================================

  /** Updates a top-level form field */
  const updateField = useCallback((field: keyof FormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  /** Updates a transfer item field, recalculating total when needed */
  const updateItem = useCallback(
    (index: number, field: keyof TransferItem, value: any) => {
      setFormData((prev) => {
        const updatedItems = [...prev.items];
        updatedItems[index] = { ...updatedItems[index], [field]: value };
        
        // Recalculate total when quantity or cost changes
        if (field === "stock_quantity" || field === "unit_cost") {
          const item = updatedItems[index];
          updatedItems[index].total = item.stock_quantity * item.unit_cost;
        }
        return { ...prev, items: updatedItems };
      });
    },
    []
  );

  // ==============================================
  // Computed Values
  // ==============================================

  const selectedFromLocation = useMemo(
    () => locations.find((l) => l.encrypted_id === formData.from_location_id) || null,
    [formData.from_location_id, locations]
  );

  const selectedToLocation = useMemo(
    () => locations.find((l) => l.encrypted_id === formData.to_location_id) || null,
    [formData.to_location_id, locations]
  );

  const subtotal = useMemo(
    () => formData.items.reduce((sum, item) => sum + item.total, 0),
    [formData.items]
  );

  // ==============================================
  // Validation
  // ==============================================

  /**
   * Validates the form before submission
   * @returns true if form is valid, false otherwise
   */
  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.to_location_id) {
      newErrors.to_location_id = "Please select destination location";
    }
    if (formData.from_location_id === formData.to_location_id) {
      newErrors.to_location_id = "Source and destination cannot be the same";
    }
    if (!formData.transfer_date) {
      newErrors.transfer_date = "Please select transfer date";
    }
    if (formData.items.length === 0) {
      newErrors.items = "Please add at least one product";
    }
    
    // Validate each item's quantity
    formData.items.forEach((item, index) => {
      if (item.available_stock > 0 && item.stock_quantity > item.available_stock) {
        newErrors[`item_${index}`] = `Insufficient stock for ${item.product_name}`;
      }
      if (item.stock_quantity <= 0) {
        newErrors[`item_${index}`] = `Quantity must be greater than 0`;
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  // ==============================================
  // Submission
  // ==============================================

  /**
   * Handles form submission to create a new stock transfer
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error("Please fix the errors before submitting");
      return;
    }

    setIsSubmitting(true);

    const payload = {
      from_location_id: formData.from_location_id,
      to_location_id: formData.to_location_id,
      transfer_date: formData.transfer_date,
      expected_delivery_date: formData.expected_delivery_date || null,
      notes: formData.notes || null,
      reference_number: formData.reference_number || null,
      items: formData.items.map(({ product_id, stock_quantity, unit_cost }) => ({
        product_id,
        stock_quantity,
        unit_cost,
      })),
    };

    // Log the payload before submission
    console.log("🚀 Submitting stock transfer payload:", JSON.stringify(payload, null, 2));
    console.log("📦 Payload details:", {
      sourceLocation: payload.from_location_id,
      destinationLocation: payload.to_location_id,
      transferDate: payload.transfer_date,
      expectedDelivery: payload.expected_delivery_date,
      itemCount: payload.items.length,
      items: payload.items,
      hasNotes: !!payload.notes,
      hasReference: !!payload.reference_number,
    });

    try {
      const response = await apiPost("/stock-transfers", payload);
      console.log("✅ Transfer created successfully:", response);
      toast.success("Stock transfer created successfully!");
      router.push("/transfers");
      router.refresh();
    } catch (error: any) {
      console.error("❌ Transfer creation failed:", {
        error: error?.message,
        response: error?.response?.data,
        status: error?.response?.status,
        payload: payload,
      });
      const message = error?.response?.data?.message || "Failed to create stock transfer";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ==============================================
  // Render: Loading State
  // ==============================================

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#166534] mx-auto mb-4" />
          <p className="text-gray-500">Loading product details...</p>
        </div>
      </div>
    );
  }

  // ==============================================
  // Render: Error State (Product Not Found)
  // ==============================================

  if (!preloadedProduct && !isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Product Not Found</h2>
          <p className="text-gray-500 mb-6">The requested product could not be found at this location.</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => router.back()}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Go Back
            </button>
            <button
              onClick={() => router.push("/locations")}
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#166534] text-white rounded-xl hover:bg-[#14532d] transition-colors"
            >
              <Warehouse className="h-4 w-4" />
              View Locations
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==============================================
  // Render: Main Form
  // ==============================================

  const item = formData.items[0];
  const isOverStock = item && item.available_stock > 0 && item.stock_quantity > item.available_stock;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all"
                aria-label="Go back"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                  Transfer Product
                </h1>
                <p className="text-sm text-gray-500">
                  {preloadedProduct?.product?.name || "Loading..."}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/transfers"
                className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border-2 border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all"
              >
                View Transfers
              </Link>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#166534] text-white text-sm font-semibold rounded-xl hover:bg-[#14532d] transition-all shadow-lg shadow-[#166534]/25 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {isSubmitting ? "Creating..." : "Create Transfer"}
              </motion.button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Product Info Banner */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden"
          >
            <div className="p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                {/* Product image thumbnail */}
                <div className="w-20 h-20 bg-[#166534]/10 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {preloadedProduct?.product?.image ? (
                    <img 
                      src={getImageUrl(preloadedProduct.product.image)}
                      alt={preloadedProduct.product.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <Package className="h-10 w-10 text-[#166534]" />
                  )}
                </div>
                
                {/* Product details */}
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-gray-900">
                    {preloadedProduct?.product?.name}
                  </h2>
                  <div className="flex flex-wrap gap-x-6 gap-y-2 mt-3">
                    <DetailItem label="SKU" value={preloadedProduct?.product?.sku} />
                    {preloadedProduct?.category && (
                      <DetailItem label="Category" value={preloadedProduct.category.name} />
                    )}
                    <DetailItem 
                      label="Cost Price" 
                      value={formatCurrency(preloadedProduct?.cost_price || 0, currencySymbol)}
                      valueClassName="text-[#166534] font-semibold"
                    />
                    <DetailItem 
                      label="Sale Price" 
                      value={formatCurrency(preloadedProduct?.sale_price || 0, currencySymbol)}
                    />
                    <DetailItem 
                      label="Available Stock" 
                      value={`${preloadedProduct?.stock_quantity || 0} units`}
                      valueClassName={`font-semibold ${getStockColorClass(preloadedProduct?.stock_quantity || 0)}`}
                    />
                    {preloadedProduct?.location && (
                      <DetailItem 
                        label="Location" 
                        value={preloadedProduct.location.location_name}
                      />
                    )}
                  </div>
                  
                  {/* Out of stock badge */}
                  {preloadedProduct?.is_out_of_stock && (
                    <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 bg-red-50 border border-red-200 rounded-full">
                      <AlertCircle className="h-3.5 w-3.5 text-red-600" />
                      <span className="text-xs font-medium text-red-700">Out of Stock</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Transfer Details */}
          <SectionCard
            icon={<ArrowRightLeft className="h-5 w-5 text-white" />}
            title="Transfer Details"
            description="Select source and destination locations"
            delay={0.05}
          >
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Source Location (read-only) */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                    <Warehouse className="h-4 w-4 text-[#166534]" />
                    Source Location
                  </label>
                  <div className="px-4 py-3 bg-gray-100 border-2 border-gray-300 rounded-xl text-sm text-gray-800 font-medium">
                    {preloadedProduct?.location?.location_name || selectedFromLocation?.location_name || "Loading location..."}
                    {(preloadedProduct?.location?.head_office === "yes" || selectedFromLocation?.head_office === "yes") && " (HQ)"}
                  </div>
                  {preloadedProduct?.location && (
                    <AddressCard address={getFullAddress(preloadedProduct.location as Location)} type="source" />
                  )}
                </div>

                {/* Destination Location */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                    <Building2 className="h-4 w-4 text-[#166534]" />
                    Destination Location <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={formData.to_location_id}
                      onChange={(e) => updateField("to_location_id", e.target.value)}
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-[#166534]/20 focus:border-[#166534] outline-none text-sm appearance-none bg-white transition-all ${
                        errors.to_location_id ? "border-red-300 bg-red-50" : "border-gray-200"
                      }`}
                      aria-label="Select destination location"
                    >
                      <option value="">Select destination location...</option>
                      {locations
                        .filter(loc => loc.encrypted_id !== formData.from_location_id)
                        .map((location) => (
                          <option key={location.encrypted_id} value={location.encrypted_id}>
                            {location.location_name}
                            {location.head_office === "yes" && " (HQ)"}
                          </option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                  </div>
                  {errors.to_location_id && (
                    <p className="mt-2 text-xs text-red-600 flex items-center gap-1" role="alert">
                      <AlertCircle className="h-3 w-3" />
                      {errors.to_location_id}
                    </p>
                  )}
                  {selectedToLocation && (
                    <AddressCard address={getFullAddress(selectedToLocation)} type="destination" />
                  )}
                </div>
              </div>

              {/* Date and Reference Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
                <FormField
                  label="Transfer Date"
                  required
                  icon={<Calendar className="h-4 w-4 text-[#166534]" />}
                  error={errors.transfer_date}
                >
                  <input
                    type="date"
                    value={formData.transfer_date}
                    onChange={(e) => updateField("transfer_date", e.target.value)}
                    min={formatDateForInput(new Date())}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#166534]/20 focus:border-[#166534] outline-none text-sm transition-all"
                  />
                </FormField>
                
                <FormField
                  label="Expected Delivery"
                  icon={<Calendar className="h-4 w-4 text-[#166534]" />}
                >
                  <input
                    type="date"
                    value={formData.expected_delivery_date}
                    onChange={(e) => updateField("expected_delivery_date", e.target.value)}
                    min={formData.transfer_date || formatDateForInput(new Date())}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#166534]/20 focus:border-[#166534] outline-none text-sm transition-all"
                  />
                </FormField>
                
                <FormField
                  label="Reference Number"
                  icon={<Hash className="h-4 w-4 text-[#166534]" />}
                >
                  <input
                    type="text"
                    value={formData.reference_number}
                    onChange={(e) => updateField("reference_number", e.target.value)}
                    placeholder="e.g., TRF-2024-001"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#166534]/20 focus:border-[#166534] outline-none text-sm transition-all"
                  />
                </FormField>
              </div>
            </div>
          </SectionCard>

          {/* Transfer Item */}
          <SectionCard
            icon={<Package className="h-5 w-5 text-white" />}
            title="Transfer Quantity"
            description={`Available stock: ${preloadedProduct?.stock_quantity || 0} units`}
            delay={0.1}
            action={preloadedProduct?.stock_quantity === 0 && (
              <span className="px-3 py-1 bg-red-50 text-red-700 text-xs font-medium rounded-full border border-red-200">
                Out of Stock
              </span>
            )}
          >
            <div className="p-6">
              {item && preloadedProduct && preloadedProduct.stock_quantity > 0 ? (
                <div className={`p-6 rounded-xl border-2 transition-all ${
                  isOverStock ? "border-red-200 bg-red-50" : "border-gray-100 bg-gray-50"
                }`}>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    {/* Quantity Input */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Transfer Quantity <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min="1"
                          max={item.available_stock}
                          value={item.stock_quantity}
                          onChange={(e) => updateItem(0, "stock_quantity", Math.max(1, parseInt(e.target.value) || 1))}
                          className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-[#166534]/20 outline-none text-lg font-medium transition-all ${
                            isOverStock ? "border-red-300 focus:border-red-500 bg-white" : "border-gray-200 focus:border-[#166534] bg-white"
                          }`}
                          aria-label="Transfer quantity"
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-1">
                          <QuantityButton onClick={() => updateItem(0, "stock_quantity", Math.max(1, item.stock_quantity - 1))} label="Decrease">-</QuantityButton>
                          <QuantityButton onClick={() => updateItem(0, "stock_quantity", Math.min(item.available_stock, item.stock_quantity + 1))} label="Increase">+</QuantityButton>
                        </div>
                      </div>
                      {isOverStock && (
                        <p className="mt-2 text-xs text-red-600 flex items-center gap-1" role="alert">
                          <AlertCircle className="h-3 w-3" />
                          Quantity exceeds available stock!
                        </p>
                      )}
                      <div className="mt-2 flex justify-between text-xs text-gray-500">
                        {[25, 50, 75, 100].map(percent => (
                          <button
                            key={percent}
                            type="button"
                            onClick={() => updateItem(0, "stock_quantity", Math.ceil(item.available_stock * (percent / 100)))}
                            className="hover:text-[#166534] transition-colors"
                          >
                            {percent === 100 ? "Max" : `${percent}%`}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    {/* Unit Cost */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Unit Cost
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.unit_cost}
                        onChange={(e) => updateItem(0, "unit_cost", Math.max(0, parseFloat(e.target.value) || 0))}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#166534]/20 focus:border-[#166534] outline-none text-lg bg-white"
                        aria-label="Unit cost"
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        Default cost: {formatCurrency(preloadedProduct?.cost_price || 0, currencySymbol)}
                      </p>
                    </div>
                    
                    {/* Total Cost */}
                    <div className="flex items-end">
                      <div className="w-full p-5 bg-white rounded-xl border-2 border-[#166534]/20 bg-gradient-to-br from-[#166534]/5 to-white">
                        <p className="text-xs text-gray-500 mb-1 uppercase tracking-wider">Total Cost</p>
                        <p className="text-3xl font-bold text-[#166534]">
                          {formatCurrency(item.total, currencySymbol)}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {item.stock_quantity} × {formatCurrency(item.unit_cost, currencySymbol)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-3" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">Out of Stock</h3>
                  <p className="text-gray-500">
                    This product is currently out of stock at the source location.
                  </p>
                </div>
              )}
            </div>
          </SectionCard>

          {/* Notes */}
          <SectionCard
            icon={<StickyNote className="h-5 w-5 text-white" />}
            title="Additional Notes"
            description="Optional instructions or comments"
            delay={0.15}
          >
            <div className="p-6">
              <textarea
                value={formData.notes}
                onChange={(e) => updateField("notes", e.target.value)}
                rows={4}
                placeholder="Add any additional notes or instructions for this stock transfer..."
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#166534]/20 focus:border-[#166534] outline-none resize-none text-sm transition-all"
                aria-label="Additional notes"
              />
            </div>
          </SectionCard>

          {/* Submit Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col sm:flex-row justify-end gap-3"
          >
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-3 text-gray-700 bg-white border-2 border-gray-200 rounded-xl hover:bg-gray-50 transition-colors font-medium order-2 sm:order-1"
            >
              Cancel
            </button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSubmit}
              disabled={isSubmitting || preloadedProduct?.stock_quantity === 0}
              className="px-8 py-3 bg-[#166534] text-white font-semibold rounded-xl hover:bg-[#14532d] transition-all shadow-lg shadow-[#166534]/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 order-1 sm:order-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Creating Transfer...
                </>
              ) : (
                <>
                  <Save className="h-5 w-5" />
                  Create Stock Transfer
                </>
              )}
            </motion.button>
          </motion.div>
        </form>
      </main>
    </div>
  );
};

// ==============================================
// Reusable Sub-Components
// ==============================================

/** Displays a single product detail item */
const DetailItem = ({ 
  label, 
  value, 
  valueClassName = "" 
}: { 
  label: string; 
  value?: string; 
  valueClassName?: string;
}) => (
  <div>
    <p className="text-xs text-gray-500 uppercase tracking-wider">{label}</p>
    <p className={`text-sm font-medium text-gray-900 ${valueClassName}`}>{value || "N/A"}</p>
  </div>
);

/** Section card wrapper with header */
const SectionCard = ({
  icon,
  title,
  description,
  children,
  delay = 0,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode;
  delay?: number;
  action?: React.ReactNode;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden"
  >
    <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#166534] flex items-center justify-center">
            {icon}
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">{title}</h2>
            <p className="text-sm text-gray-500">{description}</p>
          </div>
        </div>
        {action}
      </div>
    </div>
    {children}
  </motion.div>
);

/** Address display card for source/destination locations */
const AddressCard = ({ address, type }: { address: string; type: "source" | "destination" }) => {
  const bgColor = type === "source" ? "bg-blue-50 border-blue-100" : "bg-green-50 border-green-100";
  const iconColor = type === "source" ? "text-blue-500" : "text-green-500";
  
  return (
    <div className={`mt-3 p-3 rounded-xl border ${bgColor}`}>
      <div className="flex items-start gap-2 text-sm text-gray-700">
        <MapPin className={`h-4 w-4 ${iconColor} mt-0.5 flex-shrink-0`} />
        <span className="text-gray-600">{address}</span>
      </div>
    </div>
  );
};

/** Form field wrapper with label and error display */
const FormField = ({
  label,
  required = false,
  icon,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  icon?: React.ReactNode;
  error?: string;
  children: React.ReactNode;
}) => (
  <div>
    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
      {icon}
      {label}
      {required && <span className="text-red-500">*</span>}
    </label>
    {children}
    {error && (
      <p className="mt-2 text-xs text-red-600 flex items-center gap-1" role="alert">
        <AlertCircle className="h-3 w-3" />
        {error}
      </p>
    )}
  </div>
);

/** Quantity adjustment button */
const QuantityButton = ({ 
  onClick, 
  label, 
  children 
}: { 
  onClick: () => void; 
  label: string; 
  children: React.ReactNode;
}) => (
  <button
    type="button"
    onClick={onClick}
    className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold text-lg transition-colors"
    aria-label={label}
  >
    {children}
  </button>
);

/** Returns Tailwind color classes based on stock quantity */
const getStockColorClass = (quantity: number): string => {
  if (quantity <= 5) return "text-red-600";
  if (quantity <= 20) return "text-orange-600";
  return "text-emerald-600";
};

export default withAuth(NewTransferPage);