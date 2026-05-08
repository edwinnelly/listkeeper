"use client";
import { withAuth } from "@/hoc/withAuth";
import { apiGet, apiDelete } from "@/lib/axios";
import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Edit,
  Trash2,
  Search,
  MoreVertical,
  X,
  AlertTriangle,
  ArrowLeft,
  Loader2,
  RefreshCw,
  Eye,
  Package,
  Tag,
  DollarSign,
  Hash,
  Star,
  Grid3x3,
  List,
  Filter,
  TrendingUp,
  TrendingDown,
  ChevronRight,
  ChevronsRight,
  Minus,
  Layers,
  ChevronsLeft,
  ChevronLeft,
  Box,
  Plus,
  FilterX,
  Barcode,
  BarChart3,
  Calendar,
  Scale,
  Info,
  SlidersHorizontal,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import ShortTextWithTooltip from "../component/shorten_len";

// ==============================================
// TypeScript Interfaces
// ==============================================

interface Product {
  id: number;
  name: string;
  sku: string;
  description: string | null;
  category_id: number;
  price: string | number | null;
  cost_price: string | number | null;
  sale_price: string | number | null;
  stock_quantity: string | number | null;
  low_stock_threshold: string | number | null;
  discount_percentage: string | number | null;
  discount_start_date: string | null;
  discount_end_date: string | null;
  manufactured_at: string | null;
  expires_at: string | null;
  weight: string | number | null;
  length: string | null;
  width: string | null;
  height: string | null;
  dimensions: string | null;
  supplier_id: number | null;
  is_active: boolean;
  is_featured: boolean;
  is_on_sale: boolean;
  is_out_of_stock: boolean;
  image: string | null;
  created_at: string;
  updated_at: string;
  encrypted_id: string | null;
  barcode?: string | null;
  category?: { id: number; name: string };
  unit?: { id: number; name: string; symbol: string };
  supplier?: { id: number; vid: number; name: string };
}

interface Category {
  id: number;
  name: string;
}

interface FilterState {
  search: string;
  status: "all" | "active" | "inactive";
  category: string;
  sortBy: "name" | "price" | "created";
  sortOrder: "asc" | "desc";
}

interface ApiError {
  response?: { data?: unknown };
  message?: string;
}

interface User {
  businesses_one?: Array<{ currency?: string }>;
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
// Sub-components
// ==============================================

const Badge: React.FC<{
  children: React.ReactNode;
  variant: "active" | "inactive" | "featured" | "sale";
}> = ({ children, variant }) => {
  const styles = {
    active: "bg-emerald-50 text-emerald-700 border border-emerald-200 ring-1 ring-emerald-100",
    inactive: "bg-stone-100 text-stone-500 border border-stone-200",
    featured: "bg-amber-50 text-amber-700 border border-amber-200",
    sale: "bg-rose-50 text-rose-700 border border-rose-200",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold tracking-wide ${styles[variant]}`}>
      {children}
    </span>
  );
};

const ProfitTrend: React.FC<{ product: Product }> = ({ product }) => {
  const price = toNumber(product.price);
  const costPrice = toNumber(product.cost_price);
  if (!price || !costPrice) return null;
  const margin = ((price - costPrice) / costPrice) * 100;
  let Icon = Minus;
  let cls = "text-amber-500 bg-amber-50";
  if (margin > 20) { Icon = TrendingUp; cls = "text-emerald-600 bg-emerald-50"; }
  else if (margin < 10) { Icon = TrendingDown; cls = "text-rose-600 bg-rose-50"; }
  return (
    <span className={`ml-1.5 inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${cls}`}>
      <Icon className="h-2.5 w-2.5" />
      {margin.toFixed(0)}%
    </span>
  );
};

const ProductImage: React.FC<{
  src?: string | null;
  alt: string;
  className?: string;
}> = ({ src, alt, className = "w-10 h-10" }) => {
  const [error, setError] = useState(false);
  return (
    <div className={`${className} bg-[#1e3a5f]/5 rounded-xl flex items-center justify-center flex-shrink-0 border border-[#1e3a5f]/10 overflow-hidden relative`}>
      {src && !error ? (
        <Image
          src={`http://localhost:8000/storage/${src}`}
          alt={alt} fill
          className="object-cover"
          onError={() => setError(true)}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
      ) : (
        <Package className="h-4 w-4 text-[#09121d]/40" />
      )}
    </div>
  );
};

const EmptyState: React.FC<{
  title: string;
  description: string;
  icon: React.ElementType;
  action?: { label: string; onClick?: () => void; href?: string };
}> = ({ title, description, icon: Icon, action }) => (
  <div className="bg-white rounded-2xl border border-stone-100 shadow-sm py-20">
    <div className="flex flex-col items-center text-center max-w-sm mx-auto">
      <div className="w-16 h-16 bg-[#1e3a5f]/5 rounded-2xl flex items-center justify-center mb-5 border border-[#1e3a5f]/10">
        <Icon className="h-8 w-8 text-[#09121d]/40" />
      </div>
      <h3 className="text-base font-semibold text-stone-800 mb-1.5">{title}</h3>
      <p className="text-sm text-stone-400 mb-6 leading-relaxed">{description}</p>
      {action && (
        action.href ? (
          <Link href={action.href} className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1e3a5f] text-white text-sm font-semibold rounded-xl hover:bg-[#2c4c6e] transition-all shadow-lg shadow-[#1e3a5f]/20">
            <Plus className="h-4 w-4" /> {action.label}
          </Link>
        ) : (
          <button onClick={action.onClick} className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1e3a5f] text-white text-sm font-semibold rounded-xl hover:bg-[#2c4c6e] transition-all shadow-lg shadow-[#1e3a5f]/20">
            <Plus className="h-4 w-4" /> {action.label}
          </button>
        )
      )}
    </div>
  </div>
);

const LoadingState: React.FC = () => (
  <div className="bg-white rounded-2xl border border-stone-100 shadow-sm py-20">
    <div className="flex flex-col items-center justify-center">
      <div className="relative w-14 h-14 mb-5">
        <div className="w-14 h-14 rounded-full border-[3px] border-[#1e3a5f]/10" />
        <div className="absolute inset-0 w-14 h-14 rounded-full border-[3px] border-[#1e3a5f] border-t-transparent animate-spin" />
        <Package className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-5 w-5 text-[#09121d]/50" />
      </div>
      <p className="text-sm font-semibold text-stone-700">Loading products</p>
      <p className="text-xs text-stone-400 mt-1">Please wait a moment</p>
    </div>
  </div>
);

// ==============================================
// Delete Modal
// ==============================================
const DeleteModal: React.FC<{
  isOpen: boolean; onClose: () => void; onConfirm: () => void;
  productName: string; isSubmitting: boolean;
}> = ({ isOpen, onClose, onConfirm, productName, isSubmitting }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-stone-900/50 backdrop-blur-sm z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="p-6 text-center">
          <div className="w-14 h-14 flex items-center justify-center rounded-2xl bg-rose-50 border border-rose-100 mx-auto mb-4">
            <AlertTriangle className="w-6 h-6 text-rose-500" />
          </div>
          <h2 className="text-lg font-bold text-stone-900 mb-1.5">Delete Product</h2>
          <p className="text-sm text-stone-500 leading-relaxed mb-6">
            Are you sure you want to delete{" "}
            <span className="font-semibold text-stone-800">"{productName}"</span>?
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
// Pagination
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
            className="px-2 py-1.5 text-xs border border-stone-200 rounded-lg bg-white focus:ring-2 focus:ring-[#1e3a5f]/10 focus:border-[#1e3a5f] outline-none font-medium"
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
                      ? "bg-[#1e3a5f] text-white shadow-sm shadow-[#1e3a5f]/30"
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
// Table Row
// ==============================================
const ProductTableRow: React.FC<{
  product: Product; index: number; startIndex: number;
  onView: (p: Product) => void; onEdit: (p: Product) => void; onDelete: (p: Product) => void;
  isOpen: boolean; onToggleOpen: (id: number | null) => void;
  formatCurrency: (amount: number) => string;
}> = ({ product, index, startIndex, onView, onEdit, onDelete, isOpen, onToggleOpen, formatCurrency }) => (
  <tr className="hover:bg-[#1e3a5f]/[0.02] transition-colors group border-b border-stone-100 last:border-0">
    <td className="px-5 py-3.5 text-xs text-stone-400 font-medium tabular-nums w-10">
      {startIndex + index + 1}
    </td>
    <td className="px-5 py-3.5">
      <div className="flex items-center gap-3">
        <ProductImage src={product.image} alt={product.name} />
        <div className="min-w-0">
          <div className="text-sm font-semibold text-stone-800 truncate">
            <ShortTextWithTooltip text={product.name} max={30} />
          </div>
          <div className="flex items-center gap-1 mt-0.5">
            <Hash className="h-2.5 w-2.5 text-stone-400" />
            <span className="text-[11px] text-stone-400 font-mono">{product.sku}</span>
          </div>
        </div>
      </div>
    </td>
    <td className="px-5 py-3.5">
      <code className="text-[11px] bg-stone-100 text-stone-600 px-2 py-1 rounded-lg font-mono border border-stone-200">
        {product.barcode || product.sku}
      </code>
    </td>
    <td className="px-5 py-3.5 hidden lg:table-cell">
      <span className="text-sm text-stone-600">
        {product.category?.name || "—"}
      </span>
    </td>
    <td className="px-5 py-3.5">
      <div className="flex items-center">
        <span className="text-sm font-bold text-stone-900">
          {formatCurrency(toNumber(product.price))}
        </span>
        <ProfitTrend product={product} />
      </div>
    </td>
    <td className="px-5 py-3.5 hidden sm:table-cell">
      <Badge variant={product.is_active ? "active" : "inactive"}>
        {product.is_active ? "Active" : "Inactive"}
      </Badge>
    </td>
    <td className="px-5 py-3.5 relative">
      <button
        onClick={() => onToggleOpen(isOpen ? null : product.id)}
        className="w-8 h-8 flex items-center justify-center rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors"
      >
        <MoreVertical className="h-4 w-4" />
      </button>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => onToggleOpen(null)} />
          <div className="absolute right-4 top-full mt-1 z-40 w-44 bg-white border border-stone-100 rounded-xl shadow-xl shadow-stone-900/10 overflow-hidden">
            {[
              { label: "View Details", icon: Eye, cls: "text-[#09121d]", action: () => { onView(product); onToggleOpen(null); } },
              { label: "Edit Product", icon: Edit, cls: "text-stone-500", action: () => { onEdit(product); onToggleOpen(null); } },
              { label: "Delete", icon: Trash2, cls: "text-rose-500", action: () => { onDelete(product); onToggleOpen(null); }, danger: true },
            ].map(({ label, icon: Icon, cls, action, danger }) => (
              <button
                key={label}
                onClick={action}
                className={`flex items-center gap-2.5 w-full px-4 py-2.5 text-sm font-medium transition-colors ${
                  danger
                    ? "text-rose-600 hover:bg-rose-50 border-t border-stone-100"
                    : "text-stone-700 hover:bg-stone-50"
                }`}
              >
                <Icon className={`h-3.5 w-3.5 ${cls}`} />
                {label}
              </button>
            ))}
          </div>
        </>
      )}
    </td>
  </tr>
);

// ==============================================
// Grid Card
// ==============================================
const ProductGridCard: React.FC<{
  product: Product;
  onView: (p: Product) => void;
  onEdit: (p: Product) => void;
  onDelete: (p: Product) => void;
  formatCurrency: (amount: number) => string;
}> = ({ product, onView, onEdit, onDelete, formatCurrency }) => (
  <div className="bg-white rounded-2xl border border-stone-100 shadow-sm hover:shadow-md hover:border-stone-200 transition-all group overflow-hidden">
    <div className="relative aspect-square bg-stone-50 overflow-hidden">
      {product.image ? (
        <Image
          src={`http://localhost:8000/storage/${product.image}`}
          alt={product.name} fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <Package className="h-10 w-10 text-stone-300" />
        </div>
      )}
      <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5">
        {product.is_featured && <Badge variant="featured"><Star className="h-2.5 w-2.5 mr-1" />Featured</Badge>}
        {product.is_on_sale && <Badge variant="sale"><Tag className="h-2.5 w-2.5 mr-1" />Sale</Badge>}
      </div>
      <div className="absolute top-2.5 right-2.5">
        <Badge variant={product.is_active ? "active" : "inactive"}>
          {product.is_active ? "Active" : "Inactive"}
        </Badge>
      </div>
    </div>
    <div className="p-4">
      <h3 className="text-sm font-bold text-stone-900 mb-0.5 truncate">
        <ShortTextWithTooltip text={product.name} max={25} />
      </h3>
      <p className="text-[11px] text-stone-400 font-mono mb-3">
        {product.barcode || product.sku}
      </p>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <span className="text-base font-bold text-[#09121d]">
            {formatCurrency(toNumber(product.price))}
          </span>
          <ProfitTrend product={product} />
        </div>
        <span className="text-[11px] text-stone-400 bg-stone-50 px-2 py-0.5 rounded-md border border-stone-100">
          {product.category?.name || "—"}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-1.5 pt-3 border-t border-stone-100">
        {[
          { label: "View", icon: Eye, action: () => onView(product), cls: "hover:text-[#09121d] hover:bg-[#1e3a5f]/5" },
          { label: "Edit", icon: Edit, action: () => onEdit(product), cls: "hover:text-[#09121d] hover:bg-[#1e3a5f]/5" },
          { label: "Delete", icon: Trash2, action: () => onDelete(product), cls: "hover:text-rose-600 hover:bg-rose-50" },
        ].map(({ label, icon: Icon, action, cls }) => (
          <button key={label} onClick={action} title={label}
            className={`flex items-center justify-center gap-1 p-2 rounded-lg text-stone-400 transition-colors text-xs font-medium ${cls}`}>
            <Icon className="h-3.5 w-3.5" />
          </button>
        ))}
      </div>
    </div>
  </div>
);

// ==============================================
// Filter Drawer
// ==============================================
const FilterDrawer: React.FC<{
  isOpen: boolean; onClose: () => void; filters: FilterState;
  categories: Category[]; totalItems: number;
  onFilterChange: <K extends keyof FilterState>(key: K, value: FilterState[K]) => void;
  onClearFilters: () => void; activeFilterCount: number;
}> = ({ isOpen, onClose, filters, categories, totalItems, onFilterChange, onClearFilters, activeFilterCount }) => {
  if (!isOpen) return null;

  const selectCls = "w-full px-3 py-2.5 bg-white border border-stone-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#1e3a5f]/10 focus:border-[#1e3a5f] outline-none transition text-stone-700";

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-80 bg-white shadow-2xl flex flex-col">
        <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-[#1e3a5f]/5 rounded-lg flex items-center justify-center">
              <SlidersHorizontal className="h-4 w-4 text-[#09121d]" />
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
          {[
            { label: "Status", key: "status" as const, options: [{ value: "all", label: "All Status" }, { value: "active", label: "Active" }, { value: "inactive", label: "Inactive" }] },
          ].map(({ label, key, options }) => (
            <div key={key}>
              <label className="text-[11px] font-bold text-stone-400 uppercase tracking-widest mb-2 block">{label}</label>
              <select value={filters[key]} onChange={(e) => onFilterChange(key, e.target.value as FilterState[typeof key])} className={selectCls}>
                {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          ))}

          <div>
            <label className="text-[11px] font-bold text-stone-400 uppercase tracking-widest mb-2 block">Category</label>
            <select value={filters.category} onChange={(e) => onFilterChange("category", e.target.value)} className={selectCls}>
              <option value="all">All Categories</option>
              {categories.map((c) => <option key={c.id} value={c.id.toString()}>{c.name}</option>)}
            </select>
          </div>

          <div>
            <label className="text-[11px] font-bold text-stone-400 uppercase tracking-widest mb-2 block">Sort By</label>
            <select value={filters.sortBy} onChange={(e) => onFilterChange("sortBy", e.target.value as FilterState["sortBy"])} className={selectCls}>
              <option value="name">Name</option>
              <option value="price">Price</option>
              <option value="created">Date Added</option>
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
                      ? "bg-[#1e3a5f] text-white border-[#1e3a5f] shadow-sm shadow-[#1e3a5f]/20"
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
              <span className="font-bold text-stone-800">{totalItems}</span> products found
            </p>
            {activeFilterCount > 0 && (
              <button onClick={onClearFilters} className="text-xs text-[#09121d] font-semibold hover:underline inline-flex items-center gap-1">
                <FilterX size={12} /> Clear all
              </button>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-full py-3 bg-[#1e3a5f] text-white text-sm font-bold rounded-xl hover:bg-[#2c4c6e] transition-colors shadow-sm shadow-[#1e3a5f]/20"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
};

// ==============================================
// View Product Modal
// ==============================================
const ViewProductModal: React.FC<{
  isOpen: boolean; onClose: () => void; product: Product | null;
  onEdit: (p: Product) => void; formatCurrency: (amount: number) => string;
}> = ({ isOpen, onClose, product, onEdit, formatCurrency }) => {
  if (!isOpen || !product) return null;

  const InfoRow = ({ label, value, valueClass = "" }: { label: string; value: React.ReactNode; valueClass?: string }) => (
    <div className="flex items-start justify-between py-2.5 border-b border-stone-50 last:border-0">
      <span className="text-xs text-stone-400 font-medium">{label}</span>
      <span className={`text-xs font-semibold text-stone-800 text-right max-w-[55%] ${valueClass}`}>{value}</span>
    </div>
  );

  const Section = ({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) => (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <div className="w-6 h-6 bg-[#1e3a5f]/5 rounded-lg flex items-center justify-center">
          <Icon className="h-3.5 w-3.5 text-[#09121d]/60" />
        </div>
        <h3 className="text-xs font-bold text-stone-500 uppercase tracking-widest">{title}</h3>
      </div>
      <div className="bg-stone-50 rounded-xl px-4 border border-stone-100">{children}</div>
    </div>
  );

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-stone-900/50 backdrop-blur-sm z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-stone-100 px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3.5">
            <ProductImage src={product.image} alt={product.name} className="w-11 h-11" />
            <div>
              <h2 className="text-base font-bold text-stone-900">{product.name}</h2>
              <p className="text-xs text-stone-400 font-mono">SKU: {product.sku}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-5">
              <Section icon={Info} title="Basic Information">
                <InfoRow label="Barcode" value={<span className="font-mono">{product.barcode || product.sku}</span>} />
                <InfoRow label="Category" value={product.category?.name || "—"} />
                <InfoRow label="Unit" value={product.unit ? `${product.unit.name} (${product.unit.symbol})` : "—"} />
                <InfoRow label="Status"
                  value={<Badge variant={product.is_active ? "active" : "inactive"}>{product.is_active ? "Active" : "Inactive"}</Badge>}
                />
                {product.supplier && <InfoRow label="Supplier" value={product.supplier.name} />}
                {product.description && (
                  <div className="py-2.5">
                    <p className="text-xs text-stone-400 font-medium mb-1">Description</p>
                    <p className="text-xs text-stone-700 leading-relaxed">{product.description}</p>
                  </div>
                )}
              </Section>

              <Section icon={DollarSign} title="Pricing">
                <InfoRow label="Selling Price" value={<span className="text-sm font-bold text-[#09121d]">{formatCurrency(toNumber(product.price))}</span>} />
                {toNumber(product.cost_price) > 0 && <InfoRow label="Cost Price" value={formatCurrency(toNumber(product.cost_price))} />}
                {product.is_on_sale && product.sale_price && (
                  <InfoRow label="Sale Price" value={<span className="text-rose-600">{formatCurrency(toNumber(product.sale_price))}</span>} />
                )}
                {toNumber(product.discount_percentage) > 0 && (
                  <InfoRow label="Discount" value={<span className="text-rose-600">{toNumber(product.discount_percentage)}%</span>} />
                )}
              </Section>
            </div>

            <div className="space-y-5">
              <Section icon={Calendar} title="Dates">
                {product.discount_start_date && <InfoRow label="Discount Start" value={formatDate(product.discount_start_date)} />}
                {product.discount_end_date && <InfoRow label="Discount End" value={formatDate(product.discount_end_date)} />}
                {product.manufactured_at && <InfoRow label="Manufactured" value={formatDate(product.manufactured_at)} />}
                {product.expires_at && (
                  <InfoRow label="Expires" value={<span className="text-rose-600">{formatDate(product.expires_at)}</span>} />
                )}
                <InfoRow label="Created" value={formatDate(product.created_at)} />
                <InfoRow label="Updated" value={formatDate(product.updated_at)} />
              </Section>

              {(product.dimensions || product.weight || product.length || product.width || product.height) && (
                <Section icon={Scale} title="Dimensions & Weight">
                  {product.dimensions && <InfoRow label="Dimensions" value={product.dimensions} />}
                  {toNumber(product.weight) > 0 && (
                    <InfoRow label="Weight" value={`${formatNumber(product.weight)} ${product.unit?.symbol || "kg"}`} />
                  )}
                  {(product.length || product.width || product.height) && (
                    <InfoRow label="L × W × H" value={`${product.length || "0"} × ${product.width || "0"} × ${product.height || "0"}`} />
                  )}
                </Section>
              )}
            </div>
          </div>

          {/* Profit Card */}
          {toNumber(product.price) > 0 && toNumber(product.cost_price) > 0 && (
            <div className="mt-6 bg-gradient-to-br from-[#1e3a5f] to-[#2c4c6e] rounded-2xl p-5 text-white">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="h-4 w-4 text-white/60" />
                <span className="text-xs font-bold uppercase tracking-widest text-white/60">Profit Analysis</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-white/50 mb-0.5">Profit per Unit</p>
                  <p className="text-2xl font-bold text-white">
                    {formatCurrency(toNumber(product.price) - toNumber(product.cost_price))}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-white/50 mb-0.5">Profit Margin</p>
                  <p className="text-2xl font-bold text-white">
                    {(((toNumber(product.price) - toNumber(product.cost_price)) / toNumber(product.cost_price)) * 100).toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="flex justify-end gap-3 mt-6 pt-5 border-t border-stone-100">
            <button onClick={onClose}
              className="px-5 py-2.5 text-sm font-semibold text-stone-600 bg-white border border-stone-200 rounded-xl hover:bg-stone-50 transition-colors">
              Close
            </button>
            <button onClick={() => { onEdit(product); onClose(); }}
              className="px-5 py-2.5 text-sm font-semibold text-white bg-[#1e3a5f] rounded-xl hover:bg-[#2c4c6e] transition-all inline-flex items-center gap-2 shadow-lg shadow-[#1e3a5f]/20">
              <Edit className="h-4 w-4" /> Edit Product
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==============================================
// Main Component
// ==============================================
const ManageProducts = ({ user }: { user: User }) => {
  const router = useRouter();

  const formatCurrency = (amount: number): string => {
    const currencySymbol = user?.businesses_one?.[0]?.currency || "$";
    return new Intl.NumberFormat("en-US", {
      style: "currency", currency: "USD",
      minimumFractionDigits: 2, maximumFractionDigits: 2,
    }).format(amount).replace(/^\$/, currencySymbol);
  };

  const [filters, setFilters] = useState<FilterState>({
    search: "", status: "all", category: "all", sortBy: "name", sortOrder: "asc",
  });
  const [openRow, setOpenRow] = useState<number | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");

  const [serverPagination, setServerPagination] = useState<PaginationInfo>({
    current_page: 1, last_page: 1, per_page: 50, total: 0,
    next_page_url: null, prev_page_url: null,
  });

  const debouncedSearch = useDebounce(filters.search, 500);

  useEffect(() => { fetchProducts(1, itemsPerPage); fetchCategories(); }, []);
  useEffect(() => { fetchProducts(1, itemsPerPage); }, [debouncedSearch, filters.status, filters.category, filters.sortBy, filters.sortOrder]);

  const buildQueryString = useCallback((page: number, perPage: number) => {
    const params = new URLSearchParams();
    params.append("page", page.toString());
    params.append("per_page", perPage.toString());
    if (filters.search) params.append("search", filters.search);
    if (filters.status !== "all") params.append("status", filters.status);
    if (filters.category !== "all" && filters.category) params.append("category", filters.category);
    if (filters.sortBy !== "name") params.append("sort_by", filters.sortBy === "created" ? "created_at" : filters.sortBy);
    if (filters.sortOrder !== "asc") params.append("sort_order", filters.sortOrder);
    return params.toString();
  }, [filters]);

  const fetchProducts = useCallback(async (page = 1, perPage = 50) => {
    setIsLoading(true);
    try {
      const res = await apiGet(`/products?${buildQueryString(page, perPage)}`, {}, false);
      if (res.data?.pagination) {
        setProducts(Array.isArray(res.data.data) ? res.data.data : []);
        setServerPagination(res.data.pagination);
      } else {
        const arr: Product[] = Array.isArray(res.data?.data) ? res.data.data : Array.isArray(res.data) ? res.data : [];
        setProducts(arr);
        setServerPagination({ current_page: 1, last_page: 1, per_page: arr.length, total: arr.length, next_page_url: null, prev_page_url: null });
      }
    } catch (err) {
      toast.error("Failed to fetch products");
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  }, [buildQueryString]);

  const fetchCategories = async () => {
    try {
      const res = await apiGet("/product-categories", {}, false);
      const arr = res.data?.data?.product_categories ?? res.data?.data ?? [];
      setCategories(Array.isArray(arr) ? arr : []);
    } catch { setCategories([]); }
  };

  const handlePageChange = useCallback((page: number) => fetchProducts(page, serverPagination.per_page), [fetchProducts, serverPagination.per_page]);
  const handleItemsPerPageChange = useCallback((items: number) => { setItemsPerPage(items); fetchProducts(1, items); }, [fetchProducts]);
  const handleRefresh = () => { fetchProducts(serverPagination.current_page, serverPagination.per_page); toast.success("Refreshed"); };

  const handleDelete = async () => {
    if (isSubmitting || !selectedProduct) return;
    setIsSubmitting(true);
    try {
      await apiDelete(`/products/${selectedProduct.id}`);
      await fetchProducts(serverPagination.current_page, serverPagination.per_page);
      toast.success("Product deleted successfully");
      setDeleteModalOpen(false);
      setSelectedProduct(null);
    } catch { toast.error("Failed to delete product"); } finally { setIsSubmitting(false); }
  };

  const handleFilterChange = <K extends keyof FilterState>(key: K, value: FilterState[K]) =>
    setFilters((prev) => ({ ...prev, [key]: value }));

  const clearFilters = () => setFilters({ search: "", status: "all", category: "all", sortBy: "name", sortOrder: "asc" });

  const activeFilterCount = useMemo(() => {
    let c = 0;
    if (filters.status !== "all") c++;
    if (filters.category !== "all") c++;
    if (filters.sortBy !== "name") c++;
    if (filters.sortOrder !== "asc") c++;
    if (filters.search) c++;
    return c;
  }, [filters]);

  const totalItems = serverPagination.total;
  const totalPages = serverPagination.last_page;
  const startIndex = (serverPagination.current_page - 1) * serverPagination.per_page;
  const endIndex = Math.min(startIndex + products.length, totalItems);
  const getEditUrl = (p: Product) => p.encrypted_id ? `/editproduct/${encodeURIComponent(p.encrypted_id)}` : "#";

  return (
    <div className="min-h-screen bg-[#f5f5f4]">
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
                <h1 className="text-lg font-bold text-stone-900 tracking-tight">Product Catalog</h1>
                <p className="text-xs text-stone-400">Manage your inventory</p>
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
              <Link href="/newproduct"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#091521] text-white text-sm font-bold rounded-xl hover:bg-[#0d1722] transition-all shadow-md shadow-[#1e3a5f]/20">
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Add Product</span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-6">
        {/* Stat Row */}
        <div className="mb-5">
          <div className="inline-flex items-center gap-3 bg-white border border-stone-100 rounded-2xl px-5 py-3.5 shadow-sm">
            <div className="w-9 h-9 bg-[#1e3a5f]/5 rounded-xl flex items-center justify-center">
              <Package className="h-4 w-4 text-[#09121d]" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider">Total Products</p>
              <p className="text-2xl font-bold text-stone-900 leading-none">{totalItems.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Search + Filter */}
        <div className="flex gap-3 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 h-4 w-4" />
            <input
              type="text"
              value={filters.search}
              onChange={(e) => handleFilterChange("search", e.target.value)}
              placeholder="Search by name, SKU, barcode..."
              className="w-full pl-11 pr-4 py-2.5 bg-white border border-stone-200 rounded-xl focus:ring-2 focus:ring-[#1e3a5f]/10 focus:border-[#1e3a5f] outline-none transition text-sm placeholder-stone-400 shadow-sm"
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
            <SlidersHorizontal className="h-4 w-4" />
            <span className="hidden sm:inline">Filters</span>
            {activeFilterCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-[#1e3a5f] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* Status Chips */}
        <div className="flex items-center gap-2 mb-5">
          {["All", "Active", "Inactive"].map((label) => {
            const val = label.toLowerCase() as "all" | "active" | "inactive";
            const isActive = filters.status === val || (label === "All" && filters.status === "all");
            return (
              <button key={label}
                onClick={() => handleFilterChange("status", val)}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-full transition-all border ${
                  isActive
                    ? "bg-[#1e3a5f] text-white border-[#1e3a5f] shadow-sm"
                    : "bg-white text-stone-600 border-stone-200 hover:border-stone-300 hover:bg-stone-50"
                }`}>
                {label}
              </button>
            );
          })}
          {activeFilterCount > 0 && (
            <button onClick={clearFilters}
              className="ml-auto flex items-center gap-1.5 text-xs font-semibold text-[#09121d] hover:underline">
              <FilterX className="h-3.5 w-3.5" /> Clear filters
            </button>
          )}
        </div>

        {/* Result count */}
        <p className="text-xs text-stone-400 mb-4 font-medium">
          Showing <span className="text-stone-700 font-bold">{totalItems > 0 ? startIndex + 1 : 0}–{endIndex}</span> of{" "}
          <span className="text-stone-700 font-bold">{totalItems}</span> products
        </p>

        {/* Content */}
        {isLoading && <LoadingState />}

        {!isLoading && products.length === 0 && (
          <EmptyState
            title={filters.search ? "No products found" : "No products yet"}
            description={filters.search ? "Try adjusting your search or filters." : "Add your first product to get started."}
            icon={Package}
            action={
              filters.search || activeFilterCount > 0
                ? { label: "Clear Filters", onClick: clearFilters }
                : { label: "Add Your First Product", href: "/newproduct" }
            }
          />
        )}

        {!isLoading && products.length > 0 && viewMode === "table" && (
          <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-stone-100">
                    {["#", "Product", "Barcode", "Category", "Price", "Status", ""].map((h, i) => (
                      <th key={i}
                        className={`px-5 py-3.5 text-left text-[10px] font-bold uppercase tracking-widest text-stone-400 bg-stone-50/70 ${
                          i === 3 ? "hidden lg:table-cell" : i === 5 ? "hidden sm:table-cell" : ""
                        }`}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {products.map((product, index) => (
                    <ProductTableRow
                      key={product.id}
                      product={product} index={index} startIndex={startIndex}
                      onView={(p) => { setSelectedProduct(p); setViewModalOpen(true); }}
                      onEdit={(p) => router.push(getEditUrl(p))}
                      onDelete={(p) => { setSelectedProduct(p); setDeleteModalOpen(true); }}
                      isOpen={openRow === product.id}
                      onToggleOpen={setOpenRow}
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

        {!isLoading && products.length > 0 && viewMode === "grid" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {products.map((product) => (
                <ProductGridCard key={product.id} product={product}
                  onView={(p) => { setSelectedProduct(p); setViewModalOpen(true); }}
                  onEdit={(p) => router.push(getEditUrl(p))}
                  onDelete={(p) => { setSelectedProduct(p); setDeleteModalOpen(true); }}
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

      {/* Modals & Drawers */}
      <FilterDrawer isOpen={filterDrawerOpen} onClose={() => setFilterDrawerOpen(false)}
        filters={filters} categories={categories} totalItems={totalItems}
        onFilterChange={handleFilterChange} onClearFilters={clearFilters} activeFilterCount={activeFilterCount}
      />
      <DeleteModal isOpen={deleteModalOpen}
        onClose={() => { setDeleteModalOpen(false); setSelectedProduct(null); }}
        onConfirm={handleDelete} productName={selectedProduct?.name || ""} isSubmitting={isSubmitting}
      />
      <ViewProductModal isOpen={viewModalOpen}
        onClose={() => { setViewModalOpen(false); setSelectedProduct(null); }}
        product={selectedProduct}
        onEdit={(p) => { setViewModalOpen(false); router.push(getEditUrl(p)); }}
        formatCurrency={formatCurrency}
      />
    </div>
  );
};

export default withAuth(ManageProducts);