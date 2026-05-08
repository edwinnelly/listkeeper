"use client";

import { useRouter, useParams } from "next/navigation";
import React, { useState, useEffect, useCallback } from "react";
import { toast } from "react-hot-toast";
import Image from "next/image";
import { apiGet, apiPost } from "@/lib/axios";
import {
  Tag,
  Image as ImageIcon,
  ArrowLeft,
  Loader2,
  XCircle,
  Save,
  Edit,
  AlertCircle,
  ChevronRight,
  Package,
  BarChart3,
  Layers,
  Truck,
  Sparkles,
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
  [key: string]: string | undefined;
}

interface Category { id: number; name: string; }
interface Supplier { id: string; vid: number; vendor_name: string; contact_person?: string; email?: string; phone?: string; is_active?: boolean; }
interface Product {
  id: number; name: string; sku: string; description: string | null; category_id: number;
  products_measurements: string | null; price: number; cost_price: number | null;
  sale_price: number | null; stock_quantity: number; low_stock_threshold: number | null;
  discount_percentage: number | null; discount_start_date: string | null;
  discount_end_date: string | null; manufactured_at: string | null; expires_at: string | null;
  weight: number | null; length: number | null; width: number | null; height: number | null;
  supplier_id: number | null; is_active: boolean; is_featured: boolean; is_on_sale: boolean; image: string | null;
}
interface VendorResponse { id: number; vid: number; vendor_name?: string; name?: string; contact_person?: string; email?: string; phone?: string; is_active?: boolean; }

// ============================================================================
// CONSTANTS
// ============================================================================

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const staticUnits = [
  { id: 1, name: "Piece", symbol: "pc" }, { id: 2, name: "Kilogram", symbol: "kg" },
  { id: 3, name: "Gram", symbol: "g" }, { id: 4, name: "Liter", symbol: "L" },
  { id: 5, name: "Milliliter", symbol: "mL" }, { id: 6, name: "Meter", symbol: "m" },
  { id: 7, name: "Centimeter", symbol: "cm" }, { id: 8, name: "Dozen", symbol: "dz" },
  { id: 9, name: "Pack", symbol: "pk" }, { id: 10, name: "Box", symbol: "bx" },
  { id: 11, name: "Bottle", symbol: "btl" }, { id: 12, name: "Carton", symbol: "ctn" },
  { id: 13, name: "Pair", symbol: "pr" }, { id: 14, name: "Set", symbol: "set" },
  { id: 15, name: "Roll", symbol: "roll" },
];

// ============================================================================
// REUSABLE UI COMPONENTS
// ============================================================================

const SectionCard = ({
  icon: Icon, title, subtitle, children, accentColor = "bg-gray-900",
}: {
  icon: React.ElementType; title: string; subtitle: string;
  children: React.ReactNode; accentColor?: string;
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

const Field = ({
  label, required, optional, error, hint, children,
}: {
  label: string; required?: boolean; optional?: boolean;
  error?: string; hint?: string; children: React.ReactNode;
}) => (
  <div className="space-y-1.5">
    <div className="flex items-center justify-between">
      <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
        {label}{required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {optional && (
        <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full font-medium">Optional</span>
      )}
    </div>
    {children}
    {error && (
      <div className="flex items-center gap-1.5 text-red-500 text-xs">
        <XCircle size={11} /><span>{error}</span>
      </div>
    )}
    {hint && !error && <p className="text-[11px] text-gray-400">{hint}</p>}
  </div>
);

const Toggle = ({
  checked, onChange, activeColor, label, description,
}: {
  checked: boolean; onChange: (val: boolean) => void;
  activeColor: string; label: string; description: string;
}) => (
  <label className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100 cursor-pointer hover:border-gray-200 transition-colors">
    <div>
      <p className="text-sm font-semibold text-gray-800">{label}</p>
      <p className="text-xs text-gray-400 mt-0.5">{description}</p>
    </div>
    <div className="relative ml-4 flex-shrink-0">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="sr-only" />
      <div className={`w-11 h-6 flex items-center rounded-full px-0.5 transition-all duration-200 ${checked ? activeColor : "bg-gray-200"}`}>
        <div className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform duration-200 ${checked ? "translate-x-5" : "translate-x-0"}`} />
      </div>
    </div>
  </label>
);

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const EditProductPage = () => {
  const params = useParams();
  const productId = params.id as string;
  const router = useRouter();

  const [form, setForm] = useState<ProductFormData>({
    name: "", sku: "", description: "", category_id: "", products_measurements: "",
    price: "", cost_price: "", sale_price: "", stock_quantity: "", low_stock_threshold: "",
    discount_percentage: "", discount_start_date: "", discount_end_date: "", manufactured_at: "",
    expires_at: "", weight: "", length: "", width: "", height: "", supplier_id: "",
    is_active: true, is_featured: false, is_on_sale: false, image: null,
  });

  const [errors, setErrors] = useState<FormErrors>({});
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

  const inputClass = "w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 outline-none transition-all duration-150 placeholder-gray-300 text-sm text-gray-800 font-medium";
  const errorInputClass = "w-full px-3.5 py-2.5 bg-white border border-red-300 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-400 outline-none transition-all duration-150 placeholder-gray-300 text-sm text-gray-800 font-medium";

  // ==========================================================================
  // HELPERS
  // ==========================================================================
  const getFullImageUrl = useCallback((imagePath: string | null): string | null => {
    if (!imagePath) return null;
    if (imagePath.startsWith("http")) return imagePath;
    return `${API_BASE_URL}/storage/${imagePath}`;
  }, []);

  // ==========================================================================
  // DATA FETCHING
  // ==========================================================================
  const fetchCategories = useCallback(async () => {
    try {
      const res = await apiGet("/product-categories");
      const arr = res.data?.data?.product_categories ?? res.data?.data ?? [];
      setCategories(Array.isArray(arr) ? arr : []);
    } catch { setCategories([]); }
  }, []);

  const fetchSuppliers = useCallback(async () => {
    try {
      const res = await apiGet("/vendors");
      const arr = res.data?.data?.vendors ?? res.data?.data ?? [];
      setSuppliers(
        Array.isArray(arr)
          ? arr.map((v: VendorResponse) => ({
              id: v.id.toString(), vid: v.vid,
              vendor_name: v.vendor_name || v.name || "",
              contact_person: v.contact_person, email: v.email,
              phone: v.phone, is_active: v.is_active,
            }))
          : []
      );
    } catch { setSuppliers([]); }
  }, []);

  const fetchProduct = useCallback(async () => {
    try {
      const res = await apiGet(`/products_view/${productId}`);
      const data = res.data?.data || res.data;
      if (data) {
        setProduct(data);
        const fmtDate = (d: string | null) => {
          if (!d) return "";
          const dt = new Date(d);
          return isNaN(dt.getTime()) ? "" : dt.toISOString().split("T")[0];
        };
        const fmtInt = (v: number | null) => (v === null || v === undefined ? "" : Math.floor(v).toString());
        const imageUrl = getFullImageUrl(data.image);
        setForm({
          name: data.name || "", sku: data.sku || "", description: data.description || "",
          category_id: data.category_id?.toString() || "",
          products_measurements: data.products_measurements || "",
          price: data.price?.toString() || "", cost_price: data.cost_price?.toString() || "",
          sale_price: data.sale_price?.toString() || "",
          stock_quantity: fmtInt(data.stock_quantity), low_stock_threshold: fmtInt(data.low_stock_threshold),
          discount_percentage: data.discount_percentage?.toString() || "",
          discount_start_date: fmtDate(data.discount_start_date), discount_end_date: fmtDate(data.discount_end_date),
          manufactured_at: fmtDate(data.manufactured_at), expires_at: fmtDate(data.expires_at),
          weight: data.weight?.toString() || "", length: data.length?.toString() || "",
          width: data.width?.toString() || "", height: data.height?.toString() || "",
          supplier_id: data.supplier_id?.toString() || "",
          is_active: data.is_active ?? false, is_featured: data.is_featured ?? false,
          is_on_sale: data.is_on_sale ?? false, image: imageUrl,
        });
        if (imageUrl) { setOriginalImageUrl(imageUrl); setImagePreview(imageUrl); }
      } else { toast.error("Product not found"); }
    } catch { toast.error("Failed to load product"); }
  }, [productId, getFullImageUrl]);

  const fetchAllData = useCallback(async () => {
    setIsLoadingData(true); setIsLoadingProduct(true);
    try { await Promise.all([fetchCategories(), fetchSuppliers(), fetchProduct()]); }
    catch { toast.error("Failed to load required data"); }
    finally { setIsLoadingData(false); setIsLoadingProduct(false); }
  }, [fetchCategories, fetchSuppliers, fetchProduct]);

  useEffect(() => { fetchAllData(); }, [fetchAllData]);
  useEffect(() => {
    return () => { if (imagePreview && imagePreview !== originalImageUrl) URL.revokeObjectURL(imagePreview); };
  }, [imagePreview, originalImageUrl]);

  useEffect(() => {
    if (product) {
      setHasChanges(
        form.name !== product.name || form.sku !== product.sku ||
        form.description !== (product.description || "") ||
        form.category_id !== product.category_id?.toString() ||
        form.price !== product.price?.toString() ||
        form.cost_price !== (product.cost_price?.toString() || "") ||
        form.sale_price !== (product.sale_price?.toString() || "") ||
        form.stock_quantity !== Math.floor(product.stock_quantity).toString() ||
        form.low_stock_threshold !== (product.low_stock_threshold ? Math.floor(product.low_stock_threshold).toString() : "") ||
        form.discount_percentage !== (product.discount_percentage?.toString() || "") ||
        form.is_active !== product.is_active || form.is_featured !== product.is_featured ||
        form.is_on_sale !== product.is_on_sale || imageFile !== null
      );
    }
  }, [form, product, imageFile]);

  // ==========================================================================
  // CALCULATIONS
  // ==========================================================================
  const calculateSalePrice = useCallback((price: string, disc: string) => {
    if (price && disc) {
      const p = parseFloat(price), d = parseFloat(disc);
      if (!isNaN(p) && !isNaN(d) && d > 0 && d <= 100)
        return { sale_price: (p - (p * d) / 100).toFixed(2), is_on_sale: true };
    }
    return { sale_price: "", is_on_sale: false };
  }, []);

  const generateSKU = useCallback((): string => `PROD${Math.floor(100000 + Math.random() * 900000)}`, []);

  // ==========================================================================
  // IMAGE
  // ==========================================================================
  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp", "image/avif"].includes(file.type)) {
      toast.error("Please upload a JPEG, PNG, AVIF, or WEBP image."); return;
    }
    if (file.size > 2 * 1024 * 1024) { toast.error("Image must be smaller than 2MB."); return; }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }, []);

  const removeImage = useCallback(() => {
    if (imagePreview && imagePreview !== originalImageUrl) URL.revokeObjectURL(imagePreview);
    setImageFile(null); setImagePreview(originalImageUrl);
  }, [imagePreview, originalImageUrl]);

  // ==========================================================================
  // VALIDATION
  // ==========================================================================
  const validateField = useCallback((field: string, value: string | boolean | number): string | undefined => {
    const str = value?.toString().trim() || "";
    switch (field) {
      case "name": return !str ? "Product name is required" : str.length < 2 ? "Must be at least 2 characters" : undefined;
      case "sku": return !str ? "SKU is required" : str.length < 3 ? "Must be at least 3 characters" : undefined;
      case "category_id": return (!value || value === "" || value === 0 || value === "0") ? "Category is required" : undefined;
      case "price":
        return !str ? "Price is required" : isNaN(parseFloat(str)) ? "Must be a valid number" : parseFloat(str) < 0 ? "Cannot be negative" : undefined;
      case "stock_quantity":
        return (!str && str !== "0") ? "Stock quantity is required" : isNaN(parseInt(str, 10)) ? "Must be a valid number" : parseInt(str, 10) < 0 ? "Cannot be negative" : str.includes(".") ? "Must be a whole number" : undefined;
      case "low_stock_threshold":
        return str ? (isNaN(parseInt(str, 10)) ? "Must be a valid number" : parseInt(str, 10) < 0 ? "Cannot be negative" : str.includes(".") ? "Must be a whole number" : undefined) : undefined;
      case "discount_percentage":
        return str ? (isNaN(parseFloat(str)) ? "Must be a valid number" : (parseFloat(str) < 0 || parseFloat(str) > 100) ? "Must be between 0 and 100" : undefined) : undefined;
      case "cost_price":
        return str ? (isNaN(parseFloat(str)) ? "Must be a valid number" : parseFloat(str) < 0 ? "Cannot be negative" : undefined) : undefined;
      default: return undefined;
    }
  }, []);

  const validateAllFields = useCallback((): boolean => {
    const newErrors: FormErrors = {};
    let isValid = true;
    (Object.keys(form) as Array<keyof ProductFormData>).forEach((field) => {
      if (["description", "image", "products_measurements"].includes(field)) return;
      const v = form[field];
      const val: string | boolean | number = typeof v === "string" ? v : typeof v === "boolean" ? v : typeof v === "number" ? v : "";
      const error = validateField(field, val);
      if (error) { newErrors[field] = error; isValid = false; }
    });
    setErrors(newErrors); return isValid;
  }, [form, validateField]);

  // ==========================================================================
  // FORM HANDLERS
  // ==========================================================================
  const handleInputChange = useCallback((field: keyof ProductFormData, value: string | boolean) => {
    let processed = value;
    if ((field === "stock_quantity" || field === "low_stock_threshold") && typeof value === "string")
      processed = value.replace(/[^\d]/g, "");
    setForm((prev) => {
      const updated = { ...prev, [field]: processed };
      if (field === "discount_percentage" || field === "price") {
        const price = field === "price" ? (processed as string) : prev.price;
        const disc = field === "discount_percentage" ? (processed as string) : prev.discount_percentage;
        const { sale_price, is_on_sale } = calculateSalePrice(price, disc);
        return { ...updated, sale_price, is_on_sale };
      }
      return updated;
    });
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  }, [errors, calculateSalePrice]);

  const handleBlur = useCallback((field: string) => {
    const v = form[field as keyof ProductFormData];
    const val: string | boolean | number = typeof v === "string" ? v : typeof v === "boolean" ? v : typeof v === "number" ? v : "";
    setErrors((prev) => ({ ...prev, [field]: validateField(field, val) }));
  }, [form, validateField]);

  const handleGenerateSKU = useCallback(() => setForm((prev) => ({ ...prev, sku: generateSKU() })), [generateSKU]);

  // ==========================================================================
  // SUBMIT
  // ==========================================================================
  const prepareFormData = useCallback((): FormData => {
    const fd = new FormData();
    fd.append("_method", "PUT");
    fd.append("name", form.name.trim()); fd.append("sku", form.sku.trim());
    if (form.description.trim()) fd.append("description", form.description.trim());
    if (form.category_id) fd.append("category_id", form.category_id.toString());
    if (form.products_measurements) fd.append("products_measurements", form.products_measurements);
    fd.append("price", form.price || "0");
    if (form.cost_price) fd.append("cost_price", form.cost_price);
    if (form.sale_price) fd.append("sale_price", form.sale_price);
    fd.append("stock_quantity", form.stock_quantity ? parseInt(form.stock_quantity, 10).toString() : "0");
    if (form.low_stock_threshold) fd.append("low_stock_threshold", parseInt(form.low_stock_threshold, 10).toString());
    if (form.discount_percentage) fd.append("discount_percentage", form.discount_percentage);
    if (form.discount_start_date) fd.append("discount_start_date", form.discount_start_date);
    if (form.discount_end_date) fd.append("discount_end_date", form.discount_end_date);
    if (form.manufactured_at) fd.append("manufactured_at", form.manufactured_at);
    if (form.expires_at) fd.append("expires_at", form.expires_at);
    if (form.weight) fd.append("weight", form.weight);
    if (form.length) fd.append("length", form.length);
    if (form.width) fd.append("width", form.width);
    if (form.height) fd.append("height", form.height);
    if (form.supplier_id) fd.append("supplier_id", form.supplier_id);
    fd.append("is_active", form.is_active ? "1" : "0");
    fd.append("is_featured", form.is_featured ? "1" : "0");
    fd.append("is_on_sale", form.is_on_sale ? "1" : "0");
    if (imageFile) fd.append("image", imageFile);
    return fd;
  }, [form, imageFile]);

  const onSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!validateAllFields()) {
      const firstError = Object.values(errors).find((e) => e);
      if (firstError) toast.error(firstError);
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await apiPost(`products/${productId}`, prepareFormData(), {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (response.data) {
        toast.success("Product updated successfully!", { id: "update-product" });
        setTimeout(() => router.push("/products"), 1500);
      } else { toast.error("Failed to update product. Invalid response."); }
    } catch (err) {
      const error = err as { response?: { status?: number; data?: { errors?: Record<string, string[]>; message?: string; error?: string } } };
      const status = error.response?.status;
      if (status === 422) {
        const errs = error.response?.data?.errors;
        if (errs) {
          const fe: FormErrors = {};
          Object.keys(errs).forEach((k) => { fe[k] = (Array.isArray(errs[k]) ? errs[k][0] : errs[k]) as string; });
          setErrors(fe);
          const fk = Object.keys(errs)[0];
          if (fk) toast.error(`${fk}: ${Array.isArray(errs[fk]) ? errs[fk][0] : errs[fk]}`);
        } else toast.error("Validation failed. Please check the form.");
      } else if (status === 404) { toast.error("Product not found"); router.push("/products"); }
      else if (status === 500) toast.error(`Server error: ${error.response?.data?.message || "Internal server error"}`);
      else toast.error(error.response?.data?.message || "Failed to update product. Please try again.");
    } finally { setIsSubmitting(false); }
  }, [isSubmitting, validateAllFields, errors, prepareFormData, productId, router]);

  const isFormValid = useCallback(() =>
    form.name.trim().length > 0 && form.sku.trim().length > 0 &&
    form.category_id !== "" && form.category_id !== 0 &&
    form.price !== "" && form.stock_quantity !== "" &&
    !errors.name && !errors.sku && !errors.category_id && !errors.price && !errors.stock_quantity,
  [form, errors]);

  // ==========================================================================
  // LOADING STATE
  // ==========================================================================
  if (isLoadingProduct) {
    return (
      <div className="min-h-screen bg-[#f8f8f7] flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-12 h-12 mx-auto mb-4">
            <div className="w-12 h-12 rounded-full border-2 border-gray-100" />
            <div className="absolute inset-0 rounded-full border-2 border-gray-900 border-t-transparent animate-spin" />
          </div>
          <p className="text-sm font-semibold text-gray-700">Loading product</p>
          <p className="text-xs text-gray-400 mt-1">Please wait a moment</p>
        </div>
      </div>
    );
  }

  // ==========================================================================
  // RENDER
  // ==========================================================================
  return (
    <div className="min-h-screen bg-[#f8f8f7]">
      {/* Top Bar */}
      <div className="bg-white border-b border-gray-100 top-0 z-10 mt-[-13px] w-full">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push("/products")}
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-700 transition-colors font-medium">
              <ArrowLeft className="h-3.5 w-3.5" /> Products
            </button>
            <ChevronRight className="h-3 w-3 text-gray-300" />
            <span className="text-xs text-gray-700 font-semibold truncate max-w-[200px]">
              {form.name || "Edit Product"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {hasChanges && (
              <div className="hidden sm:flex items-center gap-1.5 text-amber-600 text-xs bg-amber-50 border border-amber-100 px-3 py-1.5 rounded-lg font-medium">
                <AlertCircle className="h-3 w-3" /> Unsaved changes
              </div>
            )}
            <button onClick={() => router.push("/products")}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
              Cancel
            </button>
          </div>
        </div>
      </div>

      {/* Page Header */}
      <div className="max-w-5xl mx-auto px-6 pt-8 pb-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="bg-gray-900 p-2.5 rounded-xl">
                <Edit className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900 tracking-tight">Edit Product</h1>
            </div>
            <p className="text-sm text-gray-400 ml-[52px]">
              SKU: <span className="font-semibold text-gray-600 font-mono">{form.sku || "—"}</span>
            </p>
          </div>
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
                  <div className="absolute inset-0 rounded-full border-2 border-gray-900 border-t-transparent animate-spin" />
                </div>
                <p className="text-sm font-semibold text-gray-700">Loading form data</p>
                <p className="text-xs text-gray-400 mt-1">This will only take a moment</p>
              </div>
            </div>
          ) : (
            <>
              {/* SECTION 1: BASIC INFORMATION */}
              <SectionCard icon={Package} title="Basic Information" subtitle="Core product identity and classification">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <Field label="Product Name" required error={errors.name}>
                    <input type="text" maxLength={200} value={form.name}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                      onBlur={() => handleBlur("name")} required
                      className={errors.name ? errorInputClass : inputClass}
                      placeholder="e.g. Wireless Keyboard Pro" />
                  </Field>

                  <Field label="SKU" required error={errors.sku}>
                    <div className="flex gap-2">
                      <input type="text" maxLength={50} value={form.sku}
                        onChange={(e) => handleInputChange("sku", e.target.value)}
                        onBlur={() => handleBlur("sku")} required
                        className={errors.sku ? errorInputClass : inputClass}
                        placeholder="e.g. PROD123456" />
                      <button type="button" onClick={handleGenerateSKU}
                        className="flex-shrink-0 px-4 py-2.5 bg-gray-900 text-white text-xs font-semibold rounded-xl hover:bg-gray-800 transition-colors flex items-center gap-1.5 whitespace-nowrap">
                        <Sparkles size={12} /> New SKU
                      </button>
                    </div>
                  </Field>

                  <Field label="Category" required error={errors.category_id}>
                    <select value={form.category_id}
                      onChange={(e) => handleInputChange("category_id", e.target.value)}
                      onBlur={() => handleBlur("category_id")} required
                      className={errors.category_id ? errorInputClass : inputClass}>
                      <option value="">Select a category</option>
                      {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </Field>

                  <Field label="Unit of Measure" optional>
                    <select value={form.products_measurements}
                      onChange={(e) => handleInputChange("products_measurements", e.target.value)}
                      className={inputClass}>
                      <option value="">Select a unit</option>
                      {staticUnits.map((u) => <option key={u.id} value={u.name}>{u.name} ({u.symbol})</option>)}
                    </select>
                  </Field>

                  <div className="md:col-span-2">
                    <Field label="Description" optional>
                      <textarea rows={3} maxLength={500} value={form.description}
                        onChange={(e) => handleInputChange("description", e.target.value)}
                        className={`${inputClass} resize-none`}
                        placeholder="Describe the product — features, materials, use cases..." />
                      <div className="flex justify-end mt-1.5">
                        <span className="text-[11px] text-gray-300 font-medium tabular-nums">
                          {form.description.length} / 500
                        </span>
                      </div>
                    </Field>
                  </div>
                </div>
              </SectionCard>

              {/* SECTION 2: IMAGE */}
              <SectionCard icon={ImageIcon} title="Product Image" subtitle="Upload a new image or keep the existing one" accentColor="bg-gray-700">
                {!imagePreview ? (
                  <label htmlFor="product-image-upload"
                    className="flex flex-col items-center justify-center w-full h-44 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-gray-400 hover:bg-gray-50 transition-all group">
                    <input type="file" accept="image/jpeg,image/png,image/webp,image/avif"
                      onChange={handleImageUpload} className="hidden" id="product-image-upload" />
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
                    <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-gray-200 shadow-sm flex-shrink-0 bg-white">
                      <Image src={imagePreview} alt="Product preview" fill className="object-cover" sizes="80px"
                        onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">
                        {imageFile ? imageFile.name : "Current product image"}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {imageFile ? `${(imageFile.size / 1024).toFixed(1)} KB` : "Existing image — upload a new one to replace"}
                      </p>
                      <div className="flex items-center gap-1.5 mt-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${imageFile ? "bg-green-500" : "bg-blue-400"}`} />
                        <span className={`text-[11px] font-medium ${imageFile ? "text-green-600" : "text-blue-500"}`}>
                          {imageFile ? "New image ready" : "Using existing image"}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 flex-shrink-0">
                      <label htmlFor="product-image-replace"
                        className="cursor-pointer flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 font-semibold px-3 py-1.5 bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
                        <ImageIcon size={12} /> Replace
                        <input type="file" accept="image/jpeg,image/png,image/webp,image/avif"
                          onChange={handleImageUpload} className="hidden" id="product-image-replace" />
                      </label>
                      {imageFile && (
                        <button type="button" onClick={removeImage}
                          className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-700 font-semibold px-3 py-1.5 bg-red-50 border border-red-100 rounded-lg hover:border-red-200 transition-colors">
                          <XCircle size={12} /> Remove
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </SectionCard>

              {/* SECTION 3: PRICING */}
              <SectionCard icon={Tag} title="Pricing" subtitle="Set your selling price, cost, and discount rules" accentColor="bg-gray-800">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <Field label="Cost Price" optional error={errors.cost_price}>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">$</span>
                      <input type="number" step="0.01" min="0" value={form.cost_price}
                        onChange={(e) => handleInputChange("cost_price", e.target.value)}
                        onBlur={() => handleBlur("cost_price")}
                        className={`${errors.cost_price ? errorInputClass : inputClass} pl-7`} placeholder="0.00" />
                    </div>
                  </Field>
                  <Field label="Selling Price" required error={errors.price}>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">$</span>
                      <input type="number" step="0.01" min="0" value={form.price}
                        onChange={(e) => handleInputChange("price", e.target.value)}
                        onBlur={() => handleBlur("price")} required
                        className={`${errors.price ? errorInputClass : inputClass} pl-7`} placeholder="0.00" />
                    </div>
                  </Field>
                  <Field label="Sale Price" hint="Auto-calculated from discount">
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">$</span>
                      <input type="number" step="0.01" min="0" value={form.sale_price} readOnly
                        className={`${inputClass} pl-7 bg-gray-50 text-gray-500`} placeholder="0.00" />
                    </div>
                  </Field>
                </div>

                <div className="mt-5 p-5 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="flex items-center gap-2 mb-4">
                    <Tag className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-semibold text-gray-700">Discount Settings</span>
                    <span className="ml-auto text-[10px] text-gray-400 bg-white px-2 py-0.5 rounded-full border border-gray-200 font-medium">Optional</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Field label="Discount %" error={errors.discount_percentage}>
                      <div className="relative">
                        <input type="number" step="0.01" min="0" max="100"
                          value={form.discount_percentage}
                          onChange={(e) => handleInputChange("discount_percentage", e.target.value)}
                          onBlur={() => handleBlur("discount_percentage")}
                          className={`${errors.discount_percentage ? errorInputClass : inputClass} pr-8`} placeholder="0" />
                        <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">%</span>
                      </div>
                    </Field>
                    <Field label="Start Date">
                      <input type="date" value={form.discount_start_date}
                        onChange={(e) => handleInputChange("discount_start_date", e.target.value)} className={inputClass} />
                    </Field>
                    <Field label="End Date">
                      <input type="date" value={form.discount_end_date}
                        onChange={(e) => handleInputChange("discount_end_date", e.target.value)} className={inputClass} />
                    </Field>
                  </div>
                </div>
              </SectionCard>

              {/* SECTION 4: INVENTORY */}
              <SectionCard icon={BarChart3} title="Inventory" subtitle="Track stock levels and set alert thresholds" accentColor="bg-gray-800">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <Field label="Stock Quantity" required error={errors.stock_quantity}>
                    <input type="number" step="1" min="0" value={form.stock_quantity}
                      onChange={(e) => handleInputChange("stock_quantity", e.target.value)}
                      onBlur={() => handleBlur("stock_quantity")}
                      className={errors.stock_quantity ? errorInputClass : inputClass}
                      placeholder="0" required pattern="[0-9]*" inputMode="numeric" />
                  </Field>
                  <Field label="Low Stock Alert" optional error={errors.low_stock_threshold}
                    hint="You'll be alerted when stock drops below this number">
                    <input type="number" step="1" min="0" value={form.low_stock_threshold}
                      onChange={(e) => handleInputChange("low_stock_threshold", e.target.value)}
                      onBlur={() => handleBlur("low_stock_threshold")}
                      className={errors.low_stock_threshold ? errorInputClass : inputClass}
                      placeholder="5" pattern="[0-9]*" inputMode="numeric" />
                  </Field>
                </div>
              </SectionCard>

              {/* SECTION 5: PRODUCT DETAILS */}
              <SectionCard icon={Layers} title="Product Details" subtitle="Physical dimensions and product lifecycle dates" accentColor="bg-gray-700">
                <div className="space-y-5">
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Dimensions</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {[
                        { label: "Weight (kg)", field: "weight" }, { label: "Length (cm)", field: "length" },
                        { label: "Width (cm)", field: "width" }, { label: "Height (cm)", field: "height" },
                      ].map(({ label, field }) => (
                        <Field key={field} label={label} optional>
                          <input type="number" step="0.01" min="0"
                            value={form[field as keyof ProductFormData] as string}
                            onChange={(e) => handleInputChange(field as keyof ProductFormData, e.target.value)}
                            className={inputClass} placeholder="0.00" />
                        </Field>
                      ))}
                    </div>
                  </div>
                  <div className="pt-4 border-t border-gray-100">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Lifecycle Dates</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Field label="Manufacture Date" optional>
                        <input type="date" value={form.manufactured_at}
                          onChange={(e) => handleInputChange("manufactured_at", e.target.value)} className={inputClass} />
                      </Field>
                      <Field label="Expiry Date" optional>
                        <input type="date" value={form.expires_at}
                          onChange={(e) => handleInputChange("expires_at", e.target.value)} className={inputClass} />
                      </Field>
                    </div>
                  </div>
                </div>
              </SectionCard>

              {/* SECTION 6: SUPPLIER & STATUS */}
              <SectionCard icon={Truck} title="Supplier & Visibility" subtitle="Assign a supplier and control product status" accentColor="bg-gray-900">
                <div className="space-y-5">
                  <Field label="Supplier" optional>
                    <select value={form.supplier_id}
                      onChange={(e) => handleInputChange("supplier_id", e.target.value)} className={inputClass}>
                      <option value="">No supplier assigned</option>
                      {suppliers.map((s) => <option key={s.vid} value={s.vid}>{s.vendor_name}</option>)}
                    </select>
                  </Field>
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Product Status</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <Toggle checked={form.is_active} onChange={(v) => handleInputChange("is_active", v)}
                        activeColor="bg-gray-900" label="Active" description="Product is live and visible" />
                      <Toggle checked={form.is_featured} onChange={(v) => handleInputChange("is_featured", v)}
                        activeColor="bg-amber-500" label="Featured" description="Highlighted in storefront" />
                      <Toggle checked={form.is_on_sale} onChange={(v) => handleInputChange("is_on_sale", v)}
                        activeColor="bg-red-500" label="On Sale" description="Shows discount badge" />
                    </div>
                  </div>
                </div>
              </SectionCard>

              {/* Submit Footer */}
              <div className="bg-white border border-gray-100 rounded-2xl px-6 py-4 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full transition-colors ${hasChanges ? "bg-amber-400" : isFormValid() ? "bg-green-500" : "bg-gray-300"}`} />
                  <span className="text-xs font-medium text-gray-500">
                    {hasChanges ? "You have unsaved changes" : isFormValid() ? "All required fields complete" : "Please fill in all required fields"}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <button type="button" onClick={() => router.push("/products")}
                    className="px-5 py-2.5 text-sm font-semibold text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors">
                    Cancel
                  </button>
                  <button type="submit"
                    disabled={!isFormValid() || isSubmitting || !hasChanges}
                    className="px-6 py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-800 active:bg-black transition-colors focus:outline-none focus:ring-2 focus:ring-gray-900/20 focus:ring-offset-2 disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center gap-2 shadow-sm">
                    {isSubmitting
                      ? <><Loader2 className="h-4 w-4 animate-spin" /> Updating...</>
                      : <><Save className="h-4 w-4" /> Save Changes</>}
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

export default withAuth(EditProductPage);