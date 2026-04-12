"use client";

import { withAuth } from "@/hoc/withAuth";
import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/axios";
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
  Eye,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Package,
  DollarSign,
  Hash,
  Filter,
  Edit,
  Trash2,
  FilterX,
  Building2,
  ShoppingCart,
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

interface Product {
  id: number;
  name: string;
  sku: string;
  cost_price: number;
}

interface PurchaseOrderItem {
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
  total_amount: number;
  notes: string | null;
  items: PurchaseOrderItem[];
  created_at: string;
}

interface FilterState {
  search: string;
  status: string;
  supplier: string;
}

interface ApiError {
  response?: {
    data?: unknown;
  };
  message?: string;
}

interface User {
  businesses_one?: Array<{
    currency?: string;
  }>;
}

// ==============================================
// Utility Functions
// ==============================================

const toNumber = (value: string | number | null | undefined): number => {
  if (value === null || value === undefined) return 0;
  if (typeof value === "number") return value;
  const parsed = parseFloat(value);
  return isNaN(parsed) ? 0 : parsed;
};

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

const StatusBadge: React.FC<{ status: PurchaseOrder["status"] }> = ({ status }) => {
  const config = {
    draft: { label: "Draft", color: "bg-stone-100 text-stone-700 border-stone-200", icon: CheckCircle },
    pending: { label: "Pending", color: "bg-amber-50 text-amber-700 border-amber-200", icon: CheckCircle },
    approved: { label: "Approved", color: "bg-blue-50 text-blue-700 border-blue-200", icon: CheckCircle },
    received: { label: "Received", color: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: Package },
    cancelled: { label: "Cancelled", color: "bg-rose-50 text-rose-700 border-rose-200", icon: XCircle },
  };

  const { label, color, icon: Icon } = config[status];

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${color}`}>
      <Icon className="h-3 w-3" />
      {label}
    </span>
  );
};

const DeleteModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  poNumber: string;
  isSubmitting: boolean;
}> = ({ isOpen, onClose, onConfirm, poNumber, isSubmitting }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-stone-900/40 backdrop-blur-sm z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="p-6">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="w-16 h-16 flex items-center justify-center rounded-2xl bg-rose-50 border border-rose-200">
              <AlertTriangle className="w-7 h-7 text-rose-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-stone-900 mb-2">Delete Purchase Order</h2>
              <p className="text-stone-600 text-sm">
                Are you sure you want to delete PO <span className="font-semibold">{poNumber}</span>?
                This action cannot be undone.
              </p>
            </div>
            <div className="flex gap-3 w-full">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2.5 rounded-lg border border-stone-300 text-stone-700 font-medium hover:bg-stone-50"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                className="flex-1 px-4 py-2.5 rounded-lg bg-rose-600 text-white font-medium hover:bg-rose-700 flex items-center justify-center gap-2"
                disabled={isSubmitting}
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ViewModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  order: PurchaseOrder | null;
  formatCurrency: (amount: number) => string;
}> = ({ isOpen, onClose, order, formatCurrency }) => {
  if (!isOpen || !order) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-stone-900/40 backdrop-blur-sm z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-stone-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-stone-900">{order.po_number}</h2>
            <p className="text-sm text-stone-500">Order Details</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-stone-100 rounded-lg">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Header Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-stone-500">Supplier</p>
              <p className="font-medium text-stone-900">{order.supplier?.name || "N/A"}</p>
            </div>
            <div>
              <p className="text-xs text-stone-500">Order Date</p>
              <p className="font-medium text-stone-900">{formatDate(order.order_date)}</p>
            </div>
            <div>
              <p className="text-xs text-stone-500">Expected Delivery</p>
              <p className="font-medium text-stone-900">{formatDate(order.expected_delivery_date)}</p>
            </div>
            <div>
              <p className="text-xs text-stone-500">Status</p>
              <StatusBadge status={order.status} />
            </div>
          </div>

          {/* Items Table */}
          <div>
            <h3 className="font-semibold text-stone-900 mb-3">Items</h3>
            <div className="border border-stone-200 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-stone-50">
                  <tr>
                    <th className="px-4 py-3 text-left">Product</th>
                    <th className="px-4 py-3 text-right">Quantity</th>
                    <th className="px-4 py-3 text-right">Unit Cost</th>
                    <th className="px-4 py-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {order.items.map((item, idx) => (
                    <tr key={idx}>
                      <td className="px-4 py-3">{item.product?.name || `Product #${item.product_id}`}</td>
                      <td className="px-4 py-3 text-right">{item.quantity}</td>
                      <td className="px-4 py-3 text-right">{formatCurrency(item.unit_cost)}</td>
                      <td className="px-4 py-3 text-right">{formatCurrency(item.total)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-stone-50 border-t border-stone-200">
                  <tr>
                    <td colSpan={3} className="px-4 py-3 text-right font-medium">Subtotal:</td>
                    <td className="px-4 py-3 text-right">{formatCurrency(order.subtotal)}</td>
                  </tr>
                  <tr>
                    <td colSpan={3} className="px-4 py-3 text-right font-medium">Total:</td>
                    <td className="px-4 py-3 text-right font-bold text-[#1e3a5f]">{formatCurrency(order.total_amount)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {order.notes && (
            <div>
              <h3 className="font-semibold text-stone-900 mb-2">Notes</h3>
              <p className="text-sm text-stone-600 bg-stone-50 p-3 rounded-lg">{order.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const EmptyState: React.FC<{
  title: string;
  description: string;
  icon: React.ElementType;
  action?: { label: string; onClick?: () => void; href?: string };
}> = ({ title, description, icon: Icon, action }) => (
  <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-12">
    <div className="flex flex-col items-center text-center max-w-md mx-auto">
      <div className="w-20 h-20 bg-stone-100 rounded-2xl flex items-center justify-center mb-4">
        <Icon className="h-10 w-10 text-stone-400" />
      </div>
      <h3 className="text-lg font-semibold text-stone-900 mb-2">{title}</h3>
      <p className="text-stone-500 text-sm mb-6">{description}</p>
      {action && (
        action.href ? (
          <Link href={action.href} className="inline-flex items-center gap-2 px-6 py-3 bg-[#1e3a5f] text-white rounded-lg hover:bg-[#2c4c6e]">
            <Plus className="h-4 w-4" />
            {action.label}
          </Link>
        ) : (
          <button onClick={action.onClick} className="inline-flex items-center gap-2 px-6 py-3 bg-[#1e3a5f] text-white rounded-lg hover:bg-[#2c4c6e]">
            <Plus className="h-4 w-4" />
            {action.label}
          </button>
        )
      )}
    </div>
  </div>
);

const LoadingState: React.FC = () => (
  <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-12">
    <div className="flex flex-col items-center justify-center">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-[#1e3a5f]/20 border-t-[#1e3a5f] rounded-full animate-spin" />
        <Package className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-[#1e3a5f]/60" />
      </div>
      <p className="mt-4 text-stone-600 font-medium">Loading purchase orders...</p>
    </div>
  </div>
);

const Pagination: React.FC<{
  currentPage: number;
  totalPages: number;
  totalItems: number;
  startIndex: number;
  endIndex: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (items: number) => void;
}> = ({ currentPage, totalPages, totalItems, startIndex, endIndex, itemsPerPage, onPageChange, onItemsPerPageChange }) => {
  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push("...");
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (currentPage < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="px-6 py-4 border-t border-stone-200 bg-stone-50/30 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div className="flex items-center gap-4">
        <select
          value={itemsPerPage}
          onChange={(e) => { onItemsPerPageChange(Number(e.target.value)); onPageChange(1); }}
          className="px-2 py-1.5 text-sm border border-stone-300 rounded-lg bg-white"
        >
          {[10, 25, 50].map(v => <option key={v} value={v}>{v}</option>)}
        </select>
        <span className="text-sm text-stone-600">Showing {startIndex + 1}-{endIndex} of {totalItems}</span>
      </div>
      <div className="flex gap-2">
        <button onClick={() => onPageChange(1)} disabled={currentPage === 1} className="p-2 rounded-lg border disabled:opacity-50">
          <ChevronsLeft className="h-4 w-4" />
        </button>
        <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} className="p-2 rounded-lg border disabled:opacity-50">
          <ChevronLeft className="h-4 w-4" />
        </button>
        {getPageNumbers().map((page, i) => (
          page === "..." ? <span key={i} className="px-3 py-2">...</span> :
          <button key={i} onClick={() => onPageChange(page as number)} className={`min-w-[2.5rem] h-10 rounded-lg text-sm font-medium ${currentPage === page ? "bg-[#1e3a5f] text-white" : "hover:bg-stone-100 border"}`}>
            {page}
          </button>
        ))}
        <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages} className="p-2 rounded-lg border disabled:opacity-50">
          <ChevronRight className="h-4 w-4" />
        </button>
        <button onClick={() => onPageChange(totalPages)} disabled={currentPage === totalPages} className="p-2 rounded-lg border disabled:opacity-50">
          <ChevronsRight className="h-4 w-4" />
        </button>
      </div>
    </div>
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
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [openRow, setOpenRow] = useState<number | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  
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

  // Fixed: Map API response to match component structure
  const fetchPurchaseOrders = async () => {
    setIsLoading(true);
    try {
      const res = await apiGet("/product_purchase", {}, false);
      console.log(res.data);
      const ordersArray = Array.isArray(res.data?.data) ? res.data.data : Array.isArray(res.data) ? res.data : [];
      
      // Map the API response to match component expectations
      const mappedOrders: PurchaseOrder[] = ordersArray.map((order: any) => ({
        id: order.id,
        po_number: order.order_number, // Map order_number to po_number
        supplier_id: order.vendors_id,
        supplier: order.vendor ? {
          id: order.vendor.id,
          name: order.vendor.vendor_name,
          email: order.vendor.email,
          phone: order.vendor.phone,
          contact_person: order.vendor.contact_person,
        } : null,
        order_date: order.order_date,
        expected_delivery_date: order.expected_delivery_date,
        status: order.status === "pending" ? "pending" : 
                order.status === "draft" ? "draft" : 
                order.status === "approved" ? "approved" : 
                order.status === "received" ? "received" : "pending", // Default to pending
        subtotal: parseFloat(order.subtotal) || 0,
        total_amount: parseFloat(order.total_amount) || 0,
        notes: order.notes,
        items: [], // Initialize empty items array since API doesn't return items
        created_at: order.created_at,
      }));
      
      setOrders(mappedOrders);
    } catch (err) {
      console.error(err);
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
      // Map vendor to supplier structure
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

  const handleDelete = async () => {
    if (isSubmitting || !selectedOrder) return;
    setIsSubmitting(true);
    try {
      await apiDelete(`/purchase-orders/${selectedOrder.id}`);
      setOrders(prev => prev.filter(o => o.id !== selectedOrder.id));
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
      await apiPut(`/purchase-orders/${id}/status`, { status });
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
      toast.success(`Status updated to ${status}`);
    } catch {
      toast.error("Failed to update status");
    }
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
    const filtered = orders.filter(order => {
      const matchesSearch = !debouncedSearch || 
        order.po_number.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        order.supplier?.name?.toLowerCase().includes(debouncedSearch.toLowerCase());
      
      const matchesStatus = filters.status === "all" || order.status === filters.status;
      const matchesSupplier = filters.supplier === "all" || order.supplier_id.toString() === filters.supplier;
      
      return matchesSearch && matchesStatus && matchesSupplier;
    });
    
    return filtered.sort((a, b) => new Date(b.order_date).getTime() - new Date(a.order_date).getTime());
  }, [orders, debouncedSearch, filters]);

  // Pagination
  const totalItems = filteredOrders.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const currentOrders = filteredOrders.slice(startIndex, endIndex);

  // Statistics
  const stats = useMemo(() => {
    const totalOrders = orders.length;
    const draftOrders = orders.filter(o => o.status === "draft").length;
    const pendingOrders = orders.filter(o => o.status === "pending").length;
    const receivedOrders = orders.filter(o => o.status === "received").length;
    const totalValue = orders.reduce((sum, o) => sum + o.total_amount, 0);
    return { totalOrders, draftOrders, pendingOrders, receivedOrders, totalValue };
  }, [orders]);



  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <header className="bg-white border-b border-stone-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <Link href="/dashboard" className="p-2 text-stone-500 hover:text-stone-700 hover:bg-stone-100 rounded-lg">
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-stone-900">Purchase Orders</h1>
                <p className="text-sm text-stone-500">Manage your purchase orders</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={fetchPurchaseOrders} className="p-2.5 text-stone-600 hover:bg-stone-100 rounded-lg border">
                <RefreshCw className="h-5 w-5" />
              </button>
              <Link href="/purchase-orders" className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#1e3a5f] text-white text-sm font-medium rounded-lg hover:bg-[#2c4c6e]">
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Create PO</span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="bg-white p-4 rounded-xl border border-stone-200">
            <p className="text-xs text-stone-500">Total Orders</p>
            <p className="text-2xl font-bold text-stone-900">{stats.totalOrders}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-stone-200">
            <p className="text-xs text-stone-500">Draft</p>
            <p className="text-2xl font-bold text-amber-600">{stats.draftOrders}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-stone-200">
            <p className="text-xs text-stone-500">Pending</p>
            <p className="text-2xl font-bold text-blue-600">{stats.pendingOrders}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-stone-200">
            <p className="text-xs text-stone-500">Received</p>
            <p className="text-2xl font-bold text-emerald-600">{stats.receivedOrders}</p>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 h-5 w-5" />
            <input
              type="text"
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              placeholder="Search by PO number or supplier..."
              className="w-full pl-10 pr-4 py-3 bg-white border border-stone-300 rounded-xl focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f] outline-none"
            />
          </div>
          <button onClick={() => setFilterDrawerOpen(true)} className="relative inline-flex items-center gap-2 px-6 py-3 bg-white border rounded-xl hover:bg-stone-50">
            <Filter className="h-5 w-5" />
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <span className="absolute -top-2 -right-2 w-5 h-5 bg-[#1e3a5f] text-white text-xs rounded-full flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* Quick Filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button onClick={clearFilters} className={`px-3 py-1.5 text-sm rounded-full ${filters.status === "all" && filters.supplier === "all" && !filters.search ? "bg-[#1e3a5f] text-white" : "bg-stone-100 text-stone-700 hover:bg-stone-200"}`}>
            All
          </button>
          <button onClick={() => setFilters(prev => ({ ...prev, status: prev.status === "draft" ? "all" : "draft" }))} className={`px-3 py-1.5 text-sm rounded-full ${filters.status === "draft" ? "bg-[#1e3a5f] text-white" : "bg-stone-100"}`}>
            Draft
          </button>
          <button onClick={() => setFilters(prev => ({ ...prev, status: prev.status === "pending" ? "all" : "pending" }))} className={`px-3 py-1.5 text-sm rounded-full ${filters.status === "pending" ? "bg-[#1e3a5f] text-white" : "bg-stone-100"}`}>
            Pending
          </button>
          <button onClick={() => setFilters(prev => ({ ...prev, status: prev.status === "approved" ? "all" : "approved" }))} className={`px-3 py-1.5 text-sm rounded-full ${filters.status === "approved" ? "bg-[#1e3a5f] text-white" : "bg-stone-100"}`}>
            Approved
          </button>
          <button onClick={() => setFilters(prev => ({ ...prev, status: prev.status === "received" ? "all" : "received" }))} className={`px-3 py-1.5 text-sm rounded-full ${filters.status === "received" ? "bg-[#1e3a5f] text-white" : "bg-stone-100"}`}>
            Received
          </button>
        </div>

        {/* Loading/Empty States */}
        {isLoading && <LoadingState />}
        
        {!isLoading && currentOrders.length === 0 && (
          <EmptyState
            title={filters.search ? "No orders found" : "No purchase orders"}
            description={filters.search ? "Try adjusting your search" : "Create your first purchase order"}
            icon={ShoppingCart}
            action={{ label: "Create Purchase Order", href: "/purchase-orders" }}
          />
        )}

        {/* Orders Table */}
        {!isLoading && currentOrders.length > 0 && (
          <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-stone-50 text-stone-600 border-b border-stone-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase">PO #</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase">Supplier</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase">Order Date</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase">Expected</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold uppercase">Total</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase">Status</th>
                    <th className="px-6 py-4 text-center text-xs font-semibold uppercase w-12">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {currentOrders.map((order, idx) => (
                    <tr key={order.id} className="hover:bg-stone-50/50">
                      <td className="px-6 py-4 font-mono text-sm font-medium text-stone-900">{order.po_number}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-stone-400" />
                          <span>{order.supplier?.name || "N/A"}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-stone-600">{formatDate(order.order_date)}</td>
                      <td className="px-6 py-4 text-stone-600">{formatDate(order.expected_delivery_date)}</td>
                      <td className="px-6 py-4 text-right font-semibold text-stone-900">{formatCurr(order.total_amount)}</td>
                      <td className="px-6 py-4"><StatusBadge status={order.status} /></td>
                      <td className="px-6 py-4 text-center relative">
                        <button onClick={() => setOpenRow(openRow === order.id ? null : order.id)} className="p-2 rounded-lg hover:bg-stone-100">
                          <MoreVertical className="h-4 w-4" />
                        </button>
                        {openRow === order.id && (
                          <>
                            <div className="fixed inset-0 z-10" onClick={() => setOpenRow(null)} />
                            <div className="absolute right-6 z-20 w-48 bg-white border rounded-xl shadow-lg">
                              <button onClick={() => { setSelectedOrder(order); setViewModalOpen(true); setOpenRow(null); }} className="flex items-center gap-3 w-full px-4 py-3 text-sm text-stone-700 hover:bg-stone-50 border-b">
                                <Eye className="h-4 w-4" /> View
                              </button>
                              {order.status === "draft" && (
                                <Link href={`/purchase-orders/edit/${order.id}`} className="flex items-center gap-3 w-full px-4 py-3 text-sm text-stone-700 hover:bg-stone-50 border-b">
                                  <Edit className="h-4 w-4" /> Edit
                                </Link>
                              )}
                              {order.status === "pending" && (
                                <button onClick={() => handleUpdateStatus(order.id, "approved")} className="flex items-center gap-3 w-full px-4 py-3 text-sm text-emerald-700 hover:bg-emerald-50 border-b">
                                  <CheckCircle className="h-4 w-4" /> Approve
                                </button>
                              )}
                              {order.status === "approved" && (
                                <button onClick={() => handleUpdateStatus(order.id, "received")} className="flex items-center gap-3 w-full px-4 py-3 text-sm text-blue-700 hover:bg-blue-50 border-b">
                                  <Package className="h-4 w-4" /> Mark Received
                                </button>
                              )}
                              {(order.status === "draft" || order.status === "pending") && (
                                <button onClick={() => { setSelectedOrder(order); setDeleteModalOpen(true); setOpenRow(null); }} className="flex items-center gap-3 w-full px-4 py-3 text-sm text-rose-600 hover:bg-rose-50">
                                  <Trash2 className="h-4 w-4" /> Delete
                                </button>
                              )}
                            </div>
                          </>
                        )}
                      </td>
                    </tr>
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
      {filterDrawerOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm" onClick={() => setFilterDrawerOpen(false)} />
          <div className="absolute right-0 top-0 h-full w-80 bg-white shadow-2xl">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="font-semibold">Filters</h3>
              <button onClick={() => setFilterDrawerOpen(false)} className="p-2 hover:bg-stone-100 rounded-lg"><X size={20} /></button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="text-xs font-medium text-stone-500 block mb-2">Status</label>
                <select value={filters.status} onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))} className="w-full px-3 py-2 border rounded-lg">
                  <option value="all">All</option>
                  <option value="draft">Draft</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="received">Received</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-stone-500 block mb-2">Supplier</label>
                <select value={filters.supplier} onChange={(e) => setFilters(prev => ({ ...prev, supplier: e.target.value }))} className="w-full px-3 py-2 border rounded-lg">
                  <option value="all">All Suppliers</option>
                  {suppliers.map(s => <option key={s.id} value={s.id.toString()}>{s.name}</option>)}
                </select>
              </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-4 border-t bg-stone-50">
              {activeFilterCount > 0 && (
                <button onClick={clearFilters} className="text-sm text-[#1e3a5f] mb-3 inline-flex items-center gap-1">
                  <FilterX size={14} /> Clear all
                </button>
              )}
              <button onClick={() => setFilterDrawerOpen(false)} className="w-full px-4 py-3 bg-[#1e3a5f] text-white rounded-lg">Apply Filters</button>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <DeleteModal isOpen={deleteModalOpen} onClose={() => { setDeleteModalOpen(false); setSelectedOrder(null); }} onConfirm={handleDelete} poNumber={selectedOrder?.po_number || ""} isSubmitting={isSubmitting} />
      <ViewModal isOpen={viewModalOpen} onClose={() => { setViewModalOpen(false); setSelectedOrder(null); }} order={selectedOrder} formatCurrency={formatCurr} />
    </div>
  );
};

export default withAuth(PurchaseOrdersPage);