'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';

interface LoadMoreButtonProps {
  currentLimit: number;
  searchQuery?: string;
  categoryId?: string;
}

export default function LoadMoreButton({
  currentLimit,
  searchQuery,
  categoryId,
}: LoadMoreButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleLoadMore() {
    const params = new URLSearchParams();
    params.set('limit', String(currentLimit + 9));
    if (searchQuery) params.set('q', searchQuery);
    if (categoryId) params.set('category', categoryId);

    startTransition(() => {
      router.push(`/dashboard?${params.toString()}`);
    });
  }

  return (
    <div className="mt-16 text-center">
      <button
        type="button"
        onClick={handleLoadMore}
        disabled={isPending}
        className="px-10 py-4 bg-white border border-slate-200 hover:border-[#00007F]/30 hover:bg-slate-50 rounded-2xl text-sm font-bold text-[#00007F] transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending ? '불러오는 중...' : '더 많은 스킬 보기'}
      </button>
    </div>
  );
}
