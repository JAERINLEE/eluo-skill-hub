'use client';

import { useOptimistic, useTransition } from 'react';
import { Bookmark, BookmarkCheck } from 'lucide-react';
import { toggleBookmark } from '@/app/(portal)/dashboard/actions';

interface BookmarkButtonProps {
  skillId: string;
  isBookmarked: boolean;
}

export default function BookmarkButton({
  skillId,
  isBookmarked,
}: BookmarkButtonProps) {
  const [optimisticBookmarked, setOptimisticBookmarked] =
    useOptimistic(isBookmarked);
  const [isPending, startTransition] = useTransition();

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    startTransition(async () => {
      setOptimisticBookmarked(!optimisticBookmarked);
      await toggleBookmark(skillId);
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className="absolute top-3 right-3 z-10 p-1.5 rounded-lg transition-colors hover:bg-slate-100"
      aria-label={optimisticBookmarked ? '북마크 해제' : '북마크 추가'}
    >
      {optimisticBookmarked ? (
        <BookmarkCheck size={18} className="text-[#00007F]" />
      ) : (
        <Bookmark size={18} className="text-slate-400 hover:text-slate-600" />
      )}
    </button>
  );
}
