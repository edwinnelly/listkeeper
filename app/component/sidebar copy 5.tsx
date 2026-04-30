import React, { useState, useCallback, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
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
  Percent,
  User,
  Settings,
  Power,
  BadgeCheck,
  Inbox,
  Send,
  Folder,
  X,
  ChevronDown,
  ChevronRight,
  ShoppingBagIcon,
  DollarSign,
  Receipt,
  Banknote,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Wallet,
  Landmark,
  FileSpreadsheet,
  Scale,
  Calculator,
  History,
  ArrowLeftRight,
  Package,
  Truck,
  Tags,
} from "lucide-react";
import Cookies from "js-cookie";
import api from "@/lib/axios";
import { withAuth } from "@/hoc/withAuth";
import { Cart16Filled } from "@fluentui/react-icons";

import { User as AppUser } from "../../hoc/user";

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  user: AppUser | null;
}

// -------------------- Sidebar Component --------------------
const Sidebar: React.FC<SidebarProps> = ({
  sidebarOpen,
  setSidebarOpen,
  user
}) => {
  const pathname = usePathname();
  const [openSections, setOpenSections] = useState<Set<string>>(
    new Set(["main"]),
  );
  const [activeView, setActiveView] = useState<"app" | "mail">("app");
  const navRef = useRef<HTMLDivElement>(null);
  const isScrollingProgrammatically = useRef(false);

  //  console.log("USER:", user);

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

  const closeSidebar = useCallback(
    () => setSidebarOpen(false),
    [setSidebarOpen],
  );

  const toggleSection = useCallback((sectionKey: string) => {
    if (!navRef.current) return;

    const currentScrollTop = navRef.current.scrollTop;

    setOpenSections((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(sectionKey)) {
        newSet.delete(sectionKey);
      } else {
        newSet.add(sectionKey);
      }
      return newSet;
    });

    setTimeout(() => {
      if (navRef.current && !isScrollingProgrammatically.current) {
        isScrollingProgrammatically.current = true;
        navRef.current.scrollTop = currentScrollTop;
        setTimeout(() => {
          isScrollingProgrammatically.current = false;
        }, 50);
      }
    }, 0);
  }, []);

  const handleNavScroll = useCallback(() => {
    if (!isScrollingProgrammatically.current && navRef.current) {
      sessionStorage.setItem(
        "sidebarScroll",
        navRef.current.scrollTop.toString(),
      );
    }
  }, []);

  useEffect(() => {
    const savedScroll = sessionStorage.getItem("sidebarScroll");
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
    indent?: boolean;
    isSubItem?: boolean;
  }> = React.memo(
    ({ href, label, icon: Icon, badge, disabled, isNew, count, indent, isSubItem }) => {
      const isActive = pathname === href || pathname?.startsWith(href + '/');

      return (
        <Link
          href={href}
          className={`group relative flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-all duration-200 ease-out ${
            indent ? "ml-6" : ""
          } ${
            isActive
              ? "bg-gray-50 text-gray-700 dark:bg-gray-900/20 dark:text-gray-300 border-r-2 border-gray-500"
              : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/60 border-r-2 border-transparent"
          } ${disabled ? "opacity-40 cursor-not-allowed" : ""}`}
          onClick={closeSidebar}
          aria-current={isActive ? "page" : undefined}
        >
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div
              className={`transition-all duration-200 flex-shrink-0 ${
                isActive
                  ? "text-gray-600 dark:text-gray-400"
                  : "text-gray-500 group-hover:text-gray-700 dark:group-hover:text-gray-300"
              }`}
            >
              <Icon size={isSubItem ? 16 : 18} />
            </div>
            <span className="truncate text-sm">{label}</span>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0 ml-2">
            {isNew && (
              <span className="px-1.5 py-0.5 text-[10px] bg-blue-500 text-white rounded font-medium">
                New
              </span>
            )}
            {badge && (
              <span className="px-1.5 py-0.5 text-[10px] bg-gray-500 text-white rounded font-medium">
                {badge}
              </span>
            )}
            {count !== undefined && (
              <span
                className={`px-1.5 py-0.5 text-[10px] rounded-full font-medium ${
                  isActive
                    ? "bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-200"
                    : "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                }`}
              >
                {count}
              </span>
            )}
          </div>
        </Link>
      );
    },
  );
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
            className="flex items-center justify-between w-full font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 px-3 py-2 hover:text-gray-700 dark:hover:text-gray-300 transition-colors duration-200 rounded-lg hover:bg-gray-100/50 dark:hover:bg-gray-800/50 group"
            style={{ fontSize: "12px" }}
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
            style={{ fontSize: "12px" }}
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

  // -------------------- Nested Sub-Section (for grouped items) --------------------
  const NavSubSection: React.FC<{
    title: string;
    sectionKey: string;
    icon: React.ElementType;
    children: React.ReactNode;
    defaultOpen?: boolean;
  }> = React.memo(({ title, sectionKey, icon: Icon, children, defaultOpen = false }) => {
    const isOpen = openSections.has(sectionKey);

    return (
      <div className="space-y-0.5">
        <button
          onClick={() => toggleSection(sectionKey)}
          className="flex items-center justify-between w-full px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-lg transition-colors duration-200 group"
        >
          <div className="flex items-center gap-3">
            <Icon size={16} className="text-gray-500 group-hover:text-gray-700" />
            <span className="text-sm">{title}</span>
          </div>
          <ChevronRight
            size={14}
            className={`transition-all duration-200 flex-shrink-0 text-gray-400 group-hover:text-gray-600 ${
              isOpen ? "rotate-90" : ""
            }`}
          />
        </button>
        <div
          className={`grid transition-all duration-300 ease-out ${
            isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
          }`}
        >
          <div className="overflow-hidden min-h-0">
            <div className="pl-2 space-y-0.5 pt-0.5">
              {children}
            </div>
          </div>
        </div>
      </div>
    );
  });
  NavSubSection.displayName = "NavSubSection";

  // -------------------- App Navigation --------------------
  const renderAppSections = () => {
    if (!user || Number(user.active_business_key) === 0) {
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
  <div>
   
  {user?.creator === "Host" && (
  <NavItem
    href="/business"
    label="Business List"
    icon={Building2}
  />
)}


{/* {user?.user_roles?.purchase_create === "yes" && (
  <NavItem
    href="/business"
    label="Business List qwwwqqq"
    icon={Building2}
  />
)} */}

  </div>
          {user?.creator === "Host" && (
          <NavItem href="/locations" label="Locations" icon={Clipboard} />
          )}
          <NavItem href="/pos" label="POS" icon={Cart16Filled} />
        </NavSection>

        <NavSection title="Sales" sectionKey="sales">
          <NavItem href="/sales" label="POS Sales" icon={ShoppingCart} />
          <NavItem href="/invoices" label="Invoices" icon={FileText} />
          <NavItem href="/customers" label="Customers" icon={Users} />
        </NavSection>

        <NavSection title="Inventory" sectionKey="inventory">
          <NavItem href="/products" label="Products Catalog" icon={Package} />
          <NavItem href="/productsecat" label="Product Categories" icon={Tags} />
          <NavItem href="/stock-transfer" label="Stock Transfer" icon={ArrowLeftRight} />
          <NavItem href="/product-units" label="Units of Measure" icon={Scale} />
        </NavSection>


        {/* <NavSection title="Purchasing" sectionKey="purchasing">

          {user?.user_roles?.purchase_read === "no" && (
          <NavItem href="/purchase" label="Purchase Orders" icon={ShoppingCart} />
          )};
          {user?.user_roles?.purchase_create === "no" && (
          <NavItem href="/purchase-orders" label="Create PO" icon={BadgePlus} isSubItem />  )};
          <NavItem href="/purchase/receive" label="Receive Items" icon={CheckCircle} isSubItem />
          <NavItem href="/vendors" label="Suppliers" icon={Building2} />
        </NavSection> */}

        <NavSection title="Purchasing" sectionKey="purchasing">
  {user?.user_roles?.purchase_read =="yes" && (
    <NavItem href="/purchase" label="Purchase Orders" icon={ShoppingCart} />
  )}
  {user?.user_roles?.purchase_create === "yes" && (
    <NavItem href="/purchase-orders" label="Create PO" icon={BadgePlus} isSubItem />
  )}
  <NavItem href="/purchase/receive" label="Receive Items" icon={CheckCircle} isSubItem />
  <NavItem href="/vendors" label="Suppliers" icon={Building2} />
</NavSection>

        {/* ============================================ */}
        {/* ACCOUNTING SECTION - GROUPED INTO SUB-SECTIONS */}
        {/* ============================================ */}
        
        <NavSection title="Accounting" sectionKey="accounting">
          {/* Accounting Dashboard */}
          <NavItem 
            href="/accounting" 
            label="Accounting Dashboard" 
            icon={LayoutDashboard} 
          />

          {/* Accounts Payable Group */}
          <NavSubSection 
            title="Accounts Payable" 
            sectionKey="accounting-payables" 
            icon={CreditCard}
          >
            <NavItem href="/accounting/payables" label="Overview" icon={CreditCard} indent isSubItem />
            <NavItem href="/accounting/payables/bills" label="Bills" icon={Receipt} indent isSubItem />
            <NavItem href="/accounting/payables/payments" label="Payments" icon={Banknote} indent isSubItem />
            <NavItem href="/accounting/payables/schedule" label="Payment Schedule" icon={Calendar} indent isSubItem />
            <NavItem href="/accounting/payables/aging" label="Aged Payables" icon={Clock} indent isSubItem />
          </NavSubSection>

          {/* Accounts Receivable Group */}
          <NavSubSection 
            title="Accounts Receivable" 
            sectionKey="accounting-receivables" 
            icon={Wallet}
          >
            <NavItem href="/accounting/receivables" label="Overview" icon={Wallet} indent isSubItem />
            <NavItem href="/accounting/receivables/invoices" label="Invoices" icon={FileText} indent isSubItem />
            <NavItem href="/accounting/receivables/payments" label="Receive Payments" icon={TrendingUp} indent isSubItem />
            <NavItem href="/accounting/receivables/aging" label="Aged Receivables" icon={Clock} indent isSubItem />
          </NavSubSection>

          {/* Banking Group */}
          <NavSubSection 
            title="Banking" 
            sectionKey="accounting-banking" 
            icon={Landmark}
          >
            <NavItem href="/accounting/banking" label="Overview" icon={Landmark} indent isSubItem />
            <NavItem href="/accounting/banking/accounts" label="Bank Accounts" icon={Building2} indent isSubItem />
            <NavItem href="/accounting/banking/transactions" label="Transactions" icon={ArrowLeftRight} indent isSubItem />
            <NavItem href="/accounting/banking/reconciliation" label="Reconciliation" icon={CheckCircle} indent isSubItem />
          </NavSubSection>

          {/* Expenses Group */}
          <NavSubSection 
            title="Expenses" 
            sectionKey="accounting-expenses" 
            icon={TrendingDown}
          >
            <NavItem href="/accounting/expenses" label="All Expenses" icon={TrendingDown} indent isSubItem />
            <NavItem href="/accounting/expenses/categories" label="Categories" icon={Folder} indent isSubItem />
            <NavItem href="/accounting/expenses/recurring" label="Recurring" icon={History} indent isSubItem />
          </NavSubSection>

          {/* General Ledger Group */}
          <NavSubSection 
            title="General Ledger" 
            sectionKey="accounting-ledger" 
            icon={Book}
          >
            <NavItem href="/accounting/ledger" label="General Ledger" icon={Book} indent isSubItem />
            <NavItem href="/accounting/chart-of-accounts" label="Chart of Accounts" icon={FileSpreadsheet} indent isSubItem />
            <NavItem href="/accounting/journal-entries" label="Journal Entries" icon={FileText} indent isSubItem />
            <NavItem href="/accounting/trial-balance" label="Trial Balance" icon={Scale} indent isSubItem />
          </NavSubSection>

          {/* Tax Group */}
          <NavSubSection 
            title="Tax" 
            sectionKey="accounting-tax" 
            icon={Calculator}
          >
            <NavItem href="/accounting/tax" label="Tax Dashboard" icon={Calculator} indent isSubItem />
            <NavItem href="/accounting/tax/rates" label="Tax Rates" icon={Percent} indent isSubItem />
            <NavItem href="/accounting/tax/reports" label="Tax Reports" icon={FileText} indent isSubItem />
            <NavItem href="/accounting/tax/filing" label="Tax Filing" icon={CheckCircle} indent isSubItem />
          </NavSubSection>

          {/* Reports Group */}
          <NavSubSection 
            title="Financial Reports" 
            sectionKey="accounting-reports" 
            icon={BarChart3}
          >
            <NavItem href="/accounting/reports" label="Reports Dashboard" icon={BarChart3} indent isSubItem />
            <NavItem href="/accounting/reports/profit-loss" label="Profit & Loss" icon={TrendingUp} indent isSubItem />
            <NavItem href="/accounting/reports/balance-sheet" label="Balance Sheet" icon={Scale} indent isSubItem />
            <NavItem href="/accounting/reports/cash-flow" label="Cash Flow" icon={DollarSign} indent isSubItem />
            <NavItem href="/accounting/reports/aged-payables" label="Aged Payables" icon={Clock} indent isSubItem />
            <NavItem href="/accounting/reports/aged-receivables" label="Aged Receivables" icon={Clock} indent isSubItem />
            <NavItem href="/accounting/reports/general-ledger" label="General Ledger" icon={Book} indent isSubItem />
            <NavItem href="/accounting/reports/transaction" label="Transaction Report" icon={FileText} indent isSubItem />
          </NavSubSection>

          {/* Budget Group */}
          <NavSubSection 
            title="Budgeting" 
            sectionKey="accounting-budget" 
            icon={Calculator}
          >
            <NavItem href="/accounting/budget" label="Budget Overview" icon={Calculator} indent isSubItem />
            <NavItem href="/accounting/budget/setup" label="Budget Setup" icon={Settings} indent isSubItem />
            <NavItem href="/accounting/budget/vs-actual" label="Budget vs Actual" icon={BarChart3} indent isSubItem />
          </NavSubSection>

          {/* Audit Group */}
          <NavSubSection 
            title="Audit & Compliance" 
            sectionKey="accounting-audit" 
            icon={History}
          >
            <NavItem href="/accounting/audit-trail" label="Audit Trail" icon={History} indent isSubItem />
            <NavItem href="/accounting/audit/user-activity" label="User Activity" icon={User} indent isSubItem />
            <NavItem href="/accounting/audit/document-history" label="Document History" icon={FileText} indent isSubItem />
          </NavSubSection>
        </NavSection>

        {/* ============================================ */}
        {/* END ACCOUNTING SECTION                        */}
        {/* ============================================ */}

        <NavSection title="Analytics" sectionKey="analytics">
          <NavItem
            href="/reports"
            label="Smart Reports"
            icon={BarChart3}
            badge="AI"
            isNew
          />
          <NavItem
            href="/analytics"
            label="Advanced Analytics"
            icon={PieChart}
          />
        </NavSection>

        <NavSection title="Administration" sectionKey="administration">
          <NavItem href="/users" label="User Management" icon={User} />
          <NavItem href="/roles" label="Roles & Permissions" icon={BadgeCheck} isSubItem />
          <NavItem href="/settings" label="System Settings" icon={Settings} isSubItem />
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
        className={`fixed lg:sticky top-0 w-72 h-screen flex flex-col bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transform transition-all duration-300 ease-out z-40 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
        aria-label="Main navigation"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
          <Link
            href="/dashboard"
            className="flex items-center gap-3"
            onClick={closeSidebar}
          >
            <Image
              src="https://cdn4.iconfinder.com/data/icons/logos-and-brands/512/44_Bitbucket_logo_logos-256.png"
              alt="Logo"
              width={32}
              height={32}
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
                ? "text-gray-600 border-b-2 border-gray-500 bg-white dark:bg-gray-900"
                : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
            }`}
          >
            <LayoutDashboard size={16} className="inline-block mr-1" /> Products
          </button>
          <button
            onClick={() => setActiveView("mail")}
            className={`flex-1 py-3 text-sm font-medium ${
              activeView === "mail"
                ? "text-gray-600 border-b-2 border-gray-500 bg-white dark:bg-gray-900"
                : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
            }`}
          >
            <ShoppingBagIcon size={17} className="inline-block mr-1" /> Services
          </button>
        </div>

        {/* Main Navigation */}
        <div className="flex-1 overflow-hidden">
          <nav
            ref={navRef}
            className="h-full overflow-y-auto p-3 space-y-3"
            onScroll={handleNavScroll}
          >
            {activeView === "app" ? renderAppSections() : renderMailSections()}
          </nav>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-800 p-3 bg-gray-50 dark:bg-gray-800/50">
          <div className="flex items-center gap-3 p-2 bg-white dark:bg-gray-800 border rounded-lg">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gray-500 to-gray-600 flex items-center justify-center text-white font-semibold text-sm">
              {user?.name?.charAt(0).toUpperCase() || "U"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-medium text-gray-900 dark:text-gray-100 text-sm truncate">
                {user?.name || "User"}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {user?.email || "user@example.com"}
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