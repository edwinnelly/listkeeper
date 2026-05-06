"use client";
import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Plus, Edit, Trash2, Search, MoreHorizontal, X, AlertTriangle,
  ArrowLeft, Phone, User, Loader2, Shield, UserCheck, UserX,
  Building, ShieldBan, Camera, Filter, Download, RefreshCw,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  FilterX, MapPin, Mail, Calendar,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { toast } from "react-hot-toast";
import { apiGet, apiPost, apiDelete } from "@/lib/axios";
import { motion, AnimatePresence } from "framer-motion";

// ============================================================================
// TYPES & CONSTANTS
// ============================================================================

type UserRole =
  | "admin" | "manager" | "staff" | "user"
  | "Inventory Clerk" | "Salesperson" | "Purchasing Officer"
  | "Accountant" | "Viewer / Auditor";

type UserStatus = "active" | "inactive" | "suspended" | "pending";

interface User {
  id: number; name: string; email: string; address: string;
  phone_number: string; is_active: boolean; phone: string | null;
  role: UserRole; status: UserStatus; email_verified_at: string | null;
  created_at: string; updated_at: string; profile_pic: string;
  user_id: number; location?: { id: number; location_name: string; };
  photo?: string; state?: string; city?: string; country?: string; about?: string;
}

interface UserFormData {
  name: string; email: string; phone: string; address: string;
  role: UserRole; password: string; password_confirmation: string;
  location_id?: string; state: string; city: string; country: string; about: string;
}

interface FormErrors {
  name?: string; email?: string; phone?: string; address?: string;
  role?: string; password?: string; password_confirmation?: string;
  location_id?: string; state?: string; city?: string; country?: string;
  about?: string; photo?: string;
}

interface Location { id: number; location_name: string; }

// Constants
const ROLES: { value: UserRole; label: string }[] = [
  { value: "admin", label: "Administrator" },
  { value: "manager", label: "Manager" },
  { value: "Inventory Clerk", label: "Inventory Clerk" },
  { value: "Salesperson", label: "Salesperson" },
  { value: "Purchasing Officer", label: "Purchasing Officer" },
  { value: "Accountant", label: "Accountant" },
  { value: "Viewer / Auditor", label: "Viewer / Auditor" },
  { value: "staff", label: "Staff" },
  { value: "user", label: "User" },
];

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const MAX_IMAGE_SIZE = 2 * 1024 * 1024;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const formatDate = (d: string | null) =>
  !d ? "—" : new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });

const validateEmail = (email: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const validatePhone = (phone: string): boolean => {
  if (!phone.trim()) return true;
  const phoneRegex = /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,5}[-\s\.]?[0-9]{1,5}$/;
  return phoneRegex.test(phone.replace(/\s/g, ""));
};

const validateImageFile = (file: File): string | null => {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) return "Please upload a JPEG, PNG, AVIF, or WEBP image.";
  if (file.size > MAX_IMAGE_SIZE) return "Image must be smaller than 2MB.";
  return null;
};

const useDebounce = <T,>(value: T, delay: number): T => {
  const [dv, setDv] = useState(value);
  useEffect(() => { const t = setTimeout(() => setDv(value), delay); return () => clearTimeout(t); }, [value, delay]);
  return dv;
};

interface ApiError {
  userMessage?: string;
  response?: { data?: { message?: string; errors?: Record<string, string[]>; }; status?: number; };
}

// ============================================================================
// STATUS & ROLE BADGE CONFIG
// ============================================================================

const STATUS_CFG: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  active: { label: "Active", bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
  inactive: { label: "Inactive", bg: "bg-slate-100", text: "text-slate-500", dot: "bg-slate-400" },
  suspended: { label: "Suspended", bg: "bg-rose-50", text: "text-rose-700", dot: "bg-rose-500" },
  pending: { label: "Pending", bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-400" },
};

const ROLE_CFG: Record<string, { bg: string; text: string; dot: string }> = {
  admin: { bg: "bg-violet-50", text: "text-violet-700", dot: "bg-violet-500" },
  manager: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500" },
  staff: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
  "Inventory Clerk": { bg: "bg-orange-50", text: "text-orange-700", dot: "bg-orange-500" },
  Salesperson: { bg: "bg-cyan-50", text: "text-cyan-700", dot: "bg-cyan-500" },
  "Purchasing Officer": { bg: "bg-indigo-50", text: "text-indigo-700", dot: "bg-indigo-500" },
  Accountant: { bg: "bg-teal-50", text: "text-teal-700", dot: "bg-teal-500" },
  "Viewer / Auditor": { bg: "bg-gray-100", text: "text-gray-700", dot: "bg-gray-500" },
};

// ============================================================================
// REUSABLE COMPONENTS
// ============================================================================

const StatusBadge: React.FC<{ status: string; isActive: boolean }> = ({ status, isActive }) => {
  const s = isActive ? "active" : (status === "suspended" ? "suspended" : status === "pending" ? "pending" : "inactive");
  const cfg = STATUS_CFG[s] || STATUS_CFG.inactive;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold tracking-wide ${cfg.bg} ${cfg.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
      {cfg.label.toUpperCase()}
    </span>
  );
};

const RoleBadge: React.FC<{ role: string }> = ({ role }) => {
  const cfg = ROLE_CFG[role] || ROLE_CFG["Viewer / Auditor"];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold tracking-wide ${cfg.bg} ${cfg.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
      {role.toUpperCase()}
    </span>
  );
};

const StatCard: React.FC<{ title: string; value: number; icon: React.ElementType; accent: string; }> = ({ title, value, icon: Icon, accent }) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4 flex items-center gap-4">
    <div className={`w-10 h-10 ${accent} rounded-xl flex items-center justify-center flex-shrink-0`}>
      <Icon className="h-4.5 w-4.5 text-white" />
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5 truncate">{title}</p>
      <p className="text-xl font-bold text-gray-900 leading-none">{value}</p>
    </div>
  </div>
);

const EmptyState: React.FC<{ title: string; description: string; icon: React.ElementType; action?: { label: string; onClick: () => void; }; }> = ({ title, description, icon: Icon, action }) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-20">
    <div className="flex flex-col items-center text-center max-w-sm mx-auto">
      <div className="w-16 h-16 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-center mb-5">
        <Icon className="h-8 w-8 text-gray-300" />
      </div>
      <h3 className="text-base font-bold text-gray-800 mb-1.5">{title}</h3>
      <p className="text-sm text-gray-400 mb-6 leading-relaxed">{description}</p>
      {action && (
        <button onClick={action.onClick} className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white text-sm font-bold rounded-xl hover:bg-gray-800 transition-all shadow-lg shadow-gray-900/15">
          <Plus className="h-4 w-4" />{action.label}
        </button>
      )}
    </div>
  </div>
);

const LoadingState: React.FC = () => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-20 flex flex-col items-center">
    <div className="relative w-14 h-14 mb-5">
      <div className="w-14 h-14 rounded-full border-[3px] border-gray-100" />
      <div className="absolute inset-0 rounded-full border-[3px] border-gray-900 border-t-transparent animate-spin" />
      <User className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
    </div>
    <p className="text-sm font-semibold text-gray-700">Loading users</p>
    <p className="text-xs text-gray-400 mt-1">Please wait a moment</p>
  </div>
);

// ============================================================================
// PAGINATION
// ============================================================================

const Pagination: React.FC<{
  currentPage: number; totalPages: number; totalItems: number;
  startIndex: number; endIndex: number; itemsPerPage: number;
  onPageChange: (p: number) => void; onItemsPerPageChange: (n: number) => void;
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
    <button onClick={onClick} disabled={disabled} className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 disabled:opacity-30 transition-colors">
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
              {p === "..." ? <span className="w-8 h-8 flex items-center justify-center text-gray-400 text-xs">…</span> :
                <button onClick={() => onPageChange(p as number)}
                  className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${currentPage === p ? "bg-gray-900 text-white shadow-sm" : "text-gray-600 hover:bg-gray-100 border border-gray-200"}`}>
                  {p}
                </button>}
            </React.Fragment>
          ))}
        </div>
        <Btn onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages}><ChevronRight className="h-3.5 w-3.5" /></Btn>
        <Btn onClick={() => onPageChange(totalPages)} disabled={currentPage === totalPages}><ChevronsRight className="h-3.5 w-3.5" /></Btn>
      </div>
    </div>
  );
};

// ============================================================================
// ACTION MENU
// ============================================================================

const ActionMenu: React.FC<{
  user: User; onEdit: (u: User) => void; onDelete: (u: User) => void; onClose: () => void; isOpen: boolean;
}> = ({ user, onEdit, onDelete, onClose, isOpen }) => (
  <AnimatePresence>
    {isOpen && (
      <>
        <div className="fixed inset-0 z-30" onClick={onClose} />
        <motion.div initial={{ opacity: 0, scale: 0.95, y: -4 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: -4 }} transition={{ duration: 0.1 }}
          className="absolute right-0 top-10 z-40 w-52 bg-white border border-gray-100 rounded-xl shadow-xl shadow-gray-900/10 overflow-hidden">
          <Link href={`/permssions/${user.user_id}`}>
            <button onClick={onClose} className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition">
              <ShieldBan className="h-3.5 w-3.5 text-gray-400" /> Change Roles
            </button>
          </Link>
          <Link href={`/usersprofile/${user.user_id}`}>
            <button onClick={onClose} className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition">
              <UserCheck className="h-3.5 w-3.5 text-gray-400" /> View Profile
            </button>
          </Link>
          <div className="h-px bg-gray-100 mx-2" />
          <button onClick={() => { onEdit(user); onClose(); }} className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition">
            <Edit className="h-3.5 w-3.5 text-gray-400" /> Edit User
          </button>
          <div className="h-px bg-gray-100 mx-2" />
          <button onClick={() => { onDelete(user); onClose(); }} className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm font-medium text-rose-600 hover:bg-rose-50 transition">
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </button>
        </motion.div>
      </>
    )}
  </AnimatePresence>
);

// ============================================================================
// DELETE MODAL
// ============================================================================

const DeleteModal: React.FC<{
  isOpen: boolean; onClose: () => void; onConfirm: () => void; userName: string; isSubmitting: boolean;
}> = ({ isOpen, onClose, onConfirm, userName, isSubmitting }) => (
  <AnimatePresence>
    {isOpen && (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50 p-4" onClick={onClose}>
        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
          <div className="p-6 text-center">
            <div className="w-14 h-14 bg-rose-50 border border-rose-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6 text-rose-500" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 mb-1.5">Delete User</h2>
            <p className="text-sm text-gray-500 leading-relaxed mb-6">
              Are you sure you want to delete <span className="font-bold text-gray-800">"{userName}"</span>? This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={onClose} disabled={isSubmitting} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-50 transition disabled:opacity-50">Cancel</button>
              <button onClick={onConfirm} disabled={isSubmitting} className="flex-1 px-4 py-2.5 rounded-xl bg-rose-600 text-white text-sm font-semibold hover:bg-rose-700 transition disabled:opacity-50 inline-flex items-center justify-center gap-2">
                {isSubmitting ? <><Loader2 className="h-4 w-4 animate-spin" />Deleting...</> : <><Trash2 className="h-4 w-4" />Delete</>}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

// ============================================================================
// USER MODAL
// ============================================================================

const UserModal: React.FC<{
  isOpen: boolean; onClose: () => void; title: string; icon: React.ElementType; children: React.ReactNode;
}> = ({ isOpen, onClose, title, icon: Icon, children }) => (
  <AnimatePresence>
    {isOpen && (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50 p-4" onClick={onClose}>
        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center">
                <Icon className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">{title}</h2>
                <p className="text-xs text-gray-400">{title.includes("Add") ? "Create a new" : "Update"} user account</p>
              </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 transition-colors">
              <X size={16} />
            </button>
          </div>
          <div className="p-6">{children}</div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

// ============================================================================
// USER FORM
// ============================================================================

const UserForm: React.FC<{
  form: UserFormData; handleInputChange: (field: keyof UserFormData, value: string) => void;
  handleFileChange: (file: File | null) => void; roles: { value: UserRole; label: string }[];
  locations: Location[]; isEdit: boolean; previewUrl: string | null; isUploading: boolean; errors: FormErrors;
}> = ({ form, handleInputChange, handleFileChange, roles, locations, isEdit, previewUrl, isUploading, errors }) => {
  const inputClass = "w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 outline-none transition text-gray-700 placeholder-gray-300";
  const labelClass = "text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block";
  const inputErr = "border-rose-300 focus:ring-rose-500/10 focus:border-rose-400";

  return (
    <div className="space-y-5">
      {/* Photo Upload */}
      <div className="flex flex-col items-center space-y-3">
        <label className={labelClass}>Profile Photo</label>
        <div className="relative group">
          <div className={`w-24 h-24 rounded-2xl border-2 border-dashed ${errors.photo ? "border-rose-300 bg-rose-50" : "border-gray-200"} overflow-hidden bg-gray-50 flex items-center justify-center group-hover:border-gray-300 transition-colors relative`}>
            {previewUrl ? <Image src={previewUrl} alt="Preview" fill className="object-cover" sizes="96px" /> : <User className="h-8 w-8 text-gray-300" />}
          </div>
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity">
            <Camera className="h-6 w-6 text-white" />
          </div>
          <input type="file" accept="image/jpeg,image/png,image/webp,image/avif"
            onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" disabled={isUploading} />
        </div>
        {isUploading && <div className="flex items-center gap-2 text-sm text-gray-400"><Loader2 className="h-4 w-4 animate-spin" />Uploading...</div>}
        {errors.photo && <p className="text-xs text-rose-500">{errors.photo}</p>}
        <p className="text-xs text-gray-400 text-center">JPG, PNG, WEBP, AVIF (Max 2MB)</p>
        {previewUrl && (
          <button type="button" onClick={() => handleFileChange(null)} className="text-xs font-bold text-rose-600 hover:underline" disabled={isUploading}>Remove Photo</button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className={labelClass}>Full Name <span className="text-rose-500">*</span></label>
          <input type="text" value={form.name} onChange={(e) => handleInputChange("name", e.target.value)}
            className={`${inputClass} ${errors.name ? inputErr : ""}`} placeholder="Enter full name" />
          {errors.name && <p className="text-xs text-rose-500 mt-1">{errors.name}</p>}
        </div>
        <div className="md:col-span-2">
          <label className={labelClass}>Email Address <span className="text-rose-500">*</span></label>
          <input type="email" value={form.email} onChange={(e) => handleInputChange("email", e.target.value)}
            className={`${inputClass} ${errors.email ? inputErr : ""}`} placeholder="Enter email address" />
          {errors.email && <p className="text-xs text-rose-500 mt-1">{errors.email}</p>}
        </div>
        <div>
          <label className={labelClass}>Phone Number</label>
          <input type="tel" value={form.phone} onChange={(e) => handleInputChange("phone", e.target.value)}
            className={`${inputClass} ${errors.phone ? inputErr : ""}`} placeholder="+234 800 000 0000" />
          {errors.phone && <p className="text-xs text-rose-500 mt-1">{errors.phone}</p>}
        </div>
        <div>
          <label className={labelClass}>Role</label>
          <select value={form.role} onChange={(e) => handleInputChange("role", e.target.value)} className={inputClass}>
            {roles.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
        </div>
        <div>
          <label className={labelClass}>Assigned Location</label>
          <select value={form.location_id || ""} onChange={(e) => handleInputChange("location_id", e.target.value)}
            className={`${inputClass} ${errors.location_id ? inputErr : ""}`}>
            <option value="">No location assigned</option>
            {locations.map((l) => <option key={l.id} value={l.id}>{l.location_name}</option>)}
          </select>
          {errors.location_id && <p className="text-xs text-rose-500 mt-1">{errors.location_id}</p>}
        </div>
        <div>
          <label className={labelClass}>Address</label>
          <input type="text" value={form.address} onChange={(e) => handleInputChange("address", e.target.value)}
            className={`${inputClass} ${errors.address ? inputErr : ""}`} placeholder="Enter address" />
          {errors.address && <p className="text-xs text-rose-500 mt-1">{errors.address}</p>}
        </div>
        <div>
          <label className={labelClass}>State</label>
          <input type="text" value={form.state} onChange={(e) => handleInputChange("state", e.target.value)}
            className={`${inputClass} ${errors.state ? inputErr : ""}`} placeholder="Enter state" />
          {errors.state && <p className="text-xs text-rose-500 mt-1">{errors.state}</p>}
        </div>
        <div>
          <label className={labelClass}>City</label>
          <input type="text" value={form.city} onChange={(e) => handleInputChange("city", e.target.value)}
            className={`${inputClass} ${errors.city ? inputErr : ""}`} placeholder="Enter city" />
          {errors.city && <p className="text-xs text-rose-500 mt-1">{errors.city}</p>}
        </div>
        <div>
          <label className={labelClass}>Country</label>
          <input type="text" value={form.country} onChange={(e) => handleInputChange("country", e.target.value)}
            className={`${inputClass} ${errors.country ? inputErr : ""}`} placeholder="Enter country" />
          {errors.country && <p className="text-xs text-rose-500 mt-1">{errors.country}</p>}
        </div>
        <div className="md:col-span-2">
          <label className={labelClass}>About</label>
          <textarea value={form.about} onChange={(e) => handleInputChange("about", e.target.value)}
            className={`${inputClass} resize-none ${errors.about ? inputErr : ""}`} placeholder="Tell us about this user..." rows={3} />
          {errors.about && <p className="text-xs text-rose-500 mt-1">{errors.about}</p>}
        </div>
        <div>
          <label className={labelClass}>{isEdit ? "New Password" : "Password"}{!isEdit && <span className="text-rose-500"> *</span>}</label>
          <input type="password" value={form.password} onChange={(e) => handleInputChange("password", e.target.value)}
            className={`${inputClass} ${errors.password ? inputErr : ""}`} placeholder={isEdit ? "Leave blank to keep current" : "Enter password"} minLength={8} />
          {errors.password && <p className="text-xs text-rose-500 mt-1">{errors.password}</p>}
        </div>
        <div>
          <label className={labelClass}>{isEdit ? "Confirm New Password" : "Confirm Password"}{!isEdit && <span className="text-rose-500"> *</span>}</label>
          <input type="password" value={form.password_confirmation} onChange={(e) => handleInputChange("password_confirmation", e.target.value)}
            className={`${inputClass} ${errors.password_confirmation ? inputErr : ""}`} placeholder={isEdit ? "Leave blank to keep current" : "Confirm password"} minLength={8} />
          {errors.password_confirmation && <p className="text-xs text-rose-500 mt-1">{errors.password_confirmation}</p>}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// HOOKS
// ============================================================================

export const useUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await apiGet("/users", {}, true);
      const arr = res?.data?.data?.users ?? res?.data?.data ?? res?.data?.users ?? res?.data ?? [];
      setUsers(Array.isArray(arr) ? arr : []);
    } catch (err: unknown) {
      const error = err as ApiError;
      toast.error(error.userMessage || "Failed to fetch users");
      setUsers([]);
    } finally { setIsLoading(false); }
  }, []);

  return { users, isLoading, fetchUsers, setUsers };
};

export const useLocations = () => {
  const [locations, setLocations] = useState<Location[]>([]);

  const fetchLocations = useCallback(async () => {
    try {
      const res = await apiGet("/locations", {}, true);
      const arr = res?.data?.data?.locations ?? res?.data?.data ?? res?.data?.locations ?? res?.data ?? [];
      setLocations(Array.isArray(arr) ? arr : []);
    } catch { setLocations([]); }
  }, []);

  return { locations, fetchLocations };
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const ManageUsers = () => {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [openRow, setOpenRow] = useState<number | null>(null);

  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [modalState, setModalState] = useState<{ type: "add" | "edit" | "delete" | null; user: User | null; }>({ type: null, user: null });

  const [form, setForm] = useState<UserFormData>({
    name: "", email: "", phone: "", address: "", role: "staff",
    password: "", password_confirmation: "", location_id: "",
    state: "", city: "", country: "", about: "",
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const { users, isLoading, fetchUsers, setUsers } = useUsers();
  const { locations, fetchLocations } = useLocations();

  useEffect(() => { fetchUsers(); fetchLocations(); }, [fetchUsers, fetchLocations]);
  useEffect(() => { return () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }; }, [previewUrl]);

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      if (!user) return false;
      const searchableText = [user.name, user.email, user.phone, user.role, user.state, user.city, user.country].filter(Boolean).join(" ").toLowerCase();
      const matchesSearch = searchableText.includes(debouncedSearch.toLowerCase());
      const matchesRole = roleFilter === "all" || user.role === roleFilter;
      const matchesStatus = statusFilter === "all" || (statusFilter === "active" && user.is_active) || (statusFilter === "inactive" && !user.is_active);
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, debouncedSearch, roleFilter, statusFilter]);

  const totalItems = filteredUsers.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const currentItems = filteredUsers.slice(startIndex, endIndex);

  const stats = useMemo(() => ({
    total: users.length,
    active: users.filter((u) => u.is_active).length,
    admins: users.filter((u) => u.role === "admin").length,
    inactive: users.filter((u) => !u.is_active).length,
  }), [users]);

  const validateForm = useCallback((formData: UserFormData, isEdit = false): { isValid: boolean; errors: FormErrors } => {
    const errors: FormErrors = {};
    if (!formData.name.trim()) errors.name = "Name is required";
    else if (formData.name.length < 2) errors.name = "Name must be at least 2 characters";
    if (!formData.email.trim()) errors.email = "Email is required";
    else if (!validateEmail(formData.email)) errors.email = "Please enter a valid email address";
    if (formData.phone && !validatePhone(formData.phone)) errors.phone = "Please enter a valid phone number";
    if (!isEdit) {
      if (!formData.password) errors.password = "Password is required";
      else if (formData.password.length < 8) errors.password = "Password must be at least 8 characters";
      if (formData.password !== formData.password_confirmation) errors.password_confirmation = "Passwords do not match";
    } else if (formData.password) {
      if (formData.password.length < 8) errors.password = "Password must be at least 8 characters";
      if (formData.password !== formData.password_confirmation) errors.password_confirmation = "Passwords do not match";
    }
    return { isValid: Object.keys(errors).length === 0, errors };
  }, []);

  const handleFileChange = useCallback((file: File | null) => {
    if (formErrors.photo) setFormErrors((prev) => ({ ...prev, photo: undefined }));
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelectedFile(file);
    if (file) {
      const error = validateImageFile(file);
      if (error) { setFormErrors((prev) => ({ ...prev, photo: error })); toast.error(error); setSelectedFile(null); setPreviewUrl(null); return; }
      setPreviewUrl(URL.createObjectURL(file));
    } else { setPreviewUrl(null); }
  }, [previewUrl, formErrors.photo]);

  const resetForm = useCallback(() => {
    setForm({ name: "", email: "", phone: "", address: "", role: "staff", password: "", password_confirmation: "", location_id: "", state: "", city: "", country: "", about: "" });
    setSelectedFile(null); setPreviewUrl(null); setFormErrors({});
  }, []);

  const handleInputChange = useCallback((field: keyof UserFormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (formErrors[field]) setFormErrors((prev) => ({ ...prev, [field]: undefined }));
  }, [formErrors]);

  const handleAddUser = useCallback(async (e: React.FormEvent) => {
    e.preventDefault(); if (isSubmitting) return;
    setFormErrors({});
    const validation = validateForm(form);
    if (!validation.isValid) { setFormErrors(validation.errors); const first = Object.values(validation.errors)[0]; if (first) toast.error(first); return; }
    if (selectedFile) { const err = validateImageFile(selectedFile); if (err) { setFormErrors((p) => ({ ...p, photo: err })); toast.error(err); return; } }
    setIsSubmitting(true); setIsUploading(!!selectedFile);
    try {
      const fd = new FormData();
      fd.append("name", form.name.trim()); fd.append("email", form.email.trim());
      fd.append("phone", form.phone.trim()); fd.append("role", form.role || "staff");
      fd.append("address", form.address.trim()); fd.append("state", form.state.trim());
      fd.append("city", form.city.trim()); fd.append("country", form.country.trim());
      fd.append("about", form.about.trim()); fd.append("location_id", form.location_id || "");
      fd.append("password", form.password || ""); fd.append("password_confirmation", form.password_confirmation || "");
      if (selectedFile) fd.append("photo", selectedFile);
      await apiPost("/usersadd", fd, { headers: { "Content-Type": "multipart/form-data" } });
      toast.success("User created successfully!");
      setModalState({ type: null, user: null }); resetForm(); await fetchUsers();
    } catch (err: unknown) {
      const error = err as ApiError;
      if (error.response?.status === 422 && error.response?.data?.errors) {
        const newErrors: FormErrors = {};
        Object.entries(error.response.data.errors).forEach(([k, v]) => { newErrors[k as keyof FormErrors] = Array.isArray(v) ? v[0] : v; });
        setFormErrors(newErrors);
      } else toast.error(error.userMessage || "Failed to create user");
    } finally { setIsSubmitting(false); setIsUploading(false); }
  }, [form, selectedFile, isSubmitting, validateForm, resetForm, fetchUsers]);

  const handleEditUser = useCallback(async (e: React.FormEvent) => {
    e.preventDefault(); if (isSubmitting || !modalState.user) return;
    setFormErrors({});
    const validation = validateForm(form, true);
    if (!validation.isValid) { setFormErrors(validation.errors); const first = Object.values(validation.errors)[0]; if (first) toast.error(first); return; }
    if (selectedFile) { const err = validateImageFile(selectedFile); if (err) { setFormErrors((p) => ({ ...p, photo: err })); toast.error(err); return; } }
    setIsSubmitting(true); setIsUploading(!!selectedFile);
    try {
      const fd = new FormData();
      fd.append("name", form.name.trim()); fd.append("email", form.email.trim());
      fd.append("phone", form.phone.trim()); fd.append("role", form.role || "staff");
      fd.append("address", form.address.trim()); fd.append("state", form.state.trim());
      fd.append("city", form.city.trim()); fd.append("country", form.country.trim());
      fd.append("about", form.about.trim()); fd.append("location_id", form.location_id || "");
      if (form.password) { fd.append("password", form.password); fd.append("password_confirmation", form.password_confirmation); }
      if (selectedFile) fd.append("photo", selectedFile);
      fd.append("_method", "PUT");
      await apiPost(`/usersupdate/${modalState.user.id}`, fd, { headers: { "Content-Type": "multipart/form-data" } }, ["/users", "/locations"]);
      toast.success("User updated successfully!");
      setModalState({ type: null, user: null }); resetForm(); await fetchUsers();
    } catch (err: unknown) {
      const error = err as ApiError;
      toast.error(error.userMessage || "Failed to update user");
    } finally { setIsSubmitting(false); setIsUploading(false); }
  }, [form, selectedFile, modalState.user, isSubmitting, validateForm, resetForm, fetchUsers]);

  const handleDeleteUser = useCallback(async () => {
    if (isSubmitting || !modalState.user) return;
    setIsSubmitting(true);
    try {
      await apiDelete(`/usersdel/${modalState.user.id}`);
      toast.success("User deleted successfully!");
      setModalState({ type: null, user: null });
      // Optimistic: remove immediately then refetch
      setUsers((prev) => prev.filter((u) => u.id !== modalState.user?.id));
      await fetchUsers();
    } catch (err: unknown) {
      const error = err as ApiError;
      toast.error(error.userMessage || "Failed to delete user");
      setModalState({ type: null, user: null });
    } finally { setIsSubmitting(false); }
  }, [modalState.user, isSubmitting, fetchUsers, setUsers]);

  const handleEditClick = useCallback((user: User) => {
    setForm({ name: user.name || "", email: user.email || "", phone: user.phone_number || "", role: user.role || "staff", password: "", password_confirmation: "", location_id: user.location?.id?.toString() || "", state: user.state || "", city: user.city || "", country: user.country || "", about: user.about || "", address: user.address || "" });
    setFormErrors({}); setModalState({ type: "edit", user });
  }, []);

  const clearFilters = () => { setSearch(""); setRoleFilter("all"); setStatusFilter("all"); setCurrentPage(1); };

  const activeFilterCount = useMemo(() => {
    let c = 0; if (roleFilter !== "all") c++; if (statusFilter !== "all") c++; if (search) c++; return c;
  }, [roleFilter, statusFilter, search]);

  // Select class
  const sel = "px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 shadow-sm";

  return (
    <div className="min-h-screen bg-[#f5f5f4]">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-screen-2xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-800 transition-colors">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <h1 className="text-lg font-bold text-gray-900 tracking-tight">Manage Users</h1>
              <p className="text-xs text-gray-400">Manage user accounts and permissions</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={fetchUsers} className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors">
              <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            </button>
            <button className="hidden sm:flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors shadow-sm">
              <Download className="h-4 w-4" /> Export
            </button>
            <button onClick={() => { resetForm(); setModalState({ type: "add", user: null }); }}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white text-sm font-bold rounded-xl hover:bg-gray-800 transition-all shadow-md shadow-gray-900/15">
              <Plus className="h-4 w-4" /><span className="hidden sm:inline">Add User</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-screen-2xl mx-auto px-6 py-6">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
          <StatCard title="Total Users" value={stats.total} icon={User} accent="bg-gray-900" />
          <StatCard title="Active Users" value={stats.active} icon={UserCheck} accent="bg-emerald-600" />
          <StatCard title="Admins" value={stats.admins} icon={Shield} accent="bg-violet-600" />
          <StatCard title="Inactive" value={stats.inactive} icon={UserX} accent="bg-amber-500" />
        </div>

        {/* Search + Filter Bar */}
        <div className="flex gap-3 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input type="text" value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              placeholder="Search users by name, email, phone..."
              className="w-full pl-11 pr-11 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 outline-none transition text-sm placeholder-gray-300 shadow-sm font-medium" />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3.5 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded-full bg-gray-200 text-gray-500 hover:bg-gray-300 transition-colors">
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
          <select value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setCurrentPage(1); }} className={sel}>
            <option value="all">All Roles</option>
            {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }} className={sel}>
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        {/* Status Chips */}
        <div className="flex items-center gap-2 mb-5 overflow-x-auto pb-1">
          {[{ label: "All", s: "all" as const }, { label: "Active", s: "active" as const }, { label: "Inactive", s: "inactive" as const }].map(({ label, s }) => {
            const active = statusFilter === s;
            return (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`flex-shrink-0 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all border ${active ? "bg-gray-900 text-white border-gray-900 shadow-sm" : "bg-white text-gray-500 border-gray-200 hover:border-gray-300 hover:bg-gray-50"}`}>
                {label}
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
          Showing <span className="text-gray-700 font-bold">{totalItems > 0 ? startIndex + 1 : 0}–{endIndex}</span> of <span className="text-gray-700 font-bold">{totalItems}</span> users
        </p>

        {/* Content */}
        {isLoading ? <LoadingState /> :
          currentItems.length === 0 ? (
            <EmptyState
              title={search || activeFilterCount > 0 ? "No users found" : "No users available"}
              description={search || activeFilterCount > 0 ? "Try adjusting your search or filters." : "Get started by adding your first user."}
              icon={User}
              action={search || activeFilterCount > 0 ? { label: "Clear Filters", onClick: clearFilters } : { label: "Add User", onClick: () => { resetForm(); setModalState({ type: "add", user: null }); } }}
            />
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      {["#", "User", "Contact", "Location", "Role", "Status", ""].map((h, i) => (
                        <th key={i} className={`px-5 py-3.5 text-[10px] font-bold uppercase tracking-widest text-gray-400 bg-stone-50/70 ${h === "" ? "text-right" : "text-left"} ${h === "Contact" || h === "Location" ? (h === "Contact" ? "hidden md:table-cell" : "hidden lg:table-cell") : ""}`}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {currentItems.map((user, index) => (
                      <tr key={user.id} className="hover:bg-[#1e3a5f]/[0.015] transition-colors group border-b border-gray-100 last:border-0">
                        <td className="px-5 py-3.5 text-xs text-gray-400 font-medium tabular-nums">{startIndex + index + 1}</td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-center flex-shrink-0 relative overflow-hidden">
                              {user.profile_pic ? <Image src={`http://localhost:8000/storage/${user.profile_pic}`} alt={user.name} fill className="object-cover" sizes="36px" /> : <User className="h-4 w-4 text-gray-300" />}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-gray-900 truncate">{user.name}</p>
                              <p className="text-xs text-gray-400 truncate">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 hidden md:table-cell">
                          {user.phone_number ? (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Phone className="h-3.5 w-3.5 text-gray-300 flex-shrink-0" />
                              <span>{user.phone_number}</span>
                            </div>
                          ) : <span className="text-sm text-gray-400">—</span>}
                        </td>
                        <td className="px-5 py-3.5 hidden lg:table-cell">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <MapPin className="h-3.5 w-3.5 text-gray-300 flex-shrink-0" />
                            <span>{user.address || "—"}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5"><RoleBadge role={user.role} /></td>
                        <td className="px-5 py-3.5"><StatusBadge status={user.status || (user.is_active ? "active" : "inactive")} isActive={user.is_active} /></td>
                        <td className="px-5 py-3.5 text-right">
                          <div className="relative">
                            <button onClick={() => setOpenRow(openRow === user.id ? null : user.id)}
                              className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                              <MoreHorizontal className="h-4 w-4" />
                            </button>
                            <ActionMenu user={user} isOpen={openRow === user.id} onClose={() => setOpenRow(null)}
                              onEdit={handleEditClick} onDelete={(u) => setModalState({ type: "delete", user: u })} />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination currentPage={currentPage} totalPages={totalPages} totalItems={totalItems} startIndex={startIndex} endIndex={endIndex}
                itemsPerPage={itemsPerPage} onPageChange={setCurrentPage} onItemsPerPageChange={(n) => { setItemsPerPage(n); setCurrentPage(1); }} />
            </div>
          )
        }
      </main>

      {/* Add/Edit Modal */}
      <UserModal isOpen={modalState.type === "add" || modalState.type === "edit"} onClose={() => { if (!isSubmitting) { setModalState({ type: null, user: null }); resetForm(); } }}
        title={modalState.type === "add" ? "Add New User" : "Edit User"} icon={modalState.type === "add" ? Plus : Edit}>
        <form onSubmit={modalState.type === "add" ? handleAddUser : handleEditUser} className="space-y-5">
          <UserForm form={form} handleInputChange={handleInputChange} handleFileChange={handleFileChange}
            roles={ROLES} locations={locations} isEdit={modalState.type === "edit"} previewUrl={previewUrl} isUploading={isUploading} errors={formErrors} />
          <div className="flex gap-3 pt-5 border-t border-gray-100">
            <button type="button" onClick={() => { if (!isSubmitting) { setModalState({ type: null, user: null }); resetForm(); } }}
              className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-50 transition disabled:opacity-50" disabled={isSubmitting}>Cancel</button>
            <button type="submit" className="flex-1 px-4 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-bold hover:bg-gray-800 transition disabled:opacity-50 inline-flex items-center justify-center gap-2 shadow-md shadow-gray-900/15" disabled={isSubmitting}>
              {isSubmitting ? <><Loader2 className="h-4 w-4 animate-spin" />{modalState.type === "add" ? "Creating..." : "Updating..."}</> : <>{modalState.type === "add" ? <Plus className="h-4 w-4" /> : <Edit className="h-4 w-4" />}{modalState.type === "add" ? "Add User" : "Update User"}</>}
            </button>
          </div>
        </form>
      </UserModal>

      {/* Delete Modal */}
      <DeleteModal isOpen={modalState.type === "delete"} onClose={() => { if (!isSubmitting) setModalState({ type: null, user: null }); }}
        onConfirm={handleDeleteUser} userName={modalState.user?.name || ""} isSubmitting={isSubmitting} />
    </div>
  );
};

export default ManageUsers;