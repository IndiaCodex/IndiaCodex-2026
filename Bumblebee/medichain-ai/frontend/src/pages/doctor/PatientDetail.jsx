import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { patientApi, recordsApi, prescriptionApi } from '../../services/api';
import { FileText, Pill, Brain } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function PatientDetail() {
  const { patientId } = useParams();

  const { data: patient } = useQuery({
    queryKey: ['patient', patientId],
    queryFn: () => patientApi.getById(patientId),
  });
  const { data: records } = useQuery({
    queryKey: ['records', patientId],
    queryFn: () => recordsApi.getAll(patientId),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">{patient?.user?.name || 'Patient'}</h2>
          <p className="text-slate-400 font-mono text-sm">{patient?.walletAddress?.substring(0, 25)}...</p>
        </div>
        <div className="flex gap-2">
          <Link to={`/doctor/diagnosis/${patientId}`}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm">
            <Brain className="w-4 h-4" /> AI Diagnosis
          </Link>
          <Link to={`/doctor/prescribe/${patientId}`}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm">
            <Pill className="w-4 h-4" /> Prescribe
          </Link>
        </div>
      </div>

      <div className="bg-slate-800/50 border border-slate-700 rounded-xl">
        <div className="p-4 border-b border-slate-700 flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-400" />
          <h3 className="text-white font-semibold">Medical History</h3>
        </div>
        <div className="divide-y divide-slate-700/50">
          {records?.map(r => (
            <div key={r.id} className="px-4 py-3">
              <div className="flex items-center justify-between">
                <span className="text-white text-sm font-medium">{r.diagnosis || 'No diagnosis'}</span>
                <span className="text-slate-500 text-xs">{new Date(r.createdAt).toLocaleDateString()}</span>
              </div>
              <p className="text-slate-400 text-xs mt-1">{r.recordType} · {r.notes}</p>
            </div>
          ))}
          {(!records || records.length === 0) && (
            <p className="px-4 py-8 text-center text-slate-500 text-sm">No records found</p>
          )}
        </div>
      </div>
    </div>
  );
}
