'use server';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/shared/infrastructure/supabase/server';
import { SupabaseAuthRepository } from '@/user-account/infrastructure/SupabaseAuthRepository';

export type LogoutResult =
  | { status: 'success' }
  | { status: 'error'; message: string };

export async function logoutAction(): Promise<LogoutResult> {
  let shouldRedirect = false;

  try {
    const supabase = await createSupabaseServerClient();
    const authRepository = new SupabaseAuthRepository(supabase);
    await authRepository.signOut();
    shouldRedirect = true;
  } catch {
    return {
      status: 'error',
      message: '로그아웃 처리 중 오류가 발생했습니다. 다시 시도해주세요.',
    };
  }

  if (shouldRedirect) {
    redirect('/login');
  }

  return { status: 'success' };
}
