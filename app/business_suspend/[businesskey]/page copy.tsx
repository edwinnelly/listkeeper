"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useCallback } from "react";
import Link from "next/link";
import api from "@/lib/axios";
import Cookies from "js-cookie";
import {
  ArrowLeft,
  Pause,
  Play,
  AlertTriangle,
  Building2,
  Shield,
  Users,
  Calendar,
  Zap,
  CheckCircle,
  Info,
  HelpCircle,
  RefreshCw,
  AlertCircle,
  Loader2,
} from "lucide-react";
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
  const [showHelp, setShowHelp] = useState(false);

  // Input classes
  const inputClass =
    "w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-500 focus:border-gray-500 outline-none transition-all duration-200 placeholder-gray-400 text-sm shadow-sm";
  const labelClass = "block text-sm font-medium text-gray-700 mb-2";

  // ===========================================================================
  // HANDLERS
  // ===========================================================================

  const handleSuspendBusiness = useCallback(async () => {
    if (confirmText !== "SUSPEND") {
      toast.error('Please type "SUSPEND" to confirm temporary suspension');
      return;
    }

    try {
      setIsSuspending(true);

      // Get CSRF token for secure request
      await api.get("/sanctum/csrf-cookie");

      const res = await api.put(
        `/suspendBusiness/${id}`,
        {
          status: "inactive",
          suspension_reason:
            suspensionReason || "Temporary suspension by owner",
        },
        {
          headers: {
            "X-XSRF-TOKEN": Cookies.get("XSRF-TOKEN") || "",
          },
        },
      );

      if (res.status === 200) {
        toast.success(
          "Your business has been temporarily suspended. You can reactivate it anytime",
        );
        router.push("/business");
      } else {
        throw new Error("Suspend failed");
      }
    } catch {
      toast.error("Suspension Failed. Please try again.");
    } finally {
      setIsSuspending(false);
    }
  }, [id, confirmText, suspensionReason, router]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, action: () => void) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        action();
      }
    },
    [],
  );

  const handleConfirmChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setConfirmText(e.target.value);
    },
    [],
  );

  const handleReasonChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setSuspensionReason(e.target.value);
    },
    [],
  );

  const toggleHelp = useCallback(() => {
    setShowHelp((prev) => !prev);
  }, []);

  // ===========================================================================
  // RENDER
  // ===========================================================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-50/30 to-gray-50/20 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Header Section */}
        <div className="mb-8">
          <Link
            href="/business"
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-6 transition-all duration-300 group font-medium focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 rounded-lg px-3 py-2"
            aria-label="Back to business list"
          >
            <ArrowLeft
              className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform"
              aria-hidden="true"
            />
            Back to Business
          </Link>
        </div>

        {/* Main Content Card */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-white/50 shadow-2xl shadow-gray-100/20 overflow-hidden">
          {/* Warning Header */}
          <div className="bg-gradient-to-r from-gray-600 to-gray-700 px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                  <AlertTriangle
                    className="h-6 w-6 text-white"
                    aria-hidden="true"
                  />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">
                    Suspend Business
                  </h1>
                  <p className="text-gray-100 text-sm mt-1">
                    Temporary suspension - your data remains safe
                  </p>
                </div>
              </div>
              <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl">
                <span className="text-white font-medium text-sm flex items-center gap-2">
                  <Zap className="h-4 w-4" aria-hidden="true" />
                  Temporary Action
                </span>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-8">
            {/* What will happen */}
            <section className="mb-8" aria-label="Suspension effects">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-3">
                <Building2
                  className="h-6 w-6 text-gray-600"
                  aria-hidden="true"
                />
                What will happen during suspension
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  {
                    icon: Pause,
                    title: "Operations Paused",
                    description:
                      "All business operations will be temporarily disabled",
                    color: "gray",
                  },
                  {
                    icon: Shield,
                    title: "Data Protected",
                    description:
                      "All your business data remains secure and intact",
                    color: "gray",
                  },
                  {
                    icon: Users,
                    title: "Access Limited",
                    description: "Team members will have limited access",
                    color: "gray",
                  },
                  {
                    icon: Play,
                    title: "Easy Reactivation",
                    description: "Reactivate anytime with a single click",
                    color: "gray",
                  },
                ].map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={idx}
                      className="flex items-start gap-4 p-5 bg-gradient-to-br from-white to-gray-50 rounded-xl border border-gray-200 hover:shadow-md transition-all duration-300 group hover:scale-[1.02] hover:border-gray-200"
                    >
                      <div
                        className={`p-3 bg-${item.color}-50 rounded-xl border border-${item.color}-200 group-hover:border-${item.color}-300 transition-colors`}
                      >
                        <Icon
                          className={`h-5 w-5 text-${item.color}-600`}
                          aria-hidden="true"
                        />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">
                          {item.title}
                        </p>
                        <p className="text-gray-600 text-sm mt-1">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Benefits of Suspension */}
            <div className="bg-gradient-to-br from-gray-50 to-indigo-50 border border-gray-200 rounded-xl p-6 mb-8">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-white rounded-xl border border-gray-200 flex-shrink-0 shadow-sm">
                  <Calendar
                    className="h-5 w-5 text-gray-600"
                    aria-hidden="true"
                  />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-3 text-lg">
                    When to Use Suspension
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[
                      "Seasonal breaks or temporary closures",
                      "Staff vacations or reduced capacity periods",
                      "System maintenance or platform updates",
                      "Rebranding phases or business restructuring",
                    ].map((item, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-gray-600 text-xs font-bold">
                            {idx + 1}
                          </span>
                        </div>
                        <span className="text-gray-700 text-sm">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Help Toggle */}
            <button
              onClick={toggleHelp}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-700 mb-4 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 rounded-lg px-3 py-2"
              type="button"
            >
              <HelpCircle className="h-4 w-4" aria-hidden="true" />
              {showHelp ? "Hide help" : "Need help? Click for guidance"}
            </button>

            {/* Help Section */}
            {showHelp && (
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 mb-6 animate-slideDown">
                <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <Info className="h-4 w-4" aria-hidden="true" />
                  Suspension Guidance
                </h4>
                <ul className="space-y-2 text-sm text-gray-800">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                    <span>
                      Business will be marked as inactive but all data is
                      preserved
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                    <span>
                      Team members won&apos;t be able to access business
                      operations
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                    <span>
                      You can reactivate at any time from the business dashboard
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                    <span>Billing will be paused during suspension period</span>
                  </li>
                </ul>
              </div>
            )}

            {/* Reason Input */}
            <div className="mb-6">
              <label htmlFor="suspension-reason" className={labelClass}>
                Reason for Suspension{" "}
                <span className="text-gray-400 text-sm font-normal">
                  (Optional)
                </span>
              </label>
              <textarea
                id="suspension-reason"
                value={suspensionReason}
                onChange={handleReasonChange}
                placeholder="Briefly describe why you're suspending the business..."
                rows={3}
                className={inputClass}
                aria-label="Reason for suspension"
              />
              <p className="text-sm text-gray-500 mt-2 flex items-center gap-1">
                <Info className="h-4 w-4" aria-hidden="true" />
                This helps us understand your needs and provide better support
              </p>
            </div>

            {/* Confirmation Input */}
            <div className="mb-8">
              <label htmlFor="confirm-text" className={labelClass}>
                Type{" "}
                <span className="font-mono text-gray-600 bg-gray-50 px-2 py-1 rounded-md border border-gray-200">
                  SUSPEND
                </span>{" "}
                to confirm this action
              </label>
              <div className="relative">
                <input
                  id="confirm-text"
                  type="text"
                  value={confirmText}
                  onChange={handleConfirmChange}
                  placeholder="Enter SUSPEND to confirm"
                  className={`${inputClass} font-mono pr-10`}
                  aria-label="Confirmation text"
                />
                {confirmText === "SUSPEND" && (
                  <CheckCircle
                    className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500"
                    aria-hidden="true"
                  />
                )}
              </div>
              <p className="text-sm text-gray-500 mt-2 flex items-center gap-1">
                <Shield className="h-4 w-4" aria-hidden="true" />
                This verification ensures you understand this is a temporary
                suspension
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-end pt-6 border-t border-gray-200">
              <Link
                href="/business"
                className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors text-center focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                aria-label="Cancel suspension"
              >
                Cancel
              </Link>

              <button
                onClick={handleSuspendBusiness}
                onKeyDown={(e) => handleKeyDown(e, handleSuspendBusiness)}
                disabled={isSuspending || confirmText !== "SUSPEND"}
                className="px-8 py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white font-medium rounded-xl hover:from-gray-700 hover:to-gray-800 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center min-w-[180px] shadow-lg shadow-gray-500/25"
                aria-label="Suspend business"
                type="button"
              >
                {isSuspending ? (
                  <>
                    <Loader2
                      className="h-4 w-4 mr-2 animate-spin"
                      aria-hidden="true"
                    />
                    <span>Suspending...</span>
                  </>
                ) : (
                  <>
                    <Pause className="h-4 w-4 mr-2" aria-hidden="true" />
                    <span>Suspend Business</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Additional Information */}
        <div className="text-center mt-8">
          <div className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-2xl p-8 max-w-2xl mx-auto shadow-lg">
            <div className="w-14 h-14 bg-gray-50 rounded-xl flex items-center justify-center mx-auto mb-4 border border-gray-200">
              <Play className="h-6 w-6 text-gray-600" aria-hidden="true" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2 text-lg flex items-center justify-center gap-2">
              Quick Reactivation Available
            </h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              You can reactivate your business anytime from the business
              dashboard. All your data and settings will be preserved exactly as
              you left them.
            </p>
            <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-500">
              <RefreshCw className="h-3 w-3" aria-hidden="true" />
              <span>Zero data loss • Instant reactivation</span>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <footer className="text-center mt-8 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            Need help? Contact our support team for assistance
          </p>
        </footer>
      </div>
    </div>
  );
};

export default SuspendBusinessPage;
