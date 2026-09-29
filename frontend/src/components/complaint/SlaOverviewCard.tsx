import React, { useState, useEffect } from 'react';
import { slaApi } from '../../services/slaApi';
import { SLAStats } from '../../types';
import { ShieldCheck, AlertCircle, Clock, RefreshCw, Zap, TrendingUp, AlertTriangle } from 'lucide-react';

interface SlaOverviewCardProps {
  onFilterBreached?: () => void;
  isAdmin?: boolean;
}

export const SlaOverviewCard: React.FC<SlaOverviewCardProps> = ({ onFilterBreached, isAdmin = false }) => {
  const [stats, setStats] = useState<SLAStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await slaApi.getStats();
      if (res.success && res.data) {
        setStats(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch SLA stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleRunEscalationScan = async () => {
    try {
      setScanning(true);
      setScanResult(null);
      const res = await slaApi.checkEscalations();
      if (res.success && res.data) {
        setScanResult(
          `Scanned ${res.data.checkedCount} tickets. ${res.data.breachedCount} breached, ${res.data.escalatedCount} escalations dispatched.`
        );
        await fetchStats();
      }
    } catch (err) {
      console.error('Escalation scan error:', err);
    } finally {
      setScanning(false);
    }
  };

  if (loading && !stats) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs animate-pulse">
        <div className="h-4 w-40 bg-slate-200 rounded mb-4"></div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="h-16 bg-slate-100 rounded-xl"></div>
          <div className="h-16 bg-slate-100 rounded-xl"></div>
          <div className="h-16 bg-slate-100 rounded-xl"></div>
          <div className="h-16 bg-slate-100 rounded-xl"></div>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">SLA Resolution & Escalations Tracking</h2>
            <p className="text-xs text-slate-500">Service Level Agreement compliance & proactive breach safeguards</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isAdmin && (
            <button
              type="button"
              disabled={scanning}
              onClick={handleRunEscalationScan}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-2xs transition disabled:opacity-50"
            >
              <Zap className={`w-3.5 h-3.5 ${scanning ? 'animate-spin' : ''}`} />
              {scanning ? 'Scanning...' : 'Trigger SLA Scan'}
            </button>
          )}

          <button
            type="button"
            onClick={fetchStats}
            title="Refresh stats"
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {scanResult && (
        <div className="p-3 bg-indigo-50 border border-indigo-200 text-indigo-900 rounded-xl text-xs flex items-center gap-2 animate-in fade-in">
          <Zap className="w-4 h-4 text-indigo-600 shrink-0" />
          <span>{scanResult}</span>
        </div>
      )}

      {/* Metric Tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Compliance Rate */}
        <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>SLA Compliance</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span
              className={`text-2xl font-black ${
                stats.complianceRate >= 90
                  ? 'text-emerald-700'
                  : stats.complianceRate >= 75
                  ? 'text-amber-700'
                  : 'text-rose-700'
              }`}
            >
              {stats.complianceRate}%
            </span>
            <span className="text-[11px] text-slate-400 font-medium">met on-time</span>
          </div>
        </div>

        {/* Breached Complaints */}
        <div
          onClick={onFilterBreached}
          className={`p-4 rounded-xl border transition ${
            stats.breachedTotal > 0
              ? 'bg-rose-50/80 border-rose-200 cursor-pointer hover:bg-rose-100/60'
              : 'bg-slate-50/80 border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-rose-700 font-semibold mb-1">
            <span>Overdue Breaches</span>
            <AlertCircle className={`w-4 h-4 ${stats.breachedTotal > 0 ? 'text-rose-600 animate-pulse' : 'text-slate-400'}`} />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className={`text-2xl font-black ${stats.breachedTotal > 0 ? 'text-rose-700' : 'text-slate-700'}`}>
              {stats.breachedTotal}
            </span>
            <span className="text-[11px] text-rose-600 font-medium">tickets</span>
          </div>
        </div>

        {/* At Risk Tickets (< 4h) */}
        <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-xs text-amber-700 font-semibold mb-1">
            <span>At Risk (&lt;4h)</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className={`text-2xl font-black ${stats.atRiskCount > 0 ? 'text-amber-700' : 'text-slate-700'}`}>
              {stats.atRiskCount}
            </span>
            <span className="text-[11px] text-slate-400 font-medium">urgent</span>
          </div>
        </div>

        {/* Total Active Under SLA */}
        <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>Active In-Flight</span>
            <Clock className="w-4 h-4 text-slate-400" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-slate-800">{stats.totalOpenWithSLA}</span>
            <span className="text-[11px] text-slate-400 font-medium">tickets</span>
          </div>
        </div>
      </div>

      {/* Breakdown by Priority */}
      {stats.byPriority && stats.byPriority.length > 0 && (
        <div className="pt-2 border-t border-slate-100 space-y-2.5">
          <h4 className="text-xs font-bold text-slate-700">Target Resolution Deadlines by Priority</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {stats.byPriority.map((p) => {
              const badgeColors: Record<string, string> = {
                CRITICAL: 'bg-rose-100 text-rose-800 border-rose-200',
                HIGH: 'bg-orange-100 text-orange-800 border-orange-200',
                MEDIUM: 'bg-amber-100 text-amber-800 border-amber-200',
                LOW: 'bg-emerald-100 text-emerald-800 border-emerald-200'
              };
              const targetHours: Record<string, string> = {
                CRITICAL: '4h resp / 12h res',
                HIGH: '8h resp / 24h res',
                MEDIUM: '24h resp / 48h res',
                LOW: '48h resp / 72h res'
              };

              return (
                <div key={p.priority} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-0.5 rounded font-bold text-[10px] border ${badgeColors[p.priority]}`}>
                      {p.priority}
                    </span>
                    <span className="text-[11px] font-bold text-slate-700">{p.complianceRate}% SLA</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-500">
                    <span>Target: {targetHours[p.priority]}</span>
                  </div>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        p.complianceRate >= 90 ? 'bg-emerald-500' : p.complianceRate >= 75 ? 'bg-amber-500' : 'bg-rose-500'
                      }`}
                      style={{ width: `${p.complianceRate}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>{p.total} total</span>
                    {p.breached > 0 && <span className="text-rose-600 font-bold">{p.breached} breached</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
