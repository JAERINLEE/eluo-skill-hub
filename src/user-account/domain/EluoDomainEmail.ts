import { ValueObject } from '@/shared/domain/types/ValueObject';

interface EluoDomainEmailProps {
  readonly value: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ELUO_DOMAIN = 'eluocnc.com';

export class EluoDomainEmail extends ValueObject<EluoDomainEmailProps> {
  private constructor(props: EluoDomainEmailProps) {
    super(props);
  }

  static create(email: string): EluoDomainEmail {
    if (!EluoDomainEmail.isValid(email)) {
      throw new Error(
        `유효하지 않은 이메일이거나 허용되지 않은 도메인입니다: ${email}. @${ELUO_DOMAIN} 도메인만 허용됩니다.`
      );
    }
    return new EluoDomainEmail({ value: email });
  }

  static isValid(email: string): boolean {
    if (!email || !EMAIL_REGEX.test(email)) {
      return false;
    }
    return EluoDomainEmail.isEluoDomain(email);
  }

  static isEluoDomain(email: string): boolean {
    const atIndex = email.lastIndexOf('@');
    if (atIndex === -1) {
      return false;
    }
    const domain = email.slice(atIndex + 1);
    return domain === ELUO_DOMAIN;
  }

  get value(): string {
    return this.props.value;
  }
}
