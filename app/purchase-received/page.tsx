"use client";

import { withAuth } from "@/hoc/withAuth";
import { apiGet, apiPost, apiPut } from "@/lib/axios";
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
  Filter,
  RefreshCw,
  User,
  Building,
  Mail,
  Phone,
  MapPin,
  Globe,
  FileText,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Building2,
  Briefcase,
  CreditCard,
  Calendar,
  Users,
  Eye,
  SlidersHorizontal,
  Download,
  Package,
  Truck,
  Barcode,
  ClipboardCheck,
  Clock,
  AlertCircle,
  Hash,
  DollarSign,
  Scale,
  Box,
  ShoppingCart,
  Warehouse,
  FileSpreadsheet,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";
import { toast } from "react-hot-toast";
import ShortTextWithTooltip from "../component/shorten_len";

// TypeScript interfaces
interface User {
  id: number;
  name: string;
  email: string;
  role?: string;
}

interface ReceivedItem {
  id: number;
  created_at: string;
  updated_at: string;
  receiver_id: number;
  business_key: string;
  location_id: number;
  purchase_order_id: number | null;
  vendor_id: number | null;
  item_name: string;
  sku: string | null;
  description: string | null;
  quantity_received: number;
  unit_of_measure: string;
  unit_price: number | null;
  total_price: number | null;
  received_date: string;
  status: "pending" | "accepted" | "rejected" | "partially_accepted";
  batch_number: string | null;
  lot_number: string | null;
  expiry_date: string | null;
  condition: "good" | "damaged" | "expired" | "wrong_item";
  notes: string | null;
  accepted_quantity: number | null;
  rejected_quantity: number | null;
  vendor?: {
    id: number;
    vendor_name: string;
    email: string;
  };
  purchase_order?: {
    id: number;
    po_number: string;
  };
  location?: {
    id: number;
    location_name: string;
  };
  business?: {
    business_key: string;
    business_name: string;
  };
  receiver?: {
    id: number;
    name: string;
    email: string;
  };
}

interface ReceivedItemFormData {
  item_name: string;
  sku: string;
  description: string;
  quantity_received: number;
  unit_of_measure: string;
  unit_price: number;
  purchase_order_id: number | null;
  vendor_id: number | null;
  received_date: string;
  status: "pending" | "accepted" | "rejected" | "partially_accepted";
  batch_number: string;
  lot_number: string;
  expiry_date: string;
  condition: "good" | "damaged" | "expired" | "wrong_item";
  notes: string;
  accepted_quantity: number | null;
  rejected_quantity: number | null;
  location_id: number;
  business_key: string;
}

interface Vendor {
  id: number;
  vendor_name: string;
  email: string;
}

interface PurchaseOrder {
  id: number;
  po_number: string;
  vendor_id: number;
  vendor_name?: string;
}

interface BusinessLocation {
  id: number;
  location_name: string;
  business_key: string;
}

interface Business {
  business_key: string;
  business_name: string;
}

interface ApiError {
  response?: {
    status?: number;
    data?: {
      message?: string;
      errors?: Record<string, string[]>;
    };
  };
  userMessage?: string;
}

interface ReceivedItemsApiResponse {
  data?: {
    data?: {
      received_items?: ReceivedItem[];
    };
    received_items?: ReceivedItem[];
  };
  received_items?: ReceivedItem[];
}

interface VendorsApiResponse {
  data?: {
    data?: Vendor[];
    vendors?: Vendor[];
  };
  vendors?: Vendor[];
}

interface PurchaseOrdersApiResponse {
  data?: {
    data?: PurchaseOrder[];
    purchase_orders?: PurchaseOrder[];
  };
  purchase_orders?: PurchaseOrder[];
}

interface LocationApiResponse {
  data?: {
    data?: BusinessLocation[];
    locations?: BusinessLocation[];
  };
  locations?: BusinessLocation[];
}

interface BusinessApiResponse {
  data?: {
    data?: Business[];
    businesses?: Business[];
  };
  businesses?: Business[];
}

interface CombinedModalProps {
  title: React.ReactNode;
  children: React.ReactNode;
  onClose: () => void;
  size?: "sm" | "md" | "lg" | "xl";
}

const ManageReceivedItems = ({ user }: { user: User }) => {
  // Search and Filter States
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [conditionFilter, setConditionFilter] = useState<string>("all");
  const [vendorFilter, setVendorFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // UI Interaction States
  const [openRow, setOpenRow] = useState<number | null>(null);

  // Modal States
  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [acceptModalOpen, setAcceptModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);

  // Selected Item State
  const [selectedItem, setSelectedItem] = useState<ReceivedItem | null>(null);

  // Loading States
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Data States
  const [receivedItems, setReceivedItems] = useState<ReceivedItem[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [locations, setLocations] = useState<BusinessLocation[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);

  // Form State
  const [form, setForm] = useState<ReceivedItemFormData>({
    item_name: "",
    sku: "",
    description: "",
    quantity_received: 0,
    unit_of_measure: "pieces",
    unit_price: 0,
    purchase_order_id: null,
    vendor_id: null,
    received_date: new Date().toISOString().split("T")[0],
    status: "pending",
    batch_number: "",
    lot_number: "",
    expiry_date: "",
    condition: "good",
    notes: "",
    accepted_quantity: null,
    rejected_quantity: null,
    location_id: 0,
    business_key: "",
  });

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const router = useRouter();

  // Stats calculations
  const stats = useMemo(() => {
    const total = receivedItems.length;
    const pending = receivedItems.filter((i) => i.status === "pending").length;
    const accepted = receivedItems.filter((i) => i.status === "accepted").length;
    const rejected = receivedItems.filter((i) => i.status === "rejected").length;
    const totalQuantity = receivedItems.reduce(
      (sum, item) => sum + (item.quantity_received || 0),
      0
    );
    const totalValue = receivedItems.reduce(
      (sum, item) => sum + (item.total_price || 0),
      0
    );

    return { total, pending, accepted, rejected, totalQuantity, totalValue };
  }, [receivedItems]);

  // Effect for debouncing search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Effect to reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, conditionFilter, vendorFilter, dateFilter]);

  // Effect to fetch data on component mount
  useEffect(() => {
    if (!user) return;
    fetchReceivedItems();
    fetchVendors();
    fetchPurchaseOrders();
    fetchLocations();
    fetchBusinesses();
  }, [user]);

  const fetchReceivedItems = async () => {
    setIsLoading(true);
    try {
      const res = (await apiGet("/received-items")) as {
        data: ReceivedItemsApiResponse;
      };
      const itemsArray: ReceivedItem[] =
        res.data?.data?.received_items ??
        res.data?.data ??
        res.data?.received_items ??
        [];
      setReceivedItems(Array.isArray(itemsArray) ? itemsArray : []);
    } catch (err) {
      const error = err as ApiError;
      toast.error(
        error.response?.status === 403
          ? "You don't have permission to access received items"
          : "Failed to fetch received items"
      );
      setReceivedItems([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchVendors = async () => {
    try {
      const res = (await apiGet("/vendors")) as { data: VendorsApiResponse };
      const vendorsArray: Vendor[] =
        res.data?.data?.vendors ?? res.data?.data ?? res.data?.vendors ?? [];
      setVendors(Array.isArray(vendorsArray) ? vendorsArray : []);
    } catch {
      toast.error("Failed to fetch vendors");
      setVendors([]);
    }
  };

  const fetchPurchaseOrders = async () => {
    try {
      const res = (await apiGet("/purchase-orders")) as {
        data: PurchaseOrdersApiResponse;
      };
      const poArray: PurchaseOrder[] =
        res.data?.data?.purchase_orders ??
        res.data?.data ??
        res.data?.purchase_orders ??
        [];
      setPurchaseOrders(Array.isArray(poArray) ? poArray : []);
    } catch {
      toast.error("Failed to fetch purchase orders");
      setPurchaseOrders([]);
    }
  };

  const fetchLocations = async () => {
    try {
      const res = (await apiGet("/locations")) as {
        data: LocationApiResponse;
      };
      const locationsArray: BusinessLocation[] =
        res.data?.data ?? res.data?.locations ?? [];
      setLocations(Array.isArray(locationsArray) ? locationsArray : []);
    } catch {
      toast.error("Failed to fetch locations");
      setLocations([]);
    }
  };

  const fetchBusinesses = async () => {
    try {
      const res = (await apiGet("/businesses")) as {
        data: BusinessApiResponse;
      };
      const businessesArray: Business[] =
        res.data?.data ?? res.data?.businesses ?? [];
      setBusinesses(Array.isArray(businessesArray) ? businessesArray : []);
    } catch {
      toast.error("Failed to fetch businesses");
      setBusinesses([]);
    }
  };

  const resetForm = () => {
    setForm({
      item_name: "",
      sku: "",
      description: "",
      quantity_received: 0,
      unit_of_measure: "pieces",
      unit_price: 0,
      purchase_order_id: null,
      vendor_id: null,
      received_date: new Date().toISOString().split("T")[0],
      status: "pending",
      batch_number: "",
      lot_number: "",
      expiry_date: "",
      condition: "good",
      notes: "",
      accepted_quantity: null,
      rejected_quantity: null,
      location_id: 0,
      business_key: "",
    });
  };

  const filteredItems = useMemo(() => {
    return receivedItems.filter((item) => {
      if (!item) return false;

      const searchableText = [
        item.item_name || "",
        item.sku || "",
        item.description || "",
        item.batch_number || "",
        item.lot_number || "",
        item.vendor?.vendor_name || "",
        item.purchase_order?.po_number || "",
        item.location?.location_name || "",
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch = searchableText.includes(
        debouncedSearch.toLowerCase()
      );

      const matchesStatus =
        statusFilter === "all" || item.status === statusFilter;

      const matchesCondition =
        conditionFilter === "all" || item.condition === conditionFilter;

      const matchesVendor =
        vendorFilter === "all" ||
        (item.vendor_id && item.vendor_id.toString() === vendorFilter);

      // Date filtering
      let matchesDate = true;
      if (dateFilter !== "all") {
        const itemDate = new Date(item.received_date);
        const today = new Date();
        const daysDiff = Math.floor(
          (today.getTime() - itemDate.getTime()) / (1000 * 3600 * 24)
        );

        switch (dateFilter) {
          case "today":
            matchesDate = daysDiff === 0;
            break;
          case "week":
            matchesDate = daysDiff <= 7;
            break;
          case "month":
            matchesDate = daysDiff <= 30;
            break;
          case "quarter":
            matchesDate = daysDiff <= 90;
            break;
        }
      }

      return (
        matchesSearch && matchesStatus && matchesCondition && matchesVendor && matchesDate
      );
    });
  }, [receivedItems, debouncedSearch, statusFilter, conditionFilter, vendorFilter, dateFilter]);

  // Pagination calculations
  const totalItems = filteredItems.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);

  const currentItems = useMemo(() => {
    return filteredItems.slice(startIndex, endIndex);
  }, [filteredItems, startIndex, endIndex]);

  const getPageNumbers = () => {
    const pageNumbers: (number | string)[] = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      pageNumbers.push(1);
      let startPage = Math.max(2, currentPage - 1);
      let endPage = Math.min(totalPages - 1, currentPage + 1);

      if (currentPage <= 3) endPage = Math.min(4, totalPages - 1);
      if (currentPage >= totalPages - 2) startPage = Math.max(totalPages - 3, 2);

      if (startPage > 2) pageNumbers.push("...");
      for (let i = startPage; i <= endPage; i++) pageNumbers.push(i);
      if (endPage < totalPages - 1) pageNumbers.push("...");
      if (totalPages > 1) pageNumbers.push(totalPages);
    }

    return pageNumbers;
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      const tableContainer = document.querySelector(".overflow-x-auto");
      if (tableContainer) tableContainer.scrollTop = 0;
    }
  };

  const handleItemsPerPageChange = (value: number) => {
    setItemsPerPage(value);
    setCurrentPage(1);
  };

  const validateForm = (formData: ReceivedItemFormData): string[] => {
    const errors: string[] = [];
    if (!formData.item_name.trim()) errors.push("Item name is required");
    if (!formData.location_id) errors.push("Location is required");
    if (formData.quantity_received <= 0)
      errors.push("Quantity received must be greater than 0");
    if (formData.unit_price && formData.unit_price < 0)
      errors.push("Unit price cannot be negative");
    return errors;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const errors = validateForm(form);
    if (errors.length > 0) {
      errors.forEach((error) => toast.error(error));
      return;
    }

    setIsSubmitting(true);
    let tempId: number | null = null;

    try {
      const payload = {
        ...form,
        location_id: Number(form.location_id),
        vendor_id: form.vendor_id ? Number(form.vendor_id) : null,
        purchase_order_id: form.purchase_order_id
          ? Number(form.purchase_order_id)
          : null,
        total_price:
          (form.quantity_received || 0) * (form.unit_price || 0),
      };

      tempId = -Math.abs(Date.now());

      const optimisticItem: ReceivedItem = {
        id: tempId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        receiver_id: user.id,
        business_key: form.business_key,
        location_id: form.location_id,
        purchase_order_id: form.purchase_order_id,
        vendor_id: form.vendor_id,
        item_name: form.item_name,
        sku: form.sku,
        description: form.description,
        quantity_received: form.quantity_received,
        unit_of_measure: form.unit_of_measure,
        unit_price: form.unit_price,
        total_price: payload.total_price,
        received_date: form.received_date,
        status: form.status,
        batch_number: form.batch_number,
        lot_number: form.lot_number,
        expiry_date: form.expiry_date,
        condition: form.condition,
        notes: form.notes,
        accepted_quantity: form.accepted_quantity,
        rejected_quantity: form.rejected_quantity,
        vendor: vendors.find((v) => v.id === form.vendor_id) || undefined,
        purchase_order: purchaseOrders.find(
          (po) => po.id === form.purchase_order_id
        ) || undefined,
        location: locations.find((l) => l.id === form.location_id) || undefined,
        business: businesses.find(
          (b) => b.business_key === form.business_key
        ) || undefined,
        receiver: { id: user.id, name: user.name, email: user.email },
      };

      setReceivedItems((prev) => [optimisticItem, ...prev]);

      const response = (await apiPost("/received-items", payload, {}, [
        "/received-items",
      ])) as { data?: { data?: ReceivedItem } };

      if (response.data?.data) {
        const actualItem = response.data.data;
        setReceivedItems((prev) =>
          prev.map((item) => (item.id === tempId ? actualItem : item))
        );
      } else {
        fetchReceivedItems();
      }

      toast.success("Received item recorded successfully");
      setModalOpen(false);
      resetForm();
    } catch (err) {
      const error = err as ApiError;
      if (tempId) {
        setReceivedItems((prev) => prev.filter((item) => item.id !== tempId));
      }
      const errorMessage =
        error.userMessage ||
        error.response?.data?.message ||
        "Failed to record received item";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || !selectedItem) return;

    const validationErrors = validateForm(form);
    if (validationErrors.length) {
      validationErrors.forEach((msg) => toast.error(msg));
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        ...form,
        location_id: Number(form.location_id),
        vendor_id: form.vendor_id ? Number(form.vendor_id) : null,
        purchase_order_id: form.purchase_order_id
          ? Number(form.purchase_order_id)
          : null,
        total_price:
          (form.quantity_received || 0) * (form.unit_price || 0),
        _method: "PUT",
      };

      setReceivedItems((prevItems) =>
        prevItems.map((item) =>
          item.id === selectedItem.id
            ? {
                ...item,
                ...form,
                total_price: payload.total_price,
                updated_at: new Date().toISOString(),
                vendor:
                  vendors.find((v) => v.id === form.vendor_id) || item.vendor,
                purchase_order:
                  purchaseOrders.find(
                    (po) => po.id === form.purchase_order_id
                  ) || item.purchase_order,
                location:
                  locations.find((l) => l.id === form.location_id) ||
                  item.location,
              }
            : item
        )
      );

      await apiPut(
        `/received-items/${selectedItem.id}`,
        payload,
        { _method: "PUT" },
        ["/received-items"]
      );

      toast.success("Received item updated successfully");
      setEditModalOpen(false);
      resetForm();
    } catch (err) {
      const error = err as ApiError;
      const errorMessage =
        error.userMessage ||
        error.response?.data?.message ||
        "Failed to update received item";
      toast.error(errorMessage);
      fetchReceivedItems();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (isSubmitting || !selectedItem) return;
    setIsSubmitting(true);
    try {
      setReceivedItems((prevItems) =>
        prevItems.filter((item) => item.id !== selectedItem.id)
      );
      await api.delete(`/received-items/${selectedItem.id}`);
      toast.success("Received item deleted successfully!");
      setDeleteModalOpen(false);
      setSelectedItem(null);
    } catch {
      toast.error("Failed to delete received item");
      fetchReceivedItems();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAcceptItem = async () => {
    if (isSubmitting || !selectedItem) return;
    setIsSubmitting(true);
    try {
      setReceivedItems((prevItems) =>
        prevItems.map((item) =>
          item.id === selectedItem.id
            ? { ...item, status: "accepted" as const, accepted_quantity: item.quantity_received }
            : item
        )
      );
      await apiPut(`/received-items/${selectedItem.id}/accept`, {});
      toast.success("Item accepted successfully!");
      setAcceptModalOpen(false);
      setSelectedItem(null);
    } catch {
      toast.error("Failed to accept item");
      fetchReceivedItems();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRejectItem = async () => {
    if (isSubmitting || !selectedItem) return;
    setIsSubmitting(true);
    try {
      setReceivedItems((prevItems) =>
        prevItems.map((item) =>
          item.id === selectedItem.id
            ? { ...item, status: "rejected" as const, rejected_quantity: item.quantity_received }
            : item
        )
      );
      await apiPut(`/received-items/${selectedItem.id}/reject`, {});
      toast.success("Item rejected successfully!");
      setRejectModalOpen(false);
      setSelectedItem(null);
    } catch {
      toast.error("Failed to reject item");
      fetchReceivedItems();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (
    field: keyof ReceivedItemFormData,
    value: string | number | null
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const prepareEditForm = (item: ReceivedItem) => {
    setForm({
      item_name: item.item_name,
      sku: item.sku || "",
      description: item.description || "",
      quantity_received: item.quantity_received,
      unit_of_measure: item.unit_of_measure,
      unit_price: item.unit_price || 0,
      purchase_order_id: item.purchase_order_id,
      vendor_id: item.vendor_id,
      received_date: item.received_date,
      status: item.status,
      batch_number: item.batch_number || "",
      lot_number: item.lot_number || "",
      expiry_date: item.expiry_date || "",
      condition: item.condition,
      notes: item.notes || "",
      accepted_quantity: item.accepted_quantity,
      rejected_quantity: item.rejected_quantity,
      location_id: item.location_id,
      business_key: item.business_key,
    });
    setSelectedItem(item);
    setEditModalOpen(true);
  };

  const prepareViewModal = (item: ReceivedItem) => {
    setSelectedItem(item);
    setViewModalOpen(true);
  };

  const handleModalClose = () => {
    if (!isSubmitting) {
      setModalOpen(false);
      resetForm();
    }
  };

  const handleEditModalClose = () => {
    if (!isSubmitting) {
      setEditModalOpen(false);
      setSelectedItem(null);
      resetForm();
    }
  };

  const handleDeleteModalClose = () => {
    if (!isSubmitting) {
      setDeleteModalOpen(false);
      setSelectedItem(null);
    }
  };

  const handleViewModalClose = () => {
    setViewModalOpen(false);
    setSelectedItem(null);
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "accepted":
        return "bg-emerald-50 text-emerald-700 border border-emerald-200";
      case "pending":
        return "bg-amber-50 text-amber-700 border border-amber-200";
      case "rejected":
        return "bg-red-50 text-red-700 border border-red-200";
      case "partially_accepted":
        return "bg-blue-50 text-blue-700 border border-blue-200";
      default:
        return "bg-gray-50 text-gray-700 border border-gray-200";
    }
  };

  const getConditionBadgeColor = (condition: string) => {
    switch (condition) {
      case "good":
        return "bg-emerald-50 text-emerald-700 border border-emerald-200";
      case "damaged":
        return "bg-orange-50 text-orange-700 border border-orange-200";
      case "expired":
        return "bg-red-50 text-red-700 border border-red-200";
      case "wrong_item":
        return "bg-purple-50 text-purple-700 border border-purple-200";
      default:
        return "bg-gray-50 text-gray-700 border border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "accepted":
        return <CheckCircle className="h-3 w-3 mr-1" />;
      case "pending":
        return <Clock className="h-3 w-3 mr-1" />;
      case "rejected":
        return <XCircle className="h-3 w-3 mr-1" />;
      case "partially_accepted":
        return <AlertCircle className="h-3 w-3 mr-1" />;
      default:
        return null;
    }
  };

  const inputClass =
    "w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all duration-200 placeholder-gray-400 text-sm hover:border-gray-400";
  const labelClass = "block text-sm font-semibold text-gray-700 mb-2";
  const selectClass =
    "w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all duration-200 text-sm hover:border-gray-400";

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100/50">
      {/* Header Section */}
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-30 backdrop-blur-sm bg-white/95">
        <div className="max-w-8xl mx-auto px-6 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center space-x-4">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center text-sm text-gray-600 hover:text-emerald-600 transition-colors group"
                >
                  <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                  Back to Dashboard
                </Link>
                <div className="h-6 w-px bg-gray-300"></div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Received Items
                </h1>
              </div>
              <p className="text-gray-600 text-sm">
                Track and manage all received goods and materials
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={fetchReceivedItems}
                className="p-2.5 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                title="Refresh"
              >
                <RefreshCw size={18} />
              </button>
              <button className="p-2.5 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors">
                <Download size={18} />
              </button>
              <button
                onClick={() => setModalOpen(true)}
                className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white px-5 py-2.5 rounded-lg hover:from-emerald-700 hover:to-emerald-800 transition-all duration-200 font-medium shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isSubmitting}
              >
                <Plus size={18} />
                Record Received Item
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards Section */}
      <div className="max-w-8xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">Total Items</p>
                <p className="text-2xl font-bold text-gray-900 mt-1 group-hover:text-emerald-600 transition-colors">
                  {stats.total}
                </p>
              </div>
              <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
                <Package className="h-5 w-5 text-emerald-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-900 mt-1 group-hover:text-amber-600 transition-colors">
                  {stats.pending}
                </p>
              </div>
              <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">Accepted</p>
                <p className="text-2xl font-bold text-gray-900 mt-1 group-hover:text-emerald-600 transition-colors">
                  {stats.accepted}
                </p>
              </div>
              <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-emerald-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">Rejected</p>
                <p className="text-2xl font-bold text-gray-900 mt-1 group-hover:text-red-600 transition-colors">
                  {stats.rejected}
                </p>
              </div>
              <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
                <XCircle className="h-5 w-5 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">Total Qty</p>
                <p className="text-2xl font-bold text-gray-900 mt-1 group-hover:text-blue-600 transition-colors">
                  {stats.totalQuantity.toLocaleString()}
                </p>
              </div>
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                <Scale className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">Total Value</p>
                <p className="text-2xl font-bold text-gray-900 mt-1 group-hover:text-purple-600 transition-colors">
                  ${stats.totalValue.toLocaleString()}
                </p>
              </div>
              <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Card */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {/* Search and Filters */}
          <div className="px-6 py-5 border-b border-gray-200 bg-gray-50/50">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 flex-1">
                  <div className="relative flex-1 max-w-md">
                    <Search
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                      size={18}
                    />
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search by item name, SKU, batch number..."
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition placeholder-gray-400 text-sm hover:border-gray-400"
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition hover:border-gray-400"
                    >
                      <option value="all">All Status</option>
                      <option value="pending">Pending</option>
                      <option value="accepted">Accepted</option>
                      <option value="rejected">Rejected</option>
                      <option value="partially_accepted">
                        Partially Accepted
                      </option>
                    </select>

                    <select
                      value={conditionFilter}
                      onChange={(e) => setConditionFilter(e.target.value)}
                      className="px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition hover:border-gray-400"
                    >
                      <option value="all">All Conditions</option>
                      <option value="good">Good</option>
                      <option value="damaged">Damaged</option>
                      <option value="expired">Expired</option>
                      <option value="wrong_item">Wrong Item</option>
                    </select>

                    <button
                      onClick={() =>
                        setShowAdvancedFilters(!showAdvancedFilters)
                      }
                      className="flex items-center gap-2 px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-700 hover:border-emerald-400 hover:text-emerald-600 transition-colors font-medium text-sm"
                    >
                      <SlidersHorizontal size={16} />
                      {showAdvancedFilters ? "Hide Filters" : "More Filters"}
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span className="bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-full text-sm font-medium border border-emerald-200">
                    {isLoading
                      ? "Loading..."
                      : `${totalItems} item${totalItems !== 1 ? "s" : ""} found`}
                  </span>
                </div>
              </div>

              {/* Advanced Filters */}
              {showAdvancedFilters && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-white rounded-lg border border-gray-200 animate-fadeIn">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-2">
                      Date Range
                    </label>
                    <select
                      value={dateFilter}
                      onChange={(e) => setDateFilter(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                    >
                      <option value="all">All Time</option>
                      <option value="today">Today</option>
                      <option value="week">This Week</option>
                      <option value="month">This Month</option>
                      <option value="quarter">This Quarter</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-2">
                      Vendor
                    </label>
                    <select
                      value={vendorFilter}
                      onChange={(e) => setVendorFilter(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                    >
                      <option value="all">All Vendors</option>
                      {vendors.map((vendor) => (
                        <option key={vendor.id} value={vendor.id}>
                          {vendor.vendor_name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={() => {
                        setStatusFilter("all");
                        setConditionFilter("all");
                        setVendorFilter("all");
                        setDateFilter("all");
                      }}
                      className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                    >
                      Clear All Filters
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="flex justify-center items-center py-16">
              <div className="text-center">
                <Loader2 className="h-10 w-10 text-emerald-600 animate-spin mx-auto mb-4" />
                <p className="text-gray-600 font-medium">
                  Loading received items...
                </p>
                <p className="text-gray-400 text-sm mt-1">
                  Please wait a moment
                </p>
              </div>
            </div>
          )}

          {/* Table */}
          {!isLoading && (
            <>
              <div className="relative">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-gray-600 text-left border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider whitespace-nowrap w-12 text-center">
                          #
                        </th>
                        <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider whitespace-nowrap">
                          Item Details
                        </th>
                        <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider whitespace-nowrap hidden lg:table-cell">
                          Purchase Info
                        </th>
                        <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider whitespace-nowrap hidden md:table-cell">
                          Quantity
                        </th>
                        <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider whitespace-nowrap">
                          Status
                        </th>
                        <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider whitespace-nowrap">
                          Condition
                        </th>
                        <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider whitespace-nowrap">
                          Received
                        </th>
                        <th className="px-6 py-4 text-center font-semibold text-xs uppercase tracking-wider whitespace-nowrap w-12">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {currentItems.length > 0 ? (
                        currentItems.map((item, index) => (
                          <tr
                            key={item.id}
                            className="hover:bg-emerald-50/30 transition-colors group cursor-pointer"
                            onClick={() => prepareViewModal(item)}
                          >
                            <td className="px-6 py-4 text-center">
                              <span className="text-sm font-medium text-gray-500">
                                {startIndex + index + 1}
                              </span>
                            </td>

                            <td className="px-6 py-4 min-w-[200px]">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-emerald-100 to-emerald-50 rounded-xl flex items-center justify-center flex-shrink-0 border border-emerald-200/50">
                                  <Package className="h-5 w-5 text-emerald-600" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="font-semibold text-gray-900 truncate group-hover:text-emerald-600 transition-colors">
                                    <ShortTextWithTooltip
                                      text={item.item_name}
                                      max={25}
                                    />
                                  </div>
                                  <div className="text-xs text-gray-500 truncate mt-0.5 flex items-center gap-1">
                                    <Hash size={12} />
                                    {item.sku || "No SKU"}
                                  </div>
                                </div>
                              </div>
                            </td>

                            <td className="px-6 py-4 min-w-[150px] hidden lg:table-cell">
                              <div className="space-y-1">
                                {item.purchase_order && (
                                  <div className="text-gray-600 text-sm truncate flex items-center gap-1">
                                    <FileSpreadsheet size={12} className="text-emerald-400" />
                                    PO: {item.purchase_order.po_number}
                                  </div>
                                )}
                                {item.vendor && (
                                  <div className="text-gray-600 text-sm truncate flex items-center gap-1">
                                    <Building2 size={12} className="text-emerald-400" />
                                    {item.vendor.vendor_name}
                                  </div>
                                )}
                                {item.unit_price && (
                                  <div className="text-gray-600 text-sm truncate flex items-center gap-1">
                                    <DollarSign size={12} className="text-emerald-400" />
                                    ${item.unit_price.toFixed(2)} / {item.unit_of_measure}
                                  </div>
                                )}
                              </div>
                            </td>

                            <td className="px-6 py-4 min-w-[100px] hidden md:table-cell">
                              <div className="text-gray-900 font-semibold">
                                {item.quantity_received}{" "}
                                <span className="text-gray-500 text-xs font-normal">
                                  {item.unit_of_measure}
                                </span>
                              </div>
                              {item.total_price && (
                                <div className="text-xs text-gray-500 mt-0.5">
                                  Total: ${item.total_price.toFixed(2)}
                                </div>
                              )}
                            </td>

                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold ${getStatusBadgeColor(
                                  item.status
                                )}`}
                              >
                                {getStatusIcon(item.status)}
                                {item.status.replace("_", " ").charAt(0).toUpperCase() +
                                  item.status.replace("_", " ").slice(1)}
                              </span>
                            </td>

                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getConditionBadgeColor(
                                  item.condition
                                )}`}
                              >
                                {item.condition.replace("_", " ").charAt(0).toUpperCase() +
                                  item.condition.replace("_", " ").slice(1)}
                              </span>
                            </td>

                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <div className="flex items-center gap-1">
                                <Calendar size={12} className="text-gray-400" />
                                {new Date(item.received_date).toLocaleDateString()}
                              </div>
                            </td>

                            <td
                              className="px-6 py-4 text-center relative whitespace-nowrap"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                onClick={() =>
                                  setOpenRow(
                                    openRow === item.id ? null : item.id
                                  )
                                }
                                className="p-2 rounded-lg hover:bg-emerald-100 transition text-gray-400 hover:text-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={isSubmitting}
                              >
                                <MoreVertical size={18} />
                              </button>

                              {openRow === item.id && (
                                <>
                                  <div
                                    className="fixed inset-0 z-10"
                                    onClick={() => setOpenRow(null)}
                                  />
                                  <div className="absolute right-6 z-40 w-48 bg-white border border-gray-200 rounded-xl shadow-lg shadow-gray-200/50 animate-fadeIn">
                                    <button
                                      onClick={() => {
                                        prepareViewModal(item);
                                        setOpenRow(null);
                                      }}
                                      className="flex items-center gap-3 w-full px-4 py-3 text-sm text-gray-700 hover:bg-emerald-50 transition first:rounded-t-xl disabled:opacity-50 disabled:cursor-not-allowed border-b border-gray-100"
                                      disabled={isSubmitting}
                                    >
                                      <Eye className="h-4 w-4 text-emerald-600" />
                                      View Details
                                    </button>

                                    {item.status === "pending" && (
                                      <>
                                        <button
                                          onClick={() => {
                                            setSelectedItem(item);
                                            setAcceptModalOpen(true);
                                            setOpenRow(null);
                                          }}
                                          className="flex items-center gap-3 w-full px-4 py-3 text-sm text-emerald-600 hover:bg-emerald-50 transition border-b border-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                          disabled={isSubmitting}
                                        >
                                          <CheckCircle
                                            size={16}
                                            className="text-emerald-600"
                                          />
                                          Accept Item
                                        </button>

                                        <button
                                          onClick={() => {
                                            setSelectedItem(item);
                                            setRejectModalOpen(true);
                                            setOpenRow(null);
                                          }}
                                          className="flex items-center gap-3 w-full px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition border-b border-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                          disabled={isSubmitting}
                                        >
                                          <XCircle
                                            size={16}
                                            className="text-red-600"
                                          />
                                          Reject Item
                                        </button>
                                      </>
                                    )}

                                    <button
                                      onClick={() => {
                                        prepareEditForm(item);
                                        setOpenRow(null);
                                      }}
                                      className="flex items-center gap-3 w-full px-4 py-3 text-sm text-gray-700 hover:bg-emerald-50 transition border-b border-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                      disabled={isSubmitting}
                                    >
                                      <Edit
                                        size={16}
                                        className="text-emerald-600"
                                      />
                                      Edit Item
                                    </button>

                                    <button
                                      onClick={() => {
                                        setSelectedItem(item);
                                        setDeleteModalOpen(true);
                                        setOpenRow(null);
                                      }}
                                      className="flex items-center gap-3 w-full px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition last:rounded-b-xl disabled:opacity-50 disabled:cursor-not-allowed"
                                      disabled={isSubmitting}
                                    >
                                      <Trash2
                                        size={16}
                                        className="text-red-600"
                                      />
                                      Delete Item
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
                              <div className="w-20 h-20 bg-emerald-50 rounded-2xl flex items-center justify-center">
                                <Package size={32} className="text-emerald-400" />
                              </div>
                              <div className="space-y-2">
                                <p className="text-gray-900 font-semibold text-lg">
                                  {debouncedSearch
                                    ? "No items found"
                                    : "No received items recorded"}
                                </p>
                                <p className="text-gray-500 text-sm">
                                  {debouncedSearch
                                    ? "Try adjusting your search terms or filters"
                                    : "Start recording received goods and materials"}
                                </p>
                              </div>
                              {!debouncedSearch && (
                                <button
                                  onClick={() => setModalOpen(true)}
                                  className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white px-5 py-2.5 rounded-lg hover:from-emerald-700 hover:to-emerald-800 transition-all font-medium mt-2 shadow-lg shadow-emerald-500/25"
                                >
                                  <Plus size={16} />
                                  Record Received Item
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

              {/* Pagination */}
              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Show</span>
                    <select
                      value={itemsPerPage}
                      onChange={(e) =>
                        handleItemsPerPageChange(Number(e.target.value))
                      }
                      className="px-2 py-1.5 text-sm border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                    >
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                    <span className="text-sm text-gray-600">per page</span>
                  </div>
                  <span className="text-sm text-gray-600">
                    Showing {startIndex + 1}-{endIndex} of {totalItems}
                  </span>
                </div>

                {totalPages > 1 && (
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
                                  ? "bg-emerald-600 text-white border border-emerald-600 shadow-sm"
                                  : "text-gray-700 hover:bg-emerald-50 border border-gray-300"
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
                )}
              </div>
            </>
          )}
        </div>

        {/* Add Received Item Modal */}
        {modalOpen && (
          <CombinedModal
            title={
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <Package className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Record Received Item
                  </h2>
                  <p className="text-gray-500 text-sm">
                    Log new goods or materials received
                  </p>
                </div>
              </div>
            }
            onClose={handleModalClose}
            size="xl"
          >
            <form onSubmit={handleSave} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-5">
                  <div>
                    <label className={`${labelClass} flex items-center gap-1`}>
                      Item Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.item_name}
                      onChange={(e) =>
                        handleInputChange("item_name", e.target.value)
                      }
                      required
                      className={inputClass}
                      placeholder="Enter item name"
                    />
                  </div>

                  <div>
                    <label className={labelClass}>SKU / Product Code</label>
                    <input
                      type="text"
                      value={form.sku}
                      onChange={(e) => handleInputChange("sku", e.target.value)}
                      className={inputClass}
                      placeholder="Enter SKU or product code"
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Description</label>
                    <textarea
                      value={form.description}
                      onChange={(e) =>
                        handleInputChange("description", e.target.value)
                      }
                      className={`${inputClass} resize-none`}
                      placeholder="Brief description of the item"
                      rows={2}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={`${labelClass} flex items-center gap-1`}>
                        Quantity Received <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        value={form.quantity_received}
                        onChange={(e) =>
                          handleInputChange(
                            "quantity_received",
                            Number(e.target.value)
                          )
                        }
                        required
                        min="1"
                        className={inputClass}
                        placeholder="0"
                      />
                    </div>

                    <div>
                      <label className={labelClass}>Unit of Measure</label>
                      <select
                        value={form.unit_of_measure}
                        onChange={(e) =>
                          handleInputChange("unit_of_measure", e.target.value)
                        }
                        className={selectClass}
                      >
                        <option value="pieces">Pieces</option>
                        <option value="kg">Kilograms (kg)</option>
                        <option value="g">Grams (g)</option>
                        <option value="lbs">Pounds (lbs)</option>
                        <option value="oz">Ounces (oz)</option>
                        <option value="liters">Liters</option>
                        <option value="ml">Milliliters (ml)</option>
                        <option value="gallons">Gallons</option>
                        <option value="boxes">Boxes</option>
                        <option value="cartons">Cartons</option>
                        <option value="pallets">Pallets</option>
                        <option value="meters">Meters</option>
                        <option value="feet">Feet</option>
                        <option value="sets">Sets</option>
                        <option value="pairs">Pairs</option>
                        <option value="rolls">Rolls</option>
                        <option value="sheets">Sheets</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className={labelClass}>Unit Price ($)</label>
                    <input
                      type="number"
                      value={form.unit_price}
                      onChange={(e) =>
                        handleInputChange("unit_price", Number(e.target.value))
                      }
                      step="0.01"
                      min="0"
                      className={inputClass}
                      placeholder="0.00"
                    />
                    {form.unit_price > 0 && form.quantity_received > 0 && (
                      <p className="text-xs text-emerald-600 mt-1 font-medium">
                        Total: ${(form.unit_price * form.quantity_received).toFixed(2)}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-5">
                  <div>
                    <label className={labelClass}>Purchase Order</label>
                    <select
                      value={form.purchase_order_id || ""}
                      onChange={(e) =>
                        handleInputChange(
                          "purchase_order_id",
                          e.target.value ? Number(e.target.value) : null
                        )
                      }
                      className={selectClass}
                    >
                      <option value="">Select Purchase Order</option>
                      {purchaseOrders.map((po) => (
                        <option key={po.id} value={po.id}>
                          {po.po_number}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className={labelClass}>Vendor</label>
                    <select
                      value={form.vendor_id || ""}
                      onChange={(e) =>
                        handleInputChange(
                          "vendor_id",
                          e.target.value ? Number(e.target.value) : null
                        )
                      }
                      className={selectClass}
                    >
                      <option value="">Select Vendor</option>
                      {vendors.map((vendor) => (
                        <option key={vendor.id} value={vendor.id}>
                          {vendor.vendor_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className={labelClass}>Received Date</label>
                    <input
                      type="date"
                      value={form.received_date}
                      onChange={(e) =>
                        handleInputChange("received_date", e.target.value)
                      }
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className={`${labelClass} flex items-center gap-1`}>
                      Location <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={form.location_id}
                      onChange={(e) =>
                        handleInputChange("location_id", Number(e.target.value))
                      }
                      required
                      className={selectClass}
                    >
                      <option value="0">Select Location</option>
                      {locations.map((location) => (
                        <option key={location.id} value={location.id}>
                          {location.location_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className={labelClass}>Condition</label>
                    <select
                      value={form.condition}
                      onChange={(e) =>
                        handleInputChange("condition", e.target.value)
                      }
                      className={selectClass}
                    >
                      <option value="good">Good</option>
                      <option value="damaged">Damaged</option>
                      <option value="expired">Expired</option>
                      <option value="wrong_item">Wrong Item</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>Batch Number</label>
                      <input
                        type="text"
                        value={form.batch_number}
                        onChange={(e) =>
                          handleInputChange("batch_number", e.target.value)
                        }
                        className={inputClass}
                        placeholder="BATCH-001"
                      />
                    </div>

                    <div>
                      <label className={labelClass}>Lot Number</label>
                      <input
                        type="text"
                        value={form.lot_number}
                        onChange={(e) =>
                          handleInputChange("lot_number", e.target.value)
                        }
                        className={inputClass}
                        placeholder="LOT-001"
                      />
                    </div>
                  </div>

                  <div>
                    <label className={labelClass}>Expiry Date</label>
                    <input
                      type="date"
                      value={form.expiry_date}
                      onChange={(e) =>
                        handleInputChange("expiry_date", e.target.value)
                      }
                      className={inputClass}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className={labelClass}>Notes</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => handleInputChange("notes", e.target.value)}
                  className={`${inputClass} resize-none`}
                  placeholder="Additional notes about the received items..."
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleModalClose}
                  className="px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 text-sm font-medium text-white bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-lg hover:from-emerald-700 hover:to-emerald-800 transition-all inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/25"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Recording...
                    </>
                  ) : (
                    <>
                      <Plus size={16} />
                      Record Item
                    </>
                  )}
                </button>
              </div>
            </form>
          </CombinedModal>
        )}

        {/* Edit Modal - Similar to Add but with pre-filled data */}
        {editModalOpen && selectedItem && (
          <CombinedModal
            title={
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-100 to-emerald-50 rounded-xl flex items-center justify-center shadow-sm">
                  <Edit className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Edit Received Item
                  </h2>
                  <p className="text-gray-500 text-sm">
                    Update received item information
                  </p>
                </div>
              </div>
            }
            onClose={handleEditModalClose}
            size="xl"
          >
            <form onSubmit={handleEdit} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-5">
                  <div>
                    <label className={`${labelClass} flex items-center gap-1`}>
                      Item Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.item_name}
                      onChange={(e) =>
                        handleInputChange("item_name", e.target.value)
                      }
                      required
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className={labelClass}>SKU / Product Code</label>
                    <input
                      type="text"
                      value={form.sku}
                      onChange={(e) => handleInputChange("sku", e.target.value)}
                      className={inputClass}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={`${labelClass} flex items-center gap-1`}>
                        Quantity <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        value={form.quantity_received}
                        onChange={(e) =>
                          handleInputChange(
                            "quantity_received",
                            Number(e.target.value)
                          )
                        }
                        required
                        min="1"
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <label className={labelClass}>Unit of Measure</label>
                      <select
                        value={form.unit_of_measure}
                        onChange={(e) =>
                          handleInputChange("unit_of_measure", e.target.value)
                        }
                        className={selectClass}
                      >
                        <option value="pieces">Pieces</option>
                        <option value="kg">Kilograms (kg)</option>
                        <option value="lbs">Pounds (lbs)</option>
                        <option value="liters">Liters</option>
                        <option value="boxes">Boxes</option>
                        <option value="cartons">Cartons</option>
                        <option value="pallets">Pallets</option>
                        <option value="meters">Meters</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className={labelClass}>Unit Price ($)</label>
                    <input
                      type="number"
                      value={form.unit_price}
                      onChange={(e) =>
                        handleInputChange("unit_price", Number(e.target.value))
                      }
                      step="0.01"
                      min="0"
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Status</label>
                    <select
                      value={form.status}
                      onChange={(e) =>
                        handleInputChange("status", e.target.value)
                      }
                      className={selectClass}
                    >
                      <option value="pending">Pending</option>
                      <option value="accepted">Accepted</option>
                      <option value="rejected">Rejected</option>
                      <option value="partially_accepted">
                        Partially Accepted
                      </option>
                    </select>
                  </div>
                </div>

                <div className="space-y-5">
                  <div>
                    <label className={labelClass}>Vendor</label>
                    <select
                      value={form.vendor_id || ""}
                      onChange={(e) =>
                        handleInputChange(
                          "vendor_id",
                          e.target.value ? Number(e.target.value) : null
                        )
                      }
                      className={selectClass}
                    >
                      <option value="">Select Vendor</option>
                      {vendors.map((vendor) => (
                        <option key={vendor.id} value={vendor.id}>
                          {vendor.vendor_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className={labelClass}>Condition</label>
                    <select
                      value={form.condition}
                      onChange={(e) =>
                        handleInputChange("condition", e.target.value)
                      }
                      className={selectClass}
                    >
                      <option value="good">Good</option>
                      <option value="damaged">Damaged</option>
                      <option value="expired">Expired</option>
                      <option value="wrong_item">Wrong Item</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>Batch Number</label>
                      <input
                        type="text"
                        value={form.batch_number}
                        onChange={(e) =>
                          handleInputChange("batch_number", e.target.value)
                        }
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <label className={labelClass}>Lot Number</label>
                      <input
                        type="text"
                        value={form.lot_number}
                        onChange={(e) =>
                          handleInputChange("lot_number", e.target.value)
                        }
                        className={inputClass}
                      />
                    </div>
                  </div>

                  <div>
                    <label className={labelClass}>Expiry Date</label>
                    <input
                      type="date"
                      value={form.expiry_date}
                      onChange={(e) =>
                        handleInputChange("expiry_date", e.target.value)
                      }
                      className={inputClass}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className={labelClass}>Notes</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => handleInputChange("notes", e.target.value)}
                  className={`${inputClass} resize-none`}
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleEditModalClose}
                  className="px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 text-sm font-medium text-white bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-lg hover:from-emerald-700 hover:to-emerald-800 transition-all inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/25"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <CheckCircle size={16} />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          </CombinedModal>
        )}

        {/* Delete Confirmation Modal */}
        {deleteModalOpen && selectedItem && (
          <CombinedModal title={null} onClose={handleDeleteModalClose}>
            <div className="max-w-md mx-auto rounded-2xl p-6 bg-white animate-fadeIn flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 flex items-center justify-center rounded-2xl bg-red-50 border border-red-200">
                <AlertTriangle className="w-7 h-7 text-red-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">
                Delete Received Item
              </h2>
              <p className="text-gray-600 text-sm leading-relaxed">
                Are you sure you want to delete{" "}
                <span className="font-semibold text-gray-900">
                  {selectedItem.item_name}
                </span>
                ? This action cannot be undone.
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

        {/* Accept Confirmation Modal */}
        {acceptModalOpen && selectedItem && (
          <CombinedModal title={null} onClose={() => setAcceptModalOpen(false)}>
            <div className="max-w-md mx-auto rounded-2xl p-6 bg-white animate-fadeIn flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 flex items-center justify-center rounded-2xl bg-emerald-50 border border-emerald-200">
                <CheckCircle className="w-7 h-7 text-emerald-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Accept Item</h2>
              <p className="text-gray-600 text-sm leading-relaxed">
                Are you sure you want to accept{" "}
                <span className="font-semibold text-gray-900">
                  {selectedItem.item_name}
                </span>
                ? This will mark the item as accepted and update inventory.
              </p>
              <div className="mt-6 flex justify-center gap-3 w-full">
                <button
                  type="button"
                  onClick={() => setAcceptModalOpen(false)}
                  className="flex-1 px-6 py-3 rounded-lg border border-gray-300 bg-white text-gray-700 font-medium hover:bg-gray-50 transition disabled:opacity-50"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAcceptItem}
                  className="flex-1 px-6 py-3 rounded-lg bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-medium flex items-center justify-center gap-2 hover:from-emerald-700 hover:to-emerald-800 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/25"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Accepting...
                    </>
                  ) : (
                    <>
                      <CheckCircle size={16} />
                      Accept Item
                    </>
                  )}
                </button>
              </div>
            </div>
          </CombinedModal>
        )}

        {/* Reject Confirmation Modal */}
        {rejectModalOpen && selectedItem && (
          <CombinedModal title={null} onClose={() => setRejectModalOpen(false)}>
            <div className="max-w-md mx-auto rounded-2xl p-6 bg-white animate-fadeIn flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 flex items-center justify-center rounded-2xl bg-red-50 border border-red-200">
                <XCircle className="w-7 h-7 text-red-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Reject Item</h2>
              <p className="text-gray-600 text-sm leading-relaxed">
                Are you sure you want to reject{" "}
                <span className="font-semibold text-gray-900">
                  {selectedItem.item_name}
                </span>
                ? This will mark the item as rejected and it will not be added to inventory.
              </p>
              <div className="mt-6 flex justify-center gap-3 w-full">
                <button
                  type="button"
                  onClick={() => setRejectModalOpen(false)}
                  className="flex-1 px-6 py-3 rounded-lg border border-gray-300 bg-white text-gray-700 font-medium hover:bg-gray-50 transition disabled:opacity-50"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleRejectItem}
                  className="flex-1 px-6 py-3 rounded-lg bg-gradient-to-r from-red-600 to-red-700 text-white font-medium flex items-center justify-center gap-2 hover:from-red-700 hover:to-red-800 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-red-500/25"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Rejecting...
                    </>
                  ) : (
                    <>
                      <XCircle size={16} />
                      Reject Item
                    </>
                  )}
                </button>
              </div>
            </div>
          </CombinedModal>
        )}

        {/* View Details Modal */}
        {viewModalOpen && selectedItem && (
          <CombinedModal
            title={
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center">
                  <Package className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {selectedItem.item_name}
                  </h2>
                  <p className="text-gray-500 text-sm">
                    Received Item Details
                  </p>
                </div>
              </div>
            }
            onClose={handleViewModalClose}
            size="xl"
          >
            <div className="space-y-8">
              {/* Header with Status */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-100">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-semibold text-gray-900">
                      {selectedItem.item_name}
                    </span>
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadgeColor(
                        selectedItem.status
                      )}`}
                    >
                      {getStatusIcon(selectedItem.status)}
                      {selectedItem.status
                        .replace("_", " ")
                        .charAt(0)
                        .toUpperCase() +
                        selectedItem.status.replace("_", " ").slice(1)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Barcode className="h-3 w-3 text-emerald-400" />
                    <span>SKU: {selectedItem.sku || "N/A"}</span>
                  </div>
                </div>
                <div className="text-sm text-gray-500">
                  Item ID:{" "}
                  <span className="font-mono font-medium text-gray-700">
                    #{selectedItem.id}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Item Details Card */}
                <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-5 shadow-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
                      <Package className="h-4 w-4 text-emerald-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Item Information
                    </h3>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { label: "Quantity Received", value: `${selectedItem.quantity_received} ${selectedItem.unit_of_measure}` },
                      { label: "Accepted Qty", value: selectedItem.accepted_quantity || "—" },
                      { label: "Rejected Qty", value: selectedItem.rejected_quantity || "—" },
                      { label: "Unit Price", value: selectedItem.unit_price ? `$${selectedItem.unit_price.toFixed(2)}` : "—" },
                      { label: "Total Price", value: selectedItem.total_price ? `$${selectedItem.total_price.toFixed(2)}` : "—" },
                      { label: "Condition", value: selectedItem.condition.replace("_", " ").charAt(0).toUpperCase() + selectedItem.condition.replace("_", " ").slice(1) },
                      { label: "Batch No.", value: selectedItem.batch_number || "—" },
                      { label: "Lot No.", value: selectedItem.lot_number || "—" },
                    ].map((field, i) => (
                      <div key={i} className="space-y-1">
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {field.label}
                        </label>
                        <p className="text-gray-900 font-medium">{field.value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Purchase & Vendor Card */}
                <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-5 shadow-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                      <ShoppingCart className="h-4 w-4 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Purchase Details
                    </h3>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { label: "Purchase Order", value: selectedItem.purchase_order?.po_number || "—" },
                      { label: "Vendor", value: selectedItem.vendor?.vendor_name || "—" },
                      { label: "Location", value: selectedItem.location?.location_name || "—" },
                      { label: "Received Date", value: new Date(selectedItem.received_date).toLocaleDateString() },
                      { label: "Expiry Date", value: selectedItem.expiry_date ? new Date(selectedItem.expiry_date).toLocaleDateString() : "—" },
                      { label: "Receiver", value: selectedItem.receiver?.name || "—" },
                    ].map((field, i) => (
                      <div key={i} className="space-y-1">
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {field.label}
                        </label>
                        <p className="text-gray-900 font-medium">{field.value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Description & Notes Card */}
                <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-5 shadow-sm lg:col-span-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center">
                      <FileText className="h-4 w-4 text-purple-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Description & Notes
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Description
                      </label>
                      <div className="bg-gray-50 rounded-lg p-4 min-h-[80px]">
                        <p className="text-gray-900 whitespace-pre-wrap">
                          {selectedItem.description || <span className="text-gray-400 italic">No description provided</span>}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Notes
                      </label>
                      <div className="bg-gray-50 rounded-lg p-4 min-h-[80px]">
                        <p className="text-gray-900 whitespace-pre-wrap">
                          {selectedItem.notes || <span className="text-gray-400 italic">No notes provided</span>}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Timestamps Card */}
                <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-5 shadow-sm lg:col-span-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center">
                      <Calendar className="h-4 w-4 text-gray-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Timestamps
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created
                      </label>
                      <div className="flex items-center gap-2 text-gray-900">
                        <Calendar className="h-4 w-4 text-emerald-400" />
                        <span>
                          {new Date(selectedItem.created_at).toLocaleDateString("en-US", {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Last Updated
                      </label>
                      <div className="flex items-center gap-2 text-gray-900">
                        <Calendar className="h-4 w-4 text-emerald-400" />
                        <span>
                          {new Date(selectedItem.updated_at).toLocaleDateString("en-US", {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleViewModalClose}
                  className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleViewModalClose();
                    prepareEditForm(selectedItem);
                  }}
                  className="px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-lg hover:from-emerald-700 hover:to-emerald-800 transition-all duration-200 inline-flex items-center gap-2 shadow-lg shadow-emerald-500/25"
                >
                  <Edit size={16} />
                  Edit Item
                </button>
              </div>
            </div>
          </CombinedModal>
        )}
      </div>
    </div>
  );
};

export default withAuth(ManageReceivedItems);

/**
 * Reusable Modal Component
 */
const CombinedModal = ({
  title,
  children,
  onClose,
  size = "md",
}: CombinedModalProps) => {
  const sizeClasses = {
    sm: "max-w-md",
    md: "max-w-2xl",
    lg: "max-w-4xl",
    xl: "max-w-6xl",
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50 p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className={`bg-white rounded-2xl shadow-2xl w-full ${sizeClasses[size]} max-h-[90vh] overflow-y-auto animate-scaleIn`}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="sticky top-0 z-10 flex items-center justify-between p-6 border-b border-gray-200 bg-white/95 backdrop-blur-sm rounded-t-2xl">
            {title}
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 transition hover:bg-gray-100 rounded-lg"
              aria-label="Close modal"
            >
              <X size={20} />
            </button>
          </div>
        )}
        {!title && (
          <div className="absolute top-4 right-4 z-10">
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 transition hover:bg-gray-100 rounded-lg bg-white"
              aria-label="Close modal"
            >
              <X size={20} />
            </button>
          </div>
        )}
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};