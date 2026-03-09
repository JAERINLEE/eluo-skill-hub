import type { DashboardRepository, DashboardSkillsResult } from '@/dashboard/domain/types';

export class GetDashboardSkillsUseCase {
  constructor(private readonly repository: DashboardRepository) {}

  async execute(
    limit: number,
    offset: number = 0,
    search?: string,
    categoryId?: string,
    tag?: string
  ): Promise<DashboardSkillsResult> {
    return this.repository.getPublishedSkills(limit, offset, search, categoryId, tag);
  }
}
