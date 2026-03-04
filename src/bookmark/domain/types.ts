import type { DashboardSkillCard } from '@/dashboard/domain/types';

export interface BookmarkRepository {
  getBookmarkedSkillIds(userId: string): Promise<string[]>;
  getBookmarkedSkills(userId: string): Promise<DashboardSkillCard[]>;
  addBookmark(userId: string, skillId: string): Promise<void>;
  removeBookmark(userId: string, skillId: string): Promise<void>;
  isBookmarked(userId: string, skillId: string): Promise<boolean>;
}
