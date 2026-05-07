'use client';

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, FormEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import api from "@/lib/axios";
import Cookies from "js-cookie";
import { ArrowLeft, Plus, Building2, Image as ImageIcon, Loader2, Upload, X, CheckCircle } from "lucide-react";
import toast from "react-hot-toast";
import { motion } from "framer-motion";

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

interface BusinessDetails {
  businessType: string;
  creation: string;
  currency: string;
  industry: string;
  website: string;
}

interface BusinessStats {
  activeLocations: number;
  inactiveLocations: number;
  totalLocations: number;
}

interface Business {
  id: number;
  bussiness_key: string;
  name: string;
  description: string | null;
  logo: string;
  slug: string;
  email: string;
  phone: string;
  website: string;
  country: string;
  city: string;
  state: string;
  address: string;
  about_business: string;
  business_name: string;
  subscription: string;
  currency: string;
  subscription_plan: string;
  industry_type: string;
  language?: string;
  details: BusinessDetails;
  stats: BusinessStats;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const INDUSTRY_TYPES = [
  "Technology", "Finance", "Retail", "Healthcare", "Education", "Manufacturing",
  "Real Estate", "Transportation & Logistics", "Hospitality & Tourism", "Energy & Utilities",
  "Telecommunications", "Media & Entertainment", "Construction", "Agriculture",
  "Food & Beverage", "Legal Services", "Nonprofit & NGOs", "Government", "Consulting",
  "Pharmaceuticals & Biotechnology"
];

const COUNTRIES = [
  "Nigeria", "United States", "Canada", "United Kingdom", "Germany", "France",
  "Italy", "Spain", "Australia", "Japan", "China", "India", "Brazil", "Mexico",
  "South Africa", "Kenya", "Ghana", "Egypt", "United Arab Emirates", "Saudi Arabia",
  "South Korea", "Singapore", "Netherlands", "Switzerland", "Sweden", "Norway",
  "Denmark", "Finland", "Belgium", "Austria", "Portugal", "Ireland", "New Zealand",
  "Malaysia", "Thailand", "Vietnam", "Indonesia", "Philippines", "Israel", "Turkey",
  "Poland", "Czech Republic", "Hungary", "Romania", "Greece", "Ukraine", "Russia"
];

const SUBSCRIPTION_TYPES = ["Free", "Basic", "Standard", "Premium", "Enterprise", "Custom"];
const SUBSCRIPTION_PLANS = ["monthly", "yearly"];
const LANGUAGES = ["en", "fr", "es"];

const ALLOWED_FILE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE = 2 * 1024 * 1024;

// =============================================================================
// LOADING STATE
// =============================================================================
const LoadingState: React.FC = () => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-20 flex flex-col items-center">
    <div className="relative w-14 h-14 mb-5">
      <div className="w-14 h-14 rounded-full border-[3px] border-gray-100" />
      <div className="absolute inset-0 rounded-full border-[3px] border-gray-900 border-t-transparent animate-spin" />
      <Building2 className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
    </div>
    <p className="text-sm font-semibold text-gray-700">Loading business data</p>
    <p className="text-xs text-gray-400 mt-1">Please wait a moment</p>
  </div>
);

// =============================================================================
// MAIN COMPONENT
// =============================================================================

const EditBusinessPage: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const id = params.businesskey as string;

  const [business, setBusiness] = useState<Business | null>(null);
  const [form, setForm] = useState<Partial<Business>>({});
  const [fetching, setFetching] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  useEffect(() => {
    const fetchBusiness = async (): Promise<void> => {
      if (!id) return;
      try {
        await api.get("/sanctum/csrf-cookie");
        const res = await api.get(`/businessinfo/${id}`, {
          headers: { "X-XSRF-TOKEN": Cookies.get("XSRF-TOKEN") || "" },
        });
        const businessData: Business = res.data?.business || res.data?.data?.business || res.data;
        setBusiness(businessData);
        setForm(businessData);
        if (businessData.logo) {
          setLogoPreview(`http://localhost:8001/storage/${businessData.logo}`);
        }
      } catch {
        toast.error('Unable to fetch business data.');
      } finally {
        setFetching(false);
      }
    };
    fetchBusiness();
  }, [id]);

  useEffect(() => {
    return () => {
      if (logoPreview && logoPreview.startsWith('blob:')) {
        URL.revokeObjectURL(logoPreview);
      }
    };
  }, [logoPreview]);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      toast.error('Please upload a JPEG, PNG, or WEBP image.');
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      toast.error('Image must be smaller than 2MB.');
      return;
    }

    setLogoFile(file);
    const previewUrl = URL.createObjectURL(file);
    setLogoPreview(previewUrl);
    const reader = new FileReader();
    reader.onload = () => setForm(prev => ({ ...prev, logo: reader.result as string }));
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = (): void => {
    setLogoFile(null);
    if (logoPreview && logoPreview.startsWith('blob:')) {
      URL.revokeObjectURL(logoPreview);
    }
    setLogoPreview(null);
    setForm(prev => ({ ...prev, logo: "" }));
  };

  const handleInputChange = (key: keyof Business, value: string | number): void => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const onSubmit = async (e: FormEvent): Promise<void> => {
    e.preventDefault();

    if (!isFormValid) {
      toast.error('Business name is required.');
      return;
    }

    try {
      setIsSubmitting(true);
      await api.get("/sanctum/csrf-cookie");

      const formData = new FormData();

      Object.entries(form).forEach(([key, value]) => {
        if (key !== "logo" && value !== undefined && value !== null && value !== "") {
          formData.append(key, String(value));
        }
      });

      if (logoFile instanceof File) {
        formData.append("logo", logoFile);
      }

      formData.append("_method", "PUT");

      const res = await api.post(`/updatebusiness/${id}`, formData, {
        headers: {
          "X-XSRF-TOKEN": Cookies.get("XSRF-TOKEN") || "",
          "Content-Type": "multipart/form-data",
        },
      });

      if (res.status === 200) {
        toast.success('Business updated successfully!');
        router.push("/business");
      } else {
        throw new Error("Update failed");
      }
    } catch {
      toast.error('Failed to update business. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = !!(form.business_name?.trim() || form.name?.trim());

  const inputClass = "w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 outline-none transition text-gray-700 placeholder-gray-300";
  const labelClass = "text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block";

  return (
    <div className="min-h-screen bg-[#f5f5f4]">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 top-0 z-40">
        <div className="max-w-screen-2xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/business"
              className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-800 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <h1 className="text-lg font-bold text-gray-900 tracking-tight">Edit Business</h1>
              <p className="text-xs text-gray-400">Update your business profile information</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-screen-2xl mx-auto px-6 py-6">
        {fetching ? (
          <LoadingState />
        ) : business ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
          >
            {/* Form Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center">
                <Building2 className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-900">Business Profile</h2>
                <p className="text-xs text-gray-400">Complete your business information</p>
              </div>
            </div>

            <form onSubmit={onSubmit} className="p-6 space-y-8">
              {/* Basic Information */}
              <section className="space-y-5">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className={labelClass}>
                      Business Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.business_name || form.name || ""}
                      onChange={(e) => handleInputChange('business_name', e.target.value)}
                      required
                      className={inputClass}
                      placeholder="Enter business name"
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Slug</label>
                    <input
                      type="text"
                      value={form.slug || ""}
                      onChange={(e) => handleInputChange('slug', e.target.value)}
                      className={inputClass}
                      placeholder="business-slug"
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Industry Type</label>
                    <select
                      value={form.industry_type || ""}
                      onChange={(e) => handleInputChange('industry_type', e.target.value)}
                      className={inputClass}
                    >
                      <option value="">Select industry</option>
                      {INDUSTRY_TYPES.map((type) => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>

                  {/* Logo Upload */}
                  <div className="md:col-span-2">
                    <label className={labelClass}>Business Logo</label>
                    {logoPreview ? (
                      <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                        <div className="relative w-14 h-14 rounded-xl overflow-hidden border border-gray-200 flex-shrink-0">
                          <Image
                            src={logoPreview}
                            alt="Logo preview"
                            fill
                            className="object-cover"
                            sizes="56px"
                            unoptimized={process.env.NODE_ENV === 'development'}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">
                            {logoFile ? 'New logo uploaded' : 'Current logo'}
                          </p>
                          <p className="text-xs text-gray-400">Ready to use</p>
                        </div>
                        <button
                          type="button"
                          onClick={handleRemoveLogo}
                          className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-rose-500 hover:bg-rose-50 transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="relative">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleLogoUpload}
                          className="hidden"
                          id="logo-upload"
                        />
                        <label
                          htmlFor="logo-upload"
                          className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-gray-300 transition-colors bg-gray-50/50"
                        >
                          <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mb-3">
                            <Upload className="h-5 w-5 text-gray-400" />
                          </div>
                          <p className="text-sm font-semibold text-gray-600">Click to upload logo</p>
                          <p className="text-xs text-gray-400 mt-1">PNG, JPG, WEBP up to 2MB</p>
                        </label>
                      </div>
                    )}
                  </div>
                </div>
              </section>

              {/* Contact Information */}
              <section className="space-y-5">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Contact Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Phone Number</label>
                    <input
                      type="tel"
                      value={form.phone || ""}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className={inputClass}
                      placeholder="Enter phone number"
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Website</label>
                    <input
                      type="url"
                      value={form.website || ""}
                      onChange={(e) => handleInputChange('website', e.target.value)}
                      className={inputClass}
                      placeholder="https://example.com"
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Country</label>
                    <select
                      value={form.country || ""}
                      onChange={(e) => handleInputChange('country', e.target.value)}
                      className={inputClass}
                    >
                      <option value="">Select country</option>
                      {COUNTRIES.map((country) => (
                        <option key={country} value={country}>{country}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>State/Province</label>
                    <input
                      type="text"
                      value={form.state || ""}
                      onChange={(e) => handleInputChange('state', e.target.value)}
                      className={inputClass}
                      placeholder="Enter state"
                    />
                  </div>
                  <div>
                    <label className={labelClass}>City</label>
                    <input
                      type="text"
                      value={form.city || ""}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      className={inputClass}
                      placeholder="Enter city"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className={labelClass}>Full Address</label>
                    <textarea
                      rows={2}
                      value={form.address || ""}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      className={`${inputClass} resize-none`}
                      placeholder="Enter full address"
                    />
                  </div>
                </div>
              </section>

              {/* Business Settings */}
              <section className="space-y-5">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Business Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className={labelClass}>Subscription</label>
                    <select
                      value={form.subscription || ""}
                      onChange={(e) => handleInputChange('subscription', e.target.value)}
                      className={inputClass}
                    >
                      {SUBSCRIPTION_TYPES.map((type) => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Billing Cycle</label>
                    <select
                      value={form.subscription_plan || ""}
                      onChange={(e) => handleInputChange('subscription_plan', e.target.value)}
                      className={inputClass}
                    >
                      {SUBSCRIPTION_PLANS.map((plan) => (
                        <option key={plan} value={plan}>
                          {plan.charAt(0).toUpperCase() + plan.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Currency</label>
                    <select
                      value={form.currency || ""}
                      onChange={(e) => handleInputChange('currency', e.target.value)}
                      className={inputClass}
                    >
                      <option value="USD">$ - US Dollar (USD)</option>
                      <option value="EUR">€ - Euro (EUR)</option>
                      <option value="GBP">£ - British Pound (GBP)</option>
                      <option value="NGN">₦ - Nigerian Naira (NGN)</option>
                      <option value="KES">KSh - Kenyan Shilling (KES)</option>
                      <option value="GHS">₵ - Ghanaian Cedi (GHS)</option>
                      <option value="ZAR">R - South African Rand (ZAR)</option>
                      <option value="INR">₹ - Indian Rupee (INR)</option>
                      <option value="JPY">¥ - Japanese Yen (JPY)</option>
                      <option value="CNY">¥ - Chinese Yuan (CNY)</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Language</label>
                    <select
                      value={form.language || ""}
                      onChange={(e) => handleInputChange('language', e.target.value)}
                      className={inputClass}
                    >
                      {LANGUAGES.map((lang) => (
                        <option key={lang} value={lang}>{lang.toUpperCase()}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </section>

              {/* About */}
              <section className="space-y-5">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">About</h3>
                <div>
                  <textarea
                    rows={4}
                    value={form.about_business || ""}
                    onChange={(e) => handleInputChange('about_business', e.target.value)}
                    className={`${inputClass} resize-none`}
                    placeholder="Brief description of your business..."
                    maxLength={500}
                  />
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-gray-400">{(form.about_business || "").length}/500 characters</span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-gray-100 text-gray-500">Optional</span>
                  </div>
                </div>
              </section>

              {/* Submit */}
              <div className="flex items-center justify-between pt-6 border-t border-gray-100">
                <p className="text-xs text-gray-400">
                  <span className="text-rose-500">*</span> Required fields
                </p>
                <div className="flex items-center gap-3">
                  <Link
                    href="/business"
                    className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-50 transition"
                  >
                    Cancel
                  </Link>
                  <button
                    type="submit"
                    disabled={!isFormValid || isSubmitting}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white text-sm font-bold rounded-xl hover:bg-gray-800 transition-all shadow-md shadow-gray-900/15 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4" />
                        Update Business
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </motion.div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-20 flex flex-col items-center">
            <Building2 className="h-8 w-8 text-gray-300 mb-4" />
            <p className="text-sm font-semibold text-gray-700">No business found</p>
            <p className="text-xs text-gray-400 mt-1">The requested business could not be loaded</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default EditBusinessPage;