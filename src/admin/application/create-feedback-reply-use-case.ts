import type { AdminRepository, CreateFeedbackReplyInput, CreateFeedbackReplyResult } from '@/admin/domain/types';

export class CreateFeedbackReplyUseCase {
  constructor(private readonly repository: AdminRepository) {}

  async execute(userId: string, input: CreateFeedbackReplyInput): Promise<CreateFeedbackReplyResult> {
    return this.repository.createFeedbackReply(userId, input);
  }
}
