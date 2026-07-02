import React from "react";
import { Building2, GitBranch, PlusCircle, Settings, Zap, ArrowRight, CheckCircle2 } from "lucide-react";
import Link from "next/link";

const NewAccount = () => {
  return (
    <div className="flex justify-center items-center min-h-[80vh] px-4">
      <div className="w-full max-w-xl">
        {/* Main Card */}
        <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          {/* Subtle gradient bar at top */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-gray-600 to-indigo-600" />
          
          <div className="p-8 md:p-10">
            {/* Header Section */}
            <div className="text-center mb-10">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gray-50 border border-gray-100 mb-5">
                <Building2 className="w-7 h-7 text-gray-700" />
              </div>
              
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Create your first business
              </h1>
              
              <p className="text-gray-500 text-sm leading-relaxed max-w-sm mx-auto">
                Set up your business profile to start managing invoices, tracking expenses, and growing your operations.
              </p>
            </div>

            {/* Info Cards */}
            <div className="space-y-3 mb-8">
              <div className="flex items-start gap-4 p-4 rounded-xl bg-gray-50/50 border border-gray-100 hover:border-gray-200 transition-colors">
                <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-white border border-gray-100 flex items-center justify-center shadow-sm">
                  <Building2 className="w-4 h-4 text-gray-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Business details</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Add your business name, address, and logo to personalize your profile.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 rounded-xl bg-gray-50/50 border border-gray-100 hover:border-gray-200 transition-colors">
                <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-white border border-gray-100 flex items-center justify-center shadow-sm">
                  <GitBranch className="w-4 h-4 text-gray-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Multiple branches</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Expand later by adding branch locations as your business grows.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 rounded-xl bg-amber-50/30 border border-amber-100/50 hover:border-amber-200 transition-colors">
                <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center shadow-sm">
                  <Settings className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Independent setup</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Each business maintains separate accounts, settings, and configurations.
                  </p>
                </div>
              </div>
            </div>

            {/* Checklist */}
            <div className="mb-8 p-4 rounded-xl bg-gray-50 border border-gray-100">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="w-4 h-4 text-gray-500" />
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Quick setup
                </span>
              </div>
              <div className="space-y-2">
                {[
                  "Choose a business name",
                  "Add your business address",
                  "Upload a logo (optional)",
                ].map((item, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle2 className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA Button */}
            <Link
              href="/business"
              className="group relative flex items-center justify-center gap-2 w-full bg-gray-900 hover:bg-gray-800 text-white font-semibold rounded-xl px-6 py-3.5 transition-all duration-200 shadow-sm hover:shadow-md"
            >
              <PlusCircle className="w-5 h-5" />
              <span>Create new business</span>
              <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
            </Link>

            {/* Footer note */}
            <p className="text-center text-xs text-gray-400 mt-4">
              You can create additional businesses later from your dashboard settings.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewAccount;