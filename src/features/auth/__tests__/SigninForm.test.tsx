import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { SigninForm } from "@/features/auth/SigninForm";
import { signin } from "@/app/signin/actions";
import type { SigninActionState } from "@/auth/domain/types";

jest.mock("@/app/signin/actions", () => ({
  signin: jest.fn(),
}));

jest.mock("react", () => ({
  ...jest.requireActual("react"),
  useActionState: jest.fn(),
}));

function setupMockState(
  state: SigninActionState = { error: "" }
): jest.Mock {
  const mockFormAction = jest.fn();
  (React.useActionState as jest.Mock).mockReturnValue([
    state,
    mockFormAction,
    false,
  ]);
  return mockFormAction;
}

describe("SigninForm", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupMockState();
  });

  it("로그인 타이틀과 서브텍스트가 렌더링된다", () => {
    render(<SigninForm />);
    expect(screen.getByRole("heading", { name: "로그인" })).toBeInTheDocument();
    expect(screen.getByText("ELUO AI Skill Hub에 접속하세요")).toBeInTheDocument();
  });

  it("이메일 입력 필드가 존재한다", () => {
    render(<SigninForm />);
    expect(screen.getByLabelText("이메일")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("example@eluocnc.com")).toBeInTheDocument();
  });

  it("비밀번호 입력 필드가 존재하고 기본적으로 숨겨져 있다", () => {
    render(<SigninForm />);
    const passwordInput = screen.getByLabelText("비밀번호");
    expect(passwordInput).toBeInTheDocument();
    expect(passwordInput).toHaveAttribute("type", "password");
  });

  it("비밀번호 표시/숨기기 토글이 동작한다", async () => {
    render(<SigninForm />);
    const passwordInput = screen.getByLabelText("비밀번호");
    const toggleButton = screen.getByRole("button", { name: "비밀번호 표시" });

    expect(passwordInput).toHaveAttribute("type", "password");

    fireEvent.click(toggleButton);
    await waitFor(() =>
      expect(passwordInput).toHaveAttribute("type", "text")
    );

    const hideButton = screen.getByRole("button", { name: "비밀번호 숨기기" });
    fireEvent.click(hideButton);
    await waitFor(() =>
      expect(passwordInput).toHaveAttribute("type", "password")
    );
  });

  it("로그인 버튼이 렌더링된다", () => {
    render(<SigninForm />);
    expect(screen.getByRole("button", { name: "로그인" })).toBeInTheDocument();
  });

  it("'계정이 없으신가요?' 텍스트와 회원가입 링크가 존재한다", () => {
    render(<SigninForm />);
    expect(screen.getByText("계정이 없으신가요?")).toBeInTheDocument();
    const signupLink = screen.getByRole("link", { name: "회원가입" });
    expect(signupLink).toBeInTheDocument();
    expect(signupLink).toHaveAttribute("href", "/signup");
  });

  it("이메일이 비어 있으면 유효성 검사 에러를 표시한다", async () => {
    render(<SigninForm />);
    const form = screen.getByRole("button", { name: "로그인" }).closest("form");
    fireEvent.submit(form!);
    await waitFor(() =>
      expect(screen.getByText("이메일을 입력해 주세요")).toBeInTheDocument()
    );
  });

  it("올바르지 않은 이메일 형식이면 유효성 검사 에러를 표시한다", async () => {
    render(<SigninForm />);
    const emailInput = screen.getByLabelText("이메일");
    fireEvent.change(emailInput, { target: { value: "invalid-email" } });
    const form = screen.getByRole("button", { name: "로그인" }).closest("form");
    fireEvent.submit(form!);
    await waitFor(() =>
      expect(screen.getByText("올바른 이메일 형식을 입력해 주세요")).toBeInTheDocument()
    );
  });

  it("비밀번호가 비어 있으면 유효성 검사 에러를 표시한다", async () => {
    render(<SigninForm />);
    const emailInput = screen.getByLabelText("이메일");
    fireEvent.change(emailInput, { target: { value: "test@eluocnc.com" } });
    const form = screen.getByRole("button", { name: "로그인" }).closest("form");
    fireEvent.submit(form!);
    await waitFor(() =>
      expect(screen.getByText("비밀번호를 입력해 주세요")).toBeInTheDocument()
    );
  });

  it("서버 에러가 있으면 에러 메시지를 표시한다", () => {
    setupMockState({ error: "이메일 또는 비밀번호가 올바르지 않습니다" });
    render(<SigninForm />);
    expect(
      screen.getByText("이메일 또는 비밀번호가 올바르지 않습니다")
    ).toBeInTheDocument();
  });

  it("로딩 중일 때 버튼이 비활성화되고 로그인 중 텍스트가 표시된다", () => {
    (React.useActionState as jest.Mock).mockReturnValue([
      { error: "" },
      jest.fn(),
      true,
    ]);
    render(<SigninForm />);
    const button = screen.getByRole("button", { name: "로그인 중..." });
    expect(button).toBeDisabled();
  });

  it("signin 액션이 호출된다", async () => {
    const mockFormAction = setupMockState();
    render(<SigninForm />);

    fireEvent.change(screen.getByLabelText("이메일"), {
      target: { value: "test@eluocnc.com" },
    });
    fireEvent.change(screen.getByLabelText("비밀번호"), {
      target: { value: "password123" },
    });

    const form = screen.getByRole("button", { name: "로그인" }).closest("form");
    fireEvent.submit(form!);

    await waitFor(() => expect(mockFormAction).toHaveBeenCalled());
  });
});

// Suppress act() warnings from unused import
void signin;
