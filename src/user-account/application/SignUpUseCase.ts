import { EluoDomainEmail } from '../domain/EluoDomainEmail';
import { Password } from '../domain/Password';
import type { AuthRepository } from '../domain/AuthRepository';
import type { AuthResult } from '../domain/AuthResult';

export interface SignUpUseCaseInput {
  readonly email: string;
  readonly password: string;
}

export class SignUpUseCase {
  constructor(private readonly authRepository: AuthRepository) {}

  async execute(input: SignUpUseCaseInput): Promise<AuthResult> {
    if (!EluoDomainEmail.isEluoDomain(input.email)) {
      return {
        status: 'error',
        code: 'invalid_email_domain',
        message: 'eluocnc.com 이메일만 가입이 가능합니다',
      };
    }

    if (!Password.isValid(input.password)) {
      const message =
        !input.password || input.password.length < 8
          ? '패스워드는 최소 8자 이상이어야 합니다.'
          : '패스워드는 특수문자를 1개 이상 포함해야 합니다.';
      return {
        status: 'error',
        code: 'unknown_error',
        message,
      };
    }

    return this.authRepository.signUp(input.email, input.password);
  }
}
