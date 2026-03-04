import { createClient } from '@/shared/infrastructure/supabase/server';
import type { BookmarkRepository } from '@/bookmark/domain/types';
import type { DashboardSkillCard } from '@/dashboard/domain/types';

interface JoinedSkill {
  id: string;
  title: string;
  description: string | null;
  icon: string;
  created_at: string;
  categories: { name: string; icon: string } | { name: string; icon: string }[] | null;
}

function extractCategory(
  cat: { name: string; icon: string } | { name: string; icon: string }[] | null
): { name: string; icon: string } {
  if (!cat) return { name: '미분류', icon: '' };
  if (Array.isArray(cat)) return { name: cat[0]?.name ?? '미분류', icon: cat[0]?.icon ?? '' };
  return cat;
}

export class SupabaseBookmarkRepository implements BookmarkRepository {
  async getBookmarkedSkillIds(userId: string): Promise<string[]> {
    const supabase = await createClient();

    const { data } = await supabase
      .from('bookmarks')
      .select('skill_id')
      .eq('user_id', userId);

    return (data ?? []).map((row) => row.skill_id as string);
  }

  async getBookmarkedSkills(userId: string): Promise<DashboardSkillCard[]> {
    const supabase = await createClient();

    const { data } = await supabase
      .from('bookmarks')
      .select(
        'skill_id, created_at, skills(id, title, description, icon, created_at, categories(name, icon))'
      )
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (!data) return [];

    return data
      .filter((row) => row.skills !== null)
      .map((row) => {
        const skill = row.skills as unknown as JoinedSkill;
        const cat = extractCategory(skill.categories);
        return {
          id: skill.id,
          title: skill.title,
          description: skill.description,
          icon: skill.icon ?? '⚡',
          categoryName: cat.name,
          categoryIcon: cat.icon,
          createdAt: skill.created_at,
        };
      });
  }

  async addBookmark(userId: string, skillId: string): Promise<void> {
    const supabase = await createClient();

    await supabase
      .from('bookmarks')
      .insert({ user_id: userId, skill_id: skillId });
  }

  async removeBookmark(userId: string, skillId: string): Promise<void> {
    const supabase = await createClient();

    await supabase
      .from('bookmarks')
      .delete()
      .eq('user_id', userId)
      .eq('skill_id', skillId);
  }

  async isBookmarked(userId: string, skillId: string): Promise<boolean> {
    const supabase = await createClient();

    const { count } = await supabase
      .from('bookmarks')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('skill_id', skillId);

    return (count ?? 0) > 0;
  }
}
