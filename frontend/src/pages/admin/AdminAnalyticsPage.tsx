import React, { useState, useEffect } from 'react';
import { analyticsApi } from '../../services/analyticsApi';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { BarChart3, PieChart as PieIcon, AlertTriangle, Layers } from 'lucide-react';

export const AdminAnalyticsPage: React.FC = () => {
  const [categories, setCategories] = useState<any[]>([]);
  const [priorities, setPriorities] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [recurring, setRecurring] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      analyticsApi.getCategories(),
      analyticsApi.getPriorities(),
      analyticsApi.getDepartments(),
      analyticsApi.getRecurring()
    ])
      .then(([catRes, prioRes, deptRes, recRes]) => {
        if (catRes.success) setCategories(catRes.data);
        if (prioRes.success) setPriorities(prioRes.data);
        if (deptRes.success) setDepartments(deptRes.data);
        if (recRes.success) setRecurring(recRes.data);
      })
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) return <LoadingSpinner message="Generating analytics visual charts..." />;

  const COLORS = ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">System Analytics & Infrastructure Insights</h1>
            <p className="text-xs text-slate-500 mt-0.5">Aggregated metrics from PostgreSQL database queries</p>
          </div>
        </div>
      </div>

      {/* Grid: Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Bar Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Layers className="w-4 h-4 text-brand-600" /> Complaints by Category
          </h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categories}>
                <XAxis dataKey="category" tick={{ fontSize: 10 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#4f46e5" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Priority Breakdown Pie Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <PieIcon className="w-4 h-4 text-sky-600" /> Priority Distribution
          </h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={priorities}
                  dataKey="count"
                  nameKey="priority"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ priority, percent }) => `${priority}: ${(percent * 100).toFixed(0)}%`}
                >
                  {priorities.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Department Workload Bar Chart */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-emerald-600" /> Department Active Task Load
        </h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={departments}>
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="activeComplaints" fill="#10b981" radius={[6, 6, 0, 0]} name="Active Tasks" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recurring Issues Detection */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" /> Detected Recurring Issue Patterns
          </h2>
          <span className="text-xs text-slate-500 font-mono">Location + Category Clusters</span>
        </div>

        {recurring.length === 0 ? (
          <p className="text-xs text-slate-500 italic p-4 text-center">No recurring complaint clusters detected.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                  <th className="p-3">Location</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Occurrences</th>
                  <th className="p-3">Infrastructure Alert</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recurring.map((item, i) => (
                  <tr key={i} className="hover:bg-slate-50/50">
                    <td className="p-3 font-semibold text-slate-800">{item.location}</td>
                    <td className="p-3">{item.category}</td>
                    <td className="p-3 font-mono font-bold text-slate-900">{item.count} complaints</td>
                    <td className="p-3">
                      {item.isFlagged ? (
                        <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-200 font-bold text-[10px]">
                          ⚠️ High Frequency Alert
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px]">
                          Monitored Cluster
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
