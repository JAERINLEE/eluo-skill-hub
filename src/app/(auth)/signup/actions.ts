'use server';
import { createSupabaseServerClient } from '@/shared/infrastructure/supabase/server';
import { SupabaseAuthRepository } from '@/user-account/infrastructure/SupabaseAuthRepository';
import { SignUpUseCase } from '@/user-account/application/SignUpUseCase';
import type { AuthResult } from '@/user-account/domain/AuthResult';

export async function signupAction(
  prevState: AuthResult | null,
  formData: FormData
): Promise<AuthResult> {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  const supabase = await createSupabaseServerClient();
  const authRepository = new SupabaseAuthRepository(supabase);
  const useCase = new SignUpUseCase(authRepository);

  return useCase.execute({ email, password });
}
