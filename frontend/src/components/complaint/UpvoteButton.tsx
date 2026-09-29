import React, { useState } from 'react';
import { ThumbsUp, Users, Check } from 'lucide-react';
import { complaintApi } from '../../services/complaintApi';
import { useAuth } from '../../context/AuthContext';

interface UpvoteButtonProps {
  complaintId: string;
  initialCount?: number;
  initialHasUpvoted?: boolean;
  onCountChange?: (newCount: number, hasUpvoted: boolean) => void;
  size?: 'sm' | 'md' | 'lg';
}

export const UpvoteButton: React.FC<UpvoteButtonProps> = ({
  complaintId,
  initialCount = 0,
  initialHasUpvoted = false,
  onCountChange,
  size = 'md'
}) => {
  const { user } = useAuth();
  const [count, setCount] = useState<number>(initialCount);
  const [hasUpvoted, setHasUpvoted] = useState<boolean>(initialHasUpvoted);
  const [loading, setLoading] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const isStudent = user?.role === 'STUDENT';

  const handleToggle = async () => {
    if (!isStudent && user?.role !== 'ADMIN') return;
    try {
      setLoading(true);
      const res = await complaintApi.toggleUpvote(complaintId);
      if (res.success && res.data) {
        setCount(res.data.upvoteCount);
        setHasUpvoted(res.data.upvoted);
        setToastMessage(res.data.upvoted ? "Confirmed: You're affected too!" : 'Removed confirmation');
        setTimeout(() => setToastMessage(null), 3000);
        if (onCountChange) {
          onCountChange(res.data.upvoteCount, res.data.upvoted);
        }
      }
    } catch (err) {
      console.error('Failed to toggle upvote:', err);
    } finally {
      setLoading(false);
    }
  };

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs gap-1',
    md: 'px-3 py-1.5 text-xs font-semibold gap-1.5',
    lg: 'px-4 py-2 text-sm font-semibold gap-2'
  };

  return (
    <div className="relative inline-flex items-center">
      <button
        type="button"
        disabled={loading || (!isStudent && user?.role !== 'ADMIN')}
        onClick={handleToggle}
        className={`inline-flex items-center rounded-lg border transition-all duration-150 ${
          sizeClasses[size]
        } ${
          hasUpvoted
            ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-xs hover:bg-indigo-100 ring-2 ring-indigo-200'
            : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-300'
        } ${loading ? 'opacity-60 cursor-not-allowed' : ''} ${
          !isStudent && user?.role !== 'ADMIN' ? 'cursor-default' : ''
        }`}
        title={
          hasUpvoted
            ? "Click to remove your 'I'm affected too' confirmation"
            : isStudent
            ? "Click if you are also experiencing this issue"
            : 'Number of affected students'
        }
      >
        {hasUpvoted ? (
          <Check className="h-4 w-4 text-indigo-600 animate-in zoom-in-50" />
        ) : (
          <ThumbsUp className={`h-4 w-4 ${count > 0 ? 'text-indigo-600' : 'text-gray-400'}`} />
        )}

        <span>{hasUpvoted ? "I'm Affected" : "I'm Affected Too"}</span>

        <span
          className={`ml-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${
            count > 0
              ? 'bg-indigo-100 text-indigo-800'
              : 'bg-gray-100 text-gray-600'
          }`}
        >
          {count}
        </span>
      </button>

      {/* Floating toast notification */}
      {toastMessage && (
        <div className="absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-gray-900 px-2.5 py-1 text-xs font-medium text-white shadow-lg animate-in fade-in slide-in-from-bottom-2 z-50">
          {toastMessage}
        </div>
      )}
    </div>
  );
};
