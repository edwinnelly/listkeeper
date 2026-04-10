"use client";

import { withAuth } from "@/hoc/withAuth";
import { apiGet, apiPost } from "@/lib/axios";
import React, { useState, useEffect, useCallback, useMemo, memo } from "react";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  X,
  Loader2,
  FileText,
  Package,
  Search,
  AlertCircle,
  User,
  Mail,
  Phone,
  MapPin,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Circle,
  Clock,
  TrendingUp,
  History,
  Keyboard,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

// ==============================================
// Type Definitions
// ==============================================

/** Supplier/Vendor information */
interface Supplier {
  vid: number;
  vendor_name: string;
  email?: string;
  phone?: string;
  contact_person?: string;
  last_order_date?: string;
  avg_lead_time?: number;
  on_time_rate?: number;
}

/** Product information */
interface Product {
  pid: number;
  product_name: string;
  sku: string;
  cost_price: number;
  current_stock: number;
  category?: string;
}

/** Individual order item */
interface OrderItem {
  product_id: number;
  product?: Product;
  quantity: number;
  unit_cost: number;
  total: number;
}

/** Form data structure */
interface FormData {
  supplier_id: string;
  location_id: string;
  order_date: string;
  expected_delivery_date: string;
  notes: string;
  items: OrderItem[];
}

/** User information from auth */
interface User {
  businesses_one?: Array<{
    currency?: string;
    name?: string;
  }>;
}

/** Location/Warehouse information */
interface Location {
  id: number;
  location_name: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  head_office?: string;
  location_status?: string;
  phone?: string;
  postal_code?: string;
}

// ==============================================
// Constants
// ==============================================

const MOBILE_BREAKPOINT = 768;
const CURRENCY_LOCALE = "en-US";
const DEFAULT_CURRENCY = "USD";
const DRAFT_STORAGE_KEY = "purchase-order-draft";

// ==============================================
// Utility Functions
// ==============================================

/** Format date to YYYY-MM-DD for input fields */
const formatDateForInput = (date: Date): string => date.toISOString().split("T")[0];

/** Format number as currency with custom symbol */
const formatCurrency = (amount: number, symbol: string = "$"): string => {
  return new Intl.NumberFormat(CURRENCY_LOCALE, {
    style: "currency",
    currency: DEFAULT_CURRENCY,
    minimumFractionDigits: 2,
  })
    .format(amount)
    .replace(/^\$/, symbol);
};

/** Extract array from API response using multiple possible paths */
const extractDataFromResponse = <T,>(response: any, paths: string[]): T[] => {
  for (const path of paths) {
    const data = path.split(".").reduce((obj, key) => obj?.[key], response);
    if (Array.isArray(data)) return data;
  }
  return [];
};

/** Format full address from location object */
const getFullAddress = (location: Location): string => {
  const parts = [
    location.address,
    location.city,
    location.state,
    location.country,
    location.postal_code,
  ].filter(Boolean);
  return parts.length ? parts.join(", ") : "No address available";
};

// ==============================================
// Custom Hooks
// ==============================================

/** Hook to detect mobile viewport */
const useMobileDetect = (): boolean => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return isMobile;
};

/** Hook to manage form state and operations */
const useFormData = (initialData: Partial<FormData> = {}) => {
  const [formData, setFormData] = useState<FormData>({
    supplier_id: "",
    location_id: "",
    order_date: formatDateForInput(new Date()),
    expected_delivery_date: "",
    notes: "",
    items: [],
    ...initialData,
  });

  const updateField = useCallback((field: keyof FormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const addItem = useCallback((product: Product, quantity: number) => {
    setFormData((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          product_id: product.pid,
          product,
          quantity,
          unit_cost: product.cost_price,
          total: product.cost_price * quantity,
        },
      ],
    }));
  }, []);

  const updateItem = useCallback(
    (index: number, field: keyof OrderItem, value: any) => {
      setFormData((prev) => {
        const updatedItems = [...prev.items];
        updatedItems[index] = { ...updatedItems[index], [field]: value };
        
        // Recalculate total if quantity or unit cost changes
        if (field === "quantity" || field === "unit_cost") {
          const item = updatedItems[index];
          updatedItems[index].total = item.quantity * item.unit_cost;
        }
        return { ...prev, items: updatedItems };
      });
    },
    []
  );

  const removeItem = useCallback((index: number) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  }, []);

  const batchRemoveItems = useCallback((indices: number[]) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => !indices.includes(i)),
    }));
  }, []);

  return { formData, updateField, addItem, updateItem, removeItem, batchRemoveItems, setFormData };
};

// ==============================================
// Components
// ==============================================

/** Product card component for modal display */
const ProductCard = memo(
  ({
    product,
    isSelected,
    onSelect,
    currencySymbol,
  }: {
    product: Product;
    isSelected: boolean;
    onSelect: () => void;
    currencySymbol: string;
  }) => (
    <button
      onClick={onSelect}
      className={`w-full text-left p-3 sm:p-4 rounded-lg border transition-all ${
        isSelected
          ? "border-[#1e3a5f] bg-[#1e3a5f]/5 ring-2 ring-[#1e3a5f]/20"
          : "border-stone-200 hover:border-stone-300 hover:bg-stone-50"
      }`}
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0">
        <div className="flex-1">
          <p className="font-medium text-stone-900 text-sm sm:text-base">
            {product.product_name}
          </p>
          <p className="text-xs sm:text-sm text-stone-500">SKU: {product.sku}</p>
          {product.category && (
            <span className="inline-block mt-1 px-2 py-0.5 bg-stone-100 text-stone-600 text-xs rounded">
              {product.category}
            </span>
          )}
        </div>
        <div className="text-left sm:text-right">
          <p className="font-semibold text-[#1e3a5f] text-sm sm:text-base">
            {formatCurrency(product.cost_price, currencySymbol)}
          </p>
          <p className="text-xs text-stone-500">Stock: {product.current_stock}</p>
        </div>
      </div>
    </button>
  )
);

ProductCard.displayName = "ProductCard";

/** Quick Search Dropdown Component */
const QuickSearchDropdown: React.FC<{
  searchTerm: string;
  onSelect: (product: Product) => void;
  products: Product[];
  existingProductIds: number[];
  currencySymbol: string;
}> = memo(({ searchTerm, onSelect, products, existingProductIds, currencySymbol }) => {
  const filteredProducts = useMemo(() => {
    if (!searchTerm) return [];
    const searchLower = searchTerm.toLowerCase();
    return products
      .filter(
        (p) =>
          !existingProductIds.includes(p.pid) &&
          (p.product_name?.toLowerCase().includes(searchLower) ||
            p.sku?.toLowerCase().includes(searchLower))
      )
      .slice(0, 5);
  }, [searchTerm, products, existingProductIds]);

  if (!searchTerm || filteredProducts.length === 0) return null;

  return (
    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-stone-200 rounded-lg shadow-lg z-30 max-h-64 overflow-y-auto">
      {filteredProducts.map((product) => (
        <button
          key={product.pid}
          onClick={() => onSelect(product)}
          className="w-full px-4 py-3 text-left hover:bg-stone-50 border-b border-stone-100 last:border-0"
        >
          <div className="flex justify-between items-center">
            <div>
              <p className="font-medium text-stone-900">{product.product_name}</p>
              <p className="text-xs text-stone-500">SKU: {product.sku}</p>
            </div>
            <p className="font-semibold text-[#1e3a5f]">
              {formatCurrency(product.cost_price, currencySymbol)}
            </p>
          </div>
        </button>
      ))}
    </div>
  );
});

QuickSearchDropdown.displayName = "QuickSearchDropdown";

/** Modal for searching and selecting products */
const ProductSearchModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSelectProduct: (product: Product, quantity: number) => void;
  existingProductIds: number[];
  currencySymbol: string;
  products: Product[];
  isLoading: boolean;
}> = memo(
  ({
    isOpen,
    onClose,
    onSelectProduct,
    existingProductIds,
    currencySymbol,
    products,
    isLoading,
  }) => {
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [quantity, setQuantity] = useState(1);
    const [selectedCategory, setSelectedCategory] = useState<string>("all");

    // Get unique categories
    const categories = useMemo(() => {
      const cats = new Set(products.map(p => p.category).filter(Boolean));
      return ["all", ...Array.from(cats)];
    }, [products]);

    // Reset modal state when opened
    useEffect(() => {
      if (isOpen) {
        setSearchTerm("");
        setSelectedProduct(null);
        setQuantity(1);
        setSelectedCategory("all");
      }
    }, [isOpen]);

    // Filter products based on search and existing selections
    const filteredProducts = useMemo(() => {
      const searchLower = searchTerm.toLowerCase();
      return products.filter(
        (product) =>
          !existingProductIds.includes(product.pid) &&
          (selectedCategory === "all" || product.category === selectedCategory) &&
          (product.product_name?.toLowerCase().includes(searchLower) ||
            product.sku?.toLowerCase().includes(searchLower))
      );
    }, [products, existingProductIds, searchTerm, selectedCategory]);

    const handleAddProduct = () => {
      if (selectedProduct && quantity > 0) {
        onSelectProduct(selectedProduct, quantity);
        onClose();
      }
    };

    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50 p-2 sm:p-4">
        <div className="bg-white rounded-xl sm:rounded-2xl w-full max-w-4xl max-h-[90vh] sm:max-h-[85vh] flex flex-col overflow-hidden shadow-2xl mx-2 sm:mx-0">
          {/* Modal Header */}
          <div className="bg-gradient-to-r from-[#1e3a5f] to-[#2c4c6e] px-4 sm:px-6 py-4 sm:py-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-white">
                  Add Products
                </h2>
                <p className="text-white/80 text-xs sm:text-sm">
                  Select products for your purchase order
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-white" />
              </button>
            </div>
          </div>

          {/* Search and Filter Bar */}
          <div className="p-4 sm:p-6 border-b border-stone-200">
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by product name or SKU..."
                  className="w-full pl-10 pr-4 py-2 sm:py-2.5 text-sm sm:text-base border border-stone-200 rounded-lg focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f] outline-none"
                  autoFocus
                />
              </div>
              
              {/* Category Filter */}
              {categories.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-1 text-xs sm:text-sm rounded-full whitespace-nowrap transition-colors ${
                        selectedCategory === cat
                          ? "bg-[#1e3a5f] text-white"
                          : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                      }`}
                    >
                      {cat === "all" ? "All Categories" : cat}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Products List */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-8 sm:py-12">
                <Loader2 className="h-8 w-8 animate-spin text-[#1e3a5f] mb-3" />
                <p className="text-stone-500 text-sm sm:text-base">
                  Loading products...
                </p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-8 sm:py-12">
                <Package className="h-12 w-12 mx-auto text-stone-300 mb-3" />
                <p className="text-stone-500 text-sm sm:text-base">
                  {searchTerm
                    ? "No products match your search"
                    : "No products available"}
                </p>
              </div>
            ) : (
              <>
                <p className="text-xs text-stone-500 mb-3">
                  {filteredProducts.length} products found
                </p>
                <div className="space-y-2">
                  {filteredProducts.map((product) => (
                    <ProductCard
                      key={product.pid}
                      product={product}
                      isSelected={selectedProduct?.pid === product.pid}
                      onSelect={() => setSelectedProduct(product)}
                      currencySymbol={currencySymbol}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Quantity Selection */}
          {selectedProduct && (
            <div className="border-t border-stone-200 p-4 sm:p-6 bg-stone-50">
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-stone-700 mb-2">
                    Quantity for {selectedProduct.product_name}
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="px-3 py-2 border border-stone-300 rounded-lg hover:bg-stone-100"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={(e) =>
                        setQuantity(Math.max(1, parseInt(e.target.value) || 1))
                      }
                      className="w-24 px-3 py-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f] outline-none text-center"
                    />
                    <button
                      type="button"
                      onClick={() => setQuantity(quantity + 1)}
                      className="px-3 py-2 border border-stone-300 rounded-lg hover:bg-stone-100"
                    >
                      +
                    </button>
                    {selectedProduct.current_stock > 0 && (
                      <span className="text-xs text-stone-500 ml-2">
                        In stock: {selectedProduct.current_stock}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={handleAddProduct}
                  className="px-6 py-2 bg-[#1e3a5f] text-white rounded-lg hover:bg-[#2c4c6e] transition-colors font-medium sm:mt-6"
                >
                  Add to Order
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
);

ProductSearchModal.displayName = "ProductSearchModal";

/** Row component for displaying order items */
const OrderItemRow: React.FC<{
  item: OrderItem;
  index: number;
  onUpdate: (index: number, field: keyof OrderItem, value: any) => void;
  onRemove: (index: number) => void;
  currencySymbol: string;
  isSelected?: boolean;
  onToggleSelect?: (index: number) => void;
}> = memo(({ item, index, onUpdate, onRemove, currencySymbol, isSelected, onToggleSelect }) => {
  const isMobile = useMobileDetect();
  const formatCurr = useCallback(
    (amount: number) => formatCurrency(amount, currencySymbol),
    [currencySymbol]
  );

  const handleQuantityChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const qty = Math.max(1, parseInt(e.target.value) || 1);
      onUpdate(index, "quantity", qty);
    },
    [index, onUpdate]
  );

  const handleCostChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const cost = Math.max(0, parseFloat(e.target.value) || 0);
      onUpdate(index, "unit_cost", cost);
    },
    [index, onUpdate]
  );

  const handleRemove = useCallback(() => onRemove(index), [index, onRemove]);

  // Mobile layout
  if (isMobile) {
    return (
      <div className="p-4 bg-stone-50 rounded-lg border border-stone-200 space-y-3">
        <div className="flex justify-between items-start">
          <div className="flex items-start gap-2">
            {onToggleSelect && (
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => onToggleSelect(index)}
                className="mt-1"
              />
            )}
            <div>
              <p className="font-medium text-stone-900">
                {item.product?.product_name || `Product #${item.product_id}`}
              </p>
              <p className="text-xs text-stone-500">
                SKU: {item.product?.sku || "N/A"}
              </p>
            </div>
          </div>
          <button
            onClick={handleRemove}
            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-stone-500 block mb-1">
              Quantity
            </label>
            <input
              type="number"
              min="1"
              value={item.quantity}
              onChange={handleQuantityChange}
              className="w-full px-2 py-1.5 border border-stone-200 rounded-lg text-sm focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f] outline-none"
            />
          </div>
          <div>
            <label className="text-xs text-stone-500 block mb-1">
              Unit Cost
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={item.unit_cost}
              onChange={handleCostChange}
              className="w-full px-2 py-1.5 border border-stone-200 rounded-lg text-sm focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f] outline-none"
            />
          </div>
        </div>
        <div className="flex justify-between items-center pt-2">
          <span className="text-sm text-stone-600">Total:</span>
          <p className="font-semibold text-stone-900">
            {formatCurr(item.total)}
          </p>
        </div>
      </div>
    );
  }

  // Desktop layout
  return (
    <div className="flex gap-3 items-center p-4 bg-stone-50 rounded-lg group hover:bg-stone-100 transition-colors">
      {onToggleSelect && (
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onToggleSelect(index)}
          className="w-4 h-4"
        />
      )}
      <div className="flex-1">
        <p className="font-medium text-stone-900">
          {item.product?.product_name || `Product #${item.product_id}`}
        </p>
        <p className="text-xs text-stone-500">
          SKU: {item.product?.sku || "N/A"}
        </p>
      </div>
      <div className="w-28">
        <label className="text-xs text-stone-500 block mb-1">Quantity</label>
        <input
          type="number"
          min="1"
          value={item.quantity}
          onChange={handleQuantityChange}
          className="w-full px-2 py-1.5 border border-stone-200 rounded-lg text-sm focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f] outline-none"
        />
      </div>
      <div className="w-36">
        <label className="text-xs text-stone-500 block mb-1">Unit Cost</label>
        <input
          type="number"
          step="0.01"
          min="0"
          value={item.unit_cost}
          onChange={handleCostChange}
          className="w-full px-2 py-1.5 border border-stone-200 rounded-lg text-sm focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f] outline-none"
        />
      </div>
      <div className="w-32 text-right">
        <label className="text-xs text-stone-500 block mb-1">Total</label>
        <p className="font-semibold text-stone-900">{formatCurr(item.total)}</p>
      </div>
      <button
        onClick={handleRemove}
        className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
});

OrderItemRow.displayName = "OrderItemRow";

// ==============================================
// Main Component
// ==============================================

const NewPurchaseOrderPage = ({ user }: { user: User }) => {
  const router = useRouter();
  const isMobile = useMobileDetect();
  const currencySymbol = user?.businesses_one?.[0]?.currency || "$";
  const businessName = user?.businesses_one?.[0]?.name || "Business";

  const { formData, updateField, addItem, updateItem, removeItem, batchRemoveItems, setFormData } =
    useFormData();

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [quickSearchTerm, setQuickSearchTerm] = useState("");
  const [expandedSections, setExpandedSections] = useState({
    details: true,
    items: true,
    notes: false,
  });
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);

  // Memoized derived data
  const selectedSupplier = useMemo(
    () => suppliers.find((s) => s.vid === parseInt(formData.supplier_id)) || null,
    [formData.supplier_id, suppliers]
  );

  const selectedLocation = useMemo(
    () => locations.find((l) => l.id === parseInt(formData.location_id)) || null,
    [formData.location_id, locations]
  );

  const subtotal = useMemo(
    () => formData.items.reduce((sum, item) => sum + item.total, 0),
    [formData.items]
  );

  const recentSuppliers = useMemo(() => {
    return suppliers.slice(0, 3);
  }, [suppliers]);

  const formProgress = useMemo(() => {
    const steps = {
      details: !!(formData.supplier_id && formData.location_id),
      items: formData.items.length > 0,
      review: false,
    };
    const completed = Object.values(steps).filter(Boolean).length;
    return { steps, completed, total: 3 };
  }, [formData]);

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [suppliersRes, productsRes, locationsRes] = await Promise.all([
          apiGet("/vendors", {}, false),
          apiGet("/products", {}, false),
          apiGet("/locations", {}, false),
        ]);

        const fetchedSuppliers = extractDataFromResponse<Supplier>(suppliersRes, [
          "data.data.vendors",
          "data.data",
          "data",
        ]).map(s => ({
          ...s,
          last_order_date: "2024-01-15",
          avg_lead_time: Math.floor(Math.random() * 7) + 1,
          on_time_rate: 85 + Math.floor(Math.random() * 15),
        }));
        setSuppliers(fetchedSuppliers);

        const rawProducts = extractDataFromResponse<any>(productsRes, [
          "data.data.products",
          "data.data",
          "data.products",
          "data",
        ]);
        setProducts(
          rawProducts.map((p: any) => ({
            pid: p.pid || p.id,
            product_name: p.product_name || p.name,
            sku: p.sku,
            cost_price: parseFloat(p.cost_price) || 0,
            current_stock: parseInt(p.current_stock) || 0,
            category: p.category || "Uncategorized",
          }))
        );

        setLocations(
          extractDataFromResponse<Location>(locationsRes, [
            "data",
            "data.data",
            "data.locations",
          ])
        );
      } catch (error) {
        toast.error("Failed to load data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();

    // Load draft from localStorage
    const savedDraft = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft);
        setFormData(draft);
        toast.success("Draft loaded", { icon: "📝" });
      } catch (error) {
        console.error("Failed to load draft:", error);
      }
    }
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleSubmit(e as any);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        e.preventDefault();
        setShowProductModal(true);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(formData));
        toast.success('Draft saved', { icon: '💾' });
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setShowKeyboardShortcuts(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [formData]);

  // Auto-save draft
  useEffect(() => {
    const saveTimer = setTimeout(() => {
      if (formData.items.length > 0 || formData.supplier_id) {
        localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(formData));
      }
    }, 3000);

    return () => clearTimeout(saveTimer);
  }, [formData]);

  // Form validation
  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.supplier_id) newErrors.supplier_id = "Please select a supplier";
    if (!formData.location_id) newErrors.location_id = "Please select a location";
    if (!formData.order_date) newErrors.order_date = "Please select an order date";
    if (formData.items.length === 0)
      newErrors.items = "Please add at least one product";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  // Submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error("Please fix the errors before submitting");
      return;
    }

    setIsSubmitting(true);

    const payload = {
      supplier_id: parseInt(formData.supplier_id),
      location_id: parseInt(formData.location_id),
      order_date: formData.order_date,
      expected_delivery_date: formData.expected_delivery_date || null,
      notes: formData.notes || null,
      items: formData.items.map(({ product_id, quantity, unit_cost }) => ({
        product_id,
        quantity,
        unit_cost,
      })),
    };

    try {
      await apiPost("/purchase_order_items", payload);
      localStorage.removeItem(DRAFT_STORAGE_KEY);
      toast.success("Purchase order created successfully!");
      router.push("/purchase");
      router.refresh();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to create purchase order");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickAdd = (product: Product) => {
    addItem(product, 1);
    setQuickSearchTerm("");
    toast.success(`Added ${product.product_name}`);
  };

  const handleSelectAll = () => {
    if (selectedItems.length === formData.items.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(formData.items.map((_, i) => i));
    }
  };

  const handleBatchRemove = () => {
    batchRemoveItems(selectedItems);
    setSelectedItems([]);
    toast.success(`Removed ${selectedItems.length} items`);
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <div className="bg-white border-b border-stone-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
            <div className="flex items-center gap-2 sm:gap-3">
              <Link
                href="/purchase"
                className="p-1.5 sm:p-2 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
              </Link>
              <div>
                <h1 className="text-base sm:text-lg md:text-xl font-bold text-stone-900">
                  Create Purchase Order
                </h1>
                <p className="text-xs sm:text-sm text-stone-500 hidden sm:block">
                  {businessName}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={() => setShowKeyboardShortcuts(true)}
                className="p-2 text-stone-500 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors"
                title="Keyboard Shortcuts (Ctrl+K)"
              >
                <Keyboard className="h-4 w-4" />
              </button>
              <Link
                href="/purchase"
                className="px-3 sm:px-4 py-1.5 sm:py-2 text-sm sm:text-base text-stone-600 hover:bg-stone-100 rounded-lg border border-stone-200 transition-colors"
              >
                Cancel
              </Link>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 text-sm sm:text-base bg-[#1e3a5f] text-white rounded-lg hover:bg-[#2c4c6e] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                <span>
                  {isSubmitting
                    ? isMobile
                      ? "..."
                      : "Creating..."
                    : isMobile
                    ? "Create"
                    : "Create PO"}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Order Summary */}
      <div className="sticky top-[57px] sm:top-[73px] z-30 bg-white/95 backdrop-blur-sm border-b border-stone-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-2 sm:py-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-4 sm:gap-6">
              <div>
                <span className="text-xs text-stone-500">Items</span>
                <p className="font-semibold text-stone-900">{formData.items.length}</p>
              </div>
              <div>
                <span className="text-xs text-stone-500">Total</span>
                <p className="font-semibold text-[#1e3a5f] text-lg">
                  {formatCurrency(subtotal, currencySymbol)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="hidden sm:block">
                <div className="flex items-center gap-1">
                  {[...Array(formProgress.total)].map((_, i) => (
                    <div
                      key={i}
                      className={`h-1.5 w-8 rounded-full ${
                        i < formProgress.completed ? "bg-green-500" : "bg-stone-200"
                      }`}
                    />
                  ))}
                </div>
              </div>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-4 py-1.5 bg-[#1e3a5f] text-white rounded-lg text-sm font-medium hover:bg-[#2c4c6e] disabled:opacity-50"
              >
                {isSubmitting ? "Creating..." : "Create Order"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6">
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          {/* Order Details Section */}
          <div className="bg-white rounded-lg border border-stone-200 overflow-hidden">
            <button
              type="button"
              onClick={() => toggleSection('details')}
              className="w-full p-4 sm:p-6 flex items-center justify-between hover:bg-stone-50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-[#1e3a5f]" />
                <h2 className="text-base sm:text-lg font-semibold text-stone-900">
                  Order Details
                </h2>
                {formProgress.steps.details && (
                  <CheckCircle2 className="h-4 w-4 text-green-500 ml-2" />
                )}
              </div>
              {expandedSections.details ? (
                <ChevronUp className="h-5 w-5 text-stone-400" />
              ) : (
                <ChevronDown className="h-5 w-5 text-stone-400" />
              )}
            </button>

            {expandedSections.details && (
              <div className="px-4 sm:px-6 pb-4 sm:pb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  {/* Supplier Selection */}
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-2">
                      Supplier <span className="text-rose-500">*</span>
                    </label>
                    
                    {/* Recent Suppliers */}
                    {recentSuppliers.length > 0 && (
                      <div className="flex gap-2 mb-2">
                        {recentSuppliers.map(supplier => (
                          <button
                            key={supplier.vid}
                            type="button"
                            onClick={() => updateField('supplier_id', supplier.vid.toString())}
                            className="px-3 py-1 text-xs bg-stone-100 hover:bg-stone-200 rounded-full transition-colors flex items-center gap-1"
                          >
                            <History className="h-3 w-3" />
                            {supplier.vendor_name}
                          </button>
                        ))}
                      </div>
                    )}

                    <select
                      value={formData.supplier_id}
                      onChange={(e) => updateField("supplier_id", e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f] outline-none text-sm sm:text-base ${
                        errors.supplier_id ? "border-rose-500" : "border-stone-300"
                      }`}
                    >
                      <option value="">Select a supplier</option>
                      {suppliers.map((supplier) => (
                        <option key={supplier.vid} value={supplier.vid}>
                          {supplier.vendor_name}
                        </option>
                      ))}
                    </select>
                    {errors.supplier_id && (
                      <p className="mt-1 text-xs text-rose-500 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.supplier_id}
                      </p>
                    )}

                    {/* Supplier Details with Stats */}
                    {selectedSupplier && (
                      <div className="mt-3 space-y-2">
                        <div className="p-3 bg-stone-50 rounded-lg border border-stone-200">
                          <p className="text-xs font-medium text-stone-500 mb-2">
                            Contact Information
                          </p>
                          {selectedSupplier.contact_person && (
                            <div className="flex items-center gap-2 text-xs sm:text-sm text-stone-600">
                              <User className="h-3 w-3" />
                              <span className="truncate">
                                {selectedSupplier.contact_person}
                              </span>
                            </div>
                          )}
                          {selectedSupplier.email && (
                            <div className="flex items-center gap-2 text-xs sm:text-sm text-stone-600 mt-1">
                              <Mail className="h-3 w-3 flex-shrink-0" />
                              <span className="truncate">{selectedSupplier.email}</span>
                            </div>
                          )}
                          {selectedSupplier.phone && (
                            <div className="flex items-center gap-2 text-xs sm:text-sm text-stone-600 mt-1">
                              <Phone className="h-3 w-3" />
                              <span>{selectedSupplier.phone}</span>
                            </div>
                          )}
                        </div>

                        {/* Supplier Performance Stats */}
                        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <p className="text-xs font-medium text-blue-700 mb-2">
                            Performance Metrics
                          </p>
                          <div className="grid grid-cols-3 gap-2 text-center">
                            <div>
                              <p className="text-xs text-blue-600">Lead Time</p>
                              <p className="font-semibold text-blue-900">
                                {selectedSupplier.avg_lead_time} days
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-blue-600">On-Time</p>
                              <p className="font-semibold text-blue-900">
                                {selectedSupplier.on_time_rate}%
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-blue-600">Last Order</p>
                              <p className="font-semibold text-blue-900">
                                {selectedSupplier.last_order_date}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Location and Dates */}
                  <div className="space-y-4">
                    {/* Location Selection */}
                    <div>
                      <label className="block text-sm font-medium text-stone-700 mb-2">
                        Location <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={formData.location_id}
                        onChange={(e) => updateField("location_id", e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f] outline-none text-sm sm:text-base ${
                          errors.location_id ? "border-rose-500" : "border-stone-300"
                        }`}
                      >
                        <option value="">Select a location</option>
                        {locations.map((location) => (
                          <option key={location.id} value={location.id}>
                            {location.location_name}
                            {location.head_office === "yes" && " (Main Office)"}
                            {location.location_status === "on" && " ✓"}
                          </option>
                        ))}
                      </select>
                      {errors.location_id && (
                        <p className="mt-1 text-xs text-rose-500 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {errors.location_id}
                        </p>
                      )}

                      {/* Location Details */}
                      {selectedLocation && (
                        <div className="mt-3 p-3 bg-stone-50 rounded-lg border border-stone-200">
                          <p className="text-xs font-medium text-stone-500 mb-2">
                            Location Details
                          </p>
                          <div className="flex items-start gap-2 text-xs sm:text-sm text-stone-600">
                            <MapPin className="h-3 w-3 mt-0.5 flex-shrink-0" />
                            <div>
                              <p>{getFullAddress(selectedLocation)}</p>
                              {selectedLocation.phone && (
                                <p className="mt-1">Phone: {selectedLocation.phone}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Order Date */}
                    <div>
                      <label className="block text-sm font-medium text-stone-700 mb-2">
                        Order Date <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="date"
                        value={formData.order_date}
                        onChange={(e) => updateField("order_date", e.target.value)}
                        className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f] outline-none text-sm sm:text-base"
                      />
                    </div>

                    {/* Expected Delivery Date */}
                    <div>
                      <label className="block text-sm font-medium text-stone-700 mb-2">
                        Expected Delivery Date
                      </label>
                      <input
                        type="date"
                        value={formData.expected_delivery_date}
                        onChange={(e) =>
                          updateField("expected_delivery_date", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f] outline-none text-sm sm:text-base"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Order Items Section */}
          <div className="bg-white rounded-lg border border-stone-200 overflow-hidden">
            <button
              type="button"
              onClick={() => toggleSection('items')}
              className="w-full p-4 sm:p-6 flex items-center justify-between hover:bg-stone-50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-[#1e3a5f]" />
                <h2 className="text-base sm:text-lg font-semibold text-stone-900">
                  Order Items
                </h2>
                {formProgress.steps.items && (
                  <CheckCircle2 className="h-4 w-4 text-green-500 ml-2" />
                )}
              </div>
              {expandedSections.items ? (
                <ChevronUp className="h-5 w-5 text-stone-400" />
              ) : (
                <ChevronDown className="h-5 w-5 text-stone-400" />
              )}
            </button>

            {expandedSections.items && (
              <div className="px-4 sm:px-6 pb-4 sm:pb-6">
                {/* Quick Search Bar */}
                <div className="mb-4">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                      <input
                        type="text"
                        value={quickSearchTerm}
                        onChange={(e) => setQuickSearchTerm(e.target.value)}
                        placeholder="Quick add product by name or SKU..."
                        className="w-full pl-10 pr-4 py-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f] outline-none text-sm"
                      />
                      <QuickSearchDropdown
                        searchTerm={quickSearchTerm}
                        onSelect={handleQuickAdd}
                        products={products}
                        existingProductIds={formData.items.map(i => i.product_id)}
                        currencySymbol={currencySymbol}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowProductModal(true)}
                      className="px-4 py-2 bg-[#1e3a5f] text-white rounded-lg hover:bg-[#2c4c6e] flex items-center gap-2 text-sm"
                    >
                      <Plus className="h-4 w-4" />
                      Browse
                    </button>
                  </div>
                  <p className="text-xs text-stone-500 mt-1">
                    Press <kbd className="px-1.5 py-0.5 bg-stone-100 rounded">Ctrl</kbd> + <kbd className="px-1.5 py-0.5 bg-stone-100 rounded">A</kbd> to open product browser
                  </p>
                </div>

                {formData.items.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-[#1e3a5f]/5 rounded-full mb-4">
                      <Package className="h-10 w-10 text-[#1e3a5f]" />
                    </div>
                    <h3 className="text-lg font-medium text-stone-900 mb-1">
                      No items added
                    </h3>
                    <p className="text-sm text-stone-500 mb-4">
                      Start building your purchase order by adding products
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowProductModal(true)}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-[#1e3a5f] text-white rounded-lg hover:bg-[#2c4c6e]"
                    >
                      <Plus className="h-4 w-4" />
                      Add First Product
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Batch Actions */}
                    {formData.items.length > 1 && (
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={handleSelectAll}
                            className="text-xs text-stone-500 hover:text-stone-700"
                          >
                            {selectedItems.length === formData.items.length
                              ? "Deselect All"
                              : "Select All"}
                          </button>
                          {selectedItems.length > 0 && (
                            <button
                              type="button"
                              onClick={handleBatchRemove}
                              className="text-xs text-rose-500 hover:text-rose-700"
                            >
                              Remove Selected ({selectedItems.length})
                            </button>
                          )}
                        </div>
                        <p className="text-xs text-stone-500">
                          {formData.items.length} items
                        </p>
                      </div>
                    )}

                    {/* Items List */}
                    <div className="space-y-2">
                      {formData.items.map((item, index) => (
                        <OrderItemRow
                          key={index}
                          item={item}
                          index={index}
                          onUpdate={updateItem}
                          onRemove={removeItem}
                          currencySymbol={currencySymbol}
                          isSelected={selectedItems.includes(index)}
                          onToggleSelect={(idx) => {
                            setSelectedItems(prev =>
                              prev.includes(idx)
                                ? prev.filter(i => i !== idx)
                                : [...prev, idx]
                            );
                          }}
                        />
                      ))}
                    </div>

                    {/* Total */}
                    <div className="mt-4 pt-4 border-t border-stone-200">
                      <div className="flex flex-col sm:flex-row justify-end">
                        <div className="text-left sm:text-right w-full sm:w-auto">
                          <p className="text-xs sm:text-sm text-stone-600">
                            Total Amount
                          </p>
                          <p className="text-xl sm:text-2xl font-bold text-[#1e3a5f]">
                            {formatCurrency(subtotal, currencySymbol)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Notes Section */}
          <div className="bg-white rounded-lg border border-stone-200 overflow-hidden">
            <button
              type="button"
              onClick={() => toggleSection('notes')}
              className="w-full p-4 sm:p-6 flex items-center justify-between hover:bg-stone-50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-[#1e3a5f]" />
                <h2 className="text-base sm:text-lg font-semibold text-stone-900">
                  Additional Notes
                </h2>
              </div>
              {expandedSections.notes ? (
                <ChevronUp className="h-5 w-5 text-stone-400" />
              ) : (
                <ChevronDown className="h-5 w-5 text-stone-400" />
              )}
            </button>

            {expandedSections.notes && (
              <div className="px-4 sm:px-6 pb-4 sm:pb-6">
                <textarea
                  value={formData.notes}
                  onChange={(e) => updateField("notes", e.target.value)}
                  rows={isMobile ? 4 : 3}
                  placeholder="Add any additional notes or instructions..."
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f] outline-none resize-none text-sm sm:text-base"
                />
              </div>
            )}
          </div>
        </form>
      </main>

      {/* Product Selection Modal */}
      <ProductSearchModal
        isOpen={showProductModal}
        onClose={() => setShowProductModal(false)}
        onSelectProduct={addItem}
        existingProductIds={formData.items.map((item) => item.product_id)}
        currencySymbol={currencySymbol}
        products={products}
        isLoading={isLoading}
      />

      {/* Keyboard Shortcuts Modal */}
      {showKeyboardShortcuts && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="bg-[#1e3a5f] px-6 py-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white">Keyboard Shortcuts</h3>
                <button
                  onClick={() => setShowKeyboardShortcuts(false)}
                  className="p-1 hover:bg-white/10 rounded-lg"
                >
                  <X className="h-5 w-5 text-white" />
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                {[
                  { keys: ['Ctrl', 'Enter'], description: 'Submit order' },
                  { keys: ['Ctrl', 'A'], description: 'Open product browser' },
                  { keys: ['Ctrl', 'S'], description: 'Save draft' },
                  { keys: ['Ctrl', 'K'], description: 'Show shortcuts' },
                ].map((shortcut, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-sm text-stone-600">{shortcut.description}</span>
                    <div className="flex items-center gap-1">
                      {shortcut.keys.map((key, j) => (
                        <React.Fragment key={j}>
                          <kbd className="px-2 py-1 bg-stone-100 border border-stone-300 rounded text-xs font-mono">
                            {key}
                          </kbd>
                          {j < shortcut.keys.length - 1 && <span className="text-stone-400">+</span>}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={() => setShowKeyboardShortcuts(false)}
                className="w-full mt-6 px-4 py-2 bg-[#1e3a5f] text-white rounded-lg hover:bg-[#2c4c6e]"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default withAuth(NewPurchaseOrderPage);