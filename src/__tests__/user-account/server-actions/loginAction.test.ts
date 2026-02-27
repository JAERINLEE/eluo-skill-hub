/**
 * Task 6.1: 로그인 서버 액션 통합 테스트
 *
 * createSupabaseServerClient와 next/navigation의 redirect를 모킹하여
 * loginAction의 통합 흐름을 검증한다.
 */

// next/navigation의 redirect는 테스트 환경에서 에러를 던지므로 모킹한다
jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
}));

// createSupabaseServerClient를 모킹하여 실제 Supabase 호출을 차단한다
jest.mock('@/shared/infrastructure/supabase/server', () => ({
  createSupabaseServerClient: jest.fn(),
}));

import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/shared/infrastructure/supabase/server';
import { loginAction } from '@/app/(auth)/login/actions';
import type { AuthResult } from '@/user-account/domain/AuthResult';

const mockRedirect = redirect as jest.MockedFunction<typeof redirect>;
const mockCreateSupabaseServerClient = createSupabaseServerClient as jest.MockedFunction<
  typeof createSupabaseServerClient
>;

/**
 * Supabase 클라이언트 모의 객체를 생성하는 헬퍼
 */
function createMockSupabaseClient(signInResult: {
  data: { user: { id: string } | null; session: null };
  error: { code?: string; message: string } | null;
}) {
  return {
    auth: {
      signInWithPassword: jest.fn().mockResolvedValue(signInResult),
    },
  };
}

describe('loginAction', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('성공 시나리오', () => {
    it('유효한 자격증명으로 로그인 성공 시 redirect가 "/"로 호출되어야 한다', async () => {
      const mockClient = createMockSupabaseClient({
        data: { user: { id: 'user-1' }, session: null },
        error: null,
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockCreateSupabaseServerClient.mockResolvedValue(mockClient as any);

      const formData = new FormData();
      formData.append('email', 'user@eluocnc.com');
      formData.append('password', 'Password1!');

      // redirect는 실제로 던지지 않으므로 결과가 반환되지 않을 수 있다
      // 여기서는 redirect가 호출되는지 검증한다
      try {
        await loginAction(null, formData);
      } catch {
        // redirect가 에러를 던지는 경우 무시
      }

      expect(mockRedirect).toHaveBeenCalledWith('/');
    });

    it('로그인 성공 시 redirect가 정확히 1회 호출되어야 한다', async () => {
      const mockClient = createMockSupabaseClient({
        data: { user: { id: 'user-1' }, session: null },
        error: null,
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockCreateSupabaseServerClient.mockResolvedValue(mockClient as any);

      const formData = new FormData();
      formData.append('email', 'user@eluocnc.com');
      formData.append('password', 'Password1!');

      try {
        await loginAction(null, formData);
      } catch {
        // redirect가 에러를 던지는 경우 무시
      }

      expect(mockRedirect).toHaveBeenCalledTimes(1);
    });
  });

  describe('실패 시나리오 - 잘못된 자격증명', () => {
    it('잘못된 자격증명으로 로그인 실패 시 error 상태의 AuthResult를 반환해야 한다', async () => {
      const mockClient = createMockSupabaseClient({
        data: { user: null, session: null },
        error: { code: 'invalid_credentials', message: 'Invalid login credentials' },
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockCreateSupabaseServerClient.mockResolvedValue(mockClient as any);

      const formData = new FormData();
      formData.append('email', 'user@eluocnc.com');
      formData.append('password', 'WrongPassword1!');

      const result = await loginAction(null, formData);

      expect(result.status).toBe('error');
    });

    it('잘못된 자격증명 실패 시 redirect가 호출되지 않아야 한다', async () => {
      const mockClient = createMockSupabaseClient({
        data: { user: null, session: null },
        error: { code: 'invalid_credentials', message: 'Invalid login credentials' },
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockCreateSupabaseServerClient.mockResolvedValue(mockClient as any);

      const formData = new FormData();
      formData.append('email', 'user@eluocnc.com');
      formData.append('password', 'WrongPassword1!');

      await loginAction(null, formData);

      expect(mockRedirect).not.toHaveBeenCalled();
    });

    it('잘못된 자격증명 실패 시 code가 invalid_credentials인 결과를 반환해야 한다', async () => {
      const mockClient = createMockSupabaseClient({
        data: { user: null, session: null },
        error: { code: 'invalid_credentials', message: 'Invalid login credentials' },
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockCreateSupabaseServerClient.mockResolvedValue(mockClient as any);

      const formData = new FormData();
      formData.append('email', 'user@eluocnc.com');
      formData.append('password', 'WrongPassword1!');

      const result = await loginAction(null, formData);

      expect(result.status).toBe('error');
      if (result.status === 'error') {
        expect(result.code).toBe('invalid_credentials');
        expect(typeof result.message).toBe('string');
        expect(result.message.length).toBeGreaterThan(0);
      }
    });
  });

  describe('실패 시나리오 - 이메일 미인증', () => {
    it('이메일 미인증 상태로 로그인 시 email_not_confirmed 에러를 반환해야 한다', async () => {
      const mockClient = createMockSupabaseClient({
        data: { user: null, session: null },
        error: { code: 'email_not_confirmed', message: 'Email not confirmed' },
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockCreateSupabaseServerClient.mockResolvedValue(mockClient as any);

      const formData = new FormData();
      formData.append('email', 'user@eluocnc.com');
      formData.append('password', 'Password1!');

      const result = await loginAction(null, formData);

      expect(result.status).toBe('error');
      if (result.status === 'error') {
        expect(result.code).toBe('email_not_confirmed');
      }
    });
  });

  describe('FormData 처리', () => {
    it('FormData에서 이메일과 패스워드를 올바르게 추출하여 signInWithPassword를 호출해야 한다', async () => {
      const mockSignIn = jest.fn().mockResolvedValue({
        data: { user: null, session: null },
        error: { code: 'invalid_credentials', message: 'Invalid' },
      });
      const mockClient = { auth: { signInWithPassword: mockSignIn } };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockCreateSupabaseServerClient.mockResolvedValue(mockClient as any);

      const formData = new FormData();
      formData.append('email', 'test@eluocnc.com');
      formData.append('password', 'TestPass1!');

      await loginAction(null, formData);

      expect(mockSignIn).toHaveBeenCalledWith({
        email: 'test@eluocnc.com',
        password: 'TestPass1!',
      });
    });
  });

  describe('prevState 파라미터', () => {
    it('prevState가 null이더라도 정상적으로 동작해야 한다', async () => {
      const mockClient = createMockSupabaseClient({
        data: { user: null, session: null },
        error: { code: 'invalid_credentials', message: 'Invalid' },
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockCreateSupabaseServerClient.mockResolvedValue(mockClient as any);

      const formData = new FormData();
      formData.append('email', 'user@eluocnc.com');
      formData.append('password', 'Password1!');

      const result = await loginAction(null, formData);

      expect(result).toHaveProperty('status');
    });

    it('prevState가 기존 AuthResult이더라도 정상적으로 동작해야 한다', async () => {
      const prevState: AuthResult = {
        status: 'error',
        code: 'invalid_credentials',
        message: '이전 에러 메시지',
      };
      const mockClient = createMockSupabaseClient({
        data: { user: null, session: null },
        error: { code: 'invalid_credentials', message: 'Invalid' },
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockCreateSupabaseServerClient.mockResolvedValue(mockClient as any);

      const formData = new FormData();
      formData.append('email', 'user@eluocnc.com');
      formData.append('password', 'Password1!');

      const result = await loginAction(prevState, formData);

      expect(result).toHaveProperty('status');
    });
  });
});
