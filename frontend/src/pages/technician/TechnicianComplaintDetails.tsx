import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { complaintApi } from '../../services/complaintApi';
import { Complaint, Status } from '../../types';
import { StatusBadge, PriorityBadge, CategoryBadge } from '../../components/common/Badge';
import { StatusTimeline } from '../../components/complaint/StatusTimeline';
import { AIConfidenceBadge } from '../../components/complaint/AIConfidenceBadge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ArrowLeft, MapPin, Calendar, CheckCircle2, Play, Send, MessageSquare, User } from 'lucide-react';

export const TechnicianComplaintDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [statusReason, setStatusReason] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchComplaint = async () => {
    if (!id) return;
    try {
      const res = await complaintApi.getById(id);
      if (res.success && res.data) setComplaint(res.data);
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaint();
  }, [id]);

  const handleUpdateStatus = async (newStatus: Status) => {
    if (!id) return;
    setIsUpdating(true);
    try {
      await complaintApi.updateStatus(id, newStatus, statusReason || `Technician set status to ${newStatus}`);
      setStatusReason('');
      await fetchComplaint();
    } catch {
      // ignore
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !commentText.trim()) return;
    try {
      await complaintApi.addComment(id, commentText, isInternal);
      setCommentText('');
      await fetchComplaint();
    } catch {
      // ignore
    }
  };

  if (isLoading) return <LoadingSpinner message="Loading task details..." />;
  if (!complaint) return <p className="p-8 text-xs text-rose-600">Task not found.</p>;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Link to="/technician/dashboard" className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-800">
        <ArrowLeft className="w-4 h-4" /> Back to Technician Workstation
      </Link>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-brand-700 bg-brand-50 px-2.5 py-1 rounded-md border border-brand-200">
              {complaint.complaintNumber}
            </span>
            <CategoryBadge category={complaint.category} />
          </div>
          <div className="flex items-center gap-2">
            <PriorityBadge priority={complaint.priority} />
            <StatusBadge status={complaint.status} />
          </div>
        </div>

        <div>
          <h1 className="text-xl font-bold text-slate-900 mb-2">{complaint.title}</h1>
          <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">{complaint.description}</p>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-slate-400" />
            <span className="font-semibold text-slate-700">{complaint.location}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <User className="w-4 h-4 text-slate-400" />
            <span>Student: <strong className="text-slate-700">{complaint.createdBy?.name}</strong> ({complaint.createdBy?.email})</span>
          </div>
        </div>

        {/* Technician Action Controls */}
        <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
          <h3 className="text-xs font-bold text-slate-800">Update Task Status & Work Notes</h3>
          <input
            type="text"
            value={statusReason}
            onChange={e => setStatusReason(e.target.value)}
            placeholder="Add work notes (e.g. 'Replaced router power supply unit')..."
            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
          />
          <div className="flex flex-wrap gap-2 pt-1">
            {complaint.status === 'ASSIGNED' && (
              <button
                onClick={() => handleUpdateStatus('IN_PROGRESS')}
                disabled={isUpdating}
                className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs rounded-lg transition flex items-center gap-1.5 shadow-sm"
              >
                <Play className="w-4 h-4" /> Start Work (In Progress)
              </button>
            )}
            {['ASSIGNED', 'IN_PROGRESS', 'REOPENED'].includes(complaint.status) && (
              <button
                onClick={() => handleUpdateStatus('RESOLVED')}
                disabled={isUpdating}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-lg transition flex items-center gap-1.5 shadow-sm"
              >
                <CheckCircle2 className="w-4 h-4" /> Mark Complaint Resolved
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <AIConfidenceBadge prediction={complaint.aiPredictions?.[0]} confidence={complaint.aiConfidence} />
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
          <h3 className="text-sm font-bold text-slate-900 mb-4">Status Lifecycle History</h3>
          <StatusTimeline history={complaint.statusHistory} />
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-slate-500" /> Work Notes & Comments
        </h3>
        <div className="space-y-3">
          {complaint.comments?.map(c => (
            <div key={c.id} className={`p-3 rounded-xl border text-xs ${c.isInternal ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-200'}`}>
              <div className="flex justify-between items-center mb-1">
                <span className="font-semibold text-slate-800">{c.author.name} ({c.author.role}) {c.isInternal && <span className="text-[10px] bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded ml-2">Internal Note</span>}</span>
                <span className="text-[10px] text-slate-400">{new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <p className="text-slate-700">{c.comment}</p>
            </div>
          ))}
        </div>

        <form onSubmit={handleAddComment} className="space-y-2 pt-2">
          <textarea
            rows={2}
            value={commentText}
            onChange={e => setCommentText(e.target.value)}
            placeholder="Log technical notes or communicate with student..."
            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          <div className="flex justify-between items-center">
            <label className="flex items-center gap-1.5 text-xs text-slate-600">
              <input type="checkbox" checked={isInternal} onChange={e => setIsInternal(e.target.checked)} className="rounded text-brand-600" />
              <span>Internal Note (visible to technicians/admin only)</span>
            </label>
            <button type="submit" className="px-4 py-2 bg-brand-600 text-white text-xs font-semibold rounded-lg hover:bg-brand-700 transition flex items-center gap-1">
              <Send className="w-3.5 h-3.5" /> Post Comment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
