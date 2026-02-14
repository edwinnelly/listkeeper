'use client';
import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";

const ForgotPasswordPage = () => {
  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2 bg-gradient-to-br from-blue-50 via-white to-blue-100">
      {/* Left Side - Image */}
      <div className="hidden md:flex items-center justify-center bg-blue-100">
        <img
          src="/asset/login1.jpg" // replace with your image
          alt="Forgot Password Illustration"
          className="object-cover w-full h-full"
        />
      </div>

      {/* Right Side - Forgot Password Form */}
      <div className="flex items-center justify-center px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-white w-full max-w-md rounded-3xl p-8"
        >
          {/* Logo */}
          <div className="flex flex-col items-center">
            <img
              src="http://localhost:8000/assets/img/mylogo.svg" // replace with your logo path
              alt="Logo"
              className="w-40 h-16 mb-3"
            />
            <p className="text-gray-500 text-sm text-center">
              Enter your email to reset your password
            </p>
          </div>

          {/* Form */}
          <form className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                placeholder="you@example.com"
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-3 rounded-xl font-medium hover:bg-blue-700 transition"
            >
              Send Reset Link
            </button>
          </form>

          {/* Footer */}
          <p className="text-center text-sm text-gray-600 mt-6">
            Remember your password?{" "}
            <Link href="/auth" className="text-blue-600 hover:underline">
              Back to Login
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
