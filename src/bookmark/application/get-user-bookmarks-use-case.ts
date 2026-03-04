import type { BookmarkRepository } from '@/bookmark/domain/types';
import type { DashboardSkillCard } from '@/dashboard/domain/types';

export class GetUserBookmarksUseCase {
  constructor(private readonly repository: BookmarkRepository) {}

  async execute(userId: string): Promise<DashboardSkillCard[]> {
    return this.repository.getBookmarkedSkills(userId);
  }

  async getBookmarkedSkillIds(userId: string): Promise<string[]> {
    return this.repository.getBookmarkedSkillIds(userId);
  }
}
