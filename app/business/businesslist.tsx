"use client";
import { withAuth } from "@/hoc/withAuth";
import { apiGet } from "@/lib/axios";
import React, { useState, useRef, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  Search,
  Building2,
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  Pause,
  Eye,
  Loader2,
  MapPin,
  Phone,
  ShieldCheck,
  ArrowUpRight,
  Activity,
  Grid3X3,
  List,
  Download,
  X,
  RefreshCw,
  Zap,
  FilterX,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

interface Business {
  id: number;
  business_name: string;
  registration_no: string | null;
  industry_type: string | null;
  email: string | null;
  phone: string | null;
  country: string | null;
  city: string | null;
  state: string | null;
  status: string;
  subscription_plan: string;
  currency: string;
  website: string | null;
  about_business: string | null;
  address: string | null;
  language: string;
  logo: string | null;
  business_key: string;
  slug: string;
  owner_id: number;
  ekey: number;
}

interface WithAuthProps {
  user?: UserType;
  loading?: boolean;
}

interface UserType {
  id?: number;
  name?: string;
  email?: string;
  businesses_one?: Array<{
    id: number;
    business_name: string;
  }>;
}

const STATIC_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// ============================================================
// Utility
// ============================================================
const useDebounce = <T,>(value: T, delay: number): T => {
  const [dv, setDv] = useState<T>(value);
  React.useEffect(() => {
    const t = setTimeout(() => setDv(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return dv;
};

// ============================================================
// Badges
// ============================================================
const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const config: Record<string, { bg: string; text: string; dot: string; label: string }> = {
    active: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500", label: "ACTIVE" },
    pending: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-400", label: "PENDING" },
    suspended: { bg: "bg-slate-100", text: "text-slate-500", dot: "bg-slate-400", label: "SUSPENDED" },
    inactive: { bg: "bg-rose-50", text: "text-rose-700", dot: "bg-rose-500", label: "INACTIVE" },
  };
  const cfg = config[status?.toLowerCase()] || config.inactive;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold tracking-wide ${cfg.bg} ${cfg.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
};

const PlanBadge: React.FC<{ plan: string }> = ({ plan }) => {
  const planLower = plan?.toLowerCase() || '';
  if (planLower.includes('premium') || planLower.includes('enterprise')) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold tracking-wide bg-blue-50 text-blue-700">
        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" />
        PREMIUM
      </span>
    );
  }
  if (planLower.includes('pro')) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold tracking-wide bg-blue-50 text-blue-700">
        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" />
        PRO
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold tracking-wide bg-gray-100 text-gray-700">
      <span className="w-1.5 h-1.5 rounded-full bg-gray-500 flex-shrink-0" />
      BASIC
    </span>
  );
};

// ============================================================
// StatCard
// ============================================================
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

// ============================================================
// DropdownMenu - Rendered via Portal
// ============================================================
const DropdownMenu: React.FC<{
  biz: Business;
  isOpen: boolean;
  onClose: () => void;
  buttonRef: React.RefObject<HTMLButtonElement | null>;
}> = ({ biz, isOpen, onClose, buttonRef }) => {
  const [position, setPosition] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const menuRef = useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const menuWidth = 192;
      const menuHeight = 240;
      
      let top = rect.bottom + 4;
      let left = rect.right - menuWidth;

      if (top + menuHeight > window.innerHeight) {
        top = rect.top - menuHeight - 4;
      }
      if (left < 0) {
        left = rect.left;
      }
      if (left + menuWidth > window.innerWidth) {
        left = window.innerWidth - menuWidth - 8;
      }

      setPosition({ top, left });
    }
  }, [isOpen, buttonRef]);

  React.useEffect(() => {
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
          <Link href={`/switchaccount/${biz.ekey}`} onClick={onClose}>
            <button className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition">
              <ArrowUpRight className="h-3.5 w-3.5 text-gray-400" /> Access Business
            </button>
          </Link>
          <Link href={`/business_profile/${biz.ekey}`} onClick={onClose}>
            <button className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition">
              <Eye className="h-3.5 w-3.5 text-gray-400" /> View Profile
            </button>
          </Link>
          <div className="h-px bg-gray-100 mx-2" />
          <Link href={`/editbusiness/${biz.ekey}`} onClick={onClose}>
            <button className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition">
              <Edit className="h-3.5 w-3.5 text-gray-400" /> Edit Business
            </button>
          </Link>
          <Link href={`/business_suspend/${biz.ekey}`} onClick={onClose}>
            <button className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition">
              <Pause className="h-3.5 w-3.5 text-amber-500" /> Suspend
            </button>
          </Link>
          <div className="h-px bg-gray-100 mx-2" />
          <Link href={`/terminatebusiness/${biz.ekey}`} onClick={onClose}>
            <button className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm font-medium text-rose-600 hover:bg-rose-50 transition">
              <Trash2 className="h-3.5 w-3.5" /> Delete Business
            </button>
          </Link>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};

// ============================================================
// BusinessRow - List view table row (separate component for hooks)
// ============================================================
const BusinessRow: React.FC<{
  biz: Business;
  openDropdown: number | null;
  setOpenDropdown: React.Dispatch<React.SetStateAction<number | null>>;
}> = ({ biz, openDropdown, setOpenDropdown }) => {
  const buttonRef = useRef<HTMLButtonElement>(null);

  return (
    <tr className="hover:bg-[#1e3a5f]/[0.015] transition-colors group border-b border-gray-100 last:border-0">
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-3">
          {biz.logo ? (
            <div className="relative w-9 h-9 rounded-xl overflow-hidden border border-gray-100">
              <Image
                src={`${STATIC_URL}/storage/${biz.logo}`}
                alt={biz.business_name}
                fill
                className="object-cover"
                sizes="36px"
                unoptimized={STATIC_URL.includes('localhost')}
              />
            </div>
          ) : (
            <div className="w-9 h-9 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-center flex-shrink-0">
              <Building2 className="h-4 w-4 text-gray-300" />
            </div>
          )}
          <div className="min-w-0">
            <p className="text-sm font-bold text-gray-900 truncate">{biz.business_name}</p>
            <p className="text-xs text-gray-400 truncate">{biz.industry_type || "—"}</p>
          </div>
        </div>
      </td>
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <MapPin className="h-3.5 w-3.5 text-gray-300 flex-shrink-0" />
          <span>{biz.city || "Remote"}, {biz.country || "—"}</span>
        </div>
      </td>
      <td className="px-5 py-3.5">
        <StatusBadge status={biz.status} />
      </td>
      <td className="px-5 py-3.5">
        <PlanBadge plan={biz.subscription_plan} />
      </td>
      <td className="px-5 py-3.5 text-right">
        <div className="flex items-center justify-end gap-2">
          <Link
            href={`/business_profile/${biz.ekey}`}
            className="px-3 py-1.5 text-xs font-bold text-gray-500 hover:text-gray-900 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            View
          </Link>
          <Link
            href={`/switchaccount/${biz.ekey}`}
            className="px-3 py-1.5 text-xs font-bold bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            Access
          </Link>
          <button
            ref={buttonRef}
            onClick={(e) => {
              e.stopPropagation();
              setOpenDropdown(openDropdown === biz.id ? null : biz.id);
            }}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
          <DropdownMenu
            biz={biz}
            isOpen={openDropdown === biz.id}
            onClose={() => setOpenDropdown(null)}
            buttonRef={buttonRef}
          />
        </div>
      </td>
    </tr>
  );
};

// ============================================================
// BusinessCard - Grid view (separate component for hooks)
// ============================================================
const BusinessCard: React.FC<{
  biz: Business;
  openDropdown: number | null;
  setOpenDropdown: React.Dispatch<React.SetStateAction<number | null>>;
}> = ({ biz, openDropdown, setOpenDropdown }) => {
  const buttonRef = useRef<HTMLButtonElement>(null);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200 transition-all">
      <div className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            {biz.logo ? (
              <div className="relative w-10 h-10 rounded-xl overflow-hidden border border-gray-100">
                <Image
                  src={`${STATIC_URL}/storage/${biz.logo}`}
                  alt={biz.business_name}
                  fill
                  className="object-cover"
                  sizes="40px"
                  unoptimized={STATIC_URL.includes('localhost')}
                />
              </div>
            ) : (
              <div className="w-10 h-10 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-center flex-shrink-0">
                <Building2 className="h-4.5 w-4.5 text-gray-400" />
              </div>
            )}
            <div className="min-w-0">
              <p className="text-sm font-bold text-gray-900 truncate">{biz.business_name}</p>
              <p className="text-xs text-gray-400 truncate">{biz.industry_type || "No industry"}</p>
            </div>
          </div>
          <button
            ref={buttonRef}
            onClick={(e) => {
              e.stopPropagation();
              setOpenDropdown(openDropdown === biz.id ? null : biz.id);
            }}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors flex-shrink-0"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
          <DropdownMenu
            biz={biz}
            isOpen={openDropdown === biz.id}
            onClose={() => setOpenDropdown(null)}
            buttonRef={buttonRef}
          />
        </div>

        <div className="space-y-3 pt-3 border-t border-gray-50">
          <div className="flex items-center justify-between">
            <StatusBadge status={biz.status} />
            <PlanBadge plan={biz.subscription_plan} />
          </div>
          <div className="flex items-center gap-4 text-xs text-gray-500">
            {biz.phone && (
              <div className="flex items-center gap-1">
                <Phone className="h-3 w-3 text-gray-400 flex-shrink-0" />
                <span className="font-medium truncate">{biz.phone}</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <MapPin className="h-3 w-3 text-gray-400 flex-shrink-0" />
              <span className="font-medium truncate">{biz.city || "Remote"}</span>
            </div>
          </div>
        </div>
      </div>
      <div className="px-5 py-3 bg-gray-50/50 border-t border-gray-100 flex gap-2">
        <Link
          href={`/business_profile/${biz.ekey}`}
          className="flex-1 text-xs font-bold text-gray-500 hover:text-gray-900 transition-colors text-center py-1.5"
        >
          View Details
        </Link>
        <Link
          href={`/switchaccount/${biz.ekey}`}
          className="flex-1 text-xs font-bold text-gray-900 hover:text-gray-600 transition-colors text-center py-1.5"
        >
          Access →
        </Link>
      </div>
    </div>
  );
};

// ============================================================
// EmptyState
// ============================================================
const EmptyState: React.FC<{
  hasSearch: boolean;
  onAddClick: () => void;
}> = ({ hasSearch, onAddClick }) => (
  <div className="col-span-full flex flex-col items-center justify-center py-20">
    <div className="w-16 h-16 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-center mb-5">
      <Building2 className="h-8 w-8 text-gray-300" />
    </div>
    <h3 className="text-base font-bold text-gray-800 mb-1.5">
      {hasSearch ? "No businesses found" : "No businesses available"}
    </h3>
    <p className="text-sm text-gray-400 mb-6 leading-relaxed max-w-sm text-center">
      {hasSearch
        ? "Try adjusting your search terms or filters"
        : "Get started by adding your first business to your portfolio"}
    </p>
    {!hasSearch && (
      <button
        onClick={onAddClick}
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white text-sm font-bold rounded-xl hover:bg-gray-800 transition-all shadow-lg shadow-gray-900/15"
      >
        <Plus className="h-4 w-4" />
        Add First Business
      </button>
    )}
  </div>
);

// ============================================================
// LoadingState
// ============================================================
const LoadingState: React.FC = () => (
  <div className="col-span-full flex flex-col items-center justify-center py-20">
    <div className="relative w-14 h-14 mb-5">
      <div className="w-14 h-14 rounded-full border-[3px] border-gray-100" />
      <div className="absolute inset-0 rounded-full border-[3px] border-gray-900 border-t-transparent animate-spin" />
      <Building2 className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
    </div>
    <p className="text-sm font-semibold text-gray-700">Loading businesses</p>
    <p className="text-xs text-gray-400 mt-1">Please wait a moment</p>
  </div>
);

// ============================================================
// Main Component
// ============================================================
const ManageBusinesses = ({}: WithAuthProps = {}) => {
  const [search, setSearch] = useState<string>("");
  const debouncedSearch = useDebounce(search, 300);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [openDropdown, setOpenDropdown] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState<string>("name");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [planFilter, setPlanFilter] = useState<string>("all");

  // Fetch businesses
  React.useEffect(() => {
    const fetchBusinesses = async () => {
      try {
        setLoading(true);
        const response = await apiGet("/businesses");
        let businessesData = response.data;
        if (businessesData?.data?.businesses) {
          businessesData = businessesData.data.businesses;
        } else if (businessesData?.data) {
          businessesData = businessesData.data;
        } else if (businessesData?.businesses) {
          businessesData = businessesData.businesses;
        }
        const businessesArray = Array.isArray(businessesData) ? businessesData : [];
        setBusinesses(businessesArray);
      } catch (error: unknown) {
        console.error("Failed to fetch businesses:", error);
        const err = error as { response?: { status?: number } };
        if (err.response?.status === 403) {
          window.location.href = '/errors';
          return;
        }
        setBusinesses([]);
      } finally {
        setLoading(false);
      }
    };
    fetchBusinesses();
  }, []);

  // Filter and sort
  const sortedBusinesses = useMemo(() => {
    const filtered = businesses.filter((biz) => {
      const searchLower = debouncedSearch.toLowerCase();
      const matchesSearch =
        debouncedSearch === "" ||
        biz.business_name?.toLowerCase().includes(searchLower) ||
        biz.phone?.toLowerCase().includes(searchLower) ||
        biz.industry_type?.toLowerCase().includes(searchLower) ||
        biz.city?.toLowerCase().includes(searchLower) ||
        biz.country?.toLowerCase().includes(searchLower);
      const matchesStatus = statusFilter === "all" || biz.status === statusFilter;
      const matchesPlan =
        planFilter === "all" ||
        (planFilter === "premium" && biz.subscription_plan?.toLowerCase().includes("premium")) ||
        (planFilter === "basic" && !biz.subscription_plan?.toLowerCase().includes("premium"));
      return matchesSearch && matchesStatus && matchesPlan;
    });

    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "name": return a.business_name.localeCompare(b.business_name);
        case "recent": return b.id - a.id;
        case "status": return a.status.localeCompare(b.status);
        default: return 0;
      }
    });
  }, [businesses, debouncedSearch, statusFilter, planFilter, sortBy]);

  const clearFilters = (): void => {
    setSearch("");
    setStatusFilter("all");
    setPlanFilter("all");
  };

  const activeFilterCount = useMemo((): number => {
    let c = 0;
    if (statusFilter !== "all") c++;
    if (planFilter !== "all") c++;
    if (search) c++;
    return c;
  }, [statusFilter, planFilter, search]);

  const stats = useMemo(() => ({
    total: businesses.length,
    active: businesses.filter((b) => b.status === "active").length,
    premium: businesses.filter((b) => b.subscription_plan?.toLowerCase().includes("premium")).length,
    needsAttention: businesses.filter((b) => b.status !== "active").length,
  }), [businesses]);

  const sel = "px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 shadow-sm";

  return (
    <div className="min-h-screen bg-[#f5f5f4]">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 top-0 z-40 mt-[-13px] w-full">
        <div className="max-w-screen-2xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-800 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <h1 className="text-lg font-bold text-gray-900 tracking-tight">Manage Businesses</h1>
              <p className="text-xs text-gray-400">Manage and monitor your business portfolio</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.location.reload()}
              className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
            {/* <button className="hidden sm:flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors shadow-sm">
              <Download className="h-4 w-4" /> Export
            </button> */}
            <Link
              href="/addbusiness"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white text-sm font-bold rounded-xl hover:bg-gray-800 transition-all shadow-md shadow-gray-900/15"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Add Business</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-screen-2xl mx-auto px-6 py-6">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
          <StatCard title="Total Businesses" value={stats.total} icon={Building2} accent="bg-gray-900" />
          <StatCard title="Active" value={stats.active} icon={Activity} accent="bg-emerald-600" />
          <StatCard title="Premium" value={stats.premium} icon={ShieldCheck} accent="bg-blue-600" />
          <StatCard title="Need Attention" value={stats.needsAttention} icon={Zap} accent="bg-amber-500" />
        </div>

        {/* Search + Filters */}
        <div className="flex gap-3 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search businesses, industries, locations..."
              className="w-full pl-11 pr-11 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 outline-none transition text-sm placeholder-gray-300 shadow-sm font-medium"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded-full bg-gray-200 text-gray-500 hover:bg-gray-300 transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={sel}>
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="inactive">Inactive</option>
          </select>
          <select value={planFilter} onChange={(e) => setPlanFilter(e.target.value)} className={sel}>
            <option value="all">All Plans</option>
            <option value="premium">Premium</option>
            <option value="basic">Basic</option>
          </select>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className={sel}>
            <option value="name">Name</option>
            <option value="recent">Recent</option>
            <option value="status">Status</option>
          </select>
          <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
            <button
              onClick={() => setViewMode("grid")}
              className={`w-9 h-9 flex items-center justify-center rounded-lg transition-all ${
                viewMode === "grid" ? "bg-white shadow-sm text-gray-900" : "text-gray-400 hover:text-gray-600"
              }`}
            >
              <Grid3X3 className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`w-9 h-9 flex items-center justify-center rounded-lg transition-all ${
                viewMode === "list" ? "bg-white shadow-sm text-gray-900" : "text-gray-400 hover:text-gray-600"
              }`}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Status Chips */}
        <div className="flex items-center gap-2 mb-5 overflow-x-auto pb-1">
          {[
            { label: "All", s: "all" as const },
            { label: "Active", s: "active" as const },
            { label: "Pending", s: "pending" as const },
            { label: "Inactive", s: "inactive" as const },
          ].map(({ label, s }) => {
            const active = statusFilter === s;
            return (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`flex-shrink-0 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all border ${
                  active
                    ? "bg-gray-900 text-white border-gray-900 shadow-sm"
                    : "bg-white text-gray-500 border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                {label}
              </button>
            );
          })}
          {activeFilterCount > 0 && (
            <button
              onClick={clearFilters}
              className="flex-shrink-0 ml-auto flex items-center gap-1 text-xs font-bold text-gray-700 hover:underline"
            >
              <FilterX className="h-3.5 w-3.5" /> Clear
            </button>
          )}
        </div>

        {/* Result count */}
        <p className="text-xs text-gray-400 mb-4 font-medium">
          Showing <span className="text-gray-700 font-bold">{sortedBusinesses.length}</span> business{sortedBusinesses.length !== 1 ? "es" : ""}
        </p>

        {/* Content */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          {loading ? (
            <LoadingState />
          ) : sortedBusinesses.length === 0 ? (
            <div className="p-6">
              <EmptyState hasSearch={!!debouncedSearch} onAddClick={() => window.location.href = '/addbusiness'} />
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 p-6">
              {sortedBusinesses.map((biz) => (
                <BusinessCard
                  key={biz.id}
                  biz={biz}
                  openDropdown={openDropdown}
                  setOpenDropdown={setOpenDropdown}
                />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    {["Business", "Location", "Status", "Plan", ""].map((h, i) => (
                      <th
                        key={i}
                        className={`px-5 py-3.5 text-[10px] font-bold uppercase tracking-widest text-gray-400 bg-stone-50/70 ${
                          h === "" ? "text-right" : "text-left"
                        }`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedBusinesses.map((biz) => (
                    <BusinessRow
                      key={biz.id}
                      biz={biz}
                      openDropdown={openDropdown}
                      setOpenDropdown={setOpenDropdown}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default withAuth(ManageBusinesses);