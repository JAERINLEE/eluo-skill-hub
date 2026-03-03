"use server";

import { redirect } from "next/navigation";
import { SignupUseCase } from "@/auth/application/signup-use-case";
import { VerifyOtpUseCase } from "@/auth/application/verify-otp-use-case";
import { ResendOtpUseCase } from "@/auth/application/resend-otp-use-case";
import { SupabaseAuthRepository } from "@/auth/infrastructure/supabase-auth-repository";
import type {
  SignupActionState,
  VerifyOtpActionState,
  ResendOtpActionState,
} from "@/auth/domain/types";

const ALLOWED_EMAIL_DOMAIN = "eluocnc.com";

function isAllowedEmailDomain(email: string): boolean {
  const lower = email.toLowerCase();
  const atIndex = lower.lastIndexOf("@");
  if (atIndex === -1) return false;
  return lower.slice(atIndex + 1) === ALLOWED_EMAIL_DOMAIN;
}

export async function signup(
  _prevState: SignupActionState,
  formData: FormData
): Promise<SignupActionState> {
  const email = formData.get("email");
  const password = formData.get("password");

  if (typeof email !== "string" || email.trim() === "") {
    return { error: "이메일을 입력해 주세요", step: "form", email: "" };
  }

  if (!isAllowedEmailDomain(email)) {
    return {
      error: "eluocnc.com 이메일만 사용할 수 있습니다",
      step: "form",
      email: "",
    };
  }

  if (typeof password !== "string" || password.length < 8) {
    return {
      error: "비밀번호는 최소 8자 이상이어야 합니다",
      step: "form",
      email: "",
    };
  }

  const repository = new SupabaseAuthRepository();
  const useCase = new SignupUseCase(repository);

  const result = await useCase.execute({ email: email.toLowerCase(), password });

  if (result.success === "pending") {
    return { error: "", step: "verify", email: email.toLowerCase() };
  }

  if (!result.success) {
    return { error: result.error, step: "form", email: "" };
  }

  return { error: "", step: "verify", email: email.toLowerCase() };
}

export async function verifyOtp(
  _prevState: VerifyOtpActionState,
  formData: FormData
): Promise<VerifyOtpActionState> {
  const email = formData.get("email");
  const token = formData.get("token");

  if (typeof email !== "string" || typeof token !== "string") {
    return { error: "인증코드가 올바르지 않습니다" };
  }

  if (token.trim().length !== 8 || !/^\d{8}$/.test(token.trim())) {
    return { error: "인증코드 8자리를 입력해 주세요" };
  }

  const repository = new SupabaseAuthRepository();
  const useCase = new VerifyOtpUseCase(repository);

  const result = await useCase.execute({ email, token: token.trim() });

  if (!result.success) {
    return { error: result.error };
  }

  redirect("/dashboard");
}

export async function resendOtp(
  _prevState: ResendOtpActionState,
  formData: FormData
): Promise<ResendOtpActionState> {
  const email = formData.get("email");

  if (typeof email !== "string" || email.trim() === "") {
    return { error: "이메일 정보가 없습니다", success: false, isRateLimited: false };
  }

  const repository = new SupabaseAuthRepository();
  const useCase = new ResendOtpUseCase(repository);

  const result = await useCase.execute(email);

  if (!result.success) {
    return { error: result.error, success: false, isRateLimited: result.isRateLimited ?? false };
  }

  return { error: "", success: true, isRateLimited: false };
}
