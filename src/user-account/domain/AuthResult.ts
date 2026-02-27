/**
 * 인증 작업의 에러 코드 타입
 */
export type AuthErrorCode =
  | 'invalid_credentials'
  | 'email_not_confirmed'
  | 'email_already_registered'
  | 'invalid_email_domain'
  | 'network_error'
  | 'unknown_error';

/**
 * 인증 작업 결과를 표현하는 판별 합집합(discriminated union) 타입
 * 직렬화 가능한 순수 데이터 구조 (Server Action 반환용)
 */
export type AuthResult =
  | { status: 'success'; redirectTo: string }
  | { status: 'error'; code: AuthErrorCode; message: string }
  | { status: 'signup_success'; message: string };
