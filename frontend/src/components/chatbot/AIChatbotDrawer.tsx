import React, { useState, useEffect } from 'react';
import { complaintApi } from '../../services/complaintApi';
import { Complaint } from '../../types';
import { Bot, X, Send, User, Sparkles, Loader2, RefreshCw } from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: Date;
}

export const AIChatbotDrawer: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: 'ai',
      text: "Hello! I am CampusFix AI Assistant. How can I help you today? You can ask me how to log a complaint, check your complaint status, or identify the right department.",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [userComplaints, setUserComplaints] = useState<Complaint[]>([]);

  useEffect(() => {
    if (isOpen) {
      // Fetch authenticated user's real complaints from backend API
      complaintApi.getMany({ limit: 10 })
        .then(res => {
          if (res.success && res.data) setUserComplaints(res.data.items);
        })
        .catch(() => {});
    }
  }, [isOpen]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    const query = input.toLowerCase();
    setInput('');
    setLoading(true);

    setTimeout(() => {
      let reply = "";

      if (query.includes('status') || query.includes('my complaint') || query.includes('track')) {
        if (userComplaints.length === 0) {
          reply = "You currently have no active complaints submitted in the system. You can create a new complaint using the '+ Create Complaint' button!";
        } else {
          const listStr = userComplaints
            .map(c => `• [${c.complaintNumber}] "${c.title}" -> Status: ${c.status.replace('_', ' ')} (${c.priority} Priority)`)
            .join('\n');
          reply = `Here is the real-time status of your logged complaints from our backend database:\n\n${listStr}`;
        }
      } else if (query.includes('wifi') || query.includes('internet') || query.includes('network')) {
        reply = "For Wi-Fi or internet connection issues in labs or hostels, submit a complaint under the 'IT & Network Services' category. Our automated AI model will route it to IT technicians.";
      } else if (query.includes('water') || query.includes('leak') || query.includes('tap') || query.includes('washroom')) {
        reply = "Water leaks, washroom issues, or drainage problems belong to the 'Plumbing & Sanitation' department. High priority issues like major leaks are immediately auto-routed!";
      } else if (query.includes('light') || query.includes('fan') || query.includes('spark') || query.includes('power')) {
        reply = "Electrical problems like broken switches, flickering lights, or fan issues should be filed under 'Electrical Maintenance'. Hazardous issues (e.g. sparks) get flagged as CRITICAL.";
      } else {
        reply = "CampusFix AI processes all submitted complaints through our trained Machine Learning pipeline to predict Category, Priority, and Department automatically. How else can I assist you with your campus issue?";
      }

      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'ai',
          text: reply,
          timestamp: new Date()
        }
      ]);
      setLoading(false);
    }, 600);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-96 bg-white shadow-2xl z-50 border-l border-slate-200 flex flex-col transition-all">
      {/* Drawer Header */}
      <div className="p-4 bg-gradient-to-r from-brand-600 to-indigo-600 text-white flex justify-between items-center shadow-md">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center text-white backdrop-blur-xs">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm tracking-tight">CampusFix Assistant</h3>
            <p className="text-[10px] text-brand-100 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-300" /> Context-Aware AI Support
            </p>
          </div>
        </div>
        <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-lg transition text-white">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/50">
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`flex gap-2.5 ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
          >
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                msg.sender === 'user'
                  ? 'bg-brand-600 text-white'
                  : 'bg-indigo-100 text-indigo-700 border border-indigo-200'
              }`}
            >
              {msg.sender === 'user' ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
            </div>
            <div
              className={`max-w-[80%] p-3 rounded-2xl text-xs whitespace-pre-line leading-relaxed shadow-2xs ${
                msg.sender === 'user'
                  ? 'bg-brand-600 text-white rounded-tr-none'
                  : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none'
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-xs text-slate-400 p-2 italic">
            <Loader2 className="w-4 h-4 animate-spin text-brand-600" /> AI is querying backend data...
          </div>
        )}
      </div>

      {/* Input Footer */}
      <form onSubmit={handleSend} className="p-3 bg-white border-t border-slate-200 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Ask AI about complaints or status..."
          className="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
        <button
          type="submit"
          disabled={!input.trim()}
          className="p-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50 transition"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
