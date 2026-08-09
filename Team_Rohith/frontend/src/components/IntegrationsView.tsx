"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { MessageSquare, Mail, Terminal, Send, Bell, User, Clock, Inbox, ShieldAlert, Cpu } from "lucide-react";
import { motion } from "framer-motion";

interface IntegrationItem {
  id: string;
  type: "slack" | "email";
  channel?: string;
  sender: string;
  subject?: string;
  title: string;
  body: string;
  date: string;
  rawTime: string;
}

export const IntegrationsView = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<IntegrationItem[]>([]);
  const [selectedSource, setSelectedSource] = useState<"slack" | "email">("slack");
  const [selectedChannel, setSelectedChannel] = useState("#lifevault-alerts");
  const [selectedEmail, setSelectedEmail] = useState<IntegrationItem | null>(null);

  useEffect(() => {
    if (!user || !db) return;

    const fetchLogs = async () => {
      try {
        // Query documents to construct alerts
        const qDocs = query(collection(db, "documents"), where("userId", "==", user.uid));
        const snapDocs = await getDocs(qDocs);
        const docs = snapDocs.docs.map(d => ({ id: d.id, ...d.data() }));

        // Query meetings to construct alerts
        const qMeets = query(collection(db, "meetings"), where("userId", "==", user.uid));
        const snapMeets = await getDocs(qMeets);
        const meets = snapMeets.docs.map(d => ({ id: d.id, ...d.data() }));

        const list: IntegrationItem[] = [];

        // Add document ingestion logs
        docs.forEach((doc: any) => {
          const dateStr = doc.createdAt ? new Date(doc.createdAt).toLocaleDateString() : new Date().toLocaleDateString();
          const timeStr = doc.createdAt ? new Date(doc.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "12:00 PM";
          
          list.push({
            id: doc.id + "-ingest",
            type: "slack",
            channel: "#lifevault-alerts",
            sender: "Llama-Node-Agent",
            title: `Document Ingestion Completed: ${doc.title}`,
            body: `Successfully ingested "${doc.title}". Extracted Category: "${doc.category}". Generated AI Summary: "${doc.summary}"`,
            date: dateStr,
            rawTime: timeStr
          });

          // Add warranty/expiring reminders if they exist
          if (doc.reminders && Array.isArray(doc.reminders)) {
            doc.reminders.forEach((r: any, idx: number) => {
              list.push({
                id: `${doc.id}-reminder-${idx}`,
                type: "slack",
                channel: "#agent-activity",
                sender: "Scheduler-Agent",
                title: `Lifecycle Alert Created: ${r.reminder}`,
                body: `Attention: Extracted warning date detected for "${doc.title}". Scheduled alert on ${r.date}.`,
                date: dateStr,
                rawTime: timeStr
              });

              // Also generate a mock Email Alert
              list.push({
                id: `${doc.id}-email-${idx}`,
                type: "email",
                sender: "alert@lifevault.ai",
                subject: `Lifecycle Warning: ${r.reminder}`,
                title: `Vault Warning Trigger - ${doc.title}`,
                body: `Hello,\n\nThis is an automated alert from your LifeVault. The AI Agent discovered a lifecycle event inside your document "${doc.title}":\n\nEvent: ${r.reminder}\nTarget Date: ${r.date}\n\nNo manual registration is required. We have added this directly to your Master Calendar.`,
                date: dateStr,
                rawTime: timeStr
              });
            });
          }
        });

        // Add meeting scheduled logs
        meets.forEach((m: any) => {
          const dateStr = m.createdAt ? new Date(m.createdAt).toLocaleDateString() : new Date().toLocaleDateString();
          const timeStr = m.createdAt ? new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "12:00 PM";

          list.push({
            id: m.id + "-slack",
            type: "slack",
            channel: "#general",
            sender: "Calendar-Agent",
            title: `Meeting Confirmed: ${m.title}`,
            body: `Scheduled meeting: "${m.title}" for ${m.date} at ${m.time}. Invites sent to: ${m.emails}.`,
            date: dateStr,
            rawTime: timeStr
          });

          list.push({
            id: m.id + "-email",
            type: "email",
            sender: "invites@lifevault.ai",
            subject: `Meeting Invitation: ${m.title}`,
            title: `Invitation - ${m.title}`,
            body: `You have been invited to a calendar event.\n\nEvent: ${m.title}\nDate: ${m.date}\nTime: ${m.time}\nOrganized by: ${user.email}\n\nThis invitation was dynamically signed via your Cardano active wallet and synchronized with Google Calendar.`,
            date: dateStr,
            rawTime: timeStr
          });
        });

        // Sort items chronologically
        setItems(list);
        
        // Select first email by default
        const emails = list.filter(i => i.type === "email");
        if (emails.length > 0) {
          setSelectedEmail(emails[0]);
        }
      } catch (err) {
        console.error(err);
      }
    };

    fetchLogs();
  }, [user]);

  const slackChannels = ["#general", "#lifevault-alerts", "#agent-activity"];
  const slackMessages = items.filter(i => i.type === "slack" && i.channel === selectedChannel);
  const emailMessages = items.filter(i => i.type === "email");

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 h-[72vh]">
      {/* LEFT NAVIGATION: Workspace Selectors */}
      <div className="lg:col-span-1 glass border border-white/5 rounded-3xl p-4 flex flex-col justify-between">
        <div className="space-y-6">
          {/* Workspaces Label */}
          <div>
            <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider px-2 mb-3">Integrations</h3>
            <div className="space-y-1">
              <button 
                onClick={() => setSelectedSource("slack")}
                className={`w-full flex items-center space-x-3 px-3 py-3 rounded-xl text-sm font-medium transition-all ${
                  selectedSource === "slack" ? "bg-[#3F0E40] text-white" : "text-text-muted hover:text-white hover:bg-white/5"
                }`}
              >
                <MessageSquare size={18} />
                <span>Slack Feed</span>
              </button>

              <button 
                onClick={() => setSelectedSource("email")}
                className={`w-full flex items-center space-x-3 px-3 py-3 rounded-xl text-sm font-medium transition-all ${
                  selectedSource === "email" ? "bg-brand-primary-dark/20 text-brand-primary-light border border-brand-primary-light/20" : "text-text-muted hover:text-white hover:bg-white/5 border border-transparent"
                }`}
              >
                <Mail size={18} />
                <span>SMTP Inbox</span>
              </button>
            </div>
          </div>

          {/* Sub-navigation depending on selected source */}
          {selectedSource === "slack" ? (
            <div>
              <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider px-2 mb-3">Slack Channels</h3>
              <div className="space-y-1">
                {slackChannels.map(ch => (
                  <button
                    key={ch}
                    onClick={() => setSelectedChannel(ch)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                      selectedChannel === ch ? "text-white font-semibold bg-white/10" : "text-text-secondary hover:text-white hover:bg-white/5"
                    }`}
                  >
                    {ch}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div>
              <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider px-2 mb-3">Accounts</h3>
              <p className="text-xs text-text-secondary px-2 font-mono truncate">{user?.email}</p>
            </div>
          )}
        </div>

        {/* Status Indicator */}
        <div className="bg-black/30 rounded-xl p-3 border border-white/5 text-[11px] text-text-muted flex items-center space-x-2">
          <span className="w-1.5 h-1.5 rounded-full bg-brand-success animate-ping"></span>
          <span>SMTP & Webhook Nodes Active</span>
        </div>
      </div>

      {/* CENTER & RIGHT VIEW: Detail Workspace */}
      <div className="lg:col-span-4 glass border border-white/5 rounded-3xl overflow-hidden flex flex-col">
        {selectedSource === "slack" ? (
          /* SLACK VIEW */
          <div className="flex-1 flex flex-col bg-[#1A1D21]">
            {/* Header */}
            <div className="p-4 border-b border-white/5 flex justify-between items-center bg-[#1F2327]">
              <div>
                <h3 className="text-md font-bold text-white flex items-center">
                  <span className="mr-1 text-text-muted font-normal">#</span> {selectedChannel.replace("#", "")}
                </h3>
                <p className="text-xs text-text-secondary mt-0.5">Automated AI Agent timeline broadcast channel.</p>
              </div>
              <div className="flex items-center space-x-2 text-xs text-text-muted">
                <Bell size={14} />
                <span>Mute</span>
              </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 p-6 overflow-y-auto space-y-6 no-scrollbar">
              {slackMessages.map(msg => (
                <div key={msg.id} className="flex items-start space-x-4">
                  <div className="w-10 h-10 rounded-lg bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400 font-bold font-mono">
                    {msg.sender.charAt(0)}
                  </div>
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-bold text-white">{msg.sender}</span>
                      <span className="text-[9px] bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded font-bold uppercase">APP</span>
                      <span className="text-[10px] text-text-muted">{msg.rawTime}</span>
                    </div>
                    <p className="text-sm font-bold text-white/90">{msg.title}</p>
                    <p className="text-sm text-text-secondary leading-relaxed bg-[#222529] p-3 rounded-xl border border-white/5 mt-2">{msg.body}</p>
                  </div>
                </div>
              ))}
              {slackMessages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-text-muted">
                  <Terminal size={36} className="mb-2 text-text-muted/30" />
                  <p className="text-sm">No activity events broadcast to this channel yet.</p>
                </div>
              )}
            </div>

            {/* Mock Chat Input Footer */}
            <div className="p-4 bg-[#1F2327] border-t border-white/5 flex items-center space-x-3">
              <input
                type="text"
                disabled
                placeholder={`Send a message to ${selectedChannel}`}
                className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none text-text-secondary"
              />
              <button disabled className="p-3 bg-white/5 text-text-muted rounded-xl">
                <Send size={16} />
              </button>
            </div>
          </div>
        ) : (
          /* EMAIL INBOX VIEW */
          <div className="flex-1 flex flex-col lg:flex-row bg-[#111] h-full">
            {/* Email List Left Panel */}
            <div className="w-full lg:w-80 border-r border-white/5 flex flex-col">
              <div className="p-4 border-b border-white/5 flex items-center space-x-2 bg-black/20">
                <Inbox size={16} className="text-brand-primary-light" />
                <h4 className="text-sm font-bold text-white">Inbox ({emailMessages.length})</h4>
              </div>
              <div className="flex-1 overflow-y-auto no-scrollbar">
                {emailMessages.map(mail => (
                  <div
                    key={mail.id}
                    onClick={() => setSelectedEmail(mail)}
                    className={`p-4 border-b border-white/5 cursor-pointer transition-all hover:bg-white/5 ${
                      selectedEmail?.id === mail.id ? "bg-white/5 border-l-2 border-brand-primary-light" : ""
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-bold text-brand-primary-light truncate max-w-[130px]">{mail.sender}</span>
                      <span className="text-[10px] text-text-muted">{mail.rawTime}</span>
                    </div>
                    <h5 className="text-xs font-bold text-white truncate mt-1">{mail.subject}</h5>
                    <p className="text-xs text-text-secondary truncate mt-0.5">{mail.body}</p>
                  </div>
                ))}
                {emailMessages.length === 0 && (
                  <div className="p-8 text-center text-text-muted text-xs">No emails received in this inbox.</div>
                )}
              </div>
            </div>

            {/* Email Reading Right Panel */}
            <div className="flex-1 flex flex-col">
              {selectedEmail ? (
                <div className="p-6 space-y-6 flex-1 overflow-y-auto no-scrollbar">
                  {/* Subject */}
                  <div className="border-b border-white/5 pb-4">
                    <h3 className="text-lg font-bold text-white">{selectedEmail.subject}</h3>
                    <div className="flex justify-between items-center text-xs text-text-secondary mt-2">
                      <div>
                        <span>From: </span>
                        <strong className="text-brand-primary-light">{selectedEmail.sender}</strong>
                      </div>
                      <span>{selectedEmail.date} at {selectedEmail.rawTime}</span>
                    </div>
                  </div>
                  {/* Body */}
                  <div className="bg-white/5 border border-white/5 rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center space-x-2 mb-4 text-xs font-bold text-brand-primary-light border-b border-white/5 pb-2">
                      <Cpu size={12} />
                      <span>SMTP SECURE MAILER PROTOCOL</span>
                    </div>
                    <p className="text-sm text-text-secondary whitespace-pre-line leading-relaxed">{selectedEmail.body}</p>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center text-text-muted text-sm">
                  Select an email from the inbox list to read.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
