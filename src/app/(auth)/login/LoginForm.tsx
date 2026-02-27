'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';

import { useAuthForm } from '@/app/(auth)/_hooks/useAuthForm';
import { loginAction } from '@/app/(auth)/login/actions';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

/**
 * 로그인 폼 클라이언트 사이드 zod 유효성 검증 스키마
 */
const loginFormSchema = z.object({
  email: z.string().email('유효한 이메일 주소를 입력해주세요'),
  password: z.string().min(1, '패스워드를 입력해주세요'),
});

type LoginFormValues = z.infer<typeof loginFormSchema>;

/**
 * 서버 에러 코드에 따른 에러 메시지를 반환한다.
 * invalid_credentials, email_not_confirmed는 spec에서 정의된 메시지를 그대로 사용하고,
 * 그 외는 서버가 반환한 message를 사용한다.
 */
function getServerErrorMessage(code: string, message: string): string {
  switch (code) {
    case 'invalid_credentials':
      return '이메일 또는 패스워드가 올바르지 않습니다';
    case 'email_not_confirmed':
      return '이메일 인증이 필요합니다. 가입 시 발송된 인증 메일을 확인해주세요';
    default:
      return message;
  }
}

/**
 * 로그인 폼 클라이언트 컴포넌트
 *
 * 이메일/패스워드 입력, zod 유효성 검증, 서버 액션 호출, 에러 표시를 담당한다.
 * - useAuthForm 훅으로 서버 액션 상태(isPending, state)를 관리
 * - react-hook-form + zod로 클라이언트 사이드 폼 유효성 검증
 * - 서버 에러 코드에 따른 적절한 한국어 메시지 표시
 * - 로딩 중 버튼 비활성화 및 로딩 인디케이터 표시
 * - 네트워크 오류 시 재시도 버튼 제공
 */
export default function LoginForm() {
  const { state, formAction, isPending } = useAuthForm(loginAction);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  function onSubmit(values: LoginFormValues) {
    const formData = new FormData();
    formData.set('email', values.email);
    formData.set('password', values.password);
    formAction(formData);
  }

  const isNetworkError =
    state?.status === 'error' && state.code === 'network_error';

  return (
    <Card>
      <CardHeader>
        <CardTitle>로그인</CardTitle>
      </CardHeader>
      <CardContent>
        {/* 서버 에러 메시지 표시 */}
        {state?.status === 'error' && (
          <div className="mb-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            <p>{getServerErrorMessage(state.code, state.message)}</p>
            {isNetworkError && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => form.handleSubmit(onSubmit)()}
              >
                다시 시도
              </Button>
            )}
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* 이메일 필드 */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>이메일</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="이메일 주소를 입력해주세요"
                      autoComplete="email"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 패스워드 필드 */}
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>패스워드</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="패스워드를 입력해주세요"
                      autoComplete="current-password"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 로그인 버튼 */}
            <Button
              type="submit"
              className="w-full"
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  로그인 중...
                </>
              ) : (
                '로그인'
              )}
            </Button>
          </form>
        </Form>

        {/* 회원가입 링크 */}
        <div className="mt-4 text-center text-sm text-muted-foreground">
          아직 계정이 없으신가요?{' '}
          <Link href="/signup" className="text-primary underline-offset-4 hover:underline">
            회원가입
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
