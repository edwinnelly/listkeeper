"use client";
import { useRouter } from "next/navigation";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { toast } from "react-hot-toast";
import { apiGet, apiPost } from "@/lib/axios";
import {
  Package,
  Tag,
  Image as ImageIcon,
  ArrowLeft,
  Plus,
  Loader2,
  XCircle,
  ChevronRight,
  Sparkles,
  BarChart3,
  Truck,
  Layers,
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

interface Unit {
  id: number;
  name: string;
  symbol: string;
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

interface ApiError {
  response?: {
    status?: number;
    data?: {
      message?: string;
      error?: string;
      errors?: Record<string, string[] | string>;
    };
  };
}

interface VendorApiResponse {
  id: string | number;
  vid: number;
  vendor_name?: string;
  name?: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  is_active?: boolean;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const staticUnits: Unit[] = [
  { id: 1, name: "Piece", symbol: "pc" },
  { id: 2, name: "Kilogram", symbol: "kg" },
  { id: 3, name: "Gram", symbol: "g" },
  { id: 4, name: "Liter", symbol: "L" },
  { id: 5, name: "Milliliter", symbol: "mL" },
  { id: 6, name: "Meter", symbol: "m" },
  { id: 7, name: "Centimeter", symbol: "cm" },
  { id: 8, name: "Dozen", symbol: "dz" },
  { id: 9, name: "Pack", symbol: "pk" },
  { id: 10, name: "Box", symbol: "bx" },
  { id: 11, name: "Bottle", symbol: "btl" },
  { id: 12, name: "Carton", symbol: "ctn" },
  { id: 13, name: "Pair", symbol: "pr" },
  { id: 14, name: "Set", symbol: "set" },
  { id: 15, name: "Roll", symbol: "roll" },
];

// ============================================================================
// SECTION WRAPPER COMPONENT
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
// FIELD WRAPPER
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
  activeColor: string;
  label: string;
  description: string;
}> = ({ checked, onChange, activeColor, label, description }) => (
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
          checked ? activeColor : "bg-gray-200"
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
// MAIN COMPONENT
// ============================================================================

const AddProductPage: React.FC = () => {
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
  const [categories, setCategories] = useState<Category[]>([]);
  const [units] = useState<Unit[]>(staticUnits);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isLoadingData, setIsLoadingData] = useState<boolean>(true);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const router = useRouter();

  // Styling
  const inputClass =
    "w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 outline-none transition-all duration-150 placeholder-gray-300 text-sm text-gray-800 font-medium";
  const errorInputClass =
    "w-full px-3.5 py-2.5 bg-white border border-red-300 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-400 outline-none transition-all duration-150 placeholder-gray-300 text-sm text-gray-800 font-medium";

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  const fetchData = async (): Promise<void> => {
    setIsLoadingData(true);
    try {
      await Promise.all([fetchCategories(), fetchSuppliers()]);
    } catch {
      toast.error("Failed to load required data");
    } finally {
      setIsLoadingData(false);
    }
  };

  const fetchCategories = async (): Promise<void> => {
    try {
      const res = await apiGet("/product-categories");
      const categoriesArray =
        res.data?.data?.product_categories ?? res.data?.data ?? [];
      setCategories(Array.isArray(categoriesArray) ? categoriesArray : []);
    } catch {
      setCategories([]);
    }
  };

  const fetchSuppliers = async (): Promise<void> => {
    try {
      const res = await apiGet("/vendors");
      const suppliersArray = res.data?.data?.vendors ?? res.data?.data ?? [];
      const transformedSuppliers: Supplier[] = Array.isArray(suppliersArray)
        ? suppliersArray.map((vendor: VendorApiResponse) => ({
            id: String(vendor.id),
            vid: vendor.vid,
            vendor_name: vendor.vendor_name || vendor.name || "",
            contact_person: vendor.contact_person,
            email: vendor.email,
            phone: vendor.phone,
            is_active: vendor.is_active,
          }))
        : [];
      setSuppliers(transformedSuppliers);
    } catch {
      setSuppliers([]);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/avif"];
    const maxSize = 2 * 1024 * 1024;
    if (!allowedTypes.includes(file.type)) {
      toast.error("Please upload a JPEG, PNG, AVIF, or WEBP image.");
      return;
    }
    if (file.size > maxSize) {
      toast.error("Image must be smaller than 2MB.");
      return;
    }
    setImageFile(file);
    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);
    setForm((prev) => ({ ...prev, image: previewUrl }));
  };

  const handleInputChange = (
    field: keyof ProductFormData,
    value: string | boolean | number,
  ): void => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
    if (field === "discount_percentage" || field === "price") calculateSalePrice();
  };

  const handleBlur = (field: string): void => {
    validateField(field, form[field as keyof ProductFormData]);
  };

  const validateField = (field: string, value: string | number | boolean | null): string | undefined => {
    const strValue = value?.toString() ?? "";
    switch (field) {
      case "name":
        if (!strValue.trim()) return "Product name is required";
        if (strValue.trim().length < 2) return "Must be at least 2 characters";
        return undefined;
      case "sku":
        if (!strValue.trim()) return "SKU is required";
        if (strValue.trim().length < 3) return "Must be at least 3 characters";
        return undefined;
      case "category_id":
        if (!value || value === "" || value === 0) return "Category is required";
        return undefined;
      case "products_measurements":
        if (!value || value === "") return "Unit is required";
        return undefined;
      case "price":
        if (!strValue.trim()) return "Price is required";
        if (isNaN(parseFloat(strValue))) return "Must be a valid number";
        if (parseFloat(strValue) < 0) return "Cannot be negative";
        return undefined;
      case "stock_quantity":
        if (!strValue.trim()) return "Stock quantity is required";
        if (isNaN(parseInt(strValue))) return "Must be a valid number";
        if (parseInt(strValue) < 0) return "Cannot be negative";
        return undefined;
      case "low_stock_threshold":
        if (strValue.trim()) {
          if (isNaN(parseInt(strValue))) return "Must be a valid number";
          if (parseInt(strValue) < 0) return "Cannot be negative";
        }
        return undefined;
      case "discount_percentage":
        if (strValue.trim()) {
          if (isNaN(parseFloat(strValue))) return "Must be a valid number";
          const discount = parseFloat(strValue);
          if (discount < 0 || discount > 100) return "Must be between 0 and 100";
        }
        return undefined;
      case "cost_price":
        if (strValue.trim()) {
          if (isNaN(parseFloat(strValue))) return "Must be a valid number";
          if (parseFloat(strValue) < 0) return "Cannot be negative";
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
      const error = validateField(field, form[field]);
      if (error) { newErrors[field] = error; isValid = false; }
    });
    setErrors(newErrors);
    return isValid;
  };

  const generateSKU = (): string => `PROD${Math.floor(100000 + Math.random() * 900000)}`;
  const handleGenerateSKU = (): void => setForm((prev) => ({ ...prev, sku: generateSKU() }));

  const calculateSalePrice = (): void => {
    if (form.price && form.discount_percentage) {
      const price = parseFloat(form.price);
      const discount = parseFloat(form.discount_percentage);
      if (!isNaN(price) && !isNaN(discount) && discount > 0 && discount <= 100) {
        const salePrice = price - (price * discount) / 100;
        setForm((prev) => ({ ...prev, sale_price: salePrice.toFixed(2), is_on_sale: true }));
      }
    } else {
      setForm((prev) => ({ ...prev, sale_price: "", is_on_sale: false }));
    }
  };

  const prepareFormData = (): FormData => {
    const formData = new FormData();
    formData.append("name", form.name.trim());
    formData.append("sku", form.sku.trim());
    if (form.description.trim()) formData.append("description", form.description.trim());
    if (form.category_id) formData.append("category_id", form.category_id.toString());
    if (form.products_measurements) formData.append("products_measurements", form.products_measurements);
    formData.append("price", form.price || "0");
    if (form.cost_price) formData.append("cost_price", form.cost_price);
    if (form.sale_price) formData.append("sale_price", form.sale_price);
    formData.append("stock_quantity", form.stock_quantity || "0");
    if (form.low_stock_threshold) formData.append("low_stock_threshold", form.low_stock_threshold);
    if (form.discount_percentage) formData.append("discount_percentage", form.discount_percentage);
    if (form.discount_start_date) formData.append("discount_start_date", form.discount_start_date);
    if (form.discount_end_date) formData.append("discount_end_date", form.discount_end_date);
    if (form.manufactured_at) formData.append("manufactured_at", form.manufactured_at);
    if (form.expires_at) formData.append("expires_at", form.expires_at);
    if (form.weight) formData.append("weight", form.weight);
    if (form.length) formData.append("length", form.length);
    if (form.width) formData.append("width", form.width);
    if (form.height) formData.append("height", form.height);
    if (form.supplier_id) formData.append("supplier_id", form.supplier_id);
    formData.append("is_active", form.is_active ? "1" : "0");
    formData.append("is_featured", form.is_featured ? "1" : "0");
    formData.append("is_on_sale", form.is_on_sale ? "1" : "0");
    if (imageFile) formData.append("image", imageFile);
    return formData;
  };

  const onSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!validateAllFields()) {
      const firstError = Object.values(errors).find((error) => error);
      if (firstError) toast.error(firstError);
      return;
    }
    setIsSubmitting(true);
    try {
      const formData = prepareFormData();
      const response = await apiPost("addproducts", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (response.success || response.data) {
        toast.success("Product created successfully!", { id: "create-product" });
        setForm({
          name: "", sku: "", description: "", category_id: "", products_measurements: "",
          price: "", cost_price: "", sale_price: "", stock_quantity: "", low_stock_threshold: "",
          discount_percentage: "", discount_start_date: "", discount_end_date: "", manufactured_at: "",
          expires_at: "", weight: "", length: "", width: "", height: "", supplier_id: "",
          is_active: true, is_featured: false, is_on_sale: false, image: null,
        });
        setErrors({});
        setImageFile(null);
        setImagePreview(null);
        setTimeout(() => router.push("/products"), 1500);
      } else {
        toast.error("Failed to create product. Invalid response.");
      }
    } catch (err: unknown) {
      const error = err as ApiError;
      const status = error.response?.status;
      if (status === 422) {
        const errs = error.response?.data?.errors;
        if (errs) {
          const formErrors: FormErrors = {};
          Object.keys(errs).forEach((key) => {
            formErrors[key] = (Array.isArray(errs[key]) ? errs[key][0] : errs[key]) as string;
          });
          setErrors(formErrors);
          const firstKey = Object.keys(errs)[0];
          if (firstKey) toast.error(`${firstKey}: ${Array.isArray(errs[firstKey]) ? errs[firstKey][0] : errs[firstKey]}`);
        } else {
          toast.error("Validation failed. Please check the form.");
        }
      } else if (status === 500) {
        toast.error(`Server error: ${error.response?.data?.message || "Internal server error"}`);
      } else {
        toast.error(error.response?.data?.message || "Failed to create product. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid: boolean =
    form.name.trim().length > 0 &&
    form.sku.trim().length > 0 &&
    form.category_id !== "" && form.category_id !== 0 &&
    form.products_measurements !== "" &&
    form.price !== "" && form.stock_quantity !== "" &&
    !errors.name && !errors.sku && !errors.category_id &&
    !errors.products_measurements && !errors.price && !errors.stock_quantity;

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
              href="/products"
              className="text-xs text-gray-400 hover:text-gray-700 transition-colors font-medium"
            >
              Products
            </Link>
            <ChevronRight className="h-3 w-3 text-gray-300" />
            <span className="text-xs text-gray-700 font-semibold">Add New</span>
          </div>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <Layers className="h-3.5 w-3.5" />
            Manage Products
          </Link>
        </div>
      </div>

      {/* Page Header */}
      <div className="max-w-5xl mx-auto px-6 pt-8 pb-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="bg-gray-900 p-2.5 rounded-xl">
                <Package className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900 tracking-tight">Add New Product</h1>
            </div>
            <p className="text-sm text-gray-400 ml-[52px]">
              Fill in the details below to add a product to your inventory
            </p>
          </div>

          {/* Progress indicator */}
          <div className="hidden md:flex items-center gap-1.5 bg-white border border-gray-100 rounded-xl px-4 py-2.5 shadow-sm">
            {["Basic", "Pricing", "Inventory", "Details"].map((step, i) => (
              <React.Fragment key={step}>
                {i > 0 && <div className="w-6 h-px bg-gray-200" />}
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded-full bg-gray-900 flex items-center justify-center">
                    <span className="text-[9px] font-bold text-white">{i + 1}</span>
                  </div>
                  <span className="text-[11px] font-medium text-gray-500">{step}</span>
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-5xl mx-auto px-6 pb-12">
        <form onSubmit={onSubmit} className="space-y-4">
          {isLoadingData ? (
            <div className="bg-white border border-gray-100 rounded-2xl flex items-center justify-center py-24 shadow-sm">
              <div className="text-center">
                <div className="relative w-12 h-12 mx-auto mb-4">
                  <div className="w-12 h-12 rounded-full border-2 border-gray-100" />
                  <div className="absolute inset-0 w-12 h-12 rounded-full border-2 border-gray-900 border-t-transparent animate-spin" />
                </div>
                <p className="text-sm font-semibold text-gray-700">Loading form data</p>
                <p className="text-xs text-gray-400 mt-1">This will only take a moment</p>
              </div>
            </div>
          ) : (
            <>
              {/* SECTION 1: BASIC INFORMATION */}
              <SectionCard
                icon={Package}
                title="Basic Information"
                subtitle="Core product identity and classification"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <Field label="Product Name" required error={errors.name}>
                    <input
                      type="text"
                      maxLength={200}
                      value={form.name}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                      onBlur={() => handleBlur("name")}
                      required
                      className={errors.name ? errorInputClass : inputClass}
                      placeholder="e.g. Wireless Keyboard Pro"
                    />
                  </Field>

                  <Field label="SKU" required error={errors.sku}>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        maxLength={50}
                        value={form.sku}
                        onChange={(e) => handleInputChange("sku", e.target.value)}
                        onBlur={() => handleBlur("sku")}
                        required
                        className={errors.sku ? errorInputClass : inputClass}
                        placeholder="e.g. PROD123456"
                      />
                      <button
                        type="button"
                        onClick={handleGenerateSKU}
                        className="flex-shrink-0 px-4 py-2.5 bg-gray-900 text-white text-xs font-semibold rounded-xl hover:bg-gray-800 transition-colors flex items-center gap-1.5 whitespace-nowrap"
                      >
                        <Sparkles size={12} />
                        Generate
                      </button>
                    </div>
                  </Field>

                  <Field label="Category" required error={errors.category_id}>
                    <select
                      value={form.category_id}
                      onChange={(e) => handleInputChange("category_id", e.target.value)}
                      onBlur={() => handleBlur("category_id")}
                      required
                      className={errors.category_id ? errorInputClass : inputClass}
                    >
                      <option value="">Select a category</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>{category.name}</option>
                      ))}
                    </select>
                  </Field>

                  <Field label="Unit of Measure" required error={errors.products_measurements}>
                    <select
                      value={form.products_measurements}
                      onChange={(e) => handleInputChange("products_measurements", e.target.value)}
                      onBlur={() => handleBlur("products_measurements")}
                      required
                      className={errors.products_measurements ? errorInputClass : inputClass}
                    >
                      <option value="">Select a unit</option>
                      {units.map((unit) => (
                        <option key={unit.id} value={unit.name}>{unit.name} ({unit.symbol})</option>
                      ))}
                    </select>
                  </Field>

                  <div className="md:col-span-2">
                    <Field label="Description" optional>
                      <textarea
                        rows={3}
                        maxLength={500}
                        value={form.description}
                        onChange={(e) => handleInputChange("description", e.target.value)}
                        className={`${inputClass} resize-none`}
                        placeholder="Describe the product — features, materials, use cases..."
                      />
                      <div className="flex justify-end mt-1.5">
                        <span className="text-[11px] text-gray-300 font-medium tabular-nums">
                          {form.description.length} / 500
                        </span>
                      </div>
                    </Field>
                  </div>
                </div>
              </SectionCard>

              {/* SECTION 2: IMAGE UPLOAD */}
              <SectionCard
                icon={ImageIcon}
                title="Product Image"
                subtitle="Upload a high-quality product photo"
                accentColor="bg-gray-700"
              >
                {!imagePreview ? (
                  <label
                    htmlFor="product-image-upload"
                    className="flex flex-col items-center justify-center w-full h-44 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-gray-400 hover:bg-gray-50 transition-all group"
                  >
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/avif"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="product-image-upload"
                    />
                    <div className="flex flex-col items-center gap-3">
                      <div className="p-3 bg-gray-100 rounded-xl group-hover:bg-gray-200 transition-colors">
                        <ImageIcon className="h-6 w-6 text-gray-400" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-semibold text-gray-600">Click to upload image</p>
                        <p className="text-xs text-gray-400 mt-1">PNG, JPG, WEBP, AVIF — max 2MB</p>
                      </div>
                    </div>
                  </label>
                ) : (
                  <div className="flex items-center gap-5 p-4 bg-gray-50 rounded-xl border border-gray-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imagePreview}
                      alt="Product preview"
                      className="w-20 h-20 rounded-xl object-cover border border-gray-200 shadow-sm flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{imageFile?.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {(imageFile?.size || 0) / 1024 < 1024
                          ? `${((imageFile?.size || 0) / 1024).toFixed(1)} KB`
                          : `${((imageFile?.size || 0) / (1024 * 1024)).toFixed(1)} MB`}
                      </p>
                      <div className="flex items-center gap-1.5 mt-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                        <span className="text-[11px] text-green-600 font-medium">Ready to upload</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setImageFile(null);
                        setImagePreview(null);
                        setForm((prev) => ({ ...prev, image: null }));
                      }}
                      className="flex-shrink-0 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <XCircle size={18} />
                    </button>
                  </div>
                )}
              </SectionCard>

              {/* SECTION 3: PRICING */}
              <SectionCard
                icon={Tag}
                title="Pricing"
                subtitle="Set your selling price, cost, and discount rules"
                accentColor="bg-gray-800"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <Field label="Selling Price" required error={errors.price}>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">$</span>
                      <input
                        type="number" step="0.01" min="0"
                        value={form.price}
                        onChange={(e) => handleInputChange("price", e.target.value)}
                        onBlur={() => handleBlur("price")}
                        className={`${errors.price ? errorInputClass : inputClass} pl-7`}
                        placeholder="0.00" required
                      />
                    </div>
                  </Field>

                  <Field label="Cost Price" optional error={errors.cost_price}>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">$</span>
                      <input
                        type="number" step="0.01" min="0"
                        value={form.cost_price}
                        onChange={(e) => handleInputChange("cost_price", e.target.value)}
                        onBlur={() => handleBlur("cost_price")}
                        className={`${errors.cost_price ? errorInputClass : inputClass} pl-7`}
                        placeholder="0.00"
                      />
                    </div>
                  </Field>

                  <Field label="Sale Price" hint="Auto-calculated from discount">
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">$</span>
                      <input
                        type="number" step="0.01" min="0"
                        value={form.sale_price}
                        onChange={(e) => handleInputChange("sale_price", e.target.value)}
                        className={`${inputClass} pl-7 ${form.discount_percentage ? "bg-gray-50 text-gray-500" : ""}`}
                        placeholder="0.00"
                        readOnly={!!form.discount_percentage}
                      />
                    </div>
                  </Field>
                </div>

                {/* Discount Block */}
                <div className="mt-5 p-5 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="flex items-center gap-2 mb-4">
                    <Tag className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-semibold text-gray-700">Discount Settings</span>
                    <span className="ml-auto text-[10px] text-gray-400 bg-white px-2 py-0.5 rounded-full border border-gray-200 font-medium">Optional</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Field label="Discount %" error={errors.discount_percentage}>
                      <div className="relative">
                        <input
                          type="number" step="0.01" min="0" max="100"
                          value={form.discount_percentage}
                          onChange={(e) => handleInputChange("discount_percentage", e.target.value)}
                          onBlur={() => { handleBlur("discount_percentage"); calculateSalePrice(); }}
                          className={`${errors.discount_percentage ? errorInputClass : inputClass} pr-8`}
                          placeholder="0"
                        />
                        <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">%</span>
                      </div>
                    </Field>

                    <Field label="Start Date">
                      <input
                        type="date" value={form.discount_start_date}
                        onChange={(e) => handleInputChange("discount_start_date", e.target.value)}
                        className={inputClass}
                      />
                    </Field>

                    <Field label="End Date">
                      <input
                        type="date" value={form.discount_end_date}
                        onChange={(e) => handleInputChange("discount_end_date", e.target.value)}
                        className={inputClass}
                      />
                    </Field>
                  </div>
                </div>
              </SectionCard>

              {/* SECTION 4: INVENTORY */}
              <SectionCard
                icon={BarChart3}
                title="Inventory"
                subtitle="Track stock levels and set alert thresholds"
                accentColor="bg-gray-800"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <Field label="Stock Quantity" required error={errors.stock_quantity}>
                    <input
                      type="number" step="1" min="0"
                      value={form.stock_quantity}
                      onChange={(e) => handleInputChange("stock_quantity", e.target.value)}
                      onBlur={() => handleBlur("stock_quantity")}
                      className={errors.stock_quantity ? errorInputClass : inputClass}
                      placeholder="0" required
                    />
                  </Field>

                  <Field
                    label="Low Stock Alert"
                    optional
                    error={errors.low_stock_threshold}
                    hint="You'll be alerted when stock drops below this number"
                  >
                    <input
                      type="number" step="1" min="0"
                      value={form.low_stock_threshold}
                      onChange={(e) => handleInputChange("low_stock_threshold", e.target.value)}
                      onBlur={() => handleBlur("low_stock_threshold")}
                      className={errors.low_stock_threshold ? errorInputClass : inputClass}
                      placeholder="5"
                    />
                  </Field>
                </div>
              </SectionCard>

              {/* SECTION 5: PRODUCT DETAILS */}
              <SectionCard
                icon={Layers}
                title="Product Details"
                subtitle="Physical dimensions and product lifecycle dates"
                accentColor="bg-gray-700"
              >
                <div className="space-y-5">
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Dimensions</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {([
                        { label: "Weight", field: "weight", unit: "kg" },
                        { label: "Length", field: "length", unit: "cm" },
                        { label: "Width", field: "width", unit: "cm" },
                        { label: "Height", field: "height", unit: "cm" },
                      ] as const).map(({ label, field, unit }) => (
                        <Field key={field} label={`${label} (${unit})`} optional>
                          <input
                            type="number" step="0.01" min="0"
                            value={form[field] as string}
                            onChange={(e) => handleInputChange(field, e.target.value)}
                            className={inputClass}
                            placeholder="0.00"
                          />
                        </Field>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-100">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Lifecycle Dates</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Field label="Manufacture Date" optional>
                        <input
                          type="date" value={form.manufactured_at}
                          onChange={(e) => handleInputChange("manufactured_at", e.target.value)}
                          className={inputClass}
                        />
                      </Field>
                      <Field label="Expiry Date" optional>
                        <input
                          type="date" value={form.expires_at}
                          onChange={(e) => handleInputChange("expires_at", e.target.value)}
                          className={inputClass}
                        />
                      </Field>
                    </div>
                  </div>
                </div>
              </SectionCard>

              {/* SECTION 6: SUPPLIER & STATUS */}
              <SectionCard
                icon={Truck}
                title="Supplier & Visibility"
                subtitle="Assign a supplier and control product status"
                accentColor="bg-gray-900"
              >
                <div className="space-y-5">
                  <Field label="Supplier" optional>
                    <select
                      value={form.supplier_id}
                      onChange={(e) => handleInputChange("supplier_id", e.target.value)}
                      className={inputClass}
                    >
                      <option value="">No supplier assigned</option>
                      {suppliers.map((supplier) => (
                        <option key={supplier.vid} value={supplier.vid}>
                          {supplier.vendor_name}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Product Status</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <Toggle
                        checked={form.is_active}
                        onChange={(val) => handleInputChange("is_active", val)}
                        activeColor="bg-gray-900"
                        label="Active"
                        description="Product is live and visible"
                      />
                      <Toggle
                        checked={form.is_featured}
                        onChange={(val) => handleInputChange("is_featured", val)}
                        activeColor="bg-amber-500"
                        label="Featured"
                        description="Highlighted in storefront"
                      />
                      <Toggle
                        checked={form.is_on_sale}
                        onChange={(val) => handleInputChange("is_on_sale", val)}
                        activeColor="bg-red-500"
                        label="On Sale"
                        description="Shows discount badge"
                      />
                    </div>
                  </div>
                </div>
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
                    href="/products"
                    className="px-5 py-2.5 text-sm font-semibold text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </Link>
                  <button
                    type="submit"
                    disabled={!isFormValid || isSubmitting}
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
                        Create Product
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

export default withAuth(AddProductPage);