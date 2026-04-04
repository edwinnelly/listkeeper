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
  Zap
} from "lucide-react";
import Cookies from "js-cookie";
import Image from "next/image";

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

const STATIC_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

type TabType = "overview" | "analytics" | "team" | "settings";

const ViewBusinessPage = () => {
  const params = useParams();
  const router = useRouter();
  const id = params.businesskey as string;
  
  const [business, setBusiness] = useState<Business | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("overview");

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

  const handleEdit = useCallback(() => {
    router.push(`/editbusiness/${id}`);
  }, [router, id]);

  const handleTabChange = useCallback((tab: TabType) => {
    setActiveTab(tab);
  }, []);

  const getStatusConfig = useCallback((status: string) => {
    const configs = {
      active: {
        color: "bg-gray-50 text-gray-700 border-gray-200",
        icon: CheckCircle,
        label: "Active"
      },
      inactive: {
        color: "bg-gray-50 text-gray-700 border-gray-200",
        icon: XCircle,
        label: "Inactive"
      },
      pending: {
        color: "bg-gray-50 text-gray-700 border-gray-200",
        icon: AlertTriangle,
        label: "Pending"
      }
    };
    return configs[status?.toLowerCase() as keyof typeof configs] || configs.inactive;
  }, []);

  const formatDate = useCallback((dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return "Invalid date";
    }
  }, []);

  const getTimeAgo = useCallback((dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return formatDate(dateString);
  }, [formatDate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-gray-200 border-t-gray-600 rounded-full animate-spin mx-auto mb-4"></div>
            <Building2 className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-8 w-8 text-gray-600" />
          </div>
          <p className="text-gray-700 font-medium text-lg">Loading business profile...</p>
          <p className="text-gray-500 text-sm mt-1">Please wait a moment</p>
        </div>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="bg-red-50 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-red-200">
            <Building2 className="h-10 w-10 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Business Not Found</h2>
          <p className="text-gray-600 mb-6">
            The business profile you&apos;re looking for doesn&apos;t exist or may have been removed.
          </p>
          <Link
            href="/business"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-all duration-200 shadow-lg shadow-gray-500/25 hover:shadow-xl"
          >
            <ArrowLeft size={18} />
            Back to Businesses
          </Link>
        </div>
      </div>
    );
  }

  const statusConfig = getStatusConfig(business.status);
  const StatusIcon = statusConfig.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Top Navigation Bar - Scrolls with page */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Link
                href="/business"
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </Link>
              <div className="h-6 w-px bg-gray-300"></div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-500">Business</span>
                <ChevronRight className="h-4 w-4 text-gray-400" />
                <span className="text-sm font-semibold text-gray-900">{business.name}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                <Star className="h-5 w-5 text-gray-500" />
              </button>
              <button className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                <MoreHorizontal className="h-5 w-5 text-gray-500" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <div className="flex items-start gap-6">
              {/* Logo */}
              <div className="relative">
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-gray-600 to-gray-800 p-1">
                  <div className="w-full h-full bg-white rounded-xl overflow-hidden">
                    {business.logo ? (
                      <Image
                        src={`${STATIC_URL}/storage/${business.logo}`}
                        alt={business.name}
                        width={96}
                        height={96}
                        className="w-full h-full object-cover"
                        unoptimized={STATIC_URL.includes('localhost')}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Building2 className="h-10 w-10 text-gray-600" />
                      </div>
                    )}
                  </div>
                </div>
                <div className="absolute -top-1 -right-1">
                  <span className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${statusConfig.color}`}>
                    <StatusIcon className="h-3 w-3" />
                    {statusConfig.label}
                  </span>
                </div>
              </div>

              {/* Business Info */}
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-bold text-gray-900">{business.name}</h1>
                  <span className="px-3 py-1 bg-gray-50 text-gray-700 rounded-full text-sm font-medium border border-gray-200">
                    {business.industry}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-gray-600">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span>{business.city || "Remote"}, {business.country || "N/A"}</span>
                  </div>
                  <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span>Created {getTimeAgo(business.created_at)}</span>
                  </div>
                </div>
                <p className="text-gray-600 max-w-2xl">
                  {business.description || "No description provided."}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleEdit}
                className="px-4 py-2.5 border border-gray-300 rounded-xl hover:bg-gray-50 flex items-center gap-2 transition-colors"
              >
                <Edit3 className="h-4 w-4 text-gray-600" />
                <span>Edit</span>
              </button>
              <Link
                href={`/business/payment/${id}`}
                className="px-4 py-2.5 bg-gray-600 text-white rounded-xl hover:bg-gray-700 flex items-center gap-2 transition-colors shadow-lg shadow-gray-500/25"
              >
                <CreditCard className="h-4 w-4" />
                <span>Billing</span>
              </Link>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-6 mt-8 border-b border-gray-200">
            {[
              { id: "overview" as TabType, label: "Overview", icon: Building2 },
              { id: "analytics" as TabType, label: "Analytics", icon: BarChart },
              { id: "team" as TabType, label: "Team", icon: Users },
              { id: "settings" as TabType, label: "Settings", icon: Settings }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                  activeTab === tab.id
                    ? "border-gray-600 text-gray-600"
                    : "border-transparent text-gray-600 hover:text-gray-900"
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Main Information */}
            <div className="lg:col-span-2 space-y-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "Team Size", value: business.employee_count || 0, icon: Users, color: "gray" },
                  { label: "Founded", value: business.founded_date ? new Date(business.founded_date).getFullYear() : "N/A", icon: Calendar, color: "gray" },
                  { label: "Projects", value: "12", icon: Target, color: "gray" },
                  { label: "Revenue", value: "$2.4M", icon: DollarSign, color: "gray" }
                ].map((stat, idx) => (
                  <div key={idx} className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                      <div className={`p-2 bg-${stat.color}-50 rounded-lg`}>
                        <stat.icon className={`h-4 w-4 text-${stat.color}-600`} />
                      </div>
                      <span className="text-xs text-gray-500">+12.5%</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                    <p className="text-sm text-gray-600">{stat.label}</p>
                  </div>
                ))}
              </div>

              {/* Contact Information */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50/50">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <Mail className="h-5 w-5 text-gray-600" />
                    Contact Information
                  </h3>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { icon: Mail, label: "Email", value: business.email, href: `mailto:${business.email}` },
                      { icon: Phone, label: "Phone", value: business.phone || "Not provided", href: business.phone ? `tel:${business.phone}` : null },
                      { icon: Globe, label: "Website", value: business.website || "Not provided", href: business.website, external: true },
                      { icon: MapPin, label: "Address", value: business.address || "Not provided", href: business.address ? `https://maps.google.com/?q=${encodeURIComponent(business.address)}` : null, external: true }
                    ].map((item, idx) => (
                      <div key={idx} className="flex items-start gap-3 p-3 bg-gray-50/50 rounded-lg hover:bg-gray-50 transition-colors group">
                        <div className="p-2 bg-white rounded-lg border border-gray-200 group-hover:border-gray-300">
                          <item.icon className="h-4 w-4 text-gray-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-500 mb-1">{item.label}</p>
                          {item.href ? (
                            <a
                              href={item.href}
                              target={item.external ? "_blank" : undefined}
                              rel={item.external ? "noopener noreferrer" : undefined}
                              className="text-sm font-medium text-gray-900 hover:text-gray-600 truncate block"
                            >
                              {item.value}
                              {item.external && <ExternalLink className="h-3 w-3 inline ml-1" />}
                            </a>
                          ) : (
                            <p className="text-sm font-medium text-gray-900 truncate">{item.value}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50/50 flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <Activity className="h-5 w-5 text-gray-600" />
                    Recent Activity
                  </h3>
                  <Link href="#" className="text-sm text-gray-600 hover:text-gray-700">
                    View all
                  </Link>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    {[1, 2, 3].map((_, idx) => (
                      <div key={idx} className="flex items-start gap-3 pb-4 border-b border-gray-100 last:border-0">
                        <div className="p-2 bg-gray-50 rounded-lg">
                          <Zap className="h-4 w-4 text-gray-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">Business profile updated</p>
                          <p className="text-xs text-gray-500 mt-1">2 hours ago</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Sidebar */}
            <div className="space-y-6">
              {/* Quick Actions */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50/50">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <Zap className="h-5 w-5 text-gray-600" />
                    Quick Actions
                  </h3>
                </div>
                <div className="p-4">
                  <div className="space-y-2">
                    {[
                      { icon: BarChart, label: "View Analytics", onClick: () => setActiveTab("analytics") },
                      { icon: UserPlus, label: "Invite Team Member", href: `/business/team/${id}/invite` },
                      { icon: DownloadCloud, label: "Export Business Data" },
                      { icon: FileText, label: "Generate Report" }
                    ].map((action, idx) => (
                      action.href ? (
                        <Link
                          key={idx}
                          href={action.href}
                          className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors group"
                        >
                          <div className="p-2 bg-gray-50 rounded-lg group-hover:bg-white">
                            <action.icon className="h-4 w-4 text-gray-600" />
                          </div>
                          <span className="text-sm font-medium text-gray-700 group-hover:text-gray-600">
                            {action.label}
                          </span>
                        </Link>
                      ) : (
                        <button
                          key={idx}
                          onClick={action.onClick}
                          className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors group"
                        >
                          <div className="p-2 bg-gray-50 rounded-lg group-hover:bg-white">
                            <action.icon className="h-4 w-4 text-gray-600" />
                          </div>
                          <span className="text-sm font-medium text-gray-700 group-hover:text-gray-600">
                            {action.label}
                          </span>
                        </button>
                      )
                    ))}
                  </div>
                </div>
              </div>

              {/* Business Metrics */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50/50">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <Award className="h-5 w-5 text-gray-600" />
                    Business Metrics
                  </h3>
                </div>
                <div className="p-4">
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">Growth Rate</span>
                        <span className="font-medium text-gray-900">+24%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-gray-600 h-2 rounded-full" style={{ width: '75%' }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">Market Share</span>
                        <span className="font-medium text-gray-900">18%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-gray-600 h-2 rounded-full" style={{ width: '45%' }}></div>
                      </div>
                    </div>
                    <div className="pt-4 border-t border-gray-200">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Customer Satisfaction</span>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star key={star} className="h-4 w-4 text-gray-400 fill-gray-400" />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* System Info */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50/50">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <Shield className="h-5 w-5 text-gray-600" />
                    System Information
                  </h3>
                </div>
                <div className="p-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-600">Business ID</span>
                      <span className="text-xs font-mono bg-gray-50 text-gray-700 px-2 py-1 rounded border border-gray-200">
                        {business.id}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-600">Created</span>
                      <span className="text-sm font-medium text-gray-900">
                        {formatDate(business.created_at)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-600">Last Updated</span>
                      <span className="text-sm font-medium text-gray-900">
                        {formatDate(business.created_at)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Other tabs placeholder */}
        {activeTab !== "overview" && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="bg-gray-50 p-4 rounded-2xl inline-block mb-4">
                <Activity className="h-8 w-8 text-gray-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Section
              </h3>
              <p className="text-gray-500">
                This section is under development. Check back soon!
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default ViewBusinessPage;