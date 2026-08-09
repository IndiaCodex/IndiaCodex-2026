'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { dbService } from '@/lib/supabase';
import { Profile } from '@/lib/demoData';

import { useToast } from './ToastProvider';
export { useToast };

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<Profile | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);



  useEffect(() => {
    // Read user from simulator service
    const currUser = dbService.getCurrentUser();
    
    if (!currUser) {
      // Direct login redirect if no session
      router.push('/login');
    } else {
      setUser(currUser);
      setLoading(false);
    }
  }, [pathname, router]);

  const handleLogout = () => {
    dbService.setCurrentUser(null);
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-400 text-sm font-medium animate-pulse">Initializing LaunchNest...</p>
        </div>
      </div>
    );
  }

  // Get active page title mapping
  const getPageTitle = () => {
    if (pathname.includes('/submit-idea')) return 'Submit a Startup Idea';
    if (pathname.includes('/explore')) return 'Explore Startup Ideas';
    if (pathname.includes('/team-workspace')) return 'Team Workspace';
    if (pathname.includes('/milestones')) return 'Roadmap & Milestones';
    if (pathname.includes('/mentors')) return 'Mentorship Network';
    if (pathname.includes('/developers')) return 'Developer Registry';
    if (pathname.includes('/verify-idea')) return 'Cardano IP Proof Verification';
    if (pathname.includes('/certificate/')) return 'Blockchain Proof Certificate';
    if (pathname.includes('/profile')) return 'Profile Settings';
    if (pathname.includes('/admin')) return 'Admin Control Console';
    if (pathname.includes('/idea/')) return 'Startup Idea Details';
    return 'LaunchNest Student Dashboard';
  };

  return (
    <div className="flex min-h-screen bg-background text-gray-100 overflow-hidden">
        {/* Sidebar */}
        <Sidebar 
          user={user} 
          onLogout={handleLogout} 
          isOpen={sidebarOpen} 
          setIsOpen={setSidebarOpen} 
        />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
          {/* Ambient light meshes */}
          <div className="mesh-bg-blob bg-primary -top-40 -right-40" />
          <div className="mesh-bg-blob bg-secondary -bottom-40 -left-40" />

          {/* Header */}
          <Navbar 
            onMenuClick={() => setSidebarOpen(true)} 
            title={getPageTitle()} 
          />

          {/* Children views */}
          <main className="flex-1 overflow-y-auto p-4 md:p-6 z-10">
            <div className="max-w-6xl mx-auto w-full">
              {children}
            </div>
          </main>
        </div>

      </div>
  );
}
