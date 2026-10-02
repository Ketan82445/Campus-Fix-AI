import React, { useState, useEffect } from 'react';
import { WorkOrder, User } from '../../types';
import { workOrderApi } from '../../services/workOrderApi';
import { userApi } from '../../services/userApi';
import { X, User as UserIcon, Calendar, Clock } from 'lucide-react';

interface Props {
  complaintId: string;
  onClose: () => void;
  onSuccess: (workOrder: WorkOrder) => void;
}

export const CreateWorkOrderModal: React.FC<Props> = ({ complaintId, onClose, onSuccess }) => {
  const [technicians, setTechnicians] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    technicianId: '',
    description: '',
    estimatedHours: '',
    priority: 'MEDIUM'
  });

  useEffect(() => {
    // Fetch available technicians
    const fetchTechs = async () => {
      try {
        const res = await userApi.getUsers('TECHNICIAN');
        if (res.success && res.data) {
          setTechnicians(res.data);
        }
      } catch (err) {
        console.error('Failed to load technicians', err);
      }
    };
    fetchTechs();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.technicianId || !formData.description) return;

    try {
      setIsLoading(true);
      const res = await workOrderApi.create({
        complaintId,
        technicianId: formData.technicianId,
        description: formData.description,
        estimatedHours: formData.estimatedHours ? parseFloat(formData.estimatedHours) : undefined,
        priority: formData.priority
      });

      if (res.success && res.data) {
        onSuccess(res.data);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to create work order.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-5 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-900">Create Work Order</h2>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Assign Technician</label>
            <div className="relative">
              <UserIcon className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <select
                required
                value={formData.technicianId}
                onChange={e => setFormData({ ...formData, technicianId: e.target.value })}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition"
              >
                <option value="">Select a technician...</option>
                {technicians.map(t => (
                  <option key={t.id} value={t.id}>{t.name} ({t.department?.name || 'General'})</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Work Instructions</label>
            <textarea
              required
              rows={3}
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition resize-none"
              placeholder="Provide detailed instructions for the technician..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider">Est. Hours</label>
                <button 
                  type="button" 
                  onClick={async () => {
                    const res = await workOrderApi.smartSchedule({ priority: formData.priority });
                    if (res.success && res.data) {
                      setFormData(prev => ({ ...prev, estimatedHours: res.data!.estimatedHours.toString() }));
                    }
                  }}
                  className="text-[10px] bg-indigo-50 text-indigo-600 font-bold px-2 py-0.5 rounded hover:bg-indigo-100"
                >
                  AI Suggest
                </button>
              </div>
              <div className="relative">
                <Clock className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  value={formData.estimatedHours}
                  onChange={e => setFormData({ ...formData, estimatedHours: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition"
                  placeholder="e.g. 2.5"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Priority</label>
              <select
                value={formData.priority}
                onChange={e => setFormData({ ...formData, priority: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>
          </div>

          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-white border border-slate-200 text-slate-700 font-semibold text-sm rounded-lg hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !formData.technicianId || !formData.description}
              className="flex-1 px-4 py-2 bg-brand-600 text-white font-semibold text-sm rounded-lg hover:bg-brand-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Creating...' : 'Create & Assign'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
