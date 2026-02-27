import { EluoDomainEmail } from '@/user-account/domain/EluoDomainEmail';

describe('EluoDomainEmail 값 객체', () => {
  describe('create()', () => {
    describe('유효한 eluocnc.com 이메일 생성 성공', () => {
      it('유효한 @eluocnc.com 이메일로 인스턴스를 생성할 수 있어야 한다', () => {
        const email = EluoDomainEmail.create('user@eluocnc.com');
        expect(email).toBeInstanceOf(EluoDomainEmail);
      });

      it('생성된 인스턴스의 value getter가 원래 이메일 문자열을 반환해야 한다', () => {
        const emailStr = 'jaerin@eluocnc.com';
        const email = EluoDomainEmail.create(emailStr);
        expect(email.value).toBe(emailStr);
      });

      it('서브도메인이 없는 eluocnc.com 이메일을 허용해야 한다', () => {
        const email = EluoDomainEmail.create('admin@eluocnc.com');
        expect(email.value).toBe('admin@eluocnc.com');
      });
    });

    describe('허용되지 않은 도메인 거부', () => {
      it('gmail.com 도메인 이메일 생성 시 예외를 발생시켜야 한다', () => {
        expect(() => EluoDomainEmail.create('user@gmail.com')).toThrow();
      });

      it('naver.com 도메인 이메일 생성 시 예외를 발생시켜야 한다', () => {
        expect(() => EluoDomainEmail.create('user@naver.com')).toThrow();
      });

      it('eluocnc.com이 포함된 다른 도메인 이메일 생성 시 예외를 발생시켜야 한다', () => {
        expect(() => EluoDomainEmail.create('user@fake-eluocnc.com')).toThrow();
      });

      it('eluocnc.com 서브도메인 이메일 생성 시 예외를 발생시켜야 한다', () => {
        expect(() => EluoDomainEmail.create('user@mail.eluocnc.com')).toThrow();
      });
    });

    describe('잘못된 이메일 형식 거부', () => {
      it('@ 기호가 없는 이메일 생성 시 예외를 발생시켜야 한다', () => {
        expect(() => EluoDomainEmail.create('invalideluocnc.com')).toThrow();
      });

      it('빈 문자열로 생성 시 예외를 발생시켜야 한다', () => {
        expect(() => EluoDomainEmail.create('')).toThrow();
      });

      it('로컬 파트가 없는 이메일 생성 시 예외를 발생시켜야 한다', () => {
        expect(() => EluoDomainEmail.create('@eluocnc.com')).toThrow();
      });

      it('공백이 포함된 이메일 생성 시 예외를 발생시켜야 한다', () => {
        expect(() => EluoDomainEmail.create('us er@eluocnc.com')).toThrow();
      });
    });
  });

  describe('isValid()', () => {
    it('유효한 eluocnc.com 이메일에 대해 true를 반환해야 한다', () => {
      expect(EluoDomainEmail.isValid('user@eluocnc.com')).toBe(true);
    });

    it('다른 도메인 이메일에 대해 false를 반환해야 한다', () => {
      expect(EluoDomainEmail.isValid('user@gmail.com')).toBe(false);
    });

    it('잘못된 형식의 이메일에 대해 false를 반환해야 한다', () => {
      expect(EluoDomainEmail.isValid('invalid')).toBe(false);
    });

    it('빈 문자열에 대해 false를 반환해야 한다', () => {
      expect(EluoDomainEmail.isValid('')).toBe(false);
    });
  });

  describe('isEluoDomain()', () => {
    it('eluocnc.com 도메인 이메일에 대해 true를 반환해야 한다', () => {
      expect(EluoDomainEmail.isEluoDomain('user@eluocnc.com')).toBe(true);
    });

    it('다른 도메인 이메일에 대해 false를 반환해야 한다', () => {
      expect(EluoDomainEmail.isEluoDomain('user@gmail.com')).toBe(false);
    });

    it('eluocnc.com 서브도메인에 대해 false를 반환해야 한다', () => {
      expect(EluoDomainEmail.isEluoDomain('user@mail.eluocnc.com')).toBe(false);
    });
  });

  describe('동등성 비교 (equals)', () => {
    it('동일한 이메일 주소를 가진 두 인스턴스는 동등해야 한다', () => {
      const email1 = EluoDomainEmail.create('user@eluocnc.com');
      const email2 = EluoDomainEmail.create('user@eluocnc.com');
      expect(email1.equals(email2)).toBe(true);
    });

    it('다른 이메일 주소를 가진 두 인스턴스는 동등하지 않아야 한다', () => {
      const email1 = EluoDomainEmail.create('user1@eluocnc.com');
      const email2 = EluoDomainEmail.create('user2@eluocnc.com');
      expect(email1.equals(email2)).toBe(false);
    });
  });
});
