'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Lightbulb, 
  Search, 
  Users, 
  UserCheck, 
  Code, 
  ShieldCheck, 
  CalendarRange, 
  User, 
  ShieldAlert,
  LogOut
} from 'lucide-react';
import { Profile } from '@/lib/demoData';

interface SidebarProps {
  user: Profile | null;
  onLogout: () => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export default function Sidebar({ user, onLogout, isOpen, setIsOpen }: SidebarProps) {
  const pathname = usePathname();

  const menuItems = [
    {
      label: 'Dashboard',
      icon: LayoutDashboard,
      href: '/dashboard',
      roles: ['student', 'mentor', 'developer', 'admin'],
    },
    {
      label: 'Submit Idea',
      icon: Lightbulb,
      href: '/submit-idea',
      roles: ['student'],
    },
    {
      label: 'Explore Ideas',
      icon: Search,
      href: '/explore',
      roles: ['student', 'mentor', 'developer', 'admin'],
    },
    {
      label: 'Team Workspace',
      icon: Users,
      href: '/team-workspace',
      roles: ['student', 'developer'],
    },
    {
      label: 'Milestones',
      icon: CalendarRange,
      href: '/milestones',
      roles: ['student', 'mentor', 'developer'],
    },
    {
      label: 'Find Mentors',
      icon: UserCheck,
      href: '/mentors',
      roles: ['student'],
    },
    {
      label: 'Find Developers',
      icon: Code,
      href: '/developers',
      roles: ['student'],
    },
    {
      label: 'Verify Cardano Proof',
      icon: ShieldCheck,
      href: '/verify-idea',
      roles: ['student', 'mentor', 'developer', 'admin'],
    },
    {
      label: 'Profile Settings',
      icon: User,
      href: '/profile',
      roles: ['student', 'mentor', 'developer', 'admin'],
    },
    {
      label: 'Admin Console',
      icon: ShieldAlert,
      href: '/admin',
      roles: ['admin'],
    },
  ];

  const filteredItems = menuItems.filter(item => 
    user && item.roles.includes(user.role)
  );

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
        />
      )}

      {/* Sidebar Sidebar */}
      <aside className={`
        fixed top-0 bottom-0 left-0 w-64 bg-surface border-r border-translucent p-5 flex flex-col z-50 transition-transform duration-300 lg:translate-x-0 lg:static lg:h-screen lg:z-10
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Logo Section */}
        <div className="flex items-center gap-3 mb-8 px-2">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-primary to-secondary flex items-center justify-center font-bold text-white text-lg shadow-lg shadow-primary/20">
            LN
          </div>
          <div>
            <h1 className="font-bold text-base leading-tight">LaunchNest</h1>
            <span className="text-xs text-secondary font-medium tracking-wide">Powered by Cardano</span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 space-y-1.5 overflow-y-auto">
          {filteredItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition duration-200 group
                  ${isActive 
                    ? 'bg-gradient-to-r from-primary/25 to-secondary/10 text-primary border-l-2 border-primary' 
                    : 'text-gray-400 hover:text-gray-100 hover:bg-white/5'}
                `}
              >
                <Icon className={`w-4 h-4 transition duration-200 ${isActive ? 'text-primary' : 'text-gray-400 group-hover:text-gray-100'}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User Card & Log Out */}
        <div className="border-t border-translucent pt-4 mt-auto">
          {user && (
            <div className="flex items-center gap-3 px-2 mb-4">
              <img 
                src={user.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${user.full_name}`} 
                alt={user.full_name} 
                className="w-10 h-10 rounded-full border border-translucent"
              />
              <div className="overflow-hidden">
                <p className="font-semibold text-sm truncate">{user.full_name}</p>
                <span className="text-xs text-gray-400 capitalize">{user.role}</span>
              </div>
            </div>
          )}
          
          <button
            onClick={() => {
              onLogout();
              setIsOpen(false);
            }}
            className="flex items-center gap-3 w-full px-4 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition"
          >
            <LogOut className="w-4 h-4" />
            Log Out
          </button>
        </div>
      </aside>
    </>
  );
}
