"use client";

import { withAuth } from "@/hoc/withAuth";
import { apiGet, apiPut } from "@/lib/axios";
import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  Loader2,
  Package,
  Building2,
  Calendar,
  Clock,
  Truck,
  FileText,
  Phone,
  Mail,
  User,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  CheckCheck,
  MapPin,
  Hash,
  ShoppingBag,
  Percent,
  Receipt,
  DollarSign,
  Save,
  X,
  Minus,
  Plus,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { toast } from "react-hot-toast";
import { motion } from "framer-motion";

// ==============================================
// TypeScript Interfaces
// ==============================================

interface Supplier {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  contact_person: string | null;
  address: string | null;
  tax_id: string | null;
}

interface Product {
  id: number;
  name: string;
  sku: string;
  cost_price: number;
  selling_price: number;
  unit: string;
}

interface PurchaseOrderItem {
  id: number;
  product_id: number;
  product?: Product;
  quantity: number;
  unit_cost: number;
  total: number;
  received_quantity?: number;
  backordered_quantity?: number;
}

interface PurchaseOrder {
  id: number;
  po_number: string;
  supplier_id: number;
  supplier?: Supplier;
  order_date: string;
  expected_delivery_date: string | null;
  delivered_date: string | null;
  status: "pending" | "sent" | "received" | "partially_received" | "cancelled";
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  discount_type?: "fixed" | "percentage";
  shipping_cost: number;
  total_amount: number;
  notes: string | null;
  terms: string | null;
  items: PurchaseOrderItem[];
  created_at: string;
  updated_at: string;
  location_id?: number;
  location?: { id: number; location_name: string };
}

interface User {
  businesses_one?: Array<{
    currency?: string;
    name?: string;
    address?: string;
    phone?: string;
    email?: string;
  }>;
}

// ==============================================
// Utility Functions
// ==============================================

const formatDate = (dateString: string | null): string => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const formatCurrency = (amount: number, currencySymbol: string = "$"): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount).replace(/^\$/, currencySymbol);
};

// ==============================================
// Sub-components
// ==============================================

const LoadingState: React.FC = () => (
  <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center">
    <div className="text-center">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        className="w-20 h-20 mx-auto mb-6"
      >
        <div className="w-full h-full rounded-full border-4 border-gray-200 border-t-gray-900" />
      </motion.div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading Purchase Order</h3>
      <p className="text-gray-500">Please wait while we fetch the details...</p>
    </div>
  </div>
);

const ErrorState: React.FC<{ message: string; onRetry: () => void }> = ({ message, onRetry }) => (
  <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center p-4">
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full"
    >
      <div className="text-center">
        <div className="w-16 h-16 bg-rose-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="h-8 w-8 text-rose-600" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Error Loading Order</h3>
        <p className="text-gray-600 mb-6">{message}</p>
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-all font-medium"
        >
          <RefreshCw className="h-4 w-4" />
          Try Again
        </button>
      </div>
    </motion.div>
  </div>
);

const StatusBadge: React.FC<{ status: PurchaseOrder["status"] }> = ({ status }) => {
  const config: Record<
    PurchaseOrder["status"],
    { label: string; icon: React.ElementType; gradient: string }
  > = {
    pending: { label: "Pending", icon: Clock, gradient: "from-amber-500 to-amber-600" },
    sent: { label: "Approved", icon: CheckCircle, gradient: "from-blue-500 to-blue-600" },
    received: { label: "Received", icon: CheckCheck, gradient: "from-emerald-500 to-emerald-600" },
    partially_received: { label: "Partially Received", icon: AlertCircle, gradient: "from-amber-500 to-amber-600" },
    cancelled: { label: "Cancelled", icon: X, gradient: "from-rose-500 to-rose-600" },
  };

  const { label, gradient, icon: Icon } = config[status] || config.pending;

  return (
    <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium bg-gradient-to-r ${gradient} text-white shadow-sm`}>
      <Icon className="h-3.5 w-3.5" />
      {label}
    </span>
  );
};

const InfoCard: React.FC<{ 
  title: string; 
  icon: React.ElementType;
  children: React.ReactNode;
}> = ({ title, icon: Icon, children }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
  >
    <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center">
          <Icon className="h-4 w-4 text-white" />
        </div>
        <h3 className="font-semibold text-gray-900">{title}</h3>
      </div>
    </div>
    <div className="p-6">{children}</div>
  </motion.div>
);

// ==============================================
// Main Component
// ==============================================

const ReceivePurchaseOrderPage = ({ user }: { user: User }) => {
  const router = useRouter();
  const params = useParams();
  const orderId = params?.id as string;

  const currencySymbol = user?.businesses_one?.[0]?.currency || "$";
  const formatCurr = (amount: number) => formatCurrency(amount, currencySymbol);

  // State
  const [order, setOrder] = useState<PurchaseOrder | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Received quantities state
  const [receivedQuantities, setReceivedQuantities] = useState<Record<number, number>>({});
  const [receivedDate, setReceivedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [receivingNotes, setReceivingNotes] = useState<string>("");

  useEffect(() => {
    if (orderId) {
      fetchOrder();
    }
  }, [orderId]);

  const fetchOrder = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiGet(`/purchase-list/${orderId}`, {}, false);
      const data = res.data?.data || res.data;

      const mappedOrder: PurchaseOrder = {
        id: data.id,
        po_number: data.order_number || data.po_number || `PO-${data.id}`,
        supplier_id: data.vendors_id || data.supplier_id,
        supplier: data.vendor || data.supplier ? {
          id: data.vendor?.id || data.supplier?.id,
          name: data.vendor?.vendor_name || data.supplier?.name,
          email: data.vendor?.email || data.supplier?.email,
          phone: data.vendor?.phone || data.supplier?.phone,
          contact_person: data.vendor?.contact_person || data.supplier?.contact_person,
          address: data.vendor?.address || data.supplier?.address,
          tax_id: data.vendor?.tax_id || data.supplier?.tax_id,
        } : undefined,
        order_date: data.order_date,
        expected_delivery_date: data.expected_delivery_date,
        delivered_date: data.delivered_date,
        status: data.status || "pending",
        subtotal: parseFloat(data.subtotal) || 0,
        tax_amount: parseFloat(data.tax) || parseFloat(data.tax_amount) || 0,
        discount_amount: parseFloat(data.discount) || parseFloat(data.discount_amount) || 0,
        discount_type: data.discount_type || "fixed",
        shipping_cost: parseFloat(data.shipping_cost) || 0,
        total_amount: parseFloat(data.total_amount) || 0,
        notes: data.notes,
        terms: data.terms,
        items: (data.items || []).map((item: any) => ({
          id: item.id,
          product_id: item.product_id,
          product: item.product,
          quantity: item.quantity,
          unit_cost: parseFloat(item.unit_cost) || 0,
          total: parseFloat(item.total_cost) || parseFloat(item.total) || 0,
          received_quantity: item.received_quantity || 0,
          backordered_quantity: item.backordered_quantity || 0,
        })),
        created_at: data.created_at,
        updated_at: data.updated_at,
        location_id: data.location_id,
        location: data.location,
      };

      setOrder(mappedOrder);
      
      // Initialize received quantities with existing values
      const initialQuantities: Record<number, number> = {};
      mappedOrder.items.forEach(item => {
        initialQuantities[item.id] = item.received_quantity || 0;
      });
      setReceivedQuantities(initialQuantities);
      
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.message || "Failed to load purchase order");
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuantityChange = (itemId: number, value: number) => {
    const item = order?.items.find(i => i.id === itemId);
    if (!item) return;
    
    const maxQuantity = item.quantity;
    const validValue = Math.max(0, Math.min(value, maxQuantity));
    
    setReceivedQuantities(prev => ({
      ...prev,
      [itemId]: validValue
    }));
  };

  const handleIncrement = (itemId: number) => {
    const item = order?.items.find(i => i.id === itemId);
    if (!item) return;
    
    const currentValue = receivedQuantities[itemId] || 0;
    if (currentValue < item.quantity) {
      handleQuantityChange(itemId, currentValue + 1);
    }
  };

  const handleDecrement = (itemId: number) => {
    const currentValue = receivedQuantities[itemId] || 0;
    if (currentValue > 0) {
      handleQuantityChange(itemId, currentValue - 1);
    }
  };

  const handleReceiveAll = () => {
    if (!order) return;
    
    const fullQuantities: Record<number, number> = {};
    order.items.forEach(item => {
      fullQuantities[item.id] = item.quantity;
    });
    setReceivedQuantities(fullQuantities);
  };

  const getTotalReceived = (): number => {
    return Object.values(receivedQuantities).reduce((sum, qty) => sum + qty, 0);
  };

  const getTotalOrdered = (): number => {
    return order?.items.reduce((sum, item) => sum + item.quantity, 0) || 0;
  };

  const getProgressPercentage = (): number => {
    const total = getTotalOrdered();
    if (total === 0) return 0;
    return Math.round((getTotalReceived() / total) * 100);
  };

  const handleSubmit = async (fullReceive: boolean = false) => {
    if (isSubmitting || !order) return;
    
    // Determine final status
    const totalReceived = fullReceive ? getTotalOrdered() : getTotalReceived();
    const newStatus = totalReceived >= getTotalOrdered() ? "received" : "partially_received";
    
    setIsSubmitting(true);
    
    try {
      const payload = {
        status: newStatus,
        received_date: receivedDate, 
        notes: receivingNotes,
        items: order.items.map(item => ({
          id: item.id,
          received_quantity: fullReceive ? item.quantity : (receivedQuantities[item.id] || 0)
        }))
      };
      
      await apiPut(`/purchase-receive/${orderId}`, payload);
      
      toast.success(
        fullReceive 
          ? "All items received successfully" 
          : "Items received successfully"
      );
      
      // router.push(`/purchase-orders/${orderId}`);
      router.push(`/purchase`);
      
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to receive items");
    } finally {
      setIsSubmitting(false);
    }     
  };

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={fetchOrder} />;
  if (!order) return <ErrorState message="Order not found" onRetry={fetchOrder} />;

  const totalOrdered = getTotalOrdered();
  const totalReceived = getTotalReceived();
  const progressPercentage = getProgressPercentage();
  const isFullyReceived = totalReceived >= totalOrdered;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Header */}
      <header className="top-0 z-40 bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.back()}
                className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all"
              >
                <ArrowLeft className="h-5 w-5" />
              </motion.button>
              
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-gray-900">Receive Items</h1>
                  <StatusBadge status={order.status} />
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-sm text-gray-500">
                    {order.po_number} • {order.supplier?.name}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => router.back()}
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 transition-all"
              >
                Cancel
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleSubmit(false)}
                disabled={isSubmitting || totalReceived === 0}
                className="px-6 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-sm font-medium rounded-xl hover:from-emerald-600 hover:to-emerald-700 transition-all shadow-sm disabled:opacity-50 flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    {isFullyReceived ? "Complete Receiving" : "Save Received Items"}
                  </>
                )}
              </motion.button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Items to Receive */}
          <div className="lg:col-span-2 space-y-6">
            {/* Progress Bar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900">Receiving Progress</h3>
                <span className="text-sm text-gray-500">
                  {totalReceived} of {totalOrdered} items received
                </span>
              </div>
              <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercentage}%` }}
                  className={`h-full rounded-full ${
                    progressPercentage === 100 ? 'bg-emerald-500' : 'bg-blue-500'
                  }`}
                />
              </div>
              <div className="flex items-center justify-between mt-3">
                <span className="text-xs text-gray-500">{progressPercentage}% Complete</span>
                {progressPercentage < 100 && (
                  <button
                    onClick={handleReceiveAll}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Receive All Items
                  </button>
                )}
              </div>
            </motion.div>

            {/* Items List */}
            <InfoCard title="Items to Receive" icon={Package}>
              <div className="space-y-4">
                {order.items.map((item) => {
                  const received = receivedQuantities[item.id] || 0;
                  const remaining = item.quantity - (item.received_quantity || 0);
                  const isFullyReceivedBefore = (item.received_quantity || 0) >= item.quantity;
                  
                  return (
                    <div
                      key={item.id}
                      className={`p-4 rounded-xl border ${
                        isFullyReceivedBefore 
                          ? 'bg-emerald-50 border-emerald-200' 
                          : received >= remaining
                            ? 'bg-blue-50 border-blue-200'
                            : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-sm flex-shrink-0">
                          <Package className="h-6 w-6 text-gray-600" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-medium text-gray-900">
                                {item.product?.name || `Product #${item.product_id}`}
                              </h4>
                              <div className="flex items-center gap-3 mt-1">
                                <code className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-600">
                                  SKU: {item.product?.sku || "—"}
                                </code>
                                <span className="text-xs text-gray-500">
                                  Unit: {item.product?.unit || "pcs"}
                                </span>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-gray-500">Unit Cost</p>
                              <p className="font-semibold text-gray-900">{formatCurr(item.unit_cost)}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between mt-4">
                            <div className="space-y-1">
                              <p className="text-xs text-gray-500">
                                Previously Received: {item.received_quantity || 0} of {item.quantity}
                              </p>
                              {!isFullyReceivedBefore && (
                                <p className="text-xs text-gray-500">
                                  Remaining to receive: {remaining}
                                </p>
                              )}
                            </div>
                            
                            {!isFullyReceivedBefore ? (
                              <div className="flex items-center gap-3">
                                <button
                                  onClick={() => handleDecrement(item.id)}
                                  disabled={received === 0}
                                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition disabled:opacity-30"
                                >
                                  <Minus className="h-4 w-4" />
                                </button>
                                
                                <input
                                  type="number"
                                  min={0}
                                  max={remaining}
                                  value={received}
                                  onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value) || 0)}
                                  className="w-20 px-3 py-2 text-center border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                />
                                
                                <button
                                  onClick={() => handleIncrement(item.id)}
                                  disabled={received >= remaining}
                                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition disabled:opacity-30"
                                >
                                  <Plus className="h-4 w-4" />
                                </button>
                                
                                <span className="text-sm text-gray-500">
                                  / {item.quantity} {item.product?.unit}
                                </span>
                              </div>
                            ) : (
                              <span className="px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-lg text-sm font-medium flex items-center gap-1">
                                <CheckCheck className="h-4 w-4" />
                                Fully Received
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </InfoCard>
          </div>

          {/* Right Column - Summary */}
          <div className="space-y-6">
            {/* Order Summary */}
            <InfoCard title="Order Summary" icon={ShoppingBag}>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-600">Order Number</span>
                  <span className="font-semibold text-gray-900">{order.po_number}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-t border-gray-100">
                  <span className="text-gray-600">Supplier</span>
                  <span className="font-medium text-gray-900">{order.supplier?.name}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-t border-gray-100">
                  <span className="text-gray-600">Order Date</span>
                  <span className="font-medium text-gray-900">{formatDate(order.order_date)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-t border-gray-100">
                  <span className="text-gray-600">Expected Delivery</span>
                  <span className="font-medium text-gray-900">{formatDate(order.expected_delivery_date)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-t border-gray-100">
                  <span className="text-gray-600">Total Items</span>
                  <span className="font-medium text-gray-900">{totalOrdered} units</span>
                </div>
              </div>
            </InfoCard>

            {/* Received Date - Changed from Delivery Information */}
            <InfoCard title="Received Date" icon={Calendar}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Date Received
                  </label>
                  <input
                    type="date"
                    value={receivedDate}
                    onChange={(e) => setReceivedDate(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Receiving Notes (Optional)
                  </label>
                  <textarea
                    value={receivingNotes}
                    onChange={(e) => setReceivingNotes(e.target.value)}
                    rows={3}
                    placeholder="Add any notes about this delivery..."
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                  />
                </div>
              </div>
            </InfoCard>

            {/* Financial Summary */}
            <InfoCard title="Order Total" icon={DollarSign}>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium text-gray-900">{formatCurr(order.subtotal)}</span>
                </div>
                
                {order.discount_amount > 0 && (
                  <div className="flex justify-between items-center py-2 border-t border-gray-100">
                    <span className="text-gray-600">Discount</span>
                    <span className="font-medium text-rose-600">
                      -{order.discount_type === "percentage" 
                        ? formatCurr(order.subtotal * (order.discount_amount / 100))
                        : formatCurr(order.discount_amount)}
                    </span>
                  </div>
                )}
                
                {order.tax_amount > 0 && (
                  <div className="flex justify-between items-center py-2 border-t border-gray-100">
                    <span className="text-gray-600">Tax</span>
                    <span className="font-medium text-gray-900">{formatCurr(order.tax_amount)}</span>
                  </div>
                )}
                
                {order.shipping_cost > 0 && (
                  <div className="flex justify-between items-center py-2 border-t border-gray-100">
                    <span className="text-gray-600">Shipping</span>
                    <span className="font-medium text-gray-900">{formatCurr(order.shipping_cost)}</span>
                  </div>
                )}
                
                <div className="pt-4 mt-2 border-t-2 border-gray-200">
                  <div className="flex justify-between items-baseline">
                    <span className="text-lg font-bold text-gray-900">Total</span>
                    <span className="text-2xl font-bold text-gray-900">{formatCurr(order.total_amount)}</span>
                  </div>
                </div>
              </div>
            </InfoCard>

            {/* Quick Actions */}
            <div className="bg-emerald-50 rounded-2xl p-6 border border-emerald-200">
              <h4 className="font-semibold text-emerald-900 mb-2">Quick Actions</h4>
              <div className="space-y-2">
                <button
                  onClick={handleReceiveAll}
                  className="w-full px-4 py-2.5 bg-white text-emerald-700 text-sm font-medium rounded-xl border border-emerald-300 hover:bg-emerald-100 transition-all"
                >
                  Mark All Items as Received
                </button>
                <button
                  onClick={() => handleSubmit(true)}
                  disabled={isSubmitting}
                  className="w-full px-4 py-2.5 bg-emerald-600 text-white text-sm font-medium rounded-xl hover:bg-emerald-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCheck className="h-4 w-4" />
                  )}
                  Complete Full Receipt
                </button>
              </div>
              <p className="text-xs text-emerald-700 mt-3 text-center">
                Full receipt will mark the entire order as received
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default withAuth(ReceivePurchaseOrderPage);