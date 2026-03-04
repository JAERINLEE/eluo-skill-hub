'use client';

import { useTransition } from 'react';
import { LogOut, User } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';
import type { UserProfile } from '@/dashboard/domain/types';
import { signOut } from '@/app/(portal)/dashboard/actions';

interface ProfileDropdownProps {
  userProfile: UserProfile;
}

export default function ProfileDropdown({ userProfile }: ProfileDropdownProps) {
  const [isPending, startTransition] = useTransition();

  function handleSignOut() {
    startTransition(() => {
      signOut();
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="w-10 h-10 rounded-xl border-2 border-white shadow-sm flex items-center justify-center overflow-hidden focus:outline-none focus:ring-2 focus:ring-[#00007F]/20"
        >
          <img
            alt="User profile"
            className="w-full h-full object-cover"
            src="https://api.dicebear.com/9.x/thumbs/svg?seed=Leo"
          />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex items-center gap-2">
          <User size={16} className="text-slate-400" />
          <div className="flex flex-col">
            <span className="text-sm font-bold">{userProfile.displayName}</span>
            <span className="text-xs text-slate-500 font-normal">
              {userProfile.email}
            </span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleSignOut}
          disabled={isPending}
          className="text-red-600 focus:text-red-600 cursor-pointer"
        >
          <LogOut size={16} className="mr-2" />
          {isPending ? '로그아웃 중...' : '로그아웃'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
