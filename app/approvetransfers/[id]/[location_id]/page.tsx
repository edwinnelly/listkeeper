"use client";
import { withAuth } from "@/hoc/withAuth";
import { apiGet, apiPost, API_CONFIG } from "@/lib/axios";
import React, { useState, useEffect, useCallback, useMemo } from "react";
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
    FileText,
    BarChart3,
    Building,
    ShoppingBag,
    CreditCard,
    User,
    RefreshCw,
    AlertCircle,
    MessageSquare,
    ChevronDown,
    Scale,
    ArrowDown,
    ClipboardCheck,
} from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

// ==============================================
// Type Definitions
// ==============================================

interface Location {
    id: string;
    location_name: string;
    city: string;
    head_office: string;
    address?: string;
    phone?: string;
}

interface Product {
    id: string;
    name: string;
    sku: string;
    image: string | null;
    barcode?: string;
    description?: string;
    category?: string;
    unit?: string;
}

interface Transfer {
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
    from_location: Location;
    to_location: Location;
    product: Product;
}

interface TransferDetails {
    transfer: Transfer;
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
    try {
        return new Date(dateStr).toLocaleDateString("en-US", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    } catch {
        return "—";
    }
};

const getImageUrl = (src: string | null): string => {
    if (!src) return "";
    return `${API_CONFIG.STORAGE_URL}/${src}`;
};

// ==============================================
// Sub-Components
// ==============================================

interface StatusPillProps {
    status: string;
}

const StatusPill: React.FC<StatusPillProps> = ({ status }) => {
    const config: Record<string, { label: string; icon: React.ElementType; className: string }> = {
        pending: {
            label: "Pending",
            icon: Clock,
            className: "bg-amber-50 text-amber-700 border-amber-200"
        },
        approved: {
            label: "Approved",
            icon: CheckCircle2,
            className: "bg-emerald-50 text-emerald-700 border-emerald-200"
        },
        in_transit: {
            label: "In Transit",
            icon: ArrowRightLeft,
            className: "bg-blue-50 text-blue-700 border-blue-200"
        },
        completed: {
            label: "Completed",
            icon: CheckCircle2,
            className: "bg-emerald-50 text-emerald-700 border-emerald-200"
        },
        suspended: {
            label: "Suspended",
            icon: XCircle,
            className: "bg-red-50 text-red-700 border-red-200"
        },
        rejected: {
            label: "Rejected",
            icon: Ban,
            className: "bg-red-50 text-red-700 border-red-200"
        },
    };

    const statusConfig = config[status] || {
        label: status,
        icon: Info,
        className: "bg-gray-50 text-gray-700 border-gray-200"
    };

    const Icon = statusConfig.icon;

    return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${statusConfig.className}`}>
            <Icon className="h-3.5 w-3.5" />
            {statusConfig.label}
        </span>
    );
};

interface InfoRowProps {
    label: string;
    value: string;
    icon?: React.ReactNode;
    className?: string;
}

const InfoRow: React.FC<InfoRowProps> = ({ label, value, icon, className }) => (
    <div className={`flex items-center justify-between py-3 px-4 rounded-xl hover:bg-gray-50/80 transition-all duration-200 group ${className || ''}`}>
        <span className="text-sm text-gray-500 flex items-center gap-2.5">
            {icon && <span className="text-gray-400 group-hover:text-gray-600 transition-colors">{icon}</span>}
            {label}
        </span>
        <span className="text-sm font-semibold text-gray-900 text-right ml-4">{value || "—"}</span>
    </div>
);

interface StockCardProps {
    label: string;
    value: number;
    unit: string;
    subtitle?: string;
    icon: React.ReactNode;
    variant?: 'default' | 'warning' | 'success';
}

const StockCard: React.FC<StockCardProps> = ({ label, value, unit, subtitle, icon, variant = 'default' }) => {
    const variants = {
        default: "bg-white border-gray-200",
        warning: "bg-amber-50/50 border-amber-200",
        success: "bg-emerald-50/50 border-emerald-200",
    };

    return (
        <div className={`p-5 rounded-2xl border-2 ${variants[variant]} transition-all duration-200 hover:shadow-md`}>
            <div className="flex items-center gap-2.5 mb-3">
                <div className="p-2 bg-white rounded-lg shadow-sm">
                    <span className="text-gray-700">{icon}</span>
                </div>
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                    {label}
                </p>
            </div>
            <p className="text-3xl font-black text-gray-900 mb-1.5">
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
};

// ==============================================
// Main Component
// ==============================================

const ApproveTransferPage: React.FC<{ user: User }> = ({ user }) => {
    const router = useRouter();
    const params = useParams();
    const transferId = params?.id as string;
    const location_id = params?.location_id as string;
    const currencySymbol = user?.businesses_one?.[0]?.currency || "$";

    // Dynamic TRANSFERS_LIST_URL based on transfer data
    const TRANSFERS_LIST_URL = useMemo(() => {
        return `/locationproducts/${location_id}`;
    }, [location_id]);

    const goBack = useCallback(async () => {
        if (window.history.length > 1 && document.referrer) {
            router.back();
        } else {
            router.push(TRANSFERS_LIST_URL);
        }
    }, [router, TRANSFERS_LIST_URL]);

    const [transferData, setTransferData] = useState<TransferDetails | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const [rejectionNotes, setRejectionNotes] = useState("");
    const [showRejectForm, setShowRejectForm] = useState(false);
    const [approvedQuantity, setApprovedQuantity] = useState<number>(0);
    const [selectedAction, setSelectedAction] = useState<string>("");
    const [showNotes, setShowNotes] = useState(false);

    const fetchTransferDetails = useCallback(async () => {
        if (!transferId) return;

        setIsLoading(true);
        try {
            const response = await apiGet(`/show_transfer_for_approval/${transferId}`);

            if (response?.data?.success && response.data.data) {
                setTransferData(response.data.data);
                setApprovedQuantity(response.data.data.transfer.stock_quantity);
            } else {
                toast.error(response?.data?.message || "Failed to load transfer details");
            }
        } catch (error: unknown) {
            const err = error as { response?: { status?: number; data?: { message?: string } } };

            if (err?.response?.status === 403) {
                toast.error(err.response?.data?.message || "You don't have permission to view this transfer");
                router.push(TRANSFERS_LIST_URL);
                return;
            }

            toast.error("Failed to load transfer");
        } finally {
            setIsLoading(false);
        }
    }, [transferId, router, TRANSFERS_LIST_URL]);

    useEffect(() => {
        if (transferId) {
            fetchTransferDetails();
        }
    }, [transferId, fetchTransferDetails]);

    const handleApprove = async (status: string) => {
        setSelectedAction(status);
        setIsProcessing(true);

        try {
            const payload: Record<string, unknown> = { status };

            if (approvedQuantity !== transferData?.transfer.stock_quantity) {
                payload.approved_quantity = approvedQuantity;
            }

            const response = await apiPost(
                `/approve_transfer/${transferId}`,
                payload,
                {},
                [TRANSFERS_LIST_URL]
            );

            if (response?.data?.success) {
                toast.success('Transfer processed successfully');
                setTimeout(() => goBack(), 1500);
            } else {
                toast.error(response?.data?.message || "Failed to process transfer");
            }
        } catch {
            toast.error("Failed to process transfer");
        } finally {
            setIsProcessing(false);
            setSelectedAction("");
        }
    };

    const handleReject = async () => {
        if (!rejectionNotes.trim()) {
            toast.error("Please provide a reason for rejection");
            return;
        }

        setSelectedAction('rejected');
        setIsProcessing(true);

        try {
            const payload = {
                notes: rejectionNotes,
                rejected_by: user?.name || user?.email || 'Unknown',
                rejected_at: new Date().toISOString(),
                transfer_reference: transferData?.transfer.reference_number
            };

            if (approvedQuantity !== transferData?.transfer.stock_quantity) {
                (payload as Record<string, unknown>).approved_quantity = approvedQuantity;
            }

            const response = await apiPost(
                `/reject_transfer/${transferId}`,
                payload,
                {},
                [TRANSFERS_LIST_URL]
            );

            if (response?.data?.success) {
                toast.success('Transfer rejected successfully');
                setTimeout(() => goBack(), 1500);
            } else {
                toast.error(response?.data?.message || "Failed to reject transfer");
            }
        } catch {
            toast.error("Failed to reject transfer");
        } finally {
            setIsProcessing(false);
            setSelectedAction("");
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center"
                >
                    <Loader2 className="h-16 w-16 animate-spin text-gray-900 mx-auto mb-8" />
                    <p className="text-gray-900 font-semibold text-xl mb-2">Loading transfer details...</p>
                    <p className="text-gray-500 text-sm">Please wait while we fetch the information</p>
                </motion.div>
            </div>
        );
    }

    if (!transferData) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center bg-white p-12 rounded-3xl shadow-xl border border-gray-100 max-w-md w-full"
                >
                    <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-8">
                        <AlertCircle className="h-12 w-12 text-gray-600" />
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-3">Transfer Not Found</h2>
                    <p className="text-gray-500 mb-10">
                        The transfer you&apos;re looking for doesn&apos;t exist or has been removed.
                    </p>
                    <div className="flex flex-col gap-3">
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => router.push(TRANSFERS_LIST_URL)}
                            className="w-full px-6 py-3.5 bg-gray-900 text-white font-semibold rounded-2xl hover:bg-gray-800 transition-all"
                        >
                            View All Transfers
                        </motion.button>
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => fetchTransferDetails()}
                            className="w-full px-6 py-3.5 text-gray-700 bg-gray-100 font-semibold rounded-2xl hover:bg-gray-200 transition-all"
                        >
                            <RefreshCw className="h-4 w-4 inline mr-2" />
                            Try Again
                        </motion.button>
                    </div>
                </motion.div>
            </div>
        );
    }

    const { transfer, current_stock, stock_after_transfer } = transferData;
    const isPending = transfer.status === "pending";
    const stockInsufficient = current_stock < approvedQuantity;
    const stockUsagePercent = current_stock > 0
        ? Math.min(100, Math.max(0, 100 - ((current_stock - approvedQuantity) / current_stock) * 100))
        : 0;

    const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
        e.currentTarget.style.display = 'none';
        const nextSibling = e.currentTarget.nextElementSibling;
        if (nextSibling) {
            nextSibling.classList.remove('hidden');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white border-b border-gray-200 top-0 z-30 mt-[-13px] w-full">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={goBack}
                                className="p-2.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all"
                                aria-label="Go back"
                            >
                                <ArrowLeft className="h-5 w-5" />
                            </motion.button>
                            <div>
                                <div className="flex items-center gap-3 flex-wrap">
                                    <h1 className="text-2xl font-bold text-gray-900">
                                        {isPending ? "Approve Transfer" : "Transfer Details"}
                                    </h1>
                                    <StatusPill status={transfer.status} />
                                </div>
                                <p className="text-sm text-gray-500 mt-0.5 flex items-center gap-1.5">
                                    <ClipboardCheck className="h-3.5 w-3.5" />
                                    Reference: {transfer.reference_number || 'N/A'}
                                </p>
                            </div>
                        </div>

                        <div className="hidden sm:flex items-center gap-2">
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => fetchTransferDetails()}
                                className="p-2.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all"
                                title="Refresh"
                                disabled={isLoading}
                            >
                                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                            </motion.button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4 }}
                            className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden"
                        >
                            <div className="border-b border-gray-100 px-6 py-5 bg-gray-50">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3 text-gray-900">
                                        <div className="p-2 bg-white rounded-xl shadow-sm">
                                            <ShoppingBag className="h-5 w-5" />
                                        </div>
                                        <h2 className="text-lg font-bold">Transfer Overview</h2>
                                    </div>
                                    {isPending && (
                                        <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                                            Awaiting Action
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="p-6">
                                <div className="flex items-start gap-5 mb-8 p-5 bg-gray-50 rounded-2xl border border-gray-200">
                                    <div className="w-24 h-24 bg-white rounded-2xl flex items-center justify-center flex-shrink-0 overflow-hidden shadow-md border border-gray-200">
                                        {transfer.product.image && (
                                            <img
                                                src={getImageUrl(transfer.product.image)}
                                                alt={transfer.product.name}
                                                className="w-full h-full object-cover"
                                                onError={handleImageError}
                                            />
                                        )}
                                        <Package className={`h-10 w-10 text-gray-400 ${transfer.product.image ? 'hidden' : ''}`} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-xl text-gray-900 mb-2">
                                            {transfer.product.name}
                                        </h3>
                                        <div className="flex flex-wrap gap-2 mb-3">
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
                                            {transfer.product.category && (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 border border-purple-200 rounded-lg text-xs font-medium text-purple-700">
                                                    {transfer.product.category}
                                                </span>
                                            )}
                                        </div>
                                        {transfer.product.description && (
                                            <p className="text-sm text-gray-500 line-clamp-2">
                                                {transfer.product.description}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="bg-gray-50 rounded-2xl p-5 border border-gray-200 space-y-1">
                                        <InfoRow label="Reference Number" value={transfer.reference_number || "—"} icon={<FileText className="h-4 w-4" />} />
                                        <InfoRow label="Transfer Date" value={formatDate(transfer.transfer_date)} icon={<Calendar className="h-4 w-4" />} />
                                        <InfoRow label="Expected Delivery" value={transfer.expected_delivery_date ? formatDate(transfer.expected_delivery_date) : "—"} icon={<ArrowRightLeft className="h-4 w-4" />} />
                                    </div>
                                    <div className="bg-gray-50 rounded-2xl p-5 border border-gray-200 space-y-1">
                                        <InfoRow label="Requested By" value={transfer.postby || "—"} icon={<User className="h-4 w-4" />} />
                                        <InfoRow label="Unit Cost" value={formatCurrency(transfer.unit_cost, currencySymbol)} icon={<CreditCard className="h-4 w-4" />} />
                                        <InfoRow label="Total Value" value={formatCurrency(transfer.total, currencySymbol)} icon={<BarChart3 className="h-4 w-4" />} />
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1, duration: 0.4 }}
                            className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden"
                        >
                            <div className="border-b border-gray-100 px-6 py-5 bg-gray-50">
                                <div className="flex items-center gap-3 text-gray-900">
                                    <div className="p-2 bg-white rounded-xl shadow-sm">
                                        <ArrowRightLeft className="h-5 w-5" />
                                    </div>
                                    <h2 className="text-lg font-bold">Transfer Route</h2>
                                </div>
                            </div>

                            <div className="p-6">
                                <div className="flex flex-col md:flex-row items-stretch gap-6">
                                    <div className="flex-1">
                                        <div className="h-full p-6 bg-red-50 rounded-2xl border-2 border-red-100">
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                                                    <TrendingDown className="h-5 w-5 text-red-600" />
                                                </div>
                                                <span className="text-xs font-bold text-red-600 uppercase tracking-wider">Source Location</span>
                                            </div>
                                            <h4 className="font-bold text-gray-900 text-lg mb-2">{transfer.from_location.location_name}</h4>
                                            <p className="text-sm text-gray-600 flex items-center gap-1.5">
                                                <MapPin className="h-3.5 w-3.5" />
                                                {transfer.from_location.city}
                                                {transfer.from_location.head_office && `, ${transfer.from_location.head_office}`}
                                            </p>
                                            {transfer.from_location.address && (
                                                <div className="mt-4 pt-4 border-t border-red-100">
                                                    <p className="text-xs text-gray-500 flex items-start gap-1.5">
                                                        <Building className="h-3 w-3 mt-0.5 flex-shrink-0" />
                                                        {transfer.from_location.address}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex md:flex-col items-center justify-center gap-4 py-4 md:py-0">
                                        <div className="w-12 h-12 bg-gray-900 rounded-full flex items-center justify-center">
                                            <ArrowDown className="h-6 w-6 text-white hidden md:block" />
                                            <ArrowRightLeft className="h-6 w-6 text-white md:hidden" />
                                        </div>
                                        <div className="bg-gray-900 text-white px-5 py-2.5 rounded-2xl text-sm font-bold text-center">
                                            {approvedQuantity.toLocaleString()} {transfer.product.unit || "units"}
                                        </div>
                                    </div>

                                    <div className="flex-1">
                                        <div className="h-full p-6 bg-emerald-50 rounded-2xl border-2 border-emerald-100">
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                                                    <TrendingUp className="h-5 w-5 text-emerald-600" />
                                                </div>
                                                <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Destination</span>
                                            </div>
                                            <h4 className="font-bold text-gray-900 text-lg mb-2">{transfer.to_location.location_name}</h4>
                                            <p className="text-sm text-gray-600 flex items-center gap-1.5">
                                                <MapPin className="h-3.5 w-3.5" />
                                                {transfer.to_location.city}
                                                {transfer.to_location.head_office && `, ${transfer.to_location.head_office}`}
                                            </p>
                                            {transfer.to_location.address && (
                                                <div className="mt-4 pt-4 border-t border-emerald-100">
                                                    <p className="text-xs text-gray-500 flex items-start gap-1.5">
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

                    <div className="space-y-6">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2, duration: 0.4 }}
                            className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden sticky top-28"
                        >
                            <div className="border-b border-gray-100 px-6 py-5 bg-gray-50">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3 text-gray-900">
                                        <div className="p-2 bg-white rounded-xl shadow-sm">
                                            <Scale className="h-5 w-5" />
                                        </div>
                                        <h2 className="text-lg font-bold">Stock Impact</h2>
                                    </div>
                                    {stockInsufficient && <AlertTriangle className="h-5 w-5 text-amber-500" />}
                                </div>
                            </div>

                            <div className="p-6 space-y-4">
                                <StockCard label="Current Stock" value={current_stock} unit={transfer.product.unit || "units"} subtitle="Available at source" icon={<Package className="h-5 w-5" />} />
                                <StockCard label="Transfer Quantity" value={approvedQuantity} unit={transfer.product.unit || "units"} subtitle={`Value: ${formatCurrency(approvedQuantity * transfer.unit_cost, currencySymbol)}`} icon={<ArrowRightLeft className="h-5 w-5" />} />
                                <StockCard label="After Transfer" value={stock_after_transfer} unit={transfer.product.unit || "units"} subtitle={stockInsufficient ? "Insufficient stock" : "Remaining at source"} icon={stockInsufficient ? <AlertTriangle className="h-5 w-5" /> : <CheckCircle2 className="h-5 w-5" />} variant={stockInsufficient ? 'warning' : 'default'} />

                                <div className="p-5 bg-gray-50 rounded-2xl border border-gray-200">
                                    <div className="flex justify-between items-end mb-3">
                                        <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Stock Usage</span>
                                        <span className="text-sm font-bold text-gray-900">{Math.round(stockUsagePercent)}%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${stockUsagePercent}%` }}
                                            transition={{ duration: 1.5, delay: 0.5, ease: "easeOut" }}
                                            className={`h-full rounded-full ${stockUsagePercent > 90 ? 'bg-red-500' : stockUsagePercent > 70 ? 'bg-amber-500' : 'bg-gray-900'}`}
                                        />
                                    </div>
                                </div>

                                {isPending && (
                                    <div className="p-5 bg-blue-50 rounded-2xl border-2 border-blue-200">
                                        <label className="block text-sm font-bold text-gray-900 mb-3">Adjust Approved Quantity</label>
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="number"
                                                value={approvedQuantity}
                                                onChange={(e) => setApprovedQuantity(Math.max(0, Math.min(transfer.stock_quantity, parseInt(e.target.value) || 0)))}
                                                max={transfer.stock_quantity}
                                                min={0}
                                                className="w-32 px-4 py-3 border-2 border-blue-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none bg-white transition-all"
                                            />
                                            <span className="text-sm text-gray-600">of {transfer.stock_quantity} requested</span>
                                        </div>
                                        {approvedQuantity !== transfer.stock_quantity && (
                                            <button
                                                type="button"
                                                onClick={() => setApprovedQuantity(transfer.stock_quantity)}
                                                className="text-xs text-blue-600 hover:text-blue-700 hover:underline mt-3 font-medium flex items-center gap-1"
                                            >
                                                <RefreshCw className="h-3 w-3" />
                                                Reset to requested amount
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </motion.div>

                        {transfer.notes && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3, duration: 0.4 }}
                                className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden"
                            >
                                <button type="button" onClick={() => setShowNotes(!showNotes)} className="w-full p-6 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                    <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                        <MessageSquare className="h-5 w-5" />
                                        Notes & Comments
                                    </h3>
                                    <motion.div animate={{ rotate: showNotes ? 180 : 0 }} transition={{ duration: 0.2 }}>
                                        <ChevronDown className="h-5 w-5 text-gray-400" />
                                    </motion.div>
                                </button>
                                <AnimatePresence>
                                    {showNotes && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.3 }}
                                            className="overflow-hidden"
                                        >
                                            <div className="px-6 pb-6">
                                                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200">
                                                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{transfer.notes}</p>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        )}
                    </div>
                </div>

                <AnimatePresence>
                    {showRejectForm && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3 }}
                            className="bg-white rounded-3xl border-2 border-red-200 overflow-hidden"
                        >
                            <div className="border-b border-red-200 px-6 py-5 bg-red-50">
                                <div className="flex items-center gap-3 text-red-700">
                                    <div className="p-2 bg-white rounded-xl shadow-sm">
                                        <Ban className="h-5 w-5" />
                                    </div>
                                    <h2 className="text-lg font-bold">Rejection Reason</h2>
                                </div>
                            </div>
                            <div className="p-6">
                                <textarea
                                    value={rejectionNotes}
                                    onChange={(e) => setRejectionNotes(e.target.value)}
                                    placeholder="Please provide a detailed reason for rejecting this transfer request..."
                                    rows={4}
                                    className="w-full px-5 py-4 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none text-sm resize-none transition-all"
                                />
                                <div className="flex items-center gap-3 mt-4">
                                    <motion.button
                                        type="button"
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={handleReject}
                                        disabled={isProcessing || !rejectionNotes.trim()}
                                        className="px-6 py-3.5 bg-gray-900 text-white font-semibold rounded-2xl hover:bg-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                    >
                                        {isProcessing && selectedAction === 'rejected' ? <Loader2 className="h-5 w-5 animate-spin" /> : <Ban className="h-5 w-5" />}
                                        Confirm Rejection
                                    </motion.button>
                                    <motion.button
                                        type="button"
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => { setShowRejectForm(false); setRejectionNotes(""); }}
                                        className="px-6 py-3.5 text-gray-700 bg-gray-100 font-semibold rounded-2xl hover:bg-gray-200 transition-all"
                                    >
                                        Cancel
                                    </motion.button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {isPending && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4, duration: 0.4 }}
                        className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6 lg:p-8"
                    >
                        <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                            <Shield className="h-5 w-5" />
                            Process Transfer
                        </h3>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <motion.button
                                type="button"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => handleApprove('approved')}
                                disabled={isProcessing || stockInsufficient}
                                className="inline-flex items-center justify-center gap-3 px-6 py-4 bg-gray-900 text-white font-bold rounded-2xl hover:bg-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isProcessing && selectedAction === 'approved' ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle2 className="h-5 w-5" />}
                                Complete Transfer
                            </motion.button>

                            <motion.button
                                type="button"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setShowRejectForm(true)}
                                disabled={isProcessing}
                                className="inline-flex items-center justify-center gap-3 px-6 py-4 text-gray-900 bg-white border-2 border-gray-900 font-bold rounded-2xl hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <XCircle className="h-5 w-5" />
                                Reject Transfer
                            </motion.button>
                        </div>

                        {stockInsufficient && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mt-6 p-5 bg-amber-50 rounded-2xl border-2 border-amber-200 flex items-start gap-4"
                            >
                                <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-sm font-bold text-amber-900">Insufficient Stock Warning</p>
                                    <p className="text-sm text-amber-700 mt-1.5">
                                        The source location has <strong>{current_stock.toLocaleString()}</strong> units, but the transfer requires <strong>{approvedQuantity.toLocaleString()}</strong> units.
                                        Please adjust the quantity or reject this transfer.
                                    </p>
                                </div>
                            </motion.div>
                        )}
                    </motion.div>
                )}

                {!isPending && (
                    <div className="flex justify-center pt-4">
                        <motion.button
                            type="button"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={goBack}
                            className="inline-flex items-center gap-2 px-8 py-4 text-gray-700 bg-white border-2 border-gray-200 font-bold rounded-2xl hover:bg-gray-50 transition-all"
                        >
                            <ArrowLeft className="h-5 w-5" />
                            Back to Transfers
                        </motion.button>
                    </div>
                )}
            </main>
        </div>
    );
};

export default withAuth(ApproveTransferPage);