import type { AuthRepository } from "@/auth/application/ports/AuthRepository";

export interface VerifyCodeInput {
  email: string;
  code: string;
}

export interface VerifyCodeResult {
  success: boolean;
  error?: string;
}

export class VerifyCodeUseCase {
  private readonly authRepository: AuthRepository;

  constructor(authRepository: AuthRepository) {
    this.authRepository = authRepository;
  }

  async execute(input: VerifyCodeInput): Promise<VerifyCodeResult> {
    const { email, code } = input;

    if (!code || code.trim() === "") {
      return { success: false, error: "인증 코드를 입력해주세요" };
    }

    if (!/^\d{8}$/.test(code)) {
      return { success: false, error: "인증 코드는 8자리 숫자입니다" };
    }

    const result = await this.authRepository.verifyOtp(email, code);

    if (!result.success) {
      if (result.statusCode === 429) {
        return { success: false, error: "잠시 후 다시 시도해주세요" };
      }
      return { success: false, error: "인증 코드가 올바르지 않습니다" };
    }

    return { success: true };
  }
}
