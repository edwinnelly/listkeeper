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
  MoreVertical,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { toast } from "react-hot-toast";

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
    month: "long",
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

// ==============================================
// Sub-components
// ==============================================

const StatusBadge: React.FC<{ status: PurchaseOrder["status"] }> = ({ status }) => {
  const config: Record<
    PurchaseOrder["status"],
    { label: string; icon: React.ElementType; color: string }
  > = {
    draft: { label: "Draft", icon: FileText, color: "text-gray-700 bg-gray-50 border-gray-200" },
    pending: { label: "Pending", icon: Clock, color: "text-amber-700 bg-amber-50 border-amber-200" },
    approved: { label: "Approved", icon: CheckCircle, color: "text-blue-700 bg-blue-50 border-blue-200" },
    received: { label: "Received", icon: Package, color: "text-emerald-700 bg-emerald-50 border-emerald-200" },
    cancelled: { label: "Cancelled", icon: XCircle, color: "text-rose-700 bg-rose-50 border-rose-200" },
  };

  const { label, color, icon: Icon } = config[status];

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border ${color}`}>
      <Icon className="h-4 w-4" />
      {label}
    </span>
  );
};

const LoadingState: React.FC = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12">
      <div className="flex flex-col items-center justify-center">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-gray-500/20 border-t-gray-600 rounded-full animate-spin" />
          <Package className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-gray-600/60" />
        </div>
        <p className="mt-4 text-gray-600 font-medium">Loading purchase order...</p>
        <p className="text-gray-400 text-sm mt-1">Please wait a moment</p>
      </div>
    </div>
  </div>
);

const ErrorState: React.FC<{ message: string; onRetry: () => void }> = ({ message, onRetry }) => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 max-w-md">
      <div className="flex flex-col items-center text-center">
        <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center mb-4">
          <AlertCircle className="h-8 w-8 text-rose-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Order</h3>
        <p className="text-gray-500 text-sm mb-6">{message}</p>
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-lg hover:from-gray-700 hover:to-gray-800 transition-all"
        >
          <RefreshCw className="h-4 w-4" />
          Try Again
        </button>
      </div>
    </div>
  </div>
);

const InfoRow: React.FC<{ label: string; value: React.ReactNode; icon?: React.ElementType }> = ({
  label,
  value,
  icon: Icon,
}) => (
  <div className="flex items-start gap-3">
    {Icon && (
      <div className="w-5 h-5 flex-shrink-0 text-gray-400 mt-0.5">
        <Icon className="h-5 w-5" />
      </div>
    )}
    <div className="flex-1 min-w-0">
      <p className="text-xs text-gray-500 mb-0.5">{label}</p>
      <div className="text-sm text-gray-900 font-medium break-words">{value || "—"}</div>
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

  if (!isOpen) return null;

  const statusOptions: Array<{ value: PurchaseOrder["status"]; label: string; description: string }> = [
    { value: "draft", label: "Draft", description: "Order is being prepared" },
    { value: "pending", label: "Pending", description: "Waiting for approval" },
    { value: "approved", label: "Approved", description: "Ready to be sent to supplier" },
    { value: "received", label: "Received", description: "All items have been delivered" },
    { value: "cancelled", label: "Cancelled", description: "Order has been cancelled" },
  ];

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Update Status</h2>
          <div className="space-y-3 mb-6">
            {statusOptions.map((option) => (
              <label
                key={option.value}
                className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                  selectedStatus === option.value
                    ? "border-gray-600 bg-gray-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <input
                  type="radio"
                  name="status"
                  value={option.value}
                  checked={selectedStatus === option.value}
                  onChange={() => setSelectedStatus(option.value)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{option.label}</p>
                  <p className="text-xs text-gray-500">{option.description}</p>
                </div>
              </label>
            ))}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              onClick={() => onConfirm(selectedStatus)}
              className="flex-1 px-4 py-2.5 rounded-lg bg-gradient-to-r from-gray-600 to-gray-700 text-white font-medium hover:from-gray-700 hover:to-gray-800 transition disabled:opacity-50 flex items-center justify-center gap-2"
              disabled={isSubmitting || selectedStatus === currentStatus}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Status"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
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

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <h2 className="text-lg font-bold text-gray-900">Order Items</h2>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">{items.length} items</span>
          {expanded ? (
            <ChevronUp className="h-5 w-5 text-gray-400" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-400" />
          )}
        </div>
      </button>

      {expanded && (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-y border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">#</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Product</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">SKU</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Quantity</th>
                  {status === "received" && (
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Received</th>
                  )}
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Unit Cost</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((item, index) => (
                  <tr key={item.id} className="hover:bg-gray-50/50">
                    <td className="px-6 py-4 text-gray-500">{index + 1}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                          <Package className="h-4 w-4 text-gray-500" />
                        </div>
                        <span className="font-medium text-gray-900">{item.product?.name || `Product #${item.product_id}`}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-500 font-mono text-xs">
                      {item.product?.sku || "—"}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-medium text-gray-900">{item.quantity}</span>
                      {item.product?.unit && (
                        <span className="text-gray-500 ml-1">{item.product.unit}</span>
                      )}
                    </td>
                    {status === "received" && (
                      <td className="px-6 py-4 text-right">
                        <span className={`font-medium ${item.received_quantity === item.quantity ? 'text-emerald-600' : 'text-amber-600'}`}>
                          {item.received_quantity || 0}
                        </span>
                        {item.product?.unit && (
                          <span className="text-gray-500 ml-1">{item.product.unit}</span>
                        )}
                      </td>
                    )}
                    <td className="px-6 py-4 text-right text-gray-700">
                      {formatCurrency(item.unit_cost)}
                    </td>
                    <td className="px-6 py-4 text-right font-semibold text-gray-900">
                      {formatCurrency(item.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="border-t border-gray-200 bg-gray-50/50 px-6 py-4">
            <div className="flex flex-col items-end gap-2">
              <div className="flex justify-end gap-8 text-sm">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-medium text-gray-900 w-32 text-right">{formatCurrency(subtotal)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-end gap-8 text-sm">
                  <span className="text-gray-600">Discount:</span>
                  <span className="font-medium text-rose-600 w-32 text-right">-{formatCurrency(discountAmount)}</span>
                </div>
              )}
              {taxAmount > 0 && (
                <div className="flex justify-end gap-8 text-sm">
                  <span className="text-gray-600">Tax:</span>
                  <span className="font-medium text-gray-900 w-32 text-right">{formatCurrency(taxAmount)}</span>
                </div>
              )}
              {shippingCost > 0 && (
                <div className="flex justify-end gap-8 text-sm">
                  <span className="text-gray-600">Shipping:</span>
                  <span className="font-medium text-gray-900 w-32 text-right">{formatCurrency(shippingCost)}</span>
                </div>
              )}
              <div className="flex justify-end gap-8 text-base font-bold pt-2 border-t border-gray-200 mt-2">
                <span className="text-gray-900">Total:</span>
                <span className="text-gray-900 w-32 text-right">{formatCurrency(total)}</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

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
  const [actionMenuOpen, setActionMenuOpen] = useState(false);

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

      console.log(res.data);

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
    // Implement export functionality
    toast.success("Export started");
  };

  const canEdit = order?.status === "draft" || order?.status === "pending";
  const canReceive = order?.status === "approved" || order?.status === "pending";

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={fetchOrder} />;
  if (!order) return <ErrorState message="Order not found" onRetry={fetchOrder} />;

  return (
    <div className="min-h-screen bg-gray-50 print:bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm print:hidden">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Link
                href="/purchase-orders/list"
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-gray-900">{order.po_number}</h1>
                  <StatusBadge status={order.status} />
                </div>
                <p className="text-sm text-gray-500 mt-0.5">
                  Created on {formatDate(order.order_date)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                className="p-2.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
                title="Print"
              >
                <Printer className="h-5 w-5" />
              </button>
              <button
                onClick={handleExport}
                className="p-2.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
                title="Export"
              >
                <Download className="h-5 w-5" />
              </button>
              {canEdit && (
                <Link
                  href={`/purchase-orders/edit/${order.id}`}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Edit className="h-4 w-4" />
                  Edit
                </Link>
              )}
              {canReceive && (
                <button
                  onClick={() => handleUpdateStatus("received")}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white text-sm font-medium rounded-lg hover:from-emerald-700 hover:to-emerald-800 transition-all"
                >
                  <Package className="h-4 w-4" />
                  Receive Items
                </button>
              )}
              <div className="relative">
                <button
                  onClick={() => setActionMenuOpen(!actionMenuOpen)}
                  className="p-2.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
                >
                  <MoreVertical className="h-5 w-5" />
                </button>
                {actionMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setActionMenuOpen(false)} />
                    <div className="absolute right-0 top-12 z-20 w-48 bg-white border border-gray-200 rounded-xl shadow-lg">
                      <button
                        onClick={() => {
                          setStatusModalOpen(true);
                          setActionMenuOpen(false);
                        }}
                        className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition rounded-t-xl border-b border-gray-100"
                      >
                        <RefreshCw size={15} className="text-gray-600" />
                        Update Status
                      </button>
                      {order.status === "draft" && (
                        <button
                          onClick={() => {
                            handleUpdateStatus("pending");
                            setActionMenuOpen(false);
                          }}
                          className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-amber-700 hover:bg-amber-50 transition border-b border-gray-100"
                        >
                          <Clock size={15} />
                          Submit for Approval
                        </button>
                      )}
                      {order.status === "pending" && (
                        <button
                          onClick={() => {
                            handleUpdateStatus("approved");
                            setActionMenuOpen(false);
                          }}
                          className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-blue-700 hover:bg-blue-50 transition border-b border-gray-100"
                        >
                          <CheckCircle size={15} />
                          Approve Order
                        </button>
                      )}
                      <button
                        onClick={() => {
                          handlePrint();
                          setActionMenuOpen(false);
                        }}
                        className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition border-b border-gray-100"
                      >
                        <Printer size={15} className="text-gray-600" />
                        Print Order
                      </button>
                      <button
                        onClick={() => {
                          // Navigate to duplicate
                          router.push(`/purchase-orders/create?duplicate=${order.id}`);
                          setActionMenuOpen(false);
                        }}
                        className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition rounded-b-xl"
                      >
                        <FileText size={15} className="text-gray-600" />
                        Duplicate Order
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Print Header */}
      <div className="hidden print:block p-8 pb-0">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Purchase Order</h1>
            <p className="text-sm font-mono mt-1">{order.po_number}</p>
          </div>
          <div className="text-right">
            <p className="font-bold text-lg">{businessInfo?.name || "Company Name"}</p>
            <p className="text-sm text-gray-600">{businessInfo?.address || ""}</p>
            <p className="text-sm text-gray-600">{businessInfo?.phone || ""}</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-screen-xl mx-auto px-4 sm:px-6 py-6 print:py-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Order Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Supplier Info Card */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-gray-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Supplier Information</h3>
                  <p className="text-sm text-gray-500">Details of the supplying vendor</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InfoRow label="Supplier Name" value={order.supplier?.name} />
                <InfoRow label="Contact Person" value={order.supplier?.contact_person} icon={User} />
                <InfoRow label="Email" value={order.supplier?.email} icon={Mail} />
                <InfoRow label="Phone" value={order.supplier?.phone} icon={Phone} />
                <InfoRow label="Address" value={order.supplier?.address} icon={Building2} />
                <InfoRow label="Tax ID" value={order.supplier?.tax_id} />
              </div>
            </div>

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
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                {order.notes && (
                  <div className="mb-4">
                    <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      <FileText className="h-4 w-4 text-gray-500" />
                      Notes
                    </h3>
                    <p className="text-sm text-gray-600 whitespace-pre-wrap">{order.notes}</p>
                  </div>
                )}
                {order.terms && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      <FileText className="h-4 w-4 text-gray-500" />
                      Terms & Conditions
                    </h3>
                    <p className="text-sm text-gray-600 whitespace-pre-wrap">{order.terms}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column - Summary */}
          <div className="space-y-6">
            {/* Order Summary Card */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Order Summary</h3>
              <div className="space-y-3">
                <InfoRow label="Order Date" value={formatDate(order.order_date)} icon={Calendar} />
                <InfoRow
                  label="Expected Delivery"
                  value={formatDate(order.expected_delivery_date)}
                  icon={Truck}
                />
                {order.delivered_date && (
                  <InfoRow
                    label="Delivered Date"
                    value={formatDate(order.delivered_date)}
                    icon={CheckCircle}
                  />
                )}
                <InfoRow label="Location" value={order.location?.location_name} icon={Building2} />
                <InfoRow label="Created By" value={order.created_by?.name} icon={User} />
              </div>
            </div>

            {/* Totals Card */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Totals</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium text-gray-900">{formatCurr(order.subtotal)}</span>
                </div>
                {order.discount_amount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Discount</span>
                    <span className="font-medium text-rose-600">-{formatCurr(order.discount_amount)}</span>
                  </div>
                )}
                {order.tax_amount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tax</span>
                    <span className="font-medium text-gray-900">{formatCurr(order.tax_amount)}</span>
                  </div>
                )}
                {order.shipping_cost > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Shipping</span>
                    <span className="font-medium text-gray-900">{formatCurr(order.shipping_cost)}</span>
                  </div>
                )}
                <div className="pt-3 border-t border-gray-200">
                  <div className="flex justify-between">
                    <span className="font-bold text-gray-900">Total</span>
                    <span className="font-bold text-xl text-gray-900">{formatCurr(order.total_amount)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Timeline Card */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Activity</h3>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center flex-shrink-0">
                    <FileText className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Order Created</p>
                    <p className="text-xs text-gray-500">{formatDateTime(order.created_at)}</p>
                  </div>
                </div>
                {order.updated_at !== order.created_at && (
                  <div className="flex gap-3">
                    <div className="w-8 h-8 bg-gray-50 rounded-full flex items-center justify-center flex-shrink-0">
                      <Edit className="h-4 w-4 text-gray-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Last Updated</p>
                      <p className="text-xs text-gray-500">{formatDateTime(order.updated_at)}</p>
                    </div>
                  </div>
                )}
                {order.status === "received" && order.delivered_date && (
                  <div className="flex gap-3">
                    <div className="w-8 h-8 bg-emerald-50 rounded-full flex items-center justify-center flex-shrink-0">
                      <Package className="h-4 w-4 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Order Received</p>
                      <p className="text-xs text-gray-500">{formatDateTime(order.delivered_date)}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
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