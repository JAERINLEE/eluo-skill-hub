/**
 * Task 1.1: Supabase SSR 브라우저 클라이언트 리팩터링 테스트
 *
 * 기존 싱글톤 export를 createBrowserClient 기반 팩토리 함수로 전환하는지 검증한다.
 */

jest.mock('@supabase/ssr', () => ({
  createBrowserClient: jest.fn().mockReturnValue({
    auth: { getSession: jest.fn() },
  }),
}));

import { createBrowserClient } from '@supabase/ssr';
import { createSupabaseBrowserClient } from '@/shared/infrastructure/supabase/client';

describe('createSupabaseBrowserClient', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // 환경변수 설정
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY = 'test-anon-key';

    // mock 기본값 재설정
    (createBrowserClient as jest.Mock).mockReturnValue({
      auth: { getSession: jest.fn() },
    });
  });

  afterEach(() => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;
  });

  it('createBrowserClient를 사용하여 클라이언트를 생성해야 한다', () => {
    createSupabaseBrowserClient();

    expect(createBrowserClient).toHaveBeenCalledTimes(1);
  });

  it('올바른 환경변수를 createBrowserClient에 전달해야 한다', () => {
    createSupabaseBrowserClient();

    expect(createBrowserClient).toHaveBeenCalledWith(
      'https://test.supabase.co',
      'test-anon-key'
    );
  });

  it('호출할 때마다 createBrowserClient를 새로 호출해야 한다 (팩토리 함수 패턴)', () => {
    createSupabaseBrowserClient();
    createSupabaseBrowserClient();

    expect(createBrowserClient).toHaveBeenCalledTimes(2);
  });

  it('createBrowserClient가 반환한 클라이언트를 그대로 반환해야 한다', () => {
    const mockClient = { auth: { getSession: jest.fn() } };
    (createBrowserClient as jest.Mock).mockReturnValue(mockClient);

    const client = createSupabaseBrowserClient();

    expect(client).toBe(mockClient);
  });
});
