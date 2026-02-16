"use client";
import React, { useState, useEffect } from "react";
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
} from "lucide-react";
import Link from "next/link";
import { toast } from "react-hot-toast";
import { apiGet } from "@/lib/axios";

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

const UserProfilePage = () => {
  const params = useParams();
  const userId = params.id as string;

  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      fetchUserProfile();
    }
  }, [userId]);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      
      // Use apiGet wrapper - handles CSRF and caching automatically
      const response = await apiGet(`/usersinfo/${userId}`, {}, false); // false to bypass cache for profile

      // Normalize API response
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
    } catch (error: any) {
      console.error("Failed to fetch user profile:", error);
      toast.error(error.userMessage || "Failed to load user profile");
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role?.toLowerCase()) {
      case "admin":
        return "bg-purple-50 text-purple-700 border border-purple-200";
      case "manager":
        return "bg-blue-50 text-blue-700 border border-blue-200";
      case "staff":
        return "bg-emerald-50 text-emerald-700 border border-emerald-200";
      case "inventory clerk":
        return "bg-orange-50 text-orange-700 border border-orange-200";
      case "salesperson":
        return "bg-cyan-50 text-cyan-700 border border-cyan-200";
      case "purchasing officer":
        return "bg-indigo-50 text-indigo-700 border border-indigo-200";
      case "accountant":
        return "bg-pink-50 text-pink-700 border border-pink-200";
      case "viewer / auditor":
        return "bg-teal-50 text-teal-700 border border-teal-200";
      default:
        return "bg-gray-50 text-gray-700 border border-gray-200";
    }
  };

  const getStatusBadgeColor = (isActive: boolean) => {
    return isActive
      ? "bg-green-50 text-green-700 border border-green-200"
      : "bg-gray-50 text-gray-700 border border-gray-200";
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch (error) {
      return "Invalid date";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50/30 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 text-blue-600 animate-spin mx-auto mb-3" />
          <p className="text-gray-600 font-medium">Loading user profile...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50/30 flex items-center justify-center">
        <div className="text-center">
          <User className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-900 font-semibold text-lg">User not found</p>
          <p className="text-gray-500 text-sm mt-1">The user profile you're looking for doesn't exist.</p>
          <Link
            href="/users"
            className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft size={16} />
            Back to Users
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/30">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-6">
            <div className="flex items-center space-x-4 mb-4 sm:mb-0">
              <Link
                href="/users"
                className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors group"
              >
                <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                Back to Users
              </Link>
              <div className="h-6 w-px bg-gray-300 hidden sm:block"></div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">User Profile</h2>
                <p className="text-gray-600 text-sm mt-1">
                  View user information
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Profile Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 sticky top-8">
              {/* Profile Photo */}
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="relative">
                  <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-blue-100 to-blue-50 border-2 border-blue-200/50 overflow-hidden">
                    {user.profile_pic ? (
                      <img
                        src={`http://localhost:8000/storage/${user.profile_pic}`}
                        alt={user.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <User className="h-12 w-12 text-blue-600" />
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <h2 className="text-xl font-bold text-gray-900">
                    {user.name}
                  </h2>
                  <p className="text-gray-600">
                    {user.email}
                  </p>
                </div>

                {/* Role and Status Badges */}
                <div className="flex flex-wrap gap-2 justify-center">
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getRoleBadgeColor(
                      user.role
                    )}`}
                  >
                    <Shield className="h-3 w-3 mr-1" />
                    {user.role?.charAt(0).toUpperCase() + user.role?.slice(1) || "User"}
                  </span>
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadgeColor(
                      user.is_active
                    )}`}
                  >
                    {user.is_active ? "Active" : "Inactive"}
                  </span>
                </div>

                {/* Member Since */}
                <div className="pt-4 border-t border-gray-200 w-full">
                  <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                    <Calendar className="h-4 w-4" />
                    <span>Member since {formatDate(user.created_at)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* About Section */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                About
              </h3>
              <p className="text-gray-700 leading-relaxed">
                {user.about || "No information provided."}
              </p>
            </div>

            {/* Contact Information */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Mail className="h-5 w-5 text-blue-600" />
                Contact Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                    <Phone className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-600">Phone</p>
                    <p className="font-medium text-gray-900">
                      {user.phone || user.phone_number || "Not provided"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                    <Mail className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-medium text-gray-900">{user.email}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Location Information */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-blue-600" />
                Location Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                    <Building className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-600">Address</p>
                    <p className="font-medium text-gray-900">
                      {user.address || "Not provided"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                    <Navigation className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-600">City</p>
                    <p className="font-medium text-gray-900">
                      {user.city || "Not provided"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                    <MapPin className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-600">State</p>
                    <p className="font-medium text-gray-900">
                      {user.state || "Not provided"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                    <Globe className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-600">Country</p>
                    <p className="font-medium text-gray-900">
                      {user.country || "Not provided"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Assigned Location */}
            {user.location && (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Building className="h-5 w-5 text-blue-600" />
                  Assigned Location
                </h3>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                    <Building className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Location</p>
                    <p className="font-medium text-gray-900">
                      {user.location.location_name}
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

export default UserProfilePage;