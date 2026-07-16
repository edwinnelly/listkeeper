"use client";

import { useRouter } from "next/navigation";
import React, { useState, useEffect, useCallback } from "react";
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
  AlertCircle,
  ChevronRight,
  MapPin,
  Mail,
  Calendar,
  Award,
} from "lucide-react";
import { withAuth } from "@/hoc/withAuth";

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

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
  location_id: string; // Now a string
}

interface FormErrors {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  location_id?: string;
  state?: string;
  city?: string;
  postal_code?: string;
  dob?: string;
  gender?: string;
  total_purchases?: string;
  outstanding_balance?: string;
  loyalty_points?: string;
  address?: string;
  customer_code?: string;
  [key: string]: string | undefined;
}

interface BusinessLocation {
  id: string; // Now a string
  location_name: string;
  business_key: string;
}

interface UserType {
  businesses_one?: Array<{
    country?: string;
  }>;
}

interface AddCustomerPageProps {
  user: UserType;
  loading?: boolean;
}

interface GenderOption {
  value: string;
  label: string;
}

interface ErrorResponse {
  response?: {
    status?: number;
    data?: {
      message?: string;
      errors?: Record<string, string[] | string>;
    };
  };
  message?: string;
}

// ============================================================================
// CONSTANTS AND CONFIGURATION
// ============================================================================

const genderOptions: GenderOption[] = [
  { value: "", label: "Select gender" },
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
];

// ============================================================================
// SECTION CARD COMPONENT
// ============================================================================

const SectionCard: React.FC<{
  icon: React.ElementType;
  title: string;
  subtitle: string;
  children: React.ReactNode;
  accentColor?: string;
}> = ({
  icon: Icon,
  title,
  subtitle,
  children,
  accentColor = "bg-gray-900",
}) => (
  <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
    <div className="flex items-center gap-4 px-6 py-4 border-b border-gray-100">
      <div className={`${accentColor} p-2.5 rounded-xl`}>
        <Icon className="h-4 w-4 text-white" />
      </div>
      <div>
        <h3 className="text-sm font-semibold text-gray-900 tracking-tight">{title}</h3>
        <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>
      </div>
    </div>
    <div className="p-6">{children}</div>
  </div>
);

// ============================================================================
// FIELD WRAPPER COMPONENT
// ============================================================================

const Field: React.FC<{
  label: string;
  required?: boolean;
  optional?: boolean;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}> = ({ label, required, optional, error, hint, children }) => (
  <div className="space-y-1.5">
    <div className="flex items-center justify-between">
      <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {optional && (
        <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full font-medium">
          Optional
        </span>
      )}
    </div>
    {children}
    {error && (
      <div className="flex items-center gap-1.5 text-red-500 text-xs">
        <XCircle size={11} />
        <span>{error}</span>
      </div>
    )}
    {hint && !error && (
      <p className="text-[11px] text-gray-400">{hint}</p>
    )}
  </div>
);

// ============================================================================
// TOGGLE COMPONENT
// ============================================================================

const Toggle: React.FC<{
  checked: boolean;
  onChange: (val: boolean) => void;
  label: string;
  description: string;
}> = ({ checked, onChange, label, description }) => (
  <label className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100 cursor-pointer group hover:border-gray-200 transition-colors">
    <div>
      <p className="text-sm font-semibold text-gray-800">{label}</p>
      <p className="text-xs text-gray-400 mt-0.5">{description}</p>
    </div>
    <div className="relative ml-4 flex-shrink-0">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only"
      />
      <div
        className={`w-11 h-6 flex items-center rounded-full px-0.5 transition-all duration-200 ${
          checked ? "bg-gray-900" : "bg-gray-200"
        }`}
      >
        <div
          className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform duration-200 ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </div>
    </div>
  </label>
);

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

const validateEmail = (email: string): boolean => {
  if (!email) return true;
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
};

const validatePhone = (phone: string): boolean => {
  if (!phone) return true;
  const phoneRegex = /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,5}[-\s\.]?[0-9]{1,5}$/;
  const cleaned = phone.replace(/\s/g, '');
  if (!phoneRegex.test(cleaned)) return false;
  
  const digitCount = cleaned.replace(/[^0-9]/g, '').length;
  return digitCount >= 10 && digitCount <= 15;
};

const validatePostalCode = (postalCode: string): boolean => {
  if (!postalCode) return true;
  const postalCodeRegex = /^[A-Za-z0-9\s\-]{3,10}$/;
  return postalCodeRegex.test(postalCode);
};

const validateName = (name: string, fieldName: string): string | undefined => {
  if (!name || name.trim().length === 0) {
    return `${fieldName} is required`;
  }
  const trimmed = name.trim();
  if (trimmed.length < 2) {
    return `${fieldName} must be at least 2 characters`;
  }
  if (trimmed.length > 30) {
    return `${fieldName} must be less than 30 characters`;
  }
  if (!/^[a-zA-Z\s\-']+$/.test(trimmed)) {
    return `${fieldName} can only contain letters, spaces, hyphens, and apostrophes`;
  }
  return undefined;
};

const validateDateOfBirth = (dob: string): string | undefined => {
  if (!dob) return undefined;
  
  const date = new Date(dob);
  const today = new Date();
  
  if (isNaN(date.getTime())) {
    return "Please enter a valid date";
  }
  
  if (date > today) {
    return "Date of birth cannot be in the future";
  }
  
  const age = today.getFullYear() - date.getFullYear();
  if (age > 120) {
    return "Please enter a valid date of birth";
  }
  
  return undefined;
};

const validateNumericField = (
  value: string,
  fieldName: string,
  min: number = 0,
  max: number = 999999999.99
): string | undefined => {
  if (!value) return undefined;
  
  const num = parseFloat(value);
  if (isNaN(num)) {
    return `${fieldName} must be a valid number`;
  }
  if (num < min) {
    return `${fieldName} cannot be negative`;
  }
  if (num > max) {
    return `${fieldName} exceeds maximum allowed value`;
  }
  return undefined;
};

export const getActiveBusinessCountry = (user: UserType): string => {
  return user?.businesses_one?.[0]?.country ?? "USA";
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const AddCustomerPage = ({ user, loading }: AddCustomerPageProps) => {
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
  const [locations, setLocations] = useState<BusinessLocation[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingLocations, setIsLoadingLocations] = useState(true);

  const router = useRouter();

  // Styling
  const inputClass =
    "w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 outline-none transition-all duration-150 placeholder-gray-300 text-sm text-gray-800 font-medium";
  const errorInputClass =
    "w-full px-3.5 py-2.5 bg-white border border-red-300 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-400 outline-none transition-all duration-150 placeholder-gray-300 text-sm text-gray-800 font-medium";

  const fetchBusinessLocations = useCallback(async () => {
    setIsLoadingLocations(true);
    try {
      const res = await apiGet("/locations");
      const locationsArray = res.data?.data ?? res.data?.locations ?? [];
      const formattedLocations = (Array.isArray(locationsArray) ? locationsArray : []).map(
        (loc: BusinessLocation) => ({
          ...loc,
          id: String(loc.id),
        })
      );
      setLocations(formattedLocations);
    } catch (err: unknown) {
      console.error("Failed to load business locations:", err);
      const error = err as ErrorResponse;
      const errorMessage = error.response?.data?.message || "Failed to load business locations";
      toast.error(errorMessage);
      setLocations([]);
    } finally {
      setIsLoadingLocations(false);
    }
  }, []);

  useEffect(() => {
    fetchBusinessLocations();
  }, [fetchBusinessLocations]);

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      country: userCountry,
    }));
  }, [userCountry]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8f8f7] flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-12 h-12 mx-auto mb-4">
            <div className="w-12 h-12 rounded-full border-2 border-gray-100" />
            <div className="absolute inset-0 w-12 h-12 rounded-full border-2 border-gray-900 border-t-transparent animate-spin" />
          </div>
          <p className="text-sm font-semibold text-gray-700">Loading</p>
          <p className="text-xs text-gray-400 mt-1">Please wait...</p>
        </div>
      </div>
    );
  }

  const handleInputChange = (
    field: keyof CustomerFormData,
    value: string | boolean,
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

  const handleBlur = (field: string) => {
    const error = validateField(field, form[field as keyof CustomerFormData]);
    if (error) {
      setErrors((prev) => ({
        ...prev,
        [field]: error,
      }));
    } else {
      setErrors((prev) => ({
        ...prev,
        [field]: undefined,
      }));
    }
  };

  const validateField = (field: string, value: string | boolean | number): string | undefined => {
    switch (field) {
      case "first_name":
        return validateName(value as string, "First name");
      case "last_name":
        return validateName(value as string, "Last name");
      case "email":
        if (value && !validateEmail(value.toString())) {
          return "Please enter a valid email address (e.g., name@example.com)";
        }
        if (typeof value === "string" && value.trim().length > 100) {
          return "Email address must be less than 100 characters";
        }
        return undefined;
      case "phone":
        if (value && !validatePhone(value.toString())) {
          return "Please enter a valid phone number (10-15 digits)";
        }
        return undefined;
      case "location_id":
        if (!value || (typeof value === "string" && value.trim() === "")) {
          return "Business location is required";
        }
        return undefined;
      case "state":
        if (value && typeof value === "string" && value.trim().length > 0) {
          const trimmed = value.trim();
          if (trimmed.length < 2) return "State must be at least 2 characters";
          if (trimmed.length > 30) return "State must be less than 30 characters";
          if (!/^[a-zA-Z\s\-']+$/.test(trimmed)) return "State can only contain letters, spaces, hyphens, and apostrophes";
        }
        return undefined;
      case "city":
        if (value && typeof value === "string" && value.trim().length > 0) {
          const trimmed = value.trim();
          if (trimmed.length < 2) return "City must be at least 2 characters";
          if (trimmed.length > 50) return "City must be less than 50 characters";
          if (!/^[a-zA-Z\s\-']+$/.test(trimmed)) return "City can only contain letters, spaces, hyphens, and apostrophes";
        }
        return undefined;
      case "postal_code":
        if (value && !validatePostalCode(value.toString())) {
          return "Postal code must be 3-10 alphanumeric characters";
        }
        return undefined;
      case "dob":
        return validateDateOfBirth(value as string);
      case "total_purchases":
        return validateNumericField(value as string, "Total purchases");
      case "outstanding_balance":
        return validateNumericField(value as string, "Outstanding balance");
      case "loyalty_points":
        return validateNumericField(value as string, "Loyalty points", 0, 9999999);
      case "address":
        if (value && typeof value === "string" && value.trim().length > 200) {
          return "Address must be less than 200 characters";
        }
        return undefined;
      default:
        return undefined;
    }
  };

  const validateAllFields = (): boolean => {
    const newErrors: FormErrors = {};
    let isValid = true;

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

  const generateCustomerCode = (): string => {
    const prefix = "CUST";
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${prefix}${timestamp}${random}`;
  };

  const handleGenerateCode = () => {
    const code = generateCustomerCode();
    setForm((prev) => ({ ...prev, customer_code: code }));
    if (errors.customer_code) {
      setErrors((prev) => ({ ...prev, customer_code: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const isValid = validateAllFields();

    if (!isValid) {
      const firstError = Object.values(errors).find((error) => error);
      if (firstError) {
        toast.error(firstError);
      }
      return false;
    }

    return true;
  };

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
      location_id: form.location_id, // Send as string directly
    };
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmitting) return;

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

        setErrors({});

        setTimeout(() => {
          router.push("/customers");
        }, 1500);
      }
    } catch (err: unknown) {
      const error = err as ErrorResponse;
      const status = error.response?.status;

      if (status === 403) {
        toast.error("You do not have permission to create customers");
      } else if (status === 422) {
        const apiErrors = error.response?.data?.errors;
        if (apiErrors) {
          const formErrors: FormErrors = {};
          Object.keys(apiErrors).forEach((key) => {
            const field = key as keyof FormErrors;
            const errorValue = apiErrors[key];
            formErrors[field] = Array.isArray(errorValue) 
              ? errorValue[0] 
              : errorValue;
          });
          setErrors(formErrors);

          const firstError = Object.values(apiErrors)[0];
          if (firstError && Array.isArray(firstError)) {
            toast.error(firstError[0]);
          }
        } else {
          toast.error("Validation failed. Please check your input.");
        }
      } else if (status === 409) {
        toast.error("A customer with this email already exists");
      } else {
        toast.error(error.response?.data?.message || "Failed to create customer. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = 
    form.first_name.trim().length >= 2 &&
    form.last_name.trim().length >= 2 &&
    form.location_id !== "" &&
    form.location_id.trim() !== "" &&
    (!form.email || validateEmail(form.email)) &&
    (!form.phone || validatePhone(form.phone)) &&
    !errors.first_name &&
    !errors.last_name &&
    !errors.email &&
    !errors.phone &&
    !errors.location_id;

  return (
    <div className="min-h-screen bg-[#f8f8f7]">
      {/* Top Bar */}
      <div className="bg-white border-b border-gray-100 top-0 z-10 mt-[-13px] w-full">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-700 transition-colors font-medium"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Dashboard
            </Link>
            <ChevronRight className="h-3 w-3 text-gray-300" />
            <Link
              href="/customers"
              className="text-xs text-gray-400 hover:text-gray-700 transition-colors font-medium"
            >
              Customers
            </Link>
            <ChevronRight className="h-3 w-3 text-gray-300" />
            <span className="text-xs text-gray-700 font-semibold">Add New</span>
          </div>
          <Link
            href="/customers"
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <Users className="h-3.5 w-3.5" />
            View All Customers
          </Link>
        </div>
      </div>

      {/* Page Header */}
      <div className="max-w-5xl mx-auto px-6 pt-8 pb-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="bg-gray-900 p-2.5 rounded-xl">
                <User className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900 tracking-tight">Add New Customer</h1>
            </div>
            <p className="text-sm text-gray-400 ml-[52px]">
              Fill in the details below to register a new customer
            </p>
          </div>

          {/* Stats Cards */}
          <div className="hidden md:flex items-center gap-3">
            <div className="flex items-center gap-2 bg-white border border-gray-100 rounded-xl px-4 py-2.5 shadow-sm">
              <Globe className="h-3.5 w-3.5 text-gray-400" />
              <span className="text-xs font-medium text-gray-600">{userCountry}</span>
            </div>
            <div className="flex items-center gap-2 bg-white border border-gray-100 rounded-xl px-4 py-2.5 shadow-sm">
              {form.is_active ? (
                <CheckCircle className="h-3.5 w-3.5 text-green-500" />
              ) : (
                <XCircle className="h-3.5 w-3.5 text-gray-400" />
              )}
              <span className="text-xs font-medium text-gray-600">
                {form.is_active ? "Active" : "Inactive"}
              </span>
            </div>
            <div className="flex items-center gap-2 bg-white border border-gray-100 rounded-xl px-4 py-2.5 shadow-sm">
              <Building className="h-3.5 w-3.5 text-gray-400" />
              <span className="text-xs font-medium text-gray-600">
                {locations.length} locations
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-5xl mx-auto px-6 pb-12">
        <form onSubmit={onSubmit} className="space-y-4">
          {isLoadingLocations ? (
            <div className="bg-white border border-gray-100 rounded-2xl flex items-center justify-center py-24 shadow-sm">
              <div className="text-center">
                <div className="relative w-12 h-12 mx-auto mb-4">
                  <div className="w-12 h-12 rounded-full border-2 border-gray-100" />
                  <div className="absolute inset-0 w-12 h-12 rounded-full border-2 border-gray-900 border-t-transparent animate-spin" />
                </div>
                <p className="text-sm font-semibold text-gray-700">Loading locations</p>
                <p className="text-xs text-gray-400 mt-1">This will only take a moment</p>
              </div>
            </div>
          ) : (
            <>
              {/* SECTION 1: PERSONAL INFORMATION */}
              <SectionCard
                icon={User}
                title="Personal Information"
                subtitle="Basic customer identity details"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <Field label="First Name" required error={errors.first_name}>
                    <input
                      type="text"
                      maxLength={30}
                      value={form.first_name}
                      onChange={(e) => handleInputChange("first_name", e.target.value)}
                      onBlur={() => handleBlur("first_name")}
                      required
                      className={errors.first_name ? errorInputClass : inputClass}
                      placeholder="Enter first name"
                    />
                  </Field>

                  <Field label="Last Name" required error={errors.last_name}>
                    <input
                      type="text"
                      maxLength={30}
                      value={form.last_name}
                      onChange={(e) => handleInputChange("last_name", e.target.value)}
                      onBlur={() => handleBlur("last_name")}
                      required
                      className={errors.last_name ? errorInputClass : inputClass}
                      placeholder="Enter last name"
                    />
                  </Field>

                  <Field label="Gender" optional>
                    <select
                      value={form.gender}
                      onChange={(e) => handleInputChange("gender", e.target.value)}
                      className={inputClass}
                    >
                      {genderOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field label="Date of Birth" optional error={errors.dob}>
                    <input
                      type="date"
                      value={form.dob}
                      onChange={(e) => handleInputChange("dob", e.target.value)}
                      onBlur={() => handleBlur("dob")}
                      className={errors.dob ? errorInputClass : inputClass}
                    />
                  </Field>
                </div>
              </SectionCard>

              {/* SECTION 2: CONTACT INFORMATION */}
              <SectionCard
                icon={Mail}
                title="Contact Information"
                subtitle="How to reach the customer"
                accentColor="bg-gray-700"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <Field label="Email Address" optional error={errors.email}>
                    <input
                      type="email"
                      maxLength={70}
                      value={form.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      onBlur={() => handleBlur("email")}
                      className={errors.email ? errorInputClass : inputClass}
                      placeholder="customer@example.com"
                    />
                  </Field>

                  <Field label="Phone Number" optional error={errors.phone}>
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
                      className={errors.phone ? errorInputClass : inputClass}
                      placeholder="+234 800 000 0000"
                    />
                  </Field>

                  <Field label="Country">
                    <select
                      value={form.country}
                      onChange={(e) => handleInputChange("country", e.target.value)}
                      className={inputClass}
                    >
                      {countries.map((country) => (
                        <option key={country} value={country}>
                          {country}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field label="State" optional error={errors.state}>
                    <input
                      type="text"
                      maxLength={40}
                      value={form.state}
                      onChange={(e) => handleInputChange("state", e.target.value)}
                      onBlur={() => handleBlur("state")}
                      className={errors.state ? errorInputClass : inputClass}
                      placeholder="Enter state"
                    />
                  </Field>

                  <Field label="City" optional error={errors.city}>
                    <input
                      type="text"
                      maxLength={50}
                      value={form.city}
                      onChange={(e) => handleInputChange("city", e.target.value)}
                      onBlur={() => handleBlur("city")}
                      className={errors.city ? errorInputClass : inputClass}
                      placeholder="Enter city"
                    />
                  </Field>

                  <Field label="Postal Code" optional error={errors.postal_code}>
                    <input
                      type="text"
                      maxLength={15}
                      value={form.postal_code}
                      onChange={(e) => handleInputChange("postal_code", e.target.value)}
                      onBlur={() => handleBlur("postal_code")}
                      className={errors.postal_code ? errorInputClass : inputClass}
                      placeholder="100001"
                    />
                  </Field>

                  <div className="md:col-span-2">
                    <Field label="Address" optional error={errors.address}>
                      <textarea
                        rows={2}
                        maxLength={200}
                        value={form.address}
                        onChange={(e) => handleInputChange("address", e.target.value)}
                        onBlur={() => handleBlur("address")}
                        className={`${errors.address ? errorInputClass : inputClass} resize-none`}
                        placeholder="Enter full address"
                      />
                    </Field>
                  </div>
                </div>
              </SectionCard>

              {/* SECTION 3: BUSINESS & ACCOUNT INFORMATION */}
              <SectionCard
                icon={Building}
                title="Business & Account"
                subtitle="Location assignment and account details"
                accentColor="bg-gray-800"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <Field label="Business Location" required error={errors.location_id}>
                    <select
                      value={form.location_id}
                      onChange={(e) => handleInputChange("location_id", e.target.value)}
                      onBlur={() => handleBlur("location_id")}
                      required
                      className={errors.location_id ? errorInputClass : inputClass}
                      disabled={isLoadingLocations}
                    >
                      <option value="">Select location</option>
                      {isLoadingLocations ? (
                        <option disabled>Loading locations...</option>
                      ) : locations.length === 0 ? (
                        <option disabled>No locations available</option>
                      ) : (
                        locations.map((location) => (
                          <option key={location.id} value={location.id}>
                            {location.location_name}
                          </option>
                        ))
                      )}
                    </select>
                  </Field>

                  <Field label="Customer Code" optional error={errors.customer_code}>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        maxLength={30}
                        value={form.customer_code}
                        onChange={(e) => handleInputChange("customer_code", e.target.value)}
                        onBlur={() => handleBlur("customer_code")}
                        className={errors.customer_code ? errorInputClass : inputClass}
                        placeholder="Auto-generated"
                      />
                      <button
                        type="button"
                        onClick={handleGenerateCode}
                        className="flex-shrink-0 px-4 py-2.5 bg-gray-900 text-white text-xs font-semibold rounded-xl hover:bg-gray-800 transition-colors flex items-center gap-1.5 whitespace-nowrap"
                      >
                        <Plus size={12} />
                        Generate
                      </button>
                    </div>
                  </Field>

                  <Field label="Registration Date">
                    <input
                      type="date"
                      value={form.registration_date}
                      onChange={(e) => handleInputChange("registration_date", e.target.value)}
                      className={inputClass}
                    />
                  </Field>

                  <div className="flex items-end">
                    <Toggle
                      checked={form.is_active}
                      onChange={(val) => handleInputChange("is_active", val)}
                      label="Active Status"
                      description={form.is_active ? "Customer can make purchases" : "Customer cannot make purchases"}
                    />
                  </div>
                </div>

                {/* Account Details */}
                <div className="mt-5 p-5 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="flex items-center gap-2 mb-4">
                    <CreditCard className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-semibold text-gray-700">Account Details</span>
                    <span className="ml-auto text-[10px] text-gray-400 bg-white px-2 py-0.5 rounded-full border border-gray-200 font-medium">Optional</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Field label="Total Purchases ($)" error={errors.total_purchases}>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={form.total_purchases}
                        onChange={(e) => handleInputChange("total_purchases", e.target.value)}
                        onBlur={() => handleBlur("total_purchases")}
                        className={errors.total_purchases ? errorInputClass : inputClass}
                        placeholder="0.00"
                      />
                    </Field>

                    <Field label="Outstanding Balance ($)" error={errors.outstanding_balance}>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={form.outstanding_balance}
                        onChange={(e) => handleInputChange("outstanding_balance", e.target.value)}
                        onBlur={() => handleBlur("outstanding_balance")}
                        className={errors.outstanding_balance ? errorInputClass : inputClass}
                        placeholder="0.00"
                      />
                    </Field>

                    <Field label="Loyalty Points" error={errors.loyalty_points}>
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          value={form.loyalty_points}
                          onChange={(e) => handleInputChange("loyalty_points", e.target.value)}
                          onBlur={() => handleBlur("loyalty_points")}
                          className={errors.loyalty_points ? errorInputClass : inputClass}
                          placeholder="0"
                        />
                        <Award className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      </div>
                    </Field>
                  </div>
                </div>
              </SectionCard>

              {/* SECTION 4: ADDITIONAL INFORMATION */}
              <SectionCard
                icon={FileText}
                title="Additional Information"
                subtitle="Notes and special instructions"
                accentColor="bg-gray-700"
              >
                <Field label="Notes" optional>
                  <textarea
                    value={form.notes}
                    onChange={(e) => handleInputChange("notes", e.target.value)}
                    className={`${inputClass} resize-none`}
                    placeholder="Additional notes, special instructions, or remarks about this customer..."
                    rows={4}
                  />
                  <div className="flex justify-end mt-1.5">
                    <span className="text-[11px] text-gray-300 font-medium tabular-nums">
                      {form.notes.length} characters
                    </span>
                  </div>
                </Field>
              </SectionCard>

              {/* Submit Footer */}
              <div className="bg-white border border-gray-100 rounded-2xl px-6 py-4 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${isFormValid ? "bg-green-500" : "bg-gray-300"}`} />
                  <span className="text-xs font-medium text-gray-500">
                    {isFormValid ? "All required fields complete" : "Please fill in all required fields"}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Link
                    href="/customers"
                    className="px-5 py-2.5 text-sm font-semibold text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </Link>
                  <button
                    type="submit"
                    disabled={!isFormValid || isSubmitting || isLoadingLocations}
                    className="px-6 py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-800 active:bg-black transition-colors focus:outline-none focus:ring-2 focus:ring-gray-900/20 focus:ring-offset-2 disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center gap-2 shadow-sm"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4" />
                        Create Customer
                      </>
                    )}
                  </button>
                </div>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
};

export default withAuth(AddCustomerPage);