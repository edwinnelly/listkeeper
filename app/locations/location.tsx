"use client";
import { apiGet,apiPost } from "@/lib/axios";
// import { apiPost } from "@/lib/axios";
import React, { useState, useEffect, useMemo } from "react";
import {
  Plus,
  Edit,
  Trash2,
  MapPin,
  Search,
  MoreVertical,
  X,
  AlertTriangle,
  ArrowLeft,
  Phone,
  Mail,
  Building,
  Loader2,
  ArchiveRestore,
  UserRoundCheck,
  DatabaseZap,
  Filter,
  Download,
  Settings,
  RefreshCw,
  MoreHorizontal,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";
import Cookies from "js-cookie";
import { toast } from "react-hot-toast";
import { withAuth } from "@/hoc/withAuth";

// Types
interface Location {
  id: number;
  location_name: string;
  address: string | null;
  city: string | null;
  state: string | null;
  staffs: string | null;
  country: string | null;
  postal_code: string | null;
  phone: string;
  head_office: "yes" | "no";
  location_status: "on" | "off";
  status: "active" | "inactive" | "pending";
  location_id: string;
  business_key: string;
  manager_id: number;
  owner_id: number;
  created_at: string;
  updated_at: string;
  user?: {
    id: number;
    name: string;
    email: string;
  };
  business: {
    country: string | null;
  };
}

interface LocationFormData {
  location_name: string;
  address: string;
  city: string;
  state: string;
  phone: string;
  country: string;
  postal_code: string;
  staffs?: string;
}

interface Staff {
  id: number;
  name: string;
  email: string;
}

const ManageLocations = () => {
  // State for search functionality
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  // State to track which row's action menu is open
  const [openRow, setOpenRow] = useState<number | null>(null);

  // Modal states for different operations
  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  // State to track which location is being edited/deleted
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(
    null
  );

  // Loading and error states
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Locations data state
  const [locations, setLocations] = useState<Location[]>([]);
  const [staffs, setStaffs] = useState<Staff[]>([]);

  // Form state for adding/editing locations
  const [form, setForm] = useState<LocationFormData>({
    location_name: "",
    address: "",
    city: "",
    state: "",
    phone: "",
    country: "Nigeria",
    postal_code: "",
    staffs: "",
  });

  const router = useRouter();

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  // Fetch locations on component mount
  useEffect(() => {
    fetchLocations();
  }, []);


const fetchLocations = async () => {
  setIsLoading(true);

  try {
    const res = await apiGet("/locations");
    // Normalize API response to always be an array
    const locationsArray =
      res?.data?.data?.locations ??
      res?.data?.data ??
      res?.data?.locations ??
      res?.data?.location ??
      [];

    const staffArray =
      res?.data?.data?.staffs ??
      res?.data?.staffs ??
      [];

    setLocations(Array.isArray(locationsArray) ? locationsArray : []);
    setStaffs(Array.isArray(staffArray) ? staffArray : []);
  } catch (err: any) {
    setLocations([]);
    setStaffs([]);
  } finally {
    setIsLoading(false);
  }
};


  // Filter locations based on search query and filters
  const filteredLocations = useMemo(() => {
    return locations.filter((loc) => {
      if (!loc) return false;

      // Search filter
      const searchableText = [
        loc.location_name || "",
        loc.address || "",
        loc.city || "",
        loc.state || "",
        loc.country || "",
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch = searchableText.includes(
        debouncedSearch.toLowerCase()
      );

      // Status filter
      const matchesStatus =
        statusFilter === "all" || loc.status === statusFilter;

      // Type filter
      const matchesType =
        typeFilter === "all" ||
        (typeFilter === "head_office" && loc.head_office === "yes") ||
        (typeFilter === "branch" && loc.head_office === "no");

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [locations, debouncedSearch, statusFilter, typeFilter]);

  // Form validation
  const validateForm = (formData: LocationFormData): string[] => {
    const errors: string[] = [];

    if (!formData.location_name.trim()) {
      errors.push("Location name is required");
    }

    if (!formData.address.trim()) {
      errors.push("Address is required");
    }

    if (!formData.staffs?.trim()) {
      errors.push("Manager is required, Choose a manager from the list");
    }

    if (formData.phone && !/^\+?[\d\s-()]+$/.test(formData.phone)) {
      errors.push("Phone number format is invalid");
    }

    return errors;
  };

  // Handle form submission for adding new location
  const handleSave = async (e: React.FormEvent) => {
  e.preventDefault();
  if (isSubmitting) return;

  const errors = validateForm(form);
  if (errors.length > 0) {
    errors.forEach((error) => toast.error(error));
    return;
  }

  setIsSubmitting(true);

  try {
    const formData = {
      location_name: form.location_name,
      address: form.address,
      city: form.city,
      state: form.state,
      phone: form.phone,
      country: form.country || "Nigeria",
      postal_code: form.postal_code,
      staffs: form.staffs || "",
    };

    await apiPost("/locationsadd", formData, {}, ["/locations"]);

    toast.success("Location created successfully!");
    setModalOpen(false);

    setForm({
      location_name: "",
      address: "",
      city: "",
      state: "",
      phone: "",
      country: "Nigeria",
      postal_code: "",
      staffs: "",
    });
  } catch (err: any) {
    const status = err.response?.status;

    if (status === 403) {
      toast.error("Your subscription does not allow more locations.");
    } else if (status === 412) {
      toast.error("Business location limit reached. Maximum allowed is 5.");
    } else {
      toast.error("Failed to create location.");
    }
  } finally {
    setIsSubmitting(false);
  }
};


  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || !selectedLocation) return;

    const errors = validateForm(form);
    if (errors.length > 0) {
      errors.forEach((error) => toast.error(error));
      return;
    }

    setIsSubmitting(true);
    try {
      const updateData = {
        location_name: form.location_name,
        address: form.address,
        city: form.city,
        state: form.state,
        phone: form.phone,
        country: form.country,
        postal_code: form.postal_code,
        staffs: form.staffs || selectedLocation.staffs || "",
        head_office: selectedLocation.head_office || "no",
        location_status: selectedLocation.location_status || "on",
        status: selectedLocation.status || "active",
        _method: "PUT",
      };

      await api.get("/sanctum/csrf-cookie");
      const headers = {
        "Content-Type": "application/json",
        "X-XSRF-TOKEN": Cookies.get("XSRF-TOKEN") || "",
      };

      let response;

      try {
        response = await api.post(
          `/locationsupdate/${selectedLocation.id}`,
          updateData,
          { headers }
        );

        toast.success(response.data.message);
        await fetchLocations();
        setEditModalOpen(false);
      } catch {
        console.log("POST failed → retrying with PUT…");
      }
    } catch (err: any) {
      console.error("Edit error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle location deletion
  const handleDelete = async () => {
    if (isSubmitting || !selectedLocation) return;
    setIsSubmitting(true);

    try {
      await api.get("/sanctum/csrf-cookie");
      await api.delete(`/locationsdel/${selectedLocation.id}`, {
        headers: {
          "X-XSRF-TOKEN": Cookies.get("XSRF-TOKEN") || "",
          "Content-Type": "application/json",
        },
      });

      toast.success("Location deleted successfully!");
      await fetchLocations();
      setDeleteModalOpen(false);
      setSelectedLocation(null);
    } catch (err: any) {
      console.error("Delete error:", err);
      toast.error("Failed to delete location.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle input changes
  const handleInputChange = (field: keyof LocationFormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  // Reset form when modal closes
  const handleModalClose = () => {
    if (!isSubmitting) {
      setModalOpen(false);
      setForm({
        location_name: "",
        address: "",
        city: "",
        state: "",
        phone: "",
        country: "Nigeria",
        postal_code: "",
        staffs: "",
      });
    }
  };

  // Handle edit modal close
  const handleEditModalClose = () => {
    if (!isSubmitting) {
      setEditModalOpen(false);
      setSelectedLocation(null);
    }
  };

  // Handle delete modal close
  const handleDeleteModalClose = () => {
    if (!isSubmitting) {
      setDeleteModalOpen(false);
      setSelectedLocation(null);
    }
  };

  // Get status badge color - Combined style
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-50 text-green-700 border border-green-200";
      case "inactive":
        return "bg-gray-50 text-gray-700 border border-gray-200";
      case "pending":
        return "bg-amber-50 text-amber-700 border border-amber-200";
      default:
        return "bg-gray-50 text-gray-700 border border-gray-200";
    }
  };

  // Get type badge color - Combined style
  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case "yes":
        return "bg-purple-50 text-purple-700 border border-purple-200";
      case "no":
        return "bg-blue-50 text-blue-700 border border-blue-200";
      default:
        return "bg-gray-50 text-gray-700 border border-gray-200";
    }
  };

  // CSS classes for combined design
  const inputClass =
    "w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200 placeholder-gray-500 text-sm hover:border-gray-400";
  const labelClass = "block text-sm font-semibold text-gray-700 mb-2";

  // Dropdown options
  const countries = [
    "Nigeria",
    "Ghana",
    "Kenya",
    "South Africa",
    "United States",
    "United Kingdom",
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
                <h1 className="text-sm font-normal text-gray-900">
                  Manage Locations
                </h1>
              </div>
              <p className="text-gray-600 text-sm">
                Manage and track your business locations across your
                organization
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={fetchLocations}
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
                Add Location
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards - Modern Design */}
      <div className="max-w-8xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Locations
                </p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {locations.length}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                <Building className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Active Locations
                </p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {locations.filter((loc) => loc.status === "active").length}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
                <MapPin className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Head Offices
                </p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {locations.filter((loc) => loc.head_office === "yes").length}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center">
                <Building className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Branches</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {locations.filter((loc) => loc.head_office === "no").length}
                </p>
              </div>
              <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center">
                <MapPin className="h-6 w-6 text-gray-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Card - Combined design */}
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
                    placeholder="Search locations by name, address, city..."
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition placeholder-gray-500 text-sm hover:border-gray-400"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition hover:border-gray-400"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="pending">Pending</option>
                  </select>

                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition hover:border-gray-400"
                  >
                    <option value="all">All Types</option>
                    <option value="head_office">Head Office</option>
                    <option value="branch">Branch</option>
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
                    : `${filteredLocations.length} location${
                        filteredLocations.length !== 1 ? "s" : ""
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
                <p className="text-gray-600 font-medium">
                  Loading locations...
                </p>
                <p className="text-gray-400 text-sm mt-1">
                  Please wait a moment
                </p>
              </div>
            </div>
          )}

          {/* Locations Table - Combined functionality with modern aesthetics */}
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
                        Location
                      </th>
                      <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider whitespace-nowrap text-gray-500 hidden sm:table-cell">
                        Address
                      </th>
                      <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider whitespace-nowrap text-gray-500 hidden md:table-cell">
                        City/State
                      </th>
                      <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider whitespace-nowrap text-gray-500 hidden lg:table-cell">
                        Contact
                      </th>
                      <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider whitespace-nowrap text-gray-500">
                        Type
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
                    {filteredLocations.length > 0 ? (
                      filteredLocations.map((loc, index) => (
                        <tr
                          key={loc.id}
                          className="hover:bg-gray-50/50 transition-colors group"
                        >
                          <td className="px-6 py-4 text-center">
                            <span className="text-sm font-medium text-gray-500">
                              {index + 1}
                            </span>
                          </td>
                          <td className="px-6 py-4 min-w-[200px]">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-50 rounded-xl flex items-center justify-center flex-shrink-0 border border-blue-200/50">
                                <Building className="h-5 w-5 text-blue-600" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                                  {loc.location_name}
                                </div>
                                <div className="text-xs text-gray-500 truncate mt-0.5">
                                  {loc.country || "No country specified"}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 min-w-[200px] hidden sm:table-cell">
                            <div className="text-gray-600 truncate">
                              {loc.address || "No address specified"}
                            </div>
                            {loc.postal_code && (
                              <div className="text-xs text-gray-500 mt-1 truncate">
                                Postal: {loc.postal_code}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap hidden md:table-cell">
                            <div className="text-gray-900 font-medium truncate">
                              {loc.city || "N/A"}
                            </div>
                            <div className="text-xs text-gray-500 truncate">
                              {loc.state || "N/A"}
                            </div>
                          </td>
                          <td className="px-6 py-4 min-w-[150px] whitespace-nowrap hidden lg:table-cell">
                            {loc.phone && (
                              <div className="flex items-center gap-2 text-gray-600">
                                <Phone className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                                <span className="text-sm font-medium truncate">
                                  {loc.phone}
                                </span>
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 min-w-[120px] whitespace-nowrap">
                            <span
                              className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold ${getTypeBadgeColor(
                                loc.head_office
                              )}`}
                            >
                              {loc.head_office === "yes"
                                ? "Head Office"
                                : "Branch"}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold ${getStatusBadgeColor(
                                loc.status
                              )}`}
                            >
                              {loc.status.charAt(0).toUpperCase() +
                                loc.status.slice(1)}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center relative whitespace-nowrap">
                            <button
                              onClick={() =>
                                setOpenRow(openRow === loc.id ? null : loc.id)
                              }
                              className="p-2 rounded-lg hover:bg-gray-100 transition text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed group/action"
                              disabled={isSubmitting}
                            >
                              <MoreVertical
                                size={18}
                                className="group-hover/action:scale-110 transition-transform"
                              />
                            </button>

                            {openRow === loc.id && (
                              <>
                                <div
                                  className="fixed inset-0 z-10"
                                  onClick={() => setOpenRow(null)}
                                />
                                <div className="absolute right-6 z-40 w-56 bg-white border border-gray-200 rounded-xl shadow-lg shadow-gray-200/50 animate-fadeIn backdrop-blur-sm">
                                  <button
                                    onClick={() => {
                                      setSelectedLocation(loc);
                                      setForm({
                                        location_name: loc.location_name || "",
                                        address: loc.address || "",
                                        city: loc.city || "",
                                        state: loc.state || "",
                                        phone: loc.phone || "",
                                        country: loc.country || "Nigeria",
                                        postal_code: loc.postal_code || "",
                                        staffs: loc.staffs || "",
                                      });
                                      setEditModalOpen(true);
                                      setOpenRow(null);
                                    }}
                                    className="flex items-center gap-3 w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition first:rounded-t-xl last:rounded-b-xl disabled:opacity-50 disabled:cursor-not-allowed border-b border-gray-100"
                                    disabled={isSubmitting}
                                  >
                                    <ArchiveRestore
                                      size={16}
                                      className="text-blue-600"
                                    />
                                    Products
                                  </button>

                                  <Link href={`/users_locations/${loc.id}`}>
                                    <button className="flex items-center gap-3 w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition first:rounded-t-xl last:rounded-b-xl disabled:opacity-50 disabled:cursor-not-allowed border-b border-gray-100">
                                      <UserRoundCheck
                                        size={16}
                                        className="text-blue-600"
                                      />
                                      Employee
                                    </button>{" "}
                                  </Link>

                                  <button
                                    onClick={() => {
                                      setSelectedLocation(loc);
                                      setForm({
                                        location_name: loc.location_name || "",
                                        address: loc.address || "",
                                        city: loc.city || "",
                                        state: loc.state || "",
                                        phone: loc.phone || "",
                                        country: loc.country || "Nigeria",
                                        postal_code: loc.postal_code || "",
                                        staffs: loc.staffs || "",
                                      });
                                      setEditModalOpen(true);
                                      setOpenRow(null);
                                    }}
                                    className="flex items-center gap-3 w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition first:rounded-t-xl last:rounded-b-xl disabled:opacity-50 disabled:cursor-not-allowed border-b border-gray-100"
                                    disabled={isSubmitting}
                                  >
                                    <DatabaseZap
                                      size={16}
                                      className="text-blue-600"
                                    />
                                    Sale Reports
                                  </button>

                                  <button
                                    onClick={() => {
                                      setSelectedLocation(loc);
                                      setForm({
                                        location_name: loc.location_name || "",
                                        address: loc.address || "",
                                        city: loc.city || "",
                                        state: loc.state || "",
                                        phone: loc.phone || "",
                                        country: loc.country || "Nigeria",
                                        postal_code: loc.postal_code || "",
                                        staffs: loc.staffs || "",
                                      });
                                      setEditModalOpen(true);
                                      setOpenRow(null);
                                    }}
                                    className="flex items-center gap-3 w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition first:rounded-t-xl last:rounded-b-xl disabled:opacity-50 disabled:cursor-not-allowed border-b border-gray-100"
                                    disabled={isSubmitting}
                                  >
                                    <Edit size={16} className="text-blue-600" />
                                    Edit Location
                                  </button>

                                  <button
                                    onClick={() => {
                                      setSelectedLocation(loc);
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
                                    Delete Location
                                  </button>
                                </div>
                              </>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={8} className="text-center py-16">
                          <div className="flex flex-col items-center gap-4 max-w-sm mx-auto">
                            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center">
                              <Search size={24} className="text-gray-400" />
                            </div>
                            <div className="space-y-2">
                              <p className="text-gray-900 font-semibold text-lg">
                                {debouncedSearch
                                  ? "No locations found"
                                  : "No locations available"}
                              </p>
                              <p className="text-gray-500 text-sm">
                                {debouncedSearch
                                  ? "Try adjusting your search terms or filters"
                                  : "Get started by adding your first location to the system"}
                              </p>
                            </div>
                            {!debouncedSearch && (
                              <button
                                onClick={() => setModalOpen(true)}
                                className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-5 py-2.5 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all font-medium mt-2"
                              >
                                <Plus size={16} />
                                Add Location
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

        {/* Add Location Modal */}
        {modalOpen && (
          <CombinedModal
            title={
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Plus className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Add Business Location
                  </h2>
                  <p className="text-gray-500 text-sm">
                    Create a new business location in the system
                  </p>
                </div>
              </div>
            }
            onClose={handleModalClose}
          >
            <form onSubmit={handleSave} className="space-y-6">
              <LocationForm
                form={form}
                handleInputChange={handleInputChange}
                inputClass={inputClass}
                labelClass={labelClass}
                countries={countries}
                staffs={staffs}
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
                      Add Location
                    </>
                  )}
                </button>
              </div>
            </form>
          </CombinedModal>
        )}

        {/* Edit Location Modal */}
        {editModalOpen && selectedLocation && (
          <CombinedModal
            title={
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Edit className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Edit Business Location
                  </h2>
                  <p className="text-gray-500 text-sm">
                    Update location information and details
                  </p>
                </div>
              </div>
            }
            onClose={handleEditModalClose}
          >
            <form onSubmit={handleEdit} className="space-y-6">
              <LocationForm
                form={form}
                handleInputChange={handleInputChange}
                inputClass={inputClass}
                labelClass={labelClass}
                countries={countries}
                staffs={staffs}
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
                      Update Location
                    </>
                  )}
                </button>
              </div>
            </form>
          </CombinedModal>
        )}

        {/* Delete Confirmation Modal */}
        {deleteModalOpen && selectedLocation && (
          <CombinedModal title={null} onClose={handleDeleteModalClose}>
            <div className="max-w-md mx-auto rounded-2xl p-6 bg-white animate-fadeIn flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 flex items-center justify-center rounded-2xl bg-red-50 border border-red-200">
                <AlertTriangle className="w-7 h-7 text-red-600" />
              </div>

              <h2 className="text-xl font-bold text-gray-900">
                Delete Location
              </h2>
              <p className="text-gray-600 text-sm leading-relaxed">
                Are you sure you want to delete{" "}
                <span className="font-semibold text-gray-900">
                  {selectedLocation.location_name}
                </span>
                ? This action cannot be undone and all location data will be
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

export default withAuth(ManageLocations);

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

// LocationForm Component with combined styling
const LocationForm = ({
  form,
  handleInputChange,
  inputClass,
  labelClass,
  countries,
  staffs = [],
}: {
  form: any;
  handleInputChange: (field: keyof LocationFormData, value: string) => void;
  inputClass: string;
  labelClass: string;
  countries: string[];
  staffs?: Staff[];
}) => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Location Name Field */}
      <div className="md:col-span-2">
        <label className={labelClass}>
          Location Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={form.location_name}
          onChange={(e) => handleInputChange("location_name", e.target.value)}
          required
          className={inputClass}
          placeholder="Enter location name"
        />
      </div>

      {/* Address Field */}
      <div className="md:col-span-2">
        <label className={labelClass}>
          Address <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={form.address}
          onChange={(e) => handleInputChange("address", e.target.value)}
          required
          className={inputClass}
          placeholder="Enter full address"
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

      {/* State Field */}
      <div>
        <label className={labelClass}>State/Province</label>
        <input
          type="text"
          value={form.state}
          onChange={(e) => handleInputChange("state", e.target.value)}
          className={inputClass}
          placeholder="Enter State/Province"
        />
      </div>

      {/* Staffs Field */}
      <div>
        <label className={labelClass}>Manager</label>
        <select
          value={form.staffs || ""}
          onChange={(e) => handleInputChange("staffs", e.target.value)}
          className={inputClass}
        >
          <option value="">Select Manager</option>
          {staffs.map((staff) => (
            <option key={staff.id} value={staff.id}>
              {staff.name}
            </option>
          ))}
        </select>
      </div>

      {/* Country Field */}
      <div>
        <label className={labelClass}>Country</label>
        <select
          value={form.country}
          onChange={(e) => handleInputChange("country", e.target.value)}
          className={inputClass}
        >
          {countries.map((country: string) => (
            <option key={country} value={country}>
              {country}
            </option>
          ))}
        </select>
      </div>

      {/* Postal Code Field */}
      <div>
        <label className={labelClass}>Postal Code</label>
        <input
          type="text"
          value={form.postal_code}
          onChange={(e) => handleInputChange("postal_code", e.target.value)}
          className={inputClass}
          placeholder="Enter postal code"
        />
      </div>

      {/* Phone Number Field */}
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
    </div>
  </div>
);
