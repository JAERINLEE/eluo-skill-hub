import { VerifyOtpUseCase } from "@/auth/application/verify-otp-use-case";
import type {
  AuthRepository,
  SigninCredentials,
  SigninResult,
  SignupCredentials,
  SignupResult,
  VerifyOtpCredentials,
  VerifyOtpResult,
  ResendOtpResult,
} from "@/auth/domain/types";

const createMockRepository = (verifyResult: VerifyOtpResult): AuthRepository => ({
  signIn: async (_credentials: SigninCredentials): Promise<SigninResult> => ({ success: true }),
  signUp: async (_credentials: SignupCredentials): Promise<SignupResult> => ({ success: true }),
  verifyOtp: async (_credentials: VerifyOtpCredentials): Promise<VerifyOtpResult> => verifyResult,
  resendOtp: async (_email: string): Promise<ResendOtpResult> => ({ success: true }),
});

describe("VerifyOtpUseCase", () => {
  it("올바른 OTP 코드로 인증 성공을 반환한다", async () => {
    const repository = createMockRepository({ success: true });
    const useCase = new VerifyOtpUseCase(repository);

    const result = await useCase.execute({
      email: "user@eluocnc.com",
      token: "12345678",
    });

    expect(result).toEqual({ success: true });
  });

  it("잘못된 OTP 코드로 인증 실패를 반환한다", async () => {
    const repository = createMockRepository({
      success: false,
      error: "인증코드가 올바르지 않습니다",
    });
    const useCase = new VerifyOtpUseCase(repository);

    const result = await useCase.execute({
      email: "user@eluocnc.com",
      token: "00000000",
    });

    expect(result).toEqual({ success: false, error: "인증코드가 올바르지 않습니다" });
  });

  it("만료된 OTP 코드로 인증 실패를 반환한다", async () => {
    const repository = createMockRepository({
      success: false,
      error: "인증코드가 만료되었습니다. 다시 시도해주세요",
    });
    const useCase = new VerifyOtpUseCase(repository);

    const result = await useCase.execute({
      email: "user@eluocnc.com",
      token: "12345678",
    });

    expect(result).toEqual({
      success: false,
      error: "인증코드가 만료되었습니다. 다시 시도해주세요",
    });
  });
});
