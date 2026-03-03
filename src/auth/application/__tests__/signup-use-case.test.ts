import { SignupUseCase } from "@/auth/application/signup-use-case";
import type { AuthRepository, SignupCredentials, SignupResult, SigninCredentials, SigninResult, VerifyOtpCredentials, VerifyOtpResult, ResendOtpResult } from "@/auth/domain/types";

const createMockRepository = (signUpResult: SignupResult): AuthRepository => ({
  signIn: async (_credentials: SigninCredentials): Promise<SigninResult> => ({ success: true }),
  signUp: async (_credentials: SignupCredentials): Promise<SignupResult> => signUpResult,
  verifyOtp: async (_credentials: VerifyOtpCredentials): Promise<VerifyOtpResult> => ({ success: true }),
  resendOtp: async (_email: string): Promise<ResendOtpResult> => ({ success: true }),
});

describe("SignupUseCase", () => {
  it("유효한 자격 증명으로 signUp 성공을 반환한다", async () => {
    const repository = createMockRepository({ success: true });
    const useCase = new SignupUseCase(repository);

    const result = await useCase.execute({
      name: "홍길동",
      email: "user@eluocnc.com",
      password: "password123",
    });

    expect(result).toEqual({ success: true });
  });

  it("이미 가입된 이메일로 signUp 실패를 반환한다", async () => {
    const repository = createMockRepository({
      success: false,
      error: "이미 가입된 이메일입니다",
    });
    const useCase = new SignupUseCase(repository);

    const result = await useCase.execute({
      name: "홍길동",
      email: "existing@eluocnc.com",
      password: "password123",
    });

    expect(result).toEqual({ success: false, error: "이미 가입된 이메일입니다" });
  });

  it("Supabase 오류 시 실패 결과를 반환한다", async () => {
    const repository = createMockRepository({
      success: false,
      error: "서비스 오류가 발생했습니다",
    });
    const useCase = new SignupUseCase(repository);

    const result = await useCase.execute({
      name: "홍길동",
      email: "user@eluocnc.com",
      password: "password123",
    });

    expect(result.success).toBe(false);
  });
});
