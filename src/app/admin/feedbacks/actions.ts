'use server';

import { SupabaseAdminRepository } from '@/admin/infrastructure/supabase-admin-repository';
import { GetFeedbackRepliesUseCase } from '@/admin/application/get-feedback-replies-use-case';
import { CreateFeedbackReplyUseCase } from '@/admin/application/create-feedback-reply-use-case';
import { createClient } from '@/shared/infrastructure/supabase/server';
import type { FeedbackReplyRow, CreateFeedbackReplyResult } from '@/admin/domain/types';

export async function getRepliesAction(feedbackId: string): Promise<FeedbackReplyRow[]> {
  const repository = new SupabaseAdminRepository();
  const useCase = new GetFeedbackRepliesUseCase(repository);
  return useCase.execute(feedbackId);
}

export async function createReplyAction(feedbackId: string, content: string): Promise<CreateFeedbackReplyResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: '로그인이 필요합니다.' };
  }

  const repository = new SupabaseAdminRepository();
  const useCase = new CreateFeedbackReplyUseCase(repository);
  return useCase.execute(user.id, { feedbackId, content });
}
