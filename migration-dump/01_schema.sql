-- ============================================================
-- Eluo Skill Hub - 스키마 생성 스크립트
-- 새 Supabase 프로젝트의 SQL Editor에서 실행하세요.
-- ============================================================

-- 확장 모듈
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 시퀀스 (skill_code 자동생성용)
CREATE SEQUENCE IF NOT EXISTS public.skill_code_seq
  START WITH 10000001
  INCREMENT BY 1;

-- ============================================================
-- 1. 테이블 생성 (FK 의존성 순서)
-- ============================================================

-- roles
CREATE TABLE public.roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  CONSTRAINT roles_name_key UNIQUE (name)
);

-- permissions
CREATE TABLE public.permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT permissions_name_key UNIQUE (name)
);

-- role_permissions
CREATE TABLE public.role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT role_permissions_role_id_permission_id_key UNIQUE (role_id, permission_id)
);

-- profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  role_id UUID NOT NULL DEFAULT 'a0000000-0000-0000-0000-000000000002'::uuid REFERENCES public.roles(id),
  name TEXT
);

-- categories
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  icon TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT categories_name_key UNIQUE (name),
  CONSTRAINT categories_slug_key UNIQUE (slug)
);

-- skills
CREATE TABLE public.skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  markdown_file_path TEXT NOT NULL,
  author_id UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  category_id UUID NOT NULL REFERENCES public.categories(id),
  status TEXT NOT NULL DEFAULT 'drafted',
  description TEXT,
  markdown_content TEXT,
  icon TEXT DEFAULT '⚡',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  download_count INTEGER NOT NULL DEFAULT 0,
  version TEXT NOT NULL DEFAULT '1.0.0',
  tags TEXT[] DEFAULT '{}',
  skill_code TEXT NOT NULL,
  CONSTRAINT skills_status_check CHECK (status = ANY (ARRAY['published', 'drafted'])),
  CONSTRAINT skills_version_max_length CHECK (char_length(version) <= 20),
  CONSTRAINT skills_skill_code_unique UNIQUE (skill_code)
);

-- skill_templates
CREATE TABLE public.skill_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  skill_id UUID NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_type TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT skill_templates_file_type_check CHECK (file_type = ANY (ARRAY['.zip', '.md'])),
  CONSTRAINT skill_templates_file_size_check CHECK (file_size <= 52428800)
);

-- skill_feedback_logs
CREATE TABLE public.skill_feedback_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
  rating INTEGER,
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  is_secret BOOLEAN NOT NULL DEFAULT false,
  deleted_at TIMESTAMPTZ,
  CONSTRAINT skill_feedback_logs_rating_check CHECK (rating >= 1 AND rating <= 5)
);

-- feedback_replies
CREATE TABLE public.feedback_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feedback_id UUID NOT NULL REFERENCES public.skill_feedback_logs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT feedback_replies_content_check CHECK (char_length(content) > 0)
);

-- skill_version_history
CREATE TABLE public.skill_version_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  skill_id UUID NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
  version TEXT NOT NULL,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  note TEXT,
  CONSTRAINT skill_version_history_version_max_length CHECK (char_length(version) <= 20)
);

-- bookmarks
CREATE TABLE public.bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  skill_id UUID NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT bookmarks_user_id_skill_id_key UNIQUE (user_id, skill_id)
);

-- event_logs
CREATE TABLE public.event_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_name TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  session_id TEXT,
  properties JSONB DEFAULT '{}'::jsonb,
  page_url TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 2. 인덱스
-- ============================================================

CREATE INDEX categories_slug_idx ON public.categories USING btree (slug);
CREATE INDEX categories_sort_order_idx ON public.categories USING btree (sort_order);

CREATE INDEX idx_skills_author_id ON public.skills USING btree (author_id);
CREATE INDEX idx_skills_created_at ON public.skills USING btree (created_at DESC);
CREATE INDEX idx_skills_skill_code ON public.skills USING btree (skill_code);
CREATE INDEX idx_skills_tags ON public.skills USING gin (tags);

CREATE INDEX idx_skill_version_history_skill_id ON public.skill_version_history USING btree (skill_id);
CREATE INDEX idx_skill_version_history_changed_at ON public.skill_version_history USING btree (changed_at);

CREATE INDEX idx_event_logs_created_at ON public.event_logs USING btree (created_at);
CREATE INDEX idx_event_logs_event_created ON public.event_logs USING btree (event_name, created_at DESC);
CREATE INDEX idx_event_logs_user_created ON public.event_logs USING btree (user_id, created_at DESC);
CREATE INDEX idx_event_logs_session ON public.event_logs USING btree (session_id) WHERE (session_id IS NOT NULL);
CREATE INDEX idx_event_logs_properties_skill_id ON public.event_logs USING btree (((properties ->> 'skill_id'::text)))
  WHERE (event_name = ANY (ARRAY['skill.view', 'skill.template_download', 'skill.bookmark_add', 'skill.bookmark_remove']));
