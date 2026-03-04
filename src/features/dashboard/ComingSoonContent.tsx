import { Construction } from 'lucide-react';

export default function ComingSoonContent() {
  return (
    <div className="flex flex-col items-center justify-center py-32 text-slate-400">
      <Construction size={48} className="mb-4 text-[#00007F]/30" />
      <p className="text-xl font-bold text-[#00007F]/50">준비 중입니다</p>
      <p className="text-sm mt-2">이 기능은 곧 제공될 예정입니다.</p>
    </div>
  );
}
