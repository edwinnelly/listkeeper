"use client";

import { useRouter } from "next/navigation";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { toast } from "react-hot-toast";
import { apiGet, apiPost } from "@/lib/axios";
import { countries } from "@/app/component/country-list";
import {
  User,
  Phone,
  Building,
  CreditCard,
  ArrowLeft,
  Plus,
  Loader2,
  Users,
  Globe,
  FileText,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { withAuth } from "@/hoc/withAuth";

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

/**
 * Customer form data structure matching Laravel backend schema
 */
interface CustomerFormData {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postal_code: string;
  customer_code: string;
  registration_date: string;
  total_purchases: string;
  outstanding_balance: string;
  is_active: boolean;
  loyalty_points: string;
  dob: string;
  gender: string;
  notes: string;
  location_id: string; // Keep as string for form state
}

/**
 * Form validation errors interface
 */
interface FormErrors {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  location_id?: string;
  state?: string;
  city?: string;
  postal_code?: string;
  [key: string]: string | undefined;
}

/**
 * Business location interface
 */
interface BusinessLocation {
  id: number;
  location_name: string;
  business_key: string;
}

/**
 * User interface for the component props
 */
interface UserType {
  businesses_one?: Array<{
    country?: string;
  }>;
}

/**
 * Component props interface
 */
interface AddCustomerPageProps {
  user: UserType;
}

/**
 * Gender option interface
 */
interface GenderOption {
  value: string;
  label: string;
}

// ============================================================================
// CONSTANTS AND CONFIGURATION
// ============================================================================

/**
 * Gender options for dropdown
 */
const genderOptions: GenderOption[] = [
  { value: "", label: "Select gender" },
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
];

/**
 * CSS class constants for consistent styling
 */
const CSS_CLASSES = {
  INPUT:
    "w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200 placeholder-gray-500 text-sm hover:border-gray-400",
  INPUT_ERROR:
    "w-full px-4 py-3 bg-white border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all duration-200 placeholder-gray-500 text-sm hover:border-red-400",
  LABEL: "block text-sm font-semibold text-gray-700 mb-2",
  LABEL_ERROR: "block text-sm font-semibold text-red-700 mb-2",
  SELECT:
    "w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200 text-sm hover:border-gray-400 appearance-none cursor-pointer",
  SELECT_ERROR:
    "w-full px-4 py-3 bg-white border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all duration-200 text-sm hover:border-red-400 appearance-none cursor-pointer",
  ERROR_TEXT: "text-red-600 text-xs mt-1.5 flex items-center gap-1",
} as const;

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validates email format
 */
const validateEmail = (email: string): boolean => {
  if (!email) return true; // Empty is allowed
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validates phone number format
 */
const validatePhone = (phone: string): boolean => {
  if (!phone) return true; // Empty is allowed
  const phoneRegex = /^[\+]?[0-9\s\-\(\)]{10,}$/;
  return phoneRegex.test(phone);
};

/**
 * Validates postal code format (basic validation)
 */
const validatePostalCode = (postalCode: string): boolean => {
  if (!postalCode) return true; // Empty is allowed
  return postalCode.length >= 3 && postalCode.length <= 10;
};

/**
 * Get active business country from user object
 */
export const getActiveBusinessCountry = (user: UserType): string => {
  return user?.businesses_one?.[0]?.country ?? "USA";
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 * AddCustomerPage Component
 *
 * Handles creation of new customer records with comprehensive form validation
 * and integration with business location data.
 */
const AddCustomerPage = ({ user }: AddCustomerPageProps) => {
  // ==========================================================================
  // STATE MANAGEMENT
  // ==========================================================================
  const userCountry = getActiveBusinessCountry(user);

  const [form, setForm] = useState<CustomerFormData>({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    country: userCountry,
    postal_code: "",
    customer_code: "",
    registration_date: new Date().toISOString().split("T")[0],
    total_purchases: "0.00",
    outstanding_balance: "0.00",
    is_active: true,
    loyalty_points: "0",
    dob: "",
    gender: "",
    notes: "",
    location_id: "",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [locations, setLocations] = useState<BusinessLocation[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingLocations, setIsLoadingLocations] = useState(true);

  const router = useRouter();

  // ==========================================================================
  // LIFECYCLE METHODS
  // ==========================================================================

  /**
   * Fetch business locations on component mount
   */
  useEffect(() => {
    fetchBusinessLocations();
  }, []);

  // Update form country when userCountry changes
  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      country: userCountry,
    }));
  }, [userCountry]);

  // ==========================================================================
  // DATA FETCHING FUNCTIONS
  // ==========================================================================

  /**
   * Fetches available business locations from API
   */
  const fetchBusinessLocations = async () => {
    setIsLoadingLocations(true);
    try {
      const res = await apiGet("/locations");
      const locationsArray = res.data?.data ?? res.data?.locations ?? [];
      setLocations(Array.isArray(locationsArray) ? locationsArray : []);
    } catch (err: any) {
      console.error("Failed to load business locations:", err);
      toast.error("Failed to load business locations");
      setLocations([]);
    } finally {
      setIsLoadingLocations(false);
    }
  };

  // ==========================================================================
  // FORM HANDLERS
  // ==========================================================================

  /**
   * Handles form input changes
   */
  const handleInputChange = (
    field: keyof CustomerFormData,
    value: string | boolean,
  ) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: undefined,
      }));
    }
  };

  /**
   * Handles blur event for form fields
   */
  const handleBlur = (field: string) => {
    setTouched((prev) => ({
      ...prev,
      [field]: true,
    }));
    validateField(field, form[field as keyof CustomerFormData]);
  };

  /**
   * Validates a single form field
   */
  const validateField = (field: string, value: any): string | undefined => {
    switch (field) {
      case "first_name":
        if (
          !value ||
          (typeof value === "string" && value.trim().length === 0)
        ) {
          return "First name is required";
        }
        if (typeof value === "string" && value.trim().length < 2) {
          return "First name must be at least 2 characters";
        }
        if (typeof value === "string" && value.trim().length > 30) {
          return "First name must be less than 30 characters";
        }
        return undefined;

      case "last_name":
        if (
          !value ||
          (typeof value === "string" && value.trim().length === 0)
        ) {
          return "Last name is required";
        }
        if (typeof value === "string" && value.trim().length < 2) {
          return "Last name must be at least 2 characters";
        }
        if (typeof value === "string" && value.trim().length > 30) {
          return "Last name must be less than 30 characters";
        }
        return undefined;

      case "email":
        if (value && !validateEmail(value.toString())) {
          return "Please enter a valid email address";
        }
        if (typeof value === "string" && value.trim().length > 100) {
          return "email address must be less than 100 characters";
        }
        return undefined;

      case "phone":
        if (value && !validatePhone(value.toString())) {
          return "Please enter a valid phone number";
        }
        return undefined;

      case "location_id":
        if (!value) {
          return "Business location is required";
        }
        return undefined;

      case "state":
        if (value && typeof value === "string" && value.trim().length < 2) {
          return "State must be at least 2 characters";
        }
        if (typeof value === "string" && value.trim().length > 30) {
          return "State must be less than 30 characters";
        }
        return undefined;

      case "city":
        if (value && typeof value === "string" && value.trim().length < 2) {
          return "City must be at least 2 characters";
        }
        if (typeof value === "string" && value.trim().length > 30) {
          return "City must be less than 30 characters";
        }
        return undefined;

      case "postal_code":
        if (value && !validatePostalCode(value.toString())) {
          return "Postal code must be 3-10 characters";
        }
        return undefined;

      default:
        return undefined;
    }
  };

  /**
   * Validates all form fields
   */
  const validateAllFields = (): boolean => {
    const newErrors: FormErrors = {};
    let isValid = true;

    // Validate each field
    (Object.keys(form) as Array<keyof CustomerFormData>).forEach((field) => {
      const error = validateField(field, form[field]);
      if (error) {
        newErrors[field] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  /**
   * Generates a unique customer code
   */
  const generateCustomerCode = (): string => {
    const prefix = "CUST";
    const randomNum = Math.floor(100000 + Math.random() * 9000000);
    return `${prefix}${randomNum}`;
  };

  /**
   * Handles customer code generation button click
   */
  const handleGenerateCode = () => {
    const code = generateCustomerCode();
    setForm((prev) => ({ ...prev, customer_code: code }));
  };

  /**
   * Validates form data before submission
   */
  const validateForm = (): boolean => {
    const isValid = validateAllFields();

    if (!isValid) {
      // Show first error in toast
      const firstError = Object.values(errors).find((error) => error);
      if (firstError) {
        toast.error(firstError);
      }
      return false;
    }

    return true;
  };

  /**
   * Prepares form data for API submission
   */
  const prepareFormData = () => {
    const customerCode = form.customer_code || generateCustomerCode();

    return {
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      email: form.email.trim() || null,
      phone: form.phone.trim() || null,
      address: form.address.trim() || null,
      city: form.city.trim() || null,
      state: form.state.trim() || null,
      country: form.country,
      postal_code: form.postal_code.trim() || null,
      customer_code: customerCode,
      registration_date: form.registration_date,
      total_purchases: parseFloat(form.total_purchases) || 0.0,
      outstanding_balance: parseFloat(form.outstanding_balance) || 0.0,
      loyalty_points: parseInt(form.loyalty_points) || 0,
      is_active: form.is_active,
      dob: form.dob || null,
      gender: form.gender || null,
      notes: form.notes.trim() || null,
      location_id: parseInt(form.location_id),
    };
  };

  /**
   * Handles form submission
   */
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmitting) return;

    // Mark all fields as touched on submit
    const allTouched: Record<string, boolean> = {};
    (Object.keys(form) as Array<keyof CustomerFormData>).forEach((field) => {
      allTouched[field] = true;
    });
    setTouched(allTouched);

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const customerData = prepareFormData();
      const response = await apiPost("/customers_add", customerData, {}, [
        "/customers",
      ]);

      if (response.data?.success) {
        toast.success("Customer created successfully!", {
          id: "create-customer",
        });

        // Reset form to initial state
        setForm({
          first_name: "",
          last_name: "",
          email: "",
          phone: "",
          address: "",
          city: "",
          state: "",
          country: userCountry,
          postal_code: "",
          customer_code: "",
          registration_date: new Date().toISOString().split("T")[0],
          total_purchases: "0.00",
          outstanding_balance: "0.00",
          is_active: true,
          loyalty_points: "0",
          dob: "",
          gender: "",
          notes: "",
          location_id: "",
        });

        // Clear errors and touched states
        setErrors({});
        setTouched({});

        // Redirect to customers list after successful creation
        setTimeout(() => {
          router.push("/customers");
        }, 1500);
      }
    } catch (err: any) {
      const status = err.response?.status;

      // Handle specific error cases
      if (status === 403) {
        toast.error("You do not have permission to create customers");
      } else if (status === 422) {
        const errors = err.response?.data?.errors;
        if (errors) {
          // Map backend errors to form errors
          const formErrors: FormErrors = {};
          Object.keys(errors).forEach((key) => {
            const field = key as keyof FormErrors;
            formErrors[field] = errors[key][0];
          });
          setErrors(formErrors);

          // Show first error in toast
          const firstError = Object.values(errors)[0];
          if (firstError && Array.isArray(firstError)) {
            toast.error(firstError[0]);
          }
        } else {
          toast.error("Validation failed. Please check your input.");
        }
      } else {
        toast.error("Failed to create customer. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // ==========================================================================
  // FORM VALIDATION
  // ==========================================================================

  const isFormValid =
    form.first_name.trim().length > 0 &&
    form.last_name.trim().length > 0 &&
    form.location_id !== "" &&
    !errors.first_name &&
    !errors.last_name &&
    !errors.email &&
    !errors.phone &&
    !errors.location_id;

  // ==========================================================================
  // RENDER
  // ==========================================================================

  return (
    <div className="min-h-screen bg-gray-50/30">
      {/* HEADER SECTION */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-8xl mx-auto px-6 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center space-x-4">
                <Link
                  href="/customers"
                  className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors group"
                >
                  <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                  Back to Customers
                </Link>
                <div className="h-6 w-px bg-gray-300"></div>
                <h1 className="text-2xl font-normal text-gray-900">
                  Create New Customer
                </h1>
              </div>
              <p className="text-gray-600 text-sm">
                Add a new customer to your business
              </p>
            </div>

            {/* ACTION BUTTONS */}
            <div className="flex items-center gap-3">
              <Link
                href="/customers"
                className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-5 py-2.5 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-medium shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Users size={18} />
                View All Customers
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* STATS CARDS SECTION */}
      <div className="max-w-8xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* QUICK STATS CARDS */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  New Customer
                </p>
                <p className="text-2xl font-bold text-gray-900 mt-1">Profile</p>
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
                  Default Country
                </p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {userCountry}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
                <Globe className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Status</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {form.is_active ? "Active" : "Inactive"}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center">
                {form.is_active ? (
                  <CheckCircle className="h-6 w-6 text-purple-600" />
                ) : (
                  <XCircle className="h-6 w-6 text-purple-600" />
                )}
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Business Locations
                </p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {locations.length}
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-50 rounded-xl flex items-center justify-center">
                <Building className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </div>
        </div>

        {/* MAIN FORM CARD */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {/* FORM HEADER */}
          <div className="px-6 py-5 border-b border-gray-200 bg-gray-50/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-50 rounded-xl flex items-center justify-center">
                  <User className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Customer Profile
                  </h2>
                  <p className="text-gray-500 text-sm">
                    Complete all required fields to create a new customer
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* FORM CONTENT */}
          <form onSubmit={onSubmit} className="p-6 space-y-8">
            {/* SECTION 1: PERSONAL INFORMATION */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                  <User className="w-4 h-4 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Personal Information
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label
                      className={`${errors.first_name ? CSS_CLASSES.LABEL_ERROR : CSS_CLASSES.LABEL} flex items-center gap-1`}
                    >
                      First Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      maxLength={30}
                      value={form.first_name}
                      onChange={(e) =>
                        handleInputChange("first_name", e.target.value)
                      }
                      onBlur={() => handleBlur("first_name")}
                      required
                      className={
                        errors.first_name
                          ? CSS_CLASSES.INPUT_ERROR
                          : CSS_CLASSES.INPUT
                      }
                      placeholder="Enter first name"
                    />
                    {errors.first_name && (
                      <div className={CSS_CLASSES.ERROR_TEXT}>
                        <XCircle size={12} />
                        {errors.first_name}
                      </div>
                    )}
                  </div>

                  <div>
                    <label
                      className={`${errors.last_name ? CSS_CLASSES.LABEL_ERROR : CSS_CLASSES.LABEL} flex items-center gap-1`}
                    >
                      Last Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      maxLength={30}
                      value={form.last_name}
                      onChange={(e) =>
                        handleInputChange("last_name", e.target.value)
                      }
                      onBlur={() => handleBlur("last_name")}
                      required
                      className={
                        errors.last_name
                          ? CSS_CLASSES.INPUT_ERROR
                          : CSS_CLASSES.INPUT
                      }
                      placeholder="Enter last name"
                    />
                    {errors.last_name && (
                      <div className={CSS_CLASSES.ERROR_TEXT}>
                        <XCircle size={12} />
                        {errors.last_name}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className={CSS_CLASSES.LABEL}>Gender</label>
                    <select
                      value={form.gender}
                      onChange={(e) =>
                        handleInputChange("gender", e.target.value)
                      }
                      className={CSS_CLASSES.SELECT}
                    >
                      {genderOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className={CSS_CLASSES.LABEL}>Date of Birth</label>
                    <input
                      type="date"
                      value={form.dob}
                      onChange={(e) => handleInputChange("dob", e.target.value)}
                      className={CSS_CLASSES.INPUT}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200"></div>

            {/* SECTION 2: CONTACT INFORMATION */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                  <Phone className="w-4 h-4 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Contact Information
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label
                    className={`${errors.email ? CSS_CLASSES.LABEL_ERROR : CSS_CLASSES.LABEL}`}
                  >
                    Email Address
                  </label>
                  <input
                    type="email"
                    maxLength={70}
                    value={form.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    onBlur={() => handleBlur("email")}
                    className={
                      errors.email ? CSS_CLASSES.INPUT_ERROR : CSS_CLASSES.INPUT
                    }
                    placeholder="customer@example.com"
                  />
                  {errors.email && (
                    <div className={CSS_CLASSES.ERROR_TEXT}>
                      <XCircle size={12} />
                      {errors.email}
                    </div>
                  )}
                </div>

                <div>
                  <label
                    className={`${errors.phone ? CSS_CLASSES.LABEL_ERROR : CSS_CLASSES.LABEL}`}
                  >
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    maxLength={18}
                    value={form.phone}
                    onChange={(e) =>
                      handleInputChange(
                        "phone",
                        e.target.value.replace(/[^\d+ ]/g, "").slice(0, 18),
                      )
                    }
                     onBlur={() => handleBlur("phone")}
                    className={
                      errors.phone ? CSS_CLASSES.INPUT_ERROR : CSS_CLASSES.INPUT
                    }
                    placeholder="+234 800 000 0000"
                  />
                  {errors.phone && (
                    <div className={CSS_CLASSES.ERROR_TEXT}>
                      <XCircle size={12} />
                      {errors.phone}
                    </div>
                  )}
                </div>

                <div>
                  <label className={CSS_CLASSES.LABEL}>Country</label>
                  <select
                    value={form.country}
                    onChange={(e) =>
                      handleInputChange("country", e.target.value)
                    }
                    className={CSS_CLASSES.SELECT}
                  >
                    {countries.map((country) => (
                      <option key={country} value={country}>
                        {country}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    className={`${errors.state ? CSS_CLASSES.LABEL_ERROR : CSS_CLASSES.LABEL}`}
                  >
                    State
                  </label>
                  <input
                    type="text"
                    maxLength={40}
                    value={form.state}
                    onChange={(e) => handleInputChange("state", e.target.value)}
                    onBlur={() => handleBlur("state")}
                    className={
                      errors.state ? CSS_CLASSES.INPUT_ERROR : CSS_CLASSES.INPUT
                    }
                    placeholder="Enter state"
                  />
                  {errors.state && (
                    <div className={CSS_CLASSES.ERROR_TEXT}>
                      <XCircle size={12} />
                      {errors.state}
                    </div>
                  )}
                </div>

                <div>
                  <label
                    className={`${errors.city ? CSS_CLASSES.LABEL_ERROR : CSS_CLASSES.LABEL}`}
                  >
                    City
                  </label>
                  <input
                    type="text"
                    maxLength={50}
                    value={form.city}
                    onChange={(e) => handleInputChange("city", e.target.value)}
                    onBlur={() => handleBlur("city")}
                    className={
                      errors.city ? CSS_CLASSES.INPUT_ERROR : CSS_CLASSES.INPUT
                    }
                    placeholder="Enter city"
                  />
                  {errors.city && (
                    <div className={CSS_CLASSES.ERROR_TEXT}>
                      <XCircle size={12} />
                      {errors.city}
                    </div>
                  )}
                </div>

                <div>
                  <label
                    className={`${errors.postal_code ? CSS_CLASSES.LABEL_ERROR : CSS_CLASSES.LABEL}`}
                  >
                    Postal Code
                  </label>
                  <input
                    type="text"
                    maxLength={15}
                    value={form.postal_code}
                    onChange={(e) =>
                      handleInputChange("postal_code", e.target.value)
                    }
                    onBlur={() => handleBlur("postal_code")}
                    className={
                      errors.postal_code
                        ? CSS_CLASSES.INPUT_ERROR
                        : CSS_CLASSES.INPUT
                    }
                    placeholder="100001"
                  />
                  {errors.postal_code && (
                    <div className={CSS_CLASSES.ERROR_TEXT}>
                      <XCircle size={12} />
                      {errors.postal_code}
                    </div>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className={CSS_CLASSES.LABEL}>Address</label>
                  <textarea
                    rows={2}
                    maxLength={100}
                    value={form.address}
                    onChange={(e) =>
                      handleInputChange("address", e.target.value)
                    }
                    className={`${CSS_CLASSES.INPUT} resize-none`}
                    placeholder="Enter full address"
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200"></div>

            {/* SECTION 3: BUSINESS & ACCOUNT INFORMATION */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                  <Building className="w-4 h-4 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Business & Account Information
                </h3>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label
                      className={`${errors.location_id ? CSS_CLASSES.LABEL_ERROR : CSS_CLASSES.LABEL} flex items-center gap-1`}
                    >
                      Business Location <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={form.location_id}
                      onChange={(e) =>
                        handleInputChange("location_id", e.target.value)
                      }
                      onBlur={() => handleBlur("location_id")}
                      required
                      className={`${errors.location_id ? CSS_CLASSES.SELECT_ERROR : CSS_CLASSES.SELECT} ${isLoadingLocations ? "opacity-50" : ""}`}
                      disabled={isLoadingLocations}
                    >
                      <option value="">Select location</option>
                      {isLoadingLocations ? (
                        <option disabled>Loading locations...</option>
                      ) : locations.length === 0 ? (
                        <option disabled>No locations available</option>
                      ) : (
                        locations.map((location) => (
                          <option
                            key={location.id}
                            value={location.id.toString()}
                          >
                            {location.location_name}
                          </option>
                        ))
                      )}
                    </select>
                    {errors.location_id && (
                      <div className={CSS_CLASSES.ERROR_TEXT}>
                        <XCircle size={12} />
                        {errors.location_id}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className={CSS_CLASSES.LABEL}>Customer Code</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        maxLength={30}
                        value={form.customer_code}
                        onChange={(e) =>
                          handleInputChange("customer_code", e.target.value)
                        }
                        className={CSS_CLASSES.INPUT}
                        placeholder="Auto-generated"
                      />
                      <button
                        type="button"
                        onClick={handleGenerateCode}
                        className="px-4 py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors whitespace-nowrap text-sm"
                      >
                        Generate
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className={CSS_CLASSES.LABEL}>
                      Registration Date
                    </label>
                    <input
                      type="date"
                      value={form.registration_date}
                      onChange={(e) =>
                        handleInputChange("registration_date", e.target.value)
                      }
                      className={CSS_CLASSES.INPUT}
                    />
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
                              form.is_active ? "translate-x-6" : "translate-x-0"
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
                            ? "Customer is active and can make purchases"
                            : "Customer is inactive and cannot make purchases"}
                        </p>
                      </div>
                    </label>
                  </div>
                </div>

                {/* ACCOUNT INFORMATION */}
                <div className="p-6 bg-gradient-to-br from-blue-50/50 to-blue-100/30 rounded-xl border border-blue-200">
                  <h4 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    Account Details
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className={CSS_CLASSES.LABEL}>
                        Total Purchases (₦)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={form.total_purchases}
                        onChange={(e) =>
                          handleInputChange("total_purchases", e.target.value)
                        }
                        className={CSS_CLASSES.INPUT}
                        placeholder="0.00"
                      />
                    </div>

                    <div>
                      <label className={CSS_CLASSES.LABEL}>
                        Outstanding Balance (₦)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={form.outstanding_balance}
                        onChange={(e) =>
                          handleInputChange(
                            "outstanding_balance",
                            e.target.value,
                          )
                        }
                        className={CSS_CLASSES.INPUT}
                        placeholder="0.00"
                      />
                    </div>

                    <div>
                      <label className={CSS_CLASSES.LABEL}>
                        Loyalty Points
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={form.loyalty_points}
                        onChange={(e) =>
                          handleInputChange("loyalty_points", e.target.value)
                        }
                        className={CSS_CLASSES.INPUT}
                        placeholder="0"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200"></div>

            {/* SECTION 4: ADDITIONAL INFORMATION */}
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
                <label className={CSS_CLASSES.LABEL}>Notes</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => handleInputChange("notes", e.target.value)}
                  className={`${CSS_CLASSES.INPUT} resize-none`}
                  placeholder="Additional notes, special instructions, or remarks about this customer..."
                  rows={4}
                />
                <p className="text-xs text-gray-500 mt-2">
                  Optional: Add any additional information about this customer
                </p>
              </div>
            </div>

            {/* FORM ACTIONS */}
            <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
              <Link
                href="/customers"
                className="px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={!isFormValid || isSubmitting || isLoadingLocations}
                className="px-6 py-3 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/25"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus size={16} />
                    Create Customer
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* HELP TEXT */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-700">
            <span className="font-medium">Note:</span> Required fields are
            marked with a red asterisk (*). The customer will be automatically
            associated with your current active business.
          </p>
        </div>
      </div>
    </div>
  );
};

// Wrap the component with withAuth HOC
export default withAuth(AddCustomerPage);
