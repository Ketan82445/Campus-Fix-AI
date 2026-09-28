import React from 'react';
import { Complaint } from '../../types';
import { StatusBadge, PriorityBadge, CategoryBadge } from '../common/Badge';
import { MapPin, Calendar, User, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export const ComplaintCard: React.FC<{ complaint: Complaint; detailPath: string }> = ({
  complaint,
  detailPath
}) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 hover:border-brand-300 shadow-2xs hover:shadow-md transition duration-200 p-5 flex flex-col justify-between">
      <div>
        {/* Header Badges */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <span className="font-mono text-xs font-semibold text-brand-700 bg-brand-50 px-2 py-0.5 rounded border border-brand-200">
            {complaint.complaintNumber}
          </span>
          <div className="flex items-center gap-1.5">
            <PriorityBadge priority={complaint.priority} />
            <StatusBadge status={complaint.status} />
          </div>
        </div>

        {/* Title & Description */}
        <Link to={detailPath} className="group">
          <h3 className="font-bold text-base text-slate-900 group-hover:text-brand-600 transition line-clamp-1 mb-1">
            {complaint.title}
          </h3>
        </Link>
        <p className="text-xs text-slate-600 line-clamp-2 mb-4">{complaint.description}</p>
      </div>

      {/* Footer Details */}
      <div className="pt-3 border-t border-slate-100 flex flex-col gap-2 text-xs text-slate-500">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
            <span className="truncate max-w-[180px] font-medium text-slate-700">{complaint.location}</span>
          </div>
          <CategoryBadge category={complaint.category} />
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            <span>{new Date(complaint.createdAt).toLocaleDateString()}</span>
          </div>

          <Link
            to={detailPath}
            className="inline-flex items-center gap-1 font-semibold text-brand-600 hover:text-brand-700 hover:underline"
          >
            View Details <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </div>
  );
};
