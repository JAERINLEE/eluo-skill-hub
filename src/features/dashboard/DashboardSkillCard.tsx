import type { DashboardSkillCard as SkillCardType } from '@/dashboard/domain/types';
import CategoryIcon from '@/features/admin/CategoryIcon';
import BookmarkButton from '@/features/bookmark/BookmarkButton';

interface DashboardSkillCardProps {
  skill: SkillCardType;
  isBookmarked?: boolean;
  userId?: string;
  onTagClick?: (tag: string) => void;
}

export default function DashboardSkillCard({ skill, isBookmarked, userId, onTagClick }: DashboardSkillCardProps) {
  return (
    <div
      className="relative bg-[rgba(0,0,127,0.05)] p-8 rounded-3xl border border-white/40 transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_20px_25px_-5px_rgba(0,0,127,0.1),0_10px_10px_-5px_rgba(0,0,127,0.04)] hover:bg-white cursor-pointer"
    >
      <BookmarkButton skillId={skill.id} isBookmarked={isBookmarked ?? false} userId={userId} />

      <h4 className="text-lg font-bold mb-3 text-[#00007F]">{skill.title}</h4>
      <p className="text-sm text-slate-500 mb-6 leading-relaxed line-clamp-3">
        {skill.description ?? ''}
      </p>
      <div className="flex flex-wrap gap-2 pt-4 border-t border-[#00007F]/5">
        <span className="flex items-center gap-1 px-3 py-1 bg-[#00007F]/5 text-[10px] font-bold uppercase rounded-full text-[#00007F]">
          <CategoryIcon icon={skill.categoryIcon} size={12} />
          {skill.categoryName}
        </span>
        <span className="px-2.5 py-1 bg-[#00007F]/10 text-[10px] font-semibold rounded-full text-[#00007F]">
          v{skill.version}
        </span>
        {skill.tags.slice(0, 3).map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onTagClick?.(tag);
            }}
            className="px-2.5 py-1 bg-slate-100 text-[10px] font-medium rounded-full text-slate-500 hover:bg-[#00007F]/10 hover:text-[#00007F] transition-colors"
          >
            #{tag}
          </button>
        ))}
      </div>
    </div>
  );
}
