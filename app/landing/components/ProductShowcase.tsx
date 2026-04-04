"use client";

import { motion } from "framer-motion";
import { ArrowRight, CheckCircle, Zap, BarChart3, LayoutDashboard, Smartphone, Database, RefreshCw } from "lucide-react";
import Image from "next/image";

const showcaseItems = [
  {
    title: "Smart Inventory Tracking",
    shortDesc: "Real-time visibility across all locations with intelligent stock management and automated reorder points.",
    detailedDesc: "Transform your inventory management with AI-powered tracking that provides complete visibility across your entire operation. Our intelligent system monitors stock levels in real-time across warehouses, stores, and fulfillment centers, automatically adjusting reorder points based on sales velocity and supplier lead times. With predictive analytics, you'll know exactly when to reorder before stockouts occur. Advanced features include batch tracking for expiration dates, lot number management for regulated items, and seamless barcode scanning for instant updates. The system learns from your historical data to optimize inventory levels, reducing carrying costs while ensuring you never miss a sale.",
    image: "/website/b4.jpg",
    reverse: false,
    features: [
      "Real-time multi-location tracking with instant sync",
      "AI-powered demand forecasting (95% accuracy)",
      "Dynamic reorder points that auto-adjust",
      "Automated purchase order generation",
      "Batch, lot, and expiration tracking",
      "Instant low stock alerts & notifications",
      "Barcode and QR code scanning",
      "Cross-location inventory transfers"
    ],
    metrics: [
      { value: "94%", label: "Stockout Reduction" },
      { value: "30%", label: "Cost Savings" },
      { value: "15+", label: "Hours Saved/Week" },
      { value: "99.9%", label: "Accuracy Rate" }
    ],
    icon: <Zap className="w-8 h-8 text-gray-600" />,
    benefits: [
      "Never miss a sale due to stockouts",
      "Reduce excess inventory carrying costs",
      "Eliminate manual counting errors",
      "Automate reordering workflows"
    ]
  },
  {
    title: "Advanced Analytics Dashboard",
    shortDesc: "Deep insights into inventory turnover, profit margins, and demand forecasting with AI-powered recommendations.",
    detailedDesc: "Turn complex inventory data into actionable business intelligence with our comprehensive analytics suite. Monitor inventory turnover rates in real-time to identify slow-moving items and optimize stock levels before they impact profitability. Track profit margins at the product level with detailed COGS analysis and revenue tracking. Our AI-powered demand forecasting engine uses machine learning algorithms to predict future sales with up to 95% accuracy, accounting for seasonality, promotions, market trends, and even weather patterns. Visualize key metrics through interactive dashboards, heat maps, and customizable reports. Export detailed analytics for stakeholders or schedule automated reports delivered directly to your inbox.",
    image: "/website/b3.jpg",
    reverse: true,
    features: [
      "Real-time KPI monitoring dashboard",
      "AI demand forecasting (95% accuracy)",
      "Interactive heat maps & trend analysis",
      "Product-level profitability tracking",
      "Automated report scheduling",
      "COGS & inventory turnover analysis",
      "Fill rate & stockout rate metrics",
      "Customizable data visualizations"
    ],
    metrics: [
      { value: "95%", label: "Forecast Accuracy" },
      { value: "20%", label: "Profit Increase" },
      { value: "2.5x", label: "Turnover Rate" },
      { value: "10x", label: "Faster Decisions" }
    ],
    icon: <BarChart3 className="w-8 h-8 text-gray-600" />,
    benefits: [
      "Make data-driven purchasing decisions",
      "Identify profitable products instantly",
      "Predict demand with confidence",
      "Optimize inventory investment"
    ]
  },
  {
    title: "Seamless Business Integration",
    shortDesc: "Connect with your existing tools - Shopify, WooCommerce, Stripe, and 100+ other platforms out of the box.",
    detailedDesc: "Create a unified business ecosystem with our extensive integration network. Sync inventory in real-time across all your sales channels including Shopify, WooCommerce, Magento, and BigCommerce to prevent overselling and maintain perfect stock accuracy. Automatically update accounting records in QuickBooks, Xero, and FreshBooks with two-way sync for invoices, payments, and COGS tracking. Connect with major marketplaces like Amazon, eBay, Walmart, and Etsy to manage multi-channel inventory from a single dashboard. Integrate with POS systems including Square, Toast, and Clover for unified online and in-store management. Our powerful RESTful API enables custom integrations with any platform, ensuring your entire tech stack works in perfect harmony.",
    image: "/website/b2.jpg",
    reverse: false,
    features: [
      "100+ pre-built integrations",
      "Real-time multi-channel sync",
      "Two-way accounting integration",
      "Marketplace connectivity (Amazon, eBay)",
      "POS system integration",
      "RESTful API for custom integrations",
      "Automated cross-platform workflows",
      "Shipping carrier integration"
    ],
    metrics: [
      { value: "100+", label: "Integrations" },
      { value: "70%", label: "Less Manual Work" },
      { value: "100%", label: "Data Accuracy" },
      { value: "15min", label: "Setup Time" }
    ],
    icon: <LayoutDashboard className="w-8 h-8 text-gray-600" />,
    benefits: [
      "Eliminate manual data entry across platforms",
      "Prevent overselling with real-time sync",
      "Unify online and in-store inventory",
      "Scale your tech stack seamlessly"
    ]
  }
];

export const ProductShowcase = () => {
  return (
    <section className="py-20 bg-gradient-to-b from-gray-50 to-white overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-full mb-6">
            <span className="text-sm font-semibold text-gray-600">Powerful Solutions</span>
          </div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4">
            Everything You Need to
            <span className="bg-gradient-to-r from-black to-black bg-clip-text text-transparent"> Scale Smart</span>
          </h2>
          <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">
            Discover how our intelligent platform transforms inventory management
            with cutting-edge technology and seamless automation
          </p>
        </motion.div>

        {/* Showcase Items */}
        <div className="space-y-32">
          {showcaseItems.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: i * 0.2 }}
              viewport={{ once: true, margin: "-100px" }}
              className={`flex flex-col ${
                item.reverse ? "md:flex-row-reverse" : "md:flex-row"
              } gap-12 lg:gap-20 items-center`}
            >
              {/* Image Section */}
              <div className="flex-1 group">
                <div className="relative rounded-2xl overflow-hidden shadow-2xl hover:shadow-3xl transition-all duration-500">
                  <Image
                    src={item.image}
                    alt={item.title}
                    width={800}
                    height={600}
                    className="w-full h-auto object-cover transform group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-600/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </div>
              </div>

              {/* Content Section */}
              <div className="flex-1 space-y-6">
                {/* Icon and Title */}
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gray-100 rounded-2xl shadow-inner">
                    {item.icon}
                  </div>
                  <h3 className="text-3xl md:text-4xl font-bold text-gray-900">
                    {item.title}
                  </h3>
                </div>

                {/* Short Description */}
                <p className="text-lg text-gray-600 font-semibold border-l-4 border-gray-600 pl-4">
                  {item.shortDesc}
                </p>
                
                {/* Detailed Description */}
                <p className="text-gray-600 leading-relaxed">
                  {item.detailedDesc}
                </p>

                {/* Benefits Badges */}
                <div className="flex flex-wrap gap-2 pt-2">
                  {item.benefits.map((benefit, idx) => (
                    <span key={idx} className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-700 px-3 py-1 rounded-full">
                      <CheckCircle size={12} className="text-gray-600" />
                      {benefit}
                    </span>
                  ))}
                </div>

                {/* Features Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4">
                  {item.features.map((feature, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="flex items-start gap-2 group"
                    >
                      <CheckCircle size={16} className="text-gray-600 flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                      <span className="text-sm text-gray-700">{feature}</span>
                    </motion.div>
                  ))}
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-gray-200">
                  {item.metrics.map((metric, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ scale: 0.9, opacity: 0 }}
                      whileInView={{ scale: 1, opacity: 1 }}
                      transition={{ delay: idx * 0.1 }}
                      className="text-center group cursor-pointer"
                    >
                      <div className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-gray-600 to-gray-600 bg-clip-text text-transparent group-hover:scale-110 transition-transform">
                        {metric.value}
                      </div>
                      <div className="text-xs text-gray-500 mt-1 group-hover:text-gray-600 transition-colors">
                        {metric.label}
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* CTA Button */}
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="pt-4"
                >
                  <button className="group inline-flex items-center justify-center rounded-xl bg-gray-600 hover:bg-gray-700 px-6 py-3 text-base font-semibold text-white transition-all duration-200 gap-2 shadow-md hover:shadow-lg">
                    Learn more about {item.title.split(" ")[0]}
                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                </motion.div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
          className="text-center mt-24 pt-12 border-t border-gray-200"
        >
          <div className="relative">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-full max-w-2xl h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
            </div>
            <div className="relative bg-white px-8 inline-block rounded-full">
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-600 uppercase tracking-wide">
                <Database size={16} />
                <span>Ready to Scale?</span>
                <RefreshCw size={16} />
              </div>
            </div>
          </div>
          <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mt-8 mb-4">
            Ready to Transform Your Inventory Management?
          </h3>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Join 10,000+ businesses that have streamlined their operations, reduced costs, and increased profitability with our intelligent platform
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="inline-flex items-center justify-center rounded-xl bg-gray-600 hover:bg-gray-700 px-8 py-4 text-lg font-semibold text-white transition-all duration-200 gap-3 shadow-lg hover:shadow-xl"
            >
              Start Your Free Trial Today
              <ArrowRight size={20} />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="inline-flex items-center justify-center rounded-xl border-2 border-gray-300 bg-white hover:bg-gray-50 px-8 py-4 text-lg font-semibold text-gray-700 transition-all duration-200 gap-3"
            >
              <Smartphone size={20} />
              Schedule a Demo
            </motion.button>
          </div>
          <p className="text-sm text-gray-500 mt-6">
            No credit card required • Free 14-day trial • Cancel anytime
          </p>
        </motion.div>
      </div>
    </section>
  );
};