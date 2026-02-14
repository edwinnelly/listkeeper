"use client";

import React, { useState, useEffect } from "react";
import { Shield, Save, User, Mail, Building, Calendar, ArrowLeft, Loader2, ChevronRight } from "lucide-react";
import { toast } from "react-hot-toast";
import api from "@/lib/axios";
import Cookies from "js-cookie";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

// -------------------------------
// User Profile Interface
// -------------------------------
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
// Permissions State Definition
// -------------------------------
interface PermissionsState {
  // General permission
  permission: boolean;
  
  // Users roles
  users_create: boolean;
  users_read: boolean;
  users_update: boolean;
  users_delete: boolean;

  // Subscriptions
  subscriptions_read: boolean;
  subscriptions_update: boolean;

  // Locations roles
  locations_create: boolean;
  locations_read: boolean;
  locations_update: boolean;
  locations_delete: boolean;
  locations_analytics: boolean;

  // Product category roles
  category_create: boolean;
  category_read: boolean;
  category_update: boolean;
  category_delete: boolean;

  // Product roles
  product_create: boolean;
  product_read: boolean;
  product_update: boolean;
  product_delete: boolean;

  // Unit roles
  unit_create: boolean;
  unit_read: boolean;
  unit_update: boolean;
  unit_delete: boolean;

  // Vendor roles
  vendor_create: boolean;
  vendor_read: boolean;
  vendor_update: boolean;
  vendor_delete: boolean;

  // Purchase roles
  purchase_create: boolean;
  purchase_read: boolean;
  purchase_update: boolean;
  purchase_delete: boolean;

  // Customer roles
  customer_create: boolean;
  customer_read: boolean;
  customer_update: boolean;
  customer_delete: boolean;

  // Credit note roles
  credit_note_create: boolean;
  credit_note_read: boolean;
  credit_note_update: boolean;
  credit_note_delete: boolean;

  // Expenses roles
  expense_create: boolean;
  expense_read: boolean;
  expense_update: boolean;
  expense_delete: boolean;

  // Invoice roles
  invoice_create: boolean;
  invoice_read: boolean;
  invoice_update: boolean;
  invoice_delete: boolean;

  // POS roles
  pos_create: boolean;
  pos_read: boolean;
  pos_update: boolean;
  pos_delete: boolean;
}

// Type for a single permission item
type PermissionItem = {
  key: keyof PermissionsState;
  label: string;
  description: string;
};

// -------------------------------
// ToggleRow Component
// -------------------------------
const ToggleRow = ({
  title,
  description,
  value,
  onToggle,
}: {
  title: string;
  description: string;
  value: boolean;
  onToggle: () => void;
}) => {
  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
      <div>
        <label className="block text-sm font-medium text-gray-900">
          {title}
        </label>
        <p className="text-xs text-gray-500 mt-0.5">{description}</p>
      </div>

      <button
        type="button"
        onClick={onToggle}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          value ? "bg-blue-600" : "bg-gray-200"
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            value ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  );
};

// -------------------------------
// PermissionSection Component
// -------------------------------
const PermissionSection = ({
  title,
  list,
  permissions,
  handleToggle,
  handleCategoryToggle,
}: {
  title: string;
  list: PermissionItem[];
  permissions: PermissionsState;
  handleToggle: (key: keyof PermissionsState) => void;
  handleCategoryToggle: (keys: (keyof PermissionsState)[]) => void;
}) => {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <button
          type="button"
          onClick={() => handleCategoryToggle(list.map((item) => item.key))}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          Toggle All
        </button>
      </div>

      <div className="space-y-4">
        {list.map((item) => (
          <ToggleRow
            key={item.key}
            title={item.label}
            description={item.description}
            value={permissions[item.key]}
            onToggle={() => handleToggle(item.key)}
          />
        ))}
      </div>
    </div>
  );
};

// -------------------------------
// PermissionsForm Component
// -------------------------------
const PermissionsForm = () => {
  const [permissions, setPermissions] = useState<PermissionsState>({
    permission: false,
    
    users_create: false,
    users_read: false,
    users_update: false,
    users_delete: false,

    subscriptions_read: false,
    subscriptions_update: false,

    locations_create: false,
    locations_read: false,
    locations_update: false,
    locations_delete: false,
    locations_analytics: false,

    category_create: false,
    category_read: false,
    category_update: false,
    category_delete: false,

    product_create: false,
    product_read: false,
    product_update: false,
    product_delete: false,

    unit_create: false,
    unit_read: false,
    unit_update: false,
    unit_delete: false,

    vendor_create: false,
    vendor_read: false,
    vendor_update: false,
    vendor_delete: false,

    purchase_create: false,
    purchase_read: false,
    purchase_update: false,
    purchase_delete: false,

    customer_create: false,
    customer_read: false,
    customer_update: false,
    customer_delete: false,

    credit_note_create: false,
    credit_note_read: false,
    credit_note_update: false,
    credit_note_delete: false,

    expense_create: false,
    expense_read: false,
    expense_update: false,
    expense_delete: false,

    invoice_create: false,
    invoice_read: false,
    invoice_update: false,
    invoice_delete: false,

    pos_create: false,
    pos_read: false,
    pos_update: false,
    pos_delete: false,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const params = useParams();
  const router = useRouter();
  const id = params?.businesskey as string;


  const getRoleBadgeColor = (role: string) => {
    switch (role?.toLowerCase()) {
      case "admin":
        return "bg-purple-50 text-purple-700 border border-purple-200";
      case "manager":
        return "bg-blue-50 text-blue-700 border border-blue-200";
      case "staff":
        return "bg-emerald-50 text-emerald-700 border border-emerald-200";
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

  // -------------------------------
  // Fetch user information
  // -------------------------------
  const fetchUserInfo = async () => {
    if (!id) return;

    try {
      setLoading(true);
      await api.get("/sanctum/csrf-cookie");

      const response = await api.get(`/usersinfo/${id}`, {
        headers: {
          "X-XSRF-TOKEN": Cookies.get("XSRF-TOKEN") || "",
          "Content-Type": "application/json",
        },
      });

      const data = response.data?.data || response.data;
      
      if (!data) {
        throw new Error("Failed to fetch user profile");
      }

      const userData = data.user || data;
      console.log(userData);
      setUser(userData);
    } catch (error: any) {
      console.error("Failed to load user information", error);
      toast.error("Failed to load user information.");
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------
  // Fetch user permissions
  // -------------------------------
  const fetchPermissions = async () => {
    try {
      await api.get("/sanctum/csrf-cookie");

      const res = await api.get(`/usersroles/${id}`, {
        headers: {
          "X-XSRF-TOKEN": Cookies.get("XSRF-TOKEN") || "",
        },
      });

      const data = res.data?.data || {};

      // Dynamically map "yes"/"no" to booleans
      const updatedState: PermissionsState = Object.keys(permissions).reduce(
        (acc, key) => {
          acc[key as keyof PermissionsState] = data[key] === "yes";
          return acc;
        },
        {} as PermissionsState
      );

      setPermissions(updatedState);
    } catch (error) {
      // console.error("Failed to load user permissions", error);
    }
  };

  useEffect(() => {
    if (id) {
      fetchUserInfo();
      fetchPermissions();
    }
  }, [id]);

  // -------------------------------
  // Toggle functions
  // -------------------------------
  const handleToggle = (permission: keyof PermissionsState) => {
    setPermissions((prev) => ({
      ...prev,
      [permission]: !prev[permission],
    }));
  };

  const handleCategoryToggle = (keys: (keyof PermissionsState)[]) => {
    const allEnabled = keys.every((key) => permissions[key]);
    setPermissions((prev) => {
      const updated = { ...prev };
      keys.forEach((k) => (updated[k] = !allEnabled));
      return updated;
    });
  };

  // -------------------------------
  // Submit handler
  // -------------------------------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      const selected = Object.entries(permissions)
        .filter(([_, value]) => value)
        .map(([key]) => key);

      const formData = new FormData();
      Object.entries(permissions).forEach(([key, value]) => {
        formData.append(key, value ? "yes" : "no");
      });
      formData.append("selected_permissions", JSON.stringify(selected));

      await api.get("/sanctum/csrf-cookie");

      // ✅ Use post since backend route expects post
      await api.post(`/permissions_update/${id}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          "X-XSRF-TOKEN": Cookies.get("XSRF-TOKEN") || "",
        },
      });

      toast.success("Permissions updated successfully!");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update permissions.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // -------------------------------
  // Permission Groups
  // -------------------------------
  const permissionGroups = {
    general: [
      { key: "permission" as keyof PermissionsState, label: "General Permission", description: "Overall access permission" },
    ],
    users: [
      { key: "users_create" as keyof PermissionsState, label: "Create Users", description: "Can create new user accounts" },
      { key: "users_read" as keyof PermissionsState, label: "View Users", description: "Can view user accounts" },
      { key: "users_update" as keyof PermissionsState, label: "Edit Users", description: "Can modify user information" },
      { key: "users_delete" as keyof PermissionsState, label: "Delete Users", description: "Can remove user accounts" },
    ],
    subscriptions: [
      { key: "subscriptions_read" as keyof PermissionsState, label: "View Subscriptions", description: "Can view subscription data" },
      { key: "subscriptions_update" as keyof PermissionsState, label: "Manage Subscriptions", description: "Can update subscription plans" },
    ],
    locations: [
      { key: "locations_create" as keyof PermissionsState, label: "Create Locations", description: "Can create new locations" },
      { key: "locations_read" as keyof PermissionsState, label: "View Locations", description: "Can view location information" },
      { key: "locations_update" as keyof PermissionsState, label: "Edit Locations", description: "Can update stored location info" },
      { key: "locations_delete" as keyof PermissionsState, label: "Delete Locations", description: "Can remove locations" },
      { key: "locations_analytics" as keyof PermissionsState, label: "Location Analytics", description: "Can view analytics for locations" },
    ],
    categories: [
      { key: "category_create" as keyof PermissionsState, label: "Create Categories", description: "Can create product categories" },
      { key: "category_read" as keyof PermissionsState, label: "View Categories", description: "Can view product categories" },
      { key: "category_update" as keyof PermissionsState, label: "Edit Categories", description: "Can modify product categories" },
      { key: "category_delete" as keyof PermissionsState, label: "Delete Categories", description: "Can remove product categories" },
    ],
    products: [
      { key: "product_create" as keyof PermissionsState, label: "Create Products", description: "Can create new products" },
      { key: "product_read" as keyof PermissionsState, label: "View Products", description: "Can view product information" },
      { key: "product_update" as keyof PermissionsState, label: "Edit Products", description: "Can modify product details" },
      { key: "product_delete" as keyof PermissionsState, label: "Delete Products", description: "Can remove products" },
    ],
    units: [
      { key: "unit_create" as keyof PermissionsState, label: "Create Units", description: "Can create measurement units" },
      { key: "unit_read" as keyof PermissionsState, label: "View Units", description: "Can view unit information" },
      { key: "unit_update" as keyof PermissionsState, label: "Edit Units", description: "Can modify unit details" },
      { key: "unit_delete" as keyof PermissionsState, label: "Delete Units", description: "Can remove units" },
    ],
    vendors: [
      { key: "vendor_create" as keyof PermissionsState, label: "Create Vendors", description: "Can create new vendors" },
      { key: "vendor_read" as keyof PermissionsState, label: "View Vendors", description: "Can view vendor information" },
      { key: "vendor_update" as keyof PermissionsState, label: "Edit Vendors", description: "Can modify vendor details" },
      { key: "vendor_delete" as keyof PermissionsState, label: "Delete Vendors", description: "Can remove vendors" },
    ],
    purchases: [
      { key: "purchase_create" as keyof PermissionsState, label: "Create Purchases", description: "Can create purchase orders" },
      { key: "purchase_read" as keyof PermissionsState, label: "View Purchases", description: "Can view purchase history" },
      { key: "purchase_update" as keyof PermissionsState, label: "Edit Purchases", description: "Can modify purchase orders" },
      { key: "purchase_delete" as keyof PermissionsState, label: "Delete Purchases", description: "Can remove purchase records" },
    ],
    customers: [
      { key: "customer_create" as keyof PermissionsState, label: "Create Customers", description: "Can create new customers" },
      { key: "customer_read" as keyof PermissionsState, label: "View Customers", description: "Can view customer information" },
      { key: "customer_update" as keyof PermissionsState, label: "Edit Customers", description: "Can modify customer details" },
      { key: "customer_delete" as keyof PermissionsState, label: "Delete Customers", description: "Can remove customers" },
    ],
    creditNotes: [
      { key: "credit_note_create" as keyof PermissionsState, label: "Create Credit Notes", description: "Can create credit notes" },
      { key: "credit_note_read" as keyof PermissionsState, label: "View Credit Notes", description: "Can view credit note history" },
      { key: "credit_note_update" as keyof PermissionsState, label: "Edit Credit Notes", description: "Can modify credit notes" },
      { key: "credit_note_delete" as keyof PermissionsState, label: "Delete Credit Notes", description: "Can remove credit notes" },
    ],
    expenses: [
      { key: "expense_create" as keyof PermissionsState, label: "Create Expenses", description: "Can create expense records" },
      { key: "expense_read" as keyof PermissionsState, label: "View Expenses", description: "Can view expense history" },
      { key: "expense_update" as keyof PermissionsState, label: "Edit Expenses", description: "Can modify expense records" },
      { key: "expense_delete" as keyof PermissionsState, label: "Delete Expenses", description: "Can remove expense records" },
    ],
    invoices: [
      { key: "invoice_create" as keyof PermissionsState, label: "Create Invoices", description: "Can create new invoices" },
      { key: "invoice_read" as keyof PermissionsState, label: "View Invoices", description: "Can view invoice history" },
      { key: "invoice_update" as keyof PermissionsState, label: "Edit Invoices", description: "Can modify invoice details" },
      { key: "invoice_delete" as keyof PermissionsState, label: "Delete Invoices", description: "Can remove invoices" },
    ],
    pos: [
      { key: "pos_create" as keyof PermissionsState, label: "Create POS", description: "Can create point of sale transactions" },
      { key: "pos_read" as keyof PermissionsState, label: "View POS", description: "Can view POS transactions" },
      { key: "pos_update" as keyof PermissionsState, label: "Edit POS", description: "Can modify POS transactions" },
      { key: "pos_delete" as keyof PermissionsState, label: "Delete POS", description: "Can remove POS transactions" },
    ],
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
            Back to Users List
          </Link>
        </div>
      </div>
    );
  }

  // -------------------------------
  // Render
  // -------------------------------
  return (
    <div className="min-h-screen bg-gray-50/30">
      {/* Header */}
      {/* <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-6">
            <div className="flex items-center space-x-4 mb-4 sm:mb-0">
              <Link
                href="/users"
                className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors group"
              >
                <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                Back to Users List
              </Link>
              <div className="h-6 w-px bg-gray-300 hidden sm:block"></div>
              <div>
                <h1 className="text-3xl font-bolder text-gray-900"  style={{ fontSize: '16px' }}>User Permissions</h1>
                <p className="text-gray-600 text-sm mt-1">
                  Manage permissions for {user.name}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div> */}

      <div className="bg-white border-b border-gray-100">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between py-6">
      {/* Left Section - Microsoft-style navigation and header */}
      <div className="flex flex-col space-y-4 mb-4 sm:mb-0">
        {/* Breadcrumb with MS style */}
        <div className="flex items-center space-x-2">
          <Link
            href="/users"
            className="inline-flex items-center text-sm font-normal text-gray-600 hover:text-gray-900 hover:bg-gray-50 px-2 py-1 rounded transition-colors duration-200 group"
          >
            <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-0.5 transition-transform duration-200" />
            Users
          </Link>
          <ChevronRight className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-900 font-semibold px-2 py-1">
            Permissions
          </span>
        </div>

        {/* Title Section with MS typography */}
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Shield className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">
                User permissions
              </h1>
              <div className="hidden sm:flex items-center space-x-2">
                <div className="px-2 py-1 bg-gray-100 rounded text-sm font-medium text-gray-700">
                  {user.name}
                </div>
              </div>
            </div>
            <p className="text-gray-600 text-base max-w-2xl">
              Manage access controls and permissions for this user across the organization
            </p>
          </div>
        </div>
      </div>

      {/* Right Section - MS-style action buttons */}
      {/* <div className="flex items-center space-x-2 sm:self-start">
        <button className="px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 border border-gray-300 rounded-md transition-colors duration-200">
          Reset
        </button>
        <button className="px-3 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 border border-transparent rounded-md transition-colors duration-200">
          Save changes
        </button>
      </div> */}
    </div>
    
    {/* Secondary Navigation - MS Command Bar style */}
    <div className="border-t border-gray-100 mt-2 pt-4">
      <div className="flex space-x-6">
        <button className="px-3 py-2 text-sm font-medium text-blue-600 border-b-2 border-blue-600">
          Permissions
        </button>
        <button className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors duration-200">
          Audit log
        </button>
        <Link href={``} >
        <button className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors duration-200">
          Settings
        </button>
        </Link>
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

              {/* Contact Information */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                      <Mail className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-gray-600">Email</p>
                      <p className="text-sm font-medium text-gray-900 truncate">{user.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                      <Building className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-gray-600">Role</p>
                      <p className="text-sm font-medium text-gray-900 capitalize">{user.role || "User"}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Permissions Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
              <div className="bg-gradient-to-r from-blue-900 to-blue-800 px-6 py-5 rounded-t-xl">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-white/10 rounded-lg">
                    <Shield className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-white">Access Control</h2>
                    <p className="text-blue-200 text-sm">Toggle permissions on/off for {user.name}</p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="p-6">
                <PermissionSection
                  title="General"
                  list={permissionGroups.general}
                  permissions={permissions}
                  handleToggle={handleToggle}
                  handleCategoryToggle={handleCategoryToggle}
                />
                <PermissionSection
                  title="Users Management"
                  list={permissionGroups.users}
                  permissions={permissions}
                  handleToggle={handleToggle}
                  handleCategoryToggle={handleCategoryToggle}
                />
                <PermissionSection
                  title="Subscriptions"
                  list={permissionGroups.subscriptions}
                  permissions={permissions}
                  handleToggle={handleToggle}
                  handleCategoryToggle={handleCategoryToggle}
                />
                <PermissionSection
                  title="Locations"
                  list={permissionGroups.locations}
                  permissions={permissions}
                  handleToggle={handleToggle}
                  handleCategoryToggle={handleCategoryToggle}
                />
                <PermissionSection
                  title="Product Categories"
                  list={permissionGroups.categories}
                  permissions={permissions}
                  handleToggle={handleToggle}
                  handleCategoryToggle={handleCategoryToggle}
                />
                <PermissionSection
                  title="Products"
                  list={permissionGroups.products}
                  permissions={permissions}
                  handleToggle={handleToggle}
                  handleCategoryToggle={handleCategoryToggle}
                />
                <PermissionSection
                  title="Units"
                  list={permissionGroups.units}
                  permissions={permissions}
                  handleToggle={handleToggle}
                  handleCategoryToggle={handleCategoryToggle}
                />
                <PermissionSection
                  title="Vendors"
                  list={permissionGroups.vendors}
                  permissions={permissions}
                  handleToggle={handleToggle}
                  handleCategoryToggle={handleCategoryToggle}
                />
                <PermissionSection
                  title="Purchases"
                  list={permissionGroups.purchases}
                  permissions={permissions}
                  handleToggle={handleToggle}
                  handleCategoryToggle={handleCategoryToggle}
                />
                <PermissionSection
                  title="Customers"
                  list={permissionGroups.customers}
                  permissions={permissions}
                  handleToggle={handleToggle}
                  handleCategoryToggle={handleCategoryToggle}
                />
                <PermissionSection
                  title="Credit Notes"
                  list={permissionGroups.creditNotes}
                  permissions={permissions}
                  handleToggle={handleToggle}
                  handleCategoryToggle={handleCategoryToggle}
                />
                <PermissionSection
                  title="Expenses"
                  list={permissionGroups.expenses}
                  permissions={permissions}
                  handleToggle={handleToggle}
                  handleCategoryToggle={handleCategoryToggle}
                />
                <PermissionSection
                  title="Invoices"
                  list={permissionGroups.invoices}
                  permissions={permissions}
                  handleToggle={handleToggle}
                  handleCategoryToggle={handleCategoryToggle}
                />
                <PermissionSection
                  title="Point of Sale (POS)"
                  list={permissionGroups.pos}
                  permissions={permissions}
                  handleToggle={handleToggle}
                  handleCategoryToggle={handleCategoryToggle}
                />

                <div className="flex justify-end pt-6 border-t">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                  >
                    <Save className="h-4 w-4" />
                    {isSubmitting ? "Saving..." : "Save Permissions"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PermissionsForm;