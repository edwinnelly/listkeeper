"use client";

import { withAuth } from "@/hoc/withAuth";
import { apiGet } from "@/lib/axios";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
    ArrowLeft,
    Loader2,
    Package,
    AlertCircle,
    ArrowRightLeft,
    Search,
    Filter,
    ChevronDown,
    Eye,
    Calendar,
    Warehouse,
    TrendingUp,
    TrendingDown,
    RefreshCw,
    Building2,
    Hash,
    Clock,
    CheckCircle2,
    XCircle,
    AlertTriangle,
    Download,
    Plus,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
    status: "pending" | "in_transit" | "completed" | "cancelled";
    business_key: string;
    postby: string | null;
    created_at: string;
    updated_at: string;
    from_location?: {
        id: string;
        location_name: string;
        city?: string;
        head_office?: string;
    };
    to_location?: {
        id: string;
        location_name: string;
        city?: string;
        head_office?: string;
    };
    product?: {
        id: string;
        name: string;
        sku: string;
        image: string | null;
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

const formatCurrency = (amount: number, symbol: string = "$"): string => {
    return new Intl.NumberFormat(CURRENCY_LOCALE, {
        style: "currency",
        currency: DEFAULT_CURRENCY,
        minimumFractionDigits: 2,
    })
        .format(amount)
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

const extractDataFromResponse = <T,>(
    response: unknown,
    paths: string[]
): T[] => {
    for (const path of paths) {
        const data = path
            .split(".")
            .reduce((obj: any, key) => obj?.[key], response);
        if (Array.isArray(data)) return data;
    }
    return [];
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
const EmptyState: React.FC<{ filtered: boolean }> = ({ filtered }) => (
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
                href="/transfers/new"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#166534] text-white text-sm font-semibold rounded-xl hover:bg-[#14532d] transition-all shadow-lg shadow-[#166534]/20"
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
}

const TransferRow: React.FC<TransferRowProps> = ({
    transfer,
    currencySymbol,
    index,
}) => {
    const router = useRouter();

    return (
        <motion.tr
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.03 }}
            onClick={() => router.push(`/fetch_transfer_stock/${transfer.id}`)}
            className="border-b border-gray-100 hover:bg-gray-50/80 cursor-pointer transition-colors group"
        >
            {/* Product */}
            <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-[#166534]/10 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {transfer.product?.image ? (
                            <img
                                src={getImageUrl(transfer.product.image)}
                                alt={transfer.product.name}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <Package className="h-4 w-4 text-[#166534]" />
                        )}
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-gray-900 group-hover:text-[#166534] transition-colors">
                            {transfer.product?.name || "—"}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                            {transfer.product?.sku || "—"}
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
                        router.push(`/transfers/${transfer.id}`);
                    }}
                    className="p-2 text-gray-400 hover:text-[#166534] hover:bg-[#166534]/10 rounded-lg transition-all"
                    aria-label="View transfer details"
                >
                    <Eye className="h-4 w-4" />
                </button>
            </td>
        </motion.tr>
    );
};

// ==============================================
// Main Component
// ==============================================

const TransfersPage = ({ user }: { user: User }) => {
    const router = useRouter();

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
    const [showFilters, setShowFilters] = useState(false);

    // ==============================================
    // Data Fetching
    // ==============================================

    const fetchTransfers = useCallback(async (silent = false) => {
        if (!silent) setIsLoading(true);
        else setIsRefreshing(true);

        try {
            const response = await apiGet("/fetch_transfer_stock", {}, false);
            const data = extractDataFromResponse<StockTransfer>(response, [
                "data",
                "data.data",
                "data.transfers",
            ]);
            setTransfers(data);
        } catch (error: any) {
            const message =
                error?.response?.data?.message || "Failed to load transfers";
            toast.error(message);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchTransfers();
    }, [fetchTransfers]);

    // ==============================================
    // Computed Values
    // ==============================================

    const stats: TransferStats = useMemo(() => {
        return {
            total: transfers.length,
            pending: transfers.filter((t) => t.status === "pending").length,
            in_transit: transfers.filter((t) => t.status === "in_transit").length,
            completed: transfers.filter((t) => t.status === "completed").length,
            cancelled: transfers.filter((t) => t.status === "cancelled").length,
            total_value: transfers.reduce((sum, t) => sum + t.total, 0),
        };
    }, [transfers]);

    const filteredTransfers = useMemo(() => {
        let result = [...transfers];

        // Search filter
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

        // Status filter
        if (statusFilter !== "all") {
            result = result.filter((t) => t.status === statusFilter);
        }

        // Date filter
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

    // ==============================================
    // Render: Loading
    // ==============================================

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-[#166534] mx-auto mb-4" />
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
            {/* ============================================== */}
            {/* Header */}
            {/* ============================================== */}
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
                                    {stats.total} transfer{stats.total !== 1 ? "s" : ""} total
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => fetchTransfers(true)}
                                disabled={isRefreshing}
                                className="p-2.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all disabled:opacity-50"
                                aria-label="Refresh transfers"
                            >
                                <RefreshCw
                                    className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
                                />
                            </button>
                            <Link
                                href="/transfers/new"
                                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#166534] text-white text-sm font-semibold rounded-xl hover:bg-[#14532d] transition-all shadow-lg shadow-[#166534]/25"
                            >
                                <Plus className="h-4 w-4" />
                                New Transfer
                            </Link>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

                {/* ============================================== */}
                {/* Stats Row */}
                {/* ============================================== */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                    <StatCard
                        label="Total"
                        value={stats.total}
                        icon={<ArrowRightLeft className="h-5 w-5 text-[#166534]" />}
                        iconBg="bg-[#166534]/10"
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

                {/* ============================================== */}
                {/* Filters & Search */}
                {/* ============================================== */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden"
                >
                    <div className="p-4 flex flex-col sm:flex-row gap-3">
                        {/* Search */}
                        <div className="relative flex-1">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search by product, SKU, location, or reference..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#166534]/20 focus:border-[#166534] outline-none text-sm transition-all"
                            />
                        </div>

                        {/* Status Filter */}
                        <div className="relative">
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="appearance-none pl-4 pr-9 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#166534]/20 focus:border-[#166534] outline-none text-sm bg-white transition-all"
                            >
                                <option value="all">All Statuses</option>
                                <option value="pending">Pending</option>
                                <option value="in_transit">In Transit</option>
                                <option value="completed">Completed</option>
                                <option value="cancelled">Cancelled</option>
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                        </div>

                        {/* Date Filter */}
                        <div className="relative">
                            <select
                                value={dateFilter}
                                onChange={(e) => setDateFilter(e.target.value)}
                                className="appearance-none pl-4 pr-9 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#166534]/20 focus:border-[#166534] outline-none text-sm bg-white transition-all"
                            >
                                <option value="all">All Time</option>
                                <option value="today">Today</option>
                                <option value="week">Last 7 Days</option>
                                <option value="month">Last 30 Days</option>
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                        </div>

                        {/* Active filter indicator */}
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

                    {/* Active filter pill row */}
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
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#166534]/10 text-[#166534] text-xs font-medium rounded-full">
                                        <Search className="h-3 w-3" />
                                        "{searchQuery}"
                                    </span>
                                )}
                                {statusFilter !== "all" && (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#166534]/10 text-[#166534] text-xs font-medium rounded-full">
                                        <Filter className="h-3 w-3" />
                                        {STATUS_CONFIG[statusFilter as keyof typeof STATUS_CONFIG]?.label}
                                    </span>
                                )}
                                {dateFilter !== "all" && (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#166534]/10 text-[#166534] text-xs font-medium rounded-full">
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

                {/* ============================================== */}
                {/* Transfers Table */}
                {/* ============================================== */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden"
                >
                    {filteredTransfers.length === 0 ? (
                        <EmptyState filtered={isFiltered} />
                    ) : (
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
                                        />
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Table footer */}
                    {filteredTransfers.length > 0 && (
                        <div className="px-6 py-3.5 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                            <p className="text-xs text-gray-500">
                                Showing{" "}
                                <span className="font-semibold text-gray-700">
                                    {filteredTransfers.length}
                                </span>{" "}
                                of{" "}
                                <span className="font-semibold text-gray-700">
                                    {transfers.length}
                                </span>{" "}
                                transfers
                            </p>
                            <p className="text-xs text-gray-500">
                                Total value:{" "}
                                <span className="font-semibold text-gray-700">
                                    {formatCurrency(
                                        filteredTransfers.reduce((s, t) => s + t.total, 0),
                                        currencySymbol
                                    )}
                                </span>
                            </p>
                        </div>
                    )}
                </motion.div>
            </main>
        </div>
    );
};

export default withAuth(TransfersPage);