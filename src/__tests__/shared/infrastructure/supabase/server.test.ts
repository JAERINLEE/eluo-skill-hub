/**
 * Task 1.2: Supabase 서버 클라이언트 팩토리 테스트
 *
 * createServerClient 기반 서버 클라이언트 팩토리 함수를 검증한다.
 * 매 호출마다 새 인스턴스를 생성하여 요청 간 세션 격리를 보장해야 한다.
 */

// jest.mock 호이스팅으로 인해 변수 선언보다 먼저 실행되므로
// factory 함수 내에서 직접 jest.fn()을 생성한다.
jest.mock('next/headers', () => ({
  cookies: jest.fn(),
}));

jest.mock('@supabase/ssr', () => ({
  createServerClient: jest.fn(),
}));

import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { createSupabaseServerClient } from '@/shared/infrastructure/supabase/server';

describe('createSupabaseServerClient', () => {
  const mockGetAll = jest.fn().mockReturnValue([
    { name: 'sb-access-token', value: 'access-token-value' },
  ]);
  const mockSet = jest.fn();
  const mockCookieStore = {
    getAll: mockGetAll,
    set: mockSet,
  };

  const mockServerClientInstance = {
    auth: { getUser: jest.fn() },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (cookies as jest.Mock).mockResolvedValue(mockCookieStore);
    (createServerClient as jest.Mock).mockReturnValue(mockServerClientInstance);

    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY = 'test-anon-key';
  });

  afterEach(() => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;
  });

  it('createServerClient를 사용하여 클라이언트를 생성해야 한다', async () => {
    await createSupabaseServerClient();

    expect(createServerClient).toHaveBeenCalledTimes(1);
  });

  it('올바른 환경변수를 createServerClient에 전달해야 한다', async () => {
    await createSupabaseServerClient();

    expect(createServerClient).toHaveBeenCalledWith(
      'https://test.supabase.co',
      'test-anon-key',
      expect.objectContaining({
        cookies: expect.objectContaining({
          getAll: expect.any(Function),
          setAll: expect.any(Function),
        }),
      })
    );
  });

  it('next/headers의 cookies()를 호출하여 쿠키 스토어를 가져와야 한다', async () => {
    await createSupabaseServerClient();

    expect(cookies).toHaveBeenCalledTimes(1);
  });

  it('호출할 때마다 createServerClient를 새로 호출해야 한다 (요청 격리)', async () => {
    await createSupabaseServerClient();
    await createSupabaseServerClient();

    expect(createServerClient).toHaveBeenCalledTimes(2);
  });

  it('createServerClient가 반환한 클라이언트를 그대로 반환해야 한다', async () => {
    const client = await createSupabaseServerClient();

    expect(client).toBe(mockServerClientInstance);
  });

  it('cookies의 getAll은 cookieStore.getAll()을 호출해야 한다', async () => {
    await createSupabaseServerClient();

    // createServerClient에 전달된 cookies.getAll 함수를 추출하여 직접 호출
    const callArgs = (createServerClient as jest.Mock).mock.calls[0];
    const cookiesConfig = callArgs[2].cookies;
    cookiesConfig.getAll();

    expect(mockGetAll).toHaveBeenCalled();
  });

  it('cookies의 setAll은 cookieStore.set()을 각 쿠키마다 호출해야 한다', async () => {
    await createSupabaseServerClient();

    const callArgs = (createServerClient as jest.Mock).mock.calls[0];
    const cookiesConfig = callArgs[2].cookies;
    cookiesConfig.setAll([
      { name: 'cookie1', value: 'value1', options: { httpOnly: true } },
      { name: 'cookie2', value: 'value2', options: { secure: true } },
    ]);

    expect(mockSet).toHaveBeenCalledTimes(2);
    expect(mockSet).toHaveBeenCalledWith('cookie1', 'value1', { httpOnly: true });
    expect(mockSet).toHaveBeenCalledWith('cookie2', 'value2', { secure: true });
  });
});
