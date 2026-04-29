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
  FileText,
  Package,
  Search,
  AlertCircle,
  User,
  Mail,
  Phone,
  MapPin,
  ShoppingCart,
  Calendar,
  Building2,
  CheckCircle,
  ChevronDown,
  Hash,
  DollarSign,
  Clock,
  StickyNote,
  Warehouse,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

// ==============================================
// Type Definitions
// ==============================================

interface Supplier {
  vid: number;
  vendor_name: string;
  email?: string;
  phone?: string;
  contact_person?: string;
}

interface Product {
  pid: number;
  product_name: string;
  sku: string;
  cost_price: number;
  current_stock: number;
}

interface OrderItem {
  product_id: number;
  product?: Product;
  quantity: number;
  unit_cost: number;
  total: number;
}

interface FormData {
  supplier_id: string;
  location_id: string;
  order_date: string;
  expected_delivery_date: string;
  notes: string;
  items: OrderItem[];
}

interface User {
  businesses_one?: Array<{
    currency?: string;
    name?: string;
  }>;
}

interface Location {
  id: number;
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

// ==============================================
// Custom Hooks
// ==============================================

const useFormData = (initialData: Partial<FormData> = {}) => {
  const [formData, setFormData] = useState<FormData>({
    supplier_id: "",
    location_id: "",
    order_date: formatDateForInput(new Date()),
    expected_delivery_date: "",
    notes: "",
    items: [],
    ...initialData,
  });

  const updateField = useCallback((field: keyof FormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const addItem = useCallback((product: Product, quantity: number) => {
    setFormData((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          product_id: product.pid,
          product,
          quantity,
          unit_cost: product.cost_price,
          total: product.cost_price * quantity,
        },
      ],
    }));
  }, []);

  const updateItem = useCallback(
    (index: number, field: keyof OrderItem, value: any) => {
      setFormData((prev) => {
        const updatedItems = [...prev.items];
        updatedItems[index] = { ...updatedItems[index], [field]: value };
        if (field === "quantity" || field === "unit_cost") {
          const item = updatedItems[index];
          updatedItems[index].total = item.quantity * item.unit_cost;
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
  }: {
    product: Product;
    isSelected: boolean;
    onSelect: () => void;
    currencySymbol: string;
  }) => (
    <motion.button
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={onSelect}
      className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
        isSelected
          ? "border-[#1e3a5f] bg-[#1e3a5f]/5 ring-2 ring-[#1e3a5f]/20 shadow-md"
          : "border-gray-200 hover:border-gray-300 hover:shadow-sm bg-white"
      }`}
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
            isSelected ? "bg-[#1e3a5f]" : "bg-gray-100"
          }`}>
            <Package className={`h-5 w-5 ${isSelected ? "text-white" : "text-gray-500"}`} />
          </div>
          <div>
            <p className="font-semibold text-gray-900">{product.product_name}</p>
            <p className="text-xs text-gray-500">SKU: {product.sku}</p>
          </div>
        </div>
        <div className="text-left sm:text-right pl-13 sm:pl-0">
          <p className="font-bold text-[#1e3a5f] text-lg">
            {formatCurrency(product.cost_price, currencySymbol)}
          </p>
          <p className="text-xs text-gray-500">Stock: {product.current_stock}</p>
        </div>
      </div>
    </motion.button>
  )
);

ProductCard.displayName = "ProductCard";

const ProductSearchModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSelectProduct: (product: Product, quantity: number) => void;
  existingProductIds: number[];
  currencySymbol: string;
  products: Product[];
  isLoading: boolean;
}> = memo(
  ({
    isOpen,
    onClose,
    onSelectProduct,
    existingProductIds,
    currencySymbol,
    products,
    isLoading,
  }) => {
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [quantity, setQuantity] = useState(1);

    useEffect(() => {
      if (isOpen) {
        setSearchTerm("");
        setSelectedProduct(null);
        setQuantity(1);
      }
    }, [isOpen]);

    const filteredProducts = useMemo(() => {
      const searchLower = searchTerm.toLowerCase();
      return products.filter(
        (product) =>
          !existingProductIds.includes(product.pid) &&
          (product.product_name?.toLowerCase().includes(searchLower) ||
            product.sku?.toLowerCase().includes(searchLower))
      );
    }, [products, existingProductIds, searchTerm]);

    const handleAddProduct = () => {
      if (selectedProduct && quantity > 0) {
        onSelectProduct(selectedProduct, quantity);
        onClose();
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
              <div className="bg-[#1e3a5f] px-6 py-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-white">Add Products</h2>
                    <p className="text-blue-200 text-sm mt-1">
                      Select products for your purchase order
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
                    className="w-full pl-12 pr-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f] outline-none text-sm transition-all"
                    autoFocus
                  />
                </div>
              </div>

              {/* Products */}
              <div className="flex-1 overflow-y-auto p-6">
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-[#1e3a5f]" />
                  </div>
                ) : filteredProducts.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500 text-lg font-medium">
                      {searchTerm ? "No products match your search" : "No products available"}
                    </p>
                    <p className="text-gray-400 text-sm mt-1">
                      {searchTerm ? "Try different keywords" : "Add products to your inventory first"}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredProducts.map((product) => (
                      <ProductCard
                        key={product.pid}
                        product={product}
                        isSelected={selectedProduct?.pid === product.pid}
                        onSelect={() => setSelectedProduct(product)}
                        currencySymbol={currencySymbol}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Quantity & Add */}
              {selectedProduct && (
                <div className="border-t border-gray-200 p-6 bg-gray-50">
                  <div className="flex items-end gap-4">
                    <div className="flex-1">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Quantity
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={quantity}
                        onChange={(e) =>
                          setQuantity(Math.max(1, parseInt(e.target.value) || 1))
                        }
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f] outline-none text-lg font-medium"
                      />
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleAddProduct}
                      className="px-8 py-3 bg-[#1e3a5f] text-white rounded-xl hover:bg-[#2c4c6e] transition-all shadow-lg shadow-[#1e3a5f]/25 font-semibold"
                    >
                      Add to Order
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

const OrderItemRow: React.FC<{
  item: OrderItem;
  index: number;
  onUpdate: (index: number, field: keyof OrderItem, value: any) => void;
  onRemove: (index: number) => void;
  currencySymbol: string;
}> = memo(({ item, index, onUpdate, onRemove, currencySymbol }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex flex-col sm:flex-row gap-4 items-start sm:items-center p-5 bg-white rounded-xl border-2 border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all group"
    >
      {/* Product Info */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="w-10 h-10 rounded-lg bg-[#1e3a5f]/10 flex items-center justify-center flex-shrink-0">
          <Package className="h-5 w-5 text-[#1e3a5f]" />
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-gray-900 truncate">
            {item.product?.product_name || `Product #${item.product_id}`}
          </p>
          <p className="text-xs text-gray-500">
            SKU: {item.product?.sku || "N/A"}
          </p>
        </div>
      </div>

      {/* Inputs */}
      <div className="flex items-center gap-3 w-full sm:w-auto">
        <div className="flex-1 sm:flex-none sm:w-28">
          <label className="text-xs text-gray-500 mb-1 block sm:hidden">Qty</label>
          <input
            type="number"
            min="1"
            value={item.quantity}
            onChange={(e) => onUpdate(index, "quantity", Math.max(1, parseInt(e.target.value) || 1))}
            className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f] outline-none text-center"
          />
        </div>
        <span className="text-gray-400 hidden sm:block">×</span>
        <div className="flex-1 sm:flex-none sm:w-36">
          <label className="text-xs text-gray-500 mb-1 block sm:hidden">Cost</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={item.unit_cost}
            onChange={(e) => onUpdate(index, "unit_cost", Math.max(0, parseFloat(e.target.value) || 0))}
            className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f] outline-none"
          />
        </div>
      </div>

      {/* Total */}
      <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto sm:min-w-[120px]">
        <div className="sm:text-right">
          <p className="text-sm text-gray-500">Total</p>
          <p className="text-lg font-bold text-[#1e3a5f]">
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

OrderItemRow.displayName = "OrderItemRow";

// ==============================================
// Main Component
// ==============================================

const NewPurchaseOrderPage = ({ user }: { user: User }) => {
  const router = useRouter();
  const currencySymbol = user?.businesses_one?.[0]?.currency || "$";
  const businessName = user?.businesses_one?.[0]?.name || "Business";

  const { formData, updateField, addItem, updateItem, removeItem } = useFormData();

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const selectedSupplier = useMemo(
    () => suppliers.find((s) => s.vid === parseInt(formData.supplier_id)) || null,
    [formData.supplier_id, suppliers]
  );

  const selectedLocation = useMemo(
    () => locations.find((l) => l.id === parseInt(formData.location_id)) || null,
    [formData.location_id, locations]
  );

  const subtotal = useMemo(
    () => formData.items.reduce((sum, item) => sum + item.total, 0),
    [formData.items]
  );

  const itemCount = formData.items.length;

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [suppliersRes, productsRes, locationsRes] = await Promise.all([
          apiGet("/vendors", {}, false),
          apiGet("/products", {}, false),
          apiGet("/locations", {}, false),
        ]);

        setSuppliers(
          extractDataFromResponse<Supplier>(suppliersRes, [
            "data.data.vendors",
            "data.data",
            "data",
          ])
        );

        const rawProducts = extractDataFromResponse<any>(productsRes, [
          "data.data.products",
          "data.data",
          "data.products",
          "data",
        ]);
        setProducts(
          rawProducts.map((p: any) => ({
            pid: p.pid || p.id,
            product_name: p.product_name || p.name,
            sku: p.sku,
            cost_price: parseFloat(p.cost_price) || 0,
            current_stock: parseInt(p.current_stock) || 0,
          }))
        );

        setLocations(
          extractDataFromResponse<Location>(locationsRes, [
            "data",
            "data.data",
            "data.locations",
          ])
        );
      } catch (error) {
        toast.error("Failed to load data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.supplier_id) newErrors.supplier_id = "Please select a supplier";
    if (!formData.location_id) newErrors.location_id = "Please select a location";
    if (!formData.order_date) newErrors.order_date = "Please select an order date";
    if (formData.items.length === 0) newErrors.items = "Please add at least one product";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error("Please fix the errors before submitting");
      return;
    }

    setIsSubmitting(true);

    const payload = {
      supplier_id: parseInt(formData.supplier_id),
      location_id: parseInt(formData.location_id),
      order_date: formData.order_date,
      expected_delivery_date: formData.expected_delivery_date || null,
      notes: formData.notes || null,
      items: formData.items.map(({ product_id, quantity, unit_cost }) => ({
        product_id,
        quantity,
        unit_cost,
      })),
    };

    try {
      await apiPost("/purchase_order_items", payload);
      toast.success("Purchase order created successfully!");
      router.push("/purchase");
      router.refresh();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to create purchase order");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#1e3a5f]" />
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
                onClick={() => router.push("/purchase")}
                className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all"
              >
                <ArrowLeft className="h-5 w-5" />
              </motion.button>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                  Create Purchase Order
                </h1>
                <p className="text-sm text-gray-500 hidden sm:block">{businessName}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/purchase"
                className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border-2 border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all"
              >
                Cancel
              </Link>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1e3a5f] text-white text-sm font-semibold rounded-xl hover:bg-[#2c4c6e] transition-all shadow-lg shadow-[#1e3a5f]/25 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {isSubmitting ? "Creating..." : "Create PO"}
              </motion.button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Order Details */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden"
          >
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#1e3a5f] flex items-center justify-center">
                  <ShoppingCart className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Order Details</h2>
                  <p className="text-sm text-gray-500">Fill in the order information</p>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Supplier */}
                <div className="space-y-4">
                  <div>
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                      <Building2 className="h-4 w-4 text-[#1e3a5f]" />
                      Supplier <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <select
                        value={formData.supplier_id}
                        onChange={(e) => updateField("supplier_id", e.target.value)}
                        className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f] outline-none text-sm appearance-none bg-white transition-all ${
                          errors.supplier_id ? "border-red-300 bg-red-50" : "border-gray-200"
                        }`}
                      >
                        <option value="">Select a supplier...</option>
                        {suppliers.map((supplier) => (
                          <option key={supplier.vid} value={supplier.vid}>
                            {supplier.vendor_name}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                    </div>
                    {errors.supplier_id && (
                      <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.supplier_id}
                      </p>
                    )}

                    {selectedSupplier && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-3 p-4 bg-[#1e3a5f]/5 rounded-xl border border-[#1e3a5f]/20"
                      >
                        <p className="text-xs font-semibold text-[#1e3a5f] uppercase tracking-wider mb-3">
                          Supplier Information
                        </p>
                        <div className="space-y-2">
                          {selectedSupplier.contact_person && (
                            <div className="flex items-center gap-2 text-sm text-gray-700">
                              <User className="h-4 w-4 text-[#1e3a5f]/60" />
                              {selectedSupplier.contact_person}
                            </div>
                          )}
                          {selectedSupplier.email && (
                            <div className="flex items-center gap-2 text-sm text-gray-700">
                              <Mail className="h-4 w-4 text-[#1e3a5f]/60" />
                              {selectedSupplier.email}
                            </div>
                          )}
                          {selectedSupplier.phone && (
                            <div className="flex items-center gap-2 text-sm text-gray-700">
                              <Phone className="h-4 w-4 text-[#1e3a5f]/60" />
                              {selectedSupplier.phone}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </div>
                </div>

                {/* Location & Dates */}
                <div className="space-y-4">
                  <div>
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                      <Warehouse className="h-4 w-4 text-[#1e3a5f]" />
                      Location <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <select
                        value={formData.location_id}
                        onChange={(e) => updateField("location_id", e.target.value)}
                        className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f] outline-none text-sm appearance-none bg-white transition-all ${
                          errors.location_id ? "border-red-300 bg-red-50" : "border-gray-200"
                        }`}
                      >
                        <option value="">Select a location...</option>
                        {locations.map((location) => (
                          <option key={location.id} value={location.id}>
                            {location.location_name}
                            {location.head_office === "yes" && " (HQ)"}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                    </div>
                    {errors.location_id && (
                      <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.location_id}
                      </p>
                    )}

                    {selectedLocation && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-3 p-4 bg-[#1e3a5f]/5 rounded-xl border border-[#1e3a5f]/20"
                      >
                        <p className="text-xs font-semibold text-[#1e3a5f] uppercase tracking-wider mb-3">
                          Location Details
                        </p>
                        <div className="space-y-2">
                          <div className="flex items-start gap-2 text-sm text-gray-700">
                            <MapPin className="h-4 w-4 text-[#1e3a5f]/60 mt-0.5 flex-shrink-0" />
                            <span>{getFullAddress(selectedLocation)}</span>
                          </div>
                          {selectedLocation.phone && (
                            <div className="flex items-center gap-2 text-sm text-gray-700">
                              <Phone className="h-4 w-4 text-[#1e3a5f]/60" />
                              {selectedLocation.phone}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                        <Calendar className="h-4 w-4 text-[#1e3a5f]" />
                        Order Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        value={formData.order_date}
                        onChange={(e) => updateField("order_date", e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f] outline-none text-sm transition-all"
                      />
                    </div>
                    <div>
                      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                        <Clock className="h-4 w-4 text-[#1e3a5f]" />
                        Expected Delivery
                      </label>
                      <input
                        type="date"
                        value={formData.expected_delivery_date}
                        onChange={(e) => updateField("expected_delivery_date", e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f] outline-none text-sm transition-all"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Order Items */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden"
          >
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#1e3a5f] flex items-center justify-center">
                    <Package className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Order Items</h2>
                    <p className="text-sm text-gray-500">
                      {itemCount} {itemCount === 1 ? "item" : "items"} added
                    </p>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={() => setShowProductModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#1e3a5f] text-white text-sm font-semibold rounded-xl hover:bg-[#2c4c6e] transition-all shadow-lg shadow-[#1e3a5f]/25"
                >
                  <Plus className="h-4 w-4" />
                  Add Product
                </motion.button>
              </div>
            </div>

            <div className="p-6">
              {formData.items.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Package className="h-10 w-10 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">No items added yet</h3>
                  <p className="text-gray-500 mb-6">Add products to your purchase order</p>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={() => setShowProductModal(true)}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-[#1e3a5f] text-white rounded-xl hover:bg-[#2c4c6e] transition-colors font-medium shadow-lg shadow-[#1e3a5f]/25"
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
                        <OrderItemRow
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
                        <p className="text-sm text-gray-600 font-medium">Total Amount</p>
                        <p className="text-xs text-gray-400">
                          {itemCount} {itemCount === 1 ? "item" : "items"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-3xl font-bold text-[#1e3a5f]">
                          {formatCurrency(subtotal, currencySymbol)}
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </motion.div>

          {/* Notes */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden"
          >
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#1e3a5f] flex items-center justify-center">
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
                placeholder="Add any additional notes, instructions, or comments for this purchase order..."
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f] outline-none resize-none text-sm transition-all"
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
              className="w-full py-4 bg-[#1e3a5f] text-white font-semibold rounded-2xl hover:bg-[#2c4c6e] transition-all shadow-lg shadow-[#1e3a5f]/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Creating Purchase Order...
                </>
              ) : (
                <>
                  <Save className="h-5 w-5" />
                  Create Purchase Order
                </>
              )}
            </motion.button>
          </div>
        </form>
      </main>

      {/* Product Modal */}
      <ProductSearchModal
        isOpen={showProductModal}
        onClose={() => setShowProductModal(false)}
        onSelectProduct={addItem}
        existingProductIds={formData.items.map((item) => item.product_id)}
        currencySymbol={currencySymbol}
        products={products}
        isLoading={isLoading}
      />
    </div>
  );
};

export default withAuth(NewPurchaseOrderPage);