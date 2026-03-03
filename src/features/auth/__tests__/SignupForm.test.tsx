import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { SignupForm } from "@/features/auth/SignupForm";
import { signup, verifyOtp, resendOtp } from "@/app/signup/actions";
import type {
  SignupActionState,
  VerifyOtpActionState,
  ResendOtpActionState,
} from "@/auth/domain/types";

jest.mock("@/app/signup/actions", () => ({
  signup: jest.fn(),
  verifyOtp: jest.fn(),
  resendOtp: jest.fn(),
}));

jest.mock("next/link", () => {
  function MockLink({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) {
    return <a href={href}>{children}</a>;
  }
  return MockLink;
});

jest.mock("react", () => ({
  ...jest.requireActual("react"),
  useActionState: jest.fn(),
}));

function setupMockStates(
  signupState: SignupActionState = { error: "", step: "form", email: "" },
  verifyState: VerifyOtpActionState = { error: "" },
  resendState: ResendOtpActionState = { error: "", success: false, isRateLimited: false }
) {
  (React.useActionState as jest.Mock).mockImplementation(
    (action: unknown) => {
      if (action === signup) return [signupState, jest.fn(), false];
      if (action === verifyOtp) return [verifyState, jest.fn(), false];
      return [resendState, jest.fn(), false]; // resendOtp
    }
  );
}

describe("SignupForm", () => {
  beforeEach(() => {
    setupMockStates();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("form step", () => {
    it("이메일, 비밀번호 입력 필드와 회원가입 버튼을 렌더링한다", () => {
      render(<SignupForm />);
      expect(screen.getByLabelText("이메일")).toBeInTheDocument();
      expect(screen.getByLabelText("비밀번호")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "회원가입" })
      ).toBeInTheDocument();
    });

    it("하단에 로그인 페이지 링크(/signin)가 표시된다", () => {
      render(<SignupForm />);
      const loginLink = screen.getByRole("link", { name: "로그인" });
      expect(loginLink).toBeInTheDocument();
      expect(loginLink).toHaveAttribute("href", "/signin");
    });

    it("이메일을 입력하지 않으면 필수 입력 오류가 표시된다", async () => {
      render(<SignupForm />);
      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: "회원가입" }));
      });
      expect(screen.getByText("이메일을 입력해 주세요")).toBeInTheDocument();
    });

    it("eluocnc.com 외 도메인 입력 시 도메인 오류가 표시된다", async () => {
      render(<SignupForm />);
      fireEvent.change(screen.getByLabelText("이메일"), {
        target: { value: "test@gmail.com" },
      });
      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: "회원가입" }));
      });
      expect(
        screen.getByText("eluocnc.com 이메일만 사용할 수 있습니다")
      ).toBeInTheDocument();
    });

    it("비밀번호가 8자 미만이면 길이 오류가 표시된다", async () => {
      render(<SignupForm />);
      fireEvent.change(screen.getByLabelText("이메일"), {
        target: { value: "test@eluocnc.com" },
      });
      fireEvent.change(screen.getByLabelText("비밀번호"), {
        target: { value: "1234567" },
      });
      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: "회원가입" }));
      });
      expect(
        screen.getByText("비밀번호는 최소 8자 이상이어야 합니다")
      ).toBeInTheDocument();
    });

    it("이미 가입된 이메일 오류 시 로그인 페이지 이동 링크가 표시된다", () => {
      setupMockStates({
        error: "이미 가입된 이메일입니다",
        step: "form",
        email: "",
      });
      render(<SignupForm />);
      expect(
        screen.getByText("이미 가입된 이메일입니다")
      ).toBeInTheDocument();
      const loginLink = screen.getByRole("link", {
        name: "로그인 페이지로 이동",
      });
      expect(loginLink).toHaveAttribute("href", "/signin");
    });
  });

  describe("verify step", () => {
    beforeEach(() => {
      setupMockStates({ error: "", step: "verify", email: "test@eluocnc.com" });
    });

    it("OTP 입력 필드와 인증 확인 버튼을 렌더링한다", () => {
      render(<SignupForm />);
      expect(screen.getByLabelText("인증코드")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "인증 확인" })
      ).toBeInTheDocument();
    });

    it("발송된 이메일 주소가 표시된다", () => {
      render(<SignupForm />);
      expect(screen.getByText("test@eluocnc.com")).toBeInTheDocument();
    });

    it("인증코드 재발송 버튼이 표시된다", () => {
      render(<SignupForm />);
      expect(
        screen.getByRole("button", { name: "인증코드 재발송" })
      ).toBeInTheDocument();
    });

    it("재발송 성공 시 쿨다운 타이머가 표시된다", async () => {
      jest.useFakeTimers();
      setupMockStates(
        { error: "", step: "verify", email: "test@eluocnc.com" },
        { error: "" },
        { error: "", success: true, isRateLimited: false }
      );
      await act(async () => {
        render(<SignupForm />);
      });
      expect(
        screen.getByText(/재발송 가능까지 \d+초/)
      ).toBeInTheDocument();
      jest.useRealTimers();
    });
  });
});
