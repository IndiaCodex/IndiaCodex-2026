"use client";

import React, { useEffect, useState } from "react";
import { Calendar as CalIcon, ChevronLeft, ChevronRight, FileText, ShieldCheck, ExternalLink, Loader2, Sparkles, AlertTriangle, Shield } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/components/AuthProvider";

interface CalendarEvent {
  id: string;
  docId?: string;
  title: string;
  date: string; // YYYY-MM-DD
  type: "meeting" | "document" | "warranty" | "expiration" | "timeline";
  createdAt: string;
}

export const CalendarView = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date(2026, 6, 12)); // July 2026 for demo consistency
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [selectedDoc, setSelectedDoc] = useState<any | null>(null);
  const [docLoading, setDocLoading] = useState(false);

  useEffect(() => {
    if (!user || !db) return;

    const fetchEvents = async () => {
      setLoading(true);
      try {
        const q = query(collection(db, "calendarEvents"), where("userId", "==", user.uid));
        const snap = await getDocs(q);
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as CalendarEvent));
        setEvents(list);
      } catch (err) {
        console.error("Error fetching calendar events:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [user]);

  // Load document details when an event is selected
  useEffect(() => {
    if (!selectedEvent?.docId || !db) {
      setSelectedDoc(null);
      return;
    }

    const fetchDoc = async () => {
      setDocLoading(true);
      try {
        const docRef = doc(db, "documents", selectedEvent.docId!);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          setSelectedDoc(snap.data());
        }
      } catch (err) {
        console.error("Error fetching document details:", err);
      } finally {
        setDocLoading(false);
      }
    };

    fetchDoc();
  }, [selectedEvent]);

  // Month navigation helpers
  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };
  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startingDay = new Date(year, month, 1).getDay();

  // Helper to color-code based on type
  const getTypeStyles = (type: string) => {
    switch (type) {
      case "meeting":
        return { border: "border-blue-500/30 bg-blue-500/10 text-blue-400", badge: "bg-blue-500/20 text-blue-400" };
      case "document":
        return { border: "border-green-500/30 bg-green-500/10 text-green-400", badge: "bg-green-500/20 text-green-400" };
      case "warranty":
        return { border: "border-orange-500/30 bg-orange-500/10 text-orange-400", badge: "bg-orange-500/20 text-orange-400" };
      case "expiration":
        return { border: "border-red-500/30 bg-red-500/10 text-red-400", badge: "bg-red-500/20 text-red-400" };
      case "timeline":
      default:
        return { border: "border-purple-500/30 bg-purple-500/10 text-purple-400", badge: "bg-purple-500/20 text-purple-400" };
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
      {/* Calendar Grid (3 Columns) */}
      <div className="xl:col-span-3 glass rounded-3xl p-6 border border-white/5 shadow-xl relative overflow-hidden">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold flex items-center text-white">
            <CalIcon className="mr-3 text-brand-primary-light" size={22} />
            Master Calendar
          </h2>
          <div className="flex items-center space-x-4">
            <button 
              onClick={async () => {
                setLoading(true);
                // Create dummy events to show on sync
                const newEvents = [
                  { id: "demo-1", title: "Project Sync Meeting", date: `${year}-${String(month+1).padStart(2, '0')}-15`, type: "meeting" as any, createdAt: new Date().toISOString() },
                  { id: "demo-2", title: "Google OAuth Deadline", date: `${year}-${String(month+1).padStart(2, '0')}-20`, type: "expiration" as any, createdAt: new Date().toISOString() },
                  { id: "demo-3", title: "AI Model Review", date: `${year}-${String(month+1).padStart(2, '0')}-25`, type: "timeline" as any, createdAt: new Date().toISOString() },
                  { id: "demo-4", title: "Hackathon Submission", date: `${year}-${String(month+1).padStart(2, '0')}-12`, type: "meeting" as any, createdAt: new Date().toISOString() }
                ];
                setTimeout(() => {
                  setEvents(prev => [...prev, ...newEvents]);
                  setLoading(false);
                }, 1000);
              }}
              className="px-3 py-1.5 bg-brand-primary-dark/20 border border-brand-primary-light text-brand-primary-light rounded-lg text-xs font-bold uppercase hover:bg-brand-primary-light/20 transition-all flex items-center"
            >
              <Sparkles size={14} className="mr-1" />
              Sync Calendar
            </button>
            <button onClick={prevMonth} className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors"><ChevronLeft size={18} /></button>
            <span className="font-semibold text-lg text-white min-w-[120px] text-center">{monthNames[month]} {year}</span>
            <button onClick={nextMonth} className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors"><ChevronRight size={18} /></button>
          </div>
        </div>

        {loading ? (
          <div className="h-[450px] flex items-center justify-center">
            <Loader2 className="animate-spin text-brand-primary-light w-10 h-10" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-7 gap-2 mb-2 text-center text-xs font-bold text-text-muted uppercase tracking-wider">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => <div key={d} className="py-2">{d}</div>)}
            </div>

            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: startingDay }).map((_, i) => (
                <div key={`empty-${i}`} className="h-28 rounded-xl bg-black/10 border border-transparent"></div>
              ))}
              
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                
                // Robust matching: parse database date as Date object and compare components
                const dayEvents = events.filter(e => {
                  if (!e.date) return false;
                  try {
                    // Normalize date string (replace slashes, handle padding issues)
                    const parsedDate = new Date(e.date + "T00:00:00");
                    return parsedDate.getFullYear() === year &&
                           parsedDate.getMonth() === month &&
                           parsedDate.getDate() === day;
                  } catch (err) {
                    return false;
                  }
                });
                
                const isToday = new Date().getDate() === day && 
                                new Date().getMonth() === month && 
                                new Date().getFullYear() === year;
                
                return (
                  <motion.div 
                    key={day}
                    whileHover={{ scale: 1.02, y: -2 }}
                    className={`h-28 rounded-xl p-2 border flex flex-col justify-between hover:bg-white/10 transition-colors ${
                      isToday ? "border-brand-primary-light/50 bg-brand-primary-light/5" : "border-white/5 bg-white/5"
                    }`}
                  >
                    <span className={`text-xs font-semibold self-start ${isToday ? "text-brand-primary-light font-bold" : "text-text-muted"}`}>{day}</span>
                    <div className="mt-1 flex-1 overflow-y-auto space-y-1 no-scrollbar max-h-[70px]">
                      {dayEvents.map((e) => {
                        const styles = getTypeStyles(e.type);
                        return (
                          <div 
                            key={e.id} 
                            onClick={() => setSelectedEvent(e)}
                            className={`text-[10px] leading-tight px-1.5 py-1 rounded-md border cursor-pointer font-medium truncate hover:brightness-125 transition-all ${styles.border}`}
                          >
                            {e.title}
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Side Pane (1 Column): Upcoming / Suggested */}
      <div className="xl:col-span-1 space-y-6">
        {/* Today's Schedule */}
        <div className="glass rounded-3xl p-6 border border-white/5 shadow-md">
          <h3 className="text-md font-bold text-white mb-4 flex items-center">
            <Sparkles size={16} className="text-brand-secondary mr-2" />
            Upcoming Activities
          </h3>
          <div className="space-y-3 max-h-[350px] overflow-y-auto no-scrollbar">
            {[...events]
              .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
              .slice(0, 8)
              .map(e => {
                const styles = getTypeStyles(e.type);
                return (
                  <div key={e.id} onClick={() => setSelectedEvent(e)} className="p-3 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 cursor-pointer transition-all flex items-start justify-between">
                    <div className="min-w-0 flex-1 mr-2">
                      <h4 className="text-sm font-semibold text-white truncate">{e.title}</h4>
                      <p className="text-xs text-text-secondary mt-1">{e.date}</p>
                    </div>
                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase shrink-0 ${styles.badge}`}>{e.type}</span>
                  </div>
                );
              })}
            {events.length === 0 && (
              <p className="text-xs text-text-secondary text-center py-4">No events or activities registered yet.</p>
            )}
          </div>
        </div>

        {/* Calendar Color Legend */}
        <div className="glass rounded-3xl p-6 border border-white/5 shadow-md">
          <h3 className="text-md font-semibold text-white mb-3">Color Index</h3>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="flex items-center space-x-2"><div className="w-2.5 h-2.5 rounded bg-blue-500"></div><span className="text-text-secondary">Meetings</span></div>
            <div className="flex items-center space-x-2"><div className="w-2.5 h-2.5 rounded bg-green-500"></div><span className="text-text-secondary">Docs</span></div>
            <div className="flex items-center space-x-2"><div className="w-2.5 h-2.5 rounded bg-orange-500"></div><span className="text-text-secondary">Warranties</span></div>
            <div className="flex items-center space-x-2"><div className="w-2.5 h-2.5 rounded bg-red-500"></div><span className="text-text-secondary">Expirations</span></div>
            <div className="flex items-center space-x-2"><div className="w-2.5 h-2.5 rounded bg-purple-500"></div><span className="text-text-secondary">AI Timelines</span></div>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedEvent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-brand-black border border-white/10 rounded-3xl p-6 max-w-lg w-full shadow-2xl overflow-hidden relative"
            >
              <button 
                onClick={() => { setSelectedEvent(null); setSelectedDoc(null); }}
                className="absolute top-4 right-4 text-text-muted hover:text-white"
              >
                ✕
              </button>

              <div className="flex items-center space-x-3 mb-6">
                <span className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase ${getTypeStyles(selectedEvent.type).badge}`}>
                  {selectedEvent.type}
                </span>
                <span className="text-[10px] bg-white/10 text-text-secondary px-2 py-1 rounded font-bold uppercase tracking-wider">
                  {selectedEvent.categoryType || (selectedEvent.type === "meeting" || selectedEvent.type === "timeline" ? "Event" : "Task")}
                </span>
                <span className="text-xs text-text-muted">{selectedEvent.date}</span>
              </div>

              <h3 className="text-xl font-bold text-white mb-4">{selectedEvent.title}</h3>

              {docLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="animate-spin text-brand-primary-light" size={24} />
                </div>
              ) : selectedDoc ? (
                <div className="space-y-4">
                  <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                    <h4 className="text-xs font-bold text-brand-primary-light uppercase tracking-wider mb-2 flex items-center">
                      <FileText size={12} className="mr-1.5" /> AI Summary
                    </h4>
                    <p className="text-sm text-text-secondary leading-relaxed">{selectedDoc.summary}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                      <h4 className="text-xs font-bold text-brand-secondary uppercase tracking-wider mb-1">Category</h4>
                      <p className="text-sm text-white font-medium">{selectedDoc.category}</p>
                    </div>
                    <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                      <h4 className="text-xs font-bold text-brand-success uppercase tracking-wider mb-1 flex items-center">
                        <ShieldCheck size={12} className="mr-1" /> Authenticity
                      </h4>
                      <div className="flex items-center space-x-1">
                        <span className={`text-xs font-bold ${selectedDoc.verified ? "text-brand-success" : "text-text-muted"}`}>
                          {selectedDoc.verified ? "Verified on Cardano" : "Not Verified"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {selectedDoc.verified && selectedDoc.txHash && (
                    <div className="bg-brand-success/5 rounded-2xl p-4 border border-brand-success/20">
                      <h4 className="text-xs font-bold text-brand-success uppercase tracking-wider mb-1">Cardano Proof</h4>
                      <a 
                        href={`https://preview.cardanoscan.io/transaction/${selectedDoc.txHash}`} 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-xs text-brand-secondary font-mono flex items-center hover:underline break-all mt-1"
                      >
                        {selectedDoc.txHash.slice(0, 24)}...
                        <ExternalLink size={10} className="ml-1.5" />
                      </a>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-text-secondary py-6">No related document connected to this event.</p>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
