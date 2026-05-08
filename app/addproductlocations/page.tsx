"use client";
import { withAuth } from "@/hoc/withAuth";
import { apiGet, apiPost } from "@/lib/axios";
import React, { useState, useEffect, useCallback } from "react";
import {
  ArrowLeft,
  Package,
  Search,
  X,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  RefreshCw,
  MapPin,
  Warehouse,
  Plus,
  Check,
  AlertTriangle,
  Info,
  Minus,
  Store,
  Phone,
  SlidersHorizontal,
  Percent,
  Star,
  Building2,
  Box,
  Send,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { toast } from "react-hot-toast";

// ==============================================
// TypeScript Interfaces
// ==============================================

interface Product {
  id: number;
  name: string;
  sku: string;
  description: string | null;
  price: string | number | null;
  stock_quantity: string | number | null;
  category_id: number;
  category?: { id: number; name: string };
  image: string | null;
  is_active: boolean;
  is_featured?: boolean;
  is_on_sale?: boolean;
  discount_percentage?: string | number | null;
  low_stock_threshold?: string | number | null;
  unit?: { id: number; name: string; symbol: string };
}

interface Category {
  id: number;
  name: string;
  product_count?: number;
}

interface Location {
  id: number;
  owner_id: number;
  business_key: string;
  location_id: string;
  manager_id: number;
  location_status: string;
  location_name: string;
  address: string;
  city: string;
  state: string;
  head_office: string | null;
  phone: string;
  country: string;
  postal_code: string;
  status: string;
  created_at: string;
  updated_at: string;
  user?: { id: number; name: string; email: string; phone_number: string; role: string };
  business?: { id: number; business_name: string; currency: string };
}

interface ApiError {
  response?: { data?: { message?: string } };
  message?: string;
}

interface User {
  businesses_one?: Array<{ currency?: string }>;
}

// ==============================================
// Utility Functions
// ==============================================

const toNumber = (value: string | number | null | undefined): number => {
  if (value === null || value === undefined) return 0;
  if (typeof value === "number") return value;
  const parsed = parseFloat(value);
  return isNaN(parsed) ? 0 : parsed;
};

const formatNumber = (num: number): string =>
  new Intl.NumberFormat("en-US").format(num);

const useDebounce = <T,>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
};

// ==============================================
// Location Card
// ==============================================

const LocationCard: React.FC<{
  location: Location;
  selected: boolean;
  onSelect: () => void;
}> = ({ location, selected, onSelect }) => {
  const isHQ = location.head_office === "yes";
  const isActive = location.location_status === "on";
  const managerName = location.user?.name || "No manager";

  const getIcon = () => {
    if (isHQ) return <Building2 className="h-4 w-4 text-white" />;
    if (location.location_name?.toLowerCase().includes("warehouse"))
      return <Warehouse className="h-4 w-4 text-white" />;
    if (location.location_name?.toLowerCase().includes("store"))
      return <Store className="h-4 w-4 text-white" />;
    return <MapPin className="h-4 w-4 text-white" />;
  };

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full text-left rounded-xl border-2 p-3.5 transition-all duration-200 group
        ${selected
          ? "border-black bg-black/[0.03] shadow-sm"
          : "border-neutral-200 hover:border-neutral-400 bg-white"
        }`}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={`w-9 h-9 rounded-lg flex-shrink-0 flex items-center justify-center shadow-sm
          ${isHQ ? "bg-black" : "bg-neutral-700"}`}>
          {getIcon()}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-bold text-gray truncate leading-tight">
              {location.location_name || "Unnamed location"}
            </p>
            {selected && (
              <span className="flex-shrink-0 w-5 h-5 bg-black rounded-full flex items-center justify-center">
                <Check className="h-3 w-3 text-white" />
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md border
              ${isHQ ? "bg-indigo-50 text-indigo-700 border-indigo-200" : "bg-neutral-100 text-neutral-600 border-neutral-200"}`}>
              {isHQ ? "HQ" : "Branch"}
            </span>
            <span className={`text-[10px] font-semibold flex items-center gap-1
              ${isActive ? "text-emerald-600" : "text-neutral-400"}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-emerald-500" : "bg-neutral-300"}`} />
              {isActive ? "Active" : "Inactive"}
            </span>
          </div>

          {location.user && (
            <p className="text-[11px] text-neutral-500 mt-1.5 font-medium truncate">
              {managerName}
              {location.user.email && ` · ${location.user.email}`}
            </p>
          )}

          {location.address && (
            <p className="text-[11px] text-neutral-400 mt-1 truncate">
              {[location.city, location.state].filter(Boolean).join(", ")}
            </p>
          )}
        </div>
      </div>
    </button>
  );
};

// ==============================================
// Product Row (List view for speed)
// ==============================================

const ProductRow: React.FC<{
  product: Product;
  isSelected: boolean;
  quantity: number;
  onQuantityChange: (qty: number) => void;
  onToggleSelect: () => void;
  formatCurrency: (amount: number) => string;
}> = ({ product, isSelected, quantity, onQuantityChange, onToggleSelect, formatCurrency }) => {
  const stockQty = toNumber(product.stock_quantity);
  const price = toNumber(product.price);
  const discount = toNumber(product.discount_percentage);
  const discountedPrice = discount > 0 ? price - (price * discount) / 100 : price;
  const isLowStock =
    product.low_stock_threshold &&
    stockQty <= toNumber(product.low_stock_threshold) &&
    stockQty > 0;

  return (
    <div
      className={`rounded-xl border-2 transition-all duration-200
        ${isSelected
          ? "border-black bg-neutral-50 shadow-sm"
          : "border-neutral-200 bg-white hover:border-neutral-300"
        }`}
    >
      {/* Main Row */}
      <div className="flex items-center gap-3 p-3">
        {/* Checkbox */}
        <button
          type="button"
          onClick={onToggleSelect}
          className={`flex-shrink-0 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all
            ${isSelected ? "bg-black border-black" : "border-neutral-300 hover:border-black bg-white"}`}
        >
          {isSelected && <Check className="h-3 w-3 text-white" />}
        </button>

        {/* Image */}
        <div className={`flex-shrink-0 w-11 h-11 rounded-lg border-2 overflow-hidden bg-neutral-100
          ${isSelected ? "border-black/20" : "border-neutral-200"}`}>
          {product.image ? (
            <Image
              src={`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/storage/${product.image}`}
              alt={product.name}
              width={44}
              height={44}
              className="object-cover w-full h-full"
              unoptimized={process.env.NODE_ENV === "development"}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="h-5 w-5 text-neutral-300" />
            </div>
          )}
        </div>

        {/* Name + Meta */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2">
            <p className="text-sm font-bold text-gray truncate leading-tight">{product.name}</p>
            <div className="flex-shrink-0 flex items-center gap-1">
              {product.is_featured && (
                <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
              )}
              {product.is_on_sale && discount > 0 && (
                <span className="text-[10px] font-extrabold bg-black text-white px-1.5 py-0.5 rounded">
                  -{discount}%
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[10px] font-mono font-bold text-neutral-400 bg-neutral-100 px-1.5 py-0.5 rounded">
              {product.sku}
            </span>
            {product.category && (
              <span className="text-[10px] font-bold text-neutral-600 bg-neutral-100 px-1.5 py-0.5 rounded">
                {product.category.name}
              </span>
            )}
          </div>
        </div>

        {/* Stock */}
        <div className="hidden sm:block flex-shrink-0 text-right">
          <div className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-lg
            ${stockQty > 0 ? "bg-neutral-900 text-white" : "bg-neutral-200 text-neutral-500"}`}>
            {stockQty > 0 ? (
              <CheckCircle className="h-3 w-3" />
            ) : (
              <XCircle className="h-3 w-3" />
            )}
            {stockQty > 0 ? formatNumber(stockQty) : "Out"}
          </div>
          {isLowStock && (
            <p className="text-[10px] text-amber-600 font-bold mt-0.5 flex items-center gap-0.5">
              <AlertCircle className="h-2.5 w-2.5" />
              Low
            </p>
          )}
        </div>

        {/* Price */}
        <div className="flex-shrink-0 text-right">
          <p className="text-sm font-extrabold text-gray">
            {formatCurrency(discountedPrice)}
          </p>
          {discount > 0 && (
            <p className="text-[10px] text-neutral-400 line-through">
              {formatCurrency(price)}
            </p>
          )}
          {product.unit && (
            <p className="text-[10px] text-neutral-400">/{product.unit.symbol}</p>
          )}
        </div>
      </div>

      {/* Quantity row — visible only when selected */}
      {isSelected && (
        <div className="px-3 pb-3 pt-1 border-t border-neutral-200">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-neutral-500">Set quantity</p>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => onQuantityChange(Math.max(0, quantity - 1))}
                disabled={quantity === 0}
                className="w-7 h-7 rounded-lg bg-black flex items-center justify-center hover:bg-neutral-800 
                  disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <Minus className="h-3.5 w-3.5 text-white" />
              </button>
              <input
                type="number"
                min="0"
                max={stockQty}
                value={quantity}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 0;
                  onQuantityChange(Math.min(stockQty, Math.max(0, val)));
                }}
                className="w-14 h-7 text-center border-2 border-black rounded-lg text-sm font-bold text-gray
                  focus:ring-2 focus:ring-black/20 focus:border-black outline-none bg-white"
                aria-label="Product quantity"
              />
              <button
                type="button"
                onClick={() => onQuantityChange(Math.min(stockQty, quantity + 1))}
                disabled={quantity >= stockQty}
                className="w-7 h-7 rounded-lg bg-black flex items-center justify-center hover:bg-neutral-800 
                  disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <Plus className="h-3.5 w-3.5 text-white" />
              </button>
            </div>
          </div>
          {quantity === 0 && (
            <p className="mt-2 text-[11px] text-neutral-400 font-medium flex items-center gap-1">
              <Info className="h-3 w-3" />
              Will be distributed with quantity 0
            </p>
          )}
          {stockQty > 0 && quantity > stockQty && (
            <div className="mt-2 flex items-center gap-1.5 text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-1.5 rounded-lg">
              <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
              Exceeds stock ({formatNumber(stockQty)})
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ==============================================
// Confirmation Modal
// ==============================================

const ConfirmationModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  selectedProducts: number;
  productsWithQuantity: number;
  totalUnits: number;
  location: Location | null;
  isSubmitting: boolean;
}> = ({
  isOpen, onClose, onConfirm, selectedProducts,
  productsWithQuantity, totalUnits, location, isSubmitting,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm border-2 border-black overflow-hidden">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center shadow-md">
              <Send className="h-5 w-5 text-white" />
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-400 hover:text-gray transition"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <h2 className="text-lg font-extrabold text-gray">Confirm Distribution</h2>
          <p className="text-sm text-neutral-500 mt-1">
            Sending to{" "}
            <span className="font-bold text-gray">{location?.location_name}</span>
          </p>

          {/* Summary */}
          <div className="mt-5 bg-neutral-50 rounded-xl p-4 space-y-2.5 border border-neutral-200">
            {[
              { label: "Products selected", value: selectedProducts },
              { label: "With quantity set", value: productsWithQuantity },
              ...(totalUnits > 0 ? [{ label: "Total units", value: formatNumber(totalUnits) }] : []),
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between text-sm">
                <span className="text-neutral-500 font-medium">{label}</span>
                <span className="font-extrabold text-gray">{value}</span>
              </div>
            ))}
          </div>

          {selectedProducts > 0 && productsWithQuantity < selectedProducts && (
            <div className="mt-3 flex items-start gap-2 text-xs font-medium text-neutral-600 bg-neutral-100 p-3 rounded-xl border border-neutral-200">
              <Info className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
              {selectedProducts - productsWithQuantity} product(s) will distribute with quantity 0.
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2.5 mt-5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 py-2.5 rounded-xl border-2 border-neutral-200 bg-white text-gray text-sm font-bold hover:bg-neutral-50 transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isSubmitting}
              className="flex-1 py-2.5 rounded-xl bg-black text-white text-sm font-extrabold hover:bg-neutral-800 transition
                disabled:opacity-50 inline-flex items-center justify-center gap-2 shadow-lg shadow-black/20"
            >
              {isSubmitting ? (
                <><Loader2 className="h-4 w-4 animate-spin" />Processing…</>
              ) : (
                <><Check className="h-4 w-4" />Distribute</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==============================================
// Main Component
// ==============================================

const AddToLocations = ({ user }: { user: User }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const formatCurrency = useCallback(
    (amount: number): string => {
      const currencySymbol = user?.businesses_one?.[0]?.currency || "$";
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
        .format(amount)
        .replace(/^\$/, currencySymbol);
    },
    [user]
  );

  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<Record<number, boolean>>({});
  const [productQuantities, setProductQuantities] = useState<Record<number, number>>({});

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [locationSearch, setLocationSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<"name" | "price" | "stock">("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Active step for mobile flow
  const [activeStep, setActiveStep] = useState<1 | 2>(1);

  const debouncedSearch = useDebounce(searchQuery, 400);
  const debouncedLocationSearch = useDebounce(locationSearch, 300);

  const buildProductQueryString = useCallback(() => {
    const params = new URLSearchParams();
    params.append("per_page", "100");
    if (debouncedSearch) params.append("search", debouncedSearch);
    if (selectedCategory !== "all") params.append("category", selectedCategory);
    params.append(
      "sort_by",
      sortBy === "price" ? "price" : sortBy === "stock" ? "stock_quantity" : "name"
    );
    params.append("sort_order", sortOrder);
    params.append("status", "active");
    return params.toString();
  }, [debouncedSearch, selectedCategory, sortBy, sortOrder]);

  const fetchProducts = useCallback(async () => {
    try {
      const res = await apiGet(`/products?${buildProductQueryString()}`, {}, false);
      const responseData = res.data?.data || res.data || res;
      let list: Product[] = [];
      if (Array.isArray(responseData)) list = responseData;
      else if (responseData?.data) list = responseData.data;
      else if (responseData?.products) list = responseData.products;
      setProducts(list);
    } catch {
      toast.error("Failed to fetch products");
      setProducts([]);
    }
  }, [buildProductQueryString]);

  const fetchCategories = async () => {
    try {
      const res = await apiGet("/product-categories", {}, false);
      const arr = res.data?.data?.product_categories ?? res.data?.data ?? [];
      setCategories(Array.isArray(arr) ? arr : []);
    } catch {
      setCategories([]);
    }
  };

  const fetchLocations = useCallback(async () => {
    try {
      const qs = debouncedLocationSearch
        ? `?search=${encodeURIComponent(debouncedLocationSearch)}`
        : "";
      const res = await apiGet(`/locations_without_main${qs}`, {}, false);
      let list: Location[] = [];
      if (Array.isArray(res.data)) list = res.data;
      else if (res.data?.data) list = res.data.data;
      else if (res.data?.locations) list = res.data.locations;
      setLocations(list);
    } catch {
      setLocations([]);
    }
  }, [debouncedLocationSearch]);

  // Initial load
  useEffect(() => {
    setIsLoading(true);
    Promise.all([fetchProducts(), fetchCategories(), fetchLocations()]).finally(() =>
      setIsLoading(false)
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-fetch on filter/sort/search change
  useEffect(() => {
    setIsLoading(true);
    fetchProducts().finally(() => setIsLoading(false));
  }, [debouncedSearch, selectedCategory, sortBy, sortOrder, fetchProducts]);

  useEffect(() => {
    fetchLocations();
  }, [debouncedLocationSearch, fetchLocations]);

  const handleProductSelect = (id: number) => {
    setSelectedProducts((prev) => {
      const next = !prev[id];
      if (!next) {
        setProductQuantities((prevQ) => {
          const n = { ...prevQ };
          delete n[id];
          return n;
        });
      }
      return { ...prev, [id]: next };
    });
  };

  const handleQuantityChange = (id: number, qty: number) =>
    setProductQuantities((prev) => ({ ...prev, [id]: qty }));

  const selectAll = () => {
    const s: Record<number, boolean> = {};
    products.forEach((p) => (s[p.id] = true));
    setSelectedProducts(s);
  };

  const deselectAll = () => {
    setSelectedProducts({});
    setProductQuantities({});
  };

  const selCount = Object.values(selectedProducts).filter(Boolean).length;
  const qtyCount = Object.keys(productQuantities).length;
  const totalUnits = Object.values(productQuantities).reduce((a, b) => a + b, 0);

  const handleDistribute = () => {
    if (!selectedLocation) return toast.error("Please select a destination location");
    if (selCount === 0) return toast.error("Please select at least one product");
    setShowConfirmation(true);
  };

  const confirmDistribution = async () => {
    setIsSubmitting(true);
    try {
      const items = Object.keys(selectedProducts)
        .filter((k) => selectedProducts[+k])
        .map((k) => ({ product_id: +k, quantity: productQuantities[+k] || 0 }));
      await apiPost(
        "/distributeProducts",
        {
          destination_location_id: selectedLocation!.id,
          items,
          notes: `Distribution to ${selectedLocation!.location_name}`,
        },
        {},
        ["/distributeProducts"]
      );
      toast.success(`Distributed to ${selectedLocation!.location_name}`);
      setSelectedLocation(null);
      setSelectedProducts({});
      setProductQuantities({});
      setShowConfirmation(false);
      await fetchProducts();
    } catch (err) {
      toast.error(
        (err as ApiError).response?.data?.message || "Failed to distribute"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Render ──────────────────────────────────

  return (
    <div className="min-h-screen bg-neutral-50">

      {/* ── Sticky Header ── */}
      <header className=" top-0 z-30 bg-white border-b-2 border-neutral-200 shadow-sm mt-[-13px] w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
          <div className="flex items-center justify-between gap-4">
            {/* Left */}
            <div className="flex items-center gap-3">
              <Link
                href="/products"
                className="p-2 text-neutral-400 hover:text-gray hover:bg-neutral-100 rounded-xl transition border border-transparent hover:border-neutral-200"
              >
                <ArrowLeft className="h-4.5 w-4.5" />
              </Link>
              <div>
                <h1 className="text-base font-extrabold text-gray leading-tight">
                  Add to Location
                </h1>
                <p className="text-[11px] text-neutral-400 font-medium hidden sm:block">
                  Select products and a destination to distribute
                </p>
              </div>
            </div>

            {/* Right */}
            <div className="flex items-center gap-2">
              {/* Mobile step toggle */}
              <div className="flex lg:hidden border-2 border-neutral-200 rounded-xl overflow-hidden text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setActiveStep(1)}
                  className={`px-3 py-2 transition ${activeStep === 1 ? "bg-black text-white" : "text-neutral-500 hover:bg-neutral-50"}`}
                >
                  Location
                </button>
                <button
                  type="button"
                  onClick={() => setActiveStep(2)}
                  className={`px-3 py-2 transition ${activeStep === 2 ? "bg-black text-white" : "text-neutral-500 hover:bg-neutral-50"}`}
                >
                  Products {selCount > 0 && `(${selCount})`}
                </button>
              </div>

              <button
                type="button"
                onClick={() => { fetchProducts(); fetchLocations(); }}
                className="p-2 text-neutral-400 hover:bg-neutral-100 rounded-xl border border-neutral-200 hover:border-black transition"
                title="Refresh"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 pb-28">
        <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-5">

          {/* ══ LOCATIONS PANEL ══ */}
          <aside
            className={`${activeStep === 2 ? "hidden lg:block" : "block"}`}
          >
            <div className="bg-white rounded-2xl border-2 border-neutral-200 shadow-sm overflow-hidden lg:sticky lg:top-24">
              {/* Panel Header */}
              <div className="px-4 py-3.5 border-b-2 border-neutral-100 bg-gradient-to-r from-neutral-50 to-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-extrabold text-gray flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      Step 1 — Destination
                    </h2>
                    <p className="text-[11px] text-neutral-400 mt-0.5">
                      {selectedLocation
                        ? `✓ ${selectedLocation.location_name}`
                        : `${locations.length} location${locations.length !== 1 ? "s" : ""} available`}
                    </p>
                  </div>
                  {selectedLocation && (
                    <button
                      type="button"
                      onClick={() => setSelectedLocation(null)}
                      className="text-[11px] font-bold text-neutral-400 hover:text-gray transition"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Search */}
              <div className="p-3 border-b border-neutral-100">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 h-3.5 w-3.5" />
                  <input
                    type="text"
                    value={locationSearch}
                    onChange={(e) => setLocationSearch(e.target.value)}
                    placeholder="Search locations…"
                    className="w-full pl-8 pr-8 py-2.5 text-sm font-medium border-2 border-neutral-200 rounded-xl
                      focus:ring-2 focus:ring-black/20 focus:border-black outline-none placeholder:text-neutral-400"
                  />
                  {locationSearch && (
                    <button
                      type="button"
                      onClick={() => setLocationSearch("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-gray transition"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* List */}
              <div className="p-3 space-y-2 max-h-[60vh] overflow-y-auto">
                {locations.length > 0 ? (
                  locations.map((loc) => (
                    <LocationCard
                      key={loc.id}
                      location={loc}
                      selected={selectedLocation?.id === loc.id}
                      onSelect={() => {
                        setSelectedLocation(loc);
                        setActiveStep(2);
                      }}
                    />
                  ))
                ) : (
                  <div className="text-center py-10">
                    <MapPin className="h-10 w-10 text-neutral-200 mx-auto mb-3" />
                    <p className="text-sm text-neutral-400 font-medium">No locations found</p>
                  </div>
                )}
              </div>
            </div>
          </aside>

          {/* ══ PRODUCTS PANEL ══ */}
          <section className={`${activeStep === 1 ? "hidden lg:block" : "block"} space-y-4`}>

            {/* Step 2 Header */}
            <div className="bg-white rounded-2xl border-2 border-neutral-200 shadow-sm overflow-hidden">
              <div className="px-4 py-3.5 border-b-2 border-neutral-100 bg-gradient-to-r from-neutral-50 to-white">
                <h2 className="text-sm font-extrabold text-gray flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Step 2 — Select Products
                </h2>
                <p className="text-[11px] text-neutral-400 mt-0.5">
                  {selCount > 0
                    ? `${selCount} product${selCount !== 1 ? "s" : ""} selected${totalUnits > 0 ? ` · ${formatNumber(totalUnits)} units` : ""}`
                    : "Choose products to distribute"}
                </p>
              </div>

              {/* Search + Filters */}
              <div className="p-3 space-y-3">
                <div className="flex gap-2.5">
                  {/* Search */}
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 h-3.5 w-3.5" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search by name, SKU…"
                      className="w-full pl-8 pr-8 py-2.5 text-sm font-medium border-2 border-neutral-200 rounded-xl
                        focus:ring-2 focus:ring-black/20 focus:border-black outline-none placeholder:text-neutral-400"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-gray transition"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Category */}
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="px-3 py-2.5 text-sm font-medium border-2 border-neutral-200 rounded-xl
                      focus:ring-2 focus:ring-black/20 focus:border-black outline-none bg-white hover:border-black transition"
                  >
                    <option value="all">All Categories</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id.toString()}>{c.name}</option>
                    ))}
                  </select>

                  {/* Filter toggle */}
                  <button
                    type="button"
                    onClick={() => setShowFilters(!showFilters)}
                    className={`p-2.5 rounded-xl border-2 transition flex-shrink-0
                      ${showFilters
                        ? "bg-black text-white border-black"
                        : "border-neutral-200 text-neutral-500 hover:border-black hover:bg-neutral-50"
                      }`}
                  >
                    <SlidersHorizontal className="h-4 w-4" />
                  </button>
                </div>

                {/* Extended Filters */}
                {showFilters && (
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="text-[10px] font-extrabold text-neutral-400 uppercase tracking-wider mb-1.5 block">
                        Sort By
                      </label>
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                        className="w-full px-3 py-2 text-sm font-medium border-2 border-neutral-200 rounded-xl
                          hover:border-black focus:ring-2 focus:ring-black/20 focus:border-black outline-none bg-white transition"
                      >
                        <option value="name">Name</option>
                        <option value="price">Price</option>
                        <option value="stock">Stock</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-extrabold text-neutral-400 uppercase tracking-wider mb-1.5 block">
                        Order
                      </label>
                      <select
                        value={sortOrder}
                        onChange={(e) => setSortOrder(e.target.value as typeof sortOrder)}
                        className="w-full px-3 py-2 text-sm font-medium border-2 border-neutral-200 rounded-xl
                          hover:border-black focus:ring-2 focus:ring-black/20 focus:border-black outline-none bg-white transition"
                      >
                        <option value="asc">Ascending</option>
                        <option value="desc">Descending</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* Selection toolbar */}
              {products.length > 0 && (
                <div className="px-4 py-2.5 bg-neutral-50 border-t-2 border-neutral-100 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-extrabold text-neutral-400 uppercase tracking-wider">
                      Select:
                    </span>
                    <button
                      type="button"
                      onClick={selectAll}
                      className="text-[11px] font-extrabold px-2.5 py-1 bg-white border-2 border-neutral-200 rounded-lg
                        hover:bg-black hover:text-white hover:border-black transition"
                    >
                      All ({products.length})
                    </button>
                    <button
                      type="button"
                      onClick={deselectAll}
                      className="text-[11px] font-extrabold px-2.5 py-1 bg-white border-2 border-neutral-200 rounded-lg
                        hover:bg-black hover:text-white hover:border-black transition"
                    >
                      None
                    </button>
                  </div>
                  <p className="text-[11px] font-semibold text-neutral-500">
                    {products.length} product{products.length !== 1 ? "s" : ""}
                  </p>
                </div>
              )}
            </div>

            {/* Product List */}
            {isLoading ? (
              <div className="bg-white rounded-2xl border-2 border-neutral-200 py-16 flex flex-col items-center justify-center gap-3">
                <div className="relative w-14 h-14">
                  <div className="absolute inset-0 rounded-full border-4 border-neutral-100" />
                  <div className="absolute inset-0 rounded-full border-4 border-black border-t-transparent animate-spin" />
                  <Package className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-5 w-5 text-neutral-300" />
                </div>
                <p className="text-sm font-bold text-gray">Loading products…</p>
              </div>
            ) : products.length === 0 ? (
              <div className="bg-white rounded-2xl border-2 border-neutral-200 py-16 flex flex-col items-center justify-center gap-3">
                <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center shadow-md">
                  <Package className="h-8 w-8 text-white" />
                </div>
                <p className="text-base font-extrabold text-gray">
                  {searchQuery ? "No results found" : "No products available"}
                </p>
                <p className="text-sm text-neutral-400 font-medium">
                  {searchQuery ? `Nothing matches "${searchQuery}"` : "Products will appear here"}
                </p>
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="mt-1 px-4 py-2 bg-black text-white text-sm font-bold rounded-xl hover:bg-neutral-800 transition"
                  >
                    Clear search
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {products.map((p) => (
                  <ProductRow
                    key={p.id}
                    product={p}
                    isSelected={!!selectedProducts[p.id]}
                    quantity={productQuantities[p.id] || 0}
                    onQuantityChange={(q) => handleQuantityChange(p.id, q)}
                    onToggleSelect={() => handleProductSelect(p.id)}
                    formatCurrency={formatCurrency}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      </main>

      {/* ── Sticky Bottom Bar ── */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/[0.98] backdrop-blur-md border-t-2 border-neutral-200 shadow-2xl z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">

          {/* Summary chips */}
          <div className="flex items-center gap-3 min-w-0 overflow-x-auto">
            {/* Destination */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center flex-shrink-0">
                <MapPin className="h-3.5 w-3.5 text-white" />
              </div>
              <div>
                <p className="text-[10px] font-extrabold text-neutral-400 uppercase tracking-wider">Destination</p>
                <p className="text-xs font-extrabold text-gray leading-tight">
                  {selectedLocation?.location_name || "Not selected"}
                </p>
              </div>
            </div>

            {selCount > 0 && (
              <>
                <div className="h-8 w-px bg-neutral-200 flex-shrink-0" />
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="w-8 h-8 bg-neutral-100 rounded-lg flex items-center justify-center">
                    <CheckCircle className="h-3.5 w-3.5 text-gray" />
                  </div>
                  <div>
                    <p className="text-[10px] font-extrabold text-neutral-400 uppercase tracking-wider">Selected</p>
                    <p className="text-xs font-extrabold text-gray leading-tight">{selCount} products</p>
                  </div>
                </div>
              </>
            )}

            {totalUnits > 0 && (
              <>
                <div className="h-8 w-px bg-neutral-200 flex-shrink-0" />
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="w-8 h-8 bg-neutral-100 rounded-lg flex items-center justify-center">
                    <Box className="h-3.5 w-3.5 text-gray" />
                  </div>
                  <div>
                    <p className="text-[10px] font-extrabold text-neutral-400 uppercase tracking-wider">Units</p>
                    <p className="text-xs font-extrabold text-gray leading-tight">{formatNumber(totalUnits)}</p>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* CTA */}
          <button
            type="button"
            onClick={handleDistribute}
            disabled={!selectedLocation || selCount === 0 || isSubmitting}
            className="flex-shrink-0 px-5 py-2.5 bg-black text-white text-sm font-extrabold rounded-xl
              hover:bg-neutral-800 transition-all disabled:bg-neutral-300 disabled:cursor-not-allowed
              shadow-lg shadow-black/20 inline-flex items-center gap-2"
          >
            {isSubmitting ? (
              <><Loader2 className="h-4 w-4 animate-spin" />Processing…</>
            ) : (
              <><Send className="h-4 w-4" />Distribute</>
            )}
          </button>
        </div>
      </div>

      <ConfirmationModal
        isOpen={showConfirmation}
        onClose={() => setShowConfirmation(false)}
        onConfirm={confirmDistribution}
        selectedProducts={selCount}
        productsWithQuantity={qtyCount}
        totalUnits={totalUnits}
        location={selectedLocation}
        isSubmitting={isSubmitting}
      />
    </div>
  );
};

export default withAuth(AddToLocations);