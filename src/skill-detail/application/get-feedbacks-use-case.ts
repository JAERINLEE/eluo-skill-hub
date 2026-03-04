import type { ISkillDetailRepository } from './ports';
import type { GetFeedbacksResult } from '../domain/types';

export class GetFeedbacksUseCase {
  constructor(private readonly repository: ISkillDetailRepository) {}

  async execute(
    skillId: string,
    limit?: number,
    offset?: number,
  ): Promise<GetFeedbacksResult> {
    const result = await this.repository.getFeedbacksWithReplies(skillId, limit, offset);
    return {
      success: true,
      feedbacks: result.feedbacks,
      totalCount: result.totalCount,
      hasMore: result.hasMore,
    };
  }
}
