"use client";

import { withAuth } from "@/hoc/withAuth";
import { apiGet, apiPut, apiPost } from "@/lib/axios";
import React, { useState, useEffect, useRef } from "react";
import {
  ArrowLeft,
  Loader2,
  Package,
  Building2,
  Calendar,
  FileText,
  Phone,
  Mail,
  User,
  Save,
  X,
  AlertCircle,
  Search,
  ChevronDown,
  MapPin,
  ShoppingBag,
  Calculator,
  Clock,
  CheckCircle,
  Edit3,
  Lock,
} from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

// ==============================================
// TypeScript Interfaces
// ==============================================

interface Supplier {
  vid?: number;
  id?: number;
  vendor_name?: string;
  name?: string;
  email: string | null;
  phone: string | null;
  contact_person: string | null;
  address: string | null;
  tax_id: string | null;
  city?: string;
  state?: string;
  country?: string;
}

interface Product {
  id: number;
  name: string;
  sku: string;
  cost_price: number;
  selling_price: number;
  unit: string;
  current_stock?: number;
}

interface PurchaseOrderItem {
  id?: number;
  product_id: number;
  product?: Product;
  quantity: number;
  unit_cost: number;
  total: number;
}

interface PurchaseOrder {
  id: number;
  po_number: string;
  supplier_id: number;
  supplier?: Supplier;
  order_date: string;
  expected_delivery_date: string | null;
  status: "draft" | "pending" | "approved" | "received" | "cancelled";
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  discount_type?: "fixed" | "percentage";
  shipping_cost: number;
  total_amount: number;
  notes: string | null;
  terms: string | null;
  items: PurchaseOrderItem[];
  created_at: string;
  updated_at: string;
  location_id?: number;
  location?: { id: number; location_name: string };
}

interface Location {
  id: number;
  location_name: string;
}

interface User {
  businesses_one?: Array<{
    currency?: string;
    name?: string;
  }>;
}

// ==============================================
// Utility Functions
// ==============================================

const formatDate = (dateString: string | null): string => {
  if (!dateString) return "";
  return new Date(dateString).toISOString().split('T')[0];
};

const formatCurrency = (amount: number, currencySymbol: string = "$"): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount).replace(/^\$/, currencySymbol);
};

const calculateItemTotal = (quantity: number, unitCost: number): number => {
  return quantity * unitCost;
};

const extractArrayFromResponse = (response: any, arrayKey?: string): any[] => {
  if (!response) return [];
  
  const data = response.data || response;
  
  if (arrayKey && data?.data?.[arrayKey] && Array.isArray(data.data[arrayKey])) {
    return data.data[arrayKey];
  }
  if (arrayKey && data?.[arrayKey] && Array.isArray(data[arrayKey])) {
    return data[arrayKey];
  }
  if (data?.data && Array.isArray(data.data)) {
    return data.data;
  }
  if (Array.isArray(data)) {
    return data;
  }
  if (Array.isArray(response.data)) {
    return response.data;
  }
  
  return [];
};

const normalizeSupplier = (supplier: any): Supplier => {
  return {
    id: supplier.vid || supplier.id,
    vid: supplier.vid || supplier.id,
    vendor_name: supplier.vendor_name || supplier.name,
    name: supplier.name || supplier.vendor_name,
    email: supplier.email || null,
    phone: supplier.phone || null,
    contact_person: supplier.contact_person || null,
    address: supplier.address || null,
    tax_id: supplier.tax_id || null,
    city: supplier.city,
    state: supplier.state,
    country: supplier.country,
  };
};

// ==============================================
// Validation Functions
// ==============================================

interface ValidationErrors {
  supplier_id?: string;
  order_date?: string;
  items?: string;
  [key: string]: string | undefined;
}

const validateOrderForm = (order: Partial<PurchaseOrder>): ValidationErrors => {
  const errors: ValidationErrors = {};
  
  if (!order.supplier_id || order.supplier_id === 0) {
    errors.supplier_id = "Please select a supplier";
  }
  
  if (!order.order_date) {
    errors.order_date = "Order date is required";
  } else {
    const orderDate = new Date(order.order_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (orderDate < today) {
      errors.order_date = "Order date cannot be in the past";
    }
  }
  
  if (order.expected_delivery_date && order.order_date) {
    const orderDate = new Date(order.order_date);
    const deliveryDate = new Date(order.expected_delivery_date);
    if (deliveryDate < orderDate) {
      errors.expected_delivery_date = "Expected delivery date cannot be before order date";
    }
  }
  
  if (!order.items || order.items.length === 0) {
    errors.items = "Please add at least one item to the order";
  } else {
    const invalidItems = order.items.filter(item => 
      !item.quantity || item.quantity <= 0 || 
      item.unit_cost < 0
    );
    if (invalidItems.length > 0) {
      errors.items = "All items must have quantity > 0 and unit cost >= 0";
    }
  }
  
  if (order.discount_amount && order.discount_amount < 0) {
    errors.discount_amount = "Discount cannot be negative";
  }
  
  if (order.tax_amount && order.tax_amount < 0) {
    errors.tax_amount = "Tax cannot be negative";
  }
  
  if (order.shipping_cost && order.shipping_cost < 0) {
    errors.shipping_cost = "Shipping cost cannot be negative";
  }
  
  return errors;
};

// ==============================================
// Sub-components
// ==============================================

const LoadingState: React.FC = () => (
  <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center">
    <div className="text-center">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        className="w-20 h-20 mx-auto mb-6"
      >
        <div className="w-full h-full rounded-full border-4 border-gray-200 border-t-gray-900" />
      </motion.div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading Purchase Order</h3>
      <p className="text-gray-500">Please wait while we fetch the details...</p>
    </div>
  </div>
);

const ErrorState: React.FC<{ message: string; onRetry: () => void }> = ({ message, onRetry }) => (
  <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center p-4">
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full"
    >
      <div className="text-center">
        <div className="w-16 h-16 bg-rose-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="h-8 w-8 text-rose-600" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Error Loading Order</h3>
        <p className="text-gray-600 mb-6">{message}</p>
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-all font-medium"
        >
          Try Again
        </button>
      </div>
    </motion.div>
  </div>
);

// Read-only Supplier Display Component (Non-editable)
const SupplierDisplay: React.FC<{
  supplier: Supplier | undefined;
  isLoading: boolean;
  error?: string;
}> = ({ supplier, isLoading, error }) => {
  const getSupplierDisplayName = (supplier: Supplier | undefined) => {
    if (!supplier) return "No supplier selected";
    return supplier.vendor_name || supplier.name || "Unnamed Supplier";
  };

  if (isLoading) {
    return (
      <div className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-50 border border-gray-300 rounded-xl flex items-center gap-2 sm:gap-3">
        <Building2 className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 flex-shrink-0" />
        <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 animate-spin" />
        <span className="text-sm text-gray-500">Loading supplier...</span>
      </div>
    );
  }

  return (
    <div>
      <div className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-50 border rounded-xl flex items-center gap-2 sm:gap-3 ${
        error ? 'border-rose-500' : 'border-gray-300'
      }`}>
        <Building2 className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <span className={`text-sm sm:text-base truncate block ${supplier ? "text-gray-900" : "text-gray-400"}`}>
            {getSupplierDisplayName(supplier)}
          </span>
          {supplier?.email && (
            <span className="text-xs text-gray-500 truncate block">{supplier.email}</span>
          )}
        </div>
        <Lock className="h-4 w-4 text-gray-400 flex-shrink-0" />
      </div>
      {error && <p className="text-rose-500 text-xs mt-1">{error}</p>}
      
      {supplier && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 p-3 sm:p-4 bg-gray-50 rounded-xl mt-4"
        >
          {supplier.contact_person && (
            <div className="flex items-center gap-2 text-xs sm:text-sm">
              <User className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400 flex-shrink-0" />
              <span className="text-gray-600 truncate">{supplier.contact_person}</span>
            </div>
          )}
          {supplier.email && (
            <div className="flex items-center gap-2 text-xs sm:text-sm">
              <Mail className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400 flex-shrink-0" />
              <span className="text-gray-600 truncate">{supplier.email}</span>
            </div>
          )}
          {supplier.phone && (
            <div className="flex items-center gap-2 text-xs sm:text-sm">
              <Phone className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400 flex-shrink-0" />
              <span className="text-gray-600">{supplier.phone}</span>
            </div>
          )}
          {supplier.address && (
            <div className="flex items-center gap-2 text-xs sm:text-sm col-span-1 sm:col-span-2">
              <MapPin className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400 flex-shrink-0" />
              <span className="text-gray-600 truncate">
                {[supplier.address, supplier.city, supplier.state, supplier.country]
                  .filter(Boolean).join(', ')}
              </span>
            </div>
          )}
          {supplier.tax_id && (
            <div className="flex items-center gap-2 text-xs sm:text-sm col-span-1 sm:col-span-2">
              <FileText className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400 flex-shrink-0" />
              <span className="text-gray-600">Tax ID: {supplier.tax_id}</span>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
};

// Read-only Location Display Component
const LocationDisplay: React.FC<{
  locationId?: number;
  locations: Location[];
}> = ({ locationId, locations }) => {
  const selectedLocation = locations.find(loc => loc.id === locationId);
  
  return (
    <div className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-50 border border-gray-300 rounded-xl flex items-center gap-2 sm:gap-3">
      <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <span className={`text-sm sm:text-base truncate block ${selectedLocation ? "text-gray-900" : "text-gray-400"}`}>
          {selectedLocation?.location_name || "No location selected"}
        </span>
      </div>
      <Lock className="h-4 w-4 text-gray-400 flex-shrink-0" />
    </div>
  );
};

// ItemsTable - Mobile friendly with delete functionality removed
const ItemsTable: React.FC<{
  items: PurchaseOrderItem[];
  onUpdateItem: (index: number, field: keyof PurchaseOrderItem, value: any) => void;
  formatCurrency: (amount: number) => string;
  readOnly?: boolean;
}> = ({ items, onUpdateItem, formatCurrency, readOnly = false }) => {
  const safeItems = Array.isArray(items) ? items : [];

  // Mobile card view for each item
  const MobileItemCard: React.FC<{ item: PurchaseOrderItem; index: number }> = ({ item, index }) => (
    <div className="bg-gray-50 rounded-xl p-4 space-y-3">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
          <Package className="h-5 w-5 text-gray-600" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-gray-900 truncate">
            {item.product?.name || `Product #${item.product_id}`}
          </h4>
          <code className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-600 inline-block mt-1">
            {item.product?.sku || "—"}
          </code>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Quantity</label>
          {readOnly ? (
            <span className="font-medium text-gray-900">{item.quantity} {item.product?.unit}</span>
          ) : (
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                value={item.quantity}
                onChange={(e) => onUpdateItem(index, 'quantity', Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              />
              {item.product?.unit && (
                <span className="text-gray-500 text-sm">{item.product.unit}</span>
              )}
            </div>
          )}
        </div>
        
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Unit Cost</label>
          {readOnly ? (
            <span className="font-medium text-gray-900">{formatCurrency(item.unit_cost)}</span>
          ) : (
            <input
              type="number"
              min="0"
              step="0.01"
              value={item.unit_cost}
              onChange={(e) => onUpdateItem(index, 'unit_cost', Math.max(0, parseFloat(e.target.value) || 0))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            />
          )}
        </div>
      </div>
      
      <div className="flex justify-between items-center pt-2 border-t border-gray-200">
        <span className="text-sm font-medium text-gray-600">Total</span>
        <span className="text-lg font-bold text-gray-900">{formatCurrency(item.total)}</span>
      </div>
    </div>
  );

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Desktop Table View - Hidden on mobile */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Product</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">SKU</th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Quantity</th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Unit Cost</th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {safeItems.map((item, index) => (
              <tr key={index} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center">
                      <Package className="h-5 w-5 text-gray-600" />
                    </div>
                    <span className="font-medium text-gray-900">
                      {item.product?.name || `Product #${item.product_id}`}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <code className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">
                    {item.product?.sku || "—"}
                  </code>
                </td>
                <td className="px-6 py-4 text-right">
                  {readOnly ? (
                    <span className="font-medium text-gray-900">{item.quantity}</span>
                  ) : (
                    <div>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => onUpdateItem(index, 'quantity', Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-right focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                      />
                      {item.product?.unit && (
                        <span className="text-gray-500 text-xs ml-1">{item.product.unit}</span>
                      )}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 text-right">
                  {readOnly ? (
                    <span className="text-gray-700">{formatCurrency(item.unit_cost)}</span>
                  ) : (
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.unit_cost}
                      onChange={(e) => onUpdateItem(index, 'unit_cost', Math.max(0, parseFloat(e.target.value) || 0))}
                      className="w-32 px-3 py-2 border border-gray-300 rounded-lg text-right focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    />
                  )}
                </td>
                <td className="px-6 py-4 text-right font-semibold text-gray-900">
                  {formatCurrency(item.total)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Mobile Card View - Visible only on mobile */}
      <div className="lg:hidden p-4 space-y-3">
        {safeItems.map((item, index) => (
          <MobileItemCard key={index} item={item} index={index} />
        ))}
      </div>
    </div>
  );
};

// ==============================================
// Main Component
// ==============================================

const EditPurchaseOrderPage = ({ user }: { user: User }) => {
  const router = useRouter();
  const params = useParams();
  const orderId = params?.id as string;
  const isEditMode = !!orderId;

  const currencySymbol = user?.businesses_one?.[0]?.currency || "$";
  const formatCurr = (amount: number) => formatCurrency(amount, currencySymbol);

  const [order, setOrder] = useState<Partial<PurchaseOrder>>({
    supplier_id: 0,
    order_date: new Date().toISOString().split('T')[0],
    expected_delivery_date: "",
    status: "draft",
    items: [],
    subtotal: 0,
    tax_amount: 0,
    discount_amount: 0,
    discount_type: "fixed",
    shipping_cost: 0,
    total_amount: 0,
    notes: "",
    terms: "",
  });
  
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suppliersLoading, setSuppliersLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        setSuppliersLoading(true);
        const suppliersRes = await apiGet("/vendors", {}, false);
        const suppliersData = extractArrayFromResponse(suppliersRes, 'vendors');
        setSuppliers(suppliersData.map(normalizeSupplier));
        setSuppliersLoading(false);

        const productsRes = await apiGet("/products", {}, false);
        setProducts(extractArrayFromResponse(productsRes, 'products'));

        const locationsRes = await apiGet("/locations", {}, false);
        setLocations(extractArrayFromResponse(locationsRes, 'locations'));

        if (isEditMode && orderId) {
          await loadOrder();
        } else {
          setIsLoading(false);
        }
      } catch (err) {
        console.error("Failed to load data:", err);
        setError("Failed to load required data");
        setIsLoading(false);
        setSuppliersLoading(false);
      }
    };

    loadData();
  }, [orderId, isEditMode]);

  const loadOrder = async () => {
    try {
      const res = await apiGet(`/purchase-list/${orderId}`, {}, false);
      const data = res.data?.data || res.data;

      const mappedOrder: PurchaseOrder = {
        id: data.id,
        po_number: data.order_number || data.po_number || `PO-${data.id}`,
        supplier_id: data.vendors_id || data.supplier_id || data.vendor_id,
        order_date: formatDate(data.order_date),
        expected_delivery_date: formatDate(data.expected_delivery_date),
        status: data.status || "draft",
        subtotal: parseFloat(data.subtotal) || 0,
        tax_amount: parseFloat(data.tax) || parseFloat(data.tax_amount) || 0,
        discount_amount: parseFloat(data.discount) || parseFloat(data.discount_amount) || 0,
        discount_type: data.discount_type || "fixed",
        shipping_cost: parseFloat(data.shipping_cost) || 0,
        total_amount: parseFloat(data.total_amount) || 0,
        notes: data.notes || "",
        terms: data.terms || "",
        items: (data.items || []).map((item: any) => ({
          id: item.id,
          product_id: item.product_id,
          product: item.product,
          quantity: item.quantity,
          unit_cost: parseFloat(item.unit_cost) || 0,
          total: parseFloat(item.total_cost) || parseFloat(item.total) || 0,
        })),
        created_at: data.created_at,
        updated_at: data.updated_at,
        location_id: data.location_id,
        location: data.location,
      };

      setOrder(mappedOrder);
    } catch (err: any) {
      console.error("Failed to load order:", err);
      setError(err?.response?.data?.message || "Failed to load purchase order");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const items = order.items || [];
    const subtotal = items.reduce((sum, item) => sum + (item.total || 0), 0);
    
    let discountAmount = order.discount_amount || 0;
    if (order.discount_type === "percentage") {
      discountAmount = subtotal * (discountAmount / 100);
    }
    
    const total = subtotal - discountAmount + (order.tax_amount || 0) + (order.shipping_cost || 0);
    
    setOrder(prev => ({ ...prev, subtotal, total_amount: total }));
  }, [order.items, order.discount_amount, order.discount_type, order.tax_amount, order.shipping_cost]);

  const handleUpdateItem = (index: number, field: keyof PurchaseOrderItem, value: any) => {
    const items = order.items || [];
    const updatedItems = [...items];
    const item = updatedItems[index];
    
    if (field === 'quantity' || field === 'unit_cost') {
      item[field] = value;
      item.total = calculateItemTotal(item.quantity, item.unit_cost);
    } else {
      (item as any)[field] = value;
    }
    
    setOrder(prev => ({ ...prev, items: updatedItems }));
  };

  const handleSave = async (status: PurchaseOrder["status"] = "draft") => {
    const errors = validateOrderForm(order);
    setValidationErrors(errors);
    
    if (Object.keys(errors).length > 0) {
      toast.error("Please fix the validation errors before saving");
      return;
    }
    
    setIsSaving(true);
    
    try {
      const payload = {
        vendor_id: order.supplier_id,
        location_id: order.location_id,
        order_date: order.order_date,
        expected_delivery_date: order.expected_delivery_date || null,
        status: status,
        subtotal: order.subtotal || 0,
        tax: order.tax_amount || 0,
        discount: order.discount_amount || 0,
        discount_type: order.discount_type || "fixed",
        shipping_cost: order.shipping_cost || 0,
        total_amount: order.total_amount || 0,
        notes: order.notes || "",
        terms: order.terms || "",
        items: (order.items || []).map(item => ({
          product_id: item.product_id,
          quantity: item.quantity,
          unit_cost: item.unit_cost,
          total: item.total,
        })),
      };
      console.log(payload);
      
      let response;
      if (isEditMode) {
        response = await apiPut(`/product_purchase_updated/${orderId}`, payload);
        toast.success("Purchase order updated successfully");
      } else {
        response = await apiPost("/product_purchase", payload);
        toast.success("Purchase order created successfully");
      }
      
      const newOrderId = response.data?.data?.id || order.id;
      router.push(`/purchase-orders/${newOrderId}`);
    } catch (err: any) {
      console.error("Failed to save order:", err);
      toast.error(err?.response?.data?.message || "Failed to save purchase order");
    } finally {
      setIsSaving(false);
    }
  };

  const isEditable = !isEditMode || order.status === "draft" || order.status === "pending";
  const isLocked = isEditMode && order.status !== "draft" && order.status !== "pending";

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={() => window.location.reload()} />;

  const selectedSupplier = suppliers.find(s => (s.vid || s.id) === order.supplier_id);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Sticky Header - Mobile friendly */}
      <header className="top-0 z-40 bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-screen-2xl mx-auto px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2 sm:gap-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.back()}
                className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all"
              >
                <ArrowLeft className="h-5 w-5" />
              </motion.button>
              
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 truncate">
                    {isEditMode ? `Edit ${order.po_number}` : "Create Purchase Order"}
                  </h1>
                  {isEditMode && (
                    <span className={`px-2 py-0.5 sm:px-3 sm:py-1 text-xs font-semibold rounded-full ${
                      order.status === "draft" ? "bg-slate-100 text-slate-700" :
                      order.status === "pending" ? "bg-amber-100 text-amber-700" :
                      order.status === "approved" ? "bg-blue-100 text-blue-700" :
                      order.status === "received" ? "bg-emerald-100 text-emerald-700" :
                      "bg-rose-100 text-rose-700"
                    }`}>
                      {order.status?.toUpperCase()}
                    </span>
                  )}
                </div>
                <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                  {isEditMode 
                    ? (isEditable ? "Update order details" : "This order is locked and cannot be edited")
                    : "Create a new purchase order"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 ml-auto sm:ml-0">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => router.back()}
                className="px-3 sm:px-4 py-2 sm:py-2.5 bg-white border border-gray-300 text-gray-700 text-xs sm:text-sm font-medium rounded-xl hover:bg-gray-50 transition-all"
              >
                Cancel
              </motion.button>
              
              {isEditable && (
                <>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleSave("draft")}
                    disabled={isSaving}
                    className="px-3 sm:px-4 py-2 sm:py-2.5 bg-white border border-gray-300 text-gray-700 text-xs sm:text-sm font-medium rounded-xl hover:bg-gray-50 transition-all disabled:opacity-50"
                  >
                    <span className="hidden sm:inline">Save Draft</span>
                    <Save className="h-4 w-4 sm:hidden" />
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleSave("pending")}
                    disabled={isSaving}
                    className="px-3 sm:px-6 py-2 sm:py-2.5 bg-gradient-to-r from-gray-900 to-gray-800 text-white text-xs sm:text-sm font-medium rounded-xl hover:from-gray-800 hover:to-gray-700 transition-all shadow-sm disabled:opacity-50 flex items-center gap-1 sm:gap-2"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                        <span className="hidden sm:inline">Saving...</span>
                      </>
                    ) : (
                      <>
                        <Save className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span className="hidden sm:inline">{order.status === "pending" ? "Update Order" : "Save Order"}</span>
                      </>
                    )}
                  </motion.button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Locked Order Banner - Mobile friendly */}
      {isLocked && (
        <div className="bg-amber-50 border-b border-amber-200">
          <div className="max-w-screen-2xl mx-auto px-3 sm:px-4 lg:px-6 py-2 sm:py-3">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Lock className="h-3 w-3 sm:h-4 sm:w-4 text-amber-700" />
              </div>
              <div>
                <p className="text-amber-800 font-medium text-sm sm:text-base">This order is locked for editing</p>
                <p className="text-amber-600 text-xs sm:text-sm">
                  Only draft and pending orders can be modified. Current status: {order.status}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content - Mobile friendly grid */}
      <main className="max-w-screen-2xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-5 lg:space-y-6">
            {/* Supplier Information - Read-only */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
            >
              <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gray-900 rounded-lg flex items-center justify-center">
                    <Building2 className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                  </div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Supplier Information</h3>
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-full flex items-center gap-1">
                      <Lock className="h-3 w-3" />
                      Read-only
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="p-4 sm:p-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                      Supplier
                    </label>
                    <SupplierDisplay
                      supplier={selectedSupplier}
                      isLoading={suppliersLoading}
                      error={validationErrors.supplier_id}
                    />
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Order Items */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
            >
              <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gray-900 rounded-lg flex items-center justify-center">
                      <ShoppingBag className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Order Items</h3>
                      <p className="text-xs text-gray-500">{order.items?.length || 0} items</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="p-4 sm:p-6">
                {validationErrors.items && (
                  <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-lg">
                    <p className="text-rose-600 text-xs sm:text-sm">{validationErrors.items}</p>
                  </div>
                )}
                
                {!order.items || order.items.length === 0 ? (
                  <div className="text-center py-8 sm:py-12">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                      <Package className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400" />
                    </div>
                    <h4 className="text-gray-900 font-medium mb-1 sm:mb-2 text-sm sm:text-base">No items added</h4>
                    <p className="text-gray-500 text-xs sm:text-sm">Items from the purchase order will appear here</p>
                  </div>
                ) : (
                  <ItemsTable
                    items={order.items}
                    onUpdateItem={handleUpdateItem}
                    formatCurrency={formatCurr}
                    readOnly={!isEditable}
                  />
                )}
              </div>
            </motion.div>

            {/* Notes & Terms */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
            >
              <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gray-900 rounded-lg flex items-center justify-center">
                    <FileText className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                  </div>
                  <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Additional Information</h3>
                </div>
              </div>
              
              <div className="p-4 sm:p-6 space-y-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Notes</label>
                  <textarea
                    value={order.notes || ""}
                    onChange={(e) => setOrder(prev => ({ ...prev, notes: e.target.value }))}
                    rows={3}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none disabled:bg-gray-50 disabled:text-gray-500"
                    placeholder="Add any notes about this order..."
                    disabled={!isEditable}
                  />
                </div>
                
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Terms & Conditions</label>
                  <textarea
                    value={order.terms || ""}
                    onChange={(e) => setOrder(prev => ({ ...prev, terms: e.target.value }))}
                    rows={3}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none disabled:bg-gray-50 disabled:text-gray-500"
                    placeholder="Add terms and conditions..."
                    disabled={!isEditable}
                  />
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right Column */}
          <div className="space-y-4 sm:space-y-5 lg:space-y-6">
            {/* Order Details */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
            >
              <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gray-900 rounded-lg flex items-center justify-center">
                    <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                  </div>
                  <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Order Details</h3>
                </div>
              </div>
              
              <div className="p-4 sm:p-6 space-y-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                    Order Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={order.order_date || ""}
                    onChange={(e) => {
                      setOrder(prev => ({ ...prev, order_date: e.target.value }));
                      setValidationErrors(prev => ({ ...prev, order_date: undefined }));
                    }}
                    className={`w-full px-3 sm:px-4 py-2 sm:py-3 text-sm border rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500 ${
                      validationErrors.order_date ? 'border-rose-500' : 'border-gray-300'
                    }`}
                    disabled={!isEditable}
                  />
                  {validationErrors.order_date && (
                    <p className="text-rose-500 text-xs mt-1">{validationErrors.order_date}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Expected Delivery Date</label>
                  <input
                    type="date"
                    value={order.expected_delivery_date || ""}
                    onChange={(e) => {
                      setOrder(prev => ({ ...prev, expected_delivery_date: e.target.value }));
                      setValidationErrors(prev => ({ ...prev, expected_delivery_date: undefined }));
                    }}
                    className={`w-full px-3 sm:px-4 py-2 sm:py-3 text-sm border rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500 ${
                      validationErrors.expected_delivery_date ? 'border-rose-500' : 'border-gray-300'
                    }`}
                    disabled={!isEditable}
                  />
                  {validationErrors.expected_delivery_date && (
                    <p className="text-rose-500 text-xs mt-1">{validationErrors.expected_delivery_date}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Location</label>
                  <div className="relative">
                    <LocationDisplay
                      locationId={order.location_id}
                      locations={locations}
                    />
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Financial Summary */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
            >
              <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gray-900 rounded-lg flex items-center justify-center">
                    <Calculator className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                  </div>
                  <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Financial Summary</h3>
                </div>
              </div>
              
              <div className="p-4 sm:p-6">
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-600 text-sm">Subtotal</span>
                    <span className="font-semibold text-gray-900 text-sm sm:text-base">{formatCurr(order.subtotal || 0)}</span>
                  </div>
                  
                  {isEditable && (
                    <>
                      <div className="pt-2 border-t border-gray-200">
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Discount</label>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            min="0"
                            step={order.discount_type === "percentage" ? "1" : "0.01"}
                            value={order.discount_amount || 0}
                            onChange={(e) => {
                              setOrder(prev => ({ ...prev, discount_amount: Math.max(0, parseFloat(e.target.value) || 0) }));
                              setValidationErrors(prev => ({ ...prev, discount_amount: undefined }));
                            }}
                            className={`flex-1 px-3 sm:px-4 py-2 sm:py-3 text-sm border rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent ${
                              validationErrors.discount_amount ? 'border-rose-500' : 'border-gray-300'
                            }`}
                          />
                          <select
                            value={order.discount_type || "fixed"}
                            onChange={(e) => setOrder(prev => ({ ...prev, discount_type: e.target.value as "fixed" | "percentage" }))}
                            className="px-2 sm:px-3 py-2 sm:py-3 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                          >
                            <option value="fixed">$</option>
                            <option value="percentage">%</option>
                          </select>
                        </div>
                        {validationErrors.discount_amount && (
                          <p className="text-rose-500 text-xs mt-1">{validationErrors.discount_amount}</p>
                        )}
                      </div>
                      
                      <div className="pt-2">
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Tax</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={order.tax_amount || 0}
                          onChange={(e) => {
                            setOrder(prev => ({ ...prev, tax_amount: Math.max(0, parseFloat(e.target.value) || 0) }));
                            setValidationErrors(prev => ({ ...prev, tax_amount: undefined }));
                          }}
                          className={`w-full px-3 sm:px-4 py-2 sm:py-3 text-sm border rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent ${
                            validationErrors.tax_amount ? 'border-rose-500' : 'border-gray-300'
                          }`}
                        />
                        {validationErrors.tax_amount && (
                          <p className="text-rose-500 text-xs mt-1">{validationErrors.tax_amount}</p>
                        )}
                      </div>
                      
                      <div className="pt-2">
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Shipping Cost</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={order.shipping_cost || 0}
                          onChange={(e) => {
                            setOrder(prev => ({ ...prev, shipping_cost: Math.max(0, parseFloat(e.target.value) || 0) }));
                            setValidationErrors(prev => ({ ...prev, shipping_cost: undefined }));
                          }}
                          className={`w-full px-3 sm:px-4 py-2 sm:py-3 text-sm border rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent ${
                            validationErrors.shipping_cost ? 'border-rose-500' : 'border-gray-300'
                          }`}
                        />
                        {validationErrors.shipping_cost && (
                          <p className="text-rose-500 text-xs mt-1">{validationErrors.shipping_cost}</p>
                        )}
                      </div>
                    </>
                  )}
                  
                  {!isEditable && (
                    <>
                      {(order.discount_amount ?? 0) > 0 && (
                        <div className="flex justify-between items-center py-2">
                          <span className="text-gray-600 text-sm">
                            Discount {order.discount_type === "percentage" ? `(${order.discount_amount}%)` : ""}
                          </span>
                          <span className="font-semibold text-rose-600 text-sm">
                            -{formatCurr(order.discount_type === "percentage" 
                              ? (order.subtotal || 0) * ((order.discount_amount || 0) / 100)
                              : (order.discount_amount || 0))}
                          </span>
                        </div>
                      )}
                      {(order.tax_amount ?? 0) > 0 && (
                        <div className="flex justify-between items-center py-2">
                          <span className="text-gray-600 text-sm">Tax</span>
                          <span className="font-semibold text-gray-900 text-sm">{formatCurr(order.tax_amount || 0)}</span>
                        </div>
                      )}
                      {(order.shipping_cost ?? 0) > 0 && (
                        <div className="flex justify-between items-center py-2">
                          <span className="text-gray-600 text-sm">Shipping</span>
                          <span className="font-semibold text-gray-900 text-sm">{formatCurr(order.shipping_cost || 0)}</span>
                        </div>
                      )}
                    </>
                  )}
                  
                  <div className="pt-4 mt-2 border-t-2 border-gray-200">
                    <div className="flex justify-between items-baseline">
                      <span className="text-base sm:text-lg font-bold text-gray-900">Total</span>
                      <span className="text-xl sm:text-2xl font-bold text-gray-900">{formatCurr(order.total_amount || 0)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Order Status Card */}
            {isEditMode && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
              >
                <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gray-900 rounded-lg flex items-center justify-center">
                      <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                    </div>
                    <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Order Status</h3>
                  </div>
                </div>
                
                <div className="p-4 sm:p-6">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${
                      order.status === "draft" ? "bg-slate-500" :
                      order.status === "pending" ? "bg-amber-500" :
                      order.status === "approved" ? "bg-blue-500" :
                      order.status === "received" ? "bg-emerald-500" :
                      "bg-rose-500"
                    }`} />
                    <span className="text-gray-900 font-medium text-sm sm:text-base capitalize">{order.status}</span>
                  </div>
                  
                  {isEditable ? (
                    <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Edit3 className="h-3 w-3 sm:h-4 sm:w-4 text-emerald-700" />
                        <p className="text-emerald-700 text-xs sm:text-sm font-medium">
                          {order.status === "pending" 
                            ? "This order is pending and can still be edited" 
                            : "This order is in draft mode and can be edited"}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Lock className="h-3 w-3 sm:h-4 sm:w-4 text-amber-700" />
                        <p className="text-amber-700 text-xs sm:text-sm">
                          This order has been {order.status} and can no longer be edited.
                        </p>
                      </div>
                    </div>
                  )}
                  
                  <div className="mt-6">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Status Timeline</h4>
                    <div className="space-y-2">
                      {["draft", "pending", "approved", "received"].map((status) => {
                        const statusOrder = ["draft", "pending", "approved", "received"];
                        const currentIndex = statusOrder.indexOf(order.status || "draft");
                        const timelineIndex = statusOrder.indexOf(status);
                        const isCompleted = timelineIndex <= currentIndex && currentIndex >= 0;
                        const isCurrent = timelineIndex === currentIndex;
                        
                        return (
                          <div key={status} className="flex items-center gap-3">
                            <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center ${
                              isCompleted 
                                ? isCurrent ? "bg-amber-500 text-white" : "bg-emerald-500 text-white"
                                : "bg-gray-200 text-gray-400"
                            }`}>
                              {isCompleted && !isCurrent && <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4" />}
                              {isCurrent && <Clock className="h-3 w-3 sm:h-4 sm:w-4" />}
                              {!isCompleted && <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-400 rounded-full" />}
                            </div>
                            <span className={`text-xs sm:text-sm capitalize ${isCurrent ? "font-medium text-gray-900" : "text-gray-500"}`}>
                              {status}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default withAuth(EditPurchaseOrderPage);