import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
    {
      cookies: {
        getAll() {
          const cookies: { name: string; value: string }[] = [];
          document.cookie.split(';').forEach((c) => {
            const [name, ...rest] = c.trim().split('=');
            if (name) {
              cookies.push({
                name: decodeURIComponent(name),
                value: decodeURIComponent(rest.join('=')),
              });
            }
          });
          return cookies;
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            let cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;
            if (options?.path) cookie += `; path=${options.path}`;
            if (options?.domain) cookie += `; domain=${options.domain}`;
            if (options?.sameSite) cookie += `; samesite=${options.sameSite}`;
            if (options?.secure) cookie += '; secure';
            if (!value || options?.maxAge === 0) {
              // 쿠키 삭제 요청 (signOut 등)은 maxAge/expires 유지
              if (options?.maxAge !== undefined) cookie += `; max-age=${options.maxAge}`;
              if (options?.expires) cookie += `; expires=${options.expires.toUTCString()}`;
            } else {
              // 만료 시간 10분으로 고정 (브라우저 종료 + 비활동 시 자동 로그아웃)
              cookie += '; max-age=600';
            }
            document.cookie = cookie;
          });
        },
      },
    }
  );
}
