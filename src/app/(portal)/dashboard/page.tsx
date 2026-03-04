import { SupabaseDashboardRepository } from '@/dashboard/infrastructure/supabase-dashboard-repository';
import { GetDashboardSkillsUseCase } from '@/dashboard/application/get-dashboard-skills-use-case';
import { SupabaseBookmarkRepository } from '@/bookmark/infrastructure/supabase-bookmark-repository';
import { GetUserBookmarksUseCase } from '@/bookmark/application/get-user-bookmarks-use-case';
import { createClient } from '@/shared/infrastructure/supabase/server';
import DashboardSkillGrid from '@/features/dashboard/DashboardSkillGrid';
import DashboardSearchBar from '@/features/dashboard/DashboardSearchBar';

const DEFAULT_LIMIT = 9;

interface DashboardPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const params = await searchParams;

  const searchQuery =
    typeof params.q === 'string' ? params.q.trim() : undefined;
  const limitParam =
    typeof params.limit === 'string' ? parseInt(params.limit, 10) : DEFAULT_LIMIT;
  const limit = Number.isFinite(limitParam) && limitParam > 0 ? limitParam : DEFAULT_LIMIT;
  const categoryId =
    typeof params.category === 'string' ? params.category : undefined;

  const repository = new SupabaseDashboardRepository();
  const getSkillsUseCase = new GetDashboardSkillsUseCase(repository);

  const { skills, totalCount, hasMore } = await getSkillsUseCase.execute(
    limit,
    searchQuery || undefined,
    categoryId
  );

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let bookmarkedSkillIds: string[] = [];
  let isViewer = false;
  if (user) {
    const bookmarkRepository = new SupabaseBookmarkRepository();
    const bookmarksUseCase = new GetUserBookmarksUseCase(bookmarkRepository);
    bookmarkedSkillIds = await bookmarksUseCase.getBookmarkedSkillIds(user.id);

    // Check if user is viewer role
    const { data: profile } = await supabase
      .from('profiles')
      .select('roles(name)')
      .eq('id', user.id)
      .single();

    if (profile) {
      const roles = profile.roles as { name: string } | { name: string }[] | null;
      const roleName = roles
        ? Array.isArray(roles) ? roles[0]?.name : roles.name
        : null;
      isViewer = roleName === 'viewer';
    }
  }

  return (
    <>
      <DashboardSearchBar defaultValue={searchQuery} categoryId={categoryId} />

      <DashboardSkillGrid
        skills={skills}
        totalCount={totalCount}
        hasMore={hasMore}
        searchQuery={searchQuery}
        categoryId={categoryId}
        currentLimit={limit}
        bookmarkedSkillIds={bookmarkedSkillIds}
        isViewer={isViewer}
      />
    </>
  );
}
