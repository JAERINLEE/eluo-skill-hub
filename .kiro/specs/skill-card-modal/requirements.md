# Requirements Document

## Project Description (Input)
스킬 카드 선택 시 모달 팝업 프론트 구현

스킬 카드 선택 시 해당 스킬에 대한 정보가 모달로 나타난다.
스킬카드에 대한 내용은 목업데이터로 구현한다.
팝업 디자인은 다음과 같다.
web application/stitch/projects/17503682207630546415/screens/8310590711d2486b814fe3845fd591c2

## Introduction

Eluo Skill Hub 마켓플레이스에서 사용자가 스킬 카드를 선택했을 때 해당 스킬의 상세 정보를 모달 팝업으로 표시하는 기능을 정의한다. 현재 스킬 카드(SkillCard)는 클릭 상호작용이 없으며, 이 기능은 스킬 탐색 흐름에서 설치 전 스킬 상세 정보 확인 경험을 제공한다. 상세 데이터는 목업 데이터를 기반으로 구현한다.

---

## Requirements

### Requirement 1: 스킬 카드 클릭으로 모달 열기

**Objective:** As a 스킬 소비자, I want 스킬 카드를 클릭하여 상세 정보 모달을 열 수 있기를, so that 설치 전 해당 스킬의 상세 내용을 확인할 수 있다

#### Acceptance Criteria

1. When 사용자가 스킬 카드를 클릭, the Skill Card Modal shall 해당 스킬의 상세 정보 모달을 화면에 표시한다
2. When 모달이 열릴 때, the Skill Card Modal shall 클릭된 스킬의 id에 해당하는 목업 상세 데이터를 불러와 렌더링한다
3. The Skill Card Modal shall 모달이 열린 상태에서 페이지 배경에 반투명 오버레이(dim)를 표시한다
4. The Skill Card shall 클릭 가능한 요소임을 나타내는 시각적 커서(pointer) 스타일을 가진다

---

### Requirement 2: 모달 내 스킬 상세 정보 표시

**Objective:** As a 스킬 소비자, I want 모달에서 스킬의 충분한 상세 정보를 볼 수 있기를, so that 스킬의 기능과 사용 방법을 파악하고 설치 여부를 결정할 수 있다

#### Acceptance Criteria

1. The Skill Card Modal shall 모달 상단에 스킬 아이콘과 스킬 이름을 표시한다
2. The Skill Card Modal shall 스킬의 카테고리(직군 분류)와 태그 목록을 배지(badge) 형태로 표시한다
3. The Skill Card Modal shall 스킬의 상세 설명(description)을 표시한다
4. The Skill Card Modal shall 스킬 제작자(author) 정보를 표시한다
5. The Skill Card Modal shall 스킬의 버전(version) 정보를 표시한다
6. The Skill Card Modal shall 스킬의 평점(rating)과 설치 수(install count)를 표시한다
7. Where 스킬에 사용 예시(usage example) 데이터가 있는 경우, the Skill Card Modal shall 사용 예시 섹션을 표시한다

---

### Requirement 3: 모달 닫기

**Objective:** As a 스킬 소비자, I want 모달을 다양한 방식으로 닫을 수 있기를, so that 스킬 목록 탐색으로 자연스럽게 복귀할 수 있다

#### Acceptance Criteria

1. When 사용자가 모달 내 닫기(X) 버튼을 클릭, the Skill Card Modal shall 모달을 닫고 배경 오버레이를 제거한다
2. When 사용자가 모달 외부 오버레이 영역을 클릭, the Skill Card Modal shall 모달을 닫는다
3. When 사용자가 Escape 키를 누름, the Skill Card Modal shall 모달을 닫는다
4. While 모달이 열려 있는 동안, the Skill Card Modal shall 페이지 배경 스크롤을 잠근다(scroll lock)

---

### Requirement 4: 스킬 설치 액션

**Objective:** As a 스킬 소비자, I want 모달에서 바로 스킬을 설치할 수 있기를, so that 상세 정보 확인 후 즉시 설치 행동으로 이어질 수 있다

#### Acceptance Criteria

1. The Skill Card Modal shall 모달 내에 "설치하기" 버튼을 표시한다
2. When 사용자가 "설치하기" 버튼을 클릭, the Skill Card Modal shall 설치 의도를 콘솔 로그 또는 토스트 메시지로 출력한다 (목업 단계 동작)
3. If 스킬이 이미 설치된 상태(목업 데이터 기준)인 경우, the Skill Card Modal shall "설치하기" 버튼 대신 "설치됨" 상태 표시를 렌더링한다

---

### Requirement 5: 목업 데이터 구조

**Objective:** As a 개발자, I want 스킬 상세 목업 데이터를 명확한 타입과 함께 제공받기를, so that 실제 API 연동 시 최소한의 변경으로 교체할 수 있다

#### Acceptance Criteria

1. The Skill Card Modal shall 기존 SkillSummary 타입을 확장한 SkillDetail 타입(author, version, rating, installCount, usageExample, isInstalled 필드 포함)을 사용한다
2. The Skill Card Modal shall 각 직군 카테고리(기획, 디자인, 퍼블리싱, 개발, QA)에 해당하는 스킬 상세 목업 데이터를 최소 1개 이상 포함한다
3. The Skill Card Modal shall 목업 데이터를 별도 파일(예: skill-detail-mock-data)로 분리하여 관리한다
4. If 선택된 스킬 id에 해당하는 상세 데이터가 목업에 없는 경우, the Skill Card Modal shall 기본 fallback 데이터를 표시하거나 모달을 열지 않는다

---

### Requirement 6: 접근성 및 UX

**Objective:** As a 스킬 소비자, I want 모달이 접근성 기준을 충족하기를, so that 키보드 및 스크린 리더 사용자도 불편 없이 이용할 수 있다

#### Acceptance Criteria

1. The Skill Card Modal shall 모달 루트 요소에 `role="dialog"` 및 `aria-modal="true"` 속성을 적용한다
2. The Skill Card Modal shall 모달이 열릴 때 포커스를 모달 내부 첫 번째 포커스 가능 요소로 이동시킨다
3. While 모달이 열려 있는 동안, the Skill Card Modal shall 포커스가 모달 내부에서만 순환(focus trap)되도록 유지한다
4. When 모달이 닫힐 때, the Skill Card Modal shall 포커스를 모달을 열기 전에 활성화되어 있던 스킬 카드 요소로 복원한다
5. The Skill Card Modal shall 모달 제목을 `aria-labelledby`로 연결하여 스크린 리더에서 모달 목적을 인식할 수 있도록 한다
