"use server";

import { redirect } from "next/navigation";
import { SigninUseCase } from "@/auth/application/signin-use-case";
import { SupabaseAuthRepository } from "@/auth/infrastructure/supabase-auth-repository";
import type { SigninActionState } from "@/auth/domain/types";

export async function signin(
  _prevState: SigninActionState,
  formData: FormData
): Promise<SigninActionState> {
  const email = formData.get("email");
  const password = formData.get("password");

  if (typeof email !== "string" || typeof password !== "string") {
    return { error: "이메일 또는 비밀번호가 올바르지 않습니다" };
  }

  const repository = new SupabaseAuthRepository();
  const useCase = new SigninUseCase(repository);

  const result = await useCase.execute({ email, password });

  if (!result.success) {
    return { error: "이메일 또는 비밀번호가 올바르지 않습니다" };
  }

  redirect("/dashboard");
}
