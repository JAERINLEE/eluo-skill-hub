'use client';

import { ChevronRight } from 'lucide-react';
import type { UserProfile } from '@/dashboard/domain/types';
import ProfileDropdown from './ProfileDropdown';

interface DashboardHeaderProps {
  breadcrumb: string;
  userProfile: UserProfile;
}

export default function DashboardHeader({
  breadcrumb,
  userProfile,
}: DashboardHeaderProps) {
  return (
    <header className="h-20 bg-white/60 backdrop-blur-xl flex items-center justify-between px-10 z-10 border-b border-white/20">
      <div className="flex items-center gap-3 text-slate-400">
        <span className="text-sm font-medium">ELUO AI HUB</span>
        <ChevronRight size={12} />
        <span className="text-sm font-bold text-[#00007F] bg-[#00007F]/5 px-3 py-1 rounded-full">
          {breadcrumb}
        </span>
      </div>
      <div className="flex items-center gap-8">
        <div className="flex items-center gap-4 border-l border-slate-200 pl-8">
          <ProfileDropdown userProfile={userProfile} />
        </div>
      </div>
    </header>
  );
}
