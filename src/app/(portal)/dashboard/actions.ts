'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/shared/infrastructure/supabase/server';
import { SupabaseBookmarkRepository } from '@/bookmark/infrastructure/supabase-bookmark-repository';
import { ToggleBookmarkUseCase } from '@/bookmark/application/toggle-bookmark-use-case';

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
