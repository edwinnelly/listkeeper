"use client";
import { apiGet, apiPut } from "@/lib/axios";
import { apiPost } from "@/lib/axios";
import React, { useState, useEffect, useMemo } from "react";
import {
  Plus,
  Edit,
  Trash2,
  Search,
  MoreHorizontal,
  X,
  AlertTriangle,
  ArrowLeft,
  Loader2,
  Filter,
  RefreshCw,
  Folder,
  FolderOpen,
  Grid,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  FilterX,
  SlidersHorizontal,
} from "lucide-react";
import Link from "next/link";
import api from "@/lib/axios";
import { toast } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

// TypeScript interfaces
interface ProductCategory {
  id: number;
  owner_id: number;
  business_key: string;
  name: string;
  slug: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  owner?: {
    id: number;
    name: string;
    email: string;
  };
  business?: {
    business_key: string;
    business_name: string;
  };
}

interface CategoryFormData {
  name: string;
  description: string;
  is_active: boolean;
}

interface Business {
  business_key: string;
  business_name: string;
}

interface ApiResponse {
  data?: {
    data?: {
      product_categories?: ProductCategory[];
    };
    product_categories?: ProductCategory[];
    categories?: ProductCategory[];
  };
  product_categories?: ProductCategory[];
  categories?: ProductCategory[];
}

// Utility: Debounce Hook
const useDebounce = <T,>(value: T, delay: number): T => {
  const [dv, setDv] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDv(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return dv;
};

// Utility: Format Date
const formatDate = (d: string | null) =>
  !d
    ? "—"
    : new Date(d).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });

// StatusBadge Component
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

// StatCard Component
const StatCard: React.FC<{
  title: string;
  value: string | number;
  icon: React.ElementType;
  accent: string;
}> = ({ title, value, icon: Icon, accent }) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4 flex items-center gap-4">
    <div
      className={`w-10 h-10 ${accent} rounded-xl flex items-center justify-center flex-shrink-0`}
    >
      <Icon className="h-4.5 w-4.5 text-white" />
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5 truncate">
        {title}
      </p>
      <p className="text-xl font-bold text-gray-900 leading-none">{value}</p>
    </div>
  </div>
);

// EmptyState Component
const EmptyState: React.FC<{
  title: string;
  description: string;
  icon: React.ElementType;
  action?: { label: string; onClick?: () => void };
}> = ({ title, description, icon: Icon, action }) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-20">
    <div className="flex flex-col items-center text-center max-w-sm mx-auto">
      <div className="w-16 h-16 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-center mb-5">
        <Icon className="h-8 w-8 text-gray-300" />
      </div>
      <h3 className="text-base font-bold text-gray-800 mb-1.5">{title}</h3>
      <p className="text-sm text-gray-400 mb-6 leading-relaxed">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white text-sm font-bold rounded-xl hover:bg-gray-800 transition-all shadow-lg shadow-gray-900/15"
        >
          <Plus className="h-4 w-4" />
          {action.label}
        </button>
      )}
    </div>
  </div>
);

// LoadingState Component
const LoadingState: React.FC = () => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-20 flex flex-col items-center">
    <div className="relative w-14 h-14 mb-5">
      <div className="w-14 h-14 rounded-full border-[3px] border-gray-100" />
      <div className="absolute inset-0 rounded-full border-[3px] border-gray-900 border-t-transparent animate-spin" />
      <Folder className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
    </div>
    <p className="text-sm font-semibold text-gray-700">Loading categories</p>
    <p className="text-xs text-gray-400 mt-1">Please wait a moment</p>
  </div>
);

// Pagination Component
const Pagination: React.FC<{
  currentPage: number;
  totalPages: number;
  totalItems: number;
  startIndex: number;
  endIndex: number;
  itemsPerPage: number;
  onPageChange: (p: number) => void;
  onItemsPerPageChange: (n: number) => void;
}> = ({
  currentPage,
  totalPages,
  totalItems,
  startIndex,
  endIndex,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
}) => {
  const pages: (number | string)[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    let s = Math.max(2, currentPage - 2),
      e = Math.min(totalPages - 1, currentPage + 2);
    if (currentPage <= 4) {
      s = 2;
      e = 5;
    }
    if (currentPage >= totalPages - 3) {
      s = totalPages - 4;
      e = totalPages - 1;
    }
    if (s > 2) pages.push("...");
    for (let i = s; i <= e; i++) pages.push(i);
    if (e < totalPages - 1) pages.push("...");
    if (totalPages > 1) pages.push(totalPages);
  }
  if (totalPages <= 1) return null;

  const Btn: React.FC<{
    onClick: () => void;
    disabled: boolean;
    children: React.ReactNode;
  }> = ({ onClick, disabled, children }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 disabled:opacity-30 transition-colors"
    >
      {children}
    </button>
  );

  return (
    <div className="px-6 py-4 border-t border-gray-100 bg-stone-50/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 font-medium">Rows</span>
          <select
            value={itemsPerPage}
            onChange={(e) => {
              onItemsPerPageChange(Number(e.target.value));
              onPageChange(1);
            }}
            className="px-2 py-1.5 text-xs border border-gray-200 rounded-lg bg-white outline-none font-semibold focus:border-gray-400"
          >
            {[10, 25, 50, 100].map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </div>
        <span className="text-xs text-gray-400">
          {totalItems > 0 ? startIndex + 1 : 0}–{endIndex} of {totalItems}
        </span>
      </div>
      <div className="flex items-center gap-1">
        <Btn onClick={() => onPageChange(1)} disabled={currentPage === 1}>
          <ChevronsLeft className="h-3.5 w-3.5" />
        </Btn>
        <Btn
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </Btn>
        <div className="flex items-center gap-1 mx-1">
          {pages.map((p, i) => (
            <React.Fragment key={i}>
              {p === "..." ? (
                <span className="w-8 h-8 flex items-center justify-center text-gray-400 text-xs">
                  …
                </span>
              ) : (
                <button
                  onClick={() => onPageChange(p as number)}
                  className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                    currentPage === p
                      ? "bg-gray-900 text-white shadow-sm"
                      : "text-gray-600 hover:bg-gray-100 border border-gray-200"
                  }`}
                >
                  {p}
                </button>
              )}
            </React.Fragment>
          ))}
        </div>
        <Btn
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </Btn>
        <Btn
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
        >
          <ChevronsRight className="h-3.5 w-3.5" />
        </Btn>
      </div>
    </div>
  );
};

// ActionMenu Component
const ActionMenu: React.FC<{
  category: ProductCategory;
  onEdit: (c: ProductCategory) => void;
  onDelete: (c: ProductCategory) => void;
}> = ({ category, onEdit, onDelete }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>
      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -4 }}
              transition={{ duration: 0.1 }}
              className="absolute right-0 top-10 z-40 w-44 bg-white border border-gray-100 rounded-xl shadow-xl shadow-gray-900/10 overflow-hidden"
            >
              <button
                onClick={() => {
                  onEdit(category);
                  setOpen(false);
                }}
                className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
              >
                <Edit className="h-3.5 w-3.5 text-gray-400" /> Edit Category
              </button>
              <div className="h-px bg-gray-100 mx-2" />
              <button
                onClick={() => {
                  onDelete(category);
                  setOpen(false);
                }}
                className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm font-medium text-rose-600 hover:bg-rose-50 transition"
              >
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

// DeleteModal Component
const DeleteModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  categoryName: string;
  isSubmitting: boolean;
}> = ({ isOpen, onClose, onConfirm, categoryName, isSubmitting }) => (
  <AnimatePresence>
    {isOpen && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-sm"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6 text-center">
            <div className="w-14 h-14 bg-rose-50 border border-rose-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6 text-rose-500" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 mb-1.5">
              Delete Category
            </h2>
            <p className="text-sm text-gray-500 leading-relaxed mb-6">
              Are you sure you want to delete{" "}
              <span className="font-bold text-gray-800">"{categoryName}"</span>?
              This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-50 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2.5 rounded-xl bg-rose-600 text-white text-sm font-semibold hover:bg-rose-700 transition disabled:opacity-50 inline-flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

// CategoryModal Component
const CategoryModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
}> = ({ isOpen, onClose, title, icon: Icon, children }) => (
  <AnimatePresence>
    {isOpen && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center">
                <Icon className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">{title}</h2>
                <p className="text-xs text-gray-400">
                  {title.includes("Add") ? "Create a new" : "Update"} category
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
          <div className="p-6">{children}</div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

// CategoryForm Component
const CategoryForm: React.FC<{
  form: CategoryFormData;
  handleInputChange: (
    field: keyof CategoryFormData,
    value: string | boolean
  ) => void;
}> = ({ form, handleInputChange }) => {
  const inputClass =
    "w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 outline-none transition text-gray-700 placeholder-gray-300";
  const labelClass = "text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block";

  return (
    <div className="space-y-5">
      <div>
        <label className={labelClass}>
          Category Name <span className="text-rose-500">*</span>
        </label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => handleInputChange("name", e.target.value)}
          required
          className={inputClass}
          placeholder="Enter category name"
        />
        <p className="text-xs text-gray-400 mt-1.5">2-100 characters</p>
      </div>

      <div>
        <label className={labelClass}>Description</label>
        <textarea
          value={form.description}
          onChange={(e) => handleInputChange("description", e.target.value)}
          className={`${inputClass} resize-none`}
          placeholder="Enter category description (optional)"
          rows={4}
        />
        <p className="text-xs text-gray-400 mt-1.5">Maximum 500 characters</p>
      </div>

      <div>
        <label className="flex items-center space-x-3 cursor-pointer">
          <div className="relative">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => handleInputChange("is_active", e.target.checked)}
              className="sr-only"
            />
            <div
              className={`w-11 h-6 flex items-center rounded-full p-0.5 transition-all duration-200 ${
                form.is_active ? "bg-gray-900" : "bg-gray-200"
              }`}
            >
              <motion.div
                className="bg-white w-5 h-5 rounded-full shadow-sm"
                animate={{ x: form.is_active ? 20 : 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            </div>
          </div>
          <div>
            <span className="text-sm font-semibold text-gray-700">
              Active Status
            </span>
            <p className="text-xs text-gray-400">
              {form.is_active
                ? "Category is visible and active"
                : "Category is hidden and inactive"}
            </p>
          </div>
        </label>
      </div>
    </div>
  );
};

// Main Component
const ManageProductCategories = () => {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [businessFilter] = useState<string>("all");

  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const [selectedCategory, setSelectedCategory] =
    useState<ProductCategory | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [businesses] = useState<Business[]>([]);

  const [form, setForm] = useState<CategoryFormData>({
    name: "",
    description: "",
    is_active: true,
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, statusFilter]);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      const res = (await apiGet("/product-categories")) as ApiResponse;
      const categoriesArray =
        res.data?.data?.product_categories ??
        res.data?.data ??
        res.data?.product_categories ??
        res.data?.categories ??
        [];
      setCategories(Array.isArray(categoriesArray) ? categoriesArray : []);
    } catch (err) {
      const error = err as { response?: { status?: number } };
      toast.error(
        error.response?.status === 403
          ? "You don't have permission to access product categories"
          : "Failed to fetch categories"
      );
      setCategories([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredCategories = useMemo(() => {
    return categories.filter((category) => {
      if (!category) return false;
      const searchableText = [
        category.name || "",
        category.description || "",
        category.slug || "",
        category.business?.business_name || "",
      ]
        .join(" ")
        .toLowerCase();
      const matchesSearch = searchableText.includes(
        debouncedSearch.toLowerCase()
      );
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && category.is_active) ||
        (statusFilter === "inactive" && !category.is_active);
      const matchesBusiness =
        businessFilter === "all" || category.business_key === businessFilter;
      return matchesSearch && matchesStatus && matchesBusiness;
    });
  }, [categories, debouncedSearch, statusFilter, businessFilter]);

  const totalItems = filteredCategories.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const currentItems = useMemo(() => {
    return filteredCategories.slice(startIndex, endIndex);
  }, [filteredCategories, startIndex, endIndex]);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleItemsPerPageChange = (value: number) => {
    setItemsPerPage(value);
    setCurrentPage(1);
  };

  const validateForm = (formData: CategoryFormData): string[] => {
    const errors: string[] = [];
    if (!formData.name.trim()) errors.push("Category name is required");
    if (formData.name.length < 2)
      errors.push("Category name must be at least 2 characters");
    if (formData.name.length > 100)
      errors.push("Category name must be less than 100 characters");
    if (formData.description && formData.description.length > 500) {
      errors.push("Description must be less than 500 characters");
    }
    return errors;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const errors = validateForm(form);
    if (errors.length > 0) {
      errors.forEach((error) => toast.error(error));
      return;
    }

    setIsSubmitting(true);
    const tempId = -Math.abs(Date.now());

    try {
      const payload = {
        name: form.name,
        description: form.description,
        is_active: form.is_active,
      };

      const optimisticCategory: ProductCategory = {
        id: tempId,
        owner_id: 0,
        business_key: "temp",
        name: form.name,
        slug: form.name.toLowerCase().replace(/\s+/g, "-"),
        description: form.description,
        is_active: form.is_active,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        owner: { id: 0, name: "", email: "" },
        business: { business_key: "temp", business_name: "Temporary" },
      };

      setCategories((prev) => [optimisticCategory, ...prev]);

      const response = await apiPost("/add_categories", payload, {}, [
        "/categories",
      ]);

      if (response.data?.data) {
        const actualCategory = response.data.data;
        setCategories((prev) =>
          prev.map((cat) => (cat.id === tempId ? actualCategory : cat))
        );
      } else {
        fetchCategories();
      }

      toast.success("Category created successfully");
      setModalOpen(false);
      setForm({ name: "", description: "", is_active: true });
    } catch (err) {
      const error = err as { response?: { status?: number } };
      const status = error.response?.status;
      setCategories((prev) => prev.filter((cat) => cat.id !== tempId));
      if (status === 403) {
        toast.error("You do not have permission to perform this action.");
      } else if (status === 422) {
        toast.error("Failed to create category.");
      } else {
        toast.error("An error occurred while creating the category.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

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

      await apiPut(
        `/updateCategory/${selectedCategory.id}`,
        payload,
        { _method: "PUT" },
        ["/categories"]
      );

      toast.success("Category updated successfully");

      setCategories((prevCategories) =>
        prevCategories.map((category) =>
          category.id === selectedCategory.id
            ? {
                ...category,
                name: form.name,
                description: form.description,
                is_active: form.is_active,
                updated_at: new Date().toISOString(),
              }
            : category
        )
      );

      setEditModalOpen(false);
      setSelectedCategory(null);
    } catch {
      toast.error("Failed to update category");
      fetchCategories();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (isSubmitting || !selectedCategory) return;

    setIsSubmitting(true);

    try {
      setCategories((prevCategories) =>
        prevCategories.filter(
          (category) => category.id !== selectedCategory.id
        )
      );

      await api.delete(`/delete-categories/${selectedCategory.id}`);

      toast.success("Category deleted successfully!");
      setDeleteModalOpen(false);
      setSelectedCategory(null);
    } catch {
      toast.error("Failed to delete category");
      fetchCategories();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (
    field: keyof CategoryFormData,
    value: string | boolean
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleModalClose = () => {
    if (!isSubmitting) {
      setModalOpen(false);
      setForm({ name: "", description: "", is_active: true });
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

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setCurrentPage(1);
  };

  const activeFilterCount = useMemo(() => {
    let c = 0;
    if (statusFilter !== "all") c++;
    if (search) c++;
    return c;
  }, [statusFilter, search]);

  const stats = useMemo(
    () => ({
      total: categories.length,
      active: categories.filter((c) => c.is_active).length,
      inactive: categories.filter((c) => !c.is_active).length,
      businesses: Array.from(new Set(categories.map((c) => c.business_key)))
        .length,
    }),
    [categories]
  );

  return (
    <div className="min-h-screen bg-[#f5f5f4]">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 top-0 z-40">
        <div className="max-w-screen-2xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-800 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <h1 className="text-lg font-bold text-gray-900 tracking-tight">
                Product Categories
              </h1>
              <p className="text-xs text-gray-400">
                Manage product categories for your inventory
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchCategories}
              className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
            <button
              onClick={() => setModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white text-sm font-bold rounded-xl hover:bg-gray-800 transition-all shadow-md shadow-gray-900/15"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Add Category</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-screen-2xl mx-auto px-6 py-6">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
          <StatCard
            title="Total Categories"
            value={stats.total}
            icon={Folder}
            accent="bg-gray-900"
          />
          <StatCard
            title="Active"
            value={stats.active}
            icon={CheckCircle}
            accent="bg-emerald-600"
          />
          <StatCard
            title="Inactive"
            value={stats.inactive}
            icon={XCircle}
            accent="bg-amber-500"
          />
          <StatCard
            title="Businesses"
            value={stats.businesses}
            icon={Grid}
            accent="bg-blue-600"
          />
        </div>

        {/* Search + Filter Bar */}
        <div className="flex gap-3 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search categories by name, description..."
              className="w-full pl-11 pr-11 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 outline-none transition text-sm placeholder-gray-300 shadow-sm font-medium"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded-full bg-gray-200 text-gray-500 hover:bg-gray-300 transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 shadow-sm"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        {/* Status Chips */}
        <div className="flex items-center gap-2 mb-5 overflow-x-auto pb-1">
          {[
            { label: "All", s: "all" as const },
            { label: "Active", s: "active" as const },
            { label: "Inactive", s: "inactive" as const },
          ].map(({ label, s }) => {
            const active = statusFilter === s;
            return (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`flex-shrink-0 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all border ${
                  active
                    ? "bg-gray-900 text-white border-gray-900 shadow-sm"
                    : "bg-white text-gray-500 border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                {label}
              </button>
            );
          })}
          {activeFilterCount > 0 && (
            <button
              onClick={clearFilters}
              className="flex-shrink-0 ml-auto flex items-center gap-1 text-xs font-bold text-gray-700 hover:underline"
            >
              <FilterX className="h-3.5 w-3.5" /> Clear
            </button>
          )}
        </div>

        {/* Result count */}
        <p className="text-xs text-gray-400 mb-4 font-medium">
          Showing{" "}
          <span className="text-gray-700 font-bold">
            {totalItems > 0 ? startIndex + 1 : 0}–{endIndex}
          </span>{" "}
          of <span className="text-gray-700 font-bold">{totalItems}</span>{" "}
          categories
        </p>

        {/* Content */}
        {isLoading ? (
          <LoadingState />
        ) : currentItems.length === 0 ? (
          <EmptyState
            title={
              search || activeFilterCount > 0
                ? "No categories found"
                : "No categories available"
            }
            description={
              search || activeFilterCount > 0
                ? "Try adjusting your search or filters."
                : "Get started by adding your first product category."
            }
            icon={Folder}
            action={
              search || activeFilterCount > 0
                ? { label: "Clear Filters", onClick: clearFilters }
                : { label: "Add Category", onClick: () => setModalOpen(true) }
            }
          />
        ) : (
          <>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      {[
                        "#",
                        "Category",
                        "Description",
                        "Status",
                        "Created",
                        "",
                      ].map((h, i) => (
                        <th
                          key={i}
                          className={`px-5 py-3.5 text-[10px] font-bold uppercase tracking-widest text-gray-400 bg-stone-50/70 ${
                            h === "" ? "text-right" : "text-left"
                          }`}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {currentItems.map((category, index) => (
                      <tr
                        key={category.id}
                        className="hover:bg-[#1e3a5f]/[0.015] transition-colors group border-b border-gray-100 last:border-0"
                      >
                        <td className="px-5 py-3.5 text-xs text-gray-400 font-medium tabular-nums">
                          {startIndex + index + 1}
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-center flex-shrink-0">
                              <Folder className="h-4 w-4 text-gray-300" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-gray-900 truncate">
                                {category.name}
                              </p>
                              <p className="text-xs text-gray-400 truncate">
                                {category.slug}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 hidden md:table-cell">
                          <span className="text-sm text-gray-600 line-clamp-2">
                            {category.description || "—"}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <StatusBadge isActive={category.is_active} />
                        </td>
                        <td className="px-5 py-3.5 text-sm text-gray-600">
                          {formatDate(category.created_at)}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <ActionMenu
                            category={category}
                            onEdit={(c) => {
                              setSelectedCategory(c);
                              setForm({
                                name: c.name,
                                description: c.description || "",
                                is_active: c.is_active,
                              });
                              setEditModalOpen(true);
                            }}
                            onDelete={(c) => {
                              setSelectedCategory(c);
                              setDeleteModalOpen(true);
                            }}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalItems}
                startIndex={startIndex}
                endIndex={endIndex}
                itemsPerPage={itemsPerPage}
                onPageChange={handlePageChange}
                onItemsPerPageChange={handleItemsPerPageChange}
              />
            </div>
          </>
        )}
      </main>

      {/* Add Category Modal */}
      <CategoryModal
        isOpen={modalOpen}
        onClose={handleModalClose}
        title="Add New Category"
        icon={Plus}
      >
        <form onSubmit={handleSave} className="space-y-5">
          <CategoryForm form={form} handleInputChange={handleInputChange} />
          <div className="flex gap-3 pt-5 border-t border-gray-100">
            <button
              type="button"
              onClick={handleModalClose}
              className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-50 transition disabled:opacity-50"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-bold hover:bg-gray-800 transition disabled:opacity-50 inline-flex items-center justify-center gap-2 shadow-md shadow-gray-900/15"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Add Category
                </>
              )}
            </button>
          </div>
        </form>
      </CategoryModal>

      {/* Edit Category Modal */}
      <CategoryModal
        isOpen={editModalOpen}
        onClose={handleEditModalClose}
        title="Edit Category"
        icon={Edit}
      >
        <form onSubmit={handleEdit} className="space-y-5">
          <CategoryForm form={form} handleInputChange={handleInputChange} />
          <div className="flex gap-3 pt-5 border-t border-gray-100">
            <button
              type="button"
              onClick={handleEditModalClose}
              className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-50 transition disabled:opacity-50"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-bold hover:bg-gray-800 transition disabled:opacity-50 inline-flex items-center justify-center gap-2 shadow-md shadow-gray-900/15"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Edit className="h-4 w-4" />
                  Update Category
                </>
              )}
            </button>
          </div>
        </form>
      </CategoryModal>

      {/* Delete Confirmation Modal */}
      <DeleteModal
        isOpen={deleteModalOpen}
        onClose={handleDeleteModalClose}
        onConfirm={handleDelete}
        categoryName={selectedCategory?.name || ""}
        isSubmitting={isSubmitting}
      />
    </div>
  );
};

export default ManageProductCategories;