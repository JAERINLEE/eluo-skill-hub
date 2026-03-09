'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/shared/infrastructure/supabase/server';
import { getCurrentUser, getCurrentUserRole } from '@/shared/infrastructure/supabase/auth';
import { trackServerEvent } from '@/event-log/infrastructure/track-server-event';
import { SupabaseBookmarkRepository } from '@/bookmark/infrastructure/supabase-bookmark-repository';
import { ToggleBookmarkUseCase } from '@/bookmark/application/toggle-bookmark-use-case';
import { GetUserBookmarksUseCase } from '@/bookmark/application/get-user-bookmarks-use-case';
import { SupabaseDashboardRepository } from '@/dashboard/infrastructure/supabase-dashboard-repository';
import { GetDashboardSkillsUseCase } from '@/dashboard/application/get-dashboard-skills-use-case';
import { GetCategoriesUseCase } from '@/dashboard/application/get-categories-use-case';
import { SupabaseSkillDetailRepository } from '@/skill-detail/infrastructure/supabase-skill-detail-repository';
import { GetSkillDetailUseCase } from '@/skill-detail/application/get-skill-detail-use-case';
import { GetFeedbacksUseCase } from '@/skill-detail/application/get-feedbacks-use-case';
import { SubmitFeedbackUseCase } from '@/skill-detail/application/submit-feedback-use-case';
import { SubmitReplyUseCase } from '@/skill-detail/application/submit-reply-use-case';
import { DeleteFeedbackUseCase } from '@/skill-detail/application/delete-feedback-use-case';
import { GetTemplateDownloadUrlUseCase } from '@/skill-detail/application/get-template-download-url-use-case';
import type {
  GetSkillDetailResult,
  GetFeedbacksResult,
  SubmitFeedbackInput,
  SubmitFeedbackResult,
  SubmitReplyInput,
  SubmitReplyResult,
  DeleteFeedbackResult,
  DeleteReplyResult,
  GetTemplateDownloadResult,
} from '@/skill-detail/domain/types';

export async function signOut() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  trackServerEvent('auth.signout', {}, user?.id);
  await supabase.auth.signOut();
  redirect('/signin');
}

export async function toggleBookmark(
  skillId: string
): Promise<{ bookmarked: boolean }> {
  const { user } = await getCurrentUser();

  if (!user) {
    throw new Error('인증되지 않은 사용자입니다.');
  }

  const repository = new SupabaseBookmarkRepository();
  const useCase = new ToggleBookmarkUseCase(repository);
  const result = await useCase.execute(user.id, skillId);

  trackServerEvent(
    result.bookmarked ? 'skill.bookmark_add' : 'skill.bookmark_remove',
    { skill_id: skillId },
    user.id
  );

  revalidatePath('/dashboard');
  revalidatePath('/myagent');

  return result;
}

export async function getSkillDetailAction(
  skillId: string
): Promise<GetSkillDetailResult> {
  const { user } = await getCurrentUser();

  if (!user) {
    return { success: false, error: '인증되지 않은 사용자입니다.' };
  }

  const repository = new SupabaseSkillDetailRepository();
  const useCase = new GetSkillDetailUseCase(repository);
  return useCase.execute(skillId);
}

export async function getSkillFeedbacksAction(
  skillId: string,
  offset: number = 0
): Promise<GetFeedbacksResult> {
  const [{ user }, { roleName }] = await Promise.all([
    getCurrentUser(),
    getCurrentUserRole(),
  ]);

  if (!user) {
    return { success: false, error: '인증되지 않은 사용자입니다.' };
  }

  const repository = new SupabaseSkillDetailRepository();
  const useCase = new GetFeedbacksUseCase(repository);
  return useCase.execute(skillId, 20, offset, user.id, roleName === 'admin');
}

export async function submitFeedbackAction(
  input: SubmitFeedbackInput
): Promise<SubmitFeedbackResult> {
  const { user } = await getCurrentUser();

  if (!user) {
    return { success: false, error: '인증되지 않은 사용자입니다.' };
  }

  try {
    const repository = new SupabaseSkillDetailRepository();
    const useCase = new SubmitFeedbackUseCase(repository);
    const result = await useCase.execute(user.id, input);
    revalidatePath('/dashboard');
    return result;
  } catch {
    return { success: false, error: '피드백 저장에 실패했습니다.' };
  }
}

export async function submitFeedbackReplyAction(
  input: SubmitReplyInput
): Promise<SubmitReplyResult> {
  const { user } = await getCurrentUser();

  if (!user) {
    return { success: false, error: '인증되지 않은 사용자입니다.' };
  }

  try {
    const repository = new SupabaseSkillDetailRepository();
    const useCase = new SubmitReplyUseCase(repository);
    const result = await useCase.execute(user.id, input);
    revalidatePath('/dashboard');
    return result;
  } catch {
    return { success: false, error: '댓글 저장에 실패했습니다.' };
  }
}

export async function deleteFeedbackAction(
  feedbackId: string
): Promise<DeleteFeedbackResult> {
  const { user } = await getCurrentUser();

  if (!user) {
    return { success: false, error: '인증되지 않은 사용자입니다.' };
  }

  // 본인 피드백인지 확인
  const supabase = await createClient();
  const { data: feedback } = await supabase
    .from('skill_feedback_logs')
    .select('user_id')
    .eq('id', feedbackId)
    .single();

  if (!feedback) {
    return { success: false, error: '피드백을 찾을 수 없습니다.' };
  }

  if ((feedback.user_id as string) !== user.id) {
    return { success: false, error: '본인의 피드백만 삭제할 수 있습니다.' };
  }

  try {
    const repository = new SupabaseSkillDetailRepository();
    const useCase = new DeleteFeedbackUseCase(repository);
    const result = await useCase.execute(feedbackId);
    revalidatePath('/dashboard');
    return result;
  } catch {
    return { success: false, error: '피드백 삭제에 실패했습니다.' };
  }
}

export async function deleteReplyAction(
  replyId: string
): Promise<DeleteReplyResult> {
  const { user } = await getCurrentUser();

  if (!user) {
    return { success: false, error: '인증되지 않은 사용자입니다.' };
  }

  const supabase = await createClient();
  const { data: reply } = await supabase
    .from('feedback_replies')
    .select('user_id')
    .eq('id', replyId)
    .single();

  if (!reply) {
    return { success: false, error: '댓글을 찾을 수 없습니다.' };
  }

  if ((reply.user_id as string) !== user.id) {
    return { success: false, error: '본인의 댓글만 삭제할 수 있습니다.' };
  }

  try {
    const repository = new SupabaseSkillDetailRepository();
    await repository.deleteReply(replyId);
    revalidatePath('/dashboard');
    return { success: true };
  } catch {
    return { success: false, error: '댓글 삭제에 실패했습니다.' };
  }
}

export async function getDashboardSkillsAction(
  limit: number,
  offset: number = 0,
  search?: string,
  categoryId?: string,
  tag?: string
) {
  const repository = new SupabaseDashboardRepository();
  const useCase = new GetDashboardSkillsUseCase(repository);
  return useCase.execute(limit, offset, search, categoryId, tag);
}

export async function getBookmarkedSkillIdsAction(): Promise<string[]> {
  const { user } = await getCurrentUser();
  if (!user) return [];
  const repository = new SupabaseBookmarkRepository();
  const useCase = new GetUserBookmarksUseCase(repository);
  return useCase.getBookmarkedSkillIds(user.id).catch(() => [] as string[]);
}

export async function getBookmarkedSkillsAction() {
  const { user } = await getCurrentUser();
  if (!user) return [];
  const repository = new SupabaseBookmarkRepository();
  const useCase = new GetUserBookmarksUseCase(repository);
  return useCase.execute(user.id);
}

export async function getCategoriesAction() {
  const repository = new SupabaseDashboardRepository();
  const getCategoriesUseCase = new GetCategoriesUseCase(repository);
  return getCategoriesUseCase.execute();
}

export async function getTemplateDownloadUrlAction(
  templateId: string
): Promise<GetTemplateDownloadResult> {
  const { user } = await getCurrentUser();

  if (!user) {
    return { success: false, error: '인증되지 않은 사용자입니다.' };
  }

  // Get template file info
  const supabase = await createClient();
  const { data: template } = await supabase
    .from('skill_templates')
    .select('file_path, file_name, skill_id')
    .eq('id', templateId)
    .single();

  if (!template) {
    return { success: false, error: '템플릿을 찾을 수 없습니다.' };
  }

  try {
    const repository = new SupabaseSkillDetailRepository();
    const useCase = new GetTemplateDownloadUrlUseCase(repository);
    const result = await useCase.execute(
      user.id,
      template.file_path as string,
      template.file_name as string,
      'skill-templates'
    );

    if (result.success) {
      await repository.incrementDownloadCount(template.skill_id as string);
      trackServerEvent(
        'skill.template_download',
        { skill_id: template.skill_id as string, template_id: templateId },
        user.id
      );
    }

    return result;
  } catch {
    return { success: false, error: '다운로드 URL 생성에 실패했습니다.' };
  }
}
