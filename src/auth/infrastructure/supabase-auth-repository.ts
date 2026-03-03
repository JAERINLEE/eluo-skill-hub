import { createClient } from "@/shared/infrastructure/supabase/server";
import type {
  AuthRepository,
  SigninCredentials,
  SigninResult,
  SignupCredentials,
  SignupResult,
  VerifyOtpCredentials,
  VerifyOtpResult,
  ResendOtpResult,
} from "@/auth/domain/types";

export class SupabaseAuthRepository implements AuthRepository {
  async signIn(credentials: SigninCredentials): Promise<SigninResult> {
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  }

  async signUp(credentials: SignupCredentials): Promise<SignupResult> {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signUp({
      email: credentials.email.toLowerCase(),
      password: credentials.password,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    // 이미 존재하는 이메일: identities가 빈 배열로 반환됨
    if (data.user && data.user.identities && data.user.identities.length === 0) {
      // 이메일 미인증(pending) 계정: OTP 입력 화면으로 전환
      if (!data.user.email_confirmed_at) {
        return { success: "pending" };
      }
      // 이미 인증 완료된 계정
      return { success: false, error: "이미 가입된 이메일입니다" };
    }

    return { success: true };
  }

  async verifyOtp(credentials: VerifyOtpCredentials): Promise<VerifyOtpResult> {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({
      email: credentials.email,
      token: credentials.token,
      type: "signup",
    });

    if (error) {
      if (error.message.toLowerCase().includes("expired") || error.message.toLowerCase().includes("otp")) {
        return { success: false, error: "인증코드가 만료되었습니다. 다시 시도해주세요" };
      }
      return { success: false, error: "인증코드가 올바르지 않습니다" };
    }

    return { success: true };
  }

  async resendOtp(email: string): Promise<ResendOtpResult> {
    const supabase = await createClient();
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
    });

    if (error) {
      if (error.status === 429 || error.message.toLowerCase().includes("rate limit")) {
        return { success: false, error: "이메일 발송 횟수 제한에 도달했습니다. 잠시 후 다시 시도해주세요", isRateLimited: true };
      }
      return { success: false, error: error.message };
    }

    return { success: true };
  }
}
