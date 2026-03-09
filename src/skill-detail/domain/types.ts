// 팝업에 표시할 스킬 전체 정보
export interface SkillDetailPopup {
  readonly id: string;
  readonly title: string;
  readonly description: string | null;
  readonly categoryName: string;
  readonly categoryIcon: string;
  readonly version: string;
  readonly tags: readonly string[];
  readonly markdownContent: string | null;
  readonly authorName: string | null;
  readonly updatedAt: string;
  readonly templates: SkillTemplateInfo[];
  readonly downloadCount: number;
  readonly feedbackCount: number;
}

export interface SkillTemplateInfo {
  readonly id: string;
  readonly fileName: string;
  readonly filePath: string;
  readonly fileSize: number;
  readonly fileType: string;
}

// 피드백 + 댓글 묶음
export interface FeedbackWithReplies {
  readonly id: string;
  readonly rating: number | null;
  readonly comment: string | null;
  readonly userName: string | null;
  readonly userId: string;
  readonly isSecret: boolean;
  readonly isDeleted: boolean;
  readonly createdAt: string;
  readonly replies: FeedbackReply[];
}

export interface FeedbackReply {
  readonly id: string;
  readonly content: string;
  readonly userName: string | null;
  readonly userId: string;
  readonly createdAt: string;
}

// 입력 타입
export interface SubmitFeedbackInput {
  readonly skillId: string;
  readonly comment: string;
  readonly isSecret?: boolean;
}

export interface SubmitReplyInput {
  readonly feedbackId: string;
  readonly content: string;
}

// 페이지네이션 피드백
export interface PaginatedFeedbacks {
  readonly feedbacks: FeedbackWithReplies[];
  readonly totalCount: number;
  readonly hasMore: boolean;
}

// 결과 타입
export type GetSkillDetailResult =
  | { success: true; skill: SkillDetailPopup }
  | { success: false; error: string };

export type GetFeedbacksResult =
  | { success: true; feedbacks: FeedbackWithReplies[]; totalCount: number; hasMore: boolean }
  | { success: false; error: string };

export type SubmitFeedbackResult =
  | { success: true; feedback: FeedbackWithReplies }
  | { success: false; error: string };

export type SubmitReplyResult =
  | { success: true; reply: FeedbackReply }
  | { success: false; error: string };

export type DeleteFeedbackResult =
  | { success: true }
  | { success: false; error: string };

export type DeleteReplyResult =
  | { success: true }
  | { success: false; error: string };

export type GetTemplateDownloadResult =
  | { success: true; signedUrl: string; fileName: string }
  | { success: false; error: string; isViewerBlocked?: boolean };
