'use client';
import React from "react";

const Loader: React.FC<{ message?: string }> = ({ message = "Loading..." }) => {
  return (
    <div className="flex items-center justify-center h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100">
      <div className="flex flex-col items-center">
        {/* Sleek Spinner */}
        <div className="relative">
          <div className="h-16 w-16 rounded-full border-4 border-blue-200"></div>
          <div className="absolute top-0 left-0 h-16 w-16 rounded-full border-4 border-blue-600 border-t-transparent animate-spin"></div>
        </div>

        {/* Loading text */}
        <p className="mt-4 text-gray-700 text-sm animate-pulse">{message}</p>
      </div>
    </div>
  );
};

export default Loader;
