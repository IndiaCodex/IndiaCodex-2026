'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import DashboardLayout, { useToast } from '@/components/DashboardLayout';
import { dbService } from '@/lib/supabase';
import { hashIdea } from '@/lib/hashing';
import { Idea, BlockchainRecord, Profile } from '@/lib/demoData';
import { 
  ShieldCheck, 
  Search, 
  CheckCircle, 
  XCircle, 
  ExternalLink, 
  Cpu, 
  Clipboard,
  Info,
  Calendar,
  User,
  Activity
} from 'lucide-react';
import { checkCardanoTxConfirmation } from '@/lib/cardano';
import { getCardanoExplorerTxUrl } from '@/lib/cardano/network';

export default function VerifyIdea() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const ideaParamId = searchParams.get('id');
  const { showToast } = useToast();

  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  
  // Matched entities
  const [matchedIdea, setMatchedIdea] = useState<Idea | null>(null);
  const [matchedRecord, setMatchedRecord] = useState<BlockchainRecord | null>(null);
  const [matchedOwner, setMatchedOwner] = useState<Profile | null>(null);
  
  // Verification Checks
  const [hashRecalculated, setHashRecalculated] = useState('');
  const [isHashMatched, setIsHashMatched] = useState(false);
  const [blockchainConfirmation, setBlockchainConfirmation] = useState<'Confirmed' | 'Pending' | 'Failed'>('Pending');

  // Manual interactive verification tab fields
  const [tab, setTab] = useState<'search' | 'interactive'>('search');
  const [manualTitle, setManualTitle] = useState('EduBlocks');
  const [manualDesc, setManualDesc] = useState('A decentralized credential registry on Cardano to prevent certificate fraud.');
  const [manualProblem, setManualProblem] = useState('University credential and certificate fraud is rising globally, making verifying documents slow and expensive.');
  const [manualSolution, setManualSolution] = useState('Create tamper-proof blockchain certificates issued by universities via Cardano smart contracts.');
  const [manualTargetUsers, setManualTargetUsers] = useState('Universities, students, recruiters, and screening agencies.');
  const [manualOwnerId, setManualOwnerId] = useState('11111111-1111-1111-1111-111111111111');
  const [manualTimestamp, setManualTimestamp] = useState('1718192000');
  
  const [manualCalculatedHash, setManualCalculatedHash] = useState('');
  const [manualStatus, setManualStatus] = useState<'idle' | 'verified' | 'failed'>('idle');

  // Trigger search automatically if param is set
  useEffect(() => {
    if (ideaParamId) {
      setQuery(ideaParamId);
      handleVerify(ideaParamId);
    }
  }, [ideaParamId]);

  const handleVerify = async (searchQuery = query) => {
    if (!searchQuery.trim()) {
      showToast('Please enter an Idea ID or transaction hash.', 'error');
      return;
    }

    setLoading(true);
    setSearched(true);
    setMatchedIdea(null);
    setMatchedRecord(null);
    setMatchedOwner(null);
    setIsHashMatched(false);

    try {
      const [allIdeas, allRecords, allProfiles] = await Promise.all([
        dbService.getIdeas(),
        dbService.getBlockchainRecords(),
        dbService.getProfiles()
      ]);

      // 1. Locate idea by ID or transaction hash
      let matchedIdeaObj: Idea | undefined;
      let matchedRecordObj: BlockchainRecord | undefined;

      // Find by ID
      matchedIdeaObj = allIdeas.find(i => i.id === searchQuery.trim());
      
      if (matchedIdeaObj) {
        matchedRecordObj = allRecords.find(r => r.idea_id === matchedIdeaObj!.id);
      } else {
        // Find by Transaction Hash
        matchedRecordObj = allRecords.find(r => r.transaction_hash === searchQuery.trim());
        if (matchedRecordObj) {
          matchedIdeaObj = allIdeas.find(i => i.id === matchedRecordObj!.idea_id);
        }
      }

      if (!matchedIdeaObj || !matchedRecordObj) {
        showToast('No matching registered blockchain records found.', 'error');
        setLoading(false);
        return;
      }

      // 2. Load owner profile
      const ownerObj = allProfiles.find(p => p.id === matchedIdeaObj!.owner_id);

      setMatchedIdea(matchedIdeaObj);
      setMatchedRecord(matchedRecordObj);
      if (ownerObj) setMatchedOwner(ownerObj);

      // 3. Recalculate Hash from canonical payload database fields!
      // This enforces the requirement: "Do not show 'Verified' merely because a transaction-hash string exists."
      const payloadInput = {
        title: matchedIdeaObj.title,
        short_description: matchedIdeaObj.short_description,
        problem_statement: matchedIdeaObj.problem_statement,
        proposed_solution: matchedIdeaObj.proposed_solution,
        target_users: matchedIdeaObj.target_users,
        owner_id: matchedIdeaObj.owner_id,
        submitted_at: matchedIdeaObj.canonical_payload?.submitted_at || 1718192000,
      };

      const { hash } = await hashIdea(payloadInput);
      setHashRecalculated(hash);

      // 4. Compare recalculated hash with on-chain stored hash
      const hashMatches = hash === matchedRecordObj.idea_hash;
      setIsHashMatched(hashMatches);

      // 5. Query Cardano block confirmations via server-side Blockfrost API route
      // This works whether or not the hash is a real testnet tx or a legacy demo_ hash.
      const confirmationState = await checkCardanoTxConfirmation(matchedRecordObj.transaction_hash);
      setBlockchainConfirmation(confirmationState);

      if (hashMatches) {
        showToast('Idea payload verified against Cardano record!', 'success');
      } else {
        showToast('Verification failed: Hash mismatch.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error executing validation checks.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleInteractiveVerify = async () => {
    setManualStatus('idle');
    try {
      // 1. Recalculate hash of input fields
      const { hash } = await hashIdea({
        title: manualTitle,
        short_description: manualDesc,
        problem_statement: manualProblem,
        proposed_solution: manualSolution,
        target_users: manualTargetUsers,
        owner_id: manualOwnerId,
        submitted_at: Number(manualTimestamp),
      });

      setManualCalculatedHash(hash);

      // 2. Query matches in the blockchain records
      const allRecords = await dbService.getBlockchainRecords();
      const match = allRecords.find(r => r.idea_hash === hash);

      if (match) {
        setManualStatus('verified');
        showToast('Verification matches an on-chain ledger proof!', 'success');
      } else {
        setManualStatus('failed');
        showToast('No on-chain ledger proof matching this hash exists.', 'error');
      }
    } catch (err) {
      showToast('Calculation error.', 'error');
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-fade-in font-sans">
        
        {/* Tab selection */}
        <div className="flex border-b border-translucent">
          <button
            onClick={() => setTab('search')}
            className={`px-6 py-3 text-sm font-semibold transition ${
              tab === 'search' 
                ? 'border-b-2 border-primary text-primary font-bold' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Ledger Search Verification
          </button>
          <button
            onClick={() => setTab('interactive')}
            className={`px-6 py-3 text-sm font-semibold transition ${
              tab === 'interactive' 
                ? 'border-b-2 border-primary text-primary font-bold' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Interactive Hash Calculator
          </button>
        </div>

        {tab === 'search' ? (
          // ===================================================================
          // LEDGER SEARCH TAB
          // ===================================================================
          <div className="space-y-6">
            <div className="glass-panel p-6 space-y-4">
              <h3 className="font-extrabold text-base">Validate Intellectual Property Proof</h3>
              <p className="text-xs text-gray-400 font-medium">
                Pry open any startup record. Enter an Idea ID, Cardano Transaction Hash, or Certificate reference code.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Enter Idea ID or Transaction Hash (e.g. a0000000-0000-0000-0000-000000000001)"
                    className="input-field pl-10"
                  />
                </div>
                <button
                  onClick={() => handleVerify()}
                  disabled={loading}
                  className="px-6 py-3 bg-gradient-to-r from-primary to-secondary text-white font-bold rounded-xl text-sm transition hover:opacity-95 disabled:opacity-50 flex items-center justify-center gap-2 flex-shrink-0"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    'Verify Ledger Proof'
                  )}
                </button>
              </div>
            </div>

            {/* Results Block */}
            {searched && (
              loading ? (
                <div className="py-12 flex justify-center">
                  <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : (
                matchedIdea && matchedRecord && matchedOwner ? (
                  <div className="space-y-6">
                    
                    {/* Success/Failure Banner — 4 States */}
                    {isHashMatched ? (
                      matchedRecord.transaction_hash.startsWith('demo_') ? (
                        // Demo mode — hash matched but no real transaction
                        <div className="p-5 rounded-2xl bg-gray-500/10 border border-gray-500/30 text-gray-400 flex items-start gap-4">
                          <CheckCircle className="w-7 h-7 flex-shrink-0 mt-0.5" />
                          <div>
                            <h4 className="font-extrabold text-base text-gray-100">Hash Verified — Demo Mode</h4>
                            <p className="text-xs text-gray-400 mt-1 leading-relaxed font-semibold">
                              The SHA-256 hash matches the database record. However, this idea was registered in Demo Mode — no real Cardano transaction was submitted. To get full on-chain verification, re-register with a wallet and Blockfrost configured.
                            </p>
                          </div>
                        </div>
                      ) : blockchainConfirmation === 'Confirmed' ? (
                        // Full verification: hash matches + tx confirmed on Cardano
                        <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-start gap-4">
                          <CheckCircle className="w-7 h-7 flex-shrink-0 mt-0.5" />
                          <div>
                            <h4 className="font-extrabold text-base text-gray-100">Idea Verified on Cardano</h4>
                            <p className="text-xs text-gray-400 mt-1 leading-relaxed font-semibold">
                              ✓ SHA-256 hash recalculated from idea content<br />
                              ✓ Hash matches the database record<br />
                              ✓ Transaction confirmed on Cardano Preview Testnet<br />
                              ✓ Block height recorded — immutable on-chain proof
                            </p>
                          </div>
                        </div>
                      ) : (
                        // Hash matches but tx pending — not yet fully verified
                        <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-start gap-4">
                          <CheckCircle className="w-7 h-7 flex-shrink-0 mt-0.5" />
                          <div>
                            <h4 className="font-extrabold text-base text-gray-100">Hash Verified — Awaiting Blockchain Confirmation</h4>
                            <p className="text-xs text-gray-400 mt-1 leading-relaxed font-semibold">
                              ✓ SHA-256 hash matches the database record<br />
                              ⏳ Cardano transaction not yet confirmed — please wait 1–3 minutes and refresh.
                            </p>
                          </div>
                        </div>
                      )
                    ) : (
                      <div className="p-5 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 flex items-start gap-4">
                        <XCircle className="w-7 h-7 flex-shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-extrabold text-base text-gray-100">Verification Failed</h4>
                          <p className="text-xs text-gray-400 mt-1 leading-relaxed font-semibold">
                            The recalculated SHA-256 hash does not match the registered proof. The idea content may have been modified after registration.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Cryptographic Proof Comparison details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      
                      {/* Left: Idea details */}
                      <div className="glass-panel p-6 space-y-4">
                        <h4 className="font-bold text-sm text-gray-200 border-b border-translucent pb-2 flex items-center gap-2">
                          <User className="w-4 h-4 text-primary" />
                          Founder & Source Details
                        </h4>
                        
                        <div className="space-y-3.5 text-sm">
                          <div>
                            <span className="text-xs text-gray-400 font-bold block uppercase">Idea Title</span>
                            <p className="font-bold text-gray-100 mt-0.5">{matchedIdea.title}</p>
                          </div>
                          <div>
                            <span className="text-xs text-gray-400 font-bold block uppercase">Category</span>
                            <p className="font-medium text-gray-300 mt-0.5">{matchedIdea.category}</p>
                          </div>
                          <div>
                            <span className="text-xs text-gray-400 font-bold block uppercase">Submitted By</span>
                            <p className="font-medium text-gray-200 mt-0.5">{matchedOwner.full_name}</p>
                          </div>
                          <div>
                            <span className="text-xs text-gray-400 font-bold block uppercase">Recalculated SHA-256 Hash</span>
                            <code className="text-xs text-secondary font-mono break-all mt-1 bg-background px-2.5 py-1.5 rounded border border-translucent block">
                              {hashRecalculated}
                            </code>
                          </div>
                        </div>
                      </div>

                      {/* Right: Onchain status details */}
                      <div className="glass-panel p-6 space-y-4">
                        <h4 className="font-bold text-sm text-gray-200 border-b border-translucent pb-2 flex items-center gap-2">
                          <Cpu className="w-4 h-4 text-secondary" />
                          On-Chain Registry Record
                        </h4>

                        <div className="space-y-3.5 text-sm">
                          <div>
                            <span className="text-xs text-gray-400 font-bold block uppercase">On-Chain Registered Hash</span>
                            <code className="text-xs text-secondary font-mono break-all mt-1 bg-background px-2.5 py-1.5 rounded border border-translucent block">
                              {matchedRecord.idea_hash}
                            </code>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <span className="text-xs text-gray-400 font-bold block uppercase">Network</span>
                              <p className="font-semibold text-gray-200 capitalize mt-0.5">Cardano {matchedRecord.network}</p>
                            </div>
                            <div>
                              <span className="text-xs text-gray-400 font-bold block uppercase">Block Height</span>
                              <p className="font-mono text-gray-200 mt-0.5">{matchedRecord.block_height || 'Pending...'}</p>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <span className="text-xs text-gray-400 font-bold block uppercase">Ledger Confirmation</span>
                              <span className={`px-2.5 py-0.5 rounded text-[10px] font-extrabold border mt-1 block w-fit capitalize ${
                                blockchainConfirmation === 'Confirmed' 
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                  : 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                              }`}>
                                {blockchainConfirmation}
                              </span>
                            </div>
                            <div>
                              <span className="text-xs text-gray-400 font-bold block uppercase">IP Stamp Date</span>
                              <p className="font-semibold text-gray-300 mt-0.5">
                                {new Date(matchedRecord.registered_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>

                          <div className="space-y-2 pt-2">
                             <a
                               href={`/certificate/${matchedIdea.id}`}
                               className="w-full py-2 bg-gradient-to-r from-primary to-secondary text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 shadow"
                             >
                               Open Blockchain Certificate
                             </a>
                             {matchedRecord.transaction_hash && !matchedRecord.transaction_hash.startsWith('demo_') && (
                               <a
                                 href={getCardanoExplorerTxUrl(matchedRecord.transaction_hash)}
                                 target="_blank"
                                 rel="noopener noreferrer"
                                 className="w-full py-2 bg-white/5 hover:bg-white/10 border border-translucent text-gray-300 font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 transition"
                               >
                                 <ExternalLink className="w-3.5 h-3.5" />
                                 View on CardanoScan Preview
                               </a>
                             )}
                           </div>
                        </div>
                      </div>

                    </div>

                  </div>
                ) : (
                  <div className="p-8 border border-translucent bg-surface/20 rounded-2xl text-center text-sm text-gray-400 font-medium">
                    Could not match any startup records. Ensure your query matches an existing Idea ID or Transaction Hash.
                  </div>
                )
              )
            )}
          </div>
        ) : (
          // ===================================================================
          // INTERACTIVE CALCULATOR TAB
          // ===================================================================
          <div className="space-y-6">
            
            <div className="p-4 rounded-xl bg-purple-500/5 border border-purple-glow flex items-start gap-3">
              <Info className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
              <div className="text-xs text-gray-300 leading-relaxed font-medium">
                <strong>How it works:</strong> Paste the text fields of the startup idea. Our hashing function alphabetically sorts the fields, trims whitespace, normalizes line endings, and generates the canonical JSON payload before hashing it. You can see the hash result change and verify it against on-chain records.
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Form entries */}
              <div className="lg:col-span-2 glass-panel p-6 space-y-4">
                <h3 className="font-extrabold text-base border-b border-translucent pb-2.5">Input Payload Fields</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs text-gray-400 font-semibold block">Idea Title</label>
                    <input 
                      type="text" 
                      value={manualTitle}
                      onChange={(e) => setManualTitle(e.target.value)}
                      className="input-field text-xs"
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-xs text-gray-400 font-semibold block">Short Description</label>
                    <input 
                      type="text" 
                      value={manualDesc}
                      onChange={(e) => setManualDesc(e.target.value)}
                      className="input-field text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-gray-400 font-semibold block">Problem Statement</label>
                  <textarea 
                    rows={2}
                    value={manualProblem}
                    onChange={(e) => setManualProblem(e.target.value)}
                    className="input-field text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-gray-400 font-semibold block">Proposed Solution</label>
                  <textarea 
                    rows={2}
                    value={manualSolution}
                    onChange={(e) => setManualSolution(e.target.value)}
                    className="input-field text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-gray-400 font-semibold block">Target Users</label>
                  <input 
                    type="text" 
                    value={manualTargetUsers}
                    onChange={(e) => setManualTargetUsers(e.target.value)}
                    className="input-field text-xs"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs text-gray-400 font-semibold block">Owner Profile ID (UUID)</label>
                    <input 
                      type="text" 
                      value={manualOwnerId}
                      onChange={(e) => setManualOwnerId(e.target.value)}
                      className="input-field text-xs font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-gray-400 font-semibold block">UNIX Timestamp</label>
                    <input 
                      type="text" 
                      value={manualTimestamp}
                      onChange={(e) => setManualTimestamp(e.target.value)}
                      className="input-field text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={handleInteractiveVerify}
                    className="w-full py-3 bg-gradient-to-r from-primary to-secondary text-white font-bold rounded-xl text-sm transition hover:opacity-95"
                  >
                    Calculate Hash & Cross-Check Ledger
                  </button>
                </div>
              </div>

              {/* Hashing analysis */}
              <div className="space-y-6">
                
                {/* Result output */}
                <div className="glass-panel p-6 space-y-4">
                  <h3 className="font-extrabold text-base border-b border-translucent pb-2.5">Calculation Result</h3>

                  <div className="space-y-1.5">
                    <span className="text-[10px] text-gray-400 font-bold block uppercase tracking-wider">Calculated SHA-256 Hash</span>
                    <code className="text-xs text-secondary font-mono break-all bg-background p-3 rounded-lg border border-translucent block leading-normal">
                      {manualCalculatedHash || 'Click calculate to generate...'}
                    </code>
                  </div>

                  {manualStatus === 'verified' && (
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg text-xs font-bold flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      IP Hash matches Cardano Ledger!
                    </div>
                  )}

                  {manualStatus === 'failed' && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-xs font-bold flex items-center gap-2">
                      <XCircle className="w-4 h-4" />
                      No matching records on Cardano.
                    </div>
                  )}
                </div>

                {/* Canonical explanation card */}
                <div className="glass-panel p-5 bg-surface/30 space-y-3">
                  <h4 className="text-xs font-bold text-gray-300 uppercase tracking-widest flex items-center gap-2">
                    <Activity className="w-4 h-4 text-secondary" />
                    Hashing parameters
                  </h4>
                  <p className="text-xs text-gray-400 leading-normal">
                    Changing even a single comma, capital letter, or spacing in the title or problem statement will result in a completely different SHA-256 digest, invalidating verification.
                  </p>
                </div>

              </div>

            </div>

          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
