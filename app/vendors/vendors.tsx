"use client"; // This directive marks this component as a Client Component in Next.js App Router
import { countries } from "@/app/component/country-list";
import { withAuth } from "@/hoc/withAuth"; // Higher Order Component for authentication protection
import { apiGet, apiPut, apiPost } from "@/lib/axios"; // Custom HTTP client methods
import React, { useState, useEffect, useMemo } from "react"; // React hooks
import {
  Plus,
  Edit,
  Trash2,
  Search,
  MoreVertical,
  X,
  AlertTriangle,
  ArrowLeft,
  Loader2,
  Filter,
  Download,
  ChevronDown,
  Settings,
  RefreshCw,
  User,
  Building,
  Mail,
  Phone,
  MapPin,
  Globe,
  Banknote,
  FileText,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Building2,
  Briefcase,
  CreditCard,
  Earth,
  Calendar,
  Users,
  Eye, // Added the missing Eye icon
} from "lucide-react"; // Icon library
import Link from "next/link"; // Next.js component for client-side navigation
import { useRouter } from "next/navigation"; // Next.js hook for programmatic navigation
import api from "@/lib/axios"; // API client instance
import Cookies from "js-cookie"; // Library for client-side cookie management
import { toast } from "react-hot-toast"; // Toast notification library
import ShortTextWithTooltip from "../component/shorten_len"; // make sure the path is correct

// TypeScript interfaces for type safety
interface Vendor {
  id: number;
  created_at: string;
  updated_at: string;
  owner_id: number;
  business_key: string;
  location_id: number;
  vendor_name: string;
  contact_person: string | null;
  email: string;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string;
  postal_code: string | null;
  industry: string | null;
  tax_id: string | null;
  registration_number: string | null;
  website: string | null;
  bank_name: string | null;
  bank_account_number: string | null;
  bank_account_name: string | null;
  is_active: boolean;
  notes: string | null;
  owner?: {
    id: number;
    name: string;
    email: string;
  };
  business?: {
    business_key: string;
    business_name: string;
  };
  location?: {
    id: number;
    location_name: string;
  };
}

interface VendorFormData {
  vendor_name: string;
  contact_person: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postal_code: string;
  industry: string;
  tax_id: string;
  registration_number: string;
  website: string;
  bank_name: string;
  bank_account_number: string;
  bank_account_name: string;
  is_active: boolean;
  notes: string;
  location_id: number;
  business_key: string;
}

interface Business {
  business_key: string;
  business_name: string;
}

interface BusinessLocation {
  id: number;
  location_name: string;
  business_key: string;
}

const ManageVendors = ({ user }) => {
  // Search and Filter States
  const [search, setSearch] = useState(""); // Real-time search input value
  const [debouncedSearch, setDebouncedSearch] = useState(""); // Debounced search value (300ms delay)
  const [statusFilter, setStatusFilter] = useState<string>("all"); // Filter by active/inactive status
  const [businessFilter, setBusinessFilter] = useState<string>("all"); // Filter by business
  const [industryFilter, setIndustryFilter] = useState<string>("all"); // Filter by industry

  // UI Interaction States
  const [openRow, setOpenRow] = useState<number | null>(null); // Tracks which row's action menu is open

  // Modal States
  const [modalOpen, setModalOpen] = useState(false); // Controls visibility of Add Vendor modal
  const [editModalOpen, setEditModalOpen] = useState(false); // Controls visibility of Edit Vendor modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false); // Controls visibility of Delete Confirmation modal
  const [viewModalOpen, setViewModalOpen] = useState(false); // Controls visibility of View Vendor modal

  // Selected Item State
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null); // Currently selected vendor for operations

  // Loading States
  const [isLoading, setIsLoading] = useState(true); // Indicates if data is being fetched
  const [isSubmitting, setIsSubmitting] = useState(false); // Indicates if form submission is in progress

  // Data States
  const [vendors, setVendors] = useState<Vendor[]>([]); // List of all vendors
  const [businesses, setBusinesses] = useState<Business[]>([]); // List of all businesses
  const [locations, setLocations] = useState<BusinessLocation[]>([]); // List of all business locations
  const [industries, setIndustries] = useState<string[]>([]); // List of unique industries

  // Form State
  const [form, setForm] = useState<VendorFormData>({
    vendor_name: "",
    contact_person: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    country: "Netherlands",
    postal_code: "",
    industry: "",
    tax_id: "",
    registration_number: "",
    website: "",
    bank_name: "",
    bank_account_number: "",
    bank_account_name: "",
    is_active: true,
    notes: "",
    location_id: 0,
    business_key: "",
  });

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1); // Current page number (1-indexed)
  const [itemsPerPage, setItemsPerPage] = useState(10); // Number of items to display per page

  const router = useRouter(); // Next.js router instance for navigation

  // Effect for debouncing search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search); // Update debounced search after 300ms
      setCurrentPage(1); // Reset to first page when search changes
    }, 300);

    return () => clearTimeout(timer); // Cleanup timer on unmount or search change
  }, [search]);

  // Effect to reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1); // Reset to first page when filters change
  }, [statusFilter, businessFilter, industryFilter]);

  // Effect to fetch data on component mount
  useEffect(() => {
    if (!user) return;
    fetchVendors();
    fetchBusinesses();
    fetchLocations();
  }, []);

  /**
   * Fetches all vendors from the API
   */
  const fetchVendors = async () => {
    setIsLoading(true);
    try {
      const res = await apiGet("/vendors");

      // Normalize API response to ensure it's always an array
      const vendorsArray =
        res.data?.data?.vendors ?? res.data?.data ?? res.data?.vendors ?? [];

      setVendors(Array.isArray(vendorsArray) ? vendorsArray : []);

      // Extract unique industries from vendors
      const uniqueIndustries = Array.from(
        new Set(
          vendorsArray
            .filter((v: Vendor) => v.industry)
            .map((v: Vendor) => v.industry),
        ),
      ) as string[];
      setIndustries(uniqueIndustries);
    } catch (err: any) {
      toast.error(
        err.response?.status === 403
          ? "You don't have permission to access vendors"
          : "Failed to fetch vendors",
      );
      setVendors([]);
      setIndustries([]);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Fetches all businesses from the API
   */
  const fetchBusinesses = async () => {
    try {
      const res = await apiGet("/businesses");

      const businessesArray = res.data?.data ?? res.data?.businesses ?? [];
      setBusinesses(Array.isArray(businessesArray) ? businessesArray : []);
    } catch (err: any) {
      toast.error("Failed to fetch businesses");
      setBusinesses([]);
    }
  };

  /**
   * Fetches all business locations from the API
   */
  const fetchLocations = async () => {
    try {
      const res = await apiGet("/locations");
      const locationsArray = res.data?.data ?? res.data?.locations ?? [];
      setLocations(Array.isArray(locationsArray) ? locationsArray : []);
    } catch (err: any) {
      toast.error("Failed to fetch locations");
      setLocations([]);
    }
  };

  /**
   * Resets the form to its initial state
   */
  const resetForm = () => {
    setForm({
      vendor_name: "",
      contact_person: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      state: "",
      country: "Netherlands",
      postal_code: "",
      industry: "",
      tax_id: "",
      registration_number: "",
      website: "",
      bank_name: "",
      bank_account_number: "",
      bank_account_name: "",
      is_active: true,
      notes: "",
      location_id: 0,
      business_key: "",
    });
  };

  /**
   * Filters vendors based on search query and active filters
   */
  const filteredVendors = useMemo(() => {
    return vendors.filter((vendor) => {
      if (!vendor) return false;

      // Combine multiple fields into searchable text
      const searchableText = [
        vendor.vendor_name || "",
        vendor.contact_person || "",
        vendor.email || "",
        vendor.phone || "",
        vendor.address || "",
        vendor.city || "",
        vendor.state || "",
        vendor.industry || "",
        vendor.tax_id || "",
        vendor.business?.business_name || "",
        vendor.location?.location_name || "",
      ]
        .join(" ")
        .toLowerCase();

      // Check if vendor matches search term
      const matchesSearch = searchableText.includes(
        debouncedSearch.toLowerCase(),
      );

      // Check if vendor matches status filter
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && vendor.is_active) ||
        (statusFilter === "inactive" && !vendor.is_active);

      // Check if vendor matches business filter
      const matchesBusiness =
        businessFilter === "all" || vendor.business_key === businessFilter;

      // Check if vendor matches industry filter
      const matchesIndustry =
        industryFilter === "all" || vendor.industry === industryFilter;

      return (
        matchesSearch && matchesStatus && matchesBusiness && matchesIndustry
      );
    });
  }, [vendors, debouncedSearch, statusFilter, businessFilter, industryFilter]);

  // Pagination calculations
  const totalItems = filteredVendors.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);

  /**
   * Gets the current page's items
   */
  const currentItems = useMemo(() => {
    return filteredVendors.slice(startIndex, endIndex);
  }, [filteredVendors, startIndex, endIndex]);

  /**
   * Generates an array of page numbers for pagination
   */
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      pageNumbers.push(1);

      let startPage = Math.max(2, currentPage - 1);
      let endPage = Math.min(totalPages - 1, currentPage + 1);

      if (currentPage <= 3) {
        endPage = Math.min(4, totalPages - 1);
      }

      if (currentPage >= totalPages - 2) {
        startPage = Math.max(totalPages - 3, 2);
      }

      if (startPage > 2) {
        pageNumbers.push("...");
      }

      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i);
      }

      if (endPage < totalPages - 1) {
        pageNumbers.push("...");
      }

      if (totalPages > 1) {
        pageNumbers.push(totalPages);
      }
    }

    return pageNumbers;
  };

  /**
   * Handles page navigation
   */
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      const tableContainer = document.querySelector(".overflow-x-auto");
      if (tableContainer) {
        tableContainer.scrollTop = 0;
      }
    }
  };

  /**
   * Handles items per page change
   */
  const handleItemsPerPageChange = (value: number) => {
    setItemsPerPage(value);
    setCurrentPage(1);
  };

  /**
   * Validates form data before submission
   */
  const validateForm = (formData: VendorFormData): string[] => {
    const errors: string[] = [];

    // Required fields validation
    if (!formData.vendor_name.trim()) errors.push("Vendor name is required");
    if (!formData.email.trim()) errors.push("Email is required");
    // if (!formData.business_key) errors.push("Business is required");
    if (!formData.location_id) errors.push("Location is required");

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      errors.push("Please enter a valid email address");
    }

    // Phone validation (optional but must be valid if provided)
    if (formData.phone && formData.phone.length < 10) {
      errors.push("Phone number must be at least 10 digits");
    }

    // Name length validation
    if (formData.vendor_name.length < 2) {
      errors.push("Vendor name must be at least 2 characters");
    }
    if (formData.vendor_name.length > 100) {
      errors.push("Vendor name must be less than 100 characters");
    }

    return errors;
  };

  /**
   * Handles form submission for creating a new vendor
   */
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
      const payload = {
        ...form,
        // Ensure proper data types
        location_id: Number(form.location_id),
      };

      // OPTIMISTIC UPDATE: Create temporary ID
      const tempId = -Math.abs(Date.now());

      // Create temporary vendor object
      const optimisticVendor = {
        id: tempId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        owner_id: 0,
        business_key: form.business_key,
        location_id: form.location_id,
        vendor_name: form.vendor_name,
        contact_person: form.contact_person,
        email: form.email,
        phone: form.phone,
        address: form.address,
        city: form.city,
        state: form.state,
        country: form.country,
        postal_code: form.postal_code,
        industry: form.industry,
        tax_id: form.tax_id,
        registration_number: form.registration_number,
        website: form.website,
        bank_name: form.bank_name,
        bank_account_number: form.bank_account_number,
        bank_account_name: form.bank_account_name,
        is_active: form.is_active,
        notes: form.notes,
        owner: { id: 0, name: "", email: "" },
        business: businesses.find(
          (b) => b.business_key === form.business_key,
        ) || { business_key: form.business_key, business_name: "Unknown" },
        location: locations.find((l) => l.id === form.location_id) || {
          id: form.location_id,
          location_name: "Unknown",
        },
      };

      setVendors((prev) => [optimisticVendor, ...prev]);

      const response = await apiPost("/add_vendors", payload, {}, [
        "/add_vendors",
      ]);

      if (response.data?.data) {
        const actualVendor = response.data.data;
        setVendors((prev) =>
          prev.map((v) => (v.id === tempId ? actualVendor : v)),
        );
      } else {
        fetchVendors();
      }

      toast.success("Vendor created successfully");
      setModalOpen(false);
      resetForm();
    } catch (err: any) {
      const status = err.response?.status;

      setVendors((prev) => prev.filter((v) => v.id !== tempId));
      const errorMessage =
        err.userMessage ||
        err.response?.data?.message ||
        "Failed to delete customer";

      toast.error(errorMessage);
      // if (status === 403) {
      //   toast.error("You do not have permission to perform this action.");
      // } else if (status === 422) {
      //   const errors = err.response?.data?.errors;
      //   if (errors) {
      //     Object.values(errors).forEach((errorArray: any) => {
      //       errorArray.forEach((error: string) => toast.error(error));
      //     });
      //   } else {
      //     toast.error("Failed to create vendor. Please check your input.");
      //   }
      // } else if (status === 409) {
      //   toast.error("A vendor with this email already exists.");
      // }
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Handles form submission for editing an existing vendor
   */
  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || !selectedVendor) return;

    const validationErrors = validateForm(form);
    if (validationErrors.length) {
      validationErrors.forEach((msg) => toast.error(msg));
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        ...form,
        location_id: Number(form.location_id),
        _method: "PUT", // Laravel method override
      };

      // OPTIMISTIC UPDATE
      setVendors((prevVendors) =>
        prevVendors.map((vendor) =>
          vendor.id === selectedVendor.id
            ? {
                ...vendor,
                ...form,
                updated_at: new Date().toISOString(),
                business:
                  businesses.find(
                    (b) => b.business_key === form.business_key,
                  ) || vendor.business,
                location:
                  locations.find((l) => l.id === form.location_id) ||
                  vendor.location,
              }
            : vendor,
        ),
      );

      await apiPut(
        `/updatevendors/${selectedVendor.id}`,
        payload,
        { _method: "PUT" },
        ["/updatevendors"],
      );

      toast.success("Vendor updated successfully");
      setEditModalOpen(false);
      resetForm();
    } catch (err: any) {
      const errorMessage =
        err.userMessage ||
        err.response?.data?.message ||
        "Failed to delete customer";

      toast.error(errorMessage);
      fetchVendors(); // Revert optimistic update
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Handles vendor deletion
   */
  const handleDelete = async () => {
    if (isSubmitting || !selectedVendor) return;
    setIsSubmitting(true);
    try {
      setVendors((prevVendors) =>
        prevVendors.filter((vendor) => vendor.id !== selectedVendor.id),
      );
      let res = await api.delete(`/vendors-dels/${selectedVendor.id}`);
      toast.success("Vendor deleted successfully!");
      setDeleteModalOpen(false);
      setSelectedVendor(null);
    } catch (err: any) {
      toast.error("Failed to delete vendor");
      fetchVendors(); // Revert optimistic update
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Handles form input changes
   */
  const handleInputChange = (field: keyof VendorFormData, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  /**
   * Prepares form for editing a vendor
   */
  const prepareEditForm = (vendor: Vendor) => {
    setForm({
      vendor_name: vendor.vendor_name,
      contact_person: vendor.contact_person || "",
      email: vendor.email,
      phone: vendor.phone || "",
      address: vendor.address || "",
      city: vendor.city || "",
      state: vendor.state || "",
      country: vendor.country || "Netherlands",
      postal_code: vendor.postal_code || "",
      industry: vendor.industry || "",
      tax_id: vendor.tax_id || "",
      registration_number: vendor.registration_number || "",
      website: vendor.website || "",
      bank_name: vendor.bank_name || "",
      bank_account_number: vendor.bank_account_number || "",
      bank_account_name: vendor.bank_account_name || "",
      is_active: vendor.is_active,
      notes: vendor.notes || "",
      location_id: vendor.location_id,
      business_key: vendor.business_key,
    });
    setSelectedVendor(vendor);
    setEditModalOpen(true);
  };

  /**
   * Prepares view modal for a vendor
   */
  const prepareViewModal = (vendor: Vendor) => {
    setSelectedVendor(vendor);
    setViewModalOpen(true);
  };

  // Modal close handlers
  const handleModalClose = () => {
    if (!isSubmitting) {
      setModalOpen(false);
      resetForm();
    }
  };

  const handleEditModalClose = () => {
    if (!isSubmitting) {
      setEditModalOpen(false);
      setSelectedVendor(null);
      resetForm();
    }
  };

  const handleDeleteModalClose = () => {
    if (!isSubmitting) {
      setDeleteModalOpen(false);
      setSelectedVendor(null);
    }
  };

  const handleViewModalClose = () => {
    setViewModalOpen(false);
    setSelectedVendor(null);
  };

  /**
   * Returns CSS classes for status badges
   */
  const getStatusBadgeColor = (isActive: boolean) => {
    return isActive
      ? "bg-green-50 text-green-700 border border-green-200"
      : "bg-gray-50 text-gray-700 border border-gray-200";
  };

  // Reusable CSS classes
  const inputClass =
    "w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200 placeholder-gray-500 text-sm hover:border-gray-400";
  const labelClass = "block text-sm font-semibold text-gray-700 mb-2";
  const selectClass =
    "w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200 text-sm hover:border-gray-400";

  return (
    <div className="min-h-screen bg-gray-50/30">
      {/* Header Section */}
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
                  Vendor Management
                </h1>
              </div>
              <p className="text-gray-600 text-sm">
                Manage vendors and supplier information
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <button
                onClick={fetchVendors}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                title="Refresh"
              >
                <RefreshCw size={18} />
              </button>
              <button
                onClick={() => setModalOpen(true)}
                className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-5 py-2.5 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-medium shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isSubmitting}
              >
                <Plus size={18} />
                Add Vendor
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards Section */}
      <div className="max-w-8xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Vendors Card */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Vendors
                </p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {vendors.length}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          {/* Active Vendors Card */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Active Vendors
                </p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {vendors.filter((v) => v.is_active).length}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
                <User className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          {/* Unique Industries Card */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Unique Industries
                </p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {industries.length}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center">
                <Briefcase className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>

          {/* Nigerian Vendors Card */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Nigerian Vendors
                </p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {vendors.filter((v) => v.country === "Nigeria").length}
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-50 rounded-xl flex items-center justify-center">
                <Globe className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Card */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {/* Search and Filters Section */}
          <div className="px-6 py-5 border-b border-gray-200 bg-gray-50/50">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 flex-1">
                {/* Search Input */}
                <div className="relative flex-1 max-w-md">
                  <Search
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    size={18}
                  />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search vendors by name, email, industry..."
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition placeholder-gray-500 text-sm hover:border-gray-400"
                  />
                </div>

                {/* Filter Controls */}
                <div className="flex items-center gap-3">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition hover:border-gray-400"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>

                  {/* <select
                    value={businessFilter}
                    onChange={(e) => setBusinessFilter(e.target.value)}
                    className="px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition hover:border-gray-400"
                  >
                    <option value="all">All Businesses</option>
                    {businesses.map((business) => (
                      <option
                        key={business.business_key}
                        value={business.business_key}
                      >
                        {business.business_name}
                      </option>
                    ))}
                  </select> */}

                  <select
                    value={industryFilter}
                    onChange={(e) => setIndustryFilter(e.target.value)}
                    className="px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition hover:border-gray-400"
                  >
                    <option value="all">All Industries</option>
                    {industries.map((industry) => (
                      <option key={industry} value={industry}>
                        {industry}
                      </option>
                    ))}
                  </select>

                  <button className="flex items-center gap-2 px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-700 hover:border-gray-400 transition-colors font-medium text-sm">
                    <Filter size={16} />
                    More Filters
                  </button>
                </div>
              </div>

              {/* Results Summary */}
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full text-sm font-medium border border-blue-200">
                  {isLoading
                    ? "Loading..."
                    : `Showing ${
                        startIndex + 1
                      }-${endIndex} of ${totalItems} vendor${
                        totalItems !== 1 ? "s" : ""
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
                <p className="text-gray-600 font-medium">Loading vendors...</p>
                <p className="text-gray-400 text-sm mt-1">
                  Please wait a moment
                </p>
              </div>
            </div>
          )}

          {/* Vendors Table Section */}
          {!isLoading && (
            <>
              <div className="relative">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-gray-600 text-left border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider whitespace-nowrap w-12 text-center">
                          S.No
                        </th>
                        <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider whitespace-nowrap text-gray-500">
                          Vendor Details
                        </th>
                        <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider whitespace-nowrap text-gray-500 hidden lg:table-cell">
                          Contact Info
                        </th>
                        <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider whitespace-nowrap text-gray-500 hidden md:table-cell">
                          Location
                        </th>
                        <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider whitespace-nowrap text-gray-500">
                          Status
                        </th>
                        <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider whitespace-nowrap text-gray-500">
                          Created
                        </th>
                        <th className="px-6 py-4 text-center font-semibold text-xs uppercase tracking-wider whitespace-nowrap text-gray-500 w-12">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {currentItems.length > 0 ? (
                        currentItems.map((vendor, index) => (
                          <tr
                            key={vendor.id}
                            className="hover:bg-gray-50/50 transition-colors group"
                          >
                            {/* Serial Number */}
                            <td className="px-6 py-4 text-center">
                              <span className="text-sm font-medium text-gray-500">
                                {startIndex + index + 1}
                              </span>
                            </td>

                            {/* Vendor Details */}
                            <td className="px-6 py-4 min-w-[200px]">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-50 rounded-xl flex items-center justify-center flex-shrink-0 border border-blue-200/50">
                                  <Building2 className="h-5 w-5 text-blue-600" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                                   
                                     <ShortTextWithTooltip
                                        text= {vendor.vendor_name}
                                        max={25}
                                      />
                                  </div>
                                  <div className="text-xs text-gray-500 truncate mt-0.5 flex items-center gap-1">
                                    <Briefcase size={12} />
                                    {vendor.industry || "No industry specified"}
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* Contact Info (hidden on mobile) */}
                            <td className="px-6 py-4 min-w-[150px] hidden lg:table-cell">
                              <div className="space-y-1">
                                <div className="text-gray-600 text-sm truncate flex items-center gap-1">
                                  <Mail size={12} />
                                  {vendor.email}
                                </div>
                                {vendor.phone && (
                                  <div className="text-gray-600 text-sm truncate flex items-center gap-1">
                                    <Phone size={12} />
                                    {vendor.phone}
                                  </div>
                                )}
                                {vendor.contact_person && (
                                  <div className="text-gray-600 text-sm truncate flex items-center gap-1">
                                    <User size={12} />
                                    {vendor.contact_person}
                                  </div>
                                )}
                              </div>
                            </td>

                            {/* Location (hidden on mobile) */}
                            <td className="px-6 py-4 min-w-[120px] hidden md:table-cell">
                              <div className="text-gray-600 text-sm line-clamp-2">
                                {vendor.city && vendor.state ? (
                                  <div className="flex items-center gap-1">
                                    <MapPin size={12} />
                                    <ShortTextWithTooltip
                                        text= {`${vendor.city}, ${vendor.state}`}
                                        max={30}
                                      />
                                   
                                  </div>
                                ) : (
                                  "No location"
                                )}
                              </div>
                            </td>

                            {/* Status Badge */}
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold ${getStatusBadgeColor(
                                  vendor.is_active,
                                )}`}
                              >
                                {vendor.is_active ? (
                                  <>
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Active
                                  </>
                                ) : (
                                  <>
                                    <XCircle className="h-3 w-3 mr-1" />
                                    Inactive
                                  </>
                                )}
                              </span>
                            </td>

                            {/* Created Date */}
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(vendor.created_at).toLocaleDateString()}
                            </td>

                            {/* Action Menu */}
                            <td className="px-6 py-4 text-center relative whitespace-nowrap">
                              <button
                                onClick={() =>
                                  setOpenRow(
                                    openRow === vendor.id ? null : vendor.id,
                                  )
                                }
                                className="p-2 rounded-lg hover:bg-gray-100 transition text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed group/action"
                                disabled={isSubmitting}
                              >
                                <MoreVertical
                                  size={18}
                                  className="group-hover/action:scale-110 transition-transform"
                                />
                              </button>

                              {/* Dropdown Action Menu */}
                              {openRow === vendor.id && (
                                <>
                                  <div
                                    className="fixed inset-0 z-10"
                                    onClick={() => setOpenRow(null)}
                                  />
                                  <div className="absolute right-6 z-40 w-48 bg-white border border-gray-200 rounded-xl shadow-lg shadow-gray-200/50 animate-fadeIn backdrop-blur-sm">
                                    <button
                                      onClick={() => {
                                        prepareViewModal(vendor);
                                        setOpenRow(null);
                                      }}
                                      className="flex items-center gap-3 w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition first:rounded-t-xl last:rounded-b-xl disabled:opacity-50 disabled:cursor-not-allowed border-b border-gray-100"
                                      disabled={isSubmitting}
                                    >
                                      <Eye className="h-4 w-4 text-blue-600" />
                                      View Details
                                    </button>

                                    <button
                                      onClick={() => {
                                        prepareEditForm(vendor);
                                        setOpenRow(null);
                                      }}
                                      className="flex items-center gap-3 w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition border-b border-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                      disabled={isSubmitting}
                                    >
                                      <Edit
                                        size={16}
                                        className="text-blue-600"
                                      />
                                      Edit Vendor
                                    </button>

                                    <button
                                      onClick={() => {
                                        setSelectedVendor(vendor);
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
                                      Delete Vendor
                                    </button>
                                  </div>
                                </>
                              )}
                            </td>
                          </tr>
                        ))
                      ) : (
                        // Empty State
                        <tr>
                          <td colSpan={7} className="text-center py-16">
                            <div className="flex flex-col items-center gap-4 max-w-sm mx-auto">
                              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center">
                                <Users size={24} className="text-gray-400" />
                              </div>
                              <div className="space-y-2">
                                <p className="text-gray-900 font-semibold text-lg">
                                  {debouncedSearch
                                    ? "No vendors found"
                                    : "No vendors available"}
                                </p>
                                <p className="text-gray-500 text-sm">
                                  {debouncedSearch
                                    ? "Try adjusting your search terms or filters"
                                    : "Get started by adding your first vendor"}
                                </p>
                              </div>
                              {!debouncedSearch && (
                                <button
                                  onClick={() => setModalOpen(true)}
                                  className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-5 py-2.5 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all font-medium mt-2"
                                >
                                  <Plus size={16} />
                                  Add Vendor
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

              {/* Pagination Component */}
              {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200 bg-gray-50/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">Show</span>
                      <select
                        value={itemsPerPage}
                        onChange={(e) =>
                          handleItemsPerPageChange(Number(e.target.value))
                        }
                        className="px-2 py-1.5 text-sm border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      >
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                      </select>
                      <span className="text-sm text-gray-600">per page</span>
                    </div>
                  </div>

                  {/* Page Navigation */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handlePageChange(1)}
                      disabled={currentPage === 1}
                      className="p-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      aria-label="First page"
                    >
                      <ChevronsLeft size={16} />
                    </button>

                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="p-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      aria-label="Previous page"
                    >
                      <ChevronLeft size={16} />
                    </button>

                    <div className="flex items-center gap-1">
                      {getPageNumbers().map((page, index) => (
                        <React.Fragment key={index}>
                          {page === "..." ? (
                            <span className="px-3 py-2 text-gray-400">...</span>
                          ) : (
                            <button
                              onClick={() => handlePageChange(page as number)}
                              className={`min-w-[2.5rem] h-10 flex items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                                currentPage === page
                                  ? "bg-blue-600 text-white border border-blue-600"
                                  : "text-gray-700 hover:bg-gray-100 border border-gray-300"
                              }`}
                              aria-label={`Page ${page}`}
                              aria-current={
                                currentPage === page ? "page" : undefined
                              }
                            >
                              {page}
                            </button>
                          )}
                        </React.Fragment>
                      ))}
                    </div>

                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="p-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      aria-label="Next page"
                    >
                      <ChevronRight size={16} />
                    </button>

                    <button
                      onClick={() => handlePageChange(totalPages)}
                      disabled={currentPage === totalPages}
                      className="p-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      aria-label="Last page"
                    >
                      <ChevronsRight size={16} />
                    </button>
                  </div>

                  <div className="text-sm text-gray-600">
                    Page <span className="font-semibold">{currentPage}</span> of{" "}
                    <span className="font-semibold">{totalPages}</span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Add Vendor Modal */}
        {modalOpen && (
          <CombinedModal
            title={
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Plus className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Add New Vendor
                  </h2>
                  <p className="text-gray-500 text-sm">
                    Create a new vendor/supplier record
                  </p>
                </div>
              </div>
            }
            onClose={handleModalClose}
          >
            <form onSubmit={handleSave} className="space-y-8">
              {/* Section 1: Basic Vendor Information */}
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                    <Building2 className="w-4 h-4 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Vendor Details
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Required Fields */}
                  <div className="space-y-4">
                    <div>
                      <label
                        className={`${labelClass} flex items-center gap-1`}
                      >
                        Vendor Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={form.vendor_name}
                        onChange={(e) =>
                          handleInputChange("vendor_name", e.target.value)
                        }
                        required
                        className={inputClass}
                        placeholder="Enter vendor name"
                      />
                    </div>

                    <div>
                      <label
                        className={`${labelClass} flex items-center gap-1`}
                      >
                        Email <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        value={form.email}
                        onChange={(e) =>
                          handleInputChange("email", e.target.value)
                        }
                        required
                        className={inputClass}
                        placeholder="vendor@example.com"
                      />
                    </div>

                    <div>
                      <label className={labelClass}>Industry</label>
                      <select
                        value={form.industry}
                        onChange={(e) =>
                          handleInputChange("industry", e.target.value)
                        }
                        className={selectClass}
                      >
                        <option value="General">Select Industry</option>
                        <option value="Agriculture & Farming">
                          Agriculture & Farming
                        </option>
                        <option value="Automotive">Automotive</option>
                        <option value="Banking & Finance">
                          Banking & Finance
                        </option>
                        <option value="Beauty & Cosmetics">
                          Beauty & Cosmetics
                        </option>
                        <option value="Construction">Construction</option>
                        <option value="Consulting Services">
                          Consulting Services
                        </option>
                        <option value="Education">Education</option>
                        <option value="Electronics">Electronics</option>
                        <option value="Energy & Utilities">
                          Energy & Utilities
                        </option>
                        <option value="Engineering">Engineering</option>
                        <option value="Fashion & Apparel">
                          Fashion & Apparel
                        </option>
                        <option value="Food & Beverage">Food & Beverage</option>
                        <option value="Furniture">Furniture</option>
                        <option value="Healthcare">Healthcare</option>
                        <option value="Hospitality">Hospitality</option>
                        <option value="Information Technology">
                          Information Technology
                        </option>
                        <option value="Insurance">Insurance</option>
                        <option value="Legal Services">Legal Services</option>
                        <option value="Logistics & Transportation">
                          Logistics & Transportation
                        </option>
                        <option value="Manufacturing">Manufacturing</option>
                        <option value="Marketing & Advertising">
                          Marketing & Advertising
                        </option>
                        <option value="Media & Entertainment">
                          Media & Entertainment
                        </option>
                        <option value="Office Supplies">Office Supplies</option>
                        <option value="Pharmaceuticals">Pharmaceuticals</option>
                        <option value="Real Estate">Real Estate</option>
                        <option value="Retail">Retail</option>
                        <option value="Security Services">
                          Security Services
                        </option>
                        <option value="Telecommunications">
                          Telecommunications
                        </option>
                        <option value="Travel & Tourism">
                          Travel & Tourism
                        </option>
                        <option value="Waste Management">
                          Waste Management
                        </option>
                        <option value="Wholesale & Distribution">
                          Wholesale & Distribution
                        </option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>

                  {/* Optional Fields */}
                  <div className="space-y-4">
                    <div>
                      <label className={labelClass}>Contact Person</label>
                      <input
                        type="text"
                        value={form.contact_person}
                        onChange={(e) =>
                          handleInputChange("contact_person", e.target.value)
                        }
                        className={inputClass}
                        placeholder="Optional Paul"
                      />
                    </div>

                    <div>
                      <label className={labelClass}>Phone Number</label>
                      <input
                        type="tel"
                        value={form.phone}
                        onChange={(e) =>
                          handleInputChange("phone", e.target.value)
                        }
                        className={inputClass}
                        placeholder="+234 800 000 0000"
                      />
                    </div>

                    <div>
                      <label className={labelClass}>Website</label>
                      <input
                        type="url"
                        value={form.website}
                        onChange={(e) =>
                          handleInputChange("website", e.target.value)
                        }
                        className={inputClass}
                        placeholder="https://example.com"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className={labelClass}>
                    Location <span className="text-red-500">*</span>
                    <span className="text-gray-400 font-normal text-xs ml-2">
                      (optional)
                    </span>
                  </label>
                  <select
                    value={form.location_id}
                    onChange={(e) =>
                      handleInputChange("location_id", Number(e.target.value))
                    }
                    required
                    className={selectClass}
                  >
                    {/* <option value="0">Select Location</option> */}
                    {locations.map((location) => (
                      <option key={location.id} value={location.id}>
                        {location.location_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-gray-200"></div>

              {/* Section 2: Address Information */}
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                    <MapPin className="w-4 h-4 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Address Details
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className={labelClass}>Address</label>
                      <input
                        type="text"
                        value={form.address}
                        onChange={(e) =>
                          handleInputChange("address", e.target.value)
                        }
                        className={inputClass}
                        placeholder="123 Main Street"
                      />
                    </div>

                    <div>
                      <label className={labelClass}>City</label>
                      <input
                        type="text"
                        value={form.city}
                        onChange={(e) =>
                          handleInputChange("city", e.target.value)
                        }
                        className={inputClass}
                        placeholder=""
                      />
                    </div>

                    <div>
                      <label className={labelClass}>State</label>
                      <input
                        type="text"
                        value={form.state}
                        onChange={(e) =>
                          handleInputChange("state", e.target.value)
                        }
                        className={inputClass}
                        placeholder=""
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className={labelClass}>Postal Code</label>
                      <input
                        type="text"
                        value={form.postal_code}
                        onChange={(e) =>
                          handleInputChange("postal_code", e.target.value)
                        }
                        className={inputClass}
                        placeholder="100001"
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Country</label>
                      <select
                        value={form.country}
                        onChange={(e) =>
                          handleInputChange("country", e.target.value)
                        }
                        className={selectClass}
                      >
                        <option value="">Select country</option>
                        {countries.map((country) => (
                          <option key={country} value={country}>
                            {country}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="pt-4">
                      <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors cursor-pointer">
                        <div className="relative">
                          <input
                            type="checkbox"
                            checked={form.is_active}
                            onChange={(e) =>
                              handleInputChange("is_active", e.target.checked)
                            }
                            className="sr-only"
                          />
                          <div
                            className={`w-12 h-6 flex items-center rounded-full p-1 transition-all ${
                              form.is_active ? "bg-green-500" : "bg-gray-300"
                            }`}
                          >
                            <div
                              className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                                form.is_active
                                  ? "translate-x-6"
                                  : "translate-x-0"
                              }`}
                            />
                          </div>
                        </div>
                        <div className="flex-1">
                          <span className="font-semibold text-gray-700 block">
                            Active Status
                          </span>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {form.is_active
                              ? "Vendor is active and can be used"
                              : "Vendor is inactive and hidden"}
                          </p>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-gray-200"></div>

              {/* Section 3: Legal & Banking Information */}
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                    <FileText className="w-4 h-4 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Legal & Banking
                  </h3>
                </div>

                <div className="space-y-6">
                  {/* Legal Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className={labelClass}>Tax ID/TIN</label>
                      <input
                        type="text"
                        value={form.tax_id}
                        onChange={(e) =>
                          handleInputChange("tax_id", e.target.value)
                        }
                        className={inputClass}
                        placeholder="Enter tax identification number"
                      />
                    </div>

                    <div>
                      <label className={labelClass}>Registration Number</label>
                      <input
                        type="text"
                        value={form.registration_number}
                        onChange={(e) =>
                          handleInputChange(
                            "registration_number",
                            e.target.value,
                          )
                        }
                        className={inputClass}
                        placeholder="Enter registration number"
                      />
                    </div>
                  </div>

                  {/* Banking Information */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                      <CreditCard className="w-4 h-4" />
                      Bank Account Details
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className={labelClass}>Bank Name</label>
                        <input
                          type="text"
                          value={form.bank_name}
                          onChange={(e) =>
                            handleInputChange("bank_name", e.target.value)
                          }
                          className={inputClass}
                          placeholder="e.g., First Bank"
                        />
                      </div>

                      <div>
                        <label className={labelClass}>Account Number</label>
                        <input
                          type="text"
                          value={form.bank_account_number}
                          onChange={(e) =>
                            handleInputChange(
                              "bank_account_number",
                              e.target.value,
                            )
                          }
                          className={inputClass}
                          placeholder="1234567890"
                        />
                      </div>

                      <div>
                        <label className={labelClass}>Account Name</label>
                        <input
                          type="text"
                          value={form.bank_account_name}
                          onChange={(e) =>
                            handleInputChange(
                              "bank_account_name",
                              e.target.value,
                            )
                          }
                          className={inputClass}
                          placeholder="Vendor Company Name"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-gray-200"></div>

              {/* Section 4: Additional Information */}
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                    <FileText className="w-4 h-4 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Additional Information
                  </h3>
                </div>

                <div>
                  <label className={labelClass}>Notes</label>
                  <textarea
                    value={form.notes}
                    onChange={(e) => handleInputChange("notes", e.target.value)}
                    className={`${inputClass} resize-none`}
                    placeholder="Additional notes, special instructions, or remarks about this vendor..."
                    rows={4}
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Optional: Add any additional information about this vendor
                  </p>
                </div>
              </div>

              {/* Form Actions */}
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
                      Add Vendor
                    </>
                  )}
                </button>
              </div>
            </form>
          </CombinedModal>
        )}

        {/* Edit Vendor Modal */}
        {editModalOpen && selectedVendor && (
          <CombinedModal
            title={
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-50 rounded-xl flex items-center justify-center shadow-sm">
                  <Edit className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Edit Vendor
                  </h2>
                  <p className="text-gray-500 text-sm">
                    Update vendor information
                  </p>
                </div>
              </div>
            }
            onClose={handleEditModalClose}
          >
            <form onSubmit={handleEdit} className="space-y-8">
              {/* Basic Information Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="space-y-1">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Basic Information
                    </h3>
                    <p className="text-sm text-gray-500">
                      Vendor contact and identification
                    </p>
                  </div>

                  <div className="space-y-5">
                    <div>
                      <label className={labelClass}>
                        Vendor Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={form.vendor_name}
                        onChange={(e) =>
                          handleInputChange("vendor_name", e.target.value)
                        }
                        required
                        className={inputClass}
                        placeholder="Enter vendor name"
                      />
                    </div>

                    <div>
                      <label className={labelClass}>Contact Person</label>
                      <input
                        type="text"
                        value={form.contact_person}
                        onChange={(e) =>
                          handleInputChange("contact_person", e.target.value)
                        }
                        className={inputClass}
                        placeholder="Enter contact person name"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className={labelClass}>
                          Email <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="email"
                          value={form.email}
                          onChange={(e) =>
                            handleInputChange("email", e.target.value)
                          }
                          required
                          className={inputClass}
                          placeholder="email@company.com"
                        />
                      </div>

                      <div>
                        <label className={labelClass}>Phone Number</label>
                        <input
                          type="tel"
                          value={form.phone}
                          onChange={(e) =>
                            handleInputChange("phone", e.target.value)
                          }
                          className={inputClass}
                          placeholder="+234 800 000 0000"
                        />
                      </div>
                    </div>

                    <div>
                      <label className={labelClass}>Industry</label>
                      <select
                        value={form.industry}
                        onChange={(e) =>
                          handleInputChange("industry", e.target.value)
                        }
                        className={selectClass}
                      >
                        <option value="General">Select Industry</option>
                        <option value="Agriculture & Farming">
                          Agriculture & Farming
                        </option>
                        <option value="Automotive">Automotive</option>
                        <option value="Banking & Finance">
                          Banking & Finance
                        </option>
                        <option value="Beauty & Cosmetics">
                          Beauty & Cosmetics
                        </option>
                        <option value="Construction">Construction</option>
                        <option value="Consulting Services">
                          Consulting Services
                        </option>
                        <option value="Education">Education</option>
                        <option value="Electronics">Electronics</option>
                        <option value="Energy & Utilities">
                          Energy & Utilities
                        </option>
                        <option value="Engineering">Engineering</option>
                        <option value="Fashion & Apparel">
                          Fashion & Apparel
                        </option>
                        <option value="Food & Beverage">Food & Beverage</option>
                        <option value="Furniture">Furniture</option>
                        <option value="Healthcare">Healthcare</option>
                        <option value="Hospitality">Hospitality</option>
                        <option value="Information Technology">
                          Information Technology
                        </option>
                        <option value="Insurance">Insurance</option>
                        <option value="Legal Services">Legal Services</option>
                        <option value="Logistics & Transportation">
                          Logistics & Transportation
                        </option>
                        <option value="Manufacturing">Manufacturing</option>
                        <option value="Marketing & Advertising">
                          Marketing & Advertising
                        </option>
                        <option value="Media & Entertainment">
                          Media & Entertainment
                        </option>
                        <option value="Office Supplies">Office Supplies</option>
                        <option value="Pharmaceuticals">Pharmaceuticals</option>
                        <option value="Real Estate">Real Estate</option>
                        <option value="Retail">Retail</option>
                        <option value="Security Services">
                          Security Services
                        </option>
                        <option value="Telecommunications">
                          Telecommunications
                        </option>
                        <option value="Travel & Tourism">
                          Travel & Tourism
                        </option>
                        <option value="Waste Management">
                          Waste Management
                        </option>
                        <option value="Wholesale & Distribution">
                          Wholesale & Distribution
                        </option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Business & Location Section */}
                <div className="space-y-6">
                  <div className="space-y-1">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Business & Location
                    </h3>
                    <p className="text-sm text-gray-500">
                      Organizational details
                    </p>
                  </div>

                  <div className="space-y-5">
                    {/* <div>
                      <label className={labelClass}>
                        Business <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={form.business_key}
                        onChange={(e) =>
                          handleInputChange("business_key", e.target.value)
                        }
                        required
                        className={`${selectClass} bg-white`}
                      >
                        <option value="">Select Business</option>
                        {businesses.map((business) => (
                          <option
                            key={business.business_key}
                            value={business.business_key}
                          >
                            {business.business_name}
                          </option>
                        ))}
                      </select>
                    </div> */}

                    <div>
                      <label className={labelClass}>
                        Location <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={form.location_id}
                        onChange={(e) =>
                          handleInputChange(
                            "location_id",
                            Number(e.target.value),
                          )
                        }
                        required
                        className={`${selectClass} bg-white`}
                      >
                        <option value="0">Select Location</option>
                        {locations.map((location) => (
                          <option key={location.id} value={location.id}>
                            {location.location_name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className={labelClass}>Tax ID/TIN</label>
                        <input
                          type="text"
                          value={form.tax_id}
                          onChange={(e) =>
                            handleInputChange("tax_id", e.target.value)
                          }
                          className={inputClass}
                          placeholder="Tax identification number"
                        />
                      </div>

                      <div>
                        <label className={labelClass}>
                          Registration Number
                        </label>
                        <input
                          type="text"
                          value={form.registration_number}
                          onChange={(e) =>
                            handleInputChange(
                              "registration_number",
                              e.target.value,
                            )
                          }
                          className={inputClass}
                          placeholder="Registration number"
                        />
                      </div>
                    </div>

                    <div>
                      <label className={labelClass}>Website</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Globe className="h-4 w-4 text-gray-400" />
                        </div>
                        <input
                          type="url"
                          value={form.website}
                          onChange={(e) =>
                            handleInputChange("website", e.target.value)
                          }
                          className={`${inputClass} pl-10`}
                          placeholder="https://example.com"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Address Information Section */}
              <div className="space-y-6 p-6 bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-xl border border-gray-200">
                <div className="space-y-1">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Address Information
                  </h3>
                  <p className="text-sm text-gray-500">
                    Physical location details
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className={labelClass}>Address</label>
                    <input
                      type="text"
                      value={form.address}
                      onChange={(e) =>
                        handleInputChange("address", e.target.value)
                      }
                      className={inputClass}
                      placeholder="Enter street address"
                    />
                  </div>

                  <div>
                    <label className={labelClass}>City</label>
                    <input
                      type="text"
                      value={form.city}
                      onChange={(e) =>
                        handleInputChange("city", e.target.value)
                      }
                      className={inputClass}
                      placeholder="Enter city"
                    />
                  </div>

                  <div>
                    <label className={labelClass}>State</label>
                    <input
                      type="text"
                      value={form.state}
                      onChange={(e) =>
                        handleInputChange("state", e.target.value)
                      }
                      className={inputClass}
                      placeholder="Enter state"
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Postal Code</label>
                    <input
                      type="text"
                      value={form.postal_code}
                      onChange={(e) =>
                        handleInputChange("postal_code", e.target.value)
                      }
                      className={inputClass}
                      placeholder="Enter postal code"
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Country</label>
                    <select
                      value={form.country}
                      onChange={(e) =>
                        handleInputChange("country", e.target.value)
                      }
                      className={selectClass}
                    >
                      <option value="">Select country</option>
                      {countries.map((country) => (
                        <option key={country} value={country}>
                          {country}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Banking Information Section */}
              <div className="space-y-6 p-6 bg-gradient-to-br from-blue-50/50 to-blue-100/30 rounded-xl border border-blue-200">
                <div className="space-y-1">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Banking Information
                  </h3>
                  <p className="text-sm text-gray-500">
                    Financial account details
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className={labelClass}>Bank Name</label>
                    <input
                      type="text"
                      value={form.bank_name}
                      onChange={(e) =>
                        handleInputChange("bank_name", e.target.value)
                      }
                      className={inputClass}
                      placeholder="Enter bank name"
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Account Number</label>
                    <input
                      type="text"
                      value={form.bank_account_number}
                      onChange={(e) =>
                        handleInputChange("bank_account_number", e.target.value)
                      }
                      className={inputClass}
                      placeholder="Enter account number"
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Account Name</label>
                    <input
                      type="text"
                      value={form.bank_account_name}
                      onChange={(e) =>
                        handleInputChange("bank_account_name", e.target.value)
                      }
                      className={inputClass}
                      placeholder="Enter account name"
                    />
                  </div>
                </div>
              </div>

              {/* Notes & Status Section */}
              <div className="space-y-6">
                <div>
                  <label className={labelClass}>Notes</label>
                  <textarea
                    value={form.notes}
                    onChange={(e) => handleInputChange("notes", e.target.value)}
                    className={`${inputClass} resize-none min-h-[100px]`}
                    placeholder="Additional notes, terms, or special instructions..."
                    rows={3}
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Optional: Add any relevant information about this vendor
                  </p>
                </div>

                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100/50 rounded-lg border border-gray-200">
                  <div className="space-y-1">
                    <p className="font-semibold text-gray-900">Active Status</p>
                    <p className="text-sm text-gray-500">
                      {form.is_active
                        ? "Vendor is active and can be used in transactions"
                        : "Vendor is inactive and hidden from selection"}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      handleInputChange("is_active", !form.is_active)
                    }
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                      form.is_active ? "bg-green-500" : "bg-gray-300"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        form.is_active ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleEditModalClose}
                  className="px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:border-gray-400"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Updating Vendor...
                    </>
                  ) : (
                    <>
                      <CheckCircle size={16} />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          </CombinedModal>
        )}

        {/* Delete Confirmation Modal */}
        {deleteModalOpen && selectedVendor && (
          <CombinedModal title={null} onClose={handleDeleteModalClose}>
            <div className="max-w-md mx-auto rounded-2xl p-6 bg-white animate-fadeIn flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 flex items-center justify-center rounded-2xl bg-red-50 border border-red-200">
                <AlertTriangle className="w-7 h-7 text-red-600" />
              </div>

              <h2 className="text-xl font-bold text-gray-900">Delete Vendor</h2>
              <p className="text-gray-600 text-sm leading-relaxed">
                Are you sure you want to delete{" "}
                <span className="font-semibold text-gray-900">
                  {selectedVendor.vendor_name}
                </span>
                ? This action cannot be undone and all associated data will be
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

        {/* View Vendor Details Modal */}
        {viewModalOpen && selectedVendor && (
          <CombinedModal
            title={
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {selectedVendor.vendor_name}
                  </h2>
                  <p className="text-gray-500 text-sm">Vendor Details</p>
                </div>
              </div>
            }
            onClose={handleViewModalClose}
          >
            <div className="space-y-8">
              {/* Vendor Header with Status */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-semibold text-gray-900">
                      {selectedVendor.vendor_name}
                    </span>
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                        selectedVendor.is_active
                          ? "bg-green-100 text-green-800 border border-green-200"
                          : "bg-gray-100 text-gray-800 border border-gray-200"
                      }`}
                    >
                      {selectedVendor.is_active ? (
                        <>
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Active
                        </>
                      ) : (
                        <>
                          <XCircle className="h-3 w-3 mr-1" />
                          Inactive
                        </>
                      )}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Briefcase className="h-3 w-3" />
                    <span>
                      {selectedVendor.industry || "No industry specified"}
                    </span>
                  </div>
                </div>
                <div className="text-sm text-gray-500">
                  Vendor ID:{" "}
                  <span className="font-mono font-medium text-gray-700">
                    #Private
                  </span>
                </div>
              </div>

              {/* Main Content Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Contact Information Card */}
                <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-5">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                      <User className="h-4 w-4 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Contact Information
                    </h3>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Contact Person
                      </label>
                      <p className="text-gray-900 font-medium">
                        {selectedVendor.contact_person || (
                          <span className="text-gray-400 italic">
                            Not specified
                          </span>
                        )}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Email
                        </label>
                        <a
                          href={`mailto:${selectedVendor.email}`}
                          className="flex items-center gap-2 text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                        >
                          <Mail className="h-4 w-4" />
                          <span className="truncate">
                            {selectedVendor.email}
                          </span>
                        </a>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Phone
                        </label>
                        {selectedVendor.phone ? (
                          <a
                            href={`tel:${selectedVendor.phone}`}
                            className="flex items-center gap-2 text-gray-900 hover:text-blue-600 transition-colors"
                          >
                            <Phone className="h-4 w-4" />
                            <span>{selectedVendor.phone}</span>
                          </a>
                        ) : (
                          <p className="text-gray-400 italic">Not specified</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Business Information Card */}
                <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-5">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center">
                      <Building className="h-4 w-4 text-green-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Business Details
                    </h3>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Business
                        </label>
                        <div className="flex items-center gap-2">
                          <Building className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-900 font-medium">
                            {selectedVendor.business?.business_name ||
                              selectedVendor.business_key}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Location
                        </label>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-900 font-medium">
                            {selectedVendor.location?.location_name ||
                              "Not specified"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Website
                      </label>
                      {selectedVendor.website ? (
                        <a
                          href={
                            selectedVendor.website.startsWith("http")
                              ? selectedVendor.website
                              : `https://${selectedVendor.website}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                        >
                          <Globe className="h-4 w-4" />
                          <span className="truncate">
                            {selectedVendor.website}
                          </span>
                        </a>
                      ) : (
                        <p className="text-gray-400 italic">Not specified</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Address Information Card */}
                <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-5 md:col-span-1 lg:col-span-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center">
                      <MapPin className="h-4 w-4 text-purple-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Address Information
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[
                      { label: "Address", value: selectedVendor.address },
                      { label: "City", value: selectedVendor.city },
                      { label: "State", value: selectedVendor.state },
                      {
                        label: "Postal Code",
                        value: selectedVendor.postal_code,
                      },
                      { label: "Country", value: selectedVendor.country },
                    ].map((field, index) => (
                      <div key={index} className="space-y-2">
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {field.label}
                        </label>
                        <p className="text-gray-900 font-medium">
                          {field.value || (
                            <span className="text-gray-400 italic">
                              Not specified
                            </span>
                          )}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Banking Information Card */}
                <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-5">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-yellow-50 rounded-lg flex items-center justify-center">
                      <CreditCard className="h-4 w-4 text-yellow-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Banking Details
                    </h3>
                  </div>

                  <div className="space-y-4">
                    {[
                      { label: "Bank Name", value: selectedVendor.bank_name },
                      {
                        label: "Account Number",
                        value: selectedVendor.bank_account_number,
                      },
                      {
                        label: "Account Name",
                        value: selectedVendor.bank_account_name,
                      },
                    ].map((field, index) => (
                      <div key={index} className="space-y-2">
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {field.label}
                        </label>
                        <p
                          className={`text-gray-900 font-medium ${
                            field.value ? "" : "text-gray-400 italic"
                          }`}
                        >
                          {field.value || "Not specified"}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Legal Information Card */}
                <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-5">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center">
                      <FileText className="h-4 w-4 text-red-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Legal Information
                    </h3>
                  </div>

                  <div className="space-y-4">
                    {[
                      { label: "Tax ID/TIN", value: selectedVendor.tax_id },
                      {
                        label: "Registration Number",
                        value: selectedVendor.registration_number,
                      },
                    ].map((field, index) => (
                      <div key={index} className="space-y-2">
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {field.label}
                        </label>
                        <p
                          className={`text-gray-900 font-medium font-mono ${
                            field.value ? "" : "text-gray-400 italic"
                          }`}
                        >
                          {field.value || "Not specified"}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Notes & Timestamps Card */}
                <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-5">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center">
                      <FileText className="h-4 w-4 text-gray-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Additional Information
                    </h3>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Notes
                      </label>
                      <div className="bg-gray-50 rounded-lg p-4 min-h-[100px]">
                        <p className="text-gray-900 whitespace-pre-wrap">
                          {selectedVendor.notes || (
                            <span className="text-gray-400 italic">
                              No additional notes provided
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Created
                        </label>
                        <div className="flex items-center gap-2 text-gray-900">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span>
                            {new Date(
                              selectedVendor.created_at,
                            ).toLocaleDateString("en-US", {
                              weekday: "long",
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Last Updated
                        </label>
                        <div className="flex items-center gap-2 text-gray-900">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span>
                            {new Date(
                              selectedVendor.updated_at,
                            ).toLocaleDateString("en-US", {
                              weekday: "long",
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row justify-between gap-4 pt-6 border-t border-gray-200">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="font-medium">Last updated:</span>
                  <span>
                    {new Date(selectedVendor.updated_at).toLocaleDateString()}
                  </span>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleViewModalClose}
                    className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleViewModalClose();
                      prepareEditForm(selectedVendor);
                    }}
                    className="px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 inline-flex items-center gap-2 shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30"
                  >
                    <Edit size={16} />
                    Edit Vendor
                  </button>
                </div>
              </div>
            </div>
          </CombinedModal>
        )}
      </div>
    </div>
  );
};

export default withAuth(ManageVendors);

/**
 * Reusable Modal Component
 */
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
      className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto animate-scaleIn"
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
