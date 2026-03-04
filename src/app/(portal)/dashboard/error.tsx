'use client';

import { AlertCircle, RefreshCw } from 'lucide-react';

interface DashboardErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function DashboardError({ error, reset }: DashboardErrorProps) {
  return (
    <div className="flex flex-col items-center justify-center py-32 text-slate-400">
      <AlertCircle size={48} className="mb-4 text-red-400/60" />
      <p className="text-xl font-bold text-[#00007F]/50">데이터를 불러올 수 없습니다</p>
      <p className="text-sm mt-2 mb-8 text-slate-400">
        네트워크 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.
      </p>
      <button
        type="button"
        onClick={reset}
        className="flex items-center gap-2 px-6 py-3 bg-[#00007F] text-white rounded-xl text-sm font-bold hover:bg-[#00007F]/90 transition-colors"
      >
        <RefreshCw size={16} />
        다시 시도
      </button>
    </div>
  );
}
