# Quickstart: 탭/브라우저 종료 시 자동 로그아웃

## 변경 파일 목록

1. `src/shared/infrastructure/supabase/server.ts` — 쿠키 옵션에서 `maxAge` 제거하여 세션 쿠키로 전환
2. `src/app/api/auth/signout/route.ts` — (신규) sendBeacon용 로그아웃 Route Handler
3. `src/features/auth/SessionCleanupProvider.tsx` — (신규) `beforeunload` 이벤트 핸들러를 등록하는 클라이언트 컴포넌트
4. `src/app/layout.tsx` 또는 `src/app/(portal)/layout.tsx` — SessionCleanupProvider 삽입

## 구현 흐름

```
탭 닫기/브라우저 종료
  → beforeunload 이벤트 발생
  → navigator.sendBeacon('/api/auth/signout')
  → Route Handler에서 supabase.auth.signOut() 실행
  → 세션 쿠키도 세션 쿠키이므로 브라우저 종료 시 자동 삭제 (fallback)
```

## 테스트 방법

1. 로그인 후 탭 닫기 → 새 탭에서 접속 → 로그인 페이지 확인
2. 로그인 후 브라우저 종료 → 재실행 후 접속 → 로그인 페이지 확인
3. 다중 탭: 탭 A, B 열기 → 탭 A 닫기 → 탭 B는 로그인 유지 확인
4. 명시적 로그아웃 버튼 클릭 → 기존 동작 동일 확인
