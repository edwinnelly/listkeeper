"use client";
import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/axios";
import React, { useState, useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import {
  Plus,
  Edit,
  Trash2,
  MapPin,
  Search,
  MoreHorizontal,
  X,
  AlertTriangle,
  ArrowLeft,
  Phone,
  Building,
  Loader2,
  ArchiveRestore,
  UserRoundCheck,
  DatabaseZap,
  Filter,
  Download,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Globe,
  Home,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  FilterX,
  Grid3x3,
  List,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { withAuth } from "@/hoc/withAuth";
import { motion, AnimatePresence } from "framer-motion";
import ShortTextWithTooltip from "../component/shorten_len";
import { countries } from "@/app/component/country-list";

// ============================================================================
// TYPES
// ============================================================================
interface Location {
  id: number;
  location_name: string;
  encrypted_id: string;
  address: string | null;
  city: string | null;
  state: string | null;
  staffs: string | null;
  country: string | null;
  postal_code: string | null;
  phone: string;
  head_office: "yes" | "no";
  location_status: "on" | "off";
  status: "active" | "inactive" | "pending";
  location_id: string;
  business_key: string;
  manager_id: number;
  owner_id: number;
  created_at: string;
  updated_at: string;
  user?: { id: number; name: string; email: string };
  business: { country: string | null };
}

interface LocationFormData {
  location_name: string;
  address: string;
  city: string;
  state: string;
  phone: string;
  country: string;
  postal_code: string;
  staffs?: string;
}

interface Staff {
  id: number;
  name: string;
  email: string;
}

interface FilterState {
  search: string;
  status: "all" | "active" | "inactive" | "pending";
  type: "all" | "head_office" | "branch";
}

interface Statistics {
  totalLocations: number;
  activeLocations: number;
  headOffices: number;
  branches: number;
  pendingLocations: number;
}

interface FormErrors {
  location_name?: string;
  address?: string;
  city?: string;
  state?: string;
  phone?: string;
  country?: string;
  postal_code?: string;
}

// ============================================================================
// UTILITY
// ============================================================================
const useDebounce = <T,>(value: T, delay: number): T => {
  const [dv, setDv] = useState<T>(value);
  useEffect(() => {
    const t = setTimeout(() => setDv(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return dv;
};

// ============================================================================
// BADGES
// ============================================================================
const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const config: Record<string, { bg: string; text: string; dot: string; label: string }> = {
    active: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500", label: "ACTIVE" },
    inactive: { bg: "bg-slate-100", text: "text-slate-500", dot: "bg-slate-400", label: "INACTIVE" },
    pending: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-400", label: "PENDING" },
  };
  const cfg = config[status] || config.inactive;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold tracking-wide ${cfg.bg} ${cfg.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
};

const TypeBadge: React.FC<{ type: "yes" | "no" }> = ({ type }) => {
  const isHO = type === "yes";
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold tracking-wide ${isHO ? "bg-violet-50 text-gray-700" : "bg-blue-50 text-gray-700"}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isHO ? "bg-gray-500" : "bg-gray-500"}`} />
      {isHO ? "HEAD OFFICE" : "BRANCH"}
    </span>
  );
};

// ============================================================================
// STAT CARD
// ============================================================================
const StatCard: React.FC<{
  title: string;
  value: number;
  icon: React.ElementType;
  accent: string;
}> = ({ title, value, icon: Icon, accent }) => (
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

// ============================================================================
// EMPTY STATE
// ============================================================================
const EmptyState: React.FC<{
  title: string;
  description: string;
  icon: React.ElementType;
  action?: { label: string; onClick: () => void };
}> = ({ title, description, icon: Icon, action }) => (
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

// ============================================================================
// LOADING STATE
// ============================================================================
const LoadingState: React.FC = () => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-20 flex flex-col items-center">
    <div className="relative w-14 h-14 mb-5">
      <div className="w-14 h-14 rounded-full border-[3px] border-gray-100" />
      <div className="absolute inset-0 rounded-full border-[3px] border-gray-900 border-t-transparent animate-spin" />
      <MapPin className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
    </div>
    <p className="text-sm font-semibold text-gray-700">Loading locations</p>
    <p className="text-xs text-gray-400 mt-1">Please wait a moment</p>
  </div>
);

// ============================================================================
// DELETE MODAL
// ============================================================================
const DeleteModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  locationName: string;
  isSubmitting: boolean;
}> = ({ isOpen, onClose, onConfirm, locationName, isSubmitting }) => (
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
            <h2 className="text-lg font-bold text-gray-900 mb-1.5">Delete Location</h2>
            <p className="text-sm text-gray-500 leading-relaxed mb-6">
              Are you sure you want to delete <span className="font-bold text-gray-800">"{locationName}"</span>? This cannot be undone.
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
// ACTION MENU (Portal-based - renders in document.body)
// ============================================================================
const ActionMenu: React.FC<{
  location: Location;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (l: Location) => void;
  onDelete: (l: Location) => void;
  onProducts: (l: Location) => void;
  onEmployees: (id: number) => void;
  onReports: (l: Location) => void;
  buttonRef: React.RefObject<HTMLButtonElement | null>;
}> = ({ location, isOpen, onClose, onEdit, onDelete, onProducts, onEmployees, onReports, buttonRef }) => {
  const [position, setPosition] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const menuWidth = 192;
      const menuHeight = 260;
      
      let top = rect.bottom + 4;
      let left = rect.right - menuWidth;

      if (top + menuHeight > window.innerHeight) {
        top = rect.top - menuHeight - 4;
      }
      if (left < 8) {
        left = rect.left;
      }
      if (left + menuWidth > window.innerWidth - 8) {
        left = window.innerWidth - menuWidth - 8;
      }

      setPosition({ top, left });
    }
  }, [isOpen, buttonRef]);

  useEffect(() => {
    if (!isOpen) return;
    
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    const handleScroll = () => onClose();
    const handleResize = () => onClose();

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("scroll", handleScroll, true);
    window.addEventListener("resize", handleResize);
    
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("resize", handleResize);
    };
  }, [isOpen, onClose, buttonRef]);

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={menuRef}
          initial={{ opacity: 0, scale: 0.95, y: -4 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -4 }}
          transition={{ duration: 0.1 }}
          style={{
            position: "fixed",
            top: position.top,
            left: position.left,
            zIndex: 9999,
          }}
          className="w-48 bg-white border border-gray-100 rounded-xl shadow-2xl shadow-gray-900/15 overflow-hidden"
        >
          <Link href={`/locationproducts/${location.encrypted_id}`} onClick={onClose}>
            <button className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition">
              <ArchiveRestore className="h-3.5 w-3.5 text-gray-400" /> Manage Products
            </button>
          </Link>
          <button onClick={() => { onEmployees(location.id); onClose(); }} className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition">
            <UserRoundCheck className="h-3.5 w-3.5 text-gray-400" /> Employees
          </button>
          <button onClick={() => { onReports(location); onClose(); }} className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition">
            <DatabaseZap className="h-3.5 w-3.5 text-gray-400" /> Sale Reports
          </button>
          <div className="h-px bg-gray-100 mx-2" />
          <button onClick={() => { onEdit(location); onClose(); }} className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition">
            <Edit className="h-3.5 w-3.5 text-gray-400" /> Edit Location
          </button>
          <div className="h-px bg-gray-100 mx-2" />
          <button onClick={() => { onDelete(location); onClose(); }} className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm font-medium text-rose-600 hover:bg-rose-50 transition">
            <Trash2 className="h-3.5 w-3.5" /> Delete Location
          </button>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};

// ============================================================================
// TABLE ROW COMPONENT
// ============================================================================
const LocationTableRow: React.FC<{
  location: Location;
  index: number;
  startIndex: number;
  onEdit: (l: Location) => void;
  onDelete: (l: Location) => void;
  onProducts: (l: Location) => void;
  onEmployees: (id: number) => void;
  onReports: (l: Location) => void;
  openRow: number | null;
  setOpenRow: React.Dispatch<React.SetStateAction<number | null>>;
  isSubmitting: boolean;
}> = ({ location, index, startIndex, onEdit, onDelete, onProducts, onEmployees, onReports, openRow, setOpenRow, isSubmitting }) => {
  const buttonRef = useRef<HTMLButtonElement>(null);

  return (
    <tr className="hover:bg-[#1e3a5f]/[0.015] transition-colors group border-b border-gray-100 last:border-0">
      <td className="px-5 py-3.5 text-xs text-gray-400 font-medium tabular-nums">
        {startIndex + index + 1}
      </td>
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-center flex-shrink-0">
            <Building className="h-4 w-4 text-gray-300" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-bold text-gray-900 max-w-[160px] truncate">
              <ShortTextWithTooltip text={location.location_name} max={25} />
            </div>
            <p className="text-xs text-gray-400 truncate flex items-center gap-1 mt-0.5">
              <Globe className="h-3 w-3 flex-shrink-0" />
              <span className="truncate max-w-[100px]">
                {location.country || "N/A"}
              </span>
            </p>
          </div>
        </div>
      </td>
      <td className="px-5 py-3.5 max-w-[160px]">
        <div className="text-sm text-gray-600 truncate">
          <ShortTextWithTooltip text={location.address || "—"} max={30} />
        </div>
        {location.postal_code && (
          <div className="text-xs text-gray-400 mt-0.5 truncate">
            Postal: {location.postal_code}
          </div>
        )}
      </td>
      <td className="px-5 py-3.5 max-w-[120px]">
        <div className="text-sm text-gray-900 truncate">
          <ShortTextWithTooltip text={location.city || "—"} max={20} />
        </div>
        <div className="text-xs text-gray-500 truncate">
          <ShortTextWithTooltip text={location.state || "—"} max={20} />
        </div>
      </td>
      <td className="px-5 py-3.5">
        {location.phone ? (
          <div className="flex items-center gap-1.5 text-gray-600">
            <Phone className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
            <span className="text-sm truncate max-w-[110px]">
              <ShortTextWithTooltip text={location.phone} max={20} />
            </span>
          </div>
        ) : (
          <span className="text-gray-400 text-sm">—</span>
        )}
      </td>
      <td className="px-5 py-3.5">
        <TypeBadge type={location.head_office} />
      </td>
      <td className="px-5 py-3.5">
        <StatusBadge status={location.status} />
      </td>
      <td className="px-5 py-3.5 text-right">
        <button
          ref={buttonRef}
          onClick={() => setOpenRow(openRow === location.id ? null : location.id)}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-50"
          disabled={isSubmitting}
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
        <ActionMenu
          location={location}
          isOpen={openRow === location.id}
          onClose={() => setOpenRow(null)}
          onEdit={onEdit}
          onDelete={onDelete}
          onProducts={onProducts}
          onEmployees={onEmployees}
          onReports={onReports}
          buttonRef={buttonRef}
        />
      </td>
    </tr>
  );
};

// ============================================================================
// GRID CARD
// ============================================================================
const LocationGridCard: React.FC<{
  location: Location;
  onEdit: (l: Location) => void;
  onDelete: (l: Location) => void;
  onProducts: (l: Location) => void;
  onEmployees: (id: number) => void;
}> = ({ location, onEdit, onDelete, onProducts, onEmployees }) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200 transition-all overflow-hidden">
    <div className="p-5">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="w-10 h-10 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-center flex-shrink-0">
            <Building className="h-4.5 w-4.5 text-gray-400" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-gray-900 truncate">{location.location_name}</p>
            <p className="text-xs text-gray-400 truncate flex items-center gap-1 mt-0.5">
              <Globe className="h-3 w-3 flex-shrink-0" />
              {location.country || "No country"}
            </p>
          </div>
        </div>
        <TypeBadge type={location.head_office} />
      </div>
      <div className="space-y-2 pt-3 border-t border-gray-50">
        {location.address && (
          <div className="flex items-start gap-2 text-xs text-gray-500">
            <MapPin className="h-3.5 w-3.5 text-gray-400 flex-shrink-0 mt-0.5" />
            <span className="line-clamp-2">{location.address}</span>
          </div>
        )}
        {location.city && (
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Home className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
            <span className="truncate">
              {location.city}
              {location.state && `, ${location.state}`}
            </span>
          </div>
        )}
        {location.phone && (
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Phone className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
            <span>{location.phone}</span>
          </div>
        )}
      </div>
    </div>
    <div className="px-5 py-3 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between">
      <StatusBadge status={location.status} />
      <div className="flex gap-1">
        <button onClick={() => onProducts(location)} className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors" title="Products">
          <ArchiveRestore className="h-3.5 w-3.5" />
        </button>
        <button onClick={() => onEmployees(location.id)} className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors" title="Employees">
          <Users className="h-3.5 w-3.5" />
        </button>
        <button onClick={() => onEdit(location)} className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors" title="Edit">
          <Edit className="h-3.5 w-3.5" />
        </button>
        <button onClick={() => onDelete(location)} className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-rose-500 hover:bg-rose-50 transition-colors" title="Delete">
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  </div>
);

// ============================================================================
// PAGINATION
// ============================================================================
const Pagination: React.FC<{
  currentPage: number;
  totalPages: number;
  totalItems: number;
  startIndex: number;
  endIndex: number;
  itemsPerPage: number;
  onPageChange: (p: number) => void;
  onItemsPerPageChange: (n: number) => void;
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
// LOCATION FORM
// ============================================================================
const LocationForm: React.FC<{
  form: LocationFormData;
  handleInputChange: (f: keyof LocationFormData, v: string) => void;
  countries: string[];
  staffs?: Staff[];
  errors?: FormErrors;
}> = ({ form, handleInputChange, countries: countryList, staffs = [], errors = {} }) => {
  const inputClass = "w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 outline-none transition text-gray-700 placeholder-gray-300";
  const labelClass = "text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block";
  const errClass = "border-rose-300 focus:ring-rose-500/10 focus:border-rose-400";

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="sm:col-span-2">
        <label className={labelClass}>Location Name <span className="text-rose-500">*</span></label>
        <input type="text" value={form.location_name} onChange={(e) => handleInputChange("location_name", e.target.value)}
          className={`${inputClass} ${errors.location_name ? errClass : ""}`} placeholder="Enter location name" maxLength={70} />
        {errors.location_name && <p className="text-xs text-rose-500 mt-1">{errors.location_name}</p>}
        <div className="text-xs text-gray-400 mt-1 text-right">{form.location_name.length}/70</div>
      </div>
      <div className="sm:col-span-2">
        <label className={labelClass}>Address <span className="text-rose-500">*</span></label>
        <input type="text" value={form.address} onChange={(e) => handleInputChange("address", e.target.value)}
          className={`${inputClass} ${errors.address ? errClass : ""}`} placeholder="Enter full address" maxLength={100} />
        {errors.address && <p className="text-xs text-rose-500 mt-1">{errors.address}</p>}
        <div className="text-xs text-gray-400 mt-1 text-right">{form.address.length}/100</div>
      </div>
      <div>
        <label className={labelClass}>City <span className="text-rose-500">*</span></label>
        <input type="text" value={form.city} onChange={(e) => handleInputChange("city", e.target.value)}
          className={`${inputClass} ${errors.city ? errClass : ""}`} placeholder="Enter city" maxLength={50} />
        {errors.city && <p className="text-xs text-rose-500 mt-1">{errors.city}</p>}
        <div className="text-xs text-gray-400 mt-1 text-right">{form.city.length}/50</div>
      </div>
      <div>
        <label className={labelClass}>State/Province <span className="text-rose-500">*</span></label>
        <input type="text" value={form.state} onChange={(e) => handleInputChange("state", e.target.value)}
          className={`${inputClass} ${errors.state ? errClass : ""}`} placeholder="Enter state" maxLength={50} />
        {errors.state && <p className="text-xs text-rose-500 mt-1">{errors.state}</p>}
        <div className="text-xs text-gray-400 mt-1 text-right">{form.state.length}/50</div>
      </div>
      <div>
        <label className={labelClass}>Manager</label>
        <select value={form.staffs || ""} onChange={(e) => handleInputChange("staffs", e.target.value)} className={inputClass}>
          <option value="">Select Manager</option>
          {staffs.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>
      <div>
        <label className={labelClass}>Country <span className="text-rose-500">*</span></label>
        <select value={form.country} onChange={(e) => handleInputChange("country", e.target.value)}
          className={`${inputClass} ${errors.country ? errClass : ""}`}>
          {countryList.map((c: string) => <option key={c} value={c}>{c}</option>)}
        </select>
        {errors.country && <p className="text-xs text-rose-500 mt-1">{errors.country}</p>}
      </div>
      <div>
        <label className={labelClass}>Postal Code</label>
        <input type="text" value={form.postal_code} onChange={(e) => handleInputChange("postal_code", e.target.value)}
          className={`${inputClass} ${errors.postal_code ? errClass : ""}`} placeholder="Enter postal code" maxLength={20} />
        {errors.postal_code && <p className="text-xs text-rose-500 mt-1">{errors.postal_code}</p>}
        <div className="text-xs text-gray-400 mt-1 text-right">{form.postal_code.length}/20</div>
      </div>
      <div>
        <label className={labelClass}>Phone Number <span className="text-rose-500">*</span></label>
        <input type="tel" value={form.phone} onChange={(e) => handleInputChange("phone", e.target.value)}
          className={`${inputClass} ${errors.phone ? errClass : ""}`} placeholder="+234 800 000 0000" maxLength={20} />
        {errors.phone && <p className="text-xs text-rose-500 mt-1">{errors.phone}</p>}
        <div className="text-xs text-gray-400 mt-1 text-right">{form.phone.length}/20</div>
      </div>
    </div>
  );
};

// ============================================================================
// MODAL
// ============================================================================
const CombinedModal: React.FC<{
  title: React.ReactNode;
  children: React.ReactNode;
  onClose: () => void;
  size?: string;
}> = ({ title, children, onClose, size = "max-w-lg" }) => (
  <AnimatePresence>
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50 p-4" onClick={onClose}>
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
        className={`bg-white rounded-2xl shadow-2xl w-full ${size} max-h-[90vh] overflow-y-auto`} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          {title}
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 transition-colors">
            <X size={16} />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </motion.div>
    </motion.div>
  </AnimatePresence>
);

// ============================================================================
// MAIN COMPONENT
// ============================================================================
const ManageLocations: React.FC = () => {
  const router = useRouter();

  const [filters, setFilters] = useState<FilterState>({ search: "", status: "all", type: "all" });
  const [openRow, setOpenRow] = useState<number | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState<boolean>(false);
  const [addModalOpen, setAddModalOpen] = useState<boolean>(false);
  const [editModalOpen, setEditModalOpen] = useState<boolean>(false);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState<boolean>(false);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [locations, setLocations] = useState<Location[]>([]);
  const [staffs, setStaffs] = useState<Staff[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  const [form, setForm] = useState<LocationFormData>({
    location_name: "", address: "", city: "", state: "", phone: "", country: "USA", postal_code: "", staffs: "",
  });

  const debouncedSearch = useDebounce(filters.search, 300);

  useEffect(() => { fetchLocations(); }, []);

  const fetchLocations = async (): Promise<void> => {
    setIsLoading(true);
    try {
      const res = await apiGet("/locations");
      const locArr = res?.data?.data?.locations ?? res?.data?.data ?? res?.data?.locations ?? res?.data?.location ?? [];
      const staffArr = res?.data?.data?.staffs ?? res?.data?.staffs ?? [];
      setLocations(Array.isArray(locArr) ? locArr : []);
      setStaffs(Array.isArray(staffArr) ? staffArr : []);
    } catch { setLocations([]); setStaffs([]); }
    finally { setIsLoading(false); }
  };

  const validateForm = (fd: LocationFormData): { isValid: boolean; errors: FormErrors } => {
    const errors: FormErrors = {};
    if (!fd.location_name?.trim()) errors.location_name = "Location name is required";
    else if (fd.location_name.length < 2) errors.location_name = "Must be at least 2 characters";
    if (!fd.address?.trim()) errors.address = "Address is required";
    else if (fd.address.length < 5) errors.address = "Must be at least 5 characters";
    if (!fd.city?.trim()) errors.city = "City is required";
    if (!fd.state?.trim()) errors.state = "State is required";
    if (!fd.phone?.trim()) errors.phone = "Phone number is required";
    if (!fd.country?.trim()) errors.country = "Country is required";
    return { isValid: Object.keys(errors).length === 0, errors };
  };

  const handleAdd = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault(); if (isSubmitting) return;
    setFormErrors({});
    const validation = validateForm(form);
    if (!validation.isValid) { setFormErrors(validation.errors); const first = Object.values(validation.errors)[0]; if (first) toast.error(first); return; }
    setIsSubmitting(true);
    try {
      await apiPost("/locationsadd", { ...form, country: form.country || "USA" }, {}, ["/locations"]);
      toast.success("Location created successfully!");
      setAddModalOpen(false); resetForm(); await fetchLocations();
    } catch (err: unknown) {
      const error = err as { response?: { status?: number; data?: { errors?: Record<string, string[]> } } };
      const s = error.response?.status;
      if (s === 403) toast.error("Your subscription does not allow more locations.");
      else if (s === 412) toast.error("Business location limit reached.");
      else if (error.response?.data?.errors) Object.values(error.response.data.errors).flat().forEach((e: string) => toast.error(e));
      else toast.error("Failed to create location.");
    } finally { setIsSubmitting(false); }
  };

  const handleEdit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault(); if (isSubmitting || !selectedLocation) return;
    setFormErrors({});
    const validation = validateForm(form);
    if (!validation.isValid) { setFormErrors(validation.errors); const first = Object.values(validation.errors)[0]; if (first) toast.error(first); return; }
    setIsSubmitting(true);
    try {
      await apiPut(`/locationsupdate/${selectedLocation.id}`, { ...form, staffs: form.staffs || selectedLocation.staffs || "", head_office: selectedLocation.head_office || "no", location_status: selectedLocation.location_status || "on", status: selectedLocation.status || "active" }, {}, ["/locations"]);
      toast.success("Location updated successfully!");
      setEditModalOpen(false); setSelectedLocation(null); resetForm(); await fetchLocations();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { errors?: Record<string, string[]> } } };
      if (error.response?.data?.errors) Object.values(error.response.data.errors).flat().forEach((e: string) => toast.error(e));
      else toast.error("Failed to update location");
    } finally { setIsSubmitting(false); }
  };

  const handleDelete = async (): Promise<void> => {
    if (isSubmitting || !selectedLocation) return;
    setIsSubmitting(true);
    try {
      await apiDelete(`/locationsdel/${selectedLocation.id}`, {}, ["/locations"]);
      toast.success("Location deleted successfully!");
      setDeleteModalOpen(false); setSelectedLocation(null); await fetchLocations();
    } catch { toast.error("Failed to delete location."); }
    finally { setIsSubmitting(false); }
  };

  const resetForm = (): void => {
    setForm({ location_name: "", address: "", city: "", state: "", phone: "", country: "USA", postal_code: "", staffs: "" });
    setFormErrors({});
  };

  const handleInputChange = (field: keyof LocationFormData, value: string): void => {
    setForm((p) => ({ ...p, [field]: value }));
    if (formErrors[field]) setFormErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleFilterChange = <K extends keyof FilterState>(key: K, value: FilterState[K]): void => {
    setFilters((p) => ({ ...p, [key]: value }));
    setCurrentPage(1);
  };

  const clearFilters = (): void => { setFilters({ search: "", status: "all", type: "all" }); setCurrentPage(1); };

  const openEditModal = (loc: Location): void => {
    setSelectedLocation(loc);
    setForm({ location_name: loc.location_name || "", address: loc.address || "", city: loc.city || "", state: loc.state || "", phone: loc.phone || "", country: loc.country || "USA", postal_code: loc.postal_code || "", staffs: loc.staffs || "" });
    setFormErrors({});
    setEditModalOpen(true);
  };

  const openDeleteModal = (loc: Location): void => { setSelectedLocation(loc); setDeleteModalOpen(true); };

  const activeFilterCount = useMemo((): number => {
    let c = 0; if (filters.status !== "all") c++; if (filters.type !== "all") c++; if (filters.search) c++; return c;
  }, [filters]);

  const filteredLocations = useMemo(() => locations.filter((loc) => {
    if (!loc) return false;
    const text = [loc.location_name, loc.address, loc.city, loc.state, loc.country].filter(Boolean).join(" ").toLowerCase();
    return text.includes(debouncedSearch.toLowerCase()) && (filters.status === "all" || loc.status === filters.status) && (filters.type === "all" || (filters.type === "head_office" && loc.head_office === "yes") || (filters.type === "branch" && loc.head_office === "no"));
  }), [locations, debouncedSearch, filters]);

  const totalItems = filteredLocations.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const currentItems = filteredLocations.slice(startIndex, endIndex);

  const statistics = useMemo((): Statistics => ({
    totalLocations: locations.length,
    activeLocations: locations.filter((l) => l.status === "active").length,
    headOffices: locations.filter((l) => l.head_office === "yes").length,
    branches: locations.filter((l) => l.head_office === "no").length,
    pendingLocations: locations.filter((l) => l.status === "pending").length,
  }), [locations]);

  const sel = "px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 shadow-sm";

  return (
    <div className="min-h-screen bg-[#f5f5f4]">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 top-0 z-40">
        <div className="max-w-screen-2xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-800 transition-colors">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <h1 className="text-lg font-bold text-gray-900 tracking-tight">Locations</h1>
              <p className="text-xs text-gray-400">Manage and track your business locations</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
              <button onClick={() => setViewMode("table")} className={`w-9 h-9 flex items-center justify-center rounded-lg transition-all ${viewMode === "table" ? "bg-white shadow-sm text-gray-900" : "text-gray-400 hover:text-gray-600"}`}>
                <List className="h-4 w-4" />
              </button>
              <button onClick={() => setViewMode("grid")} className={`w-9 h-9 flex items-center justify-center rounded-lg transition-all ${viewMode === "grid" ? "bg-white shadow-sm text-gray-900" : "text-gray-400 hover:text-gray-600"}`}>
                <Grid3x3 className="h-4 w-4" />
              </button>
            </div>
            <button onClick={fetchLocations} className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors">
              <RefreshCw className="h-4 w-4" />
            </button>
           
            <button onClick={() => { resetForm(); setAddModalOpen(true); }}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white text-sm font-bold rounded-xl hover:bg-gray-800 transition-all shadow-md shadow-gray-900/15">
              <Plus className="h-4 w-4" /><span className="hidden sm:inline">Add Location</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-screen-2xl mx-auto px-6 py-6">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-5">
          <StatCard title="Total" value={statistics.totalLocations} icon={Building} accent="bg-gray-900" />
          <StatCard title="Active" value={statistics.activeLocations} icon={CheckCircle} accent="bg-gray-900" />
          <StatCard title="Head Offices" value={statistics.headOffices} icon={Home} accent="bg-gray-900" />
          <StatCard title="Branches" value={statistics.branches} icon={MapPin} accent="bg-gray-900" />
          <StatCard title="Pending" value={statistics.pendingLocations} icon={Clock} accent="bg-gray-900" />
        </div>

        {/* Search + Filters */}
        <div className="flex gap-3 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input type="text" value={filters.search} onChange={(e) => handleFilterChange("search", e.target.value)}
              placeholder="Search locations..."
              className="w-full pl-11 pr-11 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 outline-none transition text-sm placeholder-gray-300 shadow-sm font-medium" />
            {filters.search && (
              <button onClick={() => handleFilterChange("search", "")} className="absolute right-3.5 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded-full bg-gray-200 text-gray-500 hover:bg-gray-300 transition-colors">
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
          <select value={filters.status} onChange={(e) => handleFilterChange("status", e.target.value as FilterState["status"])} className={sel}>
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="pending">Pending</option>
          </select>
          <select value={filters.type} onChange={(e) => handleFilterChange("type", e.target.value as FilterState["type"])} className={sel}>
            <option value="all">All Types</option>
            <option value="head_office">Head Office</option>
            <option value="branch">Branch</option>
          </select>
        </div>

        {/* Status Chips */}
        <div className="flex items-center gap-2 mb-5 overflow-x-auto pb-1">
          {[{ label: "All", s: "all" as const }, { label: "Active", s: "active" as const }, { label: "Pending", s: "pending" as const }].map(({ label, s }) => {
            const active = filters.status === s;
            return (
              <button key={s} onClick={() => handleFilterChange("status", s)}
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
          Showing <span className="text-gray-700 font-bold">{totalItems > 0 ? startIndex + 1 : 0}–{endIndex}</span> of <span className="text-gray-700 font-bold">{totalItems}</span> locations
        </p>

        {/* Content */}
        {isLoading ? <LoadingState /> :
          currentItems.length === 0 ? (
            <EmptyState
              title={filters.search || activeFilterCount > 0 ? "No locations found" : "No locations yet"}
              description={filters.search || activeFilterCount > 0 ? "Try adjusting your search or filters" : "Get started by adding your first business location"}
              icon={MapPin}
              action={filters.search || activeFilterCount > 0 ? { label: "Clear Filters", onClick: clearFilters } : { label: "Add First Location", onClick: () => { resetForm(); setAddModalOpen(true); } }}
            />
          ) : viewMode === "grid" ? (
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {currentItems.map((loc) => (
                  <LocationGridCard key={loc.id} location={loc} onEdit={openEditModal} onDelete={openDeleteModal}
                    onProducts={(l) => router.push(`/products?location=${l.id}`)} onEmployees={(id) => router.push(`/users_locations/${id}`)} />
                ))}
              </div>
              {totalPages > 1 && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <Pagination currentPage={currentPage} totalPages={totalPages} totalItems={totalItems} startIndex={startIndex} endIndex={endIndex} itemsPerPage={itemsPerPage} onPageChange={setCurrentPage} onItemsPerPageChange={setItemsPerPage} />
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      {["#", "Location", "Address", "City/State", "Phone", "Type", "Status", ""].map((h, i) => (
                        <th key={i} className={`px-5 py-3.5 text-[10px] font-bold uppercase tracking-widest text-gray-400 bg-stone-50/70 ${h === "" ? "text-right" : "text-left"}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {currentItems.map((loc, i) => (
                      <LocationTableRow
                        key={loc.id}
                        location={loc}
                        index={i}
                        startIndex={startIndex}
                        onEdit={openEditModal}
                        onDelete={openDeleteModal}
                        onProducts={(l) => router.push(`/products?location=${l.id}`)}
                        onEmployees={(id) => router.push(`/users_locations/${id}`)}
                        onReports={(l) => router.push(`/reports?location=${l.id}`)}
                        openRow={openRow}
                        setOpenRow={setOpenRow}
                        isSubmitting={isSubmitting}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination currentPage={currentPage} totalPages={totalPages} totalItems={totalItems} startIndex={startIndex} endIndex={endIndex} itemsPerPage={itemsPerPage} onPageChange={setCurrentPage} onItemsPerPageChange={setItemsPerPage} />
            </div>
          )
        }
      </main>

      {/* Add Modal */}
      {addModalOpen && (
        <CombinedModal
          title={
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center">
                <Plus className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Add Location</h2>
                <p className="text-xs text-gray-400">Create a new business location</p>
              </div>
            </div>
          }
          onClose={() => { if (!isSubmitting) { setAddModalOpen(false); resetForm(); } }}
        >
          <form onSubmit={handleAdd}>
            <LocationForm form={form} handleInputChange={handleInputChange} countries={countries} staffs={staffs} errors={formErrors} />
            <div className="flex gap-3 pt-5 border-t border-gray-100 mt-5">
              <button type="button" onClick={() => { setAddModalOpen(false); resetForm(); }}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-50 transition disabled:opacity-50" disabled={isSubmitting}>Cancel</button>
              <button type="submit" className="flex-1 px-4 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-bold hover:bg-gray-800 transition disabled:opacity-50 inline-flex items-center justify-center gap-2 shadow-md shadow-gray-900/15" disabled={isSubmitting}>
                {isSubmitting ? <><Loader2 className="h-4 w-4 animate-spin" />Creating...</> : <><Plus className="h-4 w-4" />Add Location</>}
              </button>
            </div>
          </form>
        </CombinedModal>
      )}

      {/* Edit Modal */}
      {editModalOpen && selectedLocation && (
        <CombinedModal
          title={
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center">
                <Edit className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Edit Location</h2>
                <p className="text-xs text-gray-400">Update location information</p>
              </div>
            </div>
          }
          onClose={() => { if (!isSubmitting) { setEditModalOpen(false); setSelectedLocation(null); resetForm(); } }}
        >
          <form onSubmit={handleEdit}>
            <LocationForm form={form} handleInputChange={handleInputChange} countries={countries} staffs={staffs} errors={formErrors} />
            <div className="flex gap-3 pt-5 border-t border-gray-100 mt-5">
              <button type="button" onClick={() => { setEditModalOpen(false); setSelectedLocation(null); resetForm(); }}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-50 transition disabled:opacity-50" disabled={isSubmitting}>Cancel</button>
              <button type="submit" className="flex-1 px-4 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-bold hover:bg-gray-800 transition disabled:opacity-50 inline-flex items-center justify-center gap-2 shadow-md shadow-gray-900/15" disabled={isSubmitting}>
                {isSubmitting ? <><Loader2 className="h-4 w-4 animate-spin" />Updating...</> : <><Edit className="h-4 w-4" />Update Location</>}
              </button>
            </div>
          </form>
        </CombinedModal>
      )}

      {/* Delete Modal */}
      <DeleteModal isOpen={deleteModalOpen} onClose={() => { setDeleteModalOpen(false); setSelectedLocation(null); }}
        onConfirm={handleDelete} locationName={selectedLocation?.location_name || ""} isSubmitting={isSubmitting} />
    </div>
  );
};

export default withAuth(ManageLocations);