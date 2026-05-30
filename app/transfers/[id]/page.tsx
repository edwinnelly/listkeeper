"use client";

import { withAuth } from "@/hoc/withAuth";
import { apiGet } from "@/lib/axios";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
    ArrowLeft,
    Loader2,
    Package,
    ArrowRightLeft,
    Search,
    Filter,
    ChevronDown,
    Eye,
    Calendar,
    TrendingUp,
    RefreshCw,
    Hash,
    Clock,
    CheckCircle2,
    XCircle,
    Plus,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { toast } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

// ==============================================
// Type Definitions
// ==============================================

/** Represents a single stock transfer record from the API */
interface StockTransfer {
    id: string;
    from_location_id: string;
    to_location_id: string;
    product_id: string;
    stock_quantity: number;
    stock_quantity_before: number;
    unit_cost: number;
    total: number;
    transfer_date: string;
    expected_delivery_date: string | null;
    reference_number: string | null;
    notes: string | null;
    status: "pending" | "in_transit" | "completed" | "cancelled" | "approved";
    business_key: string;
    postby: string | null;
    received_by?: string;
    created_at: string;
    updated_at: string;
    from_location?: {
        id: string;
        location_name: string;
        city?: string;
        head_office?: string | null;
    };
    to_location?: {
        id: string;
        location_name: string;
        city?: string;
        head_office?: string | null;
    };
    product?: {
        id: string;
        name: string;
        sku: string;
        image: string | null;
        barcode?: string | null;
    };
}

/** Pagination metadata from API */
interface PaginationMeta {
    current_page: number;
    per_page: number;
    total: number;
    total_pages: number;
    from: number;
    to: number;
    has_more_pages: boolean;
}

/** Summary data from API */
interface TransferSummary {
    total_value: number;
    current_page_value: number;
    status_counts: {
        pending: number;
        in_transit: number;
        completed: number;
        cancelled: number;
    };
}

/** Authenticated user object with business settings */
interface User {
    name?: string;
    email?: string;
    businesses_one?: Array<{
        currency?: string;
        name?: string;
        business_key?: string;
    }>;
}

/** Summary stats for the page header */
interface TransferStats {
    total: number;
    pending: number;
    in_transit: number;
    completed: number;
    cancelled: number;
    total_value: number;
}

// ==============================================
// Constants
// ==============================================

const CURRENCY_LOCALE = "en-US";
const DEFAULT_CURRENCY = "USD";
const API_STORAGE_BASE_URL =
    process.env.NEXT_PUBLIC_STORAGE_URL || "http://localhost:8000/storage";

const ITEMS_PER_PAGE_OPTIONS = [10, 25, 50, 100];

const STATUS_CONFIG = {
    pending: {
        label: "Pending",
        icon: Clock,
        bg: "bg-amber-50",
        border: "border-amber-200",
        text: "text-amber-700",
        dot: "bg-amber-400",
    },
    in_transit: {
        label: "In Transit",
        icon: ArrowRightLeft,
        bg: "bg-blue-50",
        border: "border-blue-200",
        text: "text-blue-700",
        dot: "bg-blue-400",
    },
    completed: {
        label: "Completed",
        icon: CheckCircle2,
        bg: "bg-emerald-50",
        border: "border-emerald-200",
        text: "text-emerald-700",
        dot: "bg-emerald-400",
    },
    approved: {
        label: "Approved",
        icon: CheckCircle2,
        bg: "bg-green-50",
        border: "border-green-200",
        text: "text-green-700",
        dot: "bg-green-400",
    },
    cancelled: {
        label: "Cancelled",
        icon: XCircle,
        bg: "bg-red-50",
        border: "border-red-200",
        text: "text-red-700",
        dot: "bg-red-400",
    },
} as const;

// ==============================================
// Utility Functions
// ==============================================

/**
 * Normalizes transfer data from API response
 * Converts string monetary values to numbers
 * Returns null if transfer is falsy
 */
const normalizeTransfer = (transfer: any): StockTransfer | null => {
    if (!transfer) return null;
    
    return {
        ...transfer,
        unit_cost: typeof transfer.unit_cost === 'string' ? parseFloat(transfer.unit_cost) : transfer.unit_cost,
        total: typeof transfer.total === 'string' ? parseFloat(transfer.total) : transfer.total,
    };
};

const formatCurrency = (amount: number | string, symbol: string = "$"): string => {
    const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    
    if (isNaN(numericAmount)) return `${symbol}0.00`;
    
    return new Intl.NumberFormat(CURRENCY_LOCALE, {
        style: "currency",
        currency: DEFAULT_CURRENCY,
        minimumFractionDigits: 2,
    })
        .format(numericAmount)
        .replace(/^\$/, symbol);
};

const formatDate = (dateStr: string): string => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-US", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
};

const getImageUrl = (src: string | null): string => {
    if (!src) return "";
    return `${API_STORAGE_BASE_URL}/${src}`;
};

// ==============================================
// Sub-Components
// ==============================================

/** Status badge component */
const StatusBadge: React.FC<{ status: StockTransfer["status"] }> = ({
    status,
}) => {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
    const Icon = config.icon;
    return (
        <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${config.bg} ${config.border} ${config.text}`}
        >
            <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
            {config.label}
        </span>
    );
};

/** Stat card for the summary row */
interface StatCardProps {
    label: string;
    value: string | number;
    icon: React.ReactNode;
    iconBg: string;
    delay?: number;
}

const StatCard: React.FC<StatCardProps> = ({
    label,
    value,
    icon,
    iconBg,
    delay = 0,
}) => (
    <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay }}
        className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex items-center gap-4"
    >
        <div
            className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}
        >
            {icon}
        </div>
        <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider">{label}</p>
            <p className="text-xl font-bold text-gray-900 mt-0.5">{value}</p>
        </div>
    </motion.div>
);

/** Empty state component */
const EmptyState: React.FC<{ filtered: boolean; locationId?: string }> = ({ filtered, locationId }) => (
    <div className="text-center py-16">
        <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ArrowRightLeft className="h-8 w-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">
            {filtered ? "No transfers match your filters" : "No transfers yet"}
        </h3>
        <p className="text-gray-500 text-sm mb-6">
            {filtered
                ? "Try adjusting your search or filter criteria."
                : "Stock transfers between your locations will appear here."}
        </p>
        {!filtered && (
            <Link
                href={locationId ? `/itemstransfers/${locationId}` : "/transfers/new"}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#010804] text-white text-sm font-semibold rounded-xl hover:bg-[#14532d] transition-all shadow-lg shadow-[#010804]/20"
            >
                <Plus className="h-4 w-4" />
                Create First Transfer
            </Link>
        )}
    </div>
);

/** Transfer row for the table */
interface TransferRowProps {
    transfer: StockTransfer;
    currencySymbol: string;
    index: number;
    locationId?: string; // Added locationId prop
}

const TransferRow: React.FC<TransferRowProps> = ({
    transfer,
    currencySymbol,
    index,
    locationId, // Destructure locationId
}) => {
    const router = useRouter();

    return (
        <motion.tr
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.03 }}
            onClick={() => {
                // Navigate to the transfer details with or without locationId
                const url = locationId 
                    ? `/approvetransfers/${transfer.id}/${locationId}`
                    : `/approvetransfers/${transfer.id}`;
                router.push(url);
            }}
            className="border-b border-gray-100 hover:bg-gray-50/80 cursor-pointer transition-colors group"
        >
            {/* Product */}
            <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-[#010804]/10 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {transfer.product?.image ? (
                            <img
                                src={getImageUrl(transfer.product.image)}
                                alt={transfer.product.name || "Product"}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none';
                                }}
                            />
                        ) : (
                            <Package className="h-4 w-4 text-[#010804]" />
                        )}
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-gray-900 group-hover:text-[#010804] transition-colors">
                            {transfer.product?.name || "—"}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                            {transfer.product?.sku || "—"}
                            {transfer.product?.barcode && ` • ${transfer.product.barcode}`}
                        </p>
                    </div>
                </div>
            </td>

            {/* Route */}
            <td className="px-6 py-4">
                <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium text-gray-700 truncate max-w-[100px]">
                        {transfer.from_location?.location_name || "—"}
                    </span>
                    <ArrowRightLeft className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                    <span className="font-medium text-gray-700 truncate max-w-[100px]">
                        {transfer.to_location?.location_name || "—"}
                    </span>
                </div>
            </td>

            {/* Quantity */}
            <td className="px-6 py-4">
                <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold text-gray-900">
                        {transfer.stock_quantity}
                    </span>
                    <span className="text-xs text-gray-400">units</span>
                </div>
                <p className="text-xs text-gray-400 mt-0.5">
                    Before: {transfer.stock_quantity_before}
                </p>
            </td>

            {/* Value */}
            <td className="px-6 py-4">
                <p className="text-sm font-bold text-gray-900">
                    {formatCurrency(transfer.total, currencySymbol)}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                    @ {formatCurrency(transfer.unit_cost, currencySymbol)}/unit
                </p>
            </td>

            {/* Transfer Date */}
            <td className="px-6 py-4">
                <p className="text-sm text-gray-700">{formatDate(transfer.transfer_date)}</p>
                {transfer.expected_delivery_date && (
                    <p className="text-xs text-gray-400 mt-0.5">
                        ETA: {formatDate(transfer.expected_delivery_date)}
                    </p>
                )}
            </td>

            {/* Reference */}
            <td className="px-6 py-4">
                {transfer.reference_number ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 rounded-md text-xs font-mono text-gray-600">
                        <Hash className="h-3 w-3" />
                        {transfer.reference_number}
                    </span>
                ) : (
                    <span className="text-xs text-gray-400">—</span>
                )}
            </td>

            {/* Status */}
            <td className="px-6 py-4">
                <StatusBadge status={transfer.status} />
            </td>

            {/* Action */}
            <td className="px-6 py-4">
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        // Use locationId if available, otherwise just navigate to transfer
                        const url = locationId 
                            ? `/approvetransfers/${transfer.id}/${locationId}`
                            : `/approvetransfers/${transfer.id}`;
                        router.push(url);
                    }}
                    className="
                        inline-flex items-center gap-2
                        px-3 py-2
                        border border-gray-200
                        bg-white
                        text-gray-700
                        text-sm font-medium
                        rounded-xl
                        hover:bg-gray-50
                        hover:border-[#010804]/20
                        hover:text-[#010804]
                        transition-all duration-200
                    "
                    aria-label="View transfer details"
                >
                    <Eye className="h-4 w-4" />
                    <span>View</span>
                </button>
            </td>
        </motion.tr>
    );
};

/** Pagination component */
interface PaginationProps {
    currentPage: number;
    totalPages: number;
    itemsPerPage: number;
    totalItems: number;
    currentPageValue?: number;
    totalValue?: number;
    currencySymbol?: string;
    onPageChange: (page: number) => void;
    onItemsPerPageChange: (itemsPerPage: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({
    currentPage,
    totalPages,
    itemsPerPage,
    totalItems,
    currentPageValue = 0,
    totalValue = 0,
    currencySymbol = "$",
    onPageChange,
    onItemsPerPageChange,
}) => {
    // Calculate visible page numbers
    const getVisiblePages = (): (number | string)[] => {
        if (totalPages <= 7) {
            return Array.from({ length: totalPages }, (_, i) => i + 1);
        }

        const delta = 2;
        const range: number[] = [];
        const rangeWithDots: (number | string)[] = [];

        for (
            let i = Math.max(2, currentPage - delta);
            i <= Math.min(totalPages - 1, currentPage + delta);
            i++
        ) {
            range.push(i);
        }

        if (currentPage - delta > 2) {
            rangeWithDots.push(1, "...");
        } else {
            rangeWithDots.push(1);
        }

        rangeWithDots.push(...range);

        if (currentPage + delta < totalPages - 1) {
            rangeWithDots.push("...", totalPages);
        } else if (totalPages > 1) {
            rangeWithDots.push(totalPages);
        }

        return rangeWithDots;
    };

    const startItem = totalItems > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);

    if (totalItems === 0) return null;

    return (
        <div className="px-6 py-3.5 bg-gray-50 border-t border-gray-200">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                {/* Items per page selector */}
                <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">Rows per page:</span>
                    <select
                        value={itemsPerPage}
                        onChange={(e) => {
                            onItemsPerPageChange(Number(e.target.value));
                            onPageChange(1);
                        }}
                        className="pl-2 pr-8 py-1 border border-gray-300 rounded-lg text-xs font-medium text-gray-700 bg-white focus:ring-2 focus:ring-[#010804]/20 focus:border-[#010804] outline-none cursor-pointer"
                    >
                        {ITEMS_PER_PAGE_OPTIONS.map((option) => (
                            <option key={option} value={option}>
                                {option}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Value info */}
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 text-xs">
                        <span className="text-gray-500">Page Total:</span>
                        <span className="font-semibold text-gray-700">
                            {formatCurrency(currentPageValue, currencySymbol)}
                        </span>
                    </div>
                    <div className="w-px h-4 bg-gray-300"></div>
                    <div className="flex items-center gap-1.5 text-xs">
                        <span className="text-gray-500">Overall Total:</span>
                        <span className="font-semibold text-[#010804]">
                            {formatCurrency(totalValue, currencySymbol)}
                        </span>
                    </div>
                </div>

                {/* Page info and navigation */}
                <div className="flex items-center gap-4">
                    <p className="text-xs text-gray-500">
                        {startItem}-{endItem} of {totalItems}
                    </p>
                    <div className="flex items-center gap-1">
                        {/* First page */}
                        <button
                            onClick={() => onPageChange(1)}
                            disabled={currentPage === 1}
                            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                            aria-label="First page"
                        >
                            <ChevronsLeft className="h-4 w-4" />
                        </button>

                        {/* Previous page */}
                        <button
                            onClick={() => onPageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                            aria-label="Previous page"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </button>

                        {/* Page numbers */}
                        <div className="flex items-center gap-0.5">
                            {getVisiblePages().map((page, index) => {
                                if (page === "...") {
                                    return (
                                        <span
                                            key={`dots-${index}`}
                                            className="w-8 h-8 flex items-center justify-center text-xs text-gray-400"
                                        >
                                            ...
                                        </span>
                                    );
                                }

                                const pageNum = page as number;
                                return (
                                    <button
                                        key={pageNum}
                                        onClick={() => onPageChange(pageNum)}
                                        className={`w-8 h-8 flex items-center justify-center text-xs font-medium rounded-lg transition-all ${
                                            currentPage === pageNum
                                                ? "bg-[#010804] text-white shadow-sm"
                                                : "text-gray-600 hover:bg-gray-100"
                                        }`}
                                    >
                                        {pageNum}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Next page */}
                        <button
                            onClick={() => onPageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                            aria-label="Next page"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </button>

                        {/* Last page */}
                        <button
                            onClick={() => onPageChange(totalPages)}
                            disabled={currentPage === totalPages}
                            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                            aria-label="Last page"
                        >
                            <ChevronsRight className="h-4 w-4" />
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

const TransfersPage = ({ user }: { user: User }) => {
    const router = useRouter();
    const params = useParams();

    // Extract the location ID from the URL
    const locationId = (params?.id as string) || "";

    console.log("📍 Location ID from URL:", locationId);

    const currencySymbol = user?.businesses_one?.[0]?.currency || "$";

    // ==============================================
    // State
    // ==============================================

    const [transfers, setTransfers] = useState<StockTransfer[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [dateFilter, setDateFilter] = useState<string>("all");
    const [paginationMeta, setPaginationMeta] = useState<PaginationMeta>({
        current_page: 1,
        per_page: 25,
        total: 0,
        total_pages: 1,
        from: 0,
        to: 0,
        has_more_pages: false,
    });
    const [summary, setSummary] = useState<TransferSummary>({
        total_value: 0,
        current_page_value: 0,
        status_counts: {
            pending: 0,
            in_transit: 0,
            completed: 0,
            cancelled: 0,
        },
    });
    const [locationName, setLocationName] = useState<string>("");

    // ==============================================
    // Data Fetching
    // ==============================================

    /**
     * Fetches stock transfers from the API with pagination
     * Uses the full endpoint: /fetch_transfer_stock or /fetch_transfer_stock/{locationId}
     * @param page - Page number to fetch
     * @param perPage - Items per page
     * @param silent - If true, uses refreshing state instead of loading state
     */
    const fetchTransfers = useCallback(async (page = 1, perPage = 25, silent = false) => {
        if (!silent) {
            setIsLoading(true);
        } else {
            setIsRefreshing(true);
        }

        try {
            // Build the endpoint with location ID if available
            const endpoint = locationId
                ? `/fetch_transfer_stock/${locationId}`
                : "/fetch_transfer_stock";

            console.log("🔄 Fetching transfers from:", endpoint, { page, perPage });

            // Make the API call with query parameters
            const response = await apiGet(endpoint, {
                page,
                per_page: perPage,
            }, false);

            // Handle the response
            const responseData = response?.data || response;

            console.log("📦 Raw API Response:", responseData);

            if (responseData?.success) {
                // Normalize the data to handle string monetary values
                const normalizedData = (responseData.data || [])
                    .map(normalizeTransfer)
                    .filter((item: StockTransfer | null): item is StockTransfer => item !== null);
                setTransfers(normalizedData);
                
                if (responseData.pagination) {
                    setPaginationMeta(responseData.pagination);
                }
                
                if (responseData.summary) {
                    setSummary(responseData.summary);
                }
                
                // Extract location name from first transfer if available
                if (normalizedData.length > 0 && !locationName) {
                    const firstTransfer = normalizedData[0];
                    setLocationName(
                        firstTransfer.from_location?.location_name || 
                        firstTransfer.to_location?.location_name || 
                        ""
                    );
                }
                
                console.log("✅ Transfers loaded:", {
                    count: normalizedData.length,
                    total: responseData.pagination?.total,
                    totalValue: responseData.summary?.total_value,
                    sampleTransfer: normalizedData[0]
                });
            } else {
                // Fallback for old API structure (array response)
                const data = Array.isArray(responseData) 
                    ? responseData 
                    : responseData?.data || [];
                
                const normalizedData = data
                    .map(normalizeTransfer)
                    .filter((item: StockTransfer | null): item is StockTransfer => item !== null);
                setTransfers(normalizedData);
                
                // Calculate pagination and summary from the raw data
                const totalValue = normalizedData.reduce((sum: number, t: StockTransfer) => 
                    sum + t.total, 0
                );
                
                setPaginationMeta({
                    current_page: 1,
                    per_page: perPage,
                    total: normalizedData.length,
                    total_pages: Math.ceil(normalizedData.length / perPage),
                    from: normalizedData.length > 0 ? 1 : 0,
                    to: normalizedData.length,
                    has_more_pages: false,
                });
                
                setSummary({
                    total_value: totalValue,
                    current_page_value: totalValue,
                    status_counts: {
                        pending: normalizedData.filter((t: StockTransfer) => 
                            t.status === "pending"
                        ).length,
                        in_transit: normalizedData.filter((t: StockTransfer) => 
                            t.status === "in_transit"
                        ).length,
                        completed: normalizedData.filter((t: StockTransfer) => 
                            t.status === "completed" || t.status === "approved"
                        ).length,
                        cancelled: normalizedData.filter((t: StockTransfer) => 
                            t.status === "cancelled"
                        ).length,
                    },
                });
                
                // Extract location name from first transfer if available
                if (normalizedData.length > 0 && !locationName) {
                    const firstTransfer = normalizedData[0];
                    setLocationName(
                        firstTransfer.from_location?.location_name || 
                        firstTransfer.to_location?.location_name || 
                        ""
                    );
                }
                
                console.log("✅ Transfers loaded (fallback):", {
                    count: normalizedData.length,
                    totalValue
                });
            }
        } catch (error: any) {
            const message =
                error?.response?.data?.message || 
                error?.message || 
                "Failed to load transfers";
            toast.error(message);
          
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, [locationId, locationName]);

    // Initial fetch
    useEffect(() => {
        fetchTransfers(1, 25);
    }, [fetchTransfers]);

    // ==============================================
    // Computed Values
    // ==============================================

    const stats: TransferStats = useMemo(() => {
        return {
            total: paginationMeta.total,
            pending: summary.status_counts.pending,
            in_transit: summary.status_counts.in_transit,
            completed: summary.status_counts.completed,
            cancelled: summary.status_counts.cancelled,
            total_value: summary.total_value,
        };
    }, [paginationMeta.total, summary]);

    // Client-side filtering (for search on current page)
    const filteredTransfers = useMemo(() => {
        let result = [...transfers];

        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            result = result.filter(
                (t) =>
                    t.product?.name?.toLowerCase().includes(q) ||
                    t.product?.sku?.toLowerCase().includes(q) ||
                    t.from_location?.location_name?.toLowerCase().includes(q) ||
                    t.to_location?.location_name?.toLowerCase().includes(q) ||
                    t.reference_number?.toLowerCase().includes(q)
            );
        }

        if (statusFilter !== "all") {
            result = result.filter((t) => t.status === statusFilter);
        }

        if (dateFilter !== "all") {
            const now = new Date();
            const cutoffs: Record<string, Date> = {
                today: new Date(now.setHours(0, 0, 0, 0)),
                week: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                month: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            };
            const cutoff = cutoffs[dateFilter];
            if (cutoff) {
                result = result.filter(
                    (t) => new Date(t.transfer_date) >= cutoff
                );
            }
        }

        return result;
    }, [transfers, searchQuery, statusFilter, dateFilter]);

    const isFiltered =
        searchQuery.trim() !== "" ||
        statusFilter !== "all" ||
        dateFilter !== "all";

    // Pagination handlers
    const handlePageChange = (page: number) => {
        const validPage = Math.max(1, Math.min(page, paginationMeta.total_pages));
        fetchTransfers(validPage, paginationMeta.per_page, true);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const handleItemsPerPageChange = (perPage: number) => {
        fetchTransfers(1, perPage, true);
    };

    const handleRefresh = () => {
        fetchTransfers(paginationMeta.current_page, paginationMeta.per_page, true);
    };

    // ==============================================
    // Render: Loading
    // ==============================================

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-[#010804] mx-auto mb-4" />
                    <p className="text-gray-500">Loading transfers...</p>
                </div>
            </div>
        );
    }

    // ==============================================
    // Render: Main
    // ==============================================

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 top-0 z-30 mt-[-13px] w-full">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => router.back()}
                                className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all"
                                aria-label="Go back"
                            >
                                <ArrowLeft className="h-5 w-5" />
                            </button>
                            <div>
                                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                                    Stock Transfers
                                </h1>
                                <p className="text-sm text-gray-500">
                                    {locationId && locationName ? `Location: ${locationName} • ` : ""}
                                    {stats.total} transfer{stats.total !== 1 ? "s" : ""} total
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={handleRefresh}
                                disabled={isRefreshing}
                                className="p-2.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all disabled:opacity-50"
                                aria-label="Refresh transfers"
                            >
                                <RefreshCw
                                    className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
                                />
                            </button>
                            <Link
                                href={`/locationproducts/${locationId}`}
                                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#020904] text-white text-sm font-semibold rounded-xl hover:bg-[#020a05] transition-all shadow-lg shadow-[#010804]/25"
                            >
                                <Plus className="h-4 w-4" />
                                New Transfer
                            </Link>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

                {/* Stats Row */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                    <StatCard
                        label="Total"
                        value={stats.total}
                        icon={<ArrowRightLeft className="h-5 w-5 text-[#010804]" />}
                        iconBg="bg-[#010804]/10"
                        delay={0}
                    />
                    <StatCard
                        label="Pending"
                        value={stats.pending}
                        icon={<Clock className="h-5 w-5 text-amber-600" />}
                        iconBg="bg-amber-50"
                        delay={0.04}
                    />
                    <StatCard
                        label="In Transit"
                        value={stats.in_transit}
                        icon={<ArrowRightLeft className="h-5 w-5 text-blue-600" />}
                        iconBg="bg-blue-50"
                        delay={0.08}
                    />
                    <StatCard
                        label="Completed"
                        value={stats.completed}
                        icon={<CheckCircle2 className="h-5 w-5 text-emerald-600" />}
                        iconBg="bg-emerald-50"
                        delay={0.12}
                    />
                    <StatCard
                        label="Cancelled"
                        value={stats.cancelled}
                        icon={<XCircle className="h-5 w-5 text-red-500" />}
                        iconBg="bg-red-50"
                        delay={0.16}
                    />
                    <StatCard
                        label="Total Value"
                        value={formatCurrency(stats.total_value, currencySymbol)}
                        icon={<TrendingUp className="h-5 w-5 text-purple-600" />}
                        iconBg="bg-purple-50"
                        delay={0.2}
                    />
                </div>

                {/* Filters & Search */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden"
                >
                    <div className="p-4 flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search by product, SKU, location, or reference..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#010804]/20 focus:border-[#010804] outline-none text-sm transition-all"
                            />
                        </div>

                        <div className="relative">
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="appearance-none pl-4 pr-9 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#010804]/20 focus:border-[#010804] outline-none text-sm bg-white transition-all"
                            >
                                <option value="all">All Statuses</option>
                                <option value="pending">Pending</option>
                                <option value="in_transit">In Transit</option>
                                <option value="completed">Completed</option>
                                <option value="approved">Approved</option>
                                <option value="cancelled">Cancelled</option>
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                        </div>

                        <div className="relative">
                            <select
                                value={dateFilter}
                                onChange={(e) => setDateFilter(e.target.value)}
                                className="appearance-none pl-4 pr-9 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#010804]/20 focus:border-[#010804] outline-none text-sm bg-white transition-all"
                            >
                                <option value="all">All Time</option>
                                <option value="today">Today</option>
                                <option value="week">Last 7 Days</option>
                                <option value="month">Last 30 Days</option>
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                        </div>

                        {isFiltered && (
                            <button
                                onClick={() => {
                                    setSearchQuery("");
                                    setStatusFilter("all");
                                    setDateFilter("all");
                                }}
                                className="px-4 py-2.5 text-sm font-medium text-red-600 bg-red-50 border-2 border-red-200 rounded-xl hover:bg-red-100 transition-all whitespace-nowrap"
                            >
                                Clear Filters
                            </button>
                        )}
                    </div>

                    <AnimatePresence>
                        {isFiltered && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="px-4 pb-3 flex items-center gap-2 flex-wrap overflow-hidden"
                            >
                                <span className="text-xs text-gray-500">Active filters:</span>
                                {searchQuery && (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#010804]/10 text-[#010804] text-xs font-medium rounded-full">
                                        <Search className="h-3 w-3" />
                                        "{searchQuery}"
                                    </span>
                                )}
                                {statusFilter !== "all" && (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#010804]/10 text-[#010804] text-xs font-medium rounded-full">
                                        <Filter className="h-3 w-3" />
                                        {STATUS_CONFIG[statusFilter as keyof typeof STATUS_CONFIG]?.label || statusFilter}
                                    </span>
                                )}
                                {dateFilter !== "all" && (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#010804]/10 text-[#010804] text-xs font-medium rounded-full">
                                        <Calendar className="h-3 w-3" />
                                        {dateFilter === "today"
                                            ? "Today"
                                            : dateFilter === "week"
                                                ? "Last 7 days"
                                                : "Last 30 days"}
                                    </span>
                                )}
                                <span className="text-xs text-gray-400 ml-auto">
                                    {filteredTransfers.length} result
                                    {filteredTransfers.length !== 1 ? "s" : ""}
                                </span>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>

                {/* Transfers Table */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden"
                >
                    {filteredTransfers.length === 0 ? (
                        <EmptyState filtered={isFiltered} locationId={locationId} />
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="bg-gray-50 border-b border-gray-200">
                                            <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                                Product
                                            </th>
                                            <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                                Route
                                            </th>
                                            <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                                Quantity
                                            </th>
                                            <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                                Value
                                            </th>
                                            <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                                Date
                                            </th>
                                            <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                                Reference
                                            </th>
                                            <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                                Status
                                            </th>
                                            <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-12">
                                                {/* Actions */}
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredTransfers.map((transfer, index) => (
                                            <TransferRow
                                                key={transfer.id}
                                                transfer={transfer}
                                                currencySymbol={currencySymbol}
                                                index={index}
                                                locationId={locationId} // Pass locationId to TransferRow
                                            />
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination Footer with Value Summary */}
                            <Pagination
                                currentPage={paginationMeta.current_page}
                                totalPages={paginationMeta.total_pages}
                                itemsPerPage={paginationMeta.per_page}
                                totalItems={paginationMeta.total}
                                currentPageValue={summary.current_page_value}
                                totalValue={summary.total_value}
                                currencySymbol={currencySymbol}
                                onPageChange={handlePageChange}
                                onItemsPerPageChange={handleItemsPerPageChange}
                            />
                        </>
                    )}
                </motion.div>
            </main>
        </div>
    );
};

export default withAuth(TransfersPage);