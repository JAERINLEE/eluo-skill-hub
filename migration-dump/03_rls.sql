-- ============================================================
-- Eluo Skill Hub - RLS 정책 스크립트
-- 02_functions.sql 실행 후 실행하세요.
-- ============================================================

-- ============================================================
-- 1. 모든 테이블 RLS 활성화
-- ============================================================

ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skill_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skill_feedback_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skill_version_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 2. roles
-- ============================================================

CREATE POLICY "Authenticated users can view roles"
  ON public.roles FOR SELECT TO authenticated USING (true);

-- ============================================================
-- 3. permissions
-- ============================================================

CREATE POLICY "Authenticated users can view permissions"
  ON public.permissions FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage permissions"
  ON public.permissions FOR ALL TO authenticated
  USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));

-- ============================================================
-- 4. role_permissions
-- ============================================================

CREATE POLICY "Authenticated users can view role permissions"
  ON public.role_permissions FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage role permissions"
  ON public.role_permissions FOR ALL TO authenticated
  USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));

-- ============================================================
-- 5. profiles
-- ============================================================

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (is_admin(auth.uid()));

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can update user roles"
  ON public.profiles FOR UPDATE TO authenticated
  USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));

-- ============================================================
-- 6. categories
-- ============================================================

CREATE POLICY "categories_select_authenticated"
  ON public.categories FOR SELECT TO authenticated USING (true);

CREATE POLICY "categories_insert_admin"
  ON public.categories FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = (SELECT auth.uid())
      AND profiles.role_id = (SELECT roles.id FROM roles WHERE roles.name = 'admin')
  ));

CREATE POLICY "categories_update_admin"
  ON public.categories FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = (SELECT auth.uid())
      AND profiles.role_id = (SELECT roles.id FROM roles WHERE roles.name = 'admin')
  ));

CREATE POLICY "categories_delete_admin"
  ON public.categories FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = (SELECT auth.uid())
      AND profiles.role_id = (SELECT roles.id FROM roles WHERE roles.name = 'admin')
  ));

-- ============================================================
-- 7. skills
-- ============================================================

CREATE POLICY "skills_select_authenticated"
  ON public.skills FOR SELECT TO authenticated USING (true);

CREATE POLICY "admin_read_skills"
  ON public.skills FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM profiles p JOIN roles r ON p.role_id = r.id
    WHERE p.id = auth.uid() AND r.name = 'admin'
  ));

CREATE POLICY "admin_insert_skills"
  ON public.skills FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles p JOIN roles r ON p.role_id = r.id
    WHERE p.id = auth.uid() AND r.name = 'admin'
  ));

CREATE POLICY "skills_insert_admin"
  ON public.skills FOR INSERT TO authenticated
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "skills_update_admin"
  ON public.skills FOR UPDATE TO authenticated
  USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "skills_delete_admin"
  ON public.skills FOR DELETE TO authenticated
  USING (is_admin(auth.uid()));

-- ============================================================
-- 8. skill_templates
-- ============================================================

CREATE POLICY "admin_full_access"
  ON public.skill_templates FOR ALL
  USING (EXISTS (
    SELECT 1 FROM profiles p JOIN roles r ON p.role_id = r.id
    WHERE p.id = auth.uid() AND r.name = 'admin'
  ));

CREATE POLICY "authenticated_read"
  ON public.skill_templates FOR SELECT
  USING (auth.role() = 'authenticated');

-- ============================================================
-- 9. skill_feedback_logs
-- ============================================================

CREATE POLICY "feedback_select_all"
  ON public.skill_feedback_logs FOR SELECT TO authenticated USING (true);

CREATE POLICY "feedback_insert_own"
  ON public.skill_feedback_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "feedback_update_own"
  ON public.skill_feedback_logs FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "feedback_delete_own"
  ON public.skill_feedback_logs FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================
-- 10. feedback_replies
-- ============================================================

CREATE POLICY "feedback_replies_select"
  ON public.feedback_replies FOR SELECT TO authenticated USING (true);

CREATE POLICY "feedback_replies_insert"
  ON public.feedback_replies FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "feedback_replies_update_own"
  ON public.feedback_replies FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "feedback_replies_delete_own"
  ON public.feedback_replies FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================
-- 11. skill_version_history
-- ============================================================

CREATE POLICY "Authenticated users can read skill_version_history"
  ON public.skill_version_history FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can insert skill_version_history"
  ON public.skill_version_history FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
      AND profiles.role_id = 'a0000000-0000-0000-0000-000000000001'::uuid
  ));

-- ============================================================
-- 12. bookmarks
-- ============================================================

CREATE POLICY "Users can view own bookmarks"
  ON public.bookmarks FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own bookmarks"
  ON public.bookmarks FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own bookmarks"
  ON public.bookmarks FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "bookmarks_select_own"
  ON public.bookmarks FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "bookmarks_insert_own"
  ON public.bookmarks FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "bookmarks_delete_own"
  ON public.bookmarks FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- 13. event_logs
-- ============================================================

CREATE POLICY "Admins can read all events"
  ON public.event_logs FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles p JOIN roles r ON p.role_id = r.id
    WHERE p.id = auth.uid() AND r.name = 'admin'
  ));

CREATE POLICY "Users can insert own events"
  ON public.event_logs FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anon can insert events without user_id"
  ON public.event_logs FOR INSERT TO anon
  WITH CHECK (user_id IS NULL);

-- ============================================================
-- 14. Storage 버킷 생성 + Storage RLS
-- ============================================================

INSERT INTO storage.buckets (id, name, public)
VALUES
  ('skill-descriptions', 'skill-descriptions', true),
  ('skill-templates', 'skill-templates', false);

-- skill-descriptions
CREATE POLICY "skill_descriptions_select_authenticated"
  ON storage.objects FOR SELECT USING (bucket_id = 'skill-descriptions');

CREATE POLICY "skill_descriptions_insert_admin"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'skill-descriptions' AND is_admin(auth.uid()));

CREATE POLICY "skill_descriptions_update_admin"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'skill-descriptions' AND is_admin(auth.uid()))
  WITH CHECK (bucket_id = 'skill-descriptions' AND is_admin(auth.uid()));

CREATE POLICY "skill_descriptions_delete_admin"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'skill-descriptions' AND is_admin(auth.uid()));

-- skill-templates
CREATE POLICY "skill_templates_select_authenticated"
  ON storage.objects FOR SELECT USING (bucket_id = 'skill-templates');

CREATE POLICY "skill_templates_insert_admin"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'skill-templates' AND is_admin(auth.uid()));

CREATE POLICY "skill_templates_update_admin"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'skill-templates' AND is_admin(auth.uid()))
  WITH CHECK (bucket_id = 'skill-templates' AND is_admin(auth.uid()));

CREATE POLICY "skill_templates_delete_admin"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'skill-templates' AND is_admin(auth.uid()));
