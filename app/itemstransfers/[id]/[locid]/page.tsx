"use client";

import { withAuth } from "@/hoc/withAuth";
import { apiGet, apiPost } from "@/lib/axios";
import React, { useState, useEffect, useCallback, useMemo, memo } from "react";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  X,
  Loader2,
  Package,
  Search,
  AlertCircle,
  MapPin,
  ShoppingCart,
  Calendar,
  Warehouse,
  ArrowRightLeft,
  ChevronDown,
  Hash,
  StickyNote,
  Building2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { redirect } from "next/navigation";

// ==============================================
// Type Definitions
// ==============================================

/**
 * Product interface for the search modal and transfer items
 * Extracted from the nested product data in the API response
 */
interface Product {
  pid: number;
  product_name: string;
  sku: string;
  cost_price: number;
  current_stock: number;
}

/**
 * ProductLocation interface matching the API response structure
 * Represents a product at a specific location with stock information
 */
interface ProductLocation {
  id: number;
  location_id: number;
  product_id: number;
  cost_price: number;
  sale_price: number;
  stock_quantity: number;
  encrypted_id: string;
  encrypted_location_id: string;
  encrypted_pid: string;
  location_name: string;
  is_out_of_stock: boolean;
  product: {
    id: number;
    name: string;
    sku: string;
    description: string;
    barcode: string;
    is_active: boolean;
    image: string | null;
  };
  category: {
    id: number;
    name: string;
  };
}

interface TransferItem {
  product_id: number;
  product?: Product;
  stock_quantity: number; // Quantity to transfer
  unit_cost: number;
  total: number;
  available_stock: number; // Available stock at source location
}

interface FormData {
  from_location_id: string; // encrypted_id of source location
  to_location_id: string; // encrypted_id of destination location
  transfer_date: string;
  expected_delivery_date: string;
  notes: string;
  reference_number: string;
  items: TransferItem[];
}

interface User {
  businesses_one?: Array<{
    currency?: string;
    name?: string;
  }>;
  user_roles?: {
    transfer_create?: string;
    [key: string]: string | undefined;
  };
}

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

// ==============================================
// API Endpoint Documentation
// ==============================================

/**
 * API ENDPOINTS USED IN THIS COMPONENT:
 * 
 * 1. GET /products
 *    - Purpose: Fetch all products available in the system
 *    - Used In: Initial data loading
 * 
 * 2. GET /locations
 *    - Purpose: Fetch all business locations with encrypted IDs
 *    - Used In: Initial data loading for location dropdowns
 * 
 * 3. GET /product-locations/{encrypted_location_id}/stock
 *    - Purpose: Fetch stock levels for all products at a specific location
 *    - Path Parameters: encrypted_location_id (string)
 *    - Response: Array of ProductLocation objects with:
 *      - stock_quantity: Available stock at the location
 *      - cost_price: Cost price of the product at this location
 *      - product: Nested product information (name, sku, etc.)
 *      - is_out_of_stock: Boolean indicating stock status
 *    - Used In: Product search modal, stock validation
 * 
 * 4. POST /stock-transfers
 *    - Purpose: Create a new stock transfer between locations
 *    - Request Body:
 *      {
 *        from_location_id: string (encrypted_id),
 *        to_location_id: string (encrypted_id),
 *        transfer_date: string,
 *        expected_delivery_date: string | null,
 *        notes: string | null,
 *        reference_number: string | null,
 *        items: Array<{
 *          product_id: number,
 *          stock_quantity: number,
 *          unit_cost: number
 *        }>
 *      }
 */

// ==============================================
// Utility Functions
// ==============================================

const formatDateForInput = (date: Date): string => date.toISOString().split("T")[0];

const formatCurrency = (amount: number, symbol: string = "$"): string => {
  return new Intl.NumberFormat(CURRENCY_LOCALE, {
    style: "currency",
    currency: DEFAULT_CURRENCY,
    minimumFractionDigits: 2,
  })
    .format(amount)
    .replace(/^\$/, symbol);
};

const extractDataFromResponse = <T,>(response: any, paths: string[]): T[] => {
  for (const path of paths) {
    const data = path.split(".").reduce((obj, key) => obj?.[key], response);
    if (Array.isArray(data)) return data;
  }
  return [];
};

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
 * Converts ProductLocation API response to Product format for the UI
 * Uses cost_price from the location-specific data and stock_quantity for availability
 */
const mapProductLocationToProduct = (pl: ProductLocation): Product => ({
  pid: pl.product_id,
  product_name: pl.product.name,
  sku: pl.product.sku,
  cost_price: pl.cost_price, // Location-specific cost price
  current_stock: pl.stock_quantity, // Location-specific stock quantity
});

// ==============================================
// Custom Hooks
// ==============================================

const useFormData = (initialData: Partial<FormData> = {}) => {
  const [formData, setFormData] = useState<FormData>({
    from_location_id: "",
    to_location_id: "",
    transfer_date: formatDateForInput(new Date()),
    expected_delivery_date: "",
    notes: "",
    reference_number: "",
    items: [],
    ...initialData,
  });

  const updateField = useCallback((field: keyof FormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const addItem = useCallback((product: Product, transferQuantity: number) => {
    setFormData((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          product_id: product.pid,
          product,
          stock_quantity: transferQuantity,
          unit_cost: product.cost_price,
          total: product.cost_price * transferQuantity,
          available_stock: product.current_stock,
        },
      ],
    }));
  }, []);

  const updateItem = useCallback(
    (index: number, field: keyof TransferItem, value: any) => {
      setFormData((prev) => {
        const updatedItems = [...prev.items];
        updatedItems[index] = { ...updatedItems[index], [field]: value };
        if (field === "stock_quantity" || field === "unit_cost") {
          const item = updatedItems[index];
          updatedItems[index].total = item.stock_quantity * item.unit_cost;
        }
        return { ...prev, items: updatedItems };
      });
    },
    []
  );

  const removeItem = useCallback((index: number) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  }, []);

  return { formData, updateField, addItem, updateItem, removeItem };
};

// ==============================================
// Components
// ==============================================

const ProductCard = memo(
  ({
    product,
    isSelected,
    onSelect,
    currencySymbol,
    maxQuantity,
  }: {
    product: Product;
    isSelected: boolean;
    onSelect: () => void;
    currencySymbol: string;
    maxQuantity?: number;
  }) => (
    <motion.button
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={onSelect}
      disabled={maxQuantity !== undefined && maxQuantity <= 0}
      className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
        maxQuantity !== undefined && maxQuantity <= 0
          ? "border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed"
          : isSelected
          ? "border-[#166534] bg-[#166534]/5 ring-2 ring-[#166534]/20 shadow-md"
          : "border-gray-200 hover:border-gray-300 hover:shadow-sm bg-white"
      }`}
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
            isSelected ? "bg-[#166534]" : "bg-gray-100"
          }`}>
            <Package className={`h-5 w-5 ${isSelected ? "text-white" : "text-gray-500"}`} />
          </div>
          <div>
            <p className="font-semibold text-gray-900">{product.product_name}</p>
            <p className="text-xs text-gray-500">SKU: {product.sku}</p>
          </div>
        </div>
        <div className="text-left sm:text-right pl-13 sm:pl-0">
          <p className="font-bold text-[#166534] text-lg">
            {formatCurrency(product.cost_price, currencySymbol)}
          </p>
          <p className={`text-xs ${
            maxQuantity !== undefined && maxQuantity <= 0
              ? "text-red-500 font-medium"
              : maxQuantity !== undefined && maxQuantity < 10
              ? "text-orange-500 font-medium"
              : "text-gray-500"
          }`}>
            {maxQuantity !== undefined && maxQuantity <= 0
              ? "Out of Stock"
              : `Stock: ${maxQuantity !== undefined ? maxQuantity : product.current_stock}`}
          </p>
        </div>
      </div>
    </motion.button>
  )
);

ProductCard.displayName = "ProductCard";

/**
 * Product Search Modal Component
 * 
 * Fetches product-location data from the API and displays available products
 * with their stock quantities for the selected source location.
 */
const ProductSearchModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSelectProduct: (product: Product, quantity: number) => void;
  existingProductIds: number[];
  currencySymbol: string;
  isLoading: boolean;
  sourceLocationId: string; // encrypted_id of source location
}> = memo(
  ({
    isOpen,
    onClose,
    onSelectProduct,
    existingProductIds,
    currencySymbol,
    isLoading: parentLoading,
    sourceLocationId,
  }) => {
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [transferQuantity, setTransferQuantity] = useState(1);
    const [productLocations, setProductLocations] = useState<ProductLocation[]>([]);
    const [isLoadingStock, setIsLoadingStock] = useState(false);

    useEffect(() => {
      if (isOpen && sourceLocationId) {
        setSearchTerm("");
        setSelectedProduct(null);
        setTransferQuantity(1);
        fetchProductLocations();
      }
    }, [isOpen, sourceLocationId]);

    /**
     * Fetches product-location data for the selected source location
     * 
     * API Endpoint: GET /product-locations/{encrypted_location_id}/stock
     * 
     * Response: Array of ProductLocation objects containing:
     * - product_id, product.name, product.sku
     * - stock_quantity: Available stock at this location
     * - cost_price: Location-specific cost price
     * - is_out_of_stock: Stock availability flag
     */
    const fetchProductLocations = async () => {
      setIsLoadingStock(true);
      try {
        const response = await apiGet(
          `/product-locations/${sourceLocationId}`,
          {},
          false
        );
        
        // Extract data from response - the API returns { success: true, data: [...] }
        const data = response.data?.data || response.data || [];
        const stockData = Array.isArray(data) ? data : [];
        
        setProductLocations(stockData);
      } catch (error: any) {
        console.error("Failed to fetch product locations:", error);
        toast.error("Failed to load products for this location");
        setProductLocations([]);
      } finally {
        setIsLoadingStock(false);
      }
    };

    // Convert ProductLocation array to Product array for display
    const availableProducts = useMemo(() => {
      return productLocations
        .filter(pl => !existingProductIds.includes(pl.product_id))
        .map(mapProductLocationToProduct);
    }, [productLocations, existingProductIds]);

    // Filter products based on search term
    const filteredProducts = useMemo(() => {
      const searchLower = searchTerm.toLowerCase();
      return availableProducts.filter(
        (product) =>
          product.product_name?.toLowerCase().includes(searchLower) ||
          product.sku?.toLowerCase().includes(searchLower)
      );
    }, [availableProducts, searchTerm]);

    const handleAddProduct = () => {
      if (selectedProduct && transferQuantity > 0) {
        if (transferQuantity <= selectedProduct.current_stock) {
          onSelectProduct(selectedProduct, transferQuantity);
          onClose();
        } else {
          toast.error(`Insufficient stock. Available: ${selectedProduct.current_stock}`);
        }
      }
    };

    return (
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50 p-4"
            onClick={onClose}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="bg-[#166534] px-6 py-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-white">Add Products to Transfer</h2>
                    <p className="text-green-200 text-sm mt-1">
                      Select products from source location ({productLocations.length} available)
                    </p>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2 hover:bg-white/10 rounded-xl transition-colors"
                  >
                    <X className="h-5 w-5 text-white" />
                  </button>
                </div>
              </div>

              {/* Search */}
              <div className="p-6 border-b border-gray-200">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by product name or SKU..."
                    className="w-full pl-12 pr-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#166534]/20 focus:border-[#166534] outline-none text-sm transition-all"
                    autoFocus
                  />
                </div>
              </div>

              {/* Products List */}
              <div className="flex-1 overflow-y-auto p-6">
                {isLoadingStock || parentLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-[#166534]" />
                  </div>
                ) : filteredProducts.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500 text-lg font-medium">
                      {searchTerm ? "No products match your search" : "No products available at this location"}
                    </p>
                    <p className="text-gray-400 text-sm mt-1">
                      {searchTerm ? "Try different keywords" : "This location has no products in stock"}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredProducts.map((product) => (
                      <ProductCard
                        key={product.pid}
                        product={product}
                        isSelected={selectedProduct?.pid === product.pid}
                        onSelect={() => {
                          if (product.current_stock > 0) {
                            setSelectedProduct(product);
                            setTransferQuantity(1);
                          }
                        }}
                        currencySymbol={currencySymbol}
                        maxQuantity={product.current_stock}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Quantity Input & Add Button */}
              {selectedProduct && (
                <div className="border-t border-gray-200 p-6 bg-gray-50">
                  <div className="flex items-end gap-4">
                    <div className="flex-1">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Transfer Quantity (Available: {selectedProduct.current_stock})
                      </label>
                      <input
                        type="number"
                        min="1"
                        max={selectedProduct.current_stock}
                        value={transferQuantity}
                        onChange={(e) =>
                          setTransferQuantity(Math.max(1, Math.min(
                            parseInt(e.target.value) || 1,
                            selectedProduct.current_stock
                          )))
                        }
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#166534]/20 focus:border-[#166534] outline-none text-lg font-medium"
                      />
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleAddProduct}
                      className="px-8 py-3 bg-[#166534] text-white rounded-xl hover:bg-[#14532d] transition-all shadow-lg shadow-[#166534]/25 font-semibold"
                    >
                      Add to Transfer
                    </motion.button>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }
);

ProductSearchModal.displayName = "ProductSearchModal";

const TransferItemRow: React.FC<{
  item: TransferItem;
  index: number;
  onUpdate: (index: number, field: keyof TransferItem, value: any) => void;
  onRemove: (index: number) => void;
  currencySymbol: string;
}> = memo(({ item, index, onUpdate, onRemove, currencySymbol }) => {
  const isOverStock = item.stock_quantity > item.available_stock;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`flex flex-col sm:flex-row gap-4 items-start sm:items-center p-5 bg-white rounded-xl border-2 transition-all group ${
        isOverStock ? "border-red-200 bg-red-50" : "border-gray-100 hover:border-gray-200 hover:shadow-sm"
      }`}
    >
      {/* Product Info */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
          isOverStock ? "bg-red-100" : "bg-[#166534]/10"
        }`}>
          <Package className={`h-5 w-5 ${isOverStock ? "text-red-600" : "text-[#166534]"}`} />
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-gray-900 truncate">
            {item.product?.product_name || `Product #${item.product_id}`}
          </p>
          <p className="text-xs text-gray-500">
            SKU: {item.product?.sku || "N/A"} | Available: {item.available_stock}
          </p>
          {isOverStock && (
            <p className="text-xs text-red-600 font-medium mt-1">
              ⚠️ Transfer quantity exceeds available stock!
            </p>
          )}
        </div>
      </div>

      {/* Quantity & Cost Inputs */}
      <div className="flex items-center gap-3 w-full sm:w-auto">
        <div className="flex-1 sm:flex-none sm:w-28">
          <label className="text-xs text-gray-500 mb-1 block sm:hidden">Qty</label>
          <input
            type="number"
            min="1"
            max={item.available_stock}
            value={item.stock_quantity}
            onChange={(e) => onUpdate(index, "stock_quantity", Math.max(1, parseInt(e.target.value) || 1))}
            className={`w-full px-3 py-2 border-2 rounded-lg text-sm focus:ring-2 focus:ring-[#166534]/20 outline-none text-center ${
              isOverStock ? "border-red-300 focus:border-red-500" : "border-gray-200 focus:border-[#166534]"
            }`}
          />
        </div>
        <span className="text-gray-400 hidden sm:block">×</span>
        <div className="flex-1 sm:flex-none sm:w-36">
          <label className="text-xs text-gray-500 mb-1 block sm:hidden">Unit Cost</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={item.unit_cost}
            onChange={(e) => onUpdate(index, "unit_cost", Math.max(0, parseFloat(e.target.value) || 0))}
            className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#166534]/20 focus:border-[#166534] outline-none"
          />
        </div>
      </div>

      {/* Total & Remove */}
      <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto sm:min-w-[120px]">
        <div className="sm:text-right">
          <p className="text-sm text-gray-500">Total</p>
          <p className="text-lg font-bold text-[#166534]">
            {formatCurrency(item.total, currencySymbol)}
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => onRemove(index)}
          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
        >
          <Trash2 className="h-4 w-4" />
        </motion.button>
      </div>
    </motion.div>
  );
});

TransferItemRow.displayName = "TransferItemRow";

// ==============================================
// Main Component
// ==============================================

const NewTransferPage = ({ user }: { user: User }) => {
  const router = useRouter();
  const currencySymbol = user?.businesses_one?.[0]?.currency || "$";
  const businessName = user?.businesses_one?.[0]?.name || "Business";

  const { formData, updateField, addItem, updateItem, removeItem } = useFormData();

  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

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

  const itemCount = formData.items.length;

  /**
   * Initial data loading - fetches locations only
   * Products are fetched per-location in the modal
   */
  useEffect(() => {
    const fetchLocations = async () => {
      setIsLoading(true);
      try {
        const locationsRes = await apiGet("/locations", {}, false);
        
        setLocations(
          extractDataFromResponse<Location>(locationsRes, [
            "data",
            "data.data",
            "data.locations",
          ])
        );
      } catch (error) {
        toast.error("Failed to load locations");
      } finally {
        setIsLoading(false);
      }
    };

    fetchLocations();
  }, []);

  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.from_location_id) newErrors.from_location_id = "Please select source location";
    if (!formData.to_location_id) newErrors.to_location_id = "Please select destination location";
    if (formData.from_location_id === formData.to_location_id) {
      newErrors.to_location_id = "Source and destination cannot be the same";
    }
    if (!formData.transfer_date) newErrors.transfer_date = "Please select transfer date";
    if (formData.items.length === 0) newErrors.items = "Please add at least one product";
    
    // Validate stock availability for each item
    formData.items.forEach((item, index) => {
      if (item.stock_quantity > item.available_stock) {
        newErrors[`item_${index}`] = `Insufficient stock for ${item.product?.product_name}`;
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  /**
   * Handles form submission to create a stock transfer
   * 
   * API Endpoint: POST /stock-transfers
   * Sends encrypted location IDs and item details
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

    try {
      await apiPost("/stock-transfers", payload);
      toast.success("Stock transfer created successfully!");
      router.push("/transfers");
      router.refresh();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to create stock transfer");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#166534]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push("/transfers")}
                className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all"
              >
                <ArrowLeft className="h-5 w-5" />
              </motion.button>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                  Create Stock Transfer
                </h1>
                <p className="text-sm text-gray-500 hidden sm:block">{businessName}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/transfers"
                className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border-2 border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all"
              >
                Transfer List
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
          {/* Transfer Details Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden"
          >
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#166534] flex items-center justify-center">
                  <ArrowRightLeft className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Transfer Details</h2>
                  <p className="text-sm text-gray-500">Select source and destination locations</p>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Source Location - uses encrypted_id */}
                <div className="space-y-4">
                  <div>
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                      <Warehouse className="h-4 w-4 text-[#166534]" />
                      Source Location <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <select
                        value={formData.from_location_id}
                        onChange={(e) => {
                          updateField("from_location_id", e.target.value);
                          updateField("items", []); // Clear items on location change
                        }}
                        className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-[#166534]/20 focus:border-[#166534] outline-none text-sm appearance-none bg-white transition-all ${
                          errors.from_location_id ? "border-red-300 bg-red-50" : "border-gray-200"
                        }`}
                      >
                        <option value="">Select source location...</option>
                        {locations.map((location) => (
                          <option key={location.encrypted_id} value={location.encrypted_id}>
                            {location.location_name}
                            {location.head_office === "yes" && " (HQ)"}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                    </div>
                    {errors.from_location_id && (
                      <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.from_location_id}
                      </p>
                    )}
                    {selectedFromLocation && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-3 p-4 bg-[#166534]/5 rounded-xl border border-[#166534]/20"
                      >
                        <p className="text-xs font-semibold text-[#166534] uppercase tracking-wider mb-3">
                          Source Location Details
                        </p>
                        <div className="space-y-2">
                          <div className="flex items-start gap-2 text-sm text-gray-700">
                            <MapPin className="h-4 w-4 text-[#166534]/60 mt-0.5 flex-shrink-0" />
                            <span>{getFullAddress(selectedFromLocation)}</span>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </div>

                {/* Destination Location - uses encrypted_id */}
                <div className="space-y-4">
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
                      <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.to_location_id}
                      </p>
                    )}
                    {selectedToLocation && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-3 p-4 bg-[#166534]/5 rounded-xl border border-[#166534]/20"
                      >
                        <p className="text-xs font-semibold text-[#166534] uppercase tracking-wider mb-3">
                          Destination Location Details
                        </p>
                        <div className="space-y-2">
                          <div className="flex items-start gap-2 text-sm text-gray-700">
                            <MapPin className="h-4 w-4 text-[#166534]/60 mt-0.5 flex-shrink-0" />
                            <span>{getFullAddress(selectedToLocation)}</span>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>

                  {/* Transfer Dates */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                        <Calendar className="h-4 w-4 text-[#166534]" />
                        Transfer Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        value={formData.transfer_date}
                        onChange={(e) => updateField("transfer_date", e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#166534]/20 focus:border-[#166534] outline-none text-sm transition-all"
                      />
                    </div>
                    <div>
                      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                        <Calendar className="h-4 w-4 text-[#166534]" />
                        Expected Delivery
                      </label>
                      <input
                        type="date"
                        value={formData.expected_delivery_date}
                        onChange={(e) => updateField("expected_delivery_date", e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#166534]/20 focus:border-[#166534] outline-none text-sm transition-all"
                      />
                    </div>
                  </div>

                  {/* Reference Number */}
                  <div>
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                      <Hash className="h-4 w-4 text-[#166534]" />
                      Reference Number
                    </label>
                    <input
                      type="text"
                      value={formData.reference_number}
                      onChange={(e) => updateField("reference_number", e.target.value)}
                      placeholder="Enter reference number (optional)"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#166534]/20 focus:border-[#166534] outline-none text-sm transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Transfer Items Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden"
          >
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#166534] flex items-center justify-center">
                    <Package className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Transfer Items</h2>
                    <p className="text-sm text-gray-500">
                      {itemCount} {itemCount === 1 ? "item" : "items"} added
                    </p>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={() => {
                    if (!formData.from_location_id) {
                      toast.error("Please select a source location first");
                      return;
                    }
                    setShowProductModal(true);
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#166534] text-white text-sm font-semibold rounded-xl hover:bg-[#14532d] transition-all shadow-lg shadow-[#166534]/25"
                >
                  <Plus className="h-4 w-4" />
                  Add Product
                </motion.button>
              </div>
            </div>

            <div className="p-6">
              {!formData.from_location_id ? (
                <div className="text-center py-16">
                  <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Warehouse className="h-10 w-10 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">Select Source Location First</h3>
                  <p className="text-gray-500 mb-2">Choose a source location to view available products</p>
                </div>
              ) : formData.items.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Package className="h-10 w-10 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">No items added yet</h3>
                  <p className="text-gray-500 mb-6">Add products to transfer between locations</p>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={() => setShowProductModal(true)}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-[#166534] text-white rounded-xl hover:bg-[#14532d] transition-colors font-medium shadow-lg shadow-[#166534]/25"
                  >
                    <Plus className="h-4 w-4" />
                    Add Your First Product
                  </motion.button>
                </div>
              ) : (
                <>
                  <AnimatePresence>
                    <div className="space-y-3">
                      {formData.items.map((item, index) => (
                        <TransferItemRow
                          key={index}
                          item={item}
                          index={index}
                          onUpdate={updateItem}
                          onRemove={removeItem}
                          currencySymbol={currencySymbol}
                        />
                      ))}
                    </div>
                  </AnimatePresence>
                  
                  <div className="mt-6 p-6 bg-gray-50 rounded-2xl border border-gray-200">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                      <div>
                        <p className="text-sm text-gray-600 font-medium">Total Transfer Value</p>
                        <p className="text-xs text-gray-400">
                          {itemCount} {itemCount === 1 ? "item" : "items"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-3xl font-bold text-[#166534]">
                          {formatCurrency(subtotal, currencySymbol)}
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </motion.div>

          {/* Notes Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden"
          >
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#166534] flex items-center justify-center">
                  <StickyNote className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Additional Notes</h2>
                  <p className="text-sm text-gray-500">Optional instructions or comments</p>
                </div>
              </div>
            </div>
            <div className="p-6">
              <textarea
                value={formData.notes}
                onChange={(e) => updateField("notes", e.target.value)}
                rows={4}
                placeholder="Add any additional notes or instructions for this stock transfer..."
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#166534]/20 focus:border-[#166534] outline-none resize-none text-sm transition-all"
              />
            </div>
          </motion.div>

          {/* Mobile Submit Button */}
          <div className="lg:hidden">
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full py-4 bg-[#166534] text-white font-semibold rounded-2xl hover:bg-[#14532d] transition-all shadow-lg shadow-[#166534]/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Creating Stock Transfer...
                </>
              ) : (
                <>
                  <Save className="h-5 w-5" />
                  Create Stock Transfer
                </>
              )}
            </motion.button>
          </div>
        </form>
      </main>

      {/* Product Search Modal - fetches products per location */}
      <ProductSearchModal
        isOpen={showProductModal}
        onClose={() => setShowProductModal(false)}
        onSelectProduct={addItem}
        existingProductIds={formData.items.map((item) => item.product_id)}
        currencySymbol={currencySymbol}
        isLoading={isLoading}
        sourceLocationId={formData.from_location_id}
      />
    </div>
  );
};

export default withAuth(NewTransferPage);