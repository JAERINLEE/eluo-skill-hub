# Requirements Document

## Introduction

Eluo Skill Hub 루트 페이지(`/`)에 인증 미들웨어를 적용하고, 로그인 상태에 따른 UI 분기를 구현한다. 기존 Next.js 미들웨어(`middleware.ts`)에 비인증 사용자의 루트 페이지 접근 차단 로직을 추가하고, 상단 헤더의 사용자 프로필 아이콘을 인증 상태에 따라 활성화하여 계정 정보 표시 및 로그아웃 기능을 제공한다. 기존 root-page 스펙(`.kiro/specs/root-page/`)에서 구현된 레이아웃 구조를 유지하면서 인증 계층을 추가하는 것이 핵심이다.

## Requirements

### Requirement 1: 루트 페이지 인증 미들웨어

**Objective:** 사용자로서, 루트 페이지에 접근할 때 인증 여부가 검증되기를 원한다. 그래야 비인증 사용자가 대시보드에 접근하는 것을 방지할 수 있다.

#### Acceptance Criteria

1. When 비인증 사용자가 루트 페이지(`/`)에 접근하면, the Auth Middleware shall 로그인 페이지(`/login`)로 리다이렉트한다.
2. When 인증된 사용자가 루트 페이지(`/`)에 접근하면, the Auth Middleware shall 루트 페이지를 정상적으로 표시한다.
3. When 인증된 사용자가 로그인 페이지(`/login`) 또는 회원가입 페이지(`/signup`)에 접근하면, the Auth Middleware shall 루트 페이지(`/`)로 리다이렉트한다.
4. The Auth Middleware shall Supabase Auth 세션을 기반으로 사용자 인증 상태를 판별한다.

### Requirement 2: 인증 상태에 따른 헤더 사용자 프로필 활성화

**Objective:** 인증된 사용자로서, 상단 헤더의 사용자 프로필 아이콘이 활성화되기를 원한다. 그래야 로그인 상태임을 인지하고 계정 관련 기능에 접근할 수 있다.

#### Acceptance Criteria

1. While 사용자가 인증된 상태이면, the Header shall 사용자 프로필 아이콘 버튼을 활성(클릭 가능) 상태로 표시한다.
2. While 사용자가 인증된 상태이면, the Header shall 사용자 프로필 아이콘에 인증 상태를 시각적으로 구분할 수 있는 표시를 적용한다.

### Requirement 3: 사용자 계정 정보 팝오버

**Objective:** 인증된 사용자로서, 프로필 아이콘을 클릭하여 내 계정 정보를 확인하고 싶다. 그래야 현재 어떤 계정으로 로그인했는지 빠르게 파악할 수 있다.

#### Acceptance Criteria

1. When 인증된 사용자가 헤더의 프로필 아이콘 버튼을 클릭하면, the Header shall 계정 정보 팝오버(또는 드롭다운)를 표시한다.
2. The 계정 정보 팝오버 shall 로그인한 사용자의 이메일 주소를 표시한다.
3. The 계정 정보 팝오버 shall 로그아웃 버튼을 포함한다.
4. When 팝오버 외부 영역을 클릭하면, the Header shall 계정 정보 팝오버를 닫는다.

### Requirement 4: 로그아웃 처리

**Objective:** 인증된 사용자로서, 로그아웃 버튼을 클릭하여 안전하게 로그아웃하고 싶다. 그래야 다른 사용자가 내 계정에 접근하는 것을 방지할 수 있다.

#### Acceptance Criteria

1. When 사용자가 로그아웃 버튼을 클릭하면, the System shall Supabase Auth 세션을 종료한다.
2. When 로그아웃 처리가 완료되면, the System shall 사용자를 로그인 페이지(`/login`)로 리다이렉트한다.
3. When 로그아웃 처리가 완료되면, the System shall 클라이언트 측 인증 상태를 초기화한다.
4. If 로그아웃 처리 중 오류가 발생하면, the System shall 사용자에게 오류 메시지를 표시한다.

### Requirement 5: 인증 상태 전달

**Objective:** 시스템으로서, 서버에서 확인한 인증 정보를 클라이언트 컴포넌트에 안전하게 전달하고 싶다. 그래야 CSR 환경에서도 인증 상태 기반 UI를 정확하게 렌더링할 수 있다.

#### Acceptance Criteria

1. The System shall 서버 측에서 인증된 사용자 정보(이메일)를 루트 페이지 컴포넌트에 전달한다.
2. The System shall 인증 정보 전달 시 민감한 데이터(비밀번호, 토큰 등)를 클라이언트에 노출하지 않는다.
3. While 루트 페이지가 로딩 중인 상태이면, the System shall 사용자 프로필 영역에 로딩 상태를 표시한다.
