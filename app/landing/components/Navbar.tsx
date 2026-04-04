"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";

export const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "Product", href: "#" },
    { name: "Features", href: "#" },
    { name: "Pricing", href: "#" },
    { name: "Resources", href: "#" },
  ];

  return (
    <nav
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-200"
          : "bg-transparent"
      }`}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <div
            className={`text-2xl font-bold ${
              scrolled
                ? "bg-gradient-to-r from-black to-black bg-clip-text text-transparent"
                : "text-white"
            }`}
          >
            ListKeeping
          </div>

          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className={`${
                  scrolled
                    ? "text-gray-700 hover:text-gray-900"
                    : "text-white/90 hover:text-white"
                } transition`}
              >
                {link.name}
              </a>
            ))}
            <button
              className={`inline-flex items-center justify-center rounded-xl border px-5 py-2 text-sm font-medium transition ${
                scrolled
                  ? "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                  : "border-white/30 bg-transparent text-white hover:bg-white/10"
              }`}
            >
              Sign In
            </button>
            <button className="inline-flex items-center justify-center rounded-xl bg-white px-5 py-2 text-sm font-medium text-gray-900 transition hover:bg-gray-100">
              Start Free Trial
            </button>
          </div>

          <button
            className={`md:hidden p-2 ${
              scrolled ? "text-gray-900" : "text-white"
            }`}
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X /> : <Menu />}
          </button>
        </div>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden mt-4 space-y-4 bg-white/95 backdrop-blur-md rounded-2xl p-4"
            >
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  className="block py-2 text-gray-700 hover:text-gray-900"
                >
                  {link.name}
                </a>
              ))}
              <button className="w-full inline-flex items-center justify-center rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50">
                Sign In
              </button>
              <button className="w-full inline-flex items-center justify-center rounded-xl bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800">
                Start Free Trial
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
};