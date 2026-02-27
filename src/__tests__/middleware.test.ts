/**
 * Task 1.1: 비인증 사용자의 루트 페이지 접근 차단 미들웨어 테스트
 *
 * middleware.ts의 인증 가드 로직을 검증한다.
 * - 비인증 사용자가 보호 경로(/)에 접근 시 /login으로 리다이렉트
 * - 인증 사용자가 보호 경로(/)에 접근 시 정상 통과
 * - 인증 사용자가 auth 페이지(/login, /signup)에 접근 시 /로 리다이렉트 (기존 동작 유지)
 * - 비인증 사용자가 auth 페이지에 접근 시 정상 통과
 * - AUTH_PAGES 상수로 auth 페이지 경로를 관리
 */

// next/server를 모킹한다 (jsdom 환경에서 Web API Request가 없으므로)
const mockRedirect = jest.fn().mockImplementation((url: URL) => ({
  status: 307,
  headers: new Map([['location', url.toString()]]),
}));

const mockNext = jest.fn().mockImplementation(() => ({
  status: 200,
  headers: new Map(),
  cookies: {
    set: jest.fn(),
  },
}));

jest.mock('next/server', () => {
  class MockNextRequest {
    url: string;
    nextUrl: URL;
    cookies: {
      getAll: () => { name: string; value: string }[];
      set: (name: string, value: string) => void;
    };

    constructor(url: string | URL) {
      const urlString = url instanceof URL ? url.toString() : url;
      this.url = urlString;
      this.nextUrl = new URL(urlString);
      this.cookies = {
        getAll: () => [],
        set: jest.fn(),
      };
    }
  }

  class MockNextResponse {
    status: number;
    headers: Map<string, string>;
    cookies: { set: jest.Mock };

    constructor(status: number, headers: Map<string, string>) {
      this.status = status;
      this.headers = headers;
      this.cookies = { set: jest.fn() };
    }

    static redirect(url: URL) {
      return new MockNextResponse(307, new Map([['location', url.toString()]]));
    }

    static next(options?: { request?: unknown }) {
      return new MockNextResponse(200, new Map());
    }
  }

  return {
    NextRequest: MockNextRequest,
    NextResponse: MockNextResponse,
  };
});

// @supabase/ssr 모킹
jest.mock('@supabase/ssr', () => ({
  createServerClient: jest.fn(),
}));

import { createServerClient } from '@supabase/ssr';

const mockCreateServerClient = createServerClient as jest.MockedFunction<typeof createServerClient>;

/**
 * 모의 Supabase 클라이언트를 생성하는 헬퍼
 */
function createMockSupabaseClient(user: { id: string; email: string } | null) {
  return {
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user },
      }),
    },
  };
}

// middleware.ts에서 내보내는 것을 임포트
// AUTH_PAGES가 아직 존재하지 않으므로 테스트 실패가 예상됨
import { middleware, AUTH_PAGES } from '../middleware';

describe('middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('AUTH_PAGES 상수', () => {
    it('AUTH_PAGES가 /login과 /signup을 포함해야 한다', () => {
      expect(AUTH_PAGES).toContain('/login');
      expect(AUTH_PAGES).toContain('/signup');
    });

    it('AUTH_PAGES가 읽기 전용 배열이어야 한다', () => {
      expect(Array.isArray(AUTH_PAGES)).toBe(true);
    });
  });

  describe('비인증 사용자의 보호 경로 접근 차단 (Req 1.1)', () => {
    it('비인증 사용자가 루트 페이지(/)에 접근하면 /login으로 리다이렉트해야 한다', async () => {
      const mockClient = createMockSupabaseClient(null);
      mockCreateServerClient.mockReturnValue(mockClient as ReturnType<typeof createServerClient>);

      // NextRequest는 모킹되어 있으므로 URL 문자열로 생성
      const { NextRequest } = jest.requireMock('next/server');
      const request = new NextRequest('http://localhost:3000/');
      const response = await middleware(request);

      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toBe('http://localhost:3000/login');
    });
  });

  describe('비인증 사용자의 auth 페이지 접근 허용', () => {
    it('비인증 사용자가 /login에 접근하면 정상적으로 통과해야 한다', async () => {
      const mockClient = createMockSupabaseClient(null);
      mockCreateServerClient.mockReturnValue(mockClient as ReturnType<typeof createServerClient>);

      const { NextRequest } = jest.requireMock('next/server');
      const request = new NextRequest('http://localhost:3000/login');
      const response = await middleware(request);

      expect(response.status).not.toBe(307);
    });

    it('비인증 사용자가 /signup에 접근하면 정상적으로 통과해야 한다', async () => {
      const mockClient = createMockSupabaseClient(null);
      mockCreateServerClient.mockReturnValue(mockClient as ReturnType<typeof createServerClient>);

      const { NextRequest } = jest.requireMock('next/server');
      const request = new NextRequest('http://localhost:3000/signup');
      const response = await middleware(request);

      expect(response.status).not.toBe(307);
    });
  });

  describe('인증 사용자의 루트 페이지 접근 허용 (Req 1.2)', () => {
    it('인증 사용자가 루트 페이지(/)에 접근하면 정상적으로 통과해야 한다', async () => {
      const mockClient = createMockSupabaseClient({
        id: 'user-1',
        email: 'user@eluocnc.com',
      });
      mockCreateServerClient.mockReturnValue(mockClient as ReturnType<typeof createServerClient>);

      const { NextRequest } = jest.requireMock('next/server');
      const request = new NextRequest('http://localhost:3000/');
      const response = await middleware(request);

      expect(response.status).not.toBe(307);
    });
  });

  describe('인증 사용자의 auth 페이지 접근 시 루트로 리다이렉트 (Req 1.3)', () => {
    it('인증 사용자가 /login에 접근하면 /로 리다이렉트해야 한다', async () => {
      const mockClient = createMockSupabaseClient({
        id: 'user-1',
        email: 'user@eluocnc.com',
      });
      mockCreateServerClient.mockReturnValue(mockClient as ReturnType<typeof createServerClient>);

      const { NextRequest } = jest.requireMock('next/server');
      const request = new NextRequest('http://localhost:3000/login');
      const response = await middleware(request);

      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toBe('http://localhost:3000/');
    });

    it('인증 사용자가 /signup에 접근하면 /로 리다이렉트해야 한다', async () => {
      const mockClient = createMockSupabaseClient({
        id: 'user-1',
        email: 'user@eluocnc.com',
      });
      mockCreateServerClient.mockReturnValue(mockClient as ReturnType<typeof createServerClient>);

      const { NextRequest } = jest.requireMock('next/server');
      const request = new NextRequest('http://localhost:3000/signup');
      const response = await middleware(request);

      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toBe('http://localhost:3000/');
    });
  });

  describe('Supabase Auth getUser() 사용 검증 (Req 1.4)', () => {
    it('미들웨어가 getUser()를 호출하여 인증 상태를 판별해야 한다', async () => {
      const mockClient = createMockSupabaseClient(null);
      mockCreateServerClient.mockReturnValue(mockClient as ReturnType<typeof createServerClient>);

      const { NextRequest } = jest.requireMock('next/server');
      const request = new NextRequest('http://localhost:3000/login');
      await middleware(request);

      expect(mockClient.auth.getUser).toHaveBeenCalledTimes(1);
    });
  });
});
