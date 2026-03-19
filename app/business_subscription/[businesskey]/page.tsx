"use client";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
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
  Sparkles,
  TrendingUp,
  Activity,
  Check,
  Star,
  CreditCard,
  Crown,
  Zap,
  Settings,
  DownloadCloud,
  UserPlus,
  BarChart,
  Eye,
  History,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  Briefcase,
  Target,
  Award,
  Layers,
  ExternalLink,
  ChevronRight,
  Download,
  RefreshCw,
} from "lucide-react";
import Cookies from "js-cookie";

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

interface Business {
  id: string;
  name: string;
  description: string;
  email: string;
  phone: string;
  website: string;
  address: string;
  industry_type: string;
  employee_count: number;
  founded_date: string;
  status: string;
  created_at: string;
  about_business: string;
  subscription: {
    plan_name: string;
    users: number;
    end_date: string;
  };
  logo?: string;
}

interface PaymentHistory {
  id: string;
  date: string;
  description: string;
  amount: number;
  status: "completed" | "pending" | "failed";
  invoiceId: string;
  paymentMethod: string;
}

interface Subscription {
  planName: string;
  status: "active" | "pending" | "expired" | "canceled";
  currentPeriod: string;
  nextBilling: string;
  price: number;
  users: number;
  maxUsers: number;
  features: string[];
  renewalDate: string;
}

// =============================================================================
// MOCK DATA
// =============================================================================

const currentSubscription: Subscription = {
  planName: "Simple Start",
  status: "active",
  currentPeriod: "Jan 15, 2024 - Feb 14, 2024",
  nextBilling: "Feb 14, 2024",
  price: 2776,
  users: 2,
  maxUsers: 1,
  features: [
    "Track income & expenses",
    "Send unlimited invoices & quotes",
    "Connect your bank",
    "Basic reports",
    "1 user + accountant",
  ],
  renewalDate: "Feb 14, 2024",
};

const paymentHistory: PaymentHistory[] = [
  {
    id: "inv_001",
    date: "2024-01-15",
    description: "Payment for - Simple Start",
    amount: 2776,
    status: "completed",
    invoiceId: "INV-2024-001",
    paymentMethod: "Visa •••• 4242",
  },
  {
    id: "inv_002",
    date: "2023-12-15",
    description: "Payment for - Simple Start",
    amount: 2776,
    status: "completed",
    invoiceId: "INV-2023-056",
    paymentMethod: "Visa •••• 4242",
  },
];

// =============================================================================
// MAIN COMPONENT
// =============================================================================

const BusinessProfilePage = () => {
  const params = useParams();
  const router = useRouter();
  const id = params.businesskey as string;

  const [business, setBusiness] = useState<Business | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "overview" | "payment-history" | "settings"
  >("overview");
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // ===========================================================================
  // FETCH BUSINESS DATA
  // ===========================================================================

  useEffect(() => {
    const fetchBusiness = async () => {
      if (!id) return;

      try {
        await api.get("/sanctum/csrf-cookie");
        const res = await api.get(`/businessinfo/${id}`, {
          headers: { "X-XSRF-TOKEN": Cookies.get("XSRF-TOKEN") || "" },
        });
        const businessData: Business =
          res.data?.business || res.data?.data?.business || res.data;
        setBusiness(businessData);
      } catch (err) {
        console.error("Error fetching business", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBusiness();
  }, [id]);

  // ===========================================================================
  // HANDLERS
  // ===========================================================================

  const handleEdit = useCallback(() => {
    router.push(`/editbusiness/${id}`);
  }, [router, id]);

  const handleUpgrade = useCallback(() => {
    router.push("/custom_subscriptions");
  }, [router]);

  const handleTabChange = useCallback((tab: "overview" | "payment-history" | "settings") => {
    setActiveTab(tab);
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent, action: () => void) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      action();
    }
  }, []);

  const handleExportCSV = useCallback(() => {
    console.log("Exporting CSV...");
  }, []);

  // ===========================================================================
  // UTILITY FUNCTIONS
  // ===========================================================================

  const formatPrice = useCallback((price: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  }, []);

  const formatDate = useCallback((dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return "Invalid date";
    }
  }, []);

  const getStatusBadge = useCallback((status: string) => {
    const statusConfig = {
      completed: {
        color: "bg-emerald-50 text-emerald-700 border-emerald-200",
        icon: CheckCircle,
        label: "Completed",
      },
      pending: {
        color: "bg-amber-50 text-amber-700 border-amber-200",
        icon: Clock,
        label: "Pending",
      },
      failed: {
        color: "bg-rose-50 text-rose-700 border-rose-200",
        icon: XCircle,
        label: "Failed",
      },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${config.color}`}
      >
        <Icon className="h-3.5 w-3.5" />
        {config.label}
      </span>
    );
  }, []);

  const getStatusColor = useCallback((status: string) => {
    const statusMap: Record<string, string> = {
      active: "bg-emerald-50 text-emerald-700 border-emerald-200",
      pending: "bg-amber-50 text-amber-700 border-amber-200",
      default: "bg-gray-50 text-gray-700 border-gray-200",
    };
    return statusMap[status] || statusMap.default;
  }, []);

  // ===========================================================================
  // LOADING SKELETON
  // ===========================================================================

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-50/30 to-indigo-50/20 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded-full w-32 mb-8"></div>
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-white/50 shadow-2xl shadow-gray-100/20">
              <div className="bg-gradient-to-r from-gray-50/80 to-gray-50/50 border-b border-white/50 px-8 py-12">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex items-center space-x-6 mb-6 lg:mb-0">
                    <div className="w-24 h-24 bg-gray-200 rounded-2xl"></div>
                    <div className="space-y-3">
                      <div className="h-8 bg-gray-200 rounded-full w-64"></div>
                      <div className="h-4 bg-gray-200 rounded-full w-32"></div>
                    </div>
                  </div>
                  <div className="h-12 bg-gray-200 rounded-2xl w-40"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ===========================================================================
  // NOT FOUND STATE
  // ===========================================================================

  if (!business) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-50/30 to-indigo-50/20 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-12 border border-white/50 shadow-2xl shadow-gray-100/20">
            <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-white/50">
              <Building2 className="h-10 w-10 text-gray-400" aria-hidden="true" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              Business Not Found
            </h2>
            <p className="text-gray-600 mb-8 text-lg">
              The business you're looking for doesn't exist or has been moved.
            </p>
            <Link
              href="/business"
              className="inline-flex items-center px-8 py-4 bg-gray-900 text-white font-semibold rounded-2xl hover:bg-gray-800 transition-all duration-300 shadow-lg hover:shadow-xl focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              aria-label="Back to business list"
            >
              <ArrowLeft className="h-5 w-5 mr-3" aria-hidden="true" />
              Back to Business
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ===========================================================================
  // MAIN RENDER
  // ===========================================================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-50/30 to-indigo-50/20 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/business"
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-6 transition-all duration-300 group font-medium focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 rounded-lg px-3 py-2"
            aria-label="Back to business list"
          >
            <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" aria-hidden="true" />
            Back to Business
          </Link>
        </div>

        {/* Main Card */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-white/50 shadow-2xl shadow-gray-100/20 overflow-hidden">
          {/* Hero Section */}
          <div className="bg-gradient-to-r from-gray-50/80 via-gray-50/50 to-indigo-50/30 border-b border-white/50 px-8 py-12">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center space-x-8 mb-8 lg:mb-0">
                <div className="flex items-center gap-6">
                  {business.logo ? (
                    <div className="relative w-24 h-24 rounded-2xl overflow-hidden border border-white/50 shadow-2xl shadow-gray-200/30 backdrop-blur-sm">
                      <Image
                        src={`http://localhost:8000/storage/${business.logo}`}
                        alt={`${business.name} logo`}
                        fill
                        className="object-cover"
                        sizes="96px"
                        unoptimized={process.env.NODE_ENV === 'development'}
                      />
                    </div>
                  ) : (
                    <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 border border-white/50 rounded-2xl flex items-center justify-center shadow-2xl shadow-gray-200/30 backdrop-blur-sm">
                      <Building2 className="h-10 w-10 text-gray-500" aria-hidden="true" />
                    </div>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <Sparkles className="h-5 w-5 text-gray-500" aria-hidden="true" />
                    <h1 className="text-4xl font-bold text-gray-900">
                      {business.name}
                    </h1>
                  </div>
                  <p className="text-gray-600 text-xl font-medium">
                    {business.industry_type}
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={handleEdit}
                  onKeyDown={(e) => handleKeyDown(e, handleEdit)}
                  className="inline-flex items-center px-8 py-4 bg-gray-900 text-white font-semibold rounded-2xl hover:bg-gray-800 transition-all duration-300 shadow-lg hover:shadow-xl group focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                  aria-label="Edit business"
                  type="button"
                >
                  <Edit3 className="h-5 w-5 mr-3 group-hover:scale-110 transition-transform" aria-hidden="true" />
                  Edit Business
                </button>
                <button
                  onClick={handleUpgrade}
                  onKeyDown={(e) => handleKeyDown(e, handleUpgrade)}
                  className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-2xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-lg hover:shadow-xl group focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  aria-label="Upgrade plan"
                  type="button"
                >
                  <Zap className="h-5 w-5 mr-3 group-hover:scale-110 transition-transform" aria-hidden="true" />
                  Upgrade Plan
                </button>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="border-b border-gray-200/50 px-8">
            <nav className="flex space-x-8 -mb-px" aria-label="Business profile tabs" role="tablist">
              {[
                { id: "overview", label: "Overview", icon: Building2 },
                { id: "payment-history", label: "Payment History", icon: History },
                { id: "settings", label: "Settings", icon: Settings },
              ].map((tab) => {
                const IconComponent = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id as any)}
                    onKeyDown={(e) => handleKeyDown(e, () => handleTabChange(tab.id as any))}
                    className={`py-6 px-1 border-b-2 font-medium text-sm flex items-center gap-3 transition-all duration-300 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none ${
                      activeTab === tab.id
                        ? "border-blue-600 text-blue-700"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                    role="tab"
                    aria-selected={activeTab === tab.id}
                    aria-label={`${tab.label} tab`}
                    type="button"
                  >
                    <IconComponent className="h-5 w-5" aria-hidden="true" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-8">
            {activeTab === "overview" && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column - Main Information */}
                <div className="lg:col-span-2 space-y-8">
                  {/* Description Card */}
                  <section className="bg-white rounded-2xl border border-gray-200 p-8 shadow-lg" aria-label="Company overview">
                    <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                      <FileText className="h-6 w-6 mr-4 text-blue-600" aria-hidden="true" />
                      Company Overview
                    </h3>
                    <p className="text-gray-700 leading-relaxed text-lg">
                      {business.about_business || "No description provided."}
                    </p>
                  </section>

                  {/* Contact Information */}
                  <section className="bg-white rounded-2xl border border-gray-200 p-8 shadow-lg" aria-label="Contact information">
                    <h3 className="text-xl font-semibold text-gray-900 mb-8 flex items-center">
                      <Mail className="h-6 w-6 mr-4 text-blue-600" aria-hidden="true" />
                      Contact Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="flex items-center space-x-5 p-6 bg-gray-50 rounded-2xl border border-gray-200 hover:shadow-md transition-all duration-300 group hover:border-blue-200">
                        <div className="p-3 bg-white rounded-xl border border-gray-200 group-hover:border-blue-300">
                          <Mail className="h-6 w-6 text-blue-600" aria-hidden="true" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 font-medium">
                            Email
                          </p>
                          <p className="text-gray-900 font-semibold text-lg">
                            <a href={`mailto:${business.email}`} className="hover:text-blue-700 transition-colors">
                              {business.email || "Not provided"}
                            </a>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-5 p-6 bg-gray-50 rounded-2xl border border-gray-200 hover:shadow-md transition-all duration-300 group hover:border-blue-200">
                        <div className="p-3 bg-white rounded-xl border border-gray-200 group-hover:border-blue-300">
                          <Phone className="h-6 w-6 text-blue-600" aria-hidden="true" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 font-medium">
                            Phone
                          </p>
                          <p className="text-gray-900 font-semibold text-lg">
                            <a href={`tel:${business.phone}`} className="hover:text-blue-700 transition-colors">
                              {business.phone || "Not provided"}
                            </a>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-5 p-6 bg-gray-50 rounded-2xl border border-gray-200 hover:shadow-md transition-all duration-300 group hover:border-blue-200">
                        <div className="p-3 bg-white rounded-xl border border-gray-200 group-hover:border-blue-300">
                          <Globe className="h-6 w-6 text-blue-600" aria-hidden="true" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 font-medium">
                            Website
                          </p>
                          <p className="text-gray-900 font-semibold text-lg">
                            {business.website ? (
                              <a
                                href={business.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:text-blue-700 transition-colors inline-flex items-center gap-1"
                              >
                                {new URL(business.website).hostname.replace("www.", "")}
                                <ExternalLink className="h-4 w-4" aria-hidden="true" />
                              </a>
                            ) : (
                              "Not provided"
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-5 p-6 bg-gray-50 rounded-2xl border border-gray-200 hover:shadow-md transition-all duration-300 group hover:border-blue-200">
                        <div className="p-3 bg-white rounded-xl border border-gray-200 group-hover:border-blue-300">
                          <MapPin className="h-6 w-6 text-blue-600" aria-hidden="true" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 font-medium">
                            Address
                          </p>
                          <p className="text-gray-900 font-semibold text-lg">
                            <a
                              href={`https://maps.google.com/?q=${encodeURIComponent(business.address || '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:text-blue-700 transition-colors inline-flex items-center gap-1"
                            >
                              {business.address || "Not provided"}
                              {business.address && <ExternalLink className="h-4 w-4" aria-hidden="true" />}
                            </a>
                          </p>
                        </div>
                      </div>
                    </div>
                  </section>
                </div>

                {/* Right Column - Side Information */}
                <div className="space-y-8">
                  {/* Current Subscription Card */}
                  <section className="bg-white rounded-2xl border border-gray-200 p-8 shadow-lg" aria-label="Current subscription">
                    <div className="flex justify-between items-start mb-6">
                      <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-3">
                        <Crown className="h-6 w-6 text-amber-500" aria-hidden="true" />
                        Current Plan
                      </h3>
                      <span
                        className={`px-3 py-1.5 rounded-full text-sm font-medium border ${getStatusColor(business.status)}`}
                        role="status"
                      >
                        {business.status.toUpperCase()}
                      </span>
                    </div>

                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 mb-6 border border-blue-200">
                      <h4 className="text-2xl font-bold text-gray-900 mb-2">
                        {business.subscription?.plan_name || "Basic Plan"}
                      </h4>
                      <div className="text-3xl font-bold text-gray-900 mb-4">
                        {formatPrice(currentSubscription.price)}
                        <span className="text-lg text-gray-600 font-normal">/mo</span>
                      </div>
                      <div className="space-y-3 mb-4">
                        <div className="flex items-center gap-3 text-gray-700">
                          <Users className="h-4 w-4 text-blue-600" aria-hidden="true" />
                          <span className="text-sm">
                            {currentSubscription.users} users
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-gray-700">
                          <Calendar className="h-4 w-4 text-blue-600" aria-hidden="true" />
                          <span className="text-sm">
                            Renews {formatDate(business.subscription?.end_date || new Date().toISOString())}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={handleUpgrade}
                        onKeyDown={(e) => handleKeyDown(e, handleUpgrade)}
                        className="w-full bg-white text-blue-700 border border-blue-200 py-3 rounded-xl font-semibold hover:bg-blue-50 transition-all duration-300 text-sm focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        type="button"
                      >
                        Upgrade Plan
                      </button>
                    </div>
                  </section>

                  {/* Business Stats */}
                  <section className="bg-white rounded-2xl border border-gray-200 p-8 shadow-lg" aria-label="Business metrics">
                    <h3 className="text-xl font-semibold text-gray-900 mb-8 flex items-center">
                      <Activity className="h-6 w-6 mr-4 text-blue-600" aria-hidden="true" />
                      Business Metrics
                    </h3>
                    <div className="space-y-6">
                      <div className="flex items-center justify-between p-6 bg-gray-50 rounded-2xl border border-gray-200 hover:border-blue-200 transition-colors">
                        <div className="flex items-center space-x-4">
                          <div className="p-3 bg-white rounded-xl border border-gray-200">
                            <Users className="h-6 w-6 text-blue-600" aria-hidden="true" />
                          </div>
                          <span className="text-gray-700 font-medium">
                            Team Size
                          </span>
                        </div>
                        <span className="text-2xl font-bold text-gray-900">
                          {business.subscription?.users || "N/A"}
                        </span>
                      </div>

                      <div className="flex items-center justify-between p-6 bg-gray-50 rounded-2xl border border-gray-200 hover:border-blue-200 transition-colors">
                        <div className="flex items-center space-x-4">
                          <div className="p-3 bg-white rounded-xl border border-gray-200">
                            <Calendar className="h-6 w-6 text-blue-600" aria-hidden="true" />
                          </div>
                          <span className="text-gray-700 font-medium">
                            Founded
                          </span>
                        </div>
                        <span className="text-2xl font-bold text-gray-900">
                          {business.created_at
                            ? new Date(business.created_at).getFullYear()
                            : "N/A"}
                        </span>
                      </div>

                      <div className="flex items-center justify-between p-6 bg-gray-50 rounded-2xl border border-gray-200 hover:border-blue-200 transition-colors">
                        <div className="flex items-center space-x-4">
                          <div className="p-3 bg-white rounded-xl border border-gray-200">
                            <TrendingUp className="h-6 w-6 text-blue-600" aria-hidden="true" />
                          </div>
                          <span className="text-gray-700 font-medium">
                            Status
                          </span>
                        </div>
                        <span
                          className={`px-4 py-2 rounded-full text-sm font-bold border ${getStatusColor(business.status)}`}
                          role="status"
                        >
                          {business.status?.toUpperCase() || "UNKNOWN"}
                        </span>
                      </div>
                    </div>
                  </section>
                </div>
              </div>
            )}

            {activeTab === "payment-history" && (
              <div className="space-y-8">
                {/* Payment History Table */}
                <section className="bg-white rounded-2xl border border-gray-200 p-8 shadow-lg" aria-label="Payment history">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                      <History className="h-7 w-7 text-blue-600" aria-hidden="true" />
                      Payment History
                    </h2>
                    <button
                      onClick={handleExportCSV}
                      onKeyDown={(e) => handleKeyDown(e, handleExportCSV)}
                      className="inline-flex items-center px-6 py-3 bg-gray-900 text-white font-semibold rounded-xl hover:bg-gray-800 transition-all duration-300 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                      type="button"
                    >
                      <Download className="h-4 w-4 mr-2" aria-hidden="true" />
                      Export CSV
                    </button>
                  </div>

                  {/* Table */}
                  <div className="overflow-x-auto rounded-xl border border-gray-200">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                            Date
                          </th>
                          <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                            Description
                          </th>
                          <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                            Invoice ID
                          </th>
                          <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                            Amount
                          </th>
                          <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                            Status
                          </th>
                          <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {paymentHistory.map((payment) => (
                          <tr key={payment.id} className="hover:bg-gray-50 transition-colors duration-150">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatDate(payment.date)}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900">
                              {payment.description}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-600">
                              {payment.invoiceId}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                              {formatPrice(payment.amount)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {getStatusBadge(payment.status)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <button
                                onClick={() => console.log("Download invoice", payment.invoiceId)}
                                className="text-blue-600 hover:text-blue-700 transition-colors flex items-center gap-1 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-lg px-2 py-1"
                                aria-label={`Download invoice ${payment.invoiceId}`}
                                type="button"
                              >
                                <DownloadCloud className="h-4 w-4" aria-hidden="true" />
                                Invoice
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Table Summary */}
                  <div className="mt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <p className="text-sm text-gray-600">
                      Showing {paymentHistory.length} payments
                    </p>
                    <div className="flex items-center gap-4">
                      <button
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                        disabled
                        type="button"
                      >
                        Previous
                      </button>
                      <button
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                        disabled
                        type="button"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </section>

                {/* Payment Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[
                    {
                      title: "Total Paid",
                      icon: CreditCard,
                      color: "blue",
                      amount: paymentHistory
                        .filter((p) => p.status === "completed")
                        .reduce((sum, p) => sum + p.amount, 0),
                      count: paymentHistory.filter((p) => p.status === "completed").length,
                      status: "completed"
                    },
                    {
                      title: "Pending",
                      icon: Clock,
                      color: "amber",
                      amount: paymentHistory
                        .filter((p) => p.status === "pending")
                        .reduce((sum, p) => sum + p.amount, 0),
                      count: paymentHistory.filter((p) => p.status === "pending").length,
                      status: "pending"
                    },
                    {
                      title: "Failed",
                      icon: AlertCircle,
                      color: "rose",
                      amount: paymentHistory
                        .filter((p) => p.status === "failed")
                        .reduce((sum, p) => sum + p.amount, 0),
                      count: paymentHistory.filter((p) => p.status === "failed").length,
                      status: "failed"
                    }
                  ].map((stat) => (
                    <div key={stat.title} className="bg-white rounded-2xl border border-gray-200 p-6 shadow-lg hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">{stat.title}</h3>
                        <div className={`p-3 bg-${stat.color}-50 rounded-xl border border-${stat.color}-200`}>
                          <stat.icon className={`h-5 w-5 text-${stat.color}-600`} aria-hidden="true" />
                        </div>
                      </div>
                      <p className="text-3xl font-bold text-gray-900">
                        {formatPrice(stat.amount)}
                      </p>
                      <p className="text-sm text-gray-600 mt-2">
                        {stat.count} {stat.status} {stat.count === 1 ? 'payment' : 'payments'}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "settings" && (
              <div className="flex items-center justify-center py-20">
                <div className="text-center">
                  <div className="bg-blue-50 p-4 rounded-2xl inline-block mb-4 border border-blue-200">
                    <Settings className="h-8 w-8 text-blue-600" aria-hidden="true" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Settings Section
                  </h3>
                  <p className="text-gray-500">
                    This section is under development. Check back soon!
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusinessProfilePage;