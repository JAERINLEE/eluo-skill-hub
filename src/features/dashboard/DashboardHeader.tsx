'use client';

import { ChevronRight, Menu } from 'lucide-react';
import type { UserProfile } from '@/dashboard/domain/types';
import ProfileDropdown from './ProfileDropdown';

interface DashboardHeaderProps {
  breadcrumb: string;
  userProfile: UserProfile;
  onMenuToggle?: () => void;
}

export default function DashboardHeader({
  breadcrumb,
  userProfile,
  onMenuToggle,
}: DashboardHeaderProps) {
  return (
    <header className="h-14 md:h-20 bg-white/60 backdrop-blur-xl flex items-center justify-between px-4 md:px-10 z-10 border-b border-white/20">
      <div className="flex items-center gap-3 text-slate-400">
        <button
          type="button"
          onClick={onMenuToggle}
          className="md:hidden p-1 -ml-1 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
          aria-label="메뉴 열기"
        >
          <Menu size={22} />
        </button>
        <span className="text-sm font-medium">ELUO HUB</span>
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
