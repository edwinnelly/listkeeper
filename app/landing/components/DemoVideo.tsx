"use client";

import { motion } from "framer-motion";
import { Play } from "lucide-react";
import Image from "next/image";

export const DemoVideo = () => {
  return (
    <section className="py-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="relative rounded-2xl overflow-hidden group cursor-pointer shadow-xl"
        >
          <div className="relative w-full aspect-[2/1]">
            <Image
              src="https://placehold.co/1200x600/e5e7eb/1f2937?text=Product+Demo+Video"
              alt="Product demo video thumbnail"
              fill
              className="object-cover"
              priority
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent flex items-center justify-center">
            <div className="text-center">
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg"
              >
                <Play size={32} className="ml-1 text-gray-900" />
              </motion.div>
              <p className="text-xl font-semibold text-white">
                Watch Product Demo
              </p>
              <p className="text-gray-200">
                See how StockPilot works in 3 minutes
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};