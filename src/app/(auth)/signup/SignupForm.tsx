'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { useAuthForm } from '@/app/(auth)/_hooks/useAuthForm';
import { signupAction } from '@/app/(auth)/signup/actions';

/**
 * 회원가입 폼 zod 유효성 검증 스키마
 */
const signupFormSchema = z
  .object({
    email: z
      .string()
      .email('유효한 이메일 주소를 입력해주세요')
      .refine(
        (email) => email.endsWith('@eluocnc.com'),
        'eluocnc.com 이메일만 가입이 가능합니다'
      ),
    password: z
      .string()
      .min(8, '패스워드는 최소 8자 이상이어야 합니다')
      .regex(
        /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/,
        '패스워드는 특수문자를 1개 이상 포함해야 합니다'
      ),
    passwordConfirm: z.string(),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: '패스워드가 일치하지 않습니다',
    path: ['passwordConfirm'],
  });

type SignupFormValues = z.infer<typeof signupFormSchema>;

/**
 * 회원가입 폼 클라이언트 컴포넌트
 *
 * - react-hook-form + zod로 클라이언트 사이드 유효성 검증
 * - useAuthForm 훅을 통한 서버 액션 호출 및 상태 관리
 * - 가입 성공 시 인증 메일 발송 안내 화면으로 전환
 * - 중복 이메일, 네트워크 오류 등 에러 상태 처리
 */
export default function SignupForm() {
  const { state, formAction, isPending } = useAuthForm(signupAction);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupFormSchema),
  });

  // 가입 성공 시 안내 화면 표시
  if (state?.status === 'signup_success') {
    return (
      <div className="w-full max-w-md mx-auto p-8 text-center">
        <div className="mb-4 text-2xl font-semibold">이메일 인증</div>
        <p className="text-muted-foreground">{state.message}</p>
        <p className="mt-4 text-sm">
          <Link href="/login" className="underline text-primary">
            로그인 페이지로 이동
          </Link>
        </p>
      </div>
    );
  }

  /**
   * 폼 제출 핸들러
   * react-hook-form이 클라이언트 검증을 완료한 후 서버 액션을 호출한다.
   */
  const onSubmit = (data: SignupFormValues) => {
    const formData = new FormData();
    formData.append('email', data.email);
    formData.append('password', data.password);
    formAction(formData);
  };

  return (
    <div className="w-full max-w-md mx-auto p-8">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-semibold">회원가입</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          eluocnc.com 이메일로 가입하세요
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        {/* 이메일 필드 */}
        <div className="mb-4">
          <label
            htmlFor="email"
            className="block text-sm font-medium mb-1"
          >
            이메일
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            {...register('email')}
          />
          {errors.email && (
            <p className="mt-1 text-sm text-destructive" role="alert">
              {errors.email.message}
            </p>
          )}
        </div>

        {/* 패스워드 필드 */}
        <div className="mb-4">
          <label
            htmlFor="password"
            className="block text-sm font-medium mb-1"
          >
            패스워드
          </label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            {...register('password')}
          />
          {errors.password && (
            <p className="mt-1 text-sm text-destructive" role="alert">
              {errors.password.message}
            </p>
          )}
        </div>

        {/* 패스워드 확인 필드 */}
        <div className="mb-6">
          <label
            htmlFor="passwordConfirm"
            className="block text-sm font-medium mb-1"
          >
            패스워드 확인
          </label>
          <input
            id="passwordConfirm"
            type="password"
            autoComplete="new-password"
            className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            {...register('passwordConfirm')}
          />
          {errors.passwordConfirm && (
            <p className="mt-1 text-sm text-destructive" role="alert">
              {errors.passwordConfirm.message}
            </p>
          )}
        </div>

        {/* 서버 에러 메시지 */}
        {state?.status === 'error' && (
          <div className="mb-4 p-3 rounded-md bg-destructive/10 text-destructive text-sm">
            <p>{state.message}</p>
            {state.code === 'email_already_registered' && (
              <p className="mt-1">
                <Link href="/login" className="underline font-medium">
                  로그인
                </Link>
                으로 이동하세요.
              </p>
            )}
            {state.code === 'network_error' && (
              <button
                type="button"
                onClick={() => {
                  // 재시도: 폼을 다시 제출할 수 있도록 버튼 역할
                  const form = document.querySelector('form');
                  if (form) {
                    form.dispatchEvent(
                      new Event('submit', { bubbles: true, cancelable: true })
                    );
                  }
                }}
                className="mt-2 underline font-medium"
              >
                다시 시도
              </button>
            )}
          </div>
        )}

        {/* 회원가입 버튼 */}
        <button
          type="submit"
          disabled={isPending}
          className="w-full py-2 px-4 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isPending ? '가입 중...' : '회원가입'}
        </button>
      </form>

      {/* 로그인 링크 */}
      <p className="mt-4 text-center text-sm text-muted-foreground">
        이미 계정이 있으신가요?{' '}
        <Link href="/login" className="underline font-medium text-primary">
          로그인
        </Link>
      </p>
    </div>
  );
}
