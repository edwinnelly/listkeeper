'use client';

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import api from "@/lib/axios";
import { 
  ArrowLeft, 
  Building2, 
  MapPin, 
  Phone, 
  Globe, 
  Mail, 
  Edit3, 
  Users, 
  Calendar, 
  FileText, 
  Shield, 
  Activity,
  CreditCard,
  BarChart,
  UserPlus,
  DownloadCloud,
  ChevronRight,
  ExternalLink,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  DollarSign,
  Target,
  Award,
  Settings,
  MoreHorizontal,
  Star,
  Zap,
  Loader2,
} from "lucide-react";
import Cookies from "js-cookie";
import Image from "next/image";
import { motion } from "framer-motion";

// ============================================================================
// TYPES
// ============================================================================
interface Business {
  id: string;
  name: string;
  description: string;
  email: string;
  phone: string;
  website: string;
  address: string;
  city?: string;
  country?: string;
  industry: string;
  employee_count: number;
  founded_date: string;
  status: string;
  created_at: string;
  logo?: string;
}

type TabType = "overview" | "analytics" | "team" | "settings";

// ============================================================================
// UTILITY
// ============================================================================
const formatDate = (d: string | null): string =>
  !d ? "—" : new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

const getTimeAgo = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return formatDate(dateString);
};

const STATIC_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// ============================================================================
// BADGES
// ============================================================================
const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const config: Record<string, { bg: string; text: string; dot: string; label: string }> = {
    active: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500", label: "ACTIVE" },
    inactive: { bg: "bg-slate-100", text: "text-slate-500", dot: "bg-slate-400", label: "INACTIVE" },
    pending: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-400", label: "PENDING" },
  };
  const cfg = config[status?.toLowerCase()] || config.inactive;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold tracking-wide ${cfg.bg} ${cfg.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
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
  value: string | number;
  accent: string;
}> = ({ icon: Icon, label, value, accent }) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4 hover:shadow-md transition-all">
    <div className="flex items-center gap-4">
      <div className={`w-10 h-10 ${accent} rounded-xl flex items-center justify-center flex-shrink-0`}>
        <Icon className="h-4.5 w-4.5 text-white" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5 truncate">{label}</p>
        <p className="text-xl font-bold text-gray-900 leading-none">{value}</p>
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
      <p className="text-sm text-gray-400 mb-6 leading-relaxed">
        The business profile you&apos;re looking for doesn&apos;t exist or may have been removed.
      </p>
      <Link
        href="/business"
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white text-sm font-bold rounded-xl hover:bg-gray-800 transition-all shadow-lg shadow-gray-900/15"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Businesses
      </Link>
    </div>
  </div>
);

// ============================================================================
// MAIN COMPONENT
// ============================================================================
const ViewBusinessPage: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const id = params.businesskey as string;
  
  const [business, setBusiness] = useState<Business | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<TabType>("overview");

  const fetchBusiness = useCallback(async (): Promise<void> => {
    if (!id) return;
    try {
      await api.get("/sanctum/csrf-cookie");
      const res = await api.get(`/businessinfo/${id}`, {
        headers: { "X-XSRF-TOKEN": Cookies.get("XSRF-TOKEN") || "" },
      });
      const businessData: Business = res.data?.business || res.data?.data?.business || res.data;
      setBusiness(businessData);
    } catch (err) {
      console.error("Error fetching business", err);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchBusiness();
  }, [fetchBusiness]);

  const handleEdit = useCallback((): void => {
    router.push(`/editbusiness/${id}`);
  }, [router, id]);

  const handleTabChange = useCallback((tab: TabType): void => {
    setActiveTab(tab);
  }, []);

  if (isLoading) return <LoadingState />;
  if (!business) return <ErrorState />;

  const tabs: { id: TabType; label: string; icon: React.ElementType }[] = [
    { id: "overview", label: "Overview", icon: Building2 },
    { id: "analytics", label: "Analytics", icon: BarChart },
    { id: "team", label: "Team", icon: Users },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#f5f5f4]">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 top-0 z-40">
        <div className="max-w-screen-2xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/business"
              className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-800 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <h1 className="text-lg font-bold text-gray-900 tracking-tight">{business.name}</h1>
              <p className="text-xs text-gray-400">Business Profile</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={business.status} />
            <button className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors">
              <Star className="h-4 w-4" />
            </button>
            <button className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors">
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-screen-2xl mx-auto px-6">
          <div className="flex gap-6 border-t border-gray-100">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex items-center gap-2 px-1 py-3 text-sm font-semibold border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? "border-gray-900 text-gray-900"
                    : "border-transparent text-gray-400 hover:text-gray-600"
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-screen-2xl mx-auto px-6 py-6">
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-5">
              {/* Hero Card */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6"
              >
                <div className="flex items-start gap-5">
                  <div className="w-20 h-20 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {business.logo ? (
                      <Image
                        src={`${STATIC_URL}/storage/${business.logo}`}
                        alt={business.name}
                        width={80}
                        height={80}
                        className="w-full h-full object-cover"
                        unoptimized={STATIC_URL.includes('localhost')}
                      />
                    ) : (
                      <Building2 className="h-8 w-8 text-gray-300" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className="text-xl font-bold text-gray-900">{business.name}</h2>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-gray-100 text-gray-600">
                        {business.industry}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-400 mb-3">
                      <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{business.city || "Remote"}, {business.country || "N/A"}</span>
                      <span className="w-1 h-1 rounded-full bg-gray-300" />
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" />Created {getTimeAgo(business.created_at)}</span>
                    </div>
                    <p className="text-sm text-gray-500 leading-relaxed">
                      {business.description || "No description provided."}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={handleEdit}
                      className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-50 transition"
                    >
                      <Edit3 className="h-4 w-4 inline mr-2" />
                      Edit
                    </button>
                    <Link
                      href={`/business/payment/${id}`}
                      className="px-4 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-bold hover:bg-gray-800 transition shadow-md shadow-gray-900/15"
                    >
                      <CreditCard className="h-4 w-4 inline mr-2" />
                      Billing
                    </Link>
                  </div>
                </div>
              </motion.div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <StatCard icon={Users} label="Team Size" value={business.employee_count || 0} accent="bg-gray-900" />
                <StatCard icon={Calendar} label="Founded" value={business.founded_date ? new Date(business.founded_date).getFullYear() : "N/A"} accent="bg-blue-600" />
                <StatCard icon={Target} label="Projects" value="12" accent="bg-amber-500" />
                <StatCard icon={DollarSign} label="Revenue" value="$2.4M" accent="bg-emerald-600" />
              </div>

              {/* Contact Information */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
                  <div className="w-9 h-9 bg-gray-900 rounded-xl flex items-center justify-center">
                    <Mail className="h-4.5 w-4.5 text-white" />
                  </div>
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Contact Information</h3>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[
                      { icon: Mail, label: "Email", value: business.email, href: `mailto:${business.email}` },
                      { icon: Phone, label: "Phone", value: business.phone || "Not provided", href: business.phone ? `tel:${business.phone}` : null },
                      { icon: Globe, label: "Website", value: business.website || "Not provided", href: business.website, external: true },
                      { icon: MapPin, label: "Address", value: business.address || "Not provided", href: null },
                    ].map((item, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-3 bg-stone-50 rounded-xl border border-gray-100">
                        <div className="w-9 h-9 bg-white rounded-xl border border-gray-100 flex items-center justify-center flex-shrink-0">
                          <item.icon className="h-4 w-4 text-gray-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">{item.label}</p>
                          {item.href ? (
                            <a
                              href={item.href}
                              target={item.external ? "_blank" : undefined}
                              rel={item.external ? "noopener noreferrer" : undefined}
                              className="text-sm font-semibold text-gray-900 hover:text-gray-600 transition-colors truncate block"
                            >
                              {item.value}
                              {item.external && <ExternalLink className="h-3 w-3 inline ml-1" />}
                            </a>
                          ) : (
                            <p className="text-sm font-semibold text-gray-900 truncate">{item.value}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-gray-900 rounded-xl flex items-center justify-center">
                      <Activity className="h-4.5 w-4.5 text-white" />
                    </div>
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Recent Activity</h3>
                  </div>
                  <Link href="#" className="text-xs font-bold text-gray-500 hover:text-gray-900 transition-colors">View all</Link>
                </div>
                <div className="p-6">
                  <div className="space-y-3">
                    {[1, 2, 3].map((_, idx) => (
                      <div key={idx} className="flex items-center gap-3 pb-3 border-b border-gray-50 last:border-0 last:pb-0">
                        <div className="w-9 h-9 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-center flex-shrink-0">
                          <Zap className="h-4 w-4 text-gray-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-gray-900">Business profile updated</p>
                          <p className="text-xs text-gray-400 mt-0.5">2 hours ago</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-5">
              {/* Quick Actions */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
                  <div className="w-9 h-9 bg-gray-900 rounded-xl flex items-center justify-center">
                    <Zap className="h-4.5 w-4.5 text-white" />
                  </div>
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Quick Actions</h3>
                </div>
                <div className="p-4 space-y-1">
                  {[
                    { icon: BarChart, label: "View Analytics", onClick: () => setActiveTab("analytics") },
                    { icon: UserPlus, label: "Invite Team Member", href: `/business/team/${id}/invite` },
                    { icon: DownloadCloud, label: "Export Business Data", onClick: undefined },
                    { icon: FileText, label: "Generate Report", onClick: undefined },
                  ].map((action, idx) => (
                    action.href ? (
                      <Link
                        key={idx}
                        href={action.href}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors"
                      >
                        <action.icon className="h-4 w-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-700">{action.label}</span>
                      </Link>
                    ) : (
                      <button
                        key={idx}
                        onClick={action.onClick}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors text-left"
                      >
                        <action.icon className="h-4 w-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-700">{action.label}</span>
                      </button>
                    )
                  ))}
                </div>
              </div>

              {/* Business Metrics */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
                  <div className="w-9 h-9 bg-gray-900 rounded-xl flex items-center justify-center">
                    <Award className="h-4.5 w-4.5 text-white" />
                  </div>
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Metrics</h3>
                </div>
                <div className="p-4 space-y-4">
                  {[
                    { label: "Growth Rate", value: "75%", pct: 75 },
                    { label: "Market Share", value: "45%", pct: 45 },
                  ].map((metric, idx) => (
                    <div key={idx}>
                      <div className="flex justify-between text-xs mb-1.5">
                        <span className="font-medium text-gray-500">{metric.label}</span>
                        <span className="font-bold text-gray-900">{metric.value}</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-1.5">
                        <div className="bg-gray-900 h-1.5 rounded-full" style={{ width: `${metric.pct}%` }} />
                      </div>
                    </div>
                  ))}
                  <div className="pt-3 border-t border-gray-100 flex justify-between items-center">
                    <span className="text-xs font-medium text-gray-500">Satisfaction</span>
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star key={star} className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* System Info */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
                  <div className="w-9 h-9 bg-gray-900 rounded-xl flex items-center justify-center">
                    <Shield className="h-4.5 w-4.5 text-white" />
                  </div>
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">System Info</h3>
                </div>
                <div className="p-4 space-y-2">
                  {[
                    { label: "Business ID", value: business.id },
                    { label: "Created", value: formatDate(business.created_at) },
                    { label: "Last Updated", value: formatDate(business.created_at) },
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2.5 bg-stone-50 rounded-xl border border-gray-100">
                      <span className="text-xs text-gray-400">{item.label}</span>
                      <span className="text-xs font-semibold text-gray-900">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Other tabs placeholder */}
        {activeTab !== "overview" && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-center mx-auto mb-5">
                <Activity className="h-8 w-8 text-gray-300" />
              </div>
              <h3 className="text-base font-bold text-gray-800 mb-1.5">
                {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Section
              </h3>
              <p className="text-sm text-gray-400">This section is under development. Check back soon!</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default ViewBusinessPage;