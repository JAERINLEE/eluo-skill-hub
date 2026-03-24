-- ============================================================
-- Eluo Skill Hub - 데이터 임포트 스크립트
-- 03_rls.sql 실행 후, 이 파일은 psql CLI에서 실행하세요.
--
-- 사용법:
--   PGPASSWORD='<비밀번호>' psql \
--     -h <새_SESSION_POOLER_HOST> -p 5432 \
--     -U postgres.<새_PROJECT_REF> -d postgres \
--     -f migration-dump/04_import_data.sql
--
-- 주의: CSV 파일 경로는 이 파일 기준 상대경로입니다.
--       psql을 프로젝트 루트에서 실행해야 합니다.
-- ============================================================

-- Step 1: auth.users 트리거 비활성화 (중복 profiles 방지)
ALTER TABLE auth.users DISABLE TRIGGER on_auth_user_email_confirmed;

-- Step 2: auth 데이터 임포트
\COPY auth.users FROM 'migration-dump/auth_users.csv' WITH CSV HEADER;
\COPY auth.identities FROM 'migration-dump/auth_identities.csv' WITH CSV HEADER;

-- Step 3: roles 임포트 (시드 데이터)
\COPY public.roles FROM 'migration-dump/roles.csv' WITH CSV HEADER;

-- Step 4: permissions & role_permissions
\COPY public.permissions FROM 'migration-dump/permissions.csv' WITH CSV HEADER;
\COPY public.role_permissions FROM 'migration-dump/role_permissions.csv' WITH CSV HEADER;

-- Step 5: profiles (FK: auth.users, roles)
\COPY public.profiles FROM 'migration-dump/profiles.csv' WITH CSV HEADER;

-- Step 6: categories
\COPY public.categories FROM 'migration-dump/categories.csv' WITH CSV HEADER;

-- Step 7: skills (FK: auth.users, categories)
\COPY public.skills FROM 'migration-dump/skills.csv' WITH CSV HEADER;

-- Step 8: skill 하위 테이블
\COPY public.skill_templates FROM 'migration-dump/skill_templates.csv' WITH CSV HEADER;
\COPY public.skill_feedback_logs FROM 'migration-dump/skill_feedback_logs.csv' WITH CSV HEADER;
\COPY public.feedback_replies FROM 'migration-dump/feedback_replies.csv' WITH CSV HEADER;
\COPY public.skill_version_history FROM 'migration-dump/skill_version_history.csv' WITH CSV HEADER;

-- Step 9: bookmarks (FK: skills)
\COPY public.bookmarks FROM 'migration-dump/bookmarks.csv' WITH CSV HEADER;

-- Step 10: event_logs
\COPY public.event_logs FROM 'migration-dump/event_logs.csv' WITH CSV HEADER;

-- Step 11: 시퀀스 값 동기화 (현재 skill_code 최대값 + 1)
SELECT setval('skill_code_seq', (SELECT COALESCE(MAX(skill_code::bigint), 10000000) FROM public.skills) + 1);

-- Step 12: 트리거 재활성화
ALTER TABLE auth.users ENABLE TRIGGER on_auth_user_email_confirmed;

-- Step 13: 데이터 무결성 검증
SELECT '=== 데이터 무결성 검증 ===' AS info;

SELECT 'auth.users' AS "테이블", COUNT(*) AS "행 수" FROM auth.users
UNION ALL SELECT 'auth.identities', COUNT(*) FROM auth.identities
UNION ALL SELECT 'profiles', COUNT(*) FROM public.profiles
UNION ALL SELECT 'roles', COUNT(*) FROM public.roles
UNION ALL SELECT 'permissions', COUNT(*) FROM public.permissions
UNION ALL SELECT 'role_permissions', COUNT(*) FROM public.role_permissions
UNION ALL SELECT 'categories', COUNT(*) FROM public.categories
UNION ALL SELECT 'skills', COUNT(*) FROM public.skills
UNION ALL SELECT 'skill_templates', COUNT(*) FROM public.skill_templates
UNION ALL SELECT 'skill_feedback_logs', COUNT(*) FROM public.skill_feedback_logs
UNION ALL SELECT 'feedback_replies', COUNT(*) FROM public.feedback_replies
UNION ALL SELECT 'skill_version_history', COUNT(*) FROM public.skill_version_history
UNION ALL SELECT 'bookmarks', COUNT(*) FROM public.bookmarks
UNION ALL SELECT 'event_logs', COUNT(*) FROM public.event_logs;

-- 고아 profiles 확인 (0이면 정상)
SELECT '고아 profiles (0이면 정상):' AS info,
  COUNT(*) AS count
FROM public.profiles p
LEFT JOIN auth.users u ON p.id = u.id
WHERE u.id IS NULL;

SELECT '=== 데이터 임포트 완료! ===' AS result;
