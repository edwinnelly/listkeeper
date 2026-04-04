"use client";

import { motion } from "framer-motion";

export const CTASection = () => {
  return (
    <section className="py-20 bg-gradient-to-r from-indigo-600 to-purple-600">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Take Full Control of Your Inventory Today
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Join thousands of businesses that trust StockPilot to streamline
            their operations and grow faster.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="px-8 py-4 bg-white text-gray-900 rounded-xl font-semibold hover:shadow-lg transition-all transform hover:scale-105">
              Get Started Free
            </button>
            <button className="px-8 py-4 bg-transparent border-2 border-white text-white rounded-xl font-semibold hover:bg-white/10 transition-all">
              Book a Demo
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};