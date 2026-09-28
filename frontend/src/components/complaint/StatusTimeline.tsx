import React from 'react';
import { StatusHistory } from '../../types';
import { CheckCircle2, Clock, AlertCircle, RefreshCw } from 'lucide-react';

export const StatusTimeline: React.FC<{ history?: StatusHistory[] }> = ({ history = [] }) => {
  if (history.length === 0) {
    return <p className="text-xs text-slate-500 italic">No status updates recorded yet.</p>;
  }

  return (
    <div className="relative border-l-2 border-slate-200 ml-3 space-y-6 my-4">
      {history.map((step, idx) => {
        const isLatest = idx === history.length - 1;
        const isResolved = step.newStatus === 'RESOLVED' || step.newStatus === 'CLOSED';
        const isReopened = step.newStatus === 'REOPENED';

        return (
          <div key={step.id} className="relative pl-6">
            {/* Timeline Dot */}
            <span
              className={`absolute -left-[9px] top-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center bg-white ${
                isLatest
                  ? isReopened
                    ? 'border-rose-500 bg-rose-50 text-rose-600'
                    : 'border-brand-600 bg-brand-50 text-brand-600 ring-4 ring-brand-100'
                  : isResolved
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-600'
                  : 'border-slate-300 text-slate-400'
              }`}
            >
              {isResolved ? (
                <CheckCircle2 className="w-2.5 h-2.5" />
              ) : isReopened ? (
                <RefreshCw className="w-2.5 h-2.5" />
              ) : (
                <Clock className="w-2.5 h-2.5" />
              )}
            </span>

            {/* Content */}
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
              <div className="flex justify-between items-start gap-2">
                <span className="font-bold text-slate-800 uppercase tracking-wide">
                  {step.newStatus.replace('_', ' ')}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {new Date(step.createdAt).toLocaleDateString()} {new Date(step.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              {step.reason && <p className="mt-1 text-slate-600">{step.reason}</p>}
              {step.changedBy && (
                <p className="mt-1 text-[10px] text-slate-400">
                  By <span className="font-semibold text-slate-600">{step.changedBy.name}</span> ({step.changedBy.role})
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
