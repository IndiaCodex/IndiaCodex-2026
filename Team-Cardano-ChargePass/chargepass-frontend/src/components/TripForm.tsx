import React, { useState } from 'react';
import { MapPin, Battery, Car, Loader2, Clock, Activity } from 'lucide-react';

export interface TripData {
  tripDestination: string;
  batteryLevel: string;
  carModel: string;
  preferredTime: string;
  chargingPriority: string;
}

interface TripFormProps {
  onSubmit: (data: TripData) => void;
  isLoading: boolean;
}

export const TripForm: React.FC<TripFormProps> = ({ onSubmit, isLoading }) => {
  const [tripDestination, setTripDestination] = useState('');
  const [batteryLevel, setBatteryLevel] = useState('');
  const [carModel, setCarModel] = useState('');
  const [preferredTime, setPreferredTime] = useState('14:30');
  const [chargingPriority, setChargingPriority] = useState('Fastest Speed');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tripDestination || !batteryLevel || !carModel || !preferredTime || !chargingPriority) return;
    onSubmit({ tripDestination, batteryLevel, carModel, preferredTime, chargingPriority });
  };

  return (
    <form onSubmit={handleSubmit} className="glass-panel p-6 rounded-3xl w-full max-w-md mx-auto relative z-10 shadow-2xl">
      <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
        <MapPin className="text-cardano" /> Route Planner
      </h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Destination</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MapPin size={18} className="text-slate-500" />
            </div>
            <input
              type="text"
              value={tripDestination}
              onChange={(e) => setTripDestination(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-dark-900/50 border border-slate-700/50 rounded-xl text-white focus:ring-2 focus:ring-cardano focus:border-transparent transition-all outline-none"
              placeholder="e.g. San Francisco, CA"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Battery (%)</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Battery size={18} className="text-slate-500" />
              </div>
              <input
                type="number"
                min="1"
                max="100"
                value={batteryLevel}
                onChange={(e) => setBatteryLevel(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-dark-900/50 border border-slate-700/50 rounded-xl text-white focus:ring-2 focus:ring-cardano focus:border-transparent transition-all outline-none"
                placeholder="e.g. 45"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Arrival Time</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Clock size={18} className="text-slate-500" />
              </div>
              <input
                type="time"
                value={preferredTime}
                onChange={(e) => setPreferredTime(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-dark-900/50 border border-slate-700/50 rounded-xl text-white focus:ring-2 focus:ring-cardano focus:border-transparent transition-all outline-none"
                required
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Car Model</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Car size={18} className="text-slate-500" />
            </div>
            <input
              type="text"
              value={carModel}
              onChange={(e) => setCarModel(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-dark-900/50 border border-slate-700/50 rounded-xl text-white focus:ring-2 focus:ring-cardano focus:border-transparent transition-all outline-none"
              placeholder="e.g. Tesla Model 3"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Charging Priority</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Activity size={18} className="text-slate-500" />
            </div>
            <select
              value={chargingPriority}
              onChange={(e) => setChargingPriority(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-dark-900/50 border border-slate-700/50 rounded-xl text-white focus:ring-2 focus:ring-cardano focus:border-transparent transition-all outline-none appearance-none"
            >
              <option value="Fastest Speed">Fastest Speed</option>
              <option value="Eco Routing / Lowest Cost">Eco Routing / Lowest Cost</option>
              <option value="Grid Balanced">Grid Balanced</option>
            </select>
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading || !tripDestination || !batteryLevel || !carModel || !preferredTime}
        className="w-full mt-6 py-4 px-4 bg-gradient-to-r from-cardano to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-bold transition-all transform hover:-translate-y-1 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(59,130,246,0.4)] flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <>
            <Loader2 className="animate-spin" size={20} />
            Analyzing Route & Grid Load...
          </>
        ) : (
          'Find Optimal Charger'
        )}
      </button>
    </form>
  );
};
