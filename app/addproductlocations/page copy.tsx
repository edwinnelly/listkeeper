"use client";
import { withAuth } from "@/hoc/withAuth";
import { apiGet, apiPost } from "@/lib/axios";
import React, { useState, useEffect, useMemo, useCallback } from "react";
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
  Layers,
  Warehouse,
  Plus,
  Check,
  AlertTriangle,
  Info,
  ArrowRight,
  Grid3x3,
  List,
  Minus,
  Store,
  Phone,
  Mail,
  Home,
  Briefcase,
  SlidersHorizontal,
  Percent,
  Star,
  Tag,
  Building2,
  Users,
  Hash,
  Box,
  Send,
  ChevronRight,
  FilterX,
  TrendingUp,
  TrendingDown,
  BarChart3,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { toast } from "react-hot-toast";
import ShortTextWithTooltip from "../component/shorten_len";

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
  category?: {
    id: number;
    name: string;
  };
  image: string | null;
  is_active: boolean;
  is_featured?: boolean;
  is_on_sale?: boolean;
  discount_percentage?: string | number | null;
  low_stock_threshold?: string | number | null;
  unit?: {
    id: number;
    name: string;
    symbol: string;
  };
}

interface Category {
  id: number;
  name: string;
  product_count?: number;
  color?: string;
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
  user?: {
    id: number;
    name: string;
    email: string;
    phone_number: string;
    role: string;
  };
  business?: {
    id: number;
    business_name: string;
    currency: string;
  };
}

interface ApiError {
  response?: {
    data?: {
      message?: string;
    };
  };
  message?: string;
}

interface User {
  businesses_one?: Array<{
    currency?: string;
  }>;
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

const formatNumber = (num: number): string => {
  return new Intl.NumberFormat("en-US").format(num);
};

const useDebounce = <T,>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
};

// ==============================================
// Location Card Component - Enhanced UI with Black Text
// ==============================================

const LocationCard: React.FC<{
  location: Location;
  selected: boolean;
  onSelect: () => void;
}> = ({ location, selected, onSelect }) => {
  const getIcon = () => {
    if (location.head_office === "yes") {
      return <Building2 className="h-5 w-5 text-white" />;
    } else if (location.location_name?.toLowerCase().includes("warehouse")) {
      return <Warehouse className="h-5 w-5 text-white" />;
    } else if (location.location_name?.toLowerCase().includes("store")) {
      return <Store className="h-5 w-5 text-white" />;
    } else {
      return <MapPin className="h-5 w-5 text-white" />;
    }
  };

  const getGradient = () => {
    if (location.head_office === "yes") {
      return "from-black to-black";
    } else {
      return "from-neutral-700 to-neutral-800";
    }
  };

  const getBadgeColor = () => {
    if (location.head_office === "yes") return "bg-indigo-100 text-gray border-indigo-200";
    return "bg-neutral-100 text-gray border-neutral-200";
  };

  const managerName = location.user?.name || "No manager assigned";
  const managerEmail = location.user?.email;

  return (
    <div
      className={`relative rounded-2xl transition-all duration-300 cursor-pointer group
        ${selected 
          ? "ring-2 ring-black ring-offset-2 ring-offset-white shadow-xl shadow-black/10" 
          : "hover:ring-2 hover:ring-neutral-200 hover:ring-offset-1 hover:shadow-lg"}`}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onSelect();
      }}
      role="button"
      tabIndex={0}
    >
      <div
        className={`relative bg-white rounded-2xl border-2 transition-all p-4
        ${selected 
          ? "border-black shadow-lg" 
          : "border-neutral-200 hover:border-neutral-300"}`}
      >
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className="relative flex-shrink-0">
            <div
              className={`w-14 h-14 rounded-xl bg-gradient-to-br ${getGradient()} 
              flex items-center justify-center shadow-lg
              ${selected ? "scale-110 ring-2 ring-black ring-offset-2" : "group-hover:scale-105"} transition-all duration-300`}
            >
              {getIcon()}
            </div>
            {selected && (
              <div className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-black rounded-full 
                flex items-center justify-center ring-2 ring-white shadow-md">
                <Check className="h-3.5 w-3.5 text-white" />
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="font-bold text-gray text-base truncate">
                  {location.location_name || "Unnamed location"}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold border ${getBadgeColor()}`}>
                    {location.head_office === "yes" ? "Head Office" : "Branch"}
                  </span>
                  <span className={`inline-flex items-center gap-1.5 text-xs font-bold
                    ${location.location_status === "on" ? "text-gray" : "text-neutral-400"}`}>
                    <span className={`w-2 h-2 rounded-full ${location.location_status === "on" ? "bg-black" : "bg-neutral-300"}`} />
                    {location.location_status === "on" ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>
            </div>

            {/* Manager */}
            {location.user && (
              <div className="flex items-center gap-2.5 mt-3">
                <div className="w-7 h-7 rounded-full bg-black flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                  {managerName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-xs font-bold text-gray">{managerName}</p>
                  {managerEmail && <p className="text-[10px] text-neutral-500">{managerEmail}</p>}
                </div>
              </div>
            )}

            {/* Address */}
            {location.address && (
              <div className="flex items-start gap-2 mt-3 text-xs text-gray">
                <MapPin className="h-4 w-4 text-neutral-400 flex-shrink-0 mt-0.5" />
                <span className="font-medium">
                  {[location.address, location.city, location.state].filter(Boolean).join(", ")}
                </span>
              </div>
            )}

            {/* Contact */}
            <div className="flex flex-wrap gap-4 mt-3">
              {location.phone && (
                <div className="flex items-center gap-1.5 text-xs font-medium text-gray">
                  <Phone className="h-3.5 w-3.5 text-neutral-400" />
                  {location.phone}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Selected indicator */}
        {selected && (
          <div className="absolute top-4 right-4">
            <div className="w-8 h-8 bg-black rounded-xl flex items-center justify-center shadow-lg">
              <Check className="h-4 w-4 text-white" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ==============================================
// Product Card Component - Enhanced UI with Black Text
// ==============================================

const ModernProductCard: React.FC<{
  product: Product;
  isSelected: boolean;
  quantity: number;
  onQuantityChange: (quantity: number) => void;
  onToggleSelect: () => void;
  formatCurrency: (amount: number) => string;
}> = ({ product, isSelected, quantity, onQuantityChange, onToggleSelect, formatCurrency }) => {
  const stockQty = toNumber(product.stock_quantity);
  const price = toNumber(product.price);
  const discount = toNumber(product.discount_percentage);
  const discountedPrice = discount > 0 ? price - (price * discount / 100) : price;

  return (
    <div
      className={`bg-white rounded-2xl border-2 transition-all duration-300 group
        ${isSelected 
          ? "border-black shadow-xl shadow-black/10 ring-1 ring-black/20" 
          : "border-neutral-200 hover:border-neutral-400 hover:shadow-lg"}`}
    >
      <div className="p-5">
        <div className="flex items-start gap-4">
          {/* Selection Checkbox */}
          <div className="flex-shrink-0 pt-1">
            <button
              onClick={onToggleSelect}
              className={`w-6 h-6 rounded-lg border-2 transition-all flex items-center justify-center
                ${isSelected 
                  ? "bg-black border-black text-white shadow-md" 
                  : "border-neutral-300 hover:border-black bg-white"}`}
              aria-label={isSelected ? "Deselect" : "Select"}
              type="button"
            >
              {isSelected && <Check className="h-4 w-4" />}
            </button>
          </div>

          {/* Product Image */}
          <div className="relative flex-shrink-0">
            <div className={`w-16 h-16 rounded-xl bg-neutral-100 flex items-center justify-center border-2 ${isSelected ? "border-black" : "border-neutral-200"} overflow-hidden`}>
              {product.image ? (
                <Image
                  src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/storage/${product.image}`}
                  alt={product.name}
                  width={64}
                  height={64}
                  className="object-cover"
                  unoptimized={process.env.NODE_ENV === "development"}
                />
              ) : (
                <Package className="h-7 w-7 text-neutral-300" />
              )}
            </div>
            
            {/* Badges */}
            <div className="absolute -top-2 -right-2 flex flex-col gap-1">
              {product.is_featured && (
                <span className="w-5 h-5 bg-black rounded-full flex items-center justify-center ring-2 ring-white shadow-md">
                  <Star className="h-2.5 w-2.5 text-white" />
                </span>
              )}
              {product.is_on_sale && (
                <span className="w-5 h-5 bg-black rounded-full flex items-center justify-center ring-2 ring-white shadow-md">
                  <Percent className="h-2.5 w-2.5 text-white" />
                </span>
              )}
            </div>
          </div>

          {/* Product Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h3 className="font-bold text-gray text-base truncate">
                  {product.name}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs px-2 py-1 bg-neutral-100 text-gray rounded-lg font-mono font-bold">
                    {product.sku}
                  </span>
                  {product.category && (
                    <span className="text-xs px-2 py-1 bg-black text-white rounded-lg font-bold">
                      {product.category.name}
                    </span>
                  )}
                </div>
              </div>

              {/* Price */}
              <div className="text-right flex-shrink-0">
                <div className="text-lg font-extrabold text-gray">
                  {formatCurrency(discountedPrice)}
                </div>
                {discount > 0 && (
                  <div className="flex items-center gap-1.5 justify-end">
                    <span className="text-xs text-neutral-400 line-through font-medium">
                      {formatCurrency(price)}
                    </span>
                    <span className="text-xs font-extrabold text-gray bg-black text-white px-2 py-0.5 rounded-lg">
                      -{discount}%
                    </span>
                  </div>
                )}
                {product.unit && (
                  <span className="text-xs text-neutral-500 font-medium">/{product.unit.symbol}</span>
                )}
              </div>
            </div>

            {/* Stock & Selection Status */}
            <div className="flex items-center gap-2.5 mt-3">
              <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold
                ${stockQty > 10 ? "bg-black text-white" : stockQty > 0 ? "bg-neutral-900 text-white" : "bg-neutral-200 text-gray"}`}>
                {stockQty > 0 ? <CheckCircle className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                {stockQty > 0 ? `${formatNumber(stockQty)} in stock` : "Out of stock"}
              </div>
              
              {product.low_stock_threshold && stockQty <= toNumber(product.low_stock_threshold) && stockQty > 0 && (
                <div className="flex items-center gap-1.5 text-xs font-bold text-gray">
                  <AlertCircle className="h-3.5 w-3.5" />
                  Low stock
                </div>
              )}
            </div>

            {/* Quantity Selector - Shown when selected */}
            {isSelected && (
              <div className="mt-4 pt-4 border-t-2 border-neutral-100">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-xs font-extrabold text-gray">Quantity</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onQuantityChange(Math.max(0, quantity - 1))}
                      disabled={quantity === 0}
                      className="w-8 h-8 rounded-xl bg-black flex items-center justify-center hover:bg-neutral-800 
                        transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                      type="button"
                    >
                      <Minus className="h-4 w-4 text-white" />
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
                      className="w-16 h-8 text-center border-2 border-black rounded-xl text-sm font-bold text-gray
                        focus:ring-2 focus:ring-black/20 focus:border-black outline-none bg-white"
                      aria-label="Product quantity"
                    />
                    <button
                      onClick={() => onQuantityChange(Math.min(stockQty, quantity + 1))}
                      disabled={quantity >= stockQty}
                      className="w-8 h-8 rounded-xl bg-black flex items-center justify-center hover:bg-neutral-800 
                        transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                      type="button"
                    >
                      <Plus className="h-4 w-4 text-white" />
                    </button>
                  </div>
                </div>

                {quantity === 0 && (
                  <p className="mt-3 text-xs text-neutral-500 font-medium flex items-center gap-1.5">
                    <Info className="h-3.5 w-3.5" />
                    Product will be added with default quantity (0)
                  </p>
                )}

                {quantity > stockQty && (
                  <div className="mt-3 flex items-center gap-2 text-xs font-bold text-gray bg-neutral-100 p-3 rounded-xl">
                    <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                    Quantity exceeds stock ({formatNumber(stockQty)})
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ==============================================
// Stats Card - Enhanced with Black Text
// ==============================================

const StatCard: React.FC<{
  title: string;
  value: string | number | React.ReactNode;
  icon: React.ElementType;
  color: "black" | "neutral" | "indigo" | "emerald";
  subtitle?: string;
}> = ({ title, value, icon: Icon, color, subtitle }) => {
  const colorClasses = {
    black: "bg-black text-white",
    neutral: "bg-neutral-100 text-gray",
    indigo: "bg-indigo-600 text-white",
    emerald: "bg-emerald-600 text-white",
  };

  return (
    <div className="bg-white rounded-2xl border-2 border-neutral-200 shadow-sm p-5 hover:shadow-xl hover:border-black transition-all">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-extrabold text-neutral-400 uppercase tracking-wider">{title}</p>
          <div className="text-2xl font-extrabold text-gray mt-1">{value}</div>
          {subtitle && <p className="text-xs text-neutral-500 font-medium mt-1">{subtitle}</p>}
        </div>
        <div className={`w-12 h-12 ${colorClasses[color]} rounded-xl flex items-center justify-center shadow-md`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
};

// ==============================================
// Empty State - Enhanced
// ==============================================

const EmptyState: React.FC<{
  title: string;
  description: string;
  icon: React.ElementType;
  action?: { label: string; onClick?: () => void };
}> = ({ title, description, icon: Icon, action }) => (
  <div className="bg-white rounded-2xl border-2 border-neutral-200 shadow-sm py-20">
    <div className="flex flex-col items-center text-center max-w-sm mx-auto px-4">
      <div className="w-20 h-20 bg-black rounded-2xl flex items-center justify-center mb-5 shadow-lg">
        <Icon className="h-10 w-10 text-white" />
      </div>
      <h3 className="text-lg font-extrabold text-gray mb-2">{title}</h3>
      <p className="text-sm text-neutral-500 font-medium mb-7">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="inline-flex items-center gap-2.5 px-6 py-3 bg-black text-white text-sm font-extrabold 
            rounded-xl hover:bg-neutral-800 transition-all shadow-lg shadow-black/20"
          type="button"
        >
          {action.label}
        </button>
      )}
    </div>
  </div>
);

// ==============================================
// Loading State - Enhanced
// ==============================================

const LoadingState: React.FC = () => (
  <div className="bg-white rounded-2xl border-2 border-neutral-200 shadow-sm py-20">
    <div className="flex flex-col items-center justify-center">
      <div className="relative">
        <div className="w-20 h-20 rounded-full border-4 border-neutral-100" />
        <div className="absolute inset-0 w-20 h-20 rounded-full border-4 border-black border-t-transparent animate-spin" />
        <Package className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-7 w-7 text-gray/30" />
      </div>
      <p className="mt-5 text-sm font-extrabold text-gray">Loading products</p>
      <p className="text-xs text-neutral-400 font-medium mt-1">Please wait a moment</p>
    </div>
  </div>
);

// ==============================================
// Confirmation Modal - Enhanced
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
}> = ({ isOpen, onClose, onConfirm, selectedProducts, productsWithQuantity, totalUnits, location, isSubmitting }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50 p-4" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border-2 border-black">
        <div className="p-7 text-center">
          <div className="w-20 h-20 flex items-center justify-center rounded-2xl bg-black border-2 border-black mx-auto mb-5 shadow-lg">
            <Send className="w-9 h-9 text-white" />
          </div>
          
          <h2 className="text-xl font-extrabold text-gray mb-2">Confirm Distribution</h2>
          <p className="text-sm text-neutral-500 font-medium mb-1">Send products to</p>
          <p className="font-extrabold text-gray text-lg">{location?.location_name}</p>
          
          <div className="mt-5 bg-neutral-50 rounded-2xl p-5 space-y-3 text-left border border-neutral-200">
            <div className="flex justify-between text-sm">
              <span className="text-neutral-500 font-medium">Selected Products</span>
              <span className="font-extrabold text-gray">{selectedProducts}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-neutral-500 font-medium">With Quantity</span>
              <span className="font-extrabold text-gray">{productsWithQuantity}</span>
            </div>
            {totalUnits > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-neutral-500 font-medium">Total Units</span>
                <span className="font-extrabold text-gray">{formatNumber(totalUnits)}</span>
              </div>
            )}
          </div>

          {selectedProducts > 0 && productsWithQuantity < selectedProducts && (
            <p className="mt-4 text-xs font-bold text-gray bg-neutral-100 p-3 rounded-xl flex items-start gap-2 border border-neutral-200">
              <Info className="h-4 w-4 flex-shrink-0 mt-0.5" />
              {selectedProducts - productsWithQuantity} product(s) will be added with default quantity (0).
            </p>
          )}

          <div className="flex gap-3 mt-6">
            <button onClick={onClose} disabled={isSubmitting}
              className="flex-1 px-5 py-3 rounded-xl border-2 border-neutral-200 bg-white text-gray text-sm font-extrabold hover:bg-neutral-50 transition disabled:opacity-50">
              Cancel
            </button>
            <button onClick={onConfirm} disabled={isSubmitting}
              className="flex-1 px-5 py-3 rounded-xl bg-black text-white text-sm font-extrabold hover:bg-neutral-800 transition 
                disabled:opacity-50 inline-flex items-center justify-center gap-2 shadow-lg shadow-black/20">
              {isSubmitting ? <><Loader2 className="h-4 w-4 animate-spin" />Processing...</> : <><Check className="h-4 w-4" />Confirm</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==============================================
// Main Component - Enhanced UI with Black Text
// ==============================================

const AddToLocations = ({ user }: { user: User }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const formatCurrency = useCallback((amount: number): string => {
    const currencySymbol = user?.businesses_one?.[0]?.currency || "$";
    return new Intl.NumberFormat("en-US", {
      style: "currency", currency: "USD",
      minimumFractionDigits: 2, maximumFractionDigits: 2,
    }).format(amount).replace(/^\$/, currencySymbol);
  }, [user]);

  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<Record<number, boolean>>({});
  const [productQuantities, setProductQuantities] = useState<Record<number, number>>({});

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [locationSearch, setLocationSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<"name" | "price" | "stock">("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const debouncedSearch = useDebounce(searchQuery, 400);
  const debouncedLocationSearch = useDebounce(locationSearch, 300);

  const buildProductQueryString = useCallback(() => {
    const params = new URLSearchParams();
    params.append("per_page", "200");
    if (debouncedSearch) params.append("search", debouncedSearch);
    if (selectedCategory !== "all" && selectedCategory) params.append("category", selectedCategory);
    params.append("sort_by", sortBy === "price" ? "price" : sortBy === "stock" ? "stock_quantity" : "name");
    params.append("sort_order", sortOrder);
    params.append("status", "active");
    return params.toString();
  }, [debouncedSearch, selectedCategory, sortBy, sortOrder]);

  const fetchProducts = useCallback(async () => {
    try {
      const res = await apiGet(`/products?${buildProductQueryString()}`, {}, false);
      const responseData = res.data?.data || res.data || res;
      let productsList: Product[] = [];
      if (Array.isArray(responseData)) productsList = responseData;
      else if (responseData?.data) productsList = responseData.data;
      else if (responseData?.products) productsList = responseData.products;
      setProducts(productsList);
    } catch { toast.error("Failed to fetch products"); setProducts([]); }
  }, [buildProductQueryString]);

  const fetchCategories = async () => {
    try {
      const res = await apiGet("/product-categories", {}, false);
      const arr = res.data?.data?.product_categories ?? res.data?.data ?? [];
      setCategories(Array.isArray(arr) ? arr : []);
    } catch { setCategories([]); }
  };

  const fetchLocations = useCallback(async () => {
    try {
      const queryString = debouncedLocationSearch ? `?search=${encodeURIComponent(debouncedLocationSearch)}` : '';
      const res = await apiGet(`/locations_without_main${queryString}`, {}, false);
      let list: Location[] = [];
      if (Array.isArray(res.data)) list = res.data;
      else if (res.data?.data) list = res.data.data;
      else if (res.data?.locations) list = res.data.locations;
      setLocations(list);
    } catch { setLocations([]); }
  }, [debouncedLocationSearch]);

  useEffect(() => {
    setIsLoading(true);
    Promise.all([fetchProducts(), fetchCategories(), fetchLocations()]).finally(() => setIsLoading(false));
  }, []);
  useEffect(() => { setIsLoading(true); fetchProducts().finally(() => setIsLoading(false)); }, [debouncedSearch, selectedCategory, sortBy, sortOrder]);
  useEffect(() => { fetchLocations(); }, [debouncedLocationSearch]);

  const handleLocationSelect = (loc: Location) => setSelectedLocation(loc);
  const handleProductSelect = (id: number) => {
    setSelectedProducts(prev => {
      const next = !prev[id];
      if (!next) setProductQuantities(prevQ => { const n = { ...prevQ }; delete n[id]; return n; });
      return { ...prev, [id]: next };
    });
  };
  const handleQuantityChange = (id: number, qty: number) => setProductQuantities(prev => ({ ...prev, [id]: qty }));
  const selectAll = () => { const s: Record<number, boolean> = {}; products.forEach(p => s[p.id] = true); setSelectedProducts(s); };
  const deselectAll = () => { setSelectedProducts({}); setProductQuantities({}); };

  const selCount = Object.keys(selectedProducts).filter(k => selectedProducts[+k]).length;
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
      const items = Object.keys(selectedProducts).filter(k => selectedProducts[+k]).map(k => ({
        product_id: +k, quantity: productQuantities[+k] || 0,
      }));
      await apiPost("/distributeProducts", { destination_location_id: selectedLocation!.id, items, notes: `Distribution to ${selectedLocation!.location_name}` }, {}, ["/distributeProducts"]);
      toast.success(`Successfully distributed to ${selectedLocation!.location_name}`);
      setSelectedLocation(null); setSelectedProducts({}); setProductQuantities({}); setShowConfirmation(false);
      await fetchProducts();
    } catch (err) {
      toast.error((err as ApiError).response?.data?.message || "Failed to distribute");
    } finally { setIsSubmitting(false); }
  };

  return (
    <div className="min-h-screen bg-neutral-50 pb-28">
      {/* Header */}
      <header className="bg-white border-b-2 border-neutral-200  top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/products" className="p-2.5 text-neutral-400 hover:text-gray hover:bg-neutral-100 rounded-xl transition-colors border border-transparent hover:border-neutral-200">
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div>
                <h1 className="text-xl font-extrabold text-gray">Add Products to Location</h1>
                <p className="text-xs text-neutral-500 font-medium">Select products and destination to distribute</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setShowFilters(!showFilters)}
                className={`p-2.5 rounded-xl transition-all border-2 ${showFilters ? "bg-black text-white border-black shadow-md" : "text-neutral-500 hover:bg-neutral-100 border-neutral-200 hover:border-black"}`}>
                <SlidersHorizontal className="h-4 w-4" />
              </button>
              <button onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
                className="p-2.5 text-neutral-500 hover:bg-neutral-100 rounded-xl border-2 border-neutral-200 hover:border-black transition">
                {viewMode === "grid" ? <List className="h-4 w-4" /> : <Grid3x3 className="h-4 w-4" />}
              </button>
              <button onClick={() => { fetchProducts(); fetchLocations(); }}
                className="p-2.5 text-neutral-500 hover:bg-neutral-100 rounded-xl border-2 border-neutral-200 hover:border-black transition">
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-7">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
          <StatCard title="Products" value='Unlimted' icon={Package} color="black" subtitle="Available" />
          <StatCard title="Location" value={selectedLocation?.location_name || "None"} icon={MapPin} color="neutral" subtitle={selectedLocation?.head_office === "yes" ? "Head Office" : "Select one"} />
          <StatCard title="Selected" value={formatNumber(selCount)} icon={CheckCircle} color="neutral" subtitle={`${qtyCount} with qty`} />
          <StatCard title="Units" value={formatNumber(totalUnits)} icon={Box} color="black" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Locations Panel */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border-2 border-neutral-200 shadow-sm overflow-hidden sticky top-28">
              <div className="p-5 border-b-2 border-neutral-100 bg-gradient-to-r from-black/5 to-transparent">
                <h3 className="font-extrabold text-gray flex items-center gap-2.5 text-base">
                  <Building2 className="h-5 w-5 text-gray" />
                  Select Destination
                </h3>
                <p className="text-xs text-neutral-500 font-medium mt-1">Choose one location</p>
              </div>
              <div className="p-4">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 h-4 w-4" />
                  <input type="text" value={locationSearch} onChange={e => setLocationSearch(e.target.value)}
                    placeholder="Search locations..."
                    className="w-full pl-10 pr-9 py-3 text-sm font-medium border-2 border-neutral-200 rounded-xl focus:ring-2 focus:ring-black/20 focus:border-black outline-none placeholder:text-neutral-400" />
                  {locationSearch && (
                    <button onClick={() => setLocationSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-gray">
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
              <div className="px-4 pb-4 space-y-3 max-h-[58vh] overflow-y-auto">
                {locations.map(loc => (
                  <LocationCard key={loc.id} location={loc} selected={selectedLocation?.id === loc.id} onSelect={() => handleLocationSelect(loc)} />
                ))}
                {locations.length === 0 && !isLoading && (
                  <div className="text-center py-10">
                    <MapPin className="h-12 w-12 text-neutral-200 mx-auto mb-4" />
                    <p className="text-sm text-neutral-400 font-medium">No locations found</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Products Panel */}
          <div className="lg:col-span-2 space-y-5">
            <div className="bg-white rounded-2xl border-2 border-neutral-200 shadow-sm overflow-hidden">
              <div className="p-5 border-b-2 border-neutral-100">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 h-4.5 w-4.5" />
                    <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                      placeholder="Search by name, SKU, description..."
                      className="w-full pl-10 pr-9 py-3 text-sm font-medium border-2 border-neutral-200 rounded-xl focus:ring-2 focus:ring-black/20 focus:border-black outline-none placeholder:text-neutral-400" />
                    {searchQuery && (
                      <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-gray">
                        <X className="h-4.5 w-4.5" />
                      </button>
                    )}
                  </div>
                  <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)}
                    className="px-4 py-3 text-sm font-medium border-2 border-neutral-200 rounded-xl focus:ring-2 focus:ring-black/20 focus:border-black outline-none bg-white hover:border-black transition">
                    <option value="all">All Categories</option>
                    {categories.map(c => <option key={c.id} value={c.id.toString()}>{c.name}</option>)}
                  </select>
                </div>

                {showFilters && (
                  <div className="mt-4 pt-4 border-t-2 border-neutral-100 grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-extrabold text-neutral-400 uppercase tracking-wider mb-2 block">Sort By</label>
                      <select value={sortBy} onChange={e => setSortBy(e.target.value as typeof sortBy)}
                        className="w-full px-4 py-2.5 text-sm font-medium border-2 border-neutral-200 rounded-xl hover:border-black transition">
                        <option value="name">Name</option>
                        <option value="price">Price</option>
                        <option value="stock">Stock</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-extrabold text-neutral-400 uppercase tracking-wider mb-2 block">Order</label>
                      <select value={sortOrder} onChange={e => setSortOrder(e.target.value as typeof sortOrder)}
                        className="w-full px-4 py-2.5 text-sm font-medium border-2 border-neutral-200 rounded-xl hover:border-black transition">
                        <option value="asc">Ascending</option>
                        <option value="desc">Descending</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {products.length > 0 && (
                <div className="px-5 py-3 bg-neutral-50 border-b-2 border-neutral-100 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs font-extrabold text-neutral-500">Selection:</span>
                    <button onClick={selectAll} className="px-3 py-1.5 text-xs font-extrabold bg-white border-2 border-neutral-200 rounded-lg hover:bg-black hover:text-white hover:border-black transition flex items-center gap-1.5">
                      <Check className="h-3.5 w-3.5" /> All
                    </button>
                    <button onClick={deselectAll} className="px-3 py-1.5 text-xs font-extrabold bg-white border-2 border-neutral-200 rounded-lg hover:bg-black hover:text-white hover:border-black transition flex items-center gap-1.5">
                      <X className="h-3.5 w-3.5" /> None
                    </button>
                  </div>
                  <span className="text-xs font-medium text-neutral-600">
                    {selCount} selected {qtyCount > 0 && `• ${qtyCount} with qty`} {totalUnits > 0 && `• ${formatNumber(totalUnits)} units`}
                  </span>
                </div>
              )}
            </div>

            {isLoading ? <LoadingState /> : products.length === 0 ? (
              <EmptyState title={searchQuery ? "No results" : "No products"} description={searchQuery ? `Nothing matches "${searchQuery}"` : "No products available"}
                icon={Package} action={searchQuery ? { label: "Clear Search", onClick: () => setSearchQuery("") } : undefined} />
            ) : (
              <div className={viewMode === "grid" ? "space-y-3" : "space-y-3"}>
                {products.map(p => (
                  <ModernProductCard key={p.id} product={p} isSelected={!!selectedProducts[p.id]}
                    quantity={productQuantities[p.id] || 0} onQuantityChange={q => handleQuantityChange(p.id, q)}
                    onToggleSelect={() => handleProductSelect(p.id)} formatCurrency={formatCurrency} />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Sticky Bottom Bar - Enhanced */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/98 backdrop-blur-md border-t-2 border-neutral-200 shadow-2xl py-4 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-5">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-black rounded-xl flex items-center justify-center shadow-md">
                <MapPin className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-xs font-extrabold text-neutral-400 uppercase tracking-wider">Destination</p>
                <p className="text-sm font-extrabold text-gray">{selectedLocation?.location_name || "Not selected"}</p>
              </div>
            </div>
            <div className="h-10 w-px bg-neutral-200" />
            <div>
              <p className="text-xs font-extrabold text-neutral-400 uppercase tracking-wider">Products</p>
              <p className="text-sm font-extrabold text-gray">{formatNumber(products.length)} found plus</p>
            </div>
            {selCount > 0 && (
              <>
                <div className="h-10 w-px bg-neutral-200" />
                <div>
                  <p className="text-xs font-extrabold text-neutral-400 uppercase tracking-wider">Selected</p>
                  <p className="text-sm font-extrabold text-gray">{selCount} products</p>
                </div>
              </>
            )}
            {totalUnits > 0 && (
              <>
                <div className="h-10 w-px bg-neutral-200" />
                <div>
                  <p className="text-xs font-extrabold text-neutral-400 uppercase tracking-wider">Units</p>
                  <p className="text-sm font-extrabold text-gray">{formatNumber(totalUnits)}</p>
                </div>
              </>
            )}
          </div>
          <button onClick={handleDistribute} disabled={!selectedLocation || selCount === 0 || isSubmitting}
            className="px-7 py-3 bg-black text-white text-sm font-extrabold rounded-xl hover:bg-neutral-800 transition-all 
              disabled:bg-neutral-300 disabled:cursor-not-allowed shadow-lg shadow-black/20 inline-flex items-center gap-2.5">
            {isSubmitting ? <><Loader2 className="h-4.5 w-4.5 animate-spin" />Processing...</> : <><Send className="h-4.5 w-4.5" />Distribute</>}
          </button>
        </div>
      </div>

      <ConfirmationModal isOpen={showConfirmation} onClose={() => setShowConfirmation(false)}
        onConfirm={confirmDistribution} selectedProducts={selCount} productsWithQuantity={qtyCount}
        totalUnits={totalUnits} location={selectedLocation} isSubmitting={isSubmitting} />
    </div>
  );
};

export default withAuth(AddToLocations);