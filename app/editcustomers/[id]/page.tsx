"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { toast } from "react-hot-toast";
import { apiGet, apiPut } from "@/lib/axios";
import { countries } from "@/app/component/country-list";
import {
  User,
  Phone,
  Building,
  CreditCard,
  ArrowLeft,
  Save,
  Loader2,
  Users,
  Globe,
  FileText,
  CheckCircle,
  XCircle,
  Edit,
} from "lucide-react";
import { withAuth } from "@/hoc/withAuth";

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

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

interface BusinessLocation {
  id: number;
  location_name: string;
  business_key: string;
}

interface UserType {
  businesses_one?: Array<{ country?: string }>;
}

interface FormErrors {
  [key: string]: string | undefined;
}

interface GenderOption {
  value: string;
  label: string;
}

interface ApiResponse<T = any> {
  data?: T;
  customer?: T;
  locations?: T[];
  errors?: Record<string, string[]>;
}

// ============================================================================
// CONSTANTS AND CONFIGURATION
// ============================================================================

const genderOptions: GenderOption[] = [
  { value: "", label: "Select gender" },
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
];

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

const REQUIRED_FIELDS = ["first_name", "last_name", "location_id"] as const;

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

const validateEmail = (email: string): boolean => {
  if (!email.trim()) return true;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePhone = (phone: string): boolean => {
  if (!phone.trim()) return true;
  const phoneRegex = /^[\+]?[0-9\s\-\(\)]{10,}$/;
  return phoneRegex.test(phone.replace(/\s+/g, ""));
};

const validatePostalCode = (postalCode: string): boolean => {
  if (!postalCode.trim()) return true;
  return postalCode.length >= 3 && postalCode.length <= 10;
};

const getActiveBusinessCountry = (user: UserType): string => {
  return user?.businesses_one?.[0]?.country || "USA";
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const EditCustomerPage = ({ user }: { user: UserType }) => {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
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
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingLocations, setIsLoadingLocations] = useState(true);
  const [originalData, setOriginalData] = useState<CustomerFormData | null>(
    null,
  );

  const hasChanges = useMemo(() => {
    if (!originalData) return false;
    return Object.keys(form).some((key) => {
      const formKey = key as keyof CustomerFormData;
      return form[formKey] !== originalData[formKey];
    });
  }, [form, originalData]);

  const isFormValid = useMemo(() => {
    const requiredFieldsValid = REQUIRED_FIELDS.every(
      (field) => form[field]?.toString().trim().length > 0,
    );

    const noValidationErrors = Object.values(errors).every(
      (error) => !error || error === "",
    );

    return requiredFieldsValid && noValidationErrors;
  }, [form, errors]);

  const fetchCustomer = useCallback(async () => {
    if (!id) return;

    try {
      const response = await apiGet<ApiResponse>(`/customers/${id}`);

      const customerData =
        response.data?.data ||
        response.data?.customer ||
        response.data ||
        response;

      if (!customerData) {
        toast.error("Customer data not found");
        router.push("/customers");
        return;
      }

      const formattedData: CustomerFormData = {
        id: customerData.id || customerData.customer_id,
        first_name: customerData.first_name || "",
        last_name: customerData.last_name || "",
        email: customerData.email || "",
        phone: customerData.phone || "",
        address: customerData.address || "",
        city: customerData.city || "",
        state: customerData.state || "",
        country: customerData.country || userCountry,
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
            ? new Date(customerData.dob || customerData.date_of_birth)
                .toISOString()
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
    } catch (error: any) {
      toast.error("Failed to load customer data");
      router.push("/customers");
    }
  }, [id, router, userCountry]);

  const fetchBusinessLocations = useCallback(async () => {
    setIsLoadingLocations(true);
    try {
      const response = await apiGet<ApiResponse>("/locations");

      const locationsArray =
        response.data?.data ?? response.data?.locations ?? response.data ?? [];

      setLocations(Array.isArray(locationsArray) ? locationsArray : []);
    } catch (error) {
      console.error("Error fetching locations:", error);
      toast.error("Failed to load business locations");
      setLocations([]);
    } finally {
      setIsLoadingLocations(false);
    }
  }, []);

  const fetchData = useCallback(async () => {
    if (!id) {
      toast.error("Invalid customer ID");
      router.push("/customers");
      return;
    }

    setIsLoading(true);
    try {
      await Promise.all([fetchCustomer(), fetchBusinessLocations()]);
    } catch (error) {
      toast.error("Failed to load data");
    } finally {
      setIsLoading(false);
    }
  }, [id, router, fetchCustomer, fetchBusinessLocations]);

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
    setTouched((prev) => ({
      ...prev,
      [field]: true,
    }));
  };

  const validateField = (field: string, value: any): string | undefined => {
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
        if (stringValue.length < 2)
          return "phone number must be at least 8 number";
        if (stringValue.length > 18)
          return "phone number must be at least 18 number";
        return undefined;

      case "location_id":
        if (!stringValue) return "Business location is required";
        return undefined;

      case "state":
        if (stringValue && stringValue.length < 2) {
          return "State must be at least 2 characters";
        }
        if (stringValue.length > 30)
          return "State must be at least 30 characters";
        return undefined;

      case "city":
        if (stringValue && stringValue.length < 2) {
          return "City must be at least 2 characters";
        }
        if (stringValue.length > 30)
          return "City must be at least 30 characters";
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

  const handleSubmit = async (e: React.FormEvent) => {
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
      const customerData = prepareFormData();
      await apiPut(`/customersupdate/${id}`, customerData, {}, [
        "/customersupdate",
      ]);

      toast.success("Customer updated successfully!", {
        id: "update-customer",
        duration: 3000,
      });

      setOriginalData(form);
    } catch (error: any) {
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
            "Customer already exists with similar details",
        );
      } else {
        toast.error(
          responseData?.message ||
            "Failed to update customer. Please try again.",
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    if (originalData) {
      setForm(originalData);
      setErrors({});
      setTouched({});
      toast.success("Changes reset to original values");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50/30 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600">Loading customer data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/30">
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
                  Edit Customer
                </h1>
              </div>
              <p className="text-gray-600 text-sm">
                {form.customer_code &&
                  `Customer Code: ${form.customer_code} | `}
                Update customer information
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/customers"
                className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-5 py-2.5 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-medium shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30"
              >
                <Users size={18} />
                View All Customers
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-8xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Customer Profile
                </p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {form.first_name} {form.last_name}
                </p>
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

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200 bg-gray-50/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-50 rounded-xl flex items-center justify-center">
                  <Edit className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Edit Customer Profile
                  </h2>
                  <p className="text-gray-500 text-sm">
                    Update customer information as needed
                  </p>
                </div>
              </div>
              {hasChanges && (
                <div className="flex items-center gap-2 px-4 py-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <XCircle className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm font-medium text-yellow-700">
                    Unsaved changes
                  </span>
                </div>
              )}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-8">
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
                      name="first_name"
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
                      maxLength={50}
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
                      name="last_name"
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
                      maxLength={50}
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
                      name="gender"
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
                      name="dob"
                      value={form.dob}
                      onChange={(e) => handleInputChange("dob", e.target.value)}
                      className={CSS_CLASSES.INPUT}
                      max={new Date().toISOString().split("T")[0]}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200"></div>

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
                    name="email"
                    value={form.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    onBlur={() => handleBlur("email")}
                    className={
                      errors.email ? CSS_CLASSES.INPUT_ERROR : CSS_CLASSES.INPUT
                    }
                    placeholder="customer@example.com"
                    maxLength={100}
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
                    name="phone"
                    value={form.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
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
                    name="country"
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
                    name="state"
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
                    name="city"
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
                    name="postal_code"
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
                    maxLength={10}
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
                    name="address"
                    rows={2}
                    value={form.address}
                    onChange={(e) =>
                      handleInputChange("address", e.target.value)
                    }
                    className={`${CSS_CLASSES.INPUT} resize-none`}
                    placeholder="Enter full address"
                    maxLength={200}
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200"></div>

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
                      name="location_id"
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
                    <input
                      type="text"
                      name="customer_code"
                      value={form.customer_code}
                      onChange={(e) =>
                        handleInputChange("customer_code", e.target.value)
                      }
                      className={`${CSS_CLASSES.INPUT} bg-gray-50 cursor-not-allowed`}
                      placeholder="Auto-generated"
                      readOnly
                    />
                  </div>

                  <div>
                    <label className={CSS_CLASSES.LABEL}>
                      Registration Date
                    </label>
                    <input
                      type="date"
                      name="registration_date"
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
                          name="is_active"
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
                        name="total_purchases"
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
                        name="outstanding_balance"
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
                        name="loyalty_points"
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
                  name="notes"
                  value={form.notes}
                  onChange={(e) => handleInputChange("notes", e.target.value)}
                  className={`${CSS_CLASSES.INPUT} resize-none`}
                  placeholder="Additional notes, special instructions, or remarks about this customer..."
                  rows={4}
                  maxLength={1000}
                />
                <p className="text-xs text-gray-500 mt-2">
                  Optional: Add any additional information about this customer
                </p>
              </div>
            </div>

            <div className="flex justify-between gap-3 pt-6 border-t border-gray-200">
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleReset}
                  disabled={!hasChanges || isSubmitting}
                  className="px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Reset Changes
                </button>
                <Link
                  href="/customers"
                  className="px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </Link>
              </div>
              <button
                type="submit"
                disabled={
                  !isFormValid ||
                  isSubmitting ||
                  isLoadingLocations ||
                  !hasChanges
                }
                className="px-6 py-3 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/25"
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

export default withAuth(EditCustomerPage);
