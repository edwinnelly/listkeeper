"use client";
import { countries } from "@/app/component/country-list";
import { withAuth } from "@/hoc/withAuth";
import { apiGet, apiPut, apiPost } from "@/lib/axios";
import React, { useState, useEffect, useMemo } from "react";
import {
  Plus,
  Edit,
  Trash2,
  Search,
  MoreVertical,
  X,
  AlertTriangle,
  ArrowLeft,
  Loader2,
  Filter,
  RefreshCw,
  User,
  Building,
  Mail,
  Phone,
  MapPin,
  Globe,
  FileText,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Building2,
  Briefcase,
  CreditCard,
  Calendar,
  Users,
  Eye,
  SlidersHorizontal,
  FilterX,
  Star,
  TrendingUp,
  TrendingDown,
  Hash,
  Layers,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";
import { toast } from "react-hot-toast";
import ShortTextWithTooltip from "../component/shorten_len";

// ... [Keep all TypeScript interfaces as they are] ...

interface User {
  id: number;
  name: string;
  email: string;
  role?: string;
}

interface Vendor {
  id: number;
  created_at: string;
  updated_at: string;
  owner_id: number;
  business_key: string;
  location_id: string;
  vendor_name: string;
  contact_person: string | null;
  email: string;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string;
  postal_code: string | null;
  industry: string | null;
  tax_id: string | null;
  registration_number: string | null;
  website: string | null;
  bank_name: string | null;
  bank_account_number: string | null;
  bank_account_name: string | null;
  is_active: boolean;
  notes: string | null;
  owner?: {
    id: number;
    name: string;
    email: string;
  };
  business?: {
    business_key: string;
    business_name: string;
  };
  location?: {
    id: string;
    location_name: string;
  };
}

// ... [Keep all other interfaces as they are] ...

interface VendorFormData {
  vendor_name: string;
  contact_person: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postal_code: string;
  industry: string;
  tax_id: string;
  registration_number: string;
  website: string;
  bank_name: string;
  bank_account_number: string;
  bank_account_name: string;
  is_active: boolean;
  notes: string;
  location_id: string;
  business_key: string;
}

interface Business {
  business_key: string;
  business_name: string;
}

interface BusinessLocation {
  id: string;
  location_name: string;
  business_key: string;
}

interface ApiError {
  response?: {
    status?: number;
    data?: {
      message?: string;
      errors?: Record<string, string[]>;
    };
  };
  userMessage?: string;
}

interface VendorApiResponse {
  data?: {
    data?: {
      vendors?: Vendor[];
    };
    vendors?: Vendor[];
  };
  vendors?: Vendor[];
}

interface BusinessApiResponse {
  data?: {
    data?: Business[];
    businesses?: Business[];
  };
  businesses?: Business[];
}

interface LocationApiResponse {
  data?: {
    data?: BusinessLocation[];
    locations?: BusinessLocation[];
  };
  locations?: BusinessLocation[];
}

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

const Badge: React.FC<{
  children: React.ReactNode;
  variant: "active" | "inactive" | "featured" | "sale";
}> = ({ children, variant }) => {
  const styles = {
    active: "bg-emerald-50 text-emerald-700 border border-emerald-200 ring-1 ring-emerald-100",
    inactive: "bg-stone-100 text-stone-500 border border-stone-200",
    featured: "bg-amber-50 text-amber-700 border border-amber-200",
    sale: "bg-rose-50 text-rose-700 border border-rose-200",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold tracking-wide ${styles[variant]}`}>
      {children}
    </span>
  );
};

const VendorAvatar: React.FC<{
  vendorName: string;
  className?: string;
}> = ({ vendorName, className = "w-10 h-10" }) => {
  const initials = vendorName
    .split(" ")
    .map(word => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className={`${className} bg-[#080e16]/5 rounded-xl flex items-center justify-center flex-shrink-0 border border-[#080e16]/10`}>
      <span className="text-xs font-bold text-[#09121d]/60">{initials}</span>
    </div>
  );
};

const EmptyState: React.FC<{
  title: string;
  description: string;
  icon: React.ElementType;
  action?: { label: string; onClick?: () => void; href?: string };
}> = ({ title, description, icon: Icon, action }) => (
  <div className="bg-white rounded-2xl border border-stone-100 shadow-sm py-20">
    <div className="flex flex-col items-center text-center max-w-sm mx-auto">
      <div className="w-16 h-16 bg-[#080e16]/5 rounded-2xl flex items-center justify-center mb-5 border border-[#080e16]/10">
        <Icon className="h-8 w-8 text-[#09121d]/40" />
      </div>
      <h3 className="text-base font-semibold text-stone-800 mb-1.5">{title}</h3>
      <p className="text-sm text-stone-400 mb-6 leading-relaxed">{description}</p>
      {action && (
        action.href ? (
          <Link href={action.href} className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#080e16] text-white text-sm font-semibold rounded-xl hover:bg-[#2c4c6e] transition-all shadow-lg shadow-[#080e16]/20">
            <Plus className="h-4 w-4" /> {action.label}
          </Link>
        ) : (
          <button onClick={action.onClick} className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#080e16] text-white text-sm font-semibold rounded-xl hover:bg-[#2c4c6e] transition-all shadow-lg shadow-[#080e16]/20">
            <Plus className="h-4 w-4" /> {action.label}
          </button>
        )
      )}
    </div>
  </div>
);

const LoadingState: React.FC = () => (
  <div className="bg-white rounded-2xl border border-stone-100 shadow-sm py-20">
    <div className="flex flex-col items-center justify-center">
      <div className="relative w-14 h-14 mb-5">
        <div className="w-14 h-14 rounded-full border-[3px] border-[#080e16]/10" />
        <div className="absolute inset-0 w-14 h-14 rounded-full border-[3px] border-[#080e16] border-t-transparent animate-spin" />
        <Users className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-5 w-5 text-[#09121d]/50" />
      </div>
      <p className="text-sm font-semibold text-stone-700">Loading vendors</p>
      <p className="text-xs text-stone-400 mt-1">Please wait a moment</p>
    </div>
  </div>
);

// ==============================================
// Filter Drawer
// ==============================================
const FilterDrawer: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  statusFilter: string;
  industryFilter: string;
  industries: string[];
  totalItems: number;
  onStatusChange: (value: string) => void;
  onIndustryChange: (value: string) => void;
  onClearFilters: () => void;
  activeFilterCount: number;
}> = ({ isOpen, onClose, statusFilter, industryFilter, industries, totalItems, onStatusChange, onIndustryChange, onClearFilters, activeFilterCount }) => {
  if (!isOpen) return null;

  const selectCls = "w-full px-3 py-2.5 bg-white border border-stone-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#080e16]/10 focus:border-[#080e16] outline-none transition text-stone-700";

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-80 bg-white shadow-2xl flex flex-col">
        <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-[#080e16]/5 rounded-lg flex items-center justify-center">
              <SlidersHorizontal className="h-4 w-4 text-[#09121d]" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-stone-900">Filters</h3>
              {activeFilterCount > 0 && (
                <p className="text-[11px] text-stone-400">{activeFilterCount} active</p>
              )}
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-stone-100 text-stone-400 transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          <div>
            <label className="text-[11px] font-bold text-stone-400 uppercase tracking-widest mb-2 block">Status</label>
            <select value={statusFilter} onChange={(e) => onStatusChange(e.target.value)} className={selectCls}>
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-bold text-stone-400 uppercase tracking-widest mb-2 block">Industry</label>
            <select value={industryFilter} onChange={(e) => onIndustryChange(e.target.value)} className={selectCls}>
              <option value="all">All Industries</option>
              {industries.map((industry) => (
                <option key={industry} value={industry}>{industry}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="p-5 border-t border-stone-100 bg-stone-50/50">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-stone-500">
              <span className="font-bold text-stone-800">{totalItems}</span> vendors found
            </p>
            {activeFilterCount > 0 && (
              <button onClick={onClearFilters} className="text-xs text-[#09121d] font-semibold hover:underline inline-flex items-center gap-1">
                <FilterX size={12} /> Clear all
              </button>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-full py-3 bg-[#080e16] text-white text-sm font-bold rounded-xl hover:bg-[#2c4c6e] transition-colors shadow-sm shadow-[#080e16]/20"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
};

// ==============================================
// Vendor Table Row
// ==============================================
const VendorTableRow: React.FC<{
  vendor: Vendor;
  index: number;
  startIndex: number;
  onView: (v: Vendor) => void;
  onEdit: (v: Vendor) => void;
  onDelete: (v: Vendor) => void;
  isOpen: boolean;
  onToggleOpen: (id: number | null) => void;
}> = ({ vendor, index, startIndex, onView, onEdit, onDelete, isOpen, onToggleOpen }) => (
  <tr className="hover:bg-[#080e16]/[0.02] transition-colors group border-b border-stone-100 last:border-0">
    <td className="px-5 py-3.5 text-xs text-stone-400 font-medium tabular-nums w-10">
      {startIndex + index + 1}
    </td>
    <td className="px-5 py-3.5">
      <div className="flex items-center gap-3">
        <VendorAvatar vendorName={vendor.vendor_name} />
        <div className="min-w-0">
          <div className="text-sm font-semibold text-stone-800 truncate">
            <ShortTextWithTooltip text={vendor.vendor_name} max={30} />
          </div>
          <div className="flex items-center gap-1 mt-0.5">
            <Briefcase className="h-2.5 w-2.5 text-stone-400" />
            <span className="text-[11px] text-stone-400">{vendor.industry || "No industry"}</span>
          </div>
        </div>
      </div>
    </td>
    <td className="px-5 py-3.5 hidden lg:table-cell">
      <div className="space-y-0.5">
        <div className="flex items-center gap-1.5 text-xs text-stone-600">
          <Mail className="h-3 w-3 text-stone-400" />
          <span className="truncate max-w-[150px]">{vendor.email}</span>
        </div>
        {vendor.phone && (
          <div className="flex items-center gap-1.5 text-xs text-stone-500">
            <Phone className="h-3 w-3 text-stone-400" />
            <span>{vendor.phone}</span>
          </div>
        )}
      </div>
    </td>
    <td className="px-5 py-3.5 hidden md:table-cell">
      <div className="flex items-center gap-1.5 text-xs text-stone-600">
        <MapPin className="h-3 w-3 text-stone-400 flex-shrink-0" />
        <span className="truncate max-w-[120px]">
          {vendor.city && vendor.state ? `${vendor.city}, ${vendor.state}` : "—"}
        </span>
      </div>
    </td>
    <td className="px-5 py-3.5">
      <Badge variant={vendor.is_active ? "active" : "inactive"}>
        {vendor.is_active ? (
          <><CheckCircle className="h-2.5 w-2.5 mr-1" /> Active</>
        ) : (
          <><XCircle className="h-2.5 w-2.5 mr-1" /> Inactive</>
        )}
      </Badge>
    </td>
    <td className="px-5 py-3.5 text-xs text-stone-500">
      {new Date(vendor.created_at).toLocaleDateString("en-US", {
        month: "short", day: "numeric", year: "numeric"
      })}
    </td>
    <td className="px-5 py-3.5 relative">
      <button
        onClick={() => onToggleOpen(isOpen ? null : vendor.id)}
        className="w-8 h-8 flex items-center justify-center rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors"
      >
        <MoreVertical className="h-4 w-4" />
      </button>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => onToggleOpen(null)} />
          <div className="absolute right-4 top-full mt-1 z-40 w-44 bg-white border border-stone-100 rounded-xl shadow-xl shadow-stone-900/10 overflow-hidden">
            {[
              { label: "View Details", icon: Eye, cls: "text-[#09121d]", action: () => { onView(vendor); onToggleOpen(null); } },
              { label: "Edit Vendor", icon: Edit, cls: "text-stone-500", action: () => { onEdit(vendor); onToggleOpen(null); } },
              { label: "Delete", icon: Trash2, cls: "text-rose-500", action: () => { onDelete(vendor); onToggleOpen(null); }, danger: true },
            ].map(({ label, icon: Icon, cls, action, danger }) => (
              <button
                key={label}
                onClick={action}
                className={`flex items-center gap-2.5 w-full px-4 py-2.5 text-sm font-medium transition-colors ${
                  danger
                    ? "text-rose-600 hover:bg-rose-50 border-t border-stone-100"
                    : "text-stone-700 hover:bg-stone-50"
                }`}
              >
                <Icon className={`h-3.5 w-3.5 ${cls}`} />
                {label}
              </button>
            ))}
          </div>
        </>
      )}
    </td>
  </tr>
);

// ==============================================
// Pagination
// ==============================================
const Pagination: React.FC<{
  currentPage: number;
  totalPages: number;
  totalItems: number;
  startIndex: number;
  endIndex: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (items: number) => void;
}> = ({ currentPage, totalPages, totalItems, startIndex, endIndex, itemsPerPage, onPageChange, onItemsPerPageChange }) => {
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      let start = Math.max(2, currentPage - 1);
      let end = Math.min(totalPages - 1, currentPage + 1);
      if (currentPage <= 3) end = 4;
      if (currentPage >= totalPages - 2) start = totalPages - 3;
      if (start > 2) pages.push("...");
      for (let i = start; i <= end; i++) pages.push(i);
      if (end < totalPages - 1) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };

  if (totalPages <= 1) return null;

  return (
    <div className="px-6 py-4 border-t border-stone-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-stone-50/50">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-stone-500 font-medium">Rows</span>
          <select
            value={itemsPerPage}
            onChange={(e) => { onItemsPerPageChange(Number(e.target.value)); onPageChange(1); }}
            className="px-2 py-1.5 text-xs border border-stone-200 rounded-lg bg-white focus:ring-2 focus:ring-[#080e16]/10 focus:border-[#080e16] outline-none font-medium"
          >
            {[10, 25, 50, 100].map((v) => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>
        <span className="text-xs text-stone-400">
          {totalItems > 0 ? startIndex + 1 : 0}–{endIndex} of {totalItems}
        </span>
      </div>
      <div className="flex items-center gap-1">
        {[
          { action: () => onPageChange(1), icon: ChevronsLeft, disabled: currentPage === 1 },
          { action: () => onPageChange(currentPage - 1), icon: ChevronLeft, disabled: currentPage === 1 },
        ].map(({ action, icon: Icon, disabled }, i) => (
          <button key={i} onClick={action} disabled={disabled}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-stone-200 text-stone-500 hover:bg-stone-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
            <Icon className="h-3.5 w-3.5" />
          </button>
        ))}
        <div className="flex items-center gap-1 mx-1">
          {getPageNumbers().map((page, index) => (
            <React.Fragment key={index}>
              {page === "..." ? (
                <span className="w-8 h-8 flex items-center justify-center text-stone-400 text-xs">…</span>
              ) : (
                <button
                  onClick={() => onPageChange(page as number)}
                  className={`w-8 h-8 rounded-lg text-xs font-semibold transition-all ${
                    currentPage === page
                      ? "bg-[#080e16] text-white shadow-sm shadow-[#080e16]/30"
                      : "text-stone-600 hover:bg-stone-100 border border-stone-200"
                  }`}
                >
                  {page}
                </button>
              )}
            </React.Fragment>
          ))}
        </div>
        {[
          { action: () => onPageChange(currentPage + 1), icon: ChevronRight, disabled: currentPage === totalPages },
          { action: () => onPageChange(totalPages), icon: ChevronsRight, disabled: currentPage === totalPages },
        ].map(({ action, icon: Icon, disabled }, i) => (
          <button key={i} onClick={action} disabled={disabled}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-stone-200 text-stone-500 hover:bg-stone-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
            <Icon className="h-3.5 w-3.5" />
          </button>
        ))}
      </div>
    </div>
  );
};

// ==============================================
// Delete Modal
// ==============================================
const DeleteModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  vendorName: string;
  isSubmitting: boolean;
}> = ({ isOpen, onClose, onConfirm, vendorName, isSubmitting }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-stone-900/50 backdrop-blur-sm z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="p-6 text-center">
          <div className="w-14 h-14 flex items-center justify-center rounded-2xl bg-rose-50 border border-rose-100 mx-auto mb-4">
            <AlertTriangle className="w-6 h-6 text-rose-500" />
          </div>
          <h2 className="text-lg font-bold text-stone-900 mb-1.5">Delete Vendor</h2>
          <p className="text-sm text-stone-500 leading-relaxed mb-6">
            Are you sure you want to delete{" "}
            <span className="font-semibold text-stone-800">"{vendorName}"</span>?
            This action cannot be undone.
          </p>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2.5 rounded-xl border border-stone-200 bg-white text-stone-700 text-sm font-semibold hover:bg-stone-50 transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2.5 rounded-xl bg-rose-600 text-white text-sm font-semibold hover:bg-rose-700 transition disabled:opacity-50 inline-flex items-center justify-center gap-2"
            >
              {isSubmitting ? <><Loader2 className="h-4 w-4 animate-spin" />Deleting...</> : <><Trash2 className="h-4 w-4" />Delete</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==============================================
// Combined Modal
// ==============================================
const CombinedModal: React.FC<{
  title: React.ReactNode;
  children: React.ReactNode;
  onClose: () => void;
}> = ({ title, children, onClose }) => (
  <div
    className="fixed inset-0 flex items-center justify-center bg-stone-900/50 backdrop-blur-sm z-50 p-4"
    onClick={onClose}
  >
    <div
      className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-stone-100 px-6 py-4 flex items-center justify-between z-10">
        {title}
        <button
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center text-stone-400 hover:text-stone-600 transition hover:bg-stone-100 rounded-lg"
          aria-label="Close modal"
        >
          <X size={20} />
        </button>
      </div>
      <div className="p-6">{children}</div>
    </div>
  </div>
);

// ==============================================
// View Vendor Modal
// ==============================================
const ViewVendorModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  vendor: Vendor | null;
  onEdit: (v: Vendor) => void;
}> = ({ isOpen, onClose, vendor, onEdit }) => {
  if (!isOpen || !vendor) return null;

  const InfoRow = ({ label, value, valueClass = "" }: { label: string; value: React.ReactNode; valueClass?: string }) => (
    <div className="flex items-start justify-between py-2.5 border-b border-stone-50 last:border-0">
      <span className="text-xs text-stone-400 font-medium">{label}</span>
      <span className={`text-xs font-semibold text-stone-800 text-right max-w-[55%] ${valueClass}`}>{value}</span>
    </div>
  );

  const Section = ({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) => (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <div className="w-6 h-6 bg-[#080e16]/5 rounded-lg flex items-center justify-center">
          <Icon className="h-3.5 w-3.5 text-[#09121d]/60" />
        </div>
        <h3 className="text-xs font-bold text-stone-500 uppercase tracking-widest">{title}</h3>
      </div>
      <div className="bg-stone-50 rounded-xl px-4 border border-stone-100">{children}</div>
    </div>
  );

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-stone-900/50 backdrop-blur-sm z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-stone-100 px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3.5">
            <VendorAvatar vendorName={vendor.vendor_name} className="w-11 h-11" />
            <div>
              <h2 className="text-base font-bold text-stone-900">{vendor.vendor_name}</h2>
              <p className="text-xs text-stone-400">{vendor.industry || "No industry specified"}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-5">
              <Section icon={User} title="Contact Information">
                <InfoRow label="Contact Person" value={vendor.contact_person || "—"} />
                <InfoRow label="Email" value={
                  <a href={`mailto:${vendor.email}`} className="text-[#09121d] hover:underline">{vendor.email}</a>
                } />
                <InfoRow label="Phone" value={vendor.phone || "—"} />
                <InfoRow label="Website" value={
                  vendor.website ? (
                    <a href={vendor.website.startsWith("http") ? vendor.website : `https://${vendor.website}`} target="_blank" rel="noopener noreferrer" className="text-[#09121d] hover:underline truncate block">{vendor.website}</a>
                  ) : "—"
                } />
              </Section>

              <Section icon={Building} title="Business Details">
                <InfoRow label="Business" value={vendor.business?.business_name || vendor.business_key || "—"} />
                <InfoRow label="Location" value={vendor.location?.location_name || "—"} />
                <InfoRow label="Status" value={
                  <Badge variant={vendor.is_active ? "active" : "inactive"}>
                    {vendor.is_active ? "Active" : "Inactive"}
                  </Badge>
                } />
              </Section>
            </div>

            <div className="space-y-5">
              <Section icon={MapPin} title="Address">
                <InfoRow label="Address" value={vendor.address || "—"} />
                <InfoRow label="City" value={vendor.city || "—"} />
                <InfoRow label="State" value={vendor.state || "—"} />
                <InfoRow label="Country" value={vendor.country || "—"} />
                <InfoRow label="Postal Code" value={vendor.postal_code || "—"} />
              </Section>

              <Section icon={CreditCard} title="Banking Information">
                <InfoRow label="Bank Name" value={vendor.bank_name || "—"} />
                <InfoRow label="Account Number" value={vendor.bank_account_number || "—"} />
                <InfoRow label="Account Name" value={vendor.bank_account_name || "—"} />
              </Section>
            </div>
          </div>

          <div className="space-y-5 mt-6">
            <Section icon={FileText} title="Legal & Additional">
              <InfoRow label="Tax ID/TIN" value={vendor.tax_id || "—"} />
              <InfoRow label="Registration No." value={vendor.registration_number || "—"} />
              {vendor.notes && (
                <div className="py-2.5">
                  <p className="text-xs text-stone-400 font-medium mb-1">Notes</p>
                  <p className="text-xs text-stone-700 leading-relaxed">{vendor.notes}</p>
                </div>
              )}
              <InfoRow label="Created" value={new Date(vendor.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })} />
              <InfoRow label="Updated" value={new Date(vendor.updated_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })} />
            </Section>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 mt-6 pt-5 border-t border-stone-100">
            <button onClick={onClose}
              className="px-5 py-2.5 text-sm font-semibold text-stone-600 bg-white border border-stone-200 rounded-xl hover:bg-stone-50 transition-colors">
              Close
            </button>
            <button onClick={() => { onEdit(vendor); onClose(); }}
              className="px-5 py-2.5 text-sm font-semibold text-white bg-[#080e16] rounded-xl hover:bg-[#2c4c6e] transition-all inline-flex items-center gap-2 shadow-lg shadow-[#080e16]/20">
              <Edit className="h-4 w-4" /> Edit Vendor
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
const ManageVendors = ({ user }: { user: User }) => {
  const router = useRouter();

  // Search and Filter States
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [industryFilter, setIndustryFilter] = useState<string>("all");

  // UI Interaction States
  const [openRow, setOpenRow] = useState<number | null>(null);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);

  // Modal States
  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);

  // Selected Item State
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);

  // Loading States
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Data States
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [locations, setLocations] = useState<BusinessLocation[]>([]);
  const [industries, setIndustries] = useState<string[]>([]);

  // Form State
  const [form, setForm] = useState<VendorFormData>({
    vendor_name: "",
    contact_person: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    country: "Netherlands",
    postal_code: "",
    industry: "",
    tax_id: "",
    registration_number: "",
    website: "",
    bank_name: "",
    bank_account_number: "",
    bank_account_name: "",
    is_active: true,
    notes: "",
    location_id: "",
    business_key: "",
  });

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const debouncedSearch = useDebounce(search, 300);

  // Fetch data on mount
  useEffect(() => {
    if (!user) return;
    fetchVendors();
    fetchBusinesses();
    fetchLocations();
  }, [user]);

  // Reset page on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, statusFilter, industryFilter]);

  const fetchVendors = async () => {
    setIsLoading(true);
    try {
      const res = await apiGet("/vendors") as { data: VendorApiResponse };
      const vendorsArray: Vendor[] = res.data?.data?.vendors ?? res.data?.data ?? res.data?.vendors ?? [];
      setVendors(Array.isArray(vendorsArray) ? vendorsArray : []);
      const uniqueIndustries = Array.from(
        new Set(
          vendorsArray
            .filter((v: Vendor) => v.industry)
            .map((v: Vendor) => v.industry),
        ),
      ) as string[];
      setIndustries(uniqueIndustries);
    } catch (err) {
      const error = err as ApiError;
      toast.error(error.response?.status === 403 ? "You don't have permission to access vendors" : "Failed to fetch vendors");
      setVendors([]);
      setIndustries([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBusinesses = async () => {
    try {
      const res = await apiGet("/businesses") as { data: BusinessApiResponse };
      const businessesArray: Business[] = res.data?.data ?? res.data?.businesses ?? [];
      setBusinesses(Array.isArray(businessesArray) ? businessesArray : []);
    } catch {
      toast.error("Failed to fetch businesses");
      setBusinesses([]);
    }
  };

  const fetchLocations = async () => {
    try {
      const res = await apiGet("/locations") as { data: LocationApiResponse };
      const locationsArray: BusinessLocation[] = res.data?.data ?? res.data?.locations ?? [];
      setLocations(Array.isArray(locationsArray) ? locationsArray : []);
    } catch {
      toast.error("Failed to fetch locations");
      setLocations([]);
    }
  };

  const resetForm = () => {
    setForm({
      vendor_name: "",
      contact_person: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      state: "",
      country: "Netherlands",
      postal_code: "",
      industry: "",
      tax_id: "",
      registration_number: "",
      website: "",
      bank_name: "",
      bank_account_number: "",
      bank_account_name: "",
      is_active: true,
      notes: "",
      location_id: "",
      business_key: "",
    });
  };

  // Filtered vendors
  const filteredVendors = useMemo(() => {
    return vendors.filter((vendor) => {
      if (!vendor) return false;
      const searchableText = [
        vendor.vendor_name || "",
        vendor.contact_person || "",
        vendor.email || "",
        vendor.phone || "",
        vendor.industry || "",
        vendor.city || "",
        vendor.state || "",
        vendor.business?.business_name || "",
        vendor.location?.location_name || "",
      ].join(" ").toLowerCase();

      const matchesSearch = searchableText.includes(debouncedSearch.toLowerCase());
      const matchesStatus = statusFilter === "all" || (statusFilter === "active" && vendor.is_active) || (statusFilter === "inactive" && !vendor.is_active);
      const matchesIndustry = industryFilter === "all" || vendor.industry === industryFilter;

      return matchesSearch && matchesStatus && matchesIndustry;
    });
  }, [vendors, debouncedSearch, statusFilter, industryFilter]);

  // Pagination calculations
  const totalItems = filteredVendors.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);

  const currentItems = useMemo(() => {
    return filteredVendors.slice(startIndex, endIndex);
  }, [filteredVendors, startIndex, endIndex]);

  const activeFilterCount = useMemo(() => {
    let c = 0;
    if (statusFilter !== "all") c++;
    if (industryFilter !== "all") c++;
    if (search) c++;
    return c;
  }, [statusFilter, industryFilter, search]);

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setIndustryFilter("all");
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  const handleItemsPerPageChange = (value: number) => {
    setItemsPerPage(value);
    setCurrentPage(1);
  };

  const validateForm = (formData: VendorFormData): string[] => {
    const errors: string[] = [];
    if (!formData.vendor_name.trim()) errors.push("Vendor name is required");
    if (!formData.email.trim()) errors.push("Email is required");
    if (!formData.location_id) errors.push("Location is required");
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) errors.push("Please enter a valid email address");
    if (formData.vendor_name.length < 2) errors.push("Vendor name must be at least 2 characters");
    if (formData.vendor_name.length > 100) errors.push("Vendor name must be less than 100 characters");
    return errors;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const errors = validateForm(form);
    if (errors.length > 0) {
      errors.forEach((error) => toast.error(error));
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await apiPost("/add_vendors", form, {}, ["/add_vendors"]) as { data?: { data?: Vendor } };
      if (response.data?.data) {
        setVendors((prev) => [response.data!.data!, ...prev]);
      } else {
        fetchVendors();
      }
      toast.success("Vendor created successfully");
      setModalOpen(false);
      resetForm();
    } catch (err) {
      const error = err as ApiError;
      toast.error(error.userMessage || error.response?.data?.message || "Failed to create vendor");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || !selectedVendor) return;

    const validationErrors = validateForm(form);
    if (validationErrors.length) {
      validationErrors.forEach((msg) => toast.error(msg));
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = { ...form, _method: "PUT" };
      // Optimistic update
      setVendors((prevVendors) =>
        prevVendors.map((vendor) =>
          vendor.id === selectedVendor.id
            ? { ...vendor, ...form, updated_at: new Date().toISOString() }
            : vendor,
        ),
      );
      await apiPut(`/updatevendors/${selectedVendor.id}`, payload, { _method: "PUT" }, ["/updatevendors"]);
      toast.success("Vendor updated successfully");
      setEditModalOpen(false);
      resetForm();
    } catch (err) {
      const error = err as ApiError;
      toast.error(error.userMessage || error.response?.data?.message || "Failed to update vendor");
      fetchVendors();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (isSubmitting || !selectedVendor) return;
    setIsSubmitting(true);
    try {
      setVendors((prevVendors) => prevVendors.filter((vendor) => vendor.id !== selectedVendor.id));
      await api.delete(`/vendors-dels/${selectedVendor.id}`);
      toast.success("Vendor deleted successfully!");
      setDeleteModalOpen(false);
      setSelectedVendor(null);
    } catch {
      toast.error("Failed to delete vendor");
      fetchVendors();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof VendorFormData, value: string | number | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const prepareEditForm = (vendor: Vendor) => {
    setForm({
      vendor_name: vendor.vendor_name,
      contact_person: vendor.contact_person || "",
      email: vendor.email,
      phone: vendor.phone || "",
      address: vendor.address || "",
      city: vendor.city || "",
      state: vendor.state || "",
      country: vendor.country || "Netherlands",
      postal_code: vendor.postal_code || "",
      industry: vendor.industry || "",
      tax_id: vendor.tax_id || "",
      registration_number: vendor.registration_number || "",
      website: vendor.website || "",
      bank_name: vendor.bank_name || "",
      bank_account_number: vendor.bank_account_number || "",
      bank_account_name: vendor.bank_account_name || "",
      is_active: vendor.is_active,
      notes: vendor.notes || "",
      location_id: vendor.location_id || "",
      business_key: vendor.business_key,
    });
    setSelectedVendor(vendor);
    setEditModalOpen(true);
  };

  const handleRefresh = () => {
    fetchVendors();
    // toast.success("Refreshed");
  };

  // Reusable CSS classes
  const inputClass = "w-full px-4 py-2.5 bg-white border border-stone-200 rounded-xl focus:ring-2 focus:ring-[#080e16]/10 focus:border-[#080e16] outline-none transition text-sm placeholder-stone-400 shadow-sm";
  const labelClass = "block text-xs font-semibold text-stone-500 mb-1.5";
  const selectClass = "w-full px-4 py-2.5 bg-white border border-stone-200 rounded-xl focus:ring-2 focus:ring-[#080e16]/10 focus:border-[#080e16] outline-none transition text-sm shadow-sm";

  return (
    <div className="min-h-screen bg-[#f5f5f4]">
      {/* Header */}
      <header className="bg-white border-b border-stone-100 top-0 z-10 mt-[-13px] w-full">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard"
                className="w-9 h-9 flex items-center justify-center rounded-xl border border-stone-200 text-stone-500 hover:text-stone-800 hover:bg-stone-50 transition-colors">
                <ArrowLeft className="h-4 w-4" />
              </Link>
              <div>
                <h1 className="text-lg font-bold text-stone-900 tracking-tight">Vendor Management</h1>
                <p className="text-xs text-stone-400">Manage your vendors & suppliers</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button onClick={handleRefresh}
                className="w-9 h-9 flex items-center justify-center rounded-xl border border-stone-200 text-stone-500 hover:bg-stone-50 transition-colors">
                <RefreshCw className="h-4 w-4" />
              </button>
              <button onClick={() => setModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#091521] text-white text-sm font-bold rounded-xl hover:bg-[#0d1722] transition-all shadow-md shadow-[#080e16]/20">
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Add Vendor</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-6">
        {/* Stat Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
          {[
            { label: "Total Vendors", value: vendors.length, icon: Users, color: "bg-[#080e16]/5" },
            { label: "Active Vendors", value: vendors.filter(v => v.is_active).length, icon: User, color: "bg-emerald-50" },
            { label: "Unique Industries", value: industries.length, icon: Briefcase, color: "bg-amber-50" },
            { label: "Locations", value: locations.length, icon: Globe, color: "bg-rose-50" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider">{label}</p>
                  <p className="text-2xl font-bold text-stone-900 mt-1">{value.toLocaleString()}</p>
                </div>
                <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center`}>
                  <Icon className="h-5 w-5 text-[#09121d]/60" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Search + Filter */}
        <div className="flex gap-3 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 h-4 w-4" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, industry..."
              className="w-full pl-11 pr-4 py-2.5 bg-white border border-stone-200 rounded-xl focus:ring-2 focus:ring-[#080e16]/10 focus:border-[#080e16] outline-none transition text-sm placeholder-stone-400 shadow-sm"
            />
            {search && (
              <button onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded-full bg-stone-200 text-stone-500 hover:bg-stone-300 transition-colors">
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
          <button
            onClick={() => setFilterDrawerOpen(true)}
            className="relative flex items-center gap-2 px-4 py-2.5 bg-white border border-stone-200 rounded-xl hover:bg-stone-50 transition-colors shadow-sm text-sm font-semibold text-stone-600"
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span className="hidden sm:inline">Filters</span>
            {activeFilterCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-[#080e16] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* Status Chips */}
        <div className="flex items-center gap-2 mb-5">
          {["All", "Active", "Inactive"].map((label) => {
            const val = label.toLowerCase();
            const isActive = statusFilter === val || (label === "All" && statusFilter === "all");
            return (
              <button key={label}
                onClick={() => setStatusFilter(val)}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-full transition-all border ${
                  isActive
                    ? "bg-[#080e16] text-white border-[#080e16] shadow-sm"
                    : "bg-white text-stone-600 border-stone-200 hover:border-stone-300 hover:bg-stone-50"
                }`}>
                {label}
              </button>
            );
          })}
          {activeFilterCount > 0 && (
            <button onClick={clearFilters}
              className="ml-auto flex items-center gap-1.5 text-xs font-semibold text-[#09121d] hover:underline">
              <FilterX className="h-3.5 w-3.5" /> Clear filters
            </button>
          )}
        </div>

        {/* Result count */}
        <p className="text-xs text-stone-400 mb-4 font-medium">
          Showing <span className="text-stone-700 font-bold">{totalItems > 0 ? startIndex + 1 : 0}–{endIndex}</span> of{" "}
          <span className="text-stone-700 font-bold">{totalItems}</span> vendors
        </p>

        {/* Content */}
        {isLoading && <LoadingState />}

        {!isLoading && filteredVendors.length === 0 && (
          <EmptyState
            title={search ? "No vendors found" : "No vendors yet"}
            description={search ? "Try adjusting your search or filters." : "Add your first vendor to get started."}
            icon={Users}
            action={
              search || activeFilterCount > 0
                ? { label: "Clear Filters", onClick: clearFilters }
                : { label: "Add Your First Vendor", onClick: () => setModalOpen(true) }
            }
          />
        )}

        {!isLoading && filteredVendors.length > 0 && (
          <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-stone-100">
                    {["#", "Vendor Details", "Contact Info", "Location", "Status", "Created", ""].map((h, i) => (
                      <th key={i}
                        className={`px-5 py-3.5 text-left text-[10px] font-bold uppercase tracking-widest text-stone-400 bg-stone-50/70 ${
                          i === 2 ? "hidden lg:table-cell" : i === 3 ? "hidden md:table-cell" : ""
                        }`}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {currentItems.map((vendor, index) => (
                    <VendorTableRow
                      key={vendor.id}
                      vendor={vendor}
                      index={index}
                      startIndex={startIndex}
                      onView={(v) => { setSelectedVendor(v); setViewModalOpen(true); }}
                      onEdit={prepareEditForm}
                      onDelete={(v) => { setSelectedVendor(v); setDeleteModalOpen(true); }}
                      isOpen={openRow === vendor.id}
                      onToggleOpen={setOpenRow}
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
              onPageChange={handlePageChange}
              onItemsPerPageChange={handleItemsPerPageChange}
            />
          </div>
        )}
      </main>

      {/* Add Vendor Modal */}
      {modalOpen && (
        <CombinedModal
          title={
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#080e16]/5 rounded-xl flex items-center justify-center">
                <Plus className="h-5 w-5 text-[#09121d]" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-stone-900">Add New Vendor</h2>
                <p className="text-xs text-stone-400">Create a new vendor/supplier record</p>
              </div>
            </div>
          }
          onClose={() => { if (!isSubmitting) { setModalOpen(false); resetForm(); } }}
        >
          <form onSubmit={handleSave} className="space-y-8">
            {/* Basic Information */}
            <div className="space-y-6">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 bg-[#080e16]/5 rounded-lg flex items-center justify-center">
                  <Building2 className="h-3.5 w-3.5 text-[#09121d]/60" />
                </div>
                <h3 className="text-sm font-bold text-stone-500 uppercase tracking-widest">Vendor Details</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className={labelClass}>Vendor Name <span className="text-rose-500">*</span></label>
                  <input type="text" value={form.vendor_name} onChange={(e) => handleInputChange("vendor_name", e.target.value)} required className={inputClass} placeholder="Enter vendor name" />
                </div>
                <div>
                  <label className={labelClass}>Email <span className="text-rose-500">*</span></label>
                  <input type="email" value={form.email} onChange={(e) => handleInputChange("email", e.target.value)} required className={inputClass} placeholder="vendor@example.com" />
                </div>
                <div>
                  <label className={labelClass}>Contact Person</label>
                  <input type="text" value={form.contact_person} onChange={(e) => handleInputChange("contact_person", e.target.value)} className={inputClass} placeholder="Optional contact name" />
                </div>
                <div>
                  <label className={labelClass}>Phone Number</label>
                  <input type="tel" value={form.phone} onChange={(e) => handleInputChange("phone", e.target.value)} className={inputClass} placeholder="+234 800 000 0000" />
                </div>
                <div>
                  <label className={labelClass}>Industry</label>
                  <select value={form.industry} onChange={(e) => handleInputChange("industry", e.target.value)} className={selectClass}>
                    <option value="">Select Industry</option>
                    <option value="Agriculture & Farming">Agriculture & Farming</option>
                    <option value="Automotive">Automotive</option>
                    <option value="Construction">Construction</option>
                    <option value="Education">Education</option>
                    <option value="Food & Beverage">Food & Beverage</option>
                    <option value="Healthcare">Healthcare</option>
                    <option value="Information Technology">Information Technology</option>
                    <option value="Manufacturing">Manufacturing</option>
                    <option value="Retail">Retail</option>
                    <option value="Telecommunications">Telecommunications</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Website</label>
                  <input type="url" value={form.website} onChange={(e) => handleInputChange("website", e.target.value)} className={inputClass} placeholder="https://example.com" />
                </div>
              </div>

              <div>
                <label className={labelClass}>Location <span className="text-rose-500">*</span></label>
                <select value={form.location_id} onChange={(e) => handleInputChange("location_id", e.target.value)} required className={selectClass}>
                  <option value="">Select Location</option>
                  {locations.map((location) => (
                    <option key={location.id} value={location.id}>{location.location_name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-stone-100" />

            {/* Address Information */}
            <div className="space-y-6">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 bg-[#080e16]/5 rounded-lg flex items-center justify-center">
                  <MapPin className="h-3.5 w-3.5 text-[#09121d]/60" />
                </div>
                <h3 className="text-sm font-bold text-stone-500 uppercase tracking-widest">Address Details</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2">
                  <label className={labelClass}>Address</label>
                  <input type="text" value={form.address} onChange={(e) => handleInputChange("address", e.target.value)} className={inputClass} placeholder="123 Main Street" />
                </div>
                <div>
                  <label className={labelClass}>City</label>
                  <input type="text" value={form.city} onChange={(e) => handleInputChange("city", e.target.value)} className={inputClass} placeholder="Enter city" />
                </div>
                <div>
                  <label className={labelClass}>State</label>
                  <input type="text" value={form.state} onChange={(e) => handleInputChange("state", e.target.value)} className={inputClass} placeholder="Enter state" />
                </div>
                <div>
                  <label className={labelClass}>Postal Code</label>
                  <input type="text" value={form.postal_code} onChange={(e) => handleInputChange("postal_code", e.target.value)} className={inputClass} placeholder="100001" />
                </div>
                <div>
                  <label className={labelClass}>Country</label>
                  <select value={form.country} onChange={(e) => handleInputChange("country", e.target.value)} className={selectClass}>
                    <option value="">Select country</option>
                    {countries.map((country) => (
                      <option key={country} value={country}>{country}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-stone-100" />

            {/* Legal & Banking */}
            <div className="space-y-6">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 bg-[#080e16]/5 rounded-lg flex items-center justify-center">
                  <CreditCard className="h-3.5 w-3.5 text-[#09121d]/60" />
                </div>
                <h3 className="text-sm font-bold text-stone-500 uppercase tracking-widest">Legal & Banking</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className={labelClass}>Tax ID/TIN</label>
                  <input type="text" value={form.tax_id} onChange={(e) => handleInputChange("tax_id", e.target.value)} className={inputClass} placeholder="Enter tax ID" />
                </div>
                <div>
                  <label className={labelClass}>Registration Number</label>
                  <input type="text" value={form.registration_number} onChange={(e) => handleInputChange("registration_number", e.target.value)} className={inputClass} placeholder="Enter registration number" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <label className={labelClass}>Bank Name</label>
                  <input type="text" value={form.bank_name} onChange={(e) => handleInputChange("bank_name", e.target.value)} className={inputClass} placeholder="e.g., First Bank" />
                </div>
                <div>
                  <label className={labelClass}>Account Number</label>
                  <input type="text" value={form.bank_account_number} onChange={(e) => handleInputChange("bank_account_number", e.target.value)} className={inputClass} placeholder="1234567890" />
                </div>
                <div>
                  <label className={labelClass}>Account Name</label>
                  <input type="text" value={form.bank_account_name} onChange={(e) => handleInputChange("bank_account_name", e.target.value)} className={inputClass} placeholder="Vendor Company Name" />
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-stone-100" />

            {/* Additional Information */}
            <div className="space-y-6">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 bg-[#080e16]/5 rounded-lg flex items-center justify-center">
                  <FileText className="h-3.5 w-3.5 text-[#09121d]/60" />
                </div>
                <h3 className="text-sm font-bold text-stone-500 uppercase tracking-widest">Additional Information</h3>
              </div>

              <div>
                <label className={labelClass}>Notes</label>
                <textarea value={form.notes} onChange={(e) => handleInputChange("notes", e.target.value)} className={`${inputClass} resize-none`} placeholder="Additional notes..." rows={4} />
              </div>

              <div className="flex items-center gap-3 p-4 bg-stone-50 rounded-xl border border-stone-100">
                <div className="relative">
                  <input type="checkbox" checked={form.is_active} onChange={(e) => handleInputChange("is_active", e.target.checked)} className="sr-only" />
                  <div className={`w-10 h-5 flex items-center rounded-full p-0.5 transition-all ${form.is_active ? "bg-[#080e16]" : "bg-stone-300"}`}>
                    <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${form.is_active ? "translate-x-5" : "translate-x-0"}`} />
                  </div>
                </div>
                <div>
                  <span className="text-sm font-semibold text-stone-700">Active Status</span>
                  <p className="text-xs text-stone-400">{form.is_active ? "Vendor is active" : "Vendor is inactive"}</p>
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-3 pt-6 border-t border-stone-100">
              <button type="button" onClick={() => { setModalOpen(false); resetForm(); }}
                className="px-5 py-2.5 text-sm font-semibold text-stone-600 bg-white border border-stone-200 rounded-xl hover:bg-stone-50 transition-colors" disabled={isSubmitting}>
                Cancel
              </button>
              <button type="submit"
                className="px-5 py-2.5 text-sm font-semibold text-white bg-[#080e16] rounded-xl hover:bg-[#2c4c6e] transition-all inline-flex items-center gap-2 disabled:opacity-50 shadow-lg shadow-[#080e16]/20"
                disabled={isSubmitting}>
                {isSubmitting ? <><Loader2 size={16} className="animate-spin" /> Creating...</> : <><Plus size={16} /> Add Vendor</>}
              </button>
            </div>
          </form>
        </CombinedModal>
      )}

      {/* Edit Vendor Modal */}
      {editModalOpen && selectedVendor && (
        <CombinedModal
          title={
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#080e16]/5 rounded-xl flex items-center justify-center">
                <Edit className="h-5 w-5 text-[#09121d]" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-stone-900">Edit Vendor</h2>
                <p className="text-xs text-stone-400">Update vendor information</p>
              </div>
            </div>
          }
          onClose={() => { if (!isSubmitting) { setEditModalOpen(false); setSelectedVendor(null); resetForm(); } }}
        >
          <form onSubmit={handleEdit} className="space-y-8">
            {/* Same form fields as Add modal */}
            <div className="space-y-6">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 bg-[#080e16]/5 rounded-lg flex items-center justify-center">
                  <Building2 className="h-3.5 w-3.5 text-[#09121d]/60" />
                </div>
                <h3 className="text-sm font-bold text-stone-500 uppercase tracking-widest">Vendor Details</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className={labelClass}>Vendor Name <span className="text-rose-500">*</span></label>
                  <input type="text" value={form.vendor_name} onChange={(e) => handleInputChange("vendor_name", e.target.value)} required className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Email <span className="text-rose-500">*</span></label>
                  <input type="email" value={form.email} onChange={(e) => handleInputChange("email", e.target.value)} required className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Contact Person</label>
                  <input type="text" value={form.contact_person} onChange={(e) => handleInputChange("contact_person", e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Phone Number</label>
                  <input type="tel" value={form.phone} onChange={(e) => handleInputChange("phone", e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Industry</label>
                  <select value={form.industry} onChange={(e) => handleInputChange("industry", e.target.value)} className={selectClass}>
                    <option value="">Select Industry</option>
                    <option value="Agriculture & Farming">Agriculture & Farming</option>
                    <option value="Automotive">Automotive</option>
                    <option value="Construction">Construction</option>
                    <option value="Education">Education</option>
                    <option value="Food & Beverage">Food & Beverage</option>
                    <option value="Healthcare">Healthcare</option>
                    <option value="Information Technology">Information Technology</option>
                    <option value="Manufacturing">Manufacturing</option>
                    <option value="Retail">Retail</option>
                    <option value="Telecommunications">Telecommunications</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Website</label>
                  <input type="url" value={form.website} onChange={(e) => handleInputChange("website", e.target.value)} className={inputClass} />
                </div>
              </div>

              <div>
                <label className={labelClass}>Location <span className="text-rose-500">*</span></label>
                <select value={form.location_id} onChange={(e) => handleInputChange("location_id", e.target.value)} required className={selectClass}>
                  <option value="">Select Location</option>
                  {locations.map((location) => (
                    <option key={location.id} value={location.id}>{location.location_name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="border-t border-stone-100" />

            <div className="space-y-6">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 bg-[#080e16]/5 rounded-lg flex items-center justify-center">
                  <MapPin className="h-3.5 w-3.5 text-[#09121d]/60" />
                </div>
                <h3 className="text-sm font-bold text-stone-500 uppercase tracking-widest">Address Details</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2">
                  <label className={labelClass}>Address</label>
                  <input type="text" value={form.address} onChange={(e) => handleInputChange("address", e.target.value)} className={inputClass} />
                </div>
                <div><label className={labelClass}>City</label><input type="text" value={form.city} onChange={(e) => handleInputChange("city", e.target.value)} className={inputClass} /></div>
                <div><label className={labelClass}>State</label><input type="text" value={form.state} onChange={(e) => handleInputChange("state", e.target.value)} className={inputClass} /></div>
                <div><label className={labelClass}>Postal Code</label><input type="text" value={form.postal_code} onChange={(e) => handleInputChange("postal_code", e.target.value)} className={inputClass} /></div>
                <div>
                  <label className={labelClass}>Country</label>
                  <select value={form.country} onChange={(e) => handleInputChange("country", e.target.value)} className={selectClass}>
                    <option value="">Select country</option>
                    {countries.map((country) => (<option key={country} value={country}>{country}</option>))}
                  </select>
                </div>
              </div>
            </div>

            <div className="border-t border-stone-100" />

            <div className="space-y-6">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 bg-[#080e16]/5 rounded-lg flex items-center justify-center">
                  <CreditCard className="h-3.5 w-3.5 text-[#09121d]/60" />
                </div>
                <h3 className="text-sm font-bold text-stone-500 uppercase tracking-widest">Legal & Banking</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div><label className={labelClass}>Tax ID/TIN</label><input type="text" value={form.tax_id} onChange={(e) => handleInputChange("tax_id", e.target.value)} className={inputClass} /></div>
                <div><label className={labelClass}>Registration Number</label><input type="text" value={form.registration_number} onChange={(e) => handleInputChange("registration_number", e.target.value)} className={inputClass} /></div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div><label className={labelClass}>Bank Name</label><input type="text" value={form.bank_name} onChange={(e) => handleInputChange("bank_name", e.target.value)} className={inputClass} /></div>
                <div><label className={labelClass}>Account Number</label><input type="text" value={form.bank_account_number} onChange={(e) => handleInputChange("bank_account_number", e.target.value)} className={inputClass} /></div>
                <div><label className={labelClass}>Account Name</label><input type="text" value={form.bank_account_name} onChange={(e) => handleInputChange("bank_account_name", e.target.value)} className={inputClass} /></div>
              </div>
            </div>

            <div className="border-t border-stone-100" />

            <div className="space-y-6">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 bg-[#080e16]/5 rounded-lg flex items-center justify-center">
                  <FileText className="h-3.5 w-3.5 text-[#09121d]/60" />
                </div>
                <h3 className="text-sm font-bold text-stone-500 uppercase tracking-widest">Additional Information</h3>
              </div>

              <div>
                <label className={labelClass}>Notes</label>
                <textarea value={form.notes} onChange={(e) => handleInputChange("notes", e.target.value)} className={`${inputClass} resize-none`} rows={4} />
              </div>

              <div className="flex items-center gap-3 p-4 bg-stone-50 rounded-xl border border-stone-100">
                <div className="relative">
                  <input type="checkbox" checked={form.is_active} onChange={(e) => handleInputChange("is_active", e.target.checked)} className="sr-only" />
                  <div className={`w-10 h-5 flex items-center rounded-full p-0.5 transition-all ${form.is_active ? "bg-[#080e16]" : "bg-stone-300"}`}>
                    <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${form.is_active ? "translate-x-5" : "translate-x-0"}`} />
                  </div>
                </div>
                <div>
                  <span className="text-sm font-semibold text-stone-700">Active Status</span>
                  <p className="text-xs text-stone-400">{form.is_active ? "Vendor is active" : "Vendor is inactive"}</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-stone-100">
              <button type="button" onClick={() => { setEditModalOpen(false); setSelectedVendor(null); resetForm(); }}
                className="px-5 py-2.5 text-sm font-semibold text-stone-600 bg-white border border-stone-200 rounded-xl hover:bg-stone-50 transition-colors" disabled={isSubmitting}>
                Cancel
              </button>
              <button type="submit"
                className="px-5 py-2.5 text-sm font-semibold text-white bg-[#080e16] rounded-xl hover:bg-[#2c4c6e] transition-all inline-flex items-center gap-2 disabled:opacity-50 shadow-lg shadow-[#080e16]/20"
                disabled={isSubmitting}>
                {isSubmitting ? <><Loader2 size={16} className="animate-spin" /> Saving...</> : <><CheckCircle size={16} /> Save Changes</>}
              </button>
            </div>
          </form>
        </CombinedModal>
      )}

      {/* Delete Modal */}
      <DeleteModal
        isOpen={deleteModalOpen}
        onClose={() => { if (!isSubmitting) { setDeleteModalOpen(false); setSelectedVendor(null); } }}
        onConfirm={handleDelete}
        vendorName={selectedVendor?.vendor_name || ""}
        isSubmitting={isSubmitting}
      />

      {/* View Vendor Modal */}
      <ViewVendorModal
        isOpen={viewModalOpen}
        onClose={() => { setViewModalOpen(false); setSelectedVendor(null); }}
        vendor={selectedVendor}
        onEdit={(v) => { setViewModalOpen(false); prepareEditForm(v); }}
      />

      {/* Filter Drawer */}
      <FilterDrawer
        isOpen={filterDrawerOpen}
        onClose={() => setFilterDrawerOpen(false)}
        statusFilter={statusFilter}
        industryFilter={industryFilter}
        industries={industries}
        totalItems={totalItems}
        onStatusChange={setStatusFilter}
        onIndustryChange={setIndustryFilter}
        onClearFilters={clearFilters}
        activeFilterCount={activeFilterCount}
      />
    </div>
  );
};

export default withAuth(ManageVendors);