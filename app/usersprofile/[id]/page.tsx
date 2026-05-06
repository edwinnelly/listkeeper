"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  MapPin,
  Building,
  Calendar,
  Shield,
  Loader2,
  Globe,
  Navigation,
  FileText,
  CheckCircle,
  Clock,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { toast } from "react-hot-toast";
import { apiGet } from "@/lib/axios";

// Define the error type instead of using 'any'
interface ApiError {
  userMessage?: string;
  message?: string;
}

interface UserProfile {
  id: number;
  name: string;
  email: string;
  phone: string;
  phone_number: string;
  address: string;
  state: string;
  city: string;
  country: string;
  about: string;
  role: string;
  profile_pic: string;
  is_active: boolean;
  email_verified_at: string | null;
  created_at: string;
  updated_at: string;
  location?: {
    id: number;
    location_name: string;
  };
}

// -------------------------------
// Status & Role Badges
// -------------------------------
const StatusBadge: React.FC<{ isActive: boolean }> = ({ isActive }) => (
  <span
    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold tracking-wide ${
      isActive
        ? "bg-emerald-50 text-emerald-700"
        : "bg-slate-100 text-slate-500"
    }`}
  >
    <span
      className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
        isActive ? "bg-emerald-500" : "bg-slate-400"
      }`}
    />
    {isActive ? "ACTIVE" : "INACTIVE"}
  </span>
);

const RoleBadge: React.FC<{ role: string }> = ({ role }) => {
  const config: Record<string, { bg: string; text: string; dot: string }> = {
    admin: { bg: "bg-violet-50", text: "text-violet-700", dot: "bg-violet-500" },
    manager: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500" },
    staff: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
    "inventory clerk": { bg: "bg-orange-50", text: "text-orange-700", dot: "bg-orange-500" },
    salesperson: { bg: "bg-cyan-50", text: "text-cyan-700", dot: "bg-cyan-500" },
    "purchasing officer": { bg: "bg-indigo-50", text: "text-indigo-700", dot: "bg-indigo-500" },
    accountant: { bg: "bg-teal-50", text: "text-teal-700", dot: "bg-teal-500" },
    "viewer / auditor": { bg: "bg-gray-100", text: "text-gray-700", dot: "bg-gray-500" },
  };
  const cfg = config[role?.toLowerCase()] || config.staff;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold tracking-wide ${cfg.bg} ${cfg.text}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
      {role?.toUpperCase() || "USER"}
    </span>
  );
};

// -------------------------------
// Utility
// -------------------------------
const formatDate = (d: string | null) =>
  !d
    ? "—"
    : new Date(d).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

const formatDateTime = (d: string | null) =>
  !d
    ? "—"
    : new Date(d).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });

// -------------------------------
// Info Row Component
// -------------------------------
const InfoRow: React.FC<{
  icon: React.ElementType;
  label: string;
  value: string;
}> = ({ icon: Icon, label, value }) => (
  <div className="flex items-center gap-3">
    <div className="w-9 h-9 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-center flex-shrink-0">
      <Icon className="h-4 w-4 text-gray-400" />
    </div>
    <div className="min-w-0">
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">
        {label}
      </p>
      <p className="text-sm font-medium text-gray-900 truncate">
        {value || "—"}
      </p>
    </div>
  </div>
);

// -------------------------------
// Section Card Component
// -------------------------------
const SectionCard: React.FC<{
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
}> = ({ title, icon: Icon, children }) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
    <div className="flex items-center gap-3 mb-5">
      <div className="w-9 h-9 bg-gray-900 rounded-xl flex items-center justify-center">
        <Icon className="h-4.5 w-4.5 text-white" />
      </div>
      <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
        {title}
      </h3>
    </div>
    {children}
  </div>
);

// -------------------------------
// Loading State
// -------------------------------
const LoadingState: React.FC = () => (
  <div className="min-h-screen bg-[#f5f5f4] flex items-center justify-center">
    <div className="text-center">
      <div className="relative w-14 h-14 mx-auto mb-5">
        <div className="w-14 h-14 rounded-full border-[3px] border-gray-100" />
        <div className="absolute inset-0 rounded-full border-[3px] border-gray-900 border-t-transparent animate-spin" />
        <User className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
      </div>
      <p className="text-sm font-semibold text-gray-700">Loading profile</p>
      <p className="text-xs text-gray-400 mt-1">Please wait a moment</p>
    </div>
  </div>
);

// -------------------------------
// Error State
// -------------------------------
const ErrorState: React.FC = () => (
  <div className="min-h-screen bg-[#f5f5f4] flex items-center justify-center">
    <div className="text-center max-w-md mx-auto px-4">
      <div className="w-16 h-16 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-center mx-auto mb-5">
        <User className="h-8 w-8 text-gray-300" />
      </div>
      <h3 className="text-base font-bold text-gray-800 mb-1.5">User not found</h3>
      <p className="text-sm text-gray-400 mb-6 leading-relaxed">
        The user profile you&apos;re looking for doesn&apos;t exist.
      </p>
      <Link
        href="/users"
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white text-sm font-bold rounded-xl hover:bg-gray-800 transition-all shadow-lg shadow-gray-900/15"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Users
      </Link>
    </div>
  </div>
);

// -------------------------------
// Main Component
// -------------------------------
const UserProfilePage = () => {
  const params = useParams();
  const userId = params.id as string;

  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserProfile = useCallback(async () => {
    try {
      setLoading(true);

      const response = await apiGet(`/usersinfo/${userId}`, {}, false);

      const userData =
        response?.data?.data?.user ??
        response?.data?.user ??
        response?.data?.data ??
        response?.data ??
        null;

      if (!userData) {
        throw new Error("Failed to fetch user profile");
      }

      setUser(userData);
    } catch (error) {
      console.error("Failed to fetch user profile:", error);
      const apiError = error as ApiError;
      toast.error(apiError.userMessage || "Failed to load user profile");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      fetchUserProfile();
    }
  }, [userId, fetchUserProfile]);

  if (loading) return <LoadingState />;
  if (!user) return <ErrorState />;

  return (
    <div className="min-h-screen bg-[#f5f5f4]">
      {/* Header */}
      <header className="bg-white border-b border-gray-100  top-0 z-40">
        <div className="max-w-screen-2xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/users"
              className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-800 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <h1 className="text-lg font-bold text-gray-900 tracking-tight">
                User Profile
              </h1>
              <p className="text-xs text-gray-400">View user information</p>
            </div>
          </div>

          {/* Badges in header */}
          <div className="flex items-center gap-2">
            <RoleBadge role={user.role} />
            <StatusBadge isActive={user.is_active} />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-screen-2xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Profile Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sticky top-24">
              {/* Profile Photo */}
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="relative">
                  <div className="w-28 h-28 rounded-2xl bg-gray-50 border-2 border-gray-100 overflow-hidden relative">
                    {user.profile_pic ? (
                      <Image
                        src={`http://localhost:8000/storage/${user.profile_pic}`}
                        alt={user.name}
                        fill
                        className="object-cover"
                        sizes="112px"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <User className="h-12 w-12 text-gray-300" />
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-1">
                  <h2 className="text-xl font-bold text-gray-900">
                    {user.name}
                  </h2>
                  <p className="text-sm text-gray-400">{user.email}</p>
                </div>

                {/* Member Since */}
                <div className="pt-4 border-t border-gray-100 w-full">
                  <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>Member since {formatDate(user.created_at)}</span>
                  </div>
                </div>
              </div>

              {/* Quick Info */}
              <div className="mt-6 pt-6 border-t border-gray-100 space-y-3">
                <InfoRow
                  icon={Mail}
                  label="Email"
                  value={user.email}
                />
                <InfoRow
                  icon={Phone}
                  label="Phone"
                  value={user.phone || user.phone_number || "Not provided"}
                />
                <InfoRow
                  icon={Building}
                  label="Role"
                  value={user.role?.charAt(0).toUpperCase() + user.role?.slice(1) || "User"}
                />
                {user.location && (
                  <InfoRow
                    icon={MapPin}
                    label="Location"
                    value={user.location.location_name}
                  />
                )}
              </div>

              {/* Account Details */}
              <div className="mt-6 pt-6 border-t border-gray-100 space-y-3">
                <InfoRow
                  icon={Clock}
                  label="Last Updated"
                  value={formatDateTime(user.updated_at)}
                />
                <InfoRow
                  icon={Shield}
                  label="Email Verified"
                  value={user.email_verified_at ? "Verified" : "Not Verified"}
                />
              </div>
            </div>
          </div>

          {/* Right Column - Details */}
          <div className="lg:col-span-2 space-y-5">
            {/* About Section */}
            <SectionCard title="About" icon={FileText}>
              <p className="text-sm text-gray-600 leading-relaxed">
                {user.about || "No information provided."}
              </p>
            </SectionCard>

            {/* Contact Information */}
            <SectionCard title="Contact Information" icon={Mail}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoRow
                  icon={Phone}
                  label="Phone"
                  value={user.phone || user.phone_number || "Not provided"}
                />
                <InfoRow
                  icon={Mail}
                  label="Email"
                  value={user.email}
                />
              </div>
            </SectionCard>

            {/* Location Information */}
            <SectionCard title="Location Information" icon={MapPin}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoRow
                  icon={Building}
                  label="Address"
                  value={user.address || "Not provided"}
                />
                <InfoRow
                  icon={Navigation}
                  label="City"
                  value={user.city || "Not provided"}
                />
                <InfoRow
                  icon={MapPin}
                  label="State"
                  value={user.state || "Not provided"}
                />
                <InfoRow
                  icon={Globe}
                  label="Country"
                  value={user.country || "Not provided"}
                />
              </div>
            </SectionCard>

            {/* Assigned Location */}
            {user.location && (
              <SectionCard title="Assigned Location" icon={Building}>
                <InfoRow
                  icon={Building}
                  label="Location"
                  value={user.location.location_name}
                />
              </SectionCard>
            )}

            {/* Account Activity */}
            <SectionCard title="Account Activity" icon={Calendar}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoRow
                  icon={Calendar}
                  label="Member Since"
                  value={formatDate(user.created_at)}
                />
                <InfoRow
                  icon={Clock}
                  label="Last Updated"
                  value={formatDateTime(user.updated_at)}
                />
                <InfoRow
                  icon={Shield}
                  label="Email Verified"
                  value={user.email_verified_at ? "Verified" : "Not Verified"}
                />
                <InfoRow
                  icon={CheckCircle}
                  label="Status"
                  value={user.is_active ? "Active" : "Inactive"}
                />
              </div>
            </SectionCard>
          </div>
        </div>
      </main>
    </div>
  );
};

export default UserProfilePage;