import { VerifyCodeUseCase } from "../VerifyCodeUseCase";
import type { AuthRepository, AuthResult } from "@/auth/application/ports/AuthRepository";

const TEST_EMAIL = "user@eluocnc.com";
const VALID_CODE = "12345678";

const createMockAuthRepository = (
  verifyOtpResult: AuthResult
): AuthRepository => ({
  signUp: jest.fn(),
  signIn: jest.fn(),
  signOut: jest.fn(),
  verifyOtp: jest.fn().mockResolvedValue(verifyOtpResult),
  resendOtp: jest.fn(),
});

describe("VerifyCodeUseCase", () => {
  describe("입력값 유효성 검사", () => {
    it("빈 코드이면 { success: false, error: '인증 코드를 입력해주세요' }를 반환한다", async () => {
      const repository = createMockAuthRepository({ success: true });
      const useCase = new VerifyCodeUseCase(repository);

      const result = await useCase.execute({ email: TEST_EMAIL, code: "" });

      expect(result).toEqual({ success: false, error: "인증 코드를 입력해주세요" });
      expect(repository.verifyOtp).not.toHaveBeenCalled();
    });

    it("7자리 숫자 코드이면 { success: false, error: '인증 코드는 8자리 숫자입니다' }를 반환한다", async () => {
      const repository = createMockAuthRepository({ success: true });
      const useCase = new VerifyCodeUseCase(repository);

      const result = await useCase.execute({ email: TEST_EMAIL, code: "1234567" });

      expect(result).toEqual({ success: false, error: "인증 코드는 8자리 숫자입니다" });
      expect(repository.verifyOtp).not.toHaveBeenCalled();
    });

    it("영문자로 이루어진 코드이면 { success: false, error: '인증 코드는 8자리 숫자입니다' }를 반환한다", async () => {
      const repository = createMockAuthRepository({ success: true });
      const useCase = new VerifyCodeUseCase(repository);

      const result = await useCase.execute({ email: TEST_EMAIL, code: "abcdefgh" });

      expect(result).toEqual({ success: false, error: "인증 코드는 8자리 숫자입니다" });
      expect(repository.verifyOtp).not.toHaveBeenCalled();
    });

    it("숫자와 영문자가 혼합된 코드이면 { success: false, error: '인증 코드는 8자리 숫자입니다' }를 반환한다", async () => {
      const repository = createMockAuthRepository({ success: true });
      const useCase = new VerifyCodeUseCase(repository);

      const result = await useCase.execute({ email: TEST_EMAIL, code: "1234567a" });

      expect(result).toEqual({ success: false, error: "인증 코드는 8자리 숫자입니다" });
      expect(repository.verifyOtp).not.toHaveBeenCalled();
    });
  });

  describe("authRepository.verifyOtp 호출", () => {
    it("유효한 8자리 숫자 코드이면 authRepository.verifyOtp를 호출한다", async () => {
      const repository = createMockAuthRepository({ success: true });
      const useCase = new VerifyCodeUseCase(repository);

      await useCase.execute({ email: TEST_EMAIL, code: VALID_CODE });

      expect(repository.verifyOtp).toHaveBeenCalledTimes(1);
      expect(repository.verifyOtp).toHaveBeenCalledWith(TEST_EMAIL, VALID_CODE);
    });
  });

  describe("verifyOtp 결과 처리", () => {
    it("verifyOtp 성공 시 { success: true }를 반환한다", async () => {
      const repository = createMockAuthRepository({ success: true });
      const useCase = new VerifyCodeUseCase(repository);

      const result = await useCase.execute({ email: TEST_EMAIL, code: VALID_CODE });

      expect(result).toEqual({ success: true });
    });

    it("verifyOtp 실패 시 { success: false, error: '인증 코드가 올바르지 않습니다' }를 반환한다", async () => {
      const repository = createMockAuthRepository({
        success: false,
        error: "otp verification failed",
      });
      const useCase = new VerifyCodeUseCase(repository);

      const result = await useCase.execute({ email: TEST_EMAIL, code: VALID_CODE });

      expect(result).toEqual({ success: false, error: "인증 코드가 올바르지 않습니다" });
    });

    it("verifyOtp가 429를 반환하면 { success: false, error: '잠시 후 다시 시도해주세요' }를 반환한다", async () => {
      const repository = createMockAuthRepository({
        success: false,
        statusCode: 429,
        error: "too many requests",
      });
      const useCase = new VerifyCodeUseCase(repository);

      const result = await useCase.execute({ email: TEST_EMAIL, code: VALID_CODE });

      expect(result).toEqual({ success: false, error: "잠시 후 다시 시도해주세요" });
    });
  });
});
