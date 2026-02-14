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
  DownloadCloud,
  ChevronRight
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
  // UTILITY FUNCTIONS
  // ===========================================================================

  const getStatusBadgeColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'inactive':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch (error) {
      return "Invalid date";
    }
  };

  // ===========================================================================
  // LOADING SKELETON
  // ===========================================================================

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
          <p className="text-gray-600 font-medium">Loading business profile...</p>
        </div>
      </div>
    );
  }

  // ===========================================================================
  // NOT FOUND STATE
  // ===========================================================================

  if (!business) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-900 font-semibold text-lg">Business not found</p>
          <p className="text-gray-500 text-sm mt-1">The business profile you're looking for doesn't exist.</p>
          <Link
            href="/business"
            className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
          >
            <ArrowLeft size={16} />
            Back to Business
          </Link>
        </div>
      </div>
    );
  }

  // ===========================================================================
  // MAIN RENDER
  // ===========================================================================

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between py-6">
            {/* Left Section */}
            <div className="flex flex-col space-y-4 mb-4 sm:mb-0">
              {/* Breadcrumb */}
              <div className="flex items-center space-x-2">
                <Link
                  href="/business"
                  className="inline-flex items-center text-sm font-normal text-gray-600 hover:text-gray-900 hover:bg-gray-50 px-2 py-1 rounded transition-colors duration-200 group"
                >
                  <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-0.5 transition-transform duration-200" />
                  Business
                </Link>
                <ChevronRight className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-900 font-semibold px-2 py-1">
                  {business.name}
                </span>
              </div>

              {/* Title Section */}
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Building2 className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center space-x-3">
                    <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">
                      Business profile
                    </h1>
                    <div className="hidden sm:flex items-center space-x-2">
                      <div className="px-2 py-1 bg-gray-100 rounded text-sm font-medium text-gray-700">
                        {business.industry}
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-600 text-base max-w-2xl">
                    Complete business information and organizational details
                  </p>
                </div>
              </div>
            </div>

            {/* Right Section - Action Buttons */}
            <div className="flex items-center space-x-2 sm:self-start">
              <button
                onClick={handleEdit}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 border border-gray-300 rounded-lg transition-colors duration-200"
              >
                <Edit3 className="h-4 w-4" />
                Edit
              </button>
              <Link 
                href={`/business/payment/${id}`}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 border border-transparent rounded-lg transition-colors duration-200"
              >
                <CreditCard className="h-4 w-4" />
                Billing
              </Link>
            </div>
          </div>
          
          {/* Secondary Navigation */}
          <div className="border-t border-gray-100 mt-2 pt-4">
            <div className="flex space-x-6">
              <button className="px-3 py-2 text-sm font-medium text-blue-600 border-b-2 border-blue-600">
                Overview
              </button>
              <button className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors duration-200">
                Analytics
              </button>
              {/* <button className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors duration-200">
                Team
              </button> */}
              <button className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors duration-200">
                Settings
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column - Main Information */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Profile Header Card */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-blue-900 to-blue-800 px-6 py-4">
                <div className="flex items-center space-x-4">
                  {business.logo ? (
                    <img
                      src={`http://localhost:8000/storage/${business.logo}`}
                      alt="Business Logo"
                      className="w-16 h-16 rounded-xl object-cover border-2 border-white/20"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-white/10 rounded-xl flex items-center justify-center border border-white/20">
                      <Building2 className="h-8 w-8 text-white" />
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Sparkles className="h-4 w-4 text-blue-300" />
                      <h2 className="text-xl font-semibold text-white">
                        {business.name}
                      </h2>
                    </div>
                    <p className="text-blue-200 text-sm">{business.industry}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusBadgeColor(business.status)}`}>
                    {business.status?.toUpperCase() || 'UNKNOWN'}
                  </span>
                </div>
              </div>
            </div>

            {/* Description Card */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
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
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-3">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <Mail className="h-5 w-5 text-gray-600" />
                </div>
                Contact Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-4 p-4 bg-gray-50/50 rounded-lg border border-gray-200 hover:border-gray-300 transition-all duration-200">
                  <div className="p-2 bg-white rounded-lg border border-gray-200">
                    <Mail className="h-5 w-5 text-gray-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="text-gray-900 font-medium truncate">{business.email}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 p-4 bg-gray-50/50 rounded-lg border border-gray-200 hover:border-gray-300 transition-all duration-200">
                  <div className="p-2 bg-white rounded-lg border border-gray-200">
                    <Phone className="h-5 w-5 text-gray-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-600">Phone</p>
                    <p className="text-gray-900 font-medium">{business.phone || "Not provided"}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 p-4 bg-gray-50/50 rounded-lg border border-gray-200 hover:border-gray-300 transition-all duration-200">
                  <div className="p-2 bg-white rounded-lg border border-gray-200">
                    <Globe className="h-5 w-5 text-gray-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-600">Website</p>
                    <p className="text-gray-900 font-medium">
                      {business.website ? (
                        <a 
                          href={business.website} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="hover:text-blue-600 transition-colors duration-200 truncate block"
                        >
                          {business.website}
                        </a>
                      ) : (
                        "Not provided"
                      )}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 p-4 bg-gray-50/50 rounded-lg border border-gray-200 hover:border-gray-300 transition-all duration-200">
                  <div className="p-2 bg-white rounded-lg border border-gray-200">
                    <MapPin className="h-5 w-5 text-gray-600" />
                  </div>
                  <div className="flex-1 min-w-0">
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
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-3">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <Activity className="h-5 w-5 text-gray-600" />
                </div>
                Business Metrics
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50/50 rounded-lg border border-gray-200 hover:border-gray-300 transition-all duration-200">
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
                
                <div className="flex items-center justify-between p-4 bg-gray-50/50 rounded-lg border border-gray-200 hover:border-gray-300 transition-all duration-200">
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
                
                <div className="flex items-center justify-between p-4 bg-gray-50/50 rounded-lg border border-gray-200 hover:border-gray-300 transition-all duration-200">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-lg border border-gray-200">
                      <TrendingUp className="h-4 w-4 text-gray-600" />
                    </div>
                    <span className="text-gray-700">Status</span>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusBadgeColor(business.status)}`}>
                    {business.status?.toUpperCase() || 'UNKNOWN'}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button className="w-full text-left p-3 bg-gray-50/50 hover:bg-gray-50 rounded-lg transition-colors duration-200 flex items-center gap-3 border border-transparent hover:border-gray-200">
                  <BarChart className="h-4 w-4 text-gray-600" />
                  <span className="text-gray-700">View Analytics</span>
                </button>
                <button className="w-full text-left p-3 bg-gray-50/50 hover:bg-gray-50 rounded-lg transition-colors duration-200 flex items-center gap-3 border border-transparent hover:border-gray-200">
                  <UserPlus className="h-4 w-4 text-gray-600" />
                  <span className="text-gray-700">Manage Team</span>
                </button>
                <button className="w-full text-left p-3 bg-gray-50/50 hover:bg-gray-50 rounded-lg transition-colors duration-200 flex items-center gap-3 border border-transparent hover:border-gray-200">
                  <DownloadCloud className="h-4 w-4 text-gray-600" />
                  <span className="text-gray-700">Export Data</span>
                </button>
                <Link 
                  href={`/business/payment/${id}`}
                  className="w-full text-left p-3 bg-gray-50/50 hover:bg-gray-50 rounded-lg transition-colors duration-200 flex items-center gap-3 border border-transparent hover:border-gray-200"
                >
                  <CreditCard className="h-4 w-4 text-gray-600" />
                  <span className="text-gray-700">Billing & Usage</span>
                </Link>
              </div>
            </div>

            {/* System Information */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-3">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <Shield className="h-5 w-5 text-gray-600" />
                </div>
                System Information
              </h3>
              <div className="text-sm space-y-3">
                <div className="flex justify-between items-center p-3 bg-gray-50/50 rounded-lg border border-gray-200">
                  <span className="text-gray-600">Created</span>
                  <span className="text-gray-900 font-medium">
                    {formatDate(business.created_at)}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50/50 rounded-lg border border-gray-200">
                  <span className="text-gray-600">Business ID</span>
                  <span className="text-gray-900 font-mono text-xs bg-gray-200 px-2 py-1 rounded">
                    {business.id}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="text-center mt-12 pt-6 border-t border-gray-200">
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