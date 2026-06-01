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
import { motion } from "framer-motion";

// ==============================================
// Type Definitions
// ==============================================

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
    status: "pending" | "approved" | "suspended";
    business_key: string;
    postby: string | null;
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

interface User {
    name?: string;
    email?: string;
    businesses_one?: Array<{
        currency?: string;
        name?: string;
        business_key?: string;
    }>;
}

// ==============================================
// Constants
// ==============================================

const CURRENCY_LOCALE = "en-US";
const DEFAULT_CURRENCY = "USD";
const API_STORAGE_BASE_URL = process.env.NEXT_PUBLIC_STORAGE_URL || "http://localhost:8000/storage";
const ITEMS_PER_PAGE_OPTIONS = [10, 25, 50, 100];

interface StatusConfigItem {
    label: string;
    bg: string;
    border: string;
    text: string;
    dot: string;
}

const STATUS_CONFIG: Record<StockTransfer["status"], StatusConfigItem> = {
    pending: {
        label: "Pending",
        bg: "bg-amber-50",
        border: "border-amber-200",
        text: "text-amber-700",
        dot: "bg-amber-400",
    },
    approved: {
        label: "Approved",
        bg: "bg-emerald-50",
        border: "border-emerald-200",
        text: "text-emerald-700",
        dot: "bg-emerald-400",
    },
    suspended: {
        label: "Suspended",
        bg: "bg-red-50",
        border: "border-red-200",
        text: "text-red-700",
        dot: "bg-red-400",
    },
};

const STATUS_ICONS: Record<StockTransfer["status"], React.ElementType> = {
    pending: Clock,
    approved: CheckCircle2,
    suspended: XCircle,
};

// ==============================================
// Utility Functions
// ==============================================

const formatCurrency = (amount: number | string, symbol: string = "$"): string => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(num)) return `${symbol}0.00`;
    return new Intl.NumberFormat(CURRENCY_LOCALE, {
        style: "currency",
        currency: DEFAULT_CURRENCY,
        minimumFractionDigits: 2,
    }).format(num).replace(/^\$/, symbol);
};

const formatDate = (dateStr: string): string => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-US", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
};

const getImageUrl = (src: string | null): string =>
    src ? `${API_STORAGE_BASE_URL}/${src}` : "";

// ==============================================
// Sub-Components
// ==============================================

const StatusBadge: React.FC<{ status: StockTransfer["status"] }> = ({ status }) => {
    const config = STATUS_CONFIG[status];
    const Icon = STATUS_ICONS[status];
    return (
        <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${config.bg} ${config.border} ${config.text}`}
        >
            <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
            <Icon className="h-3 w-3" />
            {config.label}
        </span>
    );
};

interface StatCardProps {
    label: string;
    value: string | number;
    icon: React.ReactNode;
    iconBg: string;
    delay?: number;
    wide?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({
    label,
    value,
    icon,
    iconBg,
    delay = 0,
    wide = false,
}) => (
    <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay }}
        className={`bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex items-center gap-4 ${
            wide ? 'col-span-2' : ''
        }`}
    >
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
            {icon}
        </div>
        <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider">{label}</p>
            <p className="text-xl font-bold text-gray-900 mt-0.5">{value}</p>
        </div>
    </motion.div>
);

// ==============================================
// Main Component
// ==============================================

const TransfersPage = ({ user }: { user: User }) => {
    const router = useRouter();
    const params = useParams();
    const locationId = (params?.id as string) || "";
    const currencySymbol = user?.businesses_one?.[0]?.currency || "$";

    const [transfers, setTransfers] = useState<StockTransfer[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [dateFilter, setDateFilter] = useState<string>("all");
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(25);
    const [totalItems, setTotalItems] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [pageValue, setPageValue] = useState(0);
    const [totalValue, setTotalValue] = useState(0);
    const [locationName, setLocationName] = useState("");

    const fetchTransfers = useCallback(
        async (page = 1, itemsPerPage = 25, silent = false) => {
            if (!silent) setIsLoading(true);
            else setIsRefreshing(true);

            try {
                const endpoint = locationId
                    ? `/fetch_transfer_stock/${locationId}`
                    : "/fetch_transfer_stock";
                const response = await apiGet(endpoint, { page, per_page: itemsPerPage });
                const responseData = response?.data || response;

                let data: StockTransfer[] = [];

                if (responseData?.success) {
                    data = (responseData.data || []).map((t: any) => ({
                        ...t,
                        unit_cost: typeof t.unit_cost === 'string' ? parseFloat(t.unit_cost) : (t.unit_cost || 0),
                        total: typeof t.total === 'string' ? parseFloat(t.total) : (t.total || 0),
                    }));
                    setTransfers(data);
                    if (responseData.pagination) {
                        setCurrentPage(responseData.pagination.current_page || page);
                        setPerPage(responseData.pagination.per_page || itemsPerPage);
                        setTotalItems(responseData.pagination.total || data.length);
                        setTotalPages(responseData.pagination.total_pages || 1);
                    }
                    if (responseData.summary) {
                        setPageValue(responseData.summary.current_page_value || 0);
                        setTotalValue(responseData.summary.total_value || 0);
                    }
                    if (data.length > 0 && !locationName) {
                        setLocationName(
                            data[0].from_location?.location_name ||
                                data[0].to_location?.location_name ||
                                ""
                        );
                    }
                } else {
                    data = (Array.isArray(responseData) ? responseData : responseData?.data || []).map(
                        (t: any) => ({
                            ...t,
                            unit_cost: typeof t.unit_cost === 'string' ? parseFloat(t.unit_cost) : (t.unit_cost || 0),
                            total: typeof t.total === 'string' ? parseFloat(t.total) : (t.total || 0),
                        })
                    );
                    setTransfers(data);
                    setTotalItems(data.length);
                    setTotalPages(Math.ceil(data.length / itemsPerPage));
                    const tv = data.reduce((sum: number, t: StockTransfer) => sum + (t.total || 0), 0);
                    setPageValue(tv);
                    setTotalValue(tv);
                    if (data.length > 0 && !locationName) {
                        setLocationName(
                            data[0].from_location?.location_name ||
                                data[0].to_location?.location_name ||
                                ""
                        );
                    }
                }
            } catch (error: any) {
                toast.error(
                    error?.response?.data?.message || error?.message || "Failed to load transfers"
                );
            } finally {
                setIsLoading(false);
                setIsRefreshing(false);
            }
        },
        [locationId, locationName]
    );

    useEffect(() => {
        fetchTransfers(1, 25);
    }, [fetchTransfers]);

    const stats = useMemo(
        () => ({
            total: totalItems,
            pending: transfers.filter((t) => t.status === "pending").length,
            approved: transfers.filter((t) => t.status === "approved").length,
            suspended: transfers.filter((t) => t.status === "suspended").length,
            total_value: totalValue,
        }),
        [transfers, totalItems, totalValue]
    );

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
        if (statusFilter !== "all") result = result.filter((t) => t.status === statusFilter);
        if (dateFilter !== "all") {
            const cutoffs: Record<string, Date> = {
                today: new Date(new Date().setHours(0, 0, 0, 0)),
                week: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                month: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            };
            const cutoff = cutoffs[dateFilter];
            if (cutoff) result = result.filter((t) => new Date(t.transfer_date) >= cutoff);
        }
        return result;
    }, [transfers, searchQuery, statusFilter, dateFilter]);

    const isFiltered = searchQuery.trim() !== "" || statusFilter !== "all" || dateFilter !== "all";
    const serialOffset = (currentPage - 1) * perPage;

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-gray-900 mx-auto mb-4" />
                    <p className="text-gray-500">Loading transfers...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white border-b border-gray-200 top-0 z-30 mt-[-13px] w-full">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => router.back()}
                                className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all"
                            >
                                <ArrowLeft className="h-5 w-5" />
                            </button>
                            <div>
                                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                                    Stock Transfers
                                </h1>
                                <p className="text-sm text-gray-500">
                                    {locationId && locationName
                                        ? `Location: ${locationName} • `
                                        : ""}
                                    {stats.total} transfer{stats.total !== 1 ? "s" : ""} total
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => fetchTransfers(currentPage, perPage, true)}
                                disabled={isRefreshing}
                                className="p-2.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all disabled:opacity-50"
                            >
                                <RefreshCw
                                    className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
                                />
                            </button>
                            <Link
                                href={`/locationproducts/${locationId}`}
                                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-800 transition-all shadow-lg shadow-gray-900/20"
                            >
                                <Plus className="h-4 w-4" />
                                New Transfer
                            </Link>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
                {/* Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                    <StatCard
                        label="Total"
                        value={stats.total}
                        icon={<ArrowRightLeft className="h-5 w-5 text-gray-700" />}
                        iconBg="bg-gray-100"
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
                        label="Approved"
                        value={stats.approved}
                        icon={<CheckCircle2 className="h-5 w-5 text-emerald-600" />}
                        iconBg="bg-emerald-50"
                        delay={0.08}
                    />
                    <StatCard
                        label="Suspended"
                        value={stats.suspended}
                        icon={<XCircle className="h-5 w-5 text-red-500" />}
                        iconBg="bg-red-50"
                        delay={0.12}
                    />
                    <StatCard
                        label="Total Value"
                        value={formatCurrency(stats.total_value, currencySymbol)}
                        icon={<TrendingUp className="h-5 w-5 text-purple-600" />}
                        iconBg="bg-purple-50"
                        delay={0.16}
                        wide
                    />
                </div>

                {/* Filters */}
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
                                placeholder="Search transfers..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900/20 focus:border-gray-900 outline-none text-sm transition-all"
                            />
                        </div>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="pl-4 pr-9 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900/20 focus:border-gray-900 outline-none text-sm bg-white transition-all appearance-none"
                        >
                            <option value="all">All Statuses</option>
                            <option value="pending">Pending</option>
                            <option value="approved">Approved</option>
                            <option value="suspended">Suspended</option>
                        </select>
                        <select
                            value={dateFilter}
                            onChange={(e) => setDateFilter(e.target.value)}
                            className="pl-4 pr-9 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900/20 focus:border-gray-900 outline-none text-sm bg-white transition-all appearance-none"
                        >
                            <option value="all">All Time</option>
                            <option value="today">Today</option>
                            <option value="week">Last 7 Days</option>
                            <option value="month">Last 30 Days</option>
                        </select>
                        {isFiltered && (
                            <button
                                onClick={() => {
                                    setSearchQuery("");
                                    setStatusFilter("all");
                                    setDateFilter("all");
                                }}
                                className="px-4 py-2.5 text-sm font-medium text-red-600 bg-red-50 border-2 border-red-200 rounded-xl hover:bg-red-100 transition-all whitespace-nowrap"
                            >
                                Clear
                            </button>
                        )}
                    </div>
                </motion.div>

                {/* Table */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden"
                >
                    {filteredTransfers.length === 0 ? (
                        <div className="text-center py-16">
                            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-500">
                                {isFiltered ? "No transfers match your filters" : "No transfers yet"}
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="bg-gray-50 border-b border-gray-200">
                                            <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-16">
                                                SN
                                            </th>
                                            <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                                Product
                                            </th>
                                            <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                                Route
                                            </th>
                                            <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                                Qty
                                            </th>
                                            <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                                Value
                                            </th>
                                            <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                                Date
                                            </th>
                                            <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                                Ref
                                            </th>
                                            <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                                Status
                                            </th>
                                            <th className="px-6 py-3.5 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider w-12" />
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {filteredTransfers.map((transfer, index) => (
                                            <tr
                                                key={transfer.id}
                                                onClick={() =>
                                                    router.push(
                                                        locationId
                                                            ? `/approvetransfers/${transfer.id}/${locationId}`
                                                            : `/approvetransfers/${transfer.id}`
                                                    )
                                                }
                                                className="hover:bg-gray-50 cursor-pointer transition-colors"
                                            >
                                                <td className="px-6 py-4 text-sm text-gray-500">
                                                    {serialOffset + index + 1}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                                                            {transfer.product?.image ? (
                                                                <img
                                                                    src={getImageUrl(transfer.product.image)}
                                                                    alt=""
                                                                    className="w-full h-full object-cover"
                                                                    onError={(e) => {
                                                                        (e.target as HTMLImageElement).style.display = "none";
                                                                    }}
                                                                />
                                                            ) : (
                                                                <Package className="h-4 w-4 text-gray-500" />
                                                            )}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-semibold text-gray-900">
                                                                {transfer.product?.name || "—"}
                                                            </p>
                                                            <p className="text-xs text-gray-400">
                                                                {transfer.product?.sku || "—"}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2 text-sm">
                                                        <span className="text-gray-700 truncate max-w-[100px]">
                                                            {transfer.from_location?.location_name || "—"}
                                                        </span>
                                                        <ArrowRightLeft className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                                                        <span className="text-gray-700 truncate max-w-[100px]">
                                                            {transfer.to_location?.location_name || "—"}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-sm font-bold text-gray-900">
                                                    {transfer.stock_quantity}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <p className="text-sm font-bold text-gray-900">
                                                        {formatCurrency(transfer.total, currencySymbol)}
                                                    </p>
                                                    <p className="text-xs text-gray-400">
                                                        @ {formatCurrency(transfer.unit_cost, currencySymbol)}
                                                    </p>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-700">
                                                    {formatDate(transfer.transfer_date)}
                                                </td>
                                                <td className="px-6 py-4">
                                                    {transfer.reference_number ? (
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 rounded-md text-xs font-mono text-gray-600">
                                                            <Hash className="h-3 w-3" />
                                                            {transfer.reference_number}
                                                        </span>
                                                    ) : (
                                                        <span className="text-gray-400">—</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <StatusBadge status={transfer.status} />
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            router.push(
                                                                locationId
                                                                    ? `/approvetransfers/${transfer.id}/${locationId}`
                                                                    : `/approvetransfers/${transfer.id}`
                                                            );
                                                        }}
                                                        className="inline-flex items-center gap-1 px-3 py-1.5 border border-gray-200 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-900 hover:text-white hover:border-gray-900 transition-all"
                                                    >
                                                        <Eye className="h-3.5 w-3.5" />
                                                        View
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            {/* Pagination */}
                            {totalItems > 0 && (
                                <div className="px-6 py-3.5 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-gray-500">Rows:</span>
                                        <select
                                            value={perPage}
                                            onChange={(e) => {
                                                setPerPage(Number(e.target.value));
                                                fetchTransfers(1, Number(e.target.value), true);
                                            }}
                                            className="pl-2 pr-8 py-1 border border-gray-300 rounded-lg text-xs font-medium text-gray-700 bg-white outline-none cursor-pointer"
                                        >
                                            {ITEMS_PER_PAGE_OPTIONS.map((o) => (
                                                <option key={o} value={o}>
                                                    {o}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="flex items-center gap-3 text-xs">
                                        <span className="text-gray-500">
                                            Page: <b className="text-gray-700">{formatCurrency(pageValue, currencySymbol)}</b>
                                        </span>
                                        <span className="text-gray-500">
                                            Total: <b className="text-gray-900">{formatCurrency(totalValue, currencySymbol)}</b>
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs text-gray-500">
                                            {(currentPage - 1) * perPage + 1}-
                                            {Math.min(currentPage * perPage, totalItems)} of {totalItems}
                                        </span>
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={() => fetchTransfers(1, perPage, true)}
                                                disabled={currentPage === 1}
                                                className="p-1.5 text-gray-400 hover:text-gray-700 disabled:opacity-30"
                                            >
                                                <ChevronsLeft className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => fetchTransfers(currentPage - 1, perPage, true)}
                                                disabled={currentPage === 1}
                                                className="p-1.5 text-gray-400 hover:text-gray-700 disabled:opacity-30"
                                            >
                                                <ChevronLeft className="h-4 w-4" />
                                            </button>
                                            <span className="px-2 text-xs font-semibold text-gray-700">
                                                {currentPage} / {totalPages}
                                            </span>
                                            <button
                                                onClick={() => fetchTransfers(currentPage + 1, perPage, true)}
                                                disabled={currentPage >= totalPages}
                                                className="p-1.5 text-gray-400 hover:text-gray-700 disabled:opacity-30"
                                            >
                                                <ChevronRight className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => fetchTransfers(totalPages, perPage, true)}
                                                disabled={currentPage >= totalPages}
                                                className="p-1.5 text-gray-400 hover:text-gray-700 disabled:opacity-30"
                                            >
                                                <ChevronsRight className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </motion.div>
            </main>
        </div>
    );
};

export default withAuth(TransfersPage);