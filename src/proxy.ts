import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => {
            if (!value || options?.maxAge === 0) {
              // 쿠키 삭제 요청 (signOut 등)은 그대로 전달
              supabaseResponse.cookies.set(name, value, options);
            } else {
              // maxAge/expires 제거 → 세션 쿠키 (브라우저 종료 시 삭제)
              const { maxAge: _maxAge, expires: _expires, ...sessionOptions } = options ?? {};
              supabaseResponse.cookies.set(name, value, sessionOptions);
            }
          });
        },
      },
    }
  );

  const pathname = request.nextUrl.pathname;
  const hasAuthCookie = request.cookies
    .getAll()
    .some((c) => c.name.startsWith("sb-") && c.name.endsWith("-auth-token"));

  // /signin, /signup: 쿠키 있으면 즉시 리다이렉트 (getUser 생략)
  if (pathname === "/signin" || pathname === "/signup") {
    if (hasAuthCookie) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return supabaseResponse;
  }

  // /admin: 쿠키 없으면 즉시 리다이렉트, 있으면 getUser()로 검증
  if (pathname.startsWith("/admin")) {
    if (!hasAuthCookie) {
      return NextResponse.redirect(new URL("/signin", request.url));
    }
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.redirect(new URL("/signin", request.url));
    }
    return supabaseResponse;
  }

  // 기타 경로: getSession()으로 로컬 JWT 검사 (토큰 갱신 시에만 서버 호출)
  await supabase.auth.getSession();

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
