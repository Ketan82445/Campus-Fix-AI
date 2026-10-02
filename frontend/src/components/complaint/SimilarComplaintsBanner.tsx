import React, { useState } from 'react';
import { SimilarComplaint } from '../../types';
import { AlertTriangle, ThumbsUp, CheckCircle, ChevronDown, ChevronUp, ExternalLink, X } from 'lucide-react';
import { complaintApi } from '../../services/complaintApi';
import { useNavigate } from 'react-router-dom';

interface SimilarComplaintsBannerProps {
  similarComplaints: SimilarComplaint[];
  onDismiss: () => void;
  onConfirmExisting: (complaint: SimilarComplaint) => void;
}

export const SimilarComplaintsBanner: React.FC<SimilarComplaintsBannerProps> = ({
  similarComplaints,
  onDismiss,
  onConfirmExisting
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(
    similarComplaints.length > 0 ? similarComplaints[0].id : null
  );
  const [actionInProgressId, setActionInProgressId] = useState<string | null>(null);
  const [confirmedIds, setConfirmedIds] = useState<Record<string, boolean>>({});
  const [followedIds, setFollowedIds] = useState<Record<string, boolean>>({});
  const navigate = useNavigate();

  if (similarComplaints.length === 0) return null;

  const handleUpvote = async (comp: SimilarComplaint) => {
    try {
      setActionInProgressId(comp.id);
      const res = await complaintApi.toggleUpvote(comp.id);
      if (res.success) {
        setConfirmedIds(prev => ({ ...prev, [comp.id]: true }));
        onConfirmExisting(comp);
      }
    } catch (err) {
      console.error('Failed to upvote complaint:', err);
    } finally {
      setActionInProgressId(null);
    }
  };

  const handleFollow = async (comp: SimilarComplaint) => {
    try {
      setActionInProgressId(comp.id);
      const res = await complaintApi.follow(comp.id);
      if (res.success) {
        setFollowedIds(prev => ({ ...prev, [comp.id]: res.data?.following || false }));
      }
    } catch (err) {
      console.error('Failed to follow complaint:', err);
    } finally {
      setActionInProgressId(null);
    }
  };

  return (
    <div className="mb-6 rounded-xl border-2 border-amber-300 bg-amber-50/80 p-5 shadow-sm transition-all duration-200">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 text-amber-800">
          <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 animate-pulse" />
          <h3 className="font-bold text-base text-amber-900">
            Similar Open Issue Already Reported! ({similarComplaints.length} found)
          </h3>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="text-amber-700 hover:text-amber-900 p-1 rounded-md hover:bg-amber-100 transition-colors"
          title="Dismiss and continue submitting"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <p className="mt-1 text-sm text-amber-800">
        Someone on campus may have already reported this issue. You can confirm you're affected too to boost its priority instead of creating a duplicate ticket.
      </p>

      <div className="mt-3 space-y-3">
        {similarComplaints.map((comp) => {
          const isExpanded = expandedId === comp.id;
          const isConfirmed = confirmedIds[comp.id] || comp.hasUpvoted;
          const isLoading = actionInProgressId === comp.id;

          return (
            <div
              key={comp.id}
              className="rounded-lg border border-amber-200 bg-white p-4 shadow-xs transition hover:border-amber-300"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                      {comp.complaintNumber}
                    </span>
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded ${
                        comp.similarityScore >= 75
                          ? 'bg-red-100 text-red-800 border border-red-200'
                          : comp.similarityScore >= 50
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      }`}
                    >
                      {comp.similarityScore}% Match
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-700 font-medium">
                      Status: {comp.status}
                    </span>
                    {comp.upvoteCount > 0 && (
                      <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200 flex items-center gap-1">
                        👥 {comp.upvoteCount} affected
                      </span>
                    )}
                  </div>
                  <h4 className="font-semibold text-gray-900 text-sm">{comp.title}</h4>
                  <p className="text-xs text-gray-500">📍 {comp.location}</p>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {isConfirmed ? (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-lg border border-emerald-200">
                      <CheckCircle className="h-4 w-4 text-emerald-600" />
                      Confirmed Affected
                    </div>
                  ) : (
                    <button
                      type="button"
                      disabled={isLoading}
                      onClick={() => handleUpvote(comp)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-xs transition disabled:opacity-50"
                    >
                      <ThumbsUp className="h-3.5 w-3.5" />
                      {isLoading ? 'Saving...' : "I'm Affected Too (+1)"}
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setExpandedId(isExpanded ? null : comp.id)}
                    className="p-1.5 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100 transition"
                  >
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Match reasons tag pills */}
              {comp.matchReasons && comp.matchReasons.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {comp.matchReasons.map((reason, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center text-[11px] font-medium bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full"
                    >
                      {reason}
                    </span>
                  ))}
                </div>
              )}

              {/* Expanded details */}
              {isExpanded && (
                <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-600 space-y-2">
                  <p className="whitespace-pre-line bg-gray-50 p-2.5 rounded-md border border-gray-100">
                    {comp.description}
                  </p>
                  <div className="flex justify-between items-center mt-2">
                    <button
                      type="button"
                      disabled={isLoading}
                      onClick={() => handleFollow(comp)}
                      className={`inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg border transition ${followedIds[comp.id] ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
                    >
                      {followedIds[comp.id] ? <><CheckCircle className="h-3 w-3" /> Following</> : '+ Follow Issue'}
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate(`/student/complaints/${comp.id}`)}
                      className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-semibold"
                    >
                      View Complaint Progress <ExternalLink className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex items-center justify-between text-xs text-amber-900 pt-2 border-t border-amber-200">
        <span>None of these match your issue?</span>
        <button
          type="button"
          onClick={onDismiss}
          className="font-bold underline hover:text-amber-950 transition"
        >
          Proceed with submitting a new complaint &rarr;
        </button>
      </div>
    </div>
  );
};
