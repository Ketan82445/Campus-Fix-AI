import React, { useState, useEffect } from 'react';
import { workOrderApi } from '../../services/workOrderApi';
import { WorkOrder, WorkOrderMetrics } from '../../types';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import { Wrench, Plus, User, Clock, CheckCircle, Search, Filter } from 'lucide-react';
import { Link } from 'react-router-dom';

export const AdminWorkOrdersPage: React.FC = () => {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [metrics, setMetrics] = useState<WorkOrderMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      // For MVP, we might not have a getMany endpoint for work orders, let's assume we can fetch them or metrics
      const metricsRes = await workOrderApi.getMetrics();
      if (metricsRes.success) {
        setMetrics(metricsRes.data);
      }
      
      const res = await workOrderApi.getAll();
      if (res.success && res.data) {
        setWorkOrders(res.data.items);
      }
    } catch (error) {
      console.error('Failed to fetch work orders', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Wrench className="w-6 h-6 text-brand-600" />
            Work Order Dispatch
          </h1>
          <p className="text-sm text-slate-500 mt-1">Manage, assign, and track maintenance operations</p>
        </div>
      </div>

      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl shadow-xs border border-slate-200">
            <h3 className="text-xs font-semibold text-slate-500 mb-1">Active Work Orders</h3>
            <p className="text-2xl font-bold text-sky-600">{metrics.totalActive}</p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-xs border border-slate-200">
            <h3 className="text-xs font-semibold text-slate-500 mb-1">Completed Today</h3>
            <p className="text-2xl font-bold text-emerald-600">{metrics.completedToday}</p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-xs border border-slate-200">
            <h3 className="text-xs font-semibold text-slate-500 mb-1">Avg Completion Time</h3>
            <p className="text-2xl font-bold text-slate-700">{metrics.avgCompletionTimeHours.toFixed(1)} hrs</p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-xs border border-slate-200">
            <h3 className="text-xs font-semibold text-slate-500 mb-1">Pending Parts</h3>
            <p className="text-2xl font-bold text-amber-600">{metrics.pendingParts}</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <h2 className="font-semibold text-slate-800">All Work Orders</h2>
          <div className="flex gap-2">
            <button className="px-3 py-1.5 bg-white border border-slate-300 rounded-md text-xs font-medium text-slate-600 flex items-center gap-1">
              <Filter className="w-3 h-3" /> Filter
            </button>
          </div>
        </div>

        {isLoading ? (
          <LoadingSpinner />
        ) : workOrders.length === 0 ? (
          <EmptyState 
            title="No Work Orders" 
            description="There are currently no work orders active. You can create a work order from any complaint details page."
          />
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200">
                <th className="p-4 font-semibold">WO Number</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold">Technician</th>
                <th className="p-4 font-semibold">Created</th>
                <th className="p-4 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {workOrders.map((wo) => (
                <tr key={wo.id} className="hover:bg-slate-50 transition">
                  <td className="p-4 font-medium text-slate-800">{wo.workOrderNumber}</td>
                  <td className="p-4">
                    <span className="px-2 py-1 bg-sky-100 text-sky-700 rounded text-xs font-bold">{wo.status}</span>
                  </td>
                  <td className="p-4 text-sm text-slate-600 flex items-center gap-2">
                    <User className="w-4 h-4 text-slate-400" />
                    {wo.technician?.name || 'Unassigned'}
                  </td>
                  <td className="p-4 text-sm text-slate-500">
                    {new Date(wo.createdAt).toLocaleDateString()}
                  </td>
                  <td className="p-4">
                    <Link to={`/admin/work-orders/${wo.id}`} className="text-brand-600 hover:text-brand-700 font-semibold text-sm">
                      View Details
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
