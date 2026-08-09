'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import DashboardLayout, { useToast } from '@/components/DashboardLayout';
import { dbService } from '@/lib/supabase';
import { Idea, Profile } from '@/lib/demoData';
import { Search, Lightbulb, ArrowUpRight, Cpu } from 'lucide-react';

export default function ExploreIdeas() {
  const { showToast } = useToast();
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [owners, setOwners] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  useEffect(() => {
    const loadExploreData = async () => {
      try {
        const [iList, pList] = await Promise.all([
          dbService.getIdeas(),
          dbService.getProfiles()
        ]);
        
        // Show only public ideas
        const publicIdeas = iList.filter(i => i.visibility === 'public');
        setIdeas(publicIdeas);
        setOwners(pList);
        setLoading(false);
      } catch (err) {
        showToast('Error loading ideas directory.', 'error');
      }
    };
    loadExploreData();
  }, []);

  const filteredIdeas = ideas.filter((idea) => {
    const matchesSearch = 
      idea.title.toLowerCase().includes(search.toLowerCase()) || 
      idea.short_description.toLowerCase().includes(search.toLowerCase());
    
    const matchesCategory = 
      selectedCategory === 'All' || 
      idea.category.toLowerCase().includes(selectedCategory.toLowerCase());

    return matchesSearch && matchesCategory;
  });

  const categories = ['All', 'Web3', 'AgriTech', 'Healthcare', 'Sustainability', 'EdTech'];

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in font-sans">
        
        {/* Search header panel */}
        <div className="glass-panel p-6 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search startup titles, problems, technologies..."
              className="input-field pl-10"
            />
          </div>

          {/* Category Filter list */}
          <div className="flex gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition whitespace-nowrap ${
                  selectedCategory === cat 
                    ? 'bg-primary text-white border-primary shadow' 
                    : 'border-translucent bg-background text-gray-400 hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Ideas Grid */}
        {loading ? (
          <div className="py-12 flex justify-center">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filteredIdeas.length === 0 ? (
          <div className="glass-panel p-16 text-center space-y-3">
            <Lightbulb className="w-12 h-12 text-gray-600 mx-auto" />
            <p className="text-sm text-gray-400 font-medium">No matching public startup ideas found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredIdeas.map((idea) => {
              const founder = owners.find(p => p.id === idea.owner_id);
              return (
                <div key={idea.id} className="glass-panel p-5 flex flex-col justify-between gap-5 hover:scale-[1.01] transition duration-200">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-full bg-surface-card border border-translucent text-[9px] text-gray-400 font-bold uppercase">
                        {idea.category}
                      </span>
                      {idea.blockchain_status === 'Confirmed' && (
                        <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-bold">
                          <Cpu className="w-3.5 h-3.5" />
                          On-chain Proof
                        </div>
                      )}
                    </div>

                    <div>
                      <h4 className="font-bold text-base text-gray-100">{idea.title}</h4>
                      <p className="text-xs text-gray-400 line-clamp-3 mt-1 leading-relaxed font-medium">
                        {idea.short_description}
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-translucent pt-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <img 
                        src={founder?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${founder?.full_name}`}
                        alt={founder?.full_name}
                        className="w-6 h-6 rounded-full border border-translucent"
                      />
                      <span className="text-[11px] text-gray-400 font-semibold">{founder?.full_name}</span>
                    </div>

                    <Link
                      href={`/idea/${idea.id}`}
                      className="text-xs text-primary font-bold hover:underline flex items-center gap-0.5"
                    >
                      View Pitch
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
