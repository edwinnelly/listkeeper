import React, { useState, useCallback, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  Clipboard,
  ShoppingCart,
  FileText,
  Users,
  BadgePlus,
  CreditCard,
  Book,
  BarChart3,
  PieChart,
  Sparkles,
  User,
  Settings,
  Power,
  Mail,
  BadgeCheck,
  Inbox,
  Send,
  Archive,
  Trash2,
  Folder,
  House,
  X,
  ChevronDown,
  ShoppingBagIcon,
} from "lucide-react";
import Cookies from "js-cookie";
import api from "@/lib/axios";
import { withAuth } from "@/hoc/withAuth";

// -------------------- Types --------------------
interface Business {
  id: number;
  business_key: string;
  business_name: string;
}

interface User {
  id: number;
  name: string;
  email?: string;
  active_business_key: string | number;
  businesses_one?: Business[];
}

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  user: User | null;
}

// -------------------- Sidebar Component --------------------
const Sidebar: React.FC<SidebarProps> = ({ sidebarOpen, setSidebarOpen, user }) => {
  const pathname = usePathname();
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(["main"]));
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<"app" | "mail">("app");
  const [isNavHovered, setIsNavHovered] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);
  const isScrollingProgrammatically = useRef(false);

  // -------------------- Logout --------------------
  const handleLogout = async () => {
    try {
      await api.get("/sanctum/csrf-cookie");
      await api.post("/logout", null, {
        headers: { "X-XSRF-TOKEN": Cookies.get("XSRF-TOKEN") || "" },
      });
      localStorage.removeItem("user");
      sessionStorage.removeItem("user");
      window.location.replace("/auth");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const closeSidebar = useCallback(() => setSidebarOpen(false), [setSidebarOpen]);
  
  const toggleSection = useCallback((sectionKey: string) => {
    if (!navRef.current) return;
    
    // Save current scroll position before state update
    const currentScrollTop = navRef.current.scrollTop;
    
    setOpenSections(prev => {
      const newSet = new Set(prev);
      newSet.has(sectionKey) ? newSet.delete(sectionKey) : newSet.add(sectionKey);
      return newSet;
    });
    
    // Restore scroll position after state update
    setTimeout(() => {
      if (navRef.current && !isScrollingProgrammatically.current) {
        isScrollingProgrammatically.current = true;
        navRef.current.scrollTop = currentScrollTop;
        // Reset flag after a short delay
        setTimeout(() => {
          isScrollingProgrammatically.current = false;
        }, 50);
      }
    }, 0);
  }, []);

  const handleNavMouseEnter = () => setIsNavHovered(true);
  const handleNavMouseLeave = () => setIsNavHovered(false);

  // Save scroll position when user scrolls
  const handleNavScroll = useCallback(() => {
    // Only save if not programmatically scrolling
    if (!isScrollingProgrammatically.current && navRef.current) {
      sessionStorage.setItem('sidebarScroll', navRef.current.scrollTop.toString());
    }
  }, []);

  // Restore scroll position on component mount
  useEffect(() => {
    const savedScroll = sessionStorage.getItem('sidebarScroll');
    if (savedScroll && navRef.current) {
      setTimeout(() => {
        if (navRef.current) {
          isScrollingProgrammatically.current = true;
          navRef.current.scrollTop = parseInt(savedScroll, 10);
          setTimeout(() => {
            isScrollingProgrammatically.current = false;
          }, 50);
        }
      }, 100);
    }
  }, []);

 

  // -------------------- Navigation Item --------------------
  const NavItem: React.FC<{
    href: string;
    label: string;
    icon: React.ElementType;
    badge?: string;
    disabled?: boolean;
    isNew?: boolean;
    count?: number;
  }> = React.memo(({ href, label, icon: Icon, badge, disabled, isNew, count }) => {
    const isActive = pathname === href;

    return (
      <Link
        href={href}
        className={`group relative flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-bold transition-all duration-200 ease-out ${
          isActive
            ? "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300 border-r-2 border-blue-500"
            : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/60 border-r-2 border-transparent"
        } ${disabled ? "opacity-40 cursor-not-allowed" : ""}`}
        onClick={closeSidebar}
        onMouseEnter={() => setHoveredItem(href)}
        onMouseLeave={() => setHoveredItem(null)}
        aria-current={isActive ? "page" : undefined}
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div
            className={`transition-all duration-200 flex-shrink-0 ${
              isActive
                ? "text-blue-600 dark:text-blue-400"
                : "text-gray-500 group-hover:text-gray-700 dark:group-hover:text-gray-300"
            }`}
          >
            <Icon size={18} />
          </div>
          <span className="truncate">{label}</span>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0 ml-2">
          {isNew && <span className="px-1.5 py-0.5 text-xs bg-green-500 text-white rounded font-medium">New</span>}
          {badge && <span className="px-1.5 py-0.5 text-xs bg-purple-500 text-white rounded font-medium">{badge}</span>}
          {count !== undefined && (
            <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${
              isActive
                ? "bg-blue-200 text-blue-700 dark:bg-blue-800 dark:text-blue-200"
                : "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
            }`}>{count}</span>
          )}
        </div>
      </Link>
    );
  });
  NavItem.displayName = "NavItem";

  // -------------------- Collapsible Section --------------------
  const NavSection: React.FC<{
    title: string;
    sectionKey: string;
    collapsible?: boolean;
    children: React.ReactNode;
  }> = React.memo(({ title, sectionKey, collapsible = true, children }) => {
    const isOpen = openSections.has(sectionKey);

    return (
      <div className="space-y-1">
        {collapsible ? (
          <button
            onClick={() => toggleSection(sectionKey)}
            className="flex items-center justify-between w-full font-semibold capitalize tracking-wider text-gray-500 dark:text-gray-400 px-3 py-2 hover:text-gray-700 dark:hover:text-gray-300 transition-colors duration-200 rounded-lg hover:bg-gray-100/50 dark:hover:bg-gray-800/50 group"
            style={{ fontSize: "15px" }}
          >
            <span>{title}</span>
            <ChevronDown
              size={14}
              className={`transition-all duration-200 flex-shrink-0 ${isOpen ? "rotate-180" : "text-gray-400 group-hover:text-gray-600"}`}
            />
          </button>
        ) : (
          <div 
            className="font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 px-3 py-2"
            style={{ fontSize: "15px" }}
          >
            {title}
          </div>
        )}
        <div
          className={`grid transition-all duration-300 ease-out ${
            isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
          }`}
        >
          <div className="overflow-hidden min-h-0">
            <div className="space-y-0.5">{children}</div>
          </div>
        </div>
      </div>
    );
  });
  NavSection.displayName = "NavSection";

  // -------------------- App Navigation --------------------
  const renderAppSections = () => {
    if (Number(user.active_business_key) === 0) {
      return (
        <NavSection title="Main" sectionKey="main">
          <NavItem href="/dashboard" label="Dashboard" icon={LayoutDashboard} />
        </NavSection>
      );
    }

    return (
      <>
        <NavSection title="Main" sectionKey="main">
          <NavItem href="/dashboard" label="Dashboard" icon={LayoutDashboard} />
          <NavItem href="/business" label="Business List" icon={Building2} />
          <NavItem href="/locations" label="Locations" icon={Clipboard} />
        </NavSection>

        <NavSection title="Sales" sectionKey="sales">
          <NavItem href="/sales" label="POS Sales" icon={ShoppingCart} />
          <NavItem href="/invoices" label="Invoices" icon={FileText} />
          <NavItem href="/customers" label="Customers" icon={Users} />
        </NavSection>

        <NavSection title="Products List" sectionKey="products">
          <NavItem href="/products" label="Products List" icon={BadgePlus} />
          <NavItem href="/productsecat" label="Products Category" icon={BadgeCheck} />
          <NavItem href="/sales" label="Internal Stock Transfer" icon={ShoppingCart} />
          <NavItem href="/invoices" label="Manage Product Ai" icon={FileText} />
          <NavItem href="/customers" label="Branch Products" icon={Users} />
          <NavItem href="/product-units" label="Products Units" icon={Users} />
        </NavSection>

        <NavSection title="Customer" sectionKey="customer">
          <NavItem href="/customers" label="Manage Customers" icon={Users} />
        </NavSection>

        <NavSection title="Purchase" sectionKey="purchase">
          <NavItem href="/purchases" label="Manage Purchases" icon={ShoppingCart} />
        </NavSection>

        <NavSection title="Vendor" sectionKey="vendor">
          <NavItem href="/vendors" label="Manage Vendors" icon={Users} />
        </NavSection>

        <NavSection title="Debt" sectionKey="debt">
          <NavItem href="/debt" label="Manage Debt" icon={User} />
        </NavSection>

        <NavSection title="Expenses" sectionKey="expenses">
          <NavItem href="/expenses" label="Expenses" icon={CreditCard} />
          <NavItem href="/vendors" label="Vendors" icon={Book} />
          <NavItem href="/purchases" label="Purchases" icon={ShoppingCart} />
        </NavSection>

        <NavSection title="Analytics" sectionKey="analytics">
          <NavItem href="/reports" label="Smart Reports" icon={BarChart3} badge="AI" isNew />
          <NavItem href="/analytics" label="Advanced Analytics" icon={PieChart} />
          <NavItem href="/insights" label="Business Insights" icon={Sparkles} disabled />
        </NavSection>

        <NavSection title="Accounting" sectionKey="accounting">
          <NavItem href="/accounting/reports" label="Financial Reports" icon={BarChart3} />
          <NavItem href="/accounting/ledger" label="General Ledger" icon={FileText} />
        </NavSection>

        <NavSection title="Multi-Location" sectionKey="multi-location">
          <NavItem href="/locations/manage" label="Manage Locations" icon={Building2} />
          <NavItem href="/locations/transfer" label="Stock Transfer" icon={ShoppingCart} />
        </NavSection>

        <NavSection title="Administration" sectionKey="administration">
          <NavItem href="/users" label="User Management" icon={User} />
          <NavItem href="/settings" label="System Settings" icon={Settings} />
        </NavSection>
      </>
    );
  };

  // -------------------- POS Navigation --------------------
  const renderMailSections = () => (
    <>
      <NavSection title="Mail" sectionKey="mail" collapsible={false}>
        <NavItem href="/mail/inbox" label="Inbox" icon={Inbox} count={12} />
        <NavItem href="/mail/sent" label="Sent" icon={Send} />
        <NavItem href="/mail/drafts" label="Drafts" icon={FileText} count={3} />
      </NavSection>
      <NavSection title="Folders" sectionKey="folders">
        <NavItem href="/mail/important" label="Important" icon={Folder} />
        <NavItem href="/mail/starred" label="Starred" icon={Folder} />
        <NavItem href="/mail/spam" label="Spam" icon={Folder} count={47} />
      </NavSection>
    </>
  );

  // -------------------- Main Render --------------------
  return (
    <>
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-lg z-30 lg:hidden transition-all duration-300" 
          onClick={closeSidebar} 
        />
      )}
      <aside 
        className={`fixed lg:sticky top-0 w-74 h-screen flex flex-col bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transform transition-all duration-300 ease-out z-40 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`} 
        aria-label="Main navigation"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
          <Link href="/dashboard" className="flex items-center gap-3" onClick={closeSidebar}>
            <img 
              src="https://cdn4.iconfinder.com/data/icons/logos-and-brands/512/44_Bitbucket_logo_logos-256.png" 
              alt="Logo" 
              className="w-8 h-8" 
            />
            <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Business Suite
            </span>
          </Link>
          <button 
            onClick={closeSidebar} 
            className="lg:hidden p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
          >
            <X size={16} />
          </button>
        </div>

        {/* View Toggle */}
        <div className="flex border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
          <button 
            onClick={() => setActiveView("app")} 
            className={`flex-1 py-3 text-sm font-medium ${
              activeView === "app" 
                ? "text-blue-600 border-b-2 border-blue-500 bg-white dark:bg-gray-900" 
                : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
            }`}
          >
            <LayoutDashboard size={16} className="inline-block mr-1" /> Apps
          </button>
          <button 
            onClick={() => setActiveView("mail")} 
            className={`flex-1 py-3 text-sm font-medium ${
              activeView === "mail" 
                ? "text-blue-600 border-b-2 border-blue-500 bg-white dark:bg-gray-900" 
                : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
            }`}
          >
            <ShoppingBagIcon size={17} className="inline-block mr-1" /> POS
          </button>
        </div>

        {/* Main Navigation - Wrapped in a scroll container */}
        <div className="flex-1 overflow-hidden">
          <nav 
            ref={navRef}
            className="h-full overflow-y-auto p-3 space-y-4"
            onScroll={handleNavScroll}
            onMouseEnter={handleNavMouseEnter}
            onMouseLeave={handleNavMouseLeave}
          >
            {activeView === "app" ? renderAppSections() : renderMailSections()}
          </nav>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-800 p-3 bg-gray-50 dark:bg-gray-800/50">
          <div className="flex items-center gap-3 p-2 bg-white dark:bg-gray-800 border rounded-lg">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold text-sm">
              {user.name?.charAt(0).toUpperCase() || "U"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-medium text-gray-900 dark:text-gray-100 text-sm truncate">
                {user.name}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {user.email || "user@example.com"}
              </p>
            </div>
          </div>
          <button 
            onClick={handleLogout} 
            className="w-full mt-3 flex items-center justify-center gap-2 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 text-sm font-medium border"
          >
            <Power size={16} /> Sign Out
          </button>
        </div>

        {/* Scrollbar Styles */}
        <style jsx>{`
          nav {
            scrollbar-width: thin;
            scrollbar-color: rgba(156, 163, 175, 0.5) transparent;
          }
          
          nav::-webkit-scrollbar {
            width: 6px;
          }
          
          nav::-webkit-scrollbar-track {
            background: transparent;
          }
          
          nav::-webkit-scrollbar-thumb {
            background-color: rgba(156, 163, 175, 0.5);
            border-radius: 3px;
          }
          
          nav::-webkit-scrollbar-thumb:hover {
            background-color: rgba(156, 163, 175, 0.7);
          }
          
          /* Hide scrollbar when not hovered */
          nav:not(:hover)::-webkit-scrollbar-thumb {
            background-color: transparent;
          }
          
          nav:not(:hover) {
            scrollbar-color: transparent transparent;
          }
        `}</style>
      </aside>
    </>
  );
};

export default withAuth(Sidebar);