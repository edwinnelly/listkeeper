'use client';

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
  Eye
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
  industry: string;
  employee_count: number;
  founded_date: string;
  status: string;
  created_at: string;
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

// =============================================================================
// MOCK DATA
// =============================================================================

const plans: Plan[] = [
  {
    id: "simple",
    name: "Simple Start",
    originalPrice: 27765,
    discountedPrice: 2776,
    period: "mo",
    savings: 24989,
    savingsDuration: "for 3 months",
    features: [
      { text: "Track income & expenses", included: true },
      { text: "Send unlimited custom invoices & quotes", included: true },
      { text: "Connect your bank", included: true },
      { text: "Track GST and VAT", included: true },
      { text: "Insights & reports", included: true },
      { text: "Progress invoicing", included: true },
      { text: "Up to 250 items in Chart of Accounts", included: true },
      { text: "For one user, plus your accountant", included: true, highlight: true },
    ],
    users: "1 user + accountant",
    cta: "Upgrade to this plan"
  },
  {
    id: "essentials",
    name: "Essentials",
    originalPrice: 40918,
    discountedPrice: 4091,
    period: "mo",
    savings: 36827,
    savingsDuration: "for 3 months",
    popular: true,
    features: [
      { text: "Track income & expenses", included: true },
      { text: "Send unlimited custom invoices & quotes", included: true },
      { text: "Connect your bank", included: true },
      { text: "Track GST and VAT", included: true },
      { text: "Insights & reports", included: true },
      { text: "Progress invoicing", included: true },
      { text: "Up to 250 items in Chart of Accounts", included: true },
      { text: "Manage bills & payments", included: true },
      { text: "Track employee time", included: true },
      { text: "Multi-currency", included: true },
      { text: "For three users, plus your accountant", included: true, highlight: true },
    ],
    users: "3 users + accountant",
    cta: "Upgrade to this plan"
  },
  {
    id: "plus",
    name: "Plus",
    originalPrice: 58454,
    discountedPrice: 5845,
    period: "mo",
    savings: 52609,
    savingsDuration: "for 3 months",
    features: [
      { text: "Track income & expenses", included: true },
      { text: "Send unlimited custom invoices & quotes", included: true },
      { text: "Connect your bank", included: true },
      { text: "Track GST and VAT", included: true },
      { text: "Insights & reports", included: true },
      { text: "Progress invoicing", included: true },
      { text: "Up to 250 items in Chart of Accounts", included: true },
      { text: "Manage bills & payments", included: true },
      { text: "Track employee time", included: true },
      { text: "Multi-currency", included: true },
      { text: "Recurring transactions and bills", included: true },
      { text: "Track inventory", included: true },
      { text: "Manage budgets", included: true },
      { text: "Up to 40 classes and locations", included: true },
      { text: "For five users, plus your accountant", included: true, highlight: true },
    ],
    users: "5 users + accountant",
    cta: "Upgrade to this plan"
  }
];

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
    "1 user + accountant"
  ],
  renewalDate: "Feb 14, 2024"
};

const paymentMethods: PaymentMethod[] = [
  {
    id: "card_1",
    type: "card",
    lastFour: "4242",
    brand: "Visa",
    expiry: "12/25",
    isDefault: true
  }
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
  const [activeTab, setActiveTab] = useState<"overview" | "subscription" | "billing" | "settings">("overview");
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
        const businessData: Business = res.data?.business || res.data?.data?.business || res.data;
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
  // UTILITY FUNCTIONS
  // ===========================================================================

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
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
            <p className="text-gray-600 mb-8 text-lg">The business you're looking for doesn't exist or has been moved.</p>
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
                      src={`http://localhost:8001/storage/${business.logo}`}
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
                  <p className="text-gray-600 text-xl font-medium">{business.industry}</p>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={handleEdit}
                  className="inline-flex items-center px-8 py-4 bg-gray-900 text-white font-semibold rounded-2xl hover:bg-gray-800 transition-all duration-300 shadow-lg hover:shadow-xl group"
                >
                  <Edit3 className="h-5 w-5 mr-3 group-hover:scale-110 transition-transform" />
                  Edit Business
                </button>
                <button 
                  onClick={() => setShowUpgradeModal(true)}
                  className="inline-flex items-center px-8 py-4 bg-purple-600 text-white font-semibold rounded-2xl hover:bg-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl group"
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
                { id: "subscription", label: "Subscription", icon: Crown },
                { id: "billing", label: "Billing", icon: CreditCard },
                { id: "settings", label: "Settings", icon: Settings }
              ].map((tab) => {
                const IconComponent = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`py-6 px-1 border-b-2 font-medium text-sm flex items-center gap-3 transition-all duration-300 ${
                      activeTab === tab.id
                        ? 'border-purple-500 text-purple-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
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
                      {business.description || "No description provided."}
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
                          <p className="text-sm text-gray-600 font-medium">Email</p>
                          <p className="text-gray-900 font-semibold text-lg">{business.email}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-5 p-6 bg-gray-50 rounded-2xl border border-gray-200 hover:shadow-md transition-all duration-300 group hover:scale-[1.02]">
                        <div className="p-3 bg-green-50 rounded-xl">
                          <Phone className="h-6 w-6 text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 font-medium">Phone</p>
                          <p className="text-gray-900 font-semibold text-lg">{business.phone || "Not provided"}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-5 p-6 bg-gray-50 rounded-2xl border border-gray-200 hover:shadow-md transition-all duration-300 group hover:scale-[1.02]">
                        <div className="p-3 bg-purple-50 rounded-xl">
                          <Globe className="h-6 w-6 text-purple-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 font-medium">Website</p>
                          <p className="text-gray-900 font-semibold text-lg">
                            {business.website ? (
                              <a href={business.website} target="_blank" rel="noopener noreferrer" className="hover:text-gray-700 transition-colors">
                                {business.website}
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
                          <p className="text-sm text-gray-600 font-medium">Address</p>
                          <p className="text-gray-900 font-semibold text-lg">{business.address || "Not provided"}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column - Side Information */}
                <div className="space-y-8">
                  
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
                          <span className="text-gray-700 font-medium">Team Size</span>
                        </div>
                        <span className="text-2xl font-bold text-gray-900">
                          {business.employee_count || "N/A"}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between p-6 bg-gray-50 rounded-2xl border border-gray-200">
                        <div className="flex items-center space-x-4">
                          <div className="p-3 bg-green-50 rounded-xl">
                            <Calendar className="h-6 w-6 text-green-600" />
                          </div>
                          <span className="text-gray-700 font-medium">Founded</span>
                        </div>
                        <span className="text-2xl font-bold text-gray-900">
                          {business.founded_date ? new Date(business.founded_date).getFullYear() : "N/A"}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between p-6 bg-gray-50 rounded-2xl border border-gray-200">
                        <div className="flex items-center space-x-4">
                          <div className="p-3 bg-purple-50 rounded-xl">
                            <TrendingUp className="h-6 w-6 text-purple-600" />
                          </div>
                          <span className="text-gray-700 font-medium">Status</span>
                        </div>
                        <span className={`px-4 py-2 rounded-full text-sm font-bold ${
                          business.status === 'active' 
                            ? 'bg-green-100 text-green-700 border border-green-200' 
                            : 'bg-yellow-100 text-yellow-700 border border-yellow-200'
                        }`}>
                          {business.status?.toUpperCase() || 'UNKNOWN'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-lg">
                    <h3 className="text-xl font-semibold text-gray-900 mb-6">Quick Actions</h3>
                    <div className="space-y-4">
                      <button className="w-full text-left p-5 bg-gray-50 hover:bg-white border border-gray-200 rounded-2xl transition-all duration-300 group hover:scale-[1.02] hover:shadow-md flex items-center gap-4">
                        <BarChart className="h-5 w-5 text-blue-500" />
                        <span className="text-gray-700 group-hover:text-gray-900 font-medium">View Analytics</span>
                      </button>
                      <button className="w-full text-left p-5 bg-gray-50 hover:bg-white border border-gray-200 rounded-2xl transition-all duration-300 group hover:scale-[1.02] hover:shadow-md flex items-center gap-4">
                        <UserPlus className="h-5 w-5 text-green-500" />
                        <span className="text-gray-700 group-hover:text-gray-900 font-medium">Manage Team</span>
                      </button>
                      <button className="w-full text-left p-5 bg-gray-50 hover:bg-white border border-gray-200 rounded-2xl transition-all duration-300 group hover:scale-[1.02] hover:shadow-md flex items-center gap-4">
                        <DownloadCloud className="h-5 w-5 text-purple-500" />
                        <span className="text-gray-700 group-hover:text-gray-900 font-medium">Export Data</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "subscription" && (
              <div className="space-y-8">
                {/* Current Subscription Card */}
                <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-lg">
                  <div className="flex justify-between items-start mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                      <Crown className="h-7 w-7 text-amber-500" />
                      Current Subscription
                    </h2>
                    <span className={`px-4 py-2 rounded-full text-sm font-bold ${
                      currentSubscription.status === 'active' 
                        ? 'bg-green-100 text-green-700 border border-green-200' 
                        : 'bg-yellow-100 text-yellow-700 border border-yellow-200'
                    }`}>
                      {currentSubscription.status.toUpperCase()}
                    </span>
                  </div>

                  <div className="bg-blue-50 rounded-2xl p-8 mb-6 border border-blue-200">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                      <div>
                        <h3 className="text-3xl font-bold text-gray-900">{currentSubscription.planName}</h3>
                        <p className="text-gray-600 mt-2 text-lg">{currentSubscription.currentPeriod}</p>
                        <div className="flex items-center gap-6 mt-6">
                          <div className="flex items-center gap-3">
                            <Users className="h-5 w-5 text-gray-500" />
                            <span className="text-gray-600">
                              {currentSubscription.users} of {currentSubscription.maxUsers} users
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <Calendar className="h-5 w-5 text-gray-500" />
                            <span className="text-gray-600">
                              Renews {currentSubscription.renewalDate}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="mt-6 lg:mt-0 text-center lg:text-right">
                        <div className="text-4xl font-bold text-gray-900">
                          {formatPrice(currentSubscription.price)}
                          <span className="text-xl text-gray-600">/mo</span>
                        </div>
                        <button 
                          onClick={() => setShowUpgradeModal(true)}
                          className="mt-4 bg-white text-purple-600 border border-purple-200 px-6 py-3 rounded-xl font-semibold hover:bg-purple-50 transition-all duration-300"
                        >
                          Upgrade Plan
                        </button>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-4 text-lg">Included Features</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {currentSubscription.features.map((feature, index) => (
                        <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
                          <Check className="h-5 w-5 text-green-500" />
                          <span className="text-gray-700">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "billing" && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column - Payment Methods */}
                <div className="lg:col-span-2 space-y-8">
                  {/* Payment Methods */}
                  <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-lg">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                      <CreditCard className="h-7 w-7 text-blue-500" />
                      Payment Methods
                    </h2>
                    
                    {paymentMethods.map((method) => (
                      <div key={method.id} className="flex justify-between items-center p-6 bg-gray-50 rounded-2xl border border-gray-200 mb-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-8 bg-blue-500 rounded flex items-center justify-center">
                            <CreditCard className="h-4 w-4 text-white" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 text-lg">
                              {method.brand} •••• {method.lastFour}
                            </p>
                            <p className="text-sm text-gray-600">Expires {method.expiry}</p>
                          </div>
                        </div>
                        {method.isDefault && (
                          <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full font-medium">
                            Default
                          </span>
                        )}
                      </div>
                    ))}
                    
                    <button className="w-full border-2 border-dashed border-gray-300 rounded-2xl p-6 text-gray-600 hover:text-gray-900 hover:border-gray-400 transition-all duration-300 flex items-center justify-center gap-3 text-lg">
                      <CreditCard className="h-5 w-5" />
                      Add Payment Method
                    </button>
                  </div>
                </div>

                {/* Right Column - Quick Actions */}
                <div className="space-y-8">
                  {/* Support Card */}
                  <div className="bg-blue-500 rounded-2xl p-8 text-white">
                    <h3 className="font-bold text-xl mb-3">Need Help?</h3>
                    <p className="text-blue-100 text-lg mb-6">
                      Our support team is here to help you with billing and subscription questions.
                    </p>
                    <button className="w-full bg-white text-blue-600 py-3 rounded-xl font-semibold hover:bg-gray-100 transition-all duration-300 text-lg">
                      Contact Support
                    </button>
                  </div>

                  {/* Quick Actions */}
                  <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-lg">
                    <h3 className="text-xl font-semibold text-gray-900 mb-6">Billing Actions</h3>
                    <div className="space-y-4">
                      <button className="w-full text-left p-5 bg-gray-50 hover:bg-white border border-gray-200 rounded-2xl transition-all duration-300 group hover:scale-[1.02] hover:shadow-md flex items-center gap-4">
                        <DownloadCloud className="h-5 w-5 text-blue-500" />
                        <span className="text-gray-700 group-hover:text-gray-900 font-medium">Download Invoice</span>
                      </button>
                      <button className="w-full text-left p-5 bg-gray-50 hover:bg-white border border-gray-200 rounded-2xl transition-all duration-300 group hover:scale-[1.02] hover:shadow-md flex items-center gap-4">
                        <Eye className="h-5 w-5 text-green-500" />
                        <span className="text-gray-700 group-hover:text-gray-900 font-medium">View Billing Details</span>
                      </button>
                      <button 
                        onClick={() => setShowUpgradeModal(true)}
                        className="w-full text-left p-5 bg-gray-50 hover:bg-white border border-gray-200 rounded-2xl transition-all duration-300 group hover:scale-[1.02] hover:shadow-md flex items-center gap-4"
                      >
                        <Zap className="h-5 w-5 text-amber-500" />
                        <span className="text-gray-700 group-hover:text-gray-900 font-medium">Upgrade Plan</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Upgrade Plan Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-8 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold text-gray-900">Upgrade Your Plan</h2>
                <button 
                  onClick={() => setShowUpgradeModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>
              <p className="text-gray-600 mt-3 text-lg">
                Choose the perfect plan for your growing business. All plans include 3 months of discounted pricing.
              </p>
            </div>

            <div className="p-8">
              <div className="grid grid-cols-1 gap-8">
                {plans.map((plan) => (
                  <div
                    key={plan.id}
                    className={`relative bg-white rounded-2xl border-2 transition-all duration-300 hover:scale-105 ${
                      plan.id === currentSubscription.planId
                        ? 'border-purple-500 bg-purple-50 shadow-2xl'
                        : plan.popular 
                          ? 'border-purple-300 shadow-2xl' 
                          : 'border-gray-200 hover:border-gray-300 shadow-xl'
                    }`}
                  >
                    {plan.popular && (
                      <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                        <div className="bg-purple-600 text-white px-6 py-2 rounded-full font-bold text-sm flex items-center gap-2 shadow-lg">
                          <Star className="h-4 w-4 fill-current" />
                          Most Popular
                        </div>
                      </div>
                    )}

                    {plan.id === currentSubscription.planId && (
                      <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                        <div className="bg-green-500 text-white px-6 py-2 rounded-full font-bold text-sm shadow-lg">
                          Current Plan
                        </div>
                      </div>
                    )}

                    <div className="p-8">
                      <h3 className="text-2xl font-bold text-gray-900 mb-3">{plan.name}</h3>
                      <div className="flex items-baseline gap-2 mb-4">
                        <span className="text-3xl font-bold text-gray-900">
                          {formatPrice(plan.discountedPrice)}
                        </span>
                        <span className="text-gray-600 text-lg">/{plan.period}</span>
                      </div>

                      <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
                        <div className="text-green-800 font-semibold text-lg">
                          Save {formatPrice(plan.savings)}/{plan.period}
                        </div>
                        <div className="text-green-600 text-sm">
                          {plan.savingsDuration}
                        </div>
                      </div>

                      <div className="space-y-3 mb-8">
                        {plan.features.map((feature, index) => (
                          <div key={index} className="flex items-center gap-3">
                            <Check className="h-5 w-5 text-green-500" />
                            <span className="text-gray-700">{feature.text}</span>
                          </div>
                        ))}
                      </div>

                      <button
                        onClick={() => handleUpgrade(plan.id)}
                        disabled={plan.id === currentSubscription.planId}
                        className={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-300 ${
                          plan.id === currentSubscription.planId
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : plan.popular
                              ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-lg hover:shadow-xl'
                              : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl'
                        }`}
                      >
                        {plan.id === currentSubscription.planId ? 'Current Plan' : plan.cta}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BusinessProfilePage;