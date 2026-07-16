"use client";
import { useRouter } from "next/navigation";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { toast } from "react-hot-toast";
import { apiGet, apiPost } from "@/lib/axios";
import {
  Package,
  User,
  Building2,
  Calendar,
  Calculator,
  ArrowLeft,
  Plus,
  Loader2,
  XCircle,
  ChevronRight,
  Save,
  Send,
  Trash2,
  Search,
  FileText,
} from "lucide-react";
import { withAuth } from "@/hoc/withAuth";

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

interface Customer {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  customer_code: string;
}

interface Location {
  id: string;
  location_name: string;
  address: string | null;
  phone: string | null;
}

interface Product {
  id: string;
  name: string;
  sku: string;
  image: string | null;
  price?: number;
  unit_price?: number;
}

interface InvoiceItem {
  product_id: string;
  product_name: string;
  sku: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface InvoiceFormData {
  customer_id: string;
  location_id: string;
  invoice_date: string;
  due_date: string;
  notes: string;
  items: InvoiceItem[];
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  discount_type: "fixed" | "percentage";
  discount_value: number;
  discount_amount: number;
  total_amount: number;
}

interface FormErrors {
  customer_id?: string;
  location_id?: string;
  invoice_date?: string;
  due_date?: string;
  items?: string;
  [key: string]: string | undefined;
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

interface User {
  businesses_one?: Array<{
    currency?: string;
    business_name?: string;
    business_key?: string;
  }>;
}

// ============================================================================
// SECTION WRAPPER COMPONENT
// ============================================================================

const SectionCard: React.FC<{
  icon: React.ElementType;
  title: string;
  subtitle: string;
  children: React.ReactNode;
  accentColor?: string;
}> = ({ icon: Icon, title, subtitle, children, accentColor = "bg-gray-900" }) => (
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
        <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full font-medium">Optional</span>
      )}
    </div>
    {children}
    {error && (
      <div className="flex items-center gap-1.5 text-red-500 text-xs">
        <XCircle size={11} />
        <span>{error}</span>
      </div>
    )}
    {hint && !error && <p className="text-[11px] text-gray-400">{hint}</p>}
  </div>
);

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const NewInvoice = ({ user }: { user: User }) => {
  const router = useRouter();
  const currencySymbol = user?.businesses_one?.[0]?.currency || "$";
  const businessKey = user?.businesses_one?.[0]?.business_key || "";

  const [form, setForm] = useState<InvoiceFormData>({
    customer_id: "",
    location_id: "",
    invoice_date: new Date().toISOString().split("T")[0],
    due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    notes: "",
    items: [],
    subtotal: 0,
    tax_rate: 0,
    tax_amount: 0,
    discount_type: "fixed",
    discount_value: 0,
    discount_amount: 0,
    total_amount: 0,
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isLoadingData, setIsLoadingData] = useState<boolean>(true);
  const [showProductSearch, setShowProductSearch] = useState<boolean>(false);
  const [productSearch, setProductSearch] = useState<string>("");

  const inputClass =
    "w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 outline-none transition-all duration-150 placeholder-gray-300 text-sm text-gray-800 font-medium";
  const errorInputClass =
    "w-full px-3.5 py-2.5 bg-white border border-red-300 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-400 outline-none transition-all duration-150 placeholder-gray-300 text-sm text-gray-800 font-medium";
  const selectClass =
    "w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 outline-none transition-all duration-150 text-sm text-gray-800 font-medium";

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async (): Promise<void> => {
    setIsLoadingData(true);
    try {
      await Promise.all([fetchCustomers(), fetchLocations(), fetchProducts()]);
    } catch {
      toast.error("Failed to load required data");
    } finally {
      setIsLoadingData(false);
    }
  };

  const fetchCustomers = async (): Promise<void> => {
    try {
      const res = await apiGet("/customers");
      const customersArray = 
        res?.data?.data?.customers ?? 
        res?.data?.data?.data ?? 
        res?.data?.data ?? 
        res?.data?.customers ?? 
        res?.data ?? 
        [];
      setCustomers(Array.isArray(customersArray) ? customersArray : []);
    } catch (err) {
      console.error("Failed to fetch customers:", err);
      setCustomers([]);
    }
  };

  const fetchLocations = async (): Promise<void> => {
    try {
      const res = await apiGet("/locations");
      const locationsArray = 
        res?.data?.data?.locations ?? 
        res?.data?.data?.data ?? 
        res?.data?.data ?? 
        res?.data?.locations ?? 
        res?.data?.location ?? 
        res?.data ?? 
        [];
      setLocations(Array.isArray(locationsArray) ? locationsArray : []);
    } catch (err) {
      console.error("Failed to fetch locations:", err);
      setLocations([]);
    }
  };

  const fetchProducts = async (): Promise<void> => {
    try {
      const res = await apiGet("/products");
      const productsArray = 
        res?.data?.data?.products ?? 
        res?.data?.data?.data ?? 
        res?.data?.data ?? 
        res?.data?.products ?? 
        res?.data ?? 
        [];
      setProducts(Array.isArray(productsArray) ? productsArray : []);
    } catch (err) {
      console.error("Failed to fetch products:", err);
      setProducts([]);
    }
  };

  const calculateTotals = (items: InvoiceItem[] = form.items): void => {
    const subtotal = items.reduce((sum, item) => sum + item.total_price, 0);
    const taxAmount = (subtotal * form.tax_rate) / 100;
    
    let discountAmount = 0;
    if (form.discount_type === "fixed") {
      discountAmount = form.discount_value;
    } else {
      discountAmount = (subtotal * form.discount_value) / 100;
    }

    const totalAmount = subtotal + taxAmount - discountAmount;

    setForm((prev) => ({
      ...prev,
      subtotal: Math.round(subtotal * 100) / 100,
      tax_amount: Math.round(taxAmount * 100) / 100,
      discount_amount: Math.round(discountAmount * 100) / 100,
      total_amount: Math.round(totalAmount * 100) / 100,
    }));
  };

  const addProduct = (product: Product): void => {
    if (form.items.find(item => item.product_id === product.id)) {
      toast.error("Product already added");
      return;
    }

    const price = product.price || product.unit_price || 0;
    const updatedItems = [...form.items, {
      product_id: product.id,
      product_name: product.name,
      sku: product.sku,
      quantity: 1,
      unit_price: price,
      total_price: price,
    }];

    setForm((prev) => ({ ...prev, items: updatedItems }));
    calculateTotals(updatedItems);
    setShowProductSearch(false);
    setProductSearch("");
  };

  const updateItemQuantity = (index: number, quantity: number): void => {
    const updatedItems = form.items.map((item, i) =>
      i === index ? { ...item, quantity, total_price: Math.round(item.unit_price * quantity * 100) / 100 } : item
    );
    setForm((prev) => ({ ...prev, items: updatedItems }));
    calculateTotals(updatedItems);
  };

  const updateItemPrice = (index: number, price: number): void => {
    const updatedItems = form.items.map((item, i) =>
      i === index ? { ...item, unit_price: price, total_price: Math.round(price * item.quantity * 100) / 100 } : item
    );
    setForm((prev) => ({ ...prev, items: updatedItems }));
    calculateTotals(updatedItems);
  };

  const removeItem = (index: number): void => {
    const updatedItems = form.items.filter((_, i) => i !== index);
    setForm((prev) => ({ ...prev, items: updatedItems }));
    calculateTotals(updatedItems);
  };

  const handleInputChange = (field: string, value: string | number): void => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
    
    if (["tax_rate", "discount_value", "discount_type"].includes(field)) {
      calculateTotals();
    }
  };

  const validateField = (field: string, value: string | number): string | undefined => {
    switch (field) {
      case "customer_id": return !value ? "Customer is required" : undefined;
      case "location_id": return !value ? "Location is required" : undefined;
      case "invoice_date": return !value ? "Invoice date is required" : undefined;
      case "due_date": return !value ? "Due date is required" : undefined;
      default: return undefined;
    }
  };

  const handleBlur = (field: string): void => {
    const error = validateField(field, form[field as keyof InvoiceFormData]);
    if (error) setErrors((prev) => ({ ...prev, [field]: error }));
  };

  const validateAllFields = (): boolean => {
    const newErrors: FormErrors = {};
    let isValid = true;

    ["customer_id", "location_id", "invoice_date", "due_date"].forEach((field) => {
      const error = validateField(field, form[field as keyof InvoiceFormData]);
      if (error) { newErrors[field] = error; isValid = false; }
    });

    if (form.items.length === 0) {
      newErrors.items = "At least one item is required";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (status: "draft" | "sent"): Promise<void> => {
    if (!validateAllFields()) {
      const firstError = Object.values(errors).find(Boolean);
      if (firstError) toast.error(firstError);
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        customer_id: form.customer_id,
        location_id: form.location_id,
        invoice_date: form.invoice_date,
        due_date: form.due_date,
        notes: form.notes,
        items: form.items.map(({ product_id, quantity, unit_price }) => ({
          product_id, quantity, unit_price,
        })),
        subtotal: form.subtotal,
        tax_rate: form.tax_rate,
        tax_amount: form.tax_amount,
        discount_type: form.discount_type,
        discount_value: form.discount_value,
        discount_amount: form.discount_amount,
        total_amount: form.total_amount,
        status,
        business_key: businessKey,
      };

      const response = await apiPost("/invoices", payload);
      
      if (response.success || response.data) {
        toast.success(status === "sent" ? "Invoice sent successfully!" : "Invoice saved as draft");
        setTimeout(() => router.push("/invoice"), 1500);
      } else {
        toast.error("Failed to create invoice. Invalid response.");
      }
    } catch (err: unknown) {
      const error = err as ApiError;
      const status = error.response?.status;
      
      if (status === 422) {
        const errs = error.response?.data?.errors;
        if (errs) {
          const formErrors: FormErrors = {};
          Object.entries(errs).forEach(([key, val]) => {
            formErrors[key] = (Array.isArray(val) ? val[0] : val) as string;
          });
          setErrors(formErrors);
          const firstKey = Object.keys(errs)[0];
          if (firstKey) toast.error(`${firstKey}: ${formErrors[firstKey]}`);
        } else {
          toast.error("Validation failed. Please check the form.");
        }
      } else if (status === 500) {
        toast.error(`Server error: ${error.response?.data?.message || "Internal server error"}`);
      } else {
        toast.error(error.response?.data?.message || "Failed to create invoice. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid =
    form.customer_id !== "" &&
    form.location_id !== "" &&
    form.invoice_date !== "" &&
    form.due_date !== "" &&
    form.items.length > 0;

  const formatCurrency = (amount: number): string =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 })
      .format(amount).replace(/^\$/, currencySymbol);

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.sku.toLowerCase().includes(productSearch.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#f8f8f7]">
      {/* Top Bar */}
      <div className="bg-white border-b border-gray-100 top-0 z-10 mt-[-13px] w-full">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-700 transition-colors font-medium">
              <ArrowLeft className="h-3.5 w-3.5" /> Dashboard
            </Link>
            <ChevronRight className="h-3 w-3 text-gray-300" />
            <Link href="/invoice" className="text-xs text-gray-400 hover:text-gray-700 transition-colors font-medium">Invoices</Link>
            <ChevronRight className="h-3 w-3 text-gray-300" />
            <span className="text-xs text-gray-700 font-semibold">New Invoice</span>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => handleSubmit("draft")} disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50">
              {isSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />} Save Draft
            </button>
            <button type="button" onClick={() => handleSubmit("sent")} disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50">
              {isSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />} Save & Send
            </button>
          </div>
        </div>
      </div>

      {/* Page Header */}
      <div className="max-w-5xl mx-auto px-6 pt-8 pb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="bg-gray-900 p-2.5 rounded-xl">
            <FileText className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">New Invoice</h1>
            <p className="text-sm text-gray-400 mt-0.5">Create a new invoice for your customer</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-5xl mx-auto px-6 pb-12">
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
          <div className="space-y-4">
            {/* Customer & Location */}
            <SectionCard icon={User} title="Customer & Location" subtitle="Select the customer and business location">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Field label="Customer" required error={errors.customer_id}>
                  <select value={form.customer_id} onChange={(e) => handleInputChange("customer_id", e.target.value)}
                    onBlur={() => handleBlur("customer_id")} className={errors.customer_id ? errorInputClass : selectClass}>
                    <option value="">Select customer...</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>{c.first_name} {c.last_name}{c.email ? ` (${c.email})` : ''}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Location" required error={errors.location_id}>
                  <select value={form.location_id} onChange={(e) => handleInputChange("location_id", e.target.value)}
                    onBlur={() => handleBlur("location_id")} className={errors.location_id ? errorInputClass : selectClass}>
                    <option value="">Select location...</option>
                    {locations.map((l) => (
                      <option key={l.id} value={l.id}>{l.location_name}</option>
                    ))}
                  </select>
                </Field>
              </div>
            </SectionCard>

            {/* Invoice Items */}
            <SectionCard icon={Package} title="Invoice Items" subtitle="Add products to this invoice">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-400">{form.items.length} item{form.items.length !== 1 ? 's' : ''} added</p>
                  <button type="button" onClick={() => setShowProductSearch(!showProductSearch)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                    <Plus className="h-3.5 w-3.5" /> Add Product
                  </button>
                </div>

                {showProductSearch && (
                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="relative mb-3">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input type="text" value={productSearch} onChange={(e) => setProductSearch(e.target.value)}
                        placeholder="Search products..." className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 outline-none" />
                    </div>
                    <div className="max-h-48 overflow-y-auto space-y-1">
                      {filteredProducts.slice(0, 10).map((product) => (
                        <button key={product.id} type="button" onClick={() => addProduct(product)}
                          className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-white transition-colors text-left">
                          <div>
                            <div className="text-sm font-medium text-gray-700">{product.name}</div>
                            <div className="text-[11px] text-gray-400 font-mono">{product.sku}</div>
                          </div>
                          <div className="text-sm font-semibold text-gray-700">{formatCurrency(product.price || product.unit_price || 0)}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {errors.items && (
                  <div className="flex items-center gap-1.5 text-red-500 text-xs"><XCircle size={11} /><span>{errors.items}</span></div>
                )}

                {form.items.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">No items added yet</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-100">
                          <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-widest text-gray-400">Product</th>
                          <th className="px-3 py-2 text-right text-[10px] font-bold uppercase tracking-widest text-gray-400 w-20">Qty</th>
                          <th className="px-3 py-2 text-right text-[10px] font-bold uppercase tracking-widest text-gray-400 w-28">Price</th>
                          <th className="px-3 py-2 text-right text-[10px] font-bold uppercase tracking-widest text-gray-400 w-28">Total</th>
                          <th className="px-3 py-2 text-center text-[10px] font-bold uppercase tracking-widest text-gray-400 w-10"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {form.items.map((item, index) => (
                          <tr key={index} className="border-b border-gray-50">
                            <td className="px-3 py-3">
                              <div className="font-medium text-gray-700">{item.product_name}</div>
                              <div className="text-[11px] text-gray-400 font-mono">{item.sku}</div>
                            </td>
                            <td className="px-3 py-3">
                              <input type="number" min="1" value={item.quantity}
                                onChange={(e) => updateItemQuantity(index, parseInt(e.target.value) || 1)}
                                className="w-full text-right px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 outline-none" />
                            </td>
                            <td className="px-3 py-3">
                              <input type="number" min="0" step="0.01" value={item.unit_price}
                                onChange={(e) => updateItemPrice(index, parseFloat(e.target.value) || 0)}
                                className="w-full text-right px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 outline-none" />
                            </td>
                            <td className="px-3 py-3 text-right font-semibold text-gray-700">{formatCurrency(item.total_price)}</td>
                            <td className="px-3 py-3 text-center">
                              <button type="button" onClick={() => removeItem(index)}
                                className="w-6 h-6 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </SectionCard>

            {/* Dates & Notes */}
            <SectionCard icon={Calendar} title="Dates & Notes" subtitle="Set invoice and due dates">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Field label="Invoice Date" required error={errors.invoice_date}>
                  <input type="date" value={form.invoice_date} onChange={(e) => handleInputChange("invoice_date", e.target.value)}
                    onBlur={() => handleBlur("invoice_date")} className={errors.invoice_date ? errorInputClass : inputClass} />
                </Field>
                <Field label="Due Date" required error={errors.due_date}>
                  <input type="date" value={form.due_date} onChange={(e) => handleInputChange("due_date", e.target.value)}
                    onBlur={() => handleBlur("due_date")} className={errors.due_date ? errorInputClass : inputClass} />
                </Field>
                <div className="md:col-span-2">
                  <Field label="Notes" optional>
                    <textarea rows={3} value={form.notes} onChange={(e) => handleInputChange("notes", e.target.value)}
                      className={`${inputClass} resize-none`} placeholder="Add any additional notes..." />
                  </Field>
                </div>
              </div>
            </SectionCard>

            {/* Summary */}
            <SectionCard icon={Calculator} title="Invoice Summary" subtitle="Tax, discount, and total calculation" accentColor="bg-gray-800">
              <div className="space-y-4">
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-gray-500">Subtotal</span>
                  <span className="text-sm font-semibold text-gray-700">{formatCurrency(form.subtotal)}</span>
                </div>

                <div className="border-t border-gray-100 pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-500">Tax Rate (%)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="number" min="0" max="100" step="0.1" value={form.tax_rate}
                      onChange={(e) => handleInputChange("tax_rate", parseFloat(e.target.value) || 0)}
                      className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-right focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 outline-none" />
                    <span className="text-sm text-gray-500">%</span>
                  </div>
                  {form.tax_amount > 0 && (
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-gray-400">Tax Amount</span>
                      <span className="text-xs font-semibold text-gray-600">{formatCurrency(form.tax_amount)}</span>
                    </div>
                  )}
                </div>

                <div className="border-t border-gray-100 pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-500">Discount</span>
                    <div className="flex items-center gap-1">
                      <button type="button" onClick={() => handleInputChange("discount_type", "fixed")}
                        className={`px-2 py-1 text-[10px] font-semibold rounded-md transition-colors ${form.discount_type === "fixed" ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>Fixed</button>
                      <button type="button" onClick={() => handleInputChange("discount_type", "percentage")}
                        className={`px-2 py-1 text-[10px] font-semibold rounded-md transition-colors ${form.discount_type === "percentage" ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>%</button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="number" min="0" step="0.01" value={form.discount_value}
                      onChange={(e) => handleInputChange("discount_value", parseFloat(e.target.value) || 0)}
                      className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-right focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 outline-none" />
                    <span className="text-sm text-gray-500">{form.discount_type === "percentage" ? "%" : currencySymbol}</span>
                  </div>
                  {form.discount_amount > 0 && (
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-gray-400">Discount Amount</span>
                      <span className="text-xs font-semibold text-red-600">-{formatCurrency(form.discount_amount)}</span>
                    </div>
                  )}
                </div>

                <div className="border-t-2 border-gray-200 pt-4">
                  <div className="flex items-center justify-between">
                    <span className="text-base font-bold text-gray-900">Total</span>
                    <span className="text-xl font-bold text-gray-900">{formatCurrency(form.total_amount)}</span>
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
                <Link href="/invoice" className="px-5 py-2.5 text-sm font-semibold text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors">Cancel</Link>
                <button type="button" onClick={() => handleSubmit("draft")} disabled={!isFormValid || isSubmitting}
                  className="px-6 py-2.5 bg-white border border-gray-200 text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center gap-2">
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save Draft
                </button>
                <button type="button" onClick={() => handleSubmit("sent")} disabled={!isFormValid || isSubmitting}
                  className="px-6 py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-800 active:bg-black transition-colors focus:outline-none focus:ring-2 focus:ring-gray-900/20 focus:ring-offset-2 disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center gap-2 shadow-sm">
                  {isSubmitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Creating...</> : <><Send className="h-4 w-4" /> Save & Send</>}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default withAuth(NewInvoice);