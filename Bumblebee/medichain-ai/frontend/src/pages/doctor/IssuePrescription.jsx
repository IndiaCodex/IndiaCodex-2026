import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { prescriptionApi } from '../../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { Pill, Plus, Trash2 } from 'lucide-react';

export default function IssuePrescription() {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const [medicines, setMedicines] = useState([{ name: '', dosage: '', frequency: 'Once daily', duration: '7 days' }]);
  const [notes, setNotes] = useState('');

  const mutation = useMutation({
    mutationFn: data => prescriptionApi.issue(data),
    onSuccess: () => {
      toast.success('Prescription NFT issued on Cardano!');
      navigate(-1);
    },
    onError: err => toast.error(err.response?.data?.detail || 'Failed to issue prescription'),
  });

  const addMedicine = () => setMedicines([...medicines, { name: '', dosage: '', frequency: 'Once daily', duration: '7 days' }]);
  const removeMedicine = i => setMedicines(medicines.filter((_, idx) => idx !== i));
  const updateMedicine = (i, field, value) => {
    const updated = [...medicines];
    updated[i][field] = value;
    setMedicines(updated);
  };

  const handleSubmit = () => {
    if (medicines.some(m => !m.name)) { toast.error('Fill all medicine names'); return; }
    mutation.mutate({ patientId, medicines, notes, validUntil: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0] });
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-blue-900/50 rounded-lg"><Pill className="w-6 h-6 text-blue-400" /></div>
        <div>
          <h2 className="text-xl font-bold text-white">Issue Prescription</h2>
          <p className="text-slate-400 text-sm">NFT will be minted on Cardano and sent to patient wallet</p>
        </div>
      </div>

      {medicines.map((med, i) => (
        <div key={i} className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-white font-medium">Medicine {i + 1}</span>
            {medicines.length > 1 && (
              <button onClick={() => removeMedicine(i)} className="text-red-400 hover:text-red-300">
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[['name','Medicine Name'],['dosage','Dosage'],['frequency','Frequency'],['duration','Duration']].map(([field, label]) => (
              <input key={field} placeholder={label} value={med[field]}
                onChange={e => updateMedicine(i, field, e.target.value)}
                className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-400 text-sm focus:outline-none focus:border-blue-500" />
            ))}
          </div>
        </div>
      ))}

      <button onClick={addMedicine} className="flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm">
        <Plus className="w-4 h-4" /> Add another medicine
      </button>

      <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notes for patient..."
        className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-400 resize-none h-24 focus:outline-none focus:border-blue-500" />

      <button onClick={handleSubmit} disabled={mutation.isPending}
        className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-xl">
        {mutation.isPending ? 'Minting NFT on Cardano...' : 'Issue Prescription NFT'}
      </button>
    </div>
  );
}
