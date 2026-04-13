"use client";

import { withAuth } from "@/hoc/withAuth";
import { apiGet, apiPut } from "@/lib/axios";
import React, { useState, useEffect, useMemo } from "react";
import {
  ArrowLeft,
  Loader2,
  Package,
  Building2,
  Calendar,
  Truck,
  FileText,
  Phone,
  Mail,
  User,
  Edit,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Printer,
  Download,
  RefreshCw,
  MoreHorizontal,
  ChevronDown,
  ChevronRight,
  Copy,
  Send,
  CheckCheck,
  Ban,
  History,
  DollarSign,
  MapPin,
  Hash,
  ShoppingBag,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { toast } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

// ==============================================
// TypeScript Interfaces
// ==============================================

interface Supplier {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  contact_person: string | null;
  address: string | null;
  tax_id: string | null;
}

interface Product {
  id: number;
  name: string;
  sku: string;
  cost_price: number;
  selling_price: number;
  unit: string;
}

interface PurchaseOrderItem {
  id: number;
  product_id: number;
  product?: Product;
  quantity: number;
  unit_cost: number;
  total: number;
  received_quantity?: number;
}

interface PurchaseOrder {
  id: number;
  po_number: string;
  supplier_id: number;
  supplier?: Supplier;
  order_date: string;
  expected_delivery_date: string | null;
  delivered_date: string | null;
  status: "draft" | "pending" | "approved" | "received" | "cancelled";
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  shipping_cost: number;
  total_amount: number;
  notes: string | null;
  terms: string | null;
  items: PurchaseOrderItem[];
  created_at: string;
  updated_at: string;
  created_by?: { id: number; name: string };
  location_id?: number;
  location?: { id: number; location_name: string };
}

interface User {
  businesses_one?: Array<{
    currency?: string;
    name?: string;
    address?: string;
    phone?: string;
    email?: string;
  }>;
}

// ==============================================
// Utility Functions
// ==============================================

const formatDate = (dateString: string | null): string => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const formatDateTime = (dateString: string | null): string => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatCurrency = (amount: number, currencySymbol: string = "$"): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount).replace(/^\$/, currencySymbol);
};

const getStatusColor = (status: PurchaseOrder["status"]) => {
  const colors = {
    draft: "slate",
    pending: "amber",
    approved: "blue",
    received: "emerald",
    cancelled: "rose",
  };
  return colors[status];
};

// ==============================================
// Sub-components
// ==============================================

const StatusBadge: React.FC<{ status: PurchaseOrder["status"] }> = ({ status }) => {
  const config: Record<
    PurchaseOrder["status"],
    { label: string; icon: React.ElementType; gradient: string }
  > = {
    draft: { 
      label: "Draft", 
      icon: FileText, 
      gradient: "from-slate-500 to-slate-600" 
    },
    pending: { 
      label: "Pending Approval", 
      icon: Clock, 
      gradient: "from-amber-500 to-amber-600" 
    },
    approved: { 
      label: "Approved", 
      icon: CheckCircle, 
      gradient: "from-blue-500 to-blue-600" 
    },
    received: { 
      label: "Received", 
      icon: CheckCheck, 
      gradient: "from-emerald-500 to-emerald-600" 
    },
    cancelled: { 
      label: "Cancelled", 
      icon: Ban, 
      gradient: "from-rose-500 to-rose-600" 
    },
  };

  const { label, gradient, icon: Icon } = config[status];

  return (
    <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium bg-gradient-to-r ${gradient} text-white shadow-sm`}>
      <Icon className="h-3.5 w-3.5" />
      {label}
    </span>
  );
};

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
          <RefreshCw className="h-4 w-4" />
          Try Again
        </button>
      </div>
    </motion.div>
  </div>
);

const InfoCard: React.FC<{ 
  title: string; 
  icon: React.ElementType;
  children: React.ReactNode;
  className?: string;
}> = ({ title, icon: Icon, children, className = "" }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className={`bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden ${className}`}
  >
    <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center">
          <Icon className="h-4 w-4 text-white" />
        </div>
        <h3 className="font-semibold text-gray-900">{title}</h3>
      </div>
    </div>
    <div className="p-6">
      {children}
    </div>
  </motion.div>
);

const InfoRow: React.FC<{ 
  label: string; 
  value: React.ReactNode; 
  icon?: React.ElementType;
  highlight?: boolean;
}> = ({ label, value, icon: Icon, highlight }) => (
  <div className="flex items-start gap-3 group">
    {Icon && (
      <div className={`w-5 h-5 flex-shrink-0 ${highlight ? 'text-gray-900' : 'text-gray-400'} group-hover:text-gray-600 transition-colors mt-0.5`}>
        <Icon className="h-5 w-5" />
      </div>
    )}
    <div className="flex-1 min-w-0">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <div className={`text-sm ${highlight ? 'text-gray-900 font-semibold' : 'text-gray-700'} break-words`}>
        {value || "—"}
      </div>
    </div>
  </div>
);

const StatusUpdateModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (status: PurchaseOrder["status"]) => void;
  currentStatus: PurchaseOrder["status"];
  isSubmitting: boolean;
}> = ({ isOpen, onClose, onConfirm, currentStatus, isSubmitting }) => {
  const [selectedStatus, setSelectedStatus] = useState<PurchaseOrder["status"]>(currentStatus);

  useEffect(() => {
    setSelectedStatus(currentStatus);
  }, [currentStatus]);

  const statusOptions: Array<{ 
    value: PurchaseOrder["status"]; 
    label: string; 
    description: string;
    icon: React.ElementType;
    color: string;
  }> = [
    { 
      value: "draft", 
      label: "Draft", 
      description: "Order is being prepared and can be edited",
      icon: FileText,
      color: "slate"
    },
    { 
      value: "pending", 
      label: "Pending", 
      description: "Waiting for approval from management",
      icon: Clock,
      color: "amber"
    },
    { 
      value: "approved", 
      label: "Approved", 
      description: "Ready to be sent to supplier",
      icon: CheckCircle,
      color: "blue"
    },
    { 
      value: "received", 
      label: "Received", 
      description: "All items have been delivered and verified",
      icon: CheckCheck,
      color: "emerald"
    },
    { 
      value: "cancelled", 
      label: "Cancelled", 
      description: "Order has been cancelled",
      icon: Ban,
      color: "rose"
    },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-2">Update Order Status</h2>
              <p className="text-sm text-gray-500 mb-6">Select the new status for this purchase order</p>
              
              <div className="space-y-2 mb-6">
                {statusOptions.map((option) => {
                  const Icon = option.icon;
                  const isSelected = selectedStatus === option.value;
                  
                  return (
                    <motion.button
                      key={option.value}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedStatus(option.value)}
                      className={`w-full flex items-start gap-4 p-4 rounded-xl border-2 transition-all ${
                        isSelected
                          ? `border-${option.color}-500 bg-${option.color}-50`
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-lg bg-${option.color}-100 flex items-center justify-center flex-shrink-0`}>
                        <Icon className={`h-5 w-5 text-${option.color}-600`} />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="font-semibold text-gray-900">{option.label}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{option.description}</p>
                      </div>
                      {isSelected && (
                        <CheckCircle className={`h-5 w-5 text-${option.color}-600`} />
                      )}
                    </motion.button>
                  );
                })}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-3 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  onClick={() => onConfirm(selectedStatus)}
                  className="flex-1 px-4 py-3 rounded-xl bg-gray-900 text-white font-medium hover:bg-gray-800 transition disabled:opacity-50 flex items-center justify-center gap-2"
                  disabled={isSubmitting || selectedStatus === currentStatus}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    "Confirm Update"
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const ItemsTable: React.FC<{
  items: PurchaseOrderItem[];
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  shippingCost: number;
  total: number;
  formatCurrency: (amount: number) => string;
  status: PurchaseOrder["status"];
}> = ({ items, subtotal, taxAmount, discountAmount, shippingCost, total, formatCurrency, status }) => {
  const [expanded, setExpanded] = useState(true);

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const receivedItems = items.reduce((sum, item) => sum + (item.received_quantity || 0), 0);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center">
            <ShoppingBag className="h-4 w-4 text-white" />
          </div>
          <div className="text-left">
            <h2 className="font-semibold text-gray-900">Order Items</h2>
            <p className="text-xs text-gray-500">{items.length} products, {totalItems} total units</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {status === "received" && receivedItems > 0 && (
            <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
              {receivedItems} received
            </span>
          )}
          {expanded ? (
            <ChevronDown className="h-5 w-5 text-gray-400" />
          ) : (
            <ChevronRight className="h-5 w-5 text-gray-400" />
          )}
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-y border-gray-200">
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Product</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">SKU</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Qty</th>
                    {status === "received" && (
                      <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Received</th>
                    )}
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Unit Price</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {items.map((item, index) => (
                    <motion.tr
                      key={item.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-gray-50/50 transition-colors"
                    >
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
                        <span className="font-medium text-gray-900">{item.quantity}</span>
                        {item.product?.unit && (
                          <span className="text-gray-500 text-xs ml-1">{item.product.unit}</span>
                        )}
                      </td>
                      {status === "received" && (
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${((item.received_quantity || 0) / item.quantity) * 100}%` }}
                                className={`h-full ${
                                  (item.received_quantity || 0) === item.quantity 
                                    ? 'bg-emerald-500' 
                                    : 'bg-amber-500'
                                }`}
                              />
                            </div>
                            <span className={`font-medium ${
                              (item.received_quantity || 0) === item.quantity 
                                ? 'text-emerald-600' 
                                : 'text-amber-600'
                            }`}>
                              {item.received_quantity || 0}
                            </span>
                          </div>
                        </td>
                      )}
                      <td className="px-6 py-4 text-right text-gray-700">
                        {formatCurrency(item.unit_cost)}
                      </td>
                      <td className="px-6 py-4 text-right font-semibold text-gray-900">
                        {formatCurrency(item.total)}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals Section */}
            <div className="border-t border-gray-200 bg-gradient-to-b from-gray-50 to-white px-6 py-5">
              <div className="flex justify-end">
                <div className="w-80 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium text-gray-900">{formatCurrency(subtotal)}</span>
                  </div>
                  
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Discount</span>
                      <span className="font-medium text-rose-600">-{formatCurrency(discountAmount)}</span>
                    </div>
                  )}
                  
                  {taxAmount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Tax</span>
                      <span className="font-medium text-gray-900">{formatCurrency(taxAmount)}</span>
                    </div>
                  )}
                  
                  {shippingCost > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Shipping</span>
                      <span className="font-medium text-gray-900">{formatCurrency(shippingCost)}</span>
                    </div>
                  )}
                  
                  <div className="pt-3 mt-2 border-t-2 border-gray-200">
                    <div className="flex justify-between items-baseline">
                      <span className="text-base font-bold text-gray-900">Total</span>
                      <span className="text-2xl font-bold text-gray-900">{formatCurrency(total)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const TimelineStep: React.FC<{
  title: string;
  timestamp: string | null;
  icon: React.ElementType;
  isCompleted: boolean;
  isLast?: boolean;
}> = ({ title, timestamp, icon: Icon, isCompleted, isLast }) => (
  <div className="flex gap-4">
    <div className="flex flex-col items-center">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className={`w-8 h-8 rounded-full flex items-center justify-center ${
          isCompleted 
            ? 'bg-gray-900 text-white' 
            : 'bg-gray-100 text-gray-400'
        }`}
      >
        <Icon className="h-4 w-4" />
      </motion.div>
      {!isLast && (
        <div className={`w-0.5 h-full mt-2 ${isCompleted ? 'bg-gray-900' : 'bg-gray-200'}`} />
      )}
    </div>
    <div className="flex-1 pb-6">
      <p className={`font-medium ${isCompleted ? 'text-gray-900' : 'text-gray-500'}`}>
        {title}
      </p>
      {timestamp && (
        <p className="text-xs text-gray-500 mt-1">{formatDateTime(timestamp)}</p>
      )}
    </div>
  </div>
);

// ==============================================
// Main Component
// ==============================================

const ViewPurchaseOrderPage = ({ user }: { user: User }) => {
  const router = useRouter();
  const params = useParams();
  const orderId = params?.id as string;

  const currencySymbol = user?.businesses_one?.[0]?.currency || "$";
  const businessInfo = user?.businesses_one?.[0];
  const formatCurr = (amount: number) => formatCurrency(amount, currencySymbol);

  // State
  const [order, setOrder] = useState<PurchaseOrder | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [showActions, setShowActions] = useState(false);

  useEffect(() => {
    if (orderId) {
      fetchOrder();
    }
  }, [orderId]);

  const fetchOrder = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiGet(`/purchase-list/${orderId}`, {}, false);
      const data = res.data?.data || res.data;

      const mappedOrder: PurchaseOrder = {
        id: data.id,
        po_number: data.order_number || data.po_number || `PO-${data.id}`,
        supplier_id: data.vendors_id || data.supplier_id,
        supplier: data.vendor || data.supplier ? {
          id: data.vendor?.id || data.supplier?.id,
          name: data.vendor?.vendor_name || data.supplier?.name,
          email: data.vendor?.email || data.supplier?.email,
          phone: data.vendor?.phone || data.supplier?.phone,
          contact_person: data.vendor?.contact_person || data.supplier?.contact_person,
          address: data.vendor?.address || data.supplier?.address,
          tax_id: data.vendor?.tax_id || data.supplier?.tax_id,
        } : undefined,
        order_date: data.order_date,
        expected_delivery_date: data.expected_delivery_date,
        delivered_date: data.delivered_date,
        status: data.status || "pending",
        subtotal: parseFloat(data.subtotal) || 0,
        tax_amount: parseFloat(data.tax_amount) || 0,
        discount_amount: parseFloat(data.discount_amount) || 0,
        shipping_cost: parseFloat(data.shipping_cost) || 0,
        total_amount: parseFloat(data.total_amount) || 0,
        notes: data.notes,
        terms: data.terms,
        items: (data.items || []).map((item: any) => ({
          id: item.id,
          product_id: item.product_id,
          product: item.product,
          quantity: item.quantity,
          unit_cost: parseFloat(item.unit_cost) || 0,
          total: parseFloat(item.total) || 0,
          received_quantity: item.received_quantity,
        })),
        created_at: data.created_at,
        updated_at: data.updated_at,
        created_by: data.created_by,
        location_id: data.location_id,
        location: data.location,
      };

      setOrder(mappedOrder);
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.message || "Failed to load purchase order");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async (newStatus: PurchaseOrder["status"]) => {
    if (isSubmitting || !order) return;
    setIsSubmitting(true);
    try {
      await apiPut(`/product_purchase/${orderId}`, { status: newStatus });
      setOrder({ ...order, status: newStatus });
      toast.success(`Status updated to ${newStatus}`);
      setStatusModalOpen(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to update status");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    toast.success("Export started");
  };

  const handleDuplicate = () => {
    router.push(`/purchase-orders/create?duplicate=${order?.id}`);
  };

  const canEdit = order?.status === "draft" || order?.status === "pending";
  const canReceive = order?.status === "approved" || order?.status === "pending";
  const canApprove = order?.status === "pending";
  const canCancel = order?.status !== "cancelled" && order?.status !== "received";

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={fetchOrder} />;
  if (!order) return <ErrorState message="Order not found" onRetry={fetchOrder} />;

  const statusColor = getStatusColor(order.status);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 print:bg-white">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-40 print:hidden">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.back()}
                className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all"
              >
                <ArrowLeft className="h-5 w-5" />
              </motion.button>
              
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-gray-900">{order.po_number}</h1>
                  <StatusBadge status={order.status} />
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-sm text-gray-500">
                    Created {formatDate(order.order_date)}
                  </p>
                  {order.supplier && (
                    <>
                      <span className="text-gray-300">•</span>
                      <p className="text-sm text-gray-500">
                        {order.supplier.name}
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Quick Actions */}
              <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
                <button
                  onClick={handlePrint}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-white rounded-lg transition-all"
                  title="Print Order"
                >
                  <Printer className="h-4 w-4" />
                </button>
                <button
                  onClick={handleExport}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-white rounded-lg transition-all"
                  title="Export"
                >
                  <Download className="h-4 w-4" />
                </button>
                <button
                  onClick={handleDuplicate}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-white rounded-lg transition-all"
                  title="Duplicate"
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>

              {/* Primary Actions */}
              {canEdit && (
                <Link href={`/purchase-orders/edit/${order.id}`}>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 transition-all"
                  >
                    <Edit className="h-4 w-4" />
                    Edit Order
                  </motion.button>
                </Link>
              )}
              
              {canReceive && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleUpdateStatus("received")}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-sm font-medium rounded-xl hover:from-emerald-600 hover:to-emerald-700 transition-all shadow-sm"
                >
                  <CheckCheck className="h-4 w-4" />
                  Receive Items
                </motion.button>
              )}

              {canApprove && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleUpdateStatus("approved")}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm font-medium rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all shadow-sm"
                >
                  <CheckCircle className="h-4 w-4" />
                  Approve
                </motion.button>
              )}

              {/* More Actions Dropdown */}
              <div className="relative">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowActions(!showActions)}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all"
                >
                  <MoreHorizontal className="h-5 w-5" />
                </motion.button>
                
                <AnimatePresence>
                  {showActions && (
                    <>
                      <div className="fixed inset-0 z-30" onClick={() => setShowActions(false)} />
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute right-0 top-12 z-40 w-56 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden"
                      >
                        <button
                          onClick={() => {
                            setStatusModalOpen(true);
                            setShowActions(false);
                          }}
                          className="flex items-center gap-3 w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition"
                        >
                          <RefreshCw className="h-4 w-4" />
                          Update Status
                        </button>
                        
                        {order.status === "draft" && (
                          <button
                            onClick={() => {
                              handleUpdateStatus("pending");
                              setShowActions(false);
                            }}
                            className="flex items-center gap-3 w-full px-4 py-3 text-sm text-amber-700 hover:bg-amber-50 transition"
                          >
                            <Send className="h-4 w-4" />
                            Submit for Approval
                          </button>
                        )}
                        
                        {canCancel && (
                          <button
                            onClick={() => {
                              handleUpdateStatus("cancelled");
                              setShowActions(false);
                            }}
                            className="flex items-center gap-3 w-full px-4 py-3 text-sm text-rose-700 hover:bg-rose-50 transition"
                          >
                            <Ban className="h-4 w-4" />
                            Cancel Order
                          </button>
                        )}
                        
                        <hr className="border-gray-200" />
                        
                        <button
                          onClick={() => {
                            handlePrint();
                            setShowActions(false);
                          }}
                          className="flex items-center gap-3 w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition"
                        >
                          <Printer className="h-4 w-4" />
                          Print Order
                        </button>
                        
                        <button
                          onClick={() => {
                            handleDuplicate();
                            setShowActions(false);
                          }}
                          className="flex items-center gap-3 w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition"
                        >
                          <Copy className="h-4 w-4" />
                          Duplicate Order
                        </button>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 print:py-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Supplier Information */}
            <InfoCard title="Supplier Information" icon={Building2}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InfoRow 
                  label="Supplier Name" 
                  value={order.supplier?.name} 
                  icon={Building2}
                  highlight
                />
                <InfoRow 
                  label="Contact Person" 
                  value={order.supplier?.contact_person} 
                  icon={User} 
                />
                <InfoRow 
                  label="Email" 
                  value={
                    order.supplier?.email ? (
                      <a href={`mailto:${order.supplier.email}`} className="text-blue-600 hover:underline">
                        {order.supplier.email}
                      </a>
                    ) : null
                  } 
                  icon={Mail} 
                />
                <InfoRow 
                  label="Phone" 
                  value={
                    order.supplier?.phone ? (
                      <a href={`tel:${order.supplier.phone}`} className="text-blue-600 hover:underline">
                        {order.supplier.phone}
                      </a>
                    ) : null
                  } 
                  icon={Phone} 
                />
                <InfoRow 
                  label="Address" 
                  value={order.supplier?.address} 
                  icon={MapPin} 
                />
                <InfoRow 
                  label="Tax ID" 
                  value={order.supplier?.tax_id} 
                  icon={Hash} 
                />
              </div>
            </InfoCard>

            {/* Items Table */}
            <ItemsTable
              items={order.items}
              subtotal={order.subtotal}
              taxAmount={order.tax_amount}
              discountAmount={order.discount_amount}
              shippingCost={order.shipping_cost}
              total={order.total_amount}
              formatCurrency={formatCurr}
              status={order.status}
            />

            {/* Notes & Terms */}
            {(order.notes || order.terms) && (
              <InfoCard title="Additional Information" icon={FileText}>
                {order.notes && (
                  <div className="mb-6">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Notes</h4>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-600 whitespace-pre-wrap">{order.notes}</p>
                    </div>
                  </div>
                )}
                {order.terms && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Terms & Conditions</h4>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-600 whitespace-pre-wrap">{order.terms}</p>
                    </div>
                  </div>
                )}
              </InfoCard>
            )}
          </div>

          {/* Right Column - Summary */}
          <div className="space-y-6">
            {/* Order Details */}
            <InfoCard title="Order Details" icon={Calendar}>
              <div className="space-y-4">
                <InfoRow 
                  label="Order Date" 
                  value={formatDate(order.order_date)} 
                  icon={Calendar} 
                />
                <InfoRow
                  label="Expected Delivery"
                  value={formatDate(order.expected_delivery_date)}
                  icon={Truck}
                />
                {order.delivered_date && (
                  <InfoRow
                    label="Delivered Date"
                    value={formatDate(order.delivered_date)}
                    icon={CheckCheck}
                  />
                )}
                <InfoRow 
                  label="Location" 
                  value={order.location?.location_name} 
                  icon={MapPin} 
                />
                <InfoRow 
                  label="Created By" 
                  value={order.created_by?.name} 
                  icon={User} 
                />
              </div>
            </InfoCard>

            {/* Financial Summary */}
            <InfoCard title="Financial Summary" icon={DollarSign}>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-semibold text-gray-900">{formatCurr(order.subtotal)}</span>
                </div>
                
                {order.discount_amount > 0 && (
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-600">Discount</span>
                    <span className="font-semibold text-rose-600">-{formatCurr(order.discount_amount)}</span>
                  </div>
                )}
                
                {order.tax_amount > 0 && (
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-600">Tax</span>
                    <span className="font-semibold text-gray-900">{formatCurr(order.tax_amount)}</span>
                  </div>
                )}
                
                {order.shipping_cost > 0 && (
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-600">Shipping</span>
                    <span className="font-semibold text-gray-900">{formatCurr(order.shipping_cost)}</span>
                  </div>
                )}
                
                <div className="pt-4 mt-2 border-t-2 border-gray-200">
                  <div className="flex justify-between items-baseline">
                    <span className="text-lg font-bold text-gray-900">Total</span>
                    <span className="text-2xl font-bold text-gray-900">{formatCurr(order.total_amount)}</span>
                  </div>
                </div>
              </div>
            </InfoCard>

            {/* Timeline */}
            <InfoCard title="Order Timeline" icon={History}>
              <div className="pt-2">
                <TimelineStep
                  title="Order Created"
                  timestamp={order.created_at}
                  icon={FileText}
                  isCompleted={true}
                />
                
                {order.status !== "draft" && (
                  <TimelineStep
                    title="Order Submitted"
                    timestamp={order.updated_at}
                    icon={Send}
                    isCompleted={order.status !== "draft"}
                  />
                )}
                
                {order.status === "approved" || order.status === "received" ? (
                  <TimelineStep
                    title="Order Approved"
                    timestamp={order.updated_at}
                    icon={CheckCircle}
                    isCompleted={order.status === "approved" || order.status === "received"}
                  />
                ) : null}
                
                {order.status === "received" && order.delivered_date ? (
                  <TimelineStep
                    title="Order Received"
                    timestamp={order.delivered_date}
                    icon={CheckCheck}
                    isCompleted={true}
                    isLast={true}
                  />
                ) : order.status === "cancelled" ? (
                  <TimelineStep
                    title="Order Cancelled"
                    timestamp={order.updated_at}
                    icon={Ban}
                    isCompleted={true}
                    isLast={true}
                  />
                ) : (
                  <TimelineStep
                    title={order.status === "approved" ? "Awaiting Delivery" : "Awaiting Approval"}
                    timestamp={null}
                    icon={Clock}
                    isCompleted={false}
                    isLast={true}
                  />
                )}
              </div>
            </InfoCard>
          </div>
        </div>
      </main>

      {/* Status Update Modal */}
      <StatusUpdateModal
        isOpen={statusModalOpen}
        onClose={() => setStatusModalOpen(false)}
        onConfirm={handleUpdateStatus}
        currentStatus={order.status}
        isSubmitting={isSubmitting}
      />
    </div>
  );
};

export default withAuth(ViewPurchaseOrderPage);