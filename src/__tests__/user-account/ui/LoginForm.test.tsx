/**
 * LoginForm 컴포넌트 단위 테스트 (Task 7.2)
 *
 * 테스트 대상:
 * - 이메일 입력, 패스워드 입력, 로그인 버튼 렌더링
 * - 이메일 형식 유효성 검증 에러 표시
 * - 패스워드 빈 값 유효성 검증 에러 표시
 * - 서버 에러 (invalid_credentials) 메시지 표시
 * - 서버 에러 (email_not_confirmed) 메시지 표시
 * - 로딩 상태에서 버튼 비활성화
 * - 회원가입 페이지 링크 표시
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { AuthResult } from '@/user-account/domain/AuthResult';

// Next.js navigation 모킹
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
  }),
  usePathname: () => '/',
}));

// Next.js Link 모킹
jest.mock('next/link', () => {
  return function MockLink({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
    [key: string]: unknown;
  }) {
    return (
      <a href={href} {...props}>
        {children}
      </a>
    );
  };
});

// loginAction 서버 액션 모킹
const mockLoginAction = jest.fn();
jest.mock('@/app/(auth)/login/actions', () => ({
  loginAction: (...args: [AuthResult | null, FormData]) =>
    mockLoginAction(...args),
}));

// useActionState 모킹 - 기본적으로 idle 상태
let mockState: AuthResult | null = null;
let mockIsPending = false;
const mockFormAction = jest.fn();

jest.mock('react', () => ({
  ...jest.requireActual('react'),
  useActionState: jest.fn(),
}));

import LoginForm from '@/app/(auth)/login/LoginForm';

describe('LoginForm 컴포넌트', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockState = null;
    mockIsPending = false;

    // useActionState 기본 모킹: [state, formAction, isPending]
    const { useActionState } = jest.requireMock('react') as {
      useActionState: jest.Mock;
    };
    useActionState.mockReturnValue([mockState, mockFormAction, mockIsPending]);
  });

  describe('기본 렌더링', () => {
    it('이메일 입력 필드를 렌더링해야 한다', () => {
      render(<LoginForm />);

      const emailInput = screen.getByRole('textbox', { name: /이메일/i });
      expect(emailInput).toBeInTheDocument();
    });

    it('패스워드 입력 필드를 렌더링해야 한다', () => {
      render(<LoginForm />);

      // password 타입은 role='textbox'로 쿼리 안 됨 - getByLabelText 사용
      const passwordInput = screen.getByLabelText(/패스워드/i);
      expect(passwordInput).toBeInTheDocument();
      expect(passwordInput).toHaveAttribute('type', 'password');
    });

    it('로그인 버튼을 렌더링해야 한다', () => {
      render(<LoginForm />);

      const loginButton = screen.getByRole('button', { name: /로그인/i });
      expect(loginButton).toBeInTheDocument();
    });

    it('회원가입 페이지 링크를 렌더링해야 한다', () => {
      render(<LoginForm />);

      const signupLink = screen.getByRole('link', { name: /회원가입/i });
      expect(signupLink).toBeInTheDocument();
      expect(signupLink).toHaveAttribute('href', '/signup');
    });

    it('"아직 계정이 없으신가요?" 텍스트를 표시해야 한다', () => {
      render(<LoginForm />);

      expect(screen.getByText(/아직 계정이 없으신가요/i)).toBeInTheDocument();
    });
  });

  describe('클라이언트 유효성 검증', () => {
    it('유효하지 않은 이메일 형식 입력 시 에러 메시지를 표시해야 한다', async () => {
      render(<LoginForm />);

      const emailInput = screen.getByRole('textbox', { name: /이메일/i });
      const form = emailInput.closest('form');

      await userEvent.type(emailInput, 'invalid-email');
      // 폼 직접 submit 이벤트 발생
      fireEvent.submit(form!);

      await waitFor(() => {
        expect(
          screen.getByText('유효한 이메일 주소를 입력해주세요')
        ).toBeInTheDocument();
      });
    });

    it('패스워드 빈 값 제출 시 에러 메시지를 표시해야 한다', async () => {
      render(<LoginForm />);

      const emailInput = screen.getByRole('textbox', { name: /이메일/i });
      const loginButton = screen.getByRole('button', { name: /로그인/i });

      await userEvent.type(emailInput, 'test@eluocnc.com');
      // 패스워드 빈 값으로 제출
      await userEvent.click(loginButton);

      await waitFor(() => {
        expect(
          screen.getByText('패스워드를 입력해주세요')
        ).toBeInTheDocument();
      });
    });
  });

  describe('서버 에러 메시지 표시', () => {
    it('invalid_credentials 에러 시 "이메일 또는 패스워드가 올바르지 않습니다" 메시지를 표시해야 한다', () => {
      const { useActionState } = jest.requireMock('react') as {
        useActionState: jest.Mock;
      };
      const errorState: AuthResult = {
        status: 'error',
        code: 'invalid_credentials',
        message: '이메일 또는 패스워드가 올바르지 않습니다',
      };
      useActionState.mockReturnValue([errorState, mockFormAction, false]);

      render(<LoginForm />);

      expect(
        screen.getByText('이메일 또는 패스워드가 올바르지 않습니다')
      ).toBeInTheDocument();
    });

    it('email_not_confirmed 에러 시 이메일 인증 안내 메시지를 표시해야 한다', () => {
      const { useActionState } = jest.requireMock('react') as {
        useActionState: jest.Mock;
      };
      const errorState: AuthResult = {
        status: 'error',
        code: 'email_not_confirmed',
        message:
          '이메일 인증이 필요합니다. 가입 시 발송된 인증 메일을 확인해주세요',
      };
      useActionState.mockReturnValue([errorState, mockFormAction, false]);

      render(<LoginForm />);

      expect(
        screen.getByText(
          '이메일 인증이 필요합니다. 가입 시 발송된 인증 메일을 확인해주세요'
        )
      ).toBeInTheDocument();
    });

    it('network_error 에러 시 에러 메시지와 재시도 버튼을 표시해야 한다', () => {
      const { useActionState } = jest.requireMock('react') as {
        useActionState: jest.Mock;
      };
      const errorState: AuthResult = {
        status: 'error',
        code: 'network_error',
        message: '네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요',
      };
      useActionState.mockReturnValue([errorState, mockFormAction, false]);

      render(<LoginForm />);

      expect(
        screen.getByText('네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요')
      ).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /다시 시도/i })).toBeInTheDocument();
    });

    it('알 수 없는 에러 시 에러 메시지를 표시해야 한다', () => {
      const { useActionState } = jest.requireMock('react') as {
        useActionState: jest.Mock;
      };
      const errorState: AuthResult = {
        status: 'error',
        code: 'unknown_error',
        message: '알 수 없는 오류가 발생했습니다. 잠시 후 다시 시도해주세요',
      };
      useActionState.mockReturnValue([errorState, mockFormAction, false]);

      render(<LoginForm />);

      expect(
        screen.getByText('알 수 없는 오류가 발생했습니다. 잠시 후 다시 시도해주세요')
      ).toBeInTheDocument();
    });
  });

  describe('로딩 상태', () => {
    it('isPending이 true일 때 로그인 버튼이 비활성화되어야 한다', () => {
      const { useActionState } = jest.requireMock('react') as {
        useActionState: jest.Mock;
      };
      useActionState.mockReturnValue([null, mockFormAction, true]);

      render(<LoginForm />);

      const loginButton = screen.getByRole('button', { name: /로그인/i });
      expect(loginButton).toBeDisabled();
    });

    it('isPending이 true일 때 로딩 인디케이터를 표시해야 한다', () => {
      const { useActionState } = jest.requireMock('react') as {
        useActionState: jest.Mock;
      };
      useActionState.mockReturnValue([null, mockFormAction, true]);

      render(<LoginForm />);

      // 로딩 인디케이터 (aria-label 또는 로딩 텍스트)
      expect(screen.getByText(/로그인 중/i)).toBeInTheDocument();
    });
  });

  describe('폼 제출', () => {
    it('유효한 이메일과 패스워드를 입력하고 제출 시 formAction이 호출되어야 한다', async () => {
      render(<LoginForm />);

      const emailInput = screen.getByRole('textbox', { name: /이메일/i });
      const passwordInput = screen.getByLabelText(/패스워드/i);
      const loginButton = screen.getByRole('button', { name: /로그인/i });

      await userEvent.type(emailInput, 'test@eluocnc.com');
      await userEvent.type(passwordInput, 'password123!');
      await userEvent.click(loginButton);

      await waitFor(() => {
        expect(mockFormAction).toHaveBeenCalled();
      });
    });
  });
});
