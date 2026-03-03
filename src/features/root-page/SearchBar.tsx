"use client";

import { useState } from "react";
import { SearchIcon } from "@/shared/ui/icons";

const POPULAR_SEARCH_TAGS = [
  "파이썬 스크립트",
  "PDF 요약기",
  "회의록 정리",
] as const;

interface SearchBarProps {
  query?: string;
  onQueryChange?: (value: string) => void;
}

export function SearchBar({ query: externalQuery, onQueryChange }: SearchBarProps) {
  const [internalQuery, setInternalQuery] = useState("");

  const isControlled = externalQuery !== undefined;
  const query = isControlled ? externalQuery : internalQuery;

  const handleChange = (value: string) => {
    if (!isControlled) setInternalQuery(value);
    onQueryChange?.(value);
  };

  return (
    <div className="max-w-4xl mx-auto mb-10">
      <h2 className="text-3xl font-bold mb-6 tracking-tight">
        AI 스킬 탐색하기
      </h2>
      <div className="relative group">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <SearchIcon className="text-slate-400 group-focus-within:text-primary transition-colors" />
        </div>
        <input
          className="w-full pl-12 pr-4 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all shadow-sm text-base"
          placeholder="스킬 또는 에이전트 검색..."
          type="text"
          value={query}
          onChange={(e) => handleChange(e.target.value)}
        />
      </div>
      <div className="flex items-center gap-2 mt-4 overflow-x-auto no-scrollbar pb-2">
        <span className="text-xs text-slate-400 whitespace-nowrap">인기 검색어:</span>
        {POPULAR_SEARCH_TAGS.map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={() => handleChange(tag)}
            className="px-3 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full text-xs font-medium cursor-pointer hover:border-primary transition-colors whitespace-nowrap"
          >
            {tag}
          </button>
        ))}
      </div>
    </div>
  );
}
