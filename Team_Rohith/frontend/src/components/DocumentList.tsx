"use client";

import React from "react";
import { FileText } from "lucide-react";
import { motion } from "framer-motion";

export const DocumentList = ({ documents }: { documents: any[] }) => {
  if (documents.length === 0) {
    return <div className="text-text-muted text-sm text-center py-8">Your vault is empty.</div>;
  }

  return (
    <div className="space-y-3">
      {documents.map((doc, i) => (
        <motion.div 
          key={doc.id || i}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.05 }}
          className="p-3 rounded-lg bg-white/5 border border-white/5 flex items-center hover:bg-white/10 transition-colors cursor-pointer"
        >
          <div className="w-10 h-10 rounded-md bg-brand-primary-dark/20 flex items-center justify-center text-brand-primary-light mr-3 shrink-0">
            <FileText size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-medium text-text-primary truncate">{doc.title}</h4>
            <div className="flex items-center text-xs text-text-muted mt-0.5">
              <span className="px-1.5 py-0.5 rounded-sm bg-white/5 mr-2">{doc.category || "Uncategorized"}</span>
              <span className="truncate">{doc.summary}</span>
            </div>
          </div>
          <div className="flex items-center space-x-2 ml-4">
            {doc.fileUrl && (
              <a 
                href={doc.fileUrl} 
                target="_blank" 
                rel="noreferrer" 
                className="px-3 py-1.5 text-xs font-medium rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white transition-colors"
              >
                View
              </a>
            )}
            <span className="text-xs text-text-muted">|</span>
            <button 
              onClick={() => alert(`Document SHA-256 registered. Go to Verification tab to sign cryptographic ledger blocks.`)}
              className="px-3 py-1.5 text-xs font-medium rounded-full border border-brand-primary-light/50 text-brand-primary-light hover:bg-brand-primary-light/10 transition-colors"
            >
              Ledger
            </button>
          </div>
        </motion.div>
      ))}
    </div>
  );
};
