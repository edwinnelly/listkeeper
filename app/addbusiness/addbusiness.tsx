'use client';

import { useParams, useRouter } from "next/navigation";
import React, { useState, } from "react";
import { Building2, Image, Upload, Plus, Hexagon, ArrowLeft } from "lucide-react";
import api from "@/lib/axios";
import Cookies from "js-cookie";
import Link from "next/link";
import { toast } from 'react-hot-toast';

const industryTypes = [
  "Technology", "Finance", "Retail", "Healthcare", "Education", "Manufacturing",
  "Real Estate", "Transportation & Logistics", "Hospitality & Tourism", "Energy & Utilities",
  "Telecommunications", "Media & Entertainment", "Construction", "Agriculture",
  "Food & Beverage", "Legal Services", "Nonprofit & NGOs", "Government", "Consulting",
  "Pharmaceuticals & Biotechnologys"
];

const countries = [
  "Nigeria", "United States", "Canada", "United Kingdom", "Germany", "France",
  "Italy", "Spain", "Australia", "Japan", "China", "India", "Brazil", "Mexico",
  "South Africa", "Kenya", "Ghana", "Egypt", "United Arab Emirates", "Saudi Arabia",
  "South Korea", "Singapore", "Netherlands", "Switzerland", "Sweden", "Norway",
  "Denmark", "Finland", "Belgium", "Austria", "Portugal", "Ireland", "New Zealand",
  "Malaysia", "Thailand", "Vietnam", "Indonesia", "Philippines", "Israel", "Turkey",
  "Poland", "Czech Republic", "Hungary", "Romania", "Greece", "Ukraine", "Russia"
];

const subscriptionTypes = [
  "Free",
  "Basic",
  "Standard",
  "Premium",
  "Enterprise",
  "Custom"

];

const subscriptionPlans = ["monthly", "yearly"];
const currencies = ["NGN", "USD", "EUR"];
const languages = ["en", "fr", "es"];

interface FormState {
  business_name: string;
  slug: string;
  industry_type: string;
  logo: string;
  email: string;
  phone: string;
  website: string;
  address: string;
  country: string;
  state: string;
  city: string;
  subscription_type: string;
  subscription_plan: string;
  currency: string;
  language: string;
  about_business: string;
}

export default function AddBusinessPage() {
  const [form, setForm] = useState<FormState>({
    business_name: "",
    slug: "",
    industry_type: "",
    logo: "",
    email: "",
    phone: "",
    website: "",
    address: "",
    country: "",
    state: "",
    city: "",
    subscription_type: "free",
    subscription_plan: "monthly",
    currency: "NGN",
    language: "en",
    about_business: ""
  });

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const inputClass = "w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200 placeholder-gray-400 text-sm";
  const labelClass = "block text-sm font-medium text-gray-700 mb-2";

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    const maxSize = 2 * 1024 * 1024;

    if (!allowedTypes.includes(file.type)) {
      toast.error('Please upload a JPEG, PNG, or WEBP image.');
      return;
    }

    if (file.size > maxSize) {
      toast.error('Image must be smaller than 2MB.');
      return;
    }

    setLogoFile(file);
    const reader = new FileReader();
    reader.onload = () => setForm(prev => ({ ...prev, logo: reader.result as string }));
    reader.readAsDataURL(file);
  };

  const handleInputChange = (field: keyof FormState, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const router = useRouter();

  const showSuccessAlert = () => {
    toast.success('Your business has been created successfully.');
    router.push('/business');
  };

  const showErrorAlert = (message: string) => {
    toast.error('Creation Failed');
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        formData.append(key, value);
      });

      if (logoFile) formData.append("logo", logoFile);

      await api.get("/sanctum/csrf-cookie");
      await api.post("/newbusinesses", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          "X-XSRF-TOKEN": Cookies.get("XSRF-TOKEN") || ""
        },
      });

      showSuccessAlert();

      // Reset form
      setForm({
        business_name: "",
        slug: "",
        industry_type: "",
        logo: "",
        email: "",
        phone: "",
        website: "",
        address: "",
        country: "",
        state: "",
        city: "",
        subscription_type: "free",
        subscription_plan: "monthly",
        currency: "NGN",
        language: "en",
        about_business: ""
      });
      setLogoFile(null);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || "Failed to create business.";
      showErrorAlert(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = form.business_name.trim().length > 0;

  return (
    <div className="min-h-screen bg-white py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/business" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4 transition-colors">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Business
          </Link>
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Create Business</h1>
              <p className="text-gray-600 mt-1">Set up your business profile</p>
            </div>
            <Link
              href="/business"
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              Manage Businesses
            </Link>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white shadow-sm border border-gray-200 overflow-hidden rounded-xl border border-gray-200">
          {/* Card Header */}
          <div className="bg-gradient-to-r from-gray-900 to-gray-800 px-6 py-5">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white/10 rounded-lg">
                <Building2 className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Business Profile</h2>
                <p className="text-gray-300 text-sm">Complete your business information</p>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={onSubmit} className="p-6 space-y-8">
            {/* Basic Information */}
            <section>
              <h3 className="text-base font-semibold text-gray-900 mb-4">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className={labelClass}>
                    Business Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.business_name}
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
                    value={form.slug}
                    onChange={(e) => handleInputChange('slug', e.target.value)}
                    className={inputClass}
                    placeholder="business-slug"
                  />
                </div>

                <div>
                  <label className={labelClass}>Industry Type</label>
                  <select
                    value={form.industry_type}
                    onChange={(e) => handleInputChange('industry_type', e.target.value)}
                    className={inputClass}
                  >
                    <option value="">Select industry</option>
                    {industryTypes.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                {/* Logo Upload */}
                <div className="md:col-span-2">
                  <label className={labelClass}>Business Logo</label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors cursor-pointer bg-gray-50/50">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                      id="logo-upload"
                    />
                    <label htmlFor="logo-upload" className="cursor-pointer">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <Image className="h-8 w-8 text-gray-400" />
                        <p className="text-sm font-medium text-gray-600">Click to upload logo</p>
                        <p className="text-xs text-gray-500">PNG, JPG, WEBP up to 2MB</p>
                      </div>
                    </label>
                  </div>
                  {form.logo && (
                    <div className="mt-3 flex items-center space-x-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <img
                        src={form.logo}
                        alt="Logo preview"
                        className="w-12 h-12 rounded object-cover border border-blue-300"
                      />
                      <span className="text-sm text-gray-700">Logo ready</span>
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* Contact Information */}
            <section>
              <h3 className="text-base font-semibold text-gray-900 mb-4">Contact Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="email"
                  placeholder="Email address"
                  value={form.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className={inputClass}
                />
                <input
                  type="tel"
                  placeholder="Phone number"
                  value={form.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className={inputClass}
                />
                <input
                  type="url"
                  placeholder="Website URL"
                  value={form.website}
                  onChange={(e) => handleInputChange('website', e.target.value)}
                  className={inputClass}
                />
                <select
                  value={form.country}
                  onChange={(e) => handleInputChange('country', e.target.value)}
                  className={inputClass}
                >
                  <option value="">Select country</option>
                  {countries.map((country) => (
                    <option key={country} value={country}>{country}</option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="State/Province"
                  value={form.state}
                  onChange={(e) => handleInputChange('state', e.target.value)}
                  className={inputClass}
                />
                <input
                  type="text"
                  placeholder="City"
                  value={form.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  className={inputClass}
                />
                <div className="md:col-span-2">
                  <textarea
                    rows={2}
                    placeholder="Full address"
                    value={form.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>
            </section>

            {/* Business Settings */}
            <section>
              <h3 className="text-base font-semibold text-gray-900 mb-4">Business Settings</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className={labelClass}>Subscription</label>
                  <select
                    value={form.subscription_type}
                    onChange={(e) => handleInputChange('subscription_type', e.target.value)}
                    className={inputClass}
                  >
                    {subscriptionTypes.map((type) => (
                      <option key={type} value={type}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={labelClass}>Billing Cycle</label>
                  <select
                    value={form.subscription_plan}
                    onChange={(e) => handleInputChange('subscription_plan', e.target.value)}
                    className={inputClass}
                  >
                    {subscriptionPlans.map((plan) => (
                      <option key={plan} value={plan}>
                        {plan.charAt(0).toUpperCase() + plan.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={labelClass}>Currency</label>
                  <select
                    value={form.currency}
                    onChange={(e) => handleInputChange('currency', e.target.value)}
                    className={inputClass}
                  >
                    <option value="$">$ - US Dollar (USD)</option>
                    <option value="€">€ - Euro (EUR)</option>
                    <option value="£">£ - British Pound (GBP)</option>
                    <option value="¥">¥ - Japanese Yen (JPY)</option>
                    <option value="¥">¥ - Chinese Yuan (CNY)</option>
                    <option value="₹">₹ - Indian Rupee (INR)</option>
                    <option value="$">$ - Australian Dollar (AUD)</option>
                    <option value="$">$ - Canadian Dollar (CAD)</option>
                    <option value="CHF">CHF - Swiss Franc (CHF)</option>
                    <option value="$">$ - New Zealand Dollar (NZD)</option>
                    <option value="R">R - South African Rand (ZAR)</option>
                    <option value="₦">₦ - Nigerian Naira (NGN)</option>
                    <option value="KSh">KSh - Kenyan Shilling (KES)</option>
                    <option value="₵">₵ - Ghanaian Cedi (GHS)</option>
                    <option value="FCFA">FCFA - Central African CFA Franc (XAF)</option>
                    <option value="CFA">CFA - West African CFA Franc (XOF)</option>
                    <option value="﷼">﷼ - Saudi Riyal (SAR)</option>
                    <option value="د.إ">د.إ - UAE Dirham (AED)</option>
                    <option value="﷼">﷼ - Qatari Riyal (QAR)</option>
                    <option value="£">£ - Egyptian Pound (EGP)</option>
                    <option value="R$">R$ - Brazilian Real (BRL)</option>
                    <option value="$">$ - Mexican Peso (MXN)</option>
                    <option value="$">$ - Singapore Dollar (SGD)</option>
                    <option value="$">$ - Hong Kong Dollar (HKD)</option>
                    <option value="RM">RM - Malaysian Ringgit (MYR)</option>
                    <option value="฿">฿ - Thai Baht (THB)</option>
                    <option value="₩">₩ - South Korean Won (KRW)</option>
                    <option value="kr">kr - Swedish Krona (SEK)</option>
                    <option value="kr">kr - Norwegian Krone (NOK)</option>
                    <option value="kr">kr - Danish Krone (DKK)</option>
                    <option value="₽">₽ - Russian Ruble (RUB)</option>
                    <option value="₺">₺ - Turkish Lira (TRY)</option>
                    <option value="₨">₨ - Pakistani Rupee (PKR)</option>
                    <option value="৳">৳ - Bangladeshi Taka (BDT)</option>
                    <option value="Rs">Rs - Sri Lankan Rupee (LKR)</option>
                    <option value="NT$">NT$ - New Taiwan Dollar (TWD)</option>
                    <option value="₫">₫ - Vietnamese Dong (VND)</option>
                    <option value="Rp">Rp - Indonesian Rupiah (IDR)</option>
                    <option value="zł">zł - Polish Zloty (PLN)</option>
                    <option value="Kč">Kč - Czech Koruna (CZK)</option>
                    <option value="Ft">Ft - Hungarian Forint (HUF)</option>
                    <option value="₪">₪ - Israeli Shekel (ILS)</option>
                    <option value="$">$ - Argentine Peso (ARS)</option>
                    <option value="$">$ - Chilean Peso (CLP)</option>
                    <option value="$">$ - Colombian Peso (COP)</option>
                  </select>
                </div>

                <div>
                  <label className={labelClass}>Language</label>
                  <select
                    value={form.language}
                    onChange={(e) => handleInputChange('language', e.target.value)}
                    className={inputClass}
                  >
                    {languages.map((lang) => (
                      <option key={lang} value={lang}>{lang.toUpperCase()}</option>
                    ))}
                  </select>
                </div>
              </div>
            </section>

            {/* Additional Information */}
            <section>
              <h3 className="text-base font-semibold text-gray-900 mb-4">About</h3>
              <textarea
                rows={3}
                placeholder="Brief description of your business..."
                value={form.about_business}
                onChange={(e) => handleInputChange('about_business', e.target.value)}
                className={inputClass}
                maxLength={300}
              />
              <div className="flex justify-between items-center mt-2">
                <span className="text-xs text-gray-500">{form.about_business.length}/300 characters</span>
                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">Optional</span>
              </div>
            </section>

            {/* Submit Button */}
            <div className="flex justify-end pt-6 border-t border-gray-200">
              <button
                type="submit"
                disabled={!isFormValid || isSubmitting}
                className="px-6 py-2.5 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center"
              >
                <Plus className="h-4 w-4 mr-2" />
                {isSubmitting ? "Creating..." : "Create Business"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}