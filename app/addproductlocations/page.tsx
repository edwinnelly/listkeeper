"use client";
import { withAuth } from "@/hoc/withAuth";
import { apiGet, apiPost } from "@/lib/axios";
import React, { useState, useEffect, useMemo } from "react";
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
  name: string;
  location_name: string;
  type?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
  phone?: string;
  email?: string;
  manager_name?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
  distance?: number;
  capacity?: number;
  current_stock?: number;
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
// Sub-components
// ==============================================

const LocationCard: React.FC<{
  location: Location;
  selected: boolean;
  onSelect: () => void;
}> = ({ location, selected, onSelect }) => {
  const getIcon = () => {
    if (location.type?.toLowerCase().includes("warehouse")) {
      return <Warehouse className="h-5 w-5 text-white" />;
    } else if (location.type?.toLowerCase().includes("store")) {
      return <Store className="h-5 w-5 text-white" />;
    } else if (location.type?.toLowerCase().includes("office")) {
      return <Briefcase className="h-5 w-5 text-gray-600" />;
    } else {
      return <Home className="h-5 w-5 text-white" />;
    }
  };

  const getGradient = () => {
    if (location.type?.toLowerCase().includes("warehouse")) {
      return "from-gray-500 to-gray-600";
    } else if (location.type?.toLowerCase().includes("store")) {
      return "from-gray-500 to-gray-600";
    } else if (location.type?.toLowerCase().includes("office")) {
      return "from-gray-500 to-gray-600";
    } else {
      return "from-gray-500 to-gray-600";
    }
  };

  return (
    <div
      className={`relative rounded-2xl transition-all duration-300 cursor-pointer group
        ${
          selected
            ? "ring-2 ring-gray-600 ring-offset-2"
            : "hover:ring-2 hover:ring-stone-200 hover:ring-offset-2"
        }`}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          onSelect();
        }
      }}
      role="button"
      tabIndex={0}
    >
      {/* Background Pattern */}
      <div
        className="absolute inset-0 bg-gradient-to-br opacity-5 rounded-2xl pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, ${selected ? "#3b82f6" : "#9ca3af"} 1px, transparent 0)`,
          backgroundSize: "24px 24px",
        }}
      />

      <div
        className={`relative bg-white rounded-2xl border-2 transition-all p-5
        ${
          selected
            ? "border-gray-600 shadow-lg shadow-gray-600/10"
            : "border-stone-200 shadow-sm hover:shadow-md hover:border-stone-300"
        }`}
      >
        <div className="flex items-start gap-4">
          {/* Icon with gradient */}
          <div className={`relative flex-shrink-0`}>
            <div
              className={`w-14 h-14 rounded-xl bg-gradient-to-br ${getGradient()} 
              flex items-center justify-center text-white shadow-lg
              ${selected ? "scale-110" : "group-hover:scale-105"} transition-transform duration-300`}
            >
              {getIcon()}
            </div>
            {selected && (
              <div
                className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full 
                flex items-center justify-center ring-2 ring-white"
              >
                <Check className="h-3 w-3 text-white" />
              </div>
            )}
          </div>

          {/* Location Info */}
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-stone-900 text-lg">
                  <ShortTextWithTooltip
                    text={location?.location_name || "Unnamed location"}
                    max={25}
                  />
                </h3>

                <p className="text-sm text-stone-500 mt-0.5 capitalize">
                  <ShortTextWithTooltip
                    text={location?.type || "Location"}
                    max={25}
                  />
                </p>
              </div>
            </div>

            {/* Address */}
            {location.address && (
              <div className="flex items-start gap-1.5 mt-2 text-xs text-stone-600">
                <MapPin className="h-3.5 w-3.5 text-gray-700-500 flex-shrink-0 mt-0.5" />
                <span>
                  <ShortTextWithTooltip
                    text={
                      [
                        location?.address,
                        location?.city,
                        location?.state,
                        location?.country,
                      ]
                        .filter(Boolean)
                        .join(", ") || "No address"
                    }
                    max={80}
                  />
                </span>
              </div>
            )}

            {/* Contact Info */}
            <div className="flex flex-wrap gap-3 mt-2">
              {location.phone && (
                <div className="flex items-center gap-1 text-xs text-stone-600">
                  <Phone className="h-3.5 w-3.5 text-gray-700-500" />
                  {location.phone}
                </div>
              )}
              {location.email && (
                <div className="flex items-center gap-1 text-xs text-stone-600">
                  <Mail className="h-3.5 w-3.5 text-gray-700-500" />
                  {location.email}
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="flex gap-4 mt-3 pt-3 border-t border-stone-100">
              {location.current_stock !== undefined && (
                <div>
                  <span className="text-xs text-stone-500">Current Stock</span>
                  <p className="text-sm font-semibold text-stone-900">
                    {formatNumber(location.current_stock)} units
                  </p>
                </div>
              )}
              {location.capacity !== undefined && (
                <div>
                  <span className="text-xs text-stone-500">Capacity</span>
                  <p className="text-sm font-semibold text-stone-900">
                    {formatNumber(location.capacity)} units
                  </p>
                </div>
              )}
              {location.distance !== undefined && (
                <div>
                  <span className="text-xs text-stone-500">Distance</span>
                  <p className="text-sm font-semibold text-stone-900">
                    {location.distance} km
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Selected indicator */}
        {selected && (
          <div className="absolute top-3 right-3">
            <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
              <Check className="h-4 w-4 text-white" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Modern Product Card with Selection Toggle (no quantity required)
const ModernProductCard: React.FC<{
  product: Product;
  isSelected: boolean;
  quantity: number;
  onQuantityChange: (quantity: number) => void;
  onToggleSelect: () => void;
  formatCurrency: (amount: number) => string;
}> = ({
  product,
  isSelected,
  quantity,
  onQuantityChange,
  onToggleSelect,
  formatCurrency,
}) => {
  const stockQty = toNumber(product.stock_quantity);
  const price = toNumber(product.price);
  const discount = toNumber(product.discount_percentage);

  const handleQuantityInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const value = parseInt(e.target.value) || 0;
    onQuantityChange(Math.min(stockQty, Math.max(0, value)));
  };

  const handleIncrement = () => {
    onQuantityChange(Math.min(stockQty, quantity + 1));
  };

  const handleDecrement = () => {
    onQuantityChange(Math.max(0, quantity - 1));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      onToggleSelect();
    }
  };

  return (
    <div
      className={`bg-white rounded-2xl border-2 transition-all duration-300 group
        ${isSelected ? "border-gray-600 shadow-lg shadow-gray-600/5" : "border-stone-200 hover:border-stone-300 hover:shadow-md"}
      `}
    >
      <div className="p-5">
        <div className="flex items-start gap-4">
          {/* Selection Checkbox */}
          <div className="flex-shrink-0 pt-1">
            <button
              onClick={onToggleSelect}
              onKeyDown={handleKeyDown}
              className={`w-6 h-6 rounded-lg border-2 transition-all flex items-center justify-center
                ${
                  isSelected
                    ? "bg-gray-600 border-gray-600 text-white"
                    : "border-stone-300 hover:border-gray-600 bg-white"
                }`}
              aria-label={isSelected ? "Deselect product" : "Select product"}
              type="button"
            >
              {isSelected && <Check className="h-4 w-4" />}
            </button>
          </div>

          {/* Product Image/Icon */}
          <div className="relative flex-shrink-0">
            <div
              className={`w-16 h-16 rounded-xl bg-gradient-to-br from-gray-600/10 to-gray-600/5 
              flex items-center justify-center border-2 ${isSelected ? "border-gray-600" : "border-stone-200"}
              transition-transform duration-300`}
            >
              {product.image ? (
                <div className="relative w-full h-full">
                  <Image
                    src={`http://localhost:8000/storage/${product.image}`}
                    alt={product.name}
                    fill
                    className="object-cover rounded-xl"
                    sizes="64px"
                    unoptimized={process.env.NODE_ENV === "development"}
                  />
                </div>
              ) : (
                <Package
                  className={`h-8 w-8 ${isSelected ? "text-gray-700-600" : "text-stone-400"}`}
                />
              )}
            </div>

            {/* Badges */}
            <div className="absolute -top-2 -right-2 flex flex-col gap-1">
              {product.is_featured && (
                <span className="w-6 h-6 bg-gray-500 rounded-full flex items-center justify-center ring-2 ring-white">
                  <Star className="h-3 w-3 text-white" />
                </span>
              )}
              {product.is_on_sale && (
                <span className="w-6 h-6 bg-gray-500 rounded-full flex items-center justify-center ring-2 ring-white">
                  <Tag className="h-3 w-3 text-white" />
                </span>
              )}
            </div>
          </div>

          {/* Product Info */}
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-stone-900 text-lg">
                  <ShortTextWithTooltip text={product.name} max={45} />
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs px-2 py-1 bg-stone-100 text-stone-600 rounded-full">
                    SKU: {product.sku}
                  </span>
                  {product.category && (
                    <span className="text-xs px-2 py-1 bg-gray-600/10 text-gray-700-700 rounded-full">
                      {product.category.name}
                    </span>
                  )}
                </div>
              </div>

              {/* Price */}
              <div className="text-right">
                <span className="text-xl font-bold text-gray-700-700">
                  {formatCurrency(price)}
                </span>
                {product.unit && (
                  <span className="text-xs text-stone-500 ml-1">
                    /{product.unit.symbol}
                  </span>
                )}
                {discount > 0 && (
                  <div className="flex items-center gap-1 mt-1 justify-end">
                    <Percent className="h-3 w-3 text-gray-700-500" />
                    <span className="text-xs font-medium text-gray-700-600">
                      {discount}% off
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Stock Status */}
            <div className="flex items-center gap-3 mt-3">
              <div
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium
                ${
                  stockQty > 10
                    ? "bg-emerald-50 text-emerald-700"
                    : stockQty > 0
                      ? "bg-gray-50 text-gray-700-700"
                      : "bg-gray-50 text-gray-700-700"
                }`}
              >
                {stockQty > 0 ? (
                  <CheckCircle className="h-3.5 w-3.5" />
                ) : (
                  <XCircle className="h-3.5 w-3.5" />
                )}
                {stockQty > 0
                  ? `${formatNumber(stockQty)} in stock`
                  : "Out of stock"}
              </div>

              {product.low_stock_threshold &&
                stockQty <= toNumber(product.low_stock_threshold) &&
                stockQty > 0 && (
                  <div className="flex items-center gap-1 text-xs text-gray-700-600">
                    <AlertCircle className="h-3.5 w-3.5" />
                    Low stock threshold: {product.low_stock_threshold}
                  </div>
                )}
            </div>

            {/* Quantity Section - Only shown when product is selected */}
            {isSelected && (
              <div className="mt-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-stone-600">
                    Quantity (optional):
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleDecrement}
                      disabled={quantity === 0}
                      className="w-8 h-8 rounded-lg bg-stone-100 flex items-center justify-center hover:bg-stone-200 
                        transition disabled:opacity-50 disabled:cursor-not-allowed"
                      aria-label="Decrease quantity"
                      type="button"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <input
                      type="number"
                      min="0"
                      max={stockQty}
                      value={quantity}
                      onChange={handleQuantityInputChange}
                      className="w-20 h-8 text-center border border-stone-300 rounded-lg text-sm 
                        focus:ring-2 focus:ring-gray-600/20 focus:border-gray-600 outline-none"
                      placeholder="0"
                      aria-label="Product quantity"
                    />
                    <button
                      onClick={handleIncrement}
                      disabled={quantity >= stockQty}
                      className="w-8 h-8 rounded-lg bg-stone-100 flex items-center justify-center hover:bg-stone-200 
                        transition disabled:opacity-50 disabled:cursor-not-allowed"
                      aria-label="Increase quantity"
                      type="button"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Hint for no quantity */}
                {quantity === 0 && (
                  <p className="mt-2 text-xs text-stone-500 flex items-center gap-1">
                    <Info className="h-3 w-3" />
                    Product will be added with default quantity (0)
                  </p>
                )}

                {/* Warning for exceeding stock */}
                {quantity > stockQty && (
                  <div className="mt-3 flex items-center gap-2 text-xs text-gray-700-600 bg-gray-50 p-2 rounded-lg">
                    <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                    <span>
                      Quantity exceeds available stock ({formatNumber(stockQty)}{" "}
                      units)
                    </span>
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

// Stats Card - FIXED: Changed p to div to avoid hydration error
const StatCard: React.FC<{
  title: string;
  value: string | number | React.ReactNode;
  icon: React.ElementType;
  color: "primary" | "gray" | "emerald";
  subtitle?: string;
}> = ({ title, value, icon: Icon, color, subtitle }) => {
  const colorClasses = {
    primary: "bg-gray-600/10 text-gray-700-700",
    emerald: "bg-gray-50 text-gray-700-700",
    gray: "bg-gray-50 text-gray-700-700",
  };

  return (
    <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-stone-600">{title}</p>
          {/* Changed from p to div to prevent div inside p hydration error */}
          <div className="text-2xl font-bold text-stone-900 mt-1">{value}</div>
          {subtitle && (
            <p className="text-xs text-stone-500 mt-1">{subtitle}</p>
          )}
        </div>
        <div
          className={`w-12 h-12 ${colorClasses[color]} rounded-xl flex items-center justify-center`}
        >
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
};

// Empty State
const EmptyState: React.FC<{
  title: string;
  description: string;
  icon: React.ElementType;
  action?: {
    label: string;
    onClick?: () => void;
  };
}> = ({ title, description, icon: Icon, action }) => (
  <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-16">
    <div className="flex flex-col items-center text-center max-w-md mx-auto">
      <div className="w-24 h-24 bg-stone-100 rounded-2xl flex items-center justify-center mb-6">
        <Icon className="h-12 w-12 text-stone-400" />
      </div>
      <h3 className="text-xl font-semibold text-stone-900 mb-2">{title}</h3>
      <p className="text-stone-500 mb-8">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="px-6 py-3 bg-gray-600 text-white rounded-xl hover:bg-gray-700 
            transition-all shadow-lg shadow-gray-600/20 flex items-center gap-2"
          type="button"
        >
          <Plus className="h-5 w-5" />
          {action.label}
        </button>
      )}
    </div>
  </div>
);

// Loading State
const LoadingState: React.FC = () => (
  <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-16">
    <div className="flex flex-col items-center justify-center">
      <div className="relative">
        <div className="w-20 h-20 border-4 border-gray-600/20 border-t-gray-600 rounded-full animate-spin"></div>
        <Package className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-8 w-8 text-gray-700-600/60" />
      </div>
      <p className="mt-6 text-stone-600 font-medium">Loading your data...</p>
      <p className="text-stone-400 text-sm mt-2">Please wait a moment</p>
    </div>
  </div>
);

// Confirmation Modal
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
  isOpen,
  onClose,
  onConfirm,
  selectedProducts,
  productsWithQuantity,
  totalUnits,
  location,
  isSubmitting,
}) => {
  if (!isOpen) return null;

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-stone-900/40 backdrop-blur-sm z-50 p-4"
      onClick={handleOverlayClick}
      onKeyDown={handleKeyDown}
      role="presentation"
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md transform transition-all animate-scaleIn">
        <div className="p-6">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="w-20 h-20 flex items-center justify-center rounded-2xl bg-emerald-50 border border-emerald-200">
              <MapPin className="w-10 h-10 text-emerald-600" />
            </div>

            <div>
              <h2 className="text-2xl font-bold text-stone-900 mb-2">
                Confirm Distribution
              </h2>
              <p className="text-stone-600">
                You are about to distribute products to:
              </p>
              <p className="font-semibold text-gray-700-700 mt-1 text-lg">
                {location?.location_name}
              </p>
            </div>

            <div className="w-full bg-stone-50 rounded-xl p-5 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-stone-600">Selected Products:</span>
                <span className="font-semibold text-stone-900">
                  {selectedProducts}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-stone-600">Products with Quantity:</span>
                <span className="font-semibold text-stone-900">
                  {productsWithQuantity}
                </span>
              </div>
              {totalUnits > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-stone-600">Total Units:</span>
                  <span className="font-semibold text-emerald-600">
                    {formatNumber(totalUnits)}
                  </span>
                </div>
              )}
              {location?.address && (
                <div className="flex justify-between text-sm">
                  <span className="text-stone-600">Address:</span>
                  <span className="font-medium text-stone-900 text-right max-w-[200px]">
                    {location.address}
                    {location.city && `, ${location.city}`}
                  </span>
                </div>
              )}
            </div>

            {selectedProducts > 0 &&
              productsWithQuantity < selectedProducts && (
                <p className="text-sm text-gray-700-600 bg-gray-50 p-3 rounded-lg flex items-start gap-2">
                  <Info className="h-5 w-5 flex-shrink-0 mt-0.5" />
                  <span>
                    {selectedProducts - productsWithQuantity} product(s) will be
                    added with default quantity (0).
                  </span>
                </p>
              )}

            <div className="mt-4 flex flex-col sm:flex-row justify-center gap-3 w-full">
              <button
                onClick={onClose}
                className="px-6 py-3 rounded-xl border border-stone-300 bg-white text-stone-700 
                  font-medium hover:bg-stone-50 transition disabled:opacity-50 flex-1"
                disabled={isSubmitting}
                type="button"
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                className="px-6 py-3 rounded-xl bg-emerald-600 text-white font-medium 
                  flex items-center justify-center gap-2 hover:bg-emerald-700 transition 
                  disabled:opacity-50 shadow-lg shadow-emerald-500/25 flex-1"
                disabled={isSubmitting}
                type="button"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Check className="h-5 w-5" />
                    Confirm
                  </>
                )}
              </button>
            </div>
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

  // Format currency with user's preferred currency symbol
  const formatCurrency = (amount: number): string => {
    const currencySymbol = user?.businesses_one?.[0]?.currency || "$";

    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
      .format(amount)
      .replace(/^\$/, currencySymbol);
  };

  // Selection state
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(
    null,
  );
  const [selectedProducts, setSelectedProducts] = useState<
    Record<number, boolean>
  >({});
  const [productQuantities, setProductQuantities] = useState<
    Record<number, number>
  >({});

  // UI state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [locationSearch, setLocationSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<"name" | "price" | "stock">("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [showLowStock, setShowLowStock] = useState(false);
  const [showOutOfStock, setShowOutOfStock] = useState(true);

  const debouncedSearch = useDebounce(searchQuery, 300);
  const debouncedLocationSearch = useDebounce(locationSearch, 300);

  // Fetch data
  useEffect(() => {
    Promise.all([fetchProducts(), fetchCategories(), fetchLocations()]).finally(
      () => setIsLoading(false),
    );
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await apiGet("/products", {}, false);
      const productsArray =
        res.data?.data?.products ??
        res.data?.data ??
        res.data?.products ??
        res.data ??
        [];
      setProducts(Array.isArray(productsArray) ? productsArray : []);
    } catch {
      toast.error("Failed to fetch products");
      setProducts([]);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await apiGet("/product-categories", {}, false);
      const categoriesArray =
        res.data?.data?.product_categories ??
        res.data?.product_categories ??
        res.data?.data ??
        res.data ??
        [];
      setCategories(Array.isArray(categoriesArray) ? categoriesArray : []);
    } catch {
      setCategories([]);
    }
  };

  const fetchLocations = async () => {
    try {
      const res = await apiGet("/locations_without_main", {}, false);

      // Extract locations using a function
      // Define a type for the API response structure
      interface ApiResponse {
        data?: {
          data?: {
            locations?: Location[];
          };
          locations?: Location[];
        };
        locations?: Location[];
      }

      const extractLocations = (response: ApiResponse): Location[] => {
        const data = response?.data?.data || response?.data || response;
        return Array.isArray(data?.locations)
          ? data.locations
          : Array.isArray(data)
            ? data
            : [];
      };

      const locationsArray = extractLocations(res);
      setLocations(Array.isArray(locationsArray) ? locationsArray : []);
    } catch {
      setLocations([]);
    }
  };

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    const filtered = products.filter((product) => {
      const matchesSearch =
        !debouncedSearch ||
        product.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        product.sku.toLowerCase().includes(debouncedSearch.toLowerCase());

      const matchesCategory =
        selectedCategory === "all" ||
        product.category_id.toString() === selectedCategory;

      const stockQty = toNumber(product.stock_quantity);
      const matchesStock =
        (showOutOfStock || stockQty > 0) &&
        (!showLowStock ||
          (stockQty <= toNumber(product.low_stock_threshold) && stockQty > 0));

      return matchesSearch && matchesCategory && matchesStock;
    });

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case "name":
          comparison = a.name.localeCompare(b.name);
          break;
        case "price":
          comparison = toNumber(a.price) - toNumber(b.price);
          break;
        case "stock":
          comparison = toNumber(a.stock_quantity) - toNumber(b.stock_quantity);
          break;
        default:
          comparison = 0;
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });

    return filtered;
  }, [
    products,
    debouncedSearch,
    selectedCategory,
    sortBy,
    sortOrder,
    showLowStock,
    showOutOfStock,
  ]);

  // Filter locations
  const filteredLocations = useMemo(() => {
    return locations.filter(
      (location) =>
        !debouncedLocationSearch ||
        location.location_name
          .toLowerCase()
          .includes(debouncedLocationSearch.toLowerCase()) ||
        location.type
          ?.toLowerCase()
          .includes(debouncedLocationSearch.toLowerCase()) ||
        location.address
          ?.toLowerCase()
          .includes(debouncedLocationSearch.toLowerCase()) ||
        location.city
          ?.toLowerCase()
          .includes(debouncedLocationSearch.toLowerCase()) ||
        location.manager_name
          ?.toLowerCase()
          .includes(debouncedLocationSearch.toLowerCase()),
    );
  }, [locations, debouncedLocationSearch]);

  // Handle location selection (single only)
  const handleLocationSelect = (location: Location) => {
    setSelectedLocation(location);
  };

  // Handle product selection toggle
  const handleProductSelect = (productId: number) => {
    setSelectedProducts((prev) => {
      const newState = !prev[productId];
      // If deselecting, clear quantity
      if (!newState) {
        setProductQuantities((prevQtys) => {
          const newQtys = { ...prevQtys };
          delete newQtys[productId];
          return newQtys;
        });
      }
      return {
        ...prev,
        [productId]: newState,
      };
    });
  };

  // Handle quantity change
  const handleQuantityChange = (productId: number, quantity: number) => {
    setProductQuantities((prev) => ({
      ...prev,
      [productId]: quantity,
    }));
  };

  // Select all products
  const selectAllProducts = () => {
    const newSelected: Record<number, boolean> = {};
    filteredProducts.forEach((product) => {
      newSelected[product.id] = true;
    });
    setSelectedProducts(newSelected);
  };

  // Deselect all products
  const deselectAllProducts = () => {
    setSelectedProducts({});
    setProductQuantities({});
  };

  // Calculate totals
  const totalProducts = filteredProducts.length;
  const selectedProductsCount = Object.keys(selectedProducts).filter(
    (id) => selectedProducts[parseInt(id, 10)],
  ).length;
  const productsWithQuantityCount = Object.keys(productQuantities).length;
  const totalUnits = Object.values(productQuantities).reduce(
    (sum, qty) => sum + qty,
    0,
  );

  // Handle distribution
  const handleDistribute = async () => {
    if (!selectedLocation) {
      toast.error("Please select a destination location");
      return;
    }

    if (selectedProductsCount === 0) {
      toast.error("Please select at least one product");
      return;
    }

    setShowConfirmation(true);
  };

  const confirmDistribution = async () => {
    setIsSubmitting(true);
    try {
      // Prepare items - include all selected products
      // For products without quantity, quantity will be 0
      const items = Object.keys(selectedProducts)
        .filter((productId) => selectedProducts[parseInt(productId, 10)])
        .map((productId) => ({
          product_id: parseInt(productId, 10),
          quantity: productQuantities[parseInt(productId, 10)] || 0,
        }));

      const payload = {
        destination_location_id: selectedLocation!.id,
        items,
        notes: `Distribution to ${selectedLocation!.location_name}`,
      };

      await apiPost("/distributeProducts", payload, {}, [
        "/distributeProducts",
      ]);

      const productsWithQty = items.filter((item) => item.quantity > 0).length;
      const productsWithoutQty = items.filter(
        (item) => item.quantity === 0,
      ).length;

      toast.success(
        productsWithQty > 0
          ? `Successfully distributed ${totalUnits} units to ${selectedLocation!.location_name}`
          : `${productsWithoutQty} products added to ${selectedLocation!.location_name} (no quantities specified)`,
      );

      // Reset state
      setSelectedLocation(null);
      setSelectedProducts({});
      setProductQuantities({});
      setShowConfirmation(false);

      // Refresh data
      await fetchProducts();
    } catch (err) {
      const error = err as ApiError;
      toast.error(
        error.response?.data?.message || "Failed to distribute products",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 pb-28">
      {/* Header - Scrolls with content (no sticky class) */}
      <header className="bg-white border-b border-stone-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/products"
                className="p-2.5 text-stone-500 hover:text-stone-700 hover:bg-stone-100 
                  rounded-xl transition-colors"
                aria-label="Go back to products"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-stone-900">
                  Add product to location
                </h1>
                <p className="text-sm text-stone-500 mt-0.5">
                  Select products and a location to distribute
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`p-2.5 rounded-xl transition-all border ${
                  showFilters
                    ? "bg-gray-600 text-white border-gray-600"
                    : "text-stone-600 hover:text-stone-900 hover:bg-stone-100 border-stone-200"
                }`}
                aria-label="Toggle filters"
                type="button"
              >
                <SlidersHorizontal className="h-5 w-5" />
              </button>

              <button
                onClick={() =>
                  setViewMode(viewMode === "grid" ? "list" : "grid")
                }
                className="p-2.5 text-stone-600 hover:text-stone-900 hover:bg-stone-100 
                  rounded-xl border border-stone-200"
                aria-label={
                  viewMode === "grid"
                    ? "Switch to list view"
                    : "Switch to grid view"
                }
                type="button"
              >
                {viewMode === "grid" ? (
                  <List className="h-5 w-5" />
                ) : (
                  <Grid3x3 className="h-5 w-5" />
                )}
              </button>

              <button
                onClick={() => {
                  fetchProducts();
                  fetchCategories();
                  fetchLocations();
                  toast.success("Data refreshed");
                }}
                className="p-2.5 text-stone-600 hover:text-stone-900 hover:bg-stone-100 
                  rounded-xl border border-stone-200"
                aria-label="Refresh data"
                type="button"
              >
                <RefreshCw className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <StatCard
            title="Total Products"
            value={formatNumber(totalProducts)}
            icon={Package}
            color="primary"
            subtitle="Available in inventory"
          />
          <StatCard
            title="Selected Location"
            value={
              <ShortTextWithTooltip
                text={selectedLocation?.location_name || "None"}
                max={15}
              />
            }
            icon={MapPin}
            color="emerald"
            subtitle={selectedLocation?.type || "Choose a location"}
          />

          <StatCard
            title="Selected Products"
            value={formatNumber(selectedProductsCount)}
            icon={CheckCircle}
            color="gray"
            subtitle={`${productsWithQuantityCount} with quantity`}
          />
          <StatCard
            title="Total Units"
            value={formatNumber(totalUnits)}
            icon={Layers}
            color="gray"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Locations */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-stone-200 bg-gradient-to-r from-gray-600/5 to-transparent">
                <h3 className="font-semibold text-stone-900 flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-gray-700-600" />
                  Select Destination
                </h3>
                <p className="text-xs text-stone-500 mt-1">
                  Choose one location to distribute products to
                </p>
              </div>

              {/* Location Search */}
              <div className="p-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 h-4 w-4" />
                  <input
                    type="text"
                    value={locationSearch}
                    onChange={(e) => setLocationSearch(e.target.value)}
                    placeholder="Search locations..."
                    className="w-full pl-9 pr-4 py-3 text-sm border border-stone-300 rounded-xl 
                      focus:ring-2 focus:ring-gray-600/20 focus:border-gray-600 outline-none"
                    aria-label="Search locations"
                  />
                </div>
              </div>

              <div className="px-4 pb-4 space-y-3 max-h-[500px] overflow-y-auto">
                {filteredLocations.map((location) => (
                  <LocationCard
                    key={location.id}
                    location={location}
                    selected={selectedLocation?.id === location.id}
                    onSelect={() => handleLocationSelect(location)}
                  />
                ))}

                {filteredLocations.length === 0 && !isLoading && (
                  <div className="text-center py-12">
                    <MapPin className="h-16 w-16 text-stone-300 mx-auto mb-4" />
                    <p className="text-stone-500">No locations found</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Products */}
          <div className="lg:col-span-2 space-y-4">
            {/* Search and Filters */}
            <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-stone-200">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 h-4 w-4" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search products by name or SKU..."
                      className="w-full pl-9 pr-4 py-3 text-sm border border-stone-300 rounded-xl 
                        focus:ring-2 focus:ring-gray-600/20 focus:border-gray-600 outline-none"
                      aria-label="Search products"
                    />
                  </div>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="px-4 py-3 text-sm border border-stone-300 rounded-xl 
                      focus:ring-2 focus:ring-gray-600/20 focus:border-gray-600 outline-none bg-white"
                    aria-label="Select category"
                  >
                    <option value="all">All Categories</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id.toString()}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Expandable Filters */}
                {showFilters && (
                  <div className="mt-4 pt-4 border-t border-stone-200">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <label className="text-xs font-medium text-stone-500 mb-1 block">
                          Sort By
                        </label>
                        <select
                          value={sortBy}
                          onChange={(e) =>
                            setSortBy(
                              e.target.value as "name" | "price" | "stock",
                            )
                          }
                          className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg"
                          aria-label="Sort by"
                        >
                          <option value="name">Name</option>
                          <option value="price">Price</option>
                          <option value="stock">Stock</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-stone-500 mb-1 block">
                          Order
                        </label>
                        <select
                          value={sortOrder}
                          onChange={(e) =>
                            setSortOrder(e.target.value as "asc" | "desc")
                          }
                          className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg"
                          aria-label="Sort order"
                        >
                          <option value="asc">Ascending</option>
                          <option value="desc">Descending</option>
                        </select>
                      </div>
                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={showLowStock}
                            onChange={(e) => setShowLowStock(e.target.checked)}
                            className="rounded border-stone-300 text-gray-700-600 focus:ring-gray-600"
                          />
                          <span className="text-sm text-stone-700">
                            Low Stock Only
                          </span>
                        </label>
                      </div>
                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={showOutOfStock}
                            onChange={(e) =>
                              setShowOutOfStock(e.target.checked)
                            }
                            className="rounded border-stone-300 text-gray-700-600 focus:ring-gray-600"
                          />
                          <span className="text-sm text-stone-700">
                            Show Out of Stock
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Selection Controls */}
              {filteredProducts.length > 0 && (
                <div
                  className="px-5 py-3 bg-stone-50 border-b border-stone-200 
                  flex flex-wrap items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-stone-600">Selection:</span>
                    <button
                      onClick={selectAllProducts}
                      className="px-3 py-1.5 text-xs bg-white border border-stone-300 
                        rounded-lg hover:bg-stone-100 transition flex items-center gap-1"
                      type="button"
                    >
                      <Check className="h-3.5 w-3.5" />
                      Select All
                    </button>
                    <button
                      onClick={deselectAllProducts}
                      className="px-3 py-1.5 text-xs bg-white border border-stone-300 
                        rounded-lg hover:bg-stone-100 transition flex items-center gap-1"
                      type="button"
                    >
                      <X className="h-3.5 w-3.5" />
                      Deselect All
                    </button>
                  </div>
                  <span className="text-sm text-stone-600">
                    {selectedProductsCount} products selected
                    {productsWithQuantityCount > 0 &&
                      ` • ${productsWithQuantityCount} with quantity`}
                    {totalUnits > 0 && ` • ${formatNumber(totalUnits)} units`}
                  </span>
                </div>
              )}
            </div>

            {/* Products Grid/List */}
            {isLoading ? (
              <LoadingState />
            ) : filteredProducts.length === 0 ? (
              <EmptyState
                title="No Products Found"
                description="Try adjusting your search or filters"
                icon={Package}
              />
            ) : (
              <div
                className={
                  viewMode === "grid" ? "grid grid-cols-1 gap-4" : "space-y-3"
                }
              >
                {filteredProducts.map((product) => (
                  <ModernProductCard
                    key={product.id}
                    product={product}
                    isSelected={selectedProducts[product.id] || false}
                    quantity={productQuantities[product.id] || 0}
                    onQuantityChange={(qty) =>
                      handleQuantityChange(product.id, qty)
                    }
                    onToggleSelect={() => handleProductSelect(product.id)}
                    formatCurrency={formatCurrency}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Sticky Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-stone-200 shadow-lg py-4 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-600/10 rounded-xl flex items-center justify-center">
                  <MapPin className="h-5 w-5 text-gray-700-600" />
                </div>
                <div>
                  <p className="text-xs text-stone-500">Destination</p>
                  <p className="font-medium text-stone-900">
                    <ShortTextWithTooltip
                      text={
                        selectedLocation?.location_name ||
                        "No location selected"
                      }
                      max={25}
                    />
                  </p>
                </div>
              </div>

              <div className="h-8 w-px bg-stone-200" />

              <div>
                <p className="text-xs text-stone-500">Products</p>
                <p className="font-medium text-stone-900">
                  {filteredProducts.length} available
                </p>
              </div>

              {selectedProductsCount > 0 && (
                <>
                  <div className="h-8 w-px bg-stone-200" />
                  <div>
                    <p className="text-xs text-stone-500">Selected</p>
                    <p className="font-medium text-emerald-600">
                      {selectedProductsCount} products
                    </p>
                  </div>
                </>
              )}

              {totalUnits > 0 && (
                <>
                  <div className="h-8 w-px bg-stone-200" />
                  <div>
                    <p className="text-xs text-stone-500">Total Units</p>
                    <p className="font-medium text-emerald-600">
                      {formatNumber(totalUnits)}
                    </p>
                  </div>
                </>
              )}
            </div>

            <button
              onClick={handleDistribute}
              disabled={
                !selectedLocation || selectedProductsCount === 0 || isSubmitting
              }
              className="px-8 py-3.5 bg-gray-600 text-white rounded-xl font-medium 
                flex items-center gap-2 transition-all hover:bg-gray-700
                disabled:bg-stone-300 disabled:cursor-not-allowed shadow-lg"
              type="button"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <ArrowRight className="h-5 w-5" />
                  <ShortTextWithTooltip
                    text={`Add to ${selectedLocation?.location_name || "Location"}`}
                    max={25}
                  />
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showConfirmation}
        onClose={() => setShowConfirmation(false)}
        onConfirm={confirmDistribution}
        selectedProducts={selectedProductsCount}
        productsWithQuantity={productsWithQuantityCount}
        totalUnits={totalUnits}
        location={selectedLocation}
        isSubmitting={isSubmitting}
      />
    </div>
  );
};

export default withAuth(AddToLocations);
