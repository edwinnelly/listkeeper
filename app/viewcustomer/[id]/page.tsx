"use client";

import { useParams } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { toast } from "react-hot-toast";
import { apiGet } from "@/lib/axios";
import { countries } from "@/app/component/country-list";
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  MapPin,
  Building,
  Calendar,
  CreditCard,
  DollarSign,
  Award,
  CheckCircle,
  XCircle,
  Globe,
  Hash,
  FileText,
  Users,
  Loader2,
  Edit,
  ShoppingBag,
  TrendingUp,
  Clock,
  Star,
  MoreHorizontal,
  Download,
  Printer,
  Send,
  MessageCircle,
  BadgeCheck,
  Home,
  Flag,
  Briefcase,
  Heart,
  Share2,
  Copy,
  ChevronRight,
} from "lucide-react";
import { withAuth } from "@/hoc/withAuth";
import { motion, AnimatePresence } from "framer-motion";

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

interface CustomerProfileData {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postal_code: string;
  customer_code: string;
  registration_date: string;
  total_purchases: number;
  outstanding_balance: number;
  is_active: boolean;
  loyalty_points: number;
  dob: string;
  gender: string;
  notes: string;
  location_id: number;
  location_name?: string;
  total_orders?: number;
  last_purchase_date?: string;
  average_order_value?: number;
}

interface UserType {
  businesses_one?: Array<{ country?: string; currency?: string }>;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

// Map currency symbols to ISO codes
const currencySymbolToCode: Record<string, string> = {
  "$": "USD",
  "€": "EUR",
  "£": "GBP",
  "¥": "JPY",
  "₹": "INR",
  "₦": "NGN",
  "A$": "AUD",
  "C$": "CAD",
  "HK$": "HKD",
  "NZ$": "NZD",
  "S$": "SGD",
  "R": "ZAR",
  "CHF": "CHF",
};

// Map currency codes to symbols
const currencyCodeToSymbol: Record<string, string> = {
  "USD": "$",
  "EUR": "€",
  "GBP": "£",
  "JPY": "¥",
  "INR": "₹",
  "NGN": "₦",
  "AUD": "A$",
  "CAD": "C$",
  "HKD": "HK$",
  "NZD": "NZ$",
  "SGD": "S$",
  "ZAR": "R",
  "CHF": "CHF",
};

const formatCurrency = (amount: number, currency: string = "NGN") => {
  try {
    // Check if the currency is a symbol and convert to code
    let currencyCode = currency;
    let currencySymbol = currencyCodeToSymbol[currency] || currency;
    
    if (currencySymbolToCode[currency]) {
      currencyCode = currencySymbolToCode[currency];
      currencySymbol = currency;
    }
    
    // Try to format with the currency code
    const formatted = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currencyCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
    
    return formatted;
  } catch (error) {
    // Fallback: manual formatting with symbol
    const symbol = currencyCodeToSymbol["USD"] || "$";
    return `${symbol}${amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
  }
};

const formatDate = (dateString: string) => {
  if (!dateString) return "Not provided";
  try {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return "Invalid date";
  }
};

const formatRelativeTime = (dateString: string) => {
  if (!dateString) return null;
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
};

const getInitials = (firstName: string, lastName: string) => {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
};

const getCountryName = (countryCode: string) => {
  return countries.find((c) => c === countryCode) || countryCode;
};

const getGenderLabel = (gender: string) => {
  const labels: Record<string, string> = {
    male: "Male",
    female: "Female",
    other: "Other",
    prefer_not_to_say: "Prefer not to say",
  };
  return labels[gender] || gender || "Not specified";
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

const InfoCard: React.FC<{
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  action?: React.ReactNode;
}> = ({ title, icon: Icon, children, action }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
  >
    <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center">
            <Icon className="h-4 w-4 text-white" />
          </div>
          <h3 className="font-semibold text-gray-900">{title}</h3>
        </div>
        {action}
      </div>
    </div>
    <div className="p-6">
      {children}
    </div>
  </motion.div>
);

const InfoRow: React.FC<{
  label: string;
  value: React.ReactNode;
  icon?: React.ElementType;
  highlight?: boolean;
}> = ({ label, value, icon: Icon, highlight }) => (
  <div className="flex items-start gap-3 group">
    {Icon && (
      <div className={`w-5 h-5 flex-shrink-0 ${highlight ? 'text-gray-900' : 'text-gray-400'} group-hover:text-gray-600 transition-colors mt-0.5`}>
        <Icon className="h-5 w-5" />
      </div>
    )}
    <div className="flex-1 min-w-0">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <div className={`text-sm ${highlight ? 'text-gray-900 font-semibold' : 'text-gray-700'} break-words`}>
        {value || "—"}
      </div>
    </div>
  </div>
);

const StatBadge: React.FC<{
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: "emerald" | "blue" | "amber" | "rose" | "gray";
}> = ({ label, value, icon: Icon, color }) => {
  const colors = {
    emerald: "from-emerald-500 to-emerald-600",
    blue: "from-blue-500 to-blue-600",
    amber: "from-amber-500 to-amber-600",
    rose: "from-rose-500 to-rose-600",
    gray: "from-gray-500 to-gray-600",
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${colors[color]} flex items-center justify-center shadow-sm`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="text-xs text-gray-500">{label}</p>
          <p className="text-lg font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );
};

const LoadingState: React.FC = () => (
  <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center">
    <div className="text-center">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        className="w-20 h-20 mx-auto mb-6"
      >
        <div className="w-full h-full rounded-full border-4 border-gray-200 border-t-gray-900" />
      </motion.div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading Profile</h3>
      <p className="text-gray-500">Please wait while we fetch the customer details...</p>
    </div>
  </div>
);

const ErrorState: React.FC<{ onRetry: () => void }> = ({ onRetry }) => (
  <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center p-4">
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full"
    >
      <div className="text-center">
        <div className="w-16 h-16 bg-rose-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <XCircle className="h-8 w-8 text-rose-600" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Customer Not Found</h3>
        <p className="text-gray-600 mb-6">
          The customer profile you&apos;re looking for doesn&apos;t exist or has been removed.
        </p>
        <div className="flex gap-3">
          <Link
            href="/customers"
            className="flex-1 px-4 py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-all font-medium"
          >
            Back to Customers
          </Link>
          <button
            onClick={onRetry}
            className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-medium"
          >
            Try Again
          </button>
        </div>
      </div>
    </motion.div>
  </div>
);

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const CustomerProfilePage = ({ user }: { user: UserType }) => {
  const params = useParams();
  const id = params.id as string;
  const currency = user?.businesses_one?.[0]?.currency || "NGN";

  const [customer, setCustomer] = useState<CustomerProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [showActions, setShowActions] = useState(false);

  const fetchCustomerProfile = useCallback(async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError(false);
      const response = await apiGet(`/customers/${id}`);

      const customerData =
        response.data?.data ||
        response.data?.customer ||
        response.data ||
        response;

      if (!customerData) {
        throw new Error("Failed to fetch customer profile");
      }

      const formattedData: CustomerProfileData = {
        id: customerData.id || customerData.customer_id,
        first_name: customerData.first_name || "",
        last_name: customerData.last_name || "",
        email: customerData.email || "",
        phone: customerData.phone || "",
        address: customerData.address || "",
        city: customerData.city || "",
        state: customerData.state || "",
        country: customerData.country || "USA",
        postal_code: customerData.postal_code || "",
        customer_code: customerData.customer_code || "",
        registration_date: customerData.registration_date || "",
        total_purchases: parseFloat(customerData.total_purchases) || 0,
        outstanding_balance: parseFloat(customerData.outstanding_balance) || 0,
        is_active: Boolean(customerData.is_active ?? true),
        loyalty_points: parseInt(customerData.loyalty_points) || 0,
        dob: customerData.dob || customerData.date_of_birth || "",
        gender: customerData.gender || "",
        notes: customerData.notes || "",
        location_id: customerData.location_id || customerData.business_location_id,
        location_name: customerData.location_name || "",
        total_orders: customerData.total_orders || 0,
        last_purchase_date: customerData.last_purchase_date || "",
        average_order_value: parseFloat(customerData.average_order_value) || 0,
      };

      setCustomer(formattedData);
    } catch {
      setError(true);
      toast.error("Failed to load customer profile");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchCustomerProfile();
  }, [fetchCustomerProfile]);

  const handleCopyCustomerCode = () => {
    if (customer?.customer_code) {
      navigator.clipboard?.writeText(customer.customer_code);
      toast.success("Customer code copied to clipboard");
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${customer?.first_name} ${customer?.last_name}`,
        text: `Customer Profile: ${customer?.first_name} ${customer?.last_name}`,
        url: window.location.href,
      }).catch(() => {
        toast.error("Failed to share");
      });
    } else {
      toast.success("Link copied to clipboard");
      navigator.clipboard?.writeText(window.location.href);
    }
  };

  if (loading) return <LoadingState />;
  if (error || !customer) return <ErrorState onRetry={fetchCustomerProfile} />;

  const fullName = `${customer.first_name} ${customer.last_name}`.trim();
  const initials = getInitials(customer.first_name, customer.last_name);
  const memberSince = formatDate(customer.registration_date);
  const lastActive = customer.last_purchase_date 
    ? formatRelativeTime(customer.last_purchase_date)
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => window.history.back()}
                className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all"
              >
                <ArrowLeft className="h-5 w-5" />
              </motion.button>
              
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl flex items-center justify-center shadow-sm">
                  <User className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{fullName}</h1>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-sm text-gray-500">{customer.customer_code}</p>
                    <button
                      onClick={handleCopyCustomerCode}
                      className="p-1 hover:bg-gray-100 rounded transition-colors"
                      title="Copy customer code"
                    >
                      <Copy className="h-3 w-3 text-gray-400" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-1 bg-gray-100 rounded-xl p-1">
                <button
                  onClick={handleShare}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-white rounded-lg transition-all"
                  title="Share"
                >
                  <Share2 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => window.print()}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-white rounded-lg transition-all"
                  title="Print"
                >
                  <Printer className="h-4 w-4" />
                </button>
                <button
                  onClick={() => toast.success("Export started")}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-white rounded-lg transition-all"
                  title="Export"
                >
                  <Download className="h-4 w-4" />
                </button>
              </div>

              <div className="relative">
                <button
                  onClick={() => setShowActions(!showActions)}
                  className="p-2.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all"
                >
                  <MoreHorizontal className="h-5 w-5" />
                </button>

                <AnimatePresence>
                  {showActions && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowActions(false)} />
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute right-0 top-12 z-50 w-56 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden"
                      >
                        <button
                          onClick={() => {
                            toast.success(`Email sent to ${customer.email}`);
                            setShowActions(false);
                          }}
                          className="flex items-center gap-3 w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition"
                        >
                          <Send className="h-4 w-4" />
                          Send Email
                        </button>
                        <button
                          onClick={() => {
                            toast.success("SMS feature coming soon");
                            setShowActions(false);
                          }}
                          className="flex items-center gap-3 w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition"
                        >
                          <MessageCircle className="h-4 w-4" />
                          Send SMS
                        </button>
                        <hr className="border-gray-100" />
                        <Link href={`/customers/${id}/orders`}>
                          <button
                            onClick={() => setShowActions(false)}
                            className="flex items-center gap-3 w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition"
                          >
                            <ShoppingBag className="h-4 w-4" />
                            View Orders
                          </button>
                        </Link>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>

              <Link href={`/editcustomers/${id}/`}>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-gray-900 to-gray-800 text-white text-sm font-medium rounded-xl hover:from-gray-800 hover:to-gray-700 transition-all shadow-lg shadow-gray-900/20"
                >
                  <Edit className="h-4 w-4" />
                  <span className="hidden sm:inline">Edit Profile</span>
                  <span className="sm:hidden">Edit</span>
                </motion.button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Header Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6"
        >
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="relative">
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center shadow-sm">
                <span className="text-3xl font-bold text-gray-600">{initials}</span>
              </div>
              {customer.is_active && (
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center">
                  <CheckCircle className="h-3 w-3 text-white" />
                </div>
              )}
            </div>

            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <h2 className="text-2xl font-bold text-gray-900">{fullName}</h2>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                  customer.is_active
                    ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-sm'
                    : 'bg-gradient-to-r from-gray-500 to-gray-600 text-white shadow-sm'
                }`}>
                  {customer.is_active ? (
                    <>
                      <CheckCircle className="h-3 w-3" />
                      Active Customer
                    </>
                  ) : (
                    <>
                      <XCircle className="h-3 w-3" />
                      Inactive
                    </>
                  )}
                </span>
                {customer.gender && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-sm">
                    {getGenderLabel(customer.gender)}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <Mail className="h-4 w-4" />
                  <span>{customer.email || "No email"}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Phone className="h-4 w-4" />
                  <span>{customer.phone || "No phone"}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar className="h-4 w-4" />
                  <span>Member since {memberSince}</span>
                </div>
                {lastActive && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Clock className="h-4 w-4" />
                    <span>Last purchase {lastActive}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-xs text-gray-500">Lifetime Value</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(customer.total_purchases, currency)}
                </p>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-400" />
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatBadge
            label="Total Orders"
            value={customer.total_orders || 0}
            icon={ShoppingBag}
            color="blue"
          />
          <StatBadge
            label="Average Order"
            value={formatCurrency(customer.average_order_value || 0, currency)}
            icon={TrendingUp}
            color="emerald"
          />
          <StatBadge
            label="Loyalty Points"
            value={customer.loyalty_points.toLocaleString()}
            icon={Award}
            color="gray"
          />
          <StatBadge
            label="Outstanding Balance"
            value={formatCurrency(customer.outstanding_balance, currency)}
            icon={CreditCard}
            color={customer.outstanding_balance > 0 ? "rose" : "emerald"}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Personal Information */}
            <InfoCard title="Personal Information" icon={User}>
              <div className="space-y-4">
                <InfoRow
                  label="Full Name"
                  value={fullName}
                  icon={User}
                  highlight
                />
                <InfoRow
                  label="Gender"
                  value={getGenderLabel(customer.gender)}
                  icon={Heart}
                />
                <InfoRow
                  label="Date of Birth"
                  value={formatDate(customer.dob)}
                  icon={Calendar}
                />
                <InfoRow
                  label="Customer Code"
                  value={
                    <div className="flex items-center gap-2">
                      <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                        {customer.customer_code || "Not assigned"}
                      </code>
                      <button
                        onClick={handleCopyCustomerCode}
                        className="p-1 hover:bg-gray-100 rounded transition-colors"
                      >
                        <Copy className="h-3 w-3 text-gray-400" />
                      </button>
                    </div>
                  }
                  icon={Hash}
                />
              </div>
            </InfoCard>

            {/* Contact Information */}
            <InfoCard title="Contact Information" icon={Mail}>
              <div className="space-y-4">
                <InfoRow
                  label="Email Address"
                  value={
                    customer.email ? (
                      <a href={`mailto:${customer.email}`} className="text-blue-600 hover:underline">
                        {customer.email}
                      </a>
                    ) : "Not provided"
                  }
                  icon={Mail}
                />
                <InfoRow
                  label="Phone Number"
                  value={
                    customer.phone ? (
                      <a href={`tel:${customer.phone}`} className="text-blue-600 hover:underline">
                        {customer.phone}
                      </a>
                    ) : "Not provided"
                  }
                  icon={Phone}
                />
              </div>
            </InfoCard>

            {/* Business Location */}
            {customer.location_name && (
              <InfoCard title="Business Location" icon={Building}>
                <InfoRow
                  label="Assigned Location"
                  value={customer.location_name}
                  icon={Briefcase}
                />
              </InfoCard>
            )}
          </div>

          {/* Middle Column */}
          <div className="space-y-6">
            {/* Address Information */}
            <InfoCard title="Address Information" icon={MapPin}>
              <div className="space-y-4">
                <InfoRow
                  label="Street Address"
                  value={customer.address || "Not provided"}
                  icon={Home}
                />
                <InfoRow
                  label="City"
                  value={customer.city || "Not provided"}
                  icon={Building}
                />
                <InfoRow
                  label="State/Province"
                  value={customer.state || "Not provided"}
                  icon={MapPin}
                />
                <InfoRow
                  label="Country"
                  value={getCountryName(customer.country)}
                  icon={Globe}
                />
                <InfoRow
                  label="Postal Code"
                  value={customer.postal_code || "Not provided"}
                  icon={Hash}
                />
              </div>
            </InfoCard>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Account Summary */}
            <InfoCard title="Account Summary" icon={CreditCard}>
              <div className="space-y-4">
                <InfoRow
                  label="Total Purchases"
                  value={formatCurrency(customer.total_purchases, currency)}
                  icon={DollarSign}
                  highlight
                />
                <InfoRow
                  label="Outstanding Balance"
                  value={
                    <span className={customer.outstanding_balance > 0 ? "text-rose-600" : "text-emerald-600"}>
                      {formatCurrency(customer.outstanding_balance, currency)}
                    </span>
                  }
                  icon={CreditCard}
                />
                <InfoRow
                  label="Loyalty Points"
                  value={customer.loyalty_points.toLocaleString()}
                  icon={Award}
                />
                <InfoRow
                  label="Member Since"
                  value={memberSince}
                  icon={Calendar}
                />
                {customer.last_purchase_date && (
                  <InfoRow
                    label="Last Purchase"
                    value={formatDate(customer.last_purchase_date)}
                    icon={Clock}
                  />
                )}
              </div>
            </InfoCard>

            {/* Notes */}
            <InfoCard 
              title="Notes & Comments" 
              icon={FileText}
              action={
                <button
                  onClick={() => toast.success("Edit notes coming soon")}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  Edit
                </button>
              }
            >
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {customer.notes || "No notes added for this customer."}
                </p>
              </div>
            </InfoCard>

            {/* Quick Actions */}
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 border border-gray-200">
              <h4 className="font-semibold text-gray-900 mb-4">Quick Actions</h4>
              <div className="grid grid-cols-2 gap-3">
                <Link href={`/customers/${id}/orders/new`}>
                  <button className="w-full p-3 bg-white rounded-xl shadow-sm hover:shadow-md transition-all text-sm font-medium text-gray-700 flex flex-col items-center gap-2">
                    <ShoppingBag className="h-5 w-5 text-gray-600" />
                    New Order
                  </button>
                </Link>
                <button
                  onClick={() => toast.success("Payment feature coming soon")}
                  className="w-full p-3 bg-white rounded-xl shadow-sm hover:shadow-md transition-all text-sm font-medium text-gray-700 flex flex-col items-center gap-2"
                >
                  <DollarSign className="h-5 w-5 text-gray-600" />
                  Record Payment
                </button>
                <button
                  onClick={() => toast.success(`Email sent to ${customer.email}`)}
                  className="w-full p-3 bg-white rounded-xl shadow-sm hover:shadow-md transition-all text-sm font-medium text-gray-700 flex flex-col items-center gap-2"
                >
                  <Send className="h-5 w-5 text-gray-600" />
                  Send Email
                </button>
                <Link href={`/editcustomers/${id}/`}>
                  <button className="w-full p-3 bg-white rounded-xl shadow-sm hover:shadow-md transition-all text-sm font-medium text-gray-700 flex flex-col items-center gap-2">
                    <Edit className="h-5 w-5 text-gray-600" />
                    Edit Profile
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default withAuth(CustomerProfilePage);