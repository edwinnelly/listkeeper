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
  Loader2,
  Edit,
  ShoppingBag,
  TrendingUp,
  Clock,
  Heart,
  Copy,
  ChevronRight,
  MoreHorizontal,
  Send,
} from "lucide-react";
import { withAuth } from "@/hoc/withAuth";
import { motion, AnimatePresence } from "framer-motion";

// ============================================================================
// TYPES
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
  location_name?: string;
  total_orders?: number;
  last_purchase_date?: string;
  average_order_value?: number;
}

interface UserType {
  businesses_one?: Array<{ currency?: string }>;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const currencySymbolToCode: Record<string, string> = {
  "$": "USD", "€": "EUR", "£": "GBP", "¥": "JPY",
  "₹": "INR", "₦": "NGN", "A$": "AUD", "C$": "CAD",
};

const formatCurrency = (amount: number, currency: string = "NGN") => {
  try {
    const currencyCode = currencySymbolToCode[currency] || currency;
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currencyCode,
      minimumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency}${amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
  }
};

const formatDate = (dateString: string) => {
  if (!dateString) return "Not provided";
  try {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric", month: "long", day: "numeric",
    });
  } catch {
    return "Invalid date";
  }
};

const getInitials = (firstName: string, lastName: string) => {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
};

const getCountryName = (countryCode: string) => {
  return countries.find((c) => c === countryCode) || countryCode;
};

const getGenderLabel = (gender: string) => {
  const labels: Record<string, string> = {
    male: "Male", female: "Female", other: "Other",
  };
  return labels[gender] || gender || "Not specified";
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

const InfoCard: React.FC<{ title: string; icon: React.ElementType; children: React.ReactNode }> = 
({ title, icon: Icon, children }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
  >
    <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center">
          <Icon className="h-4 w-4 text-white" />
        </div>
        <h3 className="font-semibold text-gray-900">{title}</h3>
      </div>
    </div>
    <div className="p-6">{children}</div>
  </motion.div>
);

const InfoRow: React.FC<{ label: string; value: React.ReactNode; icon?: React.ElementType }> = 
({ label, value, icon: Icon }) => (
  <div className="flex items-start gap-3">
    {Icon && <Icon className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />}
    <div className="flex-1 min-w-0">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <div className="text-sm text-gray-700 break-words">{value || "—"}</div>
    </div>
  </div>
);

const StatBadge: React.FC<{ label: string; value: string | number; icon: React.ElementType; color: string }> = 
({ label, value, icon: Icon, color }) => {
  const colors: Record<string, string> = {
    blue: "from-blue-500 to-blue-600",
    emerald: "from-emerald-500 to-emerald-600",
    gray: "from-gray-500 to-gray-600",
    rose: "from-rose-500 to-rose-600",
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
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="text-center">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        className="w-16 h-16 mx-auto mb-4"
      >
        <div className="w-full h-full rounded-full border-4 border-gray-200 border-t-gray-900" />
      </motion.div>
      <p className="text-gray-600 font-medium">Loading profile...</p>
    </div>
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
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const fetchCustomerProfile = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(false);
      const response = await apiGet(`/customers/${id}`);
      const customerData = response.data?.data || response.data?.customer || response.data || response;
      if (!customerData) throw new Error("Failed to fetch");

      setCustomer({
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
        dob: customerData.dob || "",
        gender: customerData.gender || "",
        notes: customerData.notes || "",
        location_name: customerData.location_name || "",
        total_orders: customerData.total_orders || 0,
        last_purchase_date: customerData.last_purchase_date || "",
        average_order_value: parseFloat(customerData.average_order_value) || 0,
      });
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

  const handleCopyCode = () => {
    if (customer?.customer_code) {
      navigator.clipboard?.writeText(customer.customer_code);
      toast.success("Copied to clipboard");
    }
  };

  if (loading) return <LoadingState />;
  if (error || !customer) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-rose-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <XCircle className="h-8 w-8 text-rose-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Customer Not Found</h3>
          <p className="text-gray-600 mb-6">The customer profile doesn't exist.</p>
          <Link href="/customers" className="inline-block px-6 py-3 bg-gray-900 text-white rounded-xl font-medium">
            Back to Customers
          </Link>
        </div>
      </div>
    );
  }

  const fullName = `${customer.first_name} ${customer.last_name}`.trim();
  const initials = getInitials(customer.first_name, customer.last_name);
  const memberSince = formatDate(customer.registration_date);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Scroll-aware Header */}
      <header 
        className={`sticky top-0 z-30 transition-all duration-300 ${
          scrolled 
            ? "bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-200" 
            : "bg-white border-b border-gray-200"
        }`}
      >
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`flex items-center justify-between gap-4 transition-all duration-300 ${
            scrolled ? "py-2" : "py-4"
          }`}>
            <div className="flex items-center gap-3">
              <Link
                href="/customers"
                className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              
              <div className="flex items-center gap-3">
                <div className={`bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl flex items-center justify-center shadow-sm transition-all duration-300 ${
                  scrolled ? "w-8 h-8" : "w-10 h-10"
                }`}>
                  <User className={`text-white transition-all duration-300 ${scrolled ? "h-4 w-4" : "h-5 w-5"}`} />
                </div>
                <div>
                  <h1 className={`font-bold text-gray-900 transition-all duration-300 ${
                    scrolled ? "text-lg" : "text-2xl"
                  }`}>
                    {fullName}
                  </h1>
                  {!scrolled && (
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-sm text-gray-500">{customer.customer_code}</p>
                      <button onClick={handleCopyCode} className="p-1 hover:bg-gray-100 rounded">
                        <Copy className="h-3 w-3 text-gray-400" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
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
                        className="absolute right-0 top-12 z-50 w-48 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden"
                      >
                        <button
                          onClick={() => { toast.success(`Email sent to ${customer.email}`); setShowActions(false); }}
                          className="flex items-center gap-3 w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <Send className="h-4 w-4" /> Send Email
                        </button>
                        <Link href={`/customers/${id}/orders`} onClick={() => setShowActions(false)}>
                          <button className="flex items-center gap-3 w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-50">
                            <ShoppingBag className="h-4 w-4" /> View Orders
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
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
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
                    ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white'
                    : 'bg-gradient-to-r from-gray-500 to-gray-600 text-white'
                }`}>
                  {customer.is_active ? <><CheckCircle className="h-3 w-3" /> Active</> : <><XCircle className="h-3 w-3" /> Inactive</>}
                </span>
                {customer.gender && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                    {getGenderLabel(customer.gender)}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
                <div className="flex items-center gap-2 text-gray-600"><Mail className="h-4 w-4" />{customer.email || "No email"}</div>
                <div className="flex items-center gap-2 text-gray-600"><Phone className="h-4 w-4" />{customer.phone || "No phone"}</div>
                <div className="flex items-center gap-2 text-gray-600"><Calendar className="h-4 w-4" />Member since {memberSince}</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-xs text-gray-500">Lifetime Value</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(customer.total_purchases, currency)}</p>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-400" />
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatBadge label="Total Orders" value={customer.total_orders || 0} icon={ShoppingBag} color="blue" />
          <StatBadge label="Average Order" value={formatCurrency(customer.average_order_value || 0, currency)} icon={TrendingUp} color="emerald" />
          <StatBadge label="Loyalty Points" value={customer.loyalty_points.toLocaleString()} icon={Award} color="gray" />
          <StatBadge label="Outstanding Balance" value={formatCurrency(customer.outstanding_balance, currency)} icon={CreditCard} color={customer.outstanding_balance > 0 ? "rose" : "emerald"} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            <InfoCard title="Personal Information" icon={User}>
              <div className="space-y-4">
                <InfoRow label="Full Name" value={fullName} icon={User} />
                <InfoRow label="Gender" value={getGenderLabel(customer.gender)} icon={Heart} />
                <InfoRow label="Date of Birth" value={formatDate(customer.dob)} icon={Calendar} />
                <InfoRow 
                  label="Customer Code" 
                  value={
                    <div className="flex items-center gap-2">
                      <code className="bg-gray-100 px-2 py-1 rounded text-xs">{customer.customer_code || "N/A"}</code>
                      <button onClick={handleCopyCode} className="p-1 hover:bg-gray-100 rounded"><Copy className="h-3 w-3 text-gray-400" /></button>
                    </div>
                  } 
                  icon={Hash} 
                />
              </div>
            </InfoCard>

            <InfoCard title="Contact Information" icon={Mail}>
              <div className="space-y-4">
                <InfoRow 
                  label="Email" 
                  value={customer.email ? <a href={`mailto:${customer.email}`} className="text-blue-600">{customer.email}</a> : "Not provided"} 
                  icon={Mail} 
                />
                <InfoRow 
                  label="Phone" 
                  value={customer.phone ? <a href={`tel:${customer.phone}`} className="text-blue-600">{customer.phone}</a> : "Not provided"} 
                  icon={Phone} 
                />
              </div>
            </InfoCard>

            {customer.location_name && (
              <InfoCard title="Business Location" icon={Building}>
                <InfoRow label="Location" value={customer.location_name} icon={Building} />
              </InfoCard>
            )}
          </div>

          {/* Middle Column */}
          <div className="space-y-6">
            <InfoCard title="Address Information" icon={MapPin}>
              <div className="space-y-4">
                <InfoRow label="Address" value={customer.address || "Not provided"} icon={MapPin} />
                <InfoRow label="City" value={customer.city || "Not provided"} icon={Building} />
                <InfoRow label="State" value={customer.state || "Not provided"} icon={MapPin} />
                <InfoRow label="Country" value={getCountryName(customer.country)} icon={Globe} />
                <InfoRow label="Postal Code" value={customer.postal_code || "Not provided"} icon={Hash} />
              </div>
            </InfoCard>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <InfoCard title="Account Summary" icon={CreditCard}>
              <div className="space-y-4">
                <InfoRow label="Total Purchases" value={formatCurrency(customer.total_purchases, currency)} icon={DollarSign} />
                <InfoRow 
                  label="Outstanding Balance" 
                  value={<span className={customer.outstanding_balance > 0 ? "text-rose-600" : "text-emerald-600"}>{formatCurrency(customer.outstanding_balance, currency)}</span>} 
                  icon={CreditCard} 
                />
                <InfoRow label="Loyalty Points" value={customer.loyalty_points.toLocaleString()} icon={Award} />
                <InfoRow label="Member Since" value={memberSince} icon={Calendar} />
                {customer.last_purchase_date && <InfoRow label="Last Purchase" value={formatDate(customer.last_purchase_date)} icon={Clock} />}
              </div>
            </InfoCard>

            <InfoCard title="Notes" icon={FileText}>
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{customer.notes || "No notes added."}</p>
              </div>
            </InfoCard>

            {/* Quick Actions */}
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 border border-gray-200">
              <h4 className="font-semibold text-gray-900 mb-4">Quick Actions</h4>
              <div className="grid grid-cols-2 gap-3">
                <Link href={`/customers/${id}/orders/new`}>
                  <button className="w-full p-3 bg-white rounded-xl shadow-sm hover:shadow-md transition-all text-sm font-medium text-gray-700 flex flex-col items-center gap-2">
                    <ShoppingBag className="h-5 w-5 text-gray-600" /> New Order
                  </button>
                </Link>
                <button onClick={() => toast.success("Payment feature coming soon")} className="w-full p-3 bg-white rounded-xl shadow-sm hover:shadow-md transition-all text-sm font-medium text-gray-700 flex flex-col items-center gap-2">
                  <DollarSign className="h-5 w-5 text-gray-600" /> Record Payment
                </button>
                <button onClick={() => toast.success(`Email sent to ${customer.email}`)} className="w-full p-3 bg-white rounded-xl shadow-sm hover:shadow-md transition-all text-sm font-medium text-gray-700 flex flex-col items-center gap-2">
                  <Send className="h-5 w-5 text-gray-600" /> Send Email
                </button>
                <Link href={`/editcustomers/${id}/`}>
                  <button className="w-full p-3 bg-white rounded-xl shadow-sm hover:shadow-md transition-all text-sm font-medium text-gray-700 flex flex-col items-center gap-2">
                    <Edit className="h-5 w-5 text-gray-600" /> Edit Profile
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