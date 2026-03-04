'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/shared/infrastructure/supabase/server';
import { SupabaseBookmarkRepository } from '@/bookmark/infrastructure/supabase-bookmark-repository';
import { ToggleBookmarkUseCase } from '@/bookmark/application/toggle-bookmark-use-case';
import { SupabaseSkillDetailRepository } from '@/skill-detail/infrastructure/supabase-skill-detail-repository';
import { GetSkillDetailUseCase } from '@/skill-detail/application/get-skill-detail-use-case';
import { GetFeedbacksUseCase } from '@/skill-detail/application/get-feedbacks-use-case';
import { SubmitFeedbackUseCase } from '@/skill-detail/application/submit-feedback-use-case';
import { SubmitReplyUseCase } from '@/skill-detail/application/submit-reply-use-case';
import { GetTemplateDownloadUrlUseCase } from '@/skill-detail/application/get-template-download-url-use-case';
import type {
  GetSkillDetailResult,
  GetFeedbacksResult,
  SubmitFeedbackInput,
  SubmitFeedbackResult,
  SubmitReplyInput,
  SubmitReplyResult,
  GetTemplateDownloadResult,
} from '@/skill-detail/domain/types';

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/signin');
}

export async function toggleBookmark(
  skillId: string
): Promise<{ bookmarked: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('인증되지 않은 사용자입니다.');
  }

  const repository = new SupabaseBookmarkRepository();
  const useCase = new ToggleBookmarkUseCase(repository);
  const result = await useCase.execute(user.id, skillId);

  revalidatePath('/dashboard');
  revalidatePath('/myagent');

  return result;
}

export async function getSkillDetailAction(
  skillId: string
): Promise<GetSkillDetailResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: '인증되지 않은 사용자입니다.' };
  }

  const repository = new SupabaseSkillDetailRepository();
  const useCase = new GetSkillDetailUseCase(repository);
  return useCase.execute(skillId);
}

export async function getSkillFeedbacksAction(
  skillId: string
): Promise<GetFeedbacksResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: '인증되지 않은 사용자입니다.' };
  }

  const repository = new SupabaseSkillDetailRepository();
  const useCase = new GetFeedbacksUseCase(repository);
  return useCase.execute(skillId);
}

export async function submitFeedbackAction(
  input: SubmitFeedbackInput
): Promise<SubmitFeedbackResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: '인증되지 않은 사용자입니다.' };
  }

  try {
    const repository = new SupabaseSkillDetailRepository();
    const useCase = new SubmitFeedbackUseCase(repository);
    return await useCase.execute(user.id, input);
  } catch {
    return { success: false, error: '피드백 저장에 실패했습니다.' };
  }
}

export async function submitFeedbackReplyAction(
  input: SubmitReplyInput
): Promise<SubmitReplyResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: '인증되지 않은 사용자입니다.' };
  }

  try {
    const repository = new SupabaseSkillDetailRepository();
    const useCase = new SubmitReplyUseCase(repository);
    return await useCase.execute(user.id, input);
  } catch {
    return { success: false, error: '댓글 저장에 실패했습니다.' };
  }
}

export async function getTemplateDownloadUrlAction(
  templateId: string
): Promise<GetTemplateDownloadResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: '인증되지 않은 사용자입니다.' };
  }

  // Get template file info
  const { data: template } = await supabase
    .from('skill_templates')
    .select('file_path, file_name')
    .eq('id', templateId)
    .single();

  if (!template) {
    return { success: false, error: '템플릿을 찾을 수 없습니다.' };
  }

  try {
    const repository = new SupabaseSkillDetailRepository();
    const useCase = new GetTemplateDownloadUrlUseCase(repository);
    return await useCase.execute(
      user.id,
      template.file_path as string,
      template.file_name as string,
      'skill-templates'
    );
  } catch {
    return { success: false, error: '다운로드 URL 생성에 실패했습니다.' };
  }
}
