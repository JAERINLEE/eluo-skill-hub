"use client";

import { useActionState, useState, useEffect, useRef } from "react";
import Link from "next/link";
import { signup, verifyOtp, resendOtp } from "@/app/signup/actions";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import type {
  SignupActionState,
  VerifyOtpActionState,
  ResendOtpActionState,
} from "@/auth/domain/types";

const RESEND_COOLDOWN_SECONDS = 60;
const ALLOWED_EMAIL_DOMAIN = "eluocnc.com";

const initialSignupState: SignupActionState = { error: "", step: "form", email: "" };
const initialVerifyState: VerifyOtpActionState = { error: "" };
const initialResendState: ResendOtpActionState = { error: "", success: false, isRateLimited: false };

interface SignupValidationErrors {
  email?: string;
  password?: string;
}

function isAllowedEmailDomain(email: string): boolean {
  const lower = email.toLowerCase();
  const atIndex = lower.lastIndexOf("@");
  if (atIndex === -1) return false;
  return lower.slice(atIndex + 1) === ALLOWED_EMAIL_DOMAIN;
}

export function SignupForm() {
  const [signupState, signupFormAction, isSignupPending] = useActionState(
    signup,
    initialSignupState
  );
  const [verifyState, verifyFormAction, isVerifyPending] = useActionState(
    verifyOtp,
    initialVerifyState
  );
  const [resendState, resendFormAction, isResendPending] = useActionState(
    resendOtp,
    initialResendState
  );

  const [validationErrors, setValidationErrors] = useState<SignupValidationErrors>({});
  const [serverErrorVisible, setServerErrorVisible] = useState(true);
  const [currentEmail, setCurrentEmail] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [resendMessage, setResendMessage] = useState("");
  const cooldownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // signup 성공 시 verify 단계로 전환
  const isVerifyStep = signupState.step === "verify";
  const verifiedEmail = signupState.email || currentEmail;

  // 재발송 성공 메시지 처리
  useEffect(() => {
    if (resendState.success) {
      setResendMessage("인증코드가 재발송되었습니다");
      startCooldown();
    }
  }, [resendState.success]);

  function startCooldown() {
    setCooldown(RESEND_COOLDOWN_SECONDS);
    if (cooldownTimerRef.current) {
      clearInterval(cooldownTimerRef.current);
    }
    cooldownTimerRef.current = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          if (cooldownTimerRef.current) {
            clearInterval(cooldownTimerRef.current);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  // 회원가입 폼 클라이언트 검증
  const validateSignupForm = (formData: FormData): SignupValidationErrors => {
    const errors: SignupValidationErrors = {};
    const email = formData.get("email");
    const password = formData.get("password");

    if (typeof email !== "string" || email.trim() === "") {
      errors.email = "이메일을 입력해 주세요";
    } else if (!isAllowedEmailDomain(email.trim())) {
      errors.email = "eluocnc.com 이메일만 사용할 수 있습니다";
    }

    if (typeof password !== "string" || password === "") {
      errors.password = "비밀번호를 입력해 주세요";
    } else if (password.length < 8) {
      errors.password = "비밀번호는 최소 8자 이상이어야 합니다";
    }

    return errors;
  };

  const handleSignupAction = (formData: FormData) => {
    const errors = validateSignupForm(formData);
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }
    const email = formData.get("email");
    if (typeof email === "string") {
      setCurrentEmail(email.toLowerCase());
    }
    setValidationErrors({});
    setServerErrorVisible(true);
    return signupFormAction(formData);
  };

  const handleInputChange = () => {
    setServerErrorVisible(false);
  };

  const showSignupServerError = serverErrorVisible && signupState.error && !isVerifyStep;
  const isDuplicateEmailError = signupState.error === "이미 가입된 이메일입니다";

  if (isVerifyStep) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">이메일 인증</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center mb-6">
            <span className="font-medium text-foreground">{verifiedEmail}</span>
            <br />
            로 발송된 8자리 인증코드를 입력해 주세요.
          </p>

          <form action={verifyFormAction} className="space-y-4">
            <input type="hidden" name="email" value={verifiedEmail} />
            <div className="space-y-2">
              <Label htmlFor="token">인증코드</Label>
              <Input
                id="token"
                name="token"
                type="text"
                inputMode="numeric"
                pattern="[0-9]{8}"
                maxLength={8}
                placeholder="8자리 숫자 입력"
                autoComplete="one-time-code"
                aria-invalid={!!verifyState.error}
                aria-describedby={verifyState.error ? "token-error" : undefined}
              />
              {verifyState.error && (
                <p id="token-error" className="text-sm text-destructive" role="alert">
                  {verifyState.error}
                </p>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={isVerifyPending}>
              {isVerifyPending ? "확인 중..." : "인증 확인"}
            </Button>
          </form>

          <div className="mt-4 pt-4 border-t">
            <form action={resendFormAction} className="flex flex-col items-center gap-2">
              <input type="hidden" name="email" value={verifiedEmail} />
              {resendMessage && (
                <p className="text-sm text-green-600" role="status">
                  {resendMessage}
                </p>
              )}
              {resendState.error && (
                <p className="text-sm text-destructive" role="alert">
                  {resendState.error}
                </p>
              )}
              <Button
                type="submit"
                variant="ghost"
                className="text-sm"
                disabled={isResendPending || cooldown > 0 || resendState.isRateLimited}
              >
                {cooldown > 0
                  ? `재발송 가능까지 ${cooldown}초`
                  : isResendPending
                    ? "발송 중..."
                    : "인증코드 재발송"}
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-2xl text-center">회원가입</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={handleSignupAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">이메일</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="name@eluocnc.com"
              autoComplete="email"
              onChange={handleInputChange}
              aria-invalid={!!validationErrors.email}
              aria-describedby={validationErrors.email ? "email-error" : undefined}
            />
            {validationErrors.email && (
              <p id="email-error" className="text-sm text-destructive" role="alert">
                {validationErrors.email}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">비밀번호</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="8자 이상 입력"
              autoComplete="new-password"
              onChange={handleInputChange}
              aria-invalid={!!validationErrors.password}
              aria-describedby={validationErrors.password ? "password-error" : undefined}
            />
            {validationErrors.password && (
              <p id="password-error" className="text-sm text-destructive" role="alert">
                {validationErrors.password}
              </p>
            )}
          </div>
          {showSignupServerError && (
            <div>
              <p className="text-sm text-destructive" role="alert">
                {signupState.error}
              </p>
              {isDuplicateEmailError && (
                <p className="text-sm mt-1">
                  <Link
                    href="/signin"
                    className="text-primary underline underline-offset-4 hover:opacity-80"
                  >
                    로그인 페이지로 이동
                  </Link>
                </p>
              )}
            </div>
          )}
          <Button type="submit" className="w-full" disabled={isSignupPending}>
            {isSignupPending ? "처리 중..." : "회원가입"}
          </Button>
        </form>
        <p className="text-sm text-center text-muted-foreground mt-4">
          이미 계정이 있으신가요?{" "}
          <Link
            href="/signin"
            className="text-primary underline underline-offset-4 hover:opacity-80"
          >
            로그인
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
