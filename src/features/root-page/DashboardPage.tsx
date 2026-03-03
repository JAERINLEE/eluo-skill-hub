import { createClient } from '@/shared/infrastructure/supabase/server';
import { SupabaseSkillRepository } from '@/skill-marketplace/infrastructure/SupabaseSkillRepository';
import { GetRecommendedSkillsUseCase } from '@/skill-marketplace/application/GetRecommendedSkillsUseCase';
import { SupabaseBookmarkRepository } from '@/bookmark/infrastructure/SupabaseBookmarkRepository';
import { GetBookmarkedSkillsUseCase } from '@/bookmark/application/GetBookmarkedSkillsUseCase';
import { SearchableSkillSection } from './SearchableSkillSection';
import type { SkillViewModel } from './types';

interface DashboardPageProps {
  categoryName?: string;
  userId: string;
}

export async function DashboardPage({ categoryName, userId }: DashboardPageProps) {
  const supabase = await createClient();

  const skillRepository = new SupabaseSkillRepository(supabase);
  const skillUseCase = new GetRecommendedSkillsUseCase(skillRepository);
  const skills = await skillUseCase.execute(categoryName);

  const bookmarkRepository = new SupabaseBookmarkRepository(supabase);
  const bookmarkUseCase = new GetBookmarkedSkillsUseCase(bookmarkRepository);
  const bookmarkedSkillIds = await bookmarkUseCase.execute(userId);

  const viewModels: SkillViewModel[] = skills.map((skill) => ({
    id: skill.id,
    name: skill.name,
    description: skill.description,
    icon: skill.icon,
    categoryName: skill.categories[0]?.name ?? '',
    markdownContent: skill.markdownContent,
    createdAt: skill.createdAt.toISOString(),
  }));

  return (
    <div className="flex-1 overflow-y-auto p-8 no-scrollbar">
      <SearchableSkillSection
        skills={viewModels}
        initialBookmarkedIds={bookmarkedSkillIds}
      />
    </div>
  );
}
