import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { complaintApi } from '../../services/complaintApi';
import { Complaint, Status } from '../../types';
import { ComplaintCard } from '../../components/complaint/ComplaintCard';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import { Wrench, CheckCircle2, Clock, Play, AlertTriangle, Star } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { feedbackApi } from '../../services/feedbackApi';
import { TechnicianPerformance } from '../../types';

export const TechnicianDashboard: React.FC = () => {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [performance, setPerformance] = useState<TechnicianPerformance | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const fetchComplaints = async () => {
    try {
      const res = await complaintApi.getMany({ limit: 100 });
      if (res.success && res.data) {
        setComplaints(res.data.items);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPerformance = async () => {
    if (!user) return;
    try {
      const res = await feedbackApi.getTechnicianPerformance(user.id);
      if (res.success && res.data) {
        setPerformance(res.data);
      }
    } catch {}
  };

  useEffect(() => {
    if (user) {
      fetchComplaints();
      fetchPerformance();
    }
  }, [user]);

  const handleUpdateStatus = async (id: string, newStatus: Status) => {
    try {
      const res = await complaintApi.updateStatus(id, newStatus, `Technician changed status to ${newStatus}`);
      if (res.success && res.data) {
        setComplaints(prev => prev.map(c => c.id === id ? res.data! : c));
      }
    } catch {}
  };

  const assignedCount = complaints.filter(c => c.status === 'ASSIGNED').length;
  const inProgressCount = complaints.filter(c => c.status === 'IN_PROGRESS').length;
  const resolvedCount = complaints.filter(c => ['RESOLVED', 'CLOSED'].includes(c.status)).length;
  const breachedCount = complaints.filter(c => c.slaBreached && !['RESOLVED', 'CLOSED'].includes(c.status)).length;

  const filtered = complaints.filter(c => {
    if (statusFilter === 'ALL') return true;
    if (statusFilter === 'BREACHED') return c.slaBreached && !['RESOLVED', 'CLOSED'].includes(c.status);
    return c.status === statusFilter;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Technician Workstation</h1>
          <p className="text-xs text-slate-500 mt-0.5">Manage & resolve assigned department campus complaints</p>
        </div>
        <div className="flex gap-2">
          <Link to="/technician/inventory" className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg font-semibold text-sm transition">
            Inventory & Parts
          </Link>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex justify-between items-center text-slate-500 text-xs mb-2">
            <span>New Assignments</span>
            <Clock className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-2xl font-black text-indigo-600">{assignedCount}</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex justify-between items-center text-slate-500 text-xs mb-2">
            <span>In-Progress Tasks</span>
            <Wrench className="w-4 h-4 text-sky-500" />
          </div>
          <p className="text-2xl font-black text-sky-600">{inProgressCount}</p>
        </div>

        <div className={`p-4 rounded-xl border shadow-2xs ${breachedCount > 0 ? 'bg-rose-50 border-rose-200' : 'bg-white border-slate-200'}`}>
          <div className="flex justify-between items-center text-slate-500 text-xs mb-2">
            <span>SLA Overdue</span>
            <AlertTriangle className={`w-4 h-4 ${breachedCount > 0 ? 'text-rose-600' : 'text-slate-400'}`} />
          </div>
          <p className={`text-2xl font-black ${breachedCount > 0 ? 'text-rose-600' : 'text-slate-700'}`}>{breachedCount}</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex justify-between items-center text-slate-500 text-xs mb-2">
            <span>Completed Resolutions</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-emerald-600">{resolvedCount}</p>
        </div>

        <div className="bg-gradient-to-r from-amber-50 to-amber-100/50 p-4 rounded-xl border border-amber-200 shadow-2xs">
          <div className="flex justify-between items-center text-amber-700 text-xs mb-2 font-semibold">
            <span>Student Rating</span>
            <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-amber-600">
            {performance?.averageRating ? performance.averageRating.toFixed(1) : 'N/A'}
          </p>
          <p className="text-[10px] text-amber-700/70 mt-0.5">{performance?.totalReviews || 0} Reviews</p>
        </div>
      </div>

      {/* Filter Tabs & Task List */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
          <div className="flex flex-wrap gap-2">
            {['ALL', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'REOPENED', 'BREACHED'].map(st => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  statusFilter === st
                    ? st === 'BREACHED' ? 'bg-rose-600 text-white shadow-xs' : 'bg-brand-600 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {st === 'BREACHED' ? '⚠️ Overdue SLA' : st.replace('_', ' ')}
              </button>
            ))}
          </div>
          <span className="text-xs text-slate-500 font-mono">{filtered.length} Tasks</span>
        </div>

        {isLoading ? (
          <LoadingSpinner message="Fetching technician tasks..." />
        ) : filtered.length === 0 ? (
          <EmptyState title="No tasks found" description="No assigned complaints match the selected filter." />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(c => (
              <div key={c.id} className="relative group">
                <ComplaintCard complaint={c} detailPath={`/technician/complaints/${c.id}`} />
                {/* Quick Action Button Bar */}
                <div className="mt-2 flex gap-2">
                  {c.status === 'ASSIGNED' && (
                    <button
                      onClick={() => handleUpdateStatus(c.id, 'IN_PROGRESS')}
                      className="w-full py-1.5 bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs rounded-lg transition flex items-center justify-center gap-1"
                    >
                      <Play className="w-3.5 h-3.5" /> Start Work
                    </button>
                  )}
                  {c.status === 'IN_PROGRESS' && (
                    <button
                      onClick={() => handleUpdateStatus(c.id, 'RESOLVED')}
                      className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-lg transition flex items-center justify-center gap-1"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Mark Resolved
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
