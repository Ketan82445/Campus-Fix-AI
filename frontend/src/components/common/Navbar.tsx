import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { notificationApi } from '../../services/notificationApi';
import { Notification } from '../../types';
import { Bell, LogOut, Bot, Shield, Wrench, GraduationCap, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

interface NavbarProps {
  onToggleChatbot?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleChatbot }) => {
  const { user, logout } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    if (user) {
      notificationApi.getMyNotifications()
        .then(res => {
          if (res.success && res.data) setNotifications(res.data);
        })
        .catch(() => {});
    }
  }, [user]);

  const handleMarkAllRead = async () => {
    try {
      await notificationApi.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch {}
  };

  const getRoleIcon = () => {
    if (user?.role === 'ADMIN') return <Shield className="w-4 h-4 text-purple-600" />;
    if (user?.role === 'TECHNICIAN') return <Wrench className="w-4 h-4 text-sky-600" />;
    return <GraduationCap className="w-4 h-4 text-indigo-600" />;
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white font-bold shadow-md shadow-brand-500/20">
              CF
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight text-slate-900">CampusFix <span className="text-brand-600">AI</span></span>
              <span className="hidden sm:inline-block ml-2 text-xs font-medium px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full border border-slate-200">
                v1.0
              </span>
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* AI Assistant Drawer Trigger */}
            {onToggleChatbot && (
              <button
                onClick={onToggleChatbot}
                className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-brand-700 bg-brand-50 hover:bg-brand-100 rounded-lg border border-brand-200 transition"
              >
                <Bot className="w-4 h-4 text-brand-600" />
                <span className="hidden sm:inline">AI Assistant</span>
              </button>
            )}

            {/* Notifications Popover */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
                title="Notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-50">
                  <div className="p-3 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                    <span className="font-semibold text-xs text-slate-800 uppercase tracking-wider">Notifications</span>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        className="text-xs text-brand-600 hover:underline flex items-center gap-1 font-medium"
                      >
                        <CheckCircle2 className="w-3 h-3" /> Mark all read
                      </button>
                    )}
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                    {notifications.length === 0 ? (
                      <p className="p-4 text-xs text-slate-500 text-center">No notifications yet.</p>
                    ) : (
                      notifications.slice(0, 10).map(n => (
                        <div
                          key={n.id}
                          className={`p-3 text-xs transition ${
                            n.read ? 'bg-white text-slate-600' : 'bg-brand-50/50 text-slate-900 font-medium'
                          }`}
                        >
                          <p className="font-semibold text-slate-800">{n.title}</p>
                          <p className="mt-0.5 text-slate-600">{n.message}</p>
                          <span className="mt-1 block text-[10px] text-slate-400">
                            {new Date(n.createdAt).toLocaleDateString()} {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Profile */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center">
                {getRoleIcon()}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-xs font-semibold text-slate-800">{user?.name}</p>
                <p className="text-[10px] font-mono text-slate-500 uppercase">{user?.role}</p>
              </div>
              <button
                onClick={logout}
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition ml-1"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
