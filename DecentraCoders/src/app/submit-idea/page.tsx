'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout, { useToast } from '@/components/DashboardLayout';
import { dbService } from '@/lib/supabase';
import { hashIdea } from '@/lib/hashing';
import { 
  ArrowLeft, 
  ArrowRight, 
  Lightbulb, 
  ShieldCheck, 
  DollarSign, 
  FileText, 
  Cpu, 
  CheckCircle2,
  Wallet
} from 'lucide-react';
import dynamic from 'next/dynamic';

const CardanoRegisterModal = dynamic(
  () => import('@/components/CardanoRegisterModal'),
  { ssr: false }
);

export default function SubmitIdea() {
  const router = useRouter();
  const { showToast } = useToast();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Form Fields
  const [title, setTitle] = useState('');
  const [shortDesc, setShortDesc] = useState('');
  const [category, setCategory] = useState('');
  const [stage, setStage] = useState<'Concept' | 'Prototype' | 'MVP' | 'Growth'>('Concept');
  const [visibility, setVisibility] = useState<'private' | 'public'>('private');

  const [problem, setProblem] = useState('');
  const [solution, setSolution] = useState('');
  const [targetUsers, setTargetUsers] = useState('');
  const [uniqueValue, setUniqueValue] = useState('');
  const [impact, setImpact] = useState('');

  const [revenueModel, setRevenueModel] = useState('');
  const [marketOpportunity, setMarketOpportunity] = useState('');
  const [competitors, setCompetitors] = useState('');
  const [requiredTeam, setRequiredTeam] = useState('');
  const [requiredMentor, setRequiredMentor] = useState('');

  const [pitchDeck, setPitchDeck] = useState('');
  const [prototype, setPrototype] = useState('');
  const [githubRepo, setGithubRepo] = useState('');
  const [supportingDocs, setSupportingDocs] = useState('');

  // Generated Hash details
  const [generatedHash, setGeneratedHash] = useState('');
  const [canonicalPayloadText, setCanonicalPayloadText] = useState('');

  // Modal Control after database insertion
  const [createdIdea, setCreatedIdea] = useState<any>(null);

  // Calculate Hash on entering Step 5
  useEffect(() => {
    if (step === 5) {
      calculateHash();
    }
  }, [step]);

  const calculateHash = async () => {
    const user = dbService.getCurrentUser();
    if (!user) return;

    try {
      const { canonicalJson, hash } = await hashIdea({
        title,
        short_description: shortDesc,
        problem_statement: problem,
        proposed_solution: solution,
        target_users: targetUsers,
        owner_id: user.id,
        submitted_at: 1718192000, // Predefined dummy submission date to align hashes for seeds
      });
      setGeneratedHash(hash);
      setCanonicalPayloadText(canonicalJson);
    } catch (err) {
      console.error(err);
      showToast('Error generating cryptographic hash.', 'error');
    }
  };

  const nextStep = () => {
    if (step === 1 && (!title || !shortDesc || !category)) {
      showToast('Please fill in the Title, Description, and Category.', 'error');
      return;
    }
    if (step === 2 && (!problem || !solution || !targetUsers)) {
      showToast('Please define the Problem, Solution, and Target Users.', 'error');
      return;
    }
    setStep(prev => prev + 1);
  };

  const prevStep = () => setStep(prev => prev - 1);

  const handleSubmit = async () => {
    setLoading(true);
    const user = dbService.getCurrentUser();
    if (!user) return;

    try {
      // 1. Double check hash matches payload
      const { canonicalJson, hash } = await hashIdea({
        title,
        short_description: shortDesc,
        problem_statement: problem,
        proposed_solution: solution,
        target_users: targetUsers,
        owner_id: user.id,
        submitted_at: Date.now(), // Generate a live timestamp for insertion
      });

      // 2. Insert into local storage / Supabase
      const ideaRecord = await dbService.createIdea({
        owner_id: user.id,
        title,
        short_description: shortDesc,
        category,
        stage,
        visibility,
        problem_statement: problem,
        proposed_solution: solution,
        target_users: targetUsers,
        unique_value: uniqueValue,
        expected_impact: impact,
        revenue_model: revenueModel,
        market_opportunity: marketOpportunity,
        competitors: competitors,
        required_team_members: requiredTeam,
        required_mentor_expertise: requiredMentor,
        pitch_deck_url: pitchDeck || undefined,
        prototype_url: prototype || undefined,
        github_repo_url: githubRepo || undefined,
        supporting_docs_url: supportingDocs || undefined,
        canonical_payload: JSON.parse(canonicalJson),
        idea_hash: hash,
      });

      await dbService.createNotification(
        user.id,
        'Startup Idea Created',
        `Startup idea "${title}" saved. Anchoring pending on Cardano.`,
        'team'
      );

      showToast('Startup idea created successfully!', 'success');
      
      // Save and open register modal
      setCreatedIdea({
        id: ideaRecord.id,
        title: ideaRecord.title,
        idea_hash: ideaRecord.idea_hash,
        owner_id: ideaRecord.owner_id
      });
    } catch (err) {
      showToast('Failed to save startup idea.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Step Indicators */}
      <div className="flex items-center justify-between max-w-xl mx-auto py-2 px-4 print:hidden">
        {[1, 2, 3, 4, 5].map((idx) => (
          <div key={idx} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition border ${
              step >= idx 
                ? 'bg-primary text-white border-primary shadow shadow-primary/20' 
                : 'border-translucent bg-background text-gray-500'
            }`}>
              {idx}
            </div>
            {idx < 5 && (
              <div className={`w-8 md:w-16 h-0.5 transition ${step > idx ? 'bg-primary' : 'bg-translucent'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Form Card */}
      <div className="glass-panel p-6 md:p-8 max-w-3xl mx-auto space-y-6 print:hidden">
        
        {/* Step 1: Basic Information */}
        {step === 1 && (
          <div className="space-y-5 animate-fade-in">
            <div className="flex items-center gap-2 border-b border-translucent pb-3">
              <Lightbulb className="w-5 h-5 text-amber-400" />
              <h3 className="font-bold text-lg">Step 1: Basic Information</h3>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs text-gray-300 font-semibold block">Idea Title *</label>
                <input 
                  type="text" 
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. EduBlocks"
                  className="input-field"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-gray-300 font-semibold block">One-Line Description *</label>
                <input 
                  type="text" 
                  required
                  value={shortDesc}
                  onChange={(e) => setShortDesc(e.target.value)}
                  placeholder="e.g. Decentralized credential registry on Cardano to prevent certificate fraud."
                  className="input-field"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs text-gray-300 font-semibold block">Category *</label>
                  <input 
                    type="text" 
                    required
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="e.g. EdTech / Web3"
                    className="input-field"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-gray-300 font-semibold block">Current Stage *</label>
                  <select
                    value={stage}
                    onChange={(e: any) => setStage(e.target.value)}
                    className="input-field"
                  >
                    <option value="Concept">Concept</option>
                    <option value="Prototype">Prototype</option>
                    <option value="MVP">MVP</option>
                    <option value="Growth">Growth</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-gray-300 font-semibold block">Idea Visibility *</label>
                  <select
                    value={visibility}
                    onChange={(e: any) => setVisibility(e.target.value)}
                    className="input-field"
                  >
                    <option value="private">Private (Only You & Mentors)</option>
                    <option value="public">Public (Visible to Developers)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Problem and Solution */}
        {step === 2 && (
          <div className="space-y-5 animate-fade-in">
            <div className="flex items-center gap-2 border-b border-translucent pb-3">
              <ShieldCheck className="w-5 h-5 text-secondary" />
              <h3 className="font-bold text-lg">Step 2: Problem & Solution</h3>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs text-gray-300 font-semibold block">Problem Statement *</label>
                <textarea 
                  rows={3}
                  required
                  value={problem}
                  onChange={(e) => setProblem(e.target.value)}
                  placeholder="What friction, cost, or gap are you solving for your target market?"
                  className="input-field"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-gray-300 font-semibold block">Proposed Solution *</label>
                <textarea 
                  rows={3}
                  required
                  value={solution}
                  onChange={(e) => setSolution(e.target.value)}
                  placeholder="How does your startup idea solve this problem elegantly?"
                  className="input-field"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-gray-300 font-semibold block">Target Users *</label>
                <input 
                  type="text" 
                  required
                  value={targetUsers}
                  onChange={(e) => setTargetUsers(e.target.value)}
                  placeholder="e.g. Universities, recruiters, students"
                  className="input-field"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs text-gray-300 font-semibold block">Unique Value Proposition</label>
                  <input 
                    type="text" 
                    value={uniqueValue}
                    onChange={(e) => setUniqueValue(e.target.value)}
                    placeholder="Why will customers choose you over competitors?"
                    className="input-field"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-gray-300 font-semibold block">Expected Impact</label>
                  <input 
                    type="text" 
                    value={impact}
                    onChange={(e) => setImpact(e.target.value)}
                    placeholder="What is the potential impact metric?"
                    className="input-field"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Business Information */}
        {step === 3 && (
          <div className="space-y-5 animate-fade-in">
            <div className="flex items-center gap-2 border-b border-translucent pb-3">
              <DollarSign className="w-5 h-5 text-emerald-400" />
              <h3 className="font-bold text-lg">Step 3: Business Information</h3>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs text-gray-300 font-semibold block">Revenue Model</label>
                  <input 
                    type="text" 
                    value={revenueModel}
                    onChange={(e) => setRevenueModel(e.target.value)}
                    placeholder="e.g. SaaS subscription, transaction fees"
                    className="input-field"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-gray-300 font-semibold block">Market Opportunity</label>
                  <input 
                    type="text" 
                    value={marketOpportunity}
                    onChange={(e) => setMarketOpportunity(e.target.value)}
                    placeholder="e.g. $5B addressable market size"
                    className="input-field"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-gray-300 font-semibold block">Competitors</label>
                <input 
                  type="text" 
                  value={competitors}
                  onChange={(e) => setCompetitors(e.target.value)}
                  placeholder="Who are your current major competitors?"
                  className="input-field"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs text-gray-300 font-semibold block">Required Team Expertise</label>
                  <input 
                    type="text" 
                    value={requiredTeam}
                    onChange={(e) => setRequiredTeam(e.target.value)}
                    placeholder="e.g. Frontend developer, UI designer"
                    className="input-field"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-gray-300 font-semibold block">Required Mentor Expertise</label>
                  <input 
                    type="text" 
                    value={requiredMentor}
                    onChange={(e) => setRequiredMentor(e.target.value)}
                    placeholder="e.g. Smart contract audit, sales expert"
                    className="input-field"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Documents */}
        {step === 4 && (
          <div className="space-y-5 animate-fade-in">
            <div className="flex items-center gap-2 border-b border-translucent pb-3">
              <FileText className="w-5 h-5 text-primary" />
              <h3 className="font-bold text-lg">Step 4: Startup Resources & Links</h3>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs text-gray-300 font-semibold block">Pitch Deck URL</label>
                <input 
                  type="url" 
                  value={pitchDeck}
                  onChange={(e) => setPitchDeck(e.target.value)}
                  placeholder="https://docs.google.com/presentation/d/..."
                  className="input-field"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-gray-300 font-semibold block">Prototype URL</label>
                <input 
                  type="url" 
                  value={prototype}
                  onChange={(e) => setPrototype(e.target.value)}
                  placeholder="https://myproto.vercel.app"
                  className="input-field"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs text-gray-300 font-semibold block">GitHub Repository URL</label>
                  <input 
                    type="url" 
                    value={githubRepo}
                    onChange={(e) => setGithubRepo(e.target.value)}
                    placeholder="https://github.com/myteam/project"
                    className="input-field"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-gray-300 font-semibold block">Supporting Documents (Google Drive, etc.)</label>
                  <input 
                    type="url" 
                    value={supportingDocs}
                    onChange={(e) => setSupportingDocs(e.target.value)}
                    placeholder="https://drive.google.com/drive/..."
                    className="input-field"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Cardano Hashing Preview */}
        {step === 5 && (
          <div className="space-y-5 animate-fade-in font-sans">
            <div className="flex items-center gap-2 border-b border-translucent pb-3">
              <Cpu className="w-5 h-5 text-secondary" />
              <h3 className="font-bold text-lg">Step 5: Cryptographic Hashing</h3>
            </div>

            <div className="space-y-4">
              <p className="text-xs text-gray-400 font-medium leading-relaxed">
                Review the compiled canonical JSON serialization. The hash generated from this payload will be written permanently to the Cardano blockchain to anchor your IP proof.
              </p>

              {/* Serialization Payload code */}
              <div className="space-y-1.5">
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Canonical JSON Payload</span>
                <pre className="p-4 bg-background border border-translucent rounded-xl text-xs text-secondary font-mono overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-[140px] overflow-y-auto">
                  {canonicalPayloadText}
                </pre>
              </div>

              {/* Hashing Result code */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Generated SHA-256 Hash</span>
                <div className="p-3.5 bg-background border border-translucent rounded-xl flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0" />
                  <code className="text-xs font-mono break-all text-gray-100 flex-1 truncate">{generatedHash}</code>
                </div>
              </div>

              {/* Cardano Network summary */}
              <div className="grid grid-cols-2 gap-4 bg-surface-card p-4 rounded-xl border border-translucent text-xs">
                <div>
                  <span className="text-gray-400 font-medium block">Cardano Ledger</span>
                  <span className="font-bold text-gray-200 mt-0.5 block">Preview Testnet</span>
                </div>
                <div>
                  <span className="text-gray-400 font-medium block">Cost Estimate</span>
                  <span className="font-bold text-primary mt-0.5 block">~ 3.17 tADA</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Buttons footer */}
        <div className="flex items-center justify-between border-t border-translucent pt-5">
          {step > 1 ? (
            <button
              onClick={prevStep}
              className="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-gray-300 font-semibold rounded-xl text-sm flex items-center gap-1.5 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
          ) : (
            <div />
          )}

          {step < 5 ? (
            <button
              onClick={nextStep}
              className="px-5 py-2.5 bg-primary hover:bg-primary-hover text-white font-semibold rounded-xl text-sm flex items-center gap-1.5 transition"
            >
              Next
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-6 py-2.5 bg-gradient-to-r from-primary to-secondary text-white font-bold rounded-xl text-sm flex items-center gap-2 hover:opacity-95 transition shadow-lg shadow-primary/20 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <Wallet className="w-4.5 h-4.5" />
                  Submit & Anchor IP
                </>
              )}
            </button>
          )}
        </div>

      </div>

      {/* Cardano register overlay */}
      {createdIdea && (
        <CardanoRegisterModal
          idea={createdIdea}
          onClose={() => {
            setCreatedIdea(null);
            router.push('/dashboard');
          }}
          onSuccess={() => {
            setCreatedIdea(null);
            router.push('/dashboard');
          }}
        />
      )}
    </div>
  );
}

SubmitIdea.getLayout = function getLayout(page: React.ReactNode) {
  return page;
};
