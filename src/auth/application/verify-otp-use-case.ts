import type { AuthRepository, VerifyOtpCredentials, VerifyOtpResult } from "@/auth/domain/types";

export class VerifyOtpUseCase {
  constructor(private readonly authRepository: AuthRepository) {}

  async execute(credentials: VerifyOtpCredentials): Promise<VerifyOtpResult> {
    return this.authRepository.verifyOtp(credentials);
  }
}
