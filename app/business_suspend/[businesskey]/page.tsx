'use client';

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import api from "@/lib/axios";
import Cookies from "js-cookie";
import { ArrowLeft, Pause, Play, AlertTriangle, Building2, Shield, FileText, Users, Calendar, Sparkles, Zap } from "lucide-react";
import toast from "react-hot-toast";

// =============================================================================
// MAIN COMPONENT
// =============================================================================

const SuspendBusinessPage = () => {
  const params = useParams();
  const router = useRouter();
  const id = params.businesskey as string;
  
  const [isSuspending, setIsSuspending] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [suspensionReason, setSuspensionReason] = useState("");

  // Input classes from your concept
  const inputClass = "w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200 placeholder-gray-400 text-sm";
  const labelClass = "block text-sm font-medium text-gray-700 mb-2";

  // ===========================================================================
  // SUSPEND HANDLER
  // ===========================================================================

  const handleSuspendBusiness = async () => {
    if (confirmText !== "SUSPEND") {
      toast.error('Please type "SUSPEND" to confirm temporary suspension');
      return;
    }
    try {
      setIsSuspending(true);
      
      // Get CSRF token for secure request
      await api.get("/sanctum/csrf-cookie");
      
      const res = await api.put(`/suspendBusiness/${id}`, {
        status: 'inactive',
        suspension_reason: suspensionReason || 'Temporary suspension by owner'
      }, {
        headers: { 
          "X-XSRF-TOKEN": Cookies.get("XSRF-TOKEN") || "",
        },
      });

      if (res.status === 200) {
        toast.success('Your business has been temporarily suspended. You can reactivate it anytime');
        // Redirect to business list
        router.push("/business");
      } else {
        throw new Error("Suspend failed");
      }
    } catch (err: any) {
      toast.error('Suspension Failed');
    } finally {
      setIsSuspending(false);
    }
  };

  // ===========================================================================
  // RENDER
  // ===========================================================================

  return (
    <div className="min-h-screen bg-white py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        
        {/* Header Section */}
        <div className="mb-8">
          <Link
            href="/business"
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-6 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Business
          </Link>
          {/* <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-amber-100 rounded-xl flex items-center justify-center mb-4 border border-amber-200">
              <Pause className="h-6 w-6 text-amber-600" />
            </div>
            <h1 className="text-2xl font-semibold text-gray-900 mb-3">
              Suspend Business
            </h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Temporarily pause your business operations while preserving all data
            </p>
          </div> */}
        </div>

        {/* Main Content Card */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          
          {/* Warning Header */}
          <div className="bg-gradient-to-r from-black to-blue-900 px-6 py-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-white/20 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">Temporary Suspension</h2>
                  <p className="text-amber-100 text-sm">Reversible action - your data remains safe</p>
                </div>
              </div>
              <div className="bg-white/20 px-3 py-1 rounded-lg">
                <span className="text-white font-medium text-sm flex items-center gap-1">
                  <Zap className="h-3 w-3" />
                  Temporary
                </span>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            
            {/* What will happen */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-3">
                <Building2 className="h-5 w-5 text-amber-500" />
                What will happen during suspension
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-lg border border-amber-200">
                  <div className="p-2 bg-amber-100 rounded-lg">
                    <Pause className="h-4 w-4 text-amber-600" />
                  </div>
                  <div>
                    <p className="font-medium text-amber-800">Operations Paused</p>
                    <p className="text-amber-700 text-sm mt-1">All business operations will be temporarily disabled</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-lg border border-amber-200">
                  <div className="p-2 bg-amber-100 rounded-lg">
                    <Shield className="h-4 w-4 text-amber-600" />
                  </div>
                  <div>
                    <p className="font-medium text-amber-800">Data Protected</p>
                    <p className="text-amber-700 text-sm mt-1">All your business data remains secure and intact</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-lg border border-amber-200">
                  <div className="p-2 bg-amber-100 rounded-lg">
                    <Users className="h-4 w-4 text-amber-600" />
                  </div>
                  <div>
                    <p className="font-medium text-amber-800">Access Limited</p>
                    <p className="text-amber-700 text-sm mt-1">Team members will have limited access</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-lg border border-amber-200">
                  <div className="p-2 bg-amber-100 rounded-lg">
                    <Play className="h-4 w-4 text-amber-600" />
                  </div>
                  <div>
                    <p className="font-medium text-amber-800">Easy Reactivation</p>
                    <p className="text-amber-700 text-sm mt-1">Reactivate anytime with a single click</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Benefits of Suspension */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                  <Calendar className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-blue-900 mb-3">When to Use Suspension</h4>
                  <ul className="text-blue-800 space-y-2 text-sm">
                    <li className="flex items-start">
                      <span className="text-blue-600 mr-3 font-bold">•</span>
                      <span><strong>Seasonal breaks</strong> or temporary closures</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-blue-600 mr-3 font-bold">•</span>
                      <span><strong>Staff vacations</strong> or reduced capacity periods</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-blue-600 mr-3 font-bold">•</span>
                      <span><strong>System maintenance</strong> or platform updates</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-blue-600 mr-3 font-bold">•</span>
                      <span><strong>Rebranding phases</strong> or business restructuring</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Reason Input */}
            <div className="mb-6">
              <label className={labelClass}>
                Reason for Suspension <span className="text-gray-500 text-sm font-normal">(Optional)</span>
              </label>
              <textarea
                value={suspensionReason}
                onChange={(e) => setSuspensionReason(e.target.value)}
                placeholder="Briefly describe why you're suspending the business..."
                rows={3}
                className={inputClass}
              />
              <p className="text-sm text-gray-500 mt-2">
                This helps us understand your needs and provide better support
              </p>
            </div>

            {/* Confirmation Input */}
            <div className="mb-8">
              <label className={labelClass}>
                Type <span className="font-mono text-amber-600 bg-amber-50 px-2 py-1 rounded border border-amber-200">SUSPEND</span> to confirm this action
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="Enter SUSPEND to confirm"
                className={`${inputClass} font-mono`}
              />
              <p className="text-sm text-gray-500 mt-2">
                This verification step ensures you understand this is a temporary suspension
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-end pt-6 border-t border-gray-200">
              <Link
                href="/business"
                className="px-6 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors text-center"
              >
                Cancel
              </Link>
              
              <button
                onClick={handleSuspendBusiness}
                disabled={isSuspending || confirmText !== "SUSPEND"}
                className="px-6 py-2.5 bg-amber-600 text-white font-medium rounded-lg hover:bg-amber-700 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center min-w-[160px]"
              >
                {isSuspending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    <span>Suspending...</span>
                  </>
                ) : (
                  <>
                    <Pause className="h-4 w-4 mr-2" />
                    <span>Suspend Business</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Additional Information */}
        <div className="text-center mt-8">
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 max-w-2xl mx-auto">
            <h4 className="font-semibold text-green-900 mb-2 flex items-center justify-center gap-2">
              <Play className="h-4 w-4 text-green-600" />
              Quick Reactivation Available
            </h4>
            <p className="text-green-800 text-sm">
              You can reactivate your business anytime from the business dashboard. 
              All your data and settings will be preserved exactly as you left them.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuspendBusinessPage;