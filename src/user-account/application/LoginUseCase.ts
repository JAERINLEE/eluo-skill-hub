import type { AuthRepository } from '../domain/AuthRepository';
import type { AuthResult } from '../domain/AuthResult';

export interface LoginUseCaseInput {
  readonly email: string;
  readonly password: string;
}

export class LoginUseCase {
  constructor(private readonly authRepository: AuthRepository) {}

  async execute(input: LoginUseCaseInput): Promise<AuthResult> {
    return this.authRepository.signIn(input.email, input.password);
  }
}
