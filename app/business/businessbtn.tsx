import { ChevronRight } from 'lucide-react'
import Link from 'next/link'
import React from 'react'

const Business = () => {
  return (
    <div>
      <Link href="/business">
        <button className="group/btn relative overflow-hidden px-3 py-1.5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-xl text-sm font-medium transition-all duration-300 flex items-center shadow-md hover:shadow-lg transform hover:-translate-y-0.5 cursor-pointer">
          <span className="relative z-10">Switch Account</span>
          <ChevronRight
            size={16}
            className="ml-1 group-hover/btn:translate-x-1 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-700"></div>
        </button>
      </Link>
    </div>
  )
}

export default Business
