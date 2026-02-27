import { SignUpUseCase } from '@/user-account/application/SignUpUseCase';
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

describe('SignUpUseCase', () => {
  describe('성공 시나리오', () => {
    it('유효한 이메일과 패스워드로 가입 성공 시 status가 signup_success인 결과를 반환해야 한다', async () => {
      const signupSuccessResult: AuthResult = {
        status: 'signup_success',
        message: '인증 메일이 발송되었습니다. 이메일을 확인해주세요.',
      };
      const mockRepo = createMockAuthRepository({
        signUp: jest.fn().mockResolvedValue(signupSuccessResult),
      });
      const useCase = new SignUpUseCase(mockRepo);

      const result = await useCase.execute({
        email: 'user@eluocnc.com',
        password: 'Password1!',
      });

      expect(result.status).toBe('signup_success');
      if (result.status === 'signup_success') {
        expect(typeof result.message).toBe('string');
        expect(result.message.length).toBeGreaterThan(0);
      }
    });

    it('가입 성공 시 AuthRepository.signUp이 올바른 이메일과 패스워드로 호출되어야 한다', async () => {
      const signupSuccessResult: AuthResult = {
        status: 'signup_success',
        message: '인증 메일이 발송되었습니다.',
      };
      const mockSignUp = jest.fn().mockResolvedValue(signupSuccessResult);
      const mockRepo = createMockAuthRepository({ signUp: mockSignUp });
      const useCase = new SignUpUseCase(mockRepo);

      await useCase.execute({
        email: 'newuser@eluocnc.com',
        password: 'SecurePass1!',
      });

      expect(mockSignUp).toHaveBeenCalledTimes(1);
      expect(mockSignUp).toHaveBeenCalledWith('newuser@eluocnc.com', 'SecurePass1!');
    });
  });

  describe('중복 이메일 시나리오', () => {
    it('이미 등록된 이메일로 가입 시 status가 error이고 code가 email_already_registered인 결과를 반환해야 한다', async () => {
      const duplicateResult: AuthResult = {
        status: 'error',
        code: 'email_already_registered',
        message: '이미 가입된 이메일입니다.',
      };
      const mockRepo = createMockAuthRepository({
        signUp: jest.fn().mockResolvedValue(duplicateResult),
      });
      const useCase = new SignUpUseCase(mockRepo);

      const result = await useCase.execute({
        email: 'existing@eluocnc.com',
        password: 'Password1!',
      });

      expect(result.status).toBe('error');
      if (result.status === 'error') {
        expect(result.code).toBe('email_already_registered');
        expect(typeof result.message).toBe('string');
        expect(result.message.length).toBeGreaterThan(0);
      }
    });
  });

  describe('허용되지 않은 도메인 시나리오', () => {
    it('eluocnc.com 외 도메인 이메일로 가입 시 status가 error이고 code가 invalid_email_domain인 결과를 반환해야 한다', async () => {
      const mockRepo = createMockAuthRepository({
        signUp: jest.fn(),
      });
      const useCase = new SignUpUseCase(mockRepo);

      const result = await useCase.execute({
        email: 'user@gmail.com',
        password: 'Password1!',
      });

      expect(result.status).toBe('error');
      if (result.status === 'error') {
        expect(result.code).toBe('invalid_email_domain');
        expect(result.message).toBe('eluocnc.com 이메일만 가입이 가능합니다');
      }
    });

    it('도메인 검증 실패 시 AuthRepository.signUp이 호출되지 않아야 한다', async () => {
      const mockSignUp = jest.fn();
      const mockRepo = createMockAuthRepository({ signUp: mockSignUp });
      const useCase = new SignUpUseCase(mockRepo);

      await useCase.execute({
        email: 'user@naver.com',
        password: 'Password1!',
      });

      expect(mockSignUp).not.toHaveBeenCalled();
    });

    it('naver.com 도메인 이메일로 가입 시 적절한 에러 메시지를 반환해야 한다', async () => {
      const mockRepo = createMockAuthRepository({ signUp: jest.fn() });
      const useCase = new SignUpUseCase(mockRepo);

      const result = await useCase.execute({
        email: 'user@naver.com',
        password: 'Password1!',
      });

      expect(result.status).toBe('error');
      if (result.status === 'error') {
        expect(result.code).toBe('invalid_email_domain');
      }
    });
  });

  describe('패스워드 정책 위반 시나리오', () => {
    it('8자 미만 패스워드로 가입 시 status가 error인 결과를 반환해야 한다', async () => {
      const mockRepo = createMockAuthRepository({ signUp: jest.fn() });
      const useCase = new SignUpUseCase(mockRepo);

      const result = await useCase.execute({
        email: 'user@eluocnc.com',
        password: 'Pw1!',
      });

      expect(result.status).toBe('error');
    });

    it('8자 미만 패스워드로 가입 시 AuthRepository.signUp이 호출되지 않아야 한다', async () => {
      const mockSignUp = jest.fn();
      const mockRepo = createMockAuthRepository({ signUp: mockSignUp });
      const useCase = new SignUpUseCase(mockRepo);

      await useCase.execute({
        email: 'user@eluocnc.com',
        password: 'Pw1!',
      });

      expect(mockSignUp).not.toHaveBeenCalled();
    });

    it('특수문자 미포함 패스워드로 가입 시 status가 error인 결과를 반환해야 한다', async () => {
      const mockRepo = createMockAuthRepository({ signUp: jest.fn() });
      const useCase = new SignUpUseCase(mockRepo);

      const result = await useCase.execute({
        email: 'user@eluocnc.com',
        password: 'Password1',
      });

      expect(result.status).toBe('error');
    });

    it('특수문자 미포함 패스워드로 가입 시 AuthRepository.signUp이 호출되지 않아야 한다', async () => {
      const mockSignUp = jest.fn();
      const mockRepo = createMockAuthRepository({ signUp: mockSignUp });
      const useCase = new SignUpUseCase(mockRepo);

      await useCase.execute({
        email: 'user@eluocnc.com',
        password: 'Password1',
      });

      expect(mockSignUp).not.toHaveBeenCalled();
    });

    it('패스워드 정책 위반 시 에러 메시지가 포함되어야 한다', async () => {
      const mockRepo = createMockAuthRepository({ signUp: jest.fn() });
      const useCase = new SignUpUseCase(mockRepo);

      const result = await useCase.execute({
        email: 'user@eluocnc.com',
        password: 'short',
      });

      expect(result.status).toBe('error');
      if (result.status === 'error') {
        expect(typeof result.message).toBe('string');
        expect(result.message.length).toBeGreaterThan(0);
      }
    });
  });

  describe('도메인 검증 우선순위', () => {
    it('도메인과 패스워드 모두 유효하지 않을 때 도메인 에러를 먼저 반환해야 한다', async () => {
      const mockRepo = createMockAuthRepository({ signUp: jest.fn() });
      const useCase = new SignUpUseCase(mockRepo);

      const result = await useCase.execute({
        email: 'user@gmail.com',
        password: 'short',
      });

      expect(result.status).toBe('error');
      if (result.status === 'error') {
        expect(result.code).toBe('invalid_email_domain');
      }
    });
  });

  describe('execute() 반환값 타입 검증', () => {
    it('반환값은 AuthResult 타입이어야 한다 (status 필드 존재)', async () => {
      const signupSuccessResult: AuthResult = {
        status: 'signup_success',
        message: '인증 메일이 발송되었습니다.',
      };
      const mockRepo = createMockAuthRepository({
        signUp: jest.fn().mockResolvedValue(signupSuccessResult),
      });
      const useCase = new SignUpUseCase(mockRepo);

      const result = await useCase.execute({
        email: 'user@eluocnc.com',
        password: 'Password1!',
      });

      expect(result).toHaveProperty('status');
    });
  });
});
