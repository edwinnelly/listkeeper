"use client";

import { useRouter, useParams } from "next/navigation";
import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { apiGet, apiPut } from "@/lib/axios";
import {
  ArrowLeft,
  Loader2,
  XCircle,
  Save,
  Edit,
  AlertCircle,
} from "lucide-react";
import { withAuth } from "@/hoc/withAuth";

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

interface ProductFormData {
  stock_quantity: string;
  low_stock_threshold: string;
  manufactured_at: string;
  expires_at: string;
}

// Payload interface for API requests - Only includes fields we're updating
interface UpdateProductPayload {
  stock_quantity: number;
  low_stock_threshold?: number;
  manufactured_at?: string;
  expires_at?: string;
}

interface FormErrors {
  stock_quantity?: string;
  low_stock_threshold?: string;
  manufactured_at?: string;
  expires_at?: string;
}

interface Product {
  id: number;
  name: string;
  sku: string;
  stock_quantity: number;
  low_stock_threshold: number | null;
  manufactured_at: string | null;
  expires_at: string | null;
  [key: string]: any; // For other product fields
}

// ============================================================================
// CONSTANTS
// ============================================================================

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const EditProductPage = () => {
  const params = useParams();
  const productId = params.id as string;

  // ==========================================================================
  // STATE MANAGEMENT
  // ==========================================================================
  const [form, setForm] = useState<ProductFormData>({
    stock_quantity: "",
    low_stock_threshold: "",
    manufactured_at: "",
    expires_at: "",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingProduct, setIsLoadingProduct] = useState(true);
  const [product, setProduct] = useState<Product | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [productName, setProductName] = useState("");
  const [productSku, setProductSku] = useState("");

  const router = useRouter();

  // ==========================================================================
  // STYLING CONSTANTS
  // ==========================================================================
  const inputClass =
    "w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200 placeholder-gray-400 text-sm";
  const labelClass = "block text-sm font-medium text-gray-700 mb-2";
  const errorInputClass =
    "w-full px-4 py-3 bg-white border border-red-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all duration-200 placeholder-gray-400 text-sm";
  const errorTextClass = "text-red-600 text-xs mt-1.5 flex items-center gap-1";

  // ==========================================================================
  // LIFECYCLE METHODS
  // ==========================================================================
  useEffect(() => {
    fetchProduct();
  }, [productId]);

  // Track form changes
  useEffect(() => {
    if (product) {
      const formData = {
        stock_quantity: form.stock_quantity,
        low_stock_threshold: form.low_stock_threshold,
        manufactured_at: form.manufactured_at,
        expires_at: form.expires_at,
      };

      const productData = {
        stock_quantity: product.stock_quantity?.toString() || "",
        low_stock_threshold: product.low_stock_threshold?.toString() || "",
        manufactured_at: product.manufactured_at || "",
        expires_at: product.expires_at || "",
      };

      const hasFormChanges =
        JSON.stringify(formData) !== JSON.stringify(productData);
      setHasChanges(hasFormChanges);
    }
  }, [form, product]);

  // ==========================================================================
  // DATA FETCHING
  // ==========================================================================
  const fetchProduct = async () => {
    setIsLoadingProduct(true);
    try {
      const res = await apiGet(`/products/${productId}`);
      console.log("Product data:", res.data);

      const productData = res.data?.data || res.data;

      if (productData) {
        setProduct(productData);
        setProductName(productData.name || "");
        setProductSku(productData.sku || "");

        // Format dates for input fields (YYYY-MM-DD)
        const formatDateForInput = (dateString: string | null): string => {
          if (!dateString) return "";
          const date = new Date(dateString);
          if (isNaN(date.getTime())) return "";
          return date.toISOString().split("T")[0];
        };

        // Format integers without decimal places
        const formatInteger = (value: number | null): string => {
          if (value === null || value === undefined) return "";
          return Math.floor(value).toString();
        };

        setForm({
          stock_quantity: formatInteger(productData.stock_quantity),
          low_stock_threshold: formatInteger(productData.low_stock_threshold),
          manufactured_at: formatDateForInput(productData.manufactured_at),
          expires_at: formatDateForInput(productData.expires_at),
        });
      } else {
        toast.error("Product not found");
        router.push("/products");
      }
    } catch (err: any) {
      toast.error("Failed to load product");
      router.push("/products");
    } finally {
      setIsLoadingProduct(false);
    }
  };

  // ==========================================================================
  // FORM HANDLERS
  // ==========================================================================
  const handleInputChange = (
    field: keyof ProductFormData,
    value: string,
  ) => {
    // Special handling for integer fields to prevent decimal points
    let processedValue = value;

    if (field === "stock_quantity" || field === "low_stock_threshold") {
      // Remove any non-digit characters
      processedValue = value.replace(/[^\d]/g, "");
    }

    setForm((prev) => ({
      ...prev,
      [field]: processedValue,
    }));

    // Clear error for this field if it exists
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
    validateField(field, form[field as keyof ProductFormData]);
  };

  // ==========================================================================
  // VALIDATION
  // ==========================================================================
  const validateField = (field: string, value: any): string | undefined => {
    switch (field) {
      case "stock_quantity":
        if (!value || value.toString().trim().length === 0) {
          return "Stock quantity is required";
        }
        if (isNaN(parseInt(value.toString(), 10))) {
          return "Stock quantity must be a valid number";
        }
        const stockInt = parseInt(value.toString(), 10);
        if (stockInt < 0) {
          return "Stock quantity cannot be negative";
        }
        if (value.toString().includes(".")) {
          return "Stock quantity must be a whole number";
        }
        return undefined;

      case "low_stock_threshold":
        if (value && value.toString().trim().length > 0) {
          if (isNaN(parseInt(value.toString(), 10))) {
            return "Low stock threshold must be a valid number";
          }
          const thresholdInt = parseInt(value.toString(), 10);
          if (thresholdInt < 0) {
            return "Low stock threshold cannot be negative";
          }
          if (value.toString().includes(".")) {
            return "Low stock threshold must be a whole number";
          }
        }
        return undefined;

      default:
        return undefined;
    }
  };

  const validateAllFields = (): boolean => {
    const newErrors: FormErrors = {};
    let isValid = true;

    // Validate required fields
    const requiredFields: Array<keyof ProductFormData> = ["stock_quantity"];
    
    requiredFields.forEach((field) => {
      const error = validateField(field, form[field]);
      if (error) {
        newErrors[field] = error;
        isValid = false;
      }
    });

    // Validate optional fields if they have values
    if (form.low_stock_threshold) {
      const error = validateField("low_stock_threshold", form.low_stock_threshold);
      if (error) {
        newErrors.low_stock_threshold = error;
        isValid = false;
      }
    }

    setErrors(newErrors);
    return isValid;
  };

  // ==========================================================================
  // FORM SUBMISSION - Updated payload for specific fields
  // ==========================================================================
  const preparePayload = (): UpdateProductPayload => {
    const payload: UpdateProductPayload = {
      stock_quantity: parseInt(form.stock_quantity, 10) || 0,
    };

    // Only include low_stock_threshold if it has a value
    if (form.low_stock_threshold) {
      payload.low_stock_threshold = parseInt(form.low_stock_threshold, 10);
    }

    // Only include dates if they have values
    if (form.manufactured_at) {
      payload.manufactured_at = form.manufactured_at;
    }

    if (form.expires_at) {
      payload.expires_at = form.expires_at;
    }

    return payload;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    // Mark all fields as touched
    const allTouched: Record<string, boolean> = {
      stock_quantity: true,
      low_stock_threshold: true,
      manufactured_at: true,
      expires_at: true,
    };
    setTouched(allTouched);

    if (!validateAllFields()) {
      const firstError = Object.values(errors).find((error) => error);
      if (firstError) {
        toast.error(firstError);
      }
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = preparePayload();
      
      console.log("Updating product with payload:", payload);

      // Send as JSON since we're not uploading files
      const response = await apiPut(`/products/${productId}`, payload);

      console.log("API Response:", response);

      if (response.data?.success || response.data?.data) {
        toast.success("Product inventory updated successfully!");
        
        setTimeout(() => {
          router.push("/products");
        }, 1500);
      } else {
        toast.error("Failed to update product. Invalid response.");
      }
    } catch (err: any) {
      console.error("API Error:", err);
      
      const status = err.response?.status;
      if (status === 422) {
        const errors = err.response?.data?.errors;
        if (errors) {
          const formErrors: FormErrors = {};
          Object.keys(errors).forEach((key) => {
            const errorMessage = Array.isArray(errors[key])
              ? errors[key][0]
              : errors[key];
            formErrors[key] = errorMessage;
          });
          setErrors(formErrors);

          const firstErrorKey = Object.keys(errors)[0];
          if (firstErrorKey && errors[firstErrorKey]) {
            const firstError = Array.isArray(errors[firstErrorKey])
              ? errors[firstErrorKey][0]
              : errors[firstErrorKey];
            toast.error(`${firstError}`);
          }
        } else {
          toast.error("Validation failed. Please check the form.");
        }
      } else if (status === 404) {
        toast.error("Product not found");
        router.push("/products");
      } else {
        toast.error(
          err.response?.data?.message ||
            "Failed to update product. Please try again.",
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push("/products");
  };

  // ==========================================================================
  // FORM VALIDATION
  // ==========================================================================
  const isFormValid = 
    form.stock_quantity !== "" && 
    !errors.stock_quantity;

  // ==========================================================================
  // RENDER
  // ==========================================================================
  if (isLoadingProduct) {
    return (
      <div className="min-h-screen bg-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center py-16">
            <div className="text-center">
              <Loader2 className="h-8 w-8 text-blue-600 animate-spin mx-auto mb-3" />
              <p className="text-gray-600 font-medium">Loading product...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={handleCancel}
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Products
          </button>
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Update Inventory</h1>
              <p className="text-gray-600 mt-1">
                Update product inventory for:{" "}
                <span className="font-semibold">{productName}</span> (SKU:{" "}
                <span className="font-semibold">{productSku}</span>)
              </p>
            </div>
            <div className="flex items-center gap-3">
              {hasChanges && (
                <span className="flex items-center text-amber-600 text-sm bg-amber-50 px-3 py-1.5 rounded-lg">
                  <AlertCircle className="h-4 w-4 mr-1.5" />
                  Unsaved changes
                </span>
              )}
              <button
                onClick={handleCancel}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white shadow-sm border border-gray-200 overflow-hidden rounded-xl">
          {/* Card Header */}
          <div className="bg-gradient-to-r from-gray-900 to-blue-800 px-6 py-5">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white/10 rounded-lg">
                <Edit className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">
                  {productName || "Product"}
                </h2>
                <p className="text-blue-200 text-sm">
                  Modify the product inventory details below
                </p>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={onSubmit} className="p-6 space-y-8">
            {/* SECTION: INVENTORY */}
            <section>
              <h3 className="text-base font-semibold text-gray-900 mb-4">
                Inventory
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>
                    Stock Quantity <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    value={form.stock_quantity}
                    onChange={(e) =>
                      handleInputChange("stock_quantity", e.target.value)
                    }
                    onBlur={() => handleBlur("stock_quantity")}
                    className={
                      errors.stock_quantity ? errorInputClass : inputClass
                    }
                    placeholder="0"
                    required
                    pattern="[0-9]*"
                    inputMode="numeric"
                  />
                  {errors.stock_quantity && (
                    <div className={errorTextClass}>
                      <XCircle size={12} />
                      {errors.stock_quantity}
                    </div>
                  )}
                </div>

                <div>
                  <label className={labelClass}>Low Stock Alert</label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    value={form.low_stock_threshold}
                    onChange={(e) =>
                      handleInputChange(
                        "low_stock_threshold",
                        e.target.value,
                      )
                    }
                    onBlur={() => handleBlur("low_stock_threshold")}
                    className={
                      errors.low_stock_threshold
                        ? errorInputClass
                        : inputClass
                    }
                    placeholder="5"
                    pattern="[0-9]*"
                    inputMode="numeric"
                  />
                  {errors.low_stock_threshold && (
                    <div className={errorTextClass}>
                      <XCircle size={12} />
                      {errors.low_stock_threshold}
                    </div>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    Alert when stock goes below this number
                  </p>
                </div>
              </div>
            </section>

            {/* SECTION: PRODUCT DETAILS (Dates) */}
            <section>
              <h3 className="text-base font-semibold text-gray-900 mb-4">
                Product Dates
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Manufacture Date</label>
                  <input
                    type="date"
                    value={form.manufactured_at}
                    onChange={(e) =>
                      handleInputChange("manufactured_at", e.target.value)
                    }
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Expiry Date</label>
                  <input
                    type="date"
                    value={form.expires_at}
                    onChange={(e) =>
                      handleInputChange("expires_at", e.target.value)
                    }
                    className={inputClass}
                  />
                </div>
              </div>
            </section>

            {/* Submit Button */}
            <div className="flex justify-end pt-6 border-t border-gray-200">
              <button
                type="submit"
                disabled={!isFormValid || isSubmitting || !hasChanges}
                className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Updating Inventory...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Update Inventory
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default withAuth(EditProductPage);