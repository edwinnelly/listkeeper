"use client";
import { withAuth } from "@/hoc/withAuth";
import { apiGet, apiPut, apiDelete } from "@/lib/axios";
import { apiPost } from "@/lib/axios";
import React, { useState, useEffect, useMemo } from "react";
import {
  Plus,
  Edit,
  Trash2,
  Search,
  MoreVertical,
  X,
  AlertTriangle,
  ArrowLeft,
  Loader2,
  Download,
  ChevronDown,
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
  Percent,
  AlertCircle,
  Image as ImageIcon,
  FolderTree,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";
import { toast } from "react-hot-toast";

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
  unit_id: number;
  price: number | null;
  cost_price: number | null;
  sale_price: number | null;
  stock_quantity: number | null;
  low_stock_threshold: number | null;
  discount_percentage: number | null;
  discount_start_date: string | null;
  discount_end_date: string | null;
  manufactured_at: string | null;
  expires_at: string | null;
  weight: number | null;
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

  // Relations
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
    name: string;
  };
  business?: {
    business_key: string;
    business_name: string;
  };
}

interface ProductFormData {
  name: string;
  sku: string;
  description: string;
  category_id: number;
  sub_category_id: number;
  child_sub_category_id: number;
  unit_id: number;
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
  vendor_name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  is_active?: boolean;
}
interface Business {
  business_key: string;
  business_name: string;
}

// Helper function to safely extract array data from API response
const extractArrayData = (responseData: any, key?: string): any[] => {
  if (!responseData) return [];

  // If response is already an array
  if (Array.isArray(responseData)) {
    return responseData;
  }

  // If specific key is provided
  if (key && responseData[key] && Array.isArray(responseData[key])) {
    return responseData[key];
  }

  // If response has a data property that's an array
  if (responseData.data && Array.isArray(responseData.data)) {
    return responseData.data;
  }

  // Common keys to check
  const possibleKeys = [
    "categories",
    "units",
    "vendors",
    "suppliers",
    "businesses",
    "products",
    "items",
    "results",
  ];
  for (const possibleKey of possibleKeys) {
    if (responseData[possibleKey] && Array.isArray(responseData[possibleKey])) {
      return responseData[possibleKey];
    }
  }

  // Try to find any array in the object
  if (typeof responseData === "object") {
    const arrayValue = Object.values(responseData).find(Array.isArray);
    if (arrayValue) return arrayValue as any[];
  }

  return [];
};

const ManageProducts = () => {
  // Search and Filter States
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [stockFilter, setStockFilter] = useState<string>("all");

  // UI Interaction States
  const [openRow, setOpenRow] = useState<number | null>(null);

  // Modal States
  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);

  // Selected Item State
  const [selectedProduct, setSelectedProduct] = useState<ProductList | null>(
    null,
  );

  // Loading States
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Data States - Initialize with empty arrays
  const [products, setProducts] = useState<ProductList[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);

  // Refresh States
  const [forceRefreshProducts, setForceRefreshProducts] = useState(false);
  const [forceRefreshCategories, setForceRefreshCategories] = useState(false);
  const [forceRefreshUnits, setForceRefreshUnits] = useState(false);
  const [forceRefreshSuppliers, setForceRefreshSuppliers] = useState(false);
  const [forceRefreshBusinesses, setForceRefreshBusinesses] = useState(false);

  // Form State
  const [form, setForm] = useState<ProductFormData>({
    name: "",
    sku: "",
    description: "",
    category_id: 0,
    sub_category_id: 0,
    child_sub_category_id: 0,
    unit_id: 0,
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

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const router = useRouter();

  // Debug useEffect for categories
  useEffect(() => {
    console.log("Categories state:", categories);
    console.log("Categories is array?", Array.isArray(categories));
  }, [categories]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setCurrentPage(1);
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  // Reset pagination on filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, categoryFilter, stockFilter]);

  // Fetch data on component mount and when force refresh is triggered
  useEffect(() => {
    fetchProducts();
    fetchDropdownData();
  }, [
    forceRefreshProducts,
    forceRefreshCategories,
    forceRefreshUnits,
    forceRefreshSuppliers,
    forceRefreshBusinesses,
  ]);

  // API call to fetch all products using in-memory cache
  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const res = await apiGet("/product-lists", {}, !forceRefreshProducts);

      console.log("Products API response:", res.data);

      // Extract products array from various possible response structures
      const productsArray =
        res.data?.data?.products ??
        res.data?.data ??
        res.data?.products ??
        res.data ??
        [];

      setProducts(Array.isArray(productsArray) ? productsArray : []);

      if (forceRefreshProducts) {
        setForceRefreshProducts(false);
      }
    } catch (err: any) {
      console.error("Error fetching products:", err);
      toast.error(
        err.response?.status === 403
          ? "You don't have permission to access products"
          : "Failed to fetch products",
      );
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  };

  // API call to fetch all categories using in-memory cache
  // API call to fetch all categories using in-memory cache
  const fetchCategories = async () => {
    try {
      const res = await apiGet(
        "/product-categories",
        {},
        !forceRefreshCategories,
      );

      console.log("Categories API response:", res.data);

      // Extract categories array from the API response structure
      const categoriesArray =
        res.data?.data?.product_categories ?? // Your actual structure
        res.data?.product_categories ??
        res.data?.data ??
        res.data ??
        [];

      setCategories(Array.isArray(categoriesArray) ? categoriesArray : []);

      if (forceRefreshCategories) {
        setForceRefreshCategories(false);
      }
    } catch (err: any) {
      console.error("Failed to fetch categories:", err);
      toast.error("Failed to fetch categories");
      setCategories([]);
    }
  };

  // API call to fetch all units using in-memory cache
  const fetchUnits = async () => {
    try {
      const res = await apiGet("/product-units", {}, !forceRefreshUnits);

      console.log("Units API response:", res.data);

      // Extract units array from various possible response structures
      const unitsArray =
        res.data?.data?.units ??
        res.data?.data ??
        res.data?.units ??
        res.data ??
        [];

      setUnits(Array.isArray(unitsArray) ? unitsArray : []);

      if (forceRefreshUnits) {
        setForceRefreshUnits(false);
      }
    } catch (err: any) {
      console.error("Failed to fetch units:", err);
      toast.error("Failed to fetch units");
      setUnits([]);
    }
  };

  // API call to fetch all suppliers (vendors) using in-memory cache
  // API call to fetch all suppliers (vendors) using in-memory cache
  const fetchSuppliers = async () => {
    try {
      const res = await apiGet("/vendors", {}, !forceRefreshSuppliers);

      console.log("Suppliers API response:", res.data);

      // Extract suppliers array from the API response
      const suppliersArray =
        res.data?.data?.vendors ??
        res.data?.data ??
        res.data?.vendors ??
        res.data ??
        [];

      console.log("Extracted suppliers array:", suppliersArray);

      // Transform the data to match our Supplier interface
      const transformedSuppliers = Array.isArray(suppliersArray)
        ? suppliersArray.map((vendor) => ({
            id: vendor.id, // This is the encrypted string ID
            vendor_name: vendor.vendor_name || vendor.name || "",
            contact_person: vendor.contact_person,
            email: vendor.email,
            phone: vendor.phone,
            is_active: vendor.is_active,
          }))
        : [];

      setSuppliers(transformedSuppliers);

      if (forceRefreshSuppliers) {
        setForceRefreshSuppliers(false);
      }
    } catch (err: any) {
      console.error("Failed to fetch suppliers:", err);
      toast.error("Failed to fetch suppliers");
      setSuppliers([]);
    }
  };

  // API call to fetch all businesses using in-memory cache
  const fetchBusinesses = async () => {
    try {
      const res = await apiGet("/businesses", {}, !forceRefreshBusinesses);

      console.log("Businesses API response:", res.data);

      // Extract businesses array from various possible response structures
      const businessesArray =
        res.data?.data?.businesses ??
        res.data?.data ??
        res.data?.businesses ??
        res.data ??
        [];

      setBusinesses(Array.isArray(businessesArray) ? businessesArray : []);

      if (forceRefreshBusinesses) {
        setForceRefreshBusinesses(false);
      }
    } catch (err: any) {
      console.error("Failed to fetch businesses:", err);
      toast.error("Failed to fetch businesses");
      setBusinesses([]);
    }
  };

  // Fetch all dropdown data
  const fetchDropdownData = async () => {
    try {
      await Promise.all([
        fetchCategories(),
        fetchUnits(),
        fetchSuppliers(),
        fetchBusinesses(),
      ]);
    } catch (err) {
      console.error("Failed to fetch dropdown data:", err);
      // Ensure all states are set to empty arrays on error
      setCategories([]);
      setUnits([]);
      setSuppliers([]);
      setBusinesses([]);
    }
  };

  // Enhanced refresh function
  const handleRefreshAll = () => {
    setForceRefreshProducts(true);
    setForceRefreshCategories(true);
    setForceRefreshUnits(true);
    setForceRefreshSuppliers(true);
    setForceRefreshBusinesses(true);
    toast.success("Refreshing all data...");
  };

  // Filter products
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      if (!product) return false;

      // Search
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

      // Status filter
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && product.is_active) ||
        (statusFilter === "inactive" && !product.is_active);

      // Category filter
      const matchesCategory =
        categoryFilter === "all" ||
        product.category_id.toString() === categoryFilter;

      // Stock filter
      let matchesStock = true;
      if (stockFilter === "in_stock") {
        matchesStock =
          !product.is_out_of_stock && (product.stock_quantity || 0) > 0;
      } else if (stockFilter === "out_of_stock") {
        matchesStock =
          product.is_out_of_stock || (product.stock_quantity || 0) <= 0;
      } else if (stockFilter === "low_stock") {
        matchesStock =
          (product.stock_quantity || 0) <= (product.low_stock_threshold || 5);
      }

      return matchesSearch && matchesStatus && matchesCategory && matchesStock;
    });
  }, [products, debouncedSearch, statusFilter, categoryFilter, stockFilter]);

  // Pagination calculations
  const totalItems = filteredProducts.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);

  // Current page items
  const currentItems = useMemo(() => {
    return filteredProducts.slice(startIndex, endIndex);
  }, [filteredProducts, startIndex, endIndex]);

  // Page numbers
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      pageNumbers.push(1);

      let startPage = Math.max(2, currentPage - 1);
      let endPage = Math.min(totalPages - 1, currentPage + 1);

      if (currentPage <= 3) {
        endPage = Math.min(4, totalPages - 1);
      }

      if (currentPage >= totalPages - 2) {
        startPage = Math.max(totalPages - 3, 2);
      }

      if (startPage > 2) {
        pageNumbers.push("...");
      }

      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i);
      }

      if (endPage < totalPages - 1) {
        pageNumbers.push("...");
      }

      if (totalPages > 1) {
        pageNumbers.push(totalPages);
      }
    }

    return pageNumbers;
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      const tableContainer = document.querySelector(".overflow-x-auto");
      if (tableContainer) {
        tableContainer.scrollTop = 0;
      }
    }
  };

  // Handle items per page change
  const handleItemsPerPageChange = (value: number) => {
    setItemsPerPage(value);
    setCurrentPage(1);
  };

  // Form validation
  const validateForm = (formData: ProductFormData): string[] => {
    const errors: string[] = [];

    // Required fields
    if (!formData.name.trim()) errors.push("Product name is required");
    if (!formData.sku.trim()) errors.push("SKU is required");
    if (!formData.category_id) errors.push("Category is required");
    if (!formData.unit_id) errors.push("Unit is required");

    // Length validations
    if (formData.name.length < 2)
      errors.push("Product name must be at least 2 characters");
    if (formData.name.length > 200)
      errors.push("Product name must be less than 200 characters");
    if (formData.sku.length < 3)
      errors.push("SKU must be at least 3 characters");

    // Numeric validations
    if (formData.price && parseFloat(formData.price) < 0)
      errors.push("Price cannot be negative");
    if (formData.cost_price && parseFloat(formData.cost_price) < 0)
      errors.push("Cost price cannot be negative");
    if (formData.stock_quantity && parseFloat(formData.stock_quantity) < 0)
      errors.push("Stock quantity cannot be negative");
    if (
      formData.discount_percentage &&
      (parseFloat(formData.discount_percentage) < 0 ||
        parseFloat(formData.discount_percentage) > 100)
    ) {
      errors.push("Discount percentage must be between 0 and 100");
    }

    // Date validations
    if (formData.discount_start_date && formData.discount_end_date) {
      const start = new Date(formData.discount_start_date);
      const end = new Date(formData.discount_end_date);
      if (end < start)
        errors.push("Discount end date must be after start date");
    }

    if (formData.manufactured_at && formData.expires_at) {
      const manufactured = new Date(formData.manufactured_at);
      const expires = new Date(formData.expires_at);
      if (expires < manufactured)
        errors.push("Expiry date must be after manufacture date");
    }

    return errors;
  };

  // Handle form input change
  const handleInputChange = (field: keyof ProductFormData, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  // Handle save product
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const errors = validateForm(form);
    if (errors.length > 0) {
      errors.forEach((error) => toast.error(error));
      return;
    }

    setIsSubmitting(true);

    // Create tempId for optimistic update
    const tempId = -Math.abs(Date.now());

    try {
      const payload = {
        ...form,
        price: form.price ? parseFloat(form.price) : null,
        cost_price: form.cost_price ? parseFloat(form.cost_price) : null,
        sale_price: form.sale_price ? parseFloat(form.sale_price) : null,
        stock_quantity: form.stock_quantity
          ? parseFloat(form.stock_quantity)
          : null,
        low_stock_threshold: form.low_stock_threshold
          ? parseFloat(form.low_stock_threshold)
          : null,
        discount_percentage: form.discount_percentage
          ? parseFloat(form.discount_percentage)
          : null,
        weight: form.weight ? parseFloat(form.weight) : null,
        supplier_id: form.supplier_id ? parseInt(form.supplier_id) : null,
        sub_category_id: form.sub_category_id || 0,
        child_sub_category_id: form.child_sub_category_id || 0,
      };

      // Optimistic update
      const optimisticProduct: ProductList = {
        id: tempId,
        owner_id: 0,
        business_key: "temp",
        name: form.name,
        sku: form.sku,
        description: form.description,
        slug: form.name.toLowerCase().replace(/\s+/g, "-"),
        dimensions: null,
        category_id: form.category_id,
        sub_category_id: form.sub_category_id,
        child_sub_category_id: form.child_sub_category_id,
        unit_id: form.unit_id,
        price: parseFloat(form.price) || null,
        cost_price: form.cost_price ? parseFloat(form.cost_price) : null,
        sale_price: form.sale_price ? parseFloat(form.sale_price) : null,
        stock_quantity: form.stock_quantity
          ? parseFloat(form.stock_quantity)
          : null,
        low_stock_threshold: form.low_stock_threshold
          ? parseFloat(form.low_stock_threshold)
          : null,
        discount_percentage: form.discount_percentage
          ? parseFloat(form.discount_percentage)
          : null,
        discount_start_date: form.discount_start_date,
        discount_end_date: form.discount_end_date,
        manufactured_at: form.manufactured_at,
        expires_at: form.expires_at,
        weight: form.weight ? parseFloat(form.weight) : null,
        length: form.length,
        width: form.width,
        height: form.height,
        supplier_id: form.supplier_id ? parseInt(form.supplier_id) : null,
        is_active: form.is_active,
        is_featured: form.is_featured,
        is_on_sale: form.is_on_sale,
        is_out_of_stock:
          (form.stock_quantity ? parseFloat(form.stock_quantity) : 0) <= 0,
        image: form.image,
        additional_info: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        category: Array.isArray(categories)
          ? categories.find((c) => c.id === form.category_id)
          : undefined,
        unit: Array.isArray(units)
          ? units.find((u) => u.id === form.unit_id)
          : undefined,
        supplier: Array.isArray(suppliers)
          ? suppliers.find((s) => s.id === parseInt(form.supplier_id))
          : undefined,
      };

      setProducts((prev) => [optimisticProduct, ...prev]);

      // API call
      const response = await apiPost("/addproducts", payload, {}, [
        "/addproducts",
      ]);

      if (response.data?.data) {
        const actualProduct = response.data.data;
        setProducts((prev) =>
          prev.map((prod) => (prod.id === tempId ? actualProduct : prod)),
        );
      } else {
        // If response structure is different, refetch
        setForceRefreshProducts(true);
      }

      toast.success("Product created successfully");
      setModalOpen(false);

      // Reset form
      setForm({
        name: "",
        sku: "",
        description: "",
        category_id: 0,
        sub_category_id: 0,
        child_sub_category_id: 0,
        unit_id: 0,
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
    } catch (err: any) {
      const status = err.response?.status;

      // Remove optimistic update
      setProducts((prev) => prev.filter((prod) => prod.id !== tempId));

      if (status === 403) {
        toast.error("You do not have permission to perform this action.");
      } else if (status === 422) {
        const errors = err.response?.data?.errors;
        if (errors) {
          Object.values(errors).forEach((error: any) => {
            toast.error(error[0]);
          });
        } else {
          toast.error("Failed to create product.");
        }
      } else {
        toast.error("Failed to create product.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle edit product
  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || !selectedProduct) return;

    const validationErrors = validateForm(form);
    if (validationErrors.length) {
      validationErrors.forEach((msg) => toast.error(msg));
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        ...form,
        price: form.price ? parseFloat(form.price) : null,
        cost_price: form.cost_price ? parseFloat(form.cost_price) : null,
        sale_price: form.sale_price ? parseFloat(form.sale_price) : null,
        stock_quantity: form.stock_quantity
          ? parseFloat(form.stock_quantity)
          : null,
        low_stock_threshold: form.low_stock_threshold
          ? parseFloat(form.low_stock_threshold)
          : null,
        discount_percentage: form.discount_percentage
          ? parseFloat(form.discount_percentage)
          : null,
        weight: form.weight ? parseFloat(form.weight) : null,
        supplier_id: form.supplier_id ? parseInt(form.supplier_id) : null,
        sub_category_id: form.sub_category_id || 0,
        child_sub_category_id: form.child_sub_category_id || 0,
      };

      await apiPut(
        `/updateproducts/${selectedProduct.id}`,
        payload,
        { _method: "PUT" },
        ["/updateproducts"],
      );

      toast.success("Product updated successfully");

      // Refresh products to get updated data
      setForceRefreshProducts(true);

      setEditModalOpen(false);
    } catch (err: any) {
      toast.error("Failed to update product");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete product
  const handleDelete = async () => {
    if (isSubmitting || !selectedProduct) return;

    setIsSubmitting(true);

    try {
      // Optimistic update
      setProducts((prevProducts) =>
        prevProducts.filter((product) => product.id !== selectedProduct.id),
      );

      await apiDelete(`/products-dels/${selectedProduct.id}`);

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

  // Handle edit button click
  const handleEditClick = (product: ProductList) => {
    setSelectedProduct(product);
    setForm({
      name: product.name,
      sku: product.sku,
      description: product.description || "",
      category_id: product.category_id,
      sub_category_id: product.sub_category_id,
      child_sub_category_id: product.child_sub_category_id,
      unit_id: product.unit_id,
      price: product.price?.toString() || "",
      cost_price: product.cost_price?.toString() || "",
      sale_price: product.sale_price?.toString() || "",
      stock_quantity: product.stock_quantity?.toString() || "",
      low_stock_threshold: product.low_stock_threshold?.toString() || "",
      discount_percentage: product.discount_percentage?.toString() || "",
      discount_start_date: product.discount_start_date || "",
      discount_end_date: product.discount_end_date || "",
      manufactured_at: product.manufactured_at || "",
      expires_at: product.expires_at || "",
      weight: product.weight?.toString() || "",
      length: product.length || "",
      width: product.width || "",
      height: product.height || "",
      supplier_id: product.supplier_id?.toString() || "",
      is_active: product.is_active,
      is_featured: product.is_featured,
      is_on_sale: product.is_on_sale,
      image: product.image,
    });
    setEditModalOpen(true);
  };

  // Handle view button click
  const handleViewClick = (product: ProductList) => {
    setSelectedProduct(product);
    setViewModalOpen(true);
  };

  // Modal close handlers
  const handleModalClose = () => {
    if (!isSubmitting) {
      setModalOpen(false);
      resetForm();
    }
  };

  const handleEditModalClose = () => {
    if (!isSubmitting) {
      setEditModalOpen(false);
      setSelectedProduct(null);
      resetForm();
    }
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

  // Reset form
  const resetForm = () => {
    setForm({
      name: "",
      sku: "",
      description: "",
      category_id: 0,
      sub_category_id: 0,
      child_sub_category_id: 0,
      unit_id: 0,
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
  };

  // Get status badge color
  const getStatusBadgeColor = (isActive: boolean) => {
    return isActive
      ? "bg-green-50 text-green-700 border border-green-200"
      : "bg-gray-50 text-gray-700 border border-gray-200";
  };

  // Get stock badge color
  const getStockBadgeColor = (product: ProductList) => {
    if (product.is_out_of_stock || (product.stock_quantity || 0) <= 0) {
      return "bg-red-50 text-red-700 border border-red-200";
    } else if (
      (product.stock_quantity || 0) <= (product.low_stock_threshold || 5)
    ) {
      return "bg-yellow-50 text-yellow-700 border border-yellow-200";
    } else {
      return "bg-green-50 text-green-700 border border-green-200";
    }
  };

  // CSS classes
  const inputClass =
    "w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200 placeholder-gray-500 text-sm hover:border-gray-400";
  const labelClass = "block text-sm font-semibold text-gray-700 mb-2";

  // Calculate profit margin
  const calculateProfitMargin = (product: ProductList) => {
    if (!product.price || !product.cost_price) return null;
    const margin =
      ((product.price - product.cost_price) / product.cost_price) * 100;
    return margin.toFixed(1);
  };

  return (
    <div className="min-h-screen bg-gray-50/30">
      {/* Header Section */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-8xl mx-auto px-6 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center space-x-4">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors group"
                >
                  <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                  Back to Dashboard
                </Link>
                <div className="h-6 w-px bg-gray-300"></div>
                <h1 className="text-2xl font-normal text-gray-900">
                  Product Management
                </h1>
              </div>
              <p className="text-gray-600 text-sm">
                Manage your inventory products and stock levels
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleRefreshAll}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                title="Refresh All Data"
              >
                <RefreshCw size={18} />
              </button>
              <button
                onClick={() => setModalOpen(true)}
                className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-5 py-2.5 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-medium shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isSubmitting}
              >
                <Plus size={18} />
                Add Product
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards Section */}
      <div className="max-w-8xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Products */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Products
                </p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {products.length}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          {/* Active Products */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Active Products
                </p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {products.filter((p) => p.is_active).length}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          {/* Low Stock */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Low Stock</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {
                    products.filter(
                      (p) =>
                        (p.stock_quantity || 0) <=
                          (p.low_stock_threshold || 5) &&
                        (p.stock_quantity || 0) > 0,
                    ).length
                  }
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-50 rounded-xl flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </div>

          {/* Out of Stock */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Out of Stock
                </p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {
                    products.filter(
                      (p) => p.is_out_of_stock || (p.stock_quantity || 0) <= 0,
                    ).length
                  }
                </p>
              </div>
              <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Card */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {/* Search and Filters Section */}
          <div className="px-6 py-5 border-b border-gray-200 bg-gray-50/50">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 flex-1">
                {/* Search Input */}
                <div className="relative flex-1 max-w-md">
                  <Search
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    size={18}
                  />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search products by name, SKU, description..."
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition placeholder-gray-500 text-sm hover:border-gray-400"
                  />
                </div>

                {/* Filter Controls */}
                <div className="flex items-center gap-3">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition hover:border-gray-400"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>

                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition hover:border-gray-400"
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
                    className="px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition hover:border-gray-400"
                  >
                    <option value="all">All Stock</option>
                    <option value="in_stock">In Stock</option>
                    <option value="out_of_stock">Out of Stock</option>
                    <option value="low_stock">Low Stock</option>
                  </select>
                </div>
              </div>

              {/* Results Summary */}
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full text-sm font-medium border border-blue-200">
                  {isLoading
                    ? "Loading..."
                    : `Showing ${
                        startIndex + 1
                      }-${endIndex} of ${totalItems} product${
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
                <Loader2 className="h-8 w-8 text-blue-600 animate-spin mx-auto mb-3" />
                <p className="text-gray-600 font-medium">Loading products...</p>
                <p className="text-gray-400 text-sm mt-1">
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
                    <thead className="bg-gray-50 text-gray-600 text-left border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider whitespace-nowrap w-12 text-center">
                          S.No
                        </th>
                        <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider whitespace-nowrap text-gray-500">
                          Product
                        </th>
                        <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider whitespace-nowrap text-gray-500">
                          SKU
                        </th>
                        <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider whitespace-nowrap text-gray-500 hidden md:table-cell">
                          Category
                        </th>
                        <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider whitespace-nowrap text-gray-500">
                          Price
                        </th>
                        <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider whitespace-nowrap text-gray-500">
                          Stock
                        </th>
                        <th className="px6 py-4 font-semibold text-xs uppercase tracking-wider whitespace-nowrap text-gray-500">
                          Status
                        </th>
                        <th className="px-6 py-4 text-center font-semibold text-xs uppercase tracking-wider whitespace-nowrap text-gray-500 w-12">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {currentItems.length > 0 ? (
                        currentItems.map((product, index) => (
                          <tr
                            key={product.id}
                            className="hover:bg-gray-50/50 transition-colors group"
                          >
                            {/* Serial Number */}
                            <td className="px-6 py-4 text-center">
                              <span className="text-sm font-medium text-gray-500">
                                {startIndex + index + 1}
                              </span>
                            </td>

                            {/* Product Name and Image */}
                            <td className="px-6 py-4 min-w-[250px]">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-50 rounded-xl flex items-center justify-center flex-shrink-0 border border-blue-200/50 overflow-hidden">
                                  {product.image ? (
                                    <img
                                      src={product.image}
                                      alt={product.name}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <Package className="h-5 w-5 text-blue-600" />
                                  )}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                                    {product.name}
                                  </div>
                                  <div className="text-xs text-gray-500 truncate mt-0.5 flex items-center gap-1">
                                    {product.is_featured && (
                                      <Star className="h-3 w-3 text-yellow-500" />
                                    )}
                                    {product.is_on_sale && (
                                      <Tag className="h-3 w-3 text-red-500" />
                                    )}
                                    {product.slug || "No slug"}
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* SKU */}
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <Hash className="h-4 w-4 text-gray-400" />
                                <span className="font-mono text-sm font-medium text-gray-900">
                                  {product.sku}
                                </span>
                              </div>
                            </td>

                            {/* Category (hidden on mobile) */}
                            <td className="px-6 py-4 min-w-[150px] hidden md:table-cell">
                              <div className="text-gray-600 text-sm">
                                {product.category?.name || "Uncategorized"}
                              </div>
                            </td>

                            {/* Price */}
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-1">
                                  <DollarSign className="h-4 w-4 text-gray-400" />
                                  <span className="font-semibold text-gray-900">
                                    {product.price?.toFixed(2) || "0.00"}
                                  </span>
                                  {product.is_on_sale && product.sale_price && (
                                    <span className="text-xs text-red-600 bg-red-50 px-1.5 py-0.5 rounded">
                                      -{product.discount_percentage}%
                                    </span>
                                  )}
                                </div>
                                {product.is_on_sale && product.sale_price && (
                                  <div className="text-xs text-gray-500 line-through">
                                    ${product.sale_price.toFixed(2)}
                                  </div>
                                )}
                                {product.cost_price && (
                                  <div className="text-xs text-gray-500">
                                    Cost: ${product.cost_price.toFixed(2)}
                                  </div>
                                )}
                              </div>
                            </td>

                            {/* Stock */}
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex flex-col gap-1">
                                <span
                                  className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getStockBadgeColor(
                                    product,
                                  )}`}
                                >
                                  {product.is_out_of_stock ||
                                  (product.stock_quantity || 0) <= 0
                                    ? "Out of Stock"
                                    : (product.stock_quantity || 0) <=
                                        (product.low_stock_threshold || 5)
                                      ? "Low Stock"
                                      : "In Stock"}
                                </span>
                                <div className="text-xs text-gray-500 text-center">
                                  {product.stock_quantity || 0} units
                                </div>
                              </div>
                            </td>

                            {/* Status Badge */}
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

                            {/* Action Menu */}
                            <td className="px-6 py-4 text-center relative whitespace-nowrap">
                              <button
                                onClick={() =>
                                  setOpenRow(
                                    openRow === product.id ? null : product.id,
                                  )
                                }
                                className="p-2 rounded-lg hover:bg-gray-100 transition text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed group/action"
                                disabled={isSubmitting}
                              >
                                <MoreVertical
                                  size={18}
                                  className="group-hover/action:scale-110 transition-transform"
                                />
                              </button>

                              {/* Dropdown Action Menu */}
                              {openRow === product.id && (
                                <>
                                  <div
                                    className="fixed inset-0 z-10"
                                    onClick={() => setOpenRow(null)}
                                  />
                                  <div className="absolute right-6 z-40 w-48 bg-white border border-gray-200 rounded-xl shadow-lg shadow-gray-200/50 animate-fadeIn backdrop-blur-sm">
                                    <button
                                      onClick={() => {
                                        handleViewClick(product);
                                        setOpenRow(null);
                                      }}
                                      className="flex items-center gap-3 w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition first:rounded-t-xl border-b border-gray-100"
                                    >
                                      <Eye
                                        size={16}
                                        className="text-blue-600"
                                      />
                                      View Details
                                    </button>

                                    <button
                                      onClick={() => {
                                        handleEditClick(product);
                                        setOpenRow(null);
                                      }}
                                      className="flex items-center gap-3 w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition border-b border-gray-100"
                                      disabled={isSubmitting}
                                    >
                                      <Edit
                                        size={16}
                                        className="text-blue-600"
                                      />
                                      Edit Product
                                    </button>

                                    <button
                                      onClick={() => {
                                        setSelectedProduct(product);
                                        setDeleteModalOpen(true);
                                        setOpenRow(null);
                                      }}
                                      className="flex items-center gap-3 w-full px-4 py-3 text-sm text-gray-700 hover:bg-red-50 transition last:rounded-b-xl"
                                      disabled={isSubmitting}
                                    >
                                      <Trash2
                                        size={16}
                                        className="text-red-600"
                                      />
                                      Delete Product
                                    </button>
                                  </div>
                                </>
                              )}
                            </td>
                          </tr>
                        ))
                      ) : (
                        // Empty State
                        <tr>
                          <td colSpan={8} className="text-center py-16">
                            <div className="flex flex-col items-center gap-4 max-w-sm mx-auto">
                              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center">
                                <Package size={24} className="text-gray-400" />
                              </div>
                              <div className="space-y-2">
                                <p className="text-gray-900 font-semibold text-lg">
                                  {debouncedSearch
                                    ? "No products found"
                                    : "No products available"}
                                </p>
                                <p className="text-gray-500 text-sm">
                                  {debouncedSearch
                                    ? "Try adjusting your search terms or filters"
                                    : "Get started by adding your first product"}
                                </p>
                              </div>
                              {!debouncedSearch && (
                                <button
                                  onClick={() => setModalOpen(true)}
                                  className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-5 py-2.5 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all font-medium mt-2"
                                >
                                  <Plus size={16} />
                                  Add Product
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pagination Component */}
              {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200 bg-gray-50/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  {/* Items Per Page Selector */}
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">Show</span>
                      <select
                        value={itemsPerPage}
                        onChange={(e) =>
                          handleItemsPerPageChange(Number(e.target.value))
                        }
                        className="px-2 py-1.5 text-sm border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      >
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                      </select>
                      <span className="text-sm text-gray-600">per page</span>
                    </div>
                  </div>

                  {/* Page Navigation */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handlePageChange(1)}
                      disabled={currentPage === 1}
                      className="p-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      aria-label="First page"
                    >
                      <ChevronsLeft size={16} />
                    </button>

                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="p-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      aria-label="Previous page"
                    >
                      <ChevronLeft size={16} />
                    </button>

                    <div className="flex items-center gap-1">
                      {getPageNumbers().map((page, index) => (
                        <React.Fragment key={index}>
                          {page === "..." ? (
                            <span className="px-3 py-2 text-gray-400">...</span>
                          ) : (
                            <button
                              onClick={() => handlePageChange(page as number)}
                              className={`min-w-[2.5rem] h-10 flex items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                                currentPage === page
                                  ? "bg-blue-600 text-white border border-blue-600"
                                  : "text-gray-700 hover:bg-gray-100 border border-gray-300"
                              }`}
                              aria-label={`Page ${page}`}
                              aria-current={
                                currentPage === page ? "page" : undefined
                              }
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
                      className="p-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      aria-label="Next page"
                    >
                      <ChevronRight size={16} />
                    </button>

                    <button
                      onClick={() => handlePageChange(totalPages)}
                      disabled={currentPage === totalPages}
                      className="p-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      aria-label="Last page"
                    >
                      <ChevronsRight size={16} />
                    </button>
                  </div>

                  {/* Page Info */}
                  <div className="text-sm text-gray-600">
                    Page <span className="font-semibold">{currentPage}</span> of{" "}
                    <span className="font-semibold">{totalPages}</span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Add Product Modal */}
        {modalOpen && (
          <ProductModal
            title="Add New Product"
            description="Create a new product for your inventory"
            icon={<Plus className="h-5 w-5 text-blue-600" />}
            isOpen={modalOpen}
            onClose={handleModalClose}
            onSubmit={handleSave}
            isSubmitting={isSubmitting}
            form={form}
            handleInputChange={handleInputChange}
            categories={categories}
            units={units}
            suppliers={suppliers}
            actionLabel="Add Product"
            actionIcon={<Plus size={16} />}
          />
        )}

        {/* Edit Product Modal */}
        {editModalOpen && selectedProduct && (
          <ProductModal
            title="Edit Product"
            description="Update product information"
            icon={<Edit className="h-5 w-5 text-blue-600" />}
            isOpen={editModalOpen}
            onClose={handleEditModalClose}
            onSubmit={handleEdit}
            isSubmitting={isSubmitting}
            form={form}
            handleInputChange={handleInputChange}
            categories={categories}
            units={units}
            suppliers={suppliers}
            actionLabel="Update Product"
            actionIcon={<Edit size={16} />}
          />
        )}

        {/* Delete Confirmation Modal */}
        {deleteModalOpen && selectedProduct && (
          <CombinedModal title={null} onClose={handleDeleteModalClose}>
            <div className="max-w-md mx-auto rounded-2xl p-6 bg-white animate-fadeIn flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 flex items-center justify-center rounded-2xl bg-red-50 border border-red-200">
                <AlertTriangle className="w-7 h-7 text-red-600" />
              </div>

              <h2 className="text-xl font-bold text-gray-900">
                Delete Product
              </h2>
              <p className="text-gray-600 text-sm leading-relaxed">
                Are you sure you want to delete{" "}
                <span className="font-semibold text-gray-900">
                  {selectedProduct.name}
                </span>
                ? This action cannot be undone and all associated data will be
                permanently removed.
              </p>

              <div className="mt-6 flex justify-center gap-3 w-full">
                <button
                  type="button"
                  onClick={handleDeleteModalClose}
                  className="flex-1 px-6 py-3 rounded-lg border border-gray-300 bg-white text-gray-700 font-medium hover:bg-gray-50 transition disabled:opacity-50"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="flex-1 px-6 py-3 rounded-lg bg-gradient-to-r from-red-600 to-red-700 text-white font-medium flex items-center justify-center gap-2 hover:from-red-700 hover:to-red-800 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-red-500/25"
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
          </CombinedModal>
        )}

        {/* View Product Modal */}
        {viewModalOpen && selectedProduct && (
          <CombinedModal
            title={
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Eye className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Product Details
                  </h2>
                  <p className="text-gray-500 text-sm">
                    View detailed product information
                  </p>
                </div>
              </div>
            }
            onClose={handleViewModalClose}
          >
            <div className="space-y-6">
              {/* Product Header */}
              <div className="flex items-start gap-4">
                <div className="w-20 h-20 bg-gray-100 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0">
                  {selectedProduct.image ? (
                    <img
                      src={selectedProduct.image}
                      alt={selectedProduct.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Package className="h-8 w-8 text-gray-400" />
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    {selectedProduct.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-mono text-sm text-gray-600">
                      SKU: {selectedProduct.sku}
                    </span>
                    {selectedProduct.is_featured && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        <Star className="h-3 w-3 mr-1" />
                        Featured
                      </span>
                    )}
                    {selectedProduct.is_on_sale && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        <Tag className="h-3 w-3 mr-1" />
                        On Sale
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Product Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900">
                    Basic Information
                  </h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Description</span>
                      <span className="text-sm text-gray-900 text-right">
                        {selectedProduct.description || "No description"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Category</span>
                      <span className="text-sm text-gray-900">
                        {selectedProduct.category?.name || "Uncategorized"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Unit</span>
                      <span className="text-sm text-gray-900">
                        {selectedProduct.unit?.name || "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Status</span>
                      <span
                        className={`text-sm font-medium ${
                          selectedProduct.is_active
                            ? "text-green-600"
                            : "text-gray-600"
                        }`}
                      >
                        {selectedProduct.is_active ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Pricing Information */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900">
                    Pricing & Stock
                  </h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Price</span>
                      <span className="text-sm font-semibold text-gray-900">
                        ${selectedProduct.price?.toFixed(2) || "0.00"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Cost Price</span>
                      <span className="text-sm text-gray-900">
                        ${selectedProduct.cost_price?.toFixed(2) || "N/A"}
                      </span>
                    </div>
                    {selectedProduct.is_on_sale &&
                      selectedProduct.sale_price && (
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500">
                            Sale Price
                          </span>
                          <span className="text-sm font-semibold text-red-600">
                            ${selectedProduct.sale_price.toFixed(2)}
                          </span>
                        </div>
                      )}
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">
                        Stock Quantity
                      </span>
                      <span
                        className={`text-sm font-medium ${
                          selectedProduct.is_out_of_stock ||
                          (selectedProduct.stock_quantity || 0) <= 0
                            ? "text-red-600"
                            : (selectedProduct.stock_quantity || 0) <=
                                (selectedProduct.low_stock_threshold || 5)
                              ? "text-yellow-600"
                              : "text-green-600"
                        }`}
                      >
                        {selectedProduct.stock_quantity || 0} units
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">
                        Low Stock Threshold
                      </span>
                      <span className="text-sm text-gray-900">
                        {selectedProduct.low_stock_threshold || 5} units
                      </span>
                    </div>
                  </div>
                </div>

                {/* Dimensions & Weight */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900">
                    Dimensions & Weight
                  </h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Weight</span>
                      <span className="text-sm text-gray-900">
                        {selectedProduct.weight
                          ? `${selectedProduct.weight} kg`
                          : "N/A"}
                      </span>
                    </div>
                    {(selectedProduct.length ||
                      selectedProduct.width ||
                      selectedProduct.height) && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">
                          Dimensions
                        </span>
                        <span className="text-sm text-gray-900">
                          {selectedProduct.length &&
                          selectedProduct.width &&
                          selectedProduct.height
                            ? `${selectedProduct.length} × ${selectedProduct.width} × ${selectedProduct.height} cm`
                            : selectedProduct.dimensions || "N/A"}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Supplier & Dates */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900">
                    Supplier & Dates
                  </h4>
                  <div className="space-y-3">
                    {selectedProduct.supplier && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Supplier</span>
                        <span className="text-sm text-gray-900">
                          {selectedProduct.supplier.name}
                        </span>
                      </div>
                    )}
                    {selectedProduct.manufactured_at && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">
                          Manufactured
                        </span>
                        <span className="text-sm text-gray-900">
                          {new Date(
                            selectedProduct.manufactured_at,
                          ).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    {selectedProduct.expires_at && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Expires</span>
                        <span className="text-sm text-gray-900">
                          {new Date(
                            selectedProduct.expires_at,
                          ).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Created</span>
                      <span className="text-sm text-gray-900">
                        {new Date(
                          selectedProduct.created_at,
                        ).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Profit Margin Calculation */}
              {selectedProduct.price && selectedProduct.cost_price && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-blue-600" />
                      <span className="font-semibold text-blue-900">
                        Profit Margin
                      </span>
                    </div>
                    <span className="text-lg font-bold text-blue-700">
                      {calculateProfitMargin(selectedProduct)}%
                    </span>
                  </div>
                  <p className="text-sm text-blue-600 mt-1">
                    Based on price: ${selectedProduct.price.toFixed(2)} and
                    cost: ${selectedProduct.cost_price.toFixed(2)}
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleViewModalClose}
                  className="px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleEditClick(selectedProduct);
                    handleViewModalClose();
                  }}
                  className="px-6 py-3 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all inline-flex items-center gap-2"
                >
                  <Edit size={16} />
                  Edit Product
                </button>
              </div>
            </div>
          </CombinedModal>
        )}
      </div>
    </div>
  );
};

// Product Modal Component
interface ProductModalProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  isSubmitting: boolean;
  form: ProductFormData;
  handleInputChange: (field: keyof ProductFormData, value: any) => void;
  categories: Category[];
  units: Unit[];
  suppliers: Supplier[];
  actionLabel: string;
  actionIcon: React.ReactNode;
}

const ProductModal = ({
  title,
  description,
  icon,
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
  form,
  handleInputChange,
  categories,
  units,
  suppliers,
  actionLabel,
  actionIcon,
}: ProductModalProps) => {
  if (!isOpen) return null;

  const inputClass =
    "w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200 placeholder-gray-500 text-sm hover:border-gray-400";
  const labelClass = "block text-sm font-semibold text-gray-700 mb-2";

  return (
    <CombinedModal
      title={
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
            {icon}
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">{title}</h2>
            <p className="text-gray-500 text-sm">{description}</p>
          </div>
        </div>
      }
      onClose={onClose}
    >
      <form
        onSubmit={onSubmit}
        className="space-y-6 max-h-[70vh] overflow-y-auto pr-2"
      >
        {/* Product Name and SKU */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className={labelClass}>
              Product Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              required
              className={inputClass}
              placeholder="Enter product name"
            />
          </div>
          <div>
            <label className={labelClass}>
              SKU <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.sku}
              onChange={(e) => handleInputChange("sku", e.target.value)}
              required
              className={inputClass}
              placeholder="Enter stock keeping unit"
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className={labelClass}>Description</label>
          <textarea
            value={form.description}
            onChange={(e) => handleInputChange("description", e.target.value)}
            className={`${inputClass} resize-none`}
            placeholder="Enter product description"
            rows={3}
          />
        </div>

        {/* Category and Unit */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className={labelClass}>
              Category <span className="text-red-500">*</span>
            </label>
            <select
              value={form.category_id}
              onChange={(e) =>
                handleInputChange("category_id", parseInt(e.target.value))
              }
              required
              className={inputClass}
            >
              <option value={0}>Select Category</option>
              {Array.isArray(categories) && categories.length > 0 ? (
                categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))
              ) : (
                <option value={0} disabled>
                  No categories available
                </option>
              )}
            </select>
            {Array.isArray(categories) && categories.length === 0 && (
              <p className="text-xs text-red-500 mt-1">
                No categories found. Please add categories first.
              </p>
            )}
          </div>
          <div>
            <label className={labelClass}>
              Unit <span className="text-red-500">*</span>
            </label>
            <select
              value={form.unit_id}
              onChange={(e) =>
                handleInputChange("unit_id", parseInt(e.target.value))
              }
              required
              className={inputClass}
            >
              <option value={0}>Select Unit</option>
              {Array.isArray(units) && units.length > 0 ? (
                units.map((unit) => (
                  <option key={unit.id} value={unit.id}>
                    {unit.name} ({unit.symbol})
                  </option>
                ))
              ) : (
                <option value={0} disabled>
                  No units available
                </option>
              )}
            </select>
            {Array.isArray(units) && units.length === 0 && (
              <p className="text-xs text-red-500 mt-1">
                No units found. Please add units first.
              </p>
            )}
          </div>
        </div>

        {/* Pricing */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className={labelClass}>Price</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={form.price}
              onChange={(e) => handleInputChange("price", e.target.value)}
              className={inputClass}
              placeholder="0.00"
            />
          </div>
          <div>
            <label className={labelClass}>Cost Price</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={form.cost_price}
              onChange={(e) => handleInputChange("cost_price", e.target.value)}
              className={inputClass}
              placeholder="0.00"
            />
          </div>
          <div>
            <label className={labelClass}>Sale Price</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={form.sale_price}
              onChange={(e) => handleInputChange("sale_price", e.target.value)}
              className={inputClass}
              placeholder="0.00"
            />
          </div>
        </div>

        {/* Stock Management */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className={labelClass}>Stock Quantity</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={form.stock_quantity}
              onChange={(e) =>
                handleInputChange("stock_quantity", e.target.value)
              }
              className={inputClass}
              placeholder="0"
            />
          </div>
          <div>
            <label className={labelClass}>Low Stock Threshold</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={form.low_stock_threshold}
              onChange={(e) =>
                handleInputChange("low_stock_threshold", e.target.value)
              }
              className={inputClass}
              placeholder="5"
            />
          </div>
        </div>

        {/* Discount */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className={labelClass}>Discount %</label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={form.discount_percentage}
              onChange={(e) =>
                handleInputChange("discount_percentage", e.target.value)
              }
              className={inputClass}
              placeholder="0.00"
            />
          </div>
          <div>
            <label className={labelClass}>Discount Start Date</label>
            <input
              type="date"
              value={form.discount_start_date}
              onChange={(e) =>
                handleInputChange("discount_start_date", e.target.value)
              }
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Discount End Date</label>
            <input
              type="date"
              value={form.discount_end_date}
              onChange={(e) =>
                handleInputChange("discount_end_date", e.target.value)
              }
              className={inputClass}
            />
          </div>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className={labelClass}>Manufacture Date</label>
            <input
              type="date"
              value={form.manufactured_at}
              onChange={(e) =>
                handleInputChange("manufactured_at", e.target.value)
              }
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Expiry Date</label>
            <input
              type="date"
              value={form.expires_at}
              onChange={(e) => handleInputChange("expires_at", e.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        {/* Dimensions and Weight */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div>
            <label className={labelClass}>Weight (kg)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={form.weight}
              onChange={(e) => handleInputChange("weight", e.target.value)}
              className={inputClass}
              placeholder="0.00"
            />
          </div>
          <div>
            <label className={labelClass}>Length (cm)</label>
            <input
              type="text"
              value={form.length}
              onChange={(e) => handleInputChange("length", e.target.value)}
              className={inputClass}
              placeholder="0"
            />
          </div>
          <div>
            <label className={labelClass}>Width (cm)</label>
            <input
              type="text"
              value={form.width}
              onChange={(e) => handleInputChange("width", e.target.value)}
              className={inputClass}
              placeholder="0"
            />
          </div>
          <div>
            <label className={labelClass}>Height (cm)</label>
            <input
              type="text"
              value={form.height}
              onChange={(e) => handleInputChange("height", e.target.value)}
              className={inputClass}
              placeholder="0"
            />
          </div>
        </div>

        {/* Supplier */}
        <div>
          <label className={labelClass}>Supplier</label>
          <select
            value={form.supplier_id}
            onChange={(e) => handleInputChange("supplier_id", e.target.value)}
            className={inputClass}
          >
            <option value="">Select Supplier</option>
            {Array.isArray(suppliers) && suppliers.length > 0 ? (
              suppliers.map((supplier) => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.vendor_name}
                </option>
              ))
            ) : (
              <option value="" disabled>
                No suppliers available
              </option>
            )}
          </select>
        </div>

        {/* Status Toggles */}
        <div className="space-y-4">
          <label className="flex items-center space-x-3 cursor-pointer">
            <div className="relative">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) =>
                  handleInputChange("is_active", e.target.checked)
                }
                className="sr-only"
              />
              <div
                className={`w-12 h-6 flex items-center rounded-full p-1 transition-all ${
                  form.is_active ? "bg-green-500" : "bg-gray-300"
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                    form.is_active ? "translate-x-6" : "translate-x-0"
                  }`}
                />
              </div>
            </div>
            <div>
              <span className="font-semibold text-gray-700">Active Status</span>
              <p className="text-xs text-gray-500">
                {form.is_active
                  ? "Product is visible and active"
                  : "Product is hidden and inactive"}
              </p>
            </div>
          </label>

          <label className="flex items-center space-x-3 cursor-pointer">
            <div className="relative">
              <input
                type="checkbox"
                checked={form.is_featured}
                onChange={(e) =>
                  handleInputChange("is_featured", e.target.checked)
                }
                className="sr-only"
              />
              <div
                className={`w-12 h-6 flex items-center rounded-full p-1 transition-all ${
                  form.is_featured ? "bg-yellow-500" : "bg-gray-300"
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                    form.is_featured ? "translate-x-6" : "translate-x-0"
                  }`}
                />
              </div>
            </div>
            <div>
              <span className="font-semibold text-gray-700">
                Featured Product
              </span>
              <p className="text-xs text-gray-500">
                {form.is_featured
                  ? "Product will be highlighted as featured"
                  : "Product will not be featured"}
              </p>
            </div>
          </label>

          <label className="flex items-center space-x-3 cursor-pointer">
            <div className="relative">
              <input
                type="checkbox"
                checked={form.is_on_sale}
                onChange={(e) =>
                  handleInputChange("is_on_sale", e.target.checked)
                }
                className="sr-only"
              />
              <div
                className={`w-12 h-6 flex items-center rounded-full p-1 transition-all ${
                  form.is_on_sale ? "bg-red-500" : "bg-gray-300"
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                    form.is_on_sale ? "translate-x-6" : "translate-x-0"
                  }`}
                />
              </div>
            </div>
            <div>
              <span className="font-semibold text-gray-700">On Sale</span>
              <p className="text-xs text-gray-500">
                {form.is_on_sale
                  ? "Product will be shown as on sale"
                  : "Product will not be on sale"}
              </p>
            </div>
          </label>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-6 py-3 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/25"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                {actionLabel.includes("Add") ? "Creating..." : "Updating..."}
              </>
            ) : (
              <>
                {actionIcon}
                {actionLabel}
              </>
            )}
          </button>
        </div>
      </form>
    </CombinedModal>
  );
};

// Combined Modal Component
interface CombinedModalProps {
  title: React.ReactNode;
  children: React.ReactNode;
  onClose: () => void;
}

const CombinedModal = ({ title, children, onClose }: CombinedModalProps) => (
  <div
    className="fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-50 p-4 animate-fadeIn"
    onClick={onClose}
  >
    <div
      className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto animate-scaleIn"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        {title}
        <button
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 transition hover:bg-gray-100 rounded-lg"
          aria-label="Close modal"
        >
          <X size={20} />
        </button>
      </div>
      <div className="p-6">{children}</div>
    </div>
  </div>
);

export default withAuth(ManageProducts);
