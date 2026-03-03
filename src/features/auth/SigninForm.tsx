"use client";

import { useActionState, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { signin } from "@/app/signin/actions";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import type { SigninActionState } from "@/auth/domain/types";

const initialState: SigninActionState = { error: "" };

interface ValidationErrors {
  email?: string;
  password?: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function SigninForm() {
  const [state, formAction, isPending] = useActionState(signin, initialState);
  const [serverErrorVisible, setServerErrorVisible] = useState(true);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [showPassword, setShowPassword] = useState(false);

  const handleInputChange = () => {
    setServerErrorVisible(false);
  };

  const validate = (formData: FormData): ValidationErrors => {
    const errors: ValidationErrors = {};
    const email = formData.get("email");
    const password = formData.get("password");

    if (typeof email !== "string" || email.trim() === "") {
      errors.email = "이메일을 입력해 주세요";
    } else if (!EMAIL_REGEX.test(email)) {
      errors.email = "올바른 이메일 형식을 입력해 주세요";
    }

    if (typeof password !== "string" || password === "") {
      errors.password = "비밀번호를 입력해 주세요";
    }

    return errors;
  };

  const handleFormAction = (formData: FormData) => {
    const errors = validate(formData);
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }
    setValidationErrors({});
    setServerErrorVisible(true);
    return formAction(formData);
  };

  const showServerError = serverErrorVisible && state.error;

  return (
    <div className="glass-card w-full max-w-[440px] rounded-2xl shadow-xl p-8 md:p-12 relative z-10">
      {/* Brand icon + title */}
      <div className="flex flex-col items-center mb-8">
        <div className="w-16 h-16 bg-brand-yellow rounded-2xl flex items-center justify-center mb-4 shadow-sm">
          <span className="text-4xl">🤖</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-brand-navy">로그인</h1>
        <p className="text-slate-600 text-sm mt-2 text-center">ELUO AI Skill Hub에 접속하세요</p>
      </div>

      <form action={handleFormAction} className="space-y-5">
        {/* Email */}
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-semibold text-slate-700">이메일</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="example@eluocnc.com"
            autoComplete="email"
            onChange={handleInputChange}
            aria-invalid={!!validationErrors.email}
            aria-describedby={validationErrors.email ? "email-error" : undefined}
            className="h-12 bg-white/50 border-brand-navy/20 focus:border-brand-navy focus:ring-2 focus:ring-brand-navy/10"
          />
          {validationErrors.email && (
            <p id="email-error" className="text-sm text-destructive" role="alert">
              {validationErrors.email}
            </p>
          )}
        </div>

        {/* Password */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label htmlFor="password" className="text-sm font-semibold text-slate-700">비밀번호</Label>
            <a href="#" className="text-xs text-brand-navy hover:underline">비밀번호 찾기</a>
          </div>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              autoComplete="current-password"
              onChange={handleInputChange}
              aria-invalid={!!validationErrors.password}
              aria-describedby={validationErrors.password ? "password-error" : undefined}
              className="h-12 pr-12 bg-white/50 border-brand-navy/20 focus:border-brand-navy focus:ring-2 focus:ring-brand-navy/10"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-brand-navy transition-colors"
              aria-label={showPassword ? "비밀번호 숨기기" : "비밀번호 표시"}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          {validationErrors.password && (
            <p id="password-error" className="text-sm text-destructive" role="alert">
              {validationErrors.password}
            </p>
          )}
        </div>

        {showServerError && (
          <p className="text-sm text-destructive" role="alert">
            {state.error}
          </p>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="w-full h-12 bg-brand-navy text-white font-bold rounded-[8px] hover:bg-[#0000A0] transition-all shadow-md mt-4 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isPending ? "로그인 중..." : "로그인"}
        </button>
      </form>

      {/* Sign-up link */}
      <div className="mt-8 pt-6 border-t border-slate-200 text-center">
        <p className="text-sm text-slate-600">
          계정이 없으신가요?
          <a href="/signup" className="text-brand-navy font-bold hover:underline ml-1">회원가입</a>
        </p>
      </div>
    </div>
  );
}
