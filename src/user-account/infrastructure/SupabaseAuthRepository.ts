import type { SupabaseClient } from '@supabase/supabase-js';
import type { AuthRepository } from '@/user-account/domain/AuthRepository';
import type { AuthResult } from '@/user-account/domain/AuthResult';

export class SupabaseAuthRepository implements AuthRepository {
  constructor(private readonly supabaseClient: SupabaseClient) {}

  async signIn(email: string, password: string): Promise<AuthResult> {
    try {
      const { data, error } = await this.supabaseClient.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.code === 'email_not_confirmed') {
          return {
            status: 'error',
            code: 'email_not_confirmed',
            message: '이메일 인증이 필요합니다. 가입 시 발송된 인증 메일을 확인해주세요',
          };
        }
        return {
          status: 'error',
          code: 'invalid_credentials',
          message: '이메일 또는 패스워드가 올바르지 않습니다',
        };
      }

      return { status: 'success', redirectTo: '/' };
    } catch {
      return {
        status: 'error',
        code: 'network_error',
        message: '네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요',
      };
    }
  }

  async signUp(email: string, password: string): Promise<AuthResult> {
    try {
      const { data, error } = await this.supabaseClient.auth.signUp({
        email,
        password,
      });

      if (error) {
        return {
          status: 'error',
          code: 'unknown_error',
          message: '회원가입 중 오류가 발생했습니다',
        };
      }

      if (!data.user || data.user.identities?.length === 0) {
        return {
          status: 'error',
          code: 'email_already_registered',
          message: '이미 가입된 이메일입니다',
        };
      }

      return {
        status: 'signup_success',
        message: '인증 메일이 발송되었습니다. 이메일을 확인해주세요',
      };
    } catch {
      return {
        status: 'error',
        code: 'network_error',
        message: '네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요',
      };
    }
  }

  async signOut(): Promise<void> {
    await this.supabaseClient.auth.signOut();
  }

  async verifyOtp(tokenHash: string, type: string): Promise<AuthResult> {
    try {
      const { data, error } = await this.supabaseClient.auth.verifyOtp({
        token_hash: tokenHash,
        type: type as 'email',
      });

      if (error) {
        return {
          status: 'error',
          code: 'unknown_error',
          message: '인증 링크가 유효하지 않거나 만료되었습니다',
        };
      }

      return { status: 'success', redirectTo: '/' };
    } catch {
      return {
        status: 'error',
        code: 'unknown_error',
        message: '인증 링크가 유효하지 않거나 만료되었습니다',
      };
    }
  }
}
