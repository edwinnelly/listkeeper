"use client";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
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
  Sparkles,
  TrendingUp,
  Activity,
  Check,
  Star,
  CreditCard,
  BarChart3,
  Crown,
  Zap,
  Settings,
  DownloadCloud,
  UserPlus,
  BarChart,
  Eye,
  History,
  FileSpreadsheet,
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
  plan_name: string;
  logo?: string;
}

interface PlanFeature {
  text: string;
  included: boolean;
  highlight?: boolean;
}

interface Plan {
  id: string;
  name: string;
  originalPrice: number;
  discountedPrice: number;
  period: string;
  savings: number;
  savingsDuration: string;
  popular?: boolean;
  features: PlanFeature[];
  users: string;
  cta: string;
}

interface Subscription {
  planId: string;
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

interface PaymentMethod {
  id: string;
  type: "card" | "bank" | "wallet";
  lastFour?: string;
  brand?: string;
  expiry?: string;
  isDefault: boolean;
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

interface subscription {
  plan_name: string;
}
// =============================================================================
// MOCK DATA
// =============================================================================

const currentSubscription: Subscription = {
  planId: "simple",
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
    "overview" | "subscription" | "payment-history" | "settings"
  >("overview");
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string>("essentials");

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
        console.log(res);
      } catch (err) {
        console.error("Error fetching business", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBusiness();
  }, [id]);

  // ===========================================================================
  // UTILITY FUNCTIONS
  // ===========================================================================

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      completed: {
        color: "bg-green-100 text-green-700 border-green-200",
        label: "Completed",
      },
      pending: {
        color: "bg-yellow-100 text-yellow-700 border-yellow-200",
        label: "Pending",
      },
      failed: {
        color: "bg-red-100 text-red-700 border-red-200",
        label: "Failed",
      },
    };

    const config =
      statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;

    return (
      <span
        className={`px-3 py-1 rounded-full text-sm font-medium border ${config.color}`}
      >
        {config.label}
      </span>
    );
  };

  const handleEdit = () => {
    router.push(`/editbusiness/${id}`);
  };

  const handleUpgrade = (planId: string) => {
    console.log(`Upgrading to plan: ${planId}`);
    setShowUpgradeModal(false);
  };

  // ===========================================================================
  // LOADING SKELETON
  // ===========================================================================

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/20 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200/60 rounded-full w-32 mb-8"></div>
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-white/50 shadow-2xl shadow-blue-100/20">
              <div className="bg-gradient-to-r from-gray-50/80 to-blue-50/50 border-b border-white/50 px-8 py-12">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex items-center space-x-6 mb-6 lg:mb-0">
                    <div className="w-24 h-24 bg-gray-200/60 rounded-2xl"></div>
                    <div className="space-y-3">
                      <div className="h-8 bg-gray-200/60 rounded-full w-64"></div>
                      <div className="h-4 bg-gray-200/60 rounded-full w-32"></div>
                    </div>
                  </div>
                  <div className="h-12 bg-gray-200/60 rounded-2xl w-40"></div>
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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/20 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-12 border border-white/50 shadow-2xl shadow-blue-100/20">
            <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-white/50">
              <Building2 className="h-10 w-10 text-gray-400" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              Business Not Found
            </h2>
            <p className="text-gray-600 mb-8 text-lg">
              The business you're looking for doesn't exist or has been moved.
            </p>
            <Link
              href="/business"
              className="inline-flex items-center px-8 py-4 bg-gray-900 text-white font-semibold rounded-2xl hover:bg-gray-800 transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              <ArrowLeft className="h-5 w-5 mr-3" />
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/20 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/business"
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-6 transition-all duration-300 group font-medium"
          >
            <ArrowLeft className="h-4 w-4 mr-3 group-hover:-translate-x-1 transition-transform" />
            Back to Business
          </Link>
        </div>

        {/* Main Card */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-white/50 shadow-2xl shadow-blue-100/20 overflow-hidden">
          {/* Hero Section */}
          <div className="bg-gradient-to-r from-gray-50/80 via-blue-50/50 to-indigo-50/30 border-b border-white/50 px-8 py-12">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center space-x-8 mb-8 lg:mb-0">
                <div className="flex items-center gap-6">
                  {business.logo ? (
                    <img
                      src={`http://localhost:8000/storage/${business.logo}`}
                      alt="Business Logo"
                      className="w-24 h-24 rounded-2xl object-cover border border-white/50 shadow-2xl shadow-blue-200/30 backdrop-blur-sm"
                    />
                  ) : (
                    <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 border border-white/50 rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-200/30 backdrop-blur-sm">
                      <Building2 className="h-10 w-10 text-gray-500" />
                    </div>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <Sparkles className="h-5 w-5 text-blue-500" />
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
                  className="inline-flex items-center px-8 py-4 bg-gray-900 text-white font-semibold rounded-2xl hover:bg-gray-800 cursor-pointer transition-all duration-300 shadow-lg hover:shadow-xl group"
                >
                  <Edit3 className="h-5 w-5 mr-3 group-hover:scale-110 transition-transform" />
                  Edit Business
                </button>
                <button
                   onClick={() => router.push('/custom_subscriptions')}
                  className="inline-flex items-center px-8 py-4 bg-blue-600 text-white font-semibold rounded-2xl hover:bg-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl group cursor-pointer"
                >
                  <Zap className="h-5 w-5 mr-3 group-hover:scale-110 transition-transform" />
                  Upgrade Plan
                </button>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="border-b border-gray-200/50 px-8">
            <nav className="flex space-x-8 -mb-px">
              {[
                { id: "overview", label: "Overview", icon: Building2 },
                {
                  id: "payment-history",
                  label: "Payment History",
                  icon: History,
                },
                { id: "settings", label: "Settings", icon: Settings },
              ].map((tab) => {
                const IconComponent = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`py-6 px-1 border-b-2 font-medium text-sm flex items-center gap-3 transition-all duration-300 ${
                      activeTab === tab.id
                        ? "border-purple-500 text-purple-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    <IconComponent className="h-5 w-5" />
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
                  <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-lg">
                    <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                      <FileText className="h-6 w-6 mr-4 text-blue-500" />
                      Company Overview
                    </h3>
                    <p className="text-gray-700 leading-relaxed text-lg">
                      {business.about_business || "No description provided."}
                    </p>
                  </div>

                  {/* Contact Information */}
                  <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-lg">
                    <h3 className="text-xl font-semibold text-gray-900 mb-8 flex items-center">
                      <Mail className="h-6 w-6 mr-4 text-blue-500" />
                      Contact Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="flex items-center space-x-5 p-6 bg-gray-50 rounded-2xl border border-gray-200 hover:shadow-md transition-all duration-300 group hover:scale-[1.02]">
                        <div className="p-3 bg-blue-50 rounded-xl">
                          <Mail className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 font-medium">
                            Email
                          </p>
                          <p className="text-gray-900 font-semibold text-lg">
                            Null
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-5 p-6 bg-gray-50 rounded-2xl border border-gray-200 hover:shadow-md transition-all duration-300 group hover:scale-[1.02]">
                        <div className="p-3 bg-green-50 rounded-xl">
                          <Phone className="h-6 w-6 text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 font-medium">
                            Phone
                          </p>
                          <p className="text-gray-900 font-semibold text-lg">
                            {business.phone || "Not provided"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-5 p-6 bg-gray-50 rounded-2xl border border-gray-200 hover:shadow-md transition-all duration-300 group hover:scale-[1.02]">
                        <div className="p-3 bg-purple-50 rounded-xl">
                          <Globe className="h-6 w-6 text-purple-600" />
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
                                className="hover:text-gray-700 transition-colors"
                              >
                                {new URL(business.website).hostname.replace(
                                  "www.",
                                  ""
                                )}
                              </a>
                            ) : (
                              "Not provided"
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-5 p-6 bg-gray-50 rounded-2xl border border-gray-200 hover:shadow-md transition-all duration-300 group hover:scale-[1.02]">
                        <div className="p-3 bg-orange-50 rounded-xl">
                          <MapPin className="h-6 w-6 text-orange-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 font-medium">
                            Address
                          </p>
                          <p className="text-gray-900 font-semibold text-lg">
                            {business.address || "Not provided"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column - Side Information */}
                <div className="space-y-8">
                  {/* Current Subscription Card */}
                  <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-lg">
                    <div className="flex justify-between items-start mb-6">
                      <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-3">
                        <Crown className="h-6 w-6 text-amber-500" />
                        Current Plan
                      </h3>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-bold ${
                          business.status === "active"
                            ? "bg-green-100 text-green-700 border border-green-200"
                            : "bg-yellow-100 text-yellow-700 border border-yellow-200"
                        }`}
                      >
                        {business.status.toUpperCase()}
                      </span>
                    </div>

                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 mb-6 border border-blue-200">
                      <h4 className="text-2xl font-bold text-gray-900 mb-2">
                        {business.subscription.plan_name}
                      </h4>
                      <div className="text-3xl font-bold text-gray-900 mb-4">
                        {formatPrice(currentSubscription.price)}
                        <span className="text-lg text-gray-600">/mo</span>
                      </div>
                      <div className="space-y-3 mb-4">
                        <div className="flex items-center gap-3 text-gray-700">
                          <Users className="h-4 w-4 text-gray-500" />
                          <span className="text-sm">
                            {currentSubscription.users} of{" "}
                            {business.subscription.users} users
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-gray-700">
                          <Calendar className="h-4 w-4 text-gray-500" />
                          <span className="text-sm">
                            Renews {formatDate(business.subscription.end_date)}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => router.push("/custom_subscriptions")}
                        className="w-full bg-white text-blue-600 border border-purple-200 py-3 rounded-xl font-semibold hover:bg-purple-50 transition-all duration-300 text-sm cursor-pointer"
                      >
                        Upgrade Plan
                      </button>
                    </div>

                    {/* <div>
                      <h4 className="font-semibold text-gray-900 mb-4 text-sm">Plan Features</h4>
                      <div className="space-y-2">
                        {currentSubscription.features.map((feature, index) => (
                          <div key={index} className="flex items-center gap-3 p-2">
                            <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                            <span className="text-sm text-gray-700">{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div> */}
                  </div>

                  {/* Business Stats */}
                  <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-lg">
                    <h3 className="text-xl font-semibold text-gray-900 mb-8 flex items-center">
                      <Activity className="h-6 w-6 mr-4 text-blue-500" />
                      Business Metrics
                    </h3>
                    <div className="space-y-6">
                      <div className="flex items-center justify-between p-6 bg-gray-50 rounded-2xl border border-gray-200">
                        <div className="flex items-center space-x-4">
                          <div className="p-3 bg-blue-50 rounded-xl">
                            <Users className="h-6 w-6 text-blue-600" />
                          </div>
                          <span className="text-gray-700 font-medium">
                            Team Size
                          </span>
                        </div>
                        <span className="text-2xl font-bold text-gray-900">
                          {business.subscription.users || "N/A"}
                        </span>
                      </div>

                      <div className="flex items-center justify-between p-6 bg-gray-50 rounded-2xl border border-gray-200">
                        <div className="flex items-center space-x-4">
                          <div className="p-3 bg-green-50 rounded-xl">
                            <Calendar className="h-6 w-6 text-green-600" />
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

                      <div className="flex items-center justify-between p-6 bg-gray-50 rounded-2xl border border-gray-200">
                        <div className="flex items-center space-x-4">
                          <div className="p-3 bg-purple-50 rounded-xl">
                            <TrendingUp className="h-6 w-6 text-purple-600" />
                          </div>
                          <span className="text-gray-700 font-medium">
                            Status
                          </span>
                        </div>
                        <span
                          className={`px-4 py-2 rounded-full text-sm font-bold ${
                            business.status === "active"
                              ? "bg-green-100 text-green-700 border border-green-200"
                              : "bg-yellow-100 text-yellow-700 border border-yellow-200"
                          }`}
                        >
                          {business.status?.toUpperCase() || "UNKNOWN"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "payment-history" && (
              <div className="space-y-8">
                {/* Payment History Table */}
                <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-lg">
                  <div className="flex justify-between items-center mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                      <History className="h-7 w-7 text-blue-500" />
                      Payment History
                    </h2>
                    <button className="inline-flex items-center px-6 py-3 bg-gray-900 text-white font-semibold rounded-xl hover:bg-gray-800 transition-all duration-300">
                      <DownloadCloud className="h-4 w-4 mr-2" />
                      Export CSV
                    </button>
                  </div>

                  {/* Table */}
                  <div className="overflow-hidden rounded-xl border border-gray-200">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th
                            scope="col"
                            className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider"
                          >
                            Date
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider"
                          >
                            Description
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider"
                          >
                            Invoice ID
                          </th>

                          <th
                            scope="col"
                            className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider"
                          >
                            Amount
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider"
                          >
                            Status
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider"
                          >
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {paymentHistory.map((payment) => (
                          <tr
                            key={payment.id}
                            className="hover:bg-gray-50 transition-colors duration-150"
                          >
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatDate(payment.date)}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900">
                              {payment.description}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                              {payment.invoiceId}
                            </td>

                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                              {formatPrice(payment.amount)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {getStatusBadge(payment.status)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex items-center gap-3">
                                <button className="text-gray-600 hover:text-gray-900 transition-colors flex items-center gap-1">
                                  <DownloadCloud className="h-4 w-4" />
                                  Invoice
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Table Summary */}
                  <div className="mt-6 flex justify-between items-center">
                    <p className="text-sm text-gray-600">
                      Showing {paymentHistory.length} payments
                    </p>
                    <div className="flex items-center gap-4">
                      <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                        Previous
                      </button>
                      <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                        Next
                      </button>
                    </div>
                  </div>
                </div>

                {/* Payment Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-lg">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Total Paid
                      </h3>
                      <CreditCard className="h-5 w-5 text-green-500" />
                    </div>
                    <p className="text-3xl font-bold text-gray-900 mt-2">
                      {formatPrice(
                        paymentHistory
                          .filter((p) => p.status === "completed")
                          .reduce((sum, p) => sum + p.amount, 0)
                      )}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      {
                        paymentHistory.filter((p) => p.status === "completed")
                          .length
                      }{" "}
                      successful payments
                    </p>
                  </div>

                  <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-lg">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Pending
                      </h3>
                      <History className="h-5 w-5 text-yellow-500" />
                    </div>
                    <p className="text-3xl font-bold text-gray-900 mt-2">
                      {formatPrice(
                        paymentHistory
                          .filter((p) => p.status === "pending")
                          .reduce((sum, p) => sum + p.amount, 0)
                      )}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      {
                        paymentHistory.filter((p) => p.status === "pending")
                          .length
                      }{" "}
                      pending payments
                    </p>
                  </div>

                  <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-lg">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Failed
                      </h3>
                      <FileSpreadsheet className="h-5 w-5 text-red-500" />
                    </div>
                    <p className="text-3xl font-bold text-gray-900 mt-2">
                      {formatPrice(
                        paymentHistory
                          .filter((p) => p.status === "failed")
                          .reduce((sum, p) => sum + p.amount, 0)
                      )}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      {
                        paymentHistory.filter((p) => p.status === "failed")
                          .length
                      }{" "}
                      failed payments
                    </p>
                  </div>
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
