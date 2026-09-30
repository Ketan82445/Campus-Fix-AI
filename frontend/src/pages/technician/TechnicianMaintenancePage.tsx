import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Plus, Search, QrCode, PenTool, CheckCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const TechnicianMaintenancePage: React.FC = () => {
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchAssets();
  }, []);

  const fetchAssets = async () => {
    try {
      const response = await api.get('/assets');
      setAssets(response.data);
    } catch (error) {
      console.error('Failed to fetch assets', error);
    } finally {
      setLoading(false);
    }
  };

  const logMaintenance = async (assetId: string) => {
    const title = window.prompt("Enter maintenance title (e.g. 'Replaced AC filter'):");
    if (!title) return;

    try {
      await api.post(`/assets/${assetId}/maintenance`, {
        title,
        type: 'CORRECTIVE',
        status: 'IN_PROGRESS',
        technicianId: user?.id
      });
      alert('Maintenance job started! Check the asset details to complete it and log spare parts.');
      fetchAssets();
    } catch (error) {
      console.error('Failed to log maintenance', error);
      alert('Failed to log maintenance');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'MAINTENANCE': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'BROKEN': return 'bg-rose-100 text-rose-700 border-rose-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Maintenance & Assets</h1>
          <p className="text-sm text-slate-500 mt-1">Log repairs and manage physical infrastructure</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search assets to repair..."
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 font-medium">Asset ID</th>
                <th className="px-6 py-3 font-medium">Asset Info</th>
                <th className="px-6 py-3 font-medium">Location</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">Loading assets...</td>
                </tr>
              ) : assets.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">No assets found.</td>
                </tr>
              ) : (
                assets.map((asset) => (
                  <tr key={asset.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <QrCode className="w-4 h-4 text-slate-400" />
                        <span className="font-mono text-xs font-semibold text-slate-700">{asset.assetCode}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">{asset.name}</div>
                      <div className="text-xs text-slate-500">{asset.type}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-700">
                      {asset.location}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(asset.status)}`}>
                        {asset.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => logMaintenance(asset.id)}
                        className="inline-flex items-center gap-1 text-brand-600 hover:text-brand-700 font-medium text-sm"
                      >
                        <PenTool className="w-4 h-4" /> Log Repair
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
