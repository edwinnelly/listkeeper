"use client";

import { withAuth } from "@/hoc/withAuth";
import { apiGet, apiPost } from "@/lib/axios";
import React, { useState, useEffect, useCallback } from "react";
import {
    ArrowLeft,
    Loader2,
    Package,
    ArrowRightLeft,
    CheckCircle2,
    XCircle,
    Clock,
    AlertTriangle,
    Hash,
    Calendar,
    MapPin,
    Info,
    TrendingDown,
    TrendingUp,
    Shield,
    Ban,
    Truck,
    FileText,
    BarChart3,
    Building,
    ShoppingBag,
    CreditCard,
    User,
    ChevronRight,
    RefreshCw,
    AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { toast } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

// ==============================================
// Type Definitions
// ==============================================

interface TransferDetails {
    transfer: {
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
        status: string;
        business_key: string;
        postby: string | null;
        created_at: string;
        updated_at: string;
        from_location: {
            id: string;
            location_name: string;
            city: string;
            head_office: string;
            address?: string;
            phone?: string;
        };
        to_location: {
            id: string;
            location_name: string;
            city: string;
            head_office: string;
            address?: string;
            phone?: string;
        };
        product: {
            id: string;
            name: string;
            sku: string;
            image: string | null;
            barcode?: string;
            description?: string;
            category?: string;
            unit?: string;
        };
    };
    current_stock: number;
    stock_after_transfer: number;
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

const API_STORAGE_BASE_URL =
    process.env.NEXT_PUBLIC_STORAGE_URL || "http://localhost:8000/storage";

// ==============================================
// Utility Functions
// ==============================================

const formatCurrency = (amount: number, symbol: string = "$"): string => {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
    }).format(amount).replace(/^\$/, symbol);
};

const formatDate = (dateStr: string): string => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-US", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
};

const formatDateTime = (dateStr: string): string => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-US", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
};

const getImageUrl = (src: string | null): string => {
    if (!src) return "";
    return `${API_STORAGE_BASE_URL}/${src}`;
};

// ==============================================
// Sub-Components
// ==============================================

/** Status Pill Badge */
const StatusPill: React.FC<{ status: string }> = ({ status }) => {
    const config = {
        pending: { label: "Pending", icon: Clock },
        approved: { label: "Approved", icon: CheckCircle2 },
        in_transit: { label: "In Transit", icon: Truck },
        completed: { label: "Completed", icon: CheckCircle2 },
        suspended: { label: "Suspended", icon: XCircle },
        rejected: { label: "Rejected", icon: Ban },
    }[status] || { label: status, icon: Info };

    const Icon = config.icon;

    return (
        <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border border-gray-300 bg-white text-gray-700">
            <Icon className="h-3.5 w-3.5" />
            {config.label}
        </span>
    );
};

/** Info Row Component */
const InfoRow: React.FC<{
    label: string;
    value: string;
    icon?: React.ReactNode;
}> = ({ label, value, icon }) => (
    <div className="flex items-center justify-between py-2.5 px-4 rounded-lg hover:bg-gray-50 transition-colors group">
        <span className="text-sm text-gray-500 flex items-center gap-2">
            {icon && <span className="text-gray-400 group-hover:text-gray-600 transition-colors">{icon}</span>}
            {label}
        </span>
        <span className="text-sm font-semibold text-gray-900 text-right">{value}</span>
    </div>
);

/** Stock Card Component */
const StockCard: React.FC<{
    label: string;
    value: number;
    unit: string;
    subtitle?: string;
    icon: React.ReactNode;
}> = ({ label, value, unit, subtitle, icon }) => (
    <div className="p-5 rounded-xl border-2 border-gray-200 bg-white hover:border-gray-300 transition-all">
        <div className="flex items-center gap-2 mb-3">
            <span className="text-gray-700">{icon}</span>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                {label}
            </p>
        </div>
        <p className="text-3xl font-black text-gray-900 mb-1">
            {value.toLocaleString()}
        </p>
        <p className="text-sm text-gray-500">
            {unit}
            {subtitle && (
                <span className="text-xs ml-2 text-gray-400">• {subtitle}</span>
            )}
        </p>
    </div>
);

// ==============================================
// Main Component
// ==============================================

const ApproveTransferPage = ({ user }: { user: User }) => {
    const router = useRouter();
    const params = useParams();
    const transferId = params?.id as string;
    const currencySymbol = user?.businesses_one?.[0]?.currency || "$";

    // State
    const [transferData, setTransferData] = useState<TransferDetails | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const [rejectionNotes, setRejectionNotes] = useState("");
    const [showRejectForm, setShowRejectForm] = useState(false);
    const [approvedQuantity, setApprovedQuantity] = useState<number>(0);
    const [selectedAction, setSelectedAction] = useState<string>("");

    // Fetch transfer details
    const fetchTransferDetails = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await apiGet(`/show_transfer_for_approval/${transferId}`, {}, false);
            const responseData = response?.data || response;
            
            if (responseData?.success) {
                setTransferData(responseData.data);
                setApprovedQuantity(responseData.data.transfer.stock_quantity);
            } else {
                toast.error("Failed to load transfer details");
            }
        } catch (error: any) {
            const message = error?.response?.data?.message || "Failed to load transfer";
            toast.error(message);
        } finally {
            setIsLoading(false);
        }
    }, [transferId]);

    useEffect(() => {
        if (transferId) {
            fetchTransferDetails();
        }
    }, [transferId, fetchTransferDetails]);

    // Handle approval
    const handleApprove = async (status: string) => {
        if (status === 'rejected' && !rejectionNotes.trim()) {
            toast.error("Please provide a reason for rejection");
            return;
        }

        setSelectedAction(status);
        setIsProcessing(true);
        try {
            const payload: any = {
                status: status,
            };

            if (status === 'rejected') {
                payload.notes = rejectionNotes;
            }

            if (approvedQuantity !== transferData?.transfer.stock_quantity) {
                payload.approved_quantity = approvedQuantity;
            }

            const response = await apiPost(`/approve_transfer/${transferId}`, payload);
            const responseData = response?.data || response;

            if (responseData?.success) {
                const successMessages: Record<string, string> = {
                    approved: 'Transfer approved successfully',
                    in_transit: 'Transfer marked as in transit',
                    rejected: 'Transfer rejected successfully',
                    suspended: 'Transfer suspended successfully',
                };
                toast.success(successMessages[status] || 'Transfer processed successfully');
                
                setTimeout(() => {
                    router.push("/fetch_transfer_stock");
                }, 1000);
            } else {
                toast.error(responseData?.message || "Failed to process transfer");
            }
        } catch (error: any) {
            const message = error?.response?.data?.message || "Failed to process transfer";
            toast.error(message);
        } finally {
            setIsProcessing(false);
            setSelectedAction("");
        }
    };

    // Loading state
    if (isLoading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center"
                >
                    <Loader2 className="h-12 w-12 animate-spin text-black mx-auto mb-6" />
                    <p className="text-gray-900 font-medium text-lg">Loading transfer details...</p>
                    <p className="text-gray-500 text-sm mt-1">Please wait while we fetch the information</p>
                </motion.div>
            </div>
        );
    }

    // No data state
    if (!transferData) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center bg-white p-12 rounded-3xl shadow-lg border border-gray-200 max-w-md"
                >
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <AlertCircle className="h-10 w-10 text-gray-900" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-3">Transfer Not Found</h2>
                    <p className="text-gray-500 mb-8">
                        The transfer you're looking for doesn't exist or has been removed.
                    </p>
                    <div className="flex flex-col gap-3">
                        <button
                            onClick={() => router.push("/fetch_transfer_stock")}
                            className="w-full px-6 py-3 bg-black text-white font-semibold rounded-xl hover:bg-gray-800 transition-all"
                        >
                            View All Transfers
                        </button>
                        <button
                            onClick={() => fetchTransferDetails()}
                            className="w-full px-6 py-3 text-gray-700 bg-gray-100 font-semibold rounded-xl hover:bg-gray-200 transition-all"
                        >
                            <RefreshCw className="h-4 w-4 inline mr-2" />
                            Try Again
                        </button>
                    </div>
                </motion.div>
            </div>
        );
    }

    const { transfer, current_stock, stock_after_transfer } = transferData;
    const isPending = transfer.status === "pending";
    const stockInsufficient = current_stock < approvedQuantity;
    const stockPercentage = current_stock > 0 ? ((current_stock - approvedQuantity) / current_stock) * 100 : 0;

    return (
        <div className="min-h-screen bg-white">
            {/* Header */}
           <header className="bg-white border-b border-gray-200 top-0 z-30 mt-[-13px] w-full">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => router.back()}
                                className="p-2.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all"
                                aria-label="Go back"
                            >
                                <ArrowLeft className="h-5 w-5" />
                            </motion.button>
                            <div>
                                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-3">
                                    {isPending ? "Approve Transfer" : "Transfer Details"}
                                    <StatusPill status={transfer.status} />
                                </h1>
                                <p className="text-sm text-gray-500 mt-0.5">
                                    Review and process stock transfer request
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column - Main Info */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Product & Transfer Details Card */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white rounded-3xl border-2 border-gray-200 shadow-sm overflow-hidden"
                        >
                            {/* Card Header */}
                            <div className="border-b border-gray-200 px-6 py-4 bg-gray-50">
                                <div className="flex items-center gap-3 text-gray-900">
                                    <ShoppingBag className="h-5 w-5" />
                                    <h2 className="text-lg font-bold">Transfer Overview</h2>
                                </div>
                            </div>

                            <div className="p-6">
                                {/* Product Section */}
                                <div className="flex items-start gap-5 mb-8 p-5 bg-gray-50 rounded-2xl border border-gray-200">
                                    <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center flex-shrink-0 overflow-hidden shadow-sm border border-gray-200">
                                        {transfer.product.image ? (
                                            <img
                                                src={getImageUrl(transfer.product.image)}
                                                alt={transfer.product.name}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <Package className="h-10 w-10 text-gray-900" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-xl text-gray-900 mb-2">
                                            {transfer.product.name}
                                        </h3>
                                        <div className="flex flex-wrap gap-2">
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-700">
                                                <Hash className="h-3 w-3" />
                                                SKU: {transfer.product.sku}
                                            </span>
                                            {transfer.product.barcode && (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-700">
                                                    <FileText className="h-3 w-3" />
                                                    {transfer.product.barcode}
                                                </span>
                                            )}
                                        </div>
                                        {transfer.product.description && (
                                            <p className="text-sm text-gray-500 mt-3 line-clamp-2">
                                                {transfer.product.description}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Transfer Details Grid */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200 space-y-2">
                                        <InfoRow
                                            label="Reference Number"
                                            value={transfer.reference_number || "—"}
                                            icon={<FileText className="h-4 w-4" />}
                                        />
                                        <InfoRow
                                            label="Transfer Date"
                                            value={formatDate(transfer.transfer_date)}
                                            icon={<Calendar className="h-4 w-4" />}
                                        />
                                        <InfoRow
                                            label="Expected Delivery"
                                            value={transfer.expected_delivery_date ? formatDate(transfer.expected_delivery_date) : "—"}
                                            icon={<Truck className="h-4 w-4" />}
                                        />
                                    </div>
                                    <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200 space-y-2">
                                        <InfoRow
                                            label="Requested By"
                                            value={transfer.postby || "—"}
                                            icon={<User className="h-4 w-4" />}
                                        />
                                        <InfoRow
                                            label="Unit Cost"
                                            value={formatCurrency(transfer.unit_cost, currencySymbol)}
                                            icon={<CreditCard className="h-4 w-4" />}
                                        />
                                        <InfoRow
                                            label="Total Value"
                                            value={formatCurrency(transfer.total, currencySymbol)}
                                            icon={<BarChart3 className="h-4 w-4" />}
                                        />
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        {/* Route Card */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="bg-white rounded-3xl border-2 border-gray-200 shadow-sm overflow-hidden"
                        >
                            <div className="border-b border-gray-200 px-6 py-4 bg-gray-50">
                                <div className="flex items-center gap-3 text-gray-900">
                                    <MapPin className="h-5 w-5" />
                                    <h2 className="text-lg font-bold">Transfer Route</h2>
                                </div>
                            </div>

                            <div className="p-6">
                                <div className="flex flex-col md:flex-row items-stretch gap-4">
                                    {/* From Location */}
                                    <div className="flex-1">
                                        <div className="h-full p-5 bg-white rounded-2xl border-2 border-gray-200 hover:border-gray-300 transition-all">
                                            <div className="flex items-center gap-2 mb-3">
                                                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                                                    <TrendingDown className="h-4 w-4 text-gray-700" />
                                                </div>
                                                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                                                    Source Location
                                                </span>
                                            </div>
                                            <h4 className="font-bold text-gray-900 text-lg mb-1">
                                                {transfer.from_location.location_name}
                                            </h4>
                                            <p className="text-sm text-gray-600">
                                                {transfer.from_location.city}
                                                {transfer.from_location.head_office && `, ${transfer.from_location.head_office}`}
                                            </p>
                                            {transfer.from_location.address && (
                                                <div className="mt-3 pt-3 border-t border-gray-200">
                                                    <p className="text-xs text-gray-500 flex items-start gap-1">
                                                        <Building className="h-3 w-3 mt-0.5 flex-shrink-0" />
                                                        {transfer.from_location.address}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Arrow with Quantity */}
                                    <div className="flex md:flex-col items-center justify-center gap-3 py-4 md:py-0">
                                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                                            <ArrowRightLeft className="h-5 w-5 text-gray-700" />
                                        </div>
                                        <div className="bg-black text-white px-4 py-2 rounded-xl text-sm font-bold text-center">
                                            {approvedQuantity} {transfer.product.unit || "units"}
                                        </div>
                                    </div>

                                    {/* To Location */}
                                    <div className="flex-1">
                                        <div className="h-full p-5 bg-white rounded-2xl border-2 border-gray-200 hover:border-gray-300 transition-all">
                                            <div className="flex items-center gap-2 mb-3">
                                                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                                                    <TrendingUp className="h-4 w-4 text-gray-700" />
                                                </div>
                                                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                                                    Destination
                                                </span>
                                            </div>
                                            <h4 className="font-bold text-gray-900 text-lg mb-1">
                                                {transfer.to_location.location_name}
                                            </h4>
                                            <p className="text-sm text-gray-600">
                                                {transfer.to_location.city}
                                                {transfer.to_location.head_office && `, ${transfer.to_location.head_office}`}
                                            </p>
                                            {transfer.to_location.address && (
                                                <div className="mt-3 pt-3 border-t border-gray-200">
                                                    <p className="text-xs text-gray-500 flex items-start gap-1">
                                                        <Building className="h-3 w-3 mt-0.5 flex-shrink-0" />
                                                        {transfer.to_location.address}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {/* Right Column - Stock Impact & Actions */}
                    <div className="space-y-6">
                        {/* Stock Impact Analysis */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="bg-white rounded-3xl border-2 border-gray-200 shadow-sm overflow-hidden sticky top-24"
                        >
                            <div className="border-b border-gray-200 px-6 py-4 bg-gray-50">
                                <div className="flex items-center gap-3 text-gray-900">
                                    <BarChart3 className="h-5 w-5" />
                                    <h2 className="text-lg font-bold">Stock Impact</h2>
                                </div>
                            </div>

                            <div className="p-6 space-y-4">
                                <StockCard
                                    label="Current Stock"
                                    value={current_stock}
                                    unit={transfer.product.unit || "units"}
                                    subtitle="Available at source"
                                    icon={<Package className="h-4 w-4" />}
                                />
                                <StockCard
                                    label="Transfer Quantity"
                                    value={approvedQuantity}
                                    unit={transfer.product.unit || "units"}
                                    subtitle={`Value: ${formatCurrency(approvedQuantity * transfer.unit_cost, currencySymbol)}`}
                                    icon={<ArrowRightLeft className="h-4 w-4" />}
                                />
                                <StockCard
                                    label="After Transfer"
                                    value={stock_after_transfer}
                                    unit={transfer.product.unit || "units"}
                                    subtitle={stockInsufficient ? "⚠️ Insufficient stock!" : "Remaining at source"}
                                    icon={stockInsufficient ? <AlertTriangle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                                />

                                {/* Stock Progress Bar */}
                                <div className="mt-4 p-4 bg-gray-50 rounded-2xl border border-gray-200">
                                    <div className="flex justify-between text-xs font-semibold text-gray-600 mb-2">
                                        <span>Stock Usage</span>
                                        <span>{Math.round(100 - stockPercentage)}% used</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${Math.min(100, 100 - stockPercentage)}%` }}
                                            transition={{ duration: 1, delay: 0.5 }}
                                            className="h-full rounded-full bg-black"
                                        />
                                    </div>
                                </div>

                                {/* Quantity Adjustment */}
                                {isPending && (
                                    <div className="p-5 bg-gray-50 rounded-2xl border-2 border-gray-200">
                                        <label className="block text-sm font-bold text-gray-900 mb-3">
                                            Adjust Approved Quantity
                                        </label>
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="number"
                                                value={approvedQuantity}
                                                onChange={(e) => setApprovedQuantity(Math.max(0, Math.min(transfer.stock_quantity, parseInt(e.target.value) || 0)))}
                                                max={transfer.stock_quantity}
                                                min={0}
                                                className="w-28 px-4 py-2.5 border-2 border-gray-300 rounded-xl text-sm font-bold focus:ring-2 focus:ring-black/20 focus:border-black outline-none bg-white"
                                            />
                                            <span className="text-sm text-gray-600">
                                                of {transfer.stock_quantity} requested
                                            </span>
                                        </div>
                                        {approvedQuantity !== transfer.stock_quantity && (
                                            <button
                                                onClick={() => setApprovedQuantity(transfer.stock_quantity)}
                                                className="text-xs text-black hover:underline mt-2 font-medium"
                                            >
                                                Reset to requested amount
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </motion.div>

                        {/* Notes Card */}
                        {transfer.notes && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className="bg-white rounded-3xl border-2 border-gray-200 shadow-sm overflow-hidden"
                            >
                                <div className="p-6">
                                    <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                        <FileText className="h-5 w-5" />
                                        Notes & Comments
                                    </h3>
                                    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200">
                                        <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                                            {transfer.notes}
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </div>
                </div>

                {/* Rejection Form */}
                <AnimatePresence>
                    {showRejectForm && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="bg-white rounded-3xl border-2 border-gray-300 shadow-lg overflow-hidden"
                        >
                            <div className="border-b border-gray-200 px-6 py-4 bg-gray-50">
                                <div className="flex items-center gap-3 text-gray-900">
                                    <Ban className="h-5 w-5" />
                                    <h2 className="text-lg font-bold">Rejection Reason</h2>
                                </div>
                            </div>
                            <div className="p-6">
                                <textarea
                                    value={rejectionNotes}
                                    onChange={(e) => setRejectionNotes(e.target.value)}
                                    placeholder="Please provide a detailed reason for rejecting this transfer request..."
                                    rows={4}
                                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-black/20 focus:border-black outline-none text-sm resize-none"
                                />
                                <div className="flex items-center gap-3 mt-4">
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => handleApprove('rejected')}
                                        disabled={isProcessing || !rejectionNotes.trim()}
                                        className="px-6 py-3 bg-black text-white font-semibold rounded-xl hover:bg-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isProcessing && selectedAction === 'rejected' ? (
                                            <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
                                        ) : (
                                            <Ban className="h-4 w-4 inline mr-2" />
                                        )}
                                        Confirm Rejection
                                    </motion.button>
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => {
                                            setShowRejectForm(false);
                                            setRejectionNotes("");
                                        }}
                                        className="px-6 py-3 text-gray-700 bg-gray-100 font-semibold rounded-xl hover:bg-gray-200 transition-all"
                                    >
                                        Cancel
                                    </motion.button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Action Buttons */}
                {isPending && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="bg-white rounded-3xl border-2 border-gray-200 shadow-sm p-6"
                    >
                        <div className="flex flex-col sm:flex-row items-center gap-4">
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => handleApprove('in_transit')}
                                disabled={isProcessing || stockInsufficient}
                                className="w-full sm:w-auto flex-1 inline-flex items-center justify-center gap-3 px-6 py-4 bg-black text-white font-bold rounded-2xl hover:bg-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isProcessing && selectedAction === 'in_transit' ? (
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                ) : (
                                    <Truck className="h-5 w-5" />
                                )}
                                Approve & Mark In Transit
                                <ChevronRight className="h-5 w-5" />
                            </motion.button>
                            
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => handleApprove('approved')}
                                disabled={isProcessing || stockInsufficient}
                                className="w-full sm:w-auto flex-1 inline-flex items-center justify-center gap-3 px-6 py-4 bg-black text-white font-bold rounded-2xl hover:bg-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isProcessing && selectedAction === 'approved' ? (
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                ) : (
                                    <CheckCircle2 className="h-5 w-5" />
                                )}
                                Complete Transfer
                                <ChevronRight className="h-5 w-5" />
                            </motion.button>
                            
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setShowRejectForm(true)}
                                disabled={isProcessing}
                                className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-6 py-4 text-gray-700 bg-white border-2 border-gray-200 font-bold rounded-2xl hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <XCircle className="h-5 w-5" />
                                Reject Transfer
                            </motion.button>
                        </div>
                        
                        {stockInsufficient && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="mt-4 p-4 bg-gray-50 rounded-2xl border-2 border-gray-300 flex items-start gap-3"
                            >
                                <AlertTriangle className="h-5 w-5 text-gray-900 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-sm font-bold text-gray-900">Insufficient Stock Warning</p>
                                    <p className="text-sm text-gray-600 mt-1">
                                        The source location has {current_stock} units, but the transfer requires {approvedQuantity} units. 
                                        Please adjust the quantity or reject this transfer.
                                    </p>
                                </div>
                            </motion.div>
                        )}
                    </motion.div>
                )}

                {/* Back Button for non-pending transfers */}
                {!isPending && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex justify-center"
                    >
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => router.push("/fetch_transfer_stock")}
                            className="inline-flex items-center gap-2 px-8 py-4 text-gray-700 bg-white border-2 border-gray-200 font-bold rounded-2xl hover:bg-gray-50 hover:border-gray-300 transition-all"
                        >
                            <ArrowLeft className="h-5 w-5" />
                            Back to Transfers
                        </motion.button>
                    </motion.div>
                )}
            </main>
        </div>
    );
};

export default withAuth(ApproveTransferPage);