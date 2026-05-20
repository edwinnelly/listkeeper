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
  Package,
  Search,
  AlertCircle,
  MapPin,
  ShoppingCart,
  Calendar,
  Warehouse,
  ArrowRightLeft,
  ChevronDown,
  Hash,
  StickyNote,
  Building2,
  Database,
  Store,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { toast } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

// ==============================================
// Type Definitions
// ==============================================

interface Product {
  pid: number;
  product_name: string;
  sku: string;
  cost_price: number;
  current_stock: number;
  barcode?: string;
  category?: string;
  image?: string | null;
}

interface ProductLocation {
  id: number;
  location_id: number;
  product_id: number;
  cost_price: number;
  sale_price: number;
  stock_quantity: number;
  encrypted_id: string;
  encrypted_location_id: string;
  encrypted_pid: string;
  location_name: string;
  is_out_of_stock: boolean;
  product: {
    id: number;
    name: string;
    sku: string;
    description: string;
    barcode: string;
    is_active: boolean;
    image: string | null;
  };
  category: {
    id: number;
    name: string;
  };
}

interface DatabaseProduct {
  id: number;
  name: string;
  sku: string;
  barcode?: string;
  description?: string;
  cost_price?: number;
  image?: string | null;
  category?: {
    id: number;
    name: string;
  };
  is_active?: boolean;
}

interface TransferItem {
  product_id: number;
  product?: Product;
  stock_quantity: number;
  unit_cost: number;
  total: number;
  available_stock: number;
}

interface FormData {
  from_location_id: string;
  to_location_id: string;
  transfer_date: string;
  expected_delivery_date: string;
  notes: string;
  reference_number: string;
  items: TransferItem[];
}

interface User {
  businesses_one?: Array<{
    currency?: string;
    name?: string;
  }>;
  user_roles?: {
    transfer_create?: string;
    [key: string]: string | undefined;
  };
}

interface Location {
  id: number;
  encrypted_id: string;
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

const CURRENCY_LOCALE = "en-US";
const DEFAULT_CURRENCY = "USD";

type SearchTab = "location" | "database";

// ==============================================
// Utility Functions
// ==============================================

const formatDateForInput = (date: Date): string => date.toISOString().split("T")[0];

const formatCurrency = (amount: number, symbol: string = "$"): string => {
  return new Intl.NumberFormat(CURRENCY_LOCALE, {
    style: "currency",
    currency: DEFAULT_CURRENCY,
    minimumFractionDigits: 2,
  })
    .format(amount)
    .replace(/^\$/, symbol);
};

const extractDataFromResponse = <T,>(response: any, paths: string[]): T[] => {
  for (const path of paths) {
    const data = path.split(".").reduce((obj, key) => obj?.[key], response);
    if (Array.isArray(data)) return data;
  }
  return [];
};

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

const mapProductLocationToProduct = (pl: ProductLocation): Product => ({
  pid: pl.product_id,
  product_name: pl.product.name,
  sku: pl.product.sku,
  cost_price: pl.cost_price,
  current_stock: pl.stock_quantity,
  barcode: pl.product.barcode,
  category: pl.category?.name,
  image: pl.product.image,
});

const mapDatabaseProductToProduct = (dp: DatabaseProduct): Product => ({
  pid: dp.id,
  product_name: dp.name,
  sku: dp.sku,
  cost_price: dp.cost_price || 0,
  current_stock: 0,
  barcode: dp.barcode,
  category: dp.category?.name,
  image: dp.image,
});

// ==============================================
// Custom Hooks
// ==============================================

const useFormData = (initialData: Partial<FormData> = {}) => {
  const [formData, setFormData] = useState<FormData>({
    from_location_id: "",
    to_location_id: "",
    transfer_date: formatDateForInput(new Date()),
    expected_delivery_date: "",
    notes: "",
    reference_number: "",
    items: [],
    ...initialData,
  });

  const updateField = useCallback((field: keyof FormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const addItem = useCallback((product: Product, transferQuantity: number) => {
    setFormData((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          product_id: product.pid,
          product,
          stock_quantity: transferQuantity,
          unit_cost: product.cost_price,
          total: product.cost_price * transferQuantity,
          available_stock: product.current_stock,
        },
      ],
    }));
  }, []);

  const updateItem = useCallback(
    (index: number, field: keyof TransferItem, value: any) => {
      setFormData((prev) => {
        const updatedItems = [...prev.items];
        updatedItems[index] = { ...updatedItems[index], [field]: value };
        if (field === "stock_quantity" || field === "unit_cost") {
          const item = updatedItems[index];
          updatedItems[index].total = item.stock_quantity * item.unit_cost;
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

  return { formData, updateField, addItem, updateItem, removeItem };
};

// ==============================================
// Components
// ==============================================

const ProductCard = memo(
  ({
    product,
    isSelected,
    onSelect,
    currencySymbol,
    maxQuantity,
    showStock = true,
  }: {
    product: Product;
    isSelected: boolean;
    onSelect: () => void;
    currencySymbol: string;
    maxQuantity?: number;
    showStock?: boolean;
  }) => {
    const isOutOfStock = showStock && maxQuantity !== undefined && maxQuantity <= 0;
    
    return (
      <motion.button
        whileHover={{ scale: isOutOfStock ? 1 : 1.01 }}
        whileTap={{ scale: isOutOfStock ? 1 : 0.99 }}
        onClick={onSelect}
        disabled={isOutOfStock}
        className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
          isOutOfStock
            ? "border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed"
            : isSelected
            ? "border-[#166534] bg-[#166534]/5 ring-2 ring-[#166534]/20 shadow-md"
            : "border-gray-200 hover:border-gray-300 hover:shadow-sm bg-white"
        }`}
      >
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex items-start gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
              isSelected ? "bg-[#166534]" : "bg-gray-100"
            }`}>
              {product.image ? (
                <img src={product.image} alt="" className="w-10 h-10 rounded-lg object-cover" />
              ) : (
                <Package className={`h-5 w-5 ${isSelected ? "text-white" : "text-gray-500"}`} />
              )}
            </div>
            <div>
              <p className="font-semibold text-gray-900">{product.product_name}</p>
              <p className="text-xs text-gray-500">
                SKU: {product.sku}
                {product.category && ` | ${product.category}`}
              </p>
              {product.barcode && (
                <p className="text-xs text-gray-400">Barcode: {product.barcode}</p>
              )}
            </div>
          </div>
          <div className="text-left sm:text-right pl-13 sm:pl-0">
            <p className="font-bold text-[#166534] text-lg">
              {formatCurrency(product.cost_price, currencySymbol)}
            </p>
            {showStock && (
              <p className={`text-xs ${
                isOutOfStock
                  ? "text-red-500 font-medium"
                  : maxQuantity !== undefined && maxQuantity < 10
                  ? "text-orange-500 font-medium"
                  : "text-gray-500"
              }`}>
                {isOutOfStock
                  ? "Out of Stock"
                  : `Stock: ${maxQuantity !== undefined ? maxQuantity : product.current_stock}`}
              </p>
            )}
            {!showStock && (
              <p className="text-xs text-blue-500 font-medium">
                Select location for stock info
              </p>
            )}
          </div>
        </div>
      </motion.button>
    );
  }
);

ProductCard.displayName = "ProductCard";

const ProductSearchModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSelectProduct: (product: Product, quantity: number) => void;
  existingProductIds: number[];
  currencySymbol: string;
  isLoading: boolean;
  sourceLocationId: string;
}> = memo(
  ({
    isOpen,
    onClose,
    onSelectProduct,
    existingProductIds,
    currencySymbol,
    isLoading: parentLoading,
    sourceLocationId,
  }) => {
    const [activeTab, setActiveTab] = useState<SearchTab>("location");
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [transferQuantity, setTransferQuantity] = useState(1);
    
    const [productLocations, setProductLocations] = useState<ProductLocation[]>([]);
    const [isLoadingLocationStock, setIsLoadingLocationStock] = useState(false);
    
    const [databaseProducts, setDatabaseProducts] = useState<Product[]>([]);
    const [isLoadingDatabase, setIsLoadingDatabase] = useState(false);
    const [databaseSearchTerm, setDatabaseSearchTerm] = useState("");
    const [hasSearchedDatabase, setHasSearchedDatabase] = useState(false);

    useEffect(() => {
      if (isOpen && sourceLocationId && activeTab === "location") {
        setSearchTerm("");
        setSelectedProduct(null);
        setTransferQuantity(1);
        fetchProductLocations();
      }
    }, [isOpen, sourceLocationId, activeTab]);

    useEffect(() => {
      setSelectedProduct(null);
      setTransferQuantity(1);
      if (activeTab === "location") {
        setSearchTerm("");
      } else {
        setDatabaseSearchTerm("");
      }
    }, [activeTab]);

    const fetchProductLocations = async () => {
      if (!sourceLocationId) return;
      
      setIsLoadingLocationStock(true);
      try {
        const response = await apiGet(
          `/product-locations/${sourceLocationId}`,
          {},
          false
        );
        
        const data = response.data?.data || response.data || [];
        const stockData = Array.isArray(data) ? data : [];
        
        setProductLocations(stockData);
      } catch (error: any) {
        console.error("Failed to fetch product locations:", error);
        toast.error("Failed to load products for this location");
        setProductLocations([]);
      } finally {
        setIsLoadingLocationStock(false);
      }
    };

    const searchDatabase = async () => {
      if (!databaseSearchTerm.trim()) {
        toast.error("Please enter a search term");
        return;
      }

      setIsLoadingDatabase(true);
      setHasSearchedDatabase(true);
      
      try {
        const response = await apiGet(
          `/products`,
          { search: databaseSearchTerm },
          false
        );
        
        const rawProducts = extractDataFromResponse<any>(response, [
          "data.data.products",
          "data.data",
          "data.products",
          "data",
        ]);
        
        const mappedProducts = rawProducts
          .filter((p: any) => !existingProductIds.includes(p.id || p.pid))
          .map(mapDatabaseProductToProduct);
        
        setDatabaseProducts(mappedProducts);
        
        if (mappedProducts.length === 0) {
          toast("No products found matching your search", { icon: "🔍" });
        }
      } catch (error: any) {
        console.error("Failed to search database:", error);
        toast.error("Failed to search products database");
        setDatabaseProducts([]);
      } finally {
        setIsLoadingDatabase(false);
      }
    };

    const handleDatabaseKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        searchDatabase();
      }
    };

    const locationProducts = useMemo(() => {
      return productLocations
        .filter(pl => !existingProductIds.includes(pl.product_id))
        .map(mapProductLocationToProduct);
    }, [productLocations, existingProductIds]);

    const filteredLocationProducts = useMemo(() => {
      const searchLower = searchTerm.toLowerCase();
      return locationProducts.filter(
        (product) =>
          product.product_name?.toLowerCase().includes(searchLower) ||
          product.sku?.toLowerCase().includes(searchLower) ||
          product.barcode?.toLowerCase().includes(searchLower)
      );
    }, [locationProducts, searchTerm]);

    const handleAddProduct = () => {
      if (selectedProduct && transferQuantity > 0) {
        if (activeTab === "location" && transferQuantity > selectedProduct.current_stock) {
          toast.error(`Insufficient stock. Available: ${selectedProduct.current_stock}`);
          return;
        }
        onSelectProduct(selectedProduct, transferQuantity);
        onClose();
      }
    };

    return (
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50 p-4"
            onClick={onClose}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="bg-[#166534] px-6 py-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-white">Add Products to Transfer</h2>
                    <p className="text-green-200 text-sm mt-1">
                      {activeTab === "location" 
                        ? `Source location products (${productLocations.length} available)`
                        : "Search all products in database"}
                    </p>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2 hover:bg-white/10 rounded-xl transition-colors"
                  >
                    <X className="h-5 w-5 text-white" />
                  </button>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => setActiveTab("location")}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                      activeTab === "location"
                        ? "bg-white text-[#166534] shadow-md"
                        : "bg-white/10 text-white hover:bg-white/20"
                    }`}
                  >
                    <Store className="h-4 w-4" />
                    Location Stock
                  </button>
                  <button
                    onClick={() => setActiveTab("database")}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                      activeTab === "database"
                        ? "bg-white text-[#166534] shadow-md"
                        : "bg-white/10 text-white hover:bg-white/20"
                    }`}
                  >
                    <Database className="h-4 w-4" />
                    Search Database
                  </button>
                </div>
              </div>

              {/* Search Bar */}
              <div className="p-6 border-b border-gray-200">
                {activeTab === "location" ? (
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Filter by name, SKU, or barcode..."
                      className="w-full pl-12 pr-12 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#166534]/20 focus:border-[#166534] outline-none text-sm transition-all"
                      autoFocus
                    />
                    <button
                      onClick={fetchProductLocations}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-[#166534] hover:bg-gray-100 rounded-lg transition-colors"
                      title="Refresh location stock"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="text"
                        value={databaseSearchTerm}
                        onChange={(e) => setDatabaseSearchTerm(e.target.value)}
                        onKeyDown={handleDatabaseKeyDown}
                        placeholder="Search by product name, SKU, or barcode..."
                        className="w-full pl-12 pr-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#166534]/20 focus:border-[#166534] outline-none text-sm transition-all"
                        autoFocus
                      />
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={searchDatabase}
                      disabled={isLoadingDatabase}
                      className="px-6 py-3 bg-[#166534] text-white rounded-xl hover:bg-[#14532d] transition-all font-semibold text-sm disabled:opacity-50 flex items-center gap-2"
                    >
                      {isLoadingDatabase ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Search className="h-4 w-4" />
                      )}
                      Search
                    </motion.button>
                  </div>
                )}
              </div>

              {/* Products List */}
              <div className="flex-1 overflow-y-auto p-6">
                {activeTab === "location" ? (
                  isLoadingLocationStock || parentLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-[#166534]" />
                    </div>
                  ) : filteredLocationProducts.length === 0 ? (
                    <div className="text-center py-12">
                      <Store className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                      <p className="text-gray-500 text-lg font-medium">
                        {searchTerm ? "No products match your filter" : "No products available at this location"}
                      </p>
                      <p className="text-gray-400 text-sm mt-1">
                        {searchTerm 
                          ? "Try different keywords or switch to Database Search" 
                          : "Try searching the database for products from other locations"}
                      </p>
                      {!searchTerm && (
                        <button
                          onClick={() => setActiveTab("database")}
                          className="mt-4 text-[#166534] font-medium text-sm hover:underline"
                        >
                          Search Database instead →
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredLocationProducts.map((product) => (
                        <ProductCard
                          key={product.pid}
                          product={product}
                          isSelected={selectedProduct?.pid === product.pid}
                          onSelect={() => {
                            if (product.current_stock > 0) {
                              setSelectedProduct(product);
                              setTransferQuantity(1);
                            }
                          }}
                          currencySymbol={currencySymbol}
                          maxQuantity={product.current_stock}
                          showStock={true}
                        />
                      ))}
                    </div>
                  )
                ) : (
                  !hasSearchedDatabase ? (
                    <div className="text-center py-12">
                      <Database className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                      <p className="text-gray-500 text-lg font-medium">
                        Search the product database
                      </p>
                      <p className="text-gray-400 text-sm mt-1">
                        Enter a product name, SKU, or barcode to search across all locations
                      </p>
                    </div>
                  ) : isLoadingDatabase ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-[#166534]" />
                    </div>
                  ) : databaseProducts.length === 0 ? (
                    <div className="text-center py-12">
                      <Package className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                      <p className="text-gray-500 text-lg font-medium">
                        No products found
                      </p>
                      <p className="text-gray-400 text-sm mt-1">
                        Try different search terms
                      </p>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm text-gray-500 mb-3">
                        Found {databaseProducts.length} product{databaseProducts.length !== 1 ? 's' : ''} 
                        in database. Select one to add to transfer.
                      </p>
                      <div className="space-y-3">
                        {databaseProducts.map((product) => (
                          <ProductCard
                            key={product.pid}
                            product={product}
                            isSelected={selectedProduct?.pid === product.pid}
                            onSelect={() => {
                              setSelectedProduct(product);
                              setTransferQuantity(1);
                            }}
                            currencySymbol={currencySymbol}
                            showStock={false}
                          />
                        ))}
                      </div>
                    </>
                  )
                )}
              </div>

              {/* Quantity & Add */}
              {selectedProduct && (
                <div className="border-t border-gray-200 p-6 bg-gray-50">
                  {activeTab === "database" && (
                    <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-700">
                        ℹ️ This product is from the database. Stock availability will be checked 
                        against the source location when the transfer is processed.
                      </p>
                    </div>
                  )}
                  <div className="flex items-end gap-4">
                    <div className="flex-1">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Transfer Quantity
                        {activeTab === "location" && ` (Available: ${selectedProduct.current_stock})`}
                      </label>
                      <input
                        type="number"
                        min="1"
                        max={activeTab === "location" ? selectedProduct.current_stock : undefined}
                        value={transferQuantity}
                        onChange={(e) =>
                          setTransferQuantity(Math.max(1, parseInt(e.target.value) || 1))
                        }
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#166534]/20 focus:border-[#166534] outline-none text-lg font-medium"
                      />
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleAddProduct}
                      className="px-8 py-3 bg-[#166534] text-white rounded-xl hover:bg-[#14532d] transition-all shadow-lg shadow-[#166534]/25 font-semibold"
                    >
                      Add to Transfer
                    </motion.button>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }
);

ProductSearchModal.displayName = "ProductSearchModal";

const TransferItemRow: React.FC<{
  item: TransferItem;
  index: number;
  onUpdate: (index: number, field: keyof TransferItem, value: any) => void;
  onRemove: (index: number) => void;
  currencySymbol: string;
}> = memo(({ item, index, onUpdate, onRemove, currencySymbol }) => {
  const isOverStock = item.available_stock > 0 && item.stock_quantity > item.available_stock;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`flex flex-col sm:flex-row gap-4 items-start sm:items-center p-5 bg-white rounded-xl border-2 transition-all group ${
        isOverStock ? "border-red-200 bg-red-50" : "border-gray-100 hover:border-gray-200 hover:shadow-sm"
      }`}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
          isOverStock ? "bg-red-100" : "bg-[#166534]/10"
        }`}>
          <Package className={`h-5 w-5 ${isOverStock ? "text-red-600" : "text-[#166534]"}`} />
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-gray-900 truncate">
            {item.product?.product_name || `Product #${item.product_id}`}
          </p>
          <p className="text-xs text-gray-500">
            SKU: {item.product?.sku || "N/A"} 
            {item.available_stock > 0 && ` | Available: ${item.available_stock}`}
          </p>
          {isOverStock && (
            <p className="text-xs text-red-600 font-medium mt-1">
              ⚠️ Transfer quantity exceeds available stock!
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 w-full sm:w-auto">
        <div className="flex-1 sm:flex-none sm:w-28">
          <label className="text-xs text-gray-500 mb-1 block sm:hidden">Qty</label>
          <input
            type="number"
            min="1"
            value={item.stock_quantity}
            onChange={(e) => onUpdate(index, "stock_quantity", Math.max(1, parseInt(e.target.value) || 1))}
            className={`w-full px-3 py-2 border-2 rounded-lg text-sm focus:ring-2 focus:ring-[#166534]/20 outline-none text-center ${
              isOverStock ? "border-red-300 focus:border-red-500" : "border-gray-200 focus:border-[#166534]"
            }`}
          />
        </div>
        <span className="text-gray-400 hidden sm:block">×</span>
        <div className="flex-1 sm:flex-none sm:w-36">
          <label className="text-xs text-gray-500 mb-1 block sm:hidden">Unit Cost</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={item.unit_cost}
            onChange={(e) => onUpdate(index, "unit_cost", Math.max(0, parseFloat(e.target.value) || 0))}
            className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#166534]/20 focus:border-[#166534] outline-none"
          />
        </div>
      </div>

      <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto sm:min-w-[120px]">
        <div className="sm:text-right">
          <p className="text-sm text-gray-500">Total</p>
          <p className="text-lg font-bold text-[#166534]">
            {formatCurrency(item.total, currencySymbol)}
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => onRemove(index)}
          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
        >
          <Trash2 className="h-4 w-4" />
        </motion.button>
      </div>
    </motion.div>
  );
});

TransferItemRow.displayName = "TransferItemRow";

// ==============================================
// Main Component
// ==============================================

const NewTransferPage = ({ user }: { user: User }) => {
  const router = useRouter();
  const params = useParams();
  
  /**
   * Extract URL parameters:
   * - params.encryptedPid: The encrypted product ID (specific item to transfer)
   * - params.locid: The encrypted location ID (source location)
   * 
   * URL Pattern: /itemstransfers/[encryptedPid]/[locid]
   * Example: /itemstransfers/eyJpdiI6.../eyJpdiI6...
   */
  const encryptedPid = params?.encryptedPid as string || "";
  const sourceLocationId = params?.locid as string || "";
  
  const currencySymbol = user?.businesses_one?.[0]?.currency || "$";
  const businessName = user?.businesses_one?.[0]?.name || "Business";

  // Initialize form with URL params for source location
  const { formData, updateField, addItem, updateItem, removeItem } = useFormData({
    from_location_id: sourceLocationId, // Pre-fill source location from URL
  });

  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [preloadedProduct, setPreloadedProduct] = useState<Product | null>(null);
  const [isLoadingProduct, setIsLoadingProduct] = useState(false);

  const selectedFromLocation = useMemo(
    () => locations.find((l) => l.encrypted_id === formData.from_location_id) || null,
    [formData.from_location_id, locations]
  );

  const selectedToLocation = useMemo(
    () => locations.find((l) => l.encrypted_id === formData.to_location_id) || null,
    [formData.to_location_id, locations]
  );

  const subtotal = useMemo(
    () => formData.items.reduce((sum, item) => sum + item.total, 0),
    [formData.items]
  );

  const itemCount = formData.items.length;

  /**
   * Fetch the specific product from the URL params
   * Uses the encrypted product ID and source location ID
   * 
   * API: GET /product-locations/{sourceLocationId}
   * Then finds the matching product by encrypted_pid
   */
  useEffect(() => {
    if (encryptedPid && sourceLocationId) {
      fetchPreloadedProduct();
    }
  }, [encryptedPid, sourceLocationId]);

  const fetchPreloadedProduct = async () => {
    setIsLoadingProduct(true);
    try {
      // Fetch all products at this location
      const response = await apiGet(
        `/product-locations/${sourceLocationId}`,
        {},
        false
      );
      
      const data = response.data?.data || response.data || [];
      const stockData = Array.isArray(data) ? data : [];
      
      // Find the specific product by encrypted_pid
      const matchingProduct = stockData.find(
        (pl: ProductLocation) => pl.encrypted_pid === encryptedPid
      );
      
      if (matchingProduct) {
        const product = mapProductLocationToProduct(matchingProduct);
        setPreloadedProduct(product);
        
        // Auto-add the product to the transfer with quantity 1
        if (product.current_stock > 0) {
          addItem(product, 1);
        } else {
          toast.error("This product is out of stock at the selected location");
        }
      } else {
        toast.error("Product not found at this location");
      }
    } catch (error: any) {
      console.error("Failed to fetch preloaded product:", error);
      toast.error("Failed to load product details");
    } finally {
      setIsLoadingProduct(false);
    }
  };

  /**
   * Fetch locations for the destination dropdown
   */
  useEffect(() => {
    const fetchLocations = async () => {
      setIsLoading(true);
      try {
        const locationsRes = await apiGet("/locations", {}, false);
        
        setLocations(
          extractDataFromResponse<Location>(locationsRes, [
            "data",
            "data.data",
            "data.locations",
          ])
        );
      } catch (error) {
        toast.error("Failed to load locations");
      } finally {
        setIsLoading(false);
      }
    };

    fetchLocations();
  }, []);

  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.to_location_id) newErrors.to_location_id = "Please select destination location";
    if (formData.from_location_id === formData.to_location_id) {
      newErrors.to_location_id = "Source and destination cannot be the same";
    }
    if (!formData.transfer_date) newErrors.transfer_date = "Please select transfer date";
    if (formData.items.length === 0) newErrors.items = "Please add at least one product";
    
    formData.items.forEach((item, index) => {
      if (item.available_stock > 0 && item.stock_quantity > item.available_stock) {
        newErrors[`item_${index}`] = `Insufficient stock for ${item.product?.product_name}`;
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error("Please fix the errors before submitting");
      return;
    }

    setIsSubmitting(true);

    const payload = {
      from_location_id: formData.from_location_id,
      to_location_id: formData.to_location_id,
      transfer_date: formData.transfer_date,
      expected_delivery_date: formData.expected_delivery_date || null,
      notes: formData.notes || null,
      reference_number: formData.reference_number || null,
      items: formData.items.map(({ product_id, stock_quantity, unit_cost }) => ({
        product_id,
        stock_quantity,
        unit_cost,
      })),
    };

    try {
      await apiPost("/stock-transfers", payload);
      toast.success("Stock transfer created successfully!");
      router.push("/transfers");
      router.refresh();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to create stock transfer");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || isLoadingProduct) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#166534] mx-auto mb-4" />
          <p className="text-gray-500">
            {isLoadingProduct ? "Loading product details..." : "Loading..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push("/transfers")}
                className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all"
              >
                <ArrowLeft className="h-5 w-5" />
              </motion.button>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                  Transfer Product
                </h1>
                <p className="text-sm text-gray-500 hidden sm:block">
                  {preloadedProduct 
                    ? `Transferring: ${preloadedProduct.product_name}`
                    : businessName}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/transfers"
                className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border-2 border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all"
              >
                Transfer List
              </Link>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#166534] text-white text-sm font-semibold rounded-xl hover:bg-[#14532d] transition-all shadow-lg shadow-[#166534]/25 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {isSubmitting ? "Creating..." : "Create Transfer"}
              </motion.button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Preloaded Product Info Banner */}
        {preloadedProduct && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-[#166534]/10 border border-[#166534]/30 rounded-xl"
          >
            <div className="flex items-center gap-3">
              <Package className="h-5 w-5 text-[#166534]" />
              <div>
                <p className="font-semibold text-[#166534]">
                  Transferring: {preloadedProduct.product_name}
                </p>
                <p className="text-sm text-gray-600">
                  SKU: {preloadedProduct.sku} | 
                  Available Stock: {preloadedProduct.current_stock} | 
                  Cost: {formatCurrency(preloadedProduct.cost_price, currencySymbol)}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Transfer Details */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden"
          >
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#166534] flex items-center justify-center">
                  <ArrowRightLeft className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Transfer Details</h2>
                  <p className="text-sm text-gray-500">Select destination location</p>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Source Location - Read-only (from URL) */}
                <div className="space-y-4">
                  <div>
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                      <Warehouse className="h-4 w-4 text-[#166534]" />
                      Source Location <span className="text-red-500">*</span>
                    </label>
                    <div className="px-4 py-3 bg-gray-100 border-2 border-gray-200 rounded-xl text-sm text-gray-700">
                      {selectedFromLocation?.location_name || "Loading..."}
                      {selectedFromLocation?.head_office === "yes" && " (HQ)"}
                    </div>
                    {selectedFromLocation && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-3 p-4 bg-[#166534]/5 rounded-xl border border-[#166534]/20"
                      >
                        <p className="text-xs font-semibold text-[#166534] uppercase tracking-wider mb-3">
                          Source Location Details
                        </p>
                        <div className="space-y-2">
                          <div className="flex items-start gap-2 text-sm text-gray-700">
                            <MapPin className="h-4 w-4 text-[#166534]/60 mt-0.5 flex-shrink-0" />
                            <span>{getFullAddress(selectedFromLocation)}</span>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </div>

                {/* Destination Location */}
                <div className="space-y-4">
                  <div>
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                      <Building2 className="h-4 w-4 text-[#166534]" />
                      Destination Location <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <select
                        value={formData.to_location_id}
                        onChange={(e) => updateField("to_location_id", e.target.value)}
                        className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-[#166534]/20 focus:border-[#166534] outline-none text-sm appearance-none bg-white transition-all ${
                          errors.to_location_id ? "border-red-300 bg-red-50" : "border-gray-200"
                        }`}
                      >
                        <option value="">Select destination location...</option>
                        {locations
                          .filter(loc => loc.encrypted_id !== formData.from_location_id)
                          .map((location) => (
                            <option key={location.encrypted_id} value={location.encrypted_id}>
                              {location.location_name}
                              {location.head_office === "yes" && " (HQ)"}
                            </option>
                          ))}
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                    </div>
                    {errors.to_location_id && (
                      <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.to_location_id}
                      </p>
                    )}
                    {selectedToLocation && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-3 p-4 bg-[#166534]/5 rounded-xl border border-[#166534]/20"
                      >
                        <p className="text-xs font-semibold text-[#166534] uppercase tracking-wider mb-3">
                          Destination Location Details
                        </p>
                        <div className="space-y-2">
                          <div className="flex items-start gap-2 text-sm text-gray-700">
                            <MapPin className="h-4 w-4 text-[#166534]/60 mt-0.5 flex-shrink-0" />
                            <span>{getFullAddress(selectedToLocation)}</span>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                        <Calendar className="h-4 w-4 text-[#166534]" />
                        Transfer Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        value={formData.transfer_date}
                        onChange={(e) => updateField("transfer_date", e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#166534]/20 focus:border-[#166534] outline-none text-sm transition-all"
                      />
                    </div>
                    <div>
                      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                        <Calendar className="h-4 w-4 text-[#166534]" />
                        Expected Delivery
                      </label>
                      <input
                        type="date"
                        value={formData.expected_delivery_date}
                        onChange={(e) => updateField("expected_delivery_date", e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#166534]/20 focus:border-[#166534] outline-none text-sm transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                      <Hash className="h-4 w-4 text-[#166534]" />
                      Reference Number
                    </label>
                    <input
                      type="text"
                      value={formData.reference_number}
                      onChange={(e) => updateField("reference_number", e.target.value)}
                      placeholder="Enter reference number (optional)"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#166534]/20 focus:border-[#166534] outline-none text-sm transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Transfer Items */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden"
          >
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#166534] flex items-center justify-center">
                    <Package className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Transfer Items</h2>
                    <p className="text-sm text-gray-500">
                      {itemCount} {itemCount === 1 ? "item" : "items"} added
                    </p>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={() => setShowProductModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#166534] text-white text-sm font-semibold rounded-xl hover:bg-[#14532d] transition-all shadow-lg shadow-[#166534]/25"
                >
                  <Plus className="h-4 w-4" />
                  Add More Products
                </motion.button>
              </div>
            </div>

            <div className="p-6">
              {formData.items.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Package className="h-10 w-10 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">No items added</h3>
                  <p className="text-gray-500 mb-6">
                    {preloadedProduct 
                      ? "The preloaded product is out of stock" 
                      : "Add products to transfer"}
                  </p>
                  {preloadedProduct && preloadedProduct.current_stock > 0 && (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="button"
                      onClick={() => addItem(preloadedProduct, 1)}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-[#166534] text-white rounded-xl hover:bg-[#14532d] transition-colors font-medium shadow-lg shadow-[#166534]/25"
                    >
                      <Plus className="h-4 w-4" />
                      Add {preloadedProduct.product_name}
                    </motion.button>
                  )}
                </div>
              ) : (
                <>
                  <AnimatePresence>
                    <div className="space-y-3">
                      {formData.items.map((item, index) => (
                        <TransferItemRow
                          key={index}
                          item={item}
                          index={index}
                          onUpdate={updateItem}
                          onRemove={removeItem}
                          currencySymbol={currencySymbol}
                        />
                      ))}
                    </div>
                  </AnimatePresence>
                  
                  <div className="mt-6 p-6 bg-gray-50 rounded-2xl border border-gray-200">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                      <div>
                        <p className="text-sm text-gray-600 font-medium">Total Transfer Value</p>
                        <p className="text-xs text-gray-400">
                          {itemCount} {itemCount === 1 ? "item" : "items"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-3xl font-bold text-[#166534]">
                          {formatCurrency(subtotal, currencySymbol)}
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </motion.div>

          {/* Notes */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden"
          >
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#166534] flex items-center justify-center">
                  <StickyNote className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Additional Notes</h2>
                  <p className="text-sm text-gray-500">Optional instructions or comments</p>
                </div>
              </div>
            </div>
            <div className="p-6">
              <textarea
                value={formData.notes}
                onChange={(e) => updateField("notes", e.target.value)}
                rows={4}
                placeholder="Add any additional notes or instructions for this stock transfer..."
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#166534]/20 focus:border-[#166534] outline-none resize-none text-sm transition-all"
              />
            </div>
          </motion.div>

          {/* Mobile Submit */}
          <div className="lg:hidden">
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full py-4 bg-[#166534] text-white font-semibold rounded-2xl hover:bg-[#14532d] transition-all shadow-lg shadow-[#166534]/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Creating Stock Transfer...
                </>
              ) : (
                <>
                  <Save className="h-5 w-5" />
                  Create Stock Transfer
                </>
              )}
            </motion.button>
          </div>
        </form>
      </main>

      {/* Product Modal */}
      <ProductSearchModal
        isOpen={showProductModal}
        onClose={() => setShowProductModal(false)}
        onSelectProduct={addItem}
        existingProductIds={formData.items.map((item) => item.product_id)}
        currencySymbol={currencySymbol}
        isLoading={isLoading}
        sourceLocationId={formData.from_location_id}
      />
    </div>
  );
};

export default withAuth(NewTransferPage);