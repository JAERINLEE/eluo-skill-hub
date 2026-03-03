import type { AuthRepository, SignupCredentials, SignupResult } from "@/auth/domain/types";

export class SignupUseCase {
  constructor(private readonly authRepository: AuthRepository) {}

  async execute(credentials: SignupCredentials): Promise<SignupResult> {
    return this.authRepository.signUp(credentials);
  }
}
