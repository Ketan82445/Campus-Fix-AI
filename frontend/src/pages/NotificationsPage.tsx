import React, { useState, useEffect } from 'react';
import { notificationApi } from '../services/notificationApi';
import { Notification } from '../types';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';
import { Bell, CheckCircle2, Circle } from 'lucide-react';

export const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      const res = await notificationApi.getMyNotifications();
      if (res.success && res.data) setNotifications(res.data);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkRead = async (id: string) => {
    try {
      await notificationApi.markAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch {}
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationApi.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch {}
  };

  if (isLoading) return <LoadingSpinner message="Loading notifications..." />;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center font-bold">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Notifications Center</h1>
            <p className="text-xs text-slate-500">System notifications for complaint updates & assignments</p>
          </div>
        </div>
        <button
          onClick={handleMarkAllRead}
          className="px-3.5 py-2 text-xs font-semibold text-brand-700 bg-brand-50 hover:bg-brand-100 rounded-xl border border-brand-200 transition flex items-center gap-1.5"
        >
          <CheckCircle2 className="w-4 h-4" /> Mark All Read
        </button>
      </div>

      {notifications.length === 0 ? (
        <EmptyState title="No notifications" description="You have no notifications in your inbox." />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs divide-y divide-slate-100 overflow-hidden">
          {notifications.map(n => (
            <div
              key={n.id}
              onClick={() => !n.read && handleMarkRead(n.id)}
              className={`p-4 flex items-start justify-between gap-4 transition cursor-pointer ${
                n.read ? 'bg-white' : 'bg-brand-50/40'
              }`}
            >
              <div className="flex gap-3">
                <div className="mt-0.5">
                  {n.read ? (
                    <Circle className="w-3.5 h-3.5 text-slate-300 fill-slate-100" />
                  ) : (
                    <Circle className="w-3.5 h-3.5 text-brand-600 fill-brand-600 animate-pulse" />
                  )}
                </div>
                <div>
                  <h4 className="font-bold text-xs text-slate-900">{n.title}</h4>
                  <p className="text-xs text-slate-600 mt-0.5">{n.message}</p>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    {new Date(n.createdAt).toLocaleDateString()} {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
