// 팝업에 표시할 스킬 전체 정보
export interface SkillDetailPopup {
  readonly id: string;
  readonly title: string;
  readonly icon: string;
  readonly description: string | null;
  readonly categoryName: string;
  readonly categoryIcon: string;
  readonly markdownContent: string | null;
  readonly authorName: string | null;
  readonly updatedAt: string;
  readonly templates: SkillTemplateInfo[];
  readonly avgRating: number | null;
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
  readonly rating: number;
  readonly comment: string | null;
  readonly userName: string | null;
  readonly createdAt: string;
  readonly replies: FeedbackReply[];
}

export interface FeedbackReply {
  readonly id: string;
  readonly content: string;
  readonly userName: string | null;
  readonly createdAt: string;
}

// 입력 타입
export interface SubmitFeedbackInput {
  readonly skillId: string;
  readonly rating: number;
  readonly comment?: string;
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

export type GetTemplateDownloadResult =
  | { success: true; signedUrl: string; fileName: string }
  | { success: false; error: string; isViewerBlocked?: boolean };
