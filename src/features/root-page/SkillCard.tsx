import type { SkillViewModel } from "./types";

const ICON_BG_COLORS = [
  "bg-blue-50 dark:bg-blue-900/20",
  "bg-purple-50 dark:bg-purple-900/20",
  "bg-green-50 dark:bg-green-900/20",
  "bg-orange-50 dark:bg-orange-900/20",
  "bg-pink-50 dark:bg-pink-900/20",
  "bg-yellow-50 dark:bg-yellow-900/20",
] as const;

interface SkillCardProps {
  skill: SkillViewModel;
  index: number;
  isBookmarked: boolean;
  onClick: (skill: SkillViewModel) => void;
}

export function SkillCard({ skill, index, isBookmarked, onClick }: SkillCardProps) {
  const iconBgColor = ICON_BG_COLORS[index % ICON_BG_COLORS.length];

  return (
    <button
      type="button"
      onClick={() => onClick(skill)}
      className="text-left w-full bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 hover:shadow-xl hover:shadow-primary/5 transition-all group cursor-pointer relative"
    >
      <div className="absolute top-4 right-4">
        {isBookmarked ? (
          <span data-testid="bookmark-icon-active" className="text-primary text-lg">🔖</span>
        ) : (
          <span data-testid="bookmark-icon-inactive" className="text-slate-300 dark:text-slate-600 text-lg"></span>
        )}
      </div>
      <div
        className={`text-3xl mb-4 p-3 ${iconBgColor} w-fit rounded-lg group-hover:scale-110 transition-transform`}
      >
        {skill.icon}
      </div>
      <h4 className="text-base font-bold mb-2 group-hover:text-primary transition-colors">
        {skill.name}
      </h4>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 leading-relaxed line-clamp-2">
        {skill.description}
      </p>
      {skill.categoryName && (
        <div className="flex flex-wrap gap-2">
          <span className="px-2 py-1 text-[10px] font-bold uppercase rounded bg-primary/10 text-primary">
            {skill.categoryName}
          </span>
        </div>
      )}
    </button>
  );
}
