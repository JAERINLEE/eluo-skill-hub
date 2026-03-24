-- ============================================================
-- Eluo Skill Hub - 함수 & 트리거 생성 스크립트
-- 01_schema.sql 실행 후 실행하세요.
-- ============================================================

-- ============================================================
-- 1. Helper 함수
-- ============================================================

-- 관리자 확인 (RLS 정책에서 사용)
CREATE OR REPLACE FUNCTION public.is_admin(check_user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.profiles p
    JOIN public.roles r ON p.role_id = r.id
    WHERE p.id = check_user_id
      AND r.name = 'admin'
  );
END;
$function$;

-- updated_at 자동 갱신
CREATE OR REPLACE FUNCTION public.handle_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- updated_at 자동 갱신 (별칭)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- tsvector 불변 래퍼 (검색 인덱스용)
CREATE OR REPLACE FUNCTION public.immutable_to_tsvector(config regconfig, input_text text)
 RETURNS tsvector
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN to_tsvector(config, input_text);
END;
$function$;

-- ============================================================
-- 2. 이메일 중복 확인 (회원가입용)
-- ============================================================

CREATE OR REPLACE FUNCTION public.check_email_exists(check_email text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles WHERE email = lower(check_email)
  );
END;
$function$;

-- ============================================================
-- 3. skill_code 자동 생성 트리거 함수
-- ============================================================

CREATE OR REPLACE FUNCTION public.generate_skill_code()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  IF NEW.skill_code IS NULL OR NEW.skill_code = '' THEN
    NEW.skill_code := nextval('skill_code_seq')::TEXT;
  END IF;
  RETURN NEW;
END;
$function$;

-- ============================================================
-- 4. 신규 유저 이메일 인증 시 프로필 자동 생성
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  -- email_confirmed_at이 NULL에서 값이 설정된 경우에만 실행
  IF OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL THEN
    INSERT INTO public.profiles (id, email, name, role_id, created_at)
    VALUES (
      NEW.id,
      NEW.email,
      NEW.raw_user_meta_data->>'display_name',
      (SELECT id FROM public.roles WHERE name = 'viewer'),
      now()
    )
    ON CONFLICT (id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$function$;

-- ============================================================
-- 5. 다운로드/조회 카운트 함수
-- ============================================================

CREATE OR REPLACE FUNCTION public.increment_download_count(skill_id_param uuid)
 RETURNS void
 LANGUAGE sql
 SECURITY DEFINER
AS $function$
  UPDATE public.skills
  SET download_count = download_count + 1
  WHERE id = skill_id_param;
$function$;

CREATE OR REPLACE FUNCTION public.increment_install_count(p_skill_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO skill_stats (skill_id, install_count, view_count)
  VALUES (p_skill_id, 1, 0)
  ON CONFLICT (skill_id)
  DO UPDATE SET install_count = skill_stats.install_count + 1;
END;
$function$;

CREATE OR REPLACE FUNCTION public.increment_view_count(p_skill_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO skill_stats (skill_id, install_count, view_count)
  VALUES (p_skill_id, 0, 1)
  ON CONFLICT (skill_id)
  DO UPDATE SET view_count = skill_stats.view_count + 1;
END;
$function$;

-- ============================================================
-- 6. 분석 RPC 함수
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_analytics_overview(start_date timestamptz, end_date timestamptz)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  period_length interval;
  prev_start timestamptz;
  prev_end timestamptz;
  cur_active_users bigint;
  cur_skill_views bigint;
  cur_template_downloads bigint;
  prev_active_users bigint;
  prev_skill_views bigint;
  prev_template_downloads bigint;
BEGIN
  period_length := end_date - start_date;
  prev_start := start_date - period_length;
  prev_end := start_date;

  SELECT
    COUNT(DISTINCT user_id) FILTER (WHERE user_id IS NOT NULL),
    COUNT(*) FILTER (WHERE event_name = 'skill.view'),
    COUNT(*) FILTER (WHERE event_name = 'skill.template_download')
  INTO cur_active_users, cur_skill_views, cur_template_downloads
  FROM event_logs
  WHERE created_at >= start_date AND created_at < end_date;

  SELECT
    COUNT(DISTINCT user_id) FILTER (WHERE user_id IS NOT NULL),
    COUNT(*) FILTER (WHERE event_name = 'skill.view'),
    COUNT(*) FILTER (WHERE event_name = 'skill.template_download')
  INTO prev_active_users, prev_skill_views, prev_template_downloads
  FROM event_logs
  WHERE created_at >= prev_start AND created_at < prev_end;

  RETURN json_build_object(
    'activeUsers', cur_active_users,
    'skillViews', cur_skill_views,
    'templateDownloads', cur_template_downloads,
    'activeUsersChange', CASE WHEN prev_active_users = 0 THEN 0 ELSE ROUND(((cur_active_users - prev_active_users)::numeric / prev_active_users) * 100, 1) END,
    'skillViewsChange', CASE WHEN prev_skill_views = 0 THEN 0 ELSE ROUND(((cur_skill_views - prev_skill_views)::numeric / prev_skill_views) * 100, 1) END,
    'templateDownloadsChange', CASE WHEN prev_template_downloads = 0 THEN 0 ELSE ROUND(((cur_template_downloads - prev_template_downloads)::numeric / prev_template_downloads) * 100, 1) END
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_daily_trend(start_date timestamptz, end_date timestamptz)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  RETURN (
    SELECT COALESCE(json_agg(row_to_json(t) ORDER BY t.date), '[]'::json)
    FROM (
      SELECT
        d.date::date::text AS date,
        COALESCE(SUM(CASE WHEN e.event_name = 'skill.view' THEN 1 ELSE 0 END), 0) AS "skillViews",
        COALESCE(SUM(CASE WHEN e.event_name = 'skill.template_download' THEN 1 ELSE 0 END), 0) AS "templateDownloads"
      FROM generate_series(start_date::date, (end_date - interval '1 day')::date, interval '1 day') AS d(date)
      LEFT JOIN event_logs e
        ON DATE_TRUNC('day', e.created_at) = d.date
        AND e.created_at >= start_date
        AND e.created_at < end_date
      GROUP BY d.date
    ) t
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_skill_rankings(start_date timestamptz, end_date timestamptz, result_limit integer DEFAULT 10)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  RETURN (
    SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
    FROM (
      SELECT
        s.id::text AS "skillId",
        s.title AS "skillTitle",
        COALESCE(SUM(CASE WHEN e.event_name = 'skill.view' THEN 1 ELSE 0 END), 0) AS "viewCount",
        COALESCE(SUM(CASE WHEN e.event_name = 'skill.template_download' THEN 1 ELSE 0 END), 0) AS "downloadCount",
        COALESCE(SUM(CASE WHEN e.event_name = 'skill.bookmark_add' THEN 1 ELSE 0 END), 0)
          - COALESCE(SUM(CASE WHEN e.event_name = 'skill.bookmark_remove' THEN 1 ELSE 0 END), 0) AS "bookmarkCount"
      FROM event_logs e
      INNER JOIN skills s ON s.id::text = e.properties->>'skill_id'
      WHERE e.created_at >= start_date
        AND e.created_at < end_date
        AND e.event_name IN ('skill.view', 'skill.template_download', 'skill.bookmark_add', 'skill.bookmark_remove')
      GROUP BY s.id, s.title
      ORDER BY "viewCount" DESC
      LIMIT result_limit
    ) t
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_user_behavior(start_date timestamptz, end_date timestamptz)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  sidebar_clicks json;
BEGIN
  SELECT COALESCE(json_agg(row_to_json(t) ORDER BY t."clickCount" DESC), '[]'::json)
  INTO sidebar_clicks
  FROM (
    SELECT
      properties->>'tab' AS tab,
      COUNT(*) AS "clickCount"
    FROM event_logs
    WHERE event_name = 'nav.sidebar_click'
      AND created_at >= start_date
      AND created_at < end_date
    GROUP BY properties->>'tab'
  ) t;

  RETURN json_build_object(
    'sidebarClicks', sidebar_clicks
  );
END;
$function$;

-- ============================================================
-- 7. 트리거 생성
-- ============================================================

-- skills INSERT 시 skill_code 자동 생성
CREATE TRIGGER trg_generate_skill_code
  BEFORE INSERT ON public.skills
  FOR EACH ROW EXECUTE FUNCTION public.generate_skill_code();

-- skills UPDATE 시 updated_at 자동 갱신
CREATE TRIGGER set_skills_updated_at
  BEFORE UPDATE ON public.skills
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- auth.users 이메일 인증 시 프로필 자동 생성
CREATE TRIGGER on_auth_user_email_confirmed
  AFTER UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
