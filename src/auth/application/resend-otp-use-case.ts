import type { AuthRepository, ResendOtpResult } from "@/auth/domain/types";

export class ResendOtpUseCase {
  constructor(private readonly authRepository: AuthRepository) {}

  async execute(email: string): Promise<ResendOtpResult> {
    return this.authRepository.resendOtp(email);
  }
}
