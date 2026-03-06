# Research: 탭/브라우저 종료 시 자동 로그아웃

## R1: 탭 종료 감지 메커니즘

**Decision**: `beforeunload` 이벤트에서 `navigator.sendBeacon`을 사용하여 서버 사이드 로그아웃 API를 호출한다.

**Rationale**:
- `beforeunload` 이벤트는 탭 닫기, 브라우저 종료, 페이지 이동 시 발생하며 가장 신뢰할 수 있는 감지 방법이다.
- `navigator.sendBeacon`은 페이지 unload 중에도 비동기 요청을 안정적으로 전송할 수 있다 (일반 fetch/XHR은 unload 시 취소될 수 있음).
- 단, 페이지 내 네비게이션(SPA 라우팅)에서는 `beforeunload`가 발생하지 않으므로 Next.js App Router의 클라이언트 네비게이션과 충돌하지 않는다.

**Alternatives considered**:
- `visibilitychange` + `document.hidden`: 탭 전환 시에도 발생하여 오탐(false positive) 위험이 높다.
- `pagehide` 이벤트: `beforeunload`와 유사하지만 `sendBeacon`과의 조합에서 `beforeunload`가 더 널리 지원됨.
- 세션 쿠키만 사용: 브라우저 종료는 감지하지만 탭 닫기는 감지 못함.

## R2: 세션 쿠키 vs 영속적 쿠키

**Decision**: 세션 쿠키(maxAge/expires 없음)로 전환하되, `beforeunload` + `sendBeacon` 로그아웃을 1차 메커니즘으로 사용하고 세션 쿠키를 2차 보완(fallback)으로 활용한다.

**Rationale**:
- 1차: `beforeunload`에서 서버 사이드 `signOut`을 호출하여 Supabase 세션을 즉시 무효화
- 2차: 세션 쿠키(maxAge 없음)로 설정하여 브라우저 크래시 등 `beforeunload`가 실행되지 않는 경우에도 브라우저 종료 시 쿠키가 삭제됨
- 이중 보호로 안정성 확보

**Alternatives considered**:
- 세션 쿠키만 사용: Supabase 서버 세션이 무효화되지 않아 토큰이 남아있을 수 있음
- `beforeunload`만 사용: 브라우저 크래시 시 세션 유지 위험

## R3: SPA 네비게이션과 beforeunload 충돌 방지

**Decision**: `beforeunload` 핸들러 내에서 내부 네비게이션 플래그를 체크하여, Next.js 내부 라우팅 시에는 로그아웃을 트리거하지 않는다.

**Rationale**:
- Next.js App Router는 클라이언트 사이드 네비게이션 시 `beforeunload`를 발생시키지 않으므로 기본적으로 충돌하지 않는다.
- 그러나 `window.location.href` 변경이나 `<a>` 태그 클릭 등 full page navigation 시에는 `beforeunload`가 발생할 수 있다.
- 내부 네비게이션 감지를 위해 `next/router`의 `routeChangeStart` 이벤트 또는 커스텀 플래그를 활용한다.

**Alternatives considered**:
- 별도 처리 없이 `beforeunload`에서 항상 로그아웃: 페이지 새로고침이나 외부 링크 클릭 시에도 로그아웃되는 부작용
- `unload` 이벤트 대신 `pagehide`: 동일한 문제 존재

## R4: 로그아웃 API 엔드포인트

**Decision**: `/api/auth/signout` Route Handler를 생성하여 `sendBeacon`의 타겟으로 사용한다.

**Rationale**:
- 현재 `signOut`은 Server Action으로 구현되어 있으나, `sendBeacon`은 POST 요청만 보낼 수 있으므로 별도의 Route Handler가 필요하다.
- Route Handler에서 Supabase `auth.signOut()`을 호출하고 세션 쿠키를 삭제한다.
- 기존 명시적 로그아웃(Server Action)은 그대로 유지한다.

**Alternatives considered**:
- 기존 Server Action 재사용: `sendBeacon`에서 Server Action을 직접 호출하는 것은 기술적으로 불가능
- 클라이언트에서만 쿠키 삭제: 서버 세션이 무효화되지 않아 보안 취약
