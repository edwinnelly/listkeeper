"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import api from "@/lib/axios";
import Cookies from "js-cookie";
import { toast } from "react-hot-toast";
import Link from "next/link";
import Image from "next/image";
import {
  Building2,
  Globe2,
  MapPin,
  DollarSign,
  Briefcase,
  Home,
  RefreshCw,
  Activity,
  Users,
  ExternalLink,
  ArrowLeft,
  Plus,
  Calendar,
  CheckCircle,
  XCircle,
  Loader2,
  ArrowUpRight,
  Clock,
} from "lucide-react";
import { motion } from "framer-motion";

// ============================================================================
// TYPES
// ============================================================================
interface Business {
  id: number;
  name: string;
  logo: string;
  description: string;
  bussiness_key: string;
  status: string;
  created_at: string;
  stats: {
    totalLocations: number;
    activeLocations: number;
    inactiveLocations: number;
  };
  details: {
    website: string;
    country: string;
    currency: string;
    businessType: string;
    address: string;
    creation: string;
  };
}

// ============================================================================
// BADGES
// ============================================================================
const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const config: Record<string, { bg: string; text: string; dot: string; label: string; icon: React.ElementType }> = {
    active: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500", label: "ACTIVE", icon: CheckCircle },
    inactive: { bg: "bg-slate-100", text: "text-slate-500", dot: "bg-slate-400", label: "INACTIVE", icon: XCircle },
    pending: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-400", label: "PENDING", icon: Clock },
  };
  const cfg = config[status?.toLowerCase()] || config.inactive;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold tracking-wide ${cfg.bg} ${cfg.text}`}>
      <Icon className="h-3 w-3" />
      {cfg.label}
    </span>
  );
};

// ============================================================================
// STAT CARD
// ============================================================================
const StatCard: React.FC<{
  icon: React.ElementType;
  label: string;
  value: number;
  trend?: number;
  accent: string;
}> = ({ icon: Icon, label, value, trend, accent }) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4 hover:shadow-md transition-all">
    <div className="flex items-center gap-4">
      <div className={`w-10 h-10 ${accent} rounded-xl flex items-center justify-center flex-shrink-0`}>
        <Icon className="h-4.5 w-4.5 text-white" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5 truncate">{label}</p>
        <p className="text-xl font-bold text-gray-900 leading-none">{value}</p>
      </div>
      {trend !== undefined && (
        <div className="flex items-center gap-1 text-xs font-bold text-emerald-600 flex-shrink-0">
          <ArrowUpRight className="h-3.5 w-3.5" />
          {trend}%
        </div>
      )}
    </div>
  </div>
);

// ============================================================================
// DETAIL CARD
// ============================================================================
const DetailCard: React.FC<{
  icon: React.ElementType;
  label: string;
  value: string;
  isLink?: boolean;
}> = ({ icon: Icon, label, value, isLink = false }) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-all">
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-center flex-shrink-0">
        <Icon className="h-4 w-4 text-gray-400" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">{label}</p>
        {isLink ? (
          <a
            href={value}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-900 hover:text-gray-600 transition-colors"
          >
            Visit site
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        ) : (
          <p className="text-sm font-semibold text-gray-900 truncate">{value || "—"}</p>
        )}
      </div>
    </div>
  </div>
);

// ============================================================================
// LOADING STATE
// ============================================================================
const LoadingState: React.FC = () => (
  <div className="min-h-screen bg-[#f5f5f4] flex items-center justify-center">
    <div className="text-center">
      <div className="relative w-14 h-14 mx-auto mb-5">
        <div className="w-14 h-14 rounded-full border-[3px] border-gray-100" />
        <div className="absolute inset-0 rounded-full border-[3px] border-gray-900 border-t-transparent animate-spin" />
        <Building2 className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
      </div>
      <p className="text-sm font-semibold text-gray-700">Loading business profile</p>
      <p className="text-xs text-gray-400 mt-1">Please wait a moment</p>
    </div>
  </div>
);

// ============================================================================
// ERROR STATE
// ============================================================================
const ErrorState: React.FC = () => (
  <div className="min-h-screen bg-[#f5f5f4] flex items-center justify-center">
    <div className="text-center max-w-md mx-auto px-6">
      <div className="w-16 h-16 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-center mx-auto mb-5">
        <Building2 className="h-8 w-8 text-gray-300" />
      </div>
      <h3 className="text-base font-bold text-gray-800 mb-1.5">Business Not Found</h3>
      <p className="text-sm text-gray-400 mb-6 leading-relaxed">The requested business could not be loaded</p>
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white text-sm font-bold rounded-xl hover:bg-gray-800 transition-all shadow-lg shadow-gray-900/15"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </Link>
    </div>
  </div>
);

// ============================================================================
// FORMAT DATE
// ============================================================================
const formatDate = (d: string | null): string =>
  !d ? "—" : new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export default function DashboardPage(): React.ReactElement {
  const [business, setBusiness] = useState<Business | null>(null);
  const [fetching, setFetching] = useState<boolean>(true);
  const [switchingAccount, setSwitchingAccount] = useState<boolean>(false);

  const params = useParams();
  const router = useRouter();
  const id = params.businesskey as string;

  const fetchBusiness = useCallback(async (): Promise<void> => {
    if (!id) return;

    try {
      await api.get("/sanctum/csrf-cookie");
      const res = await api.get(`/businessinfo/${id}`, {
        headers: { "X-XSRF-TOKEN": Cookies.get("XSRF-TOKEN") || "" },
      });
      const businessData: Business = res.data?.business || res.data?.data?.business || res.data;
      setBusiness(businessData);
    } catch {
      console.error("Error fetching business");
    } finally {
      setFetching(false);
    }
  }, [id]);

  useEffect(() => {
    fetchBusiness();
  }, [fetchBusiness]);

  const handleSwitchAccount = async (): Promise<void> => {
    setSwitchingAccount(true);
    try {
      await api.get("/sanctum/csrf-cookie");
      await api.post(`/switchBusiness/${business?.bussiness_key}`, {}, {
        headers: { "X-XSRF-TOKEN": Cookies.get("XSRF-TOKEN") || "" },
      });

      const res = await api.get(`/businessinfo/${id}`, {
        headers: { "X-XSRF-TOKEN": Cookies.get("XSRF-TOKEN") || "" },
      });

      const businessData: Business = res.data?.business || res.data?.data?.business || res.data;
      setBusiness(businessData);

      toast.success("Business account switched successfully");

      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 1500);
    } catch {
      console.error("Error switching account");
    } finally {
      setSwitchingAccount(false);
    }
  };

  if (fetching) return <LoadingState />;
  if (!business) return <ErrorState />;

  return (
    <div className="min-h-screen bg-[#f5f5f4]">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-screen-2xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-800 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-gray-900 tracking-tight">Business Profile</h1>
              <p className="text-xs text-gray-400">Manage your business settings and locations</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={business.status} />
            <Link
              href="/business"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white text-sm font-bold rounded-xl hover:bg-gray-800 transition-all shadow-md shadow-gray-900/15"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Manage Businesses</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-screen-2xl mx-auto px-6 py-6">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-gray-900 rounded-2xl p-8 relative overflow-hidden shadow-lg mb-6"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent" />
          <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-center gap-5">
              {business.logo ? (
                <div className="relative w-20 h-20 flex-shrink-0">
                  <Image
                    src={`http://localhost:8000/storage/${business.logo}`}
                    alt="Business Logo"
                    fill
                    className="rounded-2xl object-cover border-2 border-white/20"
                    sizes="80px"
                  />
                </div>
              ) : (
                <div className="w-20 h-20 bg-white/10 border-2 border-white/20 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <Building2 className="h-8 w-8 text-white/60" />
                </div>
              )}
              <div>
                <h1 className="text-2xl font-bold text-white mb-2">{business.name}</h1>
                <p className="text-sm text-gray-300 leading-relaxed max-w-xl">
                  {business.description || "Building the future of business"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-300 bg-white/10 rounded-xl px-4 py-2.5 backdrop-blur-sm flex-shrink-0">
              <Calendar className="h-4 w-4" />
              <span className="font-medium">Since {formatDate(business.created_at)}</span>
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
          <StatCard
            icon={Building2}
            label="Total Locations"
            value={business.stats.totalLocations}
            accent="bg-gray-900"
          />
          <StatCard
            icon={Activity}
            label="Active Locations"
            value={business.stats.activeLocations}
            trend={8}
            accent="bg-emerald-600"
          />
          <StatCard
            icon={Users}
            label="Inactive Locations"
            value={business.stats.inactiveLocations}
            accent="bg-amber-500"
          />
        </div>

        {/* Business Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <DetailCard icon={Globe2} label="Website" value={business.details.website} isLink={true} />
          <DetailCard icon={MapPin} label="Country" value={business.details.country} />
          <DetailCard icon={DollarSign} label="Currency" value={business.details.currency} />
          <DetailCard icon={Briefcase} label="Business Type" value={business.details.businessType} />
        </div>

        {/* Address */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-center flex-shrink-0">
              <Home className="h-4 w-4 text-gray-400" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Company Address</p>
              <p className="text-sm font-semibold text-gray-900">{business.details.address || "—"}</p>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex justify-center pt-4">
          {business.status === "active" ? (
            <button
              onClick={handleSwitchAccount}
              disabled={switchingAccount}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white text-sm font-bold rounded-xl hover:bg-gray-800 transition-all shadow-md shadow-gray-900/15 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {switchingAccount ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Switching...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4" />
                  Switch Account
                </>
              )}
            </button>
          ) : (
            <Link href={`/business_subscription/${id}`}>
              <button className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white text-sm font-bold rounded-xl hover:bg-gray-800 transition-all shadow-md shadow-gray-900/15">
                Activate Account
              </button>
            </Link>
          )}
        </div>
      </main>
    </div>
  );
}