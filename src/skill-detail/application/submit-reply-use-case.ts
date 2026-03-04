import type { ISkillDetailRepository } from './ports';
import type { SubmitReplyInput, SubmitReplyResult } from '../domain/types';

export class SubmitReplyUseCase {
  constructor(private readonly repository: ISkillDetailRepository) {}

  async execute(userId: string, input: SubmitReplyInput): Promise<SubmitReplyResult> {
    if (!input.content.trim()) {
      return { success: false, error: '댓글 내용을 입력해주세요.' };
    }

    const reply = await this.repository.submitReply(userId, input);
    return { success: true, reply };
  }
}
