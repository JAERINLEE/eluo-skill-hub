import type { ISkillDetailRepository } from './ports';
import type { SubmitFeedbackInput, SubmitFeedbackResult } from '../domain/types';

export class SubmitFeedbackUseCase {
  constructor(private readonly repository: ISkillDetailRepository) {}

  async execute(userId: string, input: SubmitFeedbackInput): Promise<SubmitFeedbackResult> {
    if (input.rating < 1 || input.rating > 5 || !Number.isInteger(input.rating)) {
      return { success: false, error: '평점은 1-5 사이여야 합니다.' };
    }

    const feedback = await this.repository.submitFeedback(userId, input);
    return { success: true, feedback };
  }
}
