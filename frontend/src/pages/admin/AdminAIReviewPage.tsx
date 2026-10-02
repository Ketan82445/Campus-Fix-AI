import React, { useState, useEffect } from 'react';
import { complaintApi } from '../../services/complaintApi';
import { departmentApi } from '../../services/departmentApi';
import { userApi } from '../../services/userApi';
import { Complaint, Department, Category, Priority } from '../../types';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import { AIConfidenceBadge } from '../../components/complaint/AIConfidenceBadge';
import { Sparkles, CheckCircle2, ShieldAlert, ArrowRight } from 'lucide-react';

export const AdminAIReviewPage: React.FC = () => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form State for selected review item
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [overrideCategory, setOverrideCategory] = useState<Category>('OTHER');
  const [overridePriority, setOverridePriority] = useState<Priority>('MEDIUM');
  const [selectedDeptId, setSelectedDeptId] = useState<string>('');
  const [selectedTechId, setSelectedTechId] = useState<string>('');
  const [reviewReason, setReviewReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchQueue = async () => {
    try {
      const [compRes, deptRes, techRes] = await Promise.all([
        complaintApi.getMany({ status: 'AI_REVIEW_REQUIRED', limit: 50 }),
        departmentApi.getAll(),
        userApi.getTechnicians()
      ]);

      if (compRes.success && compRes.data) setComplaints(compRes.data.items);
      if (deptRes.success && deptRes.data) setDepartments(deptRes.data);
      if (techRes.success && techRes.data) setTechnicians(techRes.data);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const handleOpenReview = (c: Complaint) => {
    setSelectedComplaint(c);
    setOverrideCategory(c.category);
    setOverridePriority(c.priority);
    setSelectedDeptId(c.departmentId || (departments[0]?.id || ''));
    setSelectedTechId(c.assignedTechnicianId || '');
    setReviewReason('Reviewed and confirmed classification by Admin');
  };

  const handleApprove = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedComplaint || !selectedDeptId) return;

    setIsSubmitting(true);
    try {
      const res = await complaintApi.reviewAI(selectedComplaint.id, {
        category: overrideCategory,
        priority: overridePriority,
        departmentId: selectedDeptId,
        assignedTechnicianId: selectedTechId || undefined,
        reviewReason
      });

      if (res.success) {
        setComplaints(prev => prev.filter(c => c.id !== selectedComplaint.id));
      }
      setSelectedComplaint(null);
    } catch {} finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <LoadingSpinner message="Loading AI review queue..." />;

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">AI Classification Review Queue</h1>
            <p className="text-xs text-slate-500 mt-0.5">Complaints with AI confidence below 75% requiring admin verification</p>
          </div>
        </div>
      </div>

      {complaints.length === 0 ? (
        <EmptyState
          title="Review Queue Clear!"
          description="All submitted complaints have been automatically analyzed with high confidence and routed."
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Queue Items List */}
          <div className="space-y-3">
            <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">Pending Items ({complaints.length})</p>
            {complaints.map(c => (
              <div
                key={c.id}
                onClick={() => handleOpenReview(c)}
                className={`p-4 rounded-xl border transition cursor-pointer ${
                  selectedComplaint?.id === c.id
                    ? 'bg-purple-50 border-purple-300 ring-2 ring-purple-200 shadow-sm'
                    : 'bg-white border-slate-200 hover:border-purple-200'
                }`}
              >
                <div className="flex justify-between items-start gap-2 mb-2">
                  <span className="font-mono text-xs font-bold text-brand-700 bg-slate-100 px-2 py-0.5 rounded">
                    {c.complaintNumber}
                  </span>
                  <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-200">
                    Low Conf ({Math.round((c.aiConfidence || 0) * 100)}%)
                  </span>
                </div>
                <h3 className="font-bold text-sm text-slate-900 mb-1">{c.title}</h3>
                <p className="text-xs text-slate-600 line-clamp-2">{c.description}</p>
              </div>
            ))}
          </div>

          {/* Active Review Form */}
          <div>
            {selectedComplaint ? (
              <form onSubmit={handleApprove} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-md space-y-4 sticky top-20">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <span className="font-bold text-sm text-slate-900">Review Ticket #{selectedComplaint.complaintNumber}</span>
                  <button type="button" onClick={() => setSelectedComplaint(null)} className="text-xs text-slate-400 hover:text-slate-600">
                    Close
                  </button>
                </div>

                {/* Complaint Preview */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1">
                  <p className="font-bold text-slate-900">{selectedComplaint.title}</p>
                  <p className="text-slate-600 text-[11px]">{selectedComplaint.description}</p>
                  <p className="text-slate-500 text-[10px]">Location: <strong>{selectedComplaint.location}</strong></p>
                </div>

                <AIConfidenceBadge prediction={selectedComplaint.aiPredictions?.[0]} confidence={selectedComplaint.aiConfidence} />

                {/* Overrides */}
                <div className="space-y-3 pt-2">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Select Category</label>
                      <select
                        value={overrideCategory}
                        onChange={e => setOverrideCategory(e.target.value as any)}
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                      >
                        <option value="IT_NETWORK">IT & Network Services</option>
                        <option value="ELECTRICAL">Electrical Maintenance</option>
                        <option value="PLUMBING">Plumbing & Sanitation</option>
                        <option value="CLEANING">Housekeeping & Cleaning</option>
                        <option value="HOSTEL">Hostel Facilities</option>
                        <option value="CLASSROOM">Classroom Infrastructure</option>
                        <option value="LABORATORY">Laboratory Equipment</option>
                        <option value="LIBRARY">Library Facilities</option>
                        <option value="SECURITY">Campus Security</option>
                        <option value="INFRASTRUCTURE">Building Infrastructure</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Select Priority</label>
                      <select
                        value={overridePriority}
                        onChange={e => setOverridePriority(e.target.value as any)}
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                      >
                        <option value="LOW">Low</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HIGH">High</option>
                        <option value="CRITICAL">Critical</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Target Department *</label>
                    <select
                      value={selectedDeptId}
                      onChange={e => setSelectedDeptId(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                    >
                      {departments.map(d => (
                        <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Assign Technician (Optional - Auto-assigns if empty)</label>
                    <select
                      value={selectedTechId}
                      onChange={e => setSelectedTechId(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                    >
                      <option value="">⚡ Auto-assign to lowest workload technician</option>
                      {technicians.map(t => (
                        <option key={t.id} value={t.id}>{t.name} - Workload: {t.activeWorkloadCount} tasks ({t.department?.name})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Review Notes</label>
                    <input
                      type="text"
                      value={reviewReason}
                      onChange={e => setReviewReason(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" /> Approve & Route Complaint
                </button>
              </form>
            ) : (
              <div className="bg-slate-50 p-12 rounded-2xl border border-dashed border-slate-300 text-center text-slate-400 text-xs">
                Select a complaint item from the left queue to review classification details.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
