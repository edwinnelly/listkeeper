'use client';

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, FormEvent, useCallback, useMemo } from "react";
import Link from "next/link";
import api from "@/lib/axios";
import Cookies from "js-cookie";
import {
  User,
  Building,
  CreditCard,
  ArrowLeft,
  Save,
  Loader2,
  Users,
  Globe,
  CheckCircle,
  XCircle,
  Edit,
} from "lucide-react";
import toast from "react-hot-toast";
import { countries } from "@/app/component/country-list";

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

/** Customer form data interface */
interface CustomerFormData {
  id?: number;
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
  location_id: string;
}

/** Business location interface */
interface BusinessLocation {
  id: number;
  location_name: string;
  business_key: string;
}

/** User type interface */
interface UserType {
  businesses_one?: Array<{ country?: string }>;
}

/** Form errors interface */
interface FormErrors {
  [key: string]: string | undefined;
}

/** Gender option interface */
interface GenderOption {
  value: string;
  label: string;
}

/** Error response interface */
interface ErrorResponse {
  message?: string;
  errors?: Record<string, string[]>;
}

/** Customer API data interface */
interface CustomerApiData {
  id?: number;
  customer_id?: number;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
  customer_code?: string;
  registration_date?: string;
  total_purchases?: string | number;
  outstanding_balance?: string | number;
  is_active?: boolean;
  loyalty_points?: string | number;
  dob?: string;
  date_of_birth?: string;
  gender?: string;
  notes?: string;
  location_id?: number | string;
  business_location_id?: number | string;
}

// =============================================================================
// CONSTANTS
// =============================================================================

/** CSS classes for consistent styling */
const INPUT_CLASS =
  "w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent outline-none transition-all duration-200 placeholder-gray-400 text-sm";
const INPUT_ERROR_CLASS =
  "w-full px-4 py-3 bg-white border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all duration-200 placeholder-gray-400 text-sm";
const LABEL_CLASS = "block text-sm font-medium text-gray-700 mb-2";
const LABEL_ERROR_CLASS = "block text-sm font-medium text-red-700 mb-2";
const SELECT_CLASS =
  "w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent outline-none transition-all duration-200 text-sm appearance-none cursor-pointer";
const SELECT_ERROR_CLASS =
  "w-full px-4 py-3 bg-white border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all duration-200 text-sm appearance-none cursor-pointer";
const ERROR_TEXT_CLASS = "text-red-600 text-xs mt-1.5 flex items-center gap-1";

/** Gender options for dropdown */
const GENDER_OPTIONS: GenderOption[] = [
  { value: "", label: "Select gender" },
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
];

/** Required fields for validation */
const REQUIRED_FIELDS = ["first_name", "last_name", "location_id"] as const;

// =============================================================================
// VALIDATION FUNCTIONS
// =============================================================================

/**
 * Validates email format
 */
const validateEmail = (email: string): boolean => {
  if (!email.trim()) return true;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validates phone number format
 */
const validatePhone = (phone: string): boolean => {
  if (!phone.trim()) return true;
  const phoneRegex = /^[\+]?[0-9\s\-\(\)]{10,}$/;
  return phoneRegex.test(phone.replace(/\s+/g, ""));
};

/**
 * Validates postal code format
 */
const validatePostalCode = (postalCode: string): boolean => {
  if (!postalCode.trim()) return true;
  return postalCode.length >= 3 && postalCode.length <= 10;
};

/**
 * Gets active business country from user data
 */
const getActiveBusinessCountry = (user: UserType): string => {
  return user?.businesses_one?.[0]?.country || "USA";
};

/**
 * Validates individual field - FIXED to handle undefined
 */
const validateField = (
  field: string,
  value: string | boolean | number | undefined
): string | undefined => {
  // Handle undefined or null values
  if (value === undefined || value === null) {
    if (field === "first_name" || field === "last_name" || field === "location_id") {
      return `${field.replace(/_/g, " ")} is required`;
    }
    return undefined;
  }

  const stringValue = value?.toString().trim() || "";

  switch (field) {
    case "first_name":
      if (!stringValue) return "First name is required";
      if (stringValue.length < 2)
        return "First name must be at least 2 characters";
      if (stringValue.length > 30)
        return "First name cannot exceed 30 characters";
      return undefined;

    case "last_name":
      if (!stringValue) return "Last name is required";
      if (stringValue.length < 2)
        return "Last name must be at least 2 characters";
      if (stringValue.length > 30)
        return "Last name cannot exceed 30 characters";
      return undefined;

    case "email":
      if (stringValue && !validateEmail(stringValue)) {
        return "Please enter a valid email address";
      }
      if (stringValue.length > 100)
        return "Email cannot exceed 100 characters";
      return undefined;

    case "phone":
      if (stringValue && !validatePhone(stringValue)) {
        return "Please enter a valid phone number";
      }
      if (stringValue.length < 8)
        return "Phone number must be at least 8 digits";
      if (stringValue.length > 18)
        return "Phone number cannot exceed 18 digits";
      return undefined;

    case "location_id":
      if (!stringValue) return "Business location is required";
      return undefined;

    case "state":
      if (stringValue && stringValue.length < 2) {
        return "State must be at least 2 characters";
      }
      if (stringValue.length > 30) return "State cannot exceed 30 characters";
      return undefined;

    case "city":
      if (stringValue && stringValue.length < 2) {
        return "City must be at least 2 characters";
      }
      if (stringValue.length > 30) return "City cannot exceed 30 characters";
      return undefined;

    case "postal_code":
      if (stringValue && !validatePostalCode(stringValue)) {
        return "Postal code must be 3-10 characters";
      }
      return undefined;

    case "address":
      if (stringValue.length > 200)
        return "Address cannot exceed 200 characters";
      return undefined;

    case "notes":
      if (stringValue.length > 500)
        return "Notes cannot exceed 500 characters";
      return undefined;

    default:
      return undefined;
  }
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

/**
 * EditCustomerPage Component
 * Handles editing customer information with form validation
 */
const EditCustomerPage = () => {
  // ===========================================================================
  // HOOKS AND STATE
  // ===========================================================================

  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [user, setUser] = useState<UserType | null>(null);
  const [form, setForm] = useState<CustomerFormData>({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    country: "USA",
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
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingLocations, setIsLoadingLocations] = useState(true);
  const [originalData, setOriginalData] = useState<CustomerFormData | null>(
    null
  );

  // ===========================================================================
  // COMPUTED VALUES
  // ===========================================================================

  /** Gets active business country from user data */
  const userCountry = useMemo(() => {
    return user ? getActiveBusinessCountry(user) : "USA";
  }, [user]);

  /** Checks if form has any changes */
  const hasChanges = useMemo(() => {
    if (!originalData) return false;
    return Object.keys(form).some((key) => {
      const formKey = key as keyof CustomerFormData;
      return form[formKey] !== originalData[formKey];
    });
  }, [form, originalData]);

  /** Validates if form is valid for submission */
  const isFormValid = useMemo(() => {
    const requiredFieldsValid = REQUIRED_FIELDS.every(
      (field) => form[field]?.toString().trim().length > 0
    );

    const noValidationErrors = Object.values(errors).every(
      (error) => !error || error === ""
    );

    return requiredFieldsValid && noValidationErrors;
  }, [form, errors]);

  // ===========================================================================
  // VALIDATION FUNCTIONS
  // ===========================================================================

  /**
   * Validates all fields - FIXED to handle undefined values
   */
  const validateAllFields = (): boolean => {
    const newErrors: FormErrors = {};
    let isValid = true;

    (Object.keys(form) as Array<keyof CustomerFormData>).forEach((field) => {
      const value = form[field];
      // Handle undefined by converting to empty string for validation
      const error = validateField(field, value);
      if (error) {
        newErrors[field] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  // ===========================================================================
  // API CALLS
  // ===========================================================================

  /**
   * Fetches user data from API
   */
  const fetchUser = useCallback(async () => {
    try {
      await api.get("/sanctum/csrf-cookie");
      const res = await api.get("/user", {
        headers: { "X-XSRF-TOKEN": Cookies.get("XSRF-TOKEN") || "" },
      });
      setUser(res.data);
      return res.data;
    } catch (error) {
      console.error("Error fetching user:", error);
      toast.error("Failed to load user data");
      return null;
    }
  }, []);

  /**
   * Fetches customer data from API
   */
  const fetchCustomer = useCallback(async (userData?: UserType) => {
    if (!id) return;

    try {
      await api.get("/sanctum/csrf-cookie");
      const res = await api.get(`/customers/${id}`, {
        headers: { "X-XSRF-TOKEN": Cookies.get("XSRF-TOKEN") || "" },
      });

      const customerData: CustomerApiData =
        res.data?.data || res.data?.customer || res.data;

      if (!customerData) {
        toast.error("Customer data not found");
        router.push("/customers");
        return;
      }

      const country = customerData.country || 
        (userData ? getActiveBusinessCountry(userData) : "USA");

      const formattedData: CustomerFormData = {
        id: customerData.id || customerData.customer_id,
        first_name: customerData.first_name || "",
        last_name: customerData.last_name || "",
        email: customerData.email || "",
        phone: customerData.phone || "",
        address: customerData.address || "",
        city: customerData.city || "",
        state: customerData.state || "",
        country: country,
        postal_code: customerData.postal_code || "",
        customer_code: customerData.customer_code || "",
        registration_date: customerData.registration_date
          ? new Date(customerData.registration_date).toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0],
        total_purchases: customerData.total_purchases?.toString() || "0.00",
        outstanding_balance:
          customerData.outstanding_balance?.toString() || "0.00",
        is_active: Boolean(customerData.is_active ?? true),
        loyalty_points: customerData.loyalty_points?.toString() || "0",
        dob:
          customerData.dob || customerData.date_of_birth
            ? new Date(
                customerData.dob || customerData.date_of_birth || ""
              ).toISOString()
                .split("T")[0]
            : "",
        gender: customerData.gender || "",
        notes: customerData.notes || "",
        location_id:
          (
            customerData.location_id || customerData.business_location_id
          )?.toString() || "",
      };

      setForm(formattedData);
      setOriginalData(formattedData);
    } catch {
      toast.error("Failed to load customer data");
      router.push("/customers");
    }
  }, [id, router]);

  /**
   * Fetches business locations from API
   */
  const fetchBusinessLocations = useCallback(async () => {
    setIsLoadingLocations(true);
    try {
      await api.get("/sanctum/csrf-cookie");
      const res = await api.get("/locations", {
        headers: { "X-XSRF-TOKEN": Cookies.get("XSRF-TOKEN") || "" },
      });

      const locationsArray = res.data?.data || res.data?.locations || res.data;

      setLocations(Array.isArray(locationsArray) ? locationsArray : []);
    } catch {
      console.error("Error fetching locations");
      toast.error("Failed to load business locations");
      setLocations([]);
    } finally {
      setIsLoadingLocations(false);
    }
  }, []);

  /**
   * Fetches all data
   */
  const fetchData = useCallback(async () => {
    if (!id) {
      toast.error("Invalid customer ID");
      router.push("/customers");
      return;
    }

    setIsLoading(true);
    try {
      const userData = await fetchUser();
      await Promise.all([
        fetchCustomer(userData || undefined),
        fetchBusinessLocations()
      ]);
    } catch {
      toast.error("Failed to load data");
    } finally {
      setIsLoading(false);
    }
  }, [id, router, fetchUser, fetchCustomer, fetchBusinessLocations]);

  // ===========================================================================
  // EFFECTS
  // ===========================================================================

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (Object.keys(touched).length > 0) {
      const newErrors: FormErrors = {};
      (Object.keys(form) as Array<keyof CustomerFormData>).forEach((field) => {
        if (touched[field]) {
          const error = validateField(field, form[field]);
          if (error) {
            newErrors[field] = error;
          }
        }
      });
      setErrors(newErrors);
    }
  }, [form, touched]);

  useEffect(() => {
    if (user && !form.country) {
      setForm(prev => ({
        ...prev,
        country: userCountry
      }));
    }
  }, [user, userCountry, form.country]);

  // ===========================================================================
  // EVENT HANDLERS
  // ===========================================================================

  /**
   * Handles input field changes
   */
  const handleInputChange = (
    field: keyof CustomerFormData,
    value: string | boolean
  ) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));

    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: undefined,
      }));
    }
  };

  /**
   * Handles field blur for validation
   */
  const handleBlur = (field: string) => {
    setTouched((prev) => ({
      ...prev,
      [field]: true,
    }));
  };

  /**
   * Prepares form data for submission
   */
  const prepareFormData = () => {
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
      customer_code: form.customer_code,
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
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (isSubmitting) return;

    const allTouched: Record<string, boolean> = {};
    (Object.keys(form) as Array<keyof CustomerFormData>).forEach((field) => {
      allTouched[field] = true;
    });
    setTouched(allTouched);

    if (!validateAllFields()) {
      const firstError = Object.values(errors).find((error) => error);
      if (firstError) {
        toast.error(firstError);
        const errorField = Object.keys(errors).find((key) => errors[key]);
        if (errorField) {
          const element = document.querySelector(`[name="${errorField}"]`);
          element?.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }
      return;
    }

    if (!hasChanges) {
      toast.error("No changes detected");
      return;
    }

    setIsSubmitting(true);

    try {
      await api.get("/sanctum/csrf-cookie");

      const customerData = prepareFormData();
      const res = await api.put(`/customersupdate/${id}`, customerData, {
        headers: { "X-XSRF-TOKEN": Cookies.get("XSRF-TOKEN") || "" },
      });

      if (res.status === 200) {
        toast.success("Customer updated successfully!", {
          duration: 3000,
        });
        setOriginalData(form);
        router.push("/customers");
      } else {
        throw new Error("Update failed");
      }
    } catch (err) {
      const error = err as { response?: { status?: number; data?: ErrorResponse } };
      console.error("Error updating customer:", error);

      const status = error.response?.status;
      const responseData = error.response?.data;

      if (status === 422) {
        const backendErrors = responseData?.errors;
        if (backendErrors) {
          const formErrors: FormErrors = {};
          Object.keys(backendErrors).forEach((key) => {
            formErrors[key] = backendErrors[key][0];
          });
          setErrors(formErrors);

          const firstErrorMessage = Object.values(formErrors)[0];
          if (firstErrorMessage) {
            toast.error(firstErrorMessage);
          }
        }
      } else if (status === 404) {
        toast.error("Customer not found");
        router.push("/customers");
      } else if (status === 409) {
        toast.error(
          responseData?.message ||
            "Customer already exists with similar details"
        );
      } else {
        toast.error(
          responseData?.message ||
            "Failed to update customer. Please try again."
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Handles form reset
   */
  const handleReset = () => {
    if (originalData) {
      setForm(originalData);
      setErrors({});
      setTouched({});
      toast.success("Changes reset to original values");
    }
  };

  // ===========================================================================
  // RENDER
  // ===========================================================================

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-gray-600 mx-auto" />
          <p className="mt-4 text-gray-600">Loading customer data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="mb-8">
          <Link
            href="/customers"
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Customers
          </Link>
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Edit Customer</h1>
              <p className="text-gray-600 mt-1">
                {form.customer_code && `Customer Code: ${form.customer_code} | `}
                Update customer information
              </p>
            </div>
            <Link
              href="/customers"
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              <Users size={18} />
              View All Customers
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Customer Profile</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {form.first_name} {form.last_name}
                </p>
              </div>
              <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center">
                <User className="h-6 w-6 text-gray-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Default Country</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{userCountry}</p>
              </div>
              <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center">
                <Globe className="h-6 w-6 text-gray-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Status</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {form.is_active ? "Active" : "Inactive"}
                </p>
              </div>
              <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center">
                {form.is_active ? (
                  <CheckCircle className="h-6 w-6 text-gray-600" />
                ) : (
                  <XCircle className="h-6 w-6 text-gray-600" />
                )}
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Business Locations</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{locations.length}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-50 rounded-xl flex items-center justify-center">
                <Building className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Form Card */}
        <div className="bg-white shadow-sm border border-gray-200 overflow-hidden rounded-xl">
          {/* Card Header */}
          <div className="bg-gradient-to-r from-gray-900 to-gray-800 px-6 py-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-white/10 rounded-lg">
                  <Edit className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">Edit Customer Profile</h2>
                  <p className="text-gray-300 text-sm">Update customer information as needed</p>
                </div>
              </div>
              {hasChanges && (
                <div className="flex items-center gap-2 px-4 py-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <XCircle className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm font-medium text-yellow-700">Unsaved changes</span>
                </div>
              )}
            </div>
          </div>

          {/* Customer Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-8">
            {/* Personal Information Section */}
            <section>
              <h3 className="text-base font-semibold text-gray-900 mb-4">Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={errors.first_name ? LABEL_ERROR_CLASS : LABEL_CLASS}>
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="first_name"
                    value={form.first_name}
                    onChange={(e) => handleInputChange("first_name", e.target.value)}
                    onBlur={() => handleBlur("first_name")}
                    required
                    className={errors.first_name ? INPUT_ERROR_CLASS : INPUT_CLASS}
                    placeholder="Enter first name"
                    maxLength={50}
                  />
                  {errors.first_name && (
                    <div className={ERROR_TEXT_CLASS}>
                      <XCircle size={12} />
                      {errors.first_name}
                    </div>
                  )}
                </div>

                <div>
                  <label className={errors.last_name ? LABEL_ERROR_CLASS : LABEL_CLASS}>
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="last_name"
                    value={form.last_name}
                    onChange={(e) => handleInputChange("last_name", e.target.value)}
                    onBlur={() => handleBlur("last_name")}
                    required
                    className={errors.last_name ? INPUT_ERROR_CLASS : INPUT_CLASS}
                    placeholder="Enter last name"
                    maxLength={50}
                  />
                  {errors.last_name && (
                    <div className={ERROR_TEXT_CLASS}>
                      <XCircle size={12} />
                      {errors.last_name}
                    </div>
                  )}
                </div>

                <div>
                  <label className={LABEL_CLASS}>Gender</label>
                  <select
                    name="gender"
                    value={form.gender}
                    onChange={(e) => handleInputChange("gender", e.target.value)}
                    className={SELECT_CLASS}
                  >
                    {GENDER_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={LABEL_CLASS}>Date of Birth</label>
                  <input
                    type="date"
                    name="dob"
                    value={form.dob}
                    onChange={(e) => handleInputChange("dob", e.target.value)}
                    className={INPUT_CLASS}
                    max={new Date().toISOString().split("T")[0]}
                  />
                </div>
              </div>
            </section>

            {/* Contact Information Section */}
            <section>
              <h3 className="text-base font-semibold text-gray-900 mb-4">Contact Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={errors.email ? LABEL_ERROR_CLASS : LABEL_CLASS}>
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    onBlur={() => handleBlur("email")}
                    className={errors.email ? INPUT_ERROR_CLASS : INPUT_CLASS}
                    placeholder="customer@example.com"
                    maxLength={100}
                  />
                  {errors.email && (
                    <div className={ERROR_TEXT_CLASS}>
                      <XCircle size={12} />
                      {errors.email}
                    </div>
                  )}
                </div>

                <div>
                  <label className={errors.phone ? LABEL_ERROR_CLASS : LABEL_CLASS}>
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={form.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    onBlur={() => handleBlur("phone")}
                    className={errors.phone ? INPUT_ERROR_CLASS : INPUT_CLASS}
                    placeholder="+234 800 000 0000"
                  />
                  {errors.phone && (
                    <div className={ERROR_TEXT_CLASS}>
                      <XCircle size={12} />
                      {errors.phone}
                    </div>
                  )}
                </div>

                <div>
                  <label className={LABEL_CLASS}>Country</label>
                  <select
                    name="country"
                    value={form.country}
                    onChange={(e) => handleInputChange("country", e.target.value)}
                    className={SELECT_CLASS}
                  >
                    {countries.map((country) => (
                      <option key={country} value={country}>
                        {country}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={errors.state ? LABEL_ERROR_CLASS : LABEL_CLASS}>
                    State
                  </label>
                  <input
                    type="text"
                    name="state"
                    value={form.state}
                    onChange={(e) => handleInputChange("state", e.target.value)}
                    onBlur={() => handleBlur("state")}
                    className={errors.state ? INPUT_ERROR_CLASS : INPUT_CLASS}
                    placeholder="Enter state"
                  />
                  {errors.state && (
                    <div className={ERROR_TEXT_CLASS}>
                      <XCircle size={12} />
                      {errors.state}
                    </div>
                  )}
                </div>

                <div>
                  <label className={errors.city ? LABEL_ERROR_CLASS : LABEL_CLASS}>
                    City
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={form.city}
                    onChange={(e) => handleInputChange("city", e.target.value)}
                    onBlur={() => handleBlur("city")}
                    className={errors.city ? INPUT_ERROR_CLASS : INPUT_CLASS}
                    placeholder="Enter city"
                  />
                  {errors.city && (
                    <div className={ERROR_TEXT_CLASS}>
                      <XCircle size={12} />
                      {errors.city}
                    </div>
                  )}
                </div>

                <div>
                  <label className={errors.postal_code ? LABEL_ERROR_CLASS : LABEL_CLASS}>
                    Postal Code
                  </label>
                  <input
                    type="text"
                    name="postal_code"
                    value={form.postal_code}
                    onChange={(e) => handleInputChange("postal_code", e.target.value)}
                    onBlur={() => handleBlur("postal_code")}
                    className={errors.postal_code ? INPUT_ERROR_CLASS : INPUT_CLASS}
                    placeholder="100001"
                    maxLength={10}
                  />
                  {errors.postal_code && (
                    <div className={ERROR_TEXT_CLASS}>
                      <XCircle size={12} />
                      {errors.postal_code}
                    </div>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className={LABEL_CLASS}>Address</label>
                  <textarea
                    name="address"
                    rows={2}
                    value={form.address}
                    onChange={(e) => handleInputChange("address", e.target.value)}
                    className={`${INPUT_CLASS} resize-none`}
                    placeholder="Enter full address"
                    maxLength={200}
                  />
                </div>
              </div>
            </section>

            {/* Business & Account Information Section */}
            <section>
              <h3 className="text-base font-semibold text-gray-900 mb-4">Business & Account Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={errors.location_id ? LABEL_ERROR_CLASS : LABEL_CLASS}>
                    Business Location <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="location_id"
                    value={form.location_id}
                    onChange={(e) => handleInputChange("location_id", e.target.value)}
                    onBlur={() => handleBlur("location_id")}
                    required
                    className={`${errors.location_id ? SELECT_ERROR_CLASS : SELECT_CLASS} ${
                      isLoadingLocations ? "opacity-50" : ""
                    }`}
                    disabled={isLoadingLocations}
                  >
                    <option value="">Select location</option>
                    {isLoadingLocations ? (
                      <option disabled>Loading locations...</option>
                    ) : locations.length === 0 ? (
                      <option disabled>No locations available</option>
                    ) : (
                      locations.map((location) => (
                        <option key={location.id} value={location.id.toString()}>
                          {location.location_name}
                        </option>
                      ))
                    )}
                  </select>
                  {errors.location_id && (
                    <div className={ERROR_TEXT_CLASS}>
                      <XCircle size={12} />
                      {errors.location_id}
                    </div>
                  )}
                </div>

                <div>
                  <label className={LABEL_CLASS}>Customer Code</label>
                  <input
                    type="text"
                    name="customer_code"
                    value={form.customer_code}
                    onChange={(e) => handleInputChange("customer_code", e.target.value)}
                    className={`${INPUT_CLASS} bg-gray-50 cursor-not-allowed`}
                    placeholder="Auto-generated"
                    readOnly
                  />
                </div>

                <div>
                  <label className={LABEL_CLASS}>Registration Date</label>
                  <input
                    type="date"
                    name="registration_date"
                    value={form.registration_date}
                    onChange={(e) => handleInputChange("registration_date", e.target.value)}
                    className={INPUT_CLASS}
                  />
                </div>

                <div className="pt-4">
                  <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors cursor-pointer">
                    <div className="relative">
                      <input
                        type="checkbox"
                        name="is_active"
                        checked={form.is_active}
                        onChange={(e) => handleInputChange("is_active", e.target.checked)}
                        className="sr-only"
                      />
                      <div
                        className={`w-12 h-6 flex items-center rounded-full p-1 transition-all ${
                          form.is_active ? "bg-gray-500" : "bg-gray-300"
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
                      <span className="font-semibold text-gray-700 block">Active Status</span>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {form.is_active
                          ? "Customer is active and can make purchases"
                          : "Customer is inactive and cannot make purchases"}
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Account Details */}
              <div className="mt-6 p-6 bg-gradient-to-br from-gray-50/50 to-gray-100/30 rounded-xl border border-gray-200">
                <h4 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  Account Details
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className={LABEL_CLASS}>Total Purchases (₦)</label>
                    <input
                      type="number"
                      name="total_purchases"
                      step="0.01"
                      min="0"
                      value={form.total_purchases}
                      onChange={(e) => handleInputChange("total_purchases", e.target.value)}
                      className={INPUT_CLASS}
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className={LABEL_CLASS}>Outstanding Balance (₦)</label>
                    <input
                      type="number"
                      name="outstanding_balance"
                      step="0.01"
                      min="0"
                      value={form.outstanding_balance}
                      onChange={(e) => handleInputChange("outstanding_balance", e.target.value)}
                      className={INPUT_CLASS}
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className={LABEL_CLASS}>Loyalty Points</label>
                    <input
                      type="number"
                      name="loyalty_points"
                      min="0"
                      value={form.loyalty_points}
                      onChange={(e) => handleInputChange("loyalty_points", e.target.value)}
                      className={INPUT_CLASS}
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Additional Information Section */}
            <section>
              <h3 className="text-base font-semibold text-gray-900 mb-4">Additional Information</h3>
              <div>
                <label className={LABEL_CLASS}>Notes</label>
                <textarea
                  name="notes"
                  value={form.notes}
                  onChange={(e) => handleInputChange("notes", e.target.value)}
                  className={`${INPUT_CLASS} resize-none`}
                  placeholder="Additional notes, special instructions, or remarks about this customer..."
                  rows={4}
                  maxLength={1000}
                />
                <p className="text-xs text-gray-500 mt-2">
                  Optional: Add any additional information about this customer
                </p>
              </div>
            </section>

            {/* Form Actions */}
            <div className="flex justify-between gap-3 pt-6 border-t border-gray-200">
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleReset}
                  disabled={!hasChanges || isSubmitting}
                  className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Reset Changes
                </button>
                <Link
                  href="/customers"
                  className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </Link>
              </div>
              <button
                type="submit"
                disabled={
                  !isFormValid || isSubmitting || isLoadingLocations || !hasChanges
                }
                className="px-6 py-2.5 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Note Section */}
        <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <p className="text-sm text-gray-700">
            <span className="font-medium">Note:</span> Required fields are
            marked with a red asterisk (*). The customer will be automatically
            associated with your current active business.
          </p>
        </div>
      </div>
    </div>
  );
};

export default EditCustomerPage;