'use client';

import { useTransition } from 'react';
import { LogOut } from 'lucide-react';
import { signOut } from '@/app/admin/actions';
import { broadcastLogout } from '@/shared/ui/CrossTabLogoutListener';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/shared/ui/alert-dialog';

export default function LogoutButton() {
  const [isPending, startTransition] = useTransition();

  function handleConfirm() {
    broadcastLogout();
    startTransition(() => {
      signOut();
    });
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <button
          className="size-9 rounded-full flex items-center justify-center bg-white border border-[#000080]/10 text-[#000080] hover:bg-red-50 hover:border-red-200 hover:text-red-500 transition-colors"
          type="button"
          aria-label="로그아웃"
        >
          <LogOut strokeWidth={2.5} className="size-5" />
        </button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>로그아웃</AlertDialogTitle>
          <AlertDialogDescription>
            정말 로그아웃 하시겠습니까?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>취소</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} disabled={isPending}>
            {isPending ? '로그아웃 중...' : '로그아웃'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
