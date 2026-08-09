"use client";

import React, { useState, useRef, useEffect } from "react";
import { Send, Brain, Sparkles, User, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "./AuthProvider";

interface Message {
  role: "user" | "assistant";
  content: string;
  sources?: string[];
}

export const AIChat = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Hello! I am your LifeVault AI. How can I help you navigate your second brain today?" }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || !user) return;

    const userMessage: Message = { role: "user", content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("http://127.0.0.1:8000/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          user_id: user.uid
        }),
      });

      if (!response.ok) throw new Error("Chat request failed");

      const data = await response.json();
      
      setMessages(prev => [...prev, {
        role: "assistant",
        content: data.reply,
        sources: data.sources
      }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "Sorry, I am having trouble connecting to my brain right now."
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full glass rounded-3xl overflow-hidden border-brand-secondary/30 shadow-lg">
      <div className="p-4 bg-brand-secondary/10 border-b border-brand-secondary/20 flex items-center space-x-2">
        <Brain className="text-brand-secondary" />
        <h3 className="font-semibold text-brand-secondary">LifeVault Assistant</h3>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence initial={false}>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div className={`flex items-start max-w-[80%] ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  msg.role === "user" ? "bg-brand-primary-dark ml-3" : "bg-brand-secondary/20 mr-3"
                }`}>
                  {msg.role === "user" ? <User size={16} /> : <Sparkles size={16} className="text-brand-secondary" />}
                </div>
                
                <div className="flex flex-col">
                  <div className={`p-3 rounded-lg text-sm ${
                    msg.role === "user" ? "bg-brand-primary-dark/40" : "bg-white/5 border border-white/10"
                  }`}>
                    {msg.content}
                  </div>
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {msg.sources.map((src, idx) => (
                        <span key={idx} className="text-[10px] px-2 py-0.5 rounded-full bg-brand-secondary/20 text-brand-secondary">
                          Source: {src}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
          {isLoading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
              <div className="w-8 h-8 rounded-full bg-brand-secondary/20 mr-3 flex items-center justify-center">
                <Loader2 size={16} className="text-brand-secondary animate-spin" />
              </div>
              <div className="p-3 rounded-lg bg-white/5 border border-white/10 flex space-x-1 items-center">
                <div className="w-1.5 h-1.5 bg-brand-secondary rounded-full animate-bounce"></div>
                <div className="w-1.5 h-1.5 bg-brand-secondary rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                <div className="w-1.5 h-1.5 bg-brand-secondary rounded-full animate-bounce" style={{ animationDelay: "0.4s" }}></div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-black/20 border-t border-white/5">
        <form onSubmit={handleSend} className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about your documents, expiry dates, etc..."
            className="w-full bg-white/5 border border-white/10 rounded-full pl-4 pr-12 py-3 text-sm focus:outline-none focus:border-brand-secondary/50 text-text-primary placeholder:text-text-muted"
            disabled={isLoading}
          />
          <button 
            type="submit"
            disabled={!input.trim() || isLoading}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-brand-secondary hover:bg-brand-secondary/80 text-black rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  );
};
