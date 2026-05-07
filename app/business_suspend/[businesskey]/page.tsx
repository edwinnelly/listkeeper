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
  ChevronDown,
} from "lucide-react";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

// =============================================================================
// MAIN COMPONENT
// =============================================================================

const SuspendBusinessPage: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const id = params.businesskey as string;

  const [isSuspending, setIsSuspending] = useState<boolean>(false);
  const [confirmText, setConfirmText] = useState<string>("");
  const [suspensionReason, setSuspensionReason] = useState<string>("");
  const [showHelp, setShowHelp] = useState<boolean>(false);

  const inputClass =
    "w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 outline-none transition text-gray-700 placeholder-gray-300";
  const labelClass = "text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block";

  const handleSuspendBusiness = useCallback(async (): Promise<void> => {
    if (confirmText !== "SUSPEND") {
      toast.error('Please type "SUSPEND" to confirm temporary suspension');
      return;
    }

    try {
      setIsSuspending(true);
      await api.get("/sanctum/csrf-cookie");
      const res = await api.put(
        `/suspendBusiness/${id}`,
        {
          status: "inactive",
          suspension_reason: suspensionReason || "Temporary suspension by owner",
        },
        {
          headers: {
            "X-XSRF-TOKEN": Cookies.get("XSRF-TOKEN") || "",
          },
        },
      );

      if (res.status === 200) {
        toast.success("Your business has been temporarily suspended. You can reactivate it anytime");
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

  const handleConfirmChange = useCallback((e: React.ChangeEvent<HTMLInputElement>): void => {
    setConfirmText(e.target.value);
  }, []);

  const handleReasonChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>): void => {
    setSuspensionReason(e.target.value);
  }, []);

  const toggleHelp = useCallback((): void => {
    setShowHelp((prev) => !prev);
  }, []);

  return (
    <div className="min-h-screen bg-[#f5f5f4]">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 top-0 z-40">
        <div className="max-w-screen-2xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/business"
              className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-800 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <h1 className="text-lg font-bold text-gray-900 tracking-tight">Suspend Business</h1>
              <p className="text-xs text-gray-400">Temporary suspension - your data remains safe</p>
            </div>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold tracking-wide bg-amber-50 text-amber-700">
            <AlertTriangle className="h-3.5 w-3.5" />
            TEMPORARY ACTION
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">
        {/* Warning Banner */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-amber-50 border border-amber-100 rounded-2xl p-5 mb-6"
        >
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-amber-900 mb-1">Important Notice</h3>
              <p className="text-sm text-amber-700 leading-relaxed">
                Suspending your business will temporarily disable all operations. Your data remains secure and can be restored at any time.
              </p>
            </div>
          </div>
        </motion.div>

        {/* What Happens */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-5">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
            <div className="w-9 h-9 bg-gray-900 rounded-xl flex items-center justify-center">
              <Building2 className="h-4.5 w-4.5 text-white" />
            </div>
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">What Happens During Suspension</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { icon: Pause, title: "Operations Paused", description: "All business operations will be temporarily disabled" },
                { icon: Shield, title: "Data Protected", description: "All your business data remains secure and intact" },
                { icon: Users, title: "Access Limited", description: "Team members will have limited access" },
                { icon: Play, title: "Easy Reactivation", description: "Reactivate anytime with a single click" },
              ].map((item, idx) => {
                const Icon = item.icon;
                return (
                  <div key={idx} className="flex items-start gap-3 p-4 bg-stone-50 rounded-xl border border-gray-100">
                    <div className="w-9 h-9 bg-white rounded-xl border border-gray-100 flex items-center justify-center flex-shrink-0">
                      <Icon className="h-4 w-4 text-gray-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900">{item.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{item.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* When to Use */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-5">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
            <div className="w-9 h-9 bg-gray-900 rounded-xl flex items-center justify-center">
              <Calendar className="h-4.5 w-4.5 text-white" />
            </div>
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">When to Use Suspension</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                "Seasonal breaks or temporary closures",
                "Staff vacations or reduced capacity periods",
                "System maintenance or platform updates",
                "Rebranding phases or business restructuring",
              ].map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 bg-stone-50 rounded-xl border border-gray-100">
                  <div className="w-6 h-6 rounded-full bg-gray-900 flex items-center justify-center flex-shrink-0">
                    <span className="text-[10px] font-bold text-white">{idx + 1}</span>
                  </div>
                  <span className="text-sm text-gray-600">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Help Toggle */}
        <button
          onClick={toggleHelp}
          className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-900 mb-5 transition-colors"
          type="button"
        >
          <HelpCircle className="h-4 w-4" />
          {showHelp ? "Hide guidance" : "Need help? Click for guidance"}
          <ChevronDown className={`h-4 w-4 transition-transform ${showHelp ? "rotate-180" : ""}`} />
        </button>

        {/* Help Section */}
        <AnimatePresence>
          {showHelp && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mb-5"
            >
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-9 h-9 bg-gray-900 rounded-xl flex items-center justify-center">
                    <Info className="h-4.5 w-4.5 text-white" />
                  </div>
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Suspension Guidance</h3>
                </div>
                <div className="space-y-2">
                  {[
                    { icon: CheckCircle, text: "Business will be marked as inactive but all data is preserved", color: "text-emerald-500" },
                    { icon: CheckCircle, text: "Team members won't be able to access business operations", color: "text-emerald-500" },
                    { icon: CheckCircle, text: "You can reactivate at any time from the business dashboard", color: "text-emerald-500" },
                    { icon: AlertCircle, text: "Billing will be paused during suspension period", color: "text-amber-500" },
                  ].map((item, idx) => {
                    const Icon = item.icon;
                    return (
                      <div key={idx} className="flex items-start gap-3 p-3 bg-stone-50 rounded-xl border border-gray-100">
                        <Icon className={`h-4 w-4 flex-shrink-0 mt-0.5 ${item.color}`} />
                        <span className="text-sm text-gray-600">{item.text}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Reason Input */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-5">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Suspension Details</h2>
          </div>
          <div className="p-6 space-y-5">
            <div>
              <label htmlFor="suspension-reason" className={labelClass}>
                Reason for Suspension <span className="text-gray-400 font-normal">(Optional)</span>
              </label>
              <textarea
                id="suspension-reason"
                value={suspensionReason}
                onChange={handleReasonChange}
                placeholder="Briefly describe why you're suspending the business..."
                rows={3}
                className={`${inputClass} resize-none`}
              />
              <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1">
                <Info className="h-3 w-3" />
                This helps us understand your needs and provide better support
              </p>
            </div>

            <div>
              <label htmlFor="confirm-text" className={labelClass}>
                Type <span className="font-mono text-gray-800 bg-gray-100 px-2 py-0.5 rounded-md">SUSPEND</span> to confirm
              </label>
              <div className="relative">
                <input
                  id="confirm-text"
                  type="text"
                  value={confirmText}
                  onChange={handleConfirmChange}
                  placeholder="Enter SUSPEND to confirm"
                  className={`${inputClass} font-mono pr-10`}
                />
                {confirmText === "SUSPEND" && (
                  <CheckCircle className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500" />
                )}
              </div>
              <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1">
                <Shield className="h-3 w-3" />
                This verification ensures you understand this is a temporary suspension
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-end">
          <Link
            href="/business"
            className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-50 transition text-center"
          >
            Cancel
          </Link>
          <button
            onClick={handleSuspendBusiness}
            disabled={isSuspending || confirmText !== "SUSPEND"}
            className="px-6 py-2.5 bg-amber-600 text-white text-sm font-bold rounded-xl hover:bg-amber-700 transition-all shadow-md shadow-amber-600/15 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2 min-w-[180px]"
            type="button"
          >
            {isSuspending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Suspending...
              </>
            ) : (
              <>
                <Pause className="h-4 w-4" />
                Suspend Business
              </>
            )}
          </button>
        </div>

        {/* Footer Note */}
        <div className="mt-8 pt-6 border-t border-gray-200 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2.5 bg-white rounded-xl border border-gray-100 shadow-sm">
            <RefreshCw className="h-3.5 w-3.5 text-gray-400" />
            <span className="text-xs text-gray-500">Zero data loss • Instant reactivation</span>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SuspendBusinessPage;