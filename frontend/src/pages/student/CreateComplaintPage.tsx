import React, { useState } from 'react';
import { complaintApi } from '../../services/complaintApi';
import { useNavigate } from 'react-router-dom';
import { Category, Priority } from '../../types';
import { Sparkles, MapPin, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';

export const CreateComplaintPage: React.FC = () => {
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [category, setCategory] = useState<Category | ''>('');
  const [priority, setPriority] = useState<Priority | ''>('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const res = await complaintApi.create({
        title,
        description,
        location,
        category: category || undefined,
        priority: priority || undefined
      });

      if (res.success && res.data) {
        navigate(`/student/complaints/${res.data.id}`);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to submit complaint.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center font-bold">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Report Campus Issue</h1>
            <p className="text-xs text-slate-500">AI will automatically analyze your description to recommend category & priority</p>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 mt-6">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Issue Title *</label>
            <input
              type="text"
              required
              minLength={3}
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Wi-Fi is not working in Computer Lab 3"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Location Details *</label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                required
                minLength={3}
                value={location}
                onChange={e => setLocation(e.target.value)}
                placeholder="e.g. Computer Lab 3, CS Block 2nd Floor"
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Detailed Description *</label>
            <textarea
              required
              minLength={10}
              rows={4}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Describe the issue clearly (e.g. 'Internet has stopped working since 9 AM. Lights on router are off and lab students cannot complete lab exam.')..."
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Category Override <span className="text-slate-400 font-normal">(Optional - AI auto-detects)</span>
              </label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value as any)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
              >
                <option value="">✨ Let AI Auto-Classify</option>
                <option value="IT_NETWORK">IT & Network Services</option>
                <option value="ELECTRICAL">Electrical Maintenance</option>
                <option value="PLUMBING">Plumbing & Sanitation</option>
                <option value="CLEANING">Housekeeping & Cleaning</option>
                <option value="HOSTEL">Hostel Facilities</option>
                <option value="CLASSROOM">Classroom Infrastructure</option>
                <option value="LABORATORY">Laboratory Equipment</option>
                <option value="LIBRARY">Library Facilities</option>
                <option value="SECURITY">Campus Security</option>
                <option value="TRANSPORT">Campus Transport</option>
                <option value="CANTEEN">Canteen & Food Hygiene</option>
                <option value="INFRASTRUCTURE">Building Infrastructure</option>
                <option value="OTHER">Other Issues</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Priority Level <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value as any)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
              >
                <option value="">✨ Let AI Predict Priority</option>
                <option value="LOW">Low - Minor inconvenience</option>
                <option value="MEDIUM">Medium - Standard issue</option>
                <option value="HIGH">High - Affects multiple students</option>
                <option value="CRITICAL">Critical - Safety hazard / Major outage</option>
              </select>
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs rounded-xl shadow-md transition flex items-center gap-2"
            >
              {isSubmitting ? 'Analyzing & Submitting...' : 'Submit & Analyze with AI'} <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
