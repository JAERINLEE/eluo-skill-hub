/**
 * SignupForm 컴포넌트 테스트
 *
 * TDD: 먼저 실패하는 테스트를 작성하고, 이후 구현으로 통과시킨다.
 *
 * 테스트 범위:
 * - 폼 렌더링 (이메일, 패스워드, 패스워드 확인 입력, 가입 버튼)
 * - zod 클라이언트 유효성 검증 에러 표시
 * - 서버 액션 결과에 따른 화면 전환
 * - 로딩 상태 (isPending)
 * - 로그인 페이지 링크
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { AuthResult } from '@/user-account/domain/AuthResult';

// Next.js Link 모킹
jest.mock('next/link', () => {
  const MockLink = ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>;
  MockLink.displayName = 'MockLink';
  return MockLink;
});

// signupAction 서버 액션 모킹
const mockSignupAction = jest.fn();
jest.mock('@/app/(auth)/signup/actions', () => ({
  signupAction: (...args: unknown[]) => mockSignupAction(...args),
}));

// useAuthForm 훅 모킹
const mockFormAction = jest.fn();
let mockState: AuthResult | null = null;
let mockIsPending = false;

jest.mock('@/app/(auth)/_hooks/useAuthForm', () => ({
  useAuthForm: () => ({
    state: mockState,
    formAction: mockFormAction,
    isPending: mockIsPending,
  }),
}));

// react-hook-form 모킹 - 실제 검증 로직은 유지하기 위해 부분 모킹
// zod 검증은 실제로 동작하도록 실제 react-hook-form 사용

import SignupForm from '@/app/(auth)/signup/SignupForm';

describe('SignupForm 컴포넌트', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockState = null;
    mockIsPending = false;
  });

  describe('폼 렌더링', () => {
    it('이메일 입력 필드를 렌더링해야 한다', () => {
      render(<SignupForm />);
      expect(screen.getByLabelText(/이메일/i)).toBeInTheDocument();
    });

    it('패스워드 입력 필드를 렌더링해야 한다', () => {
      render(<SignupForm />);
      // 패스워드 필드들을 찾기 위해 placeholder나 name 속성 사용
      const passwordInputs = screen.getAllByLabelText(/패스워드/i);
      expect(passwordInputs.length).toBeGreaterThanOrEqual(1);
    });

    it('패스워드 확인 입력 필드를 렌더링해야 한다', () => {
      render(<SignupForm />);
      expect(screen.getByLabelText(/패스워드 확인/i)).toBeInTheDocument();
    });

    it('회원가입 버튼을 렌더링해야 한다', () => {
      render(<SignupForm />);
      expect(
        screen.getByRole('button', { name: /회원가입/i })
      ).toBeInTheDocument();
    });

    it('로그인 페이지 링크를 렌더링해야 한다', () => {
      render(<SignupForm />);
      const loginLink = screen.getByRole('link', { name: /로그인/i });
      expect(loginLink).toBeInTheDocument();
      expect(loginLink).toHaveAttribute('href', '/login');
    });

    it('"이미 계정이 있으신가요?" 텍스트를 렌더링해야 한다', () => {
      render(<SignupForm />);
      expect(screen.getByText(/이미 계정이 있으신가요/i)).toBeInTheDocument();
    });
  });

  describe('클라이언트 유효성 검증', () => {
    it('eluocnc.com 외 도메인 이메일 입력 시 에러 메시지를 표시해야 한다', async () => {
      const user = userEvent.setup();
      render(<SignupForm />);

      await user.type(
        screen.getByLabelText(/^이메일/i),
        'user@gmail.com'
      );
      await user.type(
        screen.getByLabelText(/^패스워드$/i),
        'Password1!'
      );
      await user.type(
        screen.getByLabelText(/패스워드 확인/i),
        'Password1!'
      );
      await user.click(screen.getByRole('button', { name: /회원가입/i }));

      await waitFor(() => {
        expect(
          screen.getByText(/eluocnc\.com 이메일만 가입이 가능합니다/i)
        ).toBeInTheDocument();
      });
    });

    it('8자 미만 패스워드 입력 시 에러 메시지를 표시해야 한다', async () => {
      const user = userEvent.setup();
      render(<SignupForm />);

      await user.type(
        screen.getByLabelText(/^이메일/i),
        'user@eluocnc.com'
      );
      await user.type(
        screen.getByLabelText(/^패스워드$/i),
        'Short1!'
      );
      await user.type(
        screen.getByLabelText(/패스워드 확인/i),
        'Short1!'
      );
      await user.click(screen.getByRole('button', { name: /회원가입/i }));

      await waitFor(() => {
        expect(
          screen.getByText(/패스워드는 최소 8자 이상이어야 합니다/i)
        ).toBeInTheDocument();
      });
    });

    it('특수문자 없는 패스워드 입력 시 에러 메시지를 표시해야 한다', async () => {
      const user = userEvent.setup();
      render(<SignupForm />);

      await user.type(
        screen.getByLabelText(/^이메일/i),
        'user@eluocnc.com'
      );
      await user.type(
        screen.getByLabelText(/^패스워드$/i),
        'NoSpecialChar1'
      );
      await user.type(
        screen.getByLabelText(/패스워드 확인/i),
        'NoSpecialChar1'
      );
      await user.click(screen.getByRole('button', { name: /회원가입/i }));

      await waitFor(() => {
        expect(
          screen.getByText(/패스워드는 특수문자를 1개 이상 포함해야 합니다/i)
        ).toBeInTheDocument();
      });
    });

    it('패스워드와 패스워드 확인이 불일치하면 에러 메시지를 표시해야 한다', async () => {
      const user = userEvent.setup();
      render(<SignupForm />);

      await user.type(
        screen.getByLabelText(/^이메일/i),
        'user@eluocnc.com'
      );
      await user.type(
        screen.getByLabelText(/^패스워드$/i),
        'Password1!'
      );
      await user.type(
        screen.getByLabelText(/패스워드 확인/i),
        'DifferentPass1!'
      );
      await user.click(screen.getByRole('button', { name: /회원가입/i }));

      await waitFor(() => {
        expect(
          screen.getByText(/패스워드가 일치하지 않습니다/i)
        ).toBeInTheDocument();
      });
    });
  });

  describe('서버 액션 결과 처리', () => {
    it('signup_success 결과 시 인증 메일 발송 안내 화면을 표시해야 한다', () => {
      mockState = {
        status: 'signup_success',
        message: '인증 메일이 발송되었습니다. 이메일을 확인해주세요.',
      };

      render(<SignupForm />);

      expect(
        screen.getByText(/인증 메일이 발송되었습니다/i)
      ).toBeInTheDocument();
    });

    it('signup_success 결과 시 폼이 사라져야 한다', () => {
      mockState = {
        status: 'signup_success',
        message: '인증 메일이 발송되었습니다. 이메일을 확인해주세요.',
      };

      render(<SignupForm />);

      expect(
        screen.queryByRole('button', { name: /회원가입/i })
      ).not.toBeInTheDocument();
    });

    it('email_already_registered 에러 시 이미 가입된 이메일 메시지를 표시해야 한다', () => {
      mockState = {
        status: 'error',
        code: 'email_already_registered',
        message: '이미 가입된 이메일입니다',
      };

      render(<SignupForm />);

      expect(
        screen.getByText(/이미 가입된 이메일입니다/i)
      ).toBeInTheDocument();
    });

    it('email_already_registered 에러 시 로그인 링크를 표시해야 한다', () => {
      mockState = {
        status: 'error',
        code: 'email_already_registered',
        message: '이미 가입된 이메일입니다',
      };

      render(<SignupForm />);

      const loginLink = screen.getAllByRole('link', { name: /로그인/i });
      expect(loginLink.length).toBeGreaterThanOrEqual(1);
      const errorLoginLink = loginLink.find(
        (link) => link.getAttribute('href') === '/login'
      );
      expect(errorLoginLink).toBeInTheDocument();
    });

    it('network_error 에러 시 에러 메시지와 재시도 버튼을 표시해야 한다', () => {
      mockState = {
        status: 'error',
        code: 'network_error',
        message: '네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요',
      };

      render(<SignupForm />);

      expect(
        screen.getByText(/네트워크 오류가 발생했습니다/i)
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /다시 시도/i })
      ).toBeInTheDocument();
    });
  });

  describe('로딩 상태', () => {
    it('isPending이 true일 때 회원가입 버튼이 비활성화되어야 한다', () => {
      mockIsPending = true;

      render(<SignupForm />);

      // isPending 시 버튼 텍스트가 "가입 중..."으로 변경되므로 submit 버튼으로 찾는다
      const submitButton = screen.getByRole('button', { name: /가입/i });
      expect(submitButton).toBeDisabled();
    });

    it('isPending이 false일 때 회원가입 버튼이 활성화되어야 한다', () => {
      mockIsPending = false;

      render(<SignupForm />);

      expect(
        screen.getByRole('button', { name: /회원가입/i })
      ).not.toBeDisabled();
    });
  });
});
