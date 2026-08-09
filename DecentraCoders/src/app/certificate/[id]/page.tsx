'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import DashboardLayout, { useToast } from '@/components/DashboardLayout';
import { dbService } from '@/lib/supabase';
import { Idea, BlockchainRecord, Profile } from '@/lib/demoData';
import BlockchainCertificate from '@/components/BlockchainCertificate';
import { FileText, ArrowLeft } from 'lucide-react';

export default function CertificatePage() {
  const router = useRouter();
  const { id } = useParams();
  const { showToast } = useToast();

  const [idea, setIdea] = useState<Idea | null>(null);
  const [record, setRecord] = useState<BlockchainRecord | null>(null);
  const [owner, setOwner] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCertificateDetails = async () => {
      if (!id) return;
      try {
        const iData = await dbService.getIdeaById(id as string);
        if (!iData) {
          showToast('Idea not found', 'error');
          router.push('/dashboard');
          return;
        }

        const [rData, ownData] = await Promise.all([
          dbService.getBlockchainRecordByIdeaId(iData.id),
          dbService.getProfileById(iData.owner_id)
        ]);

        if (!rData) {
          showToast('This idea has not been registered on Cardano yet. Certificate unavailable.', 'error');
          router.push(`/idea/${iData.id}`);
          return;
        }

        setIdea(iData);
        setRecord(rData);
        if (ownData) setOwner(ownData);
        setLoading(false);
      } catch (err) {
        console.error(err);
        showToast('Error loading certificate data.', 'error');
      }
    };

    fetchCertificateDetails();
  }, [id]);

  if (loading || !idea || !record || !owner) {
    return (
      <DashboardLayout>
        <div className="py-12 flex justify-center">
          <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in font-sans">
        
        {/* Back navigation */}
        <button
          onClick={() => router.push(`/idea/${idea.id}`)}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition print:hidden"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to idea details
        </button>

        {/* Certificate Component */}
        <BlockchainCertificate
          idea={idea}
          record={record}
          owner={owner}
        />

      </div>
    </DashboardLayout>
  );
}
