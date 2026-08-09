'use client';

import { useState } from 'react';
import { Loader2, Navigation, CheckCircle2 } from 'lucide-react';

export default function GeoDropHome() {
  const [status, setStatus] = useState('idle'); // 'idle', 'loading', 'success', 'error'
  const [message, setMessage] = useState('');

  const requestAirdrop = async () => {
    setStatus('loading');
    setMessage('Verifying location...');

    try {
      const response = await fetch('/api/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userLat: 17.4399, userLon: 78.3496 }),
      });

      const data = await response.json();

      // We check for response.ok (status 200-299)
      if (response.ok) {
        setStatus('success');
        setMessage(data.message || "Location verified! Airdrop claimed.");
      } else {
        setStatus('error');
        setMessage(data.error || "Server rejected the request.");
      }
    } catch (err) {
      console.error("Fetch Error:", err);
      setStatus('error');
      setMessage("Could not connect to API.");
    }
  };

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6">
      <h1 className="text-4xl font-bold mb-8">GeoDrop Hyderabad</h1>

      <button
        onClick={requestAirdrop}
        className={`w-full max-w-xs py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${status === 'loading' ? 'bg-neutral-800' : 'bg-emerald-600 hover:bg-emerald-500'
          }`}
      >
        {status === 'loading' ? <Loader2 className="animate-spin" /> :
          status === 'success' ? <CheckCircle2 /> : <Navigation />}
        {status === 'loading' ? 'Verifying...' : 'Claim Airdrop'}
      </button>

      {message && (
        <p className={`mt-4 text-sm ${status === 'success' ? 'text-emerald-400' : 'text-red-400'}`}>
          {message}
        </p>
      )}
    </main>
  );
}