"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import {
  Calculator,
  Users as UsersIcon,
  CreditCard,
  BookOpen,
  ChevronDown,
  ChevronRight,
  Star,
  Building,
  Zap,
  Sparkles,
  Calendar,
  Lightbulb,
  Search,
  FileText,
  GraduationCap,
  Download,
  Cloud,
  Receipt,
  TrendingUp,
  BarChart3,
  Package,
  Upload,
  Mobile,
  MessageSquare,
  Phone,
  MessageCircle,
  Menu,
  X,
  Briefcase,
  Shield,
  Globe,
  Award,
  Target,
  Settings,
  Bell,
  ArrowRight,
  Mail,
  CheckCircle,
  Headphones,
  Grid,
  Warehouse,
  Lock,
  LineChart,
  ShieldCheck,
  Globe2,
  Zap as Lightning,
  Database,
  Truck,
  Cpu,
  AlertTriangle,
  PieChart,
  Layers,
  RefreshCw,
  Smartphone as MobileIcon,
  Check,
  Clock,
  HelpCircle,
  Award as AwardIcon,
  ArrowUpRight,
  Monitor,
  Smartphone,
  Tablet,
  Laptop,
  Server,
  Database as DatabaseIcon,
  Cpu as CpuIcon,
  Wifi,
  Shield as ShieldIcon,
  Globe as GlobeIcon,
  Users,
  FolderOpen,
  Eye,
  BarChart,
  ShoppingCart,
  Truck as TruckIcon,
  FileBarChart,
  ClipboardCheck,
  Percent,
  DollarSign,
  Tag,
  PieChart as PieChartIcon,
  PlayCircle,
  ShieldCheck as ShieldCheckIcon,
  CloudLightning,
  CheckSquare,
  Target as TargetIcon,
  GitBranch,
  AlertCircle,
  MapPin,
  Bell as BellIcon,
  BarChart as BarChart2,
  Key,
  Package as Package2,
  Store,
  Pill,
  Truck as Truck2,
  Layers as Layers2,
  UserCheck,
  ArrowRight as ArrowRight2,
  Check as Check2,
  Home,
  ShoppingBag,
  Pill as PillIcon
} from "lucide-react";

// Professional menu data structure
const menuData = {
  main: [
    {
      id: "quickbooks",
      label: "QuickBooks",
      description: "Business Accounting Solutions",
      icon: <Calculator className="w-4 h-4" />,
      megaMenu: true,
      columns: [
        {
          title: "For Business",
          description: "Complete solutions for enterprises",
          links: [
            { label: "Overview", href: "/quickbooks/business", icon: <Building className="w-4 h-4" /> },
            { label: "Features", href: "/quickbooks/business/features", icon: <Star className="w-4 h-4" /> },
            { 
              label: "Plans & Pricing", 
              href: "/pricing", 
              icon: <CreditCard className="w-4 h-4" />,
              badge: "Compare",
              featured: true
            },
            { 
              label: "QuickBooks Online Advanced", 
              href: "/quickbooks/advanced", 
              icon: <Zap className="w-4 h-4" />,
              badge: "New",
              description: "For larger businesses with complex needs"
            },
          ]
        },
        {
          title: "Helpful Resources",
          description: "Tools and support for success",
          links: [
            { 
              label: "Small Business Resources", 
              href: "/resources/business", 
              icon: <BookOpen className="w-4 h-4" /> 
            },
            { 
              label: "Find Certified Advisor", 
              href: "/advisors", 
              icon: <UsersIcon className="w-4 h-4" />,
              description: "Expert bookkeepers and accountants"
            },
          ]
        },
        {
          title: "Core Features",
          description: "Most used capabilities",
          features: true,
          items: [
            { label: "Bank Feeds", icon: <Download className="w-4 h-4" /> },
            { label: "Cloud Accounting", icon: <Cloud className="w-4 h-4" /> },
            { label: "Invoicing", icon: <Receipt className="w-4 h-4" /> },
            { label: "Project Profitability", icon: <TrendingUp className="w-4 h-4" /> },
            { label: "Accounting Reports", icon: <BarChart3 className="w-4 h-4" /> },
            { label: "Inventory Management", icon: <Package className="w-4 h-4" /> },
          ],
          cta: { label: "View all features", href: "/features", icon: <ChevronRight className="w-4 h-4" /> }
        }
      ]
    },
    {
      id: "accountants",
      label: "For Accountants",
      description: "Professional Tools",
      icon: <UsersIcon className="w-4 h-4" />,
      megaMenu: true,
      columns: [
        {
          title: "Accountant Solutions",
          description: "Tools for accounting professionals",
          links: [
            { 
              label: "Overview", 
              href: "/accountants", 
              icon: <Briefcase className="w-4 h-4" />,
              description: "Complete software suite for professionals"
            },
            { 
              label: "QuickBooks Ledger", 
              href: "/accountants/ledger", 
              icon: <FileText className="w-4 h-4" />,
              badge: "New",
              description: "For low transacting clients"
            },
            { 
              label: "Online Advanced", 
              href: "/accountants/advanced", 
              icon: <Zap className="w-4 h-4" />,
              badge: "New",
              description: "For growing businesses"
            },
          ]
        },
        {
          title: "Resources",
          description: "Learning and support",
          links: [
            { 
              label: "Getting Started", 
              href: "/accountants/start", 
              icon: <Sparkles className="w-4 h-4" /> 
            },
            { 
              label: "Training Webinars", 
              href: "/accountinasst-webinars", 
              icon: <Calendar className="w-4 h-4" /> 
            },
            { 
              label: "Business Insights", 
              href: "/accountants/insights", 
              icon: <Lightbulb className="w-4 h-4" /> 
            },
            { 
              label: "Support Center", 
              href: "/support", 
              icon: <Search className="w-4 h-4" /> 
            },
          ]
        }
      ]
    },
    {
      id: "pricing",
      label: "Pricing",
      description: "Transparent Plans",
      icon: <CreditCard className="w-4 h-4" />,
      href: "/pricing"
    },
    {
      id: "resources",
      label: "Resources",
      description: "Learn & Support",
      icon: <BookOpen className="w-4 h-4" />,
      dropdown: true,
      items: [
        { 
          label: "Documentation", 
          href: "/docs", 
          icon: <FileText className="w-4 h-4" /> 
        },
        { 
          label: "Tutorials & Guides", 
          href: "/tutorials", 
          icon: <GraduationCap className="w-4 h-4" /> 
        },
        { 
          label: "Webinars", 
          href: "/webinars", 
          icon: <Calendar className="w-4 h-4" /> 
        },
        { 
          label: "Community Forum", 
          href: "/community", 
          icon: <UsersIcon className="w-4 h-4" /> 
        },
        { 
          label: "Blog & Insights", 
          href: "/blog", 
          icon: <BookOpen className="w-4 h-4" /> 
        },
      ]
    }
  ],
  support: [
    {
      id: "contact",
      label: "Contact Sales",
      href: "/contact-sales",
      icon: <MessageSquare className="w-4 h-4" />
    },
    {
      id: "support",
      label: "Get Support",
      href: "/support",
      icon: <Phone className="w-4 h-4" />
    },
    {
      id: "students",
      label: "Student Program",
      href: "/students",
      badge: "Free Account"
    }
  ]
};

export default function ProfessionalLandingPage() {
  const [email, setEmail] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.2], [1, 0.95]);

  // Core features for SMBs
  const features = [
    {
      icon: <Package2 className="w-6 h-6" />,
      title: "Real-Time Stock Tracking",
      description: "Track inventory levels in real-time across all locations with automatic updates",
      color: "from-blue-600 to-blue-800",
      gradient: "bg-gradient-to-br from-blue-600/10 to-blue-800/10"
    },
    {
      icon: <MapPin className="w-6 h-6" />,
      title: "Multi-Location Management",
      description: "Manage inventory across multiple warehouses, stores, and fulfillment centers",
      color: "from-emerald-600 to-emerald-800",
      gradient: "bg-gradient-to-br from-emerald-600/10 to-emerald-800/10"
    },
    {
      icon: <BellIcon className="w-6 h-6" />,
      title: "Low-Stock Alerts",
      description: "Automatic alerts when inventory reaches minimum thresholds",
      color: "from-amber-600 to-amber-800",
      gradient: "bg-gradient-to-br from-amber-600/10 to-amber-800/10"
    },
    {
      icon: <BarChart2 className="w-6 h-6" />,
      title: "Sales & Inventory Reports",
      description: "Generate comprehensive reports for better decision making",
      color: "from-purple-600 to-purple-800",
      gradient: "bg-gradient-to-br from-purple-600/10 to-purple-800/10"
    },
    {
      icon: <Key className="w-6 h-6" />,
      title: "Role-Based Access",
      description: "Control permissions for staff, managers, and administrators",
      color: "from-indigo-600 to-indigo-800",
      gradient: "bg-gradient-to-br from-indigo-600/10 to-indigo-800/10"
    },
    {
      icon: <ShieldIcon className="w-6 h-6" />,
      title: "Barcode Scanning",
      description: "Quick inventory updates with mobile barcode scanning",
      color: "from-rose-600 to-rose-800",
      gradient: "bg-gradient-to-br from-rose-600/10 to-rose-800/10"
    }
  ];

  // Benefits section
  const benefits = [
    {
      icon: <TrendingUp className="w-5 h-5" />,
      title: "Reduce Losses",
      description: "Minimize stockouts, overstocking, and shrinkage with accurate tracking",
      stat: "Up to 40% reduction in inventory costs"
    },
    {
      icon: <CheckCircle className="w-5 h-5" />,
      title: "Improve Accuracy",
      description: "Eliminate manual errors with automated inventory counting",
      stat: "99.8% inventory accuracy"
    },
    {
      icon: <Clock className="w-5 h-5" />,
      title: "Save Time",
      description: "Automate inventory processes and reduce manual work",
      stat: "Save 15+ hours per week"
    }
  ];

  // Use cases
  const useCases = [
    {
      icon: <Store className="w-6 h-6" />,
      title: "Retail",
      description: "Manage store inventory, track sales, and optimize stock levels",
      color: "bg-blue-50 text-blue-700"
    },
    {
      icon: <Warehouse className="w-6 h-6" />,
      title: "Warehouses",
      description: "Track pallets, bins, and locations with real-time updates",
      color: "bg-emerald-50 text-emerald-700"
    },
    {
      icon: <PillIcon className="w-6 h-6" />,
      title: "Pharmacies",
      description: "Monitor medication stock and expiration dates",
      color: "bg-purple-50 text-purple-700"
    },
    {
      icon: <Truck2 className="w-6 h-6" />,
      title: "Distributors",
      description: "Track shipments, manage vendor orders, and optimize logistics",
      color: "bg-amber-50 text-amber-700"
    }
  ];

  // Onboarding steps
  const onboardingSteps = [
    {
      step: "1",
      icon: <UserCheck className="w-6 h-6" />,
      title: "Create Account",
      description: "Sign up in minutes with your business email"
    },
    {
      step: "2",
      icon: <Package2 className="w-6 h-6" />,
      title: "Add Products",
      description: "Import your inventory or add products manually"
    },
    {
      step: "3",
      icon: <LineChart className="w-6 h-6" />,
      title: "Track Inventory",
      description: "Start managing and optimizing your stock levels"
    }
  ];

  // Testimonials
  const testimonials = [
    {
      name: "Michael Rodriguez",
      role: "Retail Store Owner",
      company: "Urban Styles Boutique",
      content: "Inventory Pro cut our stockout issues by 85% in the first month. Our customers are happier, and we're saving thousands.",
      rating: 5,
      avatar: "MR"
    },
    {
      name: "Sarah Chen",
      role: "Warehouse Manager",
      company: "TechSupply Inc.",
      content: "The multi-location feature saved us 20+ hours weekly. Real-time tracking across 3 warehouses is a game-changer.",
      rating: 5,
      avatar: "SC"
    },
    {
      name: "James Wilson",
      role: "Pharmacy Owner",
      company: "Community Care Pharmacy",
      content: "Expiration date tracking and low-stock alerts have been invaluable for managing our medication inventory.",
      rating: 5,
      avatar: "JW"
    }
  ];

  // Trusted by companies
  const trustedCompanies = [
    { name: "RetailCo", logo: "R" },
    { name: "TechSupply", logo: "T" },
    { name: "UrbanStyles", logo: "U" },
    { name: "QuickMart", logo: "Q" },
    { name: "PharmaPlus", logo: "P" },
    { name: "GlobalDist", logo: "G" }
  ];

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
    }
    setMobileMenuOpen(false);
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 2);
    };

    window.addEventListener("scroll", handleScroll);
    
    if (window.location.hash) {
      const id = window.location.hash.replace("#", "");
      setTimeout(() => {
        scrollToSection(id);
      }, 100);
    }

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [mobileMenuOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenu(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="font-sans bg-white text-gray-900 min-h-screen">
      {/* Top Announcement Bar */}
      <div className="bg-gradient-to-r from-blue-900 to-blue-800 text-white py-2 px-4 text-xs font-medium">
        <div className="max-w-7xl mx-auto flex items-center justify-center space-x-6">
          <div className="flex items-center">
            <Award className="w-3 h-3 mr-2" />
            <span>Trusted by 10,000+ SMBs worldwide</span>
          </div>
          <div className="hidden md:flex items-center">
            <Shield className="w-3 h-3 mr-2" />
            <span>Bank-level security</span>
          </div>
          <div className="hidden lg:flex items-center">
            <Clock className="w-3 h-3 mr-2" />
            <span>30-day free trial</span>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className={`sticky top-0 w-full z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-white/95 backdrop-blur-lg border-b border-gray-100 shadow-sm' 
          : 'bg-white border-b border-gray-100'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="relative w-8 h-8">
                <Image
                  src="/asset/ello.png"
                  alt="Inventory Pro Logo"
                  fill
                  className="object-contain"
                  sizes="32px"
                  priority
                />
              </div>
              <div>
                <div className="text-xl font-bold text-gray-900">Inventory Pro</div>
                <div className="text-[10px] text-blue-600 font-medium uppercase">SMB Inventory Management</div>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-1" ref={menuRef}>
              {menuData.main.map((item) => (
                <div 
                  key={item.id}
                  className="relative"
                  onMouseEnter={() => item.megaMenu && setActiveMenu(item.id)}
                  onMouseLeave={() => setActiveMenu(null)}
                >
                  <button
                    onClick={() => {
                      if (item.href) {
                        window.location.href = item.href;
                      } else {
                        setActiveMenu(activeMenu === item.id ? null : item.id);
                      }
                    }}
                    className={`flex items-center px-4 py-2 text-sm font-medium transition-all duration-200 rounded-lg ${
                      activeMenu === item.id 
                        ? 'text-blue-900 bg-blue-50' 
                        : 'text-gray-700 hover:text-blue-900 hover:bg-gray-50'
                    }`}
                  >
                    {item.icon && <span className="mr-2">{item.icon}</span>}
                    <span>{item.label}</span>
                    {(item.megaMenu || item.dropdown) && (
                      <ChevronDown className={`w-4 h-4 ml-1 transition-transform ${
                        activeMenu === item.id ? 'rotate-180' : ''
                      }`} />
                    )}
                  </button>
                </div>
              ))}
            </div>

            {/* Desktop Auth Section */}
            <div className="hidden lg:flex items-center space-x-3">
              <Link
                href="/login"
                className="text-sm font-medium text-gray-700 hover:text-blue-900 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Sign In
              </Link>
              <button 
                onClick={() => scrollToSection("cta")}
                className="bg-gradient-to-r from-blue-900 to-blue-800 text-white px-4 py-2 rounded-lg font-medium hover:shadow-lg transition-all duration-300 flex items-center space-x-2"
              >
                <span>Get Started</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="lg:hidden text-gray-700 hover:text-blue-900 p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main ref={containerRef} className="w-full">
        {/* Hero Section */}
        <section className="pt-16 pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white to-gray-50">
          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Left Content */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-blue-50 text-blue-900 text-sm font-medium mb-6">
                  <Sparkles className="w-3 h-3 mr-1.5" />
                  Smart Inventory Management
                </div>

                <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6 leading-tight">
                  Take Control of Your
                  <span className="block text-blue-900">Inventory in Real-Time</span>
                </h1>

                <p className="text-lg text-gray-600 mb-8 max-w-2xl leading-relaxed">
                  Inventory Pro helps small to medium businesses streamline stock management, 
                  reduce costs, and grow efficiently with automated tracking and insights.
                </p>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 mb-8">
                  <button 
                    onClick={() => scrollToSection("cta")}
                    className="bg-gradient-to-r from-blue-900 to-blue-800 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all duration-300 flex items-center justify-center space-x-2"
                  >
                    <span>Get Started Free</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => alert("Requesting demo...")}
                    className="bg-white border-2 border-blue-900 text-blue-900 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-all duration-300"
                  >
                    Request a Demo
                  </button>
                </div>

                {/* Trust Badges */}
                <div className="flex items-center space-x-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <ShieldCheck className="w-4 h-4 text-green-500 mr-2" />
                    SOC 2 Certified
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    99.9% Uptime
                  </div>
                </div>
              </motion.div>

              {/* Right Content - Dashboard Preview */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="relative"
              >
                <div className="bg-white rounded-2xl border border-gray-200 shadow-xl overflow-hidden">
                  {/* Dashboard Header */}
                  <div className="bg-gradient-to-r from-gray-900 to-gray-800 px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 rounded-full bg-red-400"></div>
                          <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
                          <div className="w-2 h-2 rounded-full bg-green-400"></div>
                        </div>
                        <div className="text-white text-sm font-medium">Inventory Dashboard</div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <Bell className="w-4 h-4 text-gray-400" />
                        <Settings className="w-4 h-4 text-gray-400" />
                      </div>
                    </div>
                  </div>

                  {/* Main Dashboard */}
                  <div className="p-6">
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="space-y-3">
                        <div className="bg-blue-50 rounded-lg p-3">
                          <div className="text-xs text-blue-900 font-medium mb-1">Total Products</div>
                          <div className="text-xl font-bold text-gray-900">1,247</div>
                        </div>
                        <div className="bg-emerald-50 rounded-lg p-3">
                          <div className="text-xs text-emerald-900 font-medium mb-1">In Stock</div>
                          <div className="text-xl font-bold text-gray-900">1,104</div>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="bg-amber-50 rounded-lg p-3">
                          <div className="text-xs text-amber-900 font-medium mb-1">Low Stock</div>
                          <div className="text-xl font-bold text-gray-900">18</div>
                        </div>
                        <div className="bg-rose-50 rounded-lg p-3">
                          <div className="text-xs text-rose-900 font-medium mb-1">Out of Stock</div>
                          <div className="text-xl font-bold text-gray-900">23</div>
                        </div>
                      </div>
                    </div>

                    {/* Chart Placeholder */}
                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="text-sm font-medium text-gray-900">Stock Trends</div>
                        <div className="text-xs text-gray-500">Last 30 days</div>
                      </div>
                      <div className="h-32 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg flex items-center justify-center">
                        <BarChart className="w-8 h-8 text-blue-900/50" />
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Trusted By Section */}
        <section className="py-12 bg-white border-y border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8">
              <p className="text-sm text-gray-600 font-medium">TRUSTED BY THOUSANDS OF BUSINESSES</p>
            </div>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-8">
              {trustedCompanies.map((company, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="flex flex-col items-center"
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-900 to-blue-800 rounded-lg flex items-center justify-center text-white font-bold text-lg mb-2">
                    {company.logo}
                  </div>
                  <div className="text-sm font-medium text-gray-700">{company.name}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Everything You Need for
                <span className="block text-blue-900">Efficient Inventory Control</span>
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Powerful features designed specifically for small to medium businesses
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="bg-white rounded-xl p-6 hover:shadow-lg transition-all duration-300 border border-gray-200"
                >
                  <div className={`w-12 h-12 rounded-xl ${feature.gradient} flex items-center justify-center mb-4`}>
                    <div className={`bg-gradient-to-br ${feature.color} bg-clip-text text-transparent`}>
                      {feature.icon}
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-gray-600 text-sm">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Grow Your Business with
                <span className="block text-blue-900">Better Inventory Management</span>
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Transform your inventory from a cost center to a profit driver
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {benefits.map((benefit, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.2 }}
                  viewport={{ once: true }}
                  className="text-center"
                >
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-900 to-blue-800 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <div className="text-white">
                      {benefit.icon}
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">{benefit.title}</h3>
                  <p className="text-gray-600 mb-4">{benefit.description}</p>
                  <div className="text-lg font-bold text-blue-900">{benefit.stat}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Use Cases */}
        <section className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Perfect for Every Business
                <span className="block text-blue-900">Type and Size</span>
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Customized solutions for your specific industry needs
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {useCases.map((useCase, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="bg-white rounded-xl p-6 hover:shadow-lg transition-all duration-300 border border-gray-200"
                >
                  <div className={`w-12 h-12 ${useCase.color} rounded-lg flex items-center justify-center mb-4`}>
                    {useCase.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{useCase.title}</h3>
                  <p className="text-gray-600 text-sm">{useCase.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Dashboard Preview */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Visualize Your Inventory
                <span className="block text-blue-900">With Powerful Analytics</span>
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Get real-time insights and make data-driven decisions
              </p>
            </div>

            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-8 lg:p-12">
              <div className="grid lg:grid-cols-2 gap-8 items-center">
                <div>
                  <h3 className="text-2xl font-bold text-white mb-4">Complete Inventory Visibility</h3>
                  <p className="text-gray-300 mb-6">
                    Monitor stock levels, track trends, and generate reports all from one intuitive dashboard.
                  </p>
                  <div className="space-y-4">
                    {[
                      "Real-time stock level monitoring",
                      "Sales performance analytics",
                      "Inventory turnover reports",
                      "Automated reorder suggestions",
                      "Multi-location tracking",
                      "Custom reporting dashboard"
                    ].map((item, index) => (
                      <div key={index} className="flex items-center">
                        <CheckCircle className="w-5 h-5 text-green-400 mr-3" />
                        <span className="text-white">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="relative">
                  <div className="bg-white rounded-xl shadow-2xl overflow-hidden">
                    <div className="p-4 border-b border-gray-200">
                      <div className="flex items-center space-x-2">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 rounded-full bg-red-400"></div>
                          <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
                          <div className="w-2 h-2 rounded-full bg-green-400"></div>
                        </div>
                        <div className="text-sm font-medium text-gray-900">Inventory Analytics</div>
                      </div>
                    </div>
                    <div className="p-6">
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="bg-blue-50 rounded-lg p-4">
                          <div className="text-xs text-blue-900 font-medium mb-1">Top Products</div>
                          <div className="text-xl font-bold text-gray-900">12</div>
                        </div>
                        <div className="bg-emerald-50 rounded-lg p-4">
                          <div className="text-xs text-emerald-900 font-medium mb-1">Fast Moving</div>
                          <div className="text-xl font-bold text-gray-900">48</div>
                        </div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="text-sm font-medium text-gray-900">Monthly Sales Trend</div>
                          <div className="text-xs text-gray-500">This month</div>
                        </div>
                        <div className="h-24 bg-gradient-to-r from-blue-100 to-emerald-100 rounded-lg"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Onboarding Steps */}
        <section className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Get Started in Minutes
                <span className="block text-blue-900">Simple, Fast Onboarding</span>
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Start managing your inventory efficiently in just three easy steps
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {onboardingSteps.map((step, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.2 }}
                  viewport={{ once: true }}
                  className="relative text-center"
                >
                  {index < onboardingSteps.length - 1 && (
                    <div className="hidden md:block absolute top-12 left-3/4 w-full h-0.5 bg-gray-300"></div>
                  )}
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-900 to-blue-800 rounded-2xl flex items-center justify-center mx-auto mb-6 relative">
                    <div className="text-white text-2xl font-bold">{step.step}</div>
                  </div>
                  <div className="w-12 h-12 bg-white rounded-xl border border-gray-200 flex items-center justify-center mx-auto mb-4">
                    {step.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">{step.title}</h3>
                  <p className="text-gray-600">{step.description}</p>
                </motion.div>
              ))}
            </div>

            <div className="text-center mt-12">
              <button 
                onClick={() => scrollToSection("cta")}
                className="inline-flex items-center bg-gradient-to-r from-blue-900 to-blue-800 text-white px-8 py-3 rounded-lg font-semibold hover:shadow-lg transition-all"
              >
                Start Your Free Trial
                <ArrowRight2 className="w-5 h-5 ml-2" />
              </button>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Loved by Businesses
                <span className="block text-blue-900">Just Like Yours</span>
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {testimonials.map((testimonial, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-all"
                >
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-900 to-blue-800 rounded-full flex items-center justify-center text-white font-bold text-lg">
                      {testimonial.avatar}
                    </div>
                    <div className="ml-4">
                      <div className="font-bold text-gray-900">{testimonial.name}</div>
                      <div className="text-sm text-gray-600">{testimonial.role}</div>
                      <div className="text-sm text-blue-900 font-semibold">{testimonial.company}</div>
                    </div>
                  </div>
                  <p className="text-gray-700 mb-6">&ldquo;{testimonial.content}&rdquo;</p>
                  <div className="flex">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section id="cta" className="py-20 bg-gradient-to-br from-blue-900 to-blue-800">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
                Ready to Transform Your
                <span className="block">Inventory Management?</span>
              </h2>
              <p className="text-lg text-blue-100 mb-8 max-w-2xl mx-auto">
                Join thousands of businesses optimizing their inventory with Inventory Pro
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
                <div className="flex-1 max-w-md">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your business email"
                    className="w-full px-4 py-3 rounded-lg border-0 focus:ring-2 focus:ring-white/20 outline-none text-gray-900"
                  />
                </div>
                <button 
                  onClick={() => alert("Starting your free trial...")}
                  className="bg-white text-blue-900 px-8 py-3 rounded-lg font-semibold hover:shadow-lg transition-all whitespace-nowrap"
                >
                  Start Free Trial
                </button>
              </div>
              
              <div className="flex flex-wrap justify-center gap-6 text-blue-200 text-sm">
                <div className="flex items-center">
                  <Check2 className="w-4 h-4 mr-2" />
                  No credit card required
                </div>
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-2" />
                  30-day free trial
                </div>
                <div className="flex items-center">
                  <Shield className="w-4 h-4 mr-2" />
                  Full support included
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-gray-900 text-gray-400 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-4 gap-8 mb-8">
              <div>
                <div className="flex items-center space-x-3 mb-4">
                  <div className="relative w-8 h-8">
                    <Image
                      src="/asset/ello.png"
                      alt="Inventory Pro Logo"
                      fill
                      className="object-contain"
                    />
                  </div>
                  <div className="text-xl font-bold text-white">Inventory Pro</div>
                </div>
                <p className="text-sm">
                  Smart inventory management for growing businesses. 
                  Streamline your operations and boost profitability.
                </p>
              </div>
              
              {[
                {
                  title: "Product",
                  links: ["Features", "Pricing", "API", "Security", "Mobile App"]
                },
                {
                  title: "Resources",
                  links: ["Documentation", "Blog", "Guides", "Support", "Community"]
                },
                {
                  title: "Company",
                  links: ["About", "Careers", "Partners", "Contact", "Privacy"]
                }
              ].map((section, index) => (
                <div key={index}>
                  <h4 className="text-white font-semibold mb-4">{section.title}</h4>
                  <ul className="space-y-2">
                    {section.links.map((link) => (
                      <li key={link}>
                        <button className="hover:text-white transition-colors text-sm">
                          {link}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            
            <div className="border-t border-gray-800 pt-8 text-sm">
              <div className="flex flex-col md:flex-row justify-between items-center">
                <div className="mb-4 md:mb-0">
                  © {new Date().getFullYear()} Inventory Pro. All rights reserved.
                </div>
                <div className="flex items-center space-x-4">
                  <button className="hover:text-white transition-colors">Terms</button>
                  <button className="hover:text-white transition-colors">Privacy</button>
                  <button className="hover:text-white transition-colors">Cookies</button>
                </div>
              </div>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}