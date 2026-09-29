import React, { useState } from 'react';
import { Copy, AlertCircle, Check, Search } from 'lucide-react';
import { complaintApi } from '../../services/complaintApi';

interface MarkDuplicateModalProps {
  complaintId: string;
  complaintNumber: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const MarkDuplicateModal: React.FC<MarkDuplicateModalProps> = ({
  complaintId,
  complaintNumber,
  isOpen,
  onClose,
  onSuccess
}) => {
  const [originalComplaintNumber, setOriginalComplaintNumber] = useState('');
  const [reason, setReason] = useState('Duplicate issue reported for the same location and problem.');
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [foundComplaint, setFoundComplaint] = useState<{ id: string; complaintNumber: string; title: string; location: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSearch = async () => {
    if (!originalComplaintNumber.trim()) return;
    try {
      setSearching(true);
      setError(null);
      setFoundComplaint(null);

      // Search by complaint number query
      const res = await complaintApi.getMany({ search: originalComplaintNumber.trim(), limit: 5 });
      if (res.success && res.data?.items?.length) {
        const exact = res.data.items.find(
          (c) => c.complaintNumber.toLowerCase() === originalComplaintNumber.trim().toLowerCase()
        ) || res.data.items[0];

        if (exact.id === complaintId) {
          setError('A complaint cannot be marked as a duplicate of itself.');
          return;
        }

        setFoundComplaint({
          id: exact.id,
          complaintNumber: exact.complaintNumber,
          title: exact.title,
          location: exact.location
        });
      } else {
        setError('No active complaint found matching that number.');
      }
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || 'Failed to search for complaint');
    } finally {
      setSearching(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!foundComplaint) {
      setError('Please search and verify the original complaint first.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await complaintApi.markDuplicate(complaintId, {
        originalComplaintId: foundComplaint.id,
        reason
      });

      if (res.success) {
        onSuccess();
        onClose();
      }
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || 'Failed to mark as duplicate');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-gray-100">
        <div className="flex items-center gap-2 text-indigo-600 mb-3">
          <Copy className="h-5 w-5" />
          <h3 className="text-lg font-bold text-gray-900">Mark as Duplicate</h3>
        </div>

        <p className="text-xs text-gray-500 mb-4">
          Linking <span className="font-mono font-semibold text-gray-800">#{complaintNumber}</span> to an original
          master ticket will close this complaint and redirect affected users to follow the primary ticket.
        </p>

        {error && (
          <div className="mb-4 flex items-start gap-2 rounded-lg bg-red-50 p-3 text-xs text-red-700 border border-red-200">
            <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Original Ticket Number (e.g. CMP-2026-0001)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={originalComplaintNumber}
                onChange={(e) => setOriginalComplaintNumber(e.target.value)}
                placeholder="Enter CMP-YYYY-XXXX"
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <button
                type="button"
                disabled={searching || !originalComplaintNumber.trim()}
                onClick={handleSearch}
                className="inline-flex items-center gap-1 rounded-lg bg-gray-100 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-200 transition disabled:opacity-50"
              >
                <Search className="h-3.5 w-3.5" />
                {searching ? 'Finding...' : 'Find'}
              </button>
            </div>
          </div>

          {/* Verified target preview */}
          {foundComplaint && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-3 text-xs space-y-1">
              <div className="flex items-center gap-1.5 text-emerald-800 font-semibold">
                <Check className="h-4 w-4 text-emerald-600" />
                Target Ticket Verified:
              </div>
              <p className="font-mono font-bold text-gray-900">{foundComplaint.complaintNumber}</p>
              <p className="font-medium text-gray-800">{foundComplaint.title}</p>
              <p className="text-gray-500">📍 {foundComplaint.location}</p>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Reason / Notes for Duplicate Linking
            </label>
            <textarea
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="mt-5 flex justify-end gap-2 pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !foundComplaint}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 transition disabled:opacity-50"
            >
              {loading ? 'Linking...' : 'Confirm & Mark Duplicate'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
