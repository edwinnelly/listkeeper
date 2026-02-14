"use client";
import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  MailRegular,
  LockClosedRegular,
  EyeRegular,
  EyeOffRegular,
  ChevronRightRegular,
  InfoRegular,
  ShieldRegular,
  ErrorCircleRegular,
  CheckmarkCircleRegular,
  PersonRegular,
  WindowRegular
} from "@fluentui/react-icons";
import api from "@/lib/axios";
import Cookies from "js-cookie";

const RegisterPage = () => {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    password_confirmation: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Handle scroll events for the page
  useEffect(() => {
    const handleScroll = () => {
      if (containerRef.current) {
        const scrollTop = containerRef.current.scrollTop;
        setIsScrolled(scrollTop > 20);
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener("scroll", handleScroll);
      return () => container.removeEventListener("scroll", handleScroll);
    }
  }, []);

  // Handle hash changes for in-page navigation
  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash) {
        const element = document.getElementById(window.location.hash.substring(1));
        if (element && containerRef.current) {
          const container = containerRef.current;
          const elementRect = element.getBoundingClientRect();
          const containerRect = container.getBoundingClientRect();
          
          container.scrollTo({
            top: element.offsetTop - containerRect.top + container.scrollTop,
            behavior: 'smooth'
          });
        }
      }
    };

    // Initial check
    handleHashChange();
    
    // Listen for hash changes
    window.addEventListener("hashchange", handleHashChange);
    
    return () => {
      window.removeEventListener("hashchange", handleHashChange);
    };
  }, []);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      setIsTablet(width >= 768 && width < 1024);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      await api.get("/sanctum/csrf-cookie");
      const csrfToken = Cookies.get("XSRF-TOKEN");
      await api.post("/register", form, {
        headers: {
          "X-XSRF-TOKEN": csrfToken || "",
        },
      });
      setSuccess("Inventory account created successfully! Redirecting to dashboard...");
      setTimeout(() => {
        router.push("/dashboard");
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !loading) {
      const formElement = e.currentTarget.closest("form");
      formElement?.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
    }
  };

  if (loading && success) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50 z-50">
        <div className="flex flex-col items-center">
          <div className="relative">
            <div className="h-14 w-14 rounded-full border-2 border-slate-200"></div>
            <div className="absolute top-0 left-0 h-14 w-14 rounded-full border-2 border-blue-600 border-t-transparent animate-spin"></div>
          </div>
          <p className="mt-4 text-slate-600 text-sm font-medium text-center">Setting up your inventory account...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative" style={{ height: '100vh' }}>
      {/* Fixed Background */}
      <div className="fixed inset-0 -z-10">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: 'url("/asset/similar-10073860.jpeg")' }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-blue-800/80 to-blue-700/70" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
        </div>
      </div>
      
      {/* Scrollable Container */}
      <div 
        ref={containerRef}
        className="h-full overflow-y-auto"
        style={{
          scrollBehavior: 'smooth',
          WebkitOverflowScrolling: 'touch'
        }}
      >
        {/* Content */}
        <div className="min-h-full flex flex-col">
          {/* Optional Sticky Navbar Example */}
          <motion.nav
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            className={`sticky top-0 z-30 transition-all duration-300 ${
              isScrolled ? 'bg-white/10 backdrop-blur-md border-b border-white/20' : 'bg-transparent'
            }`}
          >
            <div className="container mx-auto px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <img 
                    src="https://cdn4.iconfinder.com/data/icons/logos-and-brands/512/44_Bitbucket_logo_logos-256.png" 
                    alt="ListKeeping Logo" 
                    className="h-8 w-8"
                  />
                  <span className="text-white font-bold text-lg">ListKeeping</span>
                </div>
                <div className="flex items-center space-x-4">
                  <a 
                    href="#terms" 
                    className="text-white/80 hover:text-white text-sm transition-colors"
                    onClick={(e) => {
                      e.preventDefault();
                      const element = document.getElementById('terms-section');
                      if (element && containerRef.current) {
                        const container = containerRef.current;
                        const elementRect = element.getBoundingClientRect();
                        const containerRect = container.getBoundingClientRect();
                        
                        container.scrollTo({
                          top: element.offsetTop - containerRect.top + container.scrollTop - 80,
                          behavior: 'smooth'
                        });
                      }
                    }}
                  >
                    Terms
                  </a>
                  <Link
                    href="/auth"
                    className="text-white hover:text-blue-200 text-sm transition-colors"
                  >
                    Sign In
                  </Link>
                </div>
              </div>
            </div>
          </motion.nav>

          {/* Main Content */}
          <div className="flex-1 flex items-center justify-center p-3 sm:p-4 md:p-6 lg:p-8">
            <div className="w-full max-w-6xl flex flex-col lg:flex-row gap-4 sm:gap-6 md:gap-8 lg:gap-12">
              {/* Left Side - Inventory System Info */}
              {!isMobile && (
                <motion.div
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6 }}
                  className="lg:w-2/5 flex flex-col justify-center text-white"
                >
                  <div className="space-y-6 md:space-y-8 p-4 md:p-6 lg:p-8">
                    <div className="flex items-center space-x-3">
                      <img 
                        src="https://cdn4.iconfinder.com/data/icons/logos-and-brands/512/44_Bitbucket_logo_logos-256.png" 
                        alt="ListKeeping Logo" 
                        className={`${isTablet ? 'h-10' : 'h-12 lg:h-14'}`}
                      />
                      <span className={`${isTablet ? 'text-2xl' : 'text-3xl lg:text-4xl'} font-bold`}>ListKeeping</span>
                    </div>
                    
                    <div className="space-y-4 md:space-y-6">
                      <h2 className={`${isTablet ? 'text-3xl' : 'text-3xl lg:text-3xl'} font-bold leading-tight`}>
                        Get Complete Stock Control
                      </h2>
                      <p className={`${isTablet ? 'text-base' : 'text-lg lg:text-xl'} opacity-90`}>
                        Register for access to real-time inventory tracking, automated stock alerts, and comprehensive warehouse management tools.
                      </p>
                    </div>

                    <div className="space-y-4 md:space-y-6 pt-4 md:pt-8">
                      <div className="flex items-start space-x-3">
                        <div className="p-2 bg-white/10 rounded-lg flex-shrink-0">
                          <ShieldRegular className={`${isTablet ? 'w-5 h-5' : 'w-6 h-6'}`} />
                        </div>
                        <div className="flex-1">
                          <h3 className={`${isTablet ? 'text-base' : 'text-lg'} font-semibold`}>Inventory Security</h3>
                          <p className={`${isTablet ? 'text-sm' : 'text-base'} text-white/80`}>Role-based access control to protect your stock data</p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-3">
                        <div className="p-2 bg-white/10 rounded-lg flex-shrink-0">
                          <InfoRegular className={`${isTablet ? 'w-5 h-5' : 'w-6 h-6'}`} />
                        </div>
                        <div className="flex-1">
                          <h3 className={`${isTablet ? 'text-base' : 'text-lg'} font-semibold`}>Real-Time Analytics</h3>
                          <p className={`${isTablet ? 'text-sm' : 'text-base'} text-white/80`}>Monitor stock levels and turnover rates across all locations</p>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 md:pt-8">
                      <div className={`flex ${isTablet ? 'flex-wrap gap-4' : 'items-center space-x-4'} text-sm text-white/70`}>
                        <div className={`${isTablet ? 'w-1/3 min-w-[100px]' : 'text-center'}`}>
                          <div className="text-lg font-bold">15K+</div>
                          <div>Products Tracked</div>
                        </div>
                        {!isTablet && <div className="h-8 w-px bg-white/30"></div>}
                        <div className={`${isTablet ? 'w-1/3 min-w-[100px]' : 'text-center'}`}>
                          <div className="text-lg font-bold">500+</div>
                          <div>Warehouses</div>
                        </div>
                        {!isTablet && <div className="h-8 w-px bg-white/30"></div>}
                        <div className={`${isTablet ? 'w-1/3 min-w-[100px]' : 'text-center'}`}>
                          <div className="text-lg font-bold">99.8%</div>
                          <div>Accuracy Rate</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Right Side - Registration Form */}
              <motion.div
                initial={{ opacity: 0, x: isMobile ? 0 : 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: isMobile ? 0 : 0.2 }}
                className={`${isMobile ? 'w-full' : 'lg:w-3/5'} ${isTablet ? 'w-full' : ''}`}
              >
                <div className="bg-white/95 backdrop-blur-lg rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-6 md:p-8 lg:p-10 border border-white/20">
                  <div className="mb-6 md:mb-8">
                    <h2 className={`${isMobile ? 'text-2xl' : 'text-3xl'} font-bold text-slate-900 text-center`}>
                      KeepListing
                    </h2>
                    <p className="text-slate-600 mt-2 text-center text-sm sm:text-base">
                      Create an account to access your business management system
                    </p>
                  </div>

                  <form className="space-y-4 sm:space-y-6" onSubmit={handleSubmit}>
                    <AnimatePresence>
                      {error && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="flex items-start p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg"
                        >
                          <ErrorCircleRegular className="text-red-600 w-5 h-5 mr-3 flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-red-600">{error}</span>
                        </motion.div>
                      )}
                      
                      {success && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="flex items-start p-3 sm:p-4 bg-green-50 border border-green-200 rounded-lg"
                        >
                          <CheckmarkCircleRegular className="text-green-600 w-5 h-5 mr-3 flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-green-600">{success}</span>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">
                          Full Name
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            name="name"
                            value={form.name}
                            onChange={handleChange}
                            onKeyDown={handleKeyDown}
                            placeholder="Warehouse Manager"
                            required
                            className="w-full px-4 py-3 pl-11 rounded-lg border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 outline-none transition-all bg-white text-sm sm:text-base"
                            disabled={loading || !!success}
                          />
                          <PersonRegular className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">
                          Work Email Address
                        </label>
                        <div className="relative">
                          <input
                            type="email"
                            name="email"
                            value={form.email}
                            onChange={handleChange}
                            onKeyDown={handleKeyDown}
                            placeholder="inventory@company.com"
                            required
                            className="w-full px-4 py-3 pl-11 rounded-lg border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 outline-none transition-all bg-white text-sm sm:text-base"
                            disabled={loading || !!success}
                          />
                          <MailRegular className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">
                          System Password
                        </label>
                        <div className="relative">
                          <input
                            type={showPassword ? "text" : "password"}
                            name="password"
                            value={form.password}
                            onChange={handleChange}
                            onKeyDown={handleKeyDown}
                            placeholder="Create secure password"
                            required
                            className="w-full px-4 py-3 pl-11 pr-10 rounded-lg border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 outline-none transition-all bg-white text-sm sm:text-base"
                            disabled={loading || !!success}
                          />
                          <LockClosedRegular className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                            disabled={loading || !!success}
                            aria-label={showPassword ? "Hide password" : "Show password"}
                          >
                            {showPassword ? (
                              <EyeOffRegular className="w-5 h-5" />
                            ) : (
                              <EyeRegular className="w-5 h-5" />
                            )}
                          </button>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          Minimum 8 characters required
                        </p>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">
                          Confirm Password
                        </label>
                        <div className="relative">
                          <input
                            type={showConfirmPassword ? "text" : "password"}
                            name="password_confirmation"
                            value={form.password_confirmation}
                            onChange={handleChange}
                            onKeyDown={handleKeyDown}
                            placeholder="Re-enter password"
                            required
                            className="w-full px-4 py-3 pl-11 pr-10 rounded-lg border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 outline-none transition-all bg-white text-sm sm:text-base"
                            disabled={loading || !!success}
                          />
                          <LockClosedRegular className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                            disabled={loading || !!success}
                            aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                          >
                            {showConfirmPassword ? (
                              <EyeOffRegular className="w-5 h-5" />
                            ) : (
                              <EyeRegular className="w-5 h-5" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start space-x-2">
                      <input
                        type="checkbox"
                        id="terms"
                        required
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-600 mt-1 flex-shrink-0"
                        disabled={loading || !!success}
                      />
                      <label htmlFor="terms" className="text-sm text-slate-600 leading-tight">
                        I agree to the{" "}
                        <Link href="/terms" className="text-blue-600 hover:underline inline">
                          Inventory Management Policy
                        </Link>{" "}
                        and{" "}
                        <Link href="/privacy" className="text-blue-600 hover:underline inline">
                          Data Security Agreement
                        </Link>
                      </label>
                    </div>

                    <button
                      type="submit"
                      disabled={loading || !!success}
                      className="w-full bg-gradient-to-r from-blue-600 to-blue-800 text-white py-3 sm:py-4 rounded-lg font-semibold hover:from-blue-700 hover:to-blue-900 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed transition-all flex items-center justify-center space-x-2 sm:space-x-3 shadow-lg text-sm sm:text-base"
                    >
                      {loading ? (
                        <>
                          <div className="h-4 w-4 sm:h-5 sm:w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Creating Account...</span>
                        </>
                      ) : success ? (
                        <>
                          <CheckmarkCircleRegular className="w-5 h-5 sm:w-6 sm:h-6" />
                          <span>Account Created!</span>
                        </>
                      ) : (
                        <>
                          <span>Create Inventory Account</span>
                          <ChevronRightRegular className="w-5 h-5 sm:w-6 sm:h-6" />
                        </>
                      )}
                    </button>

                    <div className="relative my-4 sm:my-6">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-slate-300"></div>
                      </div>
                      <div className="relative flex justify-center text-sm">
                        <span className="px-3 bg-white text-slate-500 text-xs sm:text-sm">Or register with</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="w-full py-2 sm:py-3 rounded-lg border border-slate-300 hover:bg-slate-50 transition-colors flex items-center justify-center space-x-2 sm:space-x-3 shadow-sm text-sm sm:text-base"
                      disabled={loading || !!success}
                    >
                      <WindowRegular className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                      <span className="text-slate-700 font-medium">Warehouse Terminal Registration</span>
                    </button>
                  </form>

                  {/* Example of hash-scrollable section */}
                  <div id="terms-section" className="mt-8 sm:mt-10 pt-6 sm:pt-8 border-t border-slate-200">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">Terms & Conditions</h3>
                    <div className="text-sm text-slate-600 space-y-3 max-h-40 overflow-y-auto pr-2">
                      <p>By registering, you agree to our inventory management policies...</p>
                      <p>All stock data is encrypted and protected...</p>
                      <p>You are responsible for maintaining accurate inventory records...</p>
                      <p>System access is monitored for security purposes...</p>
                    </div>
                  </div>

                  <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-slate-200">
                    <p className="text-center text-slate-600 text-sm sm:text-base">
                      Already have inventory access?{" "}
                      <Link
                        href="/auth"
                        className="text-blue-600 hover:text-blue-800 font-semibold transition-colors inline"
                      >
                        Sign in to system
                      </Link>
                    </p>
                    <p className="text-center text-xs text-slate-500 mt-2 break-words px-2">
                      Contact Inventory Support: inventory-support@company.com
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Footer */}
          <footer className="py-4 px-4 border-t border-white/10 mt-8">
            <div className="container mx-auto">
              <p className="text-center text-white/60 text-sm">
                &copy; {new Date().getFullYear()} ListKeeping. All rights reserved.
              </p>
            </div>
          </footer>
        </div>
      </div>

      {/* Mobile-specific optimizations */}
      {isMobile && (
        <div className="fixed bottom-4 left-4 right-4 z-20">
          <div className="bg-black/60 backdrop-blur-sm rounded-lg p-4 text-white text-center">
            <p className="text-sm">ListKeeping • Professional Inventory Management</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default RegisterPage;