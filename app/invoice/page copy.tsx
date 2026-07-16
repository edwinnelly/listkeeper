"use client";
import { withAuth } from "@/hoc/withAuth";
import { apiGet, apiDelete } from "@/lib/axios";
import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import {
  Eye,
  Trash2,
  Search,
  MoreVertical,
  X,
  AlertTriangle,
  ArrowLeft,
  Loader2,
  RefreshCw,
  FileText,
  DollarSign,
  Hash,
  Calendar,
  User,
  Grid3x3,
  List,
  Filter,
  ChevronRight,
  ChevronsRight,
  ChevronsLeft,
  ChevronLeft,
  Box,
  Plus,
  FilterX,
  Download,
  Send,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Building2,
  Phone,
  Mail,
  MapPin,
  Banknote,
  Receipt,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import ShortTextWithTooltip from "../component/shorten_len";

// ==============================================
// TypeScript Interfaces
// ==============================================

interface InvoiceItem {
  id: number;
  product_id: number;
  product_name: string;
  sku: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  unit?: { symbol: string };
}

interface Invoice {
  id: number;
  invoice_number: string;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string | null;
  customer_address: string | null;
  business_name: string | null;
  business_address: string | null;
  business_phone: string | null;
  business_email: string | null;
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  status: "draft" | "pending" | "paid" | "overdue" | "cancelled";
  payment_method: string | null;
  payment_date: string | null;
  due_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  encrypted_id: string | null;
  items?: InvoiceItem[];
  items_count?: number;
}

interface FilterState {
  search: string;
  status: string;
  sortBy: "invoice_number" | "total_amount" | "created_at" | "due_date";
  sortOrder: "asc" | "desc";
  dateRange: string;
}

interface ApiError {
  response?: { data?: unknown };
  message?: string;
}

interface User {
  businesses_one?: Array<{ 
    currency?: string;
    business_name?: string;
  }>;
}

interface PaginationInfo {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  next_page_url: string | null;
  prev_page_url: string | null;
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
    year: "numeric", month: "short", day: "numeric",
  });
};

const formatNumber = (value: string | number | null | undefined): string => {
  const num = toNumber(value);
  return new Intl.NumberFormat("en-US").format(num);
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
// Status Badge Component
// ==============================================

const StatusBadge: React.FC<{ status: Invoice["status"] }> = ({ status }) => {
  const config = {
    draft: { label: "Draft", icon: FileText, cls: "bg-stone-50 text-stone-600 border-stone-200", iconCls: "text-stone-400" },
    pending: { label: "Pending", icon: Clock, cls: "bg-amber-50 text-amber-700 border-amber-200", iconCls: "text-amber-500" },
    paid: { label: "Paid", icon: CheckCircle, cls: "bg-emerald-50 text-emerald-700 border-emerald-200", iconCls: "text-emerald-500" },
    overdue: { label: "Overdue", icon: AlertCircle, cls: "bg-rose-50 text-rose-700 border-rose-200", iconCls: "text-rose-500" },
    cancelled: { label: "Cancelled", icon: XCircle, cls: "bg-stone-100 text-stone-500 border-stone-200", iconCls: "text-stone-400" },
  };
  const { label, icon: Icon, cls, iconCls } = config[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${cls}`}>
      <Icon className={`h-3.5 w-3.5 ${iconCls}`} />
      {label}
    </span>
  );
};

// ==============================================
// Empty State Component
// ==============================================

const EmptyState: React.FC<{
  title: string;
  description: string;
  icon: React.ElementType;
  action?: { label: string; onClick?: () => void; href?: string };
}> = ({ title, description, icon: Icon, action }) => (
  <div className="bg-white rounded-2xl border border-stone-100 shadow-sm py-20">
    <div className="flex flex-col items-center text-center max-w-sm mx-auto">
      <div className="w-16 h-16 bg-stone-50 rounded-2xl flex items-center justify-center mb-5 border border-stone-100">
        <Icon className="h-8 w-8 text-stone-400" />
      </div>
      <h3 className="text-base font-semibold text-stone-800 mb-1.5">{title}</h3>
      <p className="text-sm text-stone-500 mb-6 leading-relaxed">{description}</p>
      {action && (
        action.href ? (
          <Link href={action.href} className="inline-flex items-center gap-2 px-5 py-2.5 bg-stone-900 text-white text-sm font-semibold rounded-xl hover:bg-stone-800 transition-all shadow-lg shadow-stone-900/10">
            <Plus className="h-4 w-4" /> {action.label}
          </Link>
        ) : (
          <button onClick={action.onClick} className="inline-flex items-center gap-2 px-5 py-2.5 bg-stone-900 text-white text-sm font-semibold rounded-xl hover:bg-stone-800 transition-all shadow-lg shadow-stone-900/10">
            <Plus className="h-4 w-4" /> {action.label}
          </button>
        )
      )}
    </div>
  </div>
);

// ==============================================
// Loading State Component
// ==============================================

const LoadingState: React.FC = () => (
  <div className="bg-white rounded-2xl border border-stone-100 shadow-sm py-20">
    <div className="flex flex-col items-center justify-center">
      <div className="relative w-14 h-14 mb-5">
        <div className="w-14 h-14 rounded-full border-[3px] border-stone-100" />
        <div className="absolute inset-0 w-14 h-14 rounded-full border-[3px] border-stone-800 border-t-transparent animate-spin" />
        <FileText className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-5 w-5 text-stone-400" />
      </div>
      <p className="text-sm font-semibold text-stone-700">Loading invoices</p>
      <p className="text-xs text-stone-400 mt-1">Please wait a moment</p>
    </div>
  </div>
);

// ==============================================
// Delete Modal Component
// ==============================================

const DeleteModal: React.FC<{
  isOpen: boolean; onClose: () => void; onConfirm: () => void;
  invoiceNumber: string; isSubmitting: boolean;
}> = ({ isOpen, onClose, onConfirm, invoiceNumber, isSubmitting }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-stone-900/50 backdrop-blur-sm z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="p-6 text-center">
          <div className="w-14 h-14 flex items-center justify-center rounded-2xl bg-rose-50 border border-rose-100 mx-auto mb-4">
            <AlertTriangle className="w-6 h-6 text-rose-500" />
          </div>
          <h2 className="text-lg font-bold text-stone-900 mb-1.5">Delete Invoice</h2>
          <p className="text-sm text-stone-500 leading-relaxed mb-6">
            Are you sure you want to delete invoice{" "}
            <span className="font-semibold text-stone-800 font-mono">{invoiceNumber}</span>?
            This action cannot be undone.
          </p>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2.5 rounded-xl border border-stone-200 bg-white text-stone-700 text-sm font-semibold hover:bg-stone-50 transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2.5 rounded-xl bg-rose-600 text-white text-sm font-semibold hover:bg-rose-700 transition disabled:opacity-50 inline-flex items-center justify-center gap-2"
            >
              {isSubmitting ? <><Loader2 className="h-4 w-4 animate-spin" />Deleting...</> : <><Trash2 className="h-4 w-4" />Delete</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==============================================
// Pagination Component
// ==============================================

const Pagination: React.FC<{
  currentPage: number; totalPages: number; totalItems: number;
  startIndex: number; endIndex: number; itemsPerPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (items: number) => void;
}> = ({ currentPage, totalPages, totalItems, startIndex, endIndex, itemsPerPage, onPageChange, onItemsPerPageChange }) => {
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      let start = Math.max(2, currentPage - 1);
      let end = Math.min(totalPages - 1, currentPage + 1);
      if (currentPage <= 3) end = 4;
      if (currentPage >= totalPages - 2) start = totalPages - 3;
      if (start > 2) pages.push("...");
      for (let i = start; i <= end; i++) pages.push(i);
      if (end < totalPages - 1) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };

  if (totalPages <= 1) return null;

  return (
    <div className="px-6 py-4 border-t border-stone-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-stone-50/50">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-stone-500 font-medium">Rows</span>
          <select
            value={itemsPerPage}
            onChange={(e) => { onItemsPerPageChange(Number(e.target.value)); onPageChange(1); }}
            className="px-2 py-1.5 text-xs border border-stone-200 rounded-lg bg-white focus:ring-2 focus:ring-stone-500/10 focus:border-stone-500 outline-none font-medium"
          >
            {[10, 25, 50, 100].map((v) => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>
        <span className="text-xs text-stone-400">
          {totalItems > 0 ? startIndex + 1 : 0}–{endIndex} of {totalItems}
        </span>
      </div>
      <div className="flex items-center gap-1">
        {[
          { action: () => onPageChange(1), icon: ChevronsLeft, disabled: currentPage === 1 },
          { action: () => onPageChange(currentPage - 1), icon: ChevronLeft, disabled: currentPage === 1 },
        ].map(({ action, icon: Icon, disabled }, i) => (
          <button key={i} onClick={action} disabled={disabled}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-stone-200 text-stone-500 hover:bg-stone-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
            <Icon className="h-3.5 w-3.5" />
          </button>
        ))}
        <div className="flex items-center gap-1 mx-1">
          {getPageNumbers().map((page, index) => (
            <React.Fragment key={index}>
              {page === "..." ? (
                <span className="w-8 h-8 flex items-center justify-center text-stone-400 text-xs">…</span>
              ) : (
                <button
                  onClick={() => onPageChange(page as number)}
                  className={`w-8 h-8 rounded-lg text-xs font-semibold transition-all ${
                    currentPage === page
                      ? "bg-stone-900 text-white shadow-sm"
                      : "text-stone-600 hover:bg-stone-100 border border-stone-200"
                  }`}
                >
                  {page}
                </button>
              )}
            </React.Fragment>
          ))}
        </div>
        {[
          { action: () => onPageChange(currentPage + 1), icon: ChevronRight, disabled: currentPage === totalPages },
          { action: () => onPageChange(totalPages), icon: ChevronsRight, disabled: currentPage === totalPages },
        ].map(({ action, icon: Icon, disabled }, i) => (
          <button key={i} onClick={action} disabled={disabled}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-stone-200 text-stone-500 hover:bg-stone-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
            <Icon className="h-3.5 w-3.5" />
          </button>
        ))}
      </div>
    </div>
  );
};

// ==============================================
// Dropdown Portal Component
// ==============================================

const DropdownPortal: React.FC<{
  position: { top: number; left: number };
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onClose: () => void;
  invoice: Invoice;
}> = ({ position, onView, onEdit, onDelete, onClose, invoice }) => {
  useEffect(() => {
    const handleClickOutside = () => onClose();
    const timer = setTimeout(() => {
      document.addEventListener('click', handleClickOutside);
    }, 0);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [onClose]);

  const actions = [
    { label: "View Details", icon: Eye, action: onView, show: true },
    { label: "Edit Invoice", icon: FileText, action: onEdit, show: invoice.status === "draft" },
    { label: "Download PDF", icon: Download, action: () => {}, show: invoice.status !== "draft" },
    { label: "Send to Customer", icon: Send, action: () => {}, show: invoice.status === "pending" || invoice.status === "paid" },
    { label: "Delete", icon: Trash2, action: onDelete, show: invoice.status === "draft", danger: true },
  ].filter(a => a.show);

  return createPortal(
    <div 
      className="fixed z-[100] w-48 bg-white border border-stone-100 rounded-xl shadow-2xl shadow-stone-900/20 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
      style={{ top: position.top, left: position.left }}
      onClick={(e) => e.stopPropagation()}
    >
      {actions.map(({ label, icon: Icon, action, danger }, idx) => (
        <button
          key={label}
          onClick={(e) => { e.stopPropagation(); action(); }}
          className={`flex items-center gap-2.5 w-full px-4 py-2.5 text-sm font-medium transition-colors ${
            danger
              ? "text-rose-600 hover:bg-rose-50 border-t border-stone-100"
              : "text-stone-700 hover:bg-stone-50"
          } ${idx > 0 && !danger ? "border-t border-stone-50" : ""}`}
        >
          <Icon className={`h-3.5 w-3.5 ${danger ? "text-rose-500" : "text-stone-500"}`} />
          {label}
        </button>
      ))}
    </div>,
    document.body
  );
};

// ==============================================
// Invoice Row Component
// ==============================================

const InvoiceRow: React.FC<{
  invoice: Invoice;
  index: number;
  startIndex: number;
  onView: (inv: Invoice) => void;
  onEdit: (inv: Invoice) => void;
  onDelete: (inv: Invoice) => void;
  isOpen: boolean;
  onToggleOpen: (id: number | null, position?: { top: number; left: number }) => void;
  formatCurrency: (amount: number) => string;
}> = ({ invoice, index, startIndex, onView, onEdit, onDelete, isOpen, onToggleOpen, formatCurrency }) => {
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleToggle = useCallback(() => {
    if (isOpen) {
      onToggleOpen(null);
    } else {
      const rect = buttonRef.current?.getBoundingClientRect();
      if (rect) {
        const viewportWidth = window.innerWidth;
        const dropdownWidth = 192;
        let left = rect.left - dropdownWidth + rect.width;
        if (left < 8) left = 8;
        if (left + dropdownWidth > viewportWidth - 8) {
          left = viewportWidth - dropdownWidth - 8;
        }
        onToggleOpen(invoice.id, { top: rect.bottom + 4, left });
      }
    }
  }, [isOpen, invoice.id, onToggleOpen]);

  return (
    <tr className="hover:bg-stone-50/50 transition-colors group border-b border-stone-100 last:border-0">
      <td className="px-5 py-4 text-xs text-stone-400 font-medium tabular-nums w-10">
        {startIndex + index + 1}
      </td>
      <td className="px-5 py-4">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-stone-800 font-mono">
            {invoice.invoice_number}
          </div>
          <div className="text-[11px] text-stone-400 mt-0.5">
            {formatDate(invoice.created_at)}
          </div>
        </div>
      </td>
      <td className="px-5 py-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-stone-50 rounded-lg flex items-center justify-center border border-stone-100">
            <User className="h-4 w-4 text-stone-400" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-medium text-stone-700 truncate max-w-[180px]">
              <ShortTextWithTooltip text={invoice.customer_name} max={20} />
            </div>
            {invoice.customer_email && (
              <div className="text-[11px] text-stone-400 truncate max-w-[180px]">
                {invoice.customer_email}
              </div>
            )}
          </div>
        </div>
      </td>
      <td className="px-5 py-4 hidden lg:table-cell">
        <StatusBadge status={invoice.status} />
      </td>
      <td className="px-5 py-4">
        <div className="text-right">
          <div className="text-sm font-bold text-stone-900">
            {formatCurrency(invoice.total_amount)}
          </div>
          {invoice.items_count && (
            <div className="text-[11px] text-stone-400">
              {invoice.items_count} item{invoice.items_count !== 1 ? 's' : ''}
            </div>
          )}
        </div>
      </td>
      <td className="px-5 py-4 hidden md:table-cell">
        {invoice.due_date ? (
          <div className="text-sm">
            <span className={`font-medium ${invoice.status === "overdue" ? "text-rose-600" : "text-stone-600"}`}>
              {formatDate(invoice.due_date)}
            </span>
          </div>
        ) : (
          <span className="text-sm text-stone-400">—</span>
        )}
      </td>
      <td className="px-5 py-4">
        <button
          ref={buttonRef}
          onClick={handleToggle}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors"
        >
          <MoreVertical className="h-4 w-4" />
        </button>
      </td>
    </tr>
  );
};

// ==============================================
// Invoice Grid Card Component
// ==============================================

const InvoiceGridCard: React.FC<{
  invoice: Invoice;
  onView: (inv: Invoice) => void;
  onEdit: (inv: Invoice) => void;
  onDelete: (inv: Invoice) => void;
  formatCurrency: (amount: number) => string;
}> = ({ invoice, onView, onEdit, onDelete, formatCurrency }) => (
  <div className="bg-white rounded-2xl border border-stone-100 shadow-sm hover:shadow-md hover:border-stone-200 transition-all group overflow-hidden">
    <div className="p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="font-mono text-sm font-bold text-stone-800">
          {invoice.invoice_number}
        </div>
        <StatusBadge status={invoice.status} />
      </div>
      
      <div className="space-y-3 mb-4">
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-stone-400" />
          <span className="text-sm text-stone-600 font-medium truncate">
            <ShortTextWithTooltip text={invoice.customer_name} max={22} />
          </span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-stone-400" />
            <span className="text-xs text-stone-500">{formatDate(invoice.created_at)}</span>
          </div>
          {invoice.due_date && (
            <span className={`text-xs font-medium ${invoice.status === "overdue" ? "text-rose-600" : "text-stone-500"}`}>
              Due: {formatDate(invoice.due_date)}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-end justify-between pt-4 border-t border-stone-100">
        <div>
          <p className="text-[11px] text-stone-400 font-medium uppercase tracking-wider">Total Amount</p>
          <p className="text-xl font-bold text-stone-900">{formatCurrency(invoice.total_amount)}</p>
        </div>
        <div className="text-right">
          {invoice.items_count && (
            <p className="text-xs text-stone-400">{invoice.items_count} item{invoice.items_count !== 1 ? 's' : ''}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-1.5 mt-4 pt-3 border-t border-stone-100">
        {[
          { label: "View", icon: Eye, action: () => onView(invoice), cls: "hover:text-stone-800 hover:bg-stone-50" },
          { label: "Edit", icon: FileText, action: () => onEdit(invoice), cls: "hover:text-stone-800 hover:bg-stone-50", show: invoice.status === "draft" },
          { label: "Delete", icon: Trash2, action: () => onDelete(invoice), cls: "hover:text-rose-600 hover:bg-rose-50", show: invoice.status === "draft" },
        ].filter(a => a.show !== false).map(({ label, icon: Icon, action, cls }) => (
          <button key={label} onClick={action} title={label}
            className={`flex items-center justify-center gap-1 p-2 rounded-lg text-stone-400 transition-colors text-xs font-medium ${cls}`}>
            <Icon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>
    </div>
  </div>
);

// ==============================================
// Filter Drawer Component
// ==============================================

const FilterDrawer: React.FC<{
  isOpen: boolean; onClose: () => void; filters: FilterState;
  totalItems: number;
  onFilterChange: <K extends keyof FilterState>(key: K, value: FilterState[K]) => void;
  onClearFilters: () => void; activeFilterCount: number;
}> = ({ isOpen, onClose, filters, totalItems, onFilterChange, onClearFilters, activeFilterCount }) => {
  if (!isOpen) return null;

  const selectCls = "w-full px-3 py-2.5 bg-white border border-stone-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-stone-500/10 focus:border-stone-500 outline-none transition text-stone-700";

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-80 bg-white shadow-2xl flex flex-col">
        <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-stone-100 rounded-lg flex items-center justify-center">
              <Filter className="h-4 w-4 text-stone-600" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-stone-900">Filters</h3>
              {activeFilterCount > 0 && (
                <p className="text-[11px] text-stone-400">{activeFilterCount} active</p>
              )}
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-stone-100 text-stone-400 transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          <div>
            <label className="text-[11px] font-bold text-stone-400 uppercase tracking-widest mb-2 block">Status</label>
            <select value={filters.status} onChange={(e) => onFilterChange("status", e.target.value)} className={selectCls}>
              <option value="all">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-bold text-stone-400 uppercase tracking-widest mb-2 block">Date Range</label>
            <select value={filters.dateRange} onChange={(e) => onFilterChange("dateRange", e.target.value)} className={selectCls}>
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="year">This Year</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-bold text-stone-400 uppercase tracking-widest mb-2 block">Sort By</label>
            <select value={filters.sortBy} onChange={(e) => onFilterChange("sortBy", e.target.value as FilterState["sortBy"])} className={selectCls}>
              <option value="invoice_number">Invoice Number</option>
              <option value="total_amount">Total Amount</option>
              <option value="created_at">Date Created</option>
              <option value="due_date">Due Date</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-bold text-stone-400 uppercase tracking-widest mb-2 block">Order</label>
            <div className="grid grid-cols-2 gap-2">
              {["asc", "desc"].map((order) => (
                <button
                  key={order}
                  onClick={() => onFilterChange("sortOrder", order as "asc" | "desc")}
                  className={`py-2.5 text-sm font-semibold rounded-xl border transition-all ${
                    filters.sortOrder === order
                      ? "bg-stone-900 text-white border-stone-900 shadow-sm"
                      : "bg-white text-stone-600 border-stone-200 hover:border-stone-300"
                  }`}
                >
                  {order === "asc" ? "Ascending" : "Descending"}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="p-5 border-t border-stone-100 bg-stone-50/50">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-stone-500">
              <span className="font-bold text-stone-800">{totalItems}</span> invoices found
            </p>
            {activeFilterCount > 0 && (
              <button onClick={onClearFilters} className="text-xs text-stone-700 font-semibold hover:underline inline-flex items-center gap-1">
                <FilterX size={12} /> Clear all
              </button>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-full py-3 bg-stone-900 text-white text-sm font-bold rounded-xl hover:bg-stone-800 transition-colors shadow-sm"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
};

// ==============================================
// View Invoice Modal Component
// ==============================================

const ViewInvoiceModal: React.FC<{
  isOpen: boolean; onClose: () => void; invoice: Invoice | null;
  onEdit: (inv: Invoice) => void; formatCurrency: (amount: number) => string;
}> = ({ isOpen, onClose, invoice, onEdit, formatCurrency }) => {
  if (!isOpen || !invoice) return null;

  const InfoRow = ({ label, value, valueClass = "" }: { label: string; value: React.ReactNode; valueClass?: string }) => (
    <div className="flex items-start justify-between py-2.5 border-b border-stone-50 last:border-0">
      <span className="text-xs text-stone-400 font-medium">{label}</span>
      <span className={`text-xs font-semibold text-stone-800 text-right max-w-[55%] ${valueClass}`}>{value}</span>
    </div>
  );

  const Section = ({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) => (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <div className="w-6 h-6 bg-stone-100 rounded-lg flex items-center justify-center">
          <Icon className="h-3.5 w-3.5 text-stone-500" />
        </div>
        <h3 className="text-xs font-bold text-stone-500 uppercase tracking-widest">{title}</h3>
      </div>
      <div className="bg-stone-50 rounded-xl px-4 border border-stone-100">{children}</div>
    </div>
  );

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-stone-900/50 backdrop-blur-sm z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-stone-100 px-6 py-4 flex items-center justify-between z-10">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-lg font-bold text-stone-900 font-mono">{invoice.invoice_number}</h2>
              <StatusBadge status={invoice.status} />
            </div>
            <p className="text-xs text-stone-400">Created {formatDate(invoice.created_at)}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Customer Info */}
            <Section icon={User} title="Customer Information">
              <InfoRow label="Name" value={invoice.customer_name} />
              {invoice.customer_email && <InfoRow label="Email" value={invoice.customer_email} />}
              {invoice.customer_phone && <InfoRow label="Phone" value={invoice.customer_phone} />}
              {invoice.customer_address && <InfoRow label="Address" value={invoice.customer_address} />}
            </Section>

            {/* Business Info */}
            {(invoice.business_name || invoice.business_email || invoice.business_phone || invoice.business_address) && (
              <Section icon={Building2} title="Business Information">
                {invoice.business_name && <InfoRow label="Name" value={invoice.business_name} />}
                {invoice.business_email && <InfoRow label="Email" value={invoice.business_email} />}
                {invoice.business_phone && <InfoRow label="Phone" value={invoice.business_phone} />}
                {invoice.business_address && <InfoRow label="Address" value={invoice.business_address} />}
              </Section>
            )}

            {/* Payment Info */}
            <Section icon={Banknote} title="Payment Details">
              <InfoRow label="Subtotal" value={formatCurrency(invoice.subtotal)} />
              {invoice.discount_amount > 0 && <InfoRow label="Discount" value={<span className="text-rose-600">-{formatCurrency(invoice.discount_amount)}</span>} />}
              {invoice.tax_amount > 0 && <InfoRow label="Tax" value={formatCurrency(invoice.tax_amount)} />}
              <InfoRow label="Total" value={<span className="text-base font-bold text-stone-900">{formatCurrency(invoice.total_amount)}</span>} />
              {invoice.payment_method && <InfoRow label="Payment Method" value={invoice.payment_method} />}
              {invoice.payment_date && <InfoRow label="Payment Date" value={formatDate(invoice.payment_date)} />}
            </Section>

            {/* Dates */}
            <Section icon={Calendar} title="Important Dates">
              <InfoRow label="Created" value={formatDate(invoice.created_at)} />
              {invoice.due_date && (
                <InfoRow 
                  label="Due Date" 
                  value={<span className={invoice.status === "overdue" ? "text-rose-600" : ""}>{formatDate(invoice.due_date)}</span>} 
                />
              )}
              <InfoRow label="Last Updated" value={formatDate(invoice.updated_at)} />
            </Section>
          </div>

          {/* Items Table */}
          {invoice.items && invoice.items.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-bold text-stone-800 mb-3">Invoice Items</h3>
              <div className="bg-stone-50 rounded-xl border border-stone-100 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-stone-100">
                      <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-stone-400">Item</th>
                      <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-widest text-stone-400">Qty</th>
                      <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-widest text-stone-400">Price</th>
                      <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-widest text-stone-400">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.items.map((item, idx) => (
                      <tr key={item.id || idx} className="border-b border-stone-100 last:border-0">
                        <td className="px-4 py-3">
                          <div className="font-medium text-stone-700 text-sm">{item.product_name}</div>
                          <div className="text-[11px] text-stone-400 font-mono">{item.sku}</div>
                        </td>
                        <td className="px-4 py-3 text-right text-stone-600">{item.quantity}</td>
                        <td className="px-4 py-3 text-right text-stone-600">{formatCurrency(item.unit_price)}</td>
                        <td className="px-4 py-3 text-right font-semibold text-stone-800">{formatCurrency(item.total_price)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-stone-100/50">
                      <td colSpan={3} className="px-4 py-3 text-right text-xs font-bold text-stone-600">Total</td>
                      <td className="px-4 py-3 text-right text-sm font-bold text-stone-900">{formatCurrency(invoice.total_amount)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {/* Notes */}
          {invoice.notes && (
            <div className="mt-6">
              <h3 className="text-sm font-bold text-stone-800 mb-2">Notes</h3>
              <div className="bg-stone-50 rounded-xl p-4 border border-stone-100">
                <p className="text-sm text-stone-600">{invoice.notes}</p>
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex justify-end gap-3 mt-6 pt-5 border-t border-stone-100">
            <button onClick={onClose}
              className="px-5 py-2.5 text-sm font-semibold text-stone-600 bg-white border border-stone-200 rounded-xl hover:bg-stone-50 transition-colors">
              Close
            </button>
            {invoice.status === "draft" && (
              <button onClick={() => { onEdit(invoice); onClose(); }}
                className="px-5 py-2.5 text-sm font-semibold text-white bg-stone-900 rounded-xl hover:bg-stone-800 transition-all inline-flex items-center gap-2 shadow-lg shadow-stone-900/10">
                <FileText className="h-4 w-4" /> Edit Invoice
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ==============================================
// Main Component
// ==============================================

const ManageInvoices = ({ user }: { user: User }) => {
  const router = useRouter();

  const formatCurrency = (amount: number): string => {
    const currencySymbol = user?.businesses_one?.[0]?.currency || "$";
    return new Intl.NumberFormat("en-US", {
      style: "currency", currency: "USD",
      minimumFractionDigits: 2, maximumFractionDigits: 2,
    }).format(amount).replace(/^\$/, currencySymbol);
  };

  const [filters, setFilters] = useState<FilterState>({
    search: "", status: "all", sortBy: "created_at", sortOrder: "desc", dateRange: "all",
  });
  const [openRow, setOpenRow] = useState<number | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");

  const [serverPagination, setServerPagination] = useState<PaginationInfo>({
    current_page: 1, last_page: 1, per_page: 25, total: 0,
    next_page_url: null, prev_page_url: null,
  });

  const debouncedSearch = useDebounce(filters.search, 500);

  // Fetch invoices when filters change
  useEffect(() => { fetchInvoices(1, itemsPerPage); }, [debouncedSearch, filters.status, filters.sortBy, filters.sortOrder, filters.dateRange]);

  const buildQueryString = useCallback((page: number, perPage: number) => {
    const params = new URLSearchParams();
    params.append("page", page.toString());
    params.append("per_page", perPage.toString());
    if (filters.search) params.append("search", filters.search);
    if (filters.status !== "all") params.append("status", filters.status);
    if (filters.sortBy) params.append("sort_by", filters.sortBy);
    if (filters.sortOrder !== "desc") params.append("sort_order", filters.sortOrder);
    if (filters.dateRange !== "all") params.append("date_range", filters.dateRange);
    return params.toString();
  }, [filters]);

  const fetchInvoices = useCallback(async (page = 1, perPage = 25) => {
    setIsLoading(true);
    try {
      const res = await apiGet(`/invoices?${buildQueryString(page, perPage)}`, {}, false);
      console.log(res.data);
      if (res.data?.pagination) {
        setInvoices(Array.isArray(res.data.data) ? res.data.data : []);
        setServerPagination(res.data.pagination);
      } else {
        const arr: Invoice[] = Array.isArray(res.data?.data) ? res.data.data : Array.isArray(res.data) ? res.data : [];
        setInvoices(arr);
        setServerPagination({
          current_page: 1, last_page: 1, per_page: arr.length, total: arr.length,
          next_page_url: null, prev_page_url: null,
        });
      }
    } catch (err) {
      toast.error("Failed to fetch invoices");
      setInvoices([]);
    } finally {
      setIsLoading(false);
    }
  }, [buildQueryString]);

  const handlePageChange = useCallback((page: number) => fetchInvoices(page, serverPagination.per_page), [fetchInvoices, serverPagination.per_page]);
  
  const handleItemsPerPageChange = useCallback((items: number) => { 
    setItemsPerPage(items); 
    fetchInvoices(1, items); 
  }, [fetchInvoices]);

  const handleRefresh = () => {
    fetchInvoices(serverPagination.current_page, serverPagination.per_page);
  };

  const handleDelete = async () => {
    if (isSubmitting || !selectedInvoice) return;
    setIsSubmitting(true);
    try {
      await apiDelete(`/invoices/${selectedInvoice.id}`);
      await fetchInvoices(serverPagination.current_page, serverPagination.per_page);
      toast.success("Invoice deleted successfully");
      setDeleteModalOpen(false);
      setSelectedInvoice(null);
    } catch { 
      toast.error("Failed to delete invoice"); 
    } finally { 
      setIsSubmitting(false); 
    }
  };

  const handleFilterChange = <K extends keyof FilterState>(key: K, value: FilterState[K]) =>
    setFilters((prev) => ({ ...prev, [key]: value }));

  const clearFilters = () => setFilters({ 
    search: "", status: "all", sortBy: "created_at", sortOrder: "desc", dateRange: "all" 
  });

  const activeFilterCount = useMemo(() => {
    let c = 0;
    if (filters.status !== "all") c++;
    if (filters.sortBy !== "created_at") c++;
    if (filters.sortOrder !== "desc") c++;
    if (filters.search) c++;
    if (filters.dateRange !== "all") c++;
    return c;
  }, [filters]);

  const totalItems = serverPagination.total;
  const totalPages = serverPagination.last_page;
  const startIndex = (serverPagination.current_page - 1) * serverPagination.per_page;
  const endIndex = Math.min(startIndex + invoices.length, totalItems);
  
  const getEditUrl = (inv: Invoice) => inv.encrypted_id ? `/editinvoice/${encodeURIComponent(inv.encrypted_id)}` : "#";

  // Calculate statistics
  const stats = useMemo(() => {
    const totalAmount = invoices.reduce((sum, inv) => sum + (inv.status === "paid" ? inv.total_amount : 0), 0);
    const pendingAmount = invoices.reduce((sum, inv) => sum + (inv.status === "pending" || inv.status === "overdue" ? inv.total_amount : 0), 0);
    const paidCount = invoices.filter(inv => inv.status === "paid").length;
    const overdueCount = invoices.filter(inv => inv.status === "overdue").length;
    return { totalAmount, pendingAmount, paidCount, overdueCount };
  }, [invoices]);

  return (
    <div className="min-h-screen bg-stone-100">
      {/* Header */}
      <header className="bg-white border-b border-stone-100 top-0 z-10 mt-[-13px] w-full">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard"
                className="w-9 h-9 flex items-center justify-center rounded-xl border border-stone-200 text-stone-500 hover:text-stone-800 hover:bg-stone-50 transition-colors">
                <ArrowLeft className="h-4 w-4" />
              </Link>
              <div>
                <h1 className="text-lg font-bold text-stone-900 tracking-tight">Invoices</h1>
                <p className="text-xs text-stone-400">Manage your billing & payments</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button onClick={() => setViewMode(viewMode === "table" ? "grid" : "table")}
                className="w-9 h-9 flex items-center justify-center rounded-xl border border-stone-200 text-stone-500 hover:bg-stone-50 transition-colors">
                {viewMode === "table" ? <Grid3x3 className="h-4 w-4" /> : <List className="h-4 w-4" />}
              </button>
              <button onClick={handleRefresh}
                className="w-9 h-9 flex items-center justify-center rounded-xl border border-stone-200 text-stone-500 hover:bg-stone-50 transition-colors">
                <RefreshCw className="h-4 w-4" />
              </button>
              <Link href="/newinvoice"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-stone-900 text-white text-sm font-bold rounded-xl hover:bg-stone-800 transition-all shadow-md shadow-stone-900/10">
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Create Invoice</span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-6">
        {/* Statistics Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Total Invoices", value: totalItems, icon: FileText, color: "stone" },
            { label: "Paid Invoices", value: stats.paidCount, icon: CheckCircle, color: "emerald" },
            { label: "Overdue", value: stats.overdueCount, icon: AlertCircle, color: "rose" },
            { label: "Outstanding Amount", value: formatCurrency(stats.pendingAmount), icon: DollarSign, color: "amber" },
          ].map(({ label, value, icon: Icon, color }) => {
            const colors = {
              stone: "bg-stone-100 text-stone-600",
              emerald: "bg-emerald-50 text-emerald-600",
              rose: "bg-rose-50 text-rose-600",
              amber: "bg-amber-50 text-amber-600",
            };
            return (
              <div key={label} className="bg-white rounded-2xl border border-stone-100 p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colors[color as keyof typeof colors]}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider">{label}</p>
                    <p className="text-lg font-bold text-stone-900 leading-none mt-0.5">{value}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Search + Filter */}
        <div className="flex gap-3 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 h-4 w-4" />
            <input
              type="text"
              value={filters.search}
              onChange={(e) => handleFilterChange("search", e.target.value)}
              placeholder="Search by invoice number, customer name..."
              className="w-full pl-11 pr-4 py-2.5 bg-white border border-stone-200 rounded-xl focus:ring-2 focus:ring-stone-500/10 focus:border-stone-500 outline-none transition text-sm placeholder-stone-400 shadow-sm"
            />
            {filters.search && (
              <button onClick={() => handleFilterChange("search", "")}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded-full bg-stone-200 text-stone-500 hover:bg-stone-300 transition-colors">
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
          <button
            onClick={() => setFilterDrawerOpen(true)}
            className="relative flex items-center gap-2 px-4 py-2.5 bg-white border border-stone-200 rounded-xl hover:bg-stone-50 transition-colors shadow-sm text-sm font-semibold text-stone-600"
          >
            <Filter className="h-4 w-4" />
            <span className="hidden sm:inline">Filters</span>
            {activeFilterCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-stone-900 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* Status Chips */}
        <div className="flex items-center gap-2 mb-5">
          {["All", "Draft", "Pending", "Paid", "Overdue", "Cancelled"].map((label) => {
            const val = label.toLowerCase();
            const isActive = filters.status === val || (label === "All" && filters.status === "all");
            return (
              <button key={label}
                onClick={() => handleFilterChange("status", label === "All" ? "all" : val)}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-full transition-all border ${
                  isActive
                    ? "bg-stone-900 text-white border-stone-900 shadow-sm"
                    : "bg-white text-stone-600 border-stone-200 hover:border-stone-300 hover:bg-stone-50"
                }`}>
                {label}
              </button>
            );
          })}
          {activeFilterCount > 0 && (
            <button onClick={clearFilters}
              className="ml-auto flex items-center gap-1.5 text-xs font-semibold text-stone-700 hover:underline">
              <FilterX className="h-3.5 w-3.5" /> Clear filters
            </button>
          )}
        </div>

        {/* Result count */}
        <p className="text-xs text-stone-400 mb-4 font-medium">
          Showing <span className="text-stone-700 font-bold">{totalItems > 0 ? startIndex + 1 : 0}–{endIndex}</span> of{" "}
          <span className="text-stone-700 font-bold">{totalItems}</span> invoices
        </p>

        {/* Content */}
        {isLoading && <LoadingState />}

        {!isLoading && invoices.length === 0 && (
          <EmptyState
            title={filters.search ? "No invoices found" : "No invoices yet"}
            description={filters.search ? "Try adjusting your search or filters." : "Create your first invoice to get started."}
            icon={Receipt}
            action={
              filters.search || activeFilterCount > 0
                ? { label: "Clear Filters", onClick: clearFilters }
                : { label: "Create Invoice", href: "/newinvoice" }
            }
          />
        )}

        {!isLoading && invoices.length > 0 && viewMode === "table" && (
          <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-stone-100">
                    {["#", "Invoice", "Customer", "Status", "Amount", "Due Date", ""].map((h, i) => (
                      <th key={i}
                        className={`px-5 py-3.5 text-left text-[10px] font-bold uppercase tracking-widest text-stone-400 bg-stone-50/70 ${
                          i === 3 ? "hidden lg:table-cell" : i === 5 ? "hidden md:table-cell" : i === 4 ? "text-right" : ""
                        }`}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((invoice, index) => (
                    <InvoiceRow
                      key={invoice.id}
                      invoice={invoice} 
                      index={index} 
                      startIndex={startIndex}
                      onView={(inv) => { setSelectedInvoice(inv); setViewModalOpen(true); }}
                      onEdit={(inv) => router.push(getEditUrl(inv))}
                      onDelete={(inv) => { setSelectedInvoice(inv); setDeleteModalOpen(true); }}
                      isOpen={openRow === invoice.id}
                      onToggleOpen={(id, position) => {
                        if (id === null) {
                          setOpenRow(null);
                        } else {
                          setOpenRow(id);
                          if (position) setDropdownPosition(position);
                        }
                      }}
                      formatCurrency={formatCurrency}
                    />
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              currentPage={serverPagination.current_page} totalPages={totalPages}
              totalItems={totalItems} startIndex={startIndex} endIndex={endIndex}
              itemsPerPage={serverPagination.per_page}
              onPageChange={handlePageChange} onItemsPerPageChange={handleItemsPerPageChange}
            />
          </div>
        )}

        {!isLoading && invoices.length > 0 && viewMode === "grid" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {invoices.map((invoice) => (
                <InvoiceGridCard key={invoice.id} invoice={invoice}
                  onView={(inv) => { setSelectedInvoice(inv); setViewModalOpen(true); }}
                  onEdit={(inv) => router.push(getEditUrl(inv))}
                  onDelete={(inv) => { setSelectedInvoice(inv); setDeleteModalOpen(true); }}
                  formatCurrency={formatCurrency}
                />
              ))}
            </div>
            <Pagination
              currentPage={serverPagination.current_page} totalPages={totalPages}
              totalItems={totalItems} startIndex={startIndex} endIndex={endIndex}
              itemsPerPage={serverPagination.per_page}
              onPageChange={handlePageChange} onItemsPerPageChange={handleItemsPerPageChange}
            />
          </div>
        )}
      </main>

      {/* Dropdown Portal */}
      {openRow !== null && (
        <DropdownPortal
          position={dropdownPosition}
          onView={() => {
            const invoice = invoices.find(inv => inv.id === openRow);
            if (invoice) { setSelectedInvoice(invoice); setViewModalOpen(true); }
            setOpenRow(null);
          }}
          onEdit={() => {
            const invoice = invoices.find(inv => inv.id === openRow);
            if (invoice) router.push(getEditUrl(invoice));
            setOpenRow(null);
          }}
          onDelete={() => {
            const invoice = invoices.find(inv => inv.id === openRow);
            if (invoice) { setSelectedInvoice(invoice); setDeleteModalOpen(true); }
            setOpenRow(null);
          }}
          onClose={() => setOpenRow(null)}
          invoice={invoices.find(inv => inv.id === openRow)!}
        />
      )}

      {/* Modals & Drawers */}
      <FilterDrawer 
        isOpen={filterDrawerOpen} 
        onClose={() => setFilterDrawerOpen(false)}
        filters={filters} 
        totalItems={totalItems}
        onFilterChange={handleFilterChange} 
        onClearFilters={clearFilters} 
        activeFilterCount={activeFilterCount}
      />
      <DeleteModal 
        isOpen={deleteModalOpen}
        onClose={() => { setDeleteModalOpen(false); setSelectedInvoice(null); }}
        onConfirm={handleDelete} 
        invoiceNumber={selectedInvoice?.invoice_number || ""} 
        isSubmitting={isSubmitting}
      />
      <ViewInvoiceModal 
        isOpen={viewModalOpen}
        onClose={() => { setViewModalOpen(false); setSelectedInvoice(null); }}
        invoice={selectedInvoice}
        onEdit={(inv) => { setViewModalOpen(false); router.push(getEditUrl(inv)); }}
        formatCurrency={formatCurrency}
      />
    </div>
  );
};

export default withAuth(ManageInvoices);