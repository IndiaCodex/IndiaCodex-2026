/**
 * AI Chat Widget — Floating chat powered by Ollama qwen2.5:3b (Masumi Track)
 * "Summarize my last visit", "What medicines am I on?", etc.
 * Available on every page as a floating button
 */
import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Loader2, Minimize2, Bot, User } from 'lucide-react';
import toast from 'react-hot-toast';

const SUGGESTED_PROMPTS = [
  'Summarize my last visit',
  'What medications am I currently on?',
  'Explain my diagnosis in simple terms',
  'When is my next appointment?',
  'What is my insurance claim status?',
];

export default function AIChatWidget() {
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      content: "Hello! I'm MediChain AI, your personal health assistant powered by Ollama. Ask me anything about your health records, appointments, or medications.",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open && !minimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      setUnreadCount(0);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [messages, open, minimized]);

  const sendMessage = async (text) => {
    const msg = (text || input).trim();
    if (!msg) return;

    setInput('');
    const userMessage = { id: Date.now(), role: 'user', content: msg, timestamp: new Date() };
    setMessages(prev => [...prev, userMessage]);
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/v1/ai/support', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: JSON.stringify({ message: msg }),
      });

      if (!res.ok) throw new Error('AI service unavailable');
      const data = await res.json();

      const aiMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: data.response || 'I could not process that request.',
        timestamp: new Date(),
        poweredBy: data.powered_by,
        chargedAda: data.chargedAda,
      };
      setMessages(prev => [...prev, aiMessage]);

      if (!open || minimized) {
        setUnreadCount(c => c + 1);
      }
    } catch (err) {
      const errMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: `Sorry, I'm having trouble connecting right now. Make sure the backend is running. (${err.message})`,
        timestamp: new Date(),
        error: true,
      };
      setMessages(prev => [...prev, errMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button
          onClick={() => { setOpen(true); setMinimized(false); setUnreadCount(0); }}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-blue-600 hover:bg-blue-700 rounded-full shadow-2xl flex items-center justify-center transition-all hover:scale-110"
        >
          <MessageCircle className="w-6 h-6 text-white" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
              {unreadCount}
            </span>
          )}
        </button>
      )}

      {/* Chat window */}
      {open && (
        <div className={`fixed bottom-6 right-6 z-50 w-80 md:w-96 shadow-2xl rounded-2xl overflow-hidden border border-slate-700 transition-all ${
          minimized ? 'h-14' : 'h-[520px]'
        }`}>
          {/* Header */}
          <div className="bg-slate-800 border-b border-slate-700 px-4 py-3 flex items-center gap-3">
            <div className="relative">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-slate-800" />
            </div>
            <div className="flex-1">
              <p className="text-white text-sm font-semibold">MediChain AI</p>
              <p className="text-slate-400 text-xs">Ollama qwen2.5 · ₳0.1/query</p>
            </div>
            <button onClick={() => setMinimized(m => !m)} className="p-1 hover:bg-slate-700 rounded-lg">
              <Minimize2 className="w-4 h-4 text-slate-400" />
            </button>
            <button onClick={() => setOpen(false)} className="p-1 hover:bg-slate-700 rounded-lg">
              <X className="w-4 h-4 text-slate-400" />
            </button>
          </div>

          {!minimized && (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-900" style={{ height: 'calc(100% - 140px)' }}>
                {messages.map(msg => (
                  <div key={msg.id} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center ${
                      msg.role === 'assistant' ? 'bg-blue-600' : 'bg-slate-700'
                    }`}>
                      {msg.role === 'assistant'
                        ? <Bot className="w-3.5 h-3.5 text-white" />
                        : <User className="w-3.5 h-3.5 text-slate-300" />
                      }
                    </div>
                    <div className={`max-w-[80%] rounded-xl px-3 py-2 ${
                      msg.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : msg.error
                          ? 'bg-red-900/30 border border-red-700 text-red-300'
                          : 'bg-slate-800 text-slate-200'
                    }`}>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                      {msg.poweredBy && (
                        <p className="text-xs text-slate-500 mt-1">{msg.poweredBy} · ₳{msg.chargedAda}</p>
                      )}
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex gap-2">
                    <div className="w-7 h-7 rounded-full bg-blue-600 flex-shrink-0 flex items-center justify-center">
                      <Bot className="w-3.5 h-3.5 text-white" />
                    </div>
                    <div className="bg-slate-800 rounded-xl px-3 py-2.5">
                      <div className="flex gap-1">
                        {[0, 1, 2].map(i => (
                          <div key={i} className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Suggested prompts */}
              {messages.length <= 1 && (
                <div className="bg-slate-900 px-3 py-2 flex gap-2 overflow-x-auto">
                  {SUGGESTED_PROMPTS.slice(0, 3).map(p => (
                    <button
                      key={p}
                      onClick={() => sendMessage(p)}
                      className="flex-shrink-0 text-xs px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg transition-colors"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              )}

              {/* Input */}
              <div className="bg-slate-800 border-t border-slate-700 p-3 flex gap-2">
                <input
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKey}
                  placeholder="Ask about your health..."
                  disabled={loading}
                  className="flex-1 bg-slate-700 border border-slate-600 rounded-xl px-3 py-2 text-white placeholder-slate-400 text-sm focus:outline-none focus:border-blue-500 disabled:opacity-50"
                />
                <button
                  onClick={() => sendMessage()}
                  disabled={loading || !input.trim()}
                  className="p-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl transition-colors flex-shrink-0"
                >
                  {loading
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <Send className="w-4 h-4" />
                  }
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
