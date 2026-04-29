"use client";
import { withAuth } from "@/hoc/withAuth";
import { apiGet } from "@/lib/axios";
import React, { useState, useRef, useCallback, useMemo} from "react";
// import { useNavigate } from 'react-router-dom';
import {
  Search,
  Building2,
  Plus,
  MoreVertical,
  Edit,
  Trash2,
  Pause,
  Eye,
  Loader2,
  MapPin,
  Phone,
  Zap,
  Sparkles,
  ArrowUpRight,
  Activity,
  Grid3X3,
  List,
  Download,
  X,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

interface Business {
  id: number;
  business_name: string;
  registration_no: string | null;
  industry_type: string | null;
  email: string | null;
  phone: string | null;
  country: string | null;
  city: string | null;
  state: string | null;
  status: string;
  subscription_plan: string;
  currency: string;
  website: string | null;
  about_business: string | null;
  address: string | null;
  language: string;
  logo: string | null;
  business_key: string;
  slug: string;
  owner_id: number;
  ekey: number;
}

// Define proper type for the HOC props
interface WithAuthProps {
  user?: UserType;
  loading?: boolean;
}

// Define user type for withAuth HOC
interface UserType {
  id?: number;
  name?: string;
  email?: string;
  businesses_one?: Array<{
    id: number;
    business_name: string;
  }>;
}

const STATIC_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// const ManageBusinesses = ({ user: _user, loading: _loading }: WithAuthProps = {}) => {
  const ManageBusinesses = ({}: WithAuthProps = {}) => {
  // State
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [openDropdown, setOpenDropdown] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState<string>("name");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [planFilter, setPlanFilter] = useState<string>("all");
  const [selectedBusinesses, setSelectedBusinesses] = useState<number[]>([]);

  const dropdownRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});

  // Debounced search
  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [search]);

  // Click outside handler
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openDropdown !== null) {
        const dropdownElement = dropdownRefs.current[openDropdown];
        if (dropdownElement && !dropdownElement.contains(event.target as Node)) {
          setOpenDropdown(null);
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openDropdown]);

  // Fetch businesses
  // React.useEffect(() => {
  //   const fetchBusinesses = async () => {
  //     try {
  //       setLoading(true);
  //       const response = await apiGet("/businesses");
        
  //       // Extract businesses from response
  //       let businessesData = response.data;
  //       if (businessesData?.data?.businesses) {
  //         businessesData = businessesData.data.businesses;
  //       } else if (businessesData?.data) {
  //         businessesData = businessesData.data;
  //       } else if (businessesData?.businesses) {
  //         businessesData = businessesData.businesses;
  //       }
        
  //       const businessesArray = Array.isArray(businessesData) ? businessesData : [];
  //       setBusinesses(businessesArray);
  //     } catch (error) {
  //       console.error("Failed to fetch businesses:", error);
  //       setBusinesses([]);
  //     } finally {
  //       setLoading(false);
  //     }
  //   };

  //   fetchBusinesses();
  // }, []);

  React.useEffect(() => {
    const fetchBusinesses = async () => {
      try {
        setLoading(true);
        const response = await apiGet("/businesses");
        
        // Extract businesses from response
        let businessesData = response.data;
        if (businessesData?.data?.businesses) {
          businessesData = businessesData.data.businesses;
        } else if (businessesData?.data) {
          businessesData = businessesData.data;
        } else if (businessesData?.businesses) {
          businessesData = businessesData.businesses;
        }
        
        const businessesArray = Array.isArray(businessesData) ? businessesData : [];
        setBusinesses(businessesArray);
      } catch (error) {
        console.error("Failed to fetch businesses:", error);
        
        // Check for 403 error and redirect to login
        if (error.response?.status === 403) {
          // If using React Router
          window.location.href = '/login';
          
          // Or if you need to redirect with window.location
          window.location.href = '/errors';
          return; // Prevent further error handling
        }
        
        setBusinesses([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBusinesses();
  }, []);

  // Filter and sort businesses
  const { filteredBusinesses, sortedBusinesses } = useMemo(() => {
    const filtered = businesses.filter((biz) => {
      // Search filter
      const searchLower = debouncedSearch.toLowerCase();
      const matchesSearch = 
        debouncedSearch === "" ||
        biz.business_name?.toLowerCase().includes(searchLower) ||
        biz.phone?.toLowerCase().includes(searchLower) ||
        biz.industry_type?.toLowerCase().includes(searchLower) ||
        biz.city?.toLowerCase().includes(searchLower) ||
        biz.country?.toLowerCase().includes(searchLower);

      // Status filter
      const matchesStatus = statusFilter === "all" || biz.status === statusFilter;

      // Plan filter
      const matchesPlan =
        planFilter === "all" ||
        (planFilter === "premium" && biz.subscription_plan?.toLowerCase().includes("premium")) ||
        (planFilter === "basic" && !biz.subscription_plan?.toLowerCase().includes("premium"));

      return matchesSearch && matchesStatus && matchesPlan;
    });

    // Sort businesses
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.business_name.localeCompare(b.business_name);
        case "recent":
          return b.id - a.id;
        case "status":
          return a.status.localeCompare(b.status);
        default:
          return 0;
      }
    });

    return { filteredBusinesses: filtered, sortedBusinesses: sorted };
  }, [businesses, debouncedSearch, statusFilter, planFilter, sortBy]);

  // Handlers
  const handleSelectBusiness = useCallback((businessId: number, checked: boolean) => {
    setSelectedBusinesses(prev => 
      checked ? [...prev, businessId] : prev.filter(id => id !== businessId)
    );
  }, []);

  const handleDropdownToggle = useCallback((e: React.MouseEvent, businessId: number) => {
    e.stopPropagation();
    setOpenDropdown(prev => prev === businessId ? null : businessId);
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent, businessId: number) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setOpenDropdown(prev => prev === businessId ? null : businessId);
    }
  }, []);

  // Status helpers
  const getStatusColor = useCallback((status: string) => {
    const statusMap: Record<string, string> = {
      active: "bg-gray-50 text-gray-700 border border-gray-200",
      pending: "bg-amber-50 text-amber-700 border border-amber-200",
      default: "bg-red-50 text-red-700 border border-red-200",
    };
    return statusMap[status] || statusMap.default;
  }, []);

  const getPlanColor = useCallback((plan: string) => {
    const planLower = plan?.toLowerCase() || '';
    const planMap: Record<string, string> = {
      premium: "bg-gray-50 text-gray-700 border border-gray-200",
      enterprise: "bg-gray-50 text-gray-700 border border-gray-200",
      pro: "bg-orange-50 text-orange-700 border border-orange-200",
      default: "bg-gray-50 text-gray-700 border border-gray-200",
    };
    
    if (planLower.includes('premium')) return planMap.premium;
    if (planLower.includes('enterprise')) return planMap.enterprise;
    if (planLower.includes('pro')) return planMap.pro;
    return planMap.default;
  }, []);

  const getStatusIcon = useCallback((status: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      active: <Activity className="h-3 w-3" />,
      pending: <Loader2 className="h-3 w-3" />,
      default: <Pause className="h-3 w-3" />,
    };
    return iconMap[status] || iconMap.default;
  }, []);

  // Business card component
  const BusinessCard = useCallback(({ biz }: { biz: Business }) => {
    const isSelected = selectedBusinesses.includes(biz.id);

    return (
      <div
        className={`group bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all duration-300 hover:border-gray-300 ${
          isSelected ? 'bg-gray-50 border-gray-200' : ''
        }`}
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            {biz.logo ? (
              <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-gray-200">
                <Image
                  src={`${STATIC_URL}/storage/${biz.logo}`}
                  alt={biz.business_name}
                  fill
                  className="object-cover"
                  sizes="48px"
                  unoptimized={STATIC_URL.includes('localhost')}
                />
              </div>
            ) : (
              <div className="w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-50 border border-gray-200/50 flex items-center justify-center rounded-xl">
                <Building2 size={20} className="text-gray-600" />
              </div>
            )}
            <div>
              <h3 className="font-semibold text-gray-900 group-hover:text-gray-700 transition-colors line-clamp-1">
                {biz.business_name}
              </h3>
              <p className="text-sm text-gray-500 line-clamp-1">
                {biz.industry_type || "No industry"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={(e) => handleSelectBusiness(biz.id, e.target.checked)}
              className="rounded border-gray-300 text-gray-600 focus:ring-gray-500"
              aria-label={`Select ${biz.business_name}`}
            />
            <div
              ref={(el) => {
                dropdownRefs.current[biz.id] = el;
              }}
              className="relative"
            >
              <button
                onClick={(e) => handleDropdownToggle(e, biz.id)}
                onKeyDown={(e) => handleKeyDown(e, biz.id)}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                aria-label="More options"
                aria-expanded={openDropdown === biz.id}
                aria-haspopup="true"
                type="button"
              >
                <MoreVertical className="h-4 w-4 text-gray-400" />
              </button>

              {openDropdown === biz.id && (
                <div 
                  className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl border border-gray-200 shadow-lg z-50 py-1"
                  role="menu"
                  aria-orientation="vertical"
                >
                  <Link 
                    href={`/switchaccount/${biz.ekey}`} 
                    className="block"
                    role="menuitem"
                  >
                    <button className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-200 border-b border-gray-100">
                      <ArrowUpRight className="h-4 w-4 text-gray-600" />
                      Access Business
                    </button>
                  </Link>
                  <Link 
                    href={`/business_profile/${biz.ekey}`} 
                    className="block"
                    role="menuitem"
                  >
                    <button className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-200 border-b border-gray-100">
                      <Eye className="h-4 w-4 text-gray-600" />
                      View Profile
                    </button>
                  </Link>
                  <Link 
                    href={`/editbusiness/${biz.ekey}`} 
                    className="block"
                    role="menuitem"
                  >
                    <button className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-200 border-b border-gray-100">
                      <Edit className="h-4 w-4 text-gray-600" />
                      Edit Business
                    </button>
                  </Link>
                  <Link 
                    href={`/business_suspend/${biz.ekey}`} 
                    className="block"
                    role="menuitem"
                  >
                    <button className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors border-b border-gray-100">
                      <Pause className="h-4 w-4 text-amber-600" />
                      Suspend
                    </button>
                  </Link>
                  <Link 
                    href={`/terminatebusiness/${biz.ekey}`} 
                    className="block"
                    role="menuitem"
                  >
                    <button className="flex items-center gap-3 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors">
                      <Trash2 className="h-4 w-4" />
                      Delete Business
                    </button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-3 mb-4">
          <div className="flex items-center justify-between">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${getStatusColor(biz.status)}`}
            >
              {getStatusIcon(biz.status)}
              {biz.status.charAt(0).toUpperCase() + biz.status.slice(1)}
            </span>
            <span
              className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold ${getPlanColor(biz.subscription_plan)}`}
            >
              {biz.subscription_plan || "Basic"}
            </span>
          </div>

          <div className="flex items-center gap-4 text-sm text-gray-600">
            {biz.phone && (
              <div className="flex items-center gap-1">
                <Phone className="h-3.5 w-3.5 text-gray-500" />
                <span className="font-medium">{biz.phone}</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5 text-gray-500" />
              <span className="font-medium">{biz.city || "Remote"}</span>
            </div>
          </div>
        </div>

        <div className="flex gap-2 pt-4 border-t border-gray-200">
          <Link
            href={`/business_profile/${biz.ekey}`}
            className="flex-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors duration-200 text-center"
          >
            View Details
          </Link>
          <Link
            href={`/switchaccount/${biz.ekey}`}
            className="px-3 py-2 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white text-sm font-medium rounded-lg transition-all duration-200 shadow-lg shadow-gray-500/25"
          >
            Access
          </Link>
        </div>
      </div>
    );
  }, [selectedBusinesses, openDropdown, handleSelectBusiness, handleDropdownToggle, handleKeyDown, getStatusColor, getPlanColor, getStatusIcon]);

  // Stats calculation
  const stats = useMemo(() => ({
    total: businesses.length,
    active: businesses.filter(b => b.status === "active").length,
    premium: businesses.filter(b => b.subscription_plan?.toLowerCase().includes("premium")).length,
    needsAttention: businesses.filter(b => b.status !== "active").length,
  }), [businesses]);

  return (
    <div className="min-h-screen bg-gray-50/30">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-8xl mx-auto px-6 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center space-x-4">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center text-sm text-gray-600 hover:text-gray-700 transition-colors group"
                >
                  <ArrowUpRight className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform text-gray-600" />
                  Back to Dashboard
                </Link>
                <div className="h-6 w-px bg-gray-300"></div>
                <p className="text-lg font-bold text-gray-900">Manage Businesses</p>
              </div>
              <p className="text-gray-600 text-sm">
                Manage and monitor your business portfolio across your organization
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => window.location.reload()}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                title="Refresh"
                aria-label="Refresh"
                type="button"
              >
                <RefreshCw size={18} />
              </button>
              <button 
                className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-colors font-medium"
                type="button"
              >
                <Download size={16} className="text-gray-600" />
                Export
              </button>
              <Link
                href="/addbusiness"
                className="flex items-center gap-2 bg-gradient-to-r from-gray-600 to-gray-700 text-white px-5 py-2.5 rounded-lg hover:from-gray-700 hover:to-gray-800 transition-all duration-200 font-medium shadow-lg shadow-gray-500/25 hover:shadow-xl hover:shadow-gray-500/30"
                prefetch={false}
              >
                <Plus size={18} />
                Add Business
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-8xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[
            { label: "Total Businesses", value: stats.total, icon: Building2, color: "gray" },
            { label: "Active", value: stats.active, icon: Activity, color: "gray" },
            { label: "Premium", value: stats.premium, icon: Sparkles, color: "gray" },
            { label: "Need Attention", value: stats.needsAttention, icon: Zap, color: "gray" },
          ].map((stat) => (
            <div key={stat.label} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                </div>
                <div className={`w-12 h-12 bg-${stat.color}-50 rounded-xl flex items-center justify-center`}>
                  <stat.icon className={`h-6 w-6 text-${stat.color}-600`} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Selection Bar */}
        {selectedBusinesses.length > 0 && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <span className="text-gray-700 font-medium">
                  {selectedBusinesses.length} business{selectedBusinesses.length !== 1 ? 'es' : ''} selected
                </span>
                <div className="flex items-center space-x-3">
                  <button className="text-sm text-gray-700 hover:text-gray-800 font-medium transition-colors" type="button">
                    Edit
                  </button>
                  <button className="text-sm text-red-600 hover:text-red-700 font-medium transition-colors" type="button">
                    Delete
                  </button>
                </div>
              </div>
              <button 
                onClick={() => setSelectedBusinesses([])}
                className="text-gray-600 hover:text-gray-700 transition-colors"
                aria-label="Clear selection"
                type="button"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {/* Filters */}
          <div className="px-6 py-5 border-b border-gray-200 bg-gray-50/50">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 flex-1">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search businesses, industries, locations..."
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 outline-none transition placeholder-gray-500 text-sm hover:border-gray-300"
                    aria-label="Search businesses"
                  />
                </div>
                
                <div className="flex items-center gap-3">
                  <select 
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-500 focus:border-gray-500 outline-none transition hover:border-gray-300"
                    aria-label="Filter by status"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="pending">Pending</option>
                    <option value="inactive">Inactive</option>
                  </select>
                  
                  <select 
                    value={planFilter}
                    onChange={(e) => setPlanFilter(e.target.value)}
                    className="px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-500 focus:border-gray-500 outline-none transition hover:border-gray-300"
                    aria-label="Filter by plan"
                  >
                    <option value="all">All Plans</option>
                    <option value="premium">Premium</option>
                    <option value="basic">Basic</option>
                  </select>

                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-500 focus:border-gray-500 outline-none transition hover:border-gray-300"
                    aria-label="Sort by"
                  >
                    <option value="name">Sort by Name</option>
                    <option value="recent">Sort by Recent</option>
                    <option value="status">Sort by Status</option>
                  </select>

                  <div className="flex bg-gray-100 rounded-lg p-1">
                    <button
                      onClick={() => setViewMode("grid")}
                      className={`p-2 rounded-md transition-colors duration-200 ${
                        viewMode === "grid" ? "bg-white shadow-sm text-gray-600" : "text-gray-500 hover:text-gray-600"
                      }`}
                      aria-label="Grid view"
                      aria-pressed={viewMode === "grid"}
                      type="button"
                    >
                      <Grid3X3 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setViewMode("list")}
                      className={`p-2 rounded-md transition-colors duration-200 ${
                        viewMode === "list" ? "bg-white shadow-sm text-gray-600" : "text-gray-500 hover:text-gray-600"
                      }`}
                      aria-label="List view"
                      aria-pressed={viewMode === "list"}
                      type="button"
                    >
                      <List className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span className="bg-gray-50 text-gray-700 px-3 py-1.5 rounded-full text-sm font-medium border border-gray-200">
                  {loading ? "Loading..." : `${filteredBusinesses.length} business${filteredBusinesses.length !== 1 ? "es" : ""}`}
                </span>
              </div>
            </div>
          </div>

          {/* Content */}
          {loading ? (
            <div className="flex justify-center items-center py-16">
              <div className="text-center">
                <Loader2 className="h-8 w-8 text-gray-600 animate-spin mx-auto mb-3" />
                <p className="text-gray-600 font-medium">Loading your business portfolio...</p>
                <p className="text-gray-400 text-sm mt-1">Please wait a moment</p>
              </div>
            </div>
          ) : (
            <div className={`
              ${viewMode === "grid"
                ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 p-6"
                : "space-y-4 p-6"
              }
            `}>
              {sortedBusinesses.length > 0 ? (
                viewMode === "grid" ? (
                  sortedBusinesses.map((biz) => <BusinessCard key={biz.id} biz={biz} />)
                ) : (
                  sortedBusinesses.map((biz) => (
                    <div
                      key={biz.id}
                      className={`bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all duration-300 hover:border-gray-300 ${
                        selectedBusinesses.includes(biz.id) ? 'bg-gray-50 border-gray-200' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1">
                          <input
                            type="checkbox"
                            checked={selectedBusinesses.includes(biz.id)}
                            onChange={(e) => handleSelectBusiness(biz.id, e.target.checked)}
                            className="rounded border-gray-300 text-gray-600 focus:ring-gray-500"
                            aria-label={`Select ${biz.business_name}`}
                          />
                          {biz.logo ? (
                            <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-gray-200">
                              <Image
                                src={`${STATIC_URL}/storage/${biz.logo}`}
                                alt={biz.business_name}
                                fill
                                className="object-cover"
                                sizes="48px"
                                unoptimized={STATIC_URL.includes('localhost')}
                              />
                            </div>
                          ) : (
                            <div className="w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-50 border border-gray-200/50 flex items-center justify-center rounded-xl">
                              <Building2 size={20} className="text-gray-600" />
                            </div>
                          )}

                          <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                              <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">
                                {biz.business_name}
                              </h3>
                              <p className="text-sm text-gray-500 line-clamp-1">
                                {biz.industry_type}
                              </p>
                            </div>

                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-gray-500" />
                              <span className="text-sm text-gray-600 line-clamp-1">
                                {biz.city || "Remote"}, {biz.country}
                              </span>
                            </div>

                            <div className="flex items-center gap-4">
                              <span
                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${getStatusColor(biz.status)}`}
                              >
                                {getStatusIcon(biz.status)}
                                {biz.status.charAt(0).toUpperCase() + biz.status.slice(1)}
                              </span>
                              <span
                                className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold ${getPlanColor(biz.subscription_plan)}`}
                              >
                                {biz.subscription_plan || "Basic"}
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <Link
                                href={`/business_profile/${biz.ekey}`}
                                className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors duration-200"
                              >
                                View
                              </Link>
                              <Link
                                href={`/switchaccount/${biz.ekey}`}
                                className="px-3 py-1.5 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white text-sm font-medium rounded-lg transition-all duration-200 shadow-lg shadow-gray-500/25"
                              >
                                Access
                              </Link>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )
              ) : (
                <div className="col-span-full flex flex-col items-center justify-center py-16">
                  <div className="bg-gray-50 p-8 rounded-2xl mb-6">
                    <Building2 size={48} className="text-gray-400 mx-auto" />
                  </div>
                  <p className="text-gray-900 font-semibold text-lg mb-2">
                    No businesses found
                  </p>
                  <p className="text-gray-500 text-center max-w-sm mb-6">
                    {search
                      ? "No businesses match your search criteria"
                      : "Get started by adding your first business to your portfolio"}
                  </p>
                  {!search && (
                    <Link
                      href="/addbusiness"
                      className="flex items-center gap-2 bg-gradient-to-r from-gray-600 to-gray-700 text-white px-5 py-2.5 rounded-lg hover:from-gray-700 hover:to-gray-800 transition-all font-medium shadow-lg shadow-gray-500/25"
                      prefetch={false}
                    >
                      <Plus size={16} />
                      Add First Business
                    </Link>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default withAuth(ManageBusinesses);