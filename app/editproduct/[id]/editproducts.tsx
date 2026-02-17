"use client";

import { useRouter, useParams } from "next/navigation";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { toast } from "react-hot-toast";
import { apiGet, apiPost } from "@/lib/axios";
import {
  Package,
  Tag,
  DollarSign,
  Image as ImageIcon,
  ArrowLeft,
  Plus,
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
  name: string;
  sku: string;
  description: string;
  category_id: number | string;
  products_measurements: string;
  price: string;
  cost_price: string;
  sale_price: string;
  stock_quantity: string;
  low_stock_threshold: string;
  discount_percentage: string;
  discount_start_date: string;
  discount_end_date: string;
  manufactured_at: string;
  expires_at: string;
  weight: string;
  length: string;
  width: string;
  height: string;
  supplier_id: string;
  is_active: boolean;
  is_featured: boolean;
  is_on_sale: boolean;
  image: string | null;
}

interface FormErrors {
  name?: string;
  sku?: string;
  category_id?: string;
  products_measurements?: string;
  price?: string;
  cost_price?: string;
  stock_quantity?: string;
  discount_percentage?: string;
  discount_start_date?: string;
  discount_end_date?: string;
  manufactured_at?: string;
  expires_at?: string;
  weight?: string;
  length?: string;
  width?: string;
  height?: string;
  [key: string]: string | undefined;
}

interface Category {
  id: number;
  name: string;
}

interface Supplier {
  id: string;
  vid: number;
  vendor_name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  is_active?: boolean;
}

interface Product {
  id: number;
  name: string;
  sku: string;
  description: string | null;
  category_id: number;
  products_measurements: string | null;
  price: number;
  cost_price: number | null;
  sale_price: number | null;
  stock_quantity: number;
  low_stock_threshold: number | null;
  discount_percentage: number | null;
  discount_start_date: string | null;
  discount_end_date: string | null;
  manufactured_at: string | null;
  expires_at: string | null;
  weight: number | null;
  length: number | null;
  width: number | null;
  height: number | null;
  supplier_id: number | null;
  is_active: boolean;
  is_featured: boolean;
  is_on_sale: boolean;
  image: string | null;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

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
    name: "",
    sku: "",
    description: "",
    category_id: "",
    products_measurements: "",
    price: "",
    cost_price: "",
    sale_price: "",
    stock_quantity: "",
    low_stock_threshold: "",
    discount_percentage: "",
    discount_start_date: "",
    discount_end_date: "",
    manufactured_at: "",
    expires_at: "",
    weight: "",
    length: "",
    width: "",
    height: "",
    supplier_id: "",
    is_active: true,
    is_featured: false,
    is_on_sale: false,
    image: null,
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isLoadingProduct, setIsLoadingProduct] = useState(true);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);
  const [product, setProduct] = useState<Product | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

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
  // HELPER FUNCTIONS
  // ==========================================================================
  const getFullImageUrl = (imagePath: string | null): string | null => {
    if (!imagePath) return null;
    if (imagePath.startsWith('http')) return imagePath;
    return `${API_BASE_URL}/storage/${imagePath}`;
  };

  // Format number to remove decimal places for integers
  const formatIntegerString = (value: string): string => {
    if (!value) return '';
    // Remove any decimal points and everything after
    return value.split('.')[0];
  };

  // ==========================================================================
  // LIFECYCLE METHODS
  // ==========================================================================
  useEffect(() => {
    fetchAllData();
  }, [productId]);

  // Clean up preview URL when component unmounts
  useEffect(() => {
    return () => {
      if (imagePreview && imagePreview !== originalImageUrl) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview, originalImageUrl]);

  // Track form changes
  useEffect(() => {
    if (product) {
      const formData = { ...form };
      const productData = {
        name: product.name,
        sku: product.sku,
        description: product.description || "",
        category_id: product.category_id?.toString() || "",
        products_measurements: product.products_measurements || "",
        price: product.price?.toString() || "",
        cost_price: product.cost_price?.toString() || "",
        sale_price: product.sale_price?.toString() || "",
        stock_quantity: product.stock_quantity?.toString() || "",
        low_stock_threshold: product.low_stock_threshold?.toString() || "",
        discount_percentage: product.discount_percentage?.toString() || "",
        discount_start_date: product.discount_start_date || "",
        discount_end_date: product.discount_end_date || "",
        manufactured_at: product.manufactured_at || "",
        expires_at: product.expires_at || "",
        weight: product.weight?.toString() || "",
        length: product.length?.toString() || "",
        width: product.width?.toString() || "",
        height: product.height?.toString() || "",
        supplier_id: product.supplier_id?.toString() || "",
        is_active: product.is_active,
        is_featured: product.is_featured,
        is_on_sale: product.is_on_sale,
        image: product.image,
      };

      const hasFormChanges = JSON.stringify(formData) !== JSON.stringify(productData);
      setHasChanges(hasFormChanges || imageFile !== null);
    }
  }, [form, product, imageFile]);

  // ==========================================================================
  // DATA FETCHING
  // ==========================================================================
  const fetchAllData = async () => {
    setIsLoadingData(true);
    setIsLoadingProduct(true);
    try {
      await Promise.all([fetchCategories(), fetchSuppliers(), fetchProduct()]);
    } catch (err: any) {
      toast.error("Failed to load required data");
    } finally {
      setIsLoadingData(false);
      setIsLoadingProduct(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await apiGet("/product-categories");
      const categoriesArray =
        res.data?.data?.product_categories ?? res.data?.data ?? [];
      setCategories(Array.isArray(categoriesArray) ? categoriesArray : []);
    } catch (err) {
      console.error("Error fetching categories:", err);
      setCategories([]);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const res = await apiGet("/vendors");
      const suppliersArray = res.data?.data?.vendors ?? res.data?.data ?? [];
      const transformedSuppliers = Array.isArray(suppliersArray)
        ? suppliersArray.map((vendor: any) => ({
            id: vendor.id,
            vid: vendor.vid,
            vendor_name: vendor.vendor_name || vendor.name || "",
            contact_person: vendor.contact_person,
            email: vendor.email,
            phone: vendor.phone,
            is_active: vendor.is_active,
          }))
        : [];
      setSuppliers(transformedSuppliers);
    } catch (err) {
      console.error("Error fetching suppliers:", err);
      setSuppliers([]);
    }
  };

  const fetchProduct = async () => {
    try {
      const res = await apiGet(`/products/${productId}`);
      console.log("Product data:", res.data);
      
      const productData = res.data?.data || res.data;
      
      if (productData) {
        setProduct(productData);
        
        // Format dates for input fields (YYYY-MM-DD)
        const formatDateForInput = (dateString: string | null): string => {
          if (!dateString) return "";
          const date = new Date(dateString);
          if (isNaN(date.getTime())) return "";
          return date.toISOString().split('T')[0];
        };

        // Format integers without decimal places
        const formatInteger = (value: number | null): string => {
          if (value === null || value === undefined) return "";
          return Math.floor(value).toString(); // Ensure it's an integer
        };

        // Get full image URL
        const imageUrl = getFullImageUrl(productData.image);

        setForm({
          name: productData.name || "",
          sku: productData.sku || "",
          description: productData.description || "",
          category_id: productData.category_id?.toString() || "",
          products_measurements: productData.products_measurements || "",
          price: productData.price?.toString() || "",
          cost_price: productData.cost_price?.toString() || "",
          sale_price: productData.sale_price?.toString() || "",
          stock_quantity: formatInteger(productData.stock_quantity),
          low_stock_threshold: formatInteger(productData.low_stock_threshold),
          discount_percentage: productData.discount_percentage?.toString() || "",
          discount_start_date: formatDateForInput(productData.discount_start_date),
          discount_end_date: formatDateForInput(productData.discount_end_date),
          manufactured_at: formatDateForInput(productData.manufactured_at),
          expires_at: formatDateForInput(productData.expires_at),
          weight: productData.weight?.toString() || "",
          length: productData.length?.toString() || "",
          width: productData.width?.toString() || "",
          height: productData.height?.toString() || "",
          supplier_id: productData.supplier_id?.toString() || "",
          is_active: productData.is_active ?? false,
          is_featured: productData.is_featured ?? false,
          is_on_sale: productData.is_on_sale ?? false,
          image: imageUrl,
        });

        if (imageUrl) {
          setOriginalImageUrl(imageUrl);
          setImagePreview(imageUrl);
        }
      } else {
        toast.error("Product not found");
        router.push("/products");
      }
    } catch (err: any) {
      toast.error("Failed to load product");
      router.push("/products");
    }
  };

  // ==========================================================================
  // IMAGE HANDLING
  // ==========================================================================
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/avif"];
    const maxSize = 2 * 1024 * 1024; // 2MB

    if (!allowedTypes.includes(file.type)) {
      toast.error("Please upload a JPEG, PNG, AVIF, or WEBP image.");
      return;
    }

    if (file.size > maxSize) {
      toast.error("Image must be smaller than 2MB.");
      return;
    }

    setImageFile(file);
    
    // Create preview URL for new upload
    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);
    // Don't update form.image here as it's handled separately in submission
  };

  const removeImage = () => {
    if (imagePreview && imagePreview !== originalImageUrl) {
      URL.revokeObjectURL(imagePreview);
    }
    setImageFile(null);
    setImagePreview(originalImageUrl);
  };

  // ==========================================================================
  // FORM HANDLERS
  // ==========================================================================
  const handleInputChange = (
    field: keyof ProductFormData,
    value: string | boolean,
  ) => {
    // Special handling for integer fields to prevent decimal points
    let processedValue = value;
    
    if (field === 'stock_quantity' || field === 'low_stock_threshold') {
      // For integer fields, remove any decimal points
      if (typeof value === 'string') {
        // Remove any non-digit characters except empty string
        processedValue = value.replace(/[^\d]/g, '');
      }
    }

    setForm((prev) => ({
      ...prev,
      [field]: processedValue,
    }));

    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: undefined,
      }));
    }

    // Auto-calculate sale price when discount changes
    if (field === "discount_percentage" || field === "price") {
      calculateSalePrice();
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
      case "name":
        if (!value || value.toString().trim().length === 0) {
          return "Product name is required";
        }
        if (value.toString().trim().length < 2) {
          return "Product name must be at least 2 characters";
        }
        return undefined;

      case "sku":
        if (!value || value.toString().trim().length === 0) {
          return "SKU is required";
        }
        if (value.toString().trim().length < 3) {
          return "SKU must be at least 3 characters";
        }
        return undefined;

      case "category_id":
        if (!value || value === "" || value === 0) {
          return "Category is required";
        }
        return undefined;

      case "price":
        if (!value || value.toString().trim().length === 0) {
          return "Price is required";
        }
        if (isNaN(parseFloat(value.toString()))) {
          return "Price must be a valid number";
        }
        if (parseFloat(value.toString()) < 0) {
          return "Price cannot be negative";
        }
        return undefined;

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
        // Check if it's not an integer (has decimal places)
        if (value.toString().includes('.')) {
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
          if (value.toString().includes('.')) {
            return "Low stock threshold must be a whole number";
          }
        }
        return undefined;

      case "discount_percentage":
        if (value && value.toString().trim().length > 0) {
          if (isNaN(parseFloat(value.toString()))) {
            return "Discount percentage must be a valid number";
          }
          const discount = parseFloat(value.toString());
          if (discount < 0 || discount > 100) {
            return "Discount percentage must be between 0 and 100";
          }
        }
        return undefined;

      case "cost_price":
        if (value && value.toString().trim().length > 0) {
          if (isNaN(parseFloat(value.toString()))) {
            return "Cost price must be a valid number";
          }
          if (parseFloat(value.toString()) < 0) {
            return "Cost price cannot be negative";
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

    (Object.keys(form) as Array<keyof ProductFormData>).forEach((field) => {
      // Skip validation for fields that are not required
      if (field === 'description' || field === 'image' || field === 'products_measurements') return;
      
      const error = validateField(field, form[field]);
      if (error) {
        newErrors[field] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  // ==========================================================================
  // CALCULATIONS
  // ==========================================================================
  const generateSKU = (): string => {
    const prefix = "PROD";
    const randomNum = Math.floor(100000 + Math.random() * 900000);
    return `${prefix}${randomNum}`;
  };

  const handleGenerateSKU = () => {
    const sku = generateSKU();
    setForm((prev) => ({ ...prev, sku }));
  };

  const calculateSalePrice = () => {
    if (form.price && form.discount_percentage) {
      const price = parseFloat(form.price);
      const discount = parseFloat(form.discount_percentage);
      if (
        !isNaN(price) &&
        !isNaN(discount) &&
        discount > 0 &&
        discount <= 100
      ) {
        const salePrice = price - (price * discount) / 100;
        setForm((prev) => ({
          ...prev,
          sale_price: salePrice.toFixed(2),
          is_on_sale: true,
        }));
      }
    } else {
      setForm((prev) => ({
        ...prev,
        sale_price: "",
        is_on_sale: false,
      }));
    }
  };

  // ==========================================================================
  // FORM SUBMISSION
  // ==========================================================================
  const prepareFormData = (): FormData => {
    const formData = new FormData();
    formData.append('_method', 'PUT'); // For Laravel or similar frameworks
    
    // Basic Information
    formData.append('name', form.name.trim());
    formData.append('sku', form.sku.trim());
    if (form.description.trim()) formData.append('description', form.description.trim());
    
    // Category
    if (form.category_id) formData.append('category_id', form.category_id.toString());
    if (form.products_measurements) formData.append('products_measurements', form.products_measurements);
    
    // Pricing
    formData.append('price', form.price || '0');
    if (form.cost_price) formData.append('cost_price', form.cost_price);
    if (form.sale_price) formData.append('sale_price', form.sale_price);
    
    // Inventory - Ensure integer values
    formData.append('stock_quantity', form.stock_quantity ? parseInt(form.stock_quantity, 10).toString() : '0');
    if (form.low_stock_threshold) {
      formData.append('low_stock_threshold', parseInt(form.low_stock_threshold, 10).toString());
    }
    
    // Discount
    if (form.discount_percentage) formData.append('discount_percentage', form.discount_percentage);
    if (form.discount_start_date) formData.append('discount_start_date', form.discount_start_date);
    if (form.discount_end_date) formData.append('discount_end_date', form.discount_end_date);
    
    // Dates
    if (form.manufactured_at) formData.append('manufactured_at', form.manufactured_at);
    if (form.expires_at) formData.append('expires_at', form.expires_at);
    
    // Dimensions
    if (form.weight) formData.append('weight', form.weight);
    if (form.length) formData.append('length', form.length);
    if (form.width) formData.append('width', form.width);
    if (form.height) formData.append('height', form.height);
    
    // Supplier
    if (form.supplier_id) formData.append('supplier_id', form.supplier_id);
    
    // Status - Send as strings '1' or '0'
    formData.append('is_active', form.is_active ? '1' : '0');
    formData.append('is_featured', form.is_featured ? '1' : '0');
    formData.append('is_on_sale', form.is_on_sale ? '1' : '0');
    
    // Image - Only append if a new image is selected
    if (imageFile) {
      formData.append('image', imageFile);
    }
    
    return formData;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form submitted for update");
    
    if (isSubmitting) return;

    // Mark all fields as touched
    const allTouched: Record<string, boolean> = {};
    (Object.keys(form) as Array<keyof ProductFormData>).forEach((field) => {
      allTouched[field] = true;
    });
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
      const formData = prepareFormData();

      const response = await apiPost(`products/${productId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      console.log("API Response:", response);

      if (response.success || response.data) {
        toast.success("Product updated successfully!", {
          id: "update-product",
        });

        setTimeout(() => {
          router.push("/products");
        }, 1500);
      } else {
        toast.error("Failed to update product. Invalid response.");
      }
    } catch (err: any) {
      console.error("Full API Error:", err);

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
            toast.error(`${firstErrorKey}: ${firstError}`);
          }
        } else {
          toast.error("Validation failed. Please check the form.");
        }
      } else if (status === 404) {
        toast.error("Product not found");
        router.push("/products");
      } else if (status === 500) {
        const errorMessage =
          err.response?.data?.message ||
          err.response?.data?.error ||
          "Internal server error";
        toast.error(`Server error: ${errorMessage}`);
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
    form.name.trim().length > 0 &&
    form.sku.trim().length > 0 &&
    form.category_id !== "" &&
    form.category_id !== 0 &&
    form.price !== "" &&
    form.stock_quantity !== "" &&
    !errors.name &&
    !errors.sku &&
    !errors.category_id &&
    !errors.price &&
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
              <h1 className="text-2xl font-bold text-gray-900">
                Edit Product
              </h1>
              <p className="text-gray-600 mt-1">
                Update product information for SKU: <span className="font-semibold">{form.sku}</span>
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
          <div className="bg-gradient-to-r from-blue-900 to-blue-800 px-6 py-5">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white/10 rounded-lg">
                <Edit className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">
                  Edit Product: {form.name || "Product"}
                </h2>
                <p className="text-blue-200 text-sm">
                  Modify the product details below
                </p>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={onSubmit} className="p-6 space-y-8">
            {isLoadingData ? (
              <div className="flex justify-center items-center py-16">
                <div className="text-center">
                  <Loader2 className="h-8 w-8 text-blue-600 animate-spin mx-auto mb-3" />
                  <p className="text-gray-600 font-medium">
                    Loading form data...
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* SECTION 1: BASIC INFORMATION */}
                <section>
                  <h3 className="text-base font-semibold text-gray-900 mb-4">
                    Basic Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>
                        Product Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        maxLength={200}
                        value={form.name}
                        onChange={(e) =>
                          handleInputChange("name", e.target.value)
                        }
                        onBlur={() => handleBlur("name")}
                        required
                        className={errors.name ? errorInputClass : inputClass}
                        placeholder="Enter product name"
                      />
                      {errors.name && (
                        <div className={errorTextClass}>
                          <XCircle size={12} />
                          {errors.name}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className={labelClass}>
                        SKU <span className="text-red-500">*</span>
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          maxLength={50}
                          value={form.sku}
                          onChange={(e) =>
                            handleInputChange("sku", e.target.value)
                          }
                          onBlur={() => handleBlur("sku")}
                          required
                          className={errors.sku ? errorInputClass : inputClass}
                          placeholder="Enter SKU"
                        />
                        <button
                          type="button"
                          onClick={handleGenerateSKU}
                          className="px-4 py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors whitespace-nowrap text-sm"
                        >
                          Generate New
                        </button>
                      </div>
                      {errors.sku && (
                        <div className={errorTextClass}>
                          <XCircle size={12} />
                          {errors.sku}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className={labelClass}>
                        Category <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={form.category_id}
                        onChange={(e) =>
                          handleInputChange("category_id", e.target.value)
                        }
                        onBlur={() => handleBlur("category_id")}
                        required
                        className={
                          errors.category_id ? errorInputClass : inputClass
                        }
                      >
                        <option value="">Select category</option>
                        {categories.map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                      {errors.category_id && (
                        <div className={errorTextClass}>
                          <XCircle size={12} />
                          {errors.category_id}
                        </div>
                      )}
                    </div>

                    <div className="md:col-span-2">
                      <label className={labelClass}>Description</label>
                      <textarea
                        rows={3}
                        maxLength={500}
                        value={form.description}
                        onChange={(e) =>
                          handleInputChange("description", e.target.value)
                        }
                        className={`${inputClass} resize-none`}
                        placeholder="Enter product description"
                      />
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-xs text-gray-500">
                          {form.description.length}/500 characters
                        </span>
                        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
                          Optional
                        </span>
                      </div>
                    </div>
                  </div>
                </section>

                {/* SECTION 2: IMAGE UPLOAD */}
                <section>
                  <h3 className="text-base font-semibold text-gray-900 mb-4">
                    Product Image
                  </h3>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors cursor-pointer bg-gray-50/50">
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/avif"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="product-image-upload"
                    />
                    <label
                      htmlFor="product-image-upload"
                      className="cursor-pointer"
                    >
                      <div className="flex flex-col items-center justify-center space-y-3">
                        <ImageIcon className="h-10 w-10 text-gray-400" />
                        <p className="text-sm font-medium text-gray-600">
                          Click to upload new product image
                        </p>
                        <p className="text-xs text-gray-500">
                          PNG, JPG, WEBP, AVIF up to 2MB
                        </p>
                      </div>
                    </label>
                  </div>
                  
                  {/* Image Preview */}
                  {imagePreview && (
                    <div className="mt-4 flex items-center space-x-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="w-16 h-16 rounded overflow-hidden border border-blue-300 bg-white">
                        <img
                          src={imagePreview}
                          alt="Product preview"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            // Fallback if image fails to load
                            e.currentTarget.src = 'https://via.placeholder.com/64?text=No+Image';
                          }}
                        />
                      </div>
                      <div>
                        <span className="text-sm text-gray-700 block">
                          {imageFile ? imageFile.name : "Current image"}
                        </span>
                        {imageFile && (
                          <span className="text-xs text-gray-500">
                            {(imageFile?.size || 0) / 1024 < 1024 
                              ? `${((imageFile?.size || 0) / 1024).toFixed(1)} KB` 
                              : `${((imageFile?.size || 0) / (1024 * 1024)).toFixed(1)} MB`}
                          </span>
                        )}
                        {!imageFile && originalImageUrl && (
                          <span className="text-xs text-gray-500">
                            Existing image
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={removeImage}
                        className="ml-auto text-red-500 hover:text-red-700"
                        title="Remove image"
                      >
                        <XCircle size={18} />
                      </button>
                    </div>
                  )}
                </section>

                {/* SECTION 3: PRICING */}
                <section>
                  <h3 className="text-base font-semibold text-gray-900 mb-4">
                    Pricing
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className={labelClass}>
                        Price <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                          $
                        </span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={form.price}
                          onChange={(e) =>
                            handleInputChange("price", e.target.value)
                          }
                          onBlur={() => handleBlur("price")}
                          className={`${errors.price ? errorInputClass : inputClass} pl-8`}
                          placeholder="0.00"
                          required
                        />
                      </div>
                      {errors.price && (
                        <div className={errorTextClass}>
                          <XCircle size={12} />
                          {errors.price}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className={labelClass}>Cost Price</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                          $
                        </span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={form.cost_price}
                          onChange={(e) =>
                            handleInputChange("cost_price", e.target.value)
                          }
                          onBlur={() => handleBlur("cost_price")}
                          className={`${errors.cost_price ? errorInputClass : inputClass} pl-8`}
                          placeholder="0.00"
                        />
                      </div>
                      {errors.cost_price && (
                        <div className={errorTextClass}>
                          <XCircle size={12} />
                          {errors.cost_price}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className={labelClass}>Sale Price</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                          $
                        </span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={form.sale_price}
                          onChange={(e) =>
                            handleInputChange("sale_price", e.target.value)
                          }
                          className={`${inputClass} pl-8`}
                          placeholder="0.00"
                          readOnly={!!form.discount_percentage}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Discount Section */}
                  <div className="mt-6 p-4 bg-gradient-to-br from-blue-50 to-blue-100/30 rounded-lg border border-blue-200">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <Tag className="w-4 h-4" />
                      Discount Settings
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className={labelClass}>Discount %</label>
                        <div className="relative">
                          <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                            %
                          </span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            max="100"
                            value={form.discount_percentage}
                            onChange={(e) =>
                              handleInputChange(
                                "discount_percentage",
                                e.target.value,
                              )
                            }
                            onBlur={() => {
                              handleBlur("discount_percentage");
                              calculateSalePrice();
                            }}
                            className={`${errors.discount_percentage ? errorInputClass : inputClass} pr-10`}
                            placeholder="0.00"
                          />
                        </div>
                        {errors.discount_percentage && (
                          <div className={errorTextClass}>
                            <XCircle size={12} />
                            {errors.discount_percentage}
                          </div>
                        )}
                      </div>

                      <div>
                        <label className={labelClass}>Start Date</label>
                        <input
                          type="date"
                          value={form.discount_start_date}
                          onChange={(e) =>
                            handleInputChange(
                              "discount_start_date",
                              e.target.value,
                            )
                          }
                          className={inputClass}
                        />
                      </div>

                      <div>
                        <label className={labelClass}>End Date</label>
                        <input
                          type="date"
                          value={form.discount_end_date}
                          onChange={(e) =>
                            handleInputChange(
                              "discount_end_date",
                              e.target.value,
                            )
                          }
                          className={inputClass}
                        />
                      </div>
                    </div>
                  </div>
                </section>

                {/* SECTION 4: INVENTORY */}
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
                        step="1" // This ensures only integers can be entered via spinner
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
                        pattern="[0-9]*" // Only allow digits
                        inputMode="numeric" // Show numeric keyboard on mobile
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
                        step="1" // This ensures only integers can be entered via spinner
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
                        pattern="[0-9]*" // Only allow digits
                        inputMode="numeric" // Show numeric keyboard on mobile
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

                {/* SECTION 5: PRODUCT DETAILS */}
                <section>
                  <h3 className="text-base font-semibold text-gray-900 mb-4">
                    Product Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <label className={labelClass}>Weight (kg)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={form.weight}
                        onChange={(e) =>
                          handleInputChange("weight", e.target.value)
                        }
                        className={inputClass}
                        placeholder="0.00"
                      />
                    </div>

                    <div>
                      <label className={labelClass}>Length (cm)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={form.length}
                        onChange={(e) =>
                          handleInputChange("length", e.target.value)
                        }
                        className={inputClass}
                        placeholder="0"
                      />
                    </div>

                    <div>
                      <label className={labelClass}>Width (cm)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={form.width}
                        onChange={(e) =>
                          handleInputChange("width", e.target.value)
                        }
                        className={inputClass}
                        placeholder="0"
                      />
                    </div>

                    <div>
                      <label className={labelClass}>Height (cm)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={form.height}
                        onChange={(e) =>
                          handleInputChange("height", e.target.value)
                        }
                        className={inputClass}
                        placeholder="0"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
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

                {/* SECTION 6: SUPPLIER & STATUS */}
                <section>
                  <h3 className="text-base font-semibold text-gray-900 mb-4">
                    Supplier & Status
                  </h3>
                  <div className="space-y-6">
                    <div>
                      <label className={labelClass}>Supplier</label>
                      <select
                        value={form.supplier_id}
                        onChange={(e) =>
                          handleInputChange("supplier_id", e.target.value)
                        }
                        className={inputClass}
                      >
                        <option value="">Select supplier</option>
                        {suppliers.map((supplier) => (
                          <option key={supplier.vid} value={supplier.vid}>
                            {supplier.vendor_name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Status Toggles */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <label className="flex items-center space-x-3 cursor-pointer">
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
                                  form.is_active
                                    ? "translate-x-6"
                                    : "translate-x-0"
                                }`}
                              />
                            </div>
                          </div>
                          <div>
                            <span className="font-semibold text-gray-700">
                              Active
                            </span>
                            <p className="text-xs text-gray-500">
                              Product is visible
                            </p>
                          </div>
                        </label>
                      </div>

                      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <label className="flex items-center space-x-3 cursor-pointer">
                          <div className="relative">
                            <input
                              type="checkbox"
                              checked={form.is_featured}
                              onChange={(e) =>
                                handleInputChange(
                                  "is_featured",
                                  e.target.checked,
                                )
                              }
                              className="sr-only"
                            />
                            <div
                              className={`w-12 h-6 flex items-center rounded-full p-1 transition-all ${
                                form.is_featured
                                  ? "bg-yellow-500"
                                  : "bg-gray-300"
                              }`}
                            >
                              <div
                                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                                  form.is_featured
                                    ? "translate-x-6"
                                    : "translate-x-0"
                                }`}
                              />
                            </div>
                          </div>
                          <div>
                            <span className="font-semibold text-gray-700">
                              Featured
                            </span>
                            <p className="text-xs text-gray-500">
                              Highlight product
                            </p>
                          </div>
                        </label>
                      </div>

                      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <label className="flex items-center space-x-3 cursor-pointer">
                          <div className="relative">
                            <input
                              type="checkbox"
                              checked={form.is_on_sale}
                              onChange={(e) =>
                                handleInputChange(
                                  "is_on_sale",
                                  e.target.checked,
                                )
                              }
                              className="sr-only"
                            />
                            <div
                              className={`w-12 h-6 flex items-center rounded-full p-1 transition-all ${
                                form.is_on_sale ? "bg-red-500" : "bg-gray-300"
                              }`}
                            >
                              <div
                                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                                  form.is_on_sale
                                    ? "translate-x-6"
                                    : "translate-x-0"
                                }`}
                              />
                            </div>
                          </div>
                          <div>
                            <span className="font-semibold text-gray-700">
                              On Sale
                            </span>
                            <p className="text-xs text-gray-500">
                              Show as discounted
                            </p>
                          </div>
                        </label>
                      </div>
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
                        Updating...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Update Product
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default withAuth(EditProductPage);