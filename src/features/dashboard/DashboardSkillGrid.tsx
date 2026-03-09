'use client';

import Link from 'next/link';
import { X } from 'lucide-react';
import { useIsViewer, useDashboardFilter } from './DashboardLayoutClient';
import { useDashboardSkills } from '@/dashboard/hooks/use-dashboard-queries';
import { useBookmarkedSkillIds } from '@/bookmark/hooks/use-bookmark-queries';
import DashboardSkillCard from './DashboardSkillCard';
import LoadMoreButton from './LoadMoreButton';

interface DashboardSkillGridProps {
  userId: string;
}

export default function DashboardSkillGrid({ userId }: DashboardSkillGridProps) {
  const isViewer = useIsViewer();
  const { filter, setActiveTag } = useDashboardFilter();

  const categoryId =
    typeof filter.activeTab === 'object' && filter.activeTab.type === 'category'
      ? filter.activeTab.categoryId
      : undefined;

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useDashboardSkills({
    search: filter.searchQuery,
    categoryId,
    tag: filter.activeTag,
  });
  const { data: bookmarkedSkillIds } = useBookmarkedSkillIds(userId || undefined);

  const skills = data?.pages.flatMap((page) => page.skills) ?? [];
  const totalCount = data?.pages[0]?.totalCount ?? 0;
  const remainingCount = Math.max(0, totalCount - skills.length);
  const hasMore = hasNextPage ?? false;
  const isEmpty = skills.length === 0;
  const isSearchResult = !!filter.searchQuery;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-xl font-bold text-[#00007F]">
            자동화 스킬
            {totalCount > 0 && (
              <span className="ml-2 text-sm font-medium text-slate-400">({totalCount})</span>
            )}
          </h3>
          <p className="text-sm text-slate-500 mt-1">
            업무에서 유용하게 사용할 수 있는 스킬입니다.
          </p>
        </div>
      </div>

      {filter.activeTag && (
        <div className="flex items-center gap-2 mb-6">
          <span className="text-sm text-slate-500">태그 필터:</span>
          <button
            type="button"
            onClick={() => setActiveTag(undefined)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#00007F]/10 text-[#00007F] text-sm font-semibold rounded-full hover:bg-[#00007F]/20 transition-colors"
          >
            #{filter.activeTag}
            <X className="size-3.5" />
          </button>
        </div>
      )}

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
              <Link key={skill.id} href={`/skills/${skill.id}`} scroll={false}>
                <DashboardSkillCard
                  skill={skill}
                  isBookmarked={bookmarkedSkillIds?.includes(skill.id)}
                  userId={userId}
                  onTagClick={(tag) => setActiveTag(tag)}
                />
              </Link>
            ))}
          </div>

          {hasMore && (
            <LoadMoreButton
              onLoadMore={fetchNextPage}
              isLoading={isFetchingNextPage}
              remainingCount={remainingCount}
            />
          )}
        </>
      )}
    </div>
  );
}
