"use client";
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

const InventoryAppFAQ: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  const faqData: FAQItem[] = [
    {
      question: 'How do I add new inventory items?',
      answer: 'Navigate to the Dashboard and click the "Add Item" button in the top-right corner. Fill in the required fields including item name, SKU, quantity, and price. You can also upload product images and set reorder thresholds.',
      category: 'Getting Started'
    },
    {
      question: 'Can I track inventory across multiple warehouses?',
      answer: 'Yes! Our multi-location feature allows you to manage inventory across unlimited warehouses. Each location has its own stock levels, and you can transfer items between locations with our transfer management system.',
      category: 'Features'
    },
    {
      question: 'How does the barcode scanning work?',
      answer: 'Our app supports both camera-based barcode scanning and external Bluetooth scanners. Simply tap the scan icon in the search bar and point your camera at the barcode. The system automatically recognizes UPC, EAN, and QR codes.',
      category: 'Features'
    },
    {
      question: 'Is my data backed up automatically?',
      answer: 'Yes, all your inventory data is automatically backed up to the cloud in real-time. We maintain encrypted backups across multiple servers with 99.9% uptime guarantee. You can also export your data manually in CSV, Excel, or PDF formats.',
      category: 'Security & Data'
    },
    {
      question: 'How do I set up low stock alerts?',
      answer: 'Go to Settings > Notifications > Stock Alerts. You can set minimum quantity thresholds for each item. When stock falls below this level, you\'ll receive push notifications, email alerts, and see visual warnings on your dashboard.',
      category: 'Features'
    },
    {
      question: 'Can multiple team members use the app simultaneously?',
      answer: 'Absolutely! Our app supports unlimited team members with role-based access control. You can assign different permissions like Admin, Manager, or Viewer to control what each team member can see and do.',
      category: 'Account & Billing'
    },
    {
      question: 'What payment methods do you accept?',
      answer: 'We accept all major credit cards (Visa, Mastercard, American Express), PayPal, and bank transfers for annual plans. All payments are processed securely through Stripe with SSL encryption.',
      category: 'Account & Billing'
    },
    {
      question: 'How do I generate inventory reports?',
      answer: 'Navigate to the Reports section from the sidebar. Choose from over 20 report templates including stock valuation, sales analysis, inventory turnover, and purchase orders. Reports can be customized, scheduled, and automatically emailed.',
      category: 'Features'
    },
    {
      question: 'Is there a mobile app available?',
      answer: 'Yes! Our mobile app is available for both iOS and Android devices. It includes all the core features including barcode scanning, real-time sync, and offline mode for when you\'re working in areas with poor connectivity.',
      category: 'Getting Started'
    },
    {
      question: 'How do I handle returns and damaged items?',
      answer: 'Use the Returns Management module to process customer returns or identify damaged inventory. You can mark items as "Returned" or "Damaged," specify reasons, and automatically adjust stock levels. The system maintains a complete audit trail.',
      category: 'Features'
    },
    {
      question: 'What integrations are available?',
      answer: 'We integrate with popular platforms including Shopify, WooCommerce, Amazon, QuickBooks, Xero, and ShipStation. Our API also allows custom integrations with your existing systems and workflows.',
      category: 'Features'
    },
    {
      question: 'How secure is my inventory data?',
      answer: 'We employ bank-level 256-bit AES encryption, two-factor authentication, and SOC 2 compliance. All data is encrypted both in transit and at rest. Regular security audits and penetration testing ensure your data remains protected.',
      category: 'Security & Data'
    }
  ];

  const categories = ['All', ...Array.from(new Set(faqData.map(item => item.category)))];

  const filteredFAQs = faqData.filter(faq => {
    const matchesSearch = faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         faq.answer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = activeCategory === 'All' || faq.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-5xl font-bold text-black mb-4 tracking-tight"
          >
            Frequently Asked Questions
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-xl text-gray-700"
          >
            Everything you need to know about the Inventory App
          </motion.p>
        </div>

        {/* Search Bar */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mb-12"
        >
          <div className="relative">
            <input
              type="text"
              placeholder="Search for answers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-6 py-4 text-lg border-2 border-black rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-400 bg-white text-black placeholder-gray-500 transition-all duration-300"
            />
            <svg
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-600"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </div>
        </motion.div>

        {/* Category Filter */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="flex flex-wrap gap-3 mb-12"
        >
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-5 py-2.5 rounded-lg font-medium text-sm transition-all duration-300 border-2 ${
                activeCategory === category
                  ? 'bg-black text-white border-black'
                  : 'bg-white text-black border-gray-300 hover:border-black'
              }`}
            >
              {category}
            </button>
          ))}
        </motion.div>

        {/* FAQ Items */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="space-y-4"
        >
          {filteredFAQs.length === 0 ? (
            <div className="text-center py-12">
              <svg
                className="mx-auto mb-4 text-gray-400"
                width="64"
                height="64"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <p className="text-xl text-gray-500 font-medium">No results found</p>
              <p className="text-gray-400 mt-2">Try adjusting your search or filter</p>
            </div>
          ) : (
            filteredFAQs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="border-2 border-gray-200 rounded-xl overflow-hidden hover:border-black transition-all duration-300"
              >
                <button
                  onClick={() => toggleFAQ(index)}
                  className="w-full px-6 py-5 text-left flex justify-between items-center bg-white hover:bg-gray-50 transition-colors duration-200"
                >
                  <div className="flex-1 pr-4">
                    <span className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1 block">
                      {faq.category}
                    </span>
                    <h3 className="text-lg font-semibold text-black">
                      {faq.question}
                    </h3>
                  </div>
                  <motion.div
                    animate={{ rotate: openIndex === index ? 45 : 0 }}
                    transition={{ duration: 0.3 }}
                    className="flex-shrink-0"
                  >
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-black"
                    >
                      <line x1="12" y1="5" x2="12" y2="19"></line>
                      <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                  </motion.div>
                </button>
                <AnimatePresence>
                  {openIndex === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 pb-5 pt-2 border-t-2 border-gray-100">
                        <p className="text-gray-700 leading-relaxed">
                          {faq.answer}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))
          )}
        </motion.div>

        {/* Contact Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mt-16 text-center bg-gray-50 rounded-2xl p-12 border-2 border-gray-200"
        >
          <h3 className="text-2xl font-bold text-black mb-3">
            Still have questions?
          </h3>
          <p className="text-gray-600 mb-8 text-lg">
            Can't find the answer you're looking for? Our support team is here to help.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-black text-white px-8 py-3 rounded-lg font-semibold hover:bg-gray-800 transition-colors duration-300 border-2 border-black">
              Contact Support
            </button>
            <button className="bg-white text-black px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors duration-300 border-2 border-black">
              View Documentation
            </button>
          </div>
        </motion.div>

        {/* Footer */}
        <div className="mt-12 text-center text-sm text-gray-500">
          <p>Last updated: January 2026 • Version 2.1.0</p>
        </div>
      </div>
    </div>
  );
};

export default InventoryAppFAQ;