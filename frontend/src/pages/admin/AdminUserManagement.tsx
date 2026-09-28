import React, { useState, useEffect } from 'react';
import { userApi } from '../../services/userApi';
import { User, Role } from '../../types';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Users, Shield, Wrench, GraduationCap, Mail, Phone } from 'lucide-react';

export const AdminUserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    userApi.getUsers(roleFilter !== 'ALL' ? roleFilter : undefined)
      .then(res => {
        if (res.success && res.data) setUsers(res.data);
      })
      .finally(() => setIsLoading(false));
  }, [roleFilter]);

  if (isLoading) return <LoadingSpinner message="Loading user directory..." />;

  const getRoleIcon = (role: Role) => {
    if (role === 'ADMIN') return <Shield className="w-4 h-4 text-purple-600" />;
    if (role === 'TECHNICIAN') return <Wrench className="w-4 h-4 text-sky-600" />;
    return <GraduationCap className="w-4 h-4 text-indigo-600" />;
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">System User Directory</h1>
            <p className="text-xs text-slate-500 mt-0.5">Manage students, technicians, and administrative roles</p>
          </div>
        </div>

        <div className="flex gap-2">
          {['ALL', 'STUDENT', 'TECHNICIAN', 'ADMIN'].map(r => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                roleFilter === r
                  ? 'bg-brand-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                <th className="p-3.5">User</th>
                <th className="p-3.5">Role</th>
                <th className="p-3.5">Department</th>
                <th className="p-3.5">Contact Phone</th>
                <th className="p-3.5">Registered</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-slate-50/50">
                  <td className="p-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center">
                        {getRoleIcon(u.role)}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">{u.name}</p>
                        <p className="text-[10px] text-slate-500 font-mono">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-3.5">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                        u.role === 'ADMIN'
                          ? 'bg-purple-100 text-purple-800'
                          : u.role === 'TECHNICIAN'
                          ? 'bg-sky-100 text-sky-800'
                          : 'bg-indigo-100 text-indigo-800'
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="p-3.5 text-slate-700 font-medium">
                    {u.department?.name || 'N/A'}
                  </td>
                  <td className="p-3.5 font-mono text-slate-600">
                    {u.phone || '—'}
                  </td>
                  <td className="p-3.5 text-slate-400 text-[11px]">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
