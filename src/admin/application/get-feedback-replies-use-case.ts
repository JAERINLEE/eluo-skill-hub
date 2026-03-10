import type { AdminRepository, FeedbackReplyRow } from '@/admin/domain/types';

export class GetFeedbackRepliesUseCase {
  constructor(private readonly repository: AdminRepository) {}

  async execute(feedbackId: string): Promise<FeedbackReplyRow[]> {
    return this.repository.getFeedbackReplies(feedbackId);
  }
}
