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
    Building2,
    Hash,
    Calendar,
    User,
    MapPin,
    Phone,
    Info,
    TrendingDown,
    TrendingUp,
    Shield,
    Send,
    Ban,
    Truck,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { toast } from "react-hot-toast";
import { motion } from "framer-motion";

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
        hour: "2-digit",
        minute: "2-digit",
    });
};

const getImageUrl = (src: string | null): string => {
    if (!src) return "";
    return `${API_STORAGE_BASE_URL}/${src}`;
};

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
                // router.push("/fetch_transfer_stock");
            }
        } catch (error: any) {
            const message = error?.response?.data?.message || "Failed to load transfer";
            toast.error(message);
            // router.push("/fetch_transfer_stock");
        } finally {
            setIsLoading(false);
        }
    }, [transferId, router]);

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

            const response = await apiPost(`/transfers/${transferId}/approve`, payload);
            const responseData = response?.data || response;

            if (responseData?.success) {
                toast.success(`Transfer ${status === 'approved' ? 'approved' : status === 'in_transit' ? 'marked as in transit' : 'rejected'} successfully`);
                router.push("/fetch_transfer_stock");
            } else {
                toast.error(responseData?.message || "Failed to process transfer");
            }
        } catch (error: any) {
            const message = error?.response?.data?.message || "Failed to process transfer";
            toast.error(message);
        } finally {
            setIsProcessing(false);
        }
    };

    // Loading state
    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-[#010804] mx-auto mb-4" />
                    <p className="text-gray-500">Loading transfer details...</p>
                </div>
            </div>
        );
    }

    // No data state
    if (!transferData) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
                    <h2 className="text-lg font-semibold text-gray-900 mb-2">Transfer Not Found</h2>
                    <button
                        onClick={() => router.push("/fetch_transfer_stock")}
                        className="text-[#010804] hover:underline"
                    >
                        Back to Transfers
                    </button>
                </div>
            </div>
        );
    }

    const { transfer, current_stock, stock_after_transfer } = transferData;
    const isPending = transfer.status === "pending";
    const stockInsufficient = current_stock < approvedQuantity;

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 top-0 z-30 w-full">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
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
                                    {isPending ? "Approve Transfer" : "Transfer Details"}
                                </h1>
                                <p className="text-sm text-gray-500">
                                    Review and process stock transfer request
                                </p>
                            </div>
                        </div>
                        <div className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
                            transfer.status === "pending" 
                                ? "bg-amber-50 text-amber-700 border border-amber-200"
                                : transfer.status === "approved" || transfer.status === "in_transit"
                                ? "bg-blue-50 text-blue-700 border border-blue-200"
                                : transfer.status === "completed"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-red-50 text-red-700 border border-red-200"
                        }`}>
                            {transfer.status.charAt(0).toUpperCase() + transfer.status.slice(1).replace("_", " ")}
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
                {/* Transfer Overview */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden"
                >
                    <div className="p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                            <Info className="h-5 w-5 text-[#010804]" />
                            Transfer Overview
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Product Details */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                                    Product Information
                                </h3>
                                <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
                                    <div className="w-16 h-16 bg-[#010804]/10 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden">
                                        {transfer.product.image ? (
                                            <img
                                                src={getImageUrl(transfer.product.image)}
                                                alt={transfer.product.name}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <Package className="h-8 w-8 text-[#010804]" />
                                        )}
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-gray-900 text-lg">
                                            {transfer.product.name}
                                        </h4>
                                        <p className="text-sm text-gray-500">SKU: {transfer.product.sku}</p>
                                        {transfer.product.barcode && (
                                            <p className="text-sm text-gray-500">Barcode: {transfer.product.barcode}</p>
                                        )}
                                        {transfer.product.category && (
                                            <p className="text-sm text-gray-500">Category: {transfer.product.category}</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Transfer Details */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                                    Transfer Details
                                </h3>
                                <div className="space-y-3 p-4 bg-gray-50 rounded-xl">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-500">Reference</span>
                                        <span className="text-sm font-semibold text-gray-900">
                                            {transfer.reference_number || "—"}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-500">Request Date</span>
                                        <span className="text-sm font-semibold text-gray-900">
                                            {formatDate(transfer.transfer_date)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-500">Expected Delivery</span>
                                        <span className="text-sm font-semibold text-gray-900">
                                            {transfer.expected_delivery_date 
                                                ? formatDate(transfer.expected_delivery_date) 
                                                : "—"}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-500">Requested By</span>
                                        <span className="text-sm font-semibold text-gray-900">
                                            {transfer.postby || "—"}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Location & Route */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden"
                >
                    <div className="p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                            <MapPin className="h-5 w-5 text-[#010804]" />
                            Transfer Route
                        </h2>

                        <div className="flex flex-col md:flex-row items-center gap-4">
                            {/* From Location */}
                            <div className="flex-1 w-full p-4 bg-red-50 rounded-xl border border-red-200">
                                <div className="flex items-center gap-2 mb-2">
                                    <TrendingDown className="h-4 w-4 text-red-600" />
                                    <span className="text-xs font-semibold text-red-600 uppercase">Source</span>
                                </div>
                                <h4 className="font-semibold text-gray-900">
                                    {transfer.from_location.location_name}
                                </h4>
                                <p className="text-sm text-gray-500">
                                    {transfer.from_location.city}, {transfer.from_location.head_office}
                                </p>
                                {transfer.from_location.address && (
                                    <p className="text-xs text-gray-400 mt-1">{transfer.from_location.address}</p>
                                )}
                            </div>

                            {/* Arrow */}
                            <div className="flex flex-col items-center gap-2">
                                <ArrowRightLeft className="h-8 w-8 text-gray-400" />
                                <span className="text-xs text-gray-400 font-medium">
                                    {transfer.stock_quantity} {transfer.product.unit || "units"}
                                </span>
                            </div>

                            {/* To Location */}
                            <div className="flex-1 w-full p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                                <div className="flex items-center gap-2 mb-2">
                                    <TrendingUp className="h-4 w-4 text-emerald-600" />
                                    <span className="text-xs font-semibold text-emerald-600 uppercase">Destination</span>
                                </div>
                                <h4 className="font-semibold text-gray-900">
                                    {transfer.to_location.location_name}
                                </h4>
                                <p className="text-sm text-gray-500">
                                    {transfer.to_location.city}, {transfer.to_location.head_office}
                                </p>
                                {transfer.to_location.address && (
                                    <p className="text-xs text-gray-400 mt-1">{transfer.to_location.address}</p>
                                )}
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Stock Impact */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden"
                >
                    <div className="p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                            <Package className="h-5 w-5 text-[#010804]" />
                            Stock Impact Analysis
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                            <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                                <p className="text-xs text-blue-600 font-semibold uppercase mb-1">Current Stock</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {current_stock}
                                    <span className="text-sm font-normal text-gray-500 ml-1">
                                        {transfer.product.unit || "units"}
                                    </span>
                                </p>
                                <p className="text-xs text-gray-500 mt-1">At source location</p>
                            </div>

                            <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                                <p className="text-xs text-amber-600 font-semibold uppercase mb-1">Transfer Quantity</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {approvedQuantity}
                                    <span className="text-sm font-normal text-gray-500 ml-1">
                                        {transfer.product.unit || "units"}
                                    </span>
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                    Value: {formatCurrency(approvedQuantity * transfer.unit_cost, currencySymbol)}
                                </p>
                            </div>

                            <div className={`p-4 rounded-xl border ${
                                stockInsufficient 
                                    ? "bg-red-50 border-red-200" 
                                    : "bg-emerald-50 border-emerald-200"
                            }`}>
                                <p className={`text-xs font-semibold uppercase mb-1 ${
                                    stockInsufficient ? "text-red-600" : "text-emerald-600"
                                }`}>
                                    After Transfer
                                </p>
                                <p className={`text-2xl font-bold ${
                                    stockInsufficient ? "text-red-600" : "text-gray-900"
                                }`}>
                                    {stock_after_transfer}
                                    <span className="text-sm font-normal text-gray-500 ml-1">
                                        {transfer.product.unit || "units"}
                                    </span>
                                </p>
                                <p className={`text-xs mt-1 ${
                                    stockInsufficient ? "text-red-500" : "text-gray-500"
                                }`}>
                                    {stockInsufficient 
                                        ? "⚠️ Insufficient stock!" 
                                        : "Remaining at source"}
                                </p>
                            </div>
                        </div>

                        {/* Quantity Adjustment */}
                        {isPending && (
                            <div className="p-4 bg-gray-50 rounded-xl">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Adjust Approved Quantity (Optional)
                                </label>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="number"
                                        value={approvedQuantity}
                                        onChange={(e) => setApprovedQuantity(Math.max(0, parseInt(e.target.value) || 0))}
                                        max={transfer.stock_quantity}
                                        min={0}
                                        className="w-32 px-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#010804]/20 focus:border-[#010804] outline-none"
                                    />
                                    <span className="text-sm text-gray-500">
                                        of {transfer.stock_quantity} requested {transfer.product.unit || "units"}
                                    </span>
                                    {approvedQuantity !== transfer.stock_quantity && (
                                        <button
                                            onClick={() => setApprovedQuantity(transfer.stock_quantity)}
                                            className="text-xs text-[#010804] hover:underline"
                                        >
                                            Reset to requested
                                        </button>
                                    )}
                                </div>
                                {stockInsufficient && (
                                    <p className="text-xs text-red-500 mt-2 flex items-center gap-1">
                                        <AlertTriangle className="h-3 w-3" />
                                        Insufficient stock at source location
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* Notes */}
                {transfer.notes && (
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden"
                    >
                        <div className="p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <Info className="h-5 w-5 text-[#010804]" />
                                Notes
                            </h2>
                            <div className="p-4 bg-gray-50 rounded-xl">
                                <p className="text-sm text-gray-700 whitespace-pre-wrap">{transfer.notes}</p>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Rejection Form */}
                {showRejectForm && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-white rounded-2xl border border-red-200 shadow-sm overflow-hidden"
                    >
                        <div className="p-6">
                            <h2 className="text-lg font-semibold text-red-600 mb-4 flex items-center gap-2">
                                <Ban className="h-5 w-5" />
                                Rejection Reason
                            </h2>
                            <textarea
                                value={rejectionNotes}
                                onChange={(e) => setRejectionNotes(e.target.value)}
                                placeholder="Please provide a reason for rejecting this transfer..."
                                rows={4}
                                className="w-full px-4 py-3 border-2 border-red-200 rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none text-sm resize-none"
                            />
                            <div className="flex items-center gap-3 mt-4">
                                <button
                                    onClick={() => handleApprove('rejected')}
                                    disabled={isProcessing || !rejectionNotes.trim()}
                                    className="px-6 py-2.5 bg-red-600 text-white text-sm font-semibold rounded-xl hover:bg-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isProcessing ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        "Confirm Rejection"
                                    )}
                                </button>
                                <button
                                    onClick={() => {
                                        setShowRejectForm(false);
                                        setRejectionNotes("");
                                    }}
                                    className="px-6 py-2.5 text-gray-700 bg-gray-100 text-sm font-semibold rounded-xl hover:bg-gray-200 transition-all"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Action Buttons */}
                {isPending && (
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="flex flex-col sm:flex-row items-center gap-4"
                    >
                        <button
                            onClick={() => handleApprove('in_transit')}
                            disabled={isProcessing || stockInsufficient}
                            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isProcessing ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Truck className="h-4 w-4" />
                            )}
                            Approve & Mark In Transit
                        </button>
                        <button
                            onClick={() => handleApprove('approved')}
                            disabled={isProcessing}
                            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-[#010804] text-white text-sm font-semibold rounded-xl hover:bg-[#14532d] transition-all shadow-lg shadow-[#010804]/20 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isProcessing ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <CheckCircle2 className="h-4 w-4" />
                            )}
                            Approve Transfer
                        </button>
                        <button
                            onClick={() => setShowRejectForm(true)}
                            disabled={isProcessing}
                            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 text-red-600 bg-white border-2 border-red-200 text-sm font-semibold rounded-xl hover:bg-red-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <XCircle className="h-4 w-4" />
                            Reject Transfer
                        </button>
                    </motion.div>
                )}

                {/* Back Button for non-pending transfers */}
                {!isPending && (
                    <div className="flex justify-center">
                        <button
                            onClick={() => router.push("/fetch_transfer_stock")}
                            className="inline-flex items-center gap-2 px-6 py-3 text-gray-700 bg-white border-2 border-gray-200 text-sm font-semibold rounded-xl hover:bg-gray-50 transition-all"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back to Transfers
                        </button>
                    </div>
                )}
            </main>
        </div>
    );
};

export default withAuth(ApproveTransferPage);