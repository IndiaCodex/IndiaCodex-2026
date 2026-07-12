import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { aiApi, patientApi } from '../../services/api';
import { masumiAgents } from '../../services/masumi';
import { payForAIService, getConnectedMeshWallet, CARDANOSCAN_BASE } from '../../services/cardano';
import toast from 'react-hot-toast';
import { Brain, Clock, AlertTriangle, CheckCircle, ExternalLink, Zap } from 'lucide-react';

const URGENCY_COLORS = {
  LOW: 'text-green-400 bg-green-900/30 border-green-700',
  MODERATE: 'text-yellow-400 bg-yellow-900/30 border-yellow-700',
  HIGH: 'text-orange-400 bg-orange-900/30 border-orange-700',
  CRITICAL: 'text-red-400 bg-red-900/30 border-red-700',
};

export default function DiagnosisPage() {
  // Get patientId from URL params (e.g. /doctor/diagnosis/:patientId)
  const { patientId } = useParams();
  const [symptoms, setSymptoms] = useState([]);
  const [symptomInput, setSymptomInput] = useState('');
  const [result, setResult] = useState(null);
  const [workflowId, setWorkflowId] = useState(null);
  const [paymentTx, setPaymentTx] = useState(null);

  // Poll for diagnosis result every 3 seconds (SPEC-004 — async result fetch)
  const { data: pollData } = useQuery({
    queryKey: ['diagnosis-result', workflowId],
    queryFn: () => aiApi.getDiagnosisResult(workflowId),
    enabled: !!workflowId && !result,
    refetchInterval: 3000,
    onSuccess: data => {
      if (data?.status === 'COMPLETED' && data?.result?.diagnoses) {
        setResult(data.result);
        setWorkflowId(null);
        toast.success('AI diagnosis complete');
      }
    }
  });

  const { data: patient } = useQuery({
    queryKey: ['patient', patientId],
    queryFn: () => patientApi.getById(patientId),
  });

  const diagnosisMutation = useMutation({
    mutationFn: async data => {
      // STEP 1: Deduct real ADA from wallet (₳0.5 via Masumi protocol)
      const meshWallet = getConnectedMeshWallet();
      toast.loading(meshWallet ? 'Deducting ₳0.5 from wallet...' : 'Charging ₳0.5 via Masumi...', { id: 'ada-pay' });
      const payment = await payForAIService({
        serviceType: 'AI_DIAGNOSIS',
        amountAda: 0.5,
        description: `AI Diagnosis for patient ${data.patientId}`,
        patientId: data.patientId,
      });
      toast.dismiss('ada-pay');
      setPaymentTx(payment);

      if (payment.real) {
        toast.success(`✅ ₳0.5 deducted! TX: ${payment.txHash.slice(0, 12)}...`);
      } else {
        toast(`₳0.5 charged (demo) — connect Lace for real deduction`, { icon: '💳' });
      }

      // STEP 2: Run AI diagnosis via Ollama/Masumi
      toast.loading('Ollama qwen2.5 analyzing symptoms...', { id: 'masumi' });
      const result = await masumiAgents.diagnosis(
        data.patientId, data.symptoms, data.patientAge, data.patientGender
      );
      toast.dismiss('masumi');
      return { ...result, paymentTxHash: payment.txHash, paymentReal: payment.real };
    },
    onSuccess: data => {
      if (data?.workflowId && !data?.diagnoses) {
        setWorkflowId(data.workflowId);
        toast.success('AI agent working — polling for result');
      } else if (data?.diagnoses) {
        setResult(data);
        const model = data?.powered_by || 'Ollama qwen2.5:3b';
        toast.success(`✅ Diagnosis complete — ${model} — ₳0.5 ${data.paymentReal ? 'deducted from wallet' : 'charged'}`);
      }
    },
    onError: err => toast.error(err.message || 'Diagnosis failed'),
  });

  const addSymptom = () => {
    if (symptomInput.trim() && !symptoms.includes(symptomInput.trim())) {
      setSymptoms([...symptoms, symptomInput.trim()]);
      setSymptomInput('');
    }
  };

  const handleDiagnose = () => {
    if (symptoms.length === 0) {
      toast.error('Add at least one symptom');
      return;
    }
    diagnosisMutation.mutate({
      patientId,
      doctorId: null, // Doctor ID from auth context — not needed for Ollama
      symptoms,
      patientAge: patient?.user?.age || 35,
      patientGender: patient?.user?.gender || 'UNKNOWN',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-green-900/50 rounded-lg">
          <Brain className="w-6 h-6 text-green-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">AI Diagnosis Assistant</h2>
          <p className="text-slate-400 text-sm">Powered by Masumi AI Agent · ₳0.5 per query</p>
        </div>
      </div>

      {/* Symptom Input */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
        <label className="text-white font-medium mb-3 block">Enter Symptoms</label>
        <div className="flex gap-2 mb-4">
          <input
            value={symptomInput}
            onChange={e => setSymptomInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addSymptom()}
            placeholder="Type a symptom and press Enter..."
            className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-4 py-2.5 text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
          />
          <button onClick={addSymptom} className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
            Add
          </button>
        </div>

        {symptoms.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {symptoms.map(s => (
              <span key={s} className="flex items-center gap-2 px-3 py-1.5 bg-blue-900/50 text-blue-300 border border-blue-700 rounded-full text-sm">
                {s}
                <button onClick={() => setSymptoms(symptoms.filter(x => x !== s))} className="hover:text-white">×</button>
              </span>
            ))}
          </div>
        )}
      </div>

      <button
        onClick={handleDiagnose}
        disabled={diagnosisMutation.isPending || symptoms.length === 0}
        className="w-full py-3.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
      >
        {diagnosisMutation.isPending ? (
          <>
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            AI is analysing...
          </>
        ) : (
          <>
            <Brain className="w-5 h-5" />
            Get AI Diagnosis
          </>
        )}
      </button>

      {/* Results */}
      {result && (
        <div className="space-y-4">
          {/* Masumi ADA Payment proof */}
          {paymentTx && (
            <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${
              paymentTx.real ? 'bg-green-900/20 border-green-700' : 'bg-yellow-900/20 border-yellow-700'
            }`}>
              <Zap className={`w-4 h-4 ${paymentTx.real ? 'text-green-400' : 'text-yellow-400'}`} />
              <div className="flex-1 min-w-0">
                <span className={`text-sm font-semibold ${paymentTx.real ? 'text-green-300' : 'text-yellow-300'}`}>
                  ₳{paymentTx.amountAda} {paymentTx.real ? 'deducted from wallet ✅' : 'charged (demo)'}
                </span>
                {paymentTx.txHash && (
                  <p className="text-xs font-mono text-slate-400 truncate">{paymentTx.txHash}</p>
                )}
              </div>
              {paymentTx.cardanoScanUrl && (
                <a href={paymentTx.cardanoScanUrl} target="_blank" rel="noreferrer" className="text-blue-400 hover:text-blue-300 flex-shrink-0">
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
            </div>
          )}
          {/* Ollama model badge */}
          {result.powered_by && (
            <div className="flex items-center gap-2 px-3 py-2 bg-green-900/20 border border-green-700/50 rounded-lg text-sm">
              <span className="text-green-400 font-medium">🤖 {result.powered_by}</span>
              <span className="text-slate-400">· Masumi ₳0.5 charged · No API key needed</span>
            </div>
          )}
          {/* Overall Urgency Banner */}
          <div className={`flex items-center gap-3 p-4 border rounded-xl ${URGENCY_COLORS[result.overall_urgency]}`}>
            {result.overall_urgency === 'CRITICAL' ? (
              <AlertTriangle className="w-5 h-5" />
            ) : (
              <CheckCircle className="w-5 h-5" />
            )}
            <div>
              <p className="font-semibold">Overall Urgency: {result.overall_urgency}</p>
              <p className="text-sm opacity-80">{result.summary}</p>
            </div>
          </div>

          {/* Diagnoses */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl divide-y divide-slate-700">
            {result.diagnoses?.map((dx, i) => (
              <div key={i} className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="text-white font-semibold">{i + 1}. {dx.condition}</h4>
                    <p className="text-slate-400 text-sm">{dx.icd10_code}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-white font-bold">{Math.round(dx.confidence * 100)}%</div>
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${URGENCY_COLORS[dx.urgency]}`}>
                      {dx.urgency}
                    </span>
                  </div>
                </div>

                {/* Confidence Bar */}
                <div className="w-full bg-slate-700 rounded-full h-1.5 mb-3">
                  <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${dx.confidence * 100}%` }} />
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-slate-400 mb-1">Recommended Tests</p>
                    <ul className="space-y-1">
                      {dx.recommended_tests?.map(t => (
                        <li key={t} className="text-slate-300 flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 bg-blue-400 rounded-full" /> {t}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-slate-400 mb-1">Medicines</p>
                    <ul className="space-y-1">
                      {dx.recommended_medicines?.map(m => (
                        <li key={m} className="text-slate-300 flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 bg-green-400 rounded-full" /> {m}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Disclaimer */}
          <p className="text-slate-500 text-xs text-center">{result.disclaimer}</p>

          {/* Masumi charge */}
          <div className="flex items-center justify-between text-sm text-slate-400 bg-slate-800/30 rounded-lg px-4 py-2.5">
            <span className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Masumi AI Agent charged
            </span>
            <span className="text-green-400 font-medium">₳0.5 ADA</span>
          </div>
        </div>
      )}
    </div>
  );
}
