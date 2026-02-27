import { Password } from '@/user-account/domain/Password';

describe('Password 값 객체', () => {
  describe('create()', () => {
    describe('유효한 패스워드 생성 성공', () => {
      it('8자 이상이고 특수문자를 포함한 패스워드로 인스턴스를 생성할 수 있어야 한다', () => {
        const password = Password.create('Secret!1');
        expect(password).toBeInstanceOf(Password);
      });

      it('생성된 인스턴스의 value getter가 원래 패스워드 문자열을 반환해야 한다', () => {
        const passwordStr = 'MyPass@123';
        const password = Password.create(passwordStr);
        expect(password.value).toBe(passwordStr);
      });

      it('다양한 특수문자를 포함한 패스워드를 생성할 수 있어야 한다', () => {
        const specialChars = ['!', '@', '#', '$', '%', '^', '&', '*', '(', ')', '_', '+', '-', '='];
        for (const char of specialChars) {
          expect(() => Password.create(`Password${char}1`)).not.toThrow();
        }
      });

      it('특수문자가 여러 개인 패스워드도 유효해야 한다', () => {
        const password = Password.create('P@ssw0rd!#');
        expect(password.value).toBe('P@ssw0rd!#');
      });

      it('정확히 8자이고 특수문자를 포함한 패스워드를 허용해야 한다', () => {
        const password = Password.create('Abcde!12');
        expect(password).toBeInstanceOf(Password);
      });
    });

    describe('8자 미만 패스워드 거부', () => {
      it('7자 패스워드 생성 시 예외를 발생시켜야 한다', () => {
        expect(() => Password.create('Short!1')).toThrow();
      });

      it('1자 패스워드 생성 시 예외를 발생시켜야 한다', () => {
        expect(() => Password.create('!')).toThrow();
      });

      it('빈 문자열로 생성 시 예외를 발생시켜야 한다', () => {
        expect(() => Password.create('')).toThrow();
      });
    });

    describe('특수문자 미포함 패스워드 거부', () => {
      it('특수문자 없이 8자 이상인 패스워드 생성 시 예외를 발생시켜야 한다', () => {
        expect(() => Password.create('Password1')).toThrow();
      });

      it('영문자와 숫자만으로 구성된 긴 패스워드도 거부해야 한다', () => {
        expect(() => Password.create('VeryLongPasswordWithoutSpecialChar1')).toThrow();
      });

      it('공백만 포함하는 경우 특수문자로 인정하지 않아야 한다', () => {
        expect(() => Password.create('Password 1')).toThrow();
      });
    });
  });

  describe('isValid()', () => {
    it('유효한 패스워드에 대해 true를 반환해야 한다', () => {
      expect(Password.isValid('Secret!1')).toBe(true);
    });

    it('8자 미만 패스워드에 대해 false를 반환해야 한다', () => {
      expect(Password.isValid('Sh!rt1')).toBe(false);
    });

    it('특수문자 없는 패스워드에 대해 false를 반환해야 한다', () => {
      expect(Password.isValid('Password123')).toBe(false);
    });

    it('빈 문자열에 대해 false를 반환해야 한다', () => {
      expect(Password.isValid('')).toBe(false);
    });

    it('8자이지만 특수문자 없는 패스워드에 대해 false를 반환해야 한다', () => {
      expect(Password.isValid('Abcde123')).toBe(false);
    });
  });

  describe('동등성 비교 (equals)', () => {
    it('동일한 패스워드를 가진 두 인스턴스는 동등해야 한다', () => {
      const pw1 = Password.create('Secret!1');
      const pw2 = Password.create('Secret!1');
      expect(pw1.equals(pw2)).toBe(true);
    });

    it('다른 패스워드를 가진 두 인스턴스는 동등하지 않아야 한다', () => {
      const pw1 = Password.create('Secret!1');
      const pw2 = Password.create('Secret@2');
      expect(pw1.equals(pw2)).toBe(false);
    });
  });
});
