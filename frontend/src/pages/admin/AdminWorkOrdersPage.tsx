import React, { useState, useEffect } from 'react';
import { workOrderApi } from '../../services/workOrderApi';
import { WorkOrder, WorkOrderMetrics } from '../../types';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import { Wrench, User, Clock, CheckCircle2, AlertCircle, Filter, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';

export const AdminWorkOrdersPage: React.FC = () => {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [metrics, setMetrics] = useState<WorkOrderMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [metricsRes, listRes] = await Promise.allSettled([
        workOrderApi.getMetrics(),
        workOrderApi.getAll()
      ]);

      if (metricsRes.status === 'fulfilled' && metricsRes.value?.success && metricsRes.value?.data) {
        setMetrics(metricsRes.value.data);
      }

      if (listRes.status === 'fulfilled' && listRes.value?.success && listRes.value?.data) {
        const rawList = listRes.value.data.workOrders || [];
        setWorkOrders(Array.isArray(rawList) ? rawList : []);
      }
    } catch (error) {
      console.error('Failed to fetch work orders data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredOrders = (workOrders || []).filter((wo) => {
    if (statusFilter === 'ALL') return true;
    return wo.status === statusFilter;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Wrench className="w-6 h-6 text-brand-600" />
            Work Order Operations
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Monitor technician assignments, operational checklists, and campus maintenance tasks
          </p>
        </div>
        <button
          onClick={fetchData}
          disabled={isLoading}
          className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl shadow-2xs transition flex items-center gap-1.5"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {/* Metrics Row */}
      {metrics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-2xl shadow-2xs border border-slate-200">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span>Active Work Orders</span>
              <Clock className="w-4 h-4 text-sky-500" />
            </div>
            <p className="text-2xl font-black text-sky-600">{metrics.active ?? 0}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl shadow-2xs border border-slate-200">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span>In Progress</span>
              <Wrench className="w-4 h-4 text-indigo-500" />
            </div>
            <p className="text-2xl font-black text-indigo-600">{metrics.inProgress ?? 0}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl shadow-2xs border border-slate-200">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span>Waiting for Parts</span>
              <AlertCircle className="w-4 h-4 text-amber-500" />
            </div>
            <p className="text-2xl font-black text-amber-600">{metrics.waitingParts ?? 0}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl shadow-2xs border border-slate-200">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span>Resolved</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
            <p className="text-2xl font-black text-emerald-600">{metrics.resolved ?? 0}</p>
          </div>
        </div>
      )}

      {/* Filter Tabs & Content */}
      <div className="bg-white rounded-2xl shadow-2xs border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
          <div className="flex flex-wrap gap-1.5">
            {['ALL', 'CREATED', 'ASSIGNED', 'IN_PROGRESS', 'WAITING_FOR_PARTS', 'RESOLVED', 'CLOSED'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  statusFilter === st
                    ? 'bg-brand-600 text-white shadow-2xs'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {st.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
          <span className="text-xs text-slate-500 font-mono">
            {filteredOrders.length} {filteredOrders.length === 1 ? 'Order' : 'Orders'}
          </span>
        </div>

        {isLoading ? (
          <LoadingSpinner message="Loading work orders..." />
        ) : filteredOrders.length === 0 ? (
          <EmptyState
            title="No Work Orders Found"
            description={
              statusFilter === 'ALL'
                ? 'No work orders have been created yet. Open any complaint ticket to assign a technician and generate a work order.'
                : `No work orders match the status filter "${statusFilter.replace(/_/g, ' ')}".`
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 uppercase tracking-wider border-b border-slate-200">
                  <th className="p-3.5 font-bold">WO Number</th>
                  <th className="p-3.5 font-bold">Complaint</th>
                  <th className="p-3.5 font-bold">Status</th>
                  <th className="p-3.5 font-bold">Assigned Technician</th>
                  <th className="p-3.5 font-bold">Created Date</th>
                  <th className="p-3.5 font-bold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOrders.map((wo) => (
                  <tr key={wo.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-3.5 font-mono font-bold text-slate-900">
                      {wo.workOrderNumber}
                    </td>
                    <td className="p-3.5">
                      {wo.complaint ? (
                        <div>
                          <p className="font-semibold text-slate-800 line-clamp-1">
                            {wo.complaint.title}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            #{wo.complaint.complaintNumber} • {wo.complaint.location}
                          </p>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Linked complaint</span>
                      )}
                    </td>
                    <td className="p-3.5">
                      <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
                        {wo.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>{wo.technician?.name || 'Unassigned'}</span>
                      </div>
                    </td>
                    <td className="p-3.5 text-slate-500">
                      {wo.createdAt ? new Date(wo.createdAt).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="p-3.5 text-right">
                      {wo.complaint?.id && (
                        <Link
                          to={`/student/complaints/${wo.complaint.id}`}
                          className="text-brand-600 hover:text-brand-700 font-bold text-xs hover:underline"
                        >
                          View Details &rarr;
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
