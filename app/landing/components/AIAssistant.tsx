"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X } from "lucide-react";

export const AIAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);

  const suggestions = [
    { emoji: "📊", text: "Show me inventory insights" },
    { emoji: "🔔", text: "Set up low stock alerts" },
    { emoji: "📈", text: "Generate sales report" },
  ];

  return (
    <>
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 p-4 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full shadow-lg hover:shadow-xl transition-all"
      >
        <MessageCircle size={24} className="text-white" />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.9 }}
            className="fixed bottom-24 right-6 z-50 w-80 bg-white rounded-2xl shadow-2xl border border-gray-200"
          >
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <MessageCircle size={20} className="text-indigo-600" />
                <span className="font-semibold text-gray-900">
                  AI Assistant
                </span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-4">
              <p className="text-sm text-gray-600 mb-4">
                Hi! I&apos;m your inventory assistant. How can I help you today?
              </p>
              <div className="space-y-2">
                {suggestions.map((suggestion, i) => (
                  <button
                    key={i}
                    className="w-full text-left text-sm p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition text-gray-700"
                  >
                    {suggestion.emoji} {suggestion.text}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
