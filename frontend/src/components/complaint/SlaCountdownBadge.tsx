import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle, AlertCircle, CheckCircle, ShieldAlert } from 'lucide-react';
import { Status } from '../../types';

interface SlaCountdownBadgeProps {
  resolutionDeadline?: string | null;
  slaBreached?: boolean;
  status: Status;
  escalationLevel?: number;
  size?: 'sm' | 'md';
}

function formatDuration(ms: number): string {
  const absMs = Math.abs(ms);
  const totalMinutes = Math.floor(absMs / (1000 * 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const days = Math.floor(hours / 24);

  if (days > 0) {
    const remHours = hours % 24;
    return `${days}d ${remHours}h`;
  }
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

export const SlaCountdownBadge: React.FC<SlaCountdownBadgeProps> = ({
  resolutionDeadline,
  slaBreached = false,
  status,
  escalationLevel = 0,
  size = 'md'
}) => {
  const [now, setNow] = useState<Date>(new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60000); // refresh every minute
    return () => clearInterval(interval);
  }, []);

  if (!resolutionDeadline) return null;

  const deadlineDate = new Date(resolutionDeadline);
  const diffMs = deadlineDate.getTime() - now.getTime();
  const isPast = diffMs < 0;
  const isResolvedOrClosed = ['RESOLVED', 'CLOSED'].includes(status);

  const sizeClasses = {
    sm: 'text-[11px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5'
  };

  // 1. If complaint is already resolved/closed
  if (isResolvedOrClosed) {
    if (slaBreached) {
      return (
        <span
          className={`inline-flex items-center font-medium rounded-lg bg-amber-50 text-amber-800 border border-amber-200 ${sizeClasses[size]}`}
          title={`Resolved after SLA deadline (${deadlineDate.toLocaleString()})`}
        >
          <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
          Resolved (SLA Exceeded)
        </span>
      );
    }
    return (
      <span
        className={`inline-flex items-center font-medium rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 ${sizeClasses[size]}`}
        title={`Resolved on-time before ${deadlineDate.toLocaleString()}`}
      >
        <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
        SLA Met (On-Time)
      </span>
    );
  }

  // 2. If open and breached
  if (isPast || slaBreached) {
    return (
      <div className="inline-flex items-center gap-1.5 flex-wrap">
        <span
          className={`inline-flex items-center font-bold rounded-lg bg-red-50 text-red-700 border border-red-200 shadow-2xs animate-pulse ${sizeClasses[size]}`}
          title={`SLA Deadline passed on ${deadlineDate.toLocaleString()}`}
        >
          <AlertCircle className="h-3.5 w-3.5 text-red-600" />
          Overdue by {formatDuration(diffMs)}
        </span>
        {escalationLevel > 0 && (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-300">
            <ShieldAlert className="h-3 w-3" />
            {escalationLevel >= 2 ? 'L2 Admin Escalated' : 'L1 Overdue Warning'}
          </span>
        )}
      </div>
    );
  }

  // 3. If within 4 hours (At Risk)
  const isAtRisk = diffMs <= 4 * 60 * 60 * 1000;
  if (isAtRisk) {
    return (
      <span
        className={`inline-flex items-center font-bold rounded-lg bg-amber-50 text-amber-800 border border-amber-300 shadow-2xs ${sizeClasses[size]}`}
        title={`Resolution deadline: ${deadlineDate.toLocaleString()}`}
      >
        <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
        At Risk: {formatDuration(diffMs)} left
      </span>
    );
  }

  // 4. Safe on-track SLA
  return (
    <span
      className={`inline-flex items-center font-medium rounded-lg bg-blue-50 text-blue-800 border border-blue-200 ${sizeClasses[size]}`}
      title={`Target resolution deadline: ${deadlineDate.toLocaleString()}`}
    >
      <Clock className="h-3.5 w-3.5 text-blue-600" />
      {formatDuration(diffMs)} to SLA
    </span>
  );
};
