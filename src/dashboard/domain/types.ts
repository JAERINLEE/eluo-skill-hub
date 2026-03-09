export interface DashboardSkillCard {
  readonly id: string;
  readonly title: string;
  readonly description: string | null;
  readonly categoryName: string;
  readonly categoryIcon: string;
  readonly version: string;
  readonly tags: readonly string[];
  readonly createdAt: string;
}

export interface DashboardSkillsResult {
  readonly skills: DashboardSkillCard[];
  readonly totalCount: number;
  readonly hasMore: boolean;
}

export interface CategoryItem {
  readonly id: string;
  readonly name: string;
  readonly icon: string;
}

export interface UserProfile {
  readonly email: string;
  readonly displayName: string;
}

export type SidebarTab =
  | 'dashboard'
  | 'my-agents'
  | 'help'
  | { type: 'category'; categoryId: string; categoryName: string };

export interface DashboardRepository {
  getPublishedSkills(
    limit: number,
    offset: number,
    search?: string,
    categoryId?: string,
    tag?: string
  ): Promise<DashboardSkillsResult>;

  getCategories(): Promise<CategoryItem[]>;
}
