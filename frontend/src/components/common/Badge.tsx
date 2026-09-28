import React from 'react';
import { Status, Priority, Category } from '../../types';

export const StatusBadge: React.FC<{ status: Status }> = ({ status }) => {
  const styles: Record<Status, string> = {
    SUBMITTED: 'bg-blue-100 text-blue-800 border-blue-200',
    AI_ANALYZING: 'bg-purple-100 text-purple-800 border-purple-200',
    AI_REVIEW_REQUIRED: 'bg-amber-100 text-amber-800 border-amber-300 font-semibold animate-pulse',
    ASSIGNED: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    IN_PROGRESS: 'bg-sky-100 text-sky-800 border-sky-300 font-medium',
    RESOLVED: 'bg-emerald-100 text-emerald-800 border-emerald-300 font-semibold',
    REOPENED: 'bg-rose-100 text-rose-800 border-rose-300 font-semibold',
    CLOSED: 'bg-slate-100 text-slate-700 border-slate-200',
    REJECTED: 'bg-red-100 text-red-800 border-red-200'
  };

  const labels: Record<Status, string> = {
    SUBMITTED: 'Submitted',
    AI_ANALYZING: 'AI Analyzing',
    AI_REVIEW_REQUIRED: 'AI Review Needed',
    ASSIGNED: 'Assigned',
    IN_PROGRESS: 'In Progress',
    RESOLVED: 'Resolved',
    REOPENED: 'Reopened',
    CLOSED: 'Closed',
    REJECTED: 'Rejected'
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs border ${
        styles[status] || 'bg-gray-100 text-gray-800'
      }`}
    >
      {labels[status] || status}
    </span>
  );
};

export const PriorityBadge: React.FC<{ priority: Priority }> = ({ priority }) => {
  const styles: Record<Priority, string> = {
    LOW: 'bg-gray-100 text-gray-700 border-gray-200',
    MEDIUM: 'bg-blue-100 text-blue-700 border-blue-200',
    HIGH: 'bg-orange-100 text-orange-800 border-orange-300 font-medium',
    CRITICAL: 'bg-red-100 text-red-800 border-red-300 font-bold animate-pulse'
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs border ${
        styles[priority] || 'bg-gray-100 text-gray-800'
      }`}
    >
      {priority}
    </span>
  );
};

export const CategoryBadge: React.FC<{ category: Category }> = ({ category }) => {
  const formatted = category.replace('_', ' ');
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-slate-100 text-slate-700 font-mono border border-slate-200">
      {formatted}
    </span>
  );
};
