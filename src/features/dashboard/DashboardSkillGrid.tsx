import type { DashboardSkillCard as SkillCardType } from '@/dashboard/domain/types';
import DashboardSkillCard from './DashboardSkillCard';
import LoadMoreButton from './LoadMoreButton';

interface DashboardSkillGridProps {
  skills: SkillCardType[];
  totalCount: number;
  hasMore: boolean;
  searchQuery?: string;
  categoryId?: string;
  currentLimit: number;
  bookmarkedSkillIds?: string[];
}

export default function DashboardSkillGrid({
  skills,
  hasMore,
  searchQuery,
  categoryId,
  currentLimit,
  bookmarkedSkillIds,
}: DashboardSkillGridProps) {
  const isEmpty = skills.length === 0;
  const isSearchResult = !!searchQuery;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-xl font-bold text-[#00007F]">자동화 스킬</h3>
          <p className="text-sm text-slate-500 mt-1">
            업무에서 유용하게 사용할 수 있는 스킬입니다.
          </p>
        </div>
      </div>

      {isEmpty ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <p className="text-lg font-medium">
            {isSearchResult
              ? '검색 결과가 없습니다'
              : '등록된 스킬이 없습니다'}
          </p>
          <p className="text-sm mt-2">
            {isSearchResult
              ? '다른 키워드로 검색해 보세요.'
              : '스킬이 등록되면 여기에 표시됩니다.'}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {skills.map((skill) => (
              <DashboardSkillCard key={skill.id} skill={skill} isBookmarked={bookmarkedSkillIds?.includes(skill.id)} />
            ))}
          </div>

          {hasMore && (
            <LoadMoreButton
              currentLimit={currentLimit}
              searchQuery={searchQuery}
              categoryId={categoryId}
            />
          )}
        </>
      )}
    </div>
  );
}
