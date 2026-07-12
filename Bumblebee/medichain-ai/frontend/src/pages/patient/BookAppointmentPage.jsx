/**
 * Book Appointment Page — Scenario 2 of Demo Workflow
 * Patient books appointment, AI suggests most relevant doctor
 */
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { appointmentApi, patientApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Calendar, Clock, User, Zap, CheckCircle2, Loader2, Stethoscope } from 'lucide-react';
import toast from 'react-hot-toast';

const SPECIALIZATIONS = [
  { value: 'CARDIOLOGY', label: 'Cardiology', symptoms: ['chest pain', 'palpitations', 'shortness of breath'] },
  { value: 'NEUROLOGY', label: 'Neurology', symptoms: ['headache', 'dizziness', 'numbness'] },
  { value: 'GENERAL', label: 'General Medicine', symptoms: ['fever', 'cough', 'fatigue'] },
  { value: 'ORTHOPEDICS', label: 'Orthopedics', symptoms: ['joint pain', 'back pain', 'fracture'] },
  { value: 'PSYCHIATRY', label: 'Psychiatry', symptoms: ['anxiety', 'depression', 'sleep issues'] },
];

const TIME_SLOTS = [
  '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM',
  '11:00 AM', '11:30 AM', '02:00 PM', '02:30 PM',
  '03:00 PM', '03:30 PM', '04:00 PM',
];

export default function BookAppointmentPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [symptoms, setSymptoms] = useState('');
  const [aiSuggestion, setAiSuggestion] = useState(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [booked, setBooked] = useState(null);

  const { data: profile } = useQuery({ queryKey: ['my-profile'], queryFn: patientApi.getProfile });
  const { data: doctors = [] } = useQuery({ queryKey: ['all-doctors'], queryFn: appointmentApi.getDoctors });

  const bookMutation = useMutation({
    mutationFn: appointmentApi.book,
    onSuccess: (data) => {
      setBooked(data);
      toast.success('✅ Appointment booked!');
      queryClient.invalidateQueries({ queryKey: ['my-appointments'] });
    },
    onError: err => toast.error(err.response?.data?.message || 'Booking failed'),
  });

  const getAiSuggestion = async () => {
    if (!symptoms.trim()) { toast.error('Enter your symptoms first'); return; }
    setLoadingAi(true);
    try {
      const res = await fetch('/api/v1/ai/support', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          message: `Based on symptoms: "${symptoms}", which medical specialization should I book? Reply with just the specialization name and 1 sentence explanation.`
        }),
      });
      const data = await res.json();
      const responseText = data.response || '';

      // Parse specialization from AI response
      const matched = SPECIALIZATIONS.find(s =>
        responseText.toUpperCase().includes(s.value) ||
        responseText.toLowerCase().includes(s.label.toLowerCase())
      ) || SPECIALIZATIONS[2];

      setAiSuggestion({
        specialization: matched,
        explanation: data.response,
        poweredBy: data.powered_by,
      });

      // Filter and suggest doctors
      const relevant = doctors.filter(d =>
        d.specialization?.toUpperCase().includes(matched.value) ||
        matched.value === 'GENERAL'
      );
      if (relevant.length > 0) setSelectedDoctor(relevant[0]);

    } catch {
      toast.error('AI suggestion failed — select doctor manually');
    } finally {
      setLoadingAi(false);
    }
  };

  const handleBook = () => {
    if (!selectedDoctor || !selectedDate || !selectedTime) {
      toast.error('Select doctor, date, and time');
      return;
    }
    const dateTime = new Date(`${selectedDate}T${convertTo24(selectedTime)}`);
    bookMutation.mutate({
      patientId: profile?.id,
      doctorId: selectedDoctor.id,
      scheduledAt: dateTime.toISOString(),
      notes: symptoms,
    });
  };

  const convertTo24 = (time12) => {
    const [time, period] = time12.split(' ');
    let [hours, minutes] = time.split(':');
    hours = Number.parseInt(hours, 10);
    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    return `${String(hours).padStart(2, '0')}:${minutes}:00`;
  };

  if (booked) {
    return (
      <div className="max-w-lg mx-auto text-center py-12 space-y-4">
        <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-white">Appointment Booked!</h2>
        <div className="bg-slate-800/50 border border-green-700 rounded-2xl p-5 text-left space-y-3">
          <div className="flex justify-between">
            <span className="text-slate-400 text-sm">Doctor</span>
            <span className="text-white text-sm font-medium">{selectedDoctor?.user?.name || 'Dr. Assigned'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400 text-sm">Date & Time</span>
            <span className="text-white text-sm font-medium">{selectedDate} · {selectedTime}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400 text-sm">Appointment ID</span>
            <span className="text-blue-300 font-mono text-xs">{booked.id?.toString().slice(0, 8)}...</span>
          </div>
        </div>
        <button onClick={() => setBooked(null)} className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl">
          Book Another
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-start gap-4">
        <div className="p-3 bg-teal-900/50 rounded-xl">
          <Calendar className="w-7 h-7 text-teal-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Book Appointment</h1>
          <p className="text-slate-400 mt-1">Describe your symptoms — AI suggests the right specialist</p>
        </div>
      </div>

      {/* Symptoms + AI suggestion */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-5 space-y-4">
        <h3 className="text-white font-semibold flex items-center gap-2">
          <Zap className="w-4 h-4 text-green-400" />
          What are your symptoms?
        </h3>
        <div className="flex gap-3">
          <input
            value={symptoms}
            onChange={e => setSymptoms(e.target.value)}
            placeholder="e.g. chest pain, fatigue, shortness of breath..."
            className="flex-1 bg-slate-700 border border-slate-600 rounded-xl px-3 py-2.5 text-white placeholder-slate-400 text-sm focus:outline-none focus:border-green-500"
          />
          <button
            onClick={getAiSuggestion}
            disabled={loadingAi || !symptoms.trim()}
            className="px-4 py-2.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-medium rounded-xl flex items-center gap-2 transition-colors flex-shrink-0 text-sm"
          >
            {loadingAi ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
            AI Suggest
          </button>
        </div>

        {aiSuggestion && (
          <div className="bg-green-900/20 border border-green-700 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-green-400" />
              <span className="text-green-300 font-semibold text-sm">AI Recommendation</span>
              <span className="text-xs text-slate-500">{aiSuggestion.poweredBy}</span>
            </div>
            <p className="text-white font-medium">→ {aiSuggestion.specialization.label}</p>
            <p className="text-slate-400 text-sm mt-1 line-clamp-2">{aiSuggestion.explanation}</p>
          </div>
        )}
      </div>

      {/* Doctor selection */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-5 space-y-4">
        <h3 className="text-white font-semibold flex items-center gap-2">
          <Stethoscope className="w-4 h-4 text-blue-400" />
          Select Doctor
        </h3>
        {doctors.length === 0 ? (
          /* Demo doctors when none in DB */
          <div className="space-y-3">
            {[
              { name: 'Dr. Rajesh Kumar', spec: 'Cardiology', exp: '12 yrs', rating: 4.9 },
              { name: 'Dr. Priya Sharma', spec: 'General Medicine', exp: '8 yrs', rating: 4.7 },
              { name: 'Dr. Arjun Nair', spec: 'Neurology', exp: '15 yrs', rating: 4.8 },
            ].map((d, i) => (
              <button
                key={i}
                onClick={() => setSelectedDoctor({ id: `demo-${i}`, ...d })}
                className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-colors text-left ${
                  selectedDoctor?.id === `demo-${i}`
                    ? 'border-blue-600 bg-blue-900/20'
                    : 'border-slate-700 hover:border-slate-500'
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-blue-900/50 flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-blue-400" />
                </div>
                <div className="flex-1">
                  <p className="text-white font-medium text-sm">{d.name}</p>
                  <p className="text-slate-400 text-xs">{d.spec} · {d.exp} experience</p>
                </div>
                <div className="text-right">
                  <p className="text-yellow-400 text-sm">★ {d.rating}</p>
                  {aiSuggestion?.specialization.label === d.spec && (
                    <span className="text-xs text-green-400">AI Pick ✓</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {doctors.map(d => (
              <button
                key={d.id}
                onClick={() => setSelectedDoctor(d)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-colors text-left ${
                  selectedDoctor?.id === d.id
                    ? 'border-blue-600 bg-blue-900/20'
                    : 'border-slate-700 hover:border-slate-500'
                }`}
              >
                <User className="w-5 h-5 text-blue-400 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-white text-sm font-medium">{d.user?.name}</p>
                  <p className="text-slate-400 text-xs">{d.specialization}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Date + Time */}
      {selectedDoctor && (
        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-5 space-y-4">
          <h3 className="text-white font-semibold flex items-center gap-2">
            <Clock className="w-4 h-4 text-teal-400" />
            Select Date & Time
          </h3>
          <input
            type="date"
            value={selectedDate}
            min={new Date().toISOString().split('T')[0]}
            onChange={e => setSelectedDate(e.target.value)}
            className="w-full bg-slate-700 border border-slate-600 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-teal-500"
          />
          {selectedDate && (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {TIME_SLOTS.map(t => (
                <button
                  key={t}
                  onClick={() => setSelectedTime(t)}
                  className={`py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedTime === t
                      ? 'bg-teal-600 text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Book button */}
      {selectedDoctor && selectedDate && selectedTime && (
        <button
          onClick={handleBook}
          disabled={bookMutation.isPending}
          className="w-full py-3.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-semibold rounded-2xl flex items-center justify-center gap-2 transition-colors"
        >
          {bookMutation.isPending
            ? <><Loader2 className="w-5 h-5 animate-spin" /> Booking...</>
            : <><CheckCircle2 className="w-5 h-5" /> Confirm Appointment</>
          }
        </button>
      )}
    </div>
  );
}
