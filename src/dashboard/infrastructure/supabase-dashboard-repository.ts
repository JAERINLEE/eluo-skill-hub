import { createClient } from '@/shared/infrastructure/supabase/server';
import type {
  DashboardRepository,
  DashboardSkillsResult,
  DashboardSkillCard,
  CategoryItem,
} from '@/dashboard/domain/types';

interface JoinedCategory {
  name: string;
  icon: string;
}

function extractCategoryName(cat: JoinedCategory | JoinedCategory[] | null): string {
  if (!cat) return '미분류';
  if (Array.isArray(cat)) return cat[0]?.name ?? '미분류';
  return cat.name;
}

function extractCategoryIcon(cat: JoinedCategory | JoinedCategory[] | null): string {
  if (!cat) return '';
  if (Array.isArray(cat)) return cat[0]?.icon ?? '';
  return cat.icon;
}

export class SupabaseDashboardRepository implements DashboardRepository {
  async getPublishedSkills(
    limit: number,
    offset: number = 0,
    search?: string,
    categoryId?: string,
    tag?: string
  ): Promise<DashboardSkillsResult> {
    const supabase = await createClient();

    let query = supabase
      .from('skills')
      .select('id, title, description, version, created_at, updated_at, tags, categories(name, icon)', { count: 'exact' })
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (search) {
      query = query.or(
        `title.ilike.%${search}%,description.ilike.%${search}%`
      );
    }

    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }

    if (tag) {
      query = query.contains('tags', [tag]);
    }

    const { data, count } = await query;

    const totalCount = count ?? 0;

    const skills: DashboardSkillCard[] = (data ?? []).map((row) => ({
      id: row.id as string,
      title: row.title as string,
      description: (row.description as string | null) ?? null,
      categoryName: extractCategoryName(row.categories as unknown as JoinedCategory),
      categoryIcon: extractCategoryIcon(row.categories as unknown as JoinedCategory),
      version: (row.version as string) ?? '1.0.0',
      tags: (row.tags as string[] | null) ?? [],
      createdAt: row.created_at as string,
      updatedAt: row.updated_at as string,
    }));

    return {
      skills,
      totalCount,
      hasMore: offset + limit < totalCount,
    };
  }

  async getCategories(): Promise<CategoryItem[]> {
    const supabase = await createClient();

    const { data } = await supabase
      .from('categories')
      .select('id, name, icon, skills!inner(id)')
      .eq('skills.status', 'published')
      .order('sort_order', { ascending: true });

    if (!data) return [];

    return data.map((row) => ({
      id: row.id as string,
      name: row.name as string,
      icon: row.icon as string,
    }));
  }
}
