#!/bin/bash
# ============================================================
# Eluo Skill Hub - 원클릭 마이그레이션 스크립트
#
# 사용법:
#   cd eluo-skill-hub
#   chmod +x migration-dump/migrate.sh
#   ./migration-dump/migrate.sh
#
# 사전 준비:
#   1. 새 Supabase 프로젝트 생성
#   2. 아래 변수를 새 프로젝트 정보로 수정
# ============================================================

set -euo pipefail

# ============================================================
# 설정 - 새 Supabase 프로젝트 정보를 입력하세요
# ============================================================
NEW_HOST=""          # 예: aws-1-ap-northeast-1.pooler.supabase.com
NEW_PORT="5432"
NEW_USER=""          # 예: postgres.xxxxxxxxxxxx
NEW_DB="postgres"
NEW_PASSWORD=""      # 새 프로젝트 DB 비밀번호

# ============================================================
# 입력 검증
# ============================================================
if [ -z "$NEW_HOST" ] || [ -z "$NEW_USER" ] || [ -z "$NEW_PASSWORD" ]; then
  echo "=========================================="
  echo " 오류: 새 Supabase 프로젝트 정보를 입력하세요!"
  echo "=========================================="
  echo ""
  echo "migrate.sh 파일을 열고 아래 변수를 수정하세요:"
  echo "  NEW_HOST=\"aws-X-ap-northeast-X.pooler.supabase.com\""
  echo "  NEW_USER=\"postgres.YOUR_PROJECT_REF\""
  echo "  NEW_PASSWORD=\"YOUR_DB_PASSWORD\""
  echo ""
  echo "정보 확인: Supabase Dashboard → Settings → Database → Session mode"
  exit 1
fi

DUMP_DIR="$(cd "$(dirname "$0")" && pwd)"
export PGPASSWORD="$NEW_PASSWORD"
PSQL_CMD="psql -h $NEW_HOST -p $NEW_PORT -U $NEW_USER -d $NEW_DB"

echo "=========================================="
echo " Eluo Skill Hub - DB 마이그레이션 시작"
echo "=========================================="
echo "대상: $NEW_USER@$NEW_HOST:$NEW_PORT/$NEW_DB"
echo ""

# ============================================================
# Step 1: 연결 테스트
# ============================================================
echo "[1/6] 연결 테스트..."
if ! $PSQL_CMD -c "SELECT 1" > /dev/null 2>&1; then
  echo "오류: DB 연결 실패. 호스트/유저/비밀번호를 확인하세요."
  exit 1
fi
echo "  ✓ 연결 성공"

# ============================================================
# Step 2: 스키마 생성
# ============================================================
echo "[2/6] 스키마 생성 (테이블, 시퀀스, 인덱스)..."
$PSQL_CMD -f "$DUMP_DIR/01_schema.sql" > /dev/null
echo "  ✓ 12개 테이블 + 인덱스 생성 완료"

# ============================================================
# Step 3: 함수 & 트리거 생성
# ============================================================
echo "[3/6] 함수 & 트리거 생성..."
$PSQL_CMD -f "$DUMP_DIR/02_functions.sql" > /dev/null
echo "  ✓ 14개 함수 + 3개 트리거 생성 완료"

# ============================================================
# Step 4: RLS 정책 + Storage 버킷 생성
# ============================================================
echo "[4/6] RLS 정책 + Storage 버킷 생성..."
$PSQL_CMD -f "$DUMP_DIR/03_rls.sql" > /dev/null
echo "  ✓ RLS 정책 + Storage 버킷 생성 완료"

# ============================================================
# Step 5: 데이터 임포트
# ============================================================
echo "[5/6] 데이터 임포트..."

# 프로젝트 루트에서 실행해야 CSV 경로가 맞음
cd "$DUMP_DIR/.."
$PSQL_CMD -f "migration-dump/04_import_data.sql"

echo "  ✓ 데이터 임포트 완료"

# ============================================================
# Step 6: 최종 확인
# ============================================================
echo ""
echo "[6/6] 최종 확인..."
$PSQL_CMD -c "SELECT 'auth.users' AS t, COUNT(*) FROM auth.users UNION ALL SELECT 'profiles', COUNT(*) FROM public.profiles UNION ALL SELECT 'skills', COUNT(*) FROM public.skills UNION ALL SELECT 'categories', COUNT(*) FROM public.categories UNION ALL SELECT 'bookmarks', COUNT(*) FROM public.bookmarks UNION ALL SELECT 'event_logs', COUNT(*) FROM public.event_logs;"

echo ""
echo "=========================================="
echo " 마이그레이션 완료!"
echo "=========================================="
echo ""
echo "다음 단계:"
echo "  1. .env.local 업데이트 (새 Supabase URL + Anon Key)"
echo "  2. .mcp.json 업데이트 (새 project_ref)"
echo "  3. Storage 파일 마이그레이션 (migrate-storage.ts 실행)"
echo "  4. pnpm dev → 기존 계정으로 로그인 테스트"
echo ""
