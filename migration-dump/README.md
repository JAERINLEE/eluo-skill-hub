# DB 마이그레이션 파일 목록

## 실행 순서

### 1단계: 새 Supabase 프로젝트 생성
- Supabase Dashboard에서 새 프로젝트 생성
- Session Pooler 연결 정보 메모 (Settings → Database → Session mode)

### 2단계: `migrate.sh` 설정 후 실행
```bash
# migrate.sh 파일 열고 NEW_HOST, NEW_USER, NEW_PASSWORD 수정
vi migration-dump/migrate.sh

# 실행 (프로젝트 루트에서)
./migration-dump/migrate.sh
```

이 스크립트가 자동으로:
- 스키마 생성 (01_schema.sql)
- 함수 & 트리거 생성 (02_functions.sql)
- RLS 정책 + Storage 버킷 생성 (03_rls.sql)
- 데이터 임포트 (04_import_data.sql) - auth.users 포함, 비밀번호 해시 유지
- 데이터 무결성 검증

### 3단계: Storage 파일 마이그레이션
```bash
# migrate-storage.ts 열고 SERVICE_KEY 입력
vi migration-dump/migrate-storage.ts

# 실행
npx tsx migration-dump/migrate-storage.ts
```

### 4단계: 코드 환경 변수 수정
- `.env.local` - 새 Supabase URL + Anon Key
- `.mcp.json` - 새 project_ref

## 파일 설명

| 파일 | 설명 |
|------|------|
| `01_schema.sql` | 테이블 12개 + 시퀀스 + 인덱스 20개 |
| `02_functions.sql` | 함수 14개 + 트리거 3개 |
| `03_rls.sql` | RLS 정책 48개 + Storage 버킷 2개 |
| `04_import_data.sql` | CSV 데이터 임포트 + 무결성 검증 |
| `migrate.sh` | 위 4개를 순서대로 실행하는 메인 스크립트 |
| `migrate-storage.ts` | Storage 파일 복사 스크립트 |
| `*.csv` | 기존 DB에서 덤프한 데이터 파일 |
