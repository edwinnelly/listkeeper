'use client';

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, FormEvent } from "react";
import Link from "next/link";
import api from "@/lib/axios";
import Cookies from "js-cookie";
import Swal from "sweetalert2";
import { ArrowLeft, Plus, Building2, Image } from "lucide-react";
import toast from "react-hot-toast";

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

/** Business details interface */
interface BusinessDetails {
  businessType: string;
  creation: string;
  currency: string;
  industry: string;
  website: string;
}

/** Business statistics interface */
interface BusinessStats {
  activeLocations: number;
  inactiveLocations: number;
  totalLocations: number;
}

/** Main business entity interface */
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

/** CSS classes for consistent styling */
const INPUT_CLASS = "w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200 placeholder-gray-400 text-sm";
const LABEL_CLASS = "block text-sm font-medium text-gray-700 mb-2";

/** Industry types for dropdown */
const INDUSTRY_TYPES = [
  "Technology", "Finance", "Retail", "Healthcare", "Education", "Manufacturing",
  "Real Estate", "Transportation & Logistics", "Hospitality & Tourism", "Energy & Utilities",
  "Telecommunications", "Media & Entertainment", "Construction", "Agriculture",
  "Food & Beverage", "Legal Services", "Nonprofit & NGOs", "Government", "Consulting",
  "Pharmaceuticals & Biotechnology"
];

/** Countries for dropdown */
const COUNTRIES = [
  "Nigeria", "United States", "Canada", "United Kingdom", "Germany", "France", 
  "Italy", "Spain", "Australia", "Japan", "China", "India", "Brazil", "Mexico",
  "South Africa", "Kenya", "Ghana", "Egypt", "United Arab Emirates", "Saudi Arabia",
  "South Korea", "Singapore", "Netherlands", "Switzerland", "Sweden", "Norway",
  "Denmark", "Finland", "Belgium", "Austria", "Portugal", "Ireland", "New Zealand",
  "Malaysia", "Thailand", "Vietnam", "Indonesia", "Philippines", "Israel", "Turkey",
  "Poland", "Czech Republic", "Hungary", "Romania", "Greece", "Ukraine", "Russia"
];

/** Subscription types for dropdown */
const SUBSCRIPTION_TYPES = ["Free", "Basic", "Standard", "Premium", "Enterprise", "Custom"];

/** Subscription plans for dropdown */
const SUBSCRIPTION_PLANS = ["monthly", "yearly"];

/** Supported languages for dropdown */
const LANGUAGES = ["en", "fr", "es"];

/** File upload validation constants */
const ALLOWED_FILE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

// =============================================================================
// MAIN COMPONENT
// =============================================================================

/**
 * EditBusinessPage Component
 * Handles editing business information with form validation and file upload
 */
const EditBusinessPage = () => {
  // ===========================================================================
  // HOOKS AND STATE
  // ===========================================================================
  
  const params = useParams();
  const router = useRouter();
  const id = params.businesskey as string;

  const [business, setBusiness] = useState<Business | null>(null);
  const [form, setForm] = useState<Partial<Business>>({});
  const [fetching, setFetching] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);

  // ===========================================================================
  // EFFECTS
  // ===========================================================================

  /**
   * Fetch business data on component mount
   */
  useEffect(() => {
    const fetchBusiness = async () => {
      if (!id) return;

      try {
        // Get CSRF token for secure request
        await api.get("/sanctum/csrf-cookie");
        
        const res = await api.get(`/businessinfo/${id}`, {
          headers: { "X-XSRF-TOKEN": Cookies.get("XSRF-TOKEN") || "" },
        });

        // Extract business data from various possible response structures
        const businessData: Business = 
          res.data?.business || res.data?.data?.business || res.data;

        setBusiness(businessData);
        setForm(businessData);
      } catch (err: any) {
        toast.error('Unable to fetch business data.');
      } finally {
        setFetching(false);
      }
    };

    fetchBusiness();
  }, [id]);

  // ===========================================================================
  // EVENT HANDLERS
  // ===========================================================================

  /**
   * Handles logo file upload with validation
   */
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
       toast.error('Invalid file type, Please upload a JPEG, PNG, or WEBP image.');
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
       toast.error('File too large, Image must be smaller than 2MB.');
      return;
    }

    setLogoFile(file);
    
    // Create preview for immediate UI feedback
    const reader = new FileReader();
    reader.onload = () => setForm(prev => ({ ...prev, logo: reader.result as string }));
    reader.readAsDataURL(file);
  };

  /**
   * Handles form input changes
   */
  const handleInputChange = (key: keyof Business, value: any) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const onSubmit = async (e: FormEvent) => {
  e.preventDefault();

  if (!isFormValid) {
     toast.error('Business name is required.');
    return;
  }

  try {
    setIsSubmitting(true);
    await api.get("/sanctum/csrf-cookie");

    const formData = new FormData();

    // Exclude "logo" from auto append
    Object.entries(form).forEach(([key, value]) => {
      if (key !== "logo" && value !== undefined && value !== null) {
        formData.append(key, value as any);
      }
    });

    // Only append real file if user uploaded one
    if (logoFile instanceof File) {
      formData.append("logo", logoFile);
    }

    // Tell Laravel it's a PUT update
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
  } catch (err: any) {
  
  } finally {
    setIsSubmitting(false);
  }
};


  // ===========================================================================
  // COMPUTED VALUES
  // ===========================================================================

  /** Validates if form has required fields filled */
  const isFormValid = !!(form.business_name?.trim() || form.name?.trim());

  // ===========================================================================
  // RENDER
  // ===========================================================================

  return (
    <div className="min-h-screen bg-white py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Section */}
        <div className="mb-8">
          <Link
            href="/business"
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Business
          </Link>
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Edit Business</h1>
              <p className="text-gray-600 mt-1">Update your business profile information</p>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {fetching ? (
          <div className="flex justify-center items-center py-12">
            <p>Loading business data...</p>
          </div>
        ) : business ? (
          
          /* Main Form Card */
          <div className="bg-white  shadow-sm border border-gray-200 overflow-hidden rounded-xl border">
            
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

            {/* Business Form */}
            <form onSubmit={onSubmit} className="p-6 space-y-8">
              
              {/* Basic Information Section */}
              <section>
                <h3 className="text-base font-semibold text-gray-900 mb-4">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Business Name (Required) */}
                  <div className="md:col-span-2">
                    <label className={LABEL_CLASS}>
                      Business Name <span className="text-red-500">*</span>
                    </label>
                    <input 
                      type="text" 
                      value={form.business_name || form.name || ""} 
                      onChange={(e) => handleInputChange('business_name', e.target.value)} 
                      required 
                      className={INPUT_CLASS} 
                      placeholder="Enter business name" 
                    />
                  </div>

                  {/* Slug */}
                  <div>
                    <label className={LABEL_CLASS}>Slug</label>
                    <input 
                      type="text" 
                      value={form.slug || ""} 
                      onChange={(e) => handleInputChange('slug', e.target.value)} 
                      className={INPUT_CLASS} 
                      placeholder="business-slug" 
                    />
                  </div>

                  {/* Industry Type */}
                  <div>
                    <label className={LABEL_CLASS}>Industry Type</label>
                    <select 
                      value={form.industry_type || ""} 
                      onChange={(e) => handleInputChange('industry_type', e.target.value)} 
                      className={INPUT_CLASS}
                    >
                      <option value={form.industry_type}>{form.industry_type}</option>
                      {INDUSTRY_TYPES.map((type) => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>

                  {/* Logo Upload */}
                  <div className="md:col-span-2">
                    <label className={LABEL_CLASS}>Business Logo</label>
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
                    
                    {/* Logo Preview */}
                    {form.logo && (
                      <div className="mt-3 flex items-center space-x-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <img 
                          src={form.logo.startsWith('data:') ? form.logo : `http://localhost:8001/storage/${form.logo}`}
                          alt="Logo preview" 
                          className="w-12 h-12 rounded object-cover border border-blue-300" 
                        />
                        <span className="text-sm text-gray-700">
                          {form.logo.startsWith('data:') ? 'New logo uploaded' : 'Current logo'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </section>
              
              {/* Contact Information Section */}
              <section>
                <h3 className="text-base font-semibold text-gray-900 mb-4">Contact Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Phone Number */}
                  <input 
                    type="tel" 
                    placeholder="Phone number" 
                    value={form.phone || ""} 
                    onChange={(e) => handleInputChange('phone', e.target.value)} 
                    className={INPUT_CLASS} 
                  />

                  {/* Website */}
                  <input 
                    type="url" 
                    placeholder="Website URL" 
                    value={form.website || ""} 
                    onChange={(e) => handleInputChange('website', e.target.value)} 
                    className={INPUT_CLASS} 
                  />

                  {/* Country */}
                  <select 
                    value={form.country || ""} 
                    onChange={(e) => handleInputChange('country', e.target.value)} 
                    className={INPUT_CLASS}
                  >
                    <option value="">Select country</option>
                    {COUNTRIES.map((country) => (
                      <option key={country} value={country}>{country}</option>
                    ))}
                  </select>

                  {/* State/Province */}
                  <input 
                    type="text" 
                    placeholder="State/Province" 
                    value={form.state || ""} 
                    onChange={(e) => handleInputChange('state', e.target.value)} 
                    className={INPUT_CLASS} 
                  />

                  {/* City */}
                  <input 
                    type="text" 
                    placeholder="City" 
                    value={form.city || ""} 
                    onChange={(e) => handleInputChange('city', e.target.value)} 
                    className={INPUT_CLASS} 
                  />

                  {/* Address */}
                  <div className="md:col-span-2">
                    <textarea 
                      rows={2} 
                      placeholder="Full address" 
                      value={form.address || ""} 
                      onChange={(e) => handleInputChange('address', e.target.value)} 
                      className={INPUT_CLASS} 
                    />
                  </div>
                </div>
              </section>

              {/* Business Settings Section */}
              <section>
                <h3 className="text-base font-semibold text-gray-900 mb-4">Business Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  
                  {/* Subscription Type */}
                  <div>
                    <label className={LABEL_CLASS}>Subscription</label>
                    <select 
                      value={form.subscription || ""} 
                      onChange={(e) => handleInputChange('subscription', e.target.value)} 
                      className={INPUT_CLASS}
                    >
                      {SUBSCRIPTION_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Billing Cycle */}
                  <div>
                    <label className={LABEL_CLASS}>Billing Cycle</label>
                    <select 
                      value={form.subscription_plan || ""} 
                      onChange={(e) => handleInputChange('subscription_plan', e.target.value)} 
                      className={INPUT_CLASS}
                    >
                      {SUBSCRIPTION_PLANS.map((plan) => (
                        <option key={plan} value={plan}>
                          {plan.charAt(0).toUpperCase() + plan.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Currency */}
                  <div>
                    <label className={LABEL_CLASS}>Currency</label>
                    <select 
                      value={form.currency || ""} 
                      onChange={(e) => handleInputChange('currency', e.target.value)} 
                      className={INPUT_CLASS}
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
                  
                  {/* Language */}
                  <div>
                    <label className={LABEL_CLASS}>Language</label>
                    <select 
                      value={form.language || ""} 
                      onChange={(e) => handleInputChange('language', e.target.value)} 
                      className={INPUT_CLASS}
                    >
                      {LANGUAGES.map((lang) => (
                        <option key={lang} value={lang}>{lang.toUpperCase()}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </section>

              {/* About Section */}
              <section>
                <h3 className="text-base font-semibold text-gray-900 mb-4">About</h3>
                <textarea 
                  rows={3} 
                  placeholder="Brief description of your business..." 
                  value={form.about_business || ""} 
                  onChange={(e) => handleInputChange('about_business', e.target.value)} 
                  className={INPUT_CLASS} 
                  maxLength={300} 
                />
                <div className="flex justify-between items-center mt-2">
                  <span className="text-xs text-gray-500">{(form.about_business || "").length}/300 characters</span>
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
                  {isSubmitting ? "Updating..." : "Update Business"}
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* No Business Found State */
          <div className="text-center py-12">
            <p className="text-gray-500">No business found.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EditBusinessPage;