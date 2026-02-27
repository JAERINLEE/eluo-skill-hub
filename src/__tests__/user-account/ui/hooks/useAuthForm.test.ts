import { renderHook, act } from '@testing-library/react';
import { startTransition } from 'react';
import { useAuthForm } from '@/app/(auth)/_hooks/useAuthForm';
import type { AuthResult } from '@/user-account/domain/AuthResult';

/**
 * useAuthForm 커스텀 훅 단위 테스트
 *
 * 테스트 대상:
 * - 초기 상태 (isPending: false, state: null)
 * - action 호출 (FormData와 함께 액션 함수 호출)
 * - state 업데이트 (액션 완료 후 상태 변경)
 */

describe('useAuthForm 훅', () => {
  describe('초기 상태', () => {
    it('isPending이 초기에 false이어야 한다', () => {
      const mockAction = jest.fn().mockResolvedValue({
        status: 'success',
        redirectTo: '/',
      } satisfies AuthResult);

      const { result } = renderHook(() => useAuthForm(mockAction));

      expect(result.current.isPending).toBe(false);
    });

    it('state가 초기에 null이어야 한다', () => {
      const mockAction = jest.fn().mockResolvedValue({
        status: 'success',
        redirectTo: '/',
      } satisfies AuthResult);

      const { result } = renderHook(() => useAuthForm(mockAction));

      expect(result.current.state).toBeNull();
    });

    it('formAction이 함수로 제공되어야 한다', () => {
      const mockAction = jest.fn().mockResolvedValue({
        status: 'success',
        redirectTo: '/',
      } satisfies AuthResult);

      const { result } = renderHook(() => useAuthForm(mockAction));

      expect(typeof result.current.formAction).toBe('function');
    });
  });

  describe('action 호출', () => {
    it('formAction 실행 시 제공된 action 함수가 호출되어야 한다', async () => {
      const mockAction = jest.fn().mockResolvedValue({
        status: 'success',
        redirectTo: '/',
      } satisfies AuthResult);

      const { result } = renderHook(() => useAuthForm(mockAction));

      const formData = new FormData();
      formData.append('email', 'test@eluocnc.com');
      formData.append('password', 'password123!');

      await act(async () => {
        startTransition(() => {
          result.current.formAction(formData);
        });
      });

      expect(mockAction).toHaveBeenCalledTimes(1);
    });

    it('formAction 호출 시 FormData를 액션에 전달해야 한다', async () => {
      const mockAction = jest.fn().mockResolvedValue({
        status: 'success',
        redirectTo: '/',
      } satisfies AuthResult);

      const { result } = renderHook(() => useAuthForm(mockAction));

      const formData = new FormData();
      formData.append('email', 'test@eluocnc.com');

      await act(async () => {
        startTransition(() => {
          result.current.formAction(formData);
        });
      });

      // useActionState는 (prevState, formData) 형태로 호출됨
      expect(mockAction).toHaveBeenCalledWith(null, formData);
    });
  });

  describe('state 업데이트', () => {
    it('액션이 성공 결과를 반환하면 state가 업데이트되어야 한다', async () => {
      const successResult: AuthResult = {
        status: 'success',
        redirectTo: '/',
      };
      const mockAction = jest.fn().mockResolvedValue(successResult);

      const { result } = renderHook(() => useAuthForm(mockAction));

      const formData = new FormData();

      await act(async () => {
        startTransition(() => {
          result.current.formAction(formData);
        });
      });

      expect(result.current.state).toEqual(successResult);
    });

    it('액션이 에러 결과를 반환하면 state에 에러가 설정되어야 한다', async () => {
      const errorResult: AuthResult = {
        status: 'error',
        code: 'invalid_credentials',
        message: '이메일 또는 패스워드가 올바르지 않습니다',
      };
      const mockAction = jest.fn().mockResolvedValue(errorResult);

      const { result } = renderHook(() => useAuthForm(mockAction));

      const formData = new FormData();

      await act(async () => {
        startTransition(() => {
          result.current.formAction(formData);
        });
      });

      expect(result.current.state).toEqual(errorResult);
    });

    it('액션이 signup_success 결과를 반환하면 state가 업데이트되어야 한다', async () => {
      const signupSuccessResult: AuthResult = {
        status: 'signup_success',
        message: '인증 메일이 발송되었습니다. 이메일을 확인해주세요.',
      };
      const mockAction = jest.fn().mockResolvedValue(signupSuccessResult);

      const { result } = renderHook(() => useAuthForm(mockAction));

      const formData = new FormData();

      await act(async () => {
        startTransition(() => {
          result.current.formAction(formData);
        });
      });

      expect(result.current.state).toEqual(signupSuccessResult);
    });

    it('network_error 코드를 가진 에러 결과를 올바르게 처리해야 한다', async () => {
      const networkErrorResult: AuthResult = {
        status: 'error',
        code: 'network_error',
        message: '네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요',
      };
      const mockAction = jest.fn().mockResolvedValue(networkErrorResult);

      const { result } = renderHook(() => useAuthForm(mockAction));

      const formData = new FormData();

      await act(async () => {
        startTransition(() => {
          result.current.formAction(formData);
        });
      });

      expect(result.current.state).toEqual(networkErrorResult);
      expect(result.current.state?.status).toBe('error');
      if (result.current.state?.status === 'error') {
        expect(result.current.state.code).toBe('network_error');
      }
    });
  });
});
