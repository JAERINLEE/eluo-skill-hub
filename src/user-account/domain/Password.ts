import { ValueObject } from '@/shared/domain/types/ValueObject';

interface PasswordProps {
  readonly value: string;
}

const MIN_LENGTH = 8;
const SPECIAL_CHAR_REGEX = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/;

export class Password extends ValueObject<PasswordProps> {
  private constructor(props: PasswordProps) {
    super(props);
  }

  static create(password: string): Password {
    if (!Password.isValid(password)) {
      if (!password || password.length < MIN_LENGTH) {
        throw new Error(
          `패스워드는 최소 ${MIN_LENGTH}자 이상이어야 합니다.`
        );
      }
      throw new Error('패스워드는 특수문자를 1개 이상 포함해야 합니다.');
    }
    return new Password({ value: password });
  }

  static isValid(password: string): boolean {
    if (!password || password.length < MIN_LENGTH) {
      return false;
    }
    return SPECIAL_CHAR_REGEX.test(password);
  }

  get value(): string {
    return this.props.value;
  }
}
