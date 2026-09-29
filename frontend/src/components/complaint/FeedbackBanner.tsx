import React, { useState } from 'react';
import { Star } from 'lucide-react';
import { feedbackApi } from '../../services/feedbackApi';
import { ComplaintFeedback } from '../../types';

interface FeedbackBannerProps {
  complaintId: string;
  existingFeedback?: ComplaintFeedback | null;
  onFeedbackSubmitted: () => void;
}

export const FeedbackBanner: React.FC<FeedbackBannerProps> = ({
  complaintId,
  existingFeedback,
  onFeedbackSubmitted
}) => {
  const [rating, setRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  if (existingFeedback) {
    return (
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 p-4 rounded-xl shadow-2xs mt-6">
        <h3 className="font-bold text-emerald-900 text-sm mb-2">Resolution Feedback</h3>
        <div className="flex items-center gap-1 mb-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={`w-5 h-5 ${
                star <= existingFeedback.rating ? 'fill-emerald-500 text-emerald-500' : 'text-emerald-200'
              }`}
            />
          ))}
        </div>
        {existingFeedback.comment && (
          <p className="text-xs text-emerald-800 italic bg-white/60 p-3 rounded-lg border border-emerald-100">
            "{existingFeedback.comment}"
          </p>
        )}
      </div>
    );
  }

  const handleSubmit = async () => {
    if (rating === 0) return;
    setIsSubmitting(true);
    try {
      await feedbackApi.submitFeedback(complaintId, rating, comment);
      onFeedbackSubmitted();
    } catch {
      // ignore
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!showForm) {
    return (
      <div className="bg-white border border-brand-200 p-5 rounded-xl shadow-2xs mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-slate-900 text-base">How did we do?</h3>
          <p className="text-xs text-slate-500 mt-1">
            This issue has been resolved. Please take a moment to rate the technician's resolution.
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-brand-600 hover:bg-brand-700 text-white font-bold py-2 px-4 rounded-xl text-sm transition shadow-md whitespace-nowrap"
        >
          Rate Resolution
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white border border-brand-200 p-5 rounded-xl shadow-2xs mt-6">
      <h3 className="font-bold text-slate-900 text-base mb-1">Rate the Resolution</h3>
      <p className="text-xs text-slate-500 mb-4">Your feedback helps us improve campus maintenance.</p>

      <div className="flex items-center gap-2 mb-4">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onMouseEnter={() => setHoverRating(star)}
            onMouseLeave={() => setHoverRating(0)}
            onClick={() => setRating(star)}
            className="focus:outline-hidden transition-transform hover:scale-110"
          >
            <Star
              className={`w-8 h-8 transition-colors ${
                star <= (hoverRating || rating) ? 'fill-amber-400 text-amber-400' : 'text-slate-200'
              }`}
            />
          </button>
        ))}
        <span className="ml-2 text-xs font-semibold text-slate-500">
          {rating === 1 && 'Poor'}
          {rating === 2 && 'Fair'}
          {rating === 3 && 'Good'}
          {rating === 4 && 'Very Good'}
          {rating === 5 && 'Excellent'}
        </span>
      </div>

      {rating > 0 && (
        <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Additional Comments (Optional)</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Tell us what you liked or how we can improve..."
              className="w-full rounded-xl border border-slate-300 p-3 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-hidden min-h-[80px]"
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-brand-600 hover:bg-brand-700 text-white font-bold py-2 px-6 rounded-xl text-sm transition shadow-md disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
            </button>
            <button
              onClick={() => {
                setShowForm(false);
                setRating(0);
                setComment('');
              }}
              className="px-4 py-2 text-sm font-semibold text-slate-500 hover:text-slate-700 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
