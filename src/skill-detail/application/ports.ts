import type {
  SkillDetailPopup,
  FeedbackWithReplies,
  FeedbackReply,
  SubmitFeedbackInput,
  SubmitReplyInput,
} from '../domain/types';

export interface ISkillDetailRepository {
  getSkillDetailPopup(skillId: string): Promise<SkillDetailPopup | null>;
  getFeedbacksWithReplies(skillId: string): Promise<FeedbackWithReplies[]>;
  submitFeedback(userId: string, input: SubmitFeedbackInput): Promise<FeedbackWithReplies>;
  submitReply(userId: string, input: SubmitReplyInput): Promise<FeedbackReply>;
  getTemplateSignedUrl(filePath: string, bucket: string): Promise<string>;
  getUserRole(userId: string): Promise<string | null>;
}
