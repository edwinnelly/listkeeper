"use client";
import React, { useState, useEffect, useMemo } from "react";
import {
  Search,
  User,
  UserCheck,
  UserX,
  Shield,
  Building,
  Phone,
  Mail,
  Loader2,
  Filter,
} from "lucide-react";
import Link from "next/link";
// import { useRouter } from "next/navigation";
import api from "@/lib/axios";
import Cookies from "js-cookie";
import { toast } from "react-hot-toast";
import { useRouter, useParams } from "next/navigation";

// Types
interface User {
  id: number;
  name: string;
  email: string;
  address: string;
  phone_number: string;
  is_active: string;
  phone: string | null;
  role:
    | "admin"
    | "manager"
    | "staff"
    | "user"
    | "Inventory Clerk"
    | "Salesperson"
    | "Purchasing Officer"
    | "Accountant"
    | "Viewer / Auditor";
  status: "active" | "inactive" | "suspended" | "pending";
  email_verified_at: string | null;
  created_at: string;
  updated_at: string;
  profile_pic: string;
  user_id: number;
  location?: {
    id: number;
    location_name: string;
  };
  photo?: string;
  state?: string;
  city?: string;
  country?: string;
  about?: string;
}

interface Location {
  id: number;
  location_name: string;
}

interface ViewUsersProps {
  locationId?: string; // Add locationId prop for filtering
}

const ViewUsers = ({ locationId }: ViewUsersProps) => {

  const params = useParams();
  // const router = useRouter();
  const id = params.business_id as string;
  

  // State for search functionality
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Loading and error states
  const [isLoading, setIsLoading] = useState(true);

  // Users data state
  const [users, setUsers] = useState<User[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);

  const router = useRouter();

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  // Fetch users and locations on component mount
  useEffect(() => {
    fetchUsers();
    fetchLocations();
  }, []);

  // API call to fetch all users
  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      await api.get("/sanctum/csrf-cookie");
      const res = await api.get("/users", {
        headers: {
          "X-XSRF-TOKEN": Cookies.get("XSRF-TOKEN") || "",
          "Content-Type": "application/json",
        },
      });

      const data = res.data?.data ?? res.data ?? {};
      const usersArray: User[] = Array.isArray(data.users)
        ? data.users
        : Array.isArray(res.data)
        ? res.data
        : [];

      setUsers(usersArray);
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || "Manage Users unavailable";
      toast.error(errorMessage);
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  };

  // API call to fetch locations
  const fetchLocations = async () => {
    try {
      await api.get("/sanctum/csrf-cookie");
      const res = await api.get("/locations", {
        headers: {
          "X-XSRF-TOKEN": Cookies.get("XSRF-TOKEN") || "",
          "Content-Type": "application/json",
        },
      });

      const data = res.data?.data ?? res.data ?? {};
      const locationsArray: Location[] = Array.isArray(data.locations)
        ? data.locations
        : Array.isArray(data)
        ? data
        : [];

      setLocations(locationsArray);
    } catch (err: any) {
      console.error("Failed to fetch locations:", err);
      toast.error("Failed to fetch locations");
      setLocations([]);
    }
  };

  // Filter users based on search query, filters, and location ID
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      if (!user) return false;

      // Location filter - only show users from specified location
      if (locationId && user.location?.id !== parseInt(locationId)) {
        return false;
      }

      // Search filter
      const searchableText = [
        user.name || "",
        user.email || "",
        user.phone || "",
        user.role || "",
        user.state || "",
        user.city || "",
        user.country || "",
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch = searchableText.includes(
        debouncedSearch.toLowerCase()
      );

      // Role filter
      const matchesRole = roleFilter === "all" || user.role === roleFilter;

      // Status filter
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && user.is_active) ||
        (statusFilter === "inactive" && !user.is_active);

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, debouncedSearch, roleFilter, statusFilter, locationId]);

  // Get role badge color
  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-purple-50 text-purple-700 border border-purple-200";
      case "manager":
        return "bg-blue-50 text-blue-700 border border-blue-200";
      case "staff":
        return "bg-emerald-50 text-emerald-700 border border-emerald-200";
      case "Inventory Clerk":
        return "bg-orange-50 text-orange-700 border border-orange-200";
      case "Salesperson":
        return "bg-cyan-50 text-cyan-700 border border-cyan-200";
      case "Purchasing Officer":
        return "bg-indigo-50 text-indigo-700 border border-indigo-200";
      case "Accountant":
        return "bg-pink-50 text-pink-700 border border-pink-200";
      case "Viewer / Auditor":
        return "bg-teal-50 text-teal-700 border border-teal-200";
      default:
        return "bg-gray-50 text-gray-700 border border-gray-200";
    }
  };

  // Get status badge color
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-50 text-green-700 border border-green-200";
      case "inactive":
        return "bg-gray-50 text-gray-700 border border-gray-200";
      case "suspended":
        return "bg-red-50 text-red-700 border border-red-200";
      case "pending":
        return "bg-amber-50 text-amber-700 border border-amber-200";
      default:
        return "bg-gray-50 text-gray-700 border border-gray-200";
    }
  };

  // Role options
  const roles = [
    { value: "admin", label: "Administrator" },
    { value: "manager", label: "Manager" },
    { value: "Inventory Clerk", label: "Inventory Clerk" },
    { value: "Salesperson", label: "Salesperson" },
    { value: "Purchasing Officer", label: "Purchasing Officer" },
    { value: "Accountant", label: "Accountant" },
    { value: "Viewer / Auditor", label: "Viewer / Auditor" },
    { value: "staff", label: "Staff" },
    { value: "user", label: "User" },
  ];

  // Get current location name
  const currentLocation = locations.find(
    (loc) => loc.id === parseInt(locationId || "0")
  );

  return (
    <div className="min-h-screen bg-gray-50/30">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-8xl mx-auto px-6 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center space-x-4">
                <h1 className="text-2xl font-bold text-gray-900">
                  {locationId ? "Location Users" : "View Users"}
                </h1>
              </div>
              <p className="text-gray-600 text-sm">
                {locationId && currentLocation
                  ? `Users assigned to ${currentLocation.location_name}`
                  : "View user accounts across your organization"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="max-w-8xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {filteredUsers.length}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                <User className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Active Users
                </p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {filteredUsers.filter((u) => u.is_active).length}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
                <UserCheck className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Admins</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {filteredUsers.filter((u) => u.role === "admin").length}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center">
                <Shield className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Inactive</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {filteredUsers.filter((u) => !u.is_active).length}
                </p>
              </div>
              <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center">
                <UserX className="h-6 w-6 text-gray-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Card */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {/* Search and Filters */}
          <div className="px-6 py-5 border-b border-gray-200 bg-gray-50/50">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 flex-1">
                <div className="relative flex-1 max-w-md">
                  <Search
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    size={18}
                  />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search users by name, email, phone..."
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition placeholder-gray-500 text-sm hover:border-gray-400"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition hover:border-gray-400"
                  >
                    <option value="all">All Roles</option>
                    {roles.map((role) => (
                      <option key={role.value} value={role.value}>
                        {role.label}
                      </option>
                    ))}
                  </select>

                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition hover:border-gray-400"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>

                  <button className="flex items-center gap-2 px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-700 hover:border-gray-400 transition-colors font-medium text-sm">
                    <Filter size={16} />
                    More Filters
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full text-sm font-medium border border-blue-200">
                  {isLoading
                    ? "Loading..."
                    : `${filteredUsers.length} user${
                        filteredUsers.length !== 1 ? "s" : ""
                      }`}
                </span>
              </div>
            </div>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="flex justify-center items-center py-16">
              <div className="text-center">
                <Loader2 className="h-8 w-8 text-blue-600 animate-spin mx-auto mb-3" />
                <p className="text-gray-600 font-medium">Loading users...</p>
                <p className="text-gray-400 text-sm mt-1">
                  Please wait a moment
                </p>
              </div>
            </div>
          )}

          {/* Users Table - View Only */}
          {!isLoading && (
            <div className="relative">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-600 text-left border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider whitespace-nowrap w-12 text-center">
                        S.No
                      </th>
                      <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider whitespace-nowrap text-gray-500">
                        User
                      </th>
                      <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider whitespace-nowrap text-gray-500 hidden md:table-cell">
                        Contact
                      </th>
                      <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider whitespace-nowrap text-gray-500 hidden lg:table-cell">
                        Location
                      </th>
                      <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider whitespace-nowrap text-gray-500">
                        Role
                      </th>
                      <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider whitespace-nowrap text-gray-500">
                        Status
                      </th>
                      <th className="px-6 py-4 text-center font-semibold text-xs uppercase tracking-wider whitespace-nowrap text-gray-500 w-12">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredUsers.length > 0 ? (
                      filteredUsers.map((user, index) => (
                        <tr
                          key={user.id}
                          className="hover:bg-gray-50/50 transition-colors group"
                        >
                          <td className="px-6 py-4 text-center">
                            <span className="text-sm font-medium text-gray-500">
                              {index + 1}
                            </span>
                          </td>
                          <td className="px-6 py-4 min-w-[250px]">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-50 rounded-xl flex items-center justify-center flex-shrink-0 border border-blue-200/50">
                                {user.profile_pic ? (
                                  <img
                                    src={`http://localhost:8000/storage/${user.profile_pic}`}
                                    alt={user.name}
                                    className="w-full h-full object-cover rounded-xl"
                                  />
                                ) : (
                                  <User className="h-5 w-5 text-blue-600" />
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="font-semibold text-gray-900 truncate">
                                  {user.name}
                                </div>
                                <div className="text-xs text-gray-500 truncate mt-0.5">
                                  {user.email}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 min-w-[150px] whitespace-nowrap hidden md:table-cell">
                            {user.phone_number && (
                              <div className="flex items-center gap-2 text-gray-600">
                                <Phone className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                                <span className="text-sm font-medium">
                                  {user.phone_number}
                                </span>
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap hidden lg:table-cell">
                            <div className="flex items-center gap-2 text-gray-600">
                              <Building className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                              <span className="text-sm font-medium">
                                {user.location?.location_name || "Not assigned"}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 min-w-[120px] whitespace-nowrap">
                            <span
                              className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold ${getRoleBadgeColor(
                                user.role
                              )}`}
                            >
                              {user.role}
                            </span>
                          </td>

                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold ${getStatusBadgeColor(
                                user.is_active ? "active" : "inactive"
                              )}`}
                            >
                              {user.is_active ? "Active" : "Inactive"}
                            </span>
                          </td>

                          <td className="px-6 py-4 text-center whitespace-nowrap">
                            <Link href={`/usersprofile/${user.user_id}`}>
                              <button className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors">
                                View Profile
                              </button>
                            </Link>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="text-center py-16">
                          <div className="flex flex-col items-center gap-4 max-w-sm mx-auto">
                            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center">
                              <Search size={24} className="text-gray-400" />
                            </div>
                            <div className="space-y-2">
                              <p className="text-gray-900 font-semibold text-lg">
                                {debouncedSearch || locationId
                                  ? "No users found"
                                  : "No users available"}
                              </p>
                              <p className="text-gray-500 text-sm">
                                {debouncedSearch
                                  ? "Try adjusting your search terms or filters"
                                  : locationId
                                  ? "No users are assigned to this location"
                                  : "There are no users in the system"}
                              </p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ViewUsers;