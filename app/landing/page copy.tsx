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
  Building2,
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
  PieChart as PieChartIcon
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
              href: "/accountants/webinars", 
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

  // Professional features data
  const features = [
    {
      icon: <Grid className="w-5 h-5" />,
      title: "Smart Inventory Tracking",
      description: "AI-powered real-time monitoring across all locations with predictive restocking alerts.",
      stats: "99.9% Accuracy",
      image: "/asset/similar-10073860.jpeg",
      color: "from-blue-600 to-blue-800"
    },
    {
      icon: <LineChart className="w-5 h-5" />,
      title: "Advanced Analytics",
      description: "Transform data into actionable insights with comprehensive dashboards and reports.",
      stats: "3.2x ROI Average",
      image: "/asset/similar-10073860.jpeg",
      color: "from-purple-600 to-purple-800"
    },
    {
      icon: <Warehouse className="w-5 h-5" />,
      title: "Multi-Location Control",
      description: "Centralized management for multiple warehouses with unified visibility.",
      stats: "84% Efficiency Boost",
      image: "/asset/similar-10073860.jpeg",
      color: "from-emerald-600 to-emerald-800"
    },
    {
      icon: <Lock className="w-5 h-5" />,
      title: "Enterprise Security",
      description: "Military-grade encryption and compliance with all major security standards.",
      stats: "ISO 27001 Certified",
      image: "/asset/similar-10073860.jpeg",
      color: "from-amber-600 to-amber-800"
    }
  ];

  // App Screenshots Gallery
  const appScreenshots = [
    {
      id: 1,
      src: "/asset/similar-10073860.jpeg",
      alt: "Dashboard Analytics",
      title: "Analytics Dashboard",
      description: "Real-time inventory analytics and insights",
      category: "Dashboard",
      icon: <BarChart className="w-4 h-4" />
    },
    {
      id: 2,
      src: "/asset/similar-10073860.jpeg",
      alt: "Inventory Management",
      title: "Inventory Control",
      description: "Track and manage stock across locations",
      category: "Inventory",
      icon: <Package className="w-4 h-4" />
    },
    {
      id: 3,
      src: "/asset/similar-10073860.jpeg",
      alt: "Order Processing",
      title: "Order Management",
      description: "Process orders and manage fulfillment",
      category: "Orders",
      icon: <ShoppingCart className="w-4 h-4" />
    },
    {
      id: 4,
      src: "/asset/similar-10073860.jpeg",
      alt: "Warehouse View",
      title: "Warehouse Layout",
      description: "Visual warehouse management interface",
      category: "Warehouse",
      icon: <Warehouse className="w-4 h-4" />
    },
    {
      id: 5,
      src: "/asset/similar-10073860.jpeg",
      alt: "Reporting Dashboard",
      title: "Advanced Reports",
      description: "Generate custom inventory reports",
      category: "Reports",
      icon: <FileBarChart className="w-4 h-4" />
    },
    {
      id: 6,
      src: "/asset/similar-10073860.jpeg",
      alt: "Mobile App",
      title: "Mobile Application",
      description: "Manage inventory on the go",
      category: "Mobile",
      icon: <Smartphone className="w-4 h-4" />
    }
  ];

  // Platform Capabilities
  const capabilities = [
    {
      title: "Multi-Platform Access",
      description: "Access your inventory from any device",
      items: [
        { icon: <Monitor className="w-5 h-5" />, label: "Web Dashboard" },
        { icon: <Laptop className="w-5 h-5" />, label: "Desktop App" },
        { icon: <Tablet className="w-5 h-5" />, label: "Tablet View" },
        { icon: <Smartphone className="w-5 h-5" />, label: "Mobile App" }
      ]
    },
    {
      title: "Advanced Technology",
      description: "Powered by cutting-edge technology",
      items: [
        { icon: <CpuIcon className="w-5 h-5" />, label: "AI & Machine Learning" },
        { icon: <DatabaseIcon className="w-5 h-5" />, label: "Real-time Database" },
        { icon: <Cloud className="w-5 h-5" />, label: "Cloud Infrastructure" },
        { icon: <Wifi className="w-5 h-5" />, label: "Offline Sync" }
      ]
    },
    {
      title: "Enterprise Features",
      description: "Built for business scale",
      items: [
        { icon: <ShieldIcon className="w-5 h-5" />, label: "Bank-level Security" },
        { icon: <GlobeIcon className="w-5 h-5" />, label: "Global Deployment" },
        { icon: <Users className="w-5 h-5" />, label: "Team Collaboration" },
        { icon: <Server className="w-5 h-5" />, label: "API Integration" }
      ]
    }
  ];

  // Enterprise testimonials
  const testimonials = [
    {
      name: "Sarah Chen",
      role: "CFO",
      company: "TechGlobal Inc.",
      content: "ListKeeping transformed our supply chain operations. The ROI was evident within the first quarter.",
      rating: 5,
      avatar: "SC",
      industry: "Technology"
    },
    {
      name: "Marcus Rodriguez",
      role: "Operations Director",
      company: "Retail Giant Corp",
      content: "Implementation was seamless. Our team was fully operational in days, not weeks.",
      rating: 5,
      avatar: "MR",
      industry: "Retail"
    },
    {
      name: "James Wilson",
      role: "Supply Chain Manager",
      company: "Manufacturing Corp",
      content: "The predictive analytics prevented critical stockouts during peak season. Game changing.",
      rating: 5,
      avatar: "JW",
      industry: "Manufacturing"
    },
    {
      name: "Lisa Park",
      role: "Inventory Director",
      company: "E-commerce Solutions",
      content: "Automation features saved us 30+ hours per week in manual tracking.",
      rating: 5,
      avatar: "LP",
      industry: "E-commerce"
    }
  ];

  // Enterprise integrations
  const integrations = [
    { 
      name: "Microsoft 365", 
      color: "from-blue-600 to-blue-800",
      icon: "M",
      category: "Productivity"
    },
    { 
      name: "Salesforce", 
      color: "from-blue-500 to-cyan-600",
      icon: "S",
      category: "CRM"
    },
    { 
      name: "SAP", 
      color: "from-blue-400 to-blue-600",
      icon: "S",
      category: "ERP"
    },
    { 
      name: "Oracle", 
      color: "from-red-500 to-red-700",
      icon: "O",
      category: "Database"
    },
    { 
      name: "Amazon AWS", 
      color: "from-amber-500 to-orange-600",
      icon: "A",
      category: "Cloud"
    },
    { 
      name: "Shopify", 
      color: "from-emerald-500 to-emerald-700",
      icon: "S",
      category: "E-commerce"
    }
  ];

  // Enterprise metrics
  const metrics = [
    { 
      value: "99.95%", 
      label: "Uptime SLA", 
      description: "Guaranteed reliability",
      icon: <ShieldCheck className="w-4 h-4" /> 
    },
    { 
      value: "3.2x", 
      label: "Average ROI", 
      description: "First year results",
      icon: <TrendingUp className="w-4 h-4" /> 
    },
    { 
      value: "40%", 
      label: "Cost Reduction", 
      description: "Operational savings",
      icon: <CreditCard className="w-4 h-4" /> 
    },
    { 
      value: "50+", 
      label: "Countries", 
      description: "Global deployment",
      icon: <Globe2 className="w-4 h-4" /> 
    }
  ];

  // Pricing Plans - 4 Categories
  const pricingPlans = [
    {
      name: "Basic",
      price: "$49",
      period: "per month",
      description: "Perfect for small businesses starting out",
      popular: false,
      features: [
        "Up to 1,000 inventory items",
        "Basic reporting",
        "Email support",
        "Single warehouse",
        "Mobile app access",
        "Monthly backups"
      ],
      cta: "Get Started",
      color: "from-gray-400 to-gray-600"
    },
    {
      name: "Professional",
      price: "$149",
      period: "per month",
      description: "For growing businesses",
      popular: true,
      features: [
        "Up to 10,000 inventory items",
        "Advanced analytics",
        "Priority support",
        "3 warehouses",
        "API access",
        "Real-time updates",
        "Custom reports",
        "Team collaboration"
      ],
      cta: "Most Popular",
      color: "from-blue-600 to-blue-800"
    },
    {
      name: "Enterprise",
      price: "$399",
      period: "per month",
      description: "For established businesses",
      popular: false,
      features: [
        "Unlimited inventory items",
        "AI-powered insights",
        "24/7 phone support",
        "Unlimited warehouses",
        "Advanced API",
        "Custom integrations",
        "Dedicated account manager",
        "SLA guarantee",
        "Advanced security"
      ],
      cta: "Get Quote",
      color: "from-purple-600 to-purple-800"
    },
    {
      name: "Custom",
      price: "Custom",
      period: "tailored pricing",
      description: "For large enterprises with unique needs",
      popular: false,
      features: [
        "Custom everything",
        "On-premise deployment",
        "Custom development",
        "White-label options",
        "Enterprise security",
        "Compliance packages",
        "Global support team",
        "Training & onboarding",
        "Annual contract"
      ],
      cta: "Contact Sales",
      color: "from-emerald-600 to-emerald-800"
    }
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
      <div className="bg-gradient-to-r from-blue-900 to-blue-800 text-white py-1.5 px-4 text-xs font-medium tracking-wide">
        <div className="max-w-7xl mx-auto flex items-center justify-center space-x-4">
          <div className="flex items-center">
            <Award className="w-3 h-3 mr-2" />
            <span>Trusted by 500,000+ businesses worldwide</span>
          </div>
          <div className="hidden md:flex items-center">
            <Shield className="w-3 h-3 mr-2" />
            <span>Enterprise-grade security & compliance</span>
          </div>
          <div className="hidden lg:flex items-center">
            <Globe className="w-3 h-3 mr-2" />
            <span>24/7 Global Support</span>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className={`sticky top-0 w-full z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-white/98 backdrop-blur-xl border-b border-gray-100 shadow-lg' 
          : 'bg-white/95 backdrop-blur-lg border-b border-gray-50'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="relative w-8 h-8 rounded-lg overflow-hidden group">
                <Image
                  src="/asset/ello.png"
                  alt="ListKeeping Logo"
                  fill
                  className="object-contain group-hover:scale-110 transition-transform duration-300"
                  sizes="32px"
                  priority
                />
              </div>
              <div>
                <div className="text-lg font-bold text-gray-900 tracking-tight">ListKeeping</div>
                <div className="text-[10px] text-gray-500 font-medium tracking-wider uppercase">ENTERPRISE PLATFORM</div>
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
                    className={`flex flex-col items-start px-4 py-2 text-sm transition-all duration-200 min-w-[140px] ${
                      activeMenu === item.id 
                        ? 'text-blue-900' 
                        : 'text-gray-700 hover:text-blue-900'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      {item.icon && <span className="text-gray-500">{item.icon}</span>}
                      <span className="font-semibold">{item.label}</span>
                      {(item.megaMenu || item.dropdown) && (
                        <ChevronDown className={`w-4 h-4 transition-transform ${
                          activeMenu === item.id ? 'rotate-180' : ''
                        }`} />
                      )}
                    </div>
                    {item.description && (
                      <div className="text-xs text-gray-500 mt-0.5">{item.description}</div>
                    )}
                  </button>

                  {/* Mega Menu Dropdown */}
                  <AnimatePresence>
                    {activeMenu === item.id && item.megaMenu && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        transition={{ duration: 0.2 }}
                        className="absolute left-0 top-full mt-1 w-screen max-w-4xl bg-white rounded-lg border border-gray-200 shadow-xl overflow-hidden"
                        onMouseEnter={() => setActiveMenu(item.id)}
                        onMouseLeave={() => setActiveMenu(null)}
                      >
                        <div className="p-6">
                          <div className="grid grid-cols-3 gap-8">
                            {item.columns?.map((column, colIndex) => (
                              <div key={colIndex}>
                                <div className="mb-4">
                                  <h3 className="text-sm font-semibold text-gray-900 mb-1">{column.title}</h3>
                                  {column.description && (
                                    <p className="text-xs text-gray-500">{column.description}</p>
                                  )}
                                </div>
                                
                                {column.links && (
                                  <div className="space-y-2">
                                    {column.links.map((link, linkIndex) => (
                                      <Link
                                        key={linkIndex}
                                        href={link.href}
                                        className={`flex items-start p-2 rounded-md transition-colors ${
                                          link.featured 
                                            ? 'bg-blue-50 border border-blue-100' 
                                            : 'hover:bg-gray-50'
                                        }`}
                                      >
                                        {link.icon && (
                                          <div className={`mt-0.5 mr-3 ${link.featured ? 'text-blue-900' : 'text-gray-500'}`}>
                                            {link.icon}
                                          </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center justify-between">
                                            <span className={`text-sm font-medium ${link.featured ? 'text-blue-900' : 'text-gray-900'}`}>
                                              {link.label}
                                            </span>
                                            {link.badge && (
                                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                                link.badge === 'New' 
                                                  ? 'bg-green-100 text-green-900' 
                                                  : 'bg-blue-100 text-blue-900'
                                              }`}>
                                                {link.badge}
                                              </span>
                                            )}
                                          </div>
                                          {link.description && (
                                            <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                                              {link.description}
                                            </p>
                                          )}
                                        </div>
                                      </Link>
                                    ))}
                                  </div>
                                )}

                                {column.features && column.items && (
                                  <div className="space-y-3">
                                    <div className="grid grid-cols-2 gap-2">
                                      {column.items.map((feature, featureIndex) => (
                                        <div
                                          key={featureIndex}
                                          className="flex items-center p-2 rounded-md hover:bg-gray-50 group"
                                        >
                                          <div className="w-6 h-6 rounded bg-blue-50 flex items-center justify-center mr-2 group-hover:bg-blue-100 transition-colors">
                                            <div className="text-blue-900">
                                              {feature.icon}
                                            </div>
                                          </div>
                                          <span className="text-xs font-medium text-gray-700 group-hover:text-blue-900">
                                            {feature.label}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                    {column.cta && (
                                      <Link
                                        href={column.cta.href}
                                        className="flex items-center justify-center text-sm font-medium text-blue-900 hover:text-blue-700 mt-3 pt-3 border-t border-gray-100"
                                      >
                                        {column.cta.label}
                                        <ChevronRight className="w-4 h-4 ml-1" />
                                      </Link>
                                    )}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        {/* Support Links Footer */}
                        <div className="bg-gray-50 border-t border-gray-100 px-6 py-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-6">
                              {menuData.support.map((supportItem) => (
                                <Link
                                  key={supportItem.id}
                                  href={supportItem.href}
                                  className="flex items-center text-sm font-medium text-gray-700 hover:text-blue-900 transition-colors group"
                                >
                                  {supportItem.icon && (
                                    <span className="mr-2 text-gray-500 group-hover:text-blue-900">
                                      {supportItem.icon}
                                    </span>
                                  )}
                                  {supportItem.label}
                                  {supportItem.badge && (
                                    <span className="ml-2 px-2 py-0.5 text-xs bg-gradient-to-r from-blue-900 to-blue-700 text-white rounded-full font-medium">
                                      {supportItem.badge}
                                    </span>
                                  )}
                                </Link>
                              ))}
                            </div>
                            <div className="flex items-center text-sm text-gray-500">
                              <MessageCircle className="w-4 h-4 mr-2" />
                              Live chat available
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}

              {/* Auth Section */}
              <div className="flex items-center space-x-3 ml-4 pl-4 border-l border-gray-200">
                <Link
                  href="/login"
                  className="text-sm font-medium text-gray-700 hover:text-blue-900 transition-colors px-3 py-1.5 rounded-md hover:bg-gray-50"
                >
                  Sign In
                </Link>
                <button 
                  onClick={() => scrollToSection("cta")}
                  className="group bg-gradient-to-r from-blue-900 to-blue-800 text-white px-4 py-2 rounded-md font-medium hover:shadow-lg hover:shadow-blue-900/25 transition-all duration-300 flex items-center space-x-2"
                >
                  <span>Start Free Trial</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="lg:hidden text-gray-700 hover:text-blue-900 transition-colors p-1"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="lg:hidden border-t border-gray-100 bg-white/95 backdrop-blur-lg"
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
              {/* Mobile Search */}
              <div className="relative mb-4">
                <input
                  type="text"
                  placeholder="Search features, docs, help..."
                  className="w-full px-4 py-2 pl-10 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:border-blue-900 focus:ring-1 focus:ring-blue-900/20"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              </div>

              {/* Mobile Navigation Items */}
              <div className="space-y-1">
                {menuData.main.map((item) => (
                  <div key={item.id} className="border-b border-gray-100 last:border-b-0">
                    <button
                      onClick={() => {
                        if (item.href) {
                          window.location.href = item.href;
                          setMobileMenuOpen(false);
                        } else {
                          setActiveMenu(activeMenu === item.id ? null : item.id);
                        }
                      }}
                      className="flex items-center justify-between w-full text-left px-3 py-3 text-sm font-medium text-gray-900 hover:bg-gray-50 rounded-md"
                    >
                      <div className="flex items-center">
                        {item.icon && <span className="mr-3 text-gray-500">{item.icon}</span>}
                        <div className="text-left">
                          <div className="font-medium">{item.label}</div>
                          {item.description && (
                            <div className="text-xs text-gray-500">{item.description}</div>
                          )}
                        </div>
                      </div>
                      {(item.megaMenu || item.dropdown) && (
                        <ChevronDown className={`w-4 h-4 transition-transform ${
                          activeMenu === item.id ? 'rotate-180' : ''
                        }`} />
                      )}
                    </button>

                    {/* Mobile Submenu */}
                    {activeMenu === item.id && item.megaMenu && (
                      <div className="pl-8 pr-3 pb-3 space-y-3">
                        {item.columns?.map((column, colIndex) => (
                          <div key={colIndex} className="space-y-2">
                            <h4 className="text-xs font-semibold text-gray-900">{column.title}</h4>
                            {column.links?.map((link, linkIndex) => (
                              <Link
                                key={linkIndex}
                                href={link.href}
                                onClick={() => setMobileMenuOpen(false)}
                                className="flex items-center justify-between p-2 rounded-md hover:bg-gray-50"
                              >
                                <div className="flex items-center">
                                  {link.icon && (
                                    <span className="mr-3 text-gray-500">{link.icon}</span>
                                  )}
                                  <div>
                                    <div className="text-sm font-medium text-gray-900">{link.label}</div>
                                    {link.description && (
                                      <div className="text-xs text-gray-500">{link.description}</div>
                                    )}
                                  </div>
                                </div>
                                {link.badge && (
                                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                    link.badge === 'New' 
                                      ? 'bg-green-100 text-green-900' 
                                      : 'bg-blue-100 text-blue-900'
                                  }`}>
                                    {link.badge}
                                  </span>
                                )}
                              </Link>
                            ))}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Mobile Support Links */}
              <div className="mt-6 pt-6 border-t border-gray-100 space-y-3">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Support</div>
                {menuData.support.map((supportItem) => (
                  <Link
                    key={supportItem.id}
                    href={supportItem.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-between px-3 py-2 rounded-md hover:bg-gray-50"
                  >
                    <div className="flex items-center">
                      {supportItem.icon && (
                        <span className="mr-3 text-gray-500">{supportItem.icon}</span>
                      )}
                      <span className="text-sm font-medium text-gray-900">{supportItem.label}</span>
                    </div>
                    {supportItem.badge && (
                      <span className="text-xs px-2 py-0.5 bg-gradient-to-r from-blue-900 to-blue-700 text-white rounded-full font-medium">
                        {supportItem.badge}
                      </span>
                    )}
                  </Link>
                ))}
              </div>

              {/* Mobile CTA */}
              <div className="mt-6 pt-6 border-t border-gray-100 space-y-3">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block w-full text-center px-4 py-3 text-sm font-medium text-blue-900 hover:bg-blue-50 rounded-lg transition-colors border border-blue-900"
                >
                  Sign In
                </Link>
                <button
                  onClick={() => {
                    scrollToSection("cta");
                    setMobileMenuOpen(false);
                  }}
                  className="block w-full bg-gradient-to-r from-blue-900 to-blue-800 text-white text-center px-4 py-3 rounded-lg font-medium hover:shadow-lg transition-all"
                >
                  Start Free Trial
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </nav>

      {/* Main Content */}
      <main ref={containerRef} className="w-full">
        {/* Hero Section */}
        <section ref={heroRef} className="pt-20 pb-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white to-gray-50">
          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Left Content */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-blue-50 text-blue-900 text-xs font-medium mb-6">
                  <Sparkles className="w-3 h-3 mr-1.5" />
                  Enterprise-Grade Inventory Platform
                </div>

                <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6 leading-tight">
                  Transform Your
                  <span className="block text-blue-900 mt-2">Supply Chain Operations</span>
                </h1>

                <p className="text-lg text-gray-600 mb-8 max-w-2xl leading-relaxed">
                  ListKeeping delivers enterprise-grade inventory management powered by AI. 
                  Gain real-time visibility, predictive insights, and seamless integration 
                  with your existing systems.
                </p>

                {/* Metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mb-8">
                  {metrics.map((metric, index) => (
                    <div key={index} className="text-left">
                      <div className="flex items-center mb-2">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center mr-3">
                          <div className="text-blue-900">
                            {metric.icon}
                          </div>
                        </div>
                        <div className="text-2xl font-bold text-blue-900">{metric.value}</div>
                      </div>
                      <div className="text-sm font-semibold text-gray-900">{metric.label}</div>
                      <div className="text-xs text-gray-500">{metric.description}</div>
                    </div>
                  ))}
                </div>

                {/* CTA Form */}
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 max-w-md">
                      <div className="relative group">
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="Enter your work email"
                          className="w-full px-4 py-3 pl-12 rounded-lg border border-gray-300 bg-white focus:border-blue-900 focus:ring-2 focus:ring-blue-900/10 outline-none transition-all placeholder-gray-500 text-sm"
                        />
                        <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      </div>
                    </div>
                    <button 
                      onClick={() => scrollToSection("cta")}
                      className="group bg-gradient-to-r from-blue-900 to-blue-800 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-xl hover:shadow-blue-900/25 transition-all duration-300 flex items-center justify-center space-x-2"
                    >
                      <span>Start Free Trial</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 flex items-center">
                    <CheckCircle className="w-3 h-3 mr-2 text-green-500" />
                    No credit card required • 14-day free trial • Cancel anytime
                  </p>
                </div>
              </motion.div>

              {/* Right Content - Dashboard Preview */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="relative"
              >
                <div className="bg-white rounded-xl border border-gray-200 shadow-xl overflow-hidden">
                  {/* Dashboard Header */}
                  <div className="bg-gradient-to-r from-gray-900 to-gray-800 px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 rounded-full bg-red-400"></div>
                          <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
                          <div className="w-2 h-2 rounded-full bg-green-400"></div>
                        </div>
                        <div className="text-white text-sm font-medium">Enterprise Dashboard</div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <Settings className="w-4 h-4 text-gray-400" />
                        <Bell className="w-4 h-4 text-gray-400" />
                      </div>
                    </div>
                  </div>

                  {/* Main Dashboard */}
                  <div className="p-6">
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      {appScreenshots.slice(0, 2).map((image) => (
                        <div key={image.id} className="group relative">
                          <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                            <Image
                              src={image.src}
                              alt={image.alt}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform duration-300"
                              sizes="(max-width: 768px) 50vw, 25vw"
                            />
                          </div>
                          <div className="mt-3">
                            <div className="text-sm font-semibold text-gray-900 flex items-center">
                              {image.icon && <span className="mr-2">{image.icon}</span>}
                              {image.title}
                            </div>
                            <div className="text-xs text-gray-500">{image.description}</div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Dashboard Stats */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                          <span className="text-sm font-medium text-gray-900">System Status</span>
                        </div>
                        <div className="text-sm font-semibold text-green-700">Operational</div>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <TrendingUp className="w-4 h-4 text-purple-600" />
                          <span className="text-sm font-medium text-gray-900">AI Predictions</span>
                        </div>
                        <div className="text-sm font-semibold text-purple-700">Active</div>
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
              <p className="text-sm text-gray-600 font-medium">TRUSTED BY INDUSTRY LEADERS</p>
            </div>
            <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12">
              {["Microsoft", "Amazon", "Walmart", "FedEx", "PayPal", "SAP", "Oracle", "Shopify"].map((company, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="text-gray-400 hover:text-gray-900 transition-colors text-lg font-medium"
                >
                  {company}
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* App Screenshots Gallery */}
        <section className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-50 text-blue-900 text-sm font-medium mb-6">
                <Eye className="w-4 h-4 mr-2" />
                PLATFORM PREVIEW
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
                See ListKeeping in Action
                <span className="block text-blue-900">Powerful Features, Beautiful Interface</span>
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Explore our comprehensive platform designed for modern inventory management
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-12">
              {appScreenshots.map((screenshot) => (
                <motion.div
                  key={screenshot.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  viewport={{ once: true }}
                  className="group relative bg-white rounded-xl border border-gray-200 p-6 hover:shadow-xl transition-all duration-300"
                >
                  <div className="aspect-video relative bg-gray-100 rounded-lg overflow-hidden mb-4">
                    <Image
                      src={screenshot.src}
                      alt={screenshot.alt}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      sizes="(max-width: 768px) 50vw, 33vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                      <div className="text-blue-900">
                        {screenshot.icon}
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{screenshot.title}</h3>
                      <p className="text-sm text-gray-600">{screenshot.description}</p>
                      <span className="inline-block mt-2 px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full">
                        {screenshot.category}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Platform Capabilities */}
            <div className="mt-20">
              <div className="text-center mb-12">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Built for Modern Business</h3>
                <p className="text-gray-600 max-w-3xl mx-auto">
                  Accessible from any device, powered by cutting-edge technology, and designed for enterprise scale
                </p>
              </div>
              
              <div className="grid md:grid-cols-3 gap-8">
                {capabilities.map((capability, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.2 }}
                    viewport={{ once: true }}
                    className="bg-white rounded-xl border border-gray-200 p-6"
                  >
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">{capability.title}</h4>
                    <p className="text-gray-600 text-sm mb-6">{capability.description}</p>
                    <div className="space-y-3">
                      {capability.items.map((item, itemIndex) => (
                        <div key={itemIndex} className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                            <div className="text-blue-900">
                              {item.icon}
                            </div>
                          </div>
                          <span className="text-sm font-medium text-gray-900">{item.label}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-50 text-blue-900 text-sm font-medium mb-6">
                <Target className="w-4 h-4 mr-2" />
                ENTERPRISE FEATURES
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
                Comprehensive Solutions for
                <span className="block text-blue-900">Modern Enterprises</span>
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Everything you need to optimize inventory management and supply chain operations
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="group bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg hover:border-blue-900/20 transition-all duration-300"
                >
                  <div className={`w-12 h-12 bg-gradient-to-br ${feature.color} rounded-lg flex items-center justify-center mb-4`}>
                    <div className="text-white">
                      {feature.icon}
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-gray-600 text-sm mb-4 leading-relaxed">
                    {feature.description}
                  </p>
                  <div className="text-sm font-semibold text-blue-900">
                    {feature.stats}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Integrations Section */}
        <section id="integrations" className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-50 text-blue-900 text-sm font-medium mb-6">
                <Globe className="w-4 h-4 mr-2" />
                SEAMLESS INTEGRATION
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
                Connect With Your
                <span className="block text-blue-900">Technology Stack</span>
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Works effortlessly with the enterprise systems you already use
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {integrations.map((integration, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="group"
                >
                  <div className="bg-white rounded-lg border border-gray-200 p-6 text-center hover:shadow-md transition-all duration-300 group-hover:border-gray-300">
                    <div className={`w-12 h-12 ${integration.color} rounded-lg flex items-center justify-center mx-auto mb-3`}>
                      <div className="text-white text-lg font-bold">
                        {integration.icon}
                      </div>
                    </div>
                    <div className="text-sm font-semibold text-gray-900">{integration.name}</div>
                    <div className="text-xs text-gray-500 mt-1">{integration.category}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section id="testimonials" className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-50 text-blue-900 text-sm font-medium mb-6">
                <Star className="w-4 h-4 mr-2" />
                CUSTOMER SUCCESS
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
                Trusted by Industry
                <span className="block text-blue-900">Leaders Worldwide</span>
              </h2>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {testimonials.map((testimonial, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all duration-300"
                >
                  <div className="flex items-center mb-6">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-900 to-blue-700 rounded-full flex items-center justify-center text-white font-bold text-lg">
                      {testimonial.avatar}
                    </div>
                    <div className="ml-4">
                      <div className="font-bold text-gray-900">{testimonial.name}</div>
                      <div className="text-sm text-gray-600">{testimonial.role}</div>
                      <div className="text-sm text-blue-900 font-semibold">{testimonial.company}</div>
                    </div>
                  </div>
                  <p className="text-gray-700 mb-6 text-sm italic">&ldquo;{testimonial.content}&rdquo;</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />
                      ))}
                    </div>
                    <div className="text-xs text-gray-500 font-medium">{testimonial.industry}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Enhanced Pricing Section - 4 Categories */}
        <section id="pricing" className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-50 text-blue-900 text-sm font-medium mb-6">
                <CreditCard className="w-4 h-4 mr-2" />
                TRANSPARENT PRICING
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
                Choose the Perfect Plan
                <span className="block text-blue-900">For Your Business</span>
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Scalable solutions for businesses of all sizes. Start free, upgrade as you grow.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {pricingPlans.map((plan, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className={`relative ${plan.popular ? 'lg:scale-105 z-10' : ''}`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-20">
                      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white px-4 py-1.5 rounded-full text-sm font-semibold shadow-lg">
                        MOST POPULAR
                      </div>
                    </div>
                  )}
                  
                  <div className={`relative h-full rounded-xl border-2 ${plan.popular ? 'border-blue-600 shadow-xl' : 'border-gray-200 shadow-lg hover:shadow-xl'} bg-white overflow-hidden transition-all duration-300`}>
                    {/* Plan Header */}
                    <div className={`bg-gradient-to-r ${plan.color} p-6 text-white`}>
                      <h3 className="text-xl font-bold">{plan.name}</h3>
                      <div className="mt-4">
                        <div className="text-3xl font-bold">
                          {plan.price}
                          {plan.price !== "Custom" && <span className="text-lg font-normal">/mo</span>}
                        </div>
                        <div className="text-blue-100 text-sm mt-1">{plan.period}</div>
                      </div>
                    </div>

                    {/* Plan Body */}
                    <div className="p-6">
                      <p className="text-gray-600 text-sm mb-6">{plan.description}</p>
                      
                      <div className="space-y-3 mb-8">
                        {plan.features.map((feature, featureIndex) => (
                          <div key={featureIndex} className="flex items-start">
                            <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                            <span className="text-sm text-gray-700">{feature}</span>
                          </div>
                        ))}
                      </div>

                      <button 
                        onClick={() => plan.price === "Custom" ? alert("Contacting sales...") : scrollToSection("cta")}
                        className={`w-full py-3 rounded-lg font-semibold transition-all duration-300 ${
                          plan.popular 
                            ? 'bg-gradient-to-r from-blue-600 to-blue-800 text-white hover:from-blue-700 hover:to-blue-900' 
                            : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                        }`}
                      >
                        {plan.cta}
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Pricing Comparison */}
            <div className="mt-20 bg-white rounded-xl border border-gray-200 p-8">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Compare Plans</h3>
                <p className="text-gray-600">See which plan is right for your business needs</p>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-4 font-semibold text-gray-900">Feature</th>
                      {pricingPlans.map((plan) => (
                        <th key={plan.name} className="text-center py-4 font-semibold text-gray-900">
                          {plan.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-gray-100">
                      <td className="py-4 text-gray-700">Inventory Items</td>
                      <td className="text-center py-4">Up to 1,000</td>
                      <td className="text-center py-4">Up to 10,000</td>
                      <td className="text-center py-4">Unlimited</td>
                      <td className="text-center py-4">Custom</td>
                    </tr>
                    <tr className="border-b border-gray-100">
                      <td className="py-4 text-gray-700">Warehouses</td>
                      <td className="text-center py-4">1</td>
                      <td className="text-center py-4">3</td>
                      <td className="text-center py-4">Unlimited</td>
                      <td className="text-center py-4">Custom</td>
                    </tr>
                    <tr className="border-b border-gray-100">
                      <td className="py-4 text-gray-700">Support</td>
                      <td className="text-center py-4">Email</td>
                      <td className="text-center py-4">Priority</td>
                      <td className="text-center py-4">24/7 Phone</td>
                      <td className="text-center py-4">Dedicated</td>
                    </tr>
                    <tr className="border-b border-gray-100">
                      <td className="py-4 text-gray-700">API Access</td>
                      <td className="text-center py-4">-</td>
                      <td className="text-center py-4">✓</td>
                      <td className="text-center py-4">Advanced</td>
                      <td className="text-center py-4">Custom</td>
                    </tr>
                    <tr>
                      <td className="py-4 text-gray-700">Free Trial</td>
                      <td className="text-center py-4">✓ 14 days</td>
                      <td className="text-center py-4">✓ 14 days</td>
                      <td className="text-center py-4">✓ 14 days</td>
                      <td className="text-center py-4">✓ Demo</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section id="cta" className="py-20 bg-gradient-to-br from-blue-900 to-blue-800">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-8">
                Ready to Transform Your
                <span className="block">Inventory Management?</span>
              </h2>
              <p className="text-lg text-blue-100 mb-12 max-w-2xl mx-auto">
                Join thousands of enterprises optimizing their supply chain with ListKeeping
              </p>
              
              <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
                <button 
                  onClick={() => {
                    setEmail("");
                    alert("Starting your free trial...");
                  }}
                  className="bg-white text-blue-900 px-8 py-4 rounded-xl font-bold text-lg hover:shadow-xl hover:scale-105 transition-all duration-300 flex items-center space-x-2"
                >
                  <span>Start Free Trial</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
                
                <button className="bg-transparent border-2 border-white text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-white/10 transition-all duration-300 flex items-center space-x-2">
                  <Headphones className="w-5 h-5" />
                  <span>Schedule a Demo</span>
                </button>
              </div>
              
              <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex items-center justify-center text-blue-200">
                  <CheckCircle className="w-5 h-5 mr-2" />
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center justify-center text-blue-200">
                  <Clock className="w-5 h-5 mr-2" />
                  <span>14-day free trial</span>
                </div>
                <div className="flex items-center justify-center text-blue-200">
                  <Shield className="w-5 h-5 mr-2" />
                  <span>Enterprise support included</span>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-gray-900 text-gray-400 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-4 gap-12 mb-12">
              <div>
                <div className="flex items-center space-x-3 mb-8">
                  <div className="relative w-12 h-12 rounded-lg overflow-hidden">
                    <Image
                      src="/asset/ello.png"
                      alt="ListKeeping Logo"
                      fill
                      className="object-contain"
                      sizes="48px"
                    />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-white">ListKeeping</div>
                    <div className="text-sm text-blue-400">Enterprise Platform</div>
                  </div>
                </div>
                <p className="text-sm leading-relaxed">
                  Intelligent inventory management for modern enterprises. 
                  Transform your supply chain with AI-powered insights.
                </p>
              </div>
              
              {[
                {
                  title: "Product",
                  links: ["Features", "Integrations", "API", "Pricing", "Security"]
                },
                {
                  title: "Resources",
                  links: ["Documentation", "Blog", "Tutorials", "Support", "Community"]
                },
                {
                  title: "Company",
                  links: ["About", "Careers", "Partners", "Contact", "Legal"]
                }
              ].map((section, index) => (
                <div key={index}>
                  <h4 className="text-white font-bold text-lg mb-6">{section.title}</h4>
                  <ul className="space-y-3">
                    {section.links.map((link, linkIndex) => (
                      <li key={linkIndex}>
                        <button 
                          onClick={() => {
                            if (link === "Features") scrollToSection("features");
                            else if (link === "Integrations") scrollToSection("integrations");
                            else if (link === "Pricing") scrollToSection("pricing");
                          }}
                          className="hover:text-white transition-colors text-sm"
                        >
                          {link}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            
            <div className="border-t border-gray-800 pt-8">
              <div className="flex flex-col md:flex-row justify-between items-center">
                <div className="mb-6 md:mb-0">
                  <div className="text-sm">
                    © {new Date().getFullYear()} ListKeeping. All rights reserved.
                  </div>
                </div>
                <div className="flex items-center space-x-6">
                  <button className="hover:text-white transition-colors text-sm">Terms</button>
                  <button className="hover:text-white transition-colors text-sm">Privacy</button>
                  <button className="hover:text-white transition-colors text-sm">Cookies</button>
                  <button className="hover:text-white transition-colors text-sm">Status</button>
                </div>
              </div>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}