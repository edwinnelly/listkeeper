"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { pricingPlans } from "../data";

export const Pricing = () => {
  return (
    <section className="py-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-4xl md:text-5xl font-bold text-center text-gray-900 mb-16">
          Simple, Transparent Pricing
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {pricingPlans.map((plan, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              whileHover={{ y: -10 }}
              className={`bg-white rounded-2xl border shadow-sm hover:shadow-xl transition-all duration-300 p-8 ${
                plan.highlighted
                  ? "ring-2 ring-indigo-500 shadow-xl"
                  : "border-gray-100"
              }`}
            >
              {plan.highlighted && (
                <div className="text-sm bg-gradient-to-r from-indigo-600 to-purple-600 text-white inline-block px-3 py-1 rounded-full mb-4">
                  Most Popular
                </div>
              )}
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                {plan.name}
              </h3>
              <div className="text-4xl font-bold text-gray-900 mb-4">
                ${plan.price}
                <span className="text-lg text-gray-500">/month</span>
              </div>
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, j) => (
                  <li key={j} className="flex items-center gap-2">
                    <Check size={18} className="text-indigo-600" />
                    <span className="text-gray-600">{feature}</span>
                  </li>
                ))}
              </ul>
              <button
                className={`w-full py-3 rounded-xl font-semibold transition-all ${
                  plan.highlighted
                    ? "bg-gray-900 text-white hover:bg-gray-800"
                    : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                Get Started
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};