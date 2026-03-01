"use client";
import { withAuth } from "@/hoc/withAuth";
import { apiGet, apiPost } from "@/lib/axios";
import React, { useState, useEffect, useMemo } from "react";
import {
  Search,
  X,
  ArrowLeft,
  Loader2,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  Printer,
  User,
  Package,
  Tag,
  DollarSign,
  Receipt,
  Smartphone,
  Laptop,
  Coffee,
  ChevronRight ,
  Beer,
  ShoppingBag,
  Gift,
  Home,
  BookOpen,
  Grid,
  List,
  TrendingUp,
  Award,
  Zap,
  Clock,
  CheckCircle,
  AlertCircle,
  Wallet,
  Banknote,
  Landmark,
  QrCode,
  Scan,
  Percent,
  ChevronDown,
  ChevronUp,
  Settings,
  RefreshCw,
  Download,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Star,
  Heart,
  Shield,
  Truck,
  PackageCheck,
  PackageX,
  BadgePercent,
  Gift as GiftIcon,
  Sparkles,
  Flame,
  Leaf,
  Crown,
  Gem,
  Rocket,
  Globe,
  Moon,
  Sun,
  Bell,
  Menu,
  Users,
  UserPlus,
  UserCheck,
  UserX,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

// ==============================================
// TypeScript Interfaces
// ==============================================

interface Product {
  id: number;
  name: string;
  sku: string;
  price: string | number | null;
  cost_price: string | number | null;
  sale_price: string | number | null;
  stock_quantity: string | number | null;
  category_id: number;
  image: string | null;
  is_active: boolean;
  is_on_sale: boolean;
  discount_percentage: string | number | null;
  category?: {
    id: number;
    name: string;
    color?: string;
  };
  unit?: {
    symbol: string;
  };
  barcode?: string;
  tags?: string[];
}

interface Category {
  id: number;
  name: string;
  icon: React.ElementType;
  color: string;
  count?: number;
}

interface CartItem extends Product {
  quantity: number;
  subtotal: number;
  discount?: number;
  notes?: string;
}

interface Customer {
  id: number;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  customer_code: string;
  loyalty_points: number;
  total_purchases: number;
  outstanding_balance: number;
  is_active: boolean;
  avatar?: string;
  address?: string | null;
  city?: string | null;
}

interface Transaction {
  id: string;
  items: CartItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  payment_method: string;
  customer_id?: number;
  customer_name?: string;
  created_at: string;
  cashier: string;
}

interface PaymentMethod {
  id: string;
  name: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
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

const formatCurrency = (
  amount: number,
  currencySymbol: string = "$",
): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
    .format(amount)
    .replace(/^\$/, currencySymbol);
};

const getCustomerFullName = (customer: Customer): string => {
  return (
    `${customer.first_name || ""} ${customer.last_name || ""}`.trim() ||
    "Guest Customer"
  );
};

const getCustomerInitials = (customer: Customer): string => {
  const first = customer.first_name ? customer.first_name.charAt(0) : "";
  const last = customer.last_name ? customer.last_name.charAt(0) : "";
  return (first + last).toUpperCase() || "G";
};

const getCustomerTier = (
  customer: Customer,
): { name: string; color: string; icon: React.ElementType } => {
  const points = customer.loyalty_points || 0;
  const purchases = customer.total_purchases || 0;

  if (points >= 5000 || purchases >= 50000) {
    return { name: "Diamond", color: "from-purple-500 to-pink-500", icon: Gem };
  } else if (points >= 2000 || purchases >= 20000) {
    return {
      name: "Platinum",
      color: "from-slate-400 to-slate-600",
      icon: Crown,
    };
  } else if (points >= 1000 || purchases >= 10000) {
    return { name: "Gold", color: "from-amber-400 to-yellow-600", icon: Award };
  } else if (points >= 500 || purchases >= 5000) {
    return { name: "Silver", color: "from-gray-300 to-gray-500", icon: Star };
  } else if (points >= 100 || purchases >= 1000) {
    return {
      name: "Bronze",
      color: "from-amber-600 to-amber-800",
      icon: Shield,
    };
  }
  return { name: "Regular", color: "from-blue-400 to-blue-600", icon: User };
};

// ==============================================
// Animation Variants
// ==============================================

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.3 },
};

const scaleIn = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.9 },
  transition: { duration: 0.2 },
};

const slideInRight = {
  initial: { opacity: 0, x: 50 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 50 },
  transition: { duration: 0.3 },
};

// ==============================================
// Sub-components
// ==============================================

// Modern Header
const ModernHeader: React.FC<{
  title: string;
  subtitle: string;
  onBack: () => void;
  onRefresh: () => void;
  date: Date;
}> = ({ title, subtitle, onBack, onRefresh, date }) => {
  const [isDark, setIsDark] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="bg-gradient-to-r from-[#101828] to-[#1e3a5f] text-white shadow-xl sticky top-0 z-30"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onBack}
              className="p-2.5 bg-white/10 rounded-xl hover:bg-white/20 transition-colors backdrop-blur-sm"
            >
              <ArrowLeft className="h-5 w-5" />
            </motion.button>
            <div>
              <motion.h1
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-2xl font-bold flex items-center gap-2"
              >
                {title}
                <span className="text-xs bg-emerald-400 text-emerald-900 px-2 py-1 rounded-full font-normal">
                  LIVE
                </span>
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="text-sm text-blue-100"
              >
                {subtitle}
              </motion.p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Date & Time */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="hidden md:flex items-center gap-2 bg-white/10 px-4 py-2 rounded-xl backdrop-blur-sm"
            >
              <Clock className="h-4 w-4" />
              <span className="text-sm font-medium">
                {date.toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </motion.div>

            {/* Notifications */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2.5 bg-white/10 rounded-xl hover:bg-white/20 transition-colors backdrop-blur-sm"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 rounded-full text-[10px] flex items-center justify-center">
                3
              </span>
            </motion.button>

            {/* Theme Toggle */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsDark(!isDark)}
              className="p-2.5 bg-white/10 rounded-xl hover:bg-white/20 transition-colors backdrop-blur-sm"
            >
              {isDark ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </motion.button>

            {/* Refresh Button */}
            <motion.button
              whileHover={{ scale: 1.05, rotate: 180 }}
              whileTap={{ scale: 0.95 }}
              onClick={onRefresh}
              className="p-2.5 bg-white/10 rounded-xl hover:bg-white/20 transition-colors backdrop-blur-sm"
            >
              <RefreshCw className="h-5 w-5" />
            </motion.button>

            {/* User Menu */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-3 bg-white/10 pl-3 pr-4 py-2 rounded-xl hover:bg-white/20 transition-colors backdrop-blur-sm"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-lg flex items-center justify-center">
                <User className="h-4 w-4" />
              </div>
              <span className="text-sm font-medium hidden md:block">
                Edwin Eke
              </span>
              <ChevronDown className="h-4 w-4 hidden md:block" />
            </motion.button>
          </div>
        </div>
      </div>
    </motion.header>
  );
};

// Modern Category Pills - More Compact Version
const ModernCategoryPills: React.FC<{
  categories: Category[];
  selectedCategory: number | null;
  onSelectCategory: (id: number | null) => void;
}> = ({ categories, selectedCategory, onSelectCategory }) => {
  return (
    <div className="relative">
      <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-stone-50 to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-stone-50 to-transparent z-10 pointer-events-none" />
      
      <div className="overflow-x-auto scrollbar-hide pb-2">
        <div className="flex gap-1.5 min-w-max px-1">
          <motion.button
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelectCategory(null)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full font-medium text-sm transition-all ${
              selectedCategory === null
                ? "bg-[#1e3a5f] text-white shadow-lg shadow-[#1e3a5f]/30"
                : "bg-white text-stone-700 hover:bg-stone-100 border border-stone-200"
            }`}
          >
            <Grid className="h-3.5 w-3.5" />
            All
          </motion.button>

          {categories.map((category) => {
            const Icon = category.icon;
            const isSelected = selectedCategory === category.id;
            
            return (
              <motion.button
                key={category.id}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onSelectCategory(category.id)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full font-medium text-sm transition-all ${
                  isSelected
                    ? `bg-gradient-to-r ${category.color} text-white shadow-lg`
                    : "bg-white text-stone-700 hover:bg-stone-100 border border-stone-200"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span className="text-xs whitespace-nowrap">{category.name}</span>
                {category.count !== undefined && (
                  <span className={`ml-0.5 px-1.5 py-0.5 text-[10px] rounded-full ${
                    isSelected ? "bg-white/20" : "bg-stone-100"
                  }`}>
                    {category.count}
                  </span>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// Modern Product Card - Smaller Image Version
const ModernProductCard: React.FC<{
  product: Product;
  onAddToCart: (product: Product) => void;
  formatCurrency: (amount: number) => string;
}> = ({ product, onAddToCart, formatCurrency }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [imageError, setImageError] = useState(false);

  const price =
    product.is_on_sale && product.sale_price
      ? toNumber(product.sale_price)
      : toNumber(product.price);
  const originalPrice = product.is_on_sale ? toNumber(product.price) : null;
  const stockQuantity = toNumber(product.stock_quantity);
  const isOutOfStock = stockQuantity <= 0;
  const isLowStock = stockQuantity > 0 && stockQuantity <= 5;

  return (
    <motion.button
      variants={fadeInUp}
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={() => !isOutOfStock && onAddToCart(product)}
      disabled={isOutOfStock}
      className={`relative bg-white rounded-xl border shadow-sm overflow-hidden group ${
        isOutOfStock
          ? "opacity-50 cursor-not-allowed border-rose-200"
          : isLowStock
            ? "border-amber-200 hover:shadow-lg hover:border-amber-300"
            : "border-stone-200 hover:shadow-lg hover:border-[#1e3a5f]/30"
      } transition-all duration-300`}
    >
      {/* Badges - Smaller and repositioned */}
      <div className="absolute top-2 left-2 z-10 flex flex-col gap-1">
        {product.is_on_sale && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="bg-gradient-to-r from-rose-500 to-pink-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md shadow-lg flex items-center gap-0.5"
          >
            <BadgePercent className="h-2.5 w-2.5" />
            {product.discount_percentage
              ? toNumber(product.discount_percentage)
              : 0}
            %
          </motion.div>
        )}
        {isLowStock && !isOutOfStock && (
          <div className="bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md shadow-lg flex items-center gap-0.5">
            <AlertCircle className="h-2.5 w-2.5" />
            Low
          </div>
        )}
      </div>

      {/* Image Container - Smaller */}
      <div className="relative aspect-square w-32 mx-auto mt-3">
        <div className="w-full h-full bg-gradient-to-br from-stone-50 to-stone-100 rounded-lg flex items-center justify-center overflow-hidden">
          {product.image && !imageError ? (
            <img
              src={`http://localhost:8000/storage/${product.image}`}
              alt={product.name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              onError={() => setImageError(true)}
            />
          ) : (
            <Package className="h-8 w-8 text-stone-300" />
          )}
        </div>

        {/* Quick Add Overlay */}
        <AnimatePresence>
          {isHovered && !isOutOfStock && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm rounded-lg flex items-center justify-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="bg-white rounded-full p-2 shadow-xl"
              >
                <Plus className="h-4 w-4 text-[#1e3a5f]" />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stock Indicator */}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm rounded-lg flex items-center justify-center">
            <div className="bg-rose-500 text-white text-xs px-2 py-1 rounded-md font-bold shadow-lg">
              Out
            </div>
          </div>
        )}
      </div>

      {/* Product Info - More Compact */}
      <div className="p-3">
        <div className="mb-1">
          <h3 className="font-medium text-stone-900 text-sm line-clamp-1">
            {product.name}
          </h3>
          <p className="text-[10px] text-stone-400 mt-0.5">SKU: {product.sku}</p>
        </div>

        <div className="flex items-end justify-between">
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-base font-bold text-[#1e3a5f]">
                {formatCurrency(price)}
              </span>
              {originalPrice && (
                <span className="text-[10px] text-stone-400 line-through">
                  {formatCurrency(originalPrice)}
                </span>
              )}
            </div>
            {product.unit?.symbol && (
              <span className="text-[10px] text-stone-400">/ {product.unit.symbol}</span>
            )}
          </div>
          
          <div className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
            isOutOfStock ? "bg-rose-50 text-rose-600" :
            isLowStock ? "bg-amber-50 text-amber-600" :
            "bg-emerald-50 text-emerald-600"
          }`}>
            {stockQuantity}
          </div>
        </div>

        {/* Tags - More Compact */}
        {product.tags && product.tags.length > 0 && (
          <div className="flex gap-1 mt-2">
            {product.tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="text-[8px] bg-stone-100 px-1.5 py-0.5 rounded-full text-stone-600"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </motion.button>
  );
};

// Modern Cart Item
const ModernCartItem: React.FC<{
  item: CartItem;
  onUpdateQuantity: (id: number, quantity: number) => void;
  onRemove: (id: number) => void;
  onAddNote: (id: number, note: string) => void;
  formatCurrency: (amount: number) => string;
}> = ({ item, onUpdateQuantity, onRemove, onAddNote, formatCurrency }) => {
  const [showNotes, setShowNotes] = useState(false);
  const [note, setNote] = useState(item.notes || "");

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="bg-white rounded-xl border border-stone-200 p-3 hover:shadow-md transition-shadow"
    >
      <div className="flex gap-3">
        {/* Product Image */}
        <div className="w-16 h-16 bg-gradient-to-br from-stone-50 to-stone-100 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
          {item.image ? (
            <img
              src={`http://localhost:8000/storage/${item.image}`}
              alt={item.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <Package className="h-8 w-8 text-stone-300" />
          )}
        </div>

        {/* Product Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div>
              <h4 className="font-medium text-stone-900 line-clamp-1">
                {item.name}
              </h4>
              <p className="text-xs text-stone-400">{item.sku}</p>
            </div>
            <button
              onClick={() => onRemove(item.id)}
              className="p-1 hover:bg-rose-50 rounded-lg transition-colors"
            >
              <Trash2 className="h-4 w-4 text-rose-400 hover:text-rose-600" />
            </button>
          </div>

          {/* Price and Quantity */}
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-baseline gap-1">
              <span className="font-semibold text-[#1e3a5f]">
                {formatCurrency(item.subtotal)}
              </span>
              <span className="text-xs text-stone-400">
                ({formatCurrency(toNumber(item.price))} each)
              </span>
            </div>

            <div className="flex items-center gap-1">
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                className="w-7 h-7 rounded-lg bg-stone-100 hover:bg-stone-200 flex items-center justify-center transition-colors"
                disabled={item.quantity <= 1}
              >
                <Minus className="h-3.5 w-3.5" />
              </motion.button>
              <span className="w-8 text-center font-medium">
                {item.quantity}
              </span>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                className="w-7 h-7 rounded-lg bg-stone-100 hover:bg-stone-200 flex items-center justify-center transition-colors"
                disabled={item.quantity >= toNumber(item.stock_quantity)}
              >
                <Plus className="h-3.5 w-3.5" />
              </motion.button>
            </div>
          </div>

          {/* Notes Toggle */}
          <button
            onClick={() => setShowNotes(!showNotes)}
            className="text-xs text-stone-400 hover:text-stone-600 mt-2 flex items-center gap-1"
          >
            {showNotes ? (
              <ChevronUp className="h-3 w-3" />
            ) : (
              <ChevronDown className="h-3 w-3" />
            )}
            {item.notes ? "Edit note" : "Add note"}
          </button>

          {/* Notes Input */}
          <AnimatePresence>
            {showNotes && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  onBlur={() => onAddNote(item.id, note)}
                  placeholder="Add special instructions..."
                  className="w-full mt-2 px-3 py-2 text-sm border border-stone-200 rounded-lg focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f] outline-none"
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};

// Customer Selector Modal
const CustomerSelectorModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  customers: Customer[];
  onSelectCustomer: (customer: Customer | null) => void;
}> = ({ isOpen, onClose, customers, onSelectCustomer }) => {
  const [search, setSearch] = useState("");

  const filteredCustomers = customers.filter((c) => {
    if (!c) return false;
    const searchLower = search.toLowerCase();
    const fullName = `${c.first_name || ""} ${c.last_name || ""}`.toLowerCase();
    const email = (c.email || "").toLowerCase();
    const phone = (c.phone || "").toLowerCase();
    const customerCode = (c.customer_code || "").toLowerCase();

    return (
      fullName.includes(searchLower) ||
      email.includes(searchLower) ||
      phone.includes(searchLower) ||
      customerCode.includes(searchLower)
    );
  });

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 flex items-center justify-center bg-stone-900/60 backdrop-blur-md z-50 p-4"
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-[#1e3a5f] to-[#0B2A4A] text-white p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Users className="h-5 w-5" />
                Select Customer
              </h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-xl transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/60 h-4 w-4" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search customers by name, email, phone..."
                className="w-full pl-9 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/60 focus:ring-2 focus:ring-white/30 outline-none"
              />
            </div>
          </div>

          {/* Customer List */}
          <div className="overflow-y-auto max-h-[calc(80vh-180px)] p-4">
            {/* Guest Option */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                onSelectCustomer(null);
                onClose();
              }}
              className="w-full p-4 mb-3 bg-stone-50 hover:bg-stone-100 rounded-xl border border-stone-200 flex items-center gap-4 transition-all"
            >
              <div className="w-12 h-12 bg-stone-200 rounded-xl flex items-center justify-center">
                <User className="h-6 w-6 text-stone-600" />
              </div>
              <div className="flex-1 text-left">
                <h3 className="font-semibold text-stone-900">Guest Customer</h3>
                <p className="text-sm text-stone-500">Continue without customer</p>
              </div>
            </motion.button>

            {/* Customers */}
            {filteredCustomers.map((customer) => {
              const tier = getCustomerTier(customer);
              const TierIcon = tier.icon;
              return (
                <motion.button
                  key={customer.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    onSelectCustomer(customer);
                    onClose();
                  }}
                  className="w-full p-4 mb-3 bg-white hover:bg-stone-50 rounded-xl border border-stone-200 flex items-center gap-4 transition-all"
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-[#1e3a5f] to-[#0B2A4A] text-white rounded-xl flex items-center justify-center font-semibold text-lg">
                    {getCustomerInitials(customer)}
                  </div>
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-stone-900">
                        {getCustomerFullName(customer)}
                      </h3>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full bg-gradient-to-r ${tier.color} text-white`}>
                        <TierIcon className="h-2.5 w-2.5 inline mr-0.5" />
                        {tier.name}
                      </span>
                    </div>
                    <p className="text-xs text-stone-500 mb-1">
                      {customer.email || "No email"} • {customer.phone || "No phone"}
                    </p>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="text-stone-400">Code: {customer.customer_code}</span>
                      {customer.loyalty_points > 0 && (
                        <span className="text-emerald-600 flex items-center gap-0.5">
                          <Sparkles className="h-3 w-3" />
                          {customer.loyalty_points} pts
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-stone-400" />
                </motion.button>
              );
            })}

            {filteredCustomers.length === 0 && (
              <div className="text-center py-12">
                <Users className="h-16 w-16 text-stone-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-stone-900 mb-2">
                  No customers found
                </h3>
                <p className="text-stone-500">
                  Try adjusting your search or add a new customer
                </p>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// Modern Customer Card
const ModernCustomerCard: React.FC<{
  customer: Customer | null;
  onSelect: () => void;
  onClear?: () => void;
}> = ({ customer, onSelect, onClear }) => {
  const tier = customer ? getCustomerTier(customer) : null;
  const TierIcon = tier?.icon || User;

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="relative bg-gradient-to-br from-[#1e3a5f] to-[#0B2A4A] text-white rounded-2xl p-4 shadow-xl overflow-hidden group"
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-white rounded-full" />
        <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-white rounded-full" />
      </div>

      <div className="relative">
        {customer ? (
          <>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center text-xl font-bold backdrop-blur-sm">
                {getCustomerInitials(customer)}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">{getCustomerFullName(customer)}</h3>
                <p className="text-xs text-blue-200">{customer.customer_code}</p>
              </div>
              {onClear && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onClear();
                  }}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <UserX className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 mb-3">
              <div
                className={`flex items-center gap-1 px-2 py-1 rounded-lg bg-gradient-to-r ${tier?.color} text-xs font-medium`}
              >
                <TierIcon className="h-3 w-3" />
                {tier?.name} Member
              </div>
              {customer.loyalty_points > 0 && (
                <div className="flex items-center gap-1 px-2 py-1 bg-amber-400/20 rounded-lg text-xs">
                  <Sparkles className="h-3 w-3" />
                  {customer.loyalty_points} pts
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              {customer.email && (
                <div className="flex items-center gap-1 text-blue-200">
                  <Mail className="h-3 w-3" />
                  <span className="truncate">{customer.email}</span>
                </div>
              )}
              {customer.phone && (
                <div className="flex items-center gap-1 text-blue-200">
                  <Phone className="h-3 w-3" />
                  <span>{customer.phone}</span>
                </div>
              )}
            </div>

            {customer.outstanding_balance > 0 && (
              <div className="mt-3 pt-3 border-t border-white/20">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-blue-200">Outstanding Balance</span>
                  <span className="text-amber-300 font-semibold">
                    {formatCurrency(customer.outstanding_balance)}
                  </span>
                </div>
              </div>
            )}
          </>
        ) : (
          <button onClick={onSelect} className="w-full flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <User className="h-6 w-6" />
            </div>
            <div className="flex-1 text-left">
              <h3 className="font-semibold">Guest Customer</h3>
              <p className="text-xs text-blue-200">Click to select a customer</p>
            </div>
            <UserPlus className="h-5 w-5 text-blue-200" />
          </button>
        )}
      </div>
    </motion.div>
  );
};

// Modern Payment Methods
const ModernPaymentMethods: React.FC<{
  selected: string;
  onSelect: (method: string) => void;
}> = ({ selected, onSelect }) => {
  const paymentMethods: PaymentMethod[] = [
    {
      id: "cash",
      name: "Cash",
      icon: Banknote,
      color: "from-emerald-500 to-emerald-600",
      bgColor: "bg-emerald-50",
    },
    {
      id: "card",
      name: "Card",
      icon: CreditCard,
      color: "from-blue-500 to-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      id: "mobile",
      name: "Mobile Money",
      icon: Smartphone,
      color: "from-purple-500 to-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      id: "bank",
      name: "Bank Transfer",
      icon: Landmark,
      color: "from-amber-500 to-amber-600",
      bgColor: "bg-amber-50",
    },
    {
      id: "qr",
      name: "QR Code",
      icon: QrCode,
      color: "from-rose-500 to-rose-600",
      bgColor: "bg-rose-50",
    },
    {
      id: "wallet",
      name: "Digital Wallet",
      icon: Wallet,
      color: "from-indigo-500 to-indigo-600",
      bgColor: "bg-indigo-50",
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-2">
      {paymentMethods.map((method) => {
        const Icon = method.icon;
        const isSelected = selected === method.id;

        return (
          <motion.button
            key={method.id}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelect(method.id)}
            className={`relative p-3 rounded-xl border-2 transition-all ${
              isSelected
                ? `border-transparent bg-gradient-to-r ${method.color} text-white shadow-lg`
                : `${method.bgColor} border-stone-200 hover:border-stone-300`
            }`}
          >
            <div className="flex flex-col items-center gap-1">
              <Icon
                className={`h-5 w-5 ${isSelected ? "text-white" : `text-${method.color.split("-")[1]}-600`}`}
              />
              <span className="text-xs font-medium">{method.name}</span>
            </div>
            {isSelected && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center"
              >
                <CheckCircle className="h-3 w-3 text-green-500" />
              </motion.div>
            )}
          </motion.button>
        );
      })}
    </div>
  );
};

// Modern Cart Summary
const ModernCartSummary: React.FC<{
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  discountType: "percentage" | "fixed";
  onDiscountChange: (value: number) => void;
  onDiscountTypeChange: (type: "percentage" | "fixed") => void;
  formatCurrency: (amount: number) => string;
  currencySymbol: string;
}> = ({
  subtotal,
  discount,
  tax,
  total,
  discountType,
  onDiscountChange,
  onDiscountTypeChange,
  formatCurrency,
  currencySymbol,
}) => {
  return (
    <div className="space-y-3">
      {/* Subtotal */}
      <div className="flex justify-between text-sm">
        <span className="text-stone-600">Subtotal</span>
        <span className="font-medium text-stone-900">
          {formatCurrency(subtotal)}
        </span>
      </div>

      {/* Discount */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-stone-600">Discount</span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onDiscountTypeChange("percentage")}
              className={`px-2 py-1 text-xs rounded-lg transition-colors ${
                discountType === "percentage"
                  ? "bg-[#1e3a5f] text-white"
                  : "bg-stone-100 text-stone-600 hover:bg-stone-200"
              }`}
            >
              %
            </button>
            <button
              onClick={() => onDiscountTypeChange("fixed")}
              className={`px-2 py-1 text-xs rounded-lg transition-colors ${
                discountType === "fixed"
                  ? "bg-[#1e3a5f] text-white"
                  : "bg-stone-100 text-stone-600 hover:bg-stone-200"
              }`}
            >
              {currencySymbol}
            </button>
          </div>
        </div>
        <div className="relative">
          <input
            type="number"
            value={discount}
            onChange={(e) => onDiscountChange(parseFloat(e.target.value) || 0)}
            min="0"
            max={discountType === "percentage" ? 100 : subtotal}
            step={discountType === "percentage" ? 1 : 0.01}
            className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f] outline-none"
            placeholder={`Enter discount ${discountType === "percentage" ? "percentage" : "amount"}`}
          />
          {discount > 0 && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-rose-600 font-medium">
              -
              {formatCurrency(
                discountType === "percentage"
                  ? (subtotal * discount) / 100
                  : discount,
              )}
            </div>
          )}
        </div>
      </div>

      {/* Tax */}
      <div className="flex justify-between text-sm">
        <span className="text-stone-600">Tax (0%)</span>
        <span className="font-medium text-stone-900">
          {formatCurrency(tax)}
        </span>
      </div>

      {/* Total */}
      <div className="flex justify-between text-lg font-bold pt-3 border-t border-stone-200">
        <span className="text-stone-900">Total</span>
        <span className="text-[#1e3a5f]">{formatCurrency(total)}</span>
      </div>

      {/* Quick Discount Buttons */}
      <div className="flex gap-2 pt-2">
        {[5, 10, 15, 20].map((value) => (
          <button
            key={value}
            onClick={() => onDiscountChange(value)}
            className="flex-1 py-2 text-xs bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors"
          >
            {value}% OFF
          </button>
        ))}
      </div>
    </div>
  );
};

// Modern Payment Modal
const ModernPaymentModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (method: string, amount: number, reference?: string) => void;
  total: number;
  isSubmitting: boolean;
  formatCurrency: (amount: number) => string;
  currencySymbol: string;
}> = ({
  isOpen,
  onClose,
  onConfirm,
  total,
  isSubmitting,
  formatCurrency,
  currencySymbol,
}) => {
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [amountPaid, setAmountPaid] = useState(total.toString());
  const [reference, setReference] = useState("");
  const [change, setChange] = useState(0);

  useEffect(() => {
    const paid = parseFloat(amountPaid) || 0;
    setChange(Math.max(0, paid - total));
  }, [amountPaid, total]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 flex items-center justify-center bg-stone-900/60 backdrop-blur-md z-50 p-4"
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-[#1e3a5f] to-[#0B2A4A] text-white p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Complete Payment</h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-xl transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-blue-200">Total Amount</span>
              <span className="text-3xl font-bold">
                {formatCurrency(total)}
              </span>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Payment Methods */}
            <div>
              <label className="text-sm font-medium text-stone-700 mb-3 block">
                Select Payment Method
              </label>
              <ModernPaymentMethods
                selected={paymentMethod}
                onSelect={setPaymentMethod}
              />
            </div>

            {/* Amount Input (for cash) */}
            {paymentMethod === "cash" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
              >
                <label className="text-sm font-medium text-stone-700 mb-2 block">
                  Amount Paid
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-500 font-medium">
                    {currencySymbol}
                  </span>
                  <input
                    type="number"
                    value={amountPaid}
                    onChange={(e) => setAmountPaid(e.target.value)}
                    min={total}
                    step="0.01"
                    className="w-full pl-8 pr-4 py-3 text-lg border border-stone-200 rounded-xl focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f] outline-none"
                    autoFocus
                  />
                </div>
                {change > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-3 p-4 bg-emerald-50 rounded-xl"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-emerald-700">Change:</span>
                      <span className="text-xl font-bold text-emerald-700">
                        {formatCurrency(change)}
                      </span>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* Reference Input (for card/transfer) */}
            {(paymentMethod === "card" ||
              paymentMethod === "bank" ||
              paymentMethod === "mobile") && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
              >
                <label className="text-sm font-medium text-stone-700 mb-2 block">
                  Transaction Reference (Optional)
                </label>
                <input
                  type="text"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="Enter reference number"
                  className="w-full px-4 py-3 border border-stone-200 rounded-xl focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f] outline-none"
                />
              </motion.div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-3 text-sm font-medium text-stone-700 bg-white border border-stone-300 rounded-xl hover:bg-stone-50 transition-colors"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  if (paymentMethod === "cash") {
                    const paid = parseFloat(amountPaid) || 0;
                    if (paid < total) {
                      toast.error("Amount paid must be at least the total");
                      return;
                    }
                  }
                  onConfirm(
                    paymentMethod,
                    parseFloat(amountPaid) || total,
                    reference,
                  );
                }}
                className="flex-1 px-4 py-3 text-sm font-medium text-white bg-gradient-to-r from-[#1e3a5f] to-[#0B2A4A] rounded-xl hover:from-[#0B2A4A] hover:to-[#1e3a5f] transition-all inline-flex items-center justify-center gap-2 shadow-lg shadow-[#1e3a5f]/30"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    Complete Payment
                  </>
                )}
              </motion.button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// Modern Receipt Modal
const ModernReceiptModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | null;
  formatCurrency: (amount: number) => string;
}> = ({ isOpen, onClose, transaction, formatCurrency }) => {
  const [isPrinting, setIsPrinting] = useState(false);

  if (!isOpen || !transaction) return null;

  const handlePrint = () => {
    setIsPrinting(true);
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
    }, 100);
  };

  const handleDownload = () => {
    // Create receipt as text
    const receipt = `
${transaction.cashier} - Receipt #${transaction.id}
${new Date(transaction.created_at).toLocaleString()}
Customer: ${transaction.customer_name || "Guest"}
--------------------------------
${transaction.items
  .map(
    (item) =>
      `${item.name} x${item.quantity} - ${formatCurrency(item.subtotal)}`,
  )
  .join("\n")}
--------------------------------
Subtotal: ${formatCurrency(transaction.subtotal)}
Discount: -${formatCurrency(transaction.discount)}
Tax: ${formatCurrency(transaction.tax)}
Total: ${formatCurrency(transaction.total)}
--------------------------------
Payment Method: ${transaction.payment_method.toUpperCase()}
Thank you for your business!
    `;

    const blob = new Blob([receipt], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `receipt-${transaction.id}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 flex items-center justify-center bg-stone-900/60 backdrop-blur-md z-50 p-4"
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          className="bg-white rounded-3xl shadow-2xl w-full max-w-md"
        >
          {/* Receipt Content */}
          <div className="p-6" id="receipt-content">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-stone-900">RECEIPT</h2>
              <div className="w-16 h-0.5 bg-gradient-to-r from-[#1e3a5f] to-transparent mx-auto my-2" />
              <p className="text-sm text-stone-500">#{transaction.id}</p>
            </div>

            <div className="space-y-4">
              {/* Store Info */}
              <div className="text-center border-b border-dashed border-stone-200 pb-4">
                <h3 className="font-bold text-stone-900">Your Store Name</h3>
                <p className="text-xs text-stone-500">123 Business Street</p>
                <p className="text-xs text-stone-500">City, State 12345</p>
                <p className="text-xs text-stone-500">Tel: +1 234 567 890</p>
              </div>

              {/* Transaction Info */}
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-stone-600">Date:</span>
                  <span className="text-stone-900 font-medium">
                    {new Date(transaction.created_at).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-600">Cashier:</span>
                  <span className="text-stone-900 font-medium">
                    {transaction.cashier}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-600">Customer:</span>
                  <span className="text-stone-900 font-medium">
                    {transaction.customer_name || "Guest"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-600">Payment:</span>
                  <span className="text-stone-900 font-medium capitalize">
                    {transaction.payment_method}
                  </span>
                </div>
              </div>

              {/* Items */}
              <div className="border-t border-dashed border-stone-200 pt-4">
                <h4 className="font-semibold text-stone-900 mb-3">Items</h4>
                <div className="space-y-2">
                  {transaction.items.map((item, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <div className="flex-1">
                        <span className="text-stone-900">{item.name}</span>
                        <span className="text-stone-400 text-xs ml-2">
                          x{item.quantity}
                        </span>
                        {item.notes && (
                          <p className="text-xs text-stone-400 mt-0.5">
                            Note: {item.notes}
                          </p>
                        )}
                      </div>
                      <span className="text-stone-900 font-medium">
                        {formatCurrency(item.subtotal)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals */}
              <div className="border-t border-dashed border-stone-200 pt-4 space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-stone-600">Subtotal:</span>
                  <span className="text-stone-900">
                    {formatCurrency(transaction.subtotal)}
                  </span>
                </div>
                {transaction.discount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-stone-600">Discount:</span>
                    <span className="text-rose-600">
                      -{formatCurrency(transaction.discount)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-stone-600">Tax:</span>
                  <span className="text-stone-900">
                    {formatCurrency(transaction.tax)}
                  </span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-2 border-t border-dashed border-stone-200">
                  <span className="text-stone-900">Total:</span>
                  <span className="text-[#1e3a5f]">
                    {formatCurrency(transaction.total)}
                  </span>
                </div>
              </div>

              {/* Footer */}
              <div className="text-center text-xs text-stone-400 border-t border-dashed border-stone-200 pt-4">
                <p className="mb-1">Thank you for your business!</p>
                <p>Please come again</p>
                <p className="mt-2">This serves as an official receipt</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="p-6 bg-stone-50 border-t border-stone-200 flex gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handlePrint}
              disabled={isPrinting}
              className="flex-1 px-4 py-3 text-sm font-medium text-stone-700 bg-white border border-stone-300 rounded-xl hover:bg-stone-100 transition-colors inline-flex items-center justify-center gap-2"
            >
              {isPrinting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Printer className="h-4 w-4" />
              )}
              Print
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleDownload}
              className="flex-1 px-4 py-3 text-sm font-medium text-stone-700 bg-white border border-stone-300 rounded-xl hover:bg-stone-100 transition-colors inline-flex items-center justify-center gap-2"
            >
              <Download className="h-4 w-4" />
              Download
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onClose}
              className="flex-1 px-4 py-3 text-sm font-medium text-white bg-[#1e3a5f] rounded-xl hover:bg-[#0B2A4A] transition-colors"
            >
              Close
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// ==============================================
// Main Component
// ==============================================

const PointOfSale = ({ user }) => {
  const router = useRouter();

  // State
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [customerModalOpen, setCustomerModalOpen] = useState(false);
  const [lastTransaction, setLastTransaction] = useState<Transaction | null>(
    null,
  );
  const [taxRate, setTaxRate] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [discountType, setDiscountType] = useState<"percentage" | "fixed">(
    "percentage",
  );
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [currentDate, setCurrentDate] = useState(new Date());

  const currencySymbol = user?.businesses_one?.[0]?.currency || "$";

  // Update clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentDate(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Category icons mapping
  const categoryIcons: Record<
    string,
    { icon: React.ElementType; color: string }
  > = {
    food: { icon: Coffee, color: "from-orange-500 to-red-500" },
    beverages: { icon: Beer, color: "from-amber-500 to-yellow-500" },
    electronics: { icon: Laptop, color: "from-blue-500 to-indigo-500" },
    clothing: { icon: ShoppingBag, color: "from-purple-500 to-pink-500" },
    home: { icon: Home, color: "from-emerald-500 to-teal-500" },
    gifts: { icon: Gift, color: "from-rose-500 to-pink-500" },
    books: { icon: BookOpen, color: "from-stone-500 to-stone-700" },
  };

  // Fetch data
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [productsRes, categoriesRes, customersRes] = await Promise.all([
        apiGet("/products", {}, false),
        apiGet("/product-categories", {}, false),
        apiGet("/customers", {}, false),
      ]);

      // Parse products
      const productsArray =
        productsRes.data?.data?.products ??
        productsRes.data?.data ??
        productsRes.data?.products ??
        productsRes.data ??
        [];
      setProducts(Array.isArray(productsArray) ? productsArray : []);

      // Parse categories with counts
      const categoriesArray =
        categoriesRes.data?.data?.product_categories ??
        categoriesRes.data?.product_categories ??
        categoriesRes.data?.data ??
        categoriesRes.data ??
        [];

      const productsList = Array.isArray(productsArray) ? productsArray : [];

      const dbCategories = Array.isArray(categoriesArray)
        ? categoriesArray
        : [];
      const formattedCategories: Category[] = dbCategories.map((c: any) => {
        const iconConfig =
          categoryIcons[c.name.toLowerCase()] || categoryIcons.food;
        return {
          id: c.id,
          name: c.name,
          icon: iconConfig.icon,
          color: iconConfig.color,
          count: productsList.filter((p) => p.category_id === c.id).length,
        };
      });

      setCategories(formattedCategories);

      // Parse customers
      let customersArray = [];
      if (customersRes.data?.data?.customers) {
        customersArray = customersRes.data.data.customers;
      } else if (customersRes.data?.customers) {
        customersArray = customersRes.data.customers;
      } else if (customersRes.data?.data) {
        customersArray = customersRes.data.data;
      } else if (Array.isArray(customersRes.data)) {
        customersArray = customersRes.data;
      }

      setCustomers(Array.isArray(customersArray) ? customersArray : []);
    } catch (err: any) {
      console.error("Failed to load data:", err);
      toast.error("Failed to load data");
    } finally {
      setIsLoading(false);
    }
  };

  // Filter products
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      if (!product || !product.is_active) return false;

      const matchesSearch =
        (product.name || "")
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        (product.sku || "").toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        !selectedCategory || product.category_id === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, selectedCategory]);

  // Cart calculations
  const cartSubtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + (item.subtotal || 0), 0);
  }, [cart]);

  const cartDiscount = useMemo(() => {
    if (discountType === "percentage") {
      return (cartSubtotal * discount) / 100;
    }
    return Math.min(discount, cartSubtotal);
  }, [cartSubtotal, discount, discountType]);

  const cartTax = (cartSubtotal - cartDiscount) * (taxRate / 100);
  const cartTotal = cartSubtotal - cartDiscount + cartTax;

  // Cart functions
  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);

      if (existing) {
        const newQuantity = existing.quantity + 1;
        if (newQuantity > toNumber(product.stock_quantity)) {
          toast.error("Not enough stock");
          return prev;
        }
        return prev.map((item) =>
          item.id === product.id
            ? {
                ...item,
                quantity: newQuantity,
                subtotal: newQuantity * toNumber(item.price),
              }
            : item,
        );
      }

      const price =
        product.is_on_sale && product.sale_price
          ? toNumber(product.sale_price)
          : toNumber(product.price);

      return [
        ...prev,
        {
          ...product,
          quantity: 1,
          subtotal: price,
        },
      ];
    });

    // Show success feedback
    // toast.success(`${product.name} added to cart`, {
    //   icon: "🛒",
    //   duration: 1500,
    // });
  };

  const updateQuantity = (productId: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setCart((prev) =>
      prev.map((item) => {
        if (item.id === productId) {
          if (newQuantity > toNumber(item.stock_quantity)) {
            toast.error("Not enough stock");
            return item;
          }
          const price =
            item.is_on_sale && item.sale_price
              ? toNumber(item.sale_price)
              : toNumber(item.price);
          return {
            ...item,
            quantity: newQuantity,
            subtotal: newQuantity * price,
          };
        }
        return item;
      }),
    );
  };

  const removeFromCart = (productId: number) => {
    const item = cart.find((i) => i.id === productId);
    setCart((prev) => prev.filter((item) => item.id !== productId));
    if (item) {
    //   toast.success(`${item.name} removed from cart`, {
    //     icon: "🗑️",
    //     duration: 1500,
    //   });
    }
  };

  const addItemNote = (productId: number, note: string) => {
    setCart((prev) =>
      prev.map((item) =>
        item.id === productId ? { ...item, notes: note } : item,
      ),
    );
  };

  const clearCart = () => {
    if (cart.length > 0) {
      setCart([]);
      setDiscount(0);
      setSelectedCustomer(null);
      toast.success("Cart cleared");
    }
  };

  const handleCheckout = async (
    paymentMethod: string,
    amountPaid: number,
    reference?: string,
  ) => {
    if (cart.length === 0) {
      toast.error("Cart is empty");
      return;
    }

    setIsSubmitting(true);

    try {
      const transaction: Transaction = {
        id: `TRX-${Date.now()}`,
        items: cart,
        subtotal: cartSubtotal,
        tax: cartTax,
        discount: cartDiscount,
        total: cartTotal,
        payment_method: paymentMethod,
        customer_id: selectedCustomer?.id,
        customer_name: selectedCustomer ? getCustomerFullName(selectedCustomer) : "Guest",
        created_at: new Date().toISOString(),
        cashier: "Edwin Doe", // Replace with actual cashier name
      };

      // API call would go here
      // await apiPost("/transactions", transaction);

      setLastTransaction(transaction);
      setPaymentModalOpen(false);
      setReceiptModalOpen(true);

      // Clear cart after successful payment
      clearCart();
    } catch (err: any) {
      toast.error("Payment failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Modern Header */}
      <ModernHeader
        title="Point of Sale"
        subtitle="Process customer transactions"
        onBack={() => router.push("/dashboard")}
        onRefresh={fetchData}
        date={currentDate}
      />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Products Section */}
          <div className="flex-1">
            {/* Search Bar - Reduced Width */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 max-w-2xl mx-auto lg:mx-0"
            >
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 h-5 w-5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products by name, SKU, or scan barcode..."
                  className="w-full pl-12 pr-4 py-4 bg-white border border-stone-200 rounded-2xl focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f] outline-none transition shadow-sm"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-stone-100 rounded-lg"
                  >
                    <X className="h-4 w-4 text-stone-400" />
                  </button>
                )}
              </div>
            </motion.div>

            {/* Categories - Reduced Width */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mb-6 max-w-4xl"
            >
              <ModernCategoryPills
                categories={categories}
                selectedCategory={selectedCategory}
                onSelectCategory={setSelectedCategory}
              />
            </motion.div>

            {/* Products Grid/List */}
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <Loader2 className="h-12 w-12 text-[#1e3a5f]" />
                </motion.div>
                <p className="mt-4 text-stone-500">Loading products...</p>
              </div>
            ) : (
              <>
                {/* View Toggle */}
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm text-stone-500">
                    Showing{" "}
                    <span className="font-semibold text-stone-900">
                      {filteredProducts.length}
                    </span>{" "}
                    products
                  </p>
                  <div className="flex gap-1 bg-white p-1 rounded-lg border border-stone-200">
                    <button
                      onClick={() => setViewMode("grid")}
                      className={`p-2 rounded-lg transition-colors ${
                        viewMode === "grid"
                          ? "bg-[#1e3a5f] text-white"
                          : "text-stone-400 hover:text-stone-600"
                      }`}
                    >
                      <Grid className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setViewMode("list")}
                      className={`p-2 rounded-lg transition-colors ${
                        viewMode === "list"
                          ? "bg-[#1e3a5f] text-white"
                          : "text-stone-400 hover:text-stone-600"
                      }`}
                    >
                      <List className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Products Grid */}
                <motion.div
                  variants={{
                    hidden: { opacity: 0 },
                    show: {
                      opacity: 1,
                      transition: {
                        staggerChildren: 0.05,
                      },
                    },
                  }}
                  initial="hidden"
                  animate="show"
                  className={
                    viewMode === "grid"
                      ? "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
                      : "space-y-3"
                  }
                >
                  {filteredProducts.map((product) => (
                    <ModernProductCard
                      key={product.id}
                      product={product}
                      onAddToCart={addToCart}
                      formatCurrency={(amount) =>
                        formatCurrency(amount, currencySymbol)
                      }
                    />
                  ))}
                </motion.div>

                {filteredProducts.length === 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-20"
                  >
                    <Package className="h-16 w-16 text-stone-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-stone-900 mb-2">
                      No products found
                    </h3>
                    <p className="text-stone-500">
                      Try adjusting your search or category filter
                    </p>
                  </motion.div>
                )}
              </>
            )}
          </div>

          {/* Cart Section */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:w-96"
          >
            <div className="bg-white rounded-3xl border border-stone-200 shadow-xl sticky top-24 overflow-hidden">
              {/* Cart Header */}
              <div className="p-6 border-b border-stone-200 bg-gradient-to-r from-[#1e3a5f] to-[#0B2A4A] text-white">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5" />
                    Current Order
                  </h2>
                  <span className="text-sm bg-white/20 px-3 py-1 rounded-full">
                    {cart.length} {cart.length === 1 ? "item" : "items"}
                  </span>
                </div>

                {/* Customer Card with selection */}
                <ModernCustomerCard
                  customer={selectedCustomer}
                  onSelect={() => setCustomerModalOpen(true)}
                  onClear={() => setSelectedCustomer(null)}
                />
              </div>

              {/* Cart Items */}
              <div className="p-4 max-h-[calc(100vh-500px)] overflow-y-auto">
                {cart.length === 0 ? (
                  <div className="text-center py-12">
                    <motion.div
                      animate={{
                        scale: [1, 1.1, 1],
                        rotate: [0, 5, -5, 0],
                      }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <ShoppingCart className="h-16 w-16 text-stone-200 mx-auto mb-4" />
                    </motion.div>
                    <p className="text-stone-500 text-sm mb-2">
                      Your cart is empty
                    </p>
                    <p className="text-xs text-stone-400">
                      Add products by clicking on them
                    </p>
                  </div>
                ) : (
                  <AnimatePresence>
                    {cart.map((item) => (
                      <ModernCartItem
                        key={item.id}
                        item={item}
                        onUpdateQuantity={updateQuantity}
                        onRemove={removeFromCart}
                        onAddNote={addItemNote}
                        formatCurrency={(amount) =>
                          formatCurrency(amount, currencySymbol)
                        }
                      />
                    ))}
                  </AnimatePresence>
                )}
              </div>

              {/* Cart Summary */}
              {cart.length > 0 && (
                <div className="p-6 border-t border-stone-200 bg-stone-50/50">
                  <ModernCartSummary
                    subtotal={cartSubtotal}
                    discount={discount}
                    tax={cartTax}
                    total={cartTotal}
                    discountType={discountType}
                    onDiscountChange={setDiscount}
                    onDiscountTypeChange={setDiscountType}
                    formatCurrency={(amount) =>
                      formatCurrency(amount, currencySymbol)
                    }
                    currencySymbol={currencySymbol}
                  />
                </div>
              )}

              {/* Actions */}
              <div className="p-6 border-t border-stone-200">
                <div className="flex gap-3">
                  {cart.length > 0 && (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={clearCart}
                      className="px-6 py-3 text-sm font-medium text-rose-600 bg-rose-50 rounded-xl hover:bg-rose-100 transition-colors"
                    >
                      Clear
                    </motion.button>
                  )}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setPaymentModalOpen(true)}
                    disabled={cart.length === 0}
                    className="flex-1 py-3 text-sm font-medium text-white bg-gradient-to-r from-[#1e3a5f] to-[#0B2A4A] rounded-xl hover:from-[#0B2A4A] hover:to-[#1e3a5f] transition-all disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2 shadow-lg shadow-[#1e3a5f]/30"
                  >
                    <CreditCard className="h-4 w-4" />
                    Checkout
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </main>

      {/* Modals */}
      <CustomerSelectorModal
        isOpen={customerModalOpen}
        onClose={() => setCustomerModalOpen(false)}
        customers={customers}
        onSelectCustomer={setSelectedCustomer}
      />

      <ModernPaymentModal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        onConfirm={handleCheckout}
        total={cartTotal}
        isSubmitting={isSubmitting}
        formatCurrency={(amount) => formatCurrency(amount, currencySymbol)}
        currencySymbol={currencySymbol}
      />

      <ModernReceiptModal
        isOpen={receiptModalOpen}
        onClose={() => setReceiptModalOpen(false)}
        transaction={lastTransaction}
        formatCurrency={(amount) => formatCurrency(amount, currencySymbol)}
      />
    </div>
  );
};

export default withAuth(PointOfSale);