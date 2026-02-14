import React from "react";
import { Building2, GitBranch, PlusCircle, Settings } from "lucide-react";
import Link from "next/link"

const NewAccount = () => {
  return (
    <div className="flex justify-center items-center mt-10 px-4">
      <div className="w-full md:w-2/3 lg:w-1/2">
        <div className="p-8 rounded-3xl shadow-xl border border-gray-100 bg-white/80 backdrop-blur-xl transition-all duration-300 hover:shadow-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <h4 className="font-bold text-gray-900 text-2xl">
              🚀 Ready to Launch a New Business?
            </h4>
            <p className="text-gray-500 mt-2 text-sm">
              Just a few quick notes before you begin:
            </p>
          </div>

          {/* List */}
          <ul className="space-y-4">
            <li className="flex items-start gap-3">
              <Building2 className="text-blue-600 w-6 h-6 flex-shrink-0" />
              <span className="text-gray-700">
                Fill in the business name, address, and logo.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <GitBranch className="text-green-600 w-6 h-6 flex-shrink-0" />
              <span className="text-gray-700">
                You can add multiple branches later.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <Settings className="text-yellow-500 w-6 h-6 flex-shrink-0" />
              <span className="text-gray-700">
                Each business has its own accounts and settings.
              </span>
            </li>
          </ul>

          {/* Button */}
          <div className="text-center mt-8">
            
            

<Link
  href="/business"
  className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 
             hover:from-blue-700 hover:to-indigo-700 text-white text-sm font-bold rounded-full 
             px-7 py-4 shadow-md hover:shadow-lg transition-all duration-300"
>
  <PlusCircle size={18} className="text-white" />
  <span>Create New Business</span>
</Link>


          </div>

        </div>
      </div>
    </div>
  );
};

export default NewAccount;
