"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Plus,
  Edit,
  Trash2,
  Search,
  MoreVertical,
  ArrowLeft,
  Phone,
  Mail,
  User,
  Loader2,
  MapPin,
  CreditCard,
  ShoppingBag,
  DollarSign,
  Filter,
  Download,
  RefreshCw,
  Eye,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  X,
  AlertTriangle,
  Calendar,
  Hash,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiGet, apiDelete } from "@/lib/axios";
import { toast } from "react-hot-toast";
import { withAuth } from "@/hoc/withAuth";
import ShortTextWithTooltip from "../component/shorten_len"; // make sure the path is correct

// Customer Types
interface Customer {
  id: number | string;
  customer_key: string;
  owner_id: number;
  business_key: string;
  location_id: number;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string;
  postal_code: string | null;
  customer_code: string;
  registration_date: string | null;
  total_purchases: number;
  outstanding_balance: number;
  is_active: boolean;
  loyalty_points: number;
  dob: string | null;
  gender: "male" | "female" | "other" | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// Delete Modal Component
const DeleteConfirmationModal = ({
  customer,
  isOpen,
  onClose,
  onConfirm,
  isSubmitting,
  currencySymbol,
}: {
  customer: Customer | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isSubmitting: boolean;
  currencySymbol: string;
}) => {
  if (!isOpen || !customer) return null;

  const getFullName = (customer: Customer) => {
    return `${customer.first_name} ${customer.last_name}`.trim();
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="bg-white rounded-2xl w-full max-w-md mx-auto overflow-hidden shadow-2xl animate-scaleIn"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    Delete Customer
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    This action cannot be undone
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                disabled={isSubmitting}
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>
          </div>

          {/* Modal Body */}
          <div className="p-6">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-800">Warning</p>
                  <p className="text-sm text-amber-700 mt-1">
                    Deleting this customer will permanently remove all
                    associated data including order history and transactions.
                  </p>
                </div>
              </div>
            </div>

            {/* Customer Info */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-50 rounded-lg flex items-center justify-center">
                  <User className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">
                    {getFullName(customer)}
                  </p>
                  <p className="text-sm text-gray-600 mt-0.5">
                    Customer Details
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2 p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Hash size={14} />
                    <span>Customer Code</span>
                  </div>
                  <p className="font-medium text-gray-900">
                    {customer.customer_code}
                  </p>
                </div>

                <div className="space-y-2 p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar size={14} />
                    <span>Member Since</span>
                  </div>
                  <p className="font-medium text-gray-900">
                    {formatDate(
                      customer.registration_date || customer.created_at
                    )}
                  </p>
                </div>
              </div>

              <div className="space-y-2 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Mail size={14} />
                  <span>Email</span>
                </div>
                <p className="font-medium text-gray-900">
                  {customer.email || "No email"}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2 p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <ShoppingBag size={14} />
                    <span>Total Purchases</span>
                  </div>
                  <p className="font-medium text-gray-900">
                    {currencySymbol}
                    {Number(customer.total_purchases).toLocaleString()}
                  </p>
                </div>

                <div className="space-y-2 p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <CreditCard size={14} />
                    <span>Outstanding Balance</span>
                  </div>
                  <p className="font-medium text-gray-900">
                    {currencySymbol}
                    {Number(customer.outstanding_balance).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="p-6 border-t border-gray-200 bg-gray-50/50 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={isSubmitting}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white font-medium rounded-xl hover:from-red-700 hover:to-red-800 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 size={16} />
                  Delete Customer
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

const ManageCustomers = ({ user }) => {
  // Get user currency symbol from backend
  const userCurrencySymbol = user?.businesses_one?.[0]?.currency || "$";

  // Delete Modal State
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    customer: Customer | null;
  }>({
    isOpen: false,
    customer: null,
  });

  // State for search functionality
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // State to track which row's action menu is open
  const [openRow, setOpenRow] = useState<string | null>(null);

  // Loading and error states
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Customers data state
  const [customers, setCustomers] = useState<Customer[]>([]);

  // Track if we should bypass cache
  const [forceRefresh, setForceRefresh] = useState(false);

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const router = useRouter();

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setCurrentPage(1); // Reset to first page when search changes
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  // Effect to reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, typeFilter]);

  // Fetch customers on component mount or when forceRefresh changes
  useEffect(() => {
    if (!user) return;
    fetchCustomers();
  }, [user, forceRefresh]);

  // API call to fetch all customers using in-memory cache
  const fetchCustomers = async () => {
    setIsLoading(true);

    try {
      const res = await apiGet("/customers", {}, !forceRefresh);
      const customersArray =
        res.data?.data?.customers ??
        res.data?.data ??
        res.data?.customers ??
        [];

      setCustomers(Array.isArray(customersArray) ? customersArray : []);

      if (forceRefresh) {
        setForceRefresh(false);
      }
    } catch (err: any) {
      const errorMessage = "Failed to fetch customers";
      toast.error(errorMessage);
      setCustomers([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Force refresh customers (bypass cache)
  const handleForceRefresh = () => {
    setForceRefresh(true);
  };

  // Open delete confirmation modal
  const handleOpenDeleteModal = (customer: Customer) => {
    setDeleteModal({
      isOpen: true,
      customer,
    });
    setOpenRow(null); // Close any open action menu
  };

  // Close delete confirmation modal
  const handleCloseDeleteModal = () => {
    setDeleteModal({
      isOpen: false,
      customer: null,
    });
  };



  // Handle customer deletion=====================
  const handleDelete = async (customerKey: string) => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      // OPTIMISTIC UPDATE
      setCustomers((prevCustomers) =>
        prevCustomers.filter(
          (customer) => customer.customer_key !== customerKey
        )
      );
      await apiDelete(`/customers/${customerKey}`, {}, ["/customers"]);
      toast.success("Customer deleted successfully!");
      handleCloseDeleteModal();
    } catch (err: any) {
      // Revert optimistic update on error
      setForceRefresh(true);
      const errorMessage =
        err.userMessage ||
        err.response?.data?.message ||
        "Failed to delete customer";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter customers based on search query and filters
  const filteredCustomers = useMemo(() => {
    return customers.filter((customer) => {
      if (!customer) return false;

      const searchableText = [
        customer.first_name || "",
        customer.last_name || "",
        customer.email || "",
        customer.phone || "",
        customer.customer_code || "",
        customer.address || "",
        customer.city || "",
        customer.state || "",
        customer.country || "",
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch = searchableText.includes(
        debouncedSearch.toLowerCase()
      );

      const matchesType =
        typeFilter === "all" ||
        (typeFilter === "individual" ? customer.gender !== null : true);

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" ? customer.is_active : !customer.is_active);

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [customers, debouncedSearch, typeFilter, statusFilter]);

  // Pagination calculations
  const totalItems = filteredCustomers.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);

  // Get current page items
  const currentItems = useMemo(() => {
    return filteredCustomers.slice(startIndex, endIndex);
  }, [filteredCustomers, startIndex, endIndex]);

  // Generate page numbers for pagination
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

  // Handle page navigation
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      const tableContainer = document.querySelector(".overflow-x-auto");
      if (tableContainer) {
        tableContainer.scrollTop = 0;
      }
    }
  };

  // Handle items per page change
  const handleItemsPerPageChange = (value: number) => {
    setItemsPerPage(value);
    setCurrentPage(1);
  };

  // Get type badge color
  const getTypeBadgeColor = (customer: Customer) => {
    if (customer.gender) {
      switch (customer.gender) {
        case "male":
          return "bg-blue-50 text-blue-700 border border-blue-200";
        case "female":
          return "bg-pink-50 text-pink-700 border border-pink-200";
        case "other":
          return "bg-purple-50 text-purple-700 border border-purple-200";
      }
    }
    return "bg-gray-50 text-gray-700 border border-gray-200";
  };

  // Get status badge color
  const getStatusBadgeColor = (isActive: boolean) => {
    return isActive
      ? "bg-green-50 text-green-700 border border-green-200"
      : "bg-gray-50 text-gray-700 border border-gray-200";
  };

  const getFullName = (customer: Customer) => {
    return `${customer.first_name || ""} ${customer.last_name || ""}`.trim();
  };

  // Generate a unique key for each row
  const getRowKey = (customer: Customer, index: number) => {
    return customer.customer_key
      ? `customer-${customer.customer_key}`
      : `customer-${customer.email}-${index}`;
  };

  return (
    <div className="min-h-screen bg-gray-50/30">
      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        customer={deleteModal.customer}
        isOpen={deleteModal.isOpen}
        onClose={handleCloseDeleteModal}
        onConfirm={() =>
          deleteModal.customer &&
          handleDelete(deleteModal.customer.customer_key)
        }
        isSubmitting={isSubmitting}
        currencySymbol={userCurrencySymbol}
      />

      {/* Combined Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 py-6">
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
                <div className="h-6 w-px bg-gray-300 hidden sm:block"></div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Manage Customers
                </h1>
              </div>
              <p className="text-gray-600 text-sm">
                Manage customer accounts and their information
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleForceRefresh}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors group relative"
                title="Refresh (Clears cache and fetches fresh data)"
                disabled={isLoading || isSubmitting}
              >
                <RefreshCw
                  size={18}
                  className={`group-hover:rotate-180 transition-transform ${
                    isLoading ? "animate-spin" : ""
                  }`}
                />
                {isLoading && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full animate-ping"></span>
                )}
              </button>
              <button
                className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-colors font-medium text-sm"
                onClick={() => {
                  toast.success("Export feature coming soon!");
                }}
              >
                <Download size={16} />
                Export
              </button>
              <Link
                href="/addcustomers"
                className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-5 py-2.5 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-medium shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30"
              >
                <Plus size={18} />
                Add Customer
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="max-w-8xl mx-auto px-4 sm:px-6 py-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
          {/* Total Customers Card */}
          <div className="bg-white p-4 sm:p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-600 truncate">
                  Total Customers
                </p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1 truncate">
                  {customers.length}
                </p>
                <div className="mt-2 sm:mt-3 flex items-center">
                  <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
                    +5% from last month
                  </span>
                </div>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-50 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0 ml-4">
                <User className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
              </div>
            </div>
          </div>

          {/* Active Customers Card */}
          <div className="bg-white p-4 sm:p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-600 truncate">
                  Active Customers
                </p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1 truncate">
                  {customers.filter((c) => c.is_active).length}
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  {customers.length > 0
                    ? `${Math.round(
                        (customers.filter((c) => c.is_active).length /
                          customers.length) *
                          100
                      )}% of total`
                    : "0%"}
                </p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-50 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0 ml-4">
                <ShoppingBag className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
              </div>
            </div>
          </div>

          {/* Total Purchases Card */}
          <div className="bg-white p-4 sm:p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-600 truncate">
                  Total Purchases
                </p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1 truncate">
                  {userCurrencySymbol}
                  {customers
                    .reduce((sum, customer) => {
                      const value = Number(customer.total_purchases);
                      return sum + (Number.isFinite(value) ? value : 0);
                    }, 0)
                    .toLocaleString(undefined, {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    })}
                </p>
                <div className="mt-2 sm:mt-3 flex items-center">
                  <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                    +12% from last month
                  </span>
                </div>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-50 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0 ml-4">
                <DollarSign className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
              </div>
            </div>
          </div>

          {/* Outstanding Balance Card */}
          <div className="bg-white p-4 sm:p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-600 truncate">
                  Outstanding Balance
                </p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1 truncate">
                  {userCurrencySymbol}
                  {customers
                    .reduce((sum, customer) => {
                      const value = Number(customer.outstanding_balance);
                      return sum + (Number.isFinite(value) ? value : 0);
                    }, 0)
                    .toLocaleString(undefined, {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    })}
                </p>
                <div className="mt-2 sm:mt-3 flex items-center">
                  <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
                    Needs attention
                  </span>
                </div>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-amber-50 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0 ml-4">
                <CreditCard className="h-5 w-5 sm:h-6 sm:w-6 text-amber-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Card */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {/* Search and Filters */}
          <div className="px-4 sm:px-6 py-5 border-b border-gray-200 bg-gray-50/50">
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
                    placeholder="Search customers by name, email, phone, customer code..."
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition placeholder-gray-500 text-sm hover:border-gray-400"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition hover:border-gray-400"
                  >
                    <option value="all">All Types</option>
                    <option value="individual">Individual</option>
                    <option value="business">Business</option>
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
                    : `Showing ${startIndex + 1}-${endIndex} of ${totalItems} customer${
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
                <p className="text-gray-600 font-medium">
                  Loading customers...
                </p>
                <p className="text-gray-400 text-sm mt-1">
                  Please wait a moment
                </p>
              </div>
            </div>
          )}

          {/* Customers Table */}
          {!isLoading && (
            <>
              <div className="relative">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-gray-600 text-left border-b border-gray-200">
                      <tr>
                        <th className="px-4 sm:px-6 py-4 font-semibold text-xs uppercase tracking-wider whitespace-nowrap w-12 text-center">
                          S.No
                        </th>
                        <th className="px-4 sm:px-6 py-4 font-semibold text-xs uppercase tracking-wider whitespace-nowrap text-gray-500">
                          Customer
                        </th>
                        <th className="px-4 sm:px-6 py-4 font-semibold text-xs uppercase tracking-wider whitespace-nowrap text-gray-500 hidden lg:table-cell">
                          Contact
                        </th>
                        <th className="px-4 sm:px-6 py-4 font-semibold text-xs uppercase tracking-wider whitespace-nowrap text-gray-500 hidden md:table-cell">
                          Location
                        </th>
                        <th className="px-4 sm:px-6 py-4 font-semibold text-xs uppercase tracking-wider whitespace-nowrap text-gray-500">
                          Type
                        </th>
                        <th className="px-4 sm:px-6 py-4 font-semibold text-xs uppercase tracking-wider whitespace-nowrap text-gray-500 hidden xl:table-cell">
                          Purchases
                        </th>
                        <th className="px-4 sm:px-6 py-4 font-semibold text-xs uppercase tracking-wider whitespace-nowrap text-gray-500">
                          Status
                        </th>
                        <th className="px-4 sm:px-6 py-4 text-center font-semibold text-xs uppercase tracking-wider whitespace-nowrap text-gray-500 w-12">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {currentItems.length > 0 ? (
                        currentItems.map((customer, index) => {
                          const rowKey = getRowKey(customer, index);
                          const isOpen = openRow === rowKey;
                          const globalIndex = startIndex + index;

                          return (
                            <tr
                              key={rowKey}
                              className="hover:bg-gray-50/50 transition-colors group"
                            >
                              <td className="px-4 sm:px-6 py-4 text-center">
                                <span className="text-sm font-medium text-gray-500">
                                  {globalIndex + 1}
                                </span>
                              </td>
                              <td className="px-4 sm:px-6 py-4 min-w-[200px]">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-50 rounded-xl flex items-center justify-center flex-shrink-0 border border-blue-200/50">
                                    <User className="h-5 w-5 text-blue-600" />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                                      <ShortTextWithTooltip
                                        text={getFullName(customer)}
                                        max={25}
                                      />
                                    </div>
                                    <div className="text-xs text-gray-500 truncate mt-0.5">
                                      <ShortTextWithTooltip
                                        text={`Code: ${customer.customer_code}`}
                                        max={20}
                                      />
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 sm:px-6 py-4 min-w-[150px] whitespace-nowrap hidden lg:table-cell">
                                <div className="space-y-1">
                                  {customer.email && (
                                    <div className="flex items-center gap-2 text-gray-600">
                                      <Mail className="h-3 w-3 text-gray-400 flex-shrink-0" />
                                      <span className="text-xs truncate">
                                        <ShortTextWithTooltip
                                          text={customer.email}
                                          max={25}
                                        />
                                      </span>
                                    </div>
                                  )}
                                  {customer.phone && (
                                    <div className="flex items-center gap-2 text-gray-600">
                                      <Phone className="h-3 w-3 text-gray-400 flex-shrink-0" />
                                      <span className="text-xs">
                                        {customer.phone}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 sm:px-6 py-4 whitespace-nowrap hidden md:table-cell">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2 text-gray-600">
                                    <MapPin className="h-3 w-3 text-gray-400 flex-shrink-0" />
                                    <span className="text-xs">
                                      <ShortTextWithTooltip
                                        text={customer.city}
                                        max={20}
                                      />
                                    </span>
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    <ShortTextWithTooltip
                                      text={customer.state}
                                      max={20}
                                    />
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 sm:px-6 py-4 min-w-[100px] whitespace-nowrap">
                                <span
                                  className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold ${getTypeBadgeColor(
                                    customer
                                  )}`}
                                >
                                  {customer.gender
                                    ? customer.gender.charAt(0).toUpperCase() +
                                      customer.gender.slice(1)
                                    : "Individual"}
                                </span>
                              </td>
                              <td className="px-4 sm:px-6 py-4 whitespace-nowrap hidden xl:table-cell">
                                <div className="space-y-1">
                                  <div className="text-sm font-medium text-gray-900">
                                    {userCurrencySymbol}
                                    {Number(
                                      customer.total_purchases
                                    ).toLocaleString()}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    Balance: {userCurrencySymbol}
                                    {Number(
                                      customer.outstanding_balance
                                    ).toLocaleString()}
                                  </div>
                                </div>
                              </td>

                              <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                                <span
                                  className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold ${getStatusBadgeColor(
                                    customer.is_active
                                  )}`}
                                >
                                  {customer.is_active ? "Active" : "Inactive"}
                                </span>
                              </td>
                              <td className="px-4 sm:px-6 py-4 text-center relative whitespace-nowrap">
                                <div className="relative inline-block">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setOpenRow(isOpen ? null : rowKey);
                                    }}
                                    className="p-2 rounded-lg hover:bg-gray-100 transition text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed group/action relative"
                                    disabled={isSubmitting}
                                  >
                                    <MoreVertical
                                      size={18}
                                      className="group-hover/action:scale-110 transition-transform"
                                    />
                                  </button>

                                  {/* Dropdown Menu */}
                                  {isOpen && (
                                    <>
                                      <div
                                        className="fixed inset-0 z-10"
                                        onClick={() => setOpenRow(null)}
                                      />
                                      <div className="absolute right-6 z-40 w-48 bg-white border border-gray-200 rounded-xl shadow-lg shadow-gray-200/50 animate-fadeIn backdrop-blur-sm">
                                        <Link
                                          href={`/viewcustomer/${customer.customer_key}`}
                                        >
                                          <button
                                            onClick={() => setOpenRow(null)}
                                            className="flex items-center gap-3 w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition first:rounded-t-xl last:rounded-b-xl disabled:opacity-50 disabled:cursor-not-allowed border-b border-gray-100"
                                          >
                                            <Eye className="h-4 w-4 text-blue-600" />
                                            View Profile
                                          </button>
                                        </Link>
                                        <Link
                                          href={`/editcustomers/${customer.customer_key}`}
                                        >
                                          <button
                                            onClick={() => setOpenRow(null)}
                                            className="flex items-center gap-3 w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition first:rounded-t-xl last:rounded-b-xl disabled:opacity-50 disabled:cursor-not-allowed border-b border-gray-100"
                                            disabled={isSubmitting}
                                          >
                                            <Edit
                                              size={16}
                                              className="text-blue-600"
                                            />
                                            Edit Customer
                                          </button>
                                        </Link>
                                        <Link
                                          href={`/customers/${customer.customer_key}/orders`}
                                        >
                                          <button
                                            onClick={() => setOpenRow(null)}
                                            className="flex items-center gap-3 w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition first:rounded-t-xl last:rounded-b-xl disabled:opacity-50 disabled:cursor-not-allowed border-b border-gray-100"
                                          >
                                            <ShoppingBag
                                              size={16}
                                              className="text-blue-600"
                                            />
                                            View Orders
                                          </button>
                                        </Link>
                                        <button
                                          onClick={() =>
                                            handleOpenDeleteModal(customer)
                                          }
                                          className="flex items-center gap-3 w-full px-4 py-3 text-sm text-gray-700 hover:bg-red-50 transition first:rounded-t-xl last:rounded-b-xl disabled:opacity-50 disabled:cursor-not-allowed"
                                          disabled={isSubmitting}
                                        >
                                          <Trash2
                                            size={16}
                                            className="text-red-600"
                                          />
                                          Delete Customer
                                        </button>
                                      </div>
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={8} className="text-center py-16">
                            <div className="flex flex-col items-center gap-4 max-w-sm mx-auto">
                              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center">
                                <User size={24} className="text-gray-400" />
                              </div>
                              <div className="space-y-2">
                                <p className="text-gray-900 font-semibold text-lg">
                                  {debouncedSearch
                                    ? "No customers found"
                                    : "No customers available"}
                                </p>
                                <p className="text-gray-500 text-sm">
                                  {debouncedSearch
                                    ? "Try adjusting your search terms or filters"
                                    : "Get started by adding your first customer to the system"}
                                </p>
                              </div>
                              {!debouncedSearch && (
                                <Link
                                  href="/addcustomers/"
                                  className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-5 py-2.5 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all font-medium mt-2"
                                >
                                  <Plus size={16} />
                                  Add Customer
                                </Link>
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
                <div className="px-4 sm:px-6 py-4 border-t border-gray-200 bg-gray-50/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
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
      </div>
    </div>
  );
};

export default withAuth(ManageCustomers);