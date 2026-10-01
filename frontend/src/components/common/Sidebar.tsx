import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  PlusCircle,
  ClipboardList,
  Wrench,
  Sparkles,
  BarChart3,
  Users,
  Building2,
  Package
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { user } = useAuth();
  const role = user?.role;

  const baseStyle = "flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all duration-150";
  const activeStyle = "bg-brand-50 text-brand-700 font-semibold border-l-4 border-brand-600 shadow-sm";
  const inactiveStyle = "text-slate-600 hover:bg-slate-50 hover:text-slate-900";

  return (
    <aside className="w-64 bg-white border-r border-slate-200 min-h-[calc(100vh-4rem)] p-4 hidden md:block">
      <div className="space-y-6">
        {/* STUDENT NAVIGATION */}
        {role === 'STUDENT' && (
          <div>
            <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Student Portal</p>
            <nav className="space-y-1">
              <NavLink
                to="/student/dashboard"
                className={({ isActive }) => `${baseStyle} ${isActive ? activeStyle : inactiveStyle}`}
              >
                <LayoutDashboard className="w-4 h-4" /> Dashboard
              </NavLink>
              <NavLink
                to="/student/complaints/new"
                className={({ isActive }) => `${baseStyle} ${isActive ? activeStyle : inactiveStyle}`}
              >
                <PlusCircle className="w-4 h-4 text-brand-600" /> Create Complaint
              </NavLink>
              <NavLink
                to="/student/complaints"
                className={({ isActive }) => `${baseStyle} ${isActive ? activeStyle : inactiveStyle}`}
              >
                <ClipboardList className="w-4 h-4" /> My Complaints
              </NavLink>
            </nav>
          </div>
        )}

        {/* TECHNICIAN NAVIGATION */}
        {role === 'TECHNICIAN' && (
          <div>
            <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Technician Portal</p>
            <nav className="space-y-1">
              <NavLink
                to="/technician/dashboard"
                className={({ isActive }) => `${baseStyle} ${isActive ? activeStyle : inactiveStyle}`}
              >
                <LayoutDashboard className="w-4 h-4" /> Dashboard
              </NavLink>
              <NavLink
                to="/technician/complaints"
                className={({ isActive }) => `${baseStyle} ${isActive ? activeStyle : inactiveStyle}`}
              >
                <Wrench className="w-4 h-4 text-sky-600" /> Assigned Tasks
              </NavLink>
              <NavLink
                to="/technician/maintenance"
                className={({ isActive }) => `${baseStyle} ${isActive ? activeStyle : inactiveStyle}`}
              >
                <Building2 className="w-4 h-4 text-emerald-600" /> Asset Maintenance
              </NavLink>
            </nav>
          </div>
        )}

        {/* ADMIN NAVIGATION */}
        {role === 'ADMIN' && (
          <div>
            <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Admin Control Center</p>
            <nav className="space-y-1">
              <NavLink
                to="/admin/dashboard"
                className={({ isActive }) => `${baseStyle} ${isActive ? activeStyle : inactiveStyle}`}
              >
                <LayoutDashboard className="w-4 h-4" /> System Overview
              </NavLink>
              <NavLink
                to="/admin/ai-review"
                className={({ isActive }) => `${baseStyle} ${isActive ? activeStyle : inactiveStyle}`}
              >
                <Sparkles className="w-4 h-4 text-purple-600" /> AI Review Queue
              </NavLink>
              <NavLink
                to="/admin/complaints"
                className={({ isActive }) => `${baseStyle} ${isActive ? activeStyle : inactiveStyle}`}
              >
                <ClipboardList className="w-4 h-4" /> All Complaints
              </NavLink>
              <NavLink
                to="/admin/work-orders"
                className={({ isActive }) => `${baseStyle} ${isActive ? activeStyle : inactiveStyle}`}
              >
                <Wrench className="w-4 h-4 text-sky-600" /> Work Orders
              </NavLink>
              <NavLink
                to="/admin/analytics"
                className={({ isActive }) => `${baseStyle} ${isActive ? activeStyle : inactiveStyle}`}
              >
                <BarChart3 className="w-4 h-4 text-indigo-600" /> Analytics & Trends
              </NavLink>
              <NavLink
                to="/admin/users"
                className={({ isActive }) => `${baseStyle} ${isActive ? activeStyle : inactiveStyle}`}
              >
                <Users className="w-4 h-4" /> User Directory
              </NavLink>
              <NavLink
                to="/admin/assets"
                className={({ isActive }) => `${baseStyle} ${isActive ? activeStyle : inactiveStyle}`}
              >
                <Building2 className="w-4 h-4 text-emerald-600" /> Assets & Maintenance
              </NavLink>
              <NavLink
                to="/admin/inventory"
                className={({ isActive }) => `${baseStyle} ${isActive ? activeStyle : inactiveStyle}`}
              >
                <Package className="w-4 h-4 text-amber-600" /> Spare Parts Inventory
              </NavLink>
            </nav>
          </div>
        )}

        {/* SYSTEM STATUS CARD */}
        <div className="pt-6 border-t border-slate-100">
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
            <div className="flex items-center justify-between mb-1">
              <span className="font-semibold text-slate-700">AI Service Status</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            </div>
            <p className="text-[10px] text-slate-500">FastAPI Model Active (campusfix-v1)</p>
          </div>
        </div>
      </div>
    </aside>
  );
};
