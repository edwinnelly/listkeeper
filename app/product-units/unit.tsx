"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Search,
  ArrowLeft,
  Loader2,
  Filter,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Ruler,
  Package,
  Scale,
  Droplets,
  Hash,
  Box,
  Gauge,
  CheckCircle,
  XCircle,
  Eye,
  CircleOff,
} from "lucide-react";
import Link from "next/link";
import { toast } from "react-hot-toast";

// TypeScript interfaces for product units
interface ProductUnit {
  id: number;
  owner_id: number;
  business_key: string;
  name: string;
  symbol: string;
  description: string | null;
  unit_type: 'base' | 'derived' | 'conversion';
  conversion_factor: number | null;
  base_unit_id: number | null;
  is_active: boolean;
  is_system_unit: boolean;
  decimal_places: number;
  created_at: string;
  updated_at: string;
  owner?: {
    id: number;
    name: string;
    email: string;
  };
  business?: {
    business_key: string;
    business_name: string;
  };
  base_unit?: {
    id: number;
    name: string;
    symbol: string;
  };
}

const ManageProductUnits = () => {
  // Search and Filter States
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [unitTypeFilter, setUnitTypeFilter] = useState<string>("all");

  // UI Interaction States
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState<ProductUnit | null>(null);

  // Loading States
  const [isLoading, setIsLoading] = useState(false);

  // Data States - Hardcoded product units with 2026 dates
  const [units, setUnits] = useState<ProductUnit[]>([
    {
      id: 1,
      owner_id: 1,
      business_key: "default",
      name: "Kilogram",
      symbol: "kg",
      description: "Base unit for weight measurements",
      unit_type: "base",
      conversion_factor: null,
      base_unit_id: null,
      is_active: true,
      is_system_unit: true,
      decimal_places: 3,
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
      business: {
        business_key: "default",
        business_name: "Default Business"
      }
    },
    {
      id: 2,
      owner_id: 1,
      business_key: "default",
      name: "Gram",
      symbol: "g",
      description: "Derived weight unit, 1000 grams = 1 kg",
      unit_type: "derived",
      conversion_factor: 0.001,
      base_unit_id: 1,
      is_active: true,
      is_system_unit: true,
      decimal_places: 2,
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
      business: {
        business_key: "default",
        business_name: "Default Business"
      },
      base_unit: {
        id: 1,
        name: "Kilogram",
        symbol: "kg"
      }
    },
    {
      id: 3,
      owner_id: 1,
      business_key: "default",
      name: "Liter",
      symbol: "L",
      description: "Base unit for volume measurements",
      unit_type: "base",
      conversion_factor: null,
      base_unit_id: null,
      is_active: true,
      is_system_unit: true,
      decimal_places: 2,
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
      business: {
        business_key: "default",
        business_name: "Default Business"
      }
    },
    {
      id: 4,
      owner_id: 1,
      business_key: "default",
      name: "Milliliter",
      symbol: "mL",
      description: "Derived volume unit, 1000 mL = 1 L",
      unit_type: "derived",
      conversion_factor: 0.001,
      base_unit_id: 3,
      is_active: true,
      is_system_unit: true,
      decimal_places: 0,
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
      business: {
        business_key: "default",
        business_name: "Default Business"
      },
      base_unit: {
        id: 3,
        name: "Liter",
        symbol: "L"
      }
    },
    {
      id: 5,
      owner_id: 1,
      business_key: "default",
      name: "Piece",
      symbol: "pc",
      description: "Base unit for counting items",
      unit_type: "base",
      conversion_factor: null,
      base_unit_id: null,
      is_active: true,
      is_system_unit: false,
      decimal_places: 0,
      created_at: "2026-01-15T10:30:00Z",
      updated_at: "2026-01-15T10:30:00Z",
      business: {
        business_key: "default",
        business_name: "Default Business"
      }
    },
    {
      id: 6,
      owner_id: 1,
      business_key: "default",
      name: "Dozen",
      symbol: "dz",
      description: "12 pieces = 1 dozen",
      unit_type: "conversion",
      conversion_factor: 12,
      base_unit_id: 5,
      is_active: true,
      is_system_unit: false,
      decimal_places: 0,
      created_at: "2026-01-16T14:20:00Z",
      updated_at: "2026-01-16T14:20:00Z",
      business: {
        business_key: "default",
        business_name: "Default Business"
      },
      base_unit: {
        id: 5,
        name: "Piece",
        symbol: "pc"
      }
    },
    {
      id: 7,
      owner_id: 1,
      business_key: "default",
      name: "Meter",
      symbol: "m",
      description: "Base unit for length measurements",
      unit_type: "base",
      conversion_factor: null,
      base_unit_id: null,
      is_active: true,
      is_system_unit: true,
      decimal_places: 2,
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
      business: {
        business_key: "default",
        business_name: "Default Business"
      }
    },
    {
      id: 8,
      owner_id: 1,
      business_key: "default",
      name: "Centimeter",
      symbol: "cm",
      description: "Derived length unit, 100 cm = 1 m",
      unit_type: "derived",
      conversion_factor: 0.01,
      base_unit_id: 7,
      is_active: true,
      is_system_unit: true,
      decimal_places: 1,
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
      business: {
        business_key: "default",
        business_name: "Default Business"
      },
      base_unit: {
        id: 7,
        name: "Meter",
        symbol: "m"
      }
    },
    {
      id: 9,
      owner_id: 1,
      business_key: "warehouse",
      name: "Box",
      symbol: "box",
      description: "Packaging unit for boxed items",
      unit_type: "base",
      conversion_factor: null,
      base_unit_id: null,
      is_active: true,
      is_system_unit: false,
      decimal_places: 0,
      created_at: "2026-02-01T09:15:00Z",
      updated_at: "2026-02-01T09:15:00Z",
      business: {
        business_key: "warehouse",
        business_name: "Warehouse Business"
      }
    },
    {
      id: 10,
      owner_id: 1,
      business_key: "default",
      name: "Inactive Unit",
      symbol: "iu",
      description: "This unit is no longer in use",
      unit_type: "base",
      conversion_factor: null,
      base_unit_id: null,
      is_active: false,
      is_system_unit: false,
      decimal_places: 2,
      created_at: "2026-01-10T11:45:00Z",
      updated_at: "2026-02-20T16:30:00Z",
      business: {
        business_key: "default",
        business_name: "Default Business"
      }
    }
  ]);

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Effect for debouncing search input
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
  }, [statusFilter, unitTypeFilter]);

  /**
   * Filters units based on search query and active filters
   */
  const filteredUnits = useMemo(() => {
    return units.filter((unit) => {
      const searchableText = [
        unit.name || "",
        unit.symbol || "",
        unit.description || "",
        unit.business?.business_name || "",
        unit.base_unit?.name || "",
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch = searchableText.includes(
        debouncedSearch.toLowerCase()
      );

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && unit.is_active) ||
        (statusFilter === "inactive" && !unit.is_active);

      const matchesUnitType =
        unitTypeFilter === "all" || unit.unit_type === unitTypeFilter;

      return matchesSearch && matchesStatus && matchesUnitType;
    });
  }, [units, debouncedSearch, statusFilter, unitTypeFilter]);

  // Pagination calculations
  const totalItems = filteredUnits.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);

  const currentItems = useMemo(() => {
    return filteredUnits.slice(startIndex, endIndex);
  }, [filteredUnits, startIndex, endIndex]);

  /**
   * Generates an array of page numbers for pagination
   */
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

  /**
   * Handles page navigation
   */
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      const tableContainer = document.querySelector(".overflow-x-auto");
      if (tableContainer) {
        tableContainer.scrollTop = 0;
      }
    }
  };

  /**
   * Handles items per page change
   */
  const handleItemsPerPageChange = (value: number) => {
    setItemsPerPage(value);
    setCurrentPage(1);
  };

  /**
   * Gets unit icon based on unit type or name
   */
  const getUnitIcon = (unit: ProductUnit) => {
    const unitName = unit.name.toLowerCase();
    const unitSymbol = unit.symbol.toLowerCase();
    
    if (unitName.includes('kg') || unitName.includes('kilogram') || unitSymbol.includes('kg')) {
      return <Scale className="h-5 w-5 text-blue-600" />;
    } else if (unitName.includes('gram') || unitSymbol.includes('g')) {
      return <Scale className="h-5 w-5 text-green-600" />;
    } else if (unitName.includes('liter') || unitName.includes('litre') || unitSymbol.includes('l')) {
      return <Droplets className="h-5 w-5 text-blue-600" />;
    } else if (unitName.includes('meter') || unitName.includes('metre') || unitSymbol.includes('m')) {
      return <Ruler className="h-5 w-5 text-purple-600" />;
    } else if (unitName.includes('piece') || unitName.includes('pcs') || unitSymbol.includes('pc')) {
      return <Hash className="h-5 w-5 text-orange-600" />;
    } else if (unitName.includes('box') || unitName.includes('carton')) {
      return <Box className="h-5 w-5 text-amber-800" />;
    } else if (unitName.includes('dozen') || unitSymbol.includes('dz')) {
      return <Package className="h-5 w-5 text-yellow-600" />;
    } else {
      return <Package className="h-5 w-5 text-gray-600" />;
    }
  };

  /**
   * Gets unit type badge color
   */
  const getUnitTypeBadgeColor = (unitType: string) => {
    switch (unitType) {
      case 'base':
        return "bg-blue-50 text-blue-700 border border-blue-200";
      case 'derived':
        return "bg-green-50 text-green-700 border border-green-200";
      case 'conversion':
        return "bg-purple-50 text-purple-700 border border-purple-200";
      default:
        return "bg-gray-50 text-gray-700 border border-gray-200";
    }
  };

  /**
   * Gets unit type display name
   */
  const getUnitTypeDisplay = (unitType: string) => {
    switch (unitType) {
      case 'base':
        return "Base Unit";
      case 'derived':
        return "Derived Unit";
      case 'conversion':
        return "Conversion Unit";
      default:
        return unitType;
    }
  };

  /**
   * Returns CSS classes for status badges
   */
  const getStatusBadgeColor = (isActive: boolean) => {
    return isActive
      ? "bg-green-50 text-green-700 border border-green-200"
      : "bg-gray-50 text-gray-700 border border-gray-200";
  };

  /**
   * Format date for display
   */
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  /**
   * Handle view unit details
   */
  const handleViewUnit = (unit: ProductUnit) => {
    setSelectedUnit(unit);
    setViewModalOpen(true);
  };

  /**
   * Close view modal
   */
  const handleViewModalClose = () => {
    setViewModalOpen(false);
    setSelectedUnit(null);
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
                  Measurement Units
                </h1>
              </div>
              <p className="text-gray-600 text-sm">
                View measurement units for your products
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  // Simulate refresh by resetting search/filters
                  setSearch("");
                  setStatusFilter("all");
                  setUnitTypeFilter("all");
                  toast.success("Units refreshed");
                }}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                title="Refresh"
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
          {/* Total Units Card */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Units
                </p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {units.length}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                <Ruler className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          {/* Base Units Card */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Base Units
                </p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {units.filter((u) => u.unit_type === 'base').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
                <Package className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          {/* Derived Units Card */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Derived Units
                </p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {units.filter((u) => u.unit_type === 'derived').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center">
                <Gauge className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>

          {/* Active Units Card */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Active Units
                </p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {units.filter((u) => u.is_active).length}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
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
                    placeholder="Search units by name, symbol, description..."
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
                    value={unitTypeFilter}
                    onChange={(e) => setUnitTypeFilter(e.target.value)}
                    className="px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition hover:border-gray-400"
                  >
                    <option value="all">All Types</option>
                    <option value="base">Base Units</option>
                    <option value="derived">Derived Units</option>
                    <option value="conversion">Conversion Units</option>
                  </select>
                </div>
              </div>

              {/* Results Summary */}
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full text-sm font-medium border border-blue-200">
                  {`Showing ${startIndex + 1}-${endIndex} of ${totalItems} unit${
                    totalItems !== 1 ? "s" : ""
                  }`}
                </span>
              </div>
            </div>
          </div>

          {/* Units Table Section */}
          <div className="relative">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-600 text-left border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider whitespace-nowrap w-12 text-center">
                      S.No
                    </th>
                    <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider whitespace-nowrap text-gray-500">
                      Unit Details
                    </th>
                    <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider whitespace-nowrap text-gray-500">
                      Type
                    </th>
                    <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider whitespace-nowrap text-gray-500 hidden md:table-cell">
                      Conversion
                    </th>
                    <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider whitespace-nowrap text-gray-500">
                      Status
                    </th>
                    <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider whitespace-nowrap text-gray-500">
                      Created
                    </th>
                    <th className="px-6 py-4 text-center font-semibold text-xs uppercase tracking-wider whitespace-nowrap text-gray-500 w-12">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {currentItems.length > 0 ? (
                    currentItems.map((unit, index) => (
                      <tr
                        key={unit.id}
                        className="hover:bg-gray-50/50 transition-colors group"
                      >
                        {/* Serial Number */}
                        <td className="px-6 py-4 text-center">
                          <span className="text-sm font-medium text-gray-500">
                            {startIndex + index + 1}
                          </span>
                        </td>
                        
                        {/* Unit Details */}
                        <td className="px-6 py-4 min-w-[200px]">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-50 rounded-xl flex items-center justify-center flex-shrink-0 border border-blue-200/50">
                              {getUnitIcon(unit)}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <div className="font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                                  {unit.name}
                                </div>
                                <span className="text-xs font-mono bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                                  {unit.symbol}
                                </span>
                                {unit.is_system_unit && (
                                  <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">
                                    System
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-gray-500 truncate mt-0.5">
                                {unit.description || "No description"}
                              </div>
                              {unit.unit_type === 'derived' && unit.base_unit && (
                                <div className="text-xs text-gray-400 mt-1">
                                  Based on: {unit.base_unit.name} ({unit.base_unit.symbol})
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        
                        {/* Unit Type */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold ${getUnitTypeBadgeColor(
                              unit.unit_type
                            )}`}
                          >
                            {getUnitTypeDisplay(unit.unit_type)}
                          </span>
                        </td>
                        
                        {/* Conversion Details (hidden on mobile) */}
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden md:table-cell">
                          {unit.unit_type === 'derived' && unit.conversion_factor ? (
                            <div className="text-center">
                              <span className="font-mono bg-gray-50 px-2 py-1 rounded">
                                1 {unit.symbol} = {unit.conversion_factor} {unit.base_unit?.symbol}
                              </span>
                            </div>
                          ) : unit.unit_type === 'conversion' && unit.conversion_factor ? (
                            <div className="text-center">
                              <span className="font-mono bg-gray-50 px-2 py-1 rounded">
                                1 {unit.symbol} = {unit.conversion_factor} {unit.base_unit?.symbol}
                              </span>
                            </div>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        
                        {/* Status Badge */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold ${getStatusBadgeColor(
                              unit.is_active
                            )}`}
                          >
                            {unit.is_active ? (
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
                        
                        {/* Created Date */}
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(unit.created_at)}
                        </td>
                        
                        {/* View Action Button */}
                        <td className="px-6 py-4 text-center relative whitespace-nowrap">
                          <button
                            onClick={() => handleViewUnit(unit)}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors group/action"
                            title="View Details"
                          >
                            <Eye
                              size={18}
                              className="group-hover/action:scale-110 transition-transform"
                            />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    // Empty State
                    <tr>
                      <td colSpan={7} className="text-center py-16">
                        <div className="flex flex-col items-center gap-4 max-w-sm mx-auto">
                          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center">
                            <Ruler size={24} className="text-gray-400" />
                          </div>
                          <div className="space-y-2">
                            <p className="text-gray-900 font-semibold text-lg">
                              {debouncedSearch
                                ? "No units found"
                                : "No units available"}
                            </p>
                            <p className="text-gray-500 text-sm">
                              {debouncedSearch
                                ? "Try adjusting your search terms or filters"
                                : "There are no product units to display"}
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
                {/* First Page Button */}
                <button
                  onClick={() => handlePageChange(1)}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="First page"
                >
                  <ChevronsLeft size={16} />
                </button>

                {/* Previous Page Button */}
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Previous page"
                >
                  <ChevronLeft size={16} />
                </button>

                {/* Page Number Buttons */}
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

                {/* Next Page Button */}
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Next page"
                >
                  <ChevronRight size={16} />
                </button>

                {/* Last Page Button */}
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
        </div>

        {/* View Unit Details Modal */}
        {viewModalOpen && selectedUnit && (
          <div
            className="fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-50 p-4"
            onClick={handleViewModalClose}
          >
            <div
              className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                    {getUnitIcon(selectedUnit)}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      {selectedUnit.name} ({selectedUnit.symbol})
                    </h2>
                    <p className="text-gray-500 text-sm">
                      Unit Details
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleViewModalClose}
                  className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 transition hover:bg-gray-100 rounded-lg"
                  aria-label="Close modal"
                >
                  <CircleOff size={20} />
                </button>
              </div>
              <div className="p-6">
                <div className="space-y-6">
                  {/* Unit Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 mb-2">Unit Information</h3>
                      <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                        <div>
                          <p className="text-xs text-gray-500">Name</p>
                          <p className="font-medium">{selectedUnit.name}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Symbol</p>
                          <p className="font-mono font-medium">{selectedUnit.symbol}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Description</p>
                          <p className="text-gray-700">{selectedUnit.description || "No description provided"}</p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 mb-2">Unit Configuration</h3>
                      <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                        <div>
                          <p className="text-xs text-gray-500">Unit Type</p>
                          <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-semibold ${getUnitTypeBadgeColor(selectedUnit.unit_type)}`}>
                            {getUnitTypeDisplay(selectedUnit.unit_type)}
                          </span>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Decimal Places</p>
                          <p className="font-medium">{selectedUnit.decimal_places}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Status</p>
                          <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-semibold ${getStatusBadgeColor(selectedUnit.is_active)}`}>
                            {selectedUnit.is_active ? "Active" : "Inactive"}
                          </span>
                        </div>
                        {selectedUnit.is_system_unit && (
                          <div>
                            <p className="text-xs text-gray-500">System Unit</p>
                            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-semibold bg-yellow-100 text-yellow-800">
                              System Unit
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Conversion Details */}
                  {selectedUnit.unit_type !== 'base' && selectedUnit.base_unit && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 mb-2">Conversion Details</h3>
                      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <div className="flex items-center justify-center space-x-3">
                          <div className="text-center">
                            <p className="text-2xl font-bold text-blue-700">1</p>
                            <p className="text-sm text-gray-600">{selectedUnit.symbol}</p>
                          </div>
                          <div className="text-gray-400">=</div>
                          <div className="text-center">
                            <p className="text-2xl font-bold text-blue-700">{selectedUnit.conversion_factor}</p>
                            <p className="text-sm text-gray-600">{selectedUnit.base_unit.symbol}</p>
                          </div>
                        </div>
                        <p className="text-center text-sm text-gray-600 mt-2">
                          1 {selectedUnit.name} = {selectedUnit.conversion_factor} {selectedUnit.base_unit.name}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Metadata */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">Metadata</h3>
                    <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-gray-500">Created</p>
                          <p className="text-sm">{formatDate(selectedUnit.created_at)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Last Updated</p>
                          <p className="text-sm">{formatDate(selectedUnit.updated_at)}</p>
                        </div>
                      </div>
                      {selectedUnit.business && (
                        <div>
                          <p className="text-xs text-gray-500">Business</p>
                          <p className="text-sm">{selectedUnit.business.business_name}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Close Button */}
                  <div className="flex justify-end pt-6 border-t border-gray-200">
                    <button
                      onClick={handleViewModalClose}
                      className="px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Close
                    </button>
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

export default ManageProductUnits;