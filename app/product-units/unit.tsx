"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Search,
  ArrowLeft,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Ruler,
  Package,
  Scale,
  Droplets,
  Hash,
  Box,
  Gauge,
  CheckCircle,
  XCircle,
  Eye,
  X,
  FilterX,
} from "lucide-react";
import Link from "next/link";
import { toast } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

// Fix: Make optional fields properly typed
interface ProductUnit {
  id: number;
  owner_id: number;
  business_key: string;
  name: string;
  symbol: string;
  description: string | null;
  unit_type: 'base' | 'derived' | 'conversion';
  conversion_factor: number | null;
  base_unit_id: number | null;
  is_active: boolean;
  is_system_unit: boolean;
  decimal_places: number;
  created_at: string;
  updated_at: string;
  owner?: {
    id: number;
    name: string;
    email: string;
  };
  business?: {
    business_key: string;
    business_name: string;
  };
  base_unit?: {
    id: number;
    name: string;
    symbol: string;
  };
}

// Utility functions
const formatDate = (d: string | null): string =>
  !d
    ? "—"
    : new Date(d).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });

const useDebounce = <T,>(value: T, delay: number): T => {
  const [dv, setDv] = useState<T>(value);
  useEffect(() => {
    const t = setTimeout(() => setDv(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return dv;
};

// Badge Components
const StatusBadge: React.FC<{ isActive: boolean }> = ({ isActive }) => (
  <span
    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold tracking-wide ${
      isActive
        ? "bg-emerald-50 text-emerald-700"
        : "bg-slate-100 text-slate-500"
    }`}
  >
    <span
      className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
        isActive ? "bg-emerald-500" : "bg-slate-400"
      }`}
    />
    {isActive ? "ACTIVE" : "INACTIVE"}
  </span>
);

// Fix: Add proper return type and handle all cases
const unitTypeConfig: Record<string, { bg: string; text: string; dot: string; label: string }> = {
  base: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500", label: "BASE" },
  derived: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500", label: "DERIVED" },
  conversion: { bg: "bg-violet-50", text: "text-violet-700", dot: "bg-violet-500", label: "CONVERSION" },
};

const UnitTypeBadge: React.FC<{ type: string }> = ({ type }) => {
  const cfg = unitTypeConfig[type] ?? unitTypeConfig.base;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold tracking-wide ${cfg.bg} ${cfg.text}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
};

// StatCard Component
const StatCard: React.FC<{
  title: string;
  value: number;
  icon: React.ElementType;
  accent: string;
}> = ({ title, value, icon: Icon, accent }) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4 flex items-center gap-4">
    <div
      className={`w-10 h-10 ${accent} rounded-xl flex items-center justify-center flex-shrink-0`}
    >
      <Icon className="h-4.5 w-4.5 text-white" />
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5 truncate">
        {title}
      </p>
      <p className="text-xl font-bold text-gray-900 leading-none">{value}</p>
    </div>
  </div>
);

// EmptyState Component
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
        <button
          onClick={action.onClick}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white text-sm font-bold rounded-xl hover:bg-gray-800 transition-all shadow-lg shadow-gray-900/15"
        >
          {action.label}
        </button>
      )}
    </div>
  </div>
);

// Pagination Component
const Pagination: React.FC<{
  currentPage: number;
  totalPages: number;
  totalItems: number;
  startIndex: number;
  endIndex: number;
  itemsPerPage: number;
  onPageChange: (p: number) => void;
  onItemsPerPageChange: (n: number) => void;
}> = ({
  currentPage,
  totalPages,
  totalItems,
  startIndex,
  endIndex,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
}) => {
  const pages: (number | string)[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    let s = Math.max(2, currentPage - 2);
    let e = Math.min(totalPages - 1, currentPage + 2);
    if (currentPage <= 4) { s = 2; e = 5; }
    if (currentPage >= totalPages - 3) { s = totalPages - 4; e = totalPages - 1; }
    if (s > 2) pages.push("...");
    for (let i = s; i <= e; i++) pages.push(i);
    if (e < totalPages - 1) pages.push("...");
    if (totalPages > 1) pages.push(totalPages);
  }
  if (totalPages <= 1) return null;

  const Btn: React.FC<{
    onClick: () => void;
    disabled: boolean;
    children: React.ReactNode;
  }> = ({ onClick, disabled, children }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 disabled:opacity-30 transition-colors"
    >
      {children}
    </button>
  );

  return (
    <div className="px-6 py-4 border-t border-gray-100 bg-stone-50/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 font-medium">Rows</span>
          <select
            value={itemsPerPage}
            onChange={(e) => {
              onItemsPerPageChange(Number(e.target.value));
              onPageChange(1);
            }}
            className="px-2 py-1.5 text-xs border border-gray-200 rounded-lg bg-white outline-none font-semibold focus:border-gray-400"
          >
            {[10, 25, 50, 100].map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
        </div>
        <span className="text-xs text-gray-400">
          {totalItems > 0 ? startIndex + 1 : 0}–{endIndex} of {totalItems}
        </span>
      </div>
      <div className="flex items-center gap-1">
        <Btn onClick={() => onPageChange(1)} disabled={currentPage === 1}>
          <ChevronsLeft className="h-3.5 w-3.5" />
        </Btn>
        <Btn onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1}>
          <ChevronLeft className="h-3.5 w-3.5" />
        </Btn>
        <div className="flex items-center gap-1 mx-1">
          {pages.map((p, i) => (
            <React.Fragment key={i}>
              {p === "..." ? (
                <span className="w-8 h-8 flex items-center justify-center text-gray-400 text-xs">…</span>
              ) : (
                <button
                  onClick={() => onPageChange(p as number)}
                  className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                    currentPage === p
                      ? "bg-gray-900 text-white shadow-sm"
                      : "text-gray-600 hover:bg-gray-100 border border-gray-200"
                  }`}
                >
                  {p}
                </button>
              )}
            </React.Fragment>
          ))}
        </div>
        <Btn onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages}>
          <ChevronRight className="h-3.5 w-3.5" />
        </Btn>
        <Btn onClick={() => onPageChange(totalPages)} disabled={currentPage === totalPages}>
          <ChevronsRight className="h-3.5 w-3.5" />
        </Btn>
      </div>
    </div>
  );
};

// View Modal Component
const ViewModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  unit: ProductUnit;
}> = ({ isOpen, onClose, unit }) => (
  <AnimatePresence>
    {isOpen && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center">
                <Eye className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  {unit.name} ({unit.symbol})
                </h2>
                <p className="text-xs text-gray-400">Unit Details</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
          <div className="p-6 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  Unit Information
                </h3>
                <div className="space-y-2">
                  <div>
                    <p className="text-xs text-gray-400">Name</p>
                    <p className="text-sm font-semibold text-gray-900">{unit.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Symbol</p>
                    <p className="text-sm font-mono font-semibold text-gray-900">{unit.symbol}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Description</p>
                    <p className="text-sm text-gray-600">{unit.description || "No description"}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  Configuration
                </h3>
                <div className="space-y-2">
                  <div>
                    <p className="text-xs text-gray-400">Type</p>
                    <UnitTypeBadge type={unit.unit_type} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Decimal Places</p>
                    <p className="text-sm font-semibold text-gray-900">{unit.decimal_places}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Status</p>
                    <StatusBadge isActive={unit.is_active} />
                  </div>
                  {unit.is_system_unit && (
                    <div>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold tracking-wide bg-amber-50 text-amber-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0" />
                        SYSTEM
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {unit.unit_type !== "base" && unit.base_unit && (
              <div>
                <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">
                  Conversion Details
                </h3>
                <div className="bg-stone-50 rounded-xl border border-gray-100 p-4">
                  <div className="flex items-center justify-center gap-3">
                    <div className="text-center">
                      <p className="text-xl font-bold text-gray-900">1</p>
                      <p className="text-xs text-gray-400">{unit.symbol}</p>
                    </div>
                    <span className="text-gray-300 font-bold">=</span>
                    <div className="text-center">
                      <p className="text-xl font-bold text-gray-900">{unit.conversion_factor}</p>
                      <p className="text-xs text-gray-400">{unit.base_unit.symbol}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div>
              <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">
                Metadata
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-gray-400">Created</p>
                  <p className="text-sm font-medium text-gray-900">{formatDate(unit.created_at)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Updated</p>
                  <p className="text-sm font-medium text-gray-900">{formatDate(unit.updated_at)}</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-gray-100">
              <button
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-50 transition"
              >
                Close
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

// Unit Icon Helper - Fix: return React.ElementType
const getUnitIcon = (unit: ProductUnit): React.ElementType => {
  const unitName = unit.name.toLowerCase();
  const unitSymbol = unit.symbol.toLowerCase();

  if (unitName.includes("kg") || unitName.includes("kilogram") || unitSymbol.includes("kg"))
    return Scale;
  if (unitName.includes("gram") || unitSymbol.includes("g")) return Scale;
  if (unitName.includes("liter") || unitName.includes("litre") || unitSymbol.includes("l"))
    return Droplets;
  if (unitName.includes("meter") || unitName.includes("metre") || unitSymbol.includes("m"))
    return Ruler;
  if (unitName.includes("piece") || unitName.includes("pcs") || unitSymbol.includes("pc"))
    return Hash;
  if (unitName.includes("box") || unitName.includes("carton")) return Box;
  if (unitName.includes("dozen") || unitSymbol.includes("dz")) return Package;
  return Package;
};

// Main Component
const ManageProductUnits: React.FC = () => {
  const [search, setSearch] = useState<string>("");
  const debouncedSearch = useDebounce(search, 300);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [unitTypeFilter, setUnitTypeFilter] = useState<string>("all");
  const [viewModalOpen, setViewModalOpen] = useState<boolean>(false);
  const [selectedUnit, setSelectedUnit] = useState<ProductUnit | null>(null);

  // Fix: Properly typed hardcoded data
  const [units] = useState<ProductUnit[]>([
    {
      id: 1, owner_id: 1, business_key: "default", name: "Kilogram", symbol: "kg",
      description: "Base unit for weight measurements", unit_type: "base", conversion_factor: null,
      base_unit_id: null, is_active: true, is_system_unit: true, decimal_places: 3,
      created_at: "2026-01-01T00:00:00Z", updated_at: "2026-01-01T00:00:00Z",
      business: { business_key: "default", business_name: "Default Business" },
    },
    {
      id: 2, owner_id: 1, business_key: "default", name: "Gram", symbol: "g",
      description: "Derived weight unit, 1000 grams = 1 kg", unit_type: "derived", conversion_factor: 0.001,
      base_unit_id: 1, is_active: true, is_system_unit: true, decimal_places: 2,
      created_at: "2026-01-01T00:00:00Z", updated_at: "2026-01-01T00:00:00Z",
      business: { business_key: "default", business_name: "Default Business" },
      base_unit: { id: 1, name: "Kilogram", symbol: "kg" },
    },
    {
      id: 3, owner_id: 1, business_key: "default", name: "Liter", symbol: "L",
      description: "Base unit for volume measurements", unit_type: "base", conversion_factor: null,
      base_unit_id: null, is_active: true, is_system_unit: true, decimal_places: 2,
      created_at: "2026-01-01T00:00:00Z", updated_at: "2026-01-01T00:00:00Z",
      business: { business_key: "default", business_name: "Default Business" },
    },
    {
      id: 4, owner_id: 1, business_key: "default", name: "Milliliter", symbol: "mL",
      description: "Derived volume unit, 1000 mL = 1 L", unit_type: "derived", conversion_factor: 0.001,
      base_unit_id: 3, is_active: true, is_system_unit: true, decimal_places: 0,
      created_at: "2026-01-01T00:00:00Z", updated_at: "2026-01-01T00:00:00Z",
      business: { business_key: "default", business_name: "Default Business" },
      base_unit: { id: 3, name: "Liter", symbol: "L" },
    },
    {
      id: 5, owner_id: 1, business_key: "default", name: "Piece", symbol: "pc",
      description: "Base unit for counting items", unit_type: "base", conversion_factor: null,
      base_unit_id: null, is_active: true, is_system_unit: false, decimal_places: 0,
      created_at: "2026-01-15T10:30:00Z", updated_at: "2026-01-15T10:30:00Z",
      business: { business_key: "default", business_name: "Default Business" },
    },
    {
      id: 6, owner_id: 1, business_key: "default", name: "Dozen", symbol: "dz",
      description: "12 pieces = 1 dozen", unit_type: "conversion", conversion_factor: 12,
      base_unit_id: 5, is_active: true, is_system_unit: false, decimal_places: 0,
      created_at: "2026-01-16T14:20:00Z", updated_at: "2026-01-16T14:20:00Z",
      business: { business_key: "default", business_name: "Default Business" },
      base_unit: { id: 5, name: "Piece", symbol: "pc" },
    },
    {
      id: 7, owner_id: 1, business_key: "default", name: "Meter", symbol: "m",
      description: "Base unit for length measurements", unit_type: "base", conversion_factor: null,
      base_unit_id: null, is_active: true, is_system_unit: true, decimal_places: 2,
      created_at: "2026-01-01T00:00:00Z", updated_at: "2026-01-01T00:00:00Z",
      business: { business_key: "default", business_name: "Default Business" },
    },
    {
      id: 8, owner_id: 1, business_key: "default", name: "Centimeter", symbol: "cm",
      description: "Derived length unit, 100 cm = 1 m", unit_type: "derived", conversion_factor: 0.01,
      base_unit_id: 7, is_active: true, is_system_unit: true, decimal_places: 1,
      created_at: "2026-01-01T00:00:00Z", updated_at: "2026-01-01T00:00:00Z",
      business: { business_key: "default", business_name: "Default Business" },
      base_unit: { id: 7, name: "Meter", symbol: "m" },
    },
    {
      id: 9, owner_id: 1, business_key: "warehouse", name: "Box", symbol: "box",
      description: "Packaging unit for boxed items", unit_type: "base", conversion_factor: null,
      base_unit_id: null, is_active: true, is_system_unit: false, decimal_places: 0,
      created_at: "2026-02-01T09:15:00Z", updated_at: "2026-02-01T09:15:00Z",
      business: { business_key: "warehouse", business_name: "Warehouse Business" },
    },
    {
      id: 10, owner_id: 1, business_key: "default", name: "Inactive Unit", symbol: "iu",
      description: "This unit is no longer in use", unit_type: "base", conversion_factor: null,
      base_unit_id: null, is_active: false, is_system_unit: false, decimal_places: 2,
      created_at: "2026-01-10T11:45:00Z", updated_at: "2026-02-20T16:30:00Z",
      business: { business_key: "default", business_name: "Default Business" },
    },
  ]);

  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, statusFilter, unitTypeFilter]);

  const filteredUnits = useMemo(() => {
    return units.filter((unit) => {
      const searchableText = [
        unit.name, unit.symbol, unit.description ?? "",
        unit.business?.business_name ?? "", unit.base_unit?.name ?? "",
      ]
        .join(" ")
        .toLowerCase();
      const matchesSearch = searchableText.includes(debouncedSearch.toLowerCase());
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && unit.is_active) ||
        (statusFilter === "inactive" && !unit.is_active);
      const matchesUnitType =
        unitTypeFilter === "all" || unit.unit_type === unitTypeFilter;
      return matchesSearch && matchesStatus && matchesUnitType;
    });
  }, [units, debouncedSearch, statusFilter, unitTypeFilter]);

  const totalItems = filteredUnits.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const currentItems = filteredUnits.slice(startIndex, endIndex);

  const handlePageChange = (page: number): void => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  const handleItemsPerPageChange = (value: number): void => {
    setItemsPerPage(value);
    setCurrentPage(1);
  };

  const clearFilters = (): void => {
    setSearch("");
    setStatusFilter("all");
    setUnitTypeFilter("all");
    setCurrentPage(1);
  };

  const activeFilterCount = useMemo((): number => {
    let c = 0;
    if (statusFilter !== "all") c++;
    if (unitTypeFilter !== "all") c++;
    if (search) c++;
    return c;
  }, [statusFilter, unitTypeFilter, search]);

  const stats = useMemo(
    () => ({
      total: units.length,
      base: units.filter((u) => u.unit_type === "base").length,
      derived: units.filter((u) => u.unit_type === "derived").length,
      active: units.filter((u) => u.is_active).length,
    }),
    [units]
  );

  const sel = "px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 shadow-sm";

  return (
    <div className="min-h-screen bg-[#f5f5f4]">
      {/* Header */}
      <header className="bg-white border-b border-gray-100  top-0 z-40">
        <div className="max-w-screen-2xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-800 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <h1 className="text-lg font-bold text-gray-900 tracking-tight">
                Measurement Units
              </h1>
              <p className="text-xs text-gray-400">
                View measurement units for your products
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setSearch("");
                setStatusFilter("all");
                setUnitTypeFilter("all");
                toast.success("Units refreshed");
              }}
              className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-screen-2xl mx-auto px-6 py-6">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
          <StatCard title="Total Units" value={stats.total} icon={Ruler} accent="bg-gray-900" />
          <StatCard title="Base Units" value={stats.base} icon={Package} accent="bg-blue-600" />
          <StatCard title="Derived Units" value={stats.derived} icon={Gauge} accent="bg-amber-500" />
          <StatCard title="Active Units" value={stats.active} icon={CheckCircle} accent="bg-emerald-600" />
        </div>

        {/* Search + Filters */}
        <div className="flex gap-3 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search units by name, symbol, description..."
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
            <option value="inactive">Inactive</option>
          </select>
          <select value={unitTypeFilter} onChange={(e) => setUnitTypeFilter(e.target.value)} className={sel}>
            <option value="all">All Types</option>
            <option value="base">Base Units</option>
            <option value="derived">Derived Units</option>
            <option value="conversion">Conversion Units</option>
          </select>
        </div>

        {/* Status Chips */}
        <div className="flex items-center gap-2 mb-5 overflow-x-auto pb-1">
          {[
            { label: "All", s: "all" as const },
            { label: "Active", s: "active" as const },
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
          Showing{" "}
          <span className="text-gray-700 font-bold">
            {totalItems > 0 ? startIndex + 1 : 0}–{endIndex}
          </span>{" "}
          of <span className="text-gray-700 font-bold">{totalItems}</span> units
        </p>

        {/* Table */}
        {currentItems.length === 0 ? (
          <EmptyState
            title={search || activeFilterCount > 0 ? "No units found" : "No units available"}
            description={search || activeFilterCount > 0 ? "Try adjusting your search or filters." : "There are no product units to display."}
            icon={Ruler}
            action={search || activeFilterCount > 0 ? { label: "Clear Filters", onClick: clearFilters } : undefined}
          />
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    {["#", "Unit Details", "Type", "Conversion", "Status", "Created", ""].map((h, i) => (
                      <th
                        key={i}
                        className={`px-5 py-3.5 text-[10px] font-bold uppercase tracking-widest text-gray-400 bg-stone-50/70 ${
                          h === "Conversion" ? "hidden md:table-cell" : ""
                        } ${h === "" ? "text-right" : "text-left"}`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {currentItems.map((unit, index) => {
                    const Icon = getUnitIcon(unit);
                    return (
                      <tr
                        key={unit.id}
                        className="hover:bg-[#1e3a5f]/[0.015] transition-colors group border-b border-gray-100 last:border-0"
                      >
                        <td className="px-5 py-3.5 text-xs text-gray-400 font-medium tabular-nums">
                          {startIndex + index + 1}
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-center flex-shrink-0">
                              <Icon className="h-4 w-4 text-gray-400" />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-bold text-gray-900 truncate">{unit.name}</p>
                                <span className="text-xs font-mono bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-md">
                                  {unit.symbol}
                                </span>
                                {unit.is_system_unit && (
                                  <span className="text-[10px] font-bold bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded-md">
                                    SYSTEM
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-gray-400 truncate mt-0.5">
                                {unit.description || "No description"}
                              </p>
                              {unit.unit_type !== "base" && unit.base_unit && (
                                <p className="text-xs text-gray-400 mt-1">
                                  Based on: {unit.base_unit.name} ({unit.base_unit.symbol})
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <UnitTypeBadge type={unit.unit_type} />
                        </td>
                        <td className="px-5 py-3.5 hidden md:table-cell">
                          {unit.unit_type !== "base" && unit.conversion_factor ? (
                            <span className="text-xs font-mono bg-stone-50 px-2 py-1 rounded-lg text-gray-600">
                              1 {unit.symbol} = {unit.conversion_factor} {unit.base_unit?.symbol}
                            </span>
                          ) : (
                            <span className="text-sm text-gray-300">—</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5">
                          <StatusBadge isActive={unit.is_active} />
                        </td>
                        <td className="px-5 py-3.5 text-sm text-gray-600">
                          {formatDate(unit.created_at)}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <button
                            onClick={() => {
                              setSelectedUnit(unit);
                              setViewModalOpen(true);
                            }}
                            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
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

      {selectedUnit && (
        <ViewModal
          isOpen={viewModalOpen}
          onClose={() => {
            setViewModalOpen(false);
            setSelectedUnit(null);
          }}
          unit={selectedUnit}
        />
      )}
    </div>
  );
};

export default ManageProductUnits;