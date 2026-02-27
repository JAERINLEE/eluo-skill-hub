'use client';

import { useActionState, useTransition } from 'react';
import type { AuthResult } from '@/user-account/domain/AuthResult';

/**
 * useAuthForm 훅의 반환 타입
 */
export interface UseAuthFormReturn {
  /** 서버 액션의 최신 결과 상태. 초기값은 null */
  state: AuthResult | null;
  /** 폼 제출 시 호출할 액션 함수. useActionState가 래핑한 dispatch 함수 */
  formAction: (payload: FormData) => void;
  /** 서버 액션 실행 중 여부. 중복 제출 방지에 사용 */
  isPending: boolean;
}

/**
 * 인증 폼의 공통 상태 관리 훅
 *
 * useActionState를 래핑하여 서버 액션 호출 상태를 관리한다.
 * - 로딩 상태 추적 및 중복 제출 방지 (isPending)
 * - 서버 액션 결과 상태 관리 (state)
 * - 네트워크 에러 감지: state.status === 'error' && state.code === 'network_error'
 *
 * @param action - 서버 액션 함수. (prevState, formData) 시그니처를 가진다.
 * @returns UseAuthFormReturn
 *
 * @example
 * ```tsx
 * const { state, formAction, isPending } = useAuthForm(loginAction);
 *
 * return (
 *   <form action={formAction}>
 *     ...
 *     <button disabled={isPending}>로그인</button>
 *   </form>
 * );
 * ```
 */
export function useAuthForm(
  action: (prevState: AuthResult | null, formData: FormData) => Promise<AuthResult>
): UseAuthFormReturn {
  const [state, formAction] = useActionState(action, null);
  const [isPending, startTransition] = useTransition();

  const wrappedFormAction = (payload: FormData) => {
    startTransition(() => {
      formAction(payload);
    });
  };

  return {
    state,
    formAction: wrappedFormAction,
    isPending,
  };
}
