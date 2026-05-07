'use client';

import { useParams, useRouter } from "next/navigation";
import { useState, useCallback } from "react";
import Link from "next/link";
import api from "@/lib/axios";
import Cookies from "js-cookie";
import { ArrowLeft, Trash2, AlertTriangle, Building2, Shield, FileText, MapPin, Users, Zap, AlertCircle, Loader2, CheckCircle } from "lucide-react";
import { toast } from 'react-hot-toast';
import { motion } from "framer-motion";

// =============================================================================
// MAIN COMPONENT
// =============================================================================

const DeleteBusinessPage: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const id = params.businesskey as string;
  
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [confirmText, setConfirmText] = useState<string>("");

  const inputClass = "w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-rose-500/10 focus:border-rose-400 outline-none transition text-gray-700 placeholder-gray-300";
  const labelClass = "text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block";

  const handleDeleteBusiness = useCallback(async (): Promise<void> => {
    if (confirmText !== "DELETE") {
      toast.error('Please type "DELETE" to confirm permanent deletion');
      return;
    }
    
    try {
      setIsDeleting(true);
      await api.get("/sanctum/csrf-cookie");
      
      const res = await api.delete(`/deletebusiness/${id}`, {
        headers: { 
          "X-XSRF-TOKEN": Cookies.get("XSRF-TOKEN") || "",
        },
      });

      if (res.status === 200) {
        toast.success('Your business and all associated data have been permanently deleted');
        router.push("/business");
      } else {
        throw new Error("Delete failed");
      }
    } catch {
      toast.error('Failed to delete business. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  }, [id, confirmText, router]);

  const handleConfirmChange = useCallback((e: React.ChangeEvent<HTMLInputElement>): void => {
    setConfirmText(e.target.value);
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
              <h1 className="text-lg font-bold text-gray-900 tracking-tight">Delete Business</h1>
              <p className="text-xs text-gray-400">Irreversible action - proceed with extreme caution</p>
            </div>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold tracking-wide bg-rose-50 text-rose-700">
            <AlertTriangle className="h-3.5 w-3.5" />
            DESTRUCTIVE ACTION
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">
        {/* Critical Warning Banner */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-rose-50 border border-rose-100 rounded-2xl p-5 mb-6"
        >
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-rose-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-rose-600" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-rose-900 mb-1">Critical Warning</h3>
              <p className="text-sm text-rose-700 leading-relaxed">
                This action is permanent and irreversible. All business data, customer records, transaction history, and configurations will be permanently deleted from our servers with no recovery option.
              </p>
            </div>
          </div>
        </motion.div>

        {/* What Will Be Deleted */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-5">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
            <div className="w-9 h-9 bg-rose-600 rounded-xl flex items-center justify-center">
              <Trash2 className="h-4.5 w-4.5 text-white" />
            </div>
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">What Will Be Permanently Deleted</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { icon: Building2, title: "Business Profile", description: "All company information and configuration data" },
                { icon: MapPin, title: "Locations & Data", description: "All physical locations and geographical data" },
                { icon: Users, title: "Customer Data", description: "All customer records and transaction history" },
                { icon: Shield, title: "Access & Permissions", description: "Team member access and security settings" },
              ].map((item, idx) => {
                const Icon = item.icon;
                return (
                  <div key={idx} className="flex items-start gap-3 p-4 bg-rose-50/50 rounded-xl border border-rose-100">
                    <div className="w-9 h-9 bg-white rounded-xl border border-rose-100 flex items-center justify-center flex-shrink-0">
                      <Icon className="h-4 w-4 text-rose-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900">{item.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Critical Considerations */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-5">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
            <div className="w-9 h-9 bg-amber-500 rounded-xl flex items-center justify-center">
              <AlertCircle className="h-4.5 w-4.5 text-white" />
            </div>
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Critical Considerations</h2>
          </div>
          <div className="p-6">
            <div className="space-y-2">
              {[
                "This action cannot be undone - no recovery option available",
                "All data will be permanently removed from our servers",
                "Active subscriptions will be cancelled immediately",
                "Team members will lose access immediately",
              ].map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 bg-amber-50 rounded-xl border border-amber-100">
                  <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-[10px] font-bold text-amber-700">{idx + 1}</span>
                  </div>
                  <span className="text-sm text-amber-800">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Confirmation */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-5">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Confirm Deletion</h2>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label htmlFor="confirm-text" className={labelClass}>
                Type <span className="font-mono text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">DELETE</span> to confirm
              </label>
              <div className="relative">
                <input
                  id="confirm-text"
                  type="text"
                  value={confirmText}
                  onChange={handleConfirmChange}
                  placeholder="Enter DELETE to confirm"
                  className={`${inputClass} font-mono pr-10`}
                />
                {confirmText === "DELETE" && (
                  <CheckCircle className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500" />
                )}
              </div>
              <p className="text-xs text-gray-400 mt-1.5">
                This extra verification step ensures you understand the permanence of this destructive action
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
            onClick={handleDeleteBusiness}
            disabled={isDeleting || confirmText !== "DELETE"}
            className="px-6 py-2.5 bg-rose-600 text-white text-sm font-bold rounded-xl hover:bg-rose-700 transition-all shadow-md shadow-rose-600/15 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2 min-w-[160px]"
            type="button"
          >
            {isDeleting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4" />
                Delete Business
              </>
            )}
          </button>
        </div>

        {/* Footer Note */}
        <div className="mt-8 pt-6 border-t border-gray-200 text-center">
          <p className="text-xs text-gray-400">
            Need help? Contact our support team before proceeding with deletion
          </p>
        </div>
      </main>
    </div>
  );
};

export default DeleteBusinessPage;