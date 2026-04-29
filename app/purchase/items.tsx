"use client";

import { withAuth } from "@/hoc/withAuth";
import { apiGet, apiPut, apiDelete } from "@/lib/axios";
import React, { useState, useEffect, useMemo } from "react";
import {
  Plus,
  Search,
  MoreHorizontal,
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
  TrendingUp,
  TrendingDown,
  DollarSign,
  BarChart3,
  Download,
  Upload,
  SlidersHorizontal,
  CheckCheck,
  Ban,
  Send,
  MapPin,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
}

interface Location {
  id: number;
  location_id: string;
  name: string;
  location_name: string;
}

interface PurchaseOrder {
  id: number;
  po_number: string;
  order_number: string;
  encrypted_id: string;
  supplier_id: number;
  vendor_id?: number;
  supplier?: Supplier;
  location_id?: number;
  location_uuid?: string;
  location?: Location;
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
  location: "all" | string;
  dateFrom: string;
  dateTo: string;
}

interface Statistics {
  totalOrders: number;
  draftOrders: number;
  pendingOrders: number;
  approvedOrders: number;
  receivedOrders: number;
  cancelledOrders: number;
  totalValue: number;
  monthlyChange: number;
}

interface User {
  businesses_one?: Array<{
    currency?: string;
  }>;

  user_roles?: {
    purchase_create?: string;
    [key: string]: string | undefined;
  };
  
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
  trend?: number;
  color: "slate" | "amber" | "rose" | "blue" | "emerald";
}> = ({ title, value, icon: Icon, trend, color }) => {
  const gradients = {
    slate: "from-slate-500 to-slate-600",
    amber: "from-amber-500 to-amber-600",
    rose: "from-rose-500 to-rose-600",
    blue: "from-blue-500 to-blue-600",
    emerald: "from-emerald-500 to-emerald-600",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      className="bg-white rounded-xl shadow-sm border border-gray-100 p-3.5 transition-all hover:shadow-md"
    >
      <div className="flex items-start justify-between mb-2">
        <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${gradients[color]} flex items-center justify-center shadow-md`}>
          <Icon className="h-4 w-4 text-white" />
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-0.5 text-[10px] font-medium ${trend >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {trend >= 0 ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
            <span>{Math.abs(trend)}%</span>
          </div>
        )}
      </div>
      <p className="text-xs text-gray-500 mb-0.5">{title}</p>
      <p className="text-lg font-bold text-gray-900">{value}</p>
    </motion.div>
  );
};

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
      label: "Pending", 
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
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gradient-to-r ${gradient} text-white shadow-sm`}>
      <Icon className="h-3 w-3" />
      {label}
    </span>
  );
};

const FilterChip: React.FC<{
  label: string;
  icon?: React.ElementType;
  active?: boolean;
  onClick?: () => void;
  onRemove?: () => void;
}> = ({ label, icon: Icon, active, onClick, onRemove }) => (
  <motion.div
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all cursor-pointer ${
      active 
        ? 'bg-gray-900 text-white shadow-md' 
        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
    }`}
    role="button"
    tabIndex={0}
    onKeyDown={(e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onClick?.();
      }
    }}
  >
    {Icon && <Icon className="h-3.5 w-3.5" />}
    {label}
    {active && onRemove && (
      <span
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="ml-1 p-0.5 hover:bg-white/20 rounded-full transition-colors cursor-pointer"
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.stopPropagation();
            e.preventDefault();
            onRemove();
          }
        }}
      >
        <X className="h-3 w-3" />
      </span>
    )}
  </motion.div>
);

const EmptyState: React.FC<{
  title: string;
  description: string;
  icon: React.ElementType;
  action?: { label: string; onClick?: () => void; href?: string };
}> = ({ title, description, icon: Icon, action }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12"
  >
    <div className="flex flex-col items-center text-center max-w-md mx-auto">
      <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl flex items-center justify-center mb-6">
        <Icon className="h-12 w-12 text-gray-400" />
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-500 mb-8">{description}</p>
      {action &&
        (action.href ? (
          <Link
            href={action.href}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-gray-900 to-gray-800 text-white rounded-xl hover:from-gray-800 hover:to-gray-700 transition-all shadow-lg shadow-gray-900/20 font-medium"
          >
            <Plus className="h-4 w-4" />
            {action.label}
          </Link>
        ) : (
          <button
            onClick={action.onClick}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-gray-900 to-gray-800 text-white rounded-xl hover:from-gray-800 hover:to-gray-700 transition-all shadow-lg shadow-gray-900/20 font-medium"
          >
            <Plus className="h-4 w-4" />
            {action.label}
          </button>
        ))}
    </div>
  </motion.div>
);

const LoadingState: React.FC = () => (
  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12">
    <div className="flex flex-col items-center justify-center">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        className="w-16 h-16 mb-4"
      >
        <div className="w-full h-full rounded-full border-4 border-gray-200 border-t-gray-900" />
      </motion.div>
      <p className="text-gray-600 font-medium">Loading purchase orders...</p>
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
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-rose-100 rounded-2xl flex items-center justify-center mb-4">
                  <AlertTriangle className="w-8 h-8 text-rose-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Delete Purchase Order</h2>
                <p className="text-gray-600 mb-6">
                  Are you sure you want to delete{" "}
                  <span className="font-semibold text-gray-900">{poNumber}</span>? This action cannot be undone.
                </p>
                <div className="flex gap-3 w-full">
                  <button
                    onClick={onClose}
                    className="flex-1 px-4 py-3 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={onConfirm}
                    className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 text-white font-medium hover:from-rose-600 hover:to-rose-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
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
                        Delete
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
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
  
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    let start = Math.max(2, currentPage - 2);
    let end = Math.min(totalPages - 1, currentPage + 2);
    
    if (currentPage <= 4) {
      start = 2;
      end = 5;
    }
    if (currentPage >= totalPages - 3) {
      start = totalPages - 4;
      end = totalPages - 1;
    }
    
    if (start > 2) pages.push("...");
    for (let i = start; i <= end; i++) pages.push(i);
    if (end < totalPages - 1) pages.push("...");
    if (totalPages > 1) pages.push(totalPages);
  }

  if (totalPages <= 1) return null;

  return (
    <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Show</span>
          <select
            value={itemsPerPage}
            onChange={(e) => {
              onItemsPerPageChange(Number(e.target.value));
              onPageChange(1);
            }}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-gray-500/20 focus:border-gray-500 outline-none"
          >
            {[10, 25, 50, 100].map((v) => (
              <option key={v} value={v}>{v}</option>
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
          className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronsLeft className="h-4 w-4" />
        </button>
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        
        {pages.map((page, i) => (
          <React.Fragment key={i}>
            {page === "..." ? (
              <span className="px-2 text-gray-400">...</span>
            ) : (
              <button
                onClick={() => onPageChange(page as number)}
                className={`min-w-[2.25rem] h-9 flex items-center justify-center rounded-lg text-sm font-medium transition-all ${
                  currentPage === page
                    ? "bg-gray-900 text-white shadow-md"
                    : "text-gray-700 hover:bg-gray-100"
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
          className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
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
  locations: Location[];
}> = ({
  isOpen,
  onClose,
  filters,
  totalItems,
  onFilterChange,
  onClearFilters,
  activeFilterCount,
  suppliers,
  locations,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30 }}
            className="fixed right-0 top-0 h-full w-full sm:w-96 bg-white shadow-2xl z-50"
          >
            <div className="flex flex-col h-full">
              <div className="px-6 py-5 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center">
                      <SlidersHorizontal className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">Filters</h3>
                      {activeFilterCount > 0 && (
                        <p className="text-xs text-gray-500">{activeFilterCount} active</p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Status Filter */}
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 block">
                    Status
                  </label>
                  <div className="space-y-2">
                    {["all", "draft", "pending", "approved", "received", "cancelled"].map((status) => (
                      <button
                        key={status}
                        onClick={() => onFilterChange("status", status as FilterState["status"])}
                        className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${
                          filters.status === status
                            ? 'bg-gray-900 text-white'
                            : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <span className="font-medium capitalize">{status}</span>
                        {filters.status === status && (
                          <CheckCircle className="h-4 w-4" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Supplier Filter */}
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 block">
                    <Building2 className="h-3 w-3 inline mr-1" />
                    Supplier
                  </label>
                  <select
                    value={filters.supplier}
                    onChange={(e) => onFilterChange("supplier", e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl text-sm focus:ring-2 focus:ring-gray-500 outline-none"
                  >
                    <option value="all">All Suppliers</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id.toString()}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                {/* Location Filter */}
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 block">
                    <MapPin className="h-3 w-3 inline mr-1" />
                    Location
                  </label>
                  <select
                    value={filters.location}
                    onChange={(e) => onFilterChange("location", e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl text-sm focus:ring-2 focus:ring-gray-500 outline-none"
                  >
                    <option value="all">All Locations</option>
                    {locations.map((loc) => (
                      <option key={loc.id} value={loc.location_id}>
                        {loc.location_name}
                      </option>
                    ))}
                  </select>
                </div>
                
                {/* Date Range Filter - FROM and TO */}
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 block">
                    <Calendar className="h-3 w-3 inline mr-1" />
                    Date Range
                  </label>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">From Date</label>
                      <input
                        type="date"
                        value={filters.dateFrom}
                        onChange={(e) => onFilterChange("dateFrom", e.target.value)}
                        className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl text-sm focus:ring-2 focus:ring-gray-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">To Date</label>
                      <input
                        type="date"
                        value={filters.dateTo}
                        onChange={(e) => onFilterChange("dateTo", e.target.value)}
                        className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl text-sm focus:ring-2 focus:ring-gray-500 outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="p-6 border-t border-gray-100 bg-gray-50/50">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm text-gray-600">
                    <span className="font-semibold text-gray-900">{totalItems}</span> orders found
                  </p>
                  {activeFilterCount > 0 && (
                    <button
                      onClick={onClearFilters}
                      className="text-sm text-gray-600 hover:text-gray-900 font-medium inline-flex items-center gap-1"
                    >
                      <FilterX className="h-4 w-4" />
                      Clear all
                    </button>
                  )}
                </div>
                <button
                  onClick={onClose}
                  className="w-full px-4 py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors font-medium"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

const PurchaseOrderCard: React.FC<{
  order: PurchaseOrder;
  onView: (order: PurchaseOrder) => void;
  onEdit: (order: PurchaseOrder) => void;
  onDelete: (order: PurchaseOrder) => void;
  onUpdateStatus: (id: number, status: PurchaseOrder["status"]) => void;
  formatCurrency: (amount: number) => string;
}> = ({ order, onView, onEdit, onDelete, onUpdateStatus, formatCurrency }) => {
  const [showActions, setShowActions] = useState(false);
  const statusColor = getStatusColor(order.status);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ y: -4 }}
      className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-all"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br from-${statusColor}-100 to-${statusColor}-200 flex items-center justify-center`}>
            <Package className={`h-6 w-6 text-${statusColor}-600`} />
          </div>
          <div>
            <p className="font-bold text-gray-900">{order.po_number}</p>
            <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
              <Building2 className="h-3 w-3" />
              {order.supplier?.name || "N/A"}
            </p>
            {order.location && (
              <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                <MapPin className="h-3 w-3" />
                {order.location.location_name || order.location.name}
              </p>
            )}
          </div>
        </div>
        
        <div className="relative">
          <button
            onClick={() => setShowActions(!showActions)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <MoreHorizontal className="h-4 w-4 text-gray-400" />
          </button>
          
          <AnimatePresence>
            {showActions && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setShowActions(false)} />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="absolute right-0 top-10 z-40 w-48 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden"
                >
                  <button
                    onClick={() => { onView(order); setShowActions(false); }}
                    className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition"
                  >
                    <Eye className="h-4 w-4" />
                    View Details
                  </button>
                  
                  {order.status === "draft" && (
                    <button
                      onClick={() => { onEdit(order); setShowActions(false); }}
                      className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition"
                    >
                      <Edit className="h-4 w-4" />
                      Edit Order
                    </button>
                  )}
                  
                  {order.status === "pending" && (
                    <button
                      onClick={() => { onUpdateStatus(order.id, "approved"); setShowActions(false); }}
                      className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-blue-600 hover:bg-blue-50 transition"
                    >
                      <CheckCircle className="h-4 w-4" />
                      Approve
                    </button>
                  )}
                  
                  {order.status === "approved" && (
                    <button
                      onClick={() => { onUpdateStatus(order.id, "received"); setShowActions(false); }}
                      className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-emerald-600 hover:bg-emerald-50 transition"
                    >
                      <CheckCheck className="h-4 w-4" />
                      Mark Received
                    </button>
                  )}
                  
                  {(order.status === "draft" || order.status === "pending") && (
                    <>
                      <hr className="border-gray-100" />
                      <button
                        onClick={() => { onDelete(order); setShowActions(false); }}
                        className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50 transition"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </button>
                    </>
                  )}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
      
      <div className="space-y-2 mb-4">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">Order Date</span>
          <span className="text-sm font-medium text-gray-900">{formatDate(order.order_date)}</span>
        </div>
        {order.expected_delivery_date && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">Expected</span>
            <span className="text-sm font-medium text-gray-900">{formatDate(order.expected_delivery_date)}</span>
          </div>
        )}
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">Total</span>
          <span className="text-lg font-bold text-gray-900">{formatCurrency(order.total_amount)}</span>
        </div>
      </div>
      
      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <StatusBadge status={order.status} />
        <button
          onClick={() => onView(order)}
          className="text-xs font-medium text-gray-600 hover:text-gray-900 transition-colors"
        >
          View Details →
        </button>
      </div>
    </motion.div>
  );
};

const PurchaseOrderTableRow: React.FC<{
  order: PurchaseOrder;
  index: number;
  onView: (order: PurchaseOrder) => void;
  onEdit: (order: PurchaseOrder) => void;
  onDelete: (order: PurchaseOrder) => void;
  onUpdateStatus: (id: number, status: PurchaseOrder["status"]) => void;
  formatCurrency: (amount: number) => string;
}> = ({ order, index, onView, onEdit, onDelete, onUpdateStatus, formatCurrency }) => {
  const [showActions, setShowActions] = useState(false);
  const statusColor = getStatusColor(order.status);

  return (
    <motion.tr
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="hover:bg-gray-50/50 transition-colors group"
    >
      <td className="px-6 py-4">
        <span className="text-sm text-gray-500">{index + 1}</span>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg bg-gradient-to-br from-${statusColor}-100 to-${statusColor}-200 flex items-center justify-center`}>
            <Package className={`h-5 w-5 text-${statusColor}-600`} />
          </div>
          <span className="font-mono text-sm font-semibold text-gray-900">{order.po_number}</span>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-700">{order.supplier?.name || "N/A"}</span>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-700">
            {order.location?.location_name || order.location?.name || "N/A"}
          </span>
        </div>
      </td>
      <td className="px-6 py-4">
        <span className="text-sm text-gray-600">{formatDate(order.order_date)}</span>
      </td>
      <td className="px-6 py-4">
        <span className="text-sm text-gray-600">{formatDate(order.expected_delivery_date)}</span>
      </td>
      <td className="px-6 py-4 text-right">
        <span className="font-semibold text-gray-900">{formatCurrency(order.total_amount)}</span>
      </td>
      <td className="px-6 py-4">
        <StatusBadge status={order.status} />
      </td>
      <td className="px-6 py-4 text-right">
        <div className="relative">
          <button
            onClick={() => setShowActions(!showActions)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
          >
            <MoreHorizontal className="h-4 w-4 text-gray-400" />
          </button>
          
          <AnimatePresence>
            {showActions && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setShowActions(false)} />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="absolute right-0 top-10 z-40 w-48 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden"
                >
                  <button
                    onClick={() => { onView(order); setShowActions(false); }}
                    className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition"
                  >
                    <Eye className="h-4 w-4" />
                    View Details
                  </button>

                  {(order.status === "draft" || order.status === "pending") && (
                    <>
                      <hr className="border-gray-100" />
                      <button
                        onClick={() => { onDelete(order); setShowActions(false); }}
                        className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50 transition"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </button>
                    </>
                  )}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </td>
    </motion.tr>
  );
};

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
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");

  const [filters, setFilters] = useState<FilterState>({
    search: "",
    status: "all",
    supplier: "all",
    location: "all",
    dateFrom: "",
    dateTo: "",
  });

  const debouncedSearch = useDebounce(filters.search, 300);

  // Fetch data
  useEffect(() => {
    fetchPurchaseOrders();
    fetchSuppliers();
    fetchLocations();
  }, []);

  const fetchPurchaseOrders = async () => {
    setIsLoading(true);
    try {
      const res = await apiGet("/product_purchase", {}, false);
      const ordersArray = Array.isArray(res.data?.data) ? res.data.data : Array.isArray(res.data) ? res.data : [];

      const mappedOrders: PurchaseOrder[] = ordersArray.map((order: any) => ({
        id: order.id,
        encrypted_id: order.encrypted_id || order.id,
        po_number: order.order_number || `PO-${order.id}`,
        order_number: order.order_number,
        supplier_id: order.vendors_id || order.supplier_id,
        vendor_id: order.vendors_id,
        supplier: order.vendor ? {
          id: order.vendor.id || order.vendor.vid,
          name: order.vendor.vendor_name || order.vendor.name,
          email: order.vendor.email,
          phone: order.vendor.phone,
          contact_person: order.vendor.contact_person,
        } : undefined,
        // Integer ID from order
        location_id: order.location_id,
        // UUID from nested location object
        location_uuid: order.location?.location_id || null,
        location: order.location ? {
          id: order.location.id,
          location_id: order.location.location_id,
          name: order.location.name || order.location.location_name,
          location_name: order.location.location_name || order.location.name,
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
      const vendorsData = res.data?.data?.vendors || res.data?.data || res.data || [];
      const suppliersArray = Array.isArray(vendorsData) ? vendorsData : [];
      
      const mappedSuppliers: Supplier[] = suppliersArray.map((vendor: any) => ({
        id: vendor.vid || vendor.id,
        name: vendor.vendor_name || vendor.name,
        email: vendor.email,
        phone: vendor.phone,
        contact_person: vendor.contact_person,
      }));
      setSuppliers(mappedSuppliers);
    } catch {
      setSuppliers([]);
    }
  };

  const fetchLocations = async () => {
    try {
      const res = await apiGet("/locations", {}, false);
      
      let locationsArray: any[] = [];
      
      if (res.data?.locations && Array.isArray(res.data.locations)) {
        locationsArray = res.data.locations;
      } else if (res.data?.data?.locations && Array.isArray(res.data.data.locations)) {
        locationsArray = res.data.data.locations;
      } else if (Array.isArray(res.data?.data)) {
        locationsArray = res.data.data;
      } else if (Array.isArray(res.data)) {
        locationsArray = res.data;
      }
      
      const mappedLocations: Location[] = locationsArray.map((loc: any) => ({
        id: loc.id,
        location_id: loc.location_id, // UUID
        name: loc.location_name || loc.name,
        location_name: loc.location_name || loc.name,
      }));
      
      setLocations(mappedLocations);
    } catch (error) {
      console.error("Error fetching locations:", error);
      setLocations([]);
    }
  };

  const handleRefresh = () => {
    fetchPurchaseOrders();
    // toast.success("Data refreshed");
  };

  const handleDelete = async () => {
    if (isSubmitting || !selectedOrder) return;
    setIsSubmitting(true);
    try {
      await apiDelete(`/product_purchase_delete/${selectedOrder.encrypted_id}`);
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
    setFilters({ 
      search: "", 
      status: "all", 
      supplier: "all", 
      location: "all", 
      dateFrom: "", 
      dateTo: "" 
    });
    setCurrentPage(1);
  };

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.status !== "all") count++;
    if (filters.supplier !== "all") count++;
    if (filters.location !== "all") count++;
    if (filters.dateFrom) count++;
    if (filters.dateTo) count++;
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
        
        // Match by supplier ID
        const matchesSupplier =
          filters.supplier === "all" || 
          order.supplier_id?.toString() === filters.supplier ||
          order.vendor_id?.toString() === filters.supplier;

        // Match by location UUID
        const matchesLocation =
          filters.location === "all" || 
          order.location_uuid === filters.location;

        // Date range filtering
        let matchesDateRange = true;
        if (filters.dateFrom || filters.dateTo) {
          const orderDate = new Date(order.order_date);
          orderDate.setHours(0, 0, 0, 0);
          
          if (filters.dateFrom) {
            const fromDate = new Date(filters.dateFrom);
            fromDate.setHours(0, 0, 0, 0);
            if (orderDate < fromDate) matchesDateRange = false;
          }
          
          if (filters.dateTo) {
            const toDate = new Date(filters.dateTo);
            toDate.setHours(23, 59, 59, 999);
            if (orderDate > toDate) matchesDateRange = false;
          }
        }

        return matchesSearch && matchesStatus && matchesSupplier && matchesLocation && matchesDateRange;
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
    const totalValue = orders.reduce((sum, o) => sum + o.total_amount, 0);
    const monthlyChange = 0;
    
    return {
      totalOrders: orders.length,
      draftOrders: orders.filter((o) => o.status === "draft").length,
      pendingOrders: orders.filter((o) => o.status === "pending").length,
      approvedOrders: orders.filter((o) => o.status === "approved").length,
      receivedOrders: orders.filter((o) => o.status === "received").length,
      cancelledOrders: orders.filter((o) => o.status === "cancelled").length,
      totalValue,
      monthlyChange,
    };
  }, [orders]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Sticky Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 z-40 print:hidden">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push("/dashboard")}
                className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all"
              >
                <ArrowLeft className="h-5 w-5" />
              </motion.button>
              
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Purchase Orders</h1>
                <p className="text-sm text-gray-500">Manage and track your purchase orders</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {/* View Toggle */}
              <div className="hidden md:flex items-center gap-1 bg-gray-100 rounded-xl p-1">
                <button
                  onClick={() => setViewMode("table")}
                  className={`p-2 rounded-lg transition-all ${
                    viewMode === "table" ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <List className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 rounded-lg transition-all ${
                    viewMode === "grid" ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <Grid3x3 className="h-4 w-4" />
                </button>
              </div>
              
              <button
                onClick={handleRefresh}
                className="p-2.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all"
                title="Refresh"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
              {user?.user_roles?.purchase_create === "no" && (
              <Link href="/purchase-orders">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 bg-gradient-to-r from-gray-900 to-gray-800 text-white text-sm font-medium rounded-xl hover:from-gray-800 hover:to-gray-700 transition-all shadow-lg shadow-gray-900/20"
                >
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">Create Order</span>
                  <span className="sm:hidden">Create</span>
                </motion.button>
              </Link>
)} 


            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <StatCard
            title="Total Orders"
            value={statistics.totalOrders}
            icon={ShoppingCart}
            trend={statistics.monthlyChange}
            color="slate"
          />
          <StatCard
            title="Pending Approval"
            value={statistics.pendingOrders}
            icon={Clock}
            color="amber"
          />
          <StatCard
            title="Total Value"
            value={formatCurr(statistics.totalValue)}
            icon={DollarSign}
            color="emerald"
          />
          <StatCard
            title="Received"
            value={statistics.receivedOrders}
            icon={CheckCheck}
            color="blue"
          />
        </div>

        {/* Search and Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              value={filters.search}
              onChange={(e) => handleFilterChange("search", e.target.value)}
              placeholder="Search by PO number or supplier..."
              className="w-full pl-11 pr-11 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-500/20 focus:border-gray-500 outline-none transition placeholder-gray-400 text-sm shadow-sm"
            />
            {filters.search && (
              <button
                onClick={() => handleFilterChange("search", "")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => setFilterDrawerOpen(true)}
              className="relative inline-flex items-center gap-2 px-5 py-3 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all shadow-sm text-sm font-medium text-gray-700"
            >
              <Filter className="h-4 w-4" />
              <span>Filters</span>
              {activeFilterCount > 0 && (
                <span className="absolute -top-2 -right-2 w-5 h-5 bg-gray-900 text-white text-xs rounded-full flex items-center justify-center font-medium">
                  {activeFilterCount}
                </span>
              )}
            </button>
            
            <div className="flex md:hidden">
              <button
                onClick={() => setViewMode(viewMode === "table" ? "grid" : "table")}
                className="p-3 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all shadow-sm"
              >
                {viewMode === "table" ? <Grid3x3 className="h-4 w-4" /> : <List className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Quick Filters */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
          <FilterChip
            label="All Orders"
            active={filters.status === "all" && filters.supplier === "all" && filters.location === "all" && !filters.dateFrom && !filters.dateTo}
            onClick={clearFilters}
          />
          <FilterChip
            label="Draft"
            icon={FileText}
            active={filters.status === "draft"}
            onClick={() => handleFilterChange("status", filters.status === "draft" ? "all" : "draft")}
          />
          <FilterChip
            label="Pending"
            icon={Clock}
            active={filters.status === "pending"}
            onClick={() => handleFilterChange("status", filters.status === "pending" ? "all" : "pending")}
          />
          <FilterChip
            label="Approved"
            icon={CheckCircle}
            active={filters.status === "approved"}
            onClick={() => handleFilterChange("status", filters.status === "approved" ? "all" : "approved")}
          />
          <FilterChip
            label="Received"
            icon={CheckCheck}
            active={filters.status === "received"}
            onClick={() => handleFilterChange("status", filters.status === "received" ? "all" : "received")}
          />
          {(filters.dateFrom || filters.dateTo) && (
            <FilterChip
              label={`${filters.dateFrom || '...'} → ${filters.dateTo || '...'}`}
              icon={Calendar}
              active={true}
              onRemove={() => {
                handleFilterChange("dateFrom", "");
                handleFilterChange("dateTo", "");
              }}
            />
          )}
          {activeFilterCount > 0 && (
            <FilterChip
              label="Clear All"
              icon={X}
              onClick={clearFilters}
            />
          )}
        </div>

        {/* Results Count */}
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Showing <span className="font-semibold text-gray-900">{startIndex + 1}–{endIndex}</span> of{" "}
            <span className="font-semibold text-gray-900">{totalItems}</span> orders
          </p>
          {!isLoading && totalItems > 0 && (
            <p className="text-xs text-gray-400">
              Last updated just now
            </p>
          )}
        </div>

        {/* Content Area */}
        {isLoading ? (
          <LoadingState />
        ) : currentOrders.length === 0 ? (
          <EmptyState
            title={filters.search || activeFilterCount > 0 ? "No orders found" : "No purchase orders"}
            description={
              filters.search || activeFilterCount > 0
                ? "Try adjusting your search or filters to find what you're looking for"
                : "Get started by creating your first purchase order"
            }
            icon={ShoppingCart}
            action={
              filters.search || activeFilterCount > 0
                ? { label: "Clear Filters", onClick: clearFilters }
                : { label: "Create Purchase Order", href: "/purchase-orders" }
            }
          />
        ) : viewMode === "grid" ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              <AnimatePresence>
                {currentOrders.map((order) => (
                  <PurchaseOrderCard
                    key={order.id}
                    order={order}
                    onView={handleView}
                    onEdit={handleEdit}
                    onDelete={(o) => {
                      setSelectedOrder(o);
                      setDeleteModalOpen(true);
                    }}
                    onUpdateStatus={handleUpdateStatus}
                    formatCurrency={formatCurr}
                  />
                ))}
              </AnimatePresence>
            </div>
            
            {totalPages > 1 && (
              <div className="mt-8 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
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
            )}
          </>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1200px]">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">#</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">PO Number</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Supplier</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Location</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Order Date</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Expected</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Total</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {currentOrders.map((order, index) => (
                    <PurchaseOrderTableRow
                      key={order.id}
                      order={order}
                      index={startIndex + index}
                      onView={handleView}
                      onEdit={handleEdit}
                      onDelete={(o) => {
                        setSelectedOrder(o);
                        setDeleteModalOpen(true);
                      }}
                      onUpdateStatus={handleUpdateStatus}
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
        locations={locations}
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