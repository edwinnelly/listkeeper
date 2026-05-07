'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft, TrendingUp, TrendingDown, DollarSign, ShoppingCart,
  Users, MapPin, Phone, Mail, Clock, BarChart3, Activity,
  ChevronRight, Truck, ArrowLeftRight, ClipboardCheck, BadgeCheck,
  AlertTriangle, Package, RotateCw, Gauge, CheckCircle2,
  Warehouse, Calendar, Receipt, ArrowDownLeft, RefreshCcw,
} from 'lucide-react';
import Link from 'next/link';

// ─── Base styles ─────────────────────────────────────────────────────────────
const BaseStyle = () => (
  <style>{`
    *, *::before, *::after { box-sizing: border-box; }
    .loc-root { -webkit-font-smoothing: antialiased; }
    .loc-mono { font-family: 'JetBrains Mono', monospace; }

    .loc-scroll::-webkit-scrollbar { width: 4px; }
    .loc-scroll::-webkit-scrollbar-track { background: transparent; }
    .loc-scroll::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 99px; }

    .loc-hero-noise {
      position: relative;
      background: #0d1117;
      overflow: hidden;
    }
    .loc-hero-noise::before {
      content: '';
      position: absolute;
      inset: 0;
      background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E");
      opacity: 0.6;
      pointer-events: none;
    }

    @keyframes shimmer {
      0%   { background-position: -600px 0; }
      100% { background-position: 600px 0; }
    }

    .loc-stat-card { transition: transform 150ms ease, box-shadow 150ms ease; }
    .loc-stat-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px -4px rgba(0,0,0,0.08); }

    .loc-tr { transition: background 100ms ease; }
    .loc-tr:hover { background: #f9fafb; }

    .loc-activity-row { transition: background 110ms ease; }
    .loc-activity-row:hover { background: #f3f4f6; }

    .loc-back-btn { transition: background 120ms ease, border-color 120ms ease; }
    .loc-back-btn:hover { background: #f3f4f6; border-color: #d1d5db !important; }

    .loc-view-all-btn { transition: background 120ms ease, color 120ms ease; }
    .loc-view-all-btn:hover { background: #f3f4f6; color: #111 !important; }

    @keyframes fillArc {
      from { stroke-dashoffset: 264; }
      to   { stroke-dashoffset: 16.6; }
    }
    .arc-fill {
      animation: fillArc 1.5s ease-out forwards;
    }

    /* Summary metric card */
    .summary-metric-card {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 14px 16px;
      border-radius: 12px;
      border: 1px solid #f0f0ef;
      background: #fafaf9;
      transition: transform 140ms ease, box-shadow 140ms ease;
    }
    .summary-metric-card:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 16px -4px rgba(0,0,0,0.07);
      background: #fff;
    }
  `}</style>
);

// ─── Static mock data ─────────────────────────────────────────────────────────
const branchInfo = {
  name: 'Ikeja Branch',
  location: 'Lagos, Nigeria',
  address: '123 Allen Avenue, Ikeja',
  manager: 'Funke Adebayo',
  managerEmail: 'funke.adebayo@company.com',
  managerPhone: '+234 802 345 6789',
  staffCount: 14,
  operatingHours: '8:00 AM – 6:00 PM (Mon–Sat)',
  status: 'active',
};

const inventoryValue = {
  total: '₦12,845,600', items: '3,842', categories: 18, trend: '+5.3%', trendUp: true,
  breakdown: [
    { label: 'Raw Materials',  value: '₦4.2M', pct: 33 },
    { label: 'Finished Goods', value: '₦5.8M', pct: 45 },
    { label: 'Packaging',      value: '₦1.6M', pct: 13 },
    { label: 'Consumables',    value: '₦1.2M', pct:  9 },
  ],
};

// ─── NEW: Daily summary metrics ───────────────────────────────────────────────
const dailySummary = {
  totalSales:     { value: '₦2,380,000', trend: '+12.4%', trendUp: true,  note: 'vs. yesterday'   },
  totalExpenses:  { value: '₦340,500',   trend: '+2.1%',  trendUp: false, note: 'vs. yesterday'   },
  totalReturns:   { value: '₦87,200',    count: 6,        trend: '-3 items', trendUp: true,  note: 'items returned' },
};

const stockTurnover = {
  rate: '4.2x', days: '87 days', trend: '+0.5x', trendUp: true,
  fastMoving: 65, slowMoving: 25, deadStock: 10,
  monthlyData: [
    { month: 'Jan', turnover: 3.8 }, { month: 'Feb', turnover: 4.0 },
    { month: 'Mar', turnover: 3.9 }, { month: 'Apr', turnover: 4.1 },
    { month: 'May', turnover: 4.3 }, { month: 'Jun', turnover: 4.2 },
  ],
};

const inventoryAccuracy = {
  lastCount: '98.5%', itemsCounted: '1,240', totalItems: '3,842',
  lastCycleCount: 'May 3, 2026', nextScheduled: 'May 10, 2026',
  discrepancies: 3, trend: '+0.3%', trendUp: true,
};

const lowStockAlerts = [
  { id: 1, product: 'Paint (20L Bucket)',   sku: 'PNT-007', currentStock: 0,  reorderPoint: 15, status: 'critical' as const, supplier: 'Spectrum Paints Ltd'  },
  { id: 2, product: 'PVC Electrical Pipes', sku: 'ELE-012', currentStock: 8,  reorderPoint: 20, status: 'critical' as const, supplier: 'Nigerian Cables PLC'  },
  { id: 3, product: 'Steel Rods (12mm)',    sku: 'STL-004', currentStock: 12, reorderPoint: 25, status: 'warning'  as const, supplier: 'Phoenix Industries'    },
  { id: 4, product: 'Roofing Sheets',       sku: 'ROF-003', currentStock: 18, reorderPoint: 30, status: 'warning'  as const, supplier: 'Aluminium World Ltd'   },
  { id: 5, product: 'Cement (50kg)',        sku: 'CEM-001', currentStock: 25, reorderPoint: 40, status: 'warning'  as const, supplier: 'Dangote Cement'        },
];

const topBranchProducts = [
  { id: 1, name: 'Dangote Cement (50kg)',          sku: 'CEM-DNG-001', sold: 340, revenue: '₦1,700,000', stock: 'In Stock',     trend: '+18%', up: true  },
  { id: 2, name: 'Aluminium Roofing Sheet',         sku: 'ROF-ALM-003', sold: 220, revenue: '₦1,100,000', stock: 'Low Stock',    trend: '+5%',  up: true  },
  { id: 3, name: 'PVC Electrical Pipe (25mm)',      sku: 'ELE-PVC-012', sold: 195, revenue: '₦390,000',   stock: 'Out of Stock', trend: '+22%', up: true  },
  { id: 4, name: 'Emulsion Paint (20L)',            sku: 'PNT-EML-007', sold: 150, revenue: '₦900,000',   stock: 'Out of Stock', trend: '-8%',  up: false },
  { id: 5, name: 'Steel Reinforcement Rod (12mm)', sku: 'STL-RNF-004', sold: 130, revenue: '₦650,000',   stock: 'In Stock',     trend: '+10%', up: true  },
];

const stockAging = {
  fastMoving: { pct: 65, desc: 'Sold within 30 days',  color: '#10b981', bg: '#ecfdf5', text: '#065f46' },
  slowMoving: { pct: 25, desc: '30–90 days in stock',  color: '#f59e0b', bg: '#fffbeb', text: '#92400e' },
  deadStock:  { pct: 10, desc: 'Over 90 days unsold',  color: '#f87171', bg: '#fef2f2', text: '#991b1b' },
};

const recentActivities = [
  { id: 1, icon: Truck,          title: 'Stock delivery received',         desc: 'Cement & roofing sheets — 340 units',   time: '30 min ago', dot: '#3b82f6' },
  { id: 2, icon: ClipboardCheck, title: 'Cycle count completed',           desc: 'Building Materials — 98.8% accuracy',   time: '1 hr ago',   dot: '#f59e0b' },
  { id: 3, icon: ArrowLeftRight, title: 'Stock transferred to warehouse',  desc: '45 units of excess inventory returned', time: '2 hrs ago',  dot: '#8b5cf6' },
  { id: 4, icon: AlertTriangle,  title: 'Low stock alert triggered',       desc: 'Paint & PVC pipes below reorder point', time: '3 hrs ago',  dot: '#f87171' },
  { id: 5, icon: BadgeCheck,     title: 'Large order fulfilled',           desc: '₦450K — School construction project',   time: '4 hrs ago',  dot: '#10b981' },
  { id: 6, icon: Truck,          title: 'Supplier delivery confirmed',     desc: 'Steel rods from Phoenix Industries',    time: '5 hrs ago',  dot: '#3b82f6' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatHeaderDate = (): string => {
  const now = new Date();
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${now.getDate()} ${months[now.getMonth()]}, ${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}`;
};

// ─── Stock badge ──────────────────────────────────────────────────────────────
const StockBadge: React.FC<{ stock: string }> = ({ stock }) => {
  const map: Record<string, { dot: string; text: string; bg: string }> = {
    'In Stock':    { dot: '#10b981', text: '#065f46', bg: '#ecfdf5' },
    'Low Stock':   { dot: '#f59e0b', text: '#92400e', bg: '#fffbeb' },
    'Out of Stock':{ dot: '#f87171', text: '#991b1b', bg: '#fef2f2' },
  };
  const s = map[stock] ?? map['Out of Stock'];
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '2px 8px', borderRadius: 5, background: s.bg, fontSize: 10, fontWeight: 700, letterSpacing: '0.04em', color: s.text }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: s.dot, flexShrink: 0 }} />
      {stock.toUpperCase()}
    </span>
  );
};

// ─── Alert badge ──────────────────────────────────────────────────────────────
const AlertBadge: React.FC<{ status: 'critical' | 'warning' }> = ({ status }) => {
  const s = status === 'critical'
    ? { dot: '#f87171', text: '#991b1b', bg: '#fef2f2', label: 'CRITICAL' }
    : { dot: '#f59e0b', text: '#92400e', bg: '#fffbeb', label: 'WARNING'  };
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '2px 8px', borderRadius: 5, background: s.bg, fontSize: 10, fontWeight: 700, letterSpacing: '0.04em', color: s.text }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: s.dot, flexShrink: 0 }} />
      {s.label}
    </span>
  );
};

// ─── Stat card ────────────────────────────────────────────────────────────────
const StatCard: React.FC<{
  title: string; value: string;
  icon: React.ElementType; iconBg: string; iconColor: string;
  trend?: { value: string; up: boolean };
}> = ({ title, value, icon: Icon, iconBg, iconColor, trend }) => (
  <div className="loc-stat-card" style={{ background: '#fff', border: '1px solid #f0f0ef', borderRadius: 16, padding: '16px 18px' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
      <div style={{ width: 36, height: 36, borderRadius: 10, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={16} color={iconColor} />
      </div>
      {trend && (
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 3,
          fontSize: 10.5, fontWeight: 500, padding: '3px 8px', borderRadius: 6,
          background: trend.up ? '#f0fdf4' : '#fef2f2',
          color: trend.up ? '#15803d' : '#dc2626',
        }}>
          {trend.up ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
          {trend.value}
        </span>
      )}
    </div>
    <p className="loc-mono" style={{ fontSize: 22, fontWeight: 600, color: '#0d1117', margin: '0 0 3px', letterSpacing: '-0.02em' }}>
      {value}
    </p>
    <p style={{ fontSize: 11, color: '#9ca3af', margin: 0 }}>{title}</p>
  </div>
);

// ─── Section card ─────────────────────────────────────────────────────────────
const SectionCard: React.FC<{
  title: string; subtitle: string;
  icon: React.ElementType; iconBg?: string;
  children: React.ReactNode;
}> = ({ title, subtitle, icon: Icon, iconBg = '#0d1117', children }) => (
  <div style={{ background: '#fff', border: '1px solid #f0f0ef', borderRadius: 16, overflow: 'hidden' }}>
    <div style={{ padding: '16px 20px', borderBottom: '1px solid #f0f0ef', display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ width: 34, height: 34, borderRadius: 10, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={15} color="#fff" />
      </div>
      <div>
        <p style={{ fontSize: 12, fontWeight: 600, color: '#111', margin: 0, letterSpacing: '0.01em' }}>{title}</p>
        <p style={{ fontSize: 11, color: '#9ca3af', margin: '1px 0 0' }}>{subtitle}</p>
      </div>
    </div>
    <div style={{ padding: '20px' }}>{children}</div>
  </div>
);

// ─── Progress bar ─────────────────────────────────────────────────────────────
const ProgressBar: React.FC<{ pct: number; color: string; height?: number }> = ({ pct, color, height = 6 }) => (
  <div style={{ width: '100%', background: '#f3f4f6', borderRadius: 99, height, overflow: 'hidden' }}>
    <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 99, transition: 'width 600ms ease' }} />
  </div>
);

// ─── Table header cell ────────────────────────────────────────────────────────
const TH: React.FC<{ children: React.ReactNode; right?: boolean }> = ({ children, right }) => (
  <th style={{
    padding: '10px 14px', fontSize: 10, fontWeight: 600, letterSpacing: '0.06em',
    textTransform: 'uppercase', color: '#9ca3af', background: '#fafaf9',
    textAlign: right ? 'right' : 'left', whiteSpace: 'nowrap',
  }}>
    {children}
  </th>
);

// ─── Daily Summary Metric ─────────────────────────────────────────────────────
const DailyMetric: React.FC<{
  label: string;
  value: string;
  note: string;
  trend: string;
  trendUp: boolean;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  dividerColor: string;
}> = ({ label, value, note, trend, trendUp, icon: Icon, iconBg, iconColor, dividerColor }) => (
  <div className="summary-metric-card">
    {/* Left accent bar */}
    <div style={{ width: 3, height: 40, borderRadius: 99, background: dividerColor, flexShrink: 0 }} />
    {/* Icon */}
    <div style={{ width: 36, height: 36, borderRadius: 10, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <Icon size={16} color={iconColor} />
    </div>
    {/* Text */}
    <div style={{ flex: 1, minWidth: 0 }}>
      <p style={{ fontSize: 10.5, color: '#9ca3af', margin: '0 0 2px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
      <p className="loc-mono" style={{ fontSize: 16, fontWeight: 600, color: '#0d1117', margin: '0 0 2px', letterSpacing: '-0.01em' }}>{value}</p>
      <p style={{ fontSize: 10.5, color: '#b3b8c2', margin: 0 }}>{note}</p>
    </div>
    {/* Trend badge */}
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 3, flexShrink: 0,
      fontSize: 10.5, fontWeight: 600, padding: '3px 8px', borderRadius: 6,
      background: trendUp ? '#f0fdf4' : '#fef2f2',
      color: trendUp ? '#15803d' : '#dc2626',
    }}>
      {trendUp ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
      {trend}
    </span>
  </div>
);

// ─── Main component ───────────────────────────────────────────────────────────
const LocationDashboardPage: React.FC = () => {
  const [headerTime, setHeaderTime] = useState<string>('');

  useEffect(() => {
    setHeaderTime(formatHeaderDate());
  }, []);

  const maxTurnover = Math.max(...stockTurnover.monthlyData.map(d => d.turnover));

  return (
    <>
      <BaseStyle />
      <div className="loc-root" style={{ minHeight: '100vh', background: '#f8f8f7' }}>

        {/* ── HEADER ─────────────────────────────────────────────────────── */}
        <header style={{ background: '#fff', borderBottom: '1px solid #f0f0ef', top: 0, zIndex: 40 }}>
          <div style={{ maxWidth: 1440, margin: '0 auto', padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <Link href="/dashboard">
                <div className="loc-back-btn" style={{ width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 9, border: '1px solid #e5e7eb', cursor: 'pointer' }}>
                  <ArrowLeft size={15} color="#6b7280" />
                </div>
              </Link>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                  <h1 style={{ fontSize: 15, fontWeight: 600, color: '#111', margin: 0, letterSpacing: '-0.01em' }}>{branchInfo.name}</h1>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 9.5, fontWeight: 600, padding: '2px 7px', borderRadius: 5, background: 'rgba(16,185,129,0.1)', color: '#059669', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                    <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#10b981' }} />
                    Active
                  </span>
                </div>
                <p style={{ fontSize: 11.5, color: '#9ca3af', margin: 0 }}>{branchInfo.location} · Manager: {branchInfo.manager}</p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <Clock size={12} color="#d1d5db" />
                <span style={{ fontSize: 11, color: '#9ca3af' }}>{branchInfo.operatingHours}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <Users size={12} color="#d1d5db" />
                <span style={{ fontSize: 11, color: '#9ca3af' }}>{branchInfo.staffCount} staff</span>
              </div>
              <div style={{ width: 1, height: 16, background: '#e5e7eb' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }} suppressHydrationWarning>
                <Calendar size={12} color="#d1d5db" />
                <span className="loc-mono" style={{ fontSize: 11, color: '#9ca3af' }}>{headerTime || '…'}</span>
              </div>
            </div>
          </div>
        </header>

        <main style={{ maxWidth: 1440, margin: '0 auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* ── BRANCH HERO ──────────────────────────────────────────────── */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="loc-hero-noise" style={{ borderRadius: 18, overflow: 'hidden' }}
          >
            <div style={{ padding: '18px 22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 46, height: 46, borderRadius: 13, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Warehouse size={20} color="rgba(255,255,255,0.7)" />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                    <p style={{ fontSize: 15, fontWeight: 600, color: '#fff', margin: 0, letterSpacing: '-0.01em' }}>{branchInfo.name}</p>
                    <span style={{ fontSize: 9.5, fontWeight: 600, padding: '2px 7px', borderRadius: 5, background: 'rgba(52,211,153,0.12)', color: '#34d399', letterSpacing: '0.04em', textTransform: 'uppercase' }}>Active</span>
                  </div>
                  <p style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.35)', margin: 0 }}>
                    <span style={{ color: 'rgba(255,255,255,0.55)' }}>{branchInfo.address}</span> · {branchInfo.staffCount} staff
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
                {[
                  { label: 'Inventory Value', value: inventoryValue.total },
                  { label: 'Turnover Rate',   value: stockTurnover.rate  },
                  { label: 'Accuracy',        value: inventoryAccuracy.lastCount },
                ].map(({ label, value }) => (
                  <div key={label} style={{ textAlign: 'right' }}>
                    <p className="loc-mono" style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 2px' }}>{label}</p>
                    <p className="loc-mono" style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', margin: 0, fontWeight: 500 }}>{value}</p>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '9px 22px', display: 'flex', alignItems: 'center', gap: 20, position: 'relative' }}>
              {[
                { icon: MapPin, text: branchInfo.address },
                { icon: Phone,  text: branchInfo.managerPhone },
                { icon: Mail,   text: branchInfo.managerEmail },
              ].map(({ icon: Icon, text }) => (
                <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Icon size={10} color="rgba(255,255,255,0.2)" />
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>{text}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* ── STAT CARDS ───────────────────────────────────────────────── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(225px,1fr))', gap: 10 }}>
            <StatCard title="Inventory Value"  value={inventoryValue.total}        icon={DollarSign}    iconBg="#eff6ff" iconColor="#1d4ed8" trend={{ value: inventoryValue.trend, up: inventoryValue.trendUp }} />
            <StatCard title="Stock Turnover"   value={stockTurnover.rate}          icon={RotateCw}      iconBg="#f0fdf4" iconColor="#15803d" trend={{ value: stockTurnover.trend, up: stockTurnover.trendUp }} />
            <StatCard title="Accuracy Rate"    value={inventoryAccuracy.lastCount} icon={CheckCircle2}  iconBg="#ecfdf5" iconColor="#059669" trend={{ value: inventoryAccuracy.trend, up: inventoryAccuracy.trendUp }} />
            <StatCard title="Low Stock Alerts" value={`${lowStockAlerts.length}`}  icon={AlertTriangle} iconBg="#fffbeb" iconColor="#b45309" />
          </div>

          {/* ── MAIN GRID ─────────────────────────────────────────────────── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 14, alignItems: 'start' }}>

            {/* LEFT ───────────────────────────────────────────────────────── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

              {/* ── INVENTORY VALUE BREAKDOWN (redesigned) ─────────────── */}
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <SectionCard
                  title="Inventory & Daily Summary"
                  subtitle={`${inventoryValue.items} items · ${inventoryValue.categories} categories · Today's performance`}
                  icon={Warehouse}
                >
                  {/* ── Top row: Inventory value + 3 daily metrics ──────── */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 22 }}>

                    {/* Inventory value hero tile */}
                    <div style={{
                      padding: '18px 20px',
                      background: '#0d1117',
                      borderRadius: 14,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      minHeight: 110,
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Warehouse size={14} color="rgba(255,255,255,0.55)" />
                        </div>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 3,
                          fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 5,
                          background: 'rgba(52,211,153,0.12)', color: '#34d399',
                        }}>
                          <TrendingUp size={9} /> {inventoryValue.trend}
                        </span>
                      </div>
                      <div>
                        <p className="loc-mono" style={{ fontSize: 22, fontWeight: 600, color: '#fff', margin: '0 0 2px', letterSpacing: '-0.02em' }}>
                          {inventoryValue.total}
                        </p>
                        <p style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.3)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          Total Inventory Value
                        </p>
                      </div>
                    </div>

                    {/* 3 daily metrics stacked */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <DailyMetric
                        label="Branch Sales Today"
                        value={dailySummary.totalSales.value}
                        note={dailySummary.totalSales.note}
                        trend={dailySummary.totalSales.trend}
                        trendUp={dailySummary.totalSales.trendUp}
                        icon={ShoppingCart}
                        iconBg="#eff6ff"
                        iconColor="#1d4ed8"
                        dividerColor="#3b82f6"
                      />
                      <DailyMetric
                        label="Total Expenses Today"
                        value={dailySummary.totalExpenses.value}
                        note={dailySummary.totalExpenses.note}
                        trend={dailySummary.totalExpenses.trend}
                        trendUp={dailySummary.totalExpenses.trendUp}
                        icon={Receipt}
                        iconBg="#fffbeb"
                        iconColor="#b45309"
                        dividerColor="#f59e0b"
                      />
                      <DailyMetric
                        label="Products Returned"
                        value={dailySummary.totalReturns.value}
                        note={`${dailySummary.totalReturns.count} ${dailySummary.totalReturns.note}`}
                        trend={dailySummary.totalReturns.trend}
                        trendUp={dailySummary.totalReturns.trendUp}
                        icon={RefreshCcw}
                        iconBg="#fdf4ff"
                        iconColor="#9333ea"
                        dividerColor="#a855f7"
                      />
                    </div>
                  </div>

                  {/* Divider */}
                  <div style={{ height: 1, background: '#f0f0ef', marginBottom: 18 }} />

                  {/* Inventory breakdown bars */}
                  <p style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 14px' }}>
                    Stock Value by Category
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {inventoryValue.breakdown.map((item) => (
                      <div key={item.label}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                          <span style={{ fontSize: 12, color: '#374151', fontWeight: 500 }}>{item.label}</span>
                          <span style={{ fontSize: 12, fontWeight: 600, color: '#111' }}>
                            {item.value}{' '}
                            <span style={{ color: '#9ca3af', fontWeight: 400 }}>({item.pct}%)</span>
                          </span>
                        </div>
                        <ProgressBar pct={item.pct} color="#0d1117" />
                      </div>
                    ))}
                  </div>
                </SectionCard>
              </motion.div>

              {/* Low stock alerts */}
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
                <SectionCard title="Low Stock Alerts" subtitle="Items below reorder point — action required" icon={AlertTriangle} iconBg="#dc2626">
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid #f0f0ef' }}>
                          <TH>Product</TH>
                          <TH>SKU</TH>
                          <TH right>Current</TH>
                          <TH right>Reorder Pt.</TH>
                          <TH>Status</TH>
                          <TH>Supplier</TH>
                        </tr>
                      </thead>
                      <tbody>
                        {lowStockAlerts.map((item) => (
                          <tr key={item.id} className="loc-tr" style={{ borderBottom: '1px solid #fafaf9' }}>
                            <td style={{ padding: '11px 14px', fontSize: 12.5, fontWeight: 500, color: '#111' }}>{item.product}</td>
                            <td style={{ padding: '11px 14px' }}>
                              <span className="loc-mono" style={{ fontSize: 10.5, color: '#6b7280', background: '#f3f4f6', padding: '2px 7px', borderRadius: 5 }}>{item.sku}</span>
                            </td>
                            <td style={{ padding: '11px 14px', textAlign: 'right' }}>
                              <span className="loc-mono" style={{ fontSize: 13, fontWeight: 600, color: item.currentStock === 0 ? '#dc2626' : '#b45309' }}>{item.currentStock}</span>
                            </td>
                            <td style={{ padding: '11px 14px', textAlign: 'right' }}>
                              <span className="loc-mono" style={{ fontSize: 12, color: '#6b7280' }}>{item.reorderPoint}</span>
                            </td>
                            <td style={{ padding: '11px 14px' }}><AlertBadge status={item.status} /></td>
                            <td style={{ padding: '11px 14px', fontSize: 11.5, color: '#6b7280' }}>{item.supplier}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </SectionCard>
              </motion.div>

              {/* Top products */}
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <SectionCard title="Top 5 Selling Products" subtitle="Best performers at this branch this period" icon={ShoppingCart} iconBg="#059669">
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid #f0f0ef' }}>
                          <TH>#</TH>
                          <TH>Product</TH>
                          <TH>SKU</TH>
                          <TH right>Sold</TH>
                          <TH right>Revenue</TH>
                          <TH>Stock</TH>
                          <TH right>Trend</TH>
                        </tr>
                      </thead>
                      <tbody>
                        {topBranchProducts.map((p, idx) => (
                          <tr key={p.id} className="loc-tr" style={{ borderBottom: '1px solid #fafaf9' }}>
                            <td style={{ padding: '11px 14px', fontSize: 11, color: '#9ca3af', fontWeight: 500 }}>{idx + 1}</td>
                            <td style={{ padding: '11px 14px', fontSize: 12.5, fontWeight: 500, color: '#111' }}>{p.name}</td>
                            <td style={{ padding: '11px 14px' }}>
                              <span className="loc-mono" style={{ fontSize: 10.5, color: '#6b7280', background: '#f3f4f6', padding: '2px 7px', borderRadius: 5 }}>{p.sku}</span>
                            </td>
                            <td style={{ padding: '11px 14px', textAlign: 'right' }}>
                              <span className="loc-mono" style={{ fontSize: 12.5, fontWeight: 600, color: '#111' }}>{p.sold}</span>
                            </td>
                            <td style={{ padding: '11px 14px', textAlign: 'right' }}>
                              <span className="loc-mono" style={{ fontSize: 12.5, fontWeight: 600, color: '#111' }}>{p.revenue}</span>
                            </td>
                            <td style={{ padding: '11px 14px' }}><StockBadge stock={p.stock} /></td>
                            <td style={{ padding: '11px 14px', textAlign: 'right' }}>
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 11.5, fontWeight: 600, color: p.up ? '#15803d' : '#dc2626' }}>
                                {p.up ? <TrendingUp size={11} /> : <TrendingDown size={11} />}{p.trend}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </SectionCard>
              </motion.div>

              {/* Stock turnover & aging */}
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                <SectionCard title="Stock Turnover & Aging" subtitle={`Turnover rate: ${stockTurnover.rate} · Avg days in stock: ${stockTurnover.days}`} icon={Gauge} iconBg="#4f46e5">
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                    {/* Turnover chart */}
                    <div>
                      <p style={{ fontSize: 11.5, fontWeight: 500, color: '#374151', margin: '0 0 12px' }}>Monthly turnover rate</p>
                      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 96 }}>
                        {stockTurnover.monthlyData.map((d) => {
                          const h = Math.round((d.turnover / maxTurnover) * 76);
                          return (
                            <div key={d.month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, height: '100%', justifyContent: 'flex-end' }}>
                              <span className="loc-mono" style={{ fontSize: 8.5, color: '#9ca3af' }}>{d.turnover}x</span>
                              <div style={{ width: '100%', height: h, background: '#0d1117', borderRadius: '3px 3px 0 0', transition: 'opacity 120ms', cursor: 'default' }}
                                title={`${d.month}: ${d.turnover}x`} />
                              <span style={{ fontSize: 9, color: '#9ca3af' }}>{d.month}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    {/* Stock aging */}
                    <div>
                      <p style={{ fontSize: 11.5, fontWeight: 500, color: '#374151', margin: '0 0 12px' }}>Stock aging distribution</p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {Object.values(stockAging).map((item) => (
                          <div key={item.desc}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                              <span style={{ fontSize: 11, color: '#6b7280' }}>{item.desc}</span>
                              <span style={{ fontSize: 11, fontWeight: 600, color: item.text }}>{item.pct}%</span>
                            </div>
                            <ProgressBar pct={item.pct} color={item.color} height={7} />
                          </div>
                        ))}
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6, marginTop: 14 }}>
                        {Object.entries({ Fast: stockAging.fastMoving, Slow: stockAging.slowMoving, Dead: stockAging.deadStock }).map(([label, item]) => (
                          <div key={label} style={{ textAlign: 'center', padding: '8px 4px', background: item.bg, borderRadius: 9 }}>
                            <p style={{ fontSize: 12, fontWeight: 700, color: item.text, margin: '0 0 1px' }}>{item.pct}%</p>
                            <p style={{ fontSize: 10, color: item.text, margin: 0, opacity: 0.75 }}>{label}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </SectionCard>
              </motion.div>
            </div>

            {/* RIGHT ──────────────────────────────────────────────────────── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

              {/* Inventory accuracy */}
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <SectionCard title="Inventory Accuracy" subtitle="Cycle count results" icon={ClipboardCheck} iconBg="#059669">
                  <div style={{ textAlign: 'center', marginBottom: 18 }}>
                    <div style={{ position: 'relative', width: 96, height: 96, margin: '0 auto 8px' }}>
                      <svg viewBox="0 0 100 100" style={{ width: 96, height: 96, transform: 'rotate(-90deg)' }}>
                        <circle cx="50" cy="50" r="42" fill="none" stroke="#f3f4f6" strokeWidth="7" />
                        <circle cx="50" cy="50" r="42" fill="none" stroke="#059669" strokeWidth="7"
                          strokeLinecap="round"
                          strokeDasharray="264"
                          className="arc-fill"
                        />
                      </svg>
                      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span className="loc-mono" style={{ fontSize: 18, fontWeight: 600, color: '#0d1117' }}>98.5%</span>
                      </div>
                    </div>
                    <p style={{ fontSize: 11, color: '#9ca3af', margin: 0 }}>Accuracy score</p>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {[
                      { label: 'Items Counted',  value: `${inventoryAccuracy.itemsCounted} / ${inventoryAccuracy.totalItems}`, danger: false },
                      { label: 'Discrepancies',  value: `${inventoryAccuracy.discrepancies} found`,                             danger: true  },
                      { label: 'Last Count',     value: inventoryAccuracy.lastCycleCount,                                      danger: false },
                      { label: 'Next Scheduled', value: inventoryAccuracy.nextScheduled,                                       danger: false },
                    ].map(({ label, value, danger }) => (
                      <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 12px', background: '#fafaf9', border: '1px solid #f0f0ef', borderRadius: 9 }}>
                        <span style={{ fontSize: 11.5, color: '#6b7280' }}>{label}</span>
                        <span style={{ fontSize: 11.5, fontWeight: 500, color: danger ? '#dc2626' : '#111' }}>{value}</span>
                      </div>
                    ))}
                  </div>
                </SectionCard>
              </motion.div>

              {/* Recent activities */}
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
                <SectionCard title="Recent Activities" subtitle="Today's timeline" icon={Activity} iconBg="#b45309">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {recentActivities.map((act) => {
                      const Icon = act.icon;
                      return (
                        <div key={act.id} className="loc-activity-row" style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '9px 10px', borderRadius: 10, cursor: 'default' }}>
                          <div style={{ width: 6, height: 6, borderRadius: '50%', background: act.dot, flexShrink: 0, marginTop: 5 }} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: 12, fontWeight: 500, color: '#111', margin: '0 0 2px' }}>{act.title}</p>
                            <p style={{ fontSize: 11, color: '#9ca3af', margin: '0 0 3px', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{act.desc}</p>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 10, color: '#d1d5db' }}>
                              <Clock size={9} /> {act.time}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <button className="loc-view-all-btn" style={{ width: '100%', marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '10px', borderRadius: 10, border: '1px solid #e5e7eb', fontSize: 12, fontWeight: 500, color: '#6b7280', background: '#fff', cursor: 'pointer', fontFamily: 'inherit' }}>
                    View all activities <ChevronRight size={13} />
                  </button>
                </SectionCard>
              </motion.div>

              {/* Branch info */}
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                <SectionCard title="Branch Info" subtitle="Contact & operating details" icon={MapPin}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {[
                      { icon: MapPin, label: 'Address', value: branchInfo.address },
                      { icon: Phone,  label: 'Phone',   value: branchInfo.managerPhone },
                      { icon: Mail,   label: 'Email',   value: branchInfo.managerEmail },
                      { icon: Clock,  label: 'Hours',   value: branchInfo.operatingHours },
                    ].map(({ icon: Icon, label, value }) => (
                      <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: '#fafaf9', border: '1px solid #f0f0ef', borderRadius: 10 }}>
                        <Icon size={13} color="#9ca3af" style={{ flexShrink: 0 }} />
                        <div style={{ minWidth: 0 }}>
                          <p style={{ fontSize: 9.5, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 2px' }}>{label}</p>
                          <p style={{ fontSize: 12, fontWeight: 500, color: '#111', margin: 0, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{value}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </SectionCard>
              </motion.div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default LocationDashboardPage;