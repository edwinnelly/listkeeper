"use client";
import { withAuth } from "@/hoc/withAuth";
import { apiGet } from "@/lib/axios";
import React, { useState, useEffect, useMemo } from "react";
import {
  Search,
  MoreVertical,
  X,
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
  TrendingUp,
  TrendingDown,
  Minus,
  Layers,
  Box,
  Calendar,
  Scale,
  AlertCircle,
  Clock,
  User,
  FileText,
  Building2,
  Filter,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import ShortTextWithTooltip from "../../component/shorten_len";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

// ==============================================
// TypeScript Interfaces
// ==============================================

interface ProductHistory {
  id: number;
  product_id: number;
  owner_id: number;
  business_key: string;
  location_id: number;
  type: "addition" | "subtraction" | "adjustment";
  quantity: string | number;
  cost: string | number;
  price: string | number;
  source_type: string;
  source_id: number;
  note: string | null;
  transaction_date: string;
  created_at: string;
  updated_at: string;
  encrypted_id: string | null;
  product: {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    sku: string;
    dimensions: string | null;
    image: string | null;
  };
}

interface ApiResponse {
  success: boolean;
  count: number;
  location_name?: string;
  data: ProductHistory[];
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
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatDateForDisplay = (date: Date | null): string => {
  if (!date) return "";
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const formatNumber = (value: string | number | null | undefined): string => {
  const num = toNumber(value);
  return new Intl.NumberFormat("en-US").format(num);
};

const formatCurrency = (amount: number, currencySymbol: string = "$"): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
    .format(amount)
    .replace(/^\$/, currencySymbol);
};

const getTransactionTypeColor = (type: string): { bg: string; text: string; icon: React.ElementType } => {
  switch (type) {
    case "addition":
      return { bg: "bg-gray-50", text: "text-emerald-700", icon: TrendingUp };
    case "subtraction":
      return { bg: "bg-gray-50", text: "text-rose-700", icon: TrendingDown };
    default:
      return { bg: "bg-gray-50", text: "text-amber-700", icon: Minus };
  }
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

// Empty State Component
const EmptyState: React.FC<{
  title: string;
  description: string;
  icon: React.ElementType;
}> = ({ title, description, icon: Icon }) => (
  <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-12">
    <div className="flex flex-col items-center text-center max-w-md mx-auto">
      <div className="w-20 h-20 bg-stone-100 rounded-2xl flex items-center justify-center mb-4">
        <Icon className="h-10 w-10 text-stone-400" />
      </div>
      <h3 className="text-lg font-semibold text-stone-900 mb-2">{title}</h3>
      <p className="text-stone-500 text-sm mb-6">{description}</p>
    </div>
  </div>
);

// Loading State Component
const LoadingState: React.FC = () => (
  <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-12">
    <div className="flex flex-col items-center justify-center">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-[#1e3a5f]/20 border-t-[#1e3a5f] rounded-full animate-spin"></div>
        <Package className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-[#1e3a5f]/60" />
      </div>
      <p className="mt-4 text-stone-600 font-medium">Loading product history...</p>
      <p className="text-stone-400 text-sm mt-1">Please wait a moment</p>
    </div>
  </div>
);

// Product Image Component
const ProductImage: React.FC<{
  src?: string | null;
  alt: string;
  className?: string;
}> = ({ src, alt, className = "w-10 h-10" }) => {
  const [error, setError] = useState(false);

  return (
    <div
      className={`${className} bg-gradient-to-br from-[#1e3a5f]/10 to-[#1e3a5f]/5 rounded-xl flex items-center justify-center flex-shrink-0 border border-[#1e3a5f]/20 overflow-hidden`}
    >
      {src && !error ? (
        <img
          src={`http://localhost:8000/storage/${src}`}
          alt={alt}
          className="w-full h-full object-cover"
          onError={() => setError(true)}
        />
      ) : (
        <Package className="h-5 w-5 text-[#1e3a5f]" />
      )}
    </div>
  );
};

// Transaction Type Badge
const TransactionTypeBadge: React.FC<{ type: string }> = ({ type }) => {
  const { bg, text, icon: Icon } = getTransactionTypeColor(type);
  
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${bg} ${text}`}>
      <Icon className="h-3.5 w-3.5" />
      {type.charAt(0).toUpperCase() + type.slice(1)}
    </span>
  );
};

// Pagination Component
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
  const getPageNumbers = () => {
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
  };

  if (totalPages <= 1) return null;

  return (
    <div className="px-6 py-4 border-t border-stone-200 bg-stone-50/30 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-stone-600">Show</span>
          <select
            value={itemsPerPage}
            onChange={(e) => {
              onItemsPerPageChange(Number(e.target.value));
              onPageChange(1);
            }}
            className="px-2 py-1.5 text-sm border border-stone-300 rounded-lg bg-white focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f] outline-none"
          >
            {[10, 25, 50, 100].map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
          <span className="text-sm text-stone-600">per page</span>
        </div>
        <span className="text-sm text-stone-600">
          Showing {startIndex + 1}-{endIndex} of {totalItems}
        </span>
      </div>

      <div className="flex items-center justify-center sm:justify-end gap-2">
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className="p-2 rounded-lg border border-stone-300 text-stone-600 hover:bg-stone-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronsLeft className="h-4 w-4" />
        </button>
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2 rounded-lg border border-stone-300 text-stone-600 hover:bg-stone-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-1">
          {getPageNumbers().map((page, index) => (
            <React.Fragment key={index}>
              {page === "..." ? (
                <span className="px-3 py-2 text-stone-400">...</span>
              ) : (
                <button
                  onClick={() => onPageChange(page as number)}
                  className={`min-w-[2.5rem] h-10 flex items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                    currentPage === page
                      ? "bg-[#1e3a5f] text-white"
                      : "text-stone-700 hover:bg-stone-100 border border-stone-300"
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
          className="p-2 rounded-lg border border-stone-300 text-stone-600 hover:bg-stone-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className="p-2 rounded-lg border border-stone-300 text-stone-600 hover:bg-stone-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronsRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

// Product History Table Row Component
const ProductHistoryRow: React.FC<{
  history: ProductHistory;
  index: number;
  startIndex: number;
  onView: (history: ProductHistory) => void;
  isOpen: boolean;
  onToggleOpen: (id: number | null) => void;
  formatCurrency: (amount: number) => string;
}> = ({
  history,
  index,
  startIndex,
  onView,
  isOpen,
  onToggleOpen,
  formatCurrency,
}) => {
  const { bg, text } = getTransactionTypeColor(history.type);
  const quantity = toNumber(history.quantity);
  const cost = toNumber(history.cost);
  const price = toNumber(history.price);
  const totalValue = quantity * price;

  return (
    <tr className="hover:bg-stone-50/50 transition-colors group">
      <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-500">
        {startIndex + index + 1}
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <ProductImage src={history.product?.image} alt={history.product?.name || ""} />
          <div>
            <div className="font-medium text-stone-900">
              <ShortTextWithTooltip text={history.product?.name || ""} max={30} />
            </div>
            <div className="text-xs text-stone-500 flex items-center gap-1 mt-0.5">
              <Hash className="h-3 w-3" />
              {history.product?.sku || ""}
            </div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <TransactionTypeBadge type={history.type} />
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex flex-col">
          <span className="font-medium text-stone-900">
            {formatNumber(quantity)}
          </span>
          <span className="text-xs text-stone-500">units</span>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex flex-col">
          <span className="font-medium text-stone-900">
            {formatCurrency(price)}
          </span>
          <span className="text-xs text-stone-500">per unit</span>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex flex-col">
          <span className="font-medium text-stone-900">
            {formatCurrency(totalValue)}
          </span>
          <span className="text-xs text-stone-500">total</span>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap hidden md:table-cell">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-stone-400" />
          <span className="text-sm text-stone-600">
            {formatDate(history.transaction_date)}
          </span>
        </div>
      </td>
      <td className="px-6 py-4 text-center relative">
        <button
          onClick={() => onToggleOpen(isOpen ? null : history.id)}
          className="p-2 rounded-lg hover:bg-stone-100 transition text-stone-400 hover:text-stone-600"
        >
          <MoreVertical className="h-4 w-4" />
        </button>

        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => onToggleOpen(null)}
            />
            <div className="absolute right-6 z-40 w-48 bg-white border border-stone-200 rounded-xl shadow-lg shadow-stone-200/50 animate-fadeIn">
              <button
                onClick={() => {
                  onView(history);
                  onToggleOpen(null);
                }}
                className="flex items-center gap-3 w-full px-4 py-3 text-sm text-stone-700 hover:bg-stone-50 transition rounded-xl"
              >
                <Eye className="h-4 w-4 text-[#1e3a5f]" />
                View Details
              </button>
            </div>
          </>
        )}
      </td>
    </tr>
  );
};

// View History Modal Component
const ViewHistoryModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  history: ProductHistory | null;
  formatCurrency: (amount: number) => string;
}> = ({ isOpen, onClose, history, formatCurrency }) => {
  if (!isOpen || !history) return null;

  const quantity = toNumber(history.quantity);
  const cost = toNumber(history.cost);
  const price = toNumber(history.price);
  const totalValue = quantity * price;
  const profit = quantity * (price - cost);
  const { bg, text, icon: TypeIcon } = getTransactionTypeColor(history.type);

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-stone-900/40 backdrop-blur-sm z-50 p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-scaleIn">
        <div className="sticky top-0 bg-white border-b border-stone-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ProductImage
              src={history.product?.image}
              alt={history.product?.name || ""}
              className="w-12 h-12"
            />
            <div>
              <h2 className="text-xl font-bold text-stone-900">
                Transaction Details
              </h2>
              <p className="text-sm text-stone-500">
                {history.product?.name || ""} - {history.product?.sku || ""}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-lg transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="space-y-6">
            {/* Transaction Type */}
            <div className={`${bg} rounded-lg p-4 flex items-center gap-3`}>
              <TypeIcon className={`h-5 w-5 ${text}`} />
              <div>
                <span className={`text-sm font-medium ${text}`}>
                  {history.type.charAt(0).toUpperCase() + history.type.slice(1)} Transaction
                </span>
                <p className="text-xs text-stone-600 mt-0.5">
                  {history.note || "No additional notes"}
                </p>
              </div>
            </div>

            {/* Transaction Details */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-stone-50 rounded-lg p-4">
                <p className="text-xs text-stone-500 mb-1">Quantity</p>
                <p className="text-xl font-bold text-stone-900">{formatNumber(quantity)}</p>
                <p className="text-xs text-stone-500 mt-1">units</p>
              </div>
              <div className="bg-stone-50 rounded-lg p-4">
                <p className="text-xs text-stone-500 mb-1">Selling Price</p>
                <p className="text-xl font-bold text-stone-900">{formatCurrency(price)}</p>
                <p className="text-xs text-stone-500 mt-1">per unit</p>
              </div>
              <div className="bg-stone-50 rounded-lg p-4">
                <p className="text-xs text-stone-500 mb-1"> Cost Price</p>
                <p className="text-xl font-bold text-stone-900">{formatCurrency(cost)}</p>
                <p className="text-xs text-stone-500 mt-1">per unit</p>
              </div>
              <div className="bg-stone-50 rounded-lg p-4">
                <p className="text-xs text-stone-500 mb-1">Total Value</p>
                <p className="text-xl font-bold text-stone-900">{formatCurrency(totalValue)}</p>
                <p className="text-xs text-stone-500 mt-1">at sale price</p>
              </div>
            </div>

            {/* Profit Analysis (for additions only) */}
            {history.type === "addition" && profit !== 0 && (
              <div className="bg-gradient-to-r from-gray-50 to-transparent border border-emerald-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-emerald-700 mb-1">Estimated Profit</p>
                    <p className="text-lg font-bold text-emerald-700">{formatCurrency(profit)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-emerald-700 mb-1">Profit Margin</p>
                    <p className="text-lg font-bold text-emerald-700">
                      {cost > 0 ? (((price - cost) / cost) * 100).toFixed(1) : "0"}%
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Additional Information */}
            <div className="border-t border-stone-200 pt-4">
              <h3 className="text-sm font-medium text-stone-900 mb-3 flex items-center gap-2">
                <FileText className="h-4 w-4 text-stone-500" />
                Additional Information
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-stone-500">Transaction Date</span>
                  <span className="text-stone-900">{formatDate(history.transaction_date)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-stone-500">Created At</span>
                  <span className="text-stone-900">{formatDate(history.created_at)}</span>
                </div>
              </div>
            </div>

            {/* Note Section */}
            {history.note && (
              <div className="bg-stone-50 rounded-lg p-4">
                <p className="text-xs text-stone-500 mb-2">Note</p>
                <p className="text-sm text-stone-900">{history.note}</p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-stone-200">
            <button
              onClick={onClose}
              className="px-6 py-3 text-sm font-medium text-white bg-[#1e3a5f] rounded-lg hover:bg-[#2c4c6e] transition-all shadow-lg shadow-[#1e3a5f]/20"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Date Range Filter Component
const DateRangeFilter: React.FC<{
  startDate: Date | null;
  endDate: Date | null;
  onStartDateChange: (date: Date | null) => void;
  onEndDateChange: (date: Date | null) => void;
  onClear: () => void;
}> = ({ startDate, endDate, onStartDateChange, onEndDateChange, onClear }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-4 py-3 border rounded-xl transition-all ${
          startDate || endDate
            ? "bg-[#1e3a5f] text-white border-[#1e3a5f]"
            : "bg-white border-stone-300 text-stone-700 hover:border-stone-400"
        }`}
      >
        <Calendar className="h-5 w-5" />
        <span className="text-sm font-medium">
          {startDate || endDate ? (
            <>
              {startDate ? formatDateForDisplay(startDate) : "Start"} -{" "}
              {endDate ? formatDateForDisplay(endDate) : "End"}
            </>
          ) : (
            "Date Range"
          )}
        </span>
      </button>
      
      {/* Move the clear button outside the main button */}
      {(startDate || endDate) && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClear();
          }}
          className="absolute right-12 top-1/2 -translate-y-1/2 p-1 hover:bg-white/20 rounded-lg transition text-white"
          aria-label="Clear date range"
        >
          <X className="h-4 w-4" />
        </button>
      )}

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 z-50 bg-white border border-stone-200 rounded-xl shadow-xl p-4 w-[350px]">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-stone-500 mb-1">
                  Start Date
                </label>
                <DatePicker
                  selected={startDate}
                  onChange={(date) => onStartDateChange(date)}
                  selectsStart
                  startDate={startDate}
                  endDate={endDate}
                  maxDate={endDate || undefined}
                  placeholderText="Select start date"
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f] outline-none"
                  dateFormat="MMM d, yyyy"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-500 mb-1">
                  End Date
                </label>
                <DatePicker
                  selected={endDate}
                  onChange={(date) => onEndDateChange(date)}
                  selectsEnd
                  startDate={startDate}
                  endDate={endDate}
                  minDate={startDate || undefined}
                  maxDate={new Date()}
                  placeholderText="Select end date"
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f] outline-none"
                  dateFormat="MMM d, yyyy"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => {
                    onClear();
                    setIsOpen(false);
                  }}
                  className="flex-1 px-4 py-2 text-sm font-medium text-stone-700 bg-stone-100 rounded-lg hover:bg-stone-200 transition"
                >
                  Clear
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-[#1e3a5f] rounded-lg hover:bg-[#2c4c6e] transition"
                >
                  Apply
                </button>
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

const ProductHistory = ({ user }: { user?: any }) => {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  // Format currency with user's preferred currency symbol
  const formatCurrencyWithSymbol = (amount: number): string => {
    const currencySymbol = user?.businesses_one?.[0]?.currency || "$";
    return formatCurrency(amount, currencySymbol);
  };

  // State
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [openRow, setOpenRow] = useState<number | null>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedHistory, setSelectedHistory] = useState<ProductHistory | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [historyData, setHistoryData] = useState<ProductHistory[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [locationName, setLocationName] = useState<string>("");
  const debouncedSearch = useDebounce(searchTerm, 300);

  // Helper function used for both initial load and refresh
  const loadData = async () => {
    if (!id) return;
    setIsLoading(true);

    try {
      const response = await apiGet(`/product_history/${id}`, {}, false);
      
      console.log("API Response:", response.data);
      
      // Extract data from the response
      const location_name = response?.data?.location_name ?? "";
      const historyItems = response?.data?.data ?? [];
      
      setLocationName(location_name);
      setHistoryData(Array.isArray(historyItems) ? historyItems : []);
    } catch (error) {
      console.error("Failed to load data:", error);
      toast.error("Failed to load product history");
    } finally {
      setIsLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadData();
  }, [id]);

  // Refresh handler
  const handleRefresh = async () => {
    await loadData();
    toast.success("Data refreshed");
  };

  // Clear date range filter
  const clearDateRange = () => {
    setStartDate(null);
    setEndDate(null);
    setCurrentPage(1);
  };

  // Filtered history items with date range
  const filteredHistory = useMemo(() => {
    return historyData
      .filter((item) => {
        if (!item || !item.product) return false;

        // Search filter
        const searchableText = [
          item.product.name || "",
          item.product.sku || "",
          item.product.description || "",
          item.type || "",
          item.note || "",
        ]
          .join(" ")
          .toLowerCase();

        const matchesSearch = searchableText.includes(debouncedSearch.toLowerCase());

        // Date range filter
        let matchesDateRange = true;
        if (startDate || endDate) {
          const transactionDate = new Date(item.transaction_date);
          
          if (startDate) {
            const start = new Date(startDate);
            start.setHours(0, 0, 0, 0);
            matchesDateRange = matchesDateRange && transactionDate >= start;
          }
          
          if (endDate) {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            matchesDateRange = matchesDateRange && transactionDate <= end;
          }
        }

        return matchesSearch && matchesDateRange;
      })
      .sort((a, b) => {
        // Sort by transaction date, most recent first
        return new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime();
      });
  }, [historyData, debouncedSearch, startDate, endDate]);

  // Pagination
  const totalItems = filteredHistory.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const currentItems = filteredHistory.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, startDate, endDate]);

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <header className="bg-white border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <Link
                href="/locations"
                className="p-2 text-stone-500 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-stone-900">
                  Product History - <ShortTextWithTooltip
                    text={locationName || "Location"}
                    max={30}
                  />
                </h1>
                <p className="text-sm text-stone-500">
                  View all product transactions in this location
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleRefresh}
                className="p-2.5 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors border border-stone-200"
              >
                <RefreshCw className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 h-5 w-5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by product name, SKU, transaction type, or notes..."
              className="w-full pl-10 pr-4 py-3 bg-white border border-stone-300 rounded-xl focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f] outline-none transition placeholder-stone-400"
            />
          </div>
          <DateRangeFilter
            startDate={startDate}
            endDate={endDate}
            onStartDateChange={setStartDate}
            onEndDateChange={setEndDate}
            onClear={clearDateRange}
          />
        </div>

        {/* Active Filters */}
        {(startDate || endDate || searchTerm) && (
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <span className="text-xs text-stone-500">Active filters:</span>
            {searchTerm && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-stone-100 text-stone-700 rounded-full text-sm">
                <Search className="h-3 w-3" />
                {searchTerm}
                <button
                  onClick={() => setSearchTerm("")}
                  className="ml-1 p-0.5 hover:bg-stone-200 rounded-full"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {startDate && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-stone-100 text-stone-700 rounded-full text-sm">
                <Calendar className="h-3 w-3" />
                From: {formatDateForDisplay(startDate)}
                <button
                  onClick={() => setStartDate(null)}
                  className="ml-1 p-0.5 hover:bg-stone-200 rounded-full"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {endDate && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-stone-100 text-stone-700 rounded-full text-sm">
                <Calendar className="h-3 w-3" />
                To: {formatDateForDisplay(endDate)}
                <button
                  onClick={() => setEndDate(null)}
                  className="ml-1 p-0.5 hover:bg-stone-200 rounded-full"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
          </div>
        )}

        {/* Summary Cards */}
        {!isLoading && filteredHistory.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl border border-stone-200 p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-emerald-700" />
                </div>
                <div>
                  <p className="text-xs text-stone-500">Total Additions</p>
                  <p className="text-lg font-bold text-stone-900">
                    {filteredHistory.filter(item => item.type === "addition").length}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-stone-200 p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-rose-100 rounded-lg flex items-center justify-center">
                  <TrendingDown className="h-5 w-5 text-rose-700" />
                </div>
                <div>
                  <p className="text-xs text-stone-500">Total Subtractions</p>
                  <p className="text-lg font-bold text-stone-900">
                    {filteredHistory.filter(item => item.type === "subtraction").length}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-stone-200 p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Package className="h-5 w-5 text-gray-700" />
                </div>
                <div>
                  <p className="text-xs text-stone-500">Unique Products</p>
                  <p className="text-lg font-bold text-stone-900">
                    {new Set(filteredHistory.map(item => item.product_id)).size}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-stone-200 p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-amber-700" />
                </div>
                <div>
                  <p className="text-xs text-stone-500">Total Transaction Value</p>
                  <p className="text-lg font-bold text-stone-900">
                    {formatCurrencyWithSymbol(
                      filteredHistory.reduce((sum, item) => 
                        sum + (toNumber(item.quantity) * toNumber(item.price)), 0
                      )
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* History Count */}
        <div className="mb-4 flex items-center justify-between">
          <span className="text-sm text-stone-600">
            Showing{" "}
            <span className="font-semibold">
              {startIndex + 1}-{endIndex}
            </span>{" "}
            of <span className="font-semibold">{totalItems}</span> transactions
          </span>
        </div>

        {/* Loading State */}
        {isLoading && <LoadingState />}

        {/* Empty State */}
        {!isLoading && currentItems.length === 0 && (
          <EmptyState
            title={searchTerm || startDate || endDate ? "No transactions found" : "No transactions yet"}
            description={
              searchTerm || startDate || endDate
                ? "Try adjusting your search terms or date range"
                : "No product transactions have been recorded in this location"
            }
            icon={Package}
          />
        )}

        {/* Table View */}
        {!isLoading && currentItems.length > 0 && (
          <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-stone-50 text-stone-600 border-b border-stone-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider w-12">
                      SN
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">
                      Quantity
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">
                      Unit Price
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">
                      Total Value
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider hidden md:table-cell">
                      Date
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider w-12">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {currentItems.map((history, index) => (
                    <ProductHistoryRow
                      key={history.id}
                      history={history}
                      index={index}
                      startIndex={startIndex}
                      onView={(history) => {
                        setSelectedHistory(history);
                        setViewModalOpen(true);
                      }}
                      isOpen={openRow === history.id}
                      onToggleOpen={setOpenRow}
                      formatCurrency={formatCurrencyWithSymbol}
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

      {/* View Modal */}
      <ViewHistoryModal
        isOpen={viewModalOpen}
        onClose={() => {
          setViewModalOpen(false);
          setSelectedHistory(null);
        }}
        history={selectedHistory}
        formatCurrency={formatCurrencyWithSymbol}
      />
    </div>
  );
};

export default withAuth(ProductHistory);