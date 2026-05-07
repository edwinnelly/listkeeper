"use client";
import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/axios";
import React, { useState, useEffect, useMemo } from "react";
import {
  Plus,
  Edit,
  Trash2,
  MapPin,
  Search,
  MoreVertical,
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
import ShortTextWithTooltip from "../component/shorten_len";
import { countries } from "@/app/component/country-list";

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

const useDebounce = <T,>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
};

// ── Stat Card ─────────────────────────────────────────────────────────────
const StatCard: React.FC<{
  title: string;
  value: string | number;
  icon: React.ElementType;
  color: "gray" | "amber" | "rose";
}> = ({ title, value, icon: Icon, color }) => {
  const colorClasses = {
    gray: "bg-gray-50 text-gray-700",
    amber: "bg-amber-50 text-amber-700",
    rose: "bg-rose-50 text-rose-700",
  };
  return (
    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all group">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-gray-500 truncate">{title}</p>
          <p className="text-xl font-bold text-gray-900 mt-0.5">{value}</p>
        </div>
        <div
          className={`w-10 h-10 flex-shrink-0 ${colorClasses[color]} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
};

const FilterChip: React.FC<{
  label: string;
  active?: boolean;
  onClick?: () => void;
}> = ({ label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`px-3 py-1.5 text-sm rounded-full transition-colors whitespace-nowrap flex-shrink-0 ${active ? "bg-gray-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
  >
    {label}
  </button>
);

const EmptyState: React.FC<{
  title: string;
  description: string;
  icon: React.ElementType;
  action?: { label: string; onClick?: () => void; href?: string };
}> = ({ title, description, icon: Icon, action }) => (
  <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 sm:p-12">
    <div className="flex flex-col items-center text-center max-w-md mx-auto">
      <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
        <Icon className="h-8 w-8 sm:h-10 sm:w-10 text-gray-400" />
      </div>
      <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
        {title}
      </h3>
      <p className="text-gray-500 text-sm mb-6">{description}</p>
      {action &&
        (action.href ? (
          <Link
            href={action.href}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-lg hover:from-gray-700 hover:to-gray-800 transition-all shadow-lg shadow-gray-500/25 text-sm"
          >
            <Plus className="h-4 w-4" />
            {action.label}
          </Link>
        ) : (
          <button
            onClick={action.onClick}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-lg hover:from-gray-700 hover:to-gray-800 transition-all shadow-lg shadow-gray-500/25 text-sm"
          >
            <Plus className="h-4 w-4" />
            {action.label}
          </button>
        ))}
    </div>
  </div>
);

const LoadingState: React.FC = () => (
  <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12">
    <div className="flex flex-col items-center justify-center">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-gray-500/20 border-t-gray-600 rounded-full animate-spin" />
        <MapPin className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-gray-600/60" />
      </div>
      <p className="mt-4 text-gray-600 font-medium">Loading locations...</p>
      <p className="text-gray-400 text-sm mt-1">Please wait a moment</p>
    </div>
  </div>
);

const DeleteModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  locationName: string;
  isSubmitting: boolean;
}> = ({ isOpen, onClose, onConfirm, locationName, isSubmitting }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="p-6">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="w-16 h-16 flex items-center justify-center rounded-2xl bg-rose-50 border border-rose-200">
              <AlertTriangle className="w-7 h-7 text-rose-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                Delete Location
              </h2>
              <p className="text-gray-600 text-sm leading-relaxed">
                Are you sure you want to delete{" "}
                <span className="font-semibold text-gray-900">
                  {locationName}
                </span>
                ? This action cannot be undone.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row justify-center gap-3 w-full">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-6 py-3 rounded-lg border border-gray-300 bg-white text-gray-700 font-medium hover:bg-gray-50 transition disabled:opacity-50 order-2 sm:order-1"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onConfirm}
                className="w-full sm:w-auto px-6 py-3 rounded-lg bg-gradient-to-r from-rose-600 to-rose-700 text-white font-medium flex items-center justify-center gap-2 hover:from-rose-700 hover:to-rose-800 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-rose-500/25 order-1 sm:order-2"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    Delete Location
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const configs: Record<
    string,
    { label: string; icon: React.ElementType; color: string }
  > = {
    active: {
      label: "Active",
      icon: CheckCircle,
      color: "text-gray-700 bg-gray-50 border-gray-200",
    },
    inactive: {
      label: "Inactive",
      icon: XCircle,
      color: "text-gray-700 bg-gray-50 border-gray-200",
    },
    pending: {
      label: "Pending",
      icon: AlertCircle,
      color: "text-amber-700 bg-amber-50 border-amber-200",
    },
  };
  const config = configs[status] ?? {
    label: status,
    icon: AlertCircle,
    color: "text-gray-700 bg-gray-50 border-gray-200",
  };
  const Icon = config.icon;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${config.color}`}
    >
      <Icon className="h-3 w-3" />
      {config.label}
    </span>
  );
};

const TypeBadge: React.FC<{ type: "yes" | "no" }> = ({ type }) => {
  const isHO = type === "yes";
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${isHO ? "text-gray-700 bg-gray-50 border-gray-200" : "text-gray-700 bg-gray-50 border-gray-200"}`}
    >
      {isHO ? (
        <>
          <Building className="h-3 w-3" />
          Head Office
        </>
      ) : (
        <>
          <MapPin className="h-3 w-3" />
          Branch
        </>
      )}
    </span>
  );
};

// ── Mobile card (replaces table on sm screens) ────────────────────────────
const LocationMobileCard: React.FC<{
  location: Location;
  index: number;
  onEdit: (l: Location) => void;
  onDelete: (l: Location) => void;
  onProducts: (l: Location) => void;
  onReports: (l: Location) => void;
  isOpen: boolean;
  onToggleOpen: (id: number | null) => void;
  isSubmitting: boolean;
}> = ({
  location,
  index,
  onEdit,
  onDelete,
  onProducts,
  onReports,
  isOpen,
  onToggleOpen,
  isSubmitting,
}) => (
  <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
    <div className="flex items-start justify-between gap-3">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="w-10 h-10 flex-shrink-0 bg-gradient-to-br from-gray-100 to-gray-50 rounded-xl flex items-center justify-center border border-gray-200/50">
          <Building className="h-5 w-5 text-gray-600" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-gray-900 truncate text-sm">
            {location.location_name}
          </p>
          <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
            <Globe className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">{location.country || "No country"}</span>
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <TypeBadge type={location.head_office} />
        <div className="relative">
          <button
            onClick={() => onToggleOpen(isOpen ? null : location.id)}
            className="p-2 rounded-lg hover:bg-gray-100 transition text-gray-400 hover:text-gray-600"
            disabled={isSubmitting}
          >
            <MoreVertical size={16} />
          </button>
          {isOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => onToggleOpen(null)}
              />
              <div className="absolute right-0 top-9 z-40 w-52 bg-white border border-gray-200 rounded-xl shadow-lg">
                <button
                  onClick={() => {
                    onProducts(location);
                    onToggleOpen(null);
                  }}
                  className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition rounded-t-xl border-b border-gray-100"
                >
                  <ArchiveRestore size={15} className="text-gray-600" />
                  Products
                </button>
                <Link href={`/users_locations/${location.id}`}>
                  <button
                    className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition border-b border-gray-100"
                    onClick={() => onToggleOpen(null)}
                  >
                    <UserRoundCheck size={15} className="text-gray-600" />
                    Employees
                  </button>
                </Link>
                <button
                  onClick={() => {
                    onReports(location);
                    onToggleOpen(null);
                  }}
                  className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition border-b border-gray-100"
                >
                  <DatabaseZap size={15} className="text-gray-600" />
                  Sale Reports
                </button>
                <button
                  onClick={() => {
                    onEdit(location);
                    onToggleOpen(null);
                  }}
                  className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition border-b border-gray-100"
                >
                  <Edit size={15} className="text-gray-600" />
                  Edit Location
                </button>
                <button
                  onClick={() => {
                    onDelete(location);
                    onToggleOpen(null);
                  }}
                  className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50 transition rounded-b-xl"
                >
                  <Trash2 size={15} />
                  Delete Location
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
    <div className="mt-3 space-y-1.5">
      {location.address && (
        <p className="text-xs text-gray-600 flex items-start gap-1.5">
          <MapPin className="h-3.5 w-3.5 text-gray-400 flex-shrink-0 mt-0.5" />
          <span className="line-clamp-2">
            {location.address}
            {location.city && `, ${location.city}`}
            {location.state && `, ${location.state}`}
          </span>
        </p>
      )}
      {location.phone && (
        <p className="text-xs text-gray-600 flex items-center gap-1.5">
          <Phone className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
          {location.phone}
        </p>
      )}
    </div>
    <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
      <StatusBadge status={location.status} />
      <span className="text-xs text-gray-400">#{index + 1}</span>
    </div>
  </div>
);

// ── Desktop table row ─────────────────────────────────────────────────────
const LocationTableRow: React.FC<{
  location: Location;
  index: number;
  onEdit: (l: Location) => void;
  onDelete: (l: Location) => void;
  onProducts: (l: Location) => void;
  onEmployees: (id: number) => void;
  onReports: (l: Location) => void;
  isOpen: boolean;
  onToggleOpen: (id: number | null) => void;
  isSubmitting: boolean;
}> = ({
  location,
  index,
  onEdit,
  onDelete,
  onProducts,
  onEmployees,
  onReports,
  isOpen,
  onToggleOpen,
  isSubmitting,
}) => (
  <tr className="hover:bg-gray-50/50 transition-colors group">
    <td className="px-4 py-3 text-center">
      <span className="text-sm text-gray-500">{index + 1}</span>
    </td>
    <td className="px-4 py-3">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 bg-gradient-to-br from-gray-100 to-gray-50 rounded-lg flex items-center justify-center flex-shrink-0 border border-gray-200/50">
          <Building className="h-4 w-4 text-gray-600" />
        </div>
        <div className="min-w-0">
          <div className="font-semibold text-gray-900 text-sm group-hover:text-gray-600 transition-colors max-w-[160px] truncate">
            <ShortTextWithTooltip text={location.location_name} max={25} />
          </div>
          <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
            <Globe className="h-3 w-3 flex-shrink-0" />
            <span className="truncate max-w-[100px]">
              {location.country || "N/A"}
            </span>
          </div>
        </div>
      </div>
    </td>
    <td className="px-4 py-3 max-w-[160px]">
      <div className="text-sm text-gray-600 truncate">
        <ShortTextWithTooltip text={location.address || "—"} max={30} />
      </div>
      {location.postal_code && (
        <div className="text-xs text-gray-400 mt-0.5 truncate">
          Postal: {location.postal_code}
        </div>
      )}
    </td>
    <td className="px-4 py-3 max-w-[120px]">
      <div className="text-sm text-gray-900 truncate">
        <ShortTextWithTooltip text={location.city || "—"} max={20} />
      </div>
      <div className="text-xs text-gray-500 truncate">
        <ShortTextWithTooltip text={location.state || "—"} max={20} />
      </div>
    </td>
    <td className="px-4 py-3">
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
    <td className="px-4 py-3 whitespace-nowrap">
      <TypeBadge type={location.head_office} />
    </td>
    <td className="px-4 py-3 whitespace-nowrap">
      <StatusBadge status={location.status} />
    </td>
    <td className="px-4 py-3 text-center relative whitespace-nowrap">
      <button
        onClick={() => onToggleOpen(isOpen ? null : location.id)}
        className="p-1.5 rounded-lg hover:bg-gray-100 transition text-gray-400 hover:text-gray-600 disabled:opacity-50"
        disabled={isSubmitting}
      >
        <MoreVertical size={16} />
      </button>
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => onToggleOpen(null)}
          />
          <div className="absolute right-4 z-40 w-52 bg-white border border-gray-200 rounded-xl shadow-lg">
            <Link href={`/locationproducts/${location.encrypted_id}`}>
              <button
                onClick={() => {
                  onProducts(location);
                  onToggleOpen(null);
                }}
                className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition rounded-t-xl border-b border-gray-100"
              >
                <ArchiveRestore size={15} className="text-gray-600" />
                Manage Products
              </button>
            </Link>

            <button
              onClick={() => {
                onEmployees(location.id);
                onToggleOpen(null);
              }}
              className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition border-b border-gray-100"
            >
              <UserRoundCheck size={15} className="text-gray-600" />
              Employees
            </button>
            <button
              onClick={() => {
                onReports(location);
                onToggleOpen(null);
              }}
              className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition border-b border-gray-100"
            >
              <DatabaseZap size={15} className="text-gray-600" />
              Sale Reports
            </button>
            <button
              onClick={() => {
                onEdit(location);
                onToggleOpen(null);
              }}
              className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition border-b border-gray-100"
            >
              <Edit size={15} className="text-gray-600" />
              Edit Location
            </button>
            <button
              onClick={() => {
                onDelete(location);
                onToggleOpen(null);
              }}
              className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50 transition rounded-b-xl"
            >
              <Trash2 size={15} />
              Delete Location
            </button>
          </div>
        </>
      )}
    </td>
  </tr>
);

// ── Grid card ─────────────────────────────────────────────────────────────
const LocationGridCard: React.FC<{
  location: Location;
  onEdit: (l: Location) => void;
  onDelete: (l: Location) => void;
  onProducts: (l: Location) => void;
  onEmployees: (id: number) => void;
}> = ({ location, onEdit, onDelete, onProducts, onEmployees }) => (
  <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all group">
    <div className="p-4">
      <div className="flex items-start justify-between mb-3 gap-2">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="w-10 h-10 flex-shrink-0 bg-gradient-to-br from-gray-100 to-gray-50 rounded-xl flex items-center justify-center border border-gray-200/50">
            <Building className="h-5 w-5 text-gray-600" />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-gray-900 text-sm truncate">
              {location.location_name}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
              <Globe className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">
                {location.country || "No country"}
              </span>
            </p>
          </div>
        </div>
        <TypeBadge type={location.head_office} />
      </div>
      <div className="space-y-1.5 mb-3">
        {location.address && (
          <p className="text-xs text-gray-600 flex items-start gap-2">
            <MapPin className="h-3.5 w-3.5 text-gray-400 flex-shrink-0 mt-0.5" />
            <span className="line-clamp-2">{location.address}</span>
          </p>
        )}
        {location.city && (
          <p className="text-xs text-gray-600 flex items-center gap-2">
            <Home className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
            <span className="truncate">
              {location.city}
              {location.state && `, ${location.state}`}
            </span>
          </p>
        )}
        {location.phone && (
          <p className="text-xs text-gray-600 flex items-center gap-2">
            <Phone className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
            <span className="truncate">{location.phone}</span>
          </p>
        )}
      </div>
      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <StatusBadge status={location.status} />
        <div className="flex gap-1">
          <button
            onClick={() => onProducts(location)}
            className="p-1.5 text-gray-500 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
            title="Products"
          >
            <ArchiveRestore className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => onEmployees(location.id)}
            className="p-1.5 text-gray-500 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
            title="Employees"
          >
            <Users className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => onEdit(location)}
            className="p-1.5 text-gray-500 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
            title="Edit"
          >
            <Edit className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => onDelete(location)}
            className="p-1.5 text-gray-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
            title="Delete"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  </div>
);

// ── Pagination ─────────────────────────────────────────────────────────────
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
  if (totalPages <= 5) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    let start = Math.max(2, currentPage - 1),
      end = Math.min(totalPages - 1, currentPage + 1);
    if (currentPage <= 3) end = Math.min(4, totalPages - 1);
    if (currentPage >= totalPages - 2) start = Math.max(totalPages - 3, 2);
    if (start > 2) pages.push("...");
    for (let i = start; i <= end; i++) pages.push(i);
    if (end < totalPages - 1) pages.push("...");
    if (totalPages > 1) pages.push(totalPages);
  }
  if (totalPages <= 1) return null;
  return (
    <div className="px-4 sm:px-6 py-4 border-t border-gray-200 bg-gray-50/30 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Show</span>
          <select
            value={itemsPerPage}
            onChange={(e) => {
              onItemsPerPageChange(Number(e.target.value));
              onPageChange(1);
            }}
            className="px-2 py-1 text-sm border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-gray-500/20 focus:border-gray-500 outline-none"
          >
            {[10, 25, 50, 100].map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </div>
        <span className="text-sm text-gray-500">
          {startIndex + 1}–{endIndex} of {totalItems}
        </span>
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className="p-1.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronsLeft className="h-4 w-4" />
        </button>
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-1.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        {pages.map((page, i) => (
          <React.Fragment key={i}>
            {page === "..." ? (
              <span className="px-2 py-1.5 text-gray-400 text-sm">...</span>
            ) : (
              <button
                onClick={() => onPageChange(page as number)}
                className={`min-w-[2rem] h-8 flex items-center justify-center rounded-lg text-sm font-medium transition-colors ${currentPage === page ? "bg-gray-600 text-white" : "text-gray-700 hover:bg-gray-100 border border-gray-300"}`}
              >
                {page}
              </button>
            )}
          </React.Fragment>
        ))}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-1.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className="p-1.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronsRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

// ── Filter Drawer ──────────────────────────────────────────────────────────
const FilterDrawer: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  filters: FilterState;
  totalItems: number;
  onFilterChange: <K extends keyof FilterState>(
    k: K,
    v: FilterState[K],
  ) => void;
  onClearFilters: () => void;
  activeFilterCount: number;
}> = ({
  isOpen,
  onClose,
  filters,
  totalItems,
  onFilterChange,
  onClearFilters,
  activeFilterCount,
}) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="absolute right-0 top-0 h-full w-full sm:w-80 bg-white shadow-2xl">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-gray-600" />
            <h3 className="font-semibold text-gray-900">Filters</h3>
            {activeFilterCount > 0 && (
              <span className="ml-1 px-2 py-0.5 text-xs bg-gray-600 text-white rounded-full">
                {activeFilterCount}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <X size={18} />
          </button>
        </div>
        <div className="overflow-y-auto h-[calc(100vh-140px)] p-4 space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 block">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) =>
                onFilterChange(
                  "status",
                  e.target.value as FilterState["status"],
                )
              }
              className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-500/20 focus:border-gray-500 outline-none"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="pending">Pending</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 block">
              Location Type
            </label>
            <select
              value={filters.type}
              onChange={(e) =>
                onFilterChange("type", e.target.value as FilterState["type"])
              }
              className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-500/20 focus:border-gray-500 outline-none"
            >
              <option value="all">All Types</option>
              <option value="head_office">Head Office</option>
              <option value="branch">Branch</option>
            </select>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-gray-50/50">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-gray-600">
              <span className="font-semibold">{totalItems}</span> locations
              found
            </p>
            {activeFilterCount > 0 && (
              <button
                onClick={onClearFilters}
                className="text-sm text-gray-600 hover:text-gray-700 font-medium inline-flex items-center gap-1"
              >
                <FilterX size={13} />
                Clear all
              </button>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-full px-4 py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-lg hover:from-gray-700 hover:to-gray-800 transition-colors font-medium text-sm"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Location Form ──────────────────────────────────────────────────────────
const LocationForm: React.FC<{
  form: LocationFormData;
  handleInputChange: (f: keyof LocationFormData, v: string) => void;
  inputClass: string;
  labelClass: string;
  countries: string[];
  staffs?: Staff[];
  errors?: FormErrors;
}> = ({
  form,
  handleInputChange,
  inputClass,
  labelClass,
  countries,
  staffs = [],
  errors = {},
}) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
    <div className="sm:col-span-2">
      <label className={labelClass}>
        Location Name <span className="text-rose-500">*</span>
      </label>
      <input
        type="text"
        value={form.location_name}
        onChange={(e) => handleInputChange("location_name", e.target.value)}
        className={`${inputClass} ${errors.location_name ? 'border-rose-500 focus:ring-rose-500/20 focus:border-rose-500' : ''}`}
        placeholder="Enter location name"
        maxLength={70}
      />
      {errors.location_name && (
        <p className="text-xs text-rose-500 mt-1">{errors.location_name}</p>
      )}
      <div className="text-xs text-gray-400 mt-1 text-right">
        {form.location_name.length}/70
      </div>
    </div>
    <div className="sm:col-span-2">
      <label className={labelClass}>
        Address <span className="text-rose-500">*</span>
      </label>
      <input
        type="text"
        value={form.address}
        onChange={(e) => handleInputChange("address", e.target.value)}
        className={`${inputClass} ${errors.address ? 'border-rose-500 focus:ring-rose-500/20 focus:border-rose-500' : ''}`}
        placeholder="Enter full address"
        maxLength={100}
      />
      {errors.address && (
        <p className="text-xs text-rose-500 mt-1">{errors.address}</p>
      )}
      <div className="text-xs text-gray-400 mt-1 text-right">
        {form.address.length}/100
      </div>
    </div>
    <div>
      <label className={labelClass}>
        City <span className="text-rose-500">*</span>
      </label>
      <input
        type="text"
        value={form.city}
        onChange={(e) => handleInputChange("city", e.target.value)}
        className={`${inputClass} ${errors.city ? 'border-rose-500 focus:ring-rose-500/20 focus:border-rose-500' : ''}`}
        placeholder="Enter city"
        maxLength={50}
      />
      {errors.city && (
        <p className="text-xs text-rose-500 mt-1">{errors.city}</p>
      )}
      <div className="text-xs text-gray-400 mt-1 text-right">
        {form.city.length}/50
      </div>
    </div>
    <div>
      <label className={labelClass}>
        State/Province <span className="text-rose-500">*</span>
      </label>
      <input
        type="text"
        value={form.state}
        onChange={(e) => handleInputChange("state", e.target.value)}
        className={`${inputClass} ${errors.state ? 'border-rose-500 focus:ring-rose-500/20 focus:border-rose-500' : ''}`}
        placeholder="Enter state/province"
        maxLength={50}
      />
      {errors.state && (
        <p className="text-xs text-rose-500 mt-1">{errors.state}</p>
      )}
      <div className="text-xs text-gray-400 mt-1 text-right">
        {form.state.length}/50
      </div>
    </div>
    <div>
      <label className={labelClass}>Select Manager</label>
      <select
        value={form.staffs || ""}
        onChange={(e) => handleInputChange("staffs", e.target.value)}
        className={inputClass}
      >
        <option value="">Select Manager</option>
        {staffs.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </select>
    </div>
    <div>
      <label className={labelClass}>
        Country <span className="text-rose-500">*</span>
      </label>
      <select
        value={form.country}
        onChange={(e) => handleInputChange("country", e.target.value)}
        className={`${inputClass} ${errors.country ? 'border-rose-500 focus:ring-rose-500/20 focus:border-rose-500' : ''}`}
      >
        {countries.map((c: string) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
      {errors.country && (
        <p className="text-xs text-rose-500 mt-1">{errors.country}</p>
      )}
    </div>
    <div>
      <label className={labelClass}>Postal Code</label>
      <input
        type="text"
        value={form.postal_code}
        onChange={(e) => handleInputChange("postal_code", e.target.value)}
        className={`${inputClass} ${errors.postal_code ? 'border-rose-500 focus:ring-rose-500/20 focus:border-rose-500' : ''}`}
        placeholder="Enter postal code"
        maxLength={20}
      />
      {errors.postal_code && (
        <p className="text-xs text-rose-500 mt-1">{errors.postal_code}</p>
      )}
      <div className="text-xs text-gray-400 mt-1 text-right">
        {form.postal_code.length}/20
      </div>
    </div>
    <div>
      <label className={labelClass}>
        Phone Number <span className="text-rose-500">*</span>
      </label>
      <input
        type="tel"
        value={form.phone}
        onChange={(e) => handleInputChange("phone", e.target.value)}
        className={`${inputClass} ${errors.phone ? 'border-rose-500 focus:ring-rose-500/20 focus:border-rose-500' : ''}`}
        placeholder="+234 800 000 0000"
        maxLength={20}
      />
      {errors.phone && (
        <p className="text-xs text-rose-500 mt-1">{errors.phone}</p>
      )}
      <div className="text-xs text-gray-400 mt-1 text-right">
        {form.phone.length}/20
      </div>
    </div>
  </div>
);

// ── Modal (sheet-style on mobile, centered on desktop) ────────────────────
const CombinedModal = ({
  title,
  children,
  onClose,
  size = "max-w-2xl",
}: {
  title: React.ReactNode;
  children: React.ReactNode;
  onClose: () => void;
  size?: string;
}) => (
  <div
    className="fixed inset-0 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm z-50 sm:p-4"
    onClick={onClose}
  >
    <div
      className={`bg-white w-full sm:rounded-2xl shadow-2xl ${size} max-h-[92vh] sm:max-h-[90vh] overflow-y-auto rounded-t-2xl`}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 sticky top-0 bg-white z-10 rounded-t-2xl">
        {title}
        <button
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 transition hover:bg-gray-100 rounded-lg flex-shrink-0 ml-3"
        >
          <X size={18} />
        </button>
      </div>
      <div className="p-4 sm:p-6">{children}</div>
    </div>
  </div>
);

// ==============================================
// Main Component
// ==============================================

const ManageLocations = () => {
  const router = useRouter();

  const [filters, setFilters] = useState<FilterState>({
    search: "",
    status: "all",
    type: "all",
  });
  const [openRow, setOpenRow] = useState<number | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [locations, setLocations] = useState<Location[]>([]);
  const [staffs, setStaffs] = useState<Staff[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  const [form, setForm] = useState<LocationFormData>({
    location_name: "",
    address: "",
    city: "",
    state: "",
    phone: "",
    country: "USA",
    postal_code: "",
    staffs: "",
  });

  const debouncedSearch = useDebounce(filters.search, 300);

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    setIsLoading(true);
    try {
      const res = await apiGet("/locations");
      
      const locArr =
        res?.data?.data?.locations ??
        res?.data?.data ??
        res?.data?.locations ??
        res?.data?.location ??
        [];
      const staffArr = res?.data?.data?.staffs ?? res?.data?.staffs ?? [];
      setLocations(Array.isArray(locArr) ? locArr : []);
      setStaffs(Array.isArray(staffArr) ? staffArr : []);
    } catch {
      setLocations([]);
      setStaffs([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchLocations();
    // toast.success("Data refreshed");
  };

  const validateForm = (fd: LocationFormData): { isValid: boolean; errors: FormErrors } => {
    const errors: FormErrors = {};
    
    // Location name validation
    if (!fd.location_name?.trim()) {
      errors.location_name = "Location name is required";
    } else if (fd.location_name.length > 100) {
      errors.location_name = "Location name must not exceed 100 characters";
    } else if (fd.location_name.length < 2) {
      errors.location_name = "Location name must be at least 2 characters";
    }

    // Address validation
    if (!fd.address?.trim()) {
      errors.address = "Address is required";
    } else if (fd.address.length > 200) {
      errors.address = "Address must not exceed 200 characters";
    } else if (fd.address.length < 5) {
      errors.address = "Address must be at least 5 characters";
    }

    // City validation
    if (!fd.city?.trim()) {
      errors.city = "City is required";
    } else if (fd.city.length > 100) {
      errors.city = "City must not exceed 100 characters";
    } else if (fd.city.length < 2) {
      errors.city = "City must be at least 2 characters";
    }

    // State validation
    if (!fd.state?.trim()) {
      errors.state = "State is required";
    } else if (fd.state.length > 100) {
      errors.state = "State must not exceed 100 characters";
    } else if (fd.state.length < 2) {
      errors.state = "State must be at least 2 characters";
    }

    // Phone validation
    if (!fd.phone?.trim()) {
      errors.phone = "Phone number is required";
    } else {
      // Enhanced phone validation
      const phoneRegex = /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,5}[-\s\.]?[0-9]{1,5}$/;
      if (!phoneRegex.test(fd.phone.replace(/\s/g, ''))) {
        errors.phone = "Please enter a valid phone number";
      }
      if (fd.phone.replace(/[^0-9]/g, '').length < 8) {
        errors.phone = "Phone number must have at least 8 digits";
      }
      if (fd.phone.replace(/[^0-9]/g, '').length > 15) {
        errors.phone = "Phone number must not exceed 15 digits";
      }
    }

    // Country validation
    if (!fd.country?.trim()) {
      errors.country = "Country is required";
    } else if (!countries.includes(fd.country)) {
      errors.country = "Please select a valid country from the list";
    }

    // Postal code validation (optional but if provided, validate format)
    if (fd.postal_code?.trim()) {
      const postalCodeRegex = /^[A-Z0-9\s\-]{3,10}$/i;
      if (!postalCodeRegex.test(fd.postal_code.trim())) {
        errors.postal_code = "Please enter a valid postal code format";
      }
    }

    return { isValid: Object.keys(errors).length === 0, errors };
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    
    // Clear previous errors
    setFormErrors({});
    
    // Validate form
    const validation = validateForm(form);
    if (!validation.isValid) {
      setFormErrors(validation.errors);
      // Show first error as toast
      const firstError = Object.values(validation.errors)[0];
      if (firstError) toast.error(firstError);
      return;
    }
    
    setIsSubmitting(true);
    try {
      await apiPost(
        "/locationsadd",
        { ...form, country: form.country || "USA" },
        {},
        ["/locations"],
      );
      toast.success("Location created successfully!");
      setAddModalOpen(false);
      resetForm();
      await fetchLocations();
    } catch (err: unknown) {
      const error = err as { response?: { status?: number; data?: { errors?: Record<string, string[]> } } };
      const s = error.response?.status;
      if (s === 403)
        toast.error("Your subscription does not allow more locations.");
      else if (s === 412) toast.error("Business location limit reached.");
      else if (error.response?.data?.errors)
        Object.values(error.response.data.errors)
          .flat()
          .forEach((e: string) => toast.error(e));
      else toast.error("Failed to create location.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || !selectedLocation) return;
    
    // Clear previous errors
    setFormErrors({});
    
    // Validate form
    const validation = validateForm(form);
    if (!validation.isValid) {
      setFormErrors(validation.errors);
      // Show first error as toast
      const firstError = Object.values(validation.errors)[0];
      if (firstError) toast.error(firstError);
      return;
    }
    
    setIsSubmitting(true);
    try {
      await apiPut(
        `/locationsupdate/${selectedLocation.id}`,
        {
          ...form,
          staffs: form.staffs || selectedLocation.staffs || "",
          head_office: selectedLocation.head_office || "no",
          location_status: selectedLocation.location_status || "on",
          status: selectedLocation.status || "active",
        },
        {},
        ["/locations"],
      );
      toast.success("Location updated successfully!");
      setEditModalOpen(false);
      setSelectedLocation(null);
      resetForm();
      await fetchLocations();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { errors?: Record<string, string[]> } } };
      if (error.response?.data?.errors)
        Object.values(error.response.data.errors)
          .flat()
          .forEach((e: string) => toast.error(e));
      else toast.error("Failed to update location");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (isSubmitting || !selectedLocation) return;
    setIsSubmitting(true);
    try {
      await apiDelete(`/locationsdel/${selectedLocation.id}`, {}, [
        "/locations",
      ]);
      toast.success("Location deleted successfully!");
      setDeleteModalOpen(false);
      setSelectedLocation(null);
      await fetchLocations();
    } catch {
      toast.error("Failed to delete location.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setForm({
      location_name: "",
      address: "",
      city: "",
      state: "",
      phone: "",
      country: "USA",
      postal_code: "",
      staffs: "",
    });
    setFormErrors({});
  };
  
  const handleInputChange = (field: keyof LocationFormData, value: string) => {
    setForm((p) => ({ ...p, [field]: value }));
    // Clear error for this field when user starts typing
    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };
  
  const handleFilterChange = <K extends keyof FilterState>(
    key: K,
    value: FilterState[K],
  ) => {
    setFilters((p) => ({ ...p, [key]: value }));
    setCurrentPage(1);
  };
  const clearFilters = () => {
    setFilters({ search: "", status: "all", type: "all" });
    setCurrentPage(1);
  };

  const openEditModal = (loc: Location) => {
    setSelectedLocation(loc);
    setForm({
      location_name: loc.location_name || "",
      address: loc.address || "",
      city: loc.city || "",
      state: loc.state || "",
      phone: loc.phone || "",
      country: loc.country || "USA",
      postal_code: loc.postal_code || "",
      staffs: loc.staffs || "",
    });
    setFormErrors({});
    setEditModalOpen(true);
  };
  
  const openDeleteModal = (loc: Location) => {
    setSelectedLocation(loc);
    setDeleteModalOpen(true);
  };

  const activeFilterCount = useMemo(() => {
    let c = 0;
    if (filters.status !== "all") c++;
    if (filters.type !== "all") c++;
    if (filters.search) c++;
    return c;
  }, [filters]);

  const filteredLocations = useMemo(
    () =>
      locations.filter((loc) => {
        if (!loc) return false;
        const text = [
          loc.location_name,
          loc.address,
          loc.city,
          loc.state,
          loc.country,
        ]
          .join(" ")
          .toLowerCase();
        return (
          text.includes(debouncedSearch.toLowerCase()) &&
          (filters.status === "all" || loc.status === filters.status) &&
          (filters.type === "all" ||
            (filters.type === "head_office" && loc.head_office === "yes") ||
            (filters.type === "branch" && loc.head_office === "no"))
        );
      }),
    [locations, debouncedSearch, filters],
  );

  const totalItems = filteredLocations.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const currentItems = filteredLocations.slice(startIndex, endIndex);

  const statistics = useMemo(
    (): Statistics => ({
      totalLocations: locations.length,
      activeLocations: locations.filter((l) => l.status === "active").length,
      headOffices: locations.filter((l) => l.head_office === "yes").length,
      branches: locations.filter((l) => l.head_office === "no").length,
      pendingLocations: locations.filter((l) => l.status === "pending").length,
    }),
    [locations],
  );

  const inputClass =
    "w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 outline-none transition-all placeholder-gray-400 text-sm hover:border-gray-400";
  const labelClass = "block text-sm font-semibold text-gray-700 mb-1.5";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ─── Sticky Header ───────────────────────────────────────────────── */}
      <header className="bg-white border-b border-gray-200 shadow-sm w-full mt-0">
        <div className="max-w-screen-xl mx-auto px-3 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <Link
                href="/dashboard"
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div className="min-w-0">
                <h1 className="text-lg sm:text-2xl font-bold text-gray-900 truncate">
                  Locations
                </h1>
                <p className="text-xs text-gray-500 hidden sm:block">
                  Manage and track your business locations
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
              {/* view toggle: md+ in header */}
              <button
                onClick={() =>
                  setViewMode(viewMode === "table" ? "grid" : "table")
                }
                className="hidden md:flex p-2.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
                title={viewMode === "table" ? "Grid view" : "Table view"}
              >
                {viewMode === "table" ? (
                  <Grid3x3 className="h-4 w-4" />
                ) : (
                  <List className="h-4 w-4" />
                )}
              </button>
              <button
                onClick={handleRefresh}
                className="p-2.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
                title="Refresh"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
              <button className="hidden sm:flex items-center gap-2 px-3 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors text-sm font-medium">
                <Download size={15} />
                Export
              </button>
              <button
                onClick={() => {
                  resetForm();
                  setAddModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2.5 bg-gradient-to-r from-gray-600 to-gray-700 text-white text-sm font-medium rounded-lg hover:from-gray-700 hover:to-gray-800 transition-all shadow-lg shadow-gray-500/25"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Add Location</span>
                <span className="sm:hidden">Add</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ─── Main Content ─────────────────────────────────────────────────── */}
      <main className="max-w-screen-xl mx-auto px-3 sm:px-6 py-4 sm:py-6">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3 mb-5">
          <StatCard
            title="Total"
            value={statistics.totalLocations}
            icon={Building}
            color="gray"
          />
          <StatCard
            title="Active"
            value={statistics.activeLocations}
            icon={CheckCircle}
            color="gray"
          />
          <StatCard
            title="Head Offices"
            value={statistics.headOffices}
            icon={Home}
            color="gray"
          />
          <StatCard
            title="Branches"
            value={statistics.branches}
            icon={MapPin}
            color="amber"
          />
          <StatCard
            title="Pending"
            value={statistics.pendingLocations}
            icon={Clock}
            color="rose"
          />
        </div>

        {/* Search + Filter */}
        <div className="flex gap-2 mb-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4 pointer-events-none" />
            <input
              type="text"
              value={filters.search}
              onChange={(e) => handleFilterChange("search", e.target.value)}
              placeholder="Search locations..."
              className="w-full pl-9 pr-9 py-2.5 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-500/20 focus:border-gray-500 outline-none transition placeholder-gray-400 text-sm"
            />
            {filters.search && (
              <button
                onClick={() => handleFilterChange("search", "")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <button
            onClick={() => setFilterDrawerOpen(true)}
            className="relative inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors shadow-sm text-sm font-medium text-gray-700 flex-shrink-0"
          >
            <Filter className="h-4 w-4 text-gray-600" />
            <span className="hidden sm:inline">Filters</span>
            {activeFilterCount > 0 && (
              <span className="absolute -top-2 -right-2 w-5 h-5 bg-gray-600 text-white text-xs rounded-full flex items-center justify-center font-medium">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* Filter chips — horizontally scrollable on mobile */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1 -mx-3 px-3 sm:mx-0 sm:px-0 sm:flex-wrap [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <FilterChip
            label="All"
            active={filters.status === "all" && filters.type === "all"}
            onClick={clearFilters}
          />
          <FilterChip
            label="Active"
            active={filters.status === "active"}
            onClick={() =>
              handleFilterChange(
                "status",
                filters.status === "active" ? "all" : "active",
              )
            }
          />
          <FilterChip
            label="Head Office"
            active={filters.type === "head_office"}
            onClick={() =>
              handleFilterChange(
                "type",
                filters.type === "head_office" ? "all" : "head_office",
              )
            }
          />
          <FilterChip
            label="Branch"
            active={filters.type === "branch"}
            onClick={() =>
              handleFilterChange(
                "type",
                filters.type === "branch" ? "all" : "branch",
              )
            }
          />
          <FilterChip
            label="Pending"
            active={filters.status === "pending"}
            onClick={() =>
              handleFilterChange(
                "status",
                filters.status === "pending" ? "all" : "pending",
              )
            }
          />
        </div>

        {/* Count + mobile view toggle */}
        <div className="mb-3 flex items-center justify-between">
          <span className="text-xs sm:text-sm text-gray-500">
            Showing{" "}
            <span className="font-semibold text-gray-800">
              {startIndex + 1}–{endIndex}
            </span>{" "}
            of <span className="font-semibold text-gray-800">{totalItems}</span>{" "}
            locations
          </span>
          {/* view toggle: mobile only */}
          <div className="flex md:hidden items-center gap-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded-md transition-colors ${viewMode === "table" ? "bg-white shadow-sm text-gray-600" : "text-gray-500"}`}
            >
              <List className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-md transition-colors ${viewMode === "grid" ? "bg-white shadow-sm text-gray-600" : "text-gray-500"}`}
            >
              <Grid3x3 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Loading */}
        {isLoading && <LoadingState />}

        {/* Empty */}
        {!isLoading && currentItems.length === 0 && (
          <EmptyState
            title={filters.search ? "No locations found" : "No locations yet"}
            description={
              filters.search
                ? "Try adjusting your search or filters"
                : "Get started by adding your first business location"
            }
            icon={MapPin}
            action={
              filters.search
                ? { label: "Clear Filters", onClick: clearFilters }
                : {
                    label: "Add Your First Location",
                    onClick: () => {
                      resetForm();
                      setAddModalOpen(true);
                    },
                  }
            }
          />
        )}

        {/* TABLE VIEW */}
        {!isLoading && currentItems.length > 0 && viewMode === "table" && (
          <>
            {/* Mobile: card stack */}
            <div className="md:hidden space-y-3">
              {currentItems.map((loc, i) => (
                <LocationMobileCard
                  key={loc.id}
                  location={loc}
                  index={startIndex + i}
                  onEdit={openEditModal}
                  onDelete={openDeleteModal}
                  onProducts={(l) => router.push(`/products?location=${l.id}`)}
                  onReports={(l) => router.push(`/reports?location=${l.id}`)}
                  isOpen={openRow === loc.id}
                  onToggleOpen={setOpenRow}
                  isSubmitting={isSubmitting}
                />
              ))}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={totalItems}
                  startIndex={startIndex}
                  endIndex={endIndex}
                  itemsPerPage={itemsPerPage}
                  onPageChange={setCurrentPage}
                  onItemsPerPageChange={setItemsPerPage}
                />
              </div>
            </div>

            {/* Desktop: proper table with overflow-x-auto to fix table overflow */}
            <div className="hidden md:block bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[700px] divide-y divide-gray-100">
                  <thead>
                    <tr className="bg-gray-50">
                      {[
                        "#",
                        "Location",
                        "Address",
                        "City / State",
                        "Phone",
                        "Type",
                        "Status",
                        "Actions",
                      ].map((h) => (
                        <th
                          key={h}
                          className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {currentItems.map((loc, i) => (
                      <LocationTableRow
                        key={loc.id}
                        location={loc}
                        index={startIndex + i}
                        onEdit={openEditModal}
                        onDelete={openDeleteModal}
                        onProducts={(l) =>
                          router.push(`/products?location=${l.id}`)
                        }
                        onEmployees={(id) =>
                          router.push(`/users_locations/${id}`)
                        }
                        onReports={(l) =>
                          router.push(`/reports?location=${l.id}`)
                        }
                        isOpen={openRow === loc.id}
                        onToggleOpen={setOpenRow}
                        isSubmitting={isSubmitting}
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
                onPageChange={setCurrentPage}
                onItemsPerPageChange={setItemsPerPage}
              />
            </div>
          </>
        )}

        {/* GRID VIEW */}
        {!isLoading && currentItems.length > 0 && viewMode === "grid" && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
              {currentItems.map((loc) => (
                <LocationGridCard
                  key={loc.id}
                  location={loc}
                  onEdit={openEditModal}
                  onDelete={openDeleteModal}
                  onProducts={(l) => router.push(`/products?location=${l.id}`)}
                  onEmployees={(id) => router.push(`/users_locations/${id}`)}
                />
              ))}
            </div>
            <div className="mt-4 bg-white rounded-xl border border-gray-200 shadow-sm">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalItems}
                startIndex={startIndex}
                endIndex={endIndex}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
                onItemsPerPageChange={setItemsPerPage}
              />
            </div>
          </>
        )}
      </main>

      {/* Filter Drawer */}
      <FilterDrawer
        isOpen={filterDrawerOpen}
        onClose={() => setFilterDrawerOpen(false)}
        filters={filters}
        totalItems={totalItems}
        onFilterChange={handleFilterChange}
        onClearFilters={clearFilters}
        activeFilterCount={activeFilterCount}
      />

      {/* Add Modal */}
      {addModalOpen && (
        <CombinedModal
          title={
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Plus className="h-4 w-4 text-gray-600" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-gray-900">
                  Add Location
                </h2>
                <p className="text-gray-500 text-xs">
                  Create a new business location
                </p>
              </div>
            </div>
          }
          onClose={() => {
            if (!isSubmitting) {
              setAddModalOpen(false);
              resetForm();
            }
          }}
        >
          <form onSubmit={handleAdd}>
            <LocationForm
              form={form}
              handleInputChange={handleInputChange}
              inputClass={inputClass}
              labelClass={labelClass}
              countries={countries}
              staffs={staffs}
              errors={formErrors}
            />
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 mt-5 pt-5 border-t border-gray-200">
              <button
                type="button"
                onClick={() => {
                  setAddModalOpen(false);
                  resetForm();
                }}
                className="w-full sm:w-auto px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="w-full sm:w-auto px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-gray-600 to-gray-700 rounded-lg hover:from-gray-700 hover:to-gray-800 transition-all inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-gray-500/25"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus size={15} />
                    Add Location
                  </>
                )}
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
              <div className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Edit className="h-4 w-4 text-gray-600" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-gray-900">
                  Edit Location
                </h2>
                <p className="text-gray-500 text-xs">
                  Update location information
                </p>
              </div>
            </div>
          }
          onClose={() => {
            if (!isSubmitting) {
              setEditModalOpen(false);
              setSelectedLocation(null);
              resetForm();
            }
          }}
        >
          <form onSubmit={handleEdit}>
            <LocationForm
              form={form}
              handleInputChange={handleInputChange}
              inputClass={inputClass}
              labelClass={labelClass}
              countries={countries}
              staffs={staffs}
              errors={formErrors}
            />
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 mt-5 pt-5 border-t border-gray-200">
              <button
                type="button"
                onClick={() => {
                  setEditModalOpen(false);
                  setSelectedLocation(null);
                  resetForm();
                }}
                className="w-full sm:w-auto px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="w-full sm:w-auto px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-gray-600 to-gray-700 rounded-lg hover:from-gray-700 hover:to-gray-800 transition-all inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-gray-500/25"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Edit size={15} />
                    Update Location
                  </>
                )}
              </button>
            </div>
          </form>
        </CombinedModal>
      )}

      {/* Delete Modal */}
      <DeleteModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setSelectedLocation(null);
        }}
        onConfirm={handleDelete}
        locationName={selectedLocation?.location_name || ""}
        isSubmitting={isSubmitting}
      />
    </div>
  );
};

export default withAuth(ManageLocations);