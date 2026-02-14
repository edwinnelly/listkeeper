"use client"; // This directive marks this component as a Client Component in Next.js App Router
// Client Components enable the use of React hooks, browser APIs, and interactive features

import { withAuth } from "@/hoc/withAuth"; // Higher Order Component for authentication protection
import { apiGet, apiPut } from "@/lib/axios"; // Custom HTTP client methods for GET and PUT requests
import { apiPost } from "@/lib/axios"; // Custom HTTP client method for POST requests
import React, { useState, useEffect, useMemo } from "react"; // React hooks for state management, side effects, and memoization
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
  MoreHorizontal,
  Folder,
  FolderOpen,
  Tag,
  Grid,
  List,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react"; // Icon library for UI components
import Link from "next/link"; // Next.js component for client-side navigation
import { useRouter } from "next/navigation"; // Next.js hook for programmatic navigation
import api from "@/lib/axios"; // API client instance
import Cookies from "js-cookie"; // Library for client-side cookie management
import { toast } from "react-hot-toast"; // Toast notification library for user feedback

// TypeScript interfaces for type safety
interface ProductCategory {
  id: number; // Unique identifier for the category
  owner_id: number; // ID of the user who owns this category
  business_key: string; // Business identifier
  name: string; // Category name
  slug: string; // URL-friendly version of the name
  description: string | null; // Optional description of the category
  is_active: boolean; // Whether the category is active or inactive
  created_at: string; // ISO timestamp when category was created
  updated_at: string; // ISO timestamp when category was last updated
  owner?: {
    id: number; // Owner user ID
    name: string; // Owner name
    email: string; // Owner email
  };
  business?: {
    business_key: string; // Business key
    business_name: string; // Business display name
  };
}

interface CategoryFormData {
  name: string; // Category name for form
  description: string; // Category description for form
  is_active: boolean; // Active status for form
}

interface Business {
  business_key: string; // Unique business identifier
  business_name: string; // Business display name
}

const ManageProductCategories = () => {
  // Search and Filter States
  const [search, setSearch] = useState(""); // Real-time search input value
  const [debouncedSearch, setDebouncedSearch] = useState(""); // Debounced search value (300ms delay)
  const [statusFilter, setStatusFilter] = useState<string>("all"); // Filter by active/inactive status
  const [businessFilter, setBusinessFilter] = useState<string>("all"); // Filter by business

  // UI Interaction States
  const [openRow, setOpenRow] = useState<number | null>(null); // Tracks which row's action menu is open

  // Modal States
  const [modalOpen, setModalOpen] = useState(false); // Controls visibility of Add Category modal
  const [editModalOpen, setEditModalOpen] = useState(false); // Controls visibility of Edit Category modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false); // Controls visibility of Delete Confirmation modal

  // Selected Item State
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | null>(null); // Currently selected category for edit/delete operations

  // Loading States
  const [isLoading, setIsLoading] = useState(true); // Indicates if data is being fetched
  const [isSubmitting, setIsSubmitting] = useState(false); // Indicates if form submission is in progress

  // Data States
  const [categories, setCategories] = useState<ProductCategory[]>([]); // List of all product categories
  const [businesses, setBusinesses] = useState<Business[]>([]); // List of all businesses

  // Form State
  const [form, setForm] = useState<CategoryFormData>({
    name: "",
    description: "",
    is_active: true, // Default to active status
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
    setCurrentPage(1); // Reset to first page when status or business filter changes
  }, [statusFilter, businessFilter]);

  // Effect to fetch data on component mount
  useEffect(() => {
    fetchCategories(); // Fetch categories when component mounts
  }, []);

  /**
   * Fetches all product categories from the API
   */
  const fetchCategories = async () => {
    setIsLoading(true); // Set loading state
    try {
      const res = await apiGet("/product-categories"); // API call to get categories

      // Normalize API response to ensure it's always an array
      // Handles different API response structures
      const categoriesArray =
        res.data?.data?.product_categories ??
        res.data?.data ??
        res.data?.product_categories ??
        res.data?.categories ??
        [];

      setCategories(Array.isArray(categoriesArray) ? categoriesArray : []); // Set categories state
    } catch (err: any) {
      // Handle API errors
      toast.error(
        err.response?.status === 403
          ? "You don't have permission to access product categories"
          : "Failed to fetch categories"
      );
      setCategories([]); // Set empty array on error
    } finally {
      setIsLoading(false); // Reset loading state
    }
  };

  /**
   * Filters categories based on search query and active filters
   * Uses useMemo to prevent unnecessary recalculations
   */
  const filteredCategories = useMemo(() => {
    return categories.filter((category) => {
      if (!category) return false; // Skip null categories

      // Combine multiple fields into searchable text
      const searchableText = [
        category.name || "",
        category.description || "",
        category.slug || "",
        category.business?.business_name || "",
      ]
        .join(" ")
        .toLowerCase();

      // Check if category matches search term
      const matchesSearch = searchableText.includes(
        debouncedSearch.toLowerCase()
      );

      // Check if category matches status filter
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && category.is_active) ||
        (statusFilter === "inactive" && !category.is_active);

      // Check if category matches business filter
      const matchesBusiness =
        businessFilter === "all" || category.business_key === businessFilter;

      return matchesSearch && matchesStatus && matchesBusiness; // All conditions must be true
    });
  }, [categories, debouncedSearch, statusFilter, businessFilter]);

  // Pagination calculations
  const totalItems = filteredCategories.length; // Total number of filtered items
  const totalPages = Math.ceil(totalItems / itemsPerPage); // Total number of pages
  const startIndex = (currentPage - 1) * itemsPerPage; // Starting index for current page
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems); // Ending index for current page

  /**
   * Gets the current page's items
   * Uses useMemo to prevent unnecessary slicing
   */
  const currentItems = useMemo(() => {
    return filteredCategories.slice(startIndex, endIndex); // Slice array for current page
  }, [filteredCategories, startIndex, endIndex]);

  /**
   * Generates an array of page numbers for pagination
   * Includes ellipsis for large page ranges
   */
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxVisiblePages = 5; // Maximum number of page buttons to show

    if (totalPages <= maxVisiblePages) {
      // Show all pages if total is less than max visible
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      // Always show first page
      pageNumbers.push(1);

      // Calculate start and end of visible page range
      let startPage = Math.max(2, currentPage - 1);
      let endPage = Math.min(totalPages - 1, currentPage + 1);

      // Adjust range if near the start
      if (currentPage <= 3) {
        endPage = Math.min(4, totalPages - 1);
      }

      // Adjust range if near the end
      if (currentPage >= totalPages - 2) {
        startPage = Math.max(totalPages - 3, 2);
      }

      // Add ellipsis after first page if needed
      if (startPage > 2) {
        pageNumbers.push("...");
      }

      // Add middle pages
      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i);
      }

      // Add ellipsis before last page if needed
      if (endPage < totalPages - 1) {
        pageNumbers.push("...");
      }

      // Always show last page if there is more than one page
      if (totalPages > 1) {
        pageNumbers.push(totalPages);
      }
    }

    return pageNumbers;
  };

  /**
   * Handles page navigation
   * @param page - The page number to navigate to
   */
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page); // Update current page
      // Scroll to top of table
      const tableContainer = document.querySelector(".overflow-x-auto");
      if (tableContainer) {
        tableContainer.scrollTop = 0;
      }
    }
  };

  /**
   * Handles items per page change
   * @param value - Number of items to display per page
   */
  const handleItemsPerPageChange = (value: number) => {
    setItemsPerPage(value); // Update items per page
    setCurrentPage(1); // Reset to first page
  };

  /**
   * Validates form data before submission
   * @param formData - The form data to validate
   * @returns Array of error messages
   */
  const validateForm = (formData: CategoryFormData): string[] => {
    const errors: string[] = [];
    
    // Name validation
    if (!formData.name.trim()) errors.push("Category name is required");
    if (formData.name.length < 2)
      errors.push("Category name must be at least 2 characters");
    if (formData.name.length > 100)
      errors.push("Category name must be less than 100 characters");
    
    // Description validation (optional but has max length)
    if (formData.description && formData.description.length > 150) {
      errors.push("Description must be less than 500 characters");
    }
    
    return errors;
  };

  /**
   * Handles form submission for creating a new category
   * Uses optimistic UI updates for better user experience
   */
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return; // Prevent multiple submissions

    const errors = validateForm(form);
    if (errors.length > 0) {
      errors.forEach((error) => toast.error(error)); // Show all validation errors
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        name: form.name,
        description: form.description,
        is_active: form.is_active,
      };

      // OPTIMISTIC UPDATE: Create temporary ID for immediate UI update
      const tempId = -Math.abs(Date.now()); // Use negative timestamp as temporary ID
      
      // Create temporary category object for optimistic update
      const optimisticCategory = {
        id: tempId,
        owner_id: 0, // Placeholder
        business_key: "temp", // Placeholder
        name: form.name,
        slug: form.name.toLowerCase().replace(/\s+/g, '-'), // Generate slug from name
        description: form.description,
        is_active: form.is_active,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        owner: { id: 0, name: "", email: "" },
        business: { business_key: "temp", business_name: "Temporary" }
      };
      
      // Add to UI immediately for better UX
      setCategories(prev => [optimisticCategory, ...prev]);

      // Make API call to create category
      const response = await apiPost("/add_categories", payload, {}, ["/categories"]);
      
      // Replace temporary category with actual data from server response
      if (response.data?.data) {
        const actualCategory = response.data.data;
        setCategories(prev => 
          prev.map(cat => 
            cat.id === tempId ? actualCategory : cat // Replace temp with actual
          )
        );
      } else {
        // If no data returned, refresh the list
        fetchCategories();
      }

      toast.success("Category created successfully");
      setModalOpen(false); // Close modal
      
      // Reset form
      setForm({
        name: "",
        description: "",
        is_active: true,
      });
    } catch (err: any) {
      const status = err.response?.status;
      
      // Remove the optimistic update on error
      setCategories(prev => prev.filter(cat => cat.id !== tempId));
      
      // Handle specific error cases
      if (status === 403) {
        toast.error("You do not have permission to perform this action.");
      } else if (status === 422) {
        toast.error("Failed to create category.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Handles form submission for editing an existing category
   * Uses optimistic UI updates for better user experience
   */
  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || !selectedCategory) return;

    const validationErrors = validateForm(form);
    if (validationErrors.length) {
      validationErrors.forEach((msg) => toast.error(msg));
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        name: form.name,
        description: form.description,
        is_active: form.is_active,
      };

      // Make API call to update category
      await apiPut(
        `/updateCategory/${selectedCategory.id}`,
        payload,
        { _method: "PUT" }, // Method override for Laravel compatibility
        ["/categories"] // Cache tags for invalidation
      );

      toast.success("Category updated successfully");
      
      // OPTIMISTIC UPDATE: Update UI immediately
      setCategories(prevCategories => 
        prevCategories.map(category => 
          category.id === selectedCategory.id 
            ? { 
                ...category, 
                name: form.name,
                description: form.description,
                is_active: form.is_active,
                updated_at: new Date().toISOString() // Update timestamp
              }
            : category
        )
      );
      
      setEditModalOpen(false); // Close modal
      
    } catch (err: any) {
      toast.error("Failed to update category");
      
      // Revert optimistic update if there's an error
      fetchCategories(); // Fall back to fetching fresh data
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Handles category deletion
   * Uses optimistic UI updates for better user experience
   */
  const handleDelete = async () => {
    if (isSubmitting || !selectedCategory) return;

    setIsSubmitting(true);

    try {
      // OPTIMISTIC UPDATE: Remove from UI immediately
      setCategories(prevCategories => 
        prevCategories.filter(category => category.id !== selectedCategory.id)
      );
      
      // Make API call to delete category
      await api.delete(`/delete-categories/${selectedCategory.id}`);

      toast.success("Category deleted successfully!");
      setDeleteModalOpen(false); // Close modal
      setSelectedCategory(null); // Clear selection
      
    } catch (err: any) {
      toast.error("Failed to delete category");
      
      // Revert optimistic update if there's an error
      fetchCategories(); // Fetch fresh data to restore
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Handles form input changes
   * @param field - The form field to update
   * @param value - The new value for the field
   */
  const handleInputChange = (field: keyof CategoryFormData, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  // Modal close handlers
  const handleModalClose = () => {
    if (!isSubmitting) {
      setModalOpen(false);
      setForm({
        name: "",
        description: "",
        is_active: true,
      });
    }
  };

  const handleEditModalClose = () => {
    if (!isSubmitting) {
      setEditModalOpen(false);
      setSelectedCategory(null);
    }
  };

  const handleDeleteModalClose = () => {
    if (!isSubmitting) {
      setDeleteModalOpen(false);
      setSelectedCategory(null);
    }
  };

  /**
   * Returns CSS classes for status badges based on active state
   * @param isActive - Whether the category is active
   * @returns Tailwind CSS class string
   */
  const getStatusBadgeColor = (isActive: boolean) => {
    return isActive
      ? "bg-green-50 text-green-700 border border-green-200" // Active style
      : "bg-gray-50 text-gray-700 border border-gray-200"; // Inactive style
  };

  // Reusable CSS classes for form inputs
  const inputClass =
    "w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200 placeholder-gray-500 text-sm hover:border-gray-400";
  const labelClass = "block text-sm font-semibold text-gray-700 mb-2";

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
                <h1 className="text-2xl font-normal text-gray-900">
                  Product Categories
                </h1>
              </div>
              <p className="text-gray-600 text-sm">
                Manage product categories for your inventory
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <button
                onClick={fetchCategories}
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
                Add Category
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards Section */}
      <div className="max-w-8xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Categories Card */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Categories
                </p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {categories.length}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                <Folder className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          {/* Active Categories Card */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Active Categories
                </p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {categories.filter((c) => c.is_active).length}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
                <FolderOpen className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          {/* Inactive Categories Card */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Inactive Categories
                </p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {categories.filter((c) => !c.is_active).length}
                </p>
              </div>
              <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center">
                <Folder className="h-6 w-6 text-gray-600" />
              </div>
            </div>
          </div>

          {/* Unique Businesses Card */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Unique Businesses
                </p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {
                    Array.from(new Set(categories.map((c) => c.business_key)))
                      .length
                  }
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center">
                <Grid className="h-6 w-6 text-purple-600" />
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
                    placeholder="Search categories by name, description..."
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

                  {/* Business filter commented out for now */}
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
                      }-${endIndex} of ${totalItems} categor${
                        totalItems !== 1 ? "ies" : "y"
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
                  Loading categories...
                </p>
                <p className="text-gray-400 text-sm mt-1">
                  Please wait a moment
                </p>
              </div>
            </div>
          )}

          {/* Categories Table Section */}
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
                          Category
                        </th>
                        <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider whitespace-nowrap text-gray-500 hidden md:table-cell">
                          Description
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
                        currentItems.map((category, index) => (
                          <tr
                            key={category.id}
                            className="hover:bg-gray-50/50 transition-colors group"
                          >
                            {/* Serial Number */}
                            <td className="px-6 py-4 text-center">
                              <span className="text-sm font-medium text-gray-500">
                                {startIndex + index + 1}
                              </span>
                            </td>
                            
                            {/* Category Name and Icon */}
                            <td className="px-6 py-4 min-w-[200px]">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-50 rounded-xl flex items-center justify-center flex-shrink-0 border border-blue-200/50">
                                  <Folder className="h-5 w-5 text-blue-600" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                                    {category.name}
                                  </div>
                                  <div className="text-xs text-gray-500 truncate mt-0.5">
                                    {category.slug}
                                  </div>
                                </div>
                              </div>
                            </td>
                            
                            {/* Description (hidden on mobile) */}
                            <td className="px-6 py-4 min-w-[150px] hidden md:table-cell">
                              <div className="text-gray-600 text-sm line-clamp-2">
                                {category.description || "No description"}
                              </div>
                            </td>
                            
                            {/* Status Badge */}
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold ${getStatusBadgeColor(
                                  category.is_active
                                )}`}
                              >
                                {category.is_active ? (
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
                              {new Date(
                                category.created_at
                              ).toLocaleDateString()}
                            </td>
                            
                            {/* Action Menu */}
                            <td className="px-6 py-4 text-center relative whitespace-nowrap">
                              <button
                                onClick={() =>
                                  setOpenRow(
                                    openRow === category.id ? null : category.id
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
                              {openRow === category.id && (
                                <>
                                  {/* Overlay to close menu on click outside */}
                                  <div
                                    className="fixed inset-0 z-10"
                                    onClick={() => setOpenRow(null)}
                                  />
                                  <div className="absolute right-6 z-40 w-48 bg-white border border-gray-200 rounded-xl shadow-lg shadow-gray-200/50 animate-fadeIn backdrop-blur-sm">
                                    <button
                                      onClick={() => {
                                        setSelectedCategory(category);
                                        setForm({
                                          name: category.name,
                                          description:
                                            category.description || "",
                                          is_active: category.is_active,
                                        });
                                        setEditModalOpen(true);
                                        setOpenRow(null);
                                      }}
                                      className="flex items-center gap-3 w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition first:rounded-t-xl last:rounded-b-xl disabled:opacity-50 disabled:cursor-not-allowed border-b border-gray-100"
                                      disabled={isSubmitting}
                                    >
                                      <Edit
                                        size={16}
                                        className="text-blue-600"
                                      />
                                      Edit Category
                                    </button>

                                    <button
                                      onClick={() => {
                                        setSelectedCategory(category);
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
                                      Delete Category
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
                                <Folder size={24} className="text-gray-400" />
                              </div>
                              <div className="space-y-2">
                                <p className="text-gray-900 font-semibold text-lg">
                                  {debouncedSearch
                                    ? "No categories found"
                                    : "No categories available"}
                                </p>
                                <p className="text-gray-500 text-sm">
                                  {debouncedSearch
                                    ? "Try adjusting your search terms or filters"
                                    : "Get started by adding your first product category"}
                                </p>
                              </div>
                              {!debouncedSearch && (
                                <button
                                  onClick={() => setModalOpen(true)}
                                  className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-5 py-2.5 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all font-medium mt-2"
                                >
                                  <Plus size={16} />
                                  Add Category
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
                  {/* Items Per Page Selector */}
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
                    {/* First Page Button */}
                    <button
                      onClick={() => handlePageChange(1)}
                      disabled={currentPage === 1}
                      className="p-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      aria-label="First page"
                    >
                      <ChevronsLeft size={16} />
                    </button>

                    {/* Previous Page Button */}
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="p-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      aria-label="Previous page"
                    >
                      <ChevronLeft size={16} />
                    </button>

                    {/* Page Number Buttons */}
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

                    {/* Next Page Button */}
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="p-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      aria-label="Next page"
                    >
                      <ChevronRight size={16} />
                    </button>

                    {/* Last Page Button */}
                    <button
                      onClick={() => handlePageChange(totalPages)}
                      disabled={currentPage === totalPages}
                      className="p-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      aria-label="Last page"
                    >
                      <ChevronsRight size={16} />
                    </button>
                  </div>

                  {/* Page Info */}
                  <div className="text-sm text-gray-600">
                    Page <span className="font-semibold">{currentPage}</span> of{" "}
                    <span className="font-semibold">{totalPages}</span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Add Category Modal */}
        {modalOpen && (
          <CombinedModal
            title={
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Plus className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Add New Category
                  </h2>
                  <p className="text-gray-500 text-sm">
                    Create a new product category
                  </p>
                </div>
              </div>
            }
            onClose={handleModalClose}
          >
            <form onSubmit={handleSave} className="space-y-6">
              <CategoryForm
                form={form}
                handleInputChange={handleInputChange}
                inputClass={inputClass}
                labelClass={labelClass}
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
                      Add Category
                    </>
                  )}
                </button>
              </div>
            </form>
          </CombinedModal>
        )}

        {/* Edit Category Modal */}
        {editModalOpen && selectedCategory && (
          <CombinedModal
            title={
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Edit className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Edit Category
                  </h2>
                  <p className="text-gray-500 text-sm">
                    Update category information
                  </p>
                </div>
              </div>
            }
            onClose={handleEditModalClose}
          >
            <form onSubmit={handleEdit} className="space-y-6">
              <CategoryForm
                form={form}
                handleInputChange={handleInputChange}
                inputClass={inputClass}
                labelClass={labelClass}
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
                      Update Category
                    </>
                  )}
                </button>
              </div>
            </form>
          </CombinedModal>
        )}

        {/* Delete Confirmation Modal */}
        {deleteModalOpen && selectedCategory && (
          <CombinedModal title={null} onClose={handleDeleteModalClose}>
            <div className="max-w-md mx-auto rounded-2xl p-6 bg-white animate-fadeIn flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 flex items-center justify-center rounded-2xl bg-red-50 border border-red-200">
                <AlertTriangle className="w-7 h-7 text-red-600" />
              </div>

              <h2 className="text-xl font-bold text-gray-900">
                Delete Category
              </h2>
              <p className="text-gray-600 text-sm leading-relaxed">
                Are you sure you want to delete{" "}
                <span className="font-semibold text-gray-900">
                  {selectedCategory.name}
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
      </div>
    </div>
  );
};

export default ManageProductCategories;

/**
 * Reusable Modal Component
 * Used for Add, Edit, and Delete modals
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
      className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto animate-scaleIn"
      onClick={(e) => e.stopPropagation()} // Prevent click events from bubbling to overlay
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

/**
 * Reusable Category Form Component
 * Used in both Add and Edit modals
 */
const CategoryForm = ({
  form,
  handleInputChange,
  inputClass,
  labelClass,
}: {
  form: CategoryFormData;
  handleInputChange: (field: keyof CategoryFormData, value: any) => void;
  inputClass: string;
  labelClass: string;
}) => (
  <div className="space-y-6">
    {/* Category Name Field */}
    <div>
      <label className={labelClass}>
        Category Name <span className="text-red-500">*</span>
      </label>
      <input
        type="text"
        value={form.name}
        onChange={(e) => handleInputChange("name", e.target.value)}
        required
        className={inputClass}
        placeholder="Enter category name"
      />
      <p className="text-xs text-gray-500 mt-1">
        Unique category name (2-100 characters)
      </p>
    </div>

    {/* Description Field */}
    <div>
      <label className={labelClass}>Description</label>
      <textarea
        value={form.description}
        onChange={(e) => handleInputChange("description", e.target.value)}
        className={`${inputClass} resize-none`}
        placeholder="Enter category description (optional)"
        rows={4}
      />
      <p className="text-xs text-gray-500 mt-1">Maximum 500 characters</p>
    </div>

    {/* Active Status Toggle */}
    <div>
      <label className="flex items-center space-x-3 cursor-pointer">
        <div className="relative">
          <input
            type="checkbox"
            checked={form.is_active}
            onChange={(e) => handleInputChange("is_active", e.target.checked)}
            className="sr-only" // Screen reader only
          />
          <div
            className={`w-12 h-6 flex items-center rounded-full p-1 transition-all ${
              form.is_active ? "bg-green-500" : "bg-gray-300"
            }`}
          >
            <div
              className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                form.is_active ? "translate-x-6" : "translate-x-0"
              }`}
            />
          </div>
        </div>
        <div>
          <span className="font-semibold text-gray-700">Active Status</span>
          <p className="text-xs text-gray-500">
            {form.is_active
              ? "Category is visible and active"
              : "Category is hidden and inactive"}
          </p>
        </div>
      </label>
    </div>
  </div>
);