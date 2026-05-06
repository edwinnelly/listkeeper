"use client";

import { countries } from "@/app/component/country-list";
import { withAuth } from "@/hoc/withAuth";
import { apiGet, apiPut, apiPost } from "@/lib/axios";
import React, { useState, useEffect, useMemo } from "react";
import {
  Plus, Edit, Trash2, Search, MoreVertical, X, AlertTriangle,
  ArrowLeft, Loader2, RefreshCw, User, Building, Mail, Phone,
  MapPin, Globe, FileText, CheckCircle, XCircle, ChevronLeft,
  ChevronRight, ChevronsLeft, ChevronsRight, Building2, Briefcase,
  CreditCard, Calendar, Users, Eye,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";
import { toast } from "react-hot-toast";
import ShortTextWithTooltip from "../component/shorten_len";

// ─── Types ────────────────────────────────────────────────────────────────────

interface User {
  id: number;
  name: string;
  email: string;
  role?: string;
}

interface Vendor {
  id: number;
  created_at: string;
  updated_at: string;
  owner_id: number;
  business_key: string;
  location_id: number;
  vendor_name: string;
  contact_person: string | null;
  email: string;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string;
  postal_code: string | null;
  industry: string | null;
  tax_id: string | null;
  registration_number: string | null;
  website: string | null;
  bank_name: string | null;
  bank_account_number: string | null;
  bank_account_name: string | null;
  is_active: boolean;
  notes: string | null;
  owner?: { id: number; name: string; email: string };
  business?: { business_key: string; business_name: string };
  location?: { id: number; location_name: string };
}

interface VendorFormData {
  vendor_name: string;
  contact_person: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postal_code: string;
  industry: string;
  tax_id: string;
  registration_number: string;
  website: string;
  bank_name: string;
  bank_account_number: string;
  bank_account_name: string;
  is_active: boolean;
  notes: string;
  location_id: number;
  business_key: string;
}

interface Business { business_key: string; business_name: string }
interface BusinessLocation { id: number; location_name: string; business_key: string }

interface ApiError {
  response?: { status?: number; data?: { message?: string; errors?: Record<string, string[]> } };
  userMessage?: string;
}

const EMPTY_FORM: VendorFormData = {
  vendor_name: "", contact_person: "", email: "", phone: "",
  address: "", city: "", state: "", country: "Netherlands",
  postal_code: "", industry: "", tax_id: "", registration_number: "",
  website: "", bank_name: "", bank_account_number: "", bank_account_name: "",
  is_active: true, notes: "", location_id: 0, business_key: "",
};

const INDUSTRIES = [
  "Agriculture & Farming","Automotive","Banking & Finance","Beauty & Cosmetics",
  "Construction","Consulting Services","Education","Electronics","Energy & Utilities",
  "Engineering","Fashion & Apparel","Food & Beverage","Furniture","Healthcare",
  "Hospitality","Information Technology","Insurance","Legal Services",
  "Logistics & Transportation","Manufacturing","Marketing & Advertising",
  "Media & Entertainment","Office Supplies","Pharmaceuticals","Real Estate",
  "Retail","Security Services","Telecommunications","Travel & Tourism",
  "Waste Management","Wholesale & Distribution","Other",
];

// ─── Styles ───────────────────────────────────────────────────────────────────

const cls = {
  input: "w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 hover:border-slate-300",
  select: "w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 hover:border-slate-300 cursor-pointer",
  label: "block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5",
  sectionTitle: "text-sm font-semibold text-slate-700",
};

// ─── Stat Card ────────────────────────────────────────────────────────────────

const StatCard = ({ label, value, icon: Icon, color }: {
  label: string; value: number; icon: React.ElementType; color: string;
}) => (
  <div className="bg-white rounded-xl border border-slate-200 p-5 flex items-center gap-4">
    <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color}`}>
      <Icon size={20} className="text-white" />
    </div>
    <div>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      <p className="text-xs text-slate-500 font-medium mt-0.5">{label}</p>
    </div>
  </div>
);

// ─── Field ────────────────────────────────────────────────────────────────────

const Field = ({ label, required, children }: {
  label: string; required?: boolean; children: React.ReactNode;
}) => (
  <div>
    <label className={cls.label}>
      {label} {required && <span className="text-red-400 normal-case">*</span>}
    </label>
    {children}
  </div>
);

// ─── Section Header ───────────────────────────────────────────────────────────

const SectionHeader = ({ icon: Icon, title, subtitle }: {
  icon: React.ElementType; title: string; subtitle?: string;
}) => (
  <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
    <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center">
      <Icon size={15} className="text-indigo-600" />
    </div>
    <div>
      <p className={cls.sectionTitle}>{title}</p>
      {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
    </div>
  </div>
);

// ─── Toggle ───────────────────────────────────────────────────────────────────

const Toggle = ({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) => (
  <button
    type="button"
    onClick={() => onChange(!checked)}
    className={`relative w-11 h-6 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 ${checked ? "bg-indigo-500" : "bg-slate-200"}`}
  >
    <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${checked ? "translate-x-5" : "translate-x-0"}`} />
  </button>
);

// ─── Industry Select ──────────────────────────────────────────────────────────

const IndustrySelect = ({ value, onChange, className }: {
  value: string; onChange: (v: string) => void; className?: string;
}) => (
  <select value={value} onChange={e => onChange(e.target.value)} className={className || cls.select}>
    <option value="">Select Industry</option>
    {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
  </select>
);

// ─── Modal ────────────────────────────────────────────────────────────────────

const Modal = ({ title, onClose, size = "lg", children }: {
  title: React.ReactNode; onClose: () => void;
  size?: "sm" | "lg"; children: React.ReactNode;
}) => (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
    onClick={onClose}
  >
    <div
      className={`bg-white rounded-2xl shadow-2xl w-full ${size === "sm" ? "max-w-md" : "max-w-4xl"} max-h-[92vh] flex flex-col`}
      onClick={e => e.stopPropagation()}
    >
      <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 flex-shrink-0">
        <div>{title}</div>
        <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition">
          <X size={18} />
        </button>
      </div>
      <div className="overflow-y-auto flex-1 px-6 py-6">{children}</div>
    </div>
  </div>
);

// ─── Vendor Form ──────────────────────────────────────────────────────────────

const VendorForm = ({
  form, locations, onChange, onSubmit, onCancel, isSubmitting, mode,
}: {
  form: VendorFormData;
  locations: BusinessLocation[];
  onChange: (f: keyof VendorFormData, v: string | number | boolean) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  isSubmitting: boolean;
  mode: "add" | "edit";
}) => (
  <form onSubmit={onSubmit} className="space-y-8">
    {/* Basic Info */}
    <div className="space-y-4">
      <SectionHeader icon={Building2} title="Vendor Details" subtitle="Name, contact, and industry" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Vendor Name" required>
          <input type="text" value={form.vendor_name} onChange={e => onChange("vendor_name", e.target.value)} className={cls.input} placeholder="e.g. Acme Supplies Ltd." required />
        </Field>
        <Field label="Email" required>
          <input type="email" value={form.email} onChange={e => onChange("email", e.target.value)} className={cls.input} placeholder="vendor@example.com" required />
        </Field>
        <Field label="Contact Person">
          <input type="text" value={form.contact_person} onChange={e => onChange("contact_person", e.target.value)} className={cls.input} placeholder="Full name" />
        </Field>
        <Field label="Phone">
          <input type="tel" value={form.phone} onChange={e => onChange("phone", e.target.value)} className={cls.input} placeholder="+234 800 000 0000" />
        </Field>
        <Field label="Industry">
          <IndustrySelect value={form.industry} onChange={v => onChange("industry", v)} />
        </Field>
        <Field label="Website">
          <input type="url" value={form.website} onChange={e => onChange("website", e.target.value)} className={cls.input} placeholder="https://example.com" />
        </Field>
        <Field label="Location" required>
          <select value={form.location_id} onChange={e => onChange("location_id", Number(e.target.value))} className={cls.select} required>
            <option value={0}>Select location</option>
            {locations.map(l => <option key={l.id} value={l.id}>{l.location_name}</option>)}
          </select>
        </Field>
        <div className="flex items-center justify-between bg-slate-50 rounded-lg px-4 py-3 border border-slate-200">
          <div>
            <p className="text-sm font-semibold text-slate-700">Active</p>
            <p className="text-xs text-slate-400 mt-0.5">{form.is_active ? "Vendor is active" : "Vendor is inactive"}</p>
          </div>
          <Toggle checked={form.is_active} onChange={v => onChange("is_active", v)} />
        </div>
      </div>
    </div>

    {/* Address */}
    <div className="space-y-4">
      <SectionHeader icon={MapPin} title="Address" subtitle="Physical location details" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <Field label="Street Address">
            <input type="text" value={form.address} onChange={e => onChange("address", e.target.value)} className={cls.input} placeholder="123 Main Street" />
          </Field>
        </div>
        <Field label="City">
          <input type="text" value={form.city} onChange={e => onChange("city", e.target.value)} className={cls.input} placeholder="City" />
        </Field>
        <Field label="State">
          <input type="text" value={form.state} onChange={e => onChange("state", e.target.value)} className={cls.input} placeholder="State" />
        </Field>
        <Field label="Postal Code">
          <input type="text" value={form.postal_code} onChange={e => onChange("postal_code", e.target.value)} className={cls.input} placeholder="100001" />
        </Field>
        <Field label="Country">
          <select value={form.country} onChange={e => onChange("country", e.target.value)} className={cls.select}>
            <option value="">Select country</option>
            {countries.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </Field>
      </div>
    </div>

    {/* Legal & Banking */}
    <div className="space-y-4">
      <SectionHeader icon={CreditCard} title="Legal & Banking" subtitle="Tax, registration, and bank details" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Tax ID / TIN">
          <input type="text" value={form.tax_id} onChange={e => onChange("tax_id", e.target.value)} className={cls.input} placeholder="Tax identification number" />
        </Field>
        <Field label="Registration Number">
          <input type="text" value={form.registration_number} onChange={e => onChange("registration_number", e.target.value)} className={cls.input} placeholder="Reg. number" />
        </Field>
        <Field label="Bank Name">
          <input type="text" value={form.bank_name} onChange={e => onChange("bank_name", e.target.value)} className={cls.input} placeholder="e.g. First Bank" />
        </Field>
        <Field label="Account Number">
          <input type="text" value={form.bank_account_number} onChange={e => onChange("bank_account_number", e.target.value)} className={cls.input} placeholder="1234567890" />
        </Field>
        <div className="md:col-span-2">
          <Field label="Account Name">
            <input type="text" value={form.bank_account_name} onChange={e => onChange("bank_account_name", e.target.value)} className={cls.input} placeholder="Account holder name" />
          </Field>
        </div>
      </div>
    </div>

    {/* Notes */}
    <div className="space-y-4">
      <SectionHeader icon={FileText} title="Notes" />
      <textarea
        value={form.notes}
        onChange={e => onChange("notes", e.target.value)}
        className={`${cls.input} resize-none`}
        rows={3}
        placeholder="Additional notes or remarks..."
      />
    </div>

    {/* Actions */}
    <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
      <button type="button" onClick={onCancel} disabled={isSubmitting}
        className="px-5 py-2.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition disabled:opacity-50">
        Cancel
      </button>
      <button type="submit" disabled={isSubmitting}
        className="px-5 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition inline-flex items-center gap-2 disabled:opacity-50 shadow-sm">
        {isSubmitting
          ? <><Loader2 size={15} className="animate-spin" />{mode === "add" ? "Creating..." : "Saving..."}</>
          : <>{mode === "add" ? <><Plus size={15} />Add Vendor</> : <><CheckCircle size={15} />Save Changes</>}</>}
      </button>
    </div>
  </form>
);

// ─── Detail Row ───────────────────────────────────────────────────────────────

const DetailRow = ({ label, value, mono }: { label: string; value?: string | null; mono?: boolean }) => (
  <div>
    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">{label}</p>
    <p className={`text-sm text-slate-800 ${mono ? "font-mono" : ""}`}>
      {value || <span className="text-slate-300 italic">—</span>}
    </p>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

const ManageVendors = ({ user }: { user: User }) => {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [industryFilter, setIndustryFilter] = useState("all");
  const [openRow, setOpenRow] = useState<number | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [locations, setLocations] = useState<BusinessLocation[]>([]);
  const [industries, setIndustries] = useState<string[]>([]);
  const [form, setForm] = useState<VendorFormData>(EMPTY_FORM);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const router = useRouter();

  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search); setCurrentPage(1); }, 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => { setCurrentPage(1); }, [statusFilter, industryFilter]);

  useEffect(() => {
    if (!user) return;
    fetchVendors(); fetchBusinesses(); fetchLocations();
  }, [user]);

  const fetchVendors = async () => {
    setIsLoading(true);
    try {
      const res = await apiGet("/vendors") as { data: unknown };
      const data = res.data as Record<string, unknown>;
      const arr: Vendor[] =
        (data?.data as Record<string, unknown>)?.vendors as Vendor[] ??
        data?.data as Vendor[] ?? data?.vendors as Vendor[] ?? [];
      const safe = Array.isArray(arr) ? arr : [];
      setVendors(safe);
      setIndustries(Array.from(new Set(safe.filter(v => v.industry).map(v => v.industry!))) as string[]);
    } catch (err) {
      const e = err as ApiError;
      toast.error(e.response?.status === 403 ? "Permission denied" : "Failed to fetch vendors");
      setVendors([]); setIndustries([]);
    } finally { setIsLoading(false); }
  };

  const fetchBusinesses = async () => {
    try {
      const res = await apiGet("/businesses") as { data: unknown };
      const data = res.data as Record<string, unknown>;
      const arr: Business[] = (data?.data as Record<string, unknown>)?.businesses as Business[] ?? data?.data as Business[] ?? [];
      setBusinesses(Array.isArray(arr) ? arr : []);
    } catch { toast.error("Failed to fetch businesses"); setBusinesses([]); }
  };

  const fetchLocations = async () => {
    try {
      const res = await apiGet("/locations") as { data: unknown };
      const data = res.data as Record<string, unknown>;
      const arr: BusinessLocation[] = (data?.data as Record<string, unknown>)?.locations as BusinessLocation[] ?? data?.data as BusinessLocation[] ?? [];
      setLocations(Array.isArray(arr) ? arr : []);
    } catch { toast.error("Failed to fetch locations"); setLocations([]); }
  };

  const handleInputChange = (field: keyof VendorFormData, value: string | number | boolean) =>
    setForm(p => ({ ...p, [field]: value }));

  const resetForm = () => setForm(EMPTY_FORM);

  const validateForm = (f: VendorFormData): string[] => {
    const errors: string[] = [];
    if (!f.vendor_name.trim()) errors.push("Vendor name is required");
    if (!f.email.trim()) errors.push("Email is required");
    if (!f.location_id) errors.push("Location is required");
    if (f.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) errors.push("Invalid email address");
    if (f.phone && f.phone.length < 10) errors.push("Phone must be at least 10 digits");
    if (f.vendor_name.length < 2) errors.push("Vendor name too short");
    if (f.vendor_name.length > 100) errors.push("Vendor name too long");
    return errors;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    const errors = validateForm(form);
    if (errors.length) { errors.forEach(toast.error); return; }
    setIsSubmitting(true);
    const tempId = -Math.abs(Date.now());
    const optimistic: Vendor = {
      id: tempId, created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
      owner_id: 0, business_key: form.business_key, location_id: form.location_id,
      vendor_name: form.vendor_name, contact_person: form.contact_person, email: form.email,
      phone: form.phone, address: form.address, city: form.city, state: form.state,
      country: form.country, postal_code: form.postal_code, industry: form.industry,
      tax_id: form.tax_id, registration_number: form.registration_number, website: form.website,
      bank_name: form.bank_name, bank_account_number: form.bank_account_number,
      bank_account_name: form.bank_account_name, is_active: form.is_active, notes: form.notes,
      owner: { id: 0, name: "", email: "" },
      business: businesses.find(b => b.business_key === form.business_key) || { business_key: form.business_key, business_name: "Unknown" },
      location: locations.find(l => l.id === form.location_id) || { id: form.location_id, location_name: "Unknown", business_key: "" } as BusinessLocation,
    };
    setVendors(p => [optimistic, ...p]);
    try {
      const res = await apiPost("/add_vendors", { ...form, location_id: Number(form.location_id) }, {}, ["/add_vendors"]) as { data?: { data?: Vendor } };
      if (res.data?.data) setVendors(p => p.map(v => v.id === tempId ? res.data!.data! : v));
      else fetchVendors();
      toast.success("Vendor created"); setModalOpen(false); resetForm();
    } catch (err) {
      setVendors(p => p.filter(v => v.id !== tempId));
      const e = err as ApiError;
      toast.error(e.userMessage || e.response?.data?.message || "Failed to create vendor");
    } finally { setIsSubmitting(false); }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || !selectedVendor) return;
    const errors = validateForm(form);
    if (errors.length) { errors.forEach(toast.error); return; }
    setIsSubmitting(true);
    setVendors(p => p.map(v => v.id === selectedVendor.id ? {
      ...v, ...form, updated_at: new Date().toISOString(),
      business: businesses.find(b => b.business_key === form.business_key) || v.business,
      location: locations.find(l => l.id === form.location_id) || v.location,
    } : v));
    try {
      await apiPut(`/updatevendors/${selectedVendor.id}`, { ...form, location_id: Number(form.location_id), _method: "PUT" }, { _method: "PUT" }, ["/updatevendors"]);
      toast.success("Vendor updated"); setEditModalOpen(false); resetForm();
    } catch (err) {
      const e = err as ApiError;
      toast.error(e.userMessage || e.response?.data?.message || "Failed to update vendor");
      fetchVendors();
    } finally { setIsSubmitting(false); }
  };

  const handleDelete = async () => {
    if (isSubmitting || !selectedVendor) return;
    setIsSubmitting(true);
    setVendors(p => p.filter(v => v.id !== selectedVendor.id));
    try {
      await api.delete(`/vendors-dels/${selectedVendor.id}`);
      toast.success("Vendor deleted"); setDeleteModalOpen(false); setSelectedVendor(null);
    } catch { toast.error("Failed to delete vendor"); fetchVendors(); }
    finally { setIsSubmitting(false); }
  };

  const prepareEdit = (v: Vendor) => {
    setForm({
      vendor_name: v.vendor_name, contact_person: v.contact_person || "",
      email: v.email, phone: v.phone || "", address: v.address || "",
      city: v.city || "", state: v.state || "", country: v.country || "Netherlands",
      postal_code: v.postal_code || "", industry: v.industry || "",
      tax_id: v.tax_id || "", registration_number: v.registration_number || "",
      website: v.website || "", bank_name: v.bank_name || "",
      bank_account_number: v.bank_account_number || "", bank_account_name: v.bank_account_name || "",
      is_active: v.is_active, notes: v.notes || "", location_id: v.location_id, business_key: v.business_key,
    });
    setSelectedVendor(v); setEditModalOpen(true);
  };

  const closeModal = (setter: (v: boolean) => void) => () => { if (!isSubmitting) { setter(false); resetForm(); setSelectedVendor(null); } };

  // Filtered & paginated
  const filteredVendors = useMemo(() => vendors.filter(v => {
    if (!v) return false;
    const text = [v.vendor_name, v.contact_person, v.email, v.phone, v.address, v.city, v.state, v.industry, v.tax_id, v.business?.business_name, v.location?.location_name].join(" ").toLowerCase();
    return text.includes(debouncedSearch.toLowerCase())
      && (statusFilter === "all" || (statusFilter === "active" ? v.is_active : !v.is_active))
      && (industryFilter === "all" || v.industry === industryFilter);
  }), [vendors, debouncedSearch, statusFilter, industryFilter]);

  const totalPages = Math.ceil(filteredVendors.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = useMemo(() => filteredVendors.slice(startIndex, startIndex + itemsPerPage), [filteredVendors, startIndex, itemsPerPage]);

  const pageNumbers = useMemo((): (number | "...")[] => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages: (number | "...")[] = [1];
    if (currentPage > 3) pages.push("...");
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) pages.push(i);
    if (currentPage < totalPages - 2) pages.push("...");
    pages.push(totalPages);
    return pages;
  }, [totalPages, currentPage]);

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-slate-50">

      {/* Page Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-screen-xl mx-auto px-6 py-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 transition mb-2 group">
                <ArrowLeft size={13} className="group-hover:-translate-x-0.5 transition-transform" /> Back to Dashboard
              </Link>
              <h1 className="text-xl font-bold text-slate-900">Vendor Management</h1>
              <p className="text-sm text-slate-400 mt-0.5">Manage suppliers and vendor records</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={fetchVendors} title="Refresh" className="w-9 h-9 flex items-center justify-center border border-slate-200 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition">
                <RefreshCw size={15} />
              </button>
              <button onClick={() => setModalOpen(true)} disabled={isSubmitting}
                className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition shadow-sm disabled:opacity-50">
                <Plus size={16} /> Add Vendor
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-screen-xl mx-auto px-6 py-6 space-y-6">

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Vendors" value={vendors.length} icon={Users} color="bg-indigo-500" />
          <StatCard label="Active" value={vendors.filter(v => v.is_active).length} icon={CheckCircle} color="bg-emerald-500" />
          <StatCard label="Industries" value={industries.length} icon={Briefcase} color="bg-amber-500" />
          <StatCard label="Nigerian Vendors" value={vendors.filter(v => v.country === "Nigeria").length} icon={Globe} color="bg-rose-500" />
        </div>

        {/* Table Card */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">

          {/* Toolbar */}
          <div className="px-5 py-4 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center gap-3">
            <div className="relative flex-1 max-w-xs">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search vendors..."
                className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 focus:bg-white transition placeholder-slate-400"
              />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                className="text-sm px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-indigo-400 transition text-slate-700 cursor-pointer">
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              <select value={industryFilter} onChange={e => setIndustryFilter(e.target.value)}
                className="text-sm px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-indigo-400 transition text-slate-700 cursor-pointer">
                <option value="all">All Industries</option>
                {industries.map(i => <option key={i} value={i}>{i}</option>)}
              </select>
            </div>
            <p className="text-xs text-slate-400 lg:ml-auto">
              {isLoading ? "Loading..." : `${filteredVendors.length} result${filteredVendors.length !== 1 ? "s" : ""}`}
            </p>
          </div>

          {/* Loading */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
              <Loader2 size={28} className="animate-spin text-indigo-400" />
              <p className="text-sm">Loading vendors…</p>
            </div>
          )}

          {/* Table */}
          {!isLoading && (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/60">
                      <th className="px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide text-center w-12">#</th>
                      <th className="px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide text-left">Vendor</th>
                      <th className="px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide text-left hidden lg:table-cell">Contact</th>
                      <th className="px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide text-left hidden md:table-cell">Location</th>
                      <th className="px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide text-left">Status</th>
                      <th className="px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide text-left">Created</th>
                      <th className="px-5 py-3 w-12"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {currentItems.length > 0 ? currentItems.map((vendor, idx) => (
                      <tr key={vendor.id} className="hover:bg-slate-50/60 transition-colors group">
                        <td className="px-5 py-4 text-center">
                          <span className="text-xs text-slate-400 font-medium">{startIndex + idx + 1}</span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
                              <Building2 size={16} className="text-indigo-500" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-slate-800 truncate group-hover:text-indigo-600 transition-colors">
                                <ShortTextWithTooltip text={vendor.vendor_name} max={28} />
                              </p>
                              {vendor.industry && (
                                <p className="text-xs text-slate-400 truncate flex items-center gap-1 mt-0.5">
                                  <Briefcase size={10} />{vendor.industry}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 hidden lg:table-cell">
                          <div className="space-y-1">
                            <p className="text-slate-600 flex items-center gap-1.5 truncate"><Mail size={11} className="text-slate-400 flex-shrink-0" />{vendor.email}</p>
                            {vendor.phone && <p className="text-slate-500 flex items-center gap-1.5 text-xs"><Phone size={11} className="text-slate-400 flex-shrink-0" />{vendor.phone}</p>}
                          </div>
                        </td>
                        <td className="px-5 py-4 hidden md:table-cell">
                          {vendor.city || vendor.state ? (
                            <p className="text-slate-600 flex items-center gap-1.5 text-xs">
                              <MapPin size={11} className="text-slate-400 flex-shrink-0" />
                              <ShortTextWithTooltip text={[vendor.city, vendor.state].filter(Boolean).join(", ")} max={28} />
                            </p>
                          ) : <span className="text-slate-300 text-xs italic">—</span>}
                        </td>
                        <td className="px-5 py-4">
                          {vendor.is_active ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-500 border border-slate-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />Inactive
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-4 text-xs text-slate-400 whitespace-nowrap">
                          {new Date(vendor.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-5 py-4 relative">
                          <button
                            onClick={() => setOpenRow(openRow === vendor.id ? null : vendor.id)}
                            disabled={isSubmitting}
                            className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition disabled:opacity-50">
                            <MoreVertical size={16} />
                          </button>
                          {openRow === vendor.id && (
                            <>
                              <div className="fixed inset-0 z-10" onClick={() => setOpenRow(null)} />
                              <div className="absolute right-5 top-full mt-1 z-20 w-44 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
                                {[
                                  { icon: Eye, label: "View Details", action: () => { setSelectedVendor(vendor); setViewModalOpen(true); setOpenRow(null); }, danger: false },
                                  { icon: Edit, label: "Edit Vendor", action: () => { prepareEdit(vendor); setOpenRow(null); }, danger: false },
                                  { icon: Trash2, label: "Delete", action: () => { setSelectedVendor(vendor); setDeleteModalOpen(true); setOpenRow(null); }, danger: true },
                                ].map(({ icon: Icon, label, action, danger }) => (
                                  <button key={label} onClick={action} disabled={isSubmitting}
                                    className={`flex items-center gap-2.5 w-full px-4 py-2.5 text-sm transition disabled:opacity-50 border-b last:border-0 border-slate-50 ${danger ? "text-red-500 hover:bg-red-50" : "text-slate-700 hover:bg-slate-50"}`}>
                                    <Icon size={14} />{label}
                                  </button>
                                ))}
                              </div>
                            </>
                          )}
                        </td>
                      </tr>
                    )) : (
                      <tr><td colSpan={7} className="py-20 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center">
                            <Users size={22} className="text-slate-400" />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-700">{debouncedSearch ? "No matches found" : "No vendors yet"}</p>
                            <p className="text-sm text-slate-400 mt-1">{debouncedSearch ? "Try adjusting your search" : "Get started by adding your first vendor"}</p>
                          </div>
                          {!debouncedSearch && (
                            <button onClick={() => setModalOpen(true)}
                              className="inline-flex items-center gap-2 bg-indigo-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-indigo-700 transition mt-2">
                              <Plus size={15} /> Add Vendor
                            </button>
                          )}
                        </div>
                      </td></tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-5 py-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <span>Show</span>
                    <select value={itemsPerPage} onChange={e => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                      className="px-2 py-1 border border-slate-200 rounded-lg text-sm bg-white outline-none focus:border-indigo-400">
                      {[5,10,25,50].map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                    <span>per page · Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong></span>
                  </div>
                  <div className="flex items-center gap-1">
                    {[
                      { icon: ChevronsLeft, action: () => setCurrentPage(1), disabled: currentPage === 1 },
                      { icon: ChevronLeft, action: () => setCurrentPage(p => p - 1), disabled: currentPage === 1 },
                    ].map(({ icon: Icon, action, disabled }, i) => (
                      <button key={i} onClick={action} disabled={disabled}
                        className="w-8 h-8 flex items-center justify-center border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50 transition disabled:opacity-40 disabled:cursor-not-allowed">
                        <Icon size={14} />
                      </button>
                    ))}
                    {pageNumbers.map((p, i) => p === "..." ? (
                      <span key={i} className="w-8 text-center text-slate-400 text-sm">…</span>
                    ) : (
                      <button key={i} onClick={() => setCurrentPage(p as number)}
                        className={`w-8 h-8 text-sm rounded-lg border transition ${currentPage === p ? "bg-indigo-600 text-white border-indigo-600" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
                        {p}
                      </button>
                    ))}
                    {[
                      { icon: ChevronRight, action: () => setCurrentPage(p => p + 1), disabled: currentPage === totalPages },
                      { icon: ChevronsRight, action: () => setCurrentPage(totalPages), disabled: currentPage === totalPages },
                    ].map(({ icon: Icon, action, disabled }, i) => (
                      <button key={i} onClick={action} disabled={disabled}
                        className="w-8 h-8 flex items-center justify-center border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50 transition disabled:opacity-40 disabled:cursor-not-allowed">
                        <Icon size={14} />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Add Modal */}
      {modalOpen && (
        <Modal title={<div className="flex items-center gap-3"><div className="w-9 h-9 bg-indigo-50 rounded-xl flex items-center justify-center"><Plus size={17} className="text-indigo-600" /></div><div><p className="font-bold text-slate-900">Add New Vendor</p><p className="text-xs text-slate-400">Create a new supplier record</p></div></div>} onClose={closeModal(setModalOpen)}>
          <VendorForm form={form} locations={locations} onChange={handleInputChange} onSubmit={handleSave} onCancel={closeModal(setModalOpen)} isSubmitting={isSubmitting} mode="add" />
        </Modal>
      )}

      {/* Edit Modal */}
      {editModalOpen && selectedVendor && (
        <Modal title={<div className="flex items-center gap-3"><div className="w-9 h-9 bg-amber-50 rounded-xl flex items-center justify-center"><Edit size={16} className="text-amber-600" /></div><div><p className="font-bold text-slate-900">Edit Vendor</p><p className="text-xs text-slate-400">{selectedVendor.vendor_name}</p></div></div>} onClose={closeModal(setEditModalOpen)}>
          <VendorForm form={form} locations={locations} onChange={handleInputChange} onSubmit={handleEdit} onCancel={closeModal(setEditModalOpen)} isSubmitting={isSubmitting} mode="edit" />
        </Modal>
      )}

      {/* Delete Modal */}
      {deleteModalOpen && selectedVendor && (
        <Modal title={null} onClose={() => { if (!isSubmitting) { setDeleteModalOpen(false); setSelectedVendor(null); } }} size="sm">
          <div className="flex flex-col items-center text-center gap-4 pb-2">
            <div className="w-14 h-14 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center">
              <AlertTriangle size={24} className="text-red-500" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Delete Vendor</h2>
              <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                Are you sure you want to delete <span className="font-semibold text-slate-800">{selectedVendor.vendor_name}</span>? This action cannot be undone.
              </p>
            </div>
            <div className="flex gap-3 w-full pt-2">
              <button onClick={() => { setDeleteModalOpen(false); setSelectedVendor(null); }} disabled={isSubmitting}
                className="flex-1 py-2.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition disabled:opacity-50">
                Cancel
              </button>
              <button onClick={handleDelete} disabled={isSubmitting}
                className="flex-1 py-2.5 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition inline-flex items-center justify-center gap-2 disabled:opacity-50 shadow-sm">
                {isSubmitting ? <><Loader2 size={14} className="animate-spin" />Deleting…</> : <><Trash2 size={14} />Delete</>}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* View Modal */}
      {viewModalOpen && selectedVendor && (
        <Modal
          title={<div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center"><Building2 size={18} className="text-white" /></div>
            <div>
              <p className="font-bold text-slate-900">{selectedVendor.vendor_name}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-xs text-slate-400">{selectedVendor.industry || "No industry"}</p>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${selectedVendor.is_active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                  {selectedVendor.is_active ? <><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />Active</> : <><span className="w-1.5 h-1.5 rounded-full bg-slate-400" />Inactive</>}
                </span>
              </div>
            </div>
          </div>}
          onClose={() => { setViewModalOpen(false); setSelectedVendor(null); }}
        >
          <div className="space-y-6">
            {/* Contact */}
            <div className="bg-slate-50 rounded-xl p-5 space-y-4 border border-slate-100">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2"><User size={12} />Contact</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <DetailRow label="Contact Person" value={selectedVendor.contact_person} />
                <DetailRow label="Email" value={selectedVendor.email} />
                <DetailRow label="Phone" value={selectedVendor.phone} />
              </div>
            </div>

            {/* Address */}
            <div className="bg-slate-50 rounded-xl p-5 space-y-4 border border-slate-100">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2"><MapPin size={12} />Address</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <DetailRow label="Street" value={selectedVendor.address} />
                <DetailRow label="City" value={selectedVendor.city} />
                <DetailRow label="State" value={selectedVendor.state} />
                <DetailRow label="Postal Code" value={selectedVendor.postal_code} />
                <DetailRow label="Country" value={selectedVendor.country} />
                {selectedVendor.website && (
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Website</p>
                    <a href={selectedVendor.website.startsWith("http") ? selectedVendor.website : `https://${selectedVendor.website}`} target="_blank" rel="noopener noreferrer"
                      className="text-sm text-indigo-600 hover:underline flex items-center gap-1 truncate">
                      <Globe size={12} />{selectedVendor.website}
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Legal & Banking */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-50 rounded-xl p-5 space-y-4 border border-slate-100">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2"><FileText size={12} />Legal</p>
                <DetailRow label="Tax ID / TIN" value={selectedVendor.tax_id} mono />
                <DetailRow label="Registration No." value={selectedVendor.registration_number} mono />
              </div>
              <div className="bg-slate-50 rounded-xl p-5 space-y-4 border border-slate-100">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2"><CreditCard size={12} />Banking</p>
                <DetailRow label="Bank Name" value={selectedVendor.bank_name} />
                <DetailRow label="Account Number" value={selectedVendor.bank_account_number} mono />
                <DetailRow label="Account Name" value={selectedVendor.bank_account_name} />
              </div>
            </div>

            {/* Notes & Meta */}
            {selectedVendor.notes && (
              <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Notes</p>
                <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{selectedVendor.notes}</p>
              </div>
            )}

            <div className="flex items-center justify-between text-xs text-slate-400 pt-1 border-t border-slate-100">
              <span className="flex items-center gap-1"><Calendar size={11} />Created {new Date(selectedVendor.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</span>
              <span>Updated {new Date(selectedVendor.updated_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</span>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
              <button onClick={() => { setViewModalOpen(false); setSelectedVendor(null); }}
                className="px-4 py-2.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition">
                Close
              </button>
              <button onClick={() => { setViewModalOpen(false); prepareEdit(selectedVendor); }}
                className="px-4 py-2.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition inline-flex items-center gap-2 shadow-sm">
                <Edit size={14} /> Edit Vendor
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default withAuth(ManageVendors);