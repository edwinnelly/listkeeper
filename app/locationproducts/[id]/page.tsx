"use client";
import { withAuth } from "@/hoc/withAuth";
import { apiGet } from "@/lib/axios";
import React, { useState, useEffect, useMemo, useCallback, useRef, memo } from "react";
import { createPortal } from "react-dom";
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
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Package,
  Tag,
  DollarSign,
  Hash,
  BarChart3,
  Star,
  AlertCircle,
  History,
  Grid3x3,
  List,
  Filter,
  TrendingUp,
  TrendingDown,
  Minus,
  Layers,
  Box,
  Plus,
  ArrowUpDown,
  FilterX,
  Calendar,
  Scale,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import ShortTextWithTooltip from "../../component/shorten_len";

// ==============================================
// TypeScript Interfaces
// ==============================================
interface Product {
  id: number;
  owner_id: number;
  location_id: number;
  business_key: string;
  encrypted_pid: string | null;
  encrypted_location_id: string | null;
  name: string;
  location_name: string;
  sku: string;
  description: string | null;
  slug: string | null;
  dimensions: string | null;
  category_id: number;
  sub_category_id: number;
  child_sub_category_id: number;
  unit_id: string;
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
  supplier_id: number | null;
  is_active: boolean;
  is_featured: boolean;
  is_on_sale: boolean;
  is_out_of_stock: boolean;
  image: string | null;
  additional_info: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
  encrypted_id: string | null;
  product?: {
    name: string;
    image: string;
    sku: string;
    description?: string;
    dimensions?: string;
    weight?: string | number;
    length?: string | null;
    width?: string | null;
    height?: string | null;
    unit?: { symbol: string };
  };
  category?: { id: number; name: string };
  unit?: { id: number; name: string; symbol: string };
  supplier?: { id: number; vid: number; name: string };
  business?: { business_key: string; business_name: string };
}

interface Category {
  id: number;
  name: string;
}

interface FilterState {
  search: string;
  status: "all" | "active" | "inactive";
  category: string;
  stock: "all" | "in_stock" | "low_stock" | "out_of_stock";
  priceRange: [number, number];
  sortBy: "name" | "price" | "stock" | "created";
  sortOrder: "asc" | "desc";
}

interface StockStatus {
  label: string;
  color: "success" | "warning" | "error";
  icon: React.ElementType;
}

interface Statistics {
  totalProducts: number;
  activeProducts: number;
  totalValue: number;
  totalCost: number;
  potentialProfit: number;
  profitMargin: number;
  lowStockCount: number;
  outOfStockCount: number;
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  color: "primary" | "emerald" | "amber" | "rose" | "gray";
  trend?: { value: number; label: string };
}

interface FilterChipProps {
  label: string;
  active?: boolean;
  onClick?: () => void;
}

interface EmptyStateProps {
  title: string;
  description: string;
  icon: React.ElementType;
  action?: {
    label: string;
    onClick?: () => void;
    href?: string;
  };
}

interface DeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  productName: string;
  isSubmitting: boolean;
}

interface ProductImageProps {
  src?: string | null;
  alt: string;
  className?: string;
}

interface StockBadgeProps {
  product: Product;
}

interface ProfitTrendProps {
  product: Product;
}

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  startIndex: number;
  endIndex: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (items: number) => void;
}

interface ProductTableRowProps {
  product: Product;
  index: number;
  startIndex: number;
  onView: (product: Product) => void;
  onEdit: (id: string | null) => void;
  onDelete: (product: Product) => void;
  onHistory: (encryptedPid: string | null, locationId: string | null) => void;
  isOpen: boolean;
  onToggleOpen: (id: number | null) => void;
  formatCurrency: (amount: number) => string;
}

interface ProductGridCardProps {
  product: Product;
  onView: (product: Product) => void;
  onEdit: (id: number) => void;
  onDelete: (product: Product) => void;
  formatCurrency: (amount: number) => string;
}

interface FilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  filters: FilterState;
  categories: Category[];
  totalItems: number;
  onFilterChange: <K extends keyof FilterState>(key: K, value: FilterState[K]) => void;
  onClearFilters: () => void;
  activeFilterCount: number;
}

interface ViewProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  onEdit: (id: string | null) => void;
  onHistory: (encryptedPid: string | null, locationId: string | null) => void;
  formatCurrency: (amount: number) => string;
}

interface ApiError {
  userMessage?: string;
  response?: {
    data?: {
      message?: string;
      errors?: Record<string, string[]>;
    };
    status?: number;
  };
}

interface User {
  businesses_one?: Array<{ currency?: string }>;
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

const formatNumber = (value: string | number | null | undefined): string => {
  const num = toNumber(value);
  return new Intl.NumberFormat("en-US").format(num);
};

const getImageUrl = (src: string | null): string => {
  if (!src) return "";
  return `http://localhost:8000/storage/${src}`;
};

const useDebounce = <T,>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
};

// ==============================================
// Dropdown Portal Component
// ==============================================

interface DropdownPortalProps {
  isOpen: boolean;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
  onClose: () => void;
  children: React.ReactNode;
}

const DropdownPortal: React.FC<DropdownPortalProps> = memo(({ isOpen, triggerRef, onClose, children }) => {
  const [position, setPosition] = useState({ top: 0, right: 0 });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + 4,
        right: window.innerWidth - rect.right,
      });
    }
  }, [isOpen, triggerRef]);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <>
      <div className="fixed inset-0 z-[9998]" onClick={onClose} />
      <div
        style={{
          position: 'fixed',
          top: `${position.top}px`,
          right: `${position.right}px`,
          zIndex: 9999,
        }}
        className="w-48 bg-white border border-stone-200 rounded-xl shadow-lg shadow-stone-200/50"
      >
        {children}
      </div>
    </>,
    document.body
  );
});

DropdownPortal.displayName = 'DropdownPortal';

// ==============================================
// Sub-components
// ==============================================

const StatCard: React.FC<StatCardProps> = memo(({
  title,
  value,
  icon: Icon,
  color,
  trend
}) => {
  const colorClasses: Record<string, string> = {
    primary: "bg-[#080e16]/10 text-[#080e16]",
    emerald: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    rose: "bg-rose-50 text-rose-700",
    gray: "bg-gray-50 text-gray-700",
  };

  return (
    <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm hover:shadow-md transition-all group">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-black/60">{title}</p>
          <p className="text-normal font-bold text-black mt-0.5">{value}</p>
          {trend && (
            <p className="text-xs text-black/50 mt-0.5">
              <span className={trend.value > 0 ? "text-emerald-600" : "text-rose-600"}>
                {trend.value > 0 ? "↑" : "↓"} {Math.abs(trend.value)}%
              </span>{" "}
              {trend.label}
            </p>
          )}
        </div>
        <div className={`w-10 h-10 ${colorClasses[color]} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
});

StatCard.displayName = 'StatCard';

const FilterChip: React.FC<FilterChipProps> = memo(({ label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`px-3 py-1.5 text-sm rounded-full transition-colors ${active
        ? "bg-[#080e16] text-white"
        : "bg-stone-100 text-black hover:bg-stone-200"
      }`}
  >
    {label}
  </button>
));

FilterChip.displayName = 'FilterChip';

const EmptyState: React.FC<EmptyStateProps> = memo(({
  title,
  description,
  icon: Icon,
  action
}) => (
  <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-12">
    <div className="flex flex-col items-center text-center max-w-md mx-auto">
      <div className="w-20 h-20 bg-stone-100 rounded-2xl flex items-center justify-center mb-4">
        <Icon className="h-10 w-10 text-black/40" />
      </div>
      <h3 className="text-lg font-semibold text-black mb-2">{title}</h3>
      <p className="text-black/60 text-sm mb-6">{description}</p>
      {action && (action.href ? (
        <Link
          href={action.href}
          className="inline-flex items-center gap-2 px-6 py-3 bg-[#080e16] text-white rounded-lg hover:bg-[#2c4c6e] transition-all shadow-lg shadow-[#080e16]/20"
        >
          <Plus className="h-4 w-4" />
          {action.label}
        </Link>
      ) : (
        <button
          onClick={action.onClick}
          className="inline-flex items-center gap-2 px-6 py-3 bg-[#080e16] text-white rounded-lg hover:bg-[#2c4c6e] transition-all shadow-lg shadow-[#080e16]/20"
        >
          <Plus className="h-4 w-4" />
          {action.label}
        </button>
      ))}
    </div>
  </div>
));

EmptyState.displayName = 'EmptyState';

const LoadingState: React.FC = memo(() => (
  <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-12">
    <div className="flex flex-col items-center justify-center">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-[#080e16]/20 border-t-[#080e16] rounded-full animate-spin"></div>
        <Package className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-[#080e16]/60" />
      </div>
      <p className="mt-4 text-black/70 font-medium">Loading products...</p>
      <p className="text-black/40 text-sm mt-1">Please wait a moment</p>
    </div>
  </div>
));

LoadingState.displayName = 'LoadingState';

const DeleteModal: React.FC<DeleteModalProps> = memo(({
  isOpen,
  onClose,
  onConfirm,
  productName,
  isSubmitting
}) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-50 p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-scaleIn">
        <div className="p-6">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="w-16 h-16 flex items-center justify-center rounded-2xl bg-rose-50 border border-rose-200">
              <AlertTriangle className="w-7 h-7 text-rose-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-black mb-2">
                Archive / Deactivate products
              </h2>
              <p className="text-black/70 text-sm leading-relaxed">
                Are you sure you want to delete{" "}
                <span className="font-semibold text-black">{productName}</span>?
                This action cannot be undone.
              </p>
            </div>
            <div className="mt-4 flex flex-col sm:flex-row justify-center gap-3 w-full">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 rounded-lg border border-stone-300 bg-white text-black font-medium hover:bg-stone-50 transition disabled:opacity-50 order-2 sm:order-1"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onConfirm}
                className="px-6 py-3 rounded-lg bg-gradient-to-r from-rose-600 to-rose-700 text-white font-medium flex items-center justify-center gap-2 hover:from-rose-700 hover:to-rose-800 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-rose-500/25 order-1 sm:order-2"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" /> Archive / Deactivate products
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

DeleteModal.displayName = 'DeleteModal';

const ProductImage: React.FC<ProductImageProps> = memo(({
  src,
  alt,
  className = "w-10 h-10"
}) => {
  const [error, setError] = useState(false);
  const imageUrl = getImageUrl(src);
  return (
    <div
      className={`${className} bg-gradient-to-br from-[#080e16]/10 to-[#080e16]/5 rounded-xl flex items-center justify-center flex-shrink-0 border border-[#080e16]/20 overflow-hidden relative`}
    >
      {src && !error && imageUrl ? (
        <Image
          src={imageUrl}
          alt={alt}
          fill
          className="object-cover"
          sizes="40px"
          onError={() => setError(true)}
          loading="lazy"
        />
      ) : (
        <Package className="h-5 w-5 text-[#080e16]" />
      )}
    </div>
  );
});

ProductImage.displayName = 'ProductImage';

const StockBadge: React.FC<StockBadgeProps> = memo(({ product }) => {
  const stockQuantity = toNumber(product.stock_quantity);
  const lowStockThreshold = toNumber(product.low_stock_threshold) || 5;

  const getStatus = (): StockStatus => {
    if (product.is_out_of_stock || stockQuantity <= 0)
      return { label: "Out of Stock", color: "error", icon: XCircle };
    if (stockQuantity <= lowStockThreshold)
      return { label: "Low Stock", color: "warning", icon: AlertCircle };
    return { label: "In Stock", color: "success", icon: CheckCircle };
  };

  const status = getStatus();
  const Icon = status.icon;
  const colorClasses = {
    success: "text-emerald-800 bg-emerald-50 border-emerald-200",
    warning: "text-amber-800 bg-amber-50 border-amber-200",
    error: "text-rose-800 bg-rose-50 border-rose-200",
  };

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${colorClasses[status.color]}`}
    >
      <Icon className="h-3.5 w-3.5" />
      {status.label} ({formatNumber(stockQuantity)})
    </div>
  );
});

StockBadge.displayName = 'StockBadge';

const ProfitTrend: React.FC<ProfitTrendProps> = memo(({ product }) => {
  const price = toNumber(product.price);
  const costPrice = toNumber(product.cost_price);
  if (!price || !costPrice) return null;
  const margin = ((price - costPrice) / costPrice) * 100;
  let Icon = Minus;
  let color = "text-amber-600";
  if (margin > 20) {
    Icon = TrendingUp;
    color = "text-emerald-600";
  } else if (margin < 10) {
    Icon = TrendingDown;
    color = "text-rose-600";
  }
  return (
    <span className={`ml-2 inline-flex items-center gap-0.5 text-xs ${color}`}>
      <Icon className="h-3 w-3" />
      {margin.toFixed(0)}%
    </span>
  );
});

ProfitTrend.displayName = 'ProfitTrend';

const Pagination: React.FC<PaginationProps> = memo(({
  currentPage,
  totalPages,
  totalItems,
  startIndex,
  endIndex,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
}) => {
  const getPageNumbers = useCallback(() => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;
    if (totalPages <= maxVisible) {
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
    return pages;
  }, [currentPage, totalPages]);

  if (totalPages <= 1) return null;

  return (
    <div className="px-6 py-4 border-t border-stone-200 bg-stone-50/30 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-black/70">Show</span>
          <select
            value={itemsPerPage}
            onChange={(e) => {
              onItemsPerPageChange(Number(e.target.value));
              onPageChange(1);
            }}
            className="px-2 py-1.5 text-sm border border-stone-300 rounded-lg bg-white focus:ring-2 focus:ring-[#080e16]/20 focus:border-[#080e16] outline-none text-black"
          >
            {[10, 25, 50, 100].map((value) => (
              <option key={value} value={value} className="text-black">
                {value}
              </option>
            ))}
          </select>
          <span className="text-sm text-black/70">per page</span>
        </div>
        <span className="text-sm text-black/70">
          Showing {startIndex + 1}-{endIndex} of {totalItems}
        </span>
      </div>
      <div className="flex items-center justify-center sm:justify-end gap-2">
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className="p-2 rounded-lg border border-stone-300 text-black/70 hover:bg-stone-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronsLeft className="h-4 w-4" />
        </button>
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2 rounded-lg border border-stone-300 text-black/70 hover:bg-stone-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="flex items-center gap-1">
          {getPageNumbers().map((page, index) => (
            <React.Fragment key={index}>
              {page === "..." ? (
                <span className="px-3 py-2 text-black/40">...</span>
              ) : (
                <button
                  onClick={() => onPageChange(page as number)}
                  className={`min-w-[2.5rem] h-10 flex items-center justify-center rounded-lg text-sm font-medium transition-colors ${currentPage === page
                      ? "bg-[#080e16] text-white"
                      : "text-black hover:bg-stone-100 border border-stone-300"
                    }`}
                >
                  {page}
                </button>
              )}
            </React.Fragment>
          ))}
        </div>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-2 rounded-lg border border-stone-300 text-black/70 hover:bg-stone-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className="p-2 rounded-lg border border-stone-300 text-black/70 hover:bg-stone-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronsRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
});

Pagination.displayName = 'Pagination';

const ProductTableRow: React.FC<ProductTableRowProps> = memo(({
  product,
  index,
  startIndex,
  onView,
  onEdit,
  onDelete,
  onHistory,
  isOpen,
  onToggleOpen,
  formatCurrency,
}) => {
  const productName = product.product?.name || product.name || "";
  const productSku = product.product?.sku || product.sku || "";
  const productImage = product.product?.image || product.image || null;
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleView = useCallback(() => {
    onView(product);
    onToggleOpen(null);
  }, [onView, product, onToggleOpen]);

  const handleEdit = useCallback(() => {
    onEdit(product.encrypted_id);
    onToggleOpen(null);
  }, [onEdit, product.encrypted_id, onToggleOpen]);

  const handleHistory = useCallback(() => {
    onHistory(product.encrypted_pid, product.encrypted_location_id);
    onToggleOpen(null);
  }, [onHistory, product.encrypted_pid, product.encrypted_location_id, onToggleOpen]);

  const handleDelete = useCallback(() => {
    onDelete(product);
    onToggleOpen(null);
  }, [onDelete, product, onToggleOpen]);

  return (
    <tr className="hover:bg-stone-50/50 transition-colors group">
      <td className="px-6 py-4 whitespace-nowrap text-sm text-black/50">
        {startIndex + index + 1}
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <ProductImage src={productImage} alt={productName} />
          <div>
            <div className="font-medium text-black">
              <ShortTextWithTooltip text={productName} max={30} />
            </div>
            <div className="text-xs text-black/50 flex items-center gap-1 mt-0.5">
              <Hash className="h-3 w-3" />
              {productSku}
            </div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap hidden md:table-cell">
        <code className="text-xs bg-stone-100 px-2 py-1 rounded font-mono text-black/80">
          {productSku}
        </code>
      </td>
      <td className="px-6 py-4 whitespace-nowrap hidden lg:table-cell">
        <span className="text-black/80">
          {product.category?.name || "Uncategorized"}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex flex-col">
          <span className="font-semibold text-black">
            {formatCurrency(toNumber(product.price))}
          </span>
          <ProfitTrend product={product} />
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <StockBadge product={product} />
      </td>
      <td className="px-6 py-4 whitespace-nowrap hidden sm:table-cell">
        <span
          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${product.is_active
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-stone-100 text-black/70 border border-stone-200"
            }`}
        >
          {product.is_active ? "Active" : "Inactive"}
        </span>
      </td>
      <td className="px-6 py-4 text-center">
        <button
          ref={buttonRef}
          onClick={() => onToggleOpen(isOpen ? null : product.id)}
          className="p-2 rounded-lg hover:bg-stone-100 transition text-black/40 hover:text-black/70"
        >
          <MoreVertical className="h-4 w-4" />
        </button>
        <DropdownPortal
          isOpen={isOpen}
          triggerRef={buttonRef}
          onClose={() => onToggleOpen(null)}
        >
          <button
            onClick={handleView}
            className="flex items-center gap-3 w-full px-4 py-3 text-sm text-black hover:bg-stone-50 transition first:rounded-t-xl border-b border-stone-100"
          >
            <Eye className="h-4 w-4 text-[#080e16]" /> View Details
          </button>
          <button
            onClick={handleEdit}
            className="flex items-center gap-3 w-full px-4 py-3 text-sm text-black hover:bg-stone-50 transition border-b border-stone-100"
          >
            <Edit className="h-4 w-4 text-[#080e16]" /> Update Stock
          </button>
          <button
            onClick={handleHistory}
            className="flex items-center gap-3 w-full px-4 py-3 text-sm text-black hover:bg-stone-50 transition border-b border-stone-100"
          >
            <History className="h-4 w-4 text-black/70" /> History
          </button>
          <button
            onClick={handleDelete}
            className="flex items-center gap-3 w-full px-4 py-3 text-sm text-rose-600 hover:bg-rose-50 transition last:rounded-b-xl"
          >
            <Trash2 className="h-4 w-4" /> Archive Products
          </button>
        </DropdownPortal>
      </td>
    </tr>
  );
});

ProductTableRow.displayName = 'ProductTableRow';

const ProductGridCard: React.FC<ProductGridCardProps> = memo(({
  product,
  onView,
  onEdit,
  onDelete,
  formatCurrency,
}) => {
  const productName = product.product?.name || product.name || "";
  const productSku = product.product?.sku || product.sku || "";
  const productImage = product.product?.image || product.image || null;
  const categoryName = product.category?.name || "Uncategorized";

  return (
    <div className="bg-white rounded-xl border border-stone-200 shadow-sm hover:shadow-md transition-all group">
      <div className="p-5">
        <div className="relative mb-4">
          <div className="aspect-square bg-stone-100 rounded-lg flex items-center justify-center overflow-hidden relative">
            {productImage ? (
              <Image
                src={getImageUrl(productImage)}
                alt={productName}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                loading="lazy"
              />
            ) : (
              <Package className="h-12 w-12 text-black/40" />
            )}
          </div>
          <div className="absolute top-2 right-2 flex gap-1">
            {product.is_featured && (
              <span className="bg-amber-500 text-white p-1.5 rounded-lg">
                <Star className="h-3 w-3" />
              </span>
            )}
            {product.is_on_sale && (
              <span className="bg-rose-500 text-white p-1.5 rounded-lg">
                <Tag className="h-3 w-3" />
              </span>
            )}
          </div>
        </div>
        <div className="space-y-3">
          <div>
            <h3 className="font-semibold text-black">
              <ShortTextWithTooltip text={productName} max={25} />
            </h3>
            <p className="text-xs text-black/50 mt-0.5">SKU: {productSku}</p>
          </div>
          <div className="flex items-center gap-1 text-xs text-black/70">
            <Layers className="h-3 w-3" />
            <span>
              <ShortTextWithTooltip text={categoryName} max={11} />
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <span className="text-lg font-bold text-[#080e16]">
                {formatCurrency(toNumber(product.price))}
              </span>
              <ProfitTrend product={product} />
            </div>
            <StockBadge product={product} />
          </div>
          <div className="grid grid-cols-3 gap-2 pt-2">
            <button
              onClick={() => onView(product)}
              className="p-2 text-black/70 hover:text-[#080e16] hover:bg-[#080e16]/5 rounded-lg transition-colors flex items-center justify-center"
              title="View Details"
            >
              <Eye className="h-4 w-4" />
            </button>
            <button
              onClick={() => onEdit(product.id)}
              className="p-2 text-black/70 hover:text-[#080e16] hover:bg-[#080e16]/5 rounded-lg transition-colors flex items-center justify-center"
              title="Adjust Stock"
            >
              <Edit className="h-4 w-4" />
            </button>
            <button
              onClick={() => onDelete(product)}
              className="p-2 text-black/70 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors flex items-center justify-center"
              title="Delete Product"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

ProductGridCard.displayName = 'ProductGridCard';

const FilterDrawer: React.FC<FilterDrawerProps> = memo(({
  isOpen,
  onClose,
  filters,
  categories,
  totalItems,
  onFilterChange,
  onClearFilters,
  activeFilterCount,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="absolute right-0 top-0 h-full w-96 bg-white shadow-2xl animate-slideIn">
        <div className="p-4 border-b border-stone-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter size={20} className="text-[#080e16]" />
            <h3 className="font-semibold text-black">Filters</h3>
            {activeFilterCount > 0 && (
              <span className="ml-2 px-2 py-0.5 text-xs bg-[#080e16] text-white rounded-full">
                {activeFilterCount}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-stone-100 rounded-lg transition text-black/70"
          >
            <X size={20} />
          </button>
        </div>
        <div className="overflow-y-auto h-[calc(100vh-140px)] p-4 space-y-4">
          <div>
            <label className="text-xs font-medium text-black/50 uppercase tracking-wider mb-2 block">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) =>
                onFilterChange("status", e.target.value as FilterState["status"])
              }
              className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-sm focus:ring-2 focus:ring-[#080e16]/20 focus:border-[#080e16] outline-none transition text-black"
            >
              <option value="all" className="text-black">All Status</option>
              <option value="active" className="text-black">Active</option>
              <option value="inactive" className="text-black">Inactive</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-black/50 uppercase tracking-wider mb-2 block">
              Category
            </label>
            <select
              value={filters.category}
              onChange={(e) => onFilterChange("category", e.target.value)}
              className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-sm focus:ring-2 focus:ring-[#080e16]/20 focus:border-[#080e16] outline-none transition text-black"
            >
              <option value="all" className="text-black">All Categories</option>
              {categories.length === 0 ? (
                <option disabled className="text-black/50">
                  Loading categories…
                </option>
              ) : (
                categories.map((category) => (
                  <option
                    key={category.id}
                    value={category.id.toString()}
                    className="text-black"
                  >
                    {category.name}
                  </option>
                ))
              )}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-black/50 uppercase tracking-wider mb-2 block">
              Stock Level
            </label>
            <select
              value={filters.stock}
              onChange={(e) =>
                onFilterChange("stock", e.target.value as FilterState["stock"])
              }
              className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-sm focus:ring-2 focus:ring-[#080e16]/20 focus:border-[#080e16] outline-none transition text-black"
            >
              <option value="all" className="text-black">All Stock</option>
              <option value="in_stock" className="text-black">In Stock</option>
              <option value="low_stock" className="text-black">Low Stock</option>
              <option value="out_of_stock" className="text-black">Out of Stock</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-black/50 uppercase tracking-wider mb-2 block">
              Sort By
            </label>
            <select
              value={filters.sortBy}
              onChange={(e) =>
                onFilterChange("sortBy", e.target.value as FilterState["sortBy"])
              }
              className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-sm focus:ring-2 focus:ring-[#080e16]/20 focus:border-[#080e16] outline-none transition text-black"
            >
              <option value="name" className="text-black">Name</option>
              <option value="price" className="text-black">Price</option>
              <option value="stock" className="text-black">Stock</option>
              <option value="created" className="text-black">Date Added</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-black/50 uppercase tracking-wider mb-2 block">
              Order
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => onFilterChange("sortOrder", "asc")}
                className={`flex-1 px-3 py-2 text-sm rounded-lg border transition ${filters.sortOrder === "asc"
                    ? "bg-[#080e16] text-white border-[#080e16]"
                    : "bg-white text-black border-stone-300 hover:bg-stone-50"
                  }`}
              >
                Asc
              </button>
              <button
                onClick={() => onFilterChange("sortOrder", "desc")}
                className={`flex-1 px-3 py-2 text-sm rounded-lg border transition ${filters.sortOrder === "desc"
                    ? "bg-[#080e16] text-white border-[#080e16]"
                    : "bg-white text-black border-stone-300 hover:bg-stone-50"
                  }`}
              >
                Desc
              </button>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-stone-200 bg-stone-50/50">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-black/70">
              <span className="font-semibold text-black">{totalItems}</span> products found
            </p>
            {activeFilterCount > 0 && (
              <button
                onClick={onClearFilters}
                className="text-sm text-[#080e16] hover:text-[#2c4c6e] font-medium inline-flex items-center gap-1"
              >
                <FilterX size={14} /> Clear all
              </button>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-full px-4 py-3 bg-[#080e16] text-white rounded-lg hover:bg-[#2c4c6e] transition-colors font-medium"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
});

FilterDrawer.displayName = 'FilterDrawer';

const ViewProductModal: React.FC<ViewProductModalProps> = memo(({
  isOpen,
  onClose,
  product,
  onEdit,
  onHistory,
  formatCurrency,
}) => {
  if (!isOpen || !product) return null;

  const productName = product.product?.name || product.name || "";
  const productSku = product.product?.sku || product.sku || "";
  const productImage = product.product?.image || product.image || null;
  const productDescription =
    product.product?.description || product.description || "No description";
  const productDimensions =
    product.product?.dimensions || product.dimensions || null;
  const productWeight = product.product?.weight || product.weight || null;
  const productLength = product.product?.length || product.length || null;
  const productWidth = product.product?.width || product.width || null;
  const productHeight = product.product?.height || product.height || null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-50 p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto animate-scaleIn">
        <div className="sticky top-0 bg-white border-b border-stone-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ProductImage
              src={productImage}
              alt={productName}
              className="w-12 h-12"
            />
            <div>
              <h2 className="text-xl font-bold text-black">{productName}</h2>
              <p className="text-sm text-black/60">SKU: {productSku}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-black/50 hover:text-black hover:bg-stone-100 rounded-lg transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-medium text-black/60 mb-3 flex items-center gap-2">
                  <Box className="h-4 w-4" /> Basic Information
                </h3>
                <div className="bg-stone-50 rounded-lg p-4 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-black/70">Description</span>
                    <span className="text-sm text-black text-right max-w-[200px]">
                      {productDescription}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-black/70">Category</span>
                    <span className="text-sm text-black">
                      {product.category?.name || "Uncategorized"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-black/70">Unit</span>
                    <span className="text-sm text-black">
                      {product.unit?.name || "N/A"}
                      {product.unit?.symbol && ` (${product.unit.symbol})`}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-black/70">Status</span>
                    <span
                      className={`text-sm font-medium ${product.is_active ? "text-emerald-700" : "text-black/70"
                        }`}
                    >
                      {product.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                  {product.supplier && (
                    <div className="flex justify-between">
                      <span className="text-sm text-black/70">Supplier</span>
                      <span className="text-sm text-black">
                        {product.supplier.name}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-black/60 mb-3 flex items-center gap-2">
                  <DollarSign className="h-4 w-4" /> Pricing
                </h3>
                <div className="bg-stone-50 rounded-lg p-4 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-black/70">Regular Price</span>
                    <span className="text-lg font-bold text-[#080e16]">
                      {formatCurrency(toNumber(product.price))}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-black/70">Cost Price</span>
                    <span className="text-sm text-black">
                      {formatCurrency(toNumber(product.cost_price))}
                    </span>
                  </div>
                  {product.is_on_sale && product.sale_price && (
                    <div className="flex justify-between">
                      <span className="text-sm text-black/70">Sale Price</span>
                      <span className="text-sm font-semibold text-rose-600">
                        {formatCurrency(toNumber(product.sale_price))}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-medium text-black/60 mb-3 flex items-center gap-2">
                  <Package className="h-4 w-4" /> Stock Information
                </h3>
                <div className="bg-stone-50 rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-black/70">Stock Status</span>
                    <StockBadge product={product} />
                  </div>
                  {product.low_stock_threshold && (
                    <div className="flex justify-between">
                      <span className="text-sm text-black/70">
                        Low Stock Threshold
                      </span>
                      <span className="text-sm text-black">
                        {formatNumber(product.low_stock_threshold)} units
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-black/60 mb-3 flex items-center gap-2">
                  <Calendar className="h-4 w-4" /> Important Dates
                </h3>
                <div className="bg-stone-50 rounded-lg p-4 space-y-3">
                  {product.manufactured_at && (
                    <div className="flex justify-between">
                      <span className="text-sm text-black/70">Manufactured</span>
                      <span className="text-sm text-black">
                        {formatDate(product.manufactured_at)}
                      </span>
                    </div>
                  )}
                  {product.expires_at && (
                    <div className="flex justify-between">
                      <span className="text-sm text-black/70">Expires</span>
                      <span className="text-sm text-rose-600 font-medium">
                        {formatDate(product.expires_at)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-sm text-black/70">Created</span>
                    <span className="text-sm text-black">
                      {formatDate(product.created_at)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-black/70">Last Updated</span>
                    <span className="text-sm text-black">
                      {formatDate(product.updated_at)}
                    </span>
                  </div>
                </div>
              </div>
              {(productDimensions ||
                productWeight ||
                productLength ||
                productWidth ||
                productHeight) && (
                  <div>
                    <h3 className="text-sm font-medium text-black/60 mb-3 flex items-center gap-2">
                      <Scale className="h-4 w-4" /> Dimensions & Weight
                    </h3>
                    <div className="bg-stone-50 rounded-lg p-4 space-y-3">
                      {productDimensions && (
                        <div className="flex justify-between">
                          <span className="text-sm text-black/70">Dimensions</span>
                          <span className="text-sm text-black">
                            {productDimensions}
                          </span>
                        </div>
                      )}
                      {productWeight && (
                        <div className="flex justify-between">
                          <span className="text-sm text-black/70">Weight</span>
                          <span className="text-sm text-black">
                            {formatNumber(productWeight)}{" "}
                            {product.unit?.symbol || "kg"}
                          </span>
                        </div>
                      )}
                      {(productLength || productWidth || productHeight) && (
                        <div className="flex justify-between">
                          <span className="text-sm text-black/70">
                            Size (L×W×H)
                          </span>
                          <span className="text-sm text-black">
                            {productLength || "0"} × {productWidth || "0"} ×{" "}
                            {productHeight || "0"}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
            </div>
          </div>
          {toNumber(product.price) > 0 && toNumber(product.cost_price) > 0 && (
            <div className="mt-8 bg-gradient-to-r from-[#080e16]/5 to-transparent border border-[#080e16]/20 rounded-xl p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#080e16]/10 rounded-lg flex items-center justify-center">
                    <BarChart3 className="h-5 w-5 text-[#080e16]" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-black">Profit Analysis</h4>
                    <p className="text-sm text-black/70">
                      Based on current pricing and cost
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                  <div>
                    <p className="text-xs text-black/60">Profit per Unit</p>
                    <p className="text-lg font-bold text-emerald-700">
                      {formatCurrency(
                        toNumber(product.price) - toNumber(product.cost_price)
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-black/60">Profit Margin</p>
                    <p className="text-lg font-bold text-[#080e16]">
                      {(
                        ((toNumber(product.price) -
                          toNumber(product.cost_price)) /
                          toNumber(product.cost_price)) *
                        100
                      ).toFixed(1)}
                      %
                    </p>
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <p className="text-xs text-black/60">Total Stock Value</p>
                    <p className="text-lg font-bold text-black">
                      {formatCurrency(
                        toNumber(product.price) *
                        toNumber(product.stock_quantity)
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

ViewProductModal.displayName = 'ViewProductModal';

// ==============================================
// Main Component
// ==============================================

const ManageProducts = ({ user }: { user?: User }) => {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const formatCurrency = useCallback((amount: number): string => {
    const currencySymbol = user?.businesses_one?.[0]?.currency || "$";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
      .format(amount)
      .replace(/^\$/, currencySymbol);
  }, [user]);

  const [filters, setFilters] = useState<FilterState>({
    search: "",
    status: "all",
    category: "all",
    stock: "all",
    priceRange: [0, 1000000000],
    sortBy: "name",
    sortOrder: "asc",
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
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [locationName, setLocationName] = useState<string>("");
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalInventoryValue, setTotalInventoryValue] = useState<number>(0);

  const debouncedSearch = useDebounce(filters.search, 300);

  const buildQueryParams = useCallback(() => {
    const params: Record<string, string | number> = {
      page: currentPage,
      per_page: itemsPerPage,
    };
    if (debouncedSearch) params.search = debouncedSearch;
    if (filters.status !== "all") params.status = filters.status;
    if (filters.category !== "all") params.category = filters.category;
    if (filters.stock !== "all") params.stock = filters.stock;
    if (filters.sortBy !== "name") params.sort_by = filters.sortBy;
    if (filters.sortOrder !== "asc") params.sort_order = filters.sortOrder;
    if (filters.priceRange[0] > 0) params.price_min = filters.priceRange[0];
    if (filters.priceRange[1] < 1000000000)
      params.price_max = filters.priceRange[1];
    return params;
  }, [currentPage, itemsPerPage, debouncedSearch, filters]);

  const loadData = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const queryParams = buildQueryParams();
      const [productsRes, categoriesRes] = await Promise.all([
        apiGet(`/product-locations/${id}`, { params: queryParams }, false),
        apiGet("/product-categories", {}, false),
      ]);

      const pagination = productsRes?.data?.pagination;
      const newProducts = productsRes?.data?.data ?? [];
      const newLocationName = productsRes?.data?.location_name ?? "";
      const body = categoriesRes?.data;
      let newCategories: Category[] = [];
      if (
        body?.data?.product_categories &&
        Array.isArray(body.data.product_categories)
      )
        newCategories = body.data.product_categories;
      else if (
        body?.product_categories &&
        Array.isArray(body.product_categories)
      )
        newCategories = body.product_categories;
      else if (Array.isArray(body)) newCategories = body;
      setProducts(Array.isArray(newProducts) ? newProducts : []);
      setLocationName(newLocationName);
      setTotalItems(pagination?.total ?? 0);
      setTotalPages(pagination?.last_page ?? 1);
      setTotalInventoryValue(parseFloat(pagination?.total_value ?? "0"));
      const serverPage = pagination?.current_page;
      if (serverPage && serverPage !== currentPage) setCurrentPage(serverPage);
      setCategories(newCategories);
    } catch (err: unknown) {
      const error = err as ApiError;
      console.error("Error loading data:", error);
      toast.error("Failed to load data");
    } finally {
      setIsLoading(false);
    }
  }, [id, buildQueryParams, currentPage]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = useCallback(async () => {
    await loadData();
  }, [loadData]);

  const handleDelete = useCallback(async () => {
    if (isSubmitting || !selectedProduct) return;
    setIsSubmitting(true);
    try {
      toast.error("Product cannot be deleted from this account level.");
    } catch (err) {
      console.error("Delete failed:", err);
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, selectedProduct]);

  const handleFilterChange = useCallback(<K extends keyof FilterState>(
    key: K,
    value: FilterState[K]
  ) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      search: "",
      status: "all",
      category: "all",
      stock: "all",
      priceRange: [0, 1000000000],
      sortBy: "name",
      sortOrder: "asc",
    });
    setCurrentPage(1);
  }, []);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.status !== "all") count++;
    if (filters.category !== "all") count++;
    if (filters.stock !== "all") count++;
    if (filters.sortBy !== "name") count++;
    if (filters.sortOrder !== "asc") count++;
    if (filters.search) count++;
    if (filters.priceRange[0] > 0 || filters.priceRange[1] < 1000000000)
      count++;
    return count;
  }, [filters]);

  const statistics = useMemo((): Statistics => {
    const currentProducts = products;
    const totalProducts = totalItems;
    const activeProducts = currentProducts.filter((p) => p.is_active).length;
    const totalValue = currentProducts.reduce(
      (sum, p) => sum + toNumber(p.price) * toNumber(p.stock_quantity),
      0
    );
    const totalCost = currentProducts.reduce(
      (sum, p) => sum + toNumber(p.cost_price) * toNumber(p.stock_quantity),
      0
    );
    const potentialProfit = totalValue - totalCost;
    const profitMargin = totalValue > 0 ? (potentialProfit / totalValue) * 100 : 0;
    const lowStockCount = currentProducts.filter((p) => {
      const qty = toNumber(p.stock_quantity);
      const thr = toNumber(p.low_stock_threshold) || 5;
      return qty <= thr && qty > 0;
    }).length;
    const outOfStockCount = currentProducts.filter((p) => {
      const qty = toNumber(p.stock_quantity);
      return p.is_out_of_stock || qty <= 0;
    }).length;
    return {
      totalProducts,
      activeProducts,
      totalValue,
      totalCost,
      potentialProfit,
      profitMargin,
      lowStockCount,
      outOfStockCount,
    };
  }, [products, totalItems]);

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + products.length, totalItems);

  const handleHistory = useCallback((encryptedPid: string | null, locationId: string | null) => {
    if (!encryptedPid || !locationId) return;
    router.push(`/locationprodhist/${encryptedPid}/${locationId}`);
  }, [router]);

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <header className="bg-white border-b border-stone-200 mt-[-13px] w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <Link
                href="/locations"
                className="p-2 text-black/60 hover:text-black hover:bg-stone-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-black">
                  <ShortTextWithTooltip
                    text={locationName || "Products"}
                    max={30}
                  />
                </h1>
                <p className="text-sm text-black/70">
                  Manage your product inventory
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  setViewMode(viewMode === "table" ? "grid" : "table")
                }
                className="p-2.5 text-black/70 hover:text-black hover:bg-stone-100 rounded-lg transition-colors border border-stone-200"
              >
                {viewMode === "table" ? (
                  <Grid3x3 className="h-5 w-5" />
                ) : (
                  <List className="h-5 w-5" />
                )}
              </button>
              <button
                onClick={handleRefresh}
                className="p-2.5 text-black/70 hover:text-black hover:bg-stone-100 rounded-lg transition-colors border border-stone-200"
              >
                <RefreshCw className="h-5 w-5" />
              </button>
              <Link
                href="/addproductlocations"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#060b12] text-white text-sm font-medium rounded-lg hover:bg-[#0a1119] transition-all shadow-lg shadow-[#080e16]/20"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Add Product</span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistics */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          <StatCard
            title="Total Products"
            value={statistics.totalProducts}
            icon={Package}
            color="primary"
          />
          <StatCard
            title="Active"
            value={statistics.activeProducts}
            icon={CheckCircle}
            color="emerald"
          />
          <StatCard
            title="Low Stock"
            value={statistics.lowStockCount}
            icon={AlertCircle}
            color="amber"
          />
          <StatCard
            title="Out of Stock"
            value={statistics.outOfStockCount}
            icon={XCircle}
            color="rose"
          />
          <StatCard
            title="Inventory Value"
            value={formatCurrency(totalInventoryValue)}
            icon={DollarSign}
            color="gray"
          />
          <StatCard
            title="Profit Margin"
            value={`${statistics.profitMargin.toFixed(1)}%`}
            icon={TrendingUp}
            color="gray"
          />
        </div>

        {/* Search and Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-black/40 h-5 w-5" />
            <input
              type="text"
              value={filters.search}
              onChange={(e) => handleFilterChange("search", e.target.value)}
              placeholder="Search products by name, SKU, description..."
              className="w-full pl-10 pr-4 py-3 bg-white border border-stone-300 rounded-xl focus:ring-2 focus:ring-[#080e16]/20 focus:border-[#080e16] outline-none transition placeholder-black/40 text-black"
            />
          </div>
          <button
            onClick={() => setFilterDrawerOpen(true)}
            className="relative inline-flex items-center gap-2 px-6 py-3 bg-white border border-stone-300 rounded-xl hover:bg-stone-50 transition-colors shadow-sm"
          >
            <Filter className="h-5 w-5 text-black/70" />
            <span className="text-sm font-medium text-black">Filters</span>
            {activeFilterCount > 0 && (
              <span className="absolute -top-2 -right-2 w-5 h-5 bg-[#080e16] text-white text-xs rounded-full flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* Quick Filter Chips */}
        <div className="flex flex-wrap gap-2 mb-6">
          <FilterChip
            label="All"
            active={
              filters.status === "all" &&
              filters.stock === "all" &&
              filters.category === "all"
            }
            onClick={clearFilters}
          />
          <FilterChip
            label="Active"
            active={filters.status === "active"}
            onClick={() =>
              handleFilterChange(
                "status",
                filters.status === "active" ? "all" : "active"
              )
            }
          />
          <FilterChip
            label="In Stock"
            active={filters.stock === "in_stock"}
            onClick={() =>
              handleFilterChange(
                "stock",
                filters.stock === "in_stock" ? "all" : "in_stock"
              )
            }
          />
          <FilterChip
            label="Low Stock"
            active={filters.stock === "low_stock"}
            onClick={() =>
              handleFilterChange(
                "stock",
                filters.stock === "low_stock" ? "all" : "low_stock"
              )
            }
          />
          <FilterChip
            label="Out of Stock"
            active={filters.stock === "out_of_stock"}
            onClick={() =>
              handleFilterChange(
                "stock",
                filters.stock === "out_of_stock" ? "all" : "out_of_stock"
              )
            }
          />
        </div>

        {/* Products Count */}
        <div className="mb-4 flex items-center justify-between">
          <span className="text-sm text-black/70">
            Showing{" "}
            <span className="font-semibold text-black">
              {startIndex + 1}-{endIndex}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-black">{totalItems}</span>{" "}
            products
          </span>
        </div>

        {/* Loading State */}
        {isLoading && <LoadingState />}

        {/* Empty State */}
        {!isLoading && products.length === 0 && (
          <EmptyState
            title={
              filters.search || activeFilterCount > 0
                ? "No products found"
                : "No products yet"
            }
            description={
              filters.search || activeFilterCount > 0
                ? "Try adjusting your search terms or filters"
                : "Get started by adding your first product to the inventory"
            }
            icon={Package}
            action={
              filters.search || activeFilterCount > 0
                ? { label: "Clear Filters", onClick: clearFilters }
                : {
                  label: "Add Your First Product",
                  href: "/addproductlocations",
                }
            }
          />
        )}

        {/* Table View */}
        {!isLoading && products.length > 0 && viewMode === "table" && (
          <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-stone-50 text-black/70 border-b border-stone-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider w-12">
                      SN
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">
                      <button
                        onClick={() => handleFilterChange("sortBy", "name")}
                        className="flex items-center gap-1 hover:text-black"
                      >
                        Product{" "}
                        {filters.sortBy === "name" && (
                          <ArrowUpDown className="h-3 w-3" />
                        )}
                      </button>
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider hidden md:table-cell">
                      SKU
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider hidden lg:table-cell">
                      Category
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">
                      <button
                        onClick={() => handleFilterChange("sortBy", "price")}
                        className="flex items-center gap-1 hover:text-black"
                      >
                        Price{" "}
                        {filters.sortBy === "price" && (
                          <ArrowUpDown className="h-3 w-3" />
                        )}
                      </button>
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">
                      <button
                        onClick={() => handleFilterChange("sortBy", "stock")}
                        className="flex items-center gap-1 hover:text-black"
                      >
                        Stock{" "}
                        {filters.sortBy === "stock" && (
                          <ArrowUpDown className="h-3 w-3" />
                        )}
                      </button>
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider hidden sm:table-cell">
                      Status
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider w-12">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {products.map((product, index) => (
                    <ProductTableRow
                      key={product.id}
                      product={product}
                      index={index}
                      startIndex={startIndex}
                      onView={(product) => {
                        setSelectedProduct(product);
                        setViewModalOpen(true);
                      }}
                      onEdit={(encrypted_id) =>
                        router.push(`/updatestock/${encrypted_id}`)
                      }
                      onDelete={(product) => {
                        setSelectedProduct(product);
                        setDeleteModalOpen(true);
                      }}
                      onHistory={handleHistory}
                      isOpen={openRow === product.id}
                      onToggleOpen={setOpenRow}
                      formatCurrency={formatCurrency}
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
              onPageChange={(page) => setCurrentPage(page)}
              onItemsPerPageChange={(items) => {
                setItemsPerPage(items);
                setCurrentPage(1);
              }}
            />
          </div>
        )}

        {/* Grid View */}
        {!isLoading && products.length > 0 && viewMode === "grid" && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product) => (
                <ProductGridCard
                  key={product.id}
                  product={product}
                  onView={(product) => {
                    setSelectedProduct(product);
                    setViewModalOpen(true);
                  }}
                  onEdit={(id) => router.push(`/editproduct/${id}`)}
                  onDelete={(product) => {
                    setSelectedProduct(product);
                    setDeleteModalOpen(true);
                  }}
                  formatCurrency={formatCurrency}
                />
              ))}
            </div>
            <div className="mt-6">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalItems}
                startIndex={startIndex}
                endIndex={endIndex}
                itemsPerPage={itemsPerPage}
                onPageChange={(page) => setCurrentPage(page)}
                onItemsPerPageChange={(items) => {
                  setItemsPerPage(items);
                  setCurrentPage(1);
                }}
              />
            </div>
          </>
        )}
      </main>

      {/* Modals & Drawers */}
      <FilterDrawer
        isOpen={filterDrawerOpen}
        onClose={() => setFilterDrawerOpen(false)}
        filters={filters}
        categories={categories}
        totalItems={totalItems}
        onFilterChange={handleFilterChange}
        onClearFilters={clearFilters}
        activeFilterCount={activeFilterCount}
      />
      <DeleteModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setSelectedProduct(null);
        }}
        onConfirm={handleDelete}
        productName={
          selectedProduct?.product?.name || selectedProduct?.name || ""
        }
        isSubmitting={isSubmitting}
      />
      <ViewProductModal
        isOpen={viewModalOpen}
        onClose={() => {
          setViewModalOpen(false);
          setSelectedProduct(null);
        }}
        product={selectedProduct}
        onEdit={(encrypted_id) =>
          router.push(`/updatestock/${encrypted_id}`)
        }
        onHistory={handleHistory}
        formatCurrency={formatCurrency}
      />
    </div>
  );
};

export default withAuth(ManageProducts);