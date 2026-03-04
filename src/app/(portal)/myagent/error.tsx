'use client';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function MyAgentError({ error, reset }: ErrorProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-slate-500">
      <p className="text-lg font-medium mb-2">오류가 발생했습니다</p>
      <p className="text-sm mb-6">{error.message || '내 에이전트를 불러오는 중 문제가 발생했습니다.'}</p>
      <button
        type="button"
        onClick={reset}
        className="px-4 py-2 bg-[#00007F] text-white rounded-lg text-sm hover:bg-[#00007F]/90 transition-colors"
      >
        다시 시도
      </button>
    </div>
  );
}
