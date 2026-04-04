"use client";

import { motion } from "framer-motion";
import { integrations } from "../data";

export const Integrations = () => {
  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-4xl md:text-5xl font-bold text-center text-gray-900 mb-16">
          Connect with Your Favorite Tools
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {integrations.map((integration, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.05 }}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 p-6 text-center cursor-pointer"
            >
              <div className="text-lg font-semibold text-gray-700">
                {integration}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};