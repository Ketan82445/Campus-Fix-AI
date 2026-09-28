import React, { useState, useEffect } from 'react';
import { complaintApi } from '../../services/complaintApi';
import { Complaint } from '../../types';
import { ComplaintCard } from '../../components/complaint/ComplaintCard';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import { Link } from 'react-router-dom';
import { PlusCircle, ClipboardList, CheckCircle2, Clock, Wrench } from 'lucide-react';

export const StudentDashboard: React.FC = () => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    complaintApi.getMany({ limit: 50 })
      .then(res => {
        if (res.success && res.data) {
          setComplaints(res.data.items);
        }
      })
      .finally(() => setIsLoading(false));
  }, []);

  const total = complaints.length;
  const openCount = complaints.filter(c => ['SUBMITTED', 'ASSIGNED', 'AI_REVIEW_REQUIRED'].includes(c.status)).length;
  const inProgressCount = complaints.filter(c => c.status === 'IN_PROGRESS').length;
  const resolvedCount = complaints.filter(c => ['RESOLVED', 'CLOSED'].includes(c.status)).length;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Student Service Dashboard</h1>
          <p className="text-xs text-slate-500 mt-0.5">Report campus issues & track AI-driven resolution progress</p>
        </div>
        <Link
          to="/student/complaints/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs rounded-xl shadow-md transition"
        >
          <PlusCircle className="w-4 h-4" /> Create Complaint
        </Link>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex justify-between items-center text-slate-500 text-xs mb-2">
            <span>Total Logged</span>
            <ClipboardList className="w-4 h-4 text-brand-600" />
          </div>
          <p className="text-2xl font-black text-slate-900">{total}</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex justify-between items-center text-slate-500 text-xs mb-2">
            <span>Open Complaints</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-amber-600">{openCount}</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex justify-between items-center text-slate-500 text-xs mb-2">
            <span>In Progress</span>
            <Wrench className="w-4 h-4 text-sky-500" />
          </div>
          <p className="text-2xl font-black text-sky-600">{inProgressCount}</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex justify-between items-center text-slate-500 text-xs mb-2">
            <span>Resolved Issues</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-emerald-600">{resolvedCount}</p>
        </div>
      </div>

      {/* Complaints List Section */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-base font-bold text-slate-900">Your Recent Complaints</h2>
          <span className="text-xs text-slate-500 font-mono">{complaints.length} Records</span>
        </div>

        {isLoading ? (
          <LoadingSpinner message="Fetching your complaints from database..." />
        ) : complaints.length === 0 ? (
          <EmptyState
            title="No complaints logged yet"
            description="Have a Wi-Fi, water, electrical, or classroom issue? Report it now and let CampusFix AI route it to technicians."
            actionText="Report Issue Now"
            onAction={() => window.location.href = '/student/complaints/new'}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {complaints.map(c => (
              <ComplaintCard
                key={c.id}
                complaint={c}
                detailPath={`/student/complaints/${c.id}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
