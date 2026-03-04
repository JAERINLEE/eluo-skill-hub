import type { DashboardSkillCard as SkillCardType } from '@/dashboard/domain/types';
import CategoryIcon from '@/features/admin/CategoryIcon';
import BookmarkButton from '@/features/bookmark/BookmarkButton';

interface DashboardSkillCardProps {
  skill: SkillCardType;
  isBookmarked?: boolean;
}

export default function DashboardSkillCard({ skill, isBookmarked }: DashboardSkillCardProps) {
  return (
    <div className="relative bg-[rgba(0,0,127,0.05)] p-8 rounded-3xl border border-white/40 transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_20px_25px_-5px_rgba(0,0,127,0.1),0_10px_10px_-5px_rgba(0,0,127,0.04)] hover:bg-white">
      <BookmarkButton skillId={skill.id} isBookmarked={isBookmarked ?? false} />
      <div className="text-4xl mb-6 p-4 bg-white/80 w-fit rounded-2xl shadow-sm">
        {skill.icon}
      </div>
      <h4 className="text-lg font-bold mb-3 text-[#00007F]">{skill.title}</h4>
      <p className="text-sm text-slate-500 mb-6 leading-relaxed line-clamp-3">
        {skill.description ?? ''}
      </p>
      <div className="flex flex-wrap gap-2 pt-4 border-t border-[#00007F]/5">
        <span className="flex items-center gap-1 px-3 py-1 bg-[#00007F]/5 text-[10px] font-bold uppercase rounded-full text-[#00007F]">
          <CategoryIcon icon={skill.categoryIcon} size={12} />
          {skill.categoryName}
        </span>
      </div>
    </div>
  );
}
