"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Plus,
  Edit,
  Trash2,
  Search,
  MoreHorizontal,
  ArrowLeft,
  Phone,
  Mail,
  User,
  Loader2,
  MapPin,
  CreditCard,
  ShoppingBag,
  Filter,
  RefreshCw,
  Eye,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  X,
  AlertTriangle,
  Users,
  UserCheck,
  CheckCircle,
  Ban,
  SlidersHorizontal,
  LayoutGrid,
  List,
  MoreVertical,
} from "lucide-react";
import Link from "next/link";
import { apiGet, apiDelete } from "@/lib/axios";
import { toast } from "react-hot-toast";
import { withAuth } from "@/hoc/withAuth";
import { motion, AnimatePresence } from "framer-motion";
import ShortTextWithTooltip from "../component/shorten_len";

// Customer Types
interface Customer {
  id: number | string;
  customer_key: string;
  owner_id: number;
  business_key: string;
  location_id: number;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string;
  postal_code: string | null;
  customer_code: string;
  registration_date: string | null;
  total_purchases: number;
  outstanding_balance: number;
  is_active: boolean;
  loyalty_points: number;
  dob: string | null;
  gender: "male" | "female" | "other" | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface User {
  businesses_one?: Array<{
    currency?: string;
  }>;
}

interface DeleteConfirmationModalProps {
  customer: Customer | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isSubmitting: boolean;
  currencySymbol: string;
}

// Custom Hooks
const useDebounce = <T,>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
};

// Utility Functions
const formatCurrency = (amount: number, currencySymbol: string = "$"): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount).replace("$", currencySymbol);
};

// Components
const StatCard: React.FC<{
  title: string;
  value: string | number;
  icon: React.ElementType;
  color: "slate" | "amber" | "rose" | "blue" | "emerald" | "gray";
}> = ({ title, value, icon: Icon, color }) => {
  const gradients = {
    slate: "from-slate-500 to-slate-600",
    amber: "from-amber-500 to-amber-600",
    rose: "from-rose-500 to-rose-600",
    blue: "from-blue-500 to-blue-600",
    emerald: "from-emerald-500 to-emerald-600",
    gray: "from-gray-500 to-gray-600",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 transition-all hover:shadow-md"
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradients[color]} flex items-center justify-center shadow-lg`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
      <p className="text-sm text-gray-500 mb-1">{title}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </motion.div>
  );
};

const StatusBadge: React.FC<{ isActive: boolean }> = ({ isActive }) => {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
      isActive 
        ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-sm'
        : 'bg-gradient-to-r from-gray-500 to-gray-600 text-white shadow-sm'
    }`}>
      {isActive ? <CheckCircle className="h-3 w-3" /> : <Ban className="h-3 w-3" />}
      {isActive ? "Active" : "Inactive"}
    </span>
  );
};

const GenderBadge: React.FC<{ gender: Customer["gender"] }> = ({ gender }) => {
  if (!gender) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-gray-500 to-gray-600 text-white shadow-sm">
        <User className="h-3 w-3" />
        Individual
      </span>
    );
  }

  const config = {
    male: { icon: User, gradient: "from-blue-500 to-blue-600" },
    female: { icon: User, gradient: "from-pink-500 to-pink-600" },
    other: { icon: User, gradient: "from-gray-500 to-gray-600" },
  };

  const { icon: Icon, gradient } = config[gender];

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gradient-to-r ${gradient} text-white shadow-sm`}>
      <Icon className="h-3 w-3" />
      {gender.charAt(0).toUpperCase() + gender.slice(1)}
    </span>
  );
};

const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  customer,
  isOpen,
  onClose,
  onConfirm,
  isSubmitting,
  currencySymbol,
}) => {
  if (!isOpen || !customer) return null;

  const getFullName = (customer: Customer) => {
    return `${customer.first_name} ${customer.last_name}`.trim();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-rose-100 rounded-2xl flex items-center justify-center mb-4">
                  <AlertTriangle className="w-8 h-8 text-rose-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Delete Customer</h2>
                <p className="text-gray-600 mb-6">
                  Are you sure you want to delete{" "}
                  <span className="font-semibold text-gray-900">{getFullName(customer)}</span>? 
                  This action cannot be undone.
                </p>

                <div className="w-full bg-gray-50 rounded-xl p-4 mb-6">
                  <div className="grid grid-cols-2 gap-3 text-left">
                    <div>
                      <p className="text-xs text-gray-500">Customer Code</p>
                      <p className="text-sm font-medium text-gray-900">{customer.customer_code}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Total Purchases</p>
                      <p className="text-sm font-medium text-gray-900">
                        {formatCurrency(customer.total_purchases, currencySymbol)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 w-full">
                  <button
                    onClick={onClose}
                    className="flex-1 px-4 py-3 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={onConfirm}
                    className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 text-white font-medium hover:from-rose-600 hover:to-rose-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const FilterDrawer: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  filters: { type: string; status: string };
  onFilterChange: (key: string, value: string) => void;
  onClearFilters: () => void;
  activeFilterCount: number;
  totalItems: number;
}> = ({ isOpen, onClose, filters, onFilterChange, onClearFilters, activeFilterCount, totalItems }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30 }}
            className="fixed right-0 top-0 h-full w-full sm:w-96 bg-white shadow-2xl z-50"
          >
            <div className="flex flex-col h-full">
              <div className="px-6 py-5 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center">
                      <SlidersHorizontal className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">Filters</h3>
                      {activeFilterCount > 0 && (
                        <p className="text-xs text-gray-500">{activeFilterCount} active</p>
                      )}
                    </div>
                  </div>
                  <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 block">
                    Customer Type
                  </label>
                  <div className="space-y-2">
                    {["all", "individual", "business"].map((type) => (
                      <button
                        key={type}
                        onClick={() => onFilterChange("type", type)}
                        className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${
                          filters.type === type
                            ? 'bg-gray-900 text-white'
                            : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <span className="font-medium capitalize">{type}</span>
                        {filters.type === type && <CheckCircle className="h-4 w-4" />}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 block">
                    Status
                  </label>
                  <div className="space-y-2">
                    {["all", "active", "inactive"].map((status) => (
                      <button
                        key={status}
                        onClick={() => onFilterChange("status", status)}
                        className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${
                          filters.status === status
                            ? 'bg-gray-900 text-white'
                            : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <span className="font-medium capitalize">{status}</span>
                        {filters.status === status && <CheckCircle className="h-4 w-4" />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-gray-100 bg-gray-50/50">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm text-gray-600">
                    <span className="font-semibold text-gray-900">{totalItems}</span> customers found
                  </p>
                  {activeFilterCount > 0 && (
                    <button
                      onClick={onClearFilters}
                      className="text-sm text-gray-600 hover:text-gray-900 font-medium inline-flex items-center gap-1"
                    >
                      <X className="h-4 w-4" />
                      Clear all
                    </button>
                  )}
                </div>
                <button
                  onClick={onClose}
                  className="w-full px-4 py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors font-medium"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

const CustomerCard: React.FC<{
  customer: Customer;
  onView: (customer: Customer) => void;
  onEdit: (customer: Customer) => void;
  onDelete: (customer: Customer) => void;
  currencySymbol: string;
}> = ({ customer, onView, onEdit, onDelete, currencySymbol }) => {
  const [showActions, setShowActions] = useState(false);
  const fullName = `${customer.first_name} ${customer.last_name}`.trim();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ y: -4 }}
      className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-all"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
            <User className="h-6 w-6 text-gray-600" />
          </div>
          <div>
            <p className="font-bold text-gray-900">{fullName}</p>
            <p className="text-xs text-gray-500 mt-0.5">{customer.customer_code}</p>
          </div>
        </div>

        <div className="relative">
          <button
            onClick={() => setShowActions(!showActions)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <MoreHorizontal className="h-4 w-4 text-gray-400" />
          </button>

          <AnimatePresence>
            {showActions && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setShowActions(false)} />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="absolute right-0 top-10 z-40 w-48 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden"
                >
                  <button
                    onClick={() => { onView(customer); setShowActions(false); }}
                    className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition"
                  >
                    <Eye className="h-4 w-4" />
                    View Profile
                  </button>
                  <button
                    onClick={() => { onEdit(customer); setShowActions(false); }}
                    className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition"
                  >
                    <Edit className="h-4 w-4" />
                    Edit Customer
                  </button>
                  <hr className="border-gray-100" />
                  <button
                    onClick={() => { onDelete(customer); setShowActions(false); }}
                    className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50 transition"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="space-y-2 mb-4">
        {customer.email && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Mail className="h-4 w-4 text-gray-400" />
            <span className="truncate">{customer.email}</span>
          </div>
        )}
        {customer.phone && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Phone className="h-4 w-4 text-gray-400" />
            <span>{customer.phone}</span>
          </div>
        )}
        {customer.city && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <MapPin className="h-4 w-4 text-gray-400" />
            <span>{customer.city}, {customer.state}</span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <div className="flex items-center gap-2">
          <GenderBadge gender={customer.gender} />
          <StatusBadge isActive={customer.is_active} />
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500">Total Purchases</p>
          <p className="font-bold text-gray-900">
            {formatCurrency(customer.total_purchases, currencySymbol)}
          </p>
        </div>
      </div>
    </motion.div>
  );
};

const CustomerTableRow: React.FC<{
  customer: Customer;
  index: number;
  onView: (customer: Customer) => void;
  onEdit: (customer: Customer) => void;
  onDelete: (customer: Customer) => void;
  currencySymbol: string;
}> = ({ customer, index, onView, onEdit, onDelete, currencySymbol }) => {
  const [showActions, setShowActions] = useState(false);
  const fullName = `${customer.first_name} ${customer.last_name}`.trim();

  return (
    <motion.tr
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03 }}
      className="hover:bg-gray-50/50 transition-colors group"
    >
      <td className="px-6 py-4">
        <span className="text-sm text-gray-500">{index + 1}</span>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
            <User className="h-5 w-5 text-gray-600" />
          </div>
          <div>
            <p className="font-semibold text-gray-900">
              <ShortTextWithTooltip text={fullName} max={25} />
            </p>
            <p className="text-xs text-gray-500 mt-0.5">{customer.customer_code}</p>
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="space-y-1">
          {customer.email && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Mail className="h-3.5 w-3.5 text-gray-400" />
              <ShortTextWithTooltip text={customer.email} max={30} />
            </div>
          )}
          {customer.phone && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Phone className="h-3.5 w-3.5 text-gray-400" />
              <span>{customer.phone}</span>
            </div>
          )}
        </div>
      </td>
      <td className="px-6 py-4">
        {customer.city && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <MapPin className="h-3.5 w-3.5 text-gray-400" />
            <span>{customer.city}, {customer.state}</span>
          </div>
        )}
      </td>
      <td className="px-6 py-4">
        <GenderBadge gender={customer.gender} />
      </td>
      <td className="px-6 py-4 text-right">
        <div>
          <p className="font-semibold text-gray-900">
            {formatCurrency(customer.total_purchases, currencySymbol)}
          </p>
          {customer.outstanding_balance > 0 && (
            <p className="text-xs text-amber-600">
              Balance: {formatCurrency(customer.outstanding_balance, currencySymbol)}
            </p>
          )}
        </div>
      </td>
      <td className="px-6 py-4">
        <StatusBadge isActive={customer.is_active} />
      </td>
      <td className="px-6 py-4 text-right">
        <div className="relative">
          <button
            onClick={() => setShowActions(!showActions)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
          >
            <MoreVertical className="h-4 w-4 text-gray-400" />
          </button>

          <AnimatePresence>
            {showActions && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setShowActions(false)} />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="absolute right-0 top-10 z-40 w-48 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden"
                >
                  <button
                    onClick={() => { onView(customer); setShowActions(false); }}
                    className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition"
                  >
                    <Eye className="h-4 w-4" />
                    View Profile
                  </button>
                  <button
                    onClick={() => { onEdit(customer); setShowActions(false); }}
                    className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition"
                  >
                    <Edit className="h-4 w-4" />
                    Edit Customer
                  </button>
                  <Link href={`/customers/${customer.customer_key}/orders`}>
                    <button
                      onClick={() => setShowActions(false)}
                      className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition"
                    >
                      <ShoppingBag className="h-4 w-4" />
                      View Orders
                    </button>
                  </Link>
                  <hr className="border-gray-100" />
                  <button
                    onClick={() => { onDelete(customer); setShowActions(false); }}
                    className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50 transition"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </td>
    </motion.tr>
  );
};

const Pagination: React.FC<{
  currentPage: number;
  totalPages: number;
  totalItems: number;
  startIndex: number;
  endIndex: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (items: number) => void;
}> = ({
  currentPage,
  totalPages,
  totalItems,
  startIndex,
  endIndex,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
}) => {
  const pages: (number | string)[] = [];
  
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    let start = Math.max(2, currentPage - 2);
    let end = Math.min(totalPages - 1, currentPage + 2);
    
    if (currentPage <= 4) {
      start = 2;
      end = 5;
    }
    if (currentPage >= totalPages - 3) {
      start = totalPages - 4;
      end = totalPages - 1;
    }
    
    if (start > 2) pages.push("...");
    for (let i = start; i <= end; i++) pages.push(i);
    if (end < totalPages - 1) pages.push("...");
    if (totalPages > 1) pages.push(totalPages);
  }

  if (totalPages <= 1) return null;

  return (
    <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Show</span>
          <select
            value={itemsPerPage}
            onChange={(e) => {
              onItemsPerPageChange(Number(e.target.value));
              onPageChange(1);
            }}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-gray-500/20 focus:border-gray-500 outline-none"
          >
            {[5, 10, 25, 50, 100].map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
        </div>
        <span className="text-sm text-gray-500">
          {startIndex + 1}–{endIndex} of {totalItems}
        </span>
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronsLeft className="h-4 w-4" />
        </button>
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {pages.map((page, i) => (
          <React.Fragment key={i}>
            {page === "..." ? (
              <span className="px-2 text-gray-400">...</span>
            ) : (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onPageChange(page as number)}
                className={`min-w-[2.25rem] h-9 flex items-center justify-center rounded-lg text-sm font-medium transition-all ${
                  currentPage === page
                    ? "bg-gray-900 text-white shadow-md"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                {page}
              </motion.button>
            )}
          </React.Fragment>
        ))}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronsRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

// Main Component
const ManageCustomers = ({ user }: { user: User }) => {
  const currencySymbol = user?.businesses_one?.[0]?.currency || "$";
  const formatCurr = (amount: number) => formatCurrency(amount, currencySymbol);

  // State
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [forceRefresh, setForceRefresh] = useState(false);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({ type: "all", status: "all" });
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; customer: Customer | null }>({
    isOpen: false,
    customer: null,
  });
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const debouncedSearch = useDebounce(search, 300);

  // Fetch customers
  const fetchCustomers = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await apiGet("/customers", {}, !forceRefresh);
      const customersArray = res.data?.data?.customers ?? res.data?.data ?? res.data?.customers ?? [];
      setCustomers(Array.isArray(customersArray) ? customersArray : []);
      if (forceRefresh) setForceRefresh(false);
    } catch {
      toast.error("Failed to fetch customers");
      setCustomers([]);
    } finally {
      setIsLoading(false);
    }
  }, [forceRefresh]);

  useEffect(() => {
    if (!user) return;
    fetchCustomers();
  }, [user, fetchCustomers]);

  // Reset pagination when filters or search change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, filters]);

  // Handle delete
  const handleDelete = async (customerKey: string) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      setCustomers((prev) => prev.filter((c) => c.customer_key !== customerKey));
      await apiDelete(`/customers/${customerKey}`, {}, ["/customers"]);
      toast.success("Customer deleted successfully!");
      setDeleteModal({ isOpen: false, customer: null });
    } catch {
      setForceRefresh(true);
      toast.error("Failed to delete customer");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter customers
  const filteredCustomers = useMemo(() => {
    return customers.filter((customer) => {
      if (!customer) return false;

      const searchableText = [
        customer.first_name, customer.last_name, customer.email,
        customer.phone, customer.customer_code, customer.city, customer.state,
      ].filter(Boolean).join(" ").toLowerCase();

      const matchesSearch = searchableText.includes(debouncedSearch.toLowerCase());
      const matchesType = filters.type === "all" || 
        (filters.type === "individual" ? customer.gender !== null : customer.gender === null);
      const matchesStatus = filters.status === "all" || 
        (filters.status === "active" ? customer.is_active : !customer.is_active);

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [customers, debouncedSearch, filters]);

  // Statistics
  const statistics = useMemo(() => {
    const activeCustomers = customers.filter((c) => c.is_active).length;
    const totalPurchases = customers.reduce((sum, c) => sum + (Number(c.total_purchases) || 0), 0);
    const outstandingBalance = customers.reduce((sum, c) => sum + (Number(c.outstanding_balance) || 0), 0);
    
    return {
      total: customers.length,
      active: activeCustomers,
      totalPurchases,
      outstandingBalance,
    };
  }, [customers]);

  // Pagination
  const totalItems = filteredCustomers.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const currentItems = filteredCustomers.slice(startIndex, endIndex);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.type !== "all") count++;
    if (filters.status !== "all") count++;
    return count;
  }, [filters]);

  const clearFilters = () => {
    setFilters({ type: "all", status: "all" });
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Header - now scrolls with page */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => window.history.back()}
                className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all"
              >
                <ArrowLeft className="h-5 w-5" />
              </motion.button>
              
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
                <p className="text-sm text-gray-500">Manage your customer accounts</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="hidden md:flex items-center gap-1 bg-gray-100 rounded-xl p-1">
                <button
                  onClick={() => setViewMode("table")}
                  className={`p-2 rounded-lg transition-all ${
                    viewMode === "table" ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <List className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 rounded-lg transition-all ${
                    viewMode === "grid" ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <LayoutGrid className="h-4 w-4" />
                </button>
              </div>

              <button
                onClick={() => setForceRefresh(true)}
                className="p-2.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all"
                title="Refresh"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
              </button>

              <Link href="/addcustomers">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 bg-gradient-to-r from-gray-900 to-gray-800 text-white text-sm font-medium rounded-xl hover:from-gray-800 hover:to-gray-700 transition-all shadow-lg shadow-gray-900/20"
                >
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">Add Customer</span>
                  <span className="sm:hidden">Add</span>
                </motion.button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            title="Total Customers"
            value={statistics.total}
            icon={Users}
            color="slate"
          />
          <StatCard
            title="Active Customers"
            value={statistics.active}
            icon={UserCheck}
            color="emerald"
          />
          <StatCard
            title="Total Purchases"
            value={formatCurr(statistics.totalPurchases)}
            icon={ShoppingBag}
            color="blue"
          />
          <StatCard
            title="Outstanding Balance"
            value={formatCurr(statistics.outstandingBalance)}
            icon={CreditCard}
            color="amber"
          />
        </div>

        {/* Search and Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, phone, or customer code..."
              className="w-full pl-11 pr-11 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-500/20 focus:border-gray-500 outline-none transition placeholder-gray-400 text-sm shadow-sm"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setFilterDrawerOpen(true)}
              className="relative inline-flex items-center gap-2 px-5 py-3 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all shadow-sm text-sm font-medium text-gray-700"
            >
              <Filter className="h-4 w-4" />
              <span>Filters</span>
              {activeFilterCount > 0 && (
                <span className="absolute -top-2 -right-2 w-5 h-5 bg-gray-900 text-white text-xs rounded-full flex items-center justify-center font-medium">
                  {activeFilterCount}
                </span>
              )}
            </button>

            <div className="flex md:hidden">
              <button
                onClick={() => setViewMode(viewMode === "table" ? "grid" : "table")}
                className="p-3 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all shadow-sm"
              >
                {viewMode === "table" ? <LayoutGrid className="h-4 w-4" /> : <List className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Quick Filters */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
          <button
            onClick={() => handleFilterChange("status", "all")}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              filters.status === "all"
                ? "bg-gray-900 text-white shadow-md"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            All Customers
          </button>
          <button
            onClick={() => handleFilterChange("status", "active")}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
              filters.status === "active"
                ? "bg-emerald-500 text-white shadow-md"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            <CheckCircle className="h-3.5 w-3.5" />
            Active
          </button>
          <button
            onClick={() => handleFilterChange("status", "inactive")}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
              filters.status === "inactive"
                ? "bg-gray-500 text-white shadow-md"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            <Ban className="h-3.5 w-3.5" />
            Inactive
          </button>
          {activeFilterCount > 0 && (
            <button
              onClick={clearFilters}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium bg-rose-100 text-rose-700 hover:bg-rose-200 transition-all"
            >
              <X className="h-3.5 w-3.5" />
              Clear Filters
            </button>
          )}
        </div>

        {/* Results Count */}
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Showing <span className="font-semibold text-gray-900">{startIndex + 1}–{endIndex}</span> of{" "}
            <span className="font-semibold text-gray-900">{totalItems}</span> customers
          </p>
        </div>

        {/* Content Area */}
        {isLoading ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12">
            <div className="flex flex-col items-center justify-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="w-16 h-16 mb-4"
              >
                <div className="w-full h-full rounded-full border-4 border-gray-200 border-t-gray-900" />
              </motion.div>
              <p className="text-gray-600 font-medium">Loading customers...</p>
            </div>
          </div>
        ) : currentItems.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12"
          >
            <div className="flex flex-col items-center text-center max-w-md mx-auto">
              <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl flex items-center justify-center mb-6">
                <Users className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {search || activeFilterCount > 0 ? "No customers found" : "No customers yet"}
              </h3>
              <p className="text-gray-500 mb-8">
                {search || activeFilterCount > 0
                  ? "Try adjusting your search or filters"
                  : "Get started by adding your first customer"}
              </p>
              {!(search || activeFilterCount > 0) && (
                <Link href="/addcustomers">
                  <button className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-gray-900 to-gray-800 text-white rounded-xl hover:from-gray-800 hover:to-gray-700 transition-all shadow-lg shadow-gray-900/20 font-medium">
                    <Plus className="h-4 w-4" />
                    Add Customer
                  </button>
                </Link>
              )}
            </div>
          </motion.div>
        ) : viewMode === "grid" ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              <AnimatePresence>
                {currentItems.map((customer) => (
                  <CustomerCard
                    key={customer.customer_key}
                    customer={customer}
                    onView={(c) => window.location.href = `/viewcustomer/${c.customer_key}`}
                    onEdit={(c) => window.location.href = `/editcustomers/${c.customer_key}`}
                    onDelete={(c) => setDeleteModal({ isOpen: true, customer: c })}
                    currencySymbol={currencySymbol}
                  />
                ))}
              </AnimatePresence>
            </div>
            <div className="mt-8 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalItems}
                startIndex={startIndex}
                endIndex={endIndex}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
                onItemsPerPageChange={setItemsPerPage}
              />
            </div>
          </>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px]">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">#</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Contact</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Location</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Purchases</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {currentItems.map((customer, index) => (
                    <CustomerTableRow
                      key={customer.customer_key}
                      customer={customer}
                      index={startIndex + index}
                      onView={(c) => window.location.href = `/viewcustomer/${c.customer_key}`}
                      onEdit={(c) => window.location.href = `/editcustomers/${c.customer_key}`}
                      onDelete={(c) => setDeleteModal({ isOpen: true, customer: c })}
                      currencySymbol={currencySymbol}
                    />
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              startIndex={startIndex}
              endIndex={endIndex}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={setItemsPerPage}
            />
          </div>
        )}
      </main>

      {/* Filter Drawer */}
      <FilterDrawer
        isOpen={filterDrawerOpen}
        onClose={() => setFilterDrawerOpen(false)}
        filters={filters}
        onFilterChange={handleFilterChange}
        onClearFilters={clearFilters}
        activeFilterCount={activeFilterCount}
        totalItems={totalItems}
      />

      {/* Delete Modal */}
      <DeleteConfirmationModal
        customer={deleteModal.customer}
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, customer: null })}
        onConfirm={() => deleteModal.customer && handleDelete(deleteModal.customer.customer_key)}
        isSubmitting={isSubmitting}
        currencySymbol={currencySymbol}
      />
    </div>
  );
};

export default withAuth(ManageCustomers);