import type { AuthRepository, SigninCredentials, SigninResult } from "@/auth/domain/types";

export class SigninUseCase {
  constructor(private readonly authRepository: AuthRepository) {}

  async execute(credentials: SigninCredentials): Promise<SigninResult> {
    return this.authRepository.signIn(credentials);
  }
}
