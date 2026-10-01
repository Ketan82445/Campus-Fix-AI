import React, { useState, useEffect } from 'react';
import { complaintApi } from '../../services/complaintApi';
import { api } from '../../services/api';
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

    const userText = input;
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: userText,
      timestamp: new Date()
    };

    // Format chat history for OpenAI API
    const chatHistory = messages.map(m => ({
      role: m.sender === 'ai' ? 'assistant' : 'user',
      content: m.text
    })).concat([{ role: 'user', content: userText }]);

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const response = await api.post('/chat', { messages: chatHistory });
      const aiReply = response.data.content;
      
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'ai',
          text: aiReply,
          timestamp: new Date()
        }
      ]);
    } catch (error: any) {
      let errorMessage = "I'm sorry, I encountered an unknown error connecting to the AI server.";
      
      // The api.ts interceptor unwraps the error into { code, message, details? }
      const errCode = error?.code;
      const errMessage = error?.message || "";

      if (errCode === 'UNAUTHORIZED') {
        errorMessage = "I'm sorry, but you do not have permission to access the AI assistant. Please try logging in again.";
      } else if (errCode === 'NOT_FOUND') {
        errorMessage = "I'm sorry, the requested AI model is currently unavailable or deprecated.";
      } else if (errCode === 'TOO_MANY_REQUESTS' || errMessage.includes('rate limit')) {
        errorMessage = "I'm sorry, you have reached the rate limit. Please wait a moment and try again.";
      } else if (errMessage.includes('503') || errMessage.toLowerCase().includes('high demand') || errMessage.includes('Service Unavailable')) {
        errorMessage = "The AI service is currently experiencing high demand and is temporarily unavailable. Please try again in a few minutes.";
      } else if (errMessage.includes('API Key is missing') || errMessage.includes('key not valid')) {
        errorMessage = "The AI is currently disabled because the GEMINI_API_KEY is missing or invalid in the server configuration.";
      } else if (errCode === 'INTERNAL_ERROR' || errMessage.toLowerCase().includes('internal server error')) {
        errorMessage = "I'm sorry, the AI service encountered an internal error. Please try again later.";
      } else if (errCode === 'NETWORK_ERROR') {
        errorMessage = "I could not connect to the server. Please check your network connection (this could also be a timeout).";
      } else if (errMessage) {
        errorMessage = `I'm sorry, the server responded with an error: ${errMessage}`;
      }

      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'ai',
          text: errorMessage,
          timestamp: new Date()
        }
      ]);
    } finally {
      setLoading(false);
    }
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
