/**
 * Task 6.2: 회원가입 서버 액션 통합 테스트
 *
 * createSupabaseServerClient를 모킹하여
 * signupAction의 통합 흐름을 검증한다.
 */

// createSupabaseServerClient를 모킹하여 실제 Supabase 호출을 차단한다
jest.mock('@/shared/infrastructure/supabase/server', () => ({
  createSupabaseServerClient: jest.fn(),
}));

import { createSupabaseServerClient } from '@/shared/infrastructure/supabase/server';
import { signupAction } from '@/app/(auth)/signup/actions';
import type { AuthResult } from '@/user-account/domain/AuthResult';

const mockCreateSupabaseServerClient = createSupabaseServerClient as jest.MockedFunction<
  typeof createSupabaseServerClient
>;

/**
 * Supabase 클라이언트 모의 객체를 생성하는 헬퍼
 */
function createMockSupabaseClient(signUpResult: {
  data: { user: { id: string; identities?: Array<{ id: string }> } | null; session: null };
  error: { message: string } | null;
}) {
  return {
    auth: {
      signUp: jest.fn().mockResolvedValue(signUpResult),
    },
  };
}

describe('signupAction', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('성공 시나리오', () => {
    it('유효한 eluocnc.com 이메일로 회원가입 성공 시 signup_success 상태를 반환해야 한다', async () => {
      const mockClient = createMockSupabaseClient({
        data: {
          user: { id: 'user-1', identities: [{ id: 'identity-1' }] },
          session: null,
        },
        error: null,
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockCreateSupabaseServerClient.mockResolvedValue(mockClient as any);

      const formData = new FormData();
      formData.append('email', 'newuser@eluocnc.com');
      formData.append('password', 'ValidPass1!');

      const result = await signupAction(null, formData);

      expect(result.status).toBe('signup_success');
    });

    it('회원가입 성공 시 반환된 message 필드가 문자열이어야 한다', async () => {
      const mockClient = createMockSupabaseClient({
        data: {
          user: { id: 'user-1', identities: [{ id: 'identity-1' }] },
          session: null,
        },
        error: null,
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockCreateSupabaseServerClient.mockResolvedValue(mockClient as any);

      const formData = new FormData();
      formData.append('email', 'newuser@eluocnc.com');
      formData.append('password', 'ValidPass1!');

      const result = await signupAction(null, formData);

      if (result.status === 'signup_success') {
        expect(typeof result.message).toBe('string');
        expect(result.message.length).toBeGreaterThan(0);
      }
    });
  });

  describe('실패 시나리오 - 허용되지 않은 도메인', () => {
    it('eluocnc.com이 아닌 이메일로 가입 시도 시 invalid_email_domain 에러를 반환해야 한다', async () => {
      // 도메인 검증은 SignUpUseCase에서 수행하므로 Supabase는 호출되지 않는다
      const mockClient = createMockSupabaseClient({
        data: { user: null, session: null },
        error: null,
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockCreateSupabaseServerClient.mockResolvedValue(mockClient as any);

      const formData = new FormData();
      formData.append('email', 'user@gmail.com');
      formData.append('password', 'ValidPass1!');

      const result = await signupAction(null, formData);

      expect(result.status).toBe('error');
      if (result.status === 'error') {
        expect(result.code).toBe('invalid_email_domain');
      }
    });

    it('허용되지 않은 도메인 이메일로 가입 시도 시 Supabase signUp이 호출되지 않아야 한다', async () => {
      const mockSignUp = jest.fn().mockResolvedValue({
        data: { user: null, session: null },
        error: null,
      });
      const mockClient = { auth: { signUp: mockSignUp } };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockCreateSupabaseServerClient.mockResolvedValue(mockClient as any);

      const formData = new FormData();
      formData.append('email', 'user@otherdomain.com');
      formData.append('password', 'ValidPass1!');

      await signupAction(null, formData);

      expect(mockSignUp).not.toHaveBeenCalled();
    });
  });

  describe('실패 시나리오 - 중복 이메일', () => {
    it('이미 등록된 이메일로 가입 시도 시 email_already_registered 에러를 반환해야 한다', async () => {
      // identities 배열이 비어 있으면 중복 이메일로 판별한다
      const mockClient = createMockSupabaseClient({
        data: {
          user: { id: 'user-1', identities: [] },
          session: null,
        },
        error: null,
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockCreateSupabaseServerClient.mockResolvedValue(mockClient as any);

      const formData = new FormData();
      formData.append('email', 'existing@eluocnc.com');
      formData.append('password', 'ValidPass1!');

      const result = await signupAction(null, formData);

      expect(result.status).toBe('error');
      if (result.status === 'error') {
        expect(result.code).toBe('email_already_registered');
      }
    });
  });

  describe('실패 시나리오 - 패스워드 정책 위반', () => {
    it('8자 미만 패스워드로 가입 시도 시 에러를 반환해야 한다', async () => {
      const mockClient = createMockSupabaseClient({
        data: { user: null, session: null },
        error: null,
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockCreateSupabaseServerClient.mockResolvedValue(mockClient as any);

      const formData = new FormData();
      formData.append('email', 'user@eluocnc.com');
      formData.append('password', 'Short1!');

      const result = await signupAction(null, formData);

      expect(result.status).toBe('error');
    });

    it('특수문자 미포함 패스워드로 가입 시도 시 에러를 반환해야 한다', async () => {
      const mockClient = createMockSupabaseClient({
        data: { user: null, session: null },
        error: null,
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockCreateSupabaseServerClient.mockResolvedValue(mockClient as any);

      const formData = new FormData();
      formData.append('email', 'user@eluocnc.com');
      formData.append('password', 'NoSpecialChar1');

      const result = await signupAction(null, formData);

      expect(result.status).toBe('error');
    });
  });

  describe('FormData 처리', () => {
    it('FormData에서 이메일과 패스워드를 올바르게 추출하여 signUp을 호출해야 한다', async () => {
      const mockSignUp = jest.fn().mockResolvedValue({
        data: {
          user: { id: 'user-1', identities: [{ id: 'identity-1' }] },
          session: null,
        },
        error: null,
      });
      const mockClient = { auth: { signUp: mockSignUp } };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockCreateSupabaseServerClient.mockResolvedValue(mockClient as any);

      const formData = new FormData();
      formData.append('email', 'newuser@eluocnc.com');
      formData.append('password', 'TestPass1!');

      await signupAction(null, formData);

      expect(mockSignUp).toHaveBeenCalledWith({
        email: 'newuser@eluocnc.com',
        password: 'TestPass1!',
      });
    });
  });

  describe('prevState 파라미터', () => {
    it('prevState가 null이더라도 정상적으로 동작해야 한다', async () => {
      const mockClient = createMockSupabaseClient({
        data: { user: null, session: null },
        error: { message: '오류' },
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockCreateSupabaseServerClient.mockResolvedValue(mockClient as any);

      const formData = new FormData();
      formData.append('email', 'user@eluocnc.com');
      formData.append('password', 'ValidPass1!');

      const result = await signupAction(null, formData);

      expect(result).toHaveProperty('status');
    });

    it('prevState가 기존 AuthResult이더라도 정상적으로 동작해야 한다', async () => {
      const prevState: AuthResult = {
        status: 'error',
        code: 'invalid_email_domain',
        message: '이전 에러',
      };
      const mockClient = createMockSupabaseClient({
        data: { user: null, session: null },
        error: { message: '오류' },
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockCreateSupabaseServerClient.mockResolvedValue(mockClient as any);

      const formData = new FormData();
      formData.append('email', 'user@eluocnc.com');
      formData.append('password', 'ValidPass1!');

      const result = await signupAction(prevState, formData);

      expect(result).toHaveProperty('status');
    });
  });
});
