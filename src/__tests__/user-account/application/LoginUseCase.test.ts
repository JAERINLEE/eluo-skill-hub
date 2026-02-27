import { LoginUseCase } from '@/user-account/application/LoginUseCase';
import type { AuthRepository } from '@/user-account/domain/AuthRepository';
import type { AuthResult } from '@/user-account/domain/AuthResult';

/**
 * AuthRepository 모의 객체(mock) 생성 헬퍼
 */
function createMockAuthRepository(
  overrides: Partial<AuthRepository> = {}
): AuthRepository {
  return {
    signIn: jest.fn(),
    signUp: jest.fn(),
    signOut: jest.fn(),
    verifyOtp: jest.fn(),
    ...overrides,
  };
}

describe('LoginUseCase', () => {
  describe('성공 시나리오', () => {
    it('로그인 성공 시 status가 success이고 redirectTo가 "/"인 결과를 반환해야 한다', async () => {
      const successResult: AuthResult = { status: 'success', redirectTo: '/' };
      const mockRepo = createMockAuthRepository({
        signIn: jest.fn().mockResolvedValue(successResult),
      });
      const useCase = new LoginUseCase(mockRepo);

      const result = await useCase.execute({
        email: 'user@eluocnc.com',
        password: 'Password1!',
      });

      expect(result).toEqual({ status: 'success', redirectTo: '/' });
    });

    it('AuthRepository.signIn이 올바른 이메일과 패스워드로 호출되어야 한다', async () => {
      const successResult: AuthResult = { status: 'success', redirectTo: '/' };
      const mockSignIn = jest.fn().mockResolvedValue(successResult);
      const mockRepo = createMockAuthRepository({ signIn: mockSignIn });
      const useCase = new LoginUseCase(mockRepo);

      await useCase.execute({
        email: 'user@eluocnc.com',
        password: 'Password1!',
      });

      expect(mockSignIn).toHaveBeenCalledTimes(1);
      expect(mockSignIn).toHaveBeenCalledWith('user@eluocnc.com', 'Password1!');
    });
  });

  describe('잘못된 자격증명 시나리오', () => {
    it('잘못된 자격증명 시 status가 error이고 code가 invalid_credentials인 결과를 반환해야 한다', async () => {
      const errorResult: AuthResult = {
        status: 'error',
        code: 'invalid_credentials',
        message: '이메일 또는 패스워드가 올바르지 않습니다.',
      };
      const mockRepo = createMockAuthRepository({
        signIn: jest.fn().mockResolvedValue(errorResult),
      });
      const useCase = new LoginUseCase(mockRepo);

      const result = await useCase.execute({
        email: 'user@eluocnc.com',
        password: 'WrongPass1!',
      });

      expect(result.status).toBe('error');
      if (result.status === 'error') {
        expect(result.code).toBe('invalid_credentials');
        expect(typeof result.message).toBe('string');
        expect(result.message.length).toBeGreaterThan(0);
      }
    });
  });

  describe('이메일 미인증 시나리오', () => {
    it('이메일 미인증 시 status가 error이고 code가 email_not_confirmed인 결과를 반환해야 한다', async () => {
      const errorResult: AuthResult = {
        status: 'error',
        code: 'email_not_confirmed',
        message: '이메일 인증이 완료되지 않았습니다.',
      };
      const mockRepo = createMockAuthRepository({
        signIn: jest.fn().mockResolvedValue(errorResult),
      });
      const useCase = new LoginUseCase(mockRepo);

      const result = await useCase.execute({
        email: 'user@eluocnc.com',
        password: 'Password1!',
      });

      expect(result.status).toBe('error');
      if (result.status === 'error') {
        expect(result.code).toBe('email_not_confirmed');
        expect(typeof result.message).toBe('string');
        expect(result.message.length).toBeGreaterThan(0);
      }
    });
  });

  describe('네트워크 오류 시나리오', () => {
    it('네트워크 오류 시 status가 error이고 code가 network_error인 결과를 반환해야 한다', async () => {
      const errorResult: AuthResult = {
        status: 'error',
        code: 'network_error',
        message: '네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
      };
      const mockRepo = createMockAuthRepository({
        signIn: jest.fn().mockResolvedValue(errorResult),
      });
      const useCase = new LoginUseCase(mockRepo);

      const result = await useCase.execute({
        email: 'user@eluocnc.com',
        password: 'Password1!',
      });

      expect(result.status).toBe('error');
      if (result.status === 'error') {
        expect(result.code).toBe('network_error');
      }
    });
  });

  describe('execute() 반환값 타입 검증', () => {
    it('반환값은 AuthResult 타입이어야 한다 (status 필드 존재)', async () => {
      const successResult: AuthResult = { status: 'success', redirectTo: '/' };
      const mockRepo = createMockAuthRepository({
        signIn: jest.fn().mockResolvedValue(successResult),
      });
      const useCase = new LoginUseCase(mockRepo);

      const result = await useCase.execute({
        email: 'user@eluocnc.com',
        password: 'Password1!',
      });

      expect(result).toHaveProperty('status');
    });
  });
});
