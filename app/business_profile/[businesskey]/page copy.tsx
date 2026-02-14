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
  Plus,
  CreditCard,
  Download,
  BarChart,
  UserPlus,
  DownloadCloud
} from "lucide-react";
import Cookies from "js-cookie";

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

const ViewBusinessPage = () => {
  const params = useParams();
  const router = useRouter();
  const id = params.businesskey as string;
  
  const [business, setBusiness] = useState<Business | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Input classes from your concept
  const inputClass = "w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200 placeholder-gray-400 text-sm";
  const labelClass = "block text-sm font-medium text-gray-700 mb-2";

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
        console.log(res);
      } catch (err: any) {
        console.error("Error fetching business", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBusiness();
  }, [id]);

  // ===========================================================================
  // HANDLE EDIT
  // ===========================================================================

  const handleEdit = () => {
    router.push(`/editbusiness/${id}`);
  };

  // ===========================================================================
  // LOADING SKELETON
  // ===========================================================================

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-24 mb-8"></div>
            <div className="bg-white rounded-xl border border-gray-200">
              <div className="h-48 bg-gradient-to-r from-gray-100 to-gray-50 rounded-t-xl"></div>
              <div className="p-6">
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                  <div className="xl:col-span-2 space-y-6">
                    <div className="h-32 bg-gray-100 rounded-lg"></div>
                    <div className="h-48 bg-gray-100 rounded-lg"></div>
                  </div>
                  <div className="space-y-6">
                    <div className="h-48 bg-gray-100 rounded-lg"></div>
                    <div className="h-32 bg-gray-100 rounded-lg"></div>
                  </div>
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
      <div className="min-h-screen bg-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <div className="bg-white rounded-xl p-12 border border-gray-200">
            <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Building2 className="h-10 w-10 text-gray-400" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">Business Not Found</h2>
            <p className="text-gray-600 mb-8">The business you're looking for doesn't exist.</p>
            <Link
              href="/business"
              className="inline-flex items-center px-6 py-3 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800 transition-all duration-300"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
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
    <div className="min-h-screen bg-white py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/business"
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-6 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Business
          </Link>
        </div>

        {/* Main Card */}
        <div className="bg-white  border border-gray-200 overflow-hidden">
          
          {/* Hero Section */}
          <div className="bg-gradient-to-r from-gray-900 to-gray-800 px-6 py-5">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center space-x-6 mb-6 lg:mb-0">
                {business.logo ? (
                  <div className="relative">
                    <img
                      src={`http://localhost:8000/storage/${business.logo}`}
                      alt="Business Logo"
                      className="w-16 h-16 rounded-xl object-cover border border-gray-700"
                    />
                  </div>
                ) : (
                  <div className="w-16 h-16 bg-gray-700 rounded-xl flex items-center justify-center border border-gray-600">
                    <Building2 className="h-8 w-8 text-gray-400" />
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="h-4 w-4 text-blue-400" />
                    <h1 className="text-2xl font-semibold text-white">
                      {business.name}
                    </h1>
                  </div>
                  <p className="text-gray-300">{business.industry}</p>
                </div>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={handleEdit}
                  className="inline-flex items-center px-5 py-2.5 bg-white/10 text-white font-medium rounded-lg hover:bg-white/20 transition-all duration-300 border border-white/20"
                >
                  <Edit3 className="h-4 w-4 mr-2" />
                  Edit Business
                </button>
                {/* <Link 
                  href={`/business/payment/${id}`}
                  className="inline-flex items-center px-5 py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium rounded-lg transition-all duration-300"
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  Billing & Usage
                </Link> */}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              
              {/* Left Column - Main Information */}
              <div className="xl:col-span-2 space-y-6">
                
                {/* Description Card */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-3">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <FileText className="h-5 w-5 text-gray-600" />
                    </div>
                    Company Overview
                  </h3>
                  <p className="text-gray-700 leading-relaxed">
                    {business.description || "No description provided."}
                  </p>
                </div>

                {/* Contact Information */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-3">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <Mail className="h-5 w-5 text-gray-600" />
                    </div>
                    Contact Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-all duration-200">
                      <div className="p-2 bg-white rounded-lg border border-gray-200">
                        <Mail className="h-5 w-5 text-gray-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Email</p>
                        <p className="text-gray-900 font-medium">{business.email}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-all duration-200">
                      <div className="p-2 bg-white rounded-lg border border-gray-200">
                        <Phone className="h-5 w-5 text-gray-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Phone</p>
                        <p className="text-gray-900 font-medium">{business.phone || "Not provided"}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-all duration-200">
                      <div className="p-2 bg-white rounded-lg border border-gray-200">
                        <Globe className="h-5 w-5 text-gray-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Website</p>
                        <p className="text-gray-900 font-medium">
                          {business.website ? (
                            <a href={business.website} target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 transition-colors">
                              {business.website}
                            </a>
                          ) : (
                            "Not provided"
                          )}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-all duration-200">
                      <div className="p-2 bg-white rounded-lg border border-gray-200">
                        <MapPin className="h-5 w-5 text-gray-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Address</p>
                        <p className="text-gray-900 font-medium">{business.address || "Not provided"}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - Side Information */}
              <div className="space-y-6">
                
                {/* Business Stats */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-3">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <Activity className="h-5 w-5 text-gray-600" />
                    </div>
                    Business Metrics
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-all duration-200">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-white rounded-lg border border-gray-200">
                          <Users className="h-4 w-4 text-gray-600" />
                        </div>
                        <span className="text-gray-700">Team Size</span>
                      </div>
                      <span className="text-xl font-bold text-gray-900">
                        {business.employee_count || "N/A"}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-all duration-200">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-white rounded-lg border border-gray-200">
                          <Calendar className="h-4 w-4 text-gray-600" />
                        </div>
                        <span className="text-gray-700">Founded</span>
                      </div>
                      <span className="text-xl font-bold text-gray-900">
                        {business.founded_date ? new Date(business.founded_date).getFullYear() : "N/A"}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-all duration-200">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-white rounded-lg border border-gray-200">
                          <TrendingUp className="h-4 w-4 text-gray-600" />
                        </div>
                        <span className="text-gray-700">Status</span>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        business.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {business.status?.toUpperCase() || 'UNKNOWN'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                  <div className="space-y-3">
                    <button className="w-full text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-3">
                      <BarChart className="h-4 w-4 text-gray-600" />
                      <span className="text-gray-700">View Analytics</span>
                    </button>
                    <button className="w-full text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-3">
                      <UserPlus className="h-4 w-4 text-gray-600" />
                      <span className="text-gray-700">Manage Team</span>
                    </button>
                    <button className="w-full text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-3">
                      <DownloadCloud className="h-4 w-4 text-gray-600" />
                      <span className="text-gray-700">Export Data</span>
                    </button>
                    <Link 
                      href={`/business/payment/${id}`}
                      className="w-full text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-3"
                    >
                      <CreditCard className="h-4 w-4 text-gray-600" />
                      <span className="text-gray-700">Billing & Usage</span>
                    </Link>
                  </div>
                </div>

                {/* Metadata */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-3">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <Shield className="h-5 w-5 text-gray-600" />
                    </div>
                    System Information
                  </h3>
                  <div className="text-sm space-y-3">
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <span className="text-gray-600">Created</span>
                      <span className="text-gray-900 font-medium">
                        {new Date(business.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <span className="text-gray-600">Business ID</span>
                      <span className="text-gray-900 font-mono text-xs bg-gray-200 px-2 py-1 rounded">
                        {business.id}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="text-center mt-12">
          <p className="text-sm text-gray-500 font-medium">
            Last updated • {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ViewBusinessPage;