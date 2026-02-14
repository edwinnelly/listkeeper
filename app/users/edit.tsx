"use client";
import React, { useState, useEffect, useMemo } from "react";
import {
  Plus,
  Edit,
  Trash2,
  Search,
  MoreVertical,
  X,
  AlertTriangle,
  ArrowLeft,
  Phone,
  Mail,
  User,
  Loader2,
  Shield,
  UserCheck,
  UserX,
  Building,
  ShieldBan,
  Camera,
  Filter,
  Download,
  ChevronDown,
  Settings,
  RefreshCw,
  MoreHorizontal,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";
import Cookies from "js-cookie";
import { toast } from "react-hot-toast";

// Types (updated with consistent role values)
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

interface UserFormData {
  name: string;
  email: string;
  phone: string;
  address: string;
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
  password: string;
  password_confirmation: string;
  location_id?: string;
  state: string;
  city: string;
  country: string;
  about: string;
}

interface Location {
  id: number;
  location_name: string;
}

const ManageUsers = () => {
  // State for search functionality
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // State to track which row's action menu is open
  const [openRow, setOpenRow] = useState<number | null>(null);

  // Modal states for different operations
  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  // State to track which user is being edited/deleted
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Loading and error states
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Users data state
  const [users, setUsers] = useState<User[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);

  // Form state for adding/editing users (updated with new fields)
  const [form, setForm] = useState<UserFormData>({
    name: "",
    email: "",
    phone: "",
    address: "",
    role: "staff",
    password: "",
    password_confirmation: "",
    location_id: "",
    state: "",
    city: "",
    country: "",
    about: "",
  });

  // Photo upload states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

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

  // Clean up preview URLs
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

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

      console.log(res.data.users);

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

  // API call to fetch locations for assignment
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

  // Filter users based on search query and filters
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      if (!user) return false;

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

      // Status filter - FIXED: Consistent comparison
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && user.is_active) ||
        (statusFilter === "inactive" && !user.is_active);

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, debouncedSearch, roleFilter, statusFilter]);

  // File handling function
  const handleFileChange = (file: File | null) => {
    // Clean up previous preview URL
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setSelectedFile(file);
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
  };

  // Form validation (updated for new fields)
  const validateForm = (
    formData: UserFormData,
    isEdit: boolean = false
  ): string[] => {
    const errors: string[] = [];
    if (!formData.name.trim()) errors.push("Name is required");
    if (!formData.email.trim()) {
      errors.push("Email is required");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.push("Email format is invalid");
    }
    if (!isEdit && !formData.password) errors.push("Password is required");
    if (!isEdit && formData.password !== formData.password_confirmation) {
      errors.push("Passwords do not match");
    }
    if (formData.password && formData.password.length < 8) {
      errors.push("Password must be at least 8 characters");
    }

    // Location validation - FIXED: Only require if needed
    if (formData.location_id && isNaN(Number(formData.location_id))) {
      errors.push("Location must be valid");
    }

    return errors;
  };

  // Handle form submission for adding new user
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const errors = validateForm(form);
    if (errors.length > 0) {
      errors.forEach((error) => toast.error(error));
      return;
    }

    setIsSubmitting(true);
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("name", form.name);
      formData.append("email", form.email);
      formData.append("phone", form.phone);
      formData.append("role", form.role);
      formData.append("address", form.address);
      formData.append("password", form.password);
      formData.append("password_confirmation", form.password_confirmation);

      if (form.location_id) {
        formData.append("location_id", form.location_id);
      }

      formData.append("state", form.state);
      formData.append("city", form.city);
      formData.append("country", form.country);
      formData.append("about", form.about);

      if (selectedFile) {
        formData.append("photo", selectedFile);
      }

      await api.get("/sanctum/csrf-cookie");
      const res = await api.post("/usersadd", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          "X-XSRF-TOKEN": Cookies.get("XSRF-TOKEN") || "",
        },
      });

      toast.success(res.data.message || "User created successfully");
      await fetchUsers();
      setModalOpen(false);

      // Reset form and file
      setForm({
        name: "",
        email: "",
        phone: "",
        role: "staff",
        password: "",
        address: "",
        password_confirmation: "",
        location_id: "",
        state: "",
        city: "",
        country: "",
        about: "",
      });
      setSelectedFile(null);
      setPreviewUrl(null);
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || "Failed to create user";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
      setIsUploading(false);
    }
  };

  // Handle user edit (updated with new fields)
  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || !selectedUser) return;

    const errors = validateForm(form, true);
    if (errors.length > 0) {
      errors.forEach((error) => toast.error(error));
      return;
    }

    setIsSubmitting(true);
    setIsUploading(true);

    try {
      const updateData = new FormData();
      updateData.append("name", form.name);
      updateData.append("email", form.email);
      updateData.append("phone", form.phone);
      updateData.append("role", form.role);
      updateData.append("address", form.address);

      if (form.location_id) {
        updateData.append("location_id", form.location_id);
      }

      updateData.append("state", form.state);
      updateData.append("city", form.city);
      updateData.append("country", form.country);
      updateData.append("about", form.about);
      updateData.append("_method", "PUT");

      if (form.password) {
        updateData.append("password", form.password);
        updateData.append("password_confirmation", form.password_confirmation);
      }

      if (selectedFile) {
        updateData.append("photo", selectedFile);
      }

      await api.get("/sanctum/csrf-cookie");
      const headers = {
        "Content-Type": "multipart/form-data",
        "X-XSRF-TOKEN": Cookies.get("XSRF-TOKEN") || "",
      };

      const response = await api.post(
        `/usersupdate/${selectedUser.id}`,
        updateData,
        {
          headers,
        }
      );

      toast.success(response.data.message || "User updated successfully");
      await fetchUsers();
      setEditModalOpen(false);

      // Reset file state
      setSelectedFile(null);
      setPreviewUrl(null);
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || "Failed to update user";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
      setIsUploading(false);
    }
  };

  // Handle user deletion
  const handleDelete = async () => {
    if (isSubmitting || !selectedUser) return;
    setIsSubmitting(true);

    try {
      await api.get("/sanctum/csrf-cookie");
      await api.delete(`/usersdel/${selectedUser.id}`, {
        headers: {
          "X-XSRF-TOKEN": Cookies.get("XSRF-TOKEN") || "",
          "Content-Type": "application/json",
        },
      });

      toast.success("User deleted successfully!");
      await fetchUsers();
      setDeleteModalOpen(false);
      setSelectedUser(null);
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || "Failed to delete user";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle input changes
  const handleInputChange = (field: keyof UserFormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  // Reset form when modal closes (updated with new fields)
  const handleModalClose = () => {
    if (!isSubmitting) {
      setModalOpen(false);
      setForm({
        name: "",
        email: "",
        phone: "",
        role: "staff",
        password: "",
        address: "",
        password_confirmation: "",
        location_id: "",
        state: "",
        city: "",
        country: "",
        about: "",
      });
      setSelectedFile(null);
      setPreviewUrl(null);
    }
  };

  // Handle edit modal close
  const handleEditModalClose = () => {
    if (!isSubmitting) {
      setEditModalOpen(false);
      setSelectedUser(null);
      setSelectedFile(null);
      setPreviewUrl(null);
    }
  };

  // Handle delete modal close
  const handleDeleteModalClose = () => {
    if (!isSubmitting) {
      setDeleteModalOpen(false);
      setSelectedUser(null);
    }
  };

  // Get role badge color - Combined style
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

  // Get status badge color - Combined style
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

  // CSS classes for combined design
  const inputClass =
    "w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200 placeholder-gray-500 text-sm hover:border-gray-400";
  const labelClass = "block text-sm font-semibold text-gray-700 mb-2";

  // Role options - FIXED: Match TypeScript interface
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

  return (
    <div className="min-h-screen bg-gray-50/30">
      {/* Combined Header - Modern aesthetic with Microsoft functionality */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-8xl mx-auto px-6 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center space-x-4">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors group"
                >
                  <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                  Back to Dashboard
                </Link>
                <div className="h-6 w-px bg-gray-300"></div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Manage Users
                </h1>
              </div>
              <p className="text-gray-600 text-sm">
                Manage user accounts and permissions across your organization
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={fetchUsers}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                title="Refresh"
              >
                <RefreshCw size={18} />
              </button>
              <button className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-colors font-medium">
                <Download size={16} />
                Export
              </button>
              <button
                onClick={() => setModalOpen(true)}
                className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-5 py-2.5 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-medium shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isSubmitting}
              >
                <Plus size={18} />
                Add User
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards - From Modern Design */}
      <div className="max-w-8xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {users.length}
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
                  {users.filter((u) => u.is_active).length}
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
                  {users.filter((u) => u.role === "admin").length}
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
                  {users.filter((u) => !u.is_active).length}
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
          {/* Search and Filters - Modern design with Microsoft functionality */}
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

          {/* Loading State - Modern design */}
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

          {/* Users Table - Combined functionality with modern aesthetics */}
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
                                <div className="font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
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
                                {user.address || "Not assigned"}
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

                          <td className="px-6 py-4 text-center relative whitespace-nowrap">
                            <button
                              onClick={() =>
                                setOpenRow(openRow === user.id ? null : user.id)
                              }
                              className="p-2 rounded-lg hover:bg-gray-100 transition text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed group/action"
                              disabled={isSubmitting}
                            >
                              <MoreVertical
                                size={18}
                                className="group-hover/action:scale-110 transition-transform"
                              />
                            </button>

                            {openRow === user.id && (
                              <>
                                <div
                                  className="fixed inset-0 z-10"
                                  onClick={() => setOpenRow(null)}
                                />
                                <div className="absolute right-6 z-40 w-56 bg-white border border-gray-200 rounded-xl shadow-lg shadow-gray-200/50 animate-fadeIn backdrop-blur-sm">
                                  <Link href={`/permssions/${user.user_id}`}>
                                    <button className="flex items-center gap-3 w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition first:rounded-t-xl last:rounded-b-xl disabled:opacity-50 disabled:cursor-not-allowed border-b border-gray-100">
                                      <ShieldBan
                                        size={16}
                                        className="text-blue-600"
                                      />
                                      Change Roles
                                    </button>
                                  </Link>
                                  <Link href={`/usersprofile/${user.user_id}`}>
                                    <button
                                      className="flex items-center gap-3 w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition first:rounded-t-xl last:rounded-b-xl disabled:opacity-50 disabled:cursor-not-allowed border-b border-gray-100"
                                      disabled={isSubmitting}
                                    >
                                      <UserCheck
                                        size={16}
                                        className="text-blue-600"
                                      />
                                      View Profile
                                    </button>
                                  </Link>

                                  <button
                                    onClick={() => {
                                      setSelectedUser(user);
                                      setForm({
                                        name: user.name || "",
                                        email: user.email || "",
                                        phone: user.phone_number || "",
                                        role: user.role || "staff",
                                        password: "",
                                        password_confirmation: "",
                                        location_id:
                                          user.location?.id?.toString() || "",
                                        state: user.state || "",
                                        city: user.city || "",
                                        country: user.country || "",
                                        about: user.about || "",
                                        address: user.address || "",
                                      });
                                      setEditModalOpen(true);
                                      setOpenRow(null);
                                    }}
                                    className="flex items-center gap-3 w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition first:rounded-t-xl last:rounded-b-xl disabled:opacity-50 disabled:cursor-not-allowed border-b border-gray-100"
                                    disabled={isSubmitting}
                                  >
                                    <Edit size={16} className="text-blue-600" />
                                    Edit User
                                  </button>

                                  <button
                                    onClick={() => {
                                      setSelectedUser(user);
                                      setDeleteModalOpen(true);
                                      setOpenRow(null);
                                    }}
                                    className="flex items-center gap-3 w-full px-4 py-3 text-sm text-gray-700 hover:bg-red-50 transition first:rounded-t-xl last:rounded-b-xl disabled:opacity-50 disabled:cursor-not-allowed"
                                    disabled={isSubmitting}
                                  >
                                    <Trash2
                                      size={16}
                                      className="text-red-600"
                                    />
                                    Delete User
                                  </button>
                                </div>
                              </>
                            )}
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
                                {debouncedSearch
                                  ? "No users found"
                                  : "No users available"}
                              </p>
                              <p className="text-gray-500 text-sm">
                                {debouncedSearch
                                  ? "Try adjusting your search terms or filters"
                                  : "Get started by adding your first user to the system"}
                              </p>
                            </div>
                            {!debouncedSearch && (
                              <button
                                onClick={() => setModalOpen(true)}
                                className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-5 py-2.5 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all font-medium mt-2"
                              >
                                <Plus size={16} />
                                Add User
                              </button>
                            )}
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

        {/* Modals - Modern design with clean aesthetics */}
        {modalOpen && (
          <CombinedModal
            title={
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Plus className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Add New User
                  </h2>
                  <p className="text-gray-500 text-sm">
                    Create a new user account in the system
                  </p>
                </div>
              </div>
            }
            onClose={handleModalClose}
          >
            <form onSubmit={handleSave} className="space-y-6">
              <UserForm
                form={form}
                handleInputChange={handleInputChange}
                handleFileChange={handleFileChange}
                inputClass={inputClass}
                labelClass={labelClass}
                roles={roles}
                locations={locations}
                isEdit={false}
                previewUrl={previewUrl}
                isUploading={isUploading}
              />
              <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleModalClose}
                  className="px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/25"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus size={16} />
                      Add User
                    </>
                  )}
                </button>
              </div>
            </form>
          </CombinedModal>
        )}

        {/* Edit User Modal */}
        {editModalOpen && selectedUser && (
          <CombinedModal
            title={
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Edit className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Edit User</h2>
                  <p className="text-gray-500 text-sm">
                    Update user information and permissions
                  </p>
                </div>
              </div>
            }
            onClose={handleEditModalClose}
          >
            <form onSubmit={handleEdit} className="space-y-6">
              <UserForm
                form={form}
                handleInputChange={handleInputChange}
                handleFileChange={handleFileChange}
                inputClass={inputClass}
                labelClass={labelClass}
                roles={roles}
                locations={locations}
                isEdit={true}
                previewUrl={previewUrl}
                isUploading={isUploading}
              />
              <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleEditModalClose}
                  className="px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/25"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Edit size={16} />
                      Update User
                    </>
                  )}
                </button>
              </div>
            </form>
          </CombinedModal>
        )}

        {/* Delete Confirmation Modal */}
        {deleteModalOpen && selectedUser && (
          <CombinedModal title={null} onClose={handleDeleteModalClose}>
            <div className="max-w-md mx-auto rounded-2xl p-6 bg-white animate-fadeIn flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 flex items-center justify-center rounded-2xl bg-red-50 border border-red-200">
                <AlertTriangle className="w-7 h-7 text-red-600" />
              </div>

              <h2 className="text-xl font-bold text-gray-900">Delete User</h2>
              <p className="text-gray-600 text-sm leading-relaxed">
                Are you sure you want to delete{" "}
                <span className="font-semibold text-gray-900">
                  {selectedUser.name}
                </span>
                ? This action cannot be undone and all user data will be
                permanently removed.
              </p>

              <div className="mt-6 flex justify-center gap-3 w-full">
                <button
                  type="button"
                  onClick={handleDeleteModalClose}
                  className="flex-1 px-6 py-3 rounded-lg border border-gray-300 bg-white text-gray-700 font-medium hover:bg-gray-50 transition disabled:opacity-50"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="flex-1 px-6 py-3 rounded-lg bg-gradient-to-r from-red-600 to-red-700 text-white font-medium flex items-center justify-center gap-2 hover:from-red-700 hover:to-red-800 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-red-500/25"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 size={16} />
                      Delete
                    </>
                  )}
                </button>
              </div>
            </div>
          </CombinedModal>
        )}
      </div>
    </div>
  );
};

export default ManageUsers;

// Combined Modal Component
const CombinedModal = ({
  title,
  children,
  onClose,
}: {
  title: React.ReactNode;
  children: React.ReactNode;
  onClose: () => void;
}) => (
  <div
    className="fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-50 p-4 animate-fadeIn"
    onClick={onClose}
  >
    <div
      className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-scaleIn"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        {title}
        <button
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 transition hover:bg-gray-100 rounded-lg"
          aria-label="Close modal"
        >
          <X size={20} />
        </button>
      </div>
      <div className="p-6">{children}</div>
    </div>
  </div>
);

// UserForm Component with combined styling (updated with new fields)
const UserForm = ({
  form,
  handleInputChange,
  handleFileChange,
  inputClass,
  labelClass,
  roles,
  locations,
  isEdit = false,
  previewUrl,
  isUploading = false,
}: {
  form: any;
  handleInputChange: (field: keyof UserFormData, value: string) => void;
  handleFileChange: (file: File | null) => void;
  inputClass: string;
  labelClass: string;
  roles: { value: string; label: string }[];
  locations: Location[];
  isEdit?: boolean;
  previewUrl?: string | null;
  isUploading?: boolean;
}) => (
  <div className="space-y-6">
    {/* Photo Upload Section */}
    <div className="flex flex-col items-center space-y-4">
      <label className={labelClass}>Profile Photo</label>

      {/* Photo Preview and Upload Area */}
      <div className="relative group">
        <div className="w-24 h-24 rounded-2xl border-2 border-dashed border-gray-300 overflow-hidden bg-gray-50 flex items-center justify-center group-hover:border-gray-400 transition-colors">
          {previewUrl ? (
            <img
              src={previewUrl}
              alt="Profile preview"
              className="w-full h-full object-cover"
            />
          ) : (
            <User className="h-8 w-8 text-gray-400" />
          )}
        </div>

        {/* Upload Overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity">
          <Camera className="h-6 w-6 text-white" />
        </div>

        {/* File Input */}
        <input
          type="file"
          accept="image/*"
          onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={isUploading}
        />
      </div>

      {/* Upload Status */}
      {isUploading && (
        <div className="flex items-center gap-2 text-sm text-blue-600">
          <Loader2 className="h-4 w-4 animate-spin" />
          Uploading photo...
        </div>
      )}

      {/* File Info */}
      <div className="text-center">
        <p className="text-sm text-gray-500">Click to upload a profile photo</p>
        <p className="text-xs text-gray-400 mt-1">JPG, PNG, WEBP (Max 5MB)</p>
      </div>

      {/* Remove Photo Button (when there's a preview) */}
      {previewUrl && (
        <button
          type="button"
          onClick={() => handleFileChange(null)}
          className="text-sm text-red-600 hover:text-red-700 flex items-center gap-1 transition-colors font-medium"
          disabled={isUploading}
        >
          <X className="h-4 w-4" />
          Remove Photo
        </button>
      )}
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Name Field */}
      <div className="md:col-span-2">
        <label className={labelClass}>
          Full Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => handleInputChange("name", e.target.value)}
          required
          className={inputClass}
          placeholder="Enter full name"
        />
      </div>

      {/* Email Field */}
      <div className="md:col-span-2">
        <label className={labelClass}>
          Email Address <span className="text-red-500">*</span>
        </label>
        <input
          type="email"
          value={form.email}
          onChange={(e) => handleInputChange("email", e.target.value)}
          required
          className={inputClass}
          placeholder="Enter email address"
        />
      </div>

      {/* Phone Field */}
      <div>
        <label className={labelClass}>Phone Number</label>
        <input
          type="tel"
          value={form.phone}
          onChange={(e) => handleInputChange("phone", e.target.value)}
          className={inputClass}
          placeholder="+234 800 000 0000"
        />
      </div>

      {/* Role Field */}
      <div>
        <label className={labelClass}>Role</label>
        <select
          value={form.role}
          onChange={(e) => handleInputChange("role", e.target.value)}
          className={inputClass}
        >
          {roles.map((role) => (
            <option key={role.value} value={role.value}>
              {role.label}
            </option>
          ))}
        </select>
      </div>

      {/* Location Field */}
      <div>
        <label className={labelClass}>Assigned Location</label>
        <select
          value={form.location_id || ""}
          onChange={(e) => handleInputChange("location_id", e.target.value)}
          className={inputClass}
        >
          <option value="">No location assigned</option>
          {locations.map((location) => (
            <option key={location.id} value={location.id}>
              {location.location_name}
            </option>
          ))}
        </select>
      </div>

      {/* Address Field */}
      <div>
        <label className={labelClass}>Address</label>
        <input
          type="text"
          value={form.address}
          onChange={(e) => handleInputChange("address", e.target.value)}
          className={inputClass}
          placeholder="Enter your address"
        />
      </div>

      {/* State Field */}
      <div>
        <label className={labelClass}>State</label>
        <input
          type="text"
          value={form.state}
          onChange={(e) => handleInputChange("state", e.target.value)}
          className={inputClass}
          placeholder="Enter state"
        />
      </div>

      {/* City Field */}
      <div>
        <label className={labelClass}>City</label>
        <input
          type="text"
          value={form.city}
          onChange={(e) => handleInputChange("city", e.target.value)}
          className={inputClass}
          placeholder="Enter city"
        />
      </div>

      {/* Country Field */}
      <div>
        <label className={labelClass}>Country</label>
        <input
          type="text"
          value={form.country}
          onChange={(e) => handleInputChange("country", e.target.value)}
          className={inputClass}
          placeholder="Enter country"
        />
      </div>

      {/* About Field - Full width */}
      <div className="md:col-span-2">
        <label className={labelClass}>About</label>
        <textarea
          value={form.about}
          onChange={(e) => handleInputChange("about", e.target.value)}
          className={`${inputClass} resize-none`}
          placeholder="Tell us about this user..."
          rows={3}
        />
      </div>

      {/* Password Field */}
      <div>
        <label className={labelClass}>
          {isEdit ? "New Password" : "Password"}
          {!isEdit && <span className="text-red-500"> *</span>}
        </label>
        <input
          type="password"
          value={form.password}
          onChange={(e) => handleInputChange("password", e.target.value)}
          className={inputClass}
          placeholder={
            isEdit ? "Leave blank to keep current" : "Enter password"
          }
          minLength={8}
        />
      </div>

      {/* Confirm Password Field */}
      <div>
        <label className={labelClass}>
          {isEdit ? "Confirm New Password" : "Confirm Password"}
          {!isEdit && <span className="text-red-500"> *</span>}
        </label>
        <input
          type="password"
          value={form.password_confirmation}
          onChange={(e) =>
            handleInputChange("password_confirmation", e.target.value)
          }
          className={inputClass}
          placeholder={
            isEdit ? "Leave blank to keep current" : "Confirm password"
          }
          minLength={8}
        />
      </div>
    </div>
  </div>
);
