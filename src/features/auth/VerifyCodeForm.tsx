"use client";

import React, { useActionState } from "react";
import type { VerifyCodeActionState } from "@/app/signup/verify-code/actions";

interface VerifyCodeFormProps {
  email: string;
  verifyAction: (
    prevState: VerifyCodeActionState,
    formData: FormData
  ) => Promise<VerifyCodeActionState>;
  resendAction: (
    prevState: VerifyCodeActionState,
    formData: FormData
  ) => Promise<VerifyCodeActionState>;
}

const inputClass =
  "w-full px-4 py-3 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-foreground focus:outline-none focus:ring-2 focus:ring-primary tracking-widest text-center text-lg font-medium";

const labelClass =
  "block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1";

export function VerifyCodeForm({
  email,
  verifyAction,
  resendAction,
}: VerifyCodeFormProps) {
  const [verifyState, verifyFormAction, isVerifyPending] = useActionState(
    verifyAction,
    {}
  );
  const [resendState, resendFormAction, isResendPending] = useActionState(
    resendAction,
    {}
  );

  return (
    <div className="space-y-6">
      {/* Email notice */}
      <p className="text-sm text-slate-600 dark:text-slate-400 text-center">
        <span className="font-medium text-foreground">{email}</span>
        으로 인증 코드를 발송했습니다
      </p>

      {/* Verify form */}
      <form action={verifyFormAction}>
        <input type="hidden" name="email" value={email} />

        <div className="space-y-5">
          <div>
            <label htmlFor="code" className={labelClass}>
              인증 코드
            </label>
            <input
              id="code"
              name="code"
              type="text"
              inputMode="numeric"
              maxLength={8}
              autoComplete="one-time-code"
              placeholder="00000000"
              className={inputClass}
            />
          </div>

          {/* Verify server error */}
          {verifyState.error && (
            <div
              className="px-4 py-3 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-sm text-red-600 dark:text-red-400"
              role="alert"
            >
              {verifyState.error}
            </div>
          )}

          <button
            type="submit"
            disabled={isVerifyPending}
            className="w-full py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {isVerifyPending ? "인증 중..." : "인증하기"}
          </button>
        </div>
      </form>

      {/* Resend form */}
      <form action={resendFormAction}>
        <input type="hidden" name="email" value={email} />

        <div className="space-y-3">
          {/* Resend success message */}
          {resendState.message && (
            <p
              className="text-sm text-center text-emerald-600 dark:text-emerald-400"
              role="status"
            >
              {resendState.message}
            </p>
          )}

          {/* Resend error */}
          {resendState.error && (
            <div
              className="px-4 py-3 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-sm text-red-600 dark:text-red-400"
              role="alert"
            >
              {resendState.error}
            </div>
          )}

          <button
            type="submit"
            disabled={isResendPending}
            className="w-full py-2 text-sm text-primary hover:underline disabled:opacity-50 transition-opacity"
          >
            {isResendPending ? "재발송 중..." : "인증 코드 재발송"}
          </button>
        </div>
      </form>
    </div>
  );
}
