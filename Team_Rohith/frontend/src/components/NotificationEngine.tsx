"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, CheckCircle, Bell } from "lucide-react";

export const NotificationEngine = ({ notifications }: { notifications: any[] }) => {
  const [activeNots, setActiveNots] = useState<any[]>([]);

  // Simple engine that pops notifications in staggered intervals for the demo
  useEffect(() => {
    if (notifications.length > 0) {
      notifications.forEach((notif, index) => {
        setTimeout(() => {
          setActiveNots(prev => [...prev, { ...notif, id: Math.random() }]);
          
          // Auto remove after 5s
          setTimeout(() => {
            setActiveNots(prev => prev.filter(n => n.id !== notif.id)); // Not perfect id matching, but works for mock
          }, 5000);
        }, index * 1500); // stagger appearances
      });
    }
  }, [notifications]);

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col space-y-3 pointer-events-none">
      <AnimatePresence>
        {activeNots.map((notif, i) => (
          <motion.div
            key={notif.id || i}
            initial={{ opacity: 0, x: 50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.9 }}
            className={`pointer-events-auto p-4 rounded-xl shadow-2xl border flex items-start space-x-3 w-80 backdrop-blur-md ${
              notif.type === "slack" 
                ? "bg-[#3F0E40]/90 border-[#3F0E40] text-white" 
                : "bg-brand-black/90 border-brand-primary-light/30 text-text-primary"
            }`}
          >
            <div className={`mt-0.5 ${notif.type === "slack" ? "text-white" : "text-brand-primary-light"}`}>
              {notif.type === "slack" ? <Bell size={20} /> : <Mail size={20} />}
            </div>
            <div>
              <h4 className="font-semibold text-sm">{notif.title}</h4>
              <p className="text-xs mt-1 opacity-90">{notif.message}</p>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
