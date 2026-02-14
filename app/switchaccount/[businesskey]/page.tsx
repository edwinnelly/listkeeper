"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import api from "@/lib/axios";
import Cookies from "js-cookie";
import { toast } from "react-hot-toast";
import Link from "next/link";
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
  ArrowUpRight,
  MoreVertical,
  // Link
} from "lucide-react";

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

interface DashboardPageProps {
  user: any;
  loading: boolean;
}

export default function DashboardPage({ user, loading }: DashboardPageProps) {
  const [business, setBusiness] = useState<Business | null>(null);
  const [fetching, setFetching] = useState(true);
  const [switchingAccount, setSwitchingAccount] = useState(false);
  
  const params = useParams();
  const router = useRouter();
  const id = params.businesskey as string;

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
        console.error("Error fetching business");
      } finally {
        setFetching(false);
      }
    };

    fetchBusiness();
  }, [id]);

  const handleSwitchAccount = async () => {
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
    } catch (err) {
      console.error("Error switching account");
    } finally {
      setSwitchingAccount(false);
    }
  };

  const StatCard = ({ 
    icon: Icon, 
    label, 
    value, 
    trend, 
    gradient 
  }: {
    icon: React.ElementType;
    label: string;
    value: number;
    trend?: number;
    gradient: string;
  }) => (
    <div className="group bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/60 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-gray-300">
      <div className="flex items-start justify-between mb-4">
        <div className={`h-12 w-12 rounded-xl ${gradient} flex items-center justify-center text-white shadow-lg`}>
          <Icon className="h-6 w-6" />
        </div>
        <button className="opacity-0 group-hover:opacity-100 transition-all p-2 hover:bg-gray-100 rounded-xl">
          <MoreVertical className="h-5 w-5 text-gray-400" />
        </button>
      </div>
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
        {label}
      </p>
      <h3 className="text-3xl font-bold text-gray-900 mb-3">{value}</h3>
      {trend && (
        <div className="flex items-center gap-2 text-sm font-medium text-emerald-600">
          <ArrowUpRight className="h-4 w-4" />
          {trend}% growth
        </div>
      )}
    </div>
  );

  const DetailCard = ({ 
    icon: Icon, 
    label, 
    value, 
    isLink = false 
  }: {
    icon: React.ElementType;
    label: string;
    value: string;
    isLink?: boolean;
  }) => (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 border border-gray-200/60 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
      <div className="flex items-center gap-4">
        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-gray-600">
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
            {label}
          </p>
          {isLink ? (
            <a
              href={value}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-gray-900 hover:text-blue-600 transition-colors font-medium"
            >
              Visit site
              <ExternalLink className="h-4 w-4" />
            </a>
          ) : (
            <p className="text-sm text-gray-900 font-medium truncate">
              {value}
            </p>
          )}
        </div>
      </div>
    </div>
  );

  if (fetching) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-600 font-medium">Loading business profile...</p>
        </div>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center space-y-4 p-8 bg-white/80 backdrop-blur-sm rounded-3xl border border-gray-200/60">
          <Building2 className="h-16 w-16 text-gray-400 mx-auto" />
          <h3 className="text-xl font-bold text-gray-900">Business Not Found</h3>
          <p className="text-gray-600">The requested business could not be loaded</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => router.back()}
              className="p-2 hover:bg-white/80 rounded-xl transition-all duration-300 backdrop-blur-sm border border-gray-200/60"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
            <div>
            
              <h1 className="text-3xl font-bold text-gray-900">Business Profile</h1>
              <p className="text-gray-600 mt-1">Manage your business settings and locations</p>
            </div>
          </div>
          <button onClick={() => router.back()} className="inline-flex items-center gap-2 px-6 py-3 bg-white/80 backdrop-blur-sm border border-gray-200/60 text-gray-700 font-semibold rounded-xl hover:shadow-lg transition-all duration-300">
            <Plus className="h-5 w-5" />
            Manage Businesses
          </button>
        </div>

        {/* Hero Section */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-8 relative overflow-hidden shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10"></div>
          <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-center gap-6">
              {business.logo ? (
                <img
                  src={`http://localhost:8000/storage/${business.logo}`}
                  alt="Business Logo"
                  className="w-24 h-24 rounded-2xl object-cover border-2 border-white/20 shadow-2xl"
                />
              ) : (
                <div className="w-24 h-24 bg-white/5 border-2 border-white/20 rounded-2xl flex items-center justify-center shadow-2xl">
                  <Building2 className="h-10 w-10 text-white/60" />
                </div>
              )}
              <div>
                <h1 className="text-4xl font-bold text-white mb-3">
                  {business.name}
                </h1>
                <p className="text-white/80 text-lg leading-relaxed">
                  {business.description || "Building the future of business"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-white/70 bg-white/10 rounded-2xl px-4 py-3 backdrop-blur-sm">
              <Calendar className="h-5 w-5" />
              <span className="font-medium">Since {business.created_at}</span>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard
            icon={Building2}
            label="Total Locations"
            value={business.stats.totalLocations}
            trend={12}
            gradient="bg-gradient-to-br from-blue-500 to-blue-600"
          />
          <StatCard
            icon={Activity}
            label="Active Locations"
            value={business.stats.activeLocations}
            trend={8}
            gradient="bg-gradient-to-br from-emerald-500 to-emerald-600"
          />
          <StatCard
            icon={Users}
            label="Inactive Locations"
            value={business.stats.inactiveLocations}
            gradient="bg-gradient-to-br from-gray-500 to-gray-600"
          />
        </div>

        {/* Business Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <DetailCard
            icon={Globe2}
            label="Website"
            value={business.details.website}
            isLink={true}
          />
          <DetailCard
            icon={MapPin}
            label="Country"
            value={business.details.country}
          />
          <DetailCard
            icon={DollarSign}
            label="Currency"
            value={business.details.currency}
          />
          <DetailCard
            icon={Briefcase}
            label="Business Type"
            value={business.details.businessType}
          />
        </div>

        {/* Address */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/60 transition-all duration-300 hover:shadow-lg">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-gray-600">
              <Home className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Company Address
              </p>
              <p className="text-lg text-gray-900 font-medium">
                {business.details.address}
              </p>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex justify-center pt-6">
              {business.status === "active" ? (
                <button
                  onClick={handleSwitchAccount}
                  disabled={switchingAccount}
                  className="inline-flex items-center gap-3 px-8 py-4 bg-blue-600 text-white text-base font-semibold rounded-xl shadow-md hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-all duration-300 hover:shadow-lg"
                >
                  {switchingAccount ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Switching...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-5 w-5" />
                      Switch Account
                    </>
                  )}
                </button>
              ) : (
                <Link href={`/business_subscription/${id}`}> 
                <button className="inline-flex items-center gap-3 px-8 py-4 bg-blue-600 text-white text-base font-semibold rounded-xl shadow-md cursor-pointer">
                  Activate Account
                </button></Link>
                
              )}
            </div>
      </div>
    </div>
  );
}