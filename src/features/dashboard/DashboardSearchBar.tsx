'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';

interface DashboardSearchBarProps {
  defaultValue?: string;
  categoryId?: string;
}

export default function DashboardSearchBar({
  defaultValue = '',
  categoryId,
}: DashboardSearchBarProps) {
  const router = useRouter();
  const [query, setQuery] = useState(defaultValue);

  function handleSearch() {
    const trimmed = query.trim();
    if (!trimmed && !defaultValue) return;

    const params = new URLSearchParams();
    if (trimmed) params.set('q', trimmed);
    if (categoryId) params.set('category', categoryId);

    const search = params.toString();
    router.push(search ? `/dashboard?${search}` : '/dashboard');
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      handleSearch();
    }
  }

  return (
    <div className="max-w-4xl mx-auto mb-16">
      <h2 className="text-4xl font-bold mb-8 tracking-tight text-[#00007F]">
        무엇을 도와드릴까요?
      </h2>
      <div className="relative group bg-white rounded-2xl overflow-hidden transition-all border border-[#00007F]/20 focus-within:shadow-[0_0_0_4px_rgba(0,0,127,0.05)] focus-within:border-[#00007F]/40">
        <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
          <Search size={20} className="text-slate-400 group-focus-within:text-[#00007F] transition-colors" />
        </div>
        <input
          className="w-full pl-14 pr-36 py-5 bg-transparent border-none focus:ring-0 outline-none text-lg placeholder:text-slate-400"
          placeholder="업무 효율을 높여줄 AI 스킬을 검색하세요..."
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button
          type="button"
          onClick={handleSearch}
          className="absolute right-3 top-3 bottom-3 px-8 bg-[#FEFE01] text-[#00007F] font-bold rounded-xl text-sm hover:brightness-105 transition-all shadow-md"
        >
          검색하기
        </button>
      </div>
    </div>
  );
}
