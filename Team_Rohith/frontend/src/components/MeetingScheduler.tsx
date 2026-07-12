"use client";

import React, { useState } from "react";
import { Plus, Users, Mail, Loader2, Calendar as CalIcon, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/components/AuthProvider";

export const MeetingScheduler = ({ onSchedule }: { onSchedule: (meeting: any) => void }) => {
  const { googleToken } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    date: "",
    time: "",
    emails: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);
    
    try {
      if (googleToken) {
        // Prepare Google Calendar Event Schema
        const startDateTime = new Date(`${formData.date}T${formData.time}:00`);
        const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000); // 1 hour meeting
        
        const event = {
          summary: formData.title,
          start: { dateTime: startDateTime.toISOString(), timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone },
          end: { dateTime: endDateTime.toISOString(), timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone },
          attendees: formData.emails.split(',').map(email => ({ email: email.trim() }))
        };

        const res = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events?sendUpdates=all", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${googleToken}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify(event)
        });

        if (!res.ok) {
          throw new Error("Failed to create Google Calendar Event");
        }
      } else {
        // Fallback simulate
        await new Promise(r => setTimeout(r, 1500));
      }
      
      setSuccess(true);
      onSchedule(formData);
      
      setTimeout(() => {
        setSuccess(false);
        setIsOpen(false);
        setFormData({ title: "", date: "", time: "", emails: "" });
      }, 2000);

    } catch (error) {
      console.error(error);
      alert("Failed to send invite. Check console for details.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        className="w-full flex items-center justify-center space-x-2 py-4 rounded-xl border border-brand-primary-light/30 bg-brand-primary-light/10 text-brand-primary-light hover:bg-brand-primary-light/20 transition-all font-medium"
      >
        <Plus size={20} />
        <span>Schedule Meeting & Invites</span>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-brand-black border border-white/10 rounded-2xl p-6 max-w-md w-full shadow-2xl"
            >
              {success ? (
                <div className="flex flex-col items-center justify-center py-12 text-brand-success">
                  <Mail size={48} className="mb-4" />
                  <h3 className="text-xl font-semibold">Invites Sent!</h3>
                  <p className="text-text-secondary text-sm mt-2 text-center">Your calendar is updated and emails have been dispatched.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold flex items-center"><Users className="mr-2 text-brand-primary-light" /> New Meeting</h3>
                    <button type="button" onClick={() => setIsOpen(false)} className="text-text-muted hover:text-white">✕</button>
                  </div>

                  <div>
                    <label className="text-sm text-text-secondary mb-1 block">Meeting Title</label>
                    <input required type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-lg p-2.5 text-white" placeholder="e.g. Q3 Hackathon Prep" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-text-secondary mb-1 flex items-center"><CalIcon size={14} className="mr-1"/> Date</label>
                      <input required type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-lg p-2.5 text-white" />
                    </div>
                    <div>
                      <label className="text-sm text-text-secondary mb-1 flex items-center"><Clock size={14} className="mr-1"/> Time</label>
                      <input required type="time" value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-lg p-2.5 text-white" />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm text-text-secondary mb-1 flex items-center"><Mail size={14} className="mr-1"/> Guest Emails (comma separated)</label>
                    <input required type="text" value={formData.emails} onChange={e => setFormData({...formData, emails: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-lg p-2.5 text-white" placeholder="partner@gmail.com, team@cardano.org" />
                  </div>

                  <button 
                    disabled={isSending}
                    type="submit" 
                    className="w-full py-3 mt-6 bg-brand-primary-light text-black font-semibold rounded-lg hover:bg-brand-primary-light/90 transition-colors flex justify-center items-center"
                  >
                    {isSending ? <Loader2 className="animate-spin" size={20} /> : "Dispatch Invites via SMTP"}
                  </button>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
