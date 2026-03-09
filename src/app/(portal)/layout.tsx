import { redirect } from 'next/navigation';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { getQueryClient } from '@/shared/infrastructure/tanstack-query/get-query-client';
import { queryKeys } from '@/shared/infrastructure/tanstack-query/query-keys';
import { getCurrentUser, getCurrentUserRole } from '@/shared/infrastructure/supabase/auth';
import { SupabaseDashboardRepository } from '@/dashboard/infrastructure/supabase-dashboard-repository';
import { GetCategoriesUseCase } from '@/dashboard/application/get-categories-use-case';
import { GetDashboardSkillsUseCase } from '@/dashboard/application/get-dashboard-skills-use-case';
import { SupabaseBookmarkRepository } from '@/bookmark/infrastructure/supabase-bookmark-repository';
import { GetUserBookmarksUseCase } from '@/bookmark/application/get-user-bookmarks-use-case';
import type { UserProfile } from '@/dashboard/domain/types';
import DashboardLayoutClient from '@/features/dashboard/DashboardLayoutClient';

const DEFAULT_LIMIT = 9;

export default async function DashboardLayout({
  children,
  modal,
}: {
  children: React.ReactNode;
  modal?: React.ReactNode;
}) {
  const { user } = await getCurrentUser();

  if (!user) {
    redirect('/signin');
  }

  const displayName =
    (user.user_metadata?.display_name as string | undefined) ?? user.email ?? '';

  const userProfile: UserProfile = {
    email: user.email ?? '',
    displayName,
  };

  const dashboardRepo = new SupabaseDashboardRepository();
  const getCategoriesUseCase = new GetCategoriesUseCase(dashboardRepo);
  const getSkillsUseCase = new GetDashboardSkillsUseCase(dashboardRepo);

  const [categories, { roleName }, skillsResult, bookmarkedSkillIds] = await Promise.all([
    getCategoriesUseCase.execute(),
    getCurrentUserRole(),
    getSkillsUseCase.execute(DEFAULT_LIMIT),
    (async () => {
      const bookmarkRepo = new SupabaseBookmarkRepository();
      const useCase = new GetUserBookmarksUseCase(bookmarkRepo);
      return useCase.getBookmarkedSkillIds(user.id).catch(() => [] as string[]);
    })(),
  ]);

  const isViewer = roleName === 'viewer';
  const isAdmin = roleName === 'admin';

  const queryClient = getQueryClient();
  queryClient.setQueryData(queryKeys.dashboard.categories(), categories);
  queryClient.setQueryData(
    queryKeys.dashboard.skills({}),
    {
      pages: [skillsResult],
      pageParams: [0],
    },
  );
  queryClient.setQueryData(queryKeys.bookmarks.ids(user.id), bookmarkedSkillIds);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <DashboardLayoutClient
        userProfile={userProfile}
        categories={categories}
        isViewer={isViewer}
        isAdmin={isAdmin}
        userId={user.id}
      >
        {children}
        {modal}
      </DashboardLayoutClient>
    </HydrationBoundary>
  );
}
