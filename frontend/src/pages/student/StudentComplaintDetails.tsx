import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { complaintApi } from '../../services/complaintApi';
import { Complaint } from '../../types';
import { StatusBadge, PriorityBadge, CategoryBadge } from '../../components/common/Badge';
import { StatusTimeline } from '../../components/complaint/StatusTimeline';
import { AIConfidenceBadge } from '../../components/complaint/AIConfidenceBadge';
import { AttachmentGallery } from '../../components/complaint/AttachmentGallery';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { UpvoteButton } from '../../components/complaint/UpvoteButton';
import { SlaCountdownBadge } from '../../components/complaint/SlaCountdownBadge';
import { FeedbackBanner } from '../../components/complaint/FeedbackBanner';
import { CreateWorkOrderModal } from '../../components/workOrder/CreateWorkOrderModal';
import { useAuth } from '../../context/AuthContext';
import { ArrowLeft, MapPin, Calendar, CheckCircle2, RefreshCw, Send, MessageSquare, Wrench, AlertTriangle, Users } from 'lucide-react';

export const StudentComplaintDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [reopenReason, setReopenReason] = useState('');
  const [showReopenModal, setShowReopenModal] = useState(false);
  const [showWorkOrderModal, setShowWorkOrderModal] = useState(false);
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

  const handleConfirmResolution = async () => {
    if (!id) return;
    setIsUpdating(true);
    try {
      const res = await complaintApi.updateStatus(id, 'CLOSED', 'Student confirmed resolution');
      if (res.success && res.data) setComplaint(res.data);
    } catch {
      // ignore
    } finally {
      setIsUpdating(false);
    }
  };

  const handleReopen = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !reopenReason) return;
    setIsUpdating(true);
    try {
      const res = await complaintApi.reopen(id, reopenReason);
      if (res.success && res.data) setComplaint(res.data);
      setShowReopenModal(false);
      setReopenReason('');
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
      const res = await complaintApi.addComment(id, commentText);
      if (res.success && res.data) setComplaint(res.data);
      setCommentText('');
    } catch {
      // ignore
    }
  };

  const handleDeleteAttachment = async (attachmentId: string) => {
    if (!id) return;
    try {
      const res = await complaintApi.deleteAttachment(id, attachmentId);
      if (res.success && res.data) setComplaint(res.data);
    } catch {
      // ignore
    }
  };

  if (isLoading) return <LoadingSpinner message="Loading complaint details..." />;
  if (!complaint) return <p className="p-8 text-xs text-rose-600">Complaint not found.</p>;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Back Link */}
      <Link to="/student/complaints" className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-800">
        <ArrowLeft className="w-4 h-4" /> Back to Complaints
      </Link>

      {/* Main Complaint Header Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-brand-700 bg-brand-50 px-2.5 py-1 rounded-md border border-brand-200">
              {complaint.complaintNumber}
            </span>
            <CategoryBadge category={complaint.category} />
            {complaint.language && complaint.language !== 'en' && (
              <span className="text-[10px] bg-brand-50 text-brand-700 font-bold px-2 py-0.5 rounded uppercase">
                {complaint.language}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <PriorityBadge priority={complaint.priority} />
            <StatusBadge status={complaint.status} />
            <SlaCountdownBadge
              resolutionDeadline={complaint.resolutionDeadline}
              slaBreached={complaint.slaBreached}
              status={complaint.status}
              escalationLevel={complaint.escalationLevel}
            />
          </div>
        </div>

        {/* Merged Duplicate Banner */}
        {complaint.duplicateOf && (
          <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-xs text-amber-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
              <div>
                <span className="font-bold">Merged Duplicate:</span> This issue was marked as a duplicate of primary ticket{' '}
                <span className="font-mono font-bold text-amber-950">#{complaint.duplicateOf.complaintNumber}</span> (
                "{complaint.duplicateOf.title}").
              </div>
            </div>
            <Link
              to={`/student/complaints/${complaint.duplicateOf.id}`}
              className="shrink-0 rounded-lg bg-amber-600 px-3 py-1.5 font-semibold text-white hover:bg-amber-700 transition"
            >
              View Primary Ticket &rarr;
            </Link>
          </div>
        )}

        {/* Master Ticket Linked Duplicates */}
        {complaint.duplicates && complaint.duplicates.length > 0 && (
          <div className="rounded-xl border border-indigo-200 bg-indigo-50/70 p-3 text-xs text-indigo-900 flex items-center gap-2">
            <Users className="h-4 w-4 text-indigo-600 shrink-0" />
            <span>
              <strong>{complaint.duplicates.length} duplicate report(s)</strong> merged into this ticket:{' '}
              {complaint.duplicates.map((d) => `#${d.complaintNumber}`).join(', ')}
            </span>
          </div>
        )}

        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-xl font-bold text-slate-900 mb-2">{complaint.title}</h1>
            <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">{complaint.description}</p>
          </div>
          {user?.role === 'ADMIN' && (
            <div className="flex gap-2 shrink-0 ml-4">
              <button 
                onClick={() => setShowWorkOrderModal(true)}
                className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-semibold shadow-sm transition flex items-center gap-1.5"
              >
                <Wrench className="w-3.5 h-3.5" />
                Assign Work Order
              </button>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-1.5 flex-wrap">
            <MapPin className="w-4 h-4 text-slate-400" />
            <span className="font-semibold text-slate-700">{complaint.location}</span>
            {complaint.building && (
              <span className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-medium">
                🏢 {complaint.building} {complaint.floor ? `• ${complaint.floor}` : ''} {complaint.room ? `• ${complaint.room}` : ''}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span>Logged on {new Date(complaint.createdAt).toLocaleDateString()}</span>
            </div>

            {/* Community Issue Confirmation ("I'm Affected Too" / Upvote) */}
            <UpvoteButton
              complaintId={complaint.id}
              initialCount={complaint.upvoteCount || complaint._count?.upvotes || 0}
              initialHasUpvoted={complaint.hasUpvoted || false}
              size="sm"
            />
          </div>
        </div>

        {/* Attachments Section */}
        {complaint.attachments && complaint.attachments.length > 0 && (
          <div className="pt-2 border-t border-slate-100">
            <AttachmentGallery
              attachments={complaint.attachments}
              canDelete={true}
              onDelete={handleDeleteAttachment}
            />
          </div>
        )}

        {/* Resolution Actions for Student */}
        {complaint.status === 'RESOLVED' && (
          <div className="mt-4 p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <p className="text-xs font-bold text-emerald-900">Technician has marked this issue as RESOLVED!</p>
              <p className="text-[11px] text-emerald-700">Please inspect the fix and confirm resolution to close this ticket.</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowReopenModal(true)}
                className="px-3 py-1.5 text-xs font-semibold text-rose-700 bg-white hover:bg-rose-50 border border-rose-200 rounded-lg transition"
              >
                Reopen Ticket
              </button>
              <button
                onClick={handleConfirmResolution}
                disabled={isUpdating}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition flex items-center gap-1"
              >
                <CheckCircle2 className="w-4 h-4" /> Confirm & Close
              </button>
            </div>
          </div>
        )}

        {/* Feedback Banner (for Resolved or Closed tickets) */}
        {(complaint.status === 'RESOLVED' || complaint.status === 'CLOSED') && (
          <FeedbackBanner
            complaintId={complaint.id}
            existingFeedback={complaint.feedback}
            onFeedbackSubmitted={fetchComplaint}
          />
        )}
      </div>

      {/* Grid: AI Analysis & Assigned Technician */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* AI Confidence & Intelligence Badge */}
        <AIConfidenceBadge
          prediction={complaint.aiPredictions?.[0]}
          confidence={complaint.aiConfidence}
        />

        {/* Assigned Technician Info */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800 mb-1">
            <Wrench className="w-4 h-4 text-sky-600" />
            <span>Assigned Technician & Dept</span>
          </div>
          <div className="text-xs space-y-1">
            <p className="text-slate-500">Department: <span className="font-semibold text-slate-800">{complaint.department?.name || 'Pending Assignment'}</span></p>
            <p className="text-slate-500">Technician: <span className="font-semibold text-slate-800">{complaint.assignedTechnician?.name || 'Unassigned'}</span></p>
            {complaint.assignedTechnician?.phone && (
              <p className="text-slate-500">Contact Phone: <span className="font-mono text-slate-700">{complaint.assignedTechnician.phone}</span></p>
            )}
          </div>
        </div>
      </div>

      {/* Status History Timeline */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <h3 className="text-sm font-bold text-slate-900 mb-4">Resolution Lifecycle Timeline</h3>
        <StatusTimeline history={complaint.statusHistory} />
      </div>

      {/* Comments Section */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-slate-500" /> Discussion & Updates ({complaint.comments?.length || 0})
        </h3>

        <div className="space-y-3">
          {complaint.comments?.map(c => (
            <div key={c.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <div className="flex justify-between items-center mb-1">
                <span className="font-semibold text-slate-800">{c.author.name} ({c.author.role})</span>
                <span className="text-[10px] text-slate-400">{new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <p className="text-slate-700">{c.comment}</p>
            </div>
          ))}
        </div>

        <form onSubmit={handleAddComment} className="flex gap-2 pt-2">
          <input
            type="text"
            value={commentText}
            onChange={e => setCommentText(e.target.value)}
            placeholder="Add a comment or note..."
            className="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          <button type="submit" className="px-3 py-2 bg-brand-600 text-white text-xs font-semibold rounded-lg hover:bg-brand-700 transition">
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>

      {showWorkOrderModal && complaint && (
        <CreateWorkOrderModal
          complaintId={complaint.id}
          onClose={() => setShowWorkOrderModal(false)}
          onSuccess={(wo) => {
            setShowWorkOrderModal(false);
            alert(`Work order created and assigned!`);
            fetchComplaint();
          }}
        />
      )}

      {/* Reopen Modal */}
      {showReopenModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4">
            <h3 className="font-bold text-base text-slate-900">Reopen Complaint Ticket</h3>
            <p className="text-xs text-slate-500">Why are you reopening this complaint? Please state what remains unfixed.</p>
            <textarea
              rows={3}
              required
              value={reopenReason}
              onChange={e => setReopenReason(e.target.value)}
              placeholder="e.g. Wi-Fi worked for 10 minutes but is now disconnected again..."
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowReopenModal(false)}
                className="px-3 py-1.5 text-xs text-slate-600 bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReopen}
                disabled={!reopenReason || isUpdating}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg"
              >
                Submit Reopen Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
