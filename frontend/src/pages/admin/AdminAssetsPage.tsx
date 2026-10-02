import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Plus, Search, QrCode, ShieldAlert, CheckCircle, Clock } from 'lucide-react';

export const AdminAssetsPage: React.FC = () => {
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'MAINTENANCE': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'BROKEN': return 'bg-rose-100 text-rose-700 border-rose-200';
      case 'RETIRED': return 'bg-slate-100 text-slate-700 border-slate-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const handleAddAsset = async () => {
    const assetCode = window.prompt("Enter Asset Code (e.g. AC-101):");
    if (!assetCode) return;
    const name = window.prompt("Enter Asset Name (e.g. Main Hall AC):");
    if (!name) return;
    const type = window.prompt("Enter Asset Type (e.g. HVAC, ELECTRICAL, PLUMBING):", "HVAC");
    if (!type) return;
    const location = window.prompt("Enter Location (e.g. Main Hall):");
    
    try {
      await api.post('/assets', {
        assetCode,
        qrCode: assetCode,
        name,
        type,
        location,
        status: 'ACTIVE'
      });
      fetchAssets();
    } catch (error) {
      console.error('Failed to create asset', error);
      alert('Failed to create asset');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Asset Management</h1>
          <p className="text-sm text-slate-500 mt-1">Track campus infrastructure and maintenance</p>
        </div>
        <button onClick={handleAddAsset} className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Asset
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search assets (ID, Name, QR)..."
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 font-medium">Asset ID / QR</th>
                <th className="px-6 py-3 font-medium">Name & Type</th>
                <th className="px-6 py-3 font-medium">Location</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium text-right">Maintenance Logs</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">Loading assets...</td>
                </tr>
              ) : assets.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">No assets found in the system.</td>
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
                      <div className="text-xs text-slate-500">{asset.type} • {asset.manufacturer}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-slate-700">{asset.location}</div>
                      {asset.department && <div className="text-xs text-slate-500">{asset.department.name}</div>}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(asset.status)}`}>
                        {asset.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-3 text-slate-500">
                        <div className="flex items-center gap-1" title="Complaints logged">
                          <ShieldAlert className="w-4 h-4" /> {asset._count?.complaints || 0}
                        </div>
                        <div className="flex items-center gap-1" title="Maintenance jobs">
                          <CheckCircle className="w-4 h-4" /> {asset._count?.maintenances || 0}
                        </div>
                      </div>
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
