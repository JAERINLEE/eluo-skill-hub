'use client';

import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { queryKeys } from '@/shared/infrastructure/tanstack-query/query-keys';
import { getDashboardSkillsAction, getCategoriesAction } from '@/app/(portal)/dashboard/actions';

const PAGE_SIZE = 9;

export function useDashboardSkills(params: {
  search?: string;
  categoryId?: string;
  tag?: string;
}) {
  return useInfiniteQuery({
    queryKey: queryKeys.dashboard.skills(params),
    queryFn: ({ pageParam = 0 }) =>
      getDashboardSkillsAction(PAGE_SIZE, pageParam, params.search, params.categoryId, params.tag),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.hasMore ? allPages.length * PAGE_SIZE : undefined,
    staleTime: 60 * 1000,
  });
}

export function useCategories() {
  return useQuery({
    queryKey: queryKeys.dashboard.categories(),
    queryFn: () => getCategoriesAction(),
    staleTime: 5 * 60 * 1000, // categories change rarely
  });
}
