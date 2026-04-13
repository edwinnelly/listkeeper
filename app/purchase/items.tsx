"use client";

import { withAuth } from "@/hoc/withAuth";
import { apiGet, apiPut, apiDelete } from "@/lib/axios";
import React, { useState, useEffect, useMemo } from "react";
import {
  Plus,
  Search,
  MoreVertical,
  X,
  AlertTriangle,
  ArrowLeft,
  Loader2,
  RefreshCw,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Package,
  Filter,
  Edit,
  Trash2,
  FilterX,
  Building2,
  ShoppingCart,
  Clock,
  Grid3x3,
  List,
  Truck,
  Calendar,
  FileText,
  Eye,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
}

interface PurchaseOrder {
  id: number;
  po_number: string;
  order_number: string;
  encrypted_id: string;
  supplier_id: number;
  supplier?: Supplier;
  order_date: string;
  expected_delivery_date: string | null;
  status: "draft" | "pending" | "approved" | "received" | "cancelled";
  total_amount: number;
  created_at: string;
  updated_at: string;
}

interface FilterState {
  search: string;
  status: "all" | "draft" | "pending" | "approved" | "received" | "cancelled";
  supplier: "all" | string;
}

interface Statistics {
  totalOrders: number;
  draftOrders: number;
  pendingOrders: number;
  approvedOrders: number;
  receivedOrders: number;
  cancelledOrders: number;
  totalValue: number;
}

interface User {
  businesses_one?: Array<{
    currency?: string;
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

const formatCurrency = (amount: number, currencySymbol: string = "$"): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount).replace(/^\$/, currencySymbol);
};

// ==============================================
// Custom Hooks
// ==============================================

const useDebounce = <T,>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
};

// ==============================================
// Sub-components
// ==============================================

const StatCard: React.FC<{
  title: string;
  value: string | number;
  icon: React.ElementType;
  color: "gray" | "amber" | "rose" | "blue" | "emerald";
}> = ({ title, value, icon: Icon, color }) => {
  const colorClasses = {
    gray: "bg-gray-50 text-gray-700",
    amber: "bg-amber-50 text-amber-700",
    rose: "bg-rose-50 text-rose-700",
    blue: "bg-blue-50 text-blue-700",
    emerald: "bg-emerald-50 text-emerald-700",
  };
  return (
    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all group">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-gray-500 truncate">{title}</p>
          <p className="text-xl font-bold text-gray-900 mt-0.5">{value}</p>
        </div>
        <div
          className={`w-10 h-10 flex-shrink-0 ${colorClasses[color]} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
};

const StatusBadge: React.FC<{ status: PurchaseOrder["status"] }> = ({ status }) => {
  const config: Record<
    PurchaseOrder["status"],
    { label: string; icon: React.ElementType; color: string }
  > = {
    draft: { label: "Draft", icon: FileText, color: "text-gray-700 bg-gray-50 border-gray-200" },
    pending: { label: "Pending", icon: Clock, color: "text-amber-700 bg-amber-50 border-amber-200" },
    approved: { label: "Approved", icon: CheckCircle, color: "text-blue-700 bg-blue-50 border-blue-200" },
    received: { label: "Received", icon: Package, color: "text-emerald-700 bg-emerald-50 border-emerald-200" },
    cancelled: { label: "Cancelled", icon: X, color: "text-rose-700 bg-rose-50 border-rose-200" },
  };

  const { label, color, icon: Icon } = config[status];

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${color}`}>
      <Icon className="h-3 w-3" />
      {label}
    </span>
  );
};

const FilterChip: React.FC<{
  label: string;
  active?: boolean;
  onClick?: () => void;
}> = ({ label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`px-3 py-1.5 text-sm rounded-full transition-colors whitespace-nowrap flex-shrink-0 ${
      active ? "bg-gray-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
    }`}
  >
    {label}
  </button>
);

const EmptyState: React.FC<{
  title: string;
  description: string;
  icon: React.ElementType;
  action?: { label: string; onClick?: () => void; href?: string };
}> = ({ title, description, icon: Icon, action }) => (
  <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 sm:p-12">
    <div className="flex flex-col items-center text-center max-w-md mx-auto">
      <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
        <Icon className="h-8 w-8 sm:h-10 sm:w-10 text-gray-400" />
      </div>
      <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-500 text-sm mb-6">{description}</p>
      {action &&
        (action.href ? (
          <Link
            href={action.href}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-lg hover:from-gray-700 hover:to-gray-800 transition-all shadow-lg shadow-gray-500/25 text-sm"
          >
            <Plus className="h-4 w-4" />
            {action.label}
          </Link>
        ) : (
          <button
            onClick={action.onClick}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-lg hover:from-gray-700 hover:to-gray-800 transition-all shadow-lg shadow-gray-500/25 text-sm"
          >
            <Plus className="h-4 w-4" />
            {action.label}
          </button>
        ))}
    </div>
  </div>
);

const LoadingState: React.FC = () => (
  <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12">
    <div className="flex flex-col items-center justify-center">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-gray-500/20 border-t-gray-600 rounded-full animate-spin" />
        <Package className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-gray-600/60" />
      </div>
      <p className="mt-4 text-gray-600 font-medium">Loading purchase orders...</p>
      <p className="text-gray-400 text-sm mt-1">Please wait a moment</p>
    </div>
  </div>
);

const DeleteModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  poNumber: string;
  isSubmitting: boolean;
}> = ({ isOpen, onClose, onConfirm, poNumber, isSubmitting }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="p-6">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="w-16 h-16 flex items-center justify-center rounded-2xl bg-rose-50 border border-rose-200">
              <AlertTriangle className="w-7 h-7 text-rose-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Delete Purchase Order</h2>
              <p className="text-gray-600 text-sm leading-relaxed">
                Are you sure you want to delete{" "}
                <span className="font-semibold text-gray-900">{poNumber}</span>? This action cannot be undone.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row justify-center gap-3 w-full">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-6 py-3 rounded-lg border border-gray-300 bg-white text-gray-700 font-medium hover:bg-gray-50 transition disabled:opacity-50 order-2 sm:order-1"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onConfirm}
                className="w-full sm:w-auto px-6 py-3 rounded-lg bg-gradient-to-r from-rose-600 to-rose-700 text-white font-medium flex items-center justify-center gap-2 hover:from-rose-700 hover:to-rose-800 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-rose-500/25 order-1 sm:order-2"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    Delete Order
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Pagination: React.FC<{
  currentPage: number;
  totalPages: number;
  totalItems: number;
  startIndex: number;
  endIndex: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (items: number) => void;
}> = ({
  currentPage,
  totalPages,
  totalItems,
  startIndex,
  endIndex,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
}) => {
  const pages: (number | string)[] = [];
  
  if (totalPages <= 5) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    let start = Math.max(2, currentPage - 1);
    let end = Math.min(totalPages - 1, currentPage + 1);
    if (currentPage <= 3) end = Math.min(4, totalPages - 1);
    if (currentPage >= totalPages - 2) start = Math.max(totalPages - 3, 2);
    if (start > 2) pages.push("...");
    for (let i = start; i <= end; i++) pages.push(i);
    if (end < totalPages - 1) pages.push("...");
    if (totalPages > 1) pages.push(totalPages);
  }

  if (totalPages <= 1) return null;

  return (
    <div className="px-4 sm:px-6 py-4 border-t border-gray-200 bg-gray-50/30 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Show</span>
          <select
            value={itemsPerPage}
            onChange={(e) => {
              onItemsPerPageChange(Number(e.target.value));
              onPageChange(1);
            }}
            className="px-2 py-1 text-sm border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-gray-500/20 focus:border-gray-500 outline-none"
          >
            {[10, 25, 50, 100].map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </div>
        <span className="text-sm text-gray-500">
          {startIndex + 1}–{endIndex} of {totalItems}
        </span>
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className="p-1.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronsLeft className="h-4 w-4" />
        </button>
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-1.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        {pages.map((page, i) => (
          <React.Fragment key={i}>
            {page === "..." ? (
              <span className="px-2 py-1.5 text-gray-400 text-sm">...</span>
            ) : (
              <button
                onClick={() => onPageChange(page as number)}
                className={`min-w-[2rem] h-8 flex items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                  currentPage === page
                    ? "bg-gray-600 text-white"
                    : "text-gray-700 hover:bg-gray-100 border border-gray-300"
                }`}
              >
                {page}
              </button>
            )}
          </React.Fragment>
        ))}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-1.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className="p-1.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronsRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

const FilterDrawer: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  filters: FilterState;
  totalItems: number;
  onFilterChange: <K extends keyof FilterState>(key: K, value: FilterState[K]) => void;
  onClearFilters: () => void;
  activeFilterCount: number;
  suppliers: Supplier[];
}> = ({
  isOpen,
  onClose,
  filters,
  totalItems,
  onFilterChange,
  onClearFilters,
  activeFilterCount,
  suppliers,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-full sm:w-80 bg-white shadow-2xl">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-gray-600" />
            <h3 className="font-semibold text-gray-900">Filters</h3>
            {activeFilterCount > 0 && (
              <span className="ml-1 px-2 py-0.5 text-xs bg-gray-600 text-white rounded-full">
                {activeFilterCount}
              </span>
            )}
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition">
            <X size={18} />
          </button>
        </div>
        <div className="overflow-y-auto h-[calc(100vh-140px)] p-4 space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 block">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => onFilterChange("status", e.target.value as FilterState["status"])}
              className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-500/20 focus:border-gray-500 outline-none"
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="received">Received</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 block">
              Supplier
            </label>
            <select
              value={filters.supplier}
              onChange={(e) => onFilterChange("supplier", e.target.value)}
              className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-500/20 focus:border-gray-500 outline-none"
            >
              <option value="all">All Suppliers</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id.toString()}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-gray-50/50">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-gray-600">
              <span className="font-semibold">{totalItems}</span> orders found
            </p>
            {activeFilterCount > 0 && (
              <button
                onClick={onClearFilters}
                className="text-sm text-gray-600 hover:text-gray-700 font-medium inline-flex items-center gap-1"
              >
                <FilterX size={13} />
                Clear all
              </button>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-full px-4 py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-lg hover:from-gray-700 hover:to-gray-800 transition-colors font-medium text-sm"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
};

// Mobile Card Component
const PurchaseOrderMobileCard: React.FC<{
  order: PurchaseOrder;
  onView: (order: PurchaseOrder) => void;
  onEdit: (order: PurchaseOrder) => void;
  onDelete: (order: PurchaseOrder) => void;
  onUpdateStatus: (id: number, status: PurchaseOrder["status"]) => void;
  isOpen: boolean;
  onToggleOpen: (id: number | null) => void;
  isSubmitting: boolean;
  formatCurrency: (amount: number) => string;
}> = ({
  order,
  onView,
  onEdit,
  onDelete,
  onUpdateStatus,
  isOpen,
  onToggleOpen,
  isSubmitting,
  formatCurrency,
}) => (
  <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
    <div className="flex items-start justify-between gap-3">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="w-10 h-10 flex-shrink-0 bg-gradient-to-br from-gray-100 to-gray-50 rounded-xl flex items-center justify-center border border-gray-200/50">
          <Package className="h-5 w-5 text-gray-600" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-gray-900 truncate text-sm">{order.po_number}</p>
          <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
            <Building2 className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">{order.supplier?.name || "N/A"}</span>
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <StatusBadge status={order.status} />
        <div className="relative">
          <button
            onClick={() => onToggleOpen(isOpen ? null : order.id)}
            className="p-2 rounded-lg hover:bg-gray-100 transition text-gray-400 hover:text-gray-600"
            disabled={isSubmitting}
          >
            <MoreVertical size={16} />
          </button>
          {isOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => onToggleOpen(null)} />
              <div className="absolute right-0 top-9 z-40 w-52 bg-white border border-gray-200 rounded-xl shadow-lg">
                {/* View Purchase Order - Always visible */}
                <button
                  onClick={() => {
                    onView(order);
                    onToggleOpen(null);
                  }}
                  className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition border-b border-gray-100"
                >
                  <Eye size={15} className="text-gray-600" />
                  View Purchase Order
                </button>
                {/* Edit - Only for draft */}
                {order.status === "draft" && (
                  <button
                    onClick={() => {
                      onEdit(order);
                      onToggleOpen(null);
                    }}
                    className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition border-b border-gray-100"
                  >
                    <Edit size={15} className="text-gray-600" />
                    Edit Order
                  </button>
                )}
                {/* Approve - Only for pending */}
                {order.status === "pending" && (
                  <button
                    onClick={() => {
                      onUpdateStatus(order.id, "approved");
                      onToggleOpen(null);
                    }}
                    className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-blue-700 hover:bg-blue-50 transition border-b border-gray-100"
                  >
                    <CheckCircle size={15} />
                    Approve
                  </button>
                )}
                {/* Mark Received - Only for approved */}
                {order.status === "approved" && (
                  <button
                    onClick={() => {
                      onUpdateStatus(order.id, "received");
                      onToggleOpen(null);
                    }}
                    className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-emerald-700 hover:bg-emerald-50 transition border-b border-gray-100"
                  >
                    <Package size={15} />
                    Mark Received
                  </button>
                )}
                {/* Delete - Only for draft or pending */}
                {(order.status === "draft" || order.status === "pending") && (
                  <button
                    onClick={() => {
                      onDelete(order);
                      onToggleOpen(null);
                    }}
                    className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50 transition rounded-b-xl"
                  >
                    <Trash2 size={15} />
                    Delete
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
    <div className="mt-3 space-y-1.5">
      <p className="text-xs text-gray-600 flex items-start gap-1.5">
        <Calendar className="h-3.5 w-3.5 text-gray-400 flex-shrink-0 mt-0.5" />
        <span>Order: {formatDate(order.order_date)}</span>
      </p>
      {order.expected_delivery_date && (
        <p className="text-xs text-gray-600 flex items-start gap-1.5">
          <Truck className="h-3.5 w-3.5 text-gray-400 flex-shrink-0 mt-0.5" />
          <span>Expected: {formatDate(order.expected_delivery_date)}</span>
        </p>
      )}
      <p className="text-xs text-gray-600 flex items-start gap-1.5">
        <span className="font-medium">Total:</span>
        <span>{formatCurrency(order.total_amount)}</span>
      </p>
    </div>
  </div>
);

// Desktop Table Row Component
const PurchaseOrderTableRow: React.FC<{
  order: PurchaseOrder;
  index: number;
  onView: (order: PurchaseOrder) => void;
  onEdit: (order: PurchaseOrder) => void;
  onDelete: (order: PurchaseOrder) => void;
  onUpdateStatus: (id: number, status: PurchaseOrder["status"]) => void;
  isOpen: boolean;
  onToggleOpen: (id: number | null) => void;
  isSubmitting: boolean;
  formatCurrency: (amount: number) => string;
}> = ({
  order,
  index,
  onView,
  onEdit,
  onDelete,
  onUpdateStatus,
  isOpen,
  onToggleOpen,
  isSubmitting,
  formatCurrency,
}) => (
  <tr className="hover:bg-gray-50/50 transition-colors group">
    <td className="px-4 py-3 text-center">
      <span className="text-sm text-gray-500">{index + 1}</span>
    </td>
    <td className="px-4 py-3">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 bg-gradient-to-br from-gray-100 to-gray-50 rounded-lg flex items-center justify-center flex-shrink-0 border border-gray-200/50">
          <Package className="h-4 w-4 text-gray-600" />
        </div>
        <span className="font-mono text-sm font-medium text-gray-900">{order.po_number}</span>
      </div>
    </td>
    <td className="px-4 py-3">
      <div className="flex items-center gap-1.5">
        <Building2 className="h-4 w-4 text-gray-400" />
        <span className="text-sm text-gray-700">{order.supplier?.name || "N/A"}</span>
      </div>
    </td>
    <td className="px-4 py-3">
      <span className="text-sm text-gray-600">{formatDate(order.order_date)}</span>
    </td>
    <td className="px-4 py-3">
      <span className="text-sm text-gray-600">{formatDate(order.expected_delivery_date)}</span>
    </td>
    <td className="px-4 py-3 text-right">
      <span className="font-semibold text-gray-900">{formatCurrency(order.total_amount)}</span>
    </td>
    <td className="px-4 py-3 whitespace-nowrap">
      <StatusBadge status={order.status} />
    </td>
    <td className="px-4 py-3 text-center relative whitespace-nowrap">
      <button
        onClick={() => onToggleOpen(isOpen ? null : order.id)}
        className="p-1.5 rounded-lg hover:bg-gray-100 transition text-gray-400 hover:text-gray-600 disabled:opacity-50"
        disabled={isSubmitting}
      >
        <MoreVertical size={16} />
      </button>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => onToggleOpen(null)} />
          <div className="absolute right-4 z-40 w-52 bg-white border border-gray-200 rounded-xl shadow-lg">
            {/* View Purchase Order - Always visible */}
            <button
              onClick={() => {
                onView(order);
                onToggleOpen(null);
              }}
              className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition border-b border-gray-100"
            >
              <Eye size={15} className="text-gray-600" />
              View Purchase Order
            </button>
            {/* Edit - Only for draft */}
            {order.status === "draft" && (
              <button
                onClick={() => {
                  onEdit(order);
                  onToggleOpen(null);
                }}
                className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition border-b border-gray-100"
              >
                <Edit size={15} className="text-gray-600" />
                Edit Order
              </button>
            )}
            {/* Approve - Only for pending */}
            {order.status === "pending" && (
              <button
                onClick={() => {
                  onUpdateStatus(order.id, "approved");
                  onToggleOpen(null);
                }}
                className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-blue-700 hover:bg-blue-50 transition border-b border-gray-100"
              >
                <CheckCircle size={15} />
                Approve
              </button>
            )}
            {/* Mark Received - Only for approved */}
            {order.status === "approved" && (
              <button
                onClick={() => {
                  onUpdateStatus(order.id, "received");
                  onToggleOpen(null);
                }}
                className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-emerald-700 hover:bg-emerald-50 transition border-b border-gray-100"
              >
                <Package size={15} />
                Mark Received
              </button>
            )}
            {/* Delete - Only for draft or pending */}
            {(order.status === "draft" || order.status === "pending") && (
              <button
                onClick={() => {
                  onDelete(order);
                  onToggleOpen(null);
                }}
                className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50 transition rounded-b-xl"
              >
                <Trash2 size={15} />
                Delete
              </button>
            )}
          </div>
        </>
      )}
    </td>
  </tr>
);

// ==============================================
// Main Component
// ==============================================

const PurchaseOrdersPage = ({ user }: { user: User }) => {
  const router = useRouter();
  const currencySymbol = user?.businesses_one?.[0]?.currency || "$";
  const formatCurr = (amount: number) => formatCurrency(amount, currencySymbol);

  // State
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [openRow, setOpenRow] = useState<number | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");

  const [filters, setFilters] = useState<FilterState>({
    search: "",
    status: "all",
    supplier: "all",
  });

  const debouncedSearch = useDebounce(filters.search, 300);

  // Fetch data
  useEffect(() => {
    fetchPurchaseOrders();
    fetchSuppliers();
  }, []);

  const fetchPurchaseOrders = async () => {
    setIsLoading(true);
    try {
      const res = await apiGet("/product_purchase", {}, false);
      const ordersArray = Array.isArray(res.data?.data) ? res.data.data : Array.isArray(res.data) ? res.data : [];

      const mappedOrders: PurchaseOrder[] = ordersArray.map((order: any) => ({
        id: order.id,
        encrypted_id: order.encrypted_id,
        po_number: order.order_number || `PO-${order.id}`,
        supplier_id: order.vendors_id,
        supplier: order.vendor ? {
          id: order.vendor.id,
          name: order.vendor.vendor_name,
          email: order.vendor.email,
          phone: order.vendor.phone,
          contact_person: order.vendor.contact_person,
        } : undefined,
        order_date: order.order_date,
        expected_delivery_date: order.expected_delivery_date,
        status: order.status || "pending",
        total_amount: parseFloat(order.total_amount) || 0,
        created_at: order.created_at,
        updated_at: order.updated_at,
      }));

      setOrders(mappedOrders);
    } catch {
      toast.error("Failed to fetch purchase orders");
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const res = await apiGet("/vendors", {}, false);
      const suppliersArray = Array.isArray(res.data?.data) ? res.data.data : Array.isArray(res.data) ? res.data : [];
      const mappedSuppliers: Supplier[] = suppliersArray.map((vendor: any) => ({
        id: vendor.id,
        name: vendor.vendor_name,
        email: vendor.email,
        phone: vendor.phone,
        contact_person: vendor.contact_person,
      }));
      setSuppliers(mappedSuppliers);
    } catch {
      setSuppliers([]);
    }
  };

  const handleRefresh = () => {
    fetchPurchaseOrders();
    toast.success("Data refreshed");
  };

  const handleDelete = async () => {
    if (isSubmitting || !selectedOrder) return;
    setIsSubmitting(true);
    try {
      await apiDelete(`/product_purchase/${selectedOrder.id}`);
      setOrders((prev) => prev.filter((o) => o.id !== selectedOrder.id));
      toast.success("Purchase order deleted");
      setDeleteModalOpen(false);
      setSelectedOrder(null);
    } catch {
      toast.error("Failed to delete");
      fetchPurchaseOrders();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = async (id: number, status: PurchaseOrder["status"]) => {
    try {
      await apiPut(`/product_purchase/${id}`, { status });
      setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
      toast.success(`Status updated to ${status}`);
    } catch {
      toast.error("Failed to update status");
    }
  };

  const handleView = (order: PurchaseOrder) => {
    router.push(`/purchaselist/${order.encrypted_id}`);
  };

  const handleEdit = (order: PurchaseOrder) => {
    router.push(`/purchase-orders/edit/${order.encrypted_id}`);
  };

  const handleFilterChange = <K extends keyof FilterState>(
    key: K,
    value: FilterState[K]
  ) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({ search: "", status: "all", supplier: "all" });
    setCurrentPage(1);
  };

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.status !== "all") count++;
    if (filters.supplier !== "all") count++;
    if (filters.search) count++;
    return count;
  }, [filters]);

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return orders
      .filter((order) => {
        const matchesSearch =
          !debouncedSearch ||
          order.po_number.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
          order.supplier?.name?.toLowerCase().includes(debouncedSearch.toLowerCase());

        const matchesStatus = filters.status === "all" || order.status === filters.status;
        const matchesSupplier =
          filters.supplier === "all" || order.supplier_id.toString() === filters.supplier;

        return matchesSearch && matchesStatus && matchesSupplier;
      })
      .sort((a, b) => new Date(b.order_date).getTime() - new Date(a.order_date).getTime());
  }, [orders, debouncedSearch, filters]);

  // Pagination
  const totalItems = filteredOrders.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const currentOrders = filteredOrders.slice(startIndex, endIndex);

  // Statistics
  const statistics = useMemo((): Statistics => {
    return {
      totalOrders: orders.length,
      draftOrders: orders.filter((o) => o.status === "draft").length,
      pendingOrders: orders.filter((o) => o.status === "pending").length,
      approvedOrders: orders.filter((o) => o.status === "approved").length,
      receivedOrders: orders.filter((o) => o.status === "received").length,
      cancelledOrders: orders.filter((o) => o.status === "cancelled").length,
      totalValue: orders.reduce((sum, o) => sum + o.total_amount, 0),
    };
  }, [orders]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sticky Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm w-full mt-0">
        <div className="max-w-screen-xl mx-auto px-3 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <Link
                href="/dashboard"
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div className="min-w-0">
                <h1 className="text-lg sm:text-2xl font-bold text-gray-900 truncate">Purchase Orders</h1>
                <p className="text-xs text-gray-500 hidden sm:block">Manage and track your purchase orders</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
              <button
                onClick={() => setViewMode(viewMode === "table" ? "grid" : "table")}
                className="hidden md:flex p-2.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
                title={viewMode === "table" ? "Grid view" : "Table view"}
              >
                {viewMode === "table" ? <Grid3x3 className="h-4 w-4" /> : <List className="h-4 w-4" />}
              </button>
              <button
                onClick={handleRefresh}
                className="p-2.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
                title="Refresh"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
              <Link
                href="/purchase-orders"
                className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2.5 bg-gradient-to-r from-gray-600 to-gray-700 text-white text-sm font-medium rounded-lg hover:from-gray-700 hover:to-gray-800 transition-all shadow-lg shadow-gray-500/25"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Create PO</span>
                <span className="sm:hidden">Add</span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-screen-xl mx-auto px-3 sm:px-6 py-4 sm:py-6">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3 mb-5">
          <StatCard title="Total Orders" value={statistics.totalOrders} icon={ShoppingCart} color="gray" />
          <StatCard title="Draft" value={statistics.draftOrders} icon={FileText} color="gray" />
          <StatCard title="Pending" value={statistics.pendingOrders} icon={Clock} color="amber" />
          <StatCard title="Approved" value={statistics.approvedOrders} icon={CheckCircle} color="blue" />
          <StatCard title="Received" value={statistics.receivedOrders} icon={Package} color="emerald" />
          <StatCard title="Total Value" value={formatCurr(statistics.totalValue)} icon={Truck} color="rose" />
        </div>

        {/* Search + Filter */}
        <div className="flex gap-2 mb-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4 pointer-events-none" />
            <input
              type="text"
              value={filters.search}
              onChange={(e) => handleFilterChange("search", e.target.value)}
              placeholder="Search by PO number or supplier..."
              className="w-full pl-9 pr-9 py-2.5 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-500/20 focus:border-gray-500 outline-none transition placeholder-gray-400 text-sm"
            />
            {filters.search && (
              <button
                onClick={() => handleFilterChange("search", "")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <button
            onClick={() => setFilterDrawerOpen(true)}
            className="relative inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors shadow-sm text-sm font-medium text-gray-700 flex-shrink-0"
          >
            <Filter className="h-4 w-4 text-gray-600" />
            <span className="hidden sm:inline">Filters</span>
            {activeFilterCount > 0 && (
              <span className="absolute -top-2 -right-2 w-5 h-5 bg-gray-600 text-white text-xs rounded-full flex items-center justify-center font-medium">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* Filter chips */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1 -mx-3 px-3 sm:mx-0 sm:px-0 sm:flex-wrap [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <FilterChip
            label="All"
            active={filters.status === "all" && filters.supplier === "all"}
            onClick={clearFilters}
          />
          <FilterChip
            label="Draft"
            active={filters.status === "draft"}
            onClick={() => handleFilterChange("status", filters.status === "draft" ? "all" : "draft")}
          />
          <FilterChip
            label="Pending"
            active={filters.status === "pending"}
            onClick={() => handleFilterChange("status", filters.status === "pending" ? "all" : "pending")}
          />
          <FilterChip
            label="Approved"
            active={filters.status === "approved"}
            onClick={() => handleFilterChange("status", filters.status === "approved" ? "all" : "approved")}
          />
          <FilterChip
            label="Received"
            active={filters.status === "received"}
            onClick={() => handleFilterChange("status", filters.status === "received" ? "all" : "received")}
          />
        </div>

        {/* Count + mobile view toggle */}
        <div className="mb-3 flex items-center justify-between">
          <span className="text-xs sm:text-sm text-gray-500">
            Showing <span className="font-semibold text-gray-800">{startIndex + 1}–{endIndex}</span> of{" "}
            <span className="font-semibold text-gray-800">{totalItems}</span> orders
          </span>
          <div className="flex md:hidden items-center gap-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === "table" ? "bg-white shadow-sm text-gray-600" : "text-gray-500"
              }`}
            >
              <List className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === "grid" ? "bg-white shadow-sm text-gray-600" : "text-gray-500"
              }`}
            >
              <Grid3x3 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Loading */}
        {isLoading && <LoadingState />}

        {/* Empty */}
        {!isLoading && currentOrders.length === 0 && (
          <EmptyState
            title={filters.search ? "No orders found" : "No purchase orders"}
            description={
              filters.search
                ? "Try adjusting your search or filters"
                : "Get started by creating your first purchase order"
            }
            icon={ShoppingCart}
            action={
              filters.search
                ? { label: "Clear Filters", onClick: clearFilters }
                : { label: "Create Purchase Order", href: "/purchase-orders" }
            }
          />
        )}

        {/* TABLE VIEW */}
        {!isLoading && currentOrders.length > 0 && viewMode === "table" && (
          <>
            {/* Mobile: card stack */}
            <div className="md:hidden space-y-3">
              {currentOrders.map((order) => (
                <PurchaseOrderMobileCard
                  key={order.id}
                  order={order}
                  onView={handleView}
                  onEdit={handleEdit}
                  onDelete={(o) => {
                    setSelectedOrder(o);
                    setDeleteModalOpen(true);
                  }}
                  onUpdateStatus={handleUpdateStatus}
                  isOpen={openRow === order.id}
                  onToggleOpen={setOpenRow}
                  isSubmitting={isSubmitting}
                  formatCurrency={formatCurr}
                />
              ))}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={totalItems}
                  startIndex={startIndex}
                  endIndex={endIndex}
                  itemsPerPage={itemsPerPage}
                  onPageChange={setCurrentPage}
                  onItemsPerPageChange={setItemsPerPage}
                />
              </div>
            </div>

            {/* Desktop: table */}
            <div className="hidden md:block bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] divide-y divide-gray-100">
                  <thead>
                    <tr className="bg-gray-50">
                      {["#", "PO #", "Supplier", "Order Date", "Expected", "Total", "Status", "Actions"].map((h) => (
                        <th
                          key={h}
                          className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {currentOrders.map((order, i) => (
                      <PurchaseOrderTableRow
                      key={`${order.id}-${order.order_number}`}
                        order={order}
                        index={startIndex + i}
                        onView={handleView}
                        onEdit={handleEdit}
                        onDelete={(o) => {
                          setSelectedOrder(o);
                          setDeleteModalOpen(true);
                        }}
                        onUpdateStatus={handleUpdateStatus}
                        isOpen={openRow === order.id}
                        onToggleOpen={setOpenRow}
                        isSubmitting={isSubmitting}
                        formatCurrency={formatCurr}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalItems}
                startIndex={startIndex}
                endIndex={endIndex}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
                onItemsPerPageChange={setItemsPerPage}
              />
            </div>
          </>
        )}
      </main>

      {/* Filter Drawer */}
      <FilterDrawer
        isOpen={filterDrawerOpen}
        onClose={() => setFilterDrawerOpen(false)}
        filters={filters}
        totalItems={totalItems}
        onFilterChange={handleFilterChange}
        onClearFilters={clearFilters}
        activeFilterCount={activeFilterCount}
        suppliers={suppliers}
      />

      {/* Delete Modal */}
      <DeleteModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setSelectedOrder(null);
        }}
        onConfirm={handleDelete}
        poNumber={selectedOrder?.po_number || ""}
        isSubmitting={isSubmitting}
      />
    </div>
  );
};

export default withAuth(PurchaseOrdersPage);