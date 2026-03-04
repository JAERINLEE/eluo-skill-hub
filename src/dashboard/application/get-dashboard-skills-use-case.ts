import type { DashboardRepository, DashboardSkillsResult } from '@/dashboard/domain/types';

export class GetDashboardSkillsUseCase {
  constructor(private readonly repository: DashboardRepository) {}

  async execute(
    limit: number,
    search?: string,
    categoryId?: string
  ): Promise<DashboardSkillsResult> {
    return this.repository.getPublishedSkills(limit, search, categoryId);
  }
}
