"use client";

import { withAuth } from "@/hoc/withAuth";
import { apiGet, apiPut, apiDelete } from "@/lib/axios";
import React, { useState, useEffect, useMemo } from "react";
import { redirect } from "next/navigation";
import {
  Plus, Search, MoreHorizontal, X, AlertTriangle, ArrowLeft, Loader2,
  RefreshCw, CheckCircle, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  Package, Filter, Edit, Trash2, FilterX, Building2, ShoppingCart, Clock,
  Grid3x3, List, Calendar, FileText, Eye, TrendingUp, TrendingDown,
  DollarSign, SlidersHorizontal, CheckCheck, Ban, MapPin,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

// ============================================================
// Types
// ============================================================
interface Supplier { id: number; name: string; email: string | null; phone: string | null; contact_person: string | null; }
interface Location { id: number; location_id: string; name: string; location_name: string; }
interface PurchaseOrder {
  id: number; po_number: string; order_number: string; encrypted_id: string;
  supplier_id: number; vendor_id?: number; supplier?: Supplier;
  location_id?: number; location_uuid?: string; location?: Location;
  order_date: string; expected_delivery_date: string | null;
  status: "draft" | "pending" | "approved" | "received" | "cancelled";
  total_amount: number; created_at: string; updated_at: string;
}
interface FilterState {
  search: string; status: "all" | "draft" | "pending" | "approved" | "received" | "cancelled";
  supplier: "all" | string; location: "all" | string; dateFrom: string; dateTo: string;
}
interface Statistics {
  totalOrders: number; pendingOrders: number; receivedOrders: number; totalValue: number; monthlyChange: number;
}
interface User {
  businesses_one?: Array<{ currency?: string }>;
  user_roles?: { purchase_create?: string; purchase_read?: string; [key: string]: string | undefined };
}

// ============================================================
// Utilities
// ============================================================
const formatDate = (d: string | null) => !d ? "—" : new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
const formatCurrency = (amount: number, symbol = "$") =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(amount).replace(/^\$/, symbol);

const STATUS_CFG: Record<PurchaseOrder["status"], { label: string; icon: React.ElementType; bg: string; text: string; dot: string }> = {
  draft:     { label: "Draft",     icon: FileText,    bg: "bg-slate-100",  text: "text-slate-700",   dot: "bg-slate-400" },
  pending:   { label: "Pending",   icon: Clock,       bg: "bg-amber-50",   text: "text-amber-700",   dot: "bg-amber-400" },
  approved:  { label: "Approved",  icon: CheckCircle, bg: "bg-blue-50",    text: "text-blue-700",    dot: "bg-blue-500"  },
  received:  { label: "Received",  icon: CheckCheck,  bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
  cancelled: { label: "Cancelled", icon: Ban,         bg: "bg-rose-50",    text: "text-rose-700",    dot: "bg-rose-400"  },
};

const useDebounce = <T,>(value: T, delay: number): T => {
  const [dv, setDv] = useState(value);
  useEffect(() => { const t = setTimeout(() => setDv(value), delay); return () => clearTimeout(t); }, [value, delay]);
  return dv;
};

// ============================================================
// StatusBadge
// ============================================================
const StatusBadge: React.FC<{ status: PurchaseOrder["status"] }> = ({ status }) => {
  const { label, bg, text, dot } = STATUS_CFG[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold tracking-wide ${bg} ${text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot} flex-shrink-0`} />
      {label.toUpperCase()}
    </span>
  );
};

// ============================================================
// StatCard
// ============================================================
const StatCard: React.FC<{
  title: string; value: string | number; icon: React.ElementType; trend?: number; accent: string;
}> = ({ title, value, icon: Icon, trend, accent }) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4 flex items-center gap-4">
    <div className={`w-10 h-10 ${accent} rounded-xl flex items-center justify-center flex-shrink-0`}>
      <Icon className="h-4.5 w-4.5 text-white" />
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5 truncate">{title}</p>
      <p className="text-xl font-bold text-gray-900 leading-none">{value}</p>
    </div>
    {trend !== undefined && (
      <div className={`flex items-center gap-0.5 text-xs font-bold flex-shrink-0 ${trend >= 0 ? "text-emerald-600" : "text-rose-500"}`}>
        {trend >= 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
        {Math.abs(trend)}%
      </div>
    )}
  </div>
);

// ============================================================
// EmptyState + Loading
// ============================================================
const EmptyState: React.FC<{
  title: string; description: string; icon: React.ElementType;
  action?: { label: string; onClick?: () => void; href?: string };
}> = ({ title, description, icon: Icon, action }) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-20">
    <div className="flex flex-col items-center text-center max-w-sm mx-auto">
      <div className="w-16 h-16 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-center mb-5">
        <Icon className="h-8 w-8 text-gray-300" />
      </div>
      <h3 className="text-base font-bold text-gray-800 mb-1.5">{title}</h3>
      <p className="text-sm text-gray-400 mb-6 leading-relaxed">{description}</p>
      {action && (
        action.href
          ? <Link href={action.href} className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white text-sm font-bold rounded-xl hover:bg-gray-800 transition-all shadow-lg shadow-gray-900/15"><Plus className="h-4 w-4" />{action.label}</Link>
          : <button onClick={action.onClick} className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white text-sm font-bold rounded-xl hover:bg-gray-800 transition-all shadow-lg shadow-gray-900/15"><Plus className="h-4 w-4" />{action.label}</button>
      )}
    </div>
  </div>
);

const LoadingState: React.FC = () => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-20 flex flex-col items-center">
    <div className="relative w-14 h-14 mb-5">
      <div className="w-14 h-14 rounded-full border-[3px] border-gray-100" />
      <div className="absolute inset-0 rounded-full border-[3px] border-gray-900 border-t-transparent animate-spin" />
      <ShoppingCart className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
    </div>
    <p className="text-sm font-semibold text-gray-700">Loading purchase orders</p>
    <p className="text-xs text-gray-400 mt-1">Please wait a moment</p>
  </div>
);

// ============================================================
// DeleteModal
// ============================================================
const DeleteModal: React.FC<{
  isOpen: boolean; onClose: () => void; onConfirm: () => void; poNumber: string; isSubmitting: boolean;
}> = ({ isOpen, onClose, onConfirm, poNumber, isSubmitting }) => (
  <AnimatePresence>
    {isOpen && (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50 p-4"
        onClick={onClose}>
        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
          <div className="p-6 text-center">
            <div className="w-14 h-14 bg-rose-50 border border-rose-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6 text-rose-500" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 mb-1.5">Delete Purchase Order</h2>
            <p className="text-sm text-gray-500 leading-relaxed mb-6">
              Are you sure you want to delete <span className="font-bold text-gray-800">"{poNumber}"</span>? This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={onClose} disabled={isSubmitting}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-50 transition disabled:opacity-50">
                Cancel
              </button>
              <button onClick={onConfirm} disabled={isSubmitting}
                className="flex-1 px-4 py-2.5 rounded-xl bg-rose-600 text-white text-sm font-semibold hover:bg-rose-700 transition disabled:opacity-50 inline-flex items-center justify-center gap-2">
                {isSubmitting ? <><Loader2 className="h-4 w-4 animate-spin" />Deleting...</> : <><Trash2 className="h-4 w-4" />Delete</>}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

// ============================================================
// Pagination
// ============================================================
const Pagination: React.FC<{
  currentPage: number; totalPages: number; totalItems: number; startIndex: number; endIndex: number;
  itemsPerPage: number; onPageChange: (p: number) => void; onItemsPerPageChange: (n: number) => void;
}> = ({ currentPage, totalPages, totalItems, startIndex, endIndex, itemsPerPage, onPageChange, onItemsPerPageChange }) => {
  const pages: (number | string)[] = [];
  if (totalPages <= 7) { for (let i = 1; i <= totalPages; i++) pages.push(i); }
  else {
    pages.push(1);
    let s = Math.max(2, currentPage - 2), e = Math.min(totalPages - 1, currentPage + 2);
    if (currentPage <= 4) { s = 2; e = 5; }
    if (currentPage >= totalPages - 3) { s = totalPages - 4; e = totalPages - 1; }
    if (s > 2) pages.push("...");
    for (let i = s; i <= e; i++) pages.push(i);
    if (e < totalPages - 1) pages.push("...");
    if (totalPages > 1) pages.push(totalPages);
  }
  if (totalPages <= 1) return null;

  const Btn: React.FC<{ onClick: () => void; disabled: boolean; children: React.ReactNode }> = ({ onClick, disabled, children }) => (
    <button onClick={onClick} disabled={disabled}
      className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 disabled:opacity-30 transition-colors">
      {children}
    </button>
  );

  return (
    <div className="px-6 py-4 border-t border-gray-100 bg-stone-50/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 font-medium">Rows</span>
          <select value={itemsPerPage} onChange={(e) => { onItemsPerPageChange(Number(e.target.value)); onPageChange(1); }}
            className="px-2 py-1.5 text-xs border border-gray-200 rounded-lg bg-white outline-none font-semibold focus:border-gray-400">
            {[10, 25, 50, 100].map((v) => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>
        <span className="text-xs text-gray-400">{totalItems > 0 ? startIndex + 1 : 0}–{endIndex} of {totalItems}</span>
      </div>
      <div className="flex items-center gap-1">
        <Btn onClick={() => onPageChange(1)} disabled={currentPage === 1}><ChevronsLeft className="h-3.5 w-3.5" /></Btn>
        <Btn onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1}><ChevronLeft className="h-3.5 w-3.5" /></Btn>
        <div className="flex items-center gap-1 mx-1">
          {pages.map((p, i) => (
            <React.Fragment key={i}>
              {p === "..." ? (
                <span className="w-8 h-8 flex items-center justify-center text-gray-400 text-xs">…</span>
              ) : (
                <button onClick={() => onPageChange(p as number)}
                  className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${currentPage === p ? "bg-gray-900 text-white shadow-sm" : "text-gray-600 hover:bg-gray-100 border border-gray-200"}`}>
                  {p}
                </button>
              )}
            </React.Fragment>
          ))}
        </div>
        <Btn onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages}><ChevronRight className="h-3.5 w-3.5" /></Btn>
        <Btn onClick={() => onPageChange(totalPages)} disabled={currentPage === totalPages}><ChevronsRight className="h-3.5 w-3.5" /></Btn>
      </div>
    </div>
  );
};

// ============================================================
// FilterDrawer
// ============================================================
const FilterDrawer: React.FC<{
  isOpen: boolean; onClose: () => void; filters: FilterState; totalItems: number;
  onFilterChange: <K extends keyof FilterState>(key: K, value: FilterState[K]) => void;
  onClearFilters: () => void; activeFilterCount: number;
  suppliers: Supplier[]; locations: Location[];
}> = ({ isOpen, onClose, filters, totalItems, onFilterChange, onClearFilters, activeFilterCount, suppliers, locations }) => {
  const sel = "w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 outline-none transition text-gray-700";
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40" onClick={onClose} />
          <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-full sm:w-80 bg-white shadow-2xl z-50 flex flex-col">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-900 rounded-xl flex items-center justify-center">
                  <SlidersHorizontal className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Filters</h3>
                  {activeFilterCount > 0 && <p className="text-[11px] text-gray-400">{activeFilterCount} active</p>}
                </div>
              </div>
              <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 transition-colors">
                <X size={15} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2.5">Status</p>
                <div className="space-y-1">
                  {(["all", "draft", "pending", "approved", "received", "cancelled"] as const).map((s) => (
                    <button key={s} onClick={() => onFilterChange("status", s)}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${filters.status === s ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-600 hover:bg-gray-100"}`}>
                      <span className="capitalize">{s === "all" ? "All Status" : s}</span>
                      {filters.status === s && <CheckCircle className="h-3.5 w-3.5" />}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2.5">Supplier</p>
                <select value={filters.supplier} onChange={(e) => onFilterChange("supplier", e.target.value)} className={sel}>
                  <option value="all">All Suppliers</option>
                  {suppliers.map((s) => <option key={s.id} value={s.id.toString()}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2.5">Location</p>
                <select value={filters.location} onChange={(e) => onFilterChange("location", e.target.value)} className={sel}>
                  <option value="all">All Locations</option>
                  {locations.map((l) => <option key={l.id} value={l.location_id}>{l.location_name}</option>)}
                </select>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2.5">Date Range</p>
                <div className="space-y-2.5">
                  <div>
                    <label className="text-xs text-gray-400 font-medium mb-1 block">From</label>
                    <input type="date" value={filters.dateFrom} onChange={(e) => onFilterChange("dateFrom", e.target.value)} className={sel} />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 font-medium mb-1 block">To</label>
                    <input type="date" value={filters.dateTo} onChange={(e) => onFilterChange("dateTo", e.target.value)} className={sel} />
                  </div>
                </div>
              </div>
            </div>
            <div className="p-5 border-t border-gray-100 bg-gray-50/50 flex-shrink-0">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-gray-500"><span className="font-bold text-gray-800">{totalItems}</span> orders found</p>
                {activeFilterCount > 0 && (
                  <button onClick={onClearFilters} className="text-xs font-bold text-gray-900 hover:underline inline-flex items-center gap-1">
                    <FilterX size={12} /> Clear all
                  </button>
                )}
              </div>
              <button onClick={onClose} className="w-full py-2.5 bg-gray-900 text-white text-sm font-bold rounded-xl hover:bg-gray-800 transition-colors">
                Apply Filters
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// ============================================================
// ActionMenu
// ============================================================
const ActionMenu: React.FC<{
  order: PurchaseOrder;
  onView: (o: PurchaseOrder) => void; onEdit: (o: PurchaseOrder) => void;
  onDelete: (o: PurchaseOrder) => void; onUpdateStatus: (id: number, status: PurchaseOrder["status"]) => void;
}> = ({ order, onView, onEdit, onDelete, onUpdateStatus }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)}
        className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
        <MoreHorizontal className="h-4 w-4" />
      </button>
      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: -4 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -4 }} transition={{ duration: 0.1 }}
              className="absolute right-0 top-10 z-40 w-44 bg-white border border-gray-100 rounded-xl shadow-xl shadow-gray-900/10 overflow-hidden">
              <button onClick={() => { onView(order); setOpen(false); }}
                className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition">
                <Eye className="h-3.5 w-3.5 text-gray-400" /> View Details
              </button>
              {order.status === "draft" && (
                <button onClick={() => { onEdit(order); setOpen(false); }}
                  className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition">
                  <Edit className="h-3.5 w-3.5 text-gray-400" /> Edit Order
                </button>
              )}
              {order.status === "pending" && (
                <button onClick={() => { onUpdateStatus(order.id, "approved"); setOpen(false); }}
                  className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm font-medium text-blue-600 hover:bg-blue-50 transition">
                  <CheckCircle className="h-3.5 w-3.5" /> Approve
                </button>
              )}
              {order.status === "approved" && (
                <button onClick={() => { onUpdateStatus(order.id, "received"); setOpen(false); }}
                  className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm font-medium text-emerald-600 hover:bg-emerald-50 transition">
                  <CheckCheck className="h-3.5 w-3.5" /> Mark Received
                </button>
              )}
              {(order.status === "draft" || order.status === "pending") && (
                <>
                  <div className="h-px bg-gray-100 mx-2" />
                  <button onClick={() => { onDelete(order); setOpen(false); }}
                    className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm font-medium text-rose-600 hover:bg-rose-50 transition">
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </button>
                </>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

// ============================================================
// Grid Card
// ============================================================
const PurchaseOrderCard: React.FC<{
  order: PurchaseOrder;
  onView: (o: PurchaseOrder) => void; onEdit: (o: PurchaseOrder) => void;
  onDelete: (o: PurchaseOrder) => void; onUpdateStatus: (id: number, status: PurchaseOrder["status"]) => void;
  formatCurrency: (amount: number) => string;
}> = ({ order, onView, onEdit, onDelete, onUpdateStatus, formatCurrency }) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200 transition-all overflow-hidden">
    <div className="p-5">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-center flex-shrink-0">
            <Package className="h-4.5 w-4.5 text-gray-400" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-gray-900 font-mono truncate">{order.po_number}</p>
            <p className="text-xs text-gray-400 truncate">{order.supplier?.name || "—"}</p>
          </div>
        </div>
        <ActionMenu order={order} onView={onView} onEdit={onEdit} onDelete={onDelete} onUpdateStatus={onUpdateStatus} />
      </div>
      {order.location && (
        <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-3">
          <MapPin className="h-3 w-3 flex-shrink-0" />
          <span className="truncate">{order.location.location_name}</span>
        </div>
      )}
      <div className="space-y-2 pt-3 border-t border-gray-50">
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-gray-400 font-medium">Order Date</span>
          <span className="text-xs font-semibold text-gray-700">{formatDate(order.order_date)}</span>
        </div>
        {order.expected_delivery_date && (
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-gray-400 font-medium">Expected</span>
            <span className="text-xs font-semibold text-gray-700">{formatDate(order.expected_delivery_date)}</span>
          </div>
        )}
        <div className="flex items-center justify-between pt-1">
          <StatusBadge status={order.status} />
          <span className="text-base font-bold text-gray-900">{formatCurrency(order.total_amount)}</span>
        </div>
      </div>
    </div>
    <div className="px-5 py-3 bg-gray-50/50 border-t border-gray-100">
      <button onClick={() => onView(order)} className="w-full text-xs font-bold text-gray-400 hover:text-gray-900 transition-colors">
        View Details →
      </button>
    </div>
  </div>
);

// ============================================================
// Table Row
// ============================================================
const PurchaseOrderTableRow: React.FC<{
  order: PurchaseOrder; index: number;
  onView: (o: PurchaseOrder) => void; onEdit: (o: PurchaseOrder) => void;
  onDelete: (o: PurchaseOrder) => void; onUpdateStatus: (id: number, status: PurchaseOrder["status"]) => void;
  formatCurrency: (amount: number) => string;
}> = ({ order, index, onView, onEdit, onDelete, onUpdateStatus, formatCurrency }) => (
  <tr className="hover:bg-[#080e16]/[0.015] transition-colors group border-b border-gray-100 last:border-0">
    <td className="px-5 py-3.5 text-xs text-gray-400 font-medium tabular-nums">{index + 1}</td>
    <td className="px-5 py-3.5">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-center flex-shrink-0">
          <Package className="h-4 w-4 text-gray-300" />
        </div>
        <span className="text-sm font-bold text-gray-900 font-mono">{order.po_number}</span>
      </div>
    </td>
    <td className="px-5 py-3.5">
      <div className="flex items-center gap-2">
        <Building2 className="h-3.5 w-3.5 text-gray-300 flex-shrink-0" />
        <span className="text-sm text-gray-700 font-medium">{order.supplier?.name || "—"}</span>
      </div>
    </td>
    <td className="px-5 py-3.5">
      <div className="flex items-center gap-2">
        <MapPin className="h-3.5 w-3.5 text-gray-300 flex-shrink-0" />
        <span className="text-sm text-gray-600">{order.location?.location_name || "—"}</span>
      </div>
    </td>
    <td className="px-5 py-3.5 text-sm text-gray-600">{formatDate(order.order_date)}</td>
    <td className="px-5 py-3.5 text-sm text-gray-600">{formatDate(order.expected_delivery_date)}</td>
    <td className="px-5 py-3.5 text-right">
      <span className="text-sm font-bold text-gray-900">{formatCurrency(order.total_amount)}</span>
    </td>
    <td className="px-5 py-3.5"><StatusBadge status={order.status} /></td>
    <td className="px-5 py-3.5 text-right">
      <ActionMenu order={order} onView={onView} onEdit={onEdit} onDelete={onDelete} onUpdateStatus={onUpdateStatus} />
    </td>
  </tr>
);

// ============================================================
// Main Component
// ============================================================
const PurchaseOrdersPage = ({ user }: { user: User }) => {
  const router = useRouter();
  const symbol = user?.businesses_one?.[0]?.currency || "$";
  const formatCurr = (n: number) => formatCurrency(n, symbol);

  if (user?.user_roles?.purchase_read !== "yes") redirect("/errors");

  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [filters, setFilters] = useState<FilterState>({ search: "", status: "all", supplier: "all", location: "all", dateFrom: "", dateTo: "" });
  const debouncedSearch = useDebounce(filters.search, 300);

  useEffect(() => { fetchPurchaseOrders(); fetchSuppliers(); fetchLocations(); }, []);

  const fetchPurchaseOrders = async () => {
    setIsLoading(true);
    try {
      const res = await apiGet("/product_purchase", {}, false);
      const arr = Array.isArray(res.data?.data) ? res.data.data : Array.isArray(res.data) ? res.data : [];
      setOrders(arr.map((o: any) => ({
        id: o.id, encrypted_id: o.encrypted_id || o.id,
        po_number: o.order_number || `PO-${o.id}`, order_number: o.order_number,
        supplier_id: o.vendors_id || o.supplier_id, vendor_id: o.vendors_id,
        supplier: o.vendor ? { id: o.vendor.id || o.vendor.vid, name: o.vendor.vendor_name || o.vendor.name, email: o.vendor.email, phone: o.vendor.phone, contact_person: o.vendor.contact_person } : undefined,
        location_id: o.location_id, location_uuid: o.location?.location_id || null,
        location: o.location ? { id: o.location.id, location_id: o.location.location_id, name: o.location.name || o.location.location_name, location_name: o.location.location_name || o.location.name } : undefined,
        order_date: o.order_date, expected_delivery_date: o.expected_delivery_date,
        status: o.status || "pending", total_amount: parseFloat(o.total_amount) || 0,
        created_at: o.created_at, updated_at: o.updated_at,
      })));
    } catch { toast.error("Failed to fetch purchase orders"); setOrders([]); }
    finally { setIsLoading(false); }
  };

  const fetchSuppliers = async () => {
    try {
      const res = await apiGet("/vendors", {}, false);
      const data = res.data?.data?.vendors || res.data?.data || res.data || [];
      const arr = Array.isArray(data) ? data : [];
      setSuppliers(arr.map((v: any) => ({ id: v.vid || v.id, name: v.vendor_name || v.name, email: v.email, phone: v.phone, contact_person: v.contact_person })));
    } catch { setSuppliers([]); }
  };

  const fetchLocations = async () => {
    try {
      const res = await apiGet("/locations", {}, false);
      const arr = res.data?.locations || res.data?.data?.locations || res.data?.data || res.data || [];
      setLocations((Array.isArray(arr) ? arr : []).map((l: any) => ({ id: l.id, location_id: l.location_id, name: l.location_name || l.name, location_name: l.location_name || l.name })));
    } catch { setLocations([]); }
  };

  const handleDelete = async () => {
    if (isSubmitting || !selectedOrder) return;
    setIsSubmitting(true);
    try {
      await apiDelete(`/product_purchase_delete/${selectedOrder.encrypted_id}`);
      setOrders((prev) => prev.filter((o) => o.id !== selectedOrder.id));
      toast.success("Purchase order deleted");
      setDeleteModalOpen(false); setSelectedOrder(null);
    } catch { toast.error("Failed to delete"); fetchPurchaseOrders(); }
    finally { setIsSubmitting(false); }
  };

  const handleUpdateStatus = async (id: number, status: PurchaseOrder["status"]) => {
    try {
      await apiPut(`/product_purchase/${id}`, { status });
      setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
      toast.success(`Status updated to ${status}`);
    } catch { toast.error("Failed to update status"); }
  };

  const handleView = (o: PurchaseOrder) => router.push(`/purchaselist/${o.encrypted_id}`);
  const handleEdit = (o: PurchaseOrder) => router.push(`/purchase-orders/edit/${o.encrypted_id}`);
  const handleFilterChange = <K extends keyof FilterState>(key: K, value: FilterState[K]) => { setFilters((p) => ({ ...p, [key]: value })); setCurrentPage(1); };
  const clearFilters = () => { setFilters({ search: "", status: "all", supplier: "all", location: "all", dateFrom: "", dateTo: "" }); setCurrentPage(1); };

  const activeFilterCount = useMemo(() => {
    let c = 0;
    if (filters.status !== "all") c++; if (filters.supplier !== "all") c++;
    if (filters.location !== "all") c++; if (filters.dateFrom) c++;
    if (filters.dateTo) c++; if (filters.search) c++;
    return c;
  }, [filters]);

  const filteredOrders = useMemo(() => orders.filter((o) => {
    const ms = !debouncedSearch || o.po_number.toLowerCase().includes(debouncedSearch.toLowerCase()) || o.supplier?.name?.toLowerCase().includes(debouncedSearch.toLowerCase());
    const mst = filters.status === "all" || o.status === filters.status;
    const msup = filters.supplier === "all" || o.supplier_id?.toString() === filters.supplier || o.vendor_id?.toString() === filters.supplier;
    const mloc = filters.location === "all" || o.location_uuid === filters.location;
    let mdate = true;
    if (filters.dateFrom || filters.dateTo) {
      const od = new Date(o.order_date); od.setHours(0, 0, 0, 0);
      if (filters.dateFrom) { const fd = new Date(filters.dateFrom); fd.setHours(0, 0, 0, 0); if (od < fd) mdate = false; }
      if (filters.dateTo) { const td = new Date(filters.dateTo); td.setHours(23, 59, 59, 999); if (od > td) mdate = false; }
    }
    return ms && mst && msup && mloc && mdate;
  }).sort((a, b) => new Date(b.order_date).getTime() - new Date(a.order_date).getTime()), [orders, debouncedSearch, filters]);

  const totalItems = filteredOrders.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const currentOrders = filteredOrders.slice(startIndex, endIndex);

  const stats = useMemo((): Statistics => ({
    totalOrders: orders.length,
    pendingOrders: orders.filter((o) => o.status === "pending").length,
    receivedOrders: orders.filter((o) => o.status === "received").length,
    totalValue: orders.reduce((s, o) => s + o.total_amount, 0),
    monthlyChange: 0,
  }), [orders]);

  return (
    <div className="min-h-screen bg-[#f5f5f4]">
      {/* Header */}
      <header className="bg-white border-b border-gray-100  top-0 z-40">
        <div className="max-w-screen-2xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push("/dashboard")}
              className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-800 transition-colors">
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-gray-900 tracking-tight">Purchase Orders</h1>
              <p className="text-xs text-gray-400">Manage and track your purchasing</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden md:flex bg-gray-100 rounded-xl p-1 gap-1">
              {([{ mode: "table", Icon: List }, { mode: "grid", Icon: Grid3x3 }] as const).map(({ mode, Icon }) => (
                <button key={mode} onClick={() => setViewMode(mode)}
                  className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all ${viewMode === mode ? "bg-white shadow-sm text-gray-900" : "text-gray-400 hover:text-gray-600"}`}>
                  <Icon className="h-4 w-4" />
                </button>
              ))}
            </div>
            <button onClick={fetchPurchaseOrders}
              className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors">
              <RefreshCw className="h-4 w-4" />
            </button>
            {user?.user_roles?.purchase_create !== "no" && (
              <Link href="/purchase-orders">
                <button className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white text-sm font-bold rounded-xl hover:bg-gray-800 transition-all shadow-md shadow-gray-900/15">
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">Create Order</span>
                </button>
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-screen-2xl mx-auto px-6 py-6">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
          <StatCard title="Total Orders" value={stats.totalOrders} icon={ShoppingCart} trend={stats.monthlyChange} accent="bg-gray-900" />
          <StatCard title="Pending Approval" value={stats.pendingOrders} icon={Clock} accent="bg-amber-500" />
          <StatCard title="Total Value" value={formatCurr(stats.totalValue)} icon={DollarSign} accent="bg-emerald-600" />
          <StatCard title="Received" value={stats.receivedOrders} icon={CheckCheck} accent="bg-blue-600" />
        </div>

        {/* Search + Filter Bar */}
        <div className="flex gap-3 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input type="text" value={filters.search} onChange={(e) => handleFilterChange("search", e.target.value)}
              placeholder="Search by PO number or supplier..."
              className="w-full pl-11 pr-11 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 outline-none transition text-sm placeholder-gray-300 shadow-sm font-medium" />
            {filters.search && (
              <button onClick={() => handleFilterChange("search", "")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded-full bg-gray-200 text-gray-500 hover:bg-gray-300 transition-colors">
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
          <button onClick={() => setFilterDrawerOpen(true)}
            className="relative flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all shadow-sm text-sm font-semibold text-gray-600">
            <SlidersHorizontal className="h-4 w-4" />
            <span className="hidden sm:inline">Filters</span>
            {activeFilterCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-gray-900 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
          <div className="flex md:hidden">
            <button onClick={() => setViewMode(viewMode === "table" ? "grid" : "table")}
              className="w-10 h-10 flex items-center justify-center bg-white border border-gray-200 rounded-xl hover:bg-gray-50 shadow-sm text-gray-500">
              {viewMode === "table" ? <Grid3x3 className="h-4 w-4" /> : <List className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Status Chips */}
        <div className="flex items-center gap-2 mb-5 overflow-x-auto pb-1">
          {([
            { label: "All", s: "all" as const, Icon: undefined },
            { label: "Draft", s: "draft" as const, Icon: FileText },
            { label: "Pending", s: "pending" as const, Icon: Clock },
            { label: "Approved", s: "approved" as const, Icon: CheckCircle },
            { label: "Received", s: "received" as const, Icon: CheckCheck },
          ]).map(({ label, s, Icon }) => {
            const active = filters.status === s;
            return (
              <button key={s} onClick={() => handleFilterChange("status", s)}
                className={`flex-shrink-0 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all border ${active ? "bg-gray-900 text-white border-gray-900 shadow-sm" : "bg-white text-gray-500 border-gray-200 hover:border-gray-300 hover:bg-gray-50"}`}>
                {Icon && <Icon className="h-3 w-3" />} {label}
              </button>
            );
          })}
          {activeFilterCount > 0 && (
            <button onClick={clearFilters} className="flex-shrink-0 ml-auto flex items-center gap-1 text-xs font-bold text-gray-700 hover:underline">
              <FilterX className="h-3.5 w-3.5" /> Clear
            </button>
          )}
        </div>

        {/* Result count */}
        <p className="text-xs text-gray-400 mb-4 font-medium">
          Showing <span className="text-gray-700 font-bold">{totalItems > 0 ? startIndex + 1 : 0}–{endIndex}</span> of <span className="text-gray-700 font-bold">{totalItems}</span> orders
        </p>

        {/* Content */}
        {isLoading ? <LoadingState /> :
          currentOrders.length === 0 ? (
            <EmptyState
              title={filters.search || activeFilterCount > 0 ? "No orders found" : "No purchase orders"}
              description={filters.search || activeFilterCount > 0 ? "Try adjusting your search or filters." : "Get started by creating your first purchase order."}
              icon={ShoppingCart}
              action={filters.search || activeFilterCount > 0 ? { label: "Clear Filters", onClick: clearFilters } : { label: "Create Purchase Order", href: "/purchase-orders" }}
            />
          ) : viewMode === "grid" ? (
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                <AnimatePresence>
                  {currentOrders.map((o) => (
                    <PurchaseOrderCard key={o.id} order={o} onView={handleView} onEdit={handleEdit}
                      onDelete={(x) => { setSelectedOrder(x); setDeleteModalOpen(true); }}
                      onUpdateStatus={handleUpdateStatus} formatCurrency={formatCurr} />
                  ))}
                </AnimatePresence>
              </div>
              {totalPages > 1 && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <Pagination currentPage={currentPage} totalPages={totalPages} totalItems={totalItems}
                    startIndex={startIndex} endIndex={endIndex} itemsPerPage={itemsPerPage}
                    onPageChange={setCurrentPage} onItemsPerPageChange={setItemsPerPage} />
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      {["#", "PO Number", "Supplier", "Location", "Order Date", "Expected", "Total", "Status", ""].map((h, i) => (
                        <th key={i} className={`px-5 py-3.5 text-[10px] font-bold uppercase tracking-widest text-gray-400 bg-stone-50/70 ${h === "Total" ? "text-right" : "text-left"}`}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {currentOrders.map((o, i) => (
                      <PurchaseOrderTableRow key={o.id} order={o} index={startIndex + i}
                        onView={handleView} onEdit={handleEdit}
                        onDelete={(x) => { setSelectedOrder(x); setDeleteModalOpen(true); }}
                        onUpdateStatus={handleUpdateStatus} formatCurrency={formatCurr} />
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination currentPage={currentPage} totalPages={totalPages} totalItems={totalItems}
                startIndex={startIndex} endIndex={endIndex} itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage} onItemsPerPageChange={setItemsPerPage} />
            </div>
          )
        }
      </main>

      <FilterDrawer isOpen={filterDrawerOpen} onClose={() => setFilterDrawerOpen(false)}
        filters={filters} totalItems={totalItems} onFilterChange={handleFilterChange}
        onClearFilters={clearFilters} activeFilterCount={activeFilterCount}
        suppliers={suppliers} locations={locations} />

      <DeleteModal isOpen={deleteModalOpen}
        onClose={() => { setDeleteModalOpen(false); setSelectedOrder(null); }}
        onConfirm={handleDelete} poNumber={selectedOrder?.po_number || ""} isSubmitting={isSubmitting} />
    </div>
  );
};

export default withAuth(PurchaseOrdersPage);