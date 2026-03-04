import type { DashboardRepository, CategoryItem } from '@/dashboard/domain/types';

export class GetCategoriesUseCase {
  constructor(private readonly repository: DashboardRepository) {}

  async execute(): Promise<CategoryItem[]> {
    return this.repository.getCategories();
  }
}
