'use client';

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import api from "@/lib/axios";
import Cookies from "js-cookie";
import { ArrowLeft, Trash2, AlertTriangle, Building2, Shield, FileText, MapPin, Users, Zap, AlertCircle } from "lucide-react";
import { toast } from 'react-hot-toast';

// =============================================================================
// MAIN COMPONENT
// =============================================================================

const DeleteBusinessPage = () => {
  const params = useParams();
  const router = useRouter();
  const id = params.businesskey as string;
  
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  // Input classes from your concept
  const inputClass = "w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200 placeholder-gray-400 text-sm";
  const labelClass = "block text-sm font-medium text-gray-700 mb-2";

  // ===========================================================================
  // DELETE HANDLER
  // ===========================================================================
  const handleDeleteBusiness = async () => {
    if (confirmText !== "DELETE") {
      toast.error('Please type "DELETE" to confirm permanent deletion');
      return;
    }
    
    try {
      setIsDeleting(true);
      
      // Get CSRF token for secure request
      await api.get("/sanctum/csrf-cookie");
      
      const res = await api.delete(`/deletebusiness/${id}`, {
        headers: { 
          "X-XSRF-TOKEN": Cookies.get("XSRF-TOKEN") || "",
        },
      });

      if (res.status === 200) {
        toast.success('Your business and all associated data have been permanently deleted');
        // Redirect to business list
        router.push("/business");
      } else {
        throw new Error("Delete failed");
      }
    } catch (err: any) {
      toast.error('Failed to delete business. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  // ===========================================================================
  // RENDER
  // ===========================================================================

  return (
    <div className="min-h-screen bg-white py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        
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
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-xl flex items-center justify-center mb-4 border border-red-200">
              <Trash2 className="h-6 w-6 text-red-600" />
            </div>
            <h1 className="text-2xl font-semibold text-gray-900 mb-3">
              Delete Business
            </h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Permanently delete your business and all associated data from our systems
            </p>
          </div> */}
        </div>

        {/* Main Content Card */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          
          {/* Warning Header */}
          <div className="bg-gradient-to-r from-black to-red-700 px-6 py-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-white/20 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">Delete Business Profile</h2>
                  <p className="text-red-100 text-sm">Irreversible action - proceed with extreme caution</p>
                </div>
              </div>
              <div className="bg-white/20 px-3 py-1 rounded-lg">
                <span className="text-white font-medium text-sm flex items-center gap-1">
                  <Zap className="h-3 w-3" />
                  Destructive
                </span>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            
            {/* What will be deleted */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-3">
                <Building2 className="h-5 w-5 text-red-500" />
                What will be permanently deleted
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3 p-4 bg-red-50 rounded-lg border border-red-200">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <FileText className="h-4 w-4 text-red-600" />
                  </div>
                  <div>
                    <p className="font-medium text-red-800">Business Profile</p>
                    <p className="text-red-700 text-sm mt-1">All company information and configuration data</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-4 bg-red-50 rounded-lg border border-red-200">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <MapPin className="h-4 w-4 text-red-600" />
                  </div>
                  <div>
                    <p className="font-medium text-red-800">Locations & Data</p>
                    <p className="text-red-700 text-sm mt-1">All physical locations and geographical data</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-4 bg-red-50 rounded-lg border border-red-200">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <Users className="h-4 w-4 text-red-600" />
                  </div>
                  <div>
                    <p className="font-medium text-red-800">Customer Data</p>
                    <p className="text-red-700 text-sm mt-1">All customer records and transaction history</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-4 bg-red-50 rounded-lg border border-red-200">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <Shield className="h-4 w-4 text-red-600" />
                  </div>
                  <div>
                    <p className="font-medium text-red-800">Access & Permissions</p>
                    <p className="text-red-700 text-sm mt-1">Team member access and security settings</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Important Notes */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 mb-8">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-amber-100 rounded-lg flex-shrink-0">
                  <AlertCircle className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-amber-900 mb-3">Critical Considerations Before Proceeding</h4>
                  <ul className="text-amber-800 space-y-2 text-sm">
                    <li className="flex items-start">
                      <span className="text-amber-600 mr-3 font-bold">•</span>
                      <span>This action <strong>cannot be undone</strong> - no recovery option</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-amber-600 mr-3 font-bold">•</span>
                      <span>All data will be <strong>permanently removed</strong> from servers</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-amber-600 mr-3 font-bold">•</span>
                      <span>Active subscriptions will be <strong>cancelled immediately</strong></span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-amber-600 mr-3 font-bold">•</span>
                      <span>Team members will <strong>lose access immediately</strong></span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Confirmation Input */}
            <div className="mb-8">
              <label className={labelClass}>
                Type <span className="font-mono text-red-600 bg-red-50 px-2 py-1 rounded border border-red-200">DELETE</span> to confirm this action
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="Enter DELETE to confirm"
                className={`${inputClass} font-mono`}
              />
              <p className="text-sm text-gray-500 mt-2">
                This extra verification step ensures you understand the permanence of this destructive action
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
                onClick={handleDeleteBusiness}
                disabled={isDeleting || confirmText !== "DELETE"}
                className="px-6 py-2.5 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center min-w-[160px]"
              >
                {isDeleting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    <span>Delete Business</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteBusinessPage;