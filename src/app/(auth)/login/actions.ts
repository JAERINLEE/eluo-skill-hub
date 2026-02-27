'use server';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/shared/infrastructure/supabase/server';
import { SupabaseAuthRepository } from '@/user-account/infrastructure/SupabaseAuthRepository';
import { LoginUseCase } from '@/user-account/application/LoginUseCase';
import type { AuthResult } from '@/user-account/domain/AuthResult';

export async function loginAction(
  prevState: AuthResult | null,
  formData: FormData
): Promise<AuthResult> {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  const supabase = await createSupabaseServerClient();
  const authRepository = new SupabaseAuthRepository(supabase);
  const useCase = new LoginUseCase(authRepository);

  const result = await useCase.execute({ email, password });

  if (result.status === 'success') {
    redirect(result.redirectTo);
  }

  return result;
}
