import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              if (!value || options?.maxAge === 0) {
                // 쿠키 삭제 요청 (signOut 등)은 그대로 전달
                cookieStore.set(name, value, options);
              } else {
                // 만료 시간 10분으로 고정 (브라우저 종료 + 비활동 시 자동 로그아웃)
                const { maxAge: _maxAge, expires: _expires, ...sessionOptions } = options ?? {};
                cookieStore.set(name, value, { ...sessionOptions, maxAge: 600 });
              }
            });
          } catch {
            // Server Component에서 호출 시 무시
          }
        },
      },
    }
  );
}
