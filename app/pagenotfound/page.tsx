"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
    Home,
    ArrowLeft,
    Search,
    Package,
    AlertCircle,
    FileQuestion,
} from "lucide-react";

const NotFoundPage = () => {
    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
            <div className="max-w-2xl w-full">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="text-center"
                >
                    {/* Animated 404 Illustration */}
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{
                            type: "spring",
                            stiffness: 200,
                            damping: 15,
                            delay: 0.2
                        }}
                        className="relative mx-auto mb-8 w-48 h-48"
                    >
                        {/* Background circle */}
                        <div className="absolute inset-0 bg-[#010804]/5 rounded-full animate-pulse"></div>

                        {/* Icon container */}
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="relative">
                                <FileQuestion className="h-24 w-24 text-[#010804]/20" />
                                <motion.div
                                    animate={{
                                        rotate: [0, 10, -10, 0],
                                        scale: [1, 1.1, 1.1, 1]
                                    }}
                                    transition={{
                                        duration: 2,
                                        repeat: Infinity,
                                        repeatDelay: 1
                                    }}
                                    className="absolute inset-0 flex items-center justify-center"
                                >
                                    <Search className="h-12 w-12 text-[#010804]" />
                                </motion.div>
                            </div>
                        </div>
                    </motion.div>

                    {/* 404 Text */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                    >
                        <h1 className="text-7xl sm:text-8xl font-black text-[#010804] mb-4">
                            404
                        </h1>
                        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
                            Page Not Found
                        </h2>
                        <p className="text-gray-500 text-lg mb-2 max-w-md mx-auto">
                            Oops! The page you're looking for doesn't exist or has been moved.
                        </p>
                        <p className="text-gray-400 text-sm mb-8 max-w-md mx-auto">
                            It might have been removed, renamed, or is temporarily unavailable.
                        </p>
                    </motion.div>

                    {/* Action Buttons */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                        className="flex flex-col sm:flex-row items-center justify-center gap-4"
                    >
                        <Link
                            href="/dashboard"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-[#010804] text-white text-sm font-semibold rounded-xl hover:bg-[#14532d] transition-all shadow-lg shadow-[#010804]/20 w-full sm:w-auto justify-center"
                        >
                            <Home className="h-4 w-4" />
                            Back to Home
                        </Link>
                        <button
                            onClick={() => window.history.back()}
                            className="inline-flex items-center gap-2 px-6 py-3 text-gray-700 bg-white border-2 border-gray-200 text-sm font-semibold rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all w-full sm:w-auto justify-center"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Go Back
                        </button>
                    </motion.div>

                    {/* Helpful Links */}
                    

                    {/* Footer */}
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1 }}
                        className="mt-8 text-xs text-gray-400"
                    >
                        If you believe this is an error, please contact support.
                    </motion.p>
                </motion.div>
            </div>
        </div>
    );
};

export default NotFoundPage;