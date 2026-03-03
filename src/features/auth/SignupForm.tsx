"use client";

import { useActionState, useState, useEffect, useRef } from "react";
import Link from "next/link";
import { signup, verifyOtp, resendOtp } from "@/app/signup/actions";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Button } from "@/shared/ui/button";
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
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

function isAllowedEmailDomain(email: string): boolean {
  const lower = email.toLowerCase();
  const atIndex = lower.lastIndexOf("@");
  if (atIndex === -1) return false;
  return lower.slice(atIndex + 1) === ALLOWED_EMAIL_DOMAIN;
}

function SignupFormInner({ onReset }: { onReset: () => void }) {
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

  const isVerifyStep = signupState.step === "verify";
  const isDuplicateStep = signupState.step === "duplicate";
  const verifiedEmail = signupState.email || currentEmail;

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

  const validateSignupForm = (formData: FormData): SignupValidationErrors => {
    const errors: SignupValidationErrors = {};
    const name = formData.get("name");
    const email = formData.get("email");
    const password = formData.get("password");
    const confirmPassword = formData.get("confirmPassword");

    if (typeof name !== "string" || name.trim() === "") {
      errors.name = "이름을 입력해 주세요";
    }

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

    if (typeof confirmPassword !== "string" || confirmPassword === "") {
      errors.confirmPassword = "비밀번호 확인을 입력해 주세요";
    } else if (typeof password === "string" && password !== confirmPassword) {
      errors.confirmPassword = "비밀번호가 일치하지 않습니다";
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

  const showSignupServerError = serverErrorVisible && signupState.error && !isVerifyStep && !isDuplicateStep;

  if (isDuplicateStep) {
    return (
      <div className="glass-card w-full max-w-[480px] rounded-3xl shadow-2xl p-8 md:p-10 relative z-10">
        {/* Card header */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-14 h-14 bg-brand-yellow rounded-2xl flex items-center justify-center mb-6 shadow-sm">
            <span className="text-3xl">👤</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-brand-navy">이미 가입된 이메일입니다</h1>
          <p className="text-slate-500 text-sm mt-3 text-center font-medium">
            입력하신 이메일은 이미 가입된 계정입니다.
            <br />
            로그인 페이지에서 로그인해 주세요.
          </p>
        </div>

        <div className="space-y-4">
          <Link
            href="/signin"
            className="w-full h-14 bg-brand-navy text-white font-bold rounded-xl hover:shadow-lg hover:shadow-brand-navy/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            로그인으로 이동
          </Link>
          <div className="text-center">
            <button
              type="button"
              onClick={onReset}
              className="text-sm text-slate-600 hover:text-brand-navy transition-colors underline underline-offset-4"
            >
              다른 이메일로 가입하기
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isVerifyStep) {
    return (
      <div className="glass-card w-full max-w-[480px] rounded-3xl shadow-2xl p-8 md:p-10 relative z-10">
        {/* Card header */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-14 h-14 bg-brand-yellow rounded-2xl flex items-center justify-center mb-6 shadow-sm">
            <span className="text-3xl">✉️</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-brand-navy">이메일 인증</h1>
          <p className="text-slate-500 text-sm mt-3 text-center font-medium">
            <span className="font-bold text-brand-navy">{verifiedEmail}</span>
            <br />
            로 발송된 8자리 인증코드를 입력해 주세요.
          </p>
        </div>

        <form action={verifyFormAction} className="space-y-5">
          <input type="hidden" name="email" value={verifiedEmail} />
          <div className="space-y-2">
            <label
              htmlFor="token"
              className="text-xs font-bold text-brand-navy uppercase tracking-wider ml-1"
            >
              인증코드
            </label>
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
              className="h-12 bg-white/50 border-white rounded-xl focus:ring-2 focus:ring-brand-navy/20 focus:border-brand-navy text-center tracking-[0.5em] text-lg"
            />
            {verifyState.error && (
              <p id="token-error" className="text-sm text-destructive" role="alert">
                {verifyState.error}
              </p>
            )}
          </div>
          <div className="pt-4">
            <button
              type="submit"
              disabled={isVerifyPending}
              className="w-full h-14 bg-brand-navy text-white font-bold rounded-xl hover:shadow-lg hover:shadow-brand-navy/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isVerifyPending ? "확인 중..." : "인증 확인"}
            </button>
          </div>
        </form>

        <div className="mt-5 pt-8 border-t border-white/40">
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
            <button
              type="submit"
              disabled={isResendPending || cooldown > 0 || resendState.isRateLimited}
              className="text-sm text-slate-600 hover:text-brand-navy transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {cooldown > 0
                ? `재발송 가능까지 ${cooldown}초`
                : isResendPending
                  ? "발송 중..."
                  : "인증코드 재발송"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card w-full max-w-[480px] rounded-3xl shadow-2xl p-8 md:p-10 relative z-10">
      {/* Card header */}
      <div className="flex flex-col items-center mb-10">
        <div className="w-14 h-14 bg-brand-yellow rounded-2xl flex items-center justify-center mb-6 shadow-sm">
          <span className="text-3xl">✨</span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-brand-navy">회원가입</h1>
        <p className="text-slate-500 text-sm mt-3 text-center font-medium">
          ELUO AI 플랫폼의 새로운 여정을 시작하세요
        </p>
      </div>

      <form action={handleSignupAction} className="space-y-5">
        {/* 이름 */}
        <div className="space-y-2">
          <label
            htmlFor="name"
            className="text-xs font-bold text-brand-navy uppercase tracking-wider ml-1"
          >
            이름
          </label>
          <Input
            id="name"
            name="name"
            type="text"
            placeholder="홍길동"
            autoComplete="name"
            onChange={handleInputChange}
            aria-invalid={!!validationErrors.name}
            aria-describedby={validationErrors.name ? "name-error" : undefined}
            className="h-12 bg-white/50 border-white rounded-xl focus:ring-2 focus:ring-brand-navy/20 focus:border-brand-navy"
          />
          {validationErrors.name && (
            <p id="name-error" className="text-sm text-destructive" role="alert">
              {validationErrors.name}
            </p>
          )}
        </div>

        {/* 이메일 */}
        <div className="space-y-2">
          <label
            htmlFor="email"
            className="text-xs font-bold text-brand-navy uppercase tracking-wider ml-1"
          >
            이메일
          </label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="example@eluocnc.com"
            autoComplete="email"
            onChange={handleInputChange}
            aria-invalid={!!validationErrors.email}
            aria-describedby={validationErrors.email ? "email-error" : undefined}
            className="h-12 bg-white/50 border-white rounded-xl focus:ring-2 focus:ring-brand-navy/20 focus:border-brand-navy"
          />
          {validationErrors.email && (
            <p id="email-error" className="text-sm text-destructive" role="alert">
              {validationErrors.email}
            </p>
          )}
        </div>

        {/* 비밀번호 + 비밀번호 확인 (2열 반응형) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label
              htmlFor="password"
              className="text-xs font-bold text-brand-navy uppercase tracking-wider ml-1"
            >
              비밀번호
            </label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              autoComplete="new-password"
              onChange={handleInputChange}
              aria-invalid={!!validationErrors.password}
              aria-describedby={validationErrors.password ? "password-error" : undefined}
              className="h-12 bg-white/50 border-white rounded-xl focus:ring-2 focus:ring-brand-navy/20 focus:border-brand-navy"
            />
            {validationErrors.password && (
              <p id="password-error" className="text-sm text-destructive" role="alert">
                {validationErrors.password}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <label
              htmlFor="confirmPassword"
              className="text-xs font-bold text-brand-navy uppercase tracking-wider ml-1"
            >
              비밀번호 확인
            </label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              placeholder="••••••••"
              autoComplete="new-password"
              onChange={handleInputChange}
              aria-invalid={!!validationErrors.confirmPassword}
              aria-describedby={
                validationErrors.confirmPassword ? "confirm-password-error" : undefined
              }
              className="h-12 bg-white/50 border-white rounded-xl focus:ring-2 focus:ring-brand-navy/20 focus:border-brand-navy"
            />
            {validationErrors.confirmPassword && (
              <p id="confirm-password-error" className="text-sm text-destructive" role="alert">
                {validationErrors.confirmPassword}
              </p>
            )}
          </div>
        </div>

        {showSignupServerError && (
          <p className="text-sm text-destructive" role="alert">
            {signupState.error}
          </p>
        )}

        <div className="pt-4">
          <button
            type="submit"
            disabled={isSignupPending}
            className="w-full h-14 bg-brand-navy text-white font-bold rounded-xl hover:shadow-lg hover:shadow-brand-navy/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSignupPending ? "처리 중..." : "회원가입"}
          </button>
        </div>
      </form>

      {/* 로그인 이동 링크 (T010) */}
      <div className="mt-5 pt-8 border-t border-white/40 text-center">
        <p className="text-sm text-slate-600">
          이미 계정이 있으신가요?{" "}
          <Link
            href="/signin"
            className="text-slate-800 font-bold hover:text-brand-navy transition-colors underline underline-offset-4"
          >
            로그인
          </Link>
        </p>
      </div>
    </div>
  );
}

export function SignupForm() {
  const [resetKey, setResetKey] = useState(0);
  return <SignupFormInner key={resetKey} onReset={() => setResetKey((k) => k + 1)} />;
}
