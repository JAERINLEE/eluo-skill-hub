import type { SupabaseClient } from "@supabase/supabase-js";
import {
  AUTH_ERROR_USER_ALREADY_EXISTS,
  type AuthRepository,
  type AuthResult,
} from "@/auth/application/ports/AuthRepository";

export class SupabaseAuthRepository implements AuthRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async signUp(email: string, password: string): Promise<AuthResult> {
    const { data, error } = await this.supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
      },
    });
    if (error) {
      return { success: false, error: error.message, statusCode: error.status };
    }
    // Supabase returns identities=[] for already-confirmed emails (user_repeated_signup)
    if (data.user && (!data.user.identities || data.user.identities.length === 0)) {
      return {
        success: false,
        error: "이미 가입된 회원입니다",
        code: AUTH_ERROR_USER_ALREADY_EXISTS,
      };
    }
    return { success: true };
  }

  async signIn(email: string, password: string): Promise<AuthResult> {
    const { error } = await this.supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      return { success: false, error: error.message, statusCode: error.status };
    }
    return { success: true };
  }

  async signOut(): Promise<AuthResult> {
    const { error } = await this.supabase.auth.signOut();
    if (error) {
      return { success: false, error: error.message, statusCode: error.status };
    }
    return { success: true };
  }

  async verifyOtp(email: string, token: string): Promise<AuthResult> {
    const { error } = await this.supabase.auth.verifyOtp({
      email,
      token,
      type: "signup",
    });
    if (error) {
      return { success: false, error: error.message, statusCode: error.status };
    }
    return { success: true };
  }

  async resendOtp(email: string): Promise<AuthResult> {
    const { error } = await this.supabase.auth.resend({
      type: "signup",
      email,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
      },
    });
    if (error) {
      return { success: false, error: error.message, statusCode: error.status };
    }
    return { success: true };
  }
}
