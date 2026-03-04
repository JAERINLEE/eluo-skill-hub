import { Star, ShieldCheck, AlignLeft } from 'lucide-react';
import type { SkillDetailPopup } from '@/skill-detail/domain/types';

interface SkillDetailHeaderProps {
  skill: SkillDetailPopup;
}

export default function SkillDetailHeader({ skill }: SkillDetailHeaderProps) {
  return (
    <div className="mb-12">
      <div className="text-8xl mb-8 drop-shadow-sm">{skill.icon}</div>
      <h1 className="text-4xl font-bold tracking-tight mb-4 leading-tight text-[#00007F]">
        {skill.title}
      </h1>
      <div className="flex flex-wrap items-center gap-4 text-slate-500 text-sm">
        {skill.authorName && (
          <>
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-[18px] h-[18px]" />
              {skill.authorName}
            </span>
            <span className="text-slate-300">/</span>
          </>
        )}
        {skill.avgRating !== null && (
          <>
            <span className="flex items-center gap-1.5 text-[#00007F] font-semibold">
              <Star className="w-[18px] h-[18px] fill-current" />
              {skill.avgRating.toFixed(1)} ({skill.feedbackCount} 리뷰)
            </span>
            <span className="text-slate-300">/</span>
          </>
        )}
        <span className="bg-[#FEFE01] px-3 py-1 text-[#00007F] font-bold text-xs rounded-full shadow-sm">
          {skill.categoryName}
        </span>
      </div>
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
