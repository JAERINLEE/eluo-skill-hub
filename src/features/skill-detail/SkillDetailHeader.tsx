import { AlignLeft, Download, Tag } from 'lucide-react';
import type { SkillDetailPopup } from '@/skill-detail/domain/types';

interface SkillDetailHeaderProps {
  skill: SkillDetailPopup;
}

export default function SkillDetailHeader({ skill }: SkillDetailHeaderProps) {
  return (
    <div className="mb-12">
      <h1 className="text-4xl font-bold tracking-tight mb-4 leading-tight text-[#00007F]">
        {skill.title}
      </h1>
      <div className="flex flex-wrap items-center gap-4 text-slate-500 text-sm">

        <span className="bg-[#FEFE01] px-3 py-1 text-[#00007F] font-bold text-xs rounded-full shadow-sm">
          {skill.categoryName}
        </span>
        <span className="text-slate-300">/</span>
        <span className="inline-flex items-center px-2.5 py-0.5 bg-[#00007F]/10 text-[#00007F] text-xs font-semibold rounded-full">
          v{skill.version}
        </span>
        <span className="text-slate-300">/</span>
        <span className="flex items-center gap-1.5">
          <Download className="w-[18px] h-[18px]" />
          다운로드 {skill.downloadCount.toLocaleString()}회
        </span>
      </div>
      {skill.tags.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 mt-3">
          <Tag className="w-3.5 h-3.5 text-slate-400" />
          {skill.tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center px-2.5 py-1 bg-slate-100 text-slate-600 text-xs font-medium rounded-full"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}
      {skill.description && (
        <div className="mt-8">
          <h3 className="text-xl font-bold mb-5 flex items-center gap-2.5 text-[#00007F]">
            <AlignLeft className="w-5 h-5 text-[#00007F]/40" />
            상세 설명
          </h3>
          <p className="text-lg leading-relaxed opacity-90 text-[#1a1a1a]">
            {skill.description}
          </p>
        </div>
      )}
    </div>
  );
}
