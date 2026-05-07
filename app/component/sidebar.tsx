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
  LogOut,
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

const Sidebar: React.FC<SidebarProps> = ({ sidebarOpen, setSidebarOpen, user }) => {
  const pathname = usePathname();
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(["main"]));
  const [activeView, setActiveView] = useState<"app" | "mail">("app");
  const navRef = useRef<HTMLDivElement>(null);
  const isScrollingProgrammatically = useRef(false);

  const hasPermission = useCallback(
    (key: keyof AppUser["user_roles"]) => {
      if (user?.user_roles?.permission === "yes") return true;
      return user?.user_roles?.[key] === "yes";
    },
    [user]
  );

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
    const currentScrollTop = navRef.current.scrollTop;
    setOpenSections((prev) => {
      const newSet = new Set(prev);
      newSet.has(sectionKey) ? newSet.delete(sectionKey) : newSet.add(sectionKey);
      return newSet;
    });
    setTimeout(() => {
      if (navRef.current && !isScrollingProgrammatically.current) {
        isScrollingProgrammatically.current = true;
        navRef.current.scrollTop = currentScrollTop;
        setTimeout(() => { isScrollingProgrammatically.current = false; }, 50);
      }
    }, 0);
  }, []);

  const handleNavScroll = useCallback(() => {
    if (!isScrollingProgrammatically.current && navRef.current) {
      sessionStorage.setItem("sidebarScroll", navRef.current.scrollTop.toString());
    }
  }, []);

  useEffect(() => {
    const savedScroll = sessionStorage.getItem("sidebarScroll");
    if (savedScroll && navRef.current) {
      setTimeout(() => {
        if (navRef.current) {
          isScrollingProgrammatically.current = true;
          navRef.current.scrollTop = parseInt(savedScroll, 10);
          setTimeout(() => { isScrollingProgrammatically.current = false; }, 50);
        }
      }, 100);
    }
  }, []);

  // -------------------- Nav Item --------------------
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
  }> = React.memo(({ href, label, icon: Icon, badge, disabled, isNew, count, indent, isSubItem }) => {
    const isActive = pathname === href || pathname?.startsWith(href + "/");

    return (
      <Link
        href={href}
        onClick={closeSidebar}
        aria-current={isActive ? "page" : undefined}
        className={`
          group relative flex items-center justify-between rounded-xl px-3 py-2 text-sm transition-all duration-150
          ${indent ? "ml-5" : ""}
          ${isActive
            ? "bg-gray-900 text-white shadow-sm shadow-gray-900/20"
            : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/60 hover:text-gray-900 dark:hover:text-gray-200"
          }
          ${disabled ? "opacity-40 cursor-not-allowed pointer-events-none" : ""}
        `}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className={`flex-shrink-0 transition-colors duration-150 ${isActive ? "text-white" : "text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300"}`}>
            <Icon size={isSubItem ? 14 : 16} strokeWidth={isActive ? 2 : 1.75} />
          </div>
          <span className={`truncate ${isSubItem ? "text-[13px]" : "text-[13px]"} font-medium`}>{label}</span>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0 ml-2">
          {isNew && (
            <span className="px-1.5 py-0.5 text-[9px] tracking-wide bg-blue-500 text-white rounded-md font-bold uppercase">
              New
            </span>
          )}
          {badge && (
            <span className={`px-1.5 py-0.5 text-[9px] tracking-wide rounded-md font-bold uppercase ${isActive ? "bg-white/20 text-white" : "bg-gray-200 text-gray-600"}`}>
              {badge}
            </span>
          )}
          {count !== undefined && (
            <span className={`min-w-[18px] h-[18px] flex items-center justify-center text-[10px] rounded-full font-bold ${isActive ? "bg-white/20 text-white" : "bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300"}`}>
              {count}
            </span>
          )}
        </div>
      </Link>
    );
  });
  NavItem.displayName = "NavItem";

  // -------------------- Nav Section --------------------
  const NavSection: React.FC<{
    title: string;
    sectionKey: string;
    collapsible?: boolean;
    children: React.ReactNode;
  }> = React.memo(({ title, sectionKey, collapsible = true, children }) => {
    const isOpen = openSections.has(sectionKey);
    return (
      <div className="space-y-0.5">
        {collapsible ? (
          <button
            onClick={() => toggleSection(sectionKey)}
            className="flex items-center justify-between w-full px-3 py-1.5 mb-1 hover:text-gray-900 dark:hover:text-gray-200 transition-colors duration-150 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/40 group"
          >
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 group-hover:text-gray-500">
              {title}
            </span>
            <ChevronDown
              size={12}
              className={`text-gray-300 group-hover:text-gray-500 transition-transform duration-200 flex-shrink-0 ${isOpen ? "rotate-180" : ""}`}
            />
          </button>
        ) : (
          <div className="px-3 py-1.5 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">
              {title}
            </span>
          </div>
        )}
        <div className={`grid transition-all duration-300 ease-out ${isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
          <div className="overflow-hidden min-h-0">
            <div className="space-y-0.5 pb-2">{children}</div>
          </div>
        </div>
      </div>
    );
  });
  NavSection.displayName = "NavSection";

  // -------------------- Nav Sub-Section --------------------
  const NavSubSection: React.FC<{
    title: string;
    sectionKey: string;
    icon: React.ElementType;
    children: React.ReactNode;
    defaultOpen?: boolean;
  }> = React.memo(({ title, sectionKey, icon: Icon, children }) => {
    const isOpen = openSections.has(sectionKey);
    return (
      <div className="space-y-0.5">
        <button
          onClick={() => toggleSection(sectionKey)}
          className="flex items-center justify-between w-full px-3 py-2 rounded-xl text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-colors duration-150 group"
        >
          <div className="flex items-center gap-2.5">
            <Icon size={14} strokeWidth={1.75} className="text-gray-400 group-hover:text-gray-600 flex-shrink-0" />
            <span className="text-[13px] font-medium">{title}</span>
          </div>
          <ChevronRight
            size={12}
            className={`text-gray-300 group-hover:text-gray-500 transition-transform duration-200 flex-shrink-0 ${isOpen ? "rotate-90" : ""}`}
          />
        </button>
        <div className={`grid transition-all duration-300 ease-out ${isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
          <div className="overflow-hidden min-h-0">
            <div className="ml-4 pl-3 border-l border-gray-100 dark:border-gray-800 space-y-0.5 pt-0.5 pb-1">
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
          {user?.creator === "Host" && (
            <NavItem href="/business" label="Business List" icon={Building2} />
          )}
          {user?.creator === "Host" && (
            <NavItem href="/locations" label="Locations" icon={Clipboard} />
          )}
          <NavItem href="/pos" label="POS Terminal" icon={Cart16Filled} />
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

        <NavSection title="Purchasing" sectionKey="purchasing">
          {user?.user_roles?.purchase_read == "yes" && (
            <NavItem href="/purchase" label="Purchase Orders" icon={ShoppingCart} />
          )}
          {user?.user_roles?.purchase_create === "yes" && (
            <NavItem href="/purchase-orders" label="Create PO" icon={BadgePlus} isSubItem />
          )}
          <NavItem href="/purchase/receive" label="Receive Items" icon={CheckCircle} isSubItem />
          {user?.user_roles?.vendor_read === "yes" && (
            <NavItem href="/vendors" label="Suppliers" icon={Building2} />
          )}
        </NavSection>

        <NavSection title="Accounting" sectionKey="accounting">
          <NavItem href="/accounting" label="Accounting Dashboard" icon={LayoutDashboard} />
          <NavSubSection title="Accounts Payable" sectionKey="accounting-payables" icon={CreditCard}>
            <NavItem href="/accounting/payables" label="Overview" icon={CreditCard} isSubItem />
            <NavItem href="/accounting/payables/bills" label="Bills" icon={Receipt} isSubItem />
            <NavItem href="/accounting/payables/payments" label="Payments" icon={Banknote} isSubItem />
            <NavItem href="/accounting/payables/schedule" label="Payment Schedule" icon={Calendar} isSubItem />
            <NavItem href="/accounting/payables/aging" label="Aged Payables" icon={Clock} isSubItem />
          </NavSubSection>
          <NavSubSection title="Accounts Receivable" sectionKey="accounting-receivables" icon={Wallet}>
            <NavItem href="/accounting/receivables" label="Overview" icon={Wallet} isSubItem />
            <NavItem href="/accounting/receivables/invoices" label="Invoices" icon={FileText} isSubItem />
            <NavItem href="/accounting/receivables/payments" label="Receive Payments" icon={TrendingUp} isSubItem />
            <NavItem href="/accounting/receivables/aging" label="Aged Receivables" icon={Clock} isSubItem />
          </NavSubSection>
          <NavSubSection title="Banking" sectionKey="accounting-banking" icon={Landmark}>
            <NavItem href="/accounting/banking" label="Overview" icon={Landmark} isSubItem />
            <NavItem href="/accounting/banking/accounts" label="Bank Accounts" icon={Building2} isSubItem />
            <NavItem href="/accounting/banking/transactions" label="Transactions" icon={ArrowLeftRight} isSubItem />
            <NavItem href="/accounting/banking/reconciliation" label="Reconciliation" icon={CheckCircle} isSubItem />
          </NavSubSection>
          <NavSubSection title="Expenses" sectionKey="accounting-expenses" icon={TrendingDown}>
            <NavItem href="/accounting/expenses" label="All Expenses" icon={TrendingDown} isSubItem />
            <NavItem href="/accounting/expenses/categories" label="Categories" icon={Folder} isSubItem />
            <NavItem href="/accounting/expenses/recurring" label="Recurring" icon={History} isSubItem />
          </NavSubSection>
          <NavSubSection title="General Ledger" sectionKey="accounting-ledger" icon={Book}>
            <NavItem href="/accounting/ledger" label="General Ledger" icon={Book} isSubItem />
            <NavItem href="/accounting/chart-of-accounts" label="Chart of Accounts" icon={FileSpreadsheet} isSubItem />
            <NavItem href="/accounting/journal-entries" label="Journal Entries" icon={FileText} isSubItem />
            <NavItem href="/accounting/trial-balance" label="Trial Balance" icon={Scale} isSubItem />
          </NavSubSection>
          <NavSubSection title="Tax" sectionKey="accounting-tax" icon={Calculator}>
            <NavItem href="/accounting/tax" label="Tax Dashboard" icon={Calculator} isSubItem />
            <NavItem href="/accounting/tax/rates" label="Tax Rates" icon={Percent} isSubItem />
            <NavItem href="/accounting/tax/reports" label="Tax Reports" icon={FileText} isSubItem />
            <NavItem href="/accounting/tax/filing" label="Tax Filing" icon={CheckCircle} isSubItem />
          </NavSubSection>
          <NavSubSection title="Financial Reports" sectionKey="accounting-reports" icon={BarChart3}>
            <NavItem href="/accounting/reports" label="Reports Dashboard" icon={BarChart3} isSubItem />
            <NavItem href="/accounting/reports/profit-loss" label="Profit & Loss" icon={TrendingUp} isSubItem />
            <NavItem href="/accounting/reports/balance-sheet" label="Balance Sheet" icon={Scale} isSubItem />
            <NavItem href="/accounting/reports/cash-flow" label="Cash Flow" icon={DollarSign} isSubItem />
            <NavItem href="/accounting/reports/aged-payables" label="Aged Payables" icon={Clock} isSubItem />
            <NavItem href="/accounting/reports/aged-receivables" label="Aged Receivables" icon={Clock} isSubItem />
            <NavItem href="/accounting/reports/general-ledger" label="General Ledger" icon={Book} isSubItem />
            <NavItem href="/accounting/reports/transaction" label="Transaction Report" icon={FileText} isSubItem />
          </NavSubSection>
          <NavSubSection title="Budgeting" sectionKey="accounting-budget" icon={Calculator}>
            <NavItem href="/accounting/budget" label="Budget Overview" icon={Calculator} isSubItem />
            <NavItem href="/accounting/budget/setup" label="Budget Setup" icon={Settings} isSubItem />
            <NavItem href="/accounting/budget/vs-actual" label="Budget vs Actual" icon={BarChart3} isSubItem />
          </NavSubSection>
          <NavSubSection title="Audit & Compliance" sectionKey="accounting-audit" icon={History}>
            <NavItem href="/accounting/audit-trail" label="Audit Trail" icon={History} isSubItem />
            <NavItem href="/accounting/audit/user-activity" label="User Activity" icon={User} isSubItem />
            <NavItem href="/accounting/audit/document-history" label="Document History" icon={FileText} isSubItem />
          </NavSubSection>
        </NavSection>

        <NavSection title="Analytics" sectionKey="analytics">
          <NavItem href="/reports" label="Smart Reports" icon={BarChart3} badge="AI" isNew />
          <NavItem href="/analytics" label="Advanced Analytics" icon={PieChart} />
        </NavSection>

        <NavSection title="Administration" sectionKey="administration">
          <NavItem href="/users" label="User Management" icon={User} />
          <NavItem href="/roles" label="Roles & Permissions" icon={BadgeCheck} isSubItem />
          <NavItem href="/settings" label="System Settings" icon={Settings} isSubItem />
        </NavSection>
      </>
    );
  };

  // -------------------- Mail Navigation --------------------
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

  // -------------------- Render --------------------
  return (
    <>
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-30 lg:hidden transition-all duration-300"
          onClick={closeSidebar}
        />
      )}

      <aside
        className={`fixed lg:sticky top-0 w-64 h-screen flex flex-col bg-white dark:bg-gray-950 border-r border-gray-100 dark:border-gray-800/60 transform transition-all duration-300 ease-out z-40 ${
          sidebarOpen ? "translate-x-0 shadow-2xl shadow-gray-900/10" : "-translate-x-full lg:translate-x-0"
        }`}
        aria-label="Main navigation"
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100 dark:border-gray-800/60">
          <Link href="/dashboard" onClick={closeSidebar} className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 bg-gray-900 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-gray-800 transition-colors">
              <Image
                src="https://cdn4.iconfinder.com/data/icons/logos-and-brands/512/44_Bitbucket_logo_logos-256.png"
                alt="Logo" width={18} height={18} className="w-4.5 h-4.5 brightness-0 invert"
              />
            </div>
            <div>
              <span className="text-[13px] font-bold text-gray-900 dark:text-gray-100 leading-none block">
                Business Suite
              </span>
              <span className="text-[10px] text-gray-400 leading-none">Management Platform</span>
            </div>
          </Link>
          <button
            onClick={closeSidebar}
            className="lg:hidden w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={14} />
          </button>
        </div>

        {/* ── View Toggle ── */}
        <div className="px-3 py-2.5 border-b border-gray-100 dark:border-gray-800/60">
          <div className="flex bg-gray-100 dark:bg-gray-800/80 rounded-xl p-1 gap-1">
            {[
              { key: "app", label: "Products", icon: LayoutDashboard },
              { key: "mail", label: "Services", icon: ShoppingBagIcon },
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveView(key as "app" | "mail")}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[12px] font-semibold transition-all duration-150 ${
                  activeView === key
                    ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                }`}
              >
                <Icon size={13} />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Navigation ── */}
        <div className="flex-1 overflow-hidden">
          <nav
            ref={navRef}
            className="h-full overflow-y-auto px-3 py-3 space-y-4"
            onScroll={handleNavScroll}
          >
            {activeView === "app" ? renderAppSections() : renderMailSections()}

            {/* Bottom spacer */}
            <div className="h-2" />
          </nav>
        </div>

        {/* ── User Footer ── */}
        <div className="border-t border-gray-100 dark:border-gray-800/60 p-3 space-y-2">
          {/* User card */}
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800">
            <div className="w-8 h-8 rounded-xl bg-gray-900 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-[13px] leading-none">
                {user?.name?.charAt(0).toUpperCase() || "U"}
              </span>
            </div>
            
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-semibold text-gray-900 dark:text-gray-100 truncate leading-tight">
                {user?.name || "User"}
              </p>
              <p className="text-[11px] text-gray-400 dark:text-gray-500 truncate leading-tight">
                {user?.email || "user@example.com"}
              </p>
            </div>
          </div>

          {/* Sign out */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 text-[13px] font-semibold transition-all duration-150 border border-gray-100 dark:border-gray-800 hover:border-red-200 dark:hover:border-red-900/40"
          >
            <LogOut size={14} />
            Sign Out
          </button>
        </div>

        {/* Scrollbar styles */}
        <style jsx>{`
          nav {
            scrollbar-width: thin;
            scrollbar-color: rgba(156, 163, 175, 0.4) transparent;
          }
          nav::-webkit-scrollbar { width: 4px; }
          nav::-webkit-scrollbar-track { background: transparent; }
          nav::-webkit-scrollbar-thumb {
            background-color: rgba(156, 163, 175, 0.4);
            border-radius: 4px;
          }
          nav::-webkit-scrollbar-thumb:hover { background-color: rgba(107, 114, 128, 0.6); }
          nav:not(:hover)::-webkit-scrollbar-thumb { background-color: transparent; }
          nav:not(:hover) { scrollbar-color: transparent transparent; }
        `}</style>
      </aside>
    </>
  );
};

export default withAuth(Sidebar);