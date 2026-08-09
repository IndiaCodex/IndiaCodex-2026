"use client";

import React from "react";
import { AlertCircle, Clock } from "lucide-react";
import { motion } from "framer-motion";

export const Reminders = ({ documents }: { documents: any[] }) => {
  // Extract and sort reminders from all documents
  const allReminders = documents.flatMap(doc => {
    return (doc.reminders || []).map((rem: any) => ({
      ...rem,
      sourceDoc: doc.title || "Unknown Document"
    }));
  }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Filter out past reminders
  const upcomingReminders = allReminders.filter(rem => new Date(rem.date).getTime() >= Date.now());

  if (upcomingReminders.length === 0) {
    return <div className="text-text-muted text-sm text-center py-4">No active reminders.</div>;
  }

  return (
    <div className="space-y-4">
      {upcomingReminders.slice(0, 5).map((reminder, i) => {
        const daysUntil = Math.ceil((new Date(reminder.date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        const isUrgent = daysUntil <= 7;

        return (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`p-3 rounded-lg border ${isUrgent ? 'bg-brand-warning/10 border-brand-warning/30' : 'bg-white/5 border-white/5'} flex items-start`}
          >
            <div className={`mt-0.5 mr-3 ${isUrgent ? 'text-brand-warning' : 'text-brand-secondary'}`}>
              {isUrgent ? <AlertCircle size={16} /> : <Clock size={16} />}
            </div>
            <div>
              <p className="text-sm text-text-primary">{reminder.reminder}</p>
              <div className="flex items-center text-xs mt-1 text-text-muted space-x-2">
                <span className={isUrgent ? 'text-brand-warning/80 font-medium' : ''}>
                  {daysUntil === 0 ? "Today" : `In ${daysUntil} day${daysUntil > 1 ? 's' : ''}`}
                </span>
                <span>•</span>
                <span className="truncate max-w-[150px]">{reminder.sourceDoc}</span>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};
