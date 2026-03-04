import type { ISkillDetailRepository } from './ports';
import type { GetFeedbacksResult } from '../domain/types';

export class GetFeedbacksUseCase {
  constructor(private readonly repository: ISkillDetailRepository) {}

  async execute(skillId: string): Promise<GetFeedbacksResult> {
    const feedbacks = await this.repository.getFeedbacksWithReplies(skillId);
    return { success: true, feedbacks };
  }
}
