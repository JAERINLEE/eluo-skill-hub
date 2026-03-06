# Data Model: 탭/브라우저 종료 시 자동 로그아웃

## 변경 없음

이 기능은 데이터 모델 변경이 필요하지 않습니다.

- 기존 Supabase Auth 세션(auth.sessions)을 그대로 사용
- 기존 쿠키 기반 세션 관리(`@supabase/ssr`)의 쿠키 옵션만 변경
- 새로운 테이블이나 엔티티 추가 없음

## 영향받는 인프라 설정

| 항목 | 현재 | 변경 후 |
|------|------|---------|
| 세션 쿠키 maxAge | Supabase 기본값 (영속적) | 없음 (세션 쿠키) |
| Supabase 서버 세션 | 탭 종료 시 유지 | `beforeunload` 시 `signOut()` 호출로 무효화 |
