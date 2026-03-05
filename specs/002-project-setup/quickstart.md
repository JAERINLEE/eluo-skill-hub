# Quickstart: 프로젝트 환경 세팅 검증

**목적**: 구현 완료 후 모든 설정이 올바르게 동작하는지 검증하는 단계별 가이드

---

## 사전 조건

- Node.js 20+ 설치
- 브랜치: `002-project-setup` 체크아웃
- `npm install` 완료

---

## Step 1: 폰트 파일 확인

```bash
ls src/app/font/
# 기대 결과: PretendardVariable.woff2
```

---

## Step 2: 타입 체크 (컨스티튜션 원칙 I 검증)

```bash
npx tsc --noEmit
# 기대 결과: 오류 없이 0 exit code
```

---

## Step 3: ESLint no-any 규칙 검증

```bash
# 일시적으로 any 타입 코드 작성 후 테스트
echo "const x: any = 1" > /tmp/test-any.ts
npx eslint /tmp/test-any.ts --rule '{"@typescript-eslint/no-explicit-any": "error"}'
# 기대 결과: error 보고

# 실제 codebase lint
npm run lint
# 기대 결과: 오류 없이 통과
```

---

## Step 4: 개발 서버 실행 및 시각 검증

```bash
npm run dev
# http://localhost:3000 접속
```

### 4a. 폰트 검증

1. 브라우저 DevTools → Network 탭 → Filter: `Font`
2. `PretendardVariable.woff2`가 `localhost:3000` (또는 `/_next/static/`) 에서 로드되는지 확인
3. **CDN 요청 없음**: `cdn.jsdelivr.net` 요청이 없어야 함

### 4b. 브랜드 컬러 검증

1. `http://localhost:3000` 루트 페이지 접속 (비로그인 상태)
2. 아래 색상이 화면에 보여야 함:
   - **#FEFE01** (밝은 노랑): 강조 요소 또는 버튼
   - **#00007F** (짙은 네이비): 배경 또는 헤더
   - **#F0F0F0** (연한 회색): 카드 또는 섹션 배경
3. DevTools → Elements → 임의 컴포넌트 선택 → Computed 탭에서 `--color-brand-*` CSS variable 확인

### 4c. Tailwind 토큰 클래스 동작 검증

```bash
# 임시 컴포넌트에서 토큰 클래스 사용 확인
# src/app/page.tsx 또는 LandingPage에서 다음 클래스가 에러 없이 빌드되어야 함:
# bg-[#FEFE01], text-[#00007F], bg-brand-light
```

---

## Step 5: 빌드 검증

```bash
npm run build
# 기대 결과:
# - TypeScript 오류 없음
# - ESLint 오류 없음
# - 빌드 성공 (exit code 0)
# - .next/static/chunks/ 내 woff2 파일 포함 확인
```

---

## Step 6: 단위 테스트 실행

```bash
npm run test
# 기대 결과: 기존 테스트 모두 통과
```

---

## Step 7: E2E 테스트 실행 (옵션)

```bash
npm run test:e2e
# 기대 결과: Playwright 테스트 통과
```

---

## 검증 완료 기준

| 항목 | 기준 | 방법 |
|-----|-----|-----|
| TypeScript | 오류 0개 | `npx tsc --noEmit` |
| ESLint | `no-any` rule 활성화, 오류 0개 | `npm run lint` |
| 폰트 | CDN 요청 없음, 로컬 woff2 로드 | DevTools Network |
| 브랜드 컬러 | 3가지 색상 모두 화면에 표시 | 시각 검증 |
| 빌드 | 성공 | `npm run build` |
| 기존 테스트 | 회귀 없음 | `npm run test` |
