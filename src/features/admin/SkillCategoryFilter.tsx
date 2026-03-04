'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';
import type { CategoryOption } from '@/admin/domain/types';
import CategoryIcon from './CategoryIcon';

interface SkillCategoryFilterProps {
  categories: CategoryOption[];
  currentCategoryId?: string;
}

export default function SkillCategoryFilter({ categories, currentCategoryId }: SkillCategoryFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleChange = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value === 'all') {
        params.delete('category');
      } else {
        params.set('category', value);
      }
      params.set('page', '1');
      router.push(`?${params.toString()}`);
    },
    [router, searchParams],
  );

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <button
        type="button"
        onClick={() => handleChange('all')}
        className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-colors ${
          !currentCategoryId
            ? 'bg-[#000080] text-white'
            : 'text-slate-500 hover:text-[#000080] bg-white border border-slate-200'
        }`}
      >
        전체
      </button>
      {categories.map((cat) => (
        <button
          key={cat.id}
          type="button"
          onClick={() => handleChange(cat.id)}
          className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-colors ${
            currentCategoryId === cat.id
              ? 'bg-[#000080] text-white'
              : 'text-slate-500 hover:text-[#000080] bg-white border border-slate-200'
          }`}
        >
          <CategoryIcon icon={cat.icon} size={14} className="inline-block mr-1" />
          {cat.name}
        </button>
      ))}
    </div>
  );
}
