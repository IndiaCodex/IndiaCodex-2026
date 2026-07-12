import { useQuery } from '@tanstack/react-query';
import { adminApi } from '../../services/api';
import { Users, UserPlus } from 'lucide-react';

export default function StaffManagement() {
  const { data: staff } = useQuery({ queryKey: ['staff'], queryFn: adminApi.getStaff });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="w-6 h-6 text-green-400" />
          <h2 className="text-xl font-bold text-white">Staff Management</h2>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm">
          <UserPlus className="w-4 h-4" /> Add Staff
        </button>
      </div>
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl divide-y divide-slate-700/50">
        {staff?.map(doctor => (
          <div key={doctor.id} className="px-4 py-3 flex items-center gap-4">
            <div className="w-10 h-10 bg-green-900/50 rounded-full flex items-center justify-center text-green-400 font-bold">
              {doctor.user?.name?.[0] || 'D'}
            </div>
            <div className="flex-1">
              <p className="text-white font-medium">{doctor.user?.name || 'Doctor'}</p>
              <p className="text-slate-400 text-sm">{doctor.specialization}</p>
            </div>
            <div className="text-right">
              <span className={`text-xs px-2 py-0.5 rounded-full ${doctor.credentialsVerified ? 'bg-green-900/50 text-green-400' : 'bg-yellow-900/50 text-yellow-400'}`}>
                {doctor.credentialsVerified ? 'Verified' : 'Pending'}
              </span>
            </div>
          </div>
        ))}
        {(!staff || staff.length === 0) && (
          <p className="px-4 py-8 text-center text-slate-500 text-sm">No staff registered yet</p>
        )}
      </div>
    </div>
  );
}
