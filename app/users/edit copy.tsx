"use client";
import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
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
import { apiGet, apiPost, apiDelete } from "@/lib/axios";

// ============================================================================
// TYPES & CONSTANTS
// ============================================================================

type UserRole =
  | "admin"
  | "manager"
  | "staff"
  | "user"
  | "Inventory Clerk"
  | "Salesperson"
  | "Purchasing Officer"
  | "Accountant"
  | "Viewer / Auditor";

type UserStatus = "active" | "inactive" | "suspended" | "pending";

interface User {
  id: number;
  name: string;
  email: string;
  address: string;
  phone_number: string;
  is_active: boolean;
  phone: string | null;
  role: UserRole;
  status: UserStatus;
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
  role: UserRole;
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

interface ApiResponse<T> {
  data?: T;
  success?: boolean;
  message?: string;
}

// Constants
const ROLES: { value: UserRole; label: string }[] = [
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

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
];
const MAX_IMAGE_SIZE = 2 * 1024 * 1024; // 2MB
const DEBOUNCE_DELAY = 300;

const INPUT_CLASS =
  "w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200 placeholder-gray-500 text-sm hover:border-gray-400";
const LABEL_CLASS = "block text-sm font-semibold text-gray-700 mb-2";

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const validateEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const validateImageFile = (file: File): string | null => {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return "Please upload a JPEG, PNG, AVIF, or WEBP image.";
  }
  if (file.size > MAX_IMAGE_SIZE) {
    return "Image must be smaller than 2MB.";
  }
  return null;
};

const getRoleBadgeColor = (role: string): string => {
  const colorMap: Record<string, string> = {
    admin: "bg-purple-50 text-purple-700 border border-purple-200",
    manager: "bg-blue-50 text-blue-700 border border-blue-200",
    staff: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    "Inventory Clerk": "bg-orange-50 text-orange-700 border border-orange-200",
    Salesperson: "bg-cyan-50 text-cyan-700 border border-cyan-200",
    "Purchasing Officer":
      "bg-indigo-50 text-indigo-700 border border-indigo-200",
    Accountant: "bg-pink-50 text-pink-700 border border-pink-200",
    "Viewer / Auditor": "bg-teal-50 text-teal-700 border border-teal-200",
  };
  return colorMap[role] || "bg-gray-50 text-gray-700 border border-gray-200";
};

const getStatusBadgeColor = (status: string): string => {
  const colorMap: Record<string, string> = {
    active: "bg-green-50 text-green-700 border border-green-200",
    inactive: "bg-gray-50 text-gray-700 border border-gray-200",
    suspended: "bg-red-50 text-red-700 border border-red-200",
    pending: "bg-amber-50 text-amber-700 border border-amber-200",
  };
  return colorMap[status] || "bg-gray-50 text-gray-700 border border-gray-200";
};

// ============================================================================
// CUSTOM HOOKS
// ============================================================================

const useDebounce = <T,>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
};

export const useUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Use apiGet wrapper - it handles CSRF and caching automatically
      const res = await apiGet("/users", {}, true); // true enables caching
      
      // Normalize API response to always be an array (matching your working pattern)
      const usersArray =
        res?.data?.data?.users ??
        res?.data?.data ??
        res?.data?.users ??
        res?.data ??
        [];

      const normalizedUsers = Array.isArray(usersArray) ? usersArray : [];
      
      setUsers(normalizedUsers);
    } catch (err: any) {
      // Use userMessage from interceptor if available
      const errorMessage = err.userMessage || err.response?.data?.message || "Failed to fetch users";
      
      console.error("Failed to fetch users:", err);
      setError(errorMessage);
      toast.error(errorMessage);
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { users, isLoading, error, fetchUsers, setUsers };
};


export const useLocations = () => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchLocations = useCallback(async () => {
    setIsLoading(true);
    try {
      // Use apiGet wrapper - it handles CSRF and caching automatically
      const res = await apiGet("/locations", {}, true); // true enables caching

      // Normalize API response to always be an array (matching your working pattern)
      const locationsArray =
        res?.data?.data?.locations ??
        res?.data?.data ??
        res?.data?.locations ??
        res?.data?.location ??
        [];

      setLocations(Array.isArray(locationsArray) ? locationsArray : []);
    } catch (err: any) {
      // Use userMessage from interceptor if available
      console.error("Failed to fetch locations:", err);
      toast.error(err.userMessage || "Failed to fetch locations");
      setLocations([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { locations, isLoading, fetchLocations };
};

// ============================================================================
// COMPONENTS
// ============================================================================

const StatsCard = ({ title, value, icon: Icon, color = "blue" }: any) => {
  const colorClasses = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    purple: "bg-purple-50 text-purple-600",
    gray: "bg-gray-50 text-gray-600",
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        </div>
        <div
          className={`w-12 h-12 ${colorClasses[color]} rounded-xl flex items-center justify-center`}
        >
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
};

const SearchBar = ({ search, onSearchChange }: any) => (
  <div className="relative flex-1 max-w-md">
    <Search
      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
      size={18}
    />
    <input
      type="text"
      value={search}
      onChange={(e) => onSearchChange(e.target.value)}
      placeholder="Search users by name, email, phone..."
      className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition placeholder-gray-500 text-sm hover:border-gray-400"
    />
  </div>
);

const FilterSelect = ({ value, onChange, options, placeholder }: any) => (
  <select
    value={value}
    onChange={(e) => onChange(e.target.value)}
    className="px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition hover:border-gray-400"
  >
    <option value="all">{placeholder}</option>
    {options.map((option: any) => (
      <option key={option.value} value={option.value}>
        {option.label}
      </option>
    ))}
  </select>
);

const ActionMenu = ({ user, onEdit, onDelete, onClose, isOpen }: any) => {
  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-10" onClick={onClose} />
      <div className="absolute right-6 z-40 w-56 bg-white border border-gray-200 rounded-xl shadow-lg shadow-gray-200/50 animate-fadeIn backdrop-blur-sm">
        <Link href={`/permssions/${user.user_id}`}>
          <button className="flex items-center gap-3 w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition first:rounded-t-xl border-b border-gray-100">
            <ShieldBan size={16} className="text-blue-600" />
            Change Roles
          </button>
        </Link>
        <Link href={`/usersprofile/${user.user_id}`}>
          <button className="flex items-center gap-3 w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition border-b border-gray-100">
            <UserCheck size={16} className="text-blue-600" />
            View Profile
          </button>
        </Link>
        <button
          onClick={() => onEdit(user)}
          className="flex items-center gap-3 w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition border-b border-gray-100"
        >
          <Edit size={16} className="text-blue-600" />
          Edit User
        </button>
        <button
          onClick={() => onDelete(user)}
          className="flex items-center gap-3 w-full px-4 py-3 text-sm text-gray-700 hover:bg-red-50 transition last:rounded-b-xl"
        >
          <Trash2 size={16} className="text-red-600" />
          Delete User
        </button>
      </div>
    </>
  );
};

const UserTableRow = React.memo(
  ({ user, index, isMenuOpen, onMenuToggle, onEdit, onDelete }: any) => (
    <tr className="hover:bg-gray-50/50 transition-colors group">
      <td className="px-6 py-4 text-center">
        <span className="text-sm font-medium text-gray-500">{index + 1}</span>
      </td>
      <td className="px-6 py-4 min-w-[250px]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-50 rounded-xl flex items-center justify-center flex-shrink-0 border border-blue-200/50">
            {user.profile_pic ? (
              <img
                src={`http://localhost:8000/storage/${user.profile_pic}`}
                alt={user.name}
                className="w-full h-full object-cover rounded-xl"
                loading="lazy"
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
            <span className="text-sm font-medium">{user.phone_number}</span>
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
          className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold ${getRoleBadgeColor(user.role)}`}
        >
          {user.role}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span
          className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold ${getStatusBadgeColor(user.is_active ? "active" : "inactive")}`}
        >
          {user.is_active ? "Active" : "Inactive"}
        </span>
      </td>
      <td className="px-6 py-4 text-center relative whitespace-nowrap">
        <button
          onClick={() => onMenuToggle(user.id)}
          className="p-2 rounded-lg hover:bg-gray-100 transition text-gray-400 hover:text-gray-600 group/action"
        >
          <MoreVertical
            size={18}
            className="group-hover/action:scale-110 transition-transform"
          />
        </button>
        <ActionMenu
          user={user}
          isOpen={isMenuOpen}
          onClose={() => onMenuToggle(null)}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      </td>
    </tr>
  ),
);

UserTableRow.displayName = "UserTableRow";

const EmptyState = ({ hasSearch, onAddClick }: any) => (
  <tr>
    <td colSpan={7} className="text-center py-16">
      <div className="flex flex-col items-center gap-4 max-w-sm mx-auto">
        <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center">
          <Search size={24} className="text-gray-400" />
        </div>
        <div className="space-y-2">
          <p className="text-gray-900 font-semibold text-lg">
            {hasSearch ? "No users found" : "No users available"}
          </p>
          <p className="text-gray-500 text-sm">
            {hasSearch
              ? "Try adjusting your search terms or filters"
              : "Get started by adding your first user to the system"}
          </p>
        </div>
        {!hasSearch && (
          <button
            onClick={onAddClick}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-5 py-2.5 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all font-medium mt-2"
          >
            <Plus size={16} />
            Add User
          </button>
        )}
      </div>
    </td>
  </tr>
);

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const ManageUsers = () => {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [openRow, setOpenRow] = useState<number | null>(null);

  // Modal states
  const [modalState, setModalState] = useState<{
    type: "add" | "edit" | "delete" | null;
    user: User | null;
  }>({ type: null, user: null });

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

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const { users, isLoading, fetchUsers } = useUsers();
  const { locations, fetchLocations } = useLocations();

  const debouncedSearch = useDebounce(search, DEBOUNCE_DELAY);

  // Initial data fetch
  useEffect(() => {
    fetchUsers();
    fetchLocations();
  }, [fetchUsers, fetchLocations]);

  // Clean up preview URLs
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // Filter users
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      if (!user) return false;

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
        debouncedSearch.toLowerCase(),
      );
      const matchesRole = roleFilter === "all" || user.role === roleFilter;
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && user.is_active) ||
        (statusFilter === "inactive" && !user.is_active);

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, debouncedSearch, roleFilter, statusFilter]);

  // Stats
  const stats = useMemo(
    () => ({
      total: users.length,
      active: users.filter((u) => u.is_active).length,
      admins: users.filter((u) => u.role === "admin").length,
      inactive: users.filter((u) => !u.is_active).length,
    }),
    [users],
  );

  // Handlers
  const handleFileChange = useCallback(
    (file: File | null) => {
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
    },
    [previewUrl],
  );

  const resetForm = useCallback(() => {
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
  }, []);

  const handleInputChange = useCallback(
    (field: keyof UserFormData, value: string) => {
      setForm((prev) => ({ ...prev, [field]: value }));
    },
    [],
  );

  const validateForm = useCallback(
    (formData: UserFormData, isEdit: boolean = false): string[] => {
      const errors: string[] = [];
      if (!formData.name.trim()) errors.push("Name is required");
      if (!formData.email.trim()) {
        errors.push("Email is required");
      } else if (!validateEmail(formData.email)) {
        errors.push("Email format is invalid");
      }
      if (!isEdit && !formData.password) errors.push("Password is required");
      if (!isEdit && formData.password !== formData.password_confirmation) {
        errors.push("Passwords do not match");
      }
      if (formData.password && formData.password.length < 8) {
        errors.push("Password must be at least 8 characters");
      }
      if (formData.location_id && isNaN(Number(formData.location_id))) {
        errors.push("Location must be valid");
      }
      return errors;
    },
    [],
  );

  const handleAddUser = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (isSubmitting) return;

      const errors = validateForm(form);
      if (errors.length > 0) {
        errors.forEach((error) => toast.error(error));
        return;
      }

      setIsSubmitting(true);
      setIsUploading(!!selectedFile);

      try {
        const formData = new FormData();

        formData.append("name", form.name.trim());
        formData.append("email", form.email.trim());
        formData.append("phone", form.phone.trim());
        formData.append("role", form.role || "staff");
        formData.append("address", form.address.trim());
        formData.append("state", form.state.trim());
        formData.append("city", form.city.trim());
        formData.append("country", form.country.trim());
        formData.append("about", form.about.trim());

        if (!form.location_id) {
          toast.error("Location is required");
          return;
        }
        formData.append("location_id", form.location_id.toString());

        formData.append("password", form.password || "");
        formData.append(
          "password_confirmation",
          form.password_confirmation || "",
        );

        if (selectedFile) {
          const error = validateImageFile(selectedFile);
          if (error) {
            toast.error(error);
            return;
          }
          formData.append("photo", selectedFile);
        }

        const response = await apiPost("/usersadd", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        if (
          response.data?.success ||
          response.data?.message ||
          response.status === 200 ||
          response.status === 201
        ) {
          toast.success(response.data?.message || "User created successfully!");
          setModalState({ type: null, user: null });
          resetForm();
          await fetchUsers();
        }
      } catch (err: any) {
        if (err.response?.status === 403) {
          toast.error(
            "User limit reached for your current subscription plan. Please upgrade your plan to add more users.",
          );
        }
        // handleApiError(err);
      } finally {
        setIsSubmitting(false);
        setIsUploading(false);
      }
    },
    [form, selectedFile, isSubmitting, validateForm, resetForm, fetchUsers],
  );

  const handleEditUser = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (isSubmitting || !modalState.user) return;

      const errors = validateForm(form, true);
      if (errors.length > 0) {
        errors.forEach((error) => toast.error(error));
        return;
      }

      setIsSubmitting(true);
      setIsUploading(!!selectedFile);

      try {
        const formData = new FormData();

        formData.append("name", form.name.trim());
        formData.append("email", form.email.trim());
        formData.append("phone", form.phone.trim());
        formData.append("role", form.role || "staff");
        formData.append("address", form.address.trim());
        formData.append("state", form.state.trim());
        formData.append("city", form.city.trim());
        formData.append("country", form.country.trim());
        formData.append("about", form.about.trim());
        formData.append(
          "location_id",
          form.location_id ? String(form.location_id) : "",
        );

        if (form.password) {
          formData.append("password", form.password);
          formData.append("password_confirmation", form.password_confirmation);
        }

        if (selectedFile) {
          const error = validateImageFile(selectedFile);
          if (error) {
            toast.error(error);
            return;
          }
          formData.append("photo", selectedFile);
        }

        formData.append("_method", "PUT");

        const response = await apiPost(
          `/usersupdate/${modalState.user.id}`,
          formData,
          { headers: { "Content-Type": "multipart/form-data" } },
          ["/users", "/locations"],
        );

        if (
          response.data?.success ||
          response.data?.message ||
          response.status === 200
        ) {
          toast.success(response.data?.message || "User updated successfully!");
          setModalState({ type: null, user: null });
          resetForm();
          await fetchUsers();
        }
      } catch (err: any) {
        handleApiError(err);
      } finally {
        setIsSubmitting(false);
        setIsUploading(false);
      }
    },
    [
      form,
      selectedFile,
      modalState.user,
      isSubmitting,
      validateForm,
      resetForm,
      fetchUsers,
    ],
  );

  const handleDeleteUser = useCallback(async () => {
    if (isSubmitting || !modalState.user) return;

    setIsSubmitting(true);
    try {
      const response = await apiDelete(
        `/usersdel/${modalState.user.id}`,
        { headers: { "Content-Type": "application/json" } },
        // ["/users", "/locations"],
      );

      toast.success(response.data?.message || "User deleted successfully!");
      setModalState({ type: null, user: null });
      await fetchUsers();
    } catch (err: any) {
      toast.error(err.userMessage || "Failed to delete user");
      setModalState({ type: null, user: null });
    } finally {
      setIsSubmitting(false);
    }
  }, [modalState.user, isSubmitting, fetchUsers]);

  const handleApiError = (err: any) => {
    if (err.code === "ECONNABORTED") {
      toast.error("Request timeout. Please try again with a smaller image.");
    } else if (err.response?.status === 413) {
      toast.error("Image too large. Please upload an image smaller than 2MB.");
    } else if (err.response?.status === 422) {
      const errors = err.response?.data?.errors;
      if (errors) {
        Object.keys(errors).forEach((key) => {
          const errorMessage = Array.isArray(errors[key])
            ? errors[key][0]
            : errors[key];
          toast.error(`${key}: ${errorMessage}`);
        });
      } else {
        toast.error(
          err.response?.data?.message ||
            "Validation failed. Please check the form.",
        );
      }
    } else if (err.response?.status === 404) {
      toast.error("API endpoint not found. Please check the URL.");
    } else if (err.response?.status === 500) {
      toast.error(
        `Server error: ${err.response?.data?.message || "Internal server error"}`,
      );
    } else if (err.code === "ERR_NETWORK") {
      toast.error("Network error. Please try again.");
    } else {
      toast.error(
        err.response?.data?.message || "Operation failed. Please try again.",
      );
    }
  };

  const handleEditClick = useCallback((user: User) => {
    setForm({
      name: user.name || "",
      email: user.email || "",
      phone: user.phone_number || "",
      role: user.role || "staff",
      password: "",
      password_confirmation: "",
      location_id: user.location?.id?.toString() || "",
      state: user.state || "",
      city: user.city || "",
      country: user.country || "",
      about: user.about || "",
      address: user.address || "",
    });
    setModalState({ type: "edit", user });
  }, []);

  const handleDeleteClick = useCallback((user: User) => {
    setModalState({ type: "delete", user });
  }, []);

  const handleAddClick = useCallback(() => {
    resetForm();
    setModalState({ type: "add", user: null });
  }, [resetForm]);

  const handleModalClose = useCallback(() => {
    if (!isSubmitting) {
      setModalState({ type: null, user: null });
      resetForm();
      setOpenRow(null);
    }
  }, [isSubmitting, resetForm]);

  return (
    <div className="min-h-screen bg-gray-50/30">
      {/* Header */}
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
                disabled={isLoading}
              >
                <RefreshCw
                  size={18}
                  className={isLoading ? "animate-spin" : ""}
                />
              </button>
              <button className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-colors font-medium">
                <Download size={16} />
                Export
              </button>
              <button
                onClick={handleAddClick}
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

      {/* Main Content */}
      <div className="max-w-8xl mx-auto px-6 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Total Users"
            value={stats.total}
            icon={User}
            color="blue"
          />
          <StatsCard
            title="Active Users"
            value={stats.active}
            icon={UserCheck}
            color="green"
          />
          <StatsCard
            title="Admins"
            value={stats.admins}
            icon={Shield}
            color="purple"
          />
          <StatsCard
            title="Inactive"
            value={stats.inactive}
            icon={UserX}
            color="gray"
          />
        </div>

        {/* Main Content Card */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {/* Search and Filters */}
          <div className="px-6 py-5 border-b border-gray-200 bg-gray-50/50">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 flex-1">
                <SearchBar search={search} onSearchChange={setSearch} />

                <div className="flex items-center gap-3">
                  <FilterSelect
                    value={roleFilter}
                    onChange={setRoleFilter}
                    options={ROLES}
                    placeholder="All Roles"
                  />

                  <FilterSelect
                    value={statusFilter}
                    onChange={setStatusFilter}
                    options={[
                      { value: "active", label: "Active" },
                      { value: "inactive", label: "Inactive" },
                    ]}
                    placeholder="All Status"
                  />

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
                    : `${filteredUsers.length} user${filteredUsers.length !== 1 ? "s" : ""}`}
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

          {/* Users Table */}
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
                        <UserTableRow
                          key={user.id}
                          user={user}
                          index={index}
                          isMenuOpen={openRow === user.id}
                          onMenuToggle={setOpenRow}
                          onEdit={handleEditClick}
                          onDelete={handleDeleteClick}
                        />
                      ))
                    ) : (
                      <EmptyState
                        hasSearch={!!debouncedSearch}
                        onAddClick={handleAddClick}
                      />
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Modals */}
        <Modal
          isOpen={modalState.type === "add" || modalState.type === "edit"}
          onClose={handleModalClose}
          title={
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                {modalState.type === "add" ? (
                  <Plus className="h-5 w-5 text-blue-600" />
                ) : (
                  <Edit className="h-5 w-5 text-blue-600" />
                )}
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {modalState.type === "add" ? "Add New User" : "Edit User"}
                </h2>
                <p className="text-gray-500 text-sm">
                  {modalState.type === "add"
                    ? "Create a new user account in the system"
                    : "Update user information and permissions"}
                </p>
              </div>
            </div>
          }
        >
          <form
            onSubmit={
              modalState.type === "add" ? handleAddUser : handleEditUser
            }
            className="space-y-6"
          >
            <UserForm
              form={form}
              handleInputChange={handleInputChange}
              handleFileChange={handleFileChange}
              inputClass={INPUT_CLASS}
              labelClass={LABEL_CLASS}
              roles={ROLES}
              locations={locations}
              isEdit={modalState.type === "edit"}
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
                    {modalState.type === "add" ? "Creating..." : "Updating..."}
                  </>
                ) : (
                  <>
                    {modalState.type === "add" ? (
                      <Plus size={16} />
                    ) : (
                      <Edit size={16} />
                    )}
                    {modalState.type === "add" ? "Add User" : "Update User"}
                  </>
                )}
              </button>
            </div>
          </form>
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal
          isOpen={modalState.type === "delete"}
          onClose={handleModalClose}
          showHeader={false}
        >
          <div className="max-w-md mx-auto rounded-2xl p-6 bg-white animate-fadeIn flex flex-col items-center text-center space-y-4">
            <div className="w-16 h-16 flex items-center justify-center rounded-2xl bg-red-50 border border-red-200">
              <AlertTriangle className="w-7 h-7 text-red-600" />
            </div>

            <h2 className="text-xl font-bold text-gray-900">Delete User</h2>
            <p className="text-gray-600 text-sm leading-relaxed">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-gray-900">
                {modalState.user?.name}
              </span>
              ? This action cannot be undone and all user data will be
              permanently removed.
            </p>

            <div className="mt-6 flex justify-center gap-3 w-full">
              <button
                type="button"
                onClick={handleModalClose}
                className="flex-1 px-6 py-3 rounded-lg border border-gray-300 bg-white text-gray-700 font-medium hover:bg-gray-50 transition disabled:opacity-50"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteUser}
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
        </Modal>
      </div>
    </div>
  );
};

// ============================================================================
// MODAL COMPONENT
// ============================================================================

const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  showHeader = true,
}: any) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-50 p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      >
        {showHeader && (
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
        )}
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};

// ============================================================================
// USER FORM COMPONENT
// ============================================================================

const UserForm = React.memo(
  ({
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
  }: any) => (
    <div className="space-y-6">
      {/* Photo Upload Section */}
      <div className="flex flex-col items-center space-y-4">
        <label className={labelClass}>Profile Photo</label>

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

          <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity">
            <Camera className="h-6 w-6 text-white" />
          </div>

          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={isUploading}
          />
        </div>

        {isUploading && (
          <div className="flex items-center gap-2 text-sm text-blue-600">
            <Loader2 className="h-4 w-4 animate-spin" />
            Uploading photo...
          </div>
        )}

        <div className="text-center">
          <p className="text-sm text-gray-500">
            Click to upload a profile photo
          </p>
          <p className="text-xs text-gray-400 mt-1">
            JPG, PNG, WEBP, AVIF (Max 2MB)
          </p>
        </div>

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

        <div>
          <label className={labelClass}>Role</label>
          <select
            value={form.role}
            onChange={(e) => handleInputChange("role", e.target.value)}
            className={inputClass}
          >
            {roles.map((role: any) => (
              <option key={role.value} value={role.value}>
                {role.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass}>Assigned Location</label>
          <select
            value={form.location_id || ""}
            onChange={(e) => handleInputChange("location_id", e.target.value)}
            className={inputClass}
          >
            <option value="">No location assigned</option>
            {locations.map((location: Location) => (
              <option key={location.id} value={location.id}>
                {location.location_name}
              </option>
            ))}
          </select>
        </div>

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
  ),
);

UserForm.displayName = "UserForm";

export default ManageUsers;
