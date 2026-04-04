import {
  MapPin,
  Bell,
  AlertCircle,
  ShoppingCart,
  BarChart3,
  Users,
} from "lucide-react";
import type { Feature, Testimonial, PricingPlan, Slide } from "../types";

export const slides: Slide[] = [
  {
    title: "Manage Inventory Across Multiple Locations Effortlessly",
    subtitle:
      "Real-time tracking, smart alerts, and automation across all your warehouses and stores. Never lose sight of your stock again.",
    image: "/website/b4.jpg",
    gradient: "from-gray-800/50 to-blue-600/80",
  },
  {
    title: "Never Run Out of Stock Again",
    subtitle:
      "AI-powered low stock alerts and demand forecasting that keeps your business running smoothly, 24/7.",
    image: "/website/b2.jpg",
    gradient: "from-gray-800/50 to-blue-600/80",
  },
  {
    title: "All Your Business Data in One Place",
    subtitle:
      "Sales, inventory, customers, analytics unified in a powerful, intuitive dashboard that grows with you.",
    image: "/website/b3.jpg",
    gradient: "from-gray-800/50 to-blue-600/80",
  },
];

export const features: Feature[] = [
  {
    icon: MapPin,
    title: "Multi-location tracking",
    desc: "Manage inventory across warehouses, stores, and fulfillment centers from one dashboard",
  },
  {
    icon: Bell,
    title: "Real-time stock updates",
    desc: "Live inventory sync across all sales channels and locations",
  },
  {
    icon: AlertCircle,
    title: "Automated alerts",
    desc: "Smart notifications for low stock, expiring items, and reorder points",
  },
  {
    icon: ShoppingCart,
    title: "Sales & purchase management",
    desc: "Streamline orders, purchase orders, and supplier relationships",
  },
  {
    icon: BarChart3,
    title: "Analytics dashboard",
    desc: "Deep insights into turnover, profitability, and trends",
  },
  {
    icon: Users,
    title: "Role-based access",
    desc: "Granular permissions for team members and stakeholders",
  },
];

export const testimonials: Testimonial[] = [
  {
    name: "Sarah Johnson",
    company: "TechFlow Solutions",
    rating: 5,
    text: "StockPilot transformed our inventory management. We reduced stockouts by 94% in just 3 months!",
    image: "https://randomuser.me/api/portraits/women/1.jpg",
  },
  {
    name: "Michael Chen",
    company: "Urban Retail Group",
    rating: 5,
    text: "The AI forecasting is incredible. We saved over $50k in unnecessary inventory this year.",
    image: "https://randomuser.me/api/portraits/men/2.jpg",
  },
  {
    name: "Emily Rodriguez",
    company: "Global Logistics Inc",
    rating: 5,
    text: "Multi-location tracking is seamless. Best investment we made for our operations.",
    image: "https://randomuser.me/api/portraits/women/3.jpg",
  },
];

export const pricingPlans: PricingPlan[] = [
  {
    name: "Starter",
    price: 29,
    features: [
      "Up to 500 SKUs",
      "Basic analytics",
      "Email support",
      "Single location",
    ],
  },
  {
    name: "Professional",
    price: 99,
    features: [
      "Up to 5,000 SKUs",
      "Advanced analytics",
      "Priority support",
      "Multi-location",
      "API access",
    ],
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: 299,
    features: [
      "Unlimited SKUs",
      "Custom analytics",
      "24/7 support",
      "Unlimited locations",
      "Dedicated account manager",
    ],
  },
];

export const integrations: string[] = [
  "Shopify",
  "WooCommerce",
  "Stripe",
  "QuickBooks",
  "Amazon",
  "eBay",
  "Salesforce",
  "Slack",
];

export const trustedCompanies: string[] = [
  "Microsoft",
  "Google",
  "Amazon",
  "Shopify",
  "Salesforce",
];

export const footerLinks = [
  {
    title: "Product",
    links: ["Features", "Pricing", "Integrations", "Demo"],
  },
  {
    title: "Company",
    links: ["About", "Blog", "Careers", "Press"],
  },
  {
    title: "Resources",
    links: ["Documentation", "Support", "API", "Status"],
  },
  {
    title: "Contact",
    links: ["Sales", "Support", "Partners", "Security"],
  },
];