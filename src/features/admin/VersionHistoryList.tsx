'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, History } from 'lucide-react';
import type { VersionHistoryEntry } from '@/admin/domain/types';

interface VersionHistoryListProps {
  history: VersionHistoryEntry[];
}

export default function VersionHistoryList({ history }: VersionHistoryListProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors text-sm font-medium text-slate-700"
      >
        <span className="flex items-center gap-2">
          <History className="size-4 text-slate-400" />
          버전 이력 ({history.length})
        </span>
        {isOpen ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
      </button>

      {isOpen && (
        <div className="px-4 py-3 space-y-2">
          {history.length === 0 ? (
            <p className="text-sm text-slate-400 py-2">아직 변경 이력이 없습니다</p>
          ) : (
            history.map((entry, idx) => (
              <div
                key={`${entry.version}-${entry.changedAt}-${idx}`}
                className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0"
              >
                <span className="text-sm font-semibold text-[#00007F]">v{entry.version}</span>
                <span className="text-xs text-slate-400">
                  {new Date(entry.changedAt).toLocaleString('ko-KR', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
