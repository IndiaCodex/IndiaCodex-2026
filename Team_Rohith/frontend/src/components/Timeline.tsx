"use client";

import React from "react";
import { FileText, Calendar } from "lucide-react";
import { motion } from "framer-motion";

export const Timeline = ({ documents }: { documents: any[] }) => {
  // Extract and sort timeline events from all documents
  const allEvents = documents.flatMap(doc => {
    return (doc.timeline_events || []).map((event: any) => ({
      ...event,
      sourceDoc: doc.title || "Unknown Document",
      docId: doc.id
    }));
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (allEvents.length === 0) {
    return <div className="text-text-muted text-sm text-center py-8">No timeline events detected yet. Upload documents to build your timeline.</div>;
  }

  return (
    <div className="relative border-l border-white/10 ml-3 space-y-8">
      {allEvents.map((event, i) => (
        <motion.div 
          key={i} 
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.1 }}
          className="relative pl-6"
        >
          <div className="absolute -left-1.5 top-1.5 w-3 h-3 rounded-full bg-brand-secondary shadow-[0_0_10px_#06B6D4]" />
          
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-brand-secondary flex items-center mb-1">
              <Calendar size={12} className="mr-1" />
              {new Date(event.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
            </span>
            <p className="text-sm text-text-primary">{event.event}</p>
            
            <div className="mt-2 inline-flex items-center text-xs text-text-muted bg-white/5 rounded-md px-2 py-1 w-fit">
              <FileText size={12} className="mr-1" />
              Source: {event.sourceDoc}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};
