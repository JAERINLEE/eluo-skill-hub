/**
 * Task 4.1: SupabaseAuthRepository 단위 테스트
 *
 * Supabase Auth API를 래핑하는 인프라 계층 구현체를 검증한다.
 * Supabase 클라이언트를 모킹하여 도메인 에러 코드 매핑 로직만 독립적으로 테스트한다.
 */

import { SupabaseAuthRepository } from '@/user-account/infrastructure/SupabaseAuthRepository';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Supabase 클라이언트 mock 헬퍼
 * 테스트마다 원하는 signIn/signUp/signOut/verifyOtp 동작을 주입할 수 있도록 한다.
 */
function createMockSupabaseClient(overrides?: {
  signInWithPassword?: jest.Mock;
  signUp?: jest.Mock;
  signOut?: jest.Mock;
  verifyOtp?: jest.Mock;
}): SupabaseClient {
  return {
    auth: {
      signInWithPassword: overrides?.signInWithPassword ?? jest.fn(),
      signUp: overrides?.signUp ?? jest.fn(),
      signOut: overrides?.signOut ?? jest.fn(),
      verifyOtp: overrides?.verifyOtp ?? jest.fn(),
    },
  } as unknown as SupabaseClient;
}

describe('SupabaseAuthRepository', () => {
  describe('signIn()', () => {
    describe('로그인 성공', () => {
      it('signInWithPassword가 성공하면 status가 success이고 redirectTo가 "/"인 결과를 반환해야 한다', async () => {
        const mockSignIn = jest.fn().mockResolvedValue({
          data: { user: { id: 'user-123' }, session: {} },
          error: null,
        });
        const client = createMockSupabaseClient({ signInWithPassword: mockSignIn });
        const repository = new SupabaseAuthRepository(client);

        const result = await repository.signIn('user@eluocnc.com', 'password123!');

        expect(result.status).toBe('success');
        if (result.status === 'success') {
          expect(result.redirectTo).toBe('/');
        }
      });

      it('올바른 이메일과 패스워드를 Supabase에 전달해야 한다', async () => {
        const mockSignIn = jest.fn().mockResolvedValue({
          data: { user: { id: 'user-123' }, session: {} },
          error: null,
        });
        const client = createMockSupabaseClient({ signInWithPassword: mockSignIn });
        const repository = new SupabaseAuthRepository(client);

        await repository.signIn('user@eluocnc.com', 'password123!');

        expect(mockSignIn).toHaveBeenCalledWith({
          email: 'user@eluocnc.com',
          password: 'password123!',
        });
      });
    });

    describe('이메일 미인증 에러', () => {
      it('email_not_confirmed 에러 코드 반환 시 이메일 미인증 에러 결과를 반환해야 한다', async () => {
        const mockSignIn = jest.fn().mockResolvedValue({
          data: { user: null, session: null },
          error: { code: 'email_not_confirmed', message: 'Email not confirmed' },
        });
        const client = createMockSupabaseClient({ signInWithPassword: mockSignIn });
        const repository = new SupabaseAuthRepository(client);

        const result = await repository.signIn('user@eluocnc.com', 'password123!');

        expect(result.status).toBe('error');
        if (result.status === 'error') {
          expect(result.code).toBe('email_not_confirmed');
          expect(result.message).toBe('이메일 인증이 필요합니다. 가입 시 발송된 인증 메일을 확인해주세요');
        }
      });
    });

    describe('잘못된 자격증명 에러', () => {
      it('email_not_confirmed 외의 인증 에러 반환 시 invalid_credentials 에러 결과를 반환해야 한다', async () => {
        const mockSignIn = jest.fn().mockResolvedValue({
          data: { user: null, session: null },
          error: { code: 'invalid_login_credentials', message: 'Invalid login credentials' },
        });
        const client = createMockSupabaseClient({ signInWithPassword: mockSignIn });
        const repository = new SupabaseAuthRepository(client);

        const result = await repository.signIn('user@eluocnc.com', 'wrongpassword');

        expect(result.status).toBe('error');
        if (result.status === 'error') {
          expect(result.code).toBe('invalid_credentials');
          expect(result.message).toBe('이메일 또는 패스워드가 올바르지 않습니다');
        }
      });

      it('user_not_found 에러 코드 반환 시 invalid_credentials 에러 결과를 반환해야 한다', async () => {
        const mockSignIn = jest.fn().mockResolvedValue({
          data: { user: null, session: null },
          error: { code: 'user_not_found', message: 'User not found' },
        });
        const client = createMockSupabaseClient({ signInWithPassword: mockSignIn });
        const repository = new SupabaseAuthRepository(client);

        const result = await repository.signIn('notexist@eluocnc.com', 'password123!');

        expect(result.status).toBe('error');
        if (result.status === 'error') {
          expect(result.code).toBe('invalid_credentials');
        }
      });
    });

    describe('네트워크/알 수 없는 에러', () => {
      it('예외가 발생하면 network_error 에러 결과를 반환해야 한다', async () => {
        const mockSignIn = jest.fn().mockRejectedValue(new Error('Network failure'));
        const client = createMockSupabaseClient({ signInWithPassword: mockSignIn });
        const repository = new SupabaseAuthRepository(client);

        const result = await repository.signIn('user@eluocnc.com', 'password123!');

        expect(result.status).toBe('error');
        if (result.status === 'error') {
          expect(result.code).toBe('network_error');
          expect(result.message).toBe('네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요');
        }
      });
    });
  });

  describe('signUp()', () => {
    describe('회원가입 성공', () => {
      it('signUp이 성공하고 identities 배열이 있으면 signup_success 결과를 반환해야 한다', async () => {
        const mockSignUp = jest.fn().mockResolvedValue({
          data: {
            user: {
              id: 'user-123',
              identities: [{ id: 'identity-1', provider: 'email' }],
            },
            session: null,
          },
          error: null,
        });
        const client = createMockSupabaseClient({ signUp: mockSignUp });
        const repository = new SupabaseAuthRepository(client);

        const result = await repository.signUp('user@eluocnc.com', 'password123!');

        expect(result.status).toBe('signup_success');
        if (result.status === 'signup_success') {
          expect(result.message).toBe('인증 메일이 발송되었습니다. 이메일을 확인해주세요');
        }
      });

      it('올바른 이메일과 패스워드를 Supabase에 전달해야 한다', async () => {
        const mockSignUp = jest.fn().mockResolvedValue({
          data: {
            user: {
              id: 'user-123',
              identities: [{ id: 'identity-1', provider: 'email' }],
            },
            session: null,
          },
          error: null,
        });
        const client = createMockSupabaseClient({ signUp: mockSignUp });
        const repository = new SupabaseAuthRepository(client);

        await repository.signUp('user@eluocnc.com', 'password123!');

        expect(mockSignUp).toHaveBeenCalledWith({
          email: 'user@eluocnc.com',
          password: 'password123!',
        });
      });
    });

    describe('중복 이메일 감지', () => {
      it('identities 배열이 비어 있으면 email_already_registered 에러 결과를 반환해야 한다', async () => {
        const mockSignUp = jest.fn().mockResolvedValue({
          data: {
            user: {
              id: 'user-123',
              identities: [],
            },
            session: null,
          },
          error: null,
        });
        const client = createMockSupabaseClient({ signUp: mockSignUp });
        const repository = new SupabaseAuthRepository(client);

        const result = await repository.signUp('duplicate@eluocnc.com', 'password123!');

        expect(result.status).toBe('error');
        if (result.status === 'error') {
          expect(result.code).toBe('email_already_registered');
          expect(result.message).toBe('이미 가입된 이메일입니다');
        }
      });

      it('user가 null이고 error도 없는 경우 email_already_registered 에러 결과를 반환해야 한다', async () => {
        const mockSignUp = jest.fn().mockResolvedValue({
          data: {
            user: null,
            session: null,
          },
          error: null,
        });
        const client = createMockSupabaseClient({ signUp: mockSignUp });
        const repository = new SupabaseAuthRepository(client);

        const result = await repository.signUp('duplicate@eluocnc.com', 'password123!');

        expect(result.status).toBe('error');
        if (result.status === 'error') {
          expect(result.code).toBe('email_already_registered');
        }
      });
    });
  });

  describe('signOut()', () => {
    it('signOut을 호출하면 Supabase signOut이 실행되어야 한다', async () => {
      const mockSignOut = jest.fn().mockResolvedValue({ error: null });
      const client = createMockSupabaseClient({ signOut: mockSignOut });
      const repository = new SupabaseAuthRepository(client);

      await repository.signOut();

      expect(mockSignOut).toHaveBeenCalledTimes(1);
    });

    it('signOut은 void를 반환해야 한다', async () => {
      const mockSignOut = jest.fn().mockResolvedValue({ error: null });
      const client = createMockSupabaseClient({ signOut: mockSignOut });
      const repository = new SupabaseAuthRepository(client);

      const result = await repository.signOut();

      expect(result).toBeUndefined();
    });
  });

  describe('verifyOtp()', () => {
    describe('OTP 인증 성공', () => {
      it('verifyOtp가 성공하면 status가 success이고 redirectTo가 "/"인 결과를 반환해야 한다', async () => {
        const mockVerifyOtp = jest.fn().mockResolvedValue({
          data: { user: { id: 'user-123' }, session: {} },
          error: null,
        });
        const client = createMockSupabaseClient({ verifyOtp: mockVerifyOtp });
        const repository = new SupabaseAuthRepository(client);

        const result = await repository.verifyOtp('token-hash-value', 'email');

        expect(result.status).toBe('success');
        if (result.status === 'success') {
          expect(result.redirectTo).toBe('/');
        }
      });

      it('tokenHash와 type을 Supabase에 올바르게 전달해야 한다', async () => {
        const mockVerifyOtp = jest.fn().mockResolvedValue({
          data: { user: { id: 'user-123' }, session: {} },
          error: null,
        });
        const client = createMockSupabaseClient({ verifyOtp: mockVerifyOtp });
        const repository = new SupabaseAuthRepository(client);

        await repository.verifyOtp('my-token-hash', 'email');

        expect(mockVerifyOtp).toHaveBeenCalledWith({
          token_hash: 'my-token-hash',
          type: 'email',
        });
      });
    });

    describe('OTP 인증 실패', () => {
      it('verifyOtp가 에러를 반환하면 unknown_error 에러 결과를 반환해야 한다', async () => {
        const mockVerifyOtp = jest.fn().mockResolvedValue({
          data: { user: null, session: null },
          error: { code: 'otp_expired', message: 'OTP has expired' },
        });
        const client = createMockSupabaseClient({ verifyOtp: mockVerifyOtp });
        const repository = new SupabaseAuthRepository(client);

        const result = await repository.verifyOtp('expired-token', 'email');

        expect(result.status).toBe('error');
        if (result.status === 'error') {
          expect(result.code).toBe('unknown_error');
          expect(result.message).toBe('인증 링크가 유효하지 않거나 만료되었습니다');
        }
      });
    });
  });
});
