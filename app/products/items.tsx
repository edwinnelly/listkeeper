"use client";
import { withAuth } from "@/hoc/withAuth";
import { apiGet, apiDelete } from "@/lib/axios";
import React, { useState, useEffect, useMemo } from "react";
import {
  Edit,
  Trash2,
  Search,
  MoreVertical,
  X,
  AlertTriangle,
  ArrowLeft,
  Loader2,
  RefreshCw,
  Eye,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Package,
  Tag,
  DollarSign,
  Hash,
  BarChart3,
  Star,
  AlertCircle,
  History,
  MoreHorizontal,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation"; // Import useRouter
import { toast } from "react-hot-toast";
import ShortTextWithTooltip from "../component/shorten_len";

// TypeScript interfaces
interface ProductList {
  id: number;
  owner_id: number;
  business_key: string;
  name: string;
  sku: string;
  description: string | null;
  slug: string | null;
  dimensions: string | null;
  category_id: number;
  sub_category_id: number;
  child_sub_category_id: number;
  unit_id: string;
  price: string | number | null;
  cost_price: string | number | null;
  sale_price: string | number | null;
  stock_quantity: string | number | null;
  low_stock_threshold: string | number | null;
  discount_percentage: string | number | null;
  discount_start_date: string | null;
  discount_end_date: string | null;
  manufactured_at: string | null;
  expires_at: string | null;
  weight: string | number | null;
  length: string | null;
  width: string | null;
  height: string | null;
  supplier_id: number | null;
  is_active: boolean;
  is_featured: boolean;
  is_on_sale: boolean;
  is_out_of_stock: boolean;
  image: string | null;
  additional_info: any | null;
  created_at: string;
  updated_at: string;
  encrypted_id: any | null;

  category?: {
    id: number;
    name: string;
  };
  unit?: {
    id: number;
    name: string;
    symbol: string;
  };
  supplier?: {
    id: number;
    vid: number;
    name: string;
  };
  business?: {
    business_key: string;
    business_name: string;
  };
}

//categories
interface Category {
  id: number;
  name: string;
}

const toNumber = (value: string | number | null | undefined): number => {
  if (value === null || value === undefined) return 0;
  if (typeof value === "number") return value;
  const parsed = parseFloat(value);
  return isNaN(parsed) ? 0 : parsed;
};

const formatPrice = (price: string | number | null | undefined): string => {
  const num = toNumber(price);
  return num.toFixed(2);
};

const ManageProducts = () => {
  const router = useRouter(); // Initialize router
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [stockFilter, setStockFilter] = useState<string>("all");
  const [openRow, setOpenRow] = useState<number | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductList | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [products, setProducts] = useState<ProductList[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [forceRefreshProducts, setForceRefreshProducts] = useState(false);
  const [forceRefreshCategories, setForceRefreshCategories] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, categoryFilter, stockFilter]);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [forceRefreshProducts, forceRefreshCategories]);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const res = await apiGet("/products", {}, !forceRefreshProducts);
      console.log(res.data);
      const productsArray =
        res.data?.data?.products ??
        res.data?.data ??
        res.data?.products ??
        res.data ??
        [];
      setProducts(Array.isArray(productsArray) ? productsArray : []);
      if (forceRefreshProducts) setForceRefreshProducts(false);
    } catch (err: any) {
      toast.error("Failed to fetch products");
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await apiGet(
        "/product-categories",
        {},
        !forceRefreshCategories,
      );
      const categoriesArray =
        res.data?.data?.product_categories ??
        res.data?.product_categories ??
        res.data?.data ??
        res.data ??
        [];
      setCategories(Array.isArray(categoriesArray) ? categoriesArray : []);
      if (forceRefreshCategories) setForceRefreshCategories(false);
    } catch (err: any) {
      setCategories([]);
    }
  };

  const handleRefreshAll = () => {
    setForceRefreshProducts(true);
    setForceRefreshCategories(true);
    toast.success("Refreshing all data...");
  };

  const handleDelete = async () => {
    if (isSubmitting || !selectedProduct) return;
    setIsSubmitting(true);

    try {
      setProducts((prevProducts) =>
        prevProducts.filter((product) => product.id !== selectedProduct.id),
      );
      await apiDelete(`/products/${selectedProduct.id}`);
      toast.success("Product deleted successfully!");
      setDeleteModalOpen(false);
      setSelectedProduct(null);
    } catch (err: any) {
      toast.error("Failed to delete product");
      setForceRefreshProducts(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewClick = (product: ProductList) => {
    setSelectedProduct(product);
    setViewModalOpen(true);
  };

  const handleEditClick = (product: ProductList) => {
    // Use router.push for client-side navigation (NO PAGE REFRESH)
    router.push(`/editproduct/${product.id}`);
  };

  const handleHistoryClick = (product: ProductList) => {
    // Use router.push for client-side navigation (NO PAGE REFRESH)
    router.push(`/products/${product.id}/history`);
  };

  const handleMoreClick = (product: ProductList) => {
    toast.success(`More options for ${product.name}`);
  };

  const handleDeleteModalClose = () => {
    if (!isSubmitting) {
      setDeleteModalOpen(false);
      setSelectedProduct(null);
    }
  };

  const handleViewModalClose = () => {
    setViewModalOpen(false);
    setSelectedProduct(null);
  };

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      if (!product) return false;
      const searchableText = [
        product.name || "",
        product.sku || "",
        product.description || "",
        product.category?.name || "",
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch = searchableText.includes(
        debouncedSearch.toLowerCase(),
      );
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && product.is_active) ||
        (statusFilter === "inactive" && !product.is_active);
      const matchesCategory =
        categoryFilter === "all" ||
        product.category_id.toString() === categoryFilter;

      let matchesStock = true;
      const stockQuantity = toNumber(product.stock_quantity);
      const lowStockThreshold = toNumber(product.low_stock_threshold) || 5;

      if (stockFilter === "in_stock") {
        matchesStock = !product.is_out_of_stock && stockQuantity > 0;
      } else if (stockFilter === "out_of_stock") {
        matchesStock = product.is_out_of_stock || stockQuantity <= 0;
      } else if (stockFilter === "low_stock") {
        matchesStock = stockQuantity <= lowStockThreshold && stockQuantity > 0;
      }

      return matchesSearch && matchesStatus && matchesCategory && matchesStock;
    });
  }, [products, debouncedSearch, statusFilter, categoryFilter, stockFilter]);

  const totalItems = filteredProducts.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const currentItems = useMemo(() => {
    return filteredProducts.slice(startIndex, endIndex);
  }, [filteredProducts, startIndex, endIndex]);

  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxVisiblePages = 5;
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) pageNumbers.push(i);
    } else {
      pageNumbers.push(1);
      let startPage = Math.max(2, currentPage - 1);
      let endPage = Math.min(totalPages - 1, currentPage + 1);
      if (currentPage <= 3) endPage = Math.min(4, totalPages - 1);
      if (currentPage >= totalPages - 2)
        startPage = Math.max(totalPages - 3, 2);
      if (startPage > 2) pageNumbers.push("...");
      for (let i = startPage; i <= endPage; i++) pageNumbers.push(i);
      if (endPage < totalPages - 1) pageNumbers.push("...");
      if (totalPages > 1) pageNumbers.push(totalPages);
    }
    return pageNumbers;
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  const handleItemsPerPageChange = (value: number) => {
    setItemsPerPage(value);
    setCurrentPage(1);
  };

  const getStatusBadgeColor = (isActive: boolean) => {
    return isActive
      ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
      : "bg-stone-100 text-stone-600 border border-stone-200";
  };

  const getStockBadgeColor = (product: ProductList) => {
    const stockQuantity = toNumber(product.stock_quantity);
    const lowStockThreshold = toNumber(product.low_stock_threshold) || 5;

    if (product.is_out_of_stock || stockQuantity <= 0) {
      return "bg-rose-50 text-rose-800 border border-rose-200";
    } else if (stockQuantity <= lowStockThreshold) {
      return "bg-amber-50 text-amber-800 border border-amber-200";
    } else {
      return "bg-emerald-50 text-emerald-800 border border-emerald-200";
    }
  };

  const calculateProfitMargin = (product: ProductList) => {
    const price = toNumber(product.price);
    const costPrice = toNumber(product.cost_price);
    if (!price || !costPrice) return null;
    const margin = ((price - costPrice) / costPrice) * 100;
    return margin.toFixed(1);
  };

  return (
    <div className="min-h-screen bg-stone-50/50">
      {/* Header Section */}
      <div className="bg-white border-b border-stone-200/80 shadow-sm">
        <div className="max-w-8xl mx-auto px-6 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center space-x-4">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center text-sm text-stone-600 hover:text-[#1e3a5f] transition-colors group"
                >
                  <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                  Back to Dashboard
                </Link>
                <div className="h-6 w-px bg-stone-300"></div>
                <h1 className="text-2xl font-bolder text-[#1e3a5f]">
                  Product Management
                </h1>
              </div>
              <p className="text-stone-600 text-sm">
                Manage your inventory products and stock levels
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/newproduct"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#1e3a5f] text-white text-sm font-medium rounded-lg hover:bg-[#2c4c6e] transition-all shadow-lg shadow-[#1e3a5f]/20 hover:shadow-[#1e3a5f]/30"
              >
                <Package size={18} />
                Add Product
              </Link>

              <button
                onClick={handleRefreshAll}
                className="p-2.5 text-stone-500 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors border border-stone-200"
                title="Refresh All Data"
              >
                <RefreshCw size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards Section */}
      <div className="max-w-8xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-stone-600">
                  Total Products
                </p>
                <p className="text-2xl font-bold text-[#1e3a5f] mt-1">
                  {products.length}
                </p>
              </div>
              <div className="w-12 h-12 bg-[#1e3a5f]/10 rounded-xl flex items-center justify-center">
                <Package className="h-6 w-6 text-[#1e3a5f]" />
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-stone-600">
                  Active Products
                </p>
                <p className="text-2xl font-bold text-[#1e3a5f] mt-1">
                  {products.filter((p) => p.is_active).length}
                </p>
              </div>
              <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-emerald-700" />
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-stone-600">Low Stock</p>
                <p className="text-2xl font-bold text-[#1e3a5f] mt-1">
                  {
                    products.filter((p) => {
                      const stockQuantity = toNumber(p.stock_quantity);
                      const lowStockThreshold =
                        toNumber(p.low_stock_threshold) || 5;
                      return (
                        stockQuantity <= lowStockThreshold && stockQuantity > 0
                      );
                    }).length
                  }
                </p>
              </div>
              <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-amber-700" />
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-stone-600">
                  Out of Stock
                </p>
                <p className="text-2xl font-bold text-[#1e3a5f] mt-1">
                  {
                    products.filter((p) => {
                      const stockQuantity = toNumber(p.stock_quantity);
                      return p.is_out_of_stock || stockQuantity <= 0;
                    }).length
                  }
                </p>
              </div>
              <div className="w-12 h-12 bg-rose-50 rounded-xl flex items-center justify-center">
                <XCircle className="h-6 w-6 text-rose-700" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Card */}
        <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
          {/* Search and Filters Section */}
          <div className="px-6 py-5 border-b border-stone-200 bg-stone-50/30">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 flex-1">
                <div className="relative flex-1 max-w-md">
                  <Search
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
                    size={18}
                  />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search products by name, SKU, description..."
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-stone-300 rounded-lg focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f] outline-none transition placeholder-stone-500 text-sm hover:border-stone-400"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2.5 bg-white border border-stone-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f] outline-none transition hover:border-stone-400"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="px-3 py-2.5 bg-white border border-stone-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f] outline-none transition hover:border-stone-400"
                  >
                    <option value="all">All Categories</option>
                    {Array.isArray(categories) && categories.length > 0 ? (
                      categories.map((category) => (
                        <option
                          key={category.id}
                          value={category.id.toString()}
                        >
                          {category.name}
                        </option>
                      ))
                    ) : (
                      <option value="all" disabled>
                        {isLoading ? "Loading categories..." : "No categories"}
                      </option>
                    )}
                  </select>
                  <select
                    value={stockFilter}
                    onChange={(e) => setStockFilter(e.target.value)}
                    className="px-3 py-2.5 bg-white border border-stone-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f] outline-none transition hover:border-stone-400"
                  >
                    <option value="all">All Stock</option>
                    <option value="in_stock">In Stock</option>
                    <option value="out_of_stock">Out of Stock</option>
                    <option value="low_stock">Low Stock</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm text-stone-600">
                <span className="bg-[#1e3a5f]/10 text-[#1e3a5f] px-3 py-1.5 rounded-full text-sm font-medium border border-[#1e3a5f]/20">
                  {isLoading
                    ? "Loading..."
                    : `Showing ${startIndex + 1}-${endIndex} of ${totalItems} product${
                        totalItems !== 1 ? "s" : ""
                      }`}
                </span>
              </div>
            </div>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="flex justify-center items-center py-16">
              <div className="text-center">
                <Loader2 className="h-8 w-8 text-[#1e3a5f] animate-spin mx-auto mb-3" />
                <p className="text-stone-600 font-medium">Loading products...</p>
                <p className="text-stone-400 text-sm mt-1">
                  Please wait a moment
                </p>
              </div>
            </div>
          )}

          {/* Products Table Section */}
          {!isLoading && (
            <>
              <div className="relative">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-stone-50/80 text-stone-600 text-left border-b border-stone-200">
                      <tr>
                        <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider whitespace-nowrap w-12 text-center">
                          S.No
                        </th>
                        <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider whitespace-nowrap text-stone-500">
                          Product
                        </th>
                        <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider whitespace-nowrap text-stone-500">
                          SKU
                        </th>
                        <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider whitespace-nowrap text-stone-500 hidden md:table-cell">
                          Category
                        </th>
                        <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider whitespace-nowrap text-stone-500">
                          Price
                        </th>
                        <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider whitespace-nowrap text-stone-500">
                          Stock
                        </th>
                        <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider whitespace-nowrap text-stone-500">
                          Status
                        </th>
                        <th className="px-6 py-4 text-center font-semibold text-xs uppercase tracking-wider whitespace-nowrap text-stone-500 w-12">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {currentItems.length > 0 ? (
                        currentItems.map((product, index) => (
                          <tr
                            key={product.id}
                            className="hover:bg-stone-50/50 transition-colors group"
                          >
                            <td className="px-6 py-4 text-center">
                              <span className="text-sm font-medium text-stone-500">
                                {startIndex + index + 1}
                              </span>
                            </td>
                            <td className="px-6 py-4 min-w-[250px]">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-[#1e3a5f]/10 to-[#1e3a5f]/5 rounded-xl flex items-center justify-center flex-shrink-0 border border-[#1e3a5f]/20 overflow-hidden">
                                  {product.image ? (
                                    <img
                                      src={`http://localhost:8000/storage/${product.image}`}
                                      alt={product.name}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <Package className="h-5 w-5 text-[#1e3a5f]" />
                                  )}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="font-semibold text-stone-900 truncate group-hover:text-[#1e3a5f] transition-colors">
                                    <ShortTextWithTooltip
                                      text={`${product.name}`}
                                      max={20}
                                    />
                                  </div>
                                  <div className="text-xs text-stone-500 truncate mt-0.5 flex items-center gap-1">
                                    <ShortTextWithTooltip
                                      text={product.slug || "No slug"}
                                      max={20}
                                    />
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <Hash className="h-4 w-4 text-stone-400" />
                                <span className="font-mono text-sm font-medium text-stone-900">
                                  <ShortTextWithTooltip
                                    text={product.sku}
                                    max={10}
                                  />
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 min-w-[150px] hidden md:table-cell">
                              <div className="text-stone-600 text-sm">
                                <ShortTextWithTooltip
                                  text={
                                    product.category?.name || "Uncategorized"
                                  }
                                  max={10}
                                />
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-1">
                                  <span className="font-semibold text-stone-900">
                                    ${formatPrice(product.price)}
                                  </span>
                                  {product.is_on_sale && product.sale_price && (
                                    <span className="text-xs text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">
                                      -{toNumber(product.discount_percentage)}%
                                    </span>
                                  )}
                                </div>
                                {product.is_on_sale && product.sale_price && (
                                  <div className="text-xs text-stone-500 line-through">
                                    ${formatPrice(product.sale_price)}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex flex-col gap-1">
                                <span
                                  className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getStockBadgeColor(
                                    product,
                                  )}`}
                                >
                                  {product.is_out_of_stock ||
                                  toNumber(product.stock_quantity) <= 0
                                    ? "Out of Stock"
                                    : toNumber(product.stock_quantity) <=
                                        (toNumber(
                                          product.low_stock_threshold,
                                        ) || 5)
                                      ? "Low Stock"
                                      : "In Stock"}
                                </span>
                                <div className="text-xs text-stone-500 text-center">
                                  {toNumber(product.stock_quantity)} units
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadgeColor(
                                  product.is_active,
                                )}`}
                              >
                                {product.is_active ? (
                                  <>
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Active
                                  </>
                                ) : (
                                  <>
                                    <XCircle className="h-3 w-3 mr-1" />
                                    Inactive
                                  </>
                                )}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-center relative whitespace-nowrap">
                              <button
                                onClick={() =>
                                  setOpenRow(
                                    openRow === product.id ? null : product.id,
                                  )
                                }
                                className="p-2 rounded-lg hover:bg-stone-100 transition text-stone-400 hover:text-stone-600 disabled:opacity-50 disabled:cursor-not-allowed group/action"
                                disabled={isSubmitting}
                              >
                                <MoreVertical
                                  size={18}
                                  className="group-hover/action:scale-110 transition-transform"
                                />
                              </button>

                              {openRow === product.id && (
                                <>
                                  <div
                                    className="fixed inset-0 z-10"
                                    onClick={() => setOpenRow(null)}
                                  />
                                  <div className="absolute right-6 z-40 w-48 bg-white border border-stone-200 rounded-xl shadow-lg shadow-stone-200/50 animate-fadeIn backdrop-blur-sm">
                                    <button
                                      onClick={() => {
                                        handleViewClick(product);
                                        setOpenRow(null);
                                      }}
                                      className="flex items-center gap-3 w-full px-4 py-3 text-sm text-stone-700 hover:bg-stone-50 transition first:rounded-t-xl border-b border-stone-100"
                                    >
                                      <Eye
                                        size={16}
                                        className="text-[#1e3a5f]"
                                      />
                                      View Details
                                    </button>

                                    <button
                                      onClick={() => {
                                        handleEditClick(product);
                                        setOpenRow(null);
                                      }}
                                      className="flex items-center gap-3 w-full px-4 py-3 text-sm text-stone-700 hover:bg-stone-50 transition border-b border-stone-100"
                                    >
                                      <Edit
                                        size={16}
                                        className="text-[#1e3a5f]"
                                      />
                                      Edit Product
                                    </button>

                                    <button
                                      onClick={() => {
                                        handleHistoryClick(product);
                                        setOpenRow(null);
                                      }}
                                      className="flex items-center gap-3 w-full px-4 py-3 text-sm text-stone-700 hover:bg-stone-50 transition border-b border-stone-100"
                                    >
                                      <History
                                        size={16}
                                        className="text-stone-600"
                                      />
                                      History
                                    </button>

                                    <button
                                      onClick={() => {
                                        setSelectedProduct(product);
                                        setDeleteModalOpen(true);
                                        setOpenRow(null);
                                      }}
                                      className="flex items-center gap-3 w-full px-4 py-3 text-sm text-stone-700 hover:bg-rose-50 transition border-b border-stone-100"
                                    >
                                      <Trash2
                                        size={16}
                                        className="text-rose-600"
                                      />
                                      Delete Product
                                    </button>

                                    <button
                                      onClick={() => {
                                        handleMoreClick(product);
                                        setOpenRow(null);
                                      }}
                                      className="flex items-center gap-3 w-full px-4 py-3 text-sm text-stone-700 hover:bg-stone-50 transition last:rounded-b-xl"
                                    >
                                      <MoreHorizontal
                                        size={16}
                                        className="text-stone-600"
                                      />
                                      More Options
                                    </button>
                                  </div>
                                </>
                              )}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={8} className="text-center py-16">
                            <div className="flex flex-col items-center gap-4 max-w-sm mx-auto">
                              <div className="w-16 h-16 bg-stone-100 rounded-2xl flex items-center justify-center">
                                <Package size={24} className="text-stone-400" />
                              </div>
                              <div className="space-y-2">
                                <p className="text-stone-900 font-semibold text-lg">
                                  {debouncedSearch
                                    ? "No products found"
                                    : "No products available"}
                                </p>
                                <p className="text-stone-500 text-sm">
                                  {debouncedSearch
                                    ? "Try adjusting your search terms or filters"
                                    : "Click the 'Add Product' button to create your first product"}
                                </p>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-stone-200 bg-stone-50/30 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-stone-600">Show</span>
                      <select
                        value={itemsPerPage}
                        onChange={(e) =>
                          handleItemsPerPageChange(Number(e.target.value))
                        }
                        className="px-2 py-1.5 text-sm border border-stone-300 rounded-lg bg-white focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f] outline-none"
                      >
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                      </select>
                      <span className="text-sm text-stone-600">per page</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handlePageChange(1)}
                      disabled={currentPage === 1}
                      className="p-2 rounded-lg border border-stone-300 text-stone-600 hover:bg-stone-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronsLeft size={16} />
                    </button>
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="p-2 rounded-lg border border-stone-300 text-stone-600 hover:bg-stone-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <div className="flex items-center gap-1">
                      {getPageNumbers().map((page, index) => (
                        <React.Fragment key={index}>
                          {page === "..." ? (
                            <span className="px-3 py-2 text-stone-400">...</span>
                          ) : (
                            <button
                              onClick={() => handlePageChange(page as number)}
                              className={`min-w-[2.5rem] h-10 flex items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                                currentPage === page
                                  ? "bg-[#1e3a5f] text-white border border-[#1e3a5f]"
                                  : "text-stone-700 hover:bg-stone-100 border border-stone-300"
                              }`}
                            >
                              {page}
                            </button>
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="p-2 rounded-lg border border-stone-300 text-stone-600 hover:bg-stone-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronRight size={16} />
                    </button>
                    <button
                      onClick={() => handlePageChange(totalPages)}
                      disabled={currentPage === totalPages}
                      className="p-2 rounded-lg border border-stone-300 text-stone-600 hover:bg-stone-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronsRight size={16} />
                    </button>
                  </div>
                  <div className="text-sm text-stone-600">
                    Page <span className="font-semibold">{currentPage}</span> of{" "}
                    <span className="font-semibold">{totalPages}</span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Delete Confirmation Modal */}
        {deleteModalOpen && selectedProduct && (
          <div className="fixed inset-0 flex items-center justify-center bg-stone-900/40 backdrop-blur-sm z-50 p-4 animate-fadeIn">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-scaleIn">
              <div className="p-6">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="w-16 h-16 flex items-center justify-center rounded-2xl bg-rose-50 border border-rose-200">
                    <AlertTriangle className="w-7 h-7 text-rose-600" />
                  </div>
                  <h2 className="text-xl font-bold text-stone-900">
                    Delete Product
                  </h2>
                  <p className="text-stone-600 text-sm leading-relaxed">
                    Are you sure you want to delete{" "}
                    <span className="font-semibold text-stone-900">
                      {selectedProduct.name}
                    </span>
                    ? This action cannot be undone.
                  </p>
                  <div className="mt-6 flex justify-center gap-3 w-full">
                    <button
                      type="button"
                      onClick={handleDeleteModalClose}
                      className="flex-1 px-6 py-3 rounded-lg border border-stone-300 bg-white text-stone-700 font-medium hover:bg-stone-50 transition disabled:opacity-50"
                      disabled={isSubmitting}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleDelete}
                      className="flex-1 px-6 py-3 rounded-lg bg-gradient-to-r from-rose-600 to-rose-700 text-white font-medium flex items-center justify-center gap-2 hover:from-rose-700 hover:to-rose-800 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-rose-500/25"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          Deleting...
                        </>
                      ) : (
                        <>
                          <Trash2 size={16} />
                          Delete
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* View Product Modal */}
        {viewModalOpen && selectedProduct && (
          <div className="fixed inset-0 flex items-center justify-center bg-stone-900/40 backdrop-blur-sm z-50 p-4 animate-fadeIn">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto animate-scaleIn">
              <div className="flex items-center justify-between p-6 border-b border-stone-200">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-[#1e3a5f]/10 rounded-xl flex items-center justify-center">
                    <Eye className="h-5 w-5 text-[#1e3a5f]" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-stone-900">
                      Product Details
                    </h2>
                    <p className="text-stone-500 text-sm">
                      View detailed product information
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleViewModalClose}
                  className="w-8 h-8 flex items-center justify-center text-stone-400 hover:text-stone-600 transition hover:bg-stone-100 rounded-lg"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="p-6">
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="w-20 h-20 bg-stone-100 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0">
                      {selectedProduct.image ? (
                        <img
                          src={`http://localhost:8000/storage/${selectedProduct.image}`}
                          alt={selectedProduct.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Package className="h-8 w-8 text-stone-400" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-stone-900">
                        {selectedProduct.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="font-mono text-sm text-stone-600">
                          SKU: {selectedProduct.sku}
                        </span>
                        {selectedProduct.is_featured && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-800">
                            <Star className="h-3 w-3 mr-1" />
                            Featured
                          </span>
                        )}
                        {selectedProduct.is_on_sale && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-rose-50 text-rose-800">
                            <Tag className="h-3 w-3 mr-1" />
                            On Sale
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="font-semibold text-stone-900">
                        Basic Information
                      </h4>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm text-stone-500">
                            Description
                          </span>
                          <span className="text-sm text-stone-900 text-right">
                            {selectedProduct.description || "No description"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-stone-500">
                            Category
                          </span>
                          <span className="text-sm text-stone-900">
                            {selectedProduct.category?.name || "Uncategorized"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-stone-500">Unit</span>
                          <span className="text-sm text-stone-900">
                            {selectedProduct.unit?.name || "N/A"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-stone-500">Status</span>
                          <span
                            className={`text-sm font-medium ${selectedProduct.is_active ? "text-emerald-700" : "text-stone-600"}`}
                          >
                            {selectedProduct.is_active ? "Active" : "Inactive"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-semibold text-stone-900">
                        Pricing & Stock
                      </h4>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm text-stone-500">Price</span>
                          <span className="text-sm font-semibold text-stone-900">
                            ${formatPrice(selectedProduct.price)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-stone-500">
                            Cost Price
                          </span>
                          <span className="text-sm text-stone-900">
                            ${formatPrice(selectedProduct.cost_price)}
                          </span>
                        </div>
                        {selectedProduct.is_on_sale &&
                          selectedProduct.sale_price && (
                            <div className="flex justify-between">
                              <span className="text-sm text-stone-500">
                                Sale Price
                              </span>
                              <span className="text-sm font-semibold text-rose-600">
                                ${formatPrice(selectedProduct.sale_price)}
                              </span>
                            </div>
                          )}
                        <div className="flex justify-between">
                          <span className="text-sm text-stone-500">
                            Stock Quantity
                          </span>
                          <span
                            className={`text-sm font-medium ${
                              selectedProduct.is_out_of_stock ||
                              toNumber(selectedProduct.stock_quantity) <= 0
                                ? "text-rose-600"
                                : toNumber(selectedProduct.stock_quantity) <=
                                    (toNumber(
                                      selectedProduct.low_stock_threshold,
                                    ) || 5)
                                  ? "text-amber-600"
                                  : "text-emerald-600"
                            }`}
                          >
                            {toNumber(selectedProduct.stock_quantity)} units
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {toNumber(selectedProduct.price) > 0 &&
                    toNumber(selectedProduct.cost_price) > 0 && (
                      <div className="bg-[#1e3a5f]/5 border border-[#1e3a5f]/20 rounded-xl p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <BarChart3 className="h-5 w-5 text-[#1e3a5f]" />
                            <span className="font-semibold text-stone-900">
                              Profit Margin
                            </span>
                          </div>
                          <span className="text-lg font-bold text-[#1e3a5f]">
                            {calculateProfitMargin(selectedProduct)}%
                          </span>
                        </div>
                        <p className="text-sm text-stone-600 mt-1">
                          Based on price: ${formatPrice(selectedProduct.price)}{" "}
                          and cost: ${formatPrice(selectedProduct.cost_price)}
                        </p>
                      </div>
                    )}

                  <div className="flex justify-end gap-3 pt-6 border-t border-stone-200">
                    <button
                      type="button"
                      onClick={handleViewModalClose}
                      className="px-6 py-3 text-sm font-medium text-stone-700 bg-white border border-stone-300 rounded-lg hover:bg-stone-50 transition-colors"
                    >
                      Close
                    </button>
                    <Link
                      href={`/editproduct/${selectedProduct.id}`}
                      className="px-6 py-3 text-sm font-medium text-white bg-[#1e3a5f] rounded-lg hover:bg-[#2c4c6e] transition-all inline-flex items-center gap-2 shadow-lg shadow-[#1e3a5f]/20"
                    >
                      <Edit size={16} />
                      Edit Product
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default withAuth(ManageProducts);