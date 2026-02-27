/**
 * Task 3.1: logoutAction 에러 처리 추가 테스트
 *
 * logoutAction이 LogoutResult 타입을 반환하며,
 * 성공 시 /login으로 리다이렉트하고 실패 시 에러 객체를 반환하는지 검증한다.
 *
 * Requirements: 4.1, 4.2, 4.3, 4.4
 */

jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
}));

jest.mock('@/shared/infrastructure/supabase/server', () => ({
  createSupabaseServerClient: jest.fn(),
}));

import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/shared/infrastructure/supabase/server';
import { logoutAction } from '@/app/actions/auth';
import type { LogoutResult } from '@/app/actions/auth';

const mockRedirect = redirect as jest.MockedFunction<typeof redirect>;
const mockCreateSupabaseServerClient = createSupabaseServerClient as jest.MockedFunction<
  typeof createSupabaseServerClient
>;

/**
 * signOut 결과를 기반으로 mock Supabase 클라이언트를 생성한다.
 */
function createMockSupabaseClient(signOutResult: {
  error: { message: string } | null;
}) {
  return {
    auth: {
      signOut: jest.fn().mockResolvedValue(signOutResult),
    },
  };
}

describe('logoutAction', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('성공 시나리오', () => {
    it('로그아웃 성공 시 SupabaseAuthRepository.signOut()을 통해 Supabase Auth 세션을 종료한다', async () => {
      // Req 4.1: Supabase Auth 세션 종료
      const mockClient = createMockSupabaseClient({ error: null });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockCreateSupabaseServerClient.mockResolvedValue(mockClient as any);

      await logoutAction();

      expect(mockClient.auth.signOut).toHaveBeenCalledTimes(1);
    });

    it('로그아웃 성공 시 /login 페이지로 리다이렉트한다', async () => {
      // Req 4.2: 로그인 페이지로 리다이렉트
      const mockClient = createMockSupabaseClient({ error: null });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockCreateSupabaseServerClient.mockResolvedValue(mockClient as any);

      await logoutAction();

      expect(mockRedirect).toHaveBeenCalledWith('/login');
    });

    it('로그아웃 성공 시 redirect가 정확히 1회 호출된다', async () => {
      // Req 4.2: 리다이렉트가 중복 호출되지 않음
      const mockClient = createMockSupabaseClient({ error: null });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockCreateSupabaseServerClient.mockResolvedValue(mockClient as any);

      await logoutAction();

      expect(mockRedirect).toHaveBeenCalledTimes(1);
    });
  });

  describe('실패 시나리오', () => {
    it('로그아웃 중 에러 발생 시 status가 error인 LogoutResult를 반환한다', async () => {
      // Req 4.4: 에러 메시지 표시를 위한 에러 객체 반환
      const mockClient = {
        auth: {
          signOut: jest.fn().mockRejectedValue(new Error('Network error')),
        },
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockCreateSupabaseServerClient.mockResolvedValue(mockClient as any);

      const result = await logoutAction();

      expect(result).toBeDefined();
      expect(result!.status).toBe('error');
    });

    it('로그아웃 실패 시 에러 메시지를 포함한 결과 객체를 반환한다', async () => {
      // Req 4.4: 사용자에게 오류 메시지 표시
      const mockClient = {
        auth: {
          signOut: jest.fn().mockRejectedValue(new Error('Server error')),
        },
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockCreateSupabaseServerClient.mockResolvedValue(mockClient as any);

      const result = await logoutAction();

      expect(result).toBeDefined();
      expect(result!.status).toBe('error');
      if (result!.status === 'error') {
        expect(typeof result!.message).toBe('string');
        expect(result!.message.length).toBeGreaterThan(0);
      }
    });

    it('로그아웃 실패 시 redirect가 호출되지 않는다', async () => {
      // Req 4.2 반전: 실패 시에는 리다이렉트하지 않음
      const mockClient = {
        auth: {
          signOut: jest.fn().mockRejectedValue(new Error('Network error')),
        },
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockCreateSupabaseServerClient.mockResolvedValue(mockClient as any);

      await logoutAction();

      expect(mockRedirect).not.toHaveBeenCalled();
    });
  });

  describe('redirect 호출 위치', () => {
    it('redirect는 try-catch 블록 외부에서 호출되어 NEXT_REDIRECT 에러 충돌을 방지한다', async () => {
      // design.md: redirect()는 try-catch 외부에서 호출
      // redirect가 에러를 던져도 logoutAction이 이를 catch하지 않아야 한다
      const mockClient = createMockSupabaseClient({ error: null });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockCreateSupabaseServerClient.mockResolvedValue(mockClient as any);

      // Next.js의 redirect는 NEXT_REDIRECT 에러를 던진다
      const redirectError = new Error('NEXT_REDIRECT');
      mockRedirect.mockImplementation(() => {
        throw redirectError;
      });

      // redirect가 던진 에러가 그대로 전파되어야 한다 (catch되지 않아야 한다)
      await expect(logoutAction()).rejects.toThrow('NEXT_REDIRECT');
    });
  });

  describe('LogoutResult 타입 계약', () => {
    it('성공 시 LogoutResult의 status는 success이다 (redirect 전)', async () => {
      // 성공 시 redirect가 호출되므로 반환값이 없을 수 있으나,
      // signOut이 성공적으로 완료됐는지를 검증한다
      const mockClient = createMockSupabaseClient({ error: null });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockCreateSupabaseServerClient.mockResolvedValue(mockClient as any);

      // redirect를 모킹하여 에러를 던지지 않도록 한다
      mockRedirect.mockImplementation(() => undefined as never);

      await logoutAction();

      // signOut이 호출된 후 redirect가 호출되어야 한다
      expect(mockClient.auth.signOut).toHaveBeenCalled();
      expect(mockRedirect).toHaveBeenCalledWith('/login');
    });

    it('실패 시 LogoutResult는 error status와 message를 포함한다', async () => {
      const mockClient = {
        auth: {
          signOut: jest.fn().mockRejectedValue(new Error('Auth service unavailable')),
        },
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockCreateSupabaseServerClient.mockResolvedValue(mockClient as any);

      const result = await logoutAction();

      expect(result).toEqual(
        expect.objectContaining({
          status: 'error',
          message: expect.any(String),
        })
      );
    });
  });
});
