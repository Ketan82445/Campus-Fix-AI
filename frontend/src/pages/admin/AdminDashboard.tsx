import React, { useState, useEffect } from 'react';
import { analyticsApi } from '../../services/analyticsApi';
import { complaintApi } from '../../services/complaintApi';
import { AnalyticsOverview, Complaint } from '../../types';
import { ComplaintCard } from '../../components/complaint/ComplaintCard';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Link } from 'react-router-dom';
import { Sparkles, AlertTriangle, ShieldCheck, BarChart3, Users, Clock, CheckCircle2, AlertCircle } from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<AnalyticsOverview | null>(null);
  const [deptWorkload, setDeptWorkload] = useState<any[]>([]);
  const [recentComplaints, setRecentComplaints] = useState<Complaint[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      analyticsApi.getOverview(),
      analyticsApi.getDepartments(),
      complaintApi.getMany({ limit: 6 })
    ])
      .then(([overviewRes, deptRes, complaintRes]) => {
        if (overviewRes.success) setStats(overviewRes.data);
        if (deptRes.success) setDeptWorkload(deptRes.data);
        if (complaintRes.success) setRecentComplaints(complaintRes.data.items);
      })
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) return <LoadingSpinner message="Aggregating database statistics for Admin..." />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Admin System Command Center</h1>
          <p className="text-xs text-slate-500 mt-0.5">Real-time database analytics & AI routing management</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/admin/ai-review"
            className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs rounded-xl shadow-md transition flex items-center gap-1.5"
          >
            <Sparkles className="w-4 h-4" /> AI Review Queue ({stats?.pendingAiReview || 0})
          </Link>
          <Link
            to="/admin/analytics"
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-md transition flex items-center gap-1.5"
          >
            <BarChart3 className="w-4 h-4" /> Analytics & Trends
          </Link>
        </div>
      </div>

      {/* Low-Confidence AI Alert Banner if pending */}
      {(stats?.pendingAiReview || 0) > 0 && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between gap-3 text-xs text-amber-900">
          <div className="flex items-center gap-2 font-semibold">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <span>{stats?.pendingAiReview} complaints require manual review due to low AI confidence score (&lt;75%).</span>
          </div>
          <Link to="/admin/ai-review" className="font-bold underline text-amber-900 hover:text-amber-950 shrink-0">
            Review Now &rarr;
          </Link>
        </div>
      )}

      {/* Metrics Overview Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs text-slate-500">Total System Complaints</span>
          <p className="text-2xl font-black text-slate-900 mt-1">{stats?.total || 0}</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs text-slate-500">Active Open Complaints</span>
          <p className="text-2xl font-black text-amber-600 mt-1">{stats?.openCount || 0}</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs text-slate-500">Critical Priority Issues</span>
          <p className="text-2xl font-black text-rose-600 mt-1">{stats?.criticalCount || 0}</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs text-slate-500">Resolved & Closed</span>
          <p className="text-2xl font-black text-emerald-600 mt-1">{(stats?.resolvedCount || 0) + (stats?.closedCount || 0)}</p>
        </div>
      </div>

      {/* Department Workload Summary */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Users className="w-4 h-4 text-brand-600" /> Department Workload Distribution
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {deptWorkload.map(d => (
            <div key={d.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs flex justify-between items-center">
              <div>
                <p className="font-bold text-slate-800">{d.name}</p>
                <p className="text-[10px] text-slate-500">{d.technicianCount} Active Technicians</p>
              </div>
              <div className="text-right">
                <span className="font-black text-sm text-brand-700">{d.activeComplaints}</span>
                <p className="text-[10px] text-slate-400">Active Tasks</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Complaints */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-base font-bold text-slate-900">Recent Campus Complaints</h2>
          <Link to="/admin/complaints" className="text-xs text-brand-600 font-semibold hover:underline">
            View All Complaints &rarr;
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {recentComplaints.map(c => (
            <ComplaintCard key={c.id} complaint={c} detailPath={`/student/complaints/${c.id}`} />
          ))}
        </div>
      </div>
    </div>
  );
};
