import { createClient } from '@/shared/infrastructure/supabase/server';
import { uploadFile, deleteFile, sanitizeStoragePath } from '@/shared/infrastructure/supabase/storage';
import type {
  AdminRepository,
  CategoryOption,
  CreateFeedbackReplyInput,
  CreateFeedbackReplyResult,
  CreateSkillInput,
  CreateSkillResult,
  DashboardStats,
  DeleteFeedbackReplyResult,
  DeleteSkillResult,
  FeedbackReplyRow,
  FeedbackRow,
  GetSkillResult,
  MemberRow,
  Permission,
  PaginatedResult,
  RecentMember,
  RecentSkill,
  Role,
  SkillRow,
  SkillStatusCounts,
  SkillStatusFilter,
  SkillTemplateRow,
  UpdateFeedbackReplyResult,
  UpdateSkillInput,
  UpdateSkillResult,
  VersionHistoryEntry,
} from '@/admin/domain/types';

type JoinedName = { name: string } | { name: string }[] | null;

function extractName(joined: JoinedName): string {
  if (!joined) return '';
  if (Array.isArray(joined)) return joined[0]?.name ?? '';
  return joined.name;
}

type JoinedId = { id: string } | { id: string }[] | null;

function extractId(joined: JoinedId): string {
  if (!joined) return '';
  if (Array.isArray(joined)) return joined[0]?.id ?? '';
  return joined.id;
}

type JoinedEmail = { email: string } | { email: string }[] | null;

function extractEmail(joined: JoinedEmail): string {
  if (!joined) return '';
  if (Array.isArray(joined)) return joined[0]?.email ?? '';
  return joined.email;
}

type JoinedTitle = { title: string } | { title: string }[] | null;

function extractTitle(joined: JoinedTitle): string {
  if (!joined) return '';
  if (Array.isArray(joined)) return joined[0]?.title ?? '';
  return joined.title;
}

type JoinedCategory = { name: string; icon: string } | { name: string; icon: string }[] | null;

function extractCategoryName(joined: JoinedCategory): string {
  if (!joined) return '';
  if (Array.isArray(joined)) return joined[0]?.name ?? '';
  return joined.name;
}

function extractCategoryIcon(joined: JoinedCategory): string {
  if (!joined) return '';
  if (Array.isArray(joined)) return joined[0]?.icon ?? '';
  return joined.icon;
}


type ProfileRow = {
  id: unknown;
  email: unknown;
  name: unknown;
  created_at: unknown;
  roles: unknown;
};

function mapToMemberRow(row: ProfileRow): MemberRow {
  const roles = row.roles as { id: string; name: string } | { id: string; name: string }[] | null;
  return {
    id: row.id as string,
    email: row.email as string,
    name: (row.name as string | null) ?? null,
    roleName: extractName(roles as JoinedName),
    roleId: extractId(roles as JoinedId),
    createdAt: row.created_at as string,
    status: 'active' as const,
  };
}

export class SupabaseAdminRepository implements AdminRepository {
  async getDashboardStats(): Promise<DashboardStats> {
    const supabase = await createClient();

    const [membersResult, skillsResult, feedbacksResult] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('skills').select('*', { count: 'exact', head: true }),
      supabase.from('skill_feedback_logs').select('*', { count: 'exact', head: true }),
    ]);

    return {
      totalMembers: membersResult.count ?? 0,
      totalSkills: skillsResult.count ?? 0,
      totalFeedbacks: feedbacksResult.count ?? 0,
    };
  }

  async getRecentSkills(limit: number): Promise<RecentSkill[]> {
    const supabase = await createClient();

    const { data } = await supabase
      .from('skills')
      .select('id, skill_code, title, description, created_at, categories(name)')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (!data) return [];

    return data.map((row) => ({
      id: row.id as string,
      skillCode: row.skill_code as string,
      title: row.title as string,
      description: (row.description as string | null) ?? null,
      categoryName: extractName(row.categories as JoinedName),
      createdAt: row.created_at as string,
    }));
  }

  async getRecentMembers(limit: number): Promise<RecentMember[]> {
    const supabase = await createClient();

    const { data } = await supabase
      .from('profiles')
      .select('id, email, name, created_at, roles(name)')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (!data) return [];

    return data.map((row) => ({
      id: row.id as string,
      email: row.email as string,
      name: (row.name as string | null) ?? null,
      roleName: extractName(row.roles as JoinedName),
      createdAt: row.created_at as string,
    }));
  }

  async getMembers(page: number, pageSize: number, search?: string, currentUserId?: string): Promise<PaginatedResult<MemberRow>> {
    const supabase = await createClient();
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from('profiles')
      .select('id, email, name, created_at, roles(id, name)', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
    }
    if (currentUserId) {
      query = query.neq('id', currentUserId);
    }

    const { data, count } = await query.range(from, to);

    const totalCount = count ?? 0;
    const rows: MemberRow[] = (data ?? []).map((row) => mapToMemberRow(row as ProfileRow));

    return {
      data: rows,
      totalCount,
      page,
      pageSize,
      totalPages: Math.ceil(totalCount / pageSize),
    };
  }

  async getMemberById(id: string): Promise<MemberRow | null> {
    const supabase = await createClient();

    const { data } = await supabase
      .from('profiles')
      .select('id, email, name, created_at, roles(id, name)')
      .eq('id', id)
      .single();

    if (!data) return null;
    return mapToMemberRow(data as ProfileRow);
  }

  async getSkills(page: number, pageSize: number, search?: string, status?: SkillStatusFilter, categoryId?: string): Promise<PaginatedResult<SkillRow>> {
    const supabase = await createClient();
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from('skills')
      .select('id, skill_code, title, description, version, status, created_at, updated_at, tags, categories(name, icon)', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%,skill_code.ilike.%${search}%`);
    }
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }
    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }

    const { data, count } = await query.range(from, to);

    const totalCount = count ?? 0;
    const rows: SkillRow[] = (data ?? []).map((row) => ({
      id: row.id as string,
      skillCode: row.skill_code as string,
      title: row.title as string,
      description: (row.description as string | null) ?? null,
      categoryName: extractCategoryName(row.categories as JoinedCategory),
      categoryIcon: extractCategoryIcon(row.categories as JoinedCategory),
      status: ((row.status as string) === 'drafted' ? 'drafted' : 'published') as 'published' | 'drafted',
      version: (row.version as string) ?? '1.0.0',
      tags: (row.tags as string[] | null) ?? [],
      createdAt: row.created_at as string,
      updatedAt: row.updated_at as string,
    }));

    return {
      data: rows,
      totalCount,
      page,
      pageSize,
      totalPages: Math.ceil(totalCount / pageSize),
    };
  }

  async getSkillStatusCounts(): Promise<SkillStatusCounts> {
    const supabase = await createClient();

    // 두 번의 count-only HEAD 쿼리를 병렬로 실행 — 행 데이터 전송 없음
    const [publishedResult, draftedResult] = await Promise.all([
      supabase
        .from('skills')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'published'),
      supabase
        .from('skills')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'drafted'),
    ]);

    return {
      published: publishedResult.count ?? 0,
      drafted: draftedResult.count ?? 0,
    };
  }

  async getFeedbacks(page: number, pageSize: number): Promise<PaginatedResult<FeedbackRow>> {
    const supabase = await createClient();
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, count } = await supabase
      .from('skill_feedback_logs')
      .select(
        'id, comment, is_secret, created_at, profiles!skill_feedback_logs_user_id_profiles_fkey(email), skills(title)',
        { count: 'exact' }
      )
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .range(from, to);

    const totalCount = count ?? 0;
    const feedbackIds = (data ?? []).map((row) => row.id as string);

    // Batch-query reply counts for the fetched feedback IDs
    let replyCountMap: Record<string, number> = {};
    if (feedbackIds.length > 0) {
      const { data: replyData } = await supabase
        .from('feedback_replies')
        .select('feedback_id')
        .in('feedback_id', feedbackIds);

      if (replyData) {
        replyCountMap = replyData.reduce<Record<string, number>>((acc, row) => {
          const fid = row.feedback_id as string;
          acc[fid] = (acc[fid] ?? 0) + 1;
          return acc;
        }, {});
      }
    }

    const rows: FeedbackRow[] = (data ?? []).map((row) => ({
      id: row.id as string,
      comment: (row.comment as string | null) ?? null,
      userName: extractEmail(row.profiles as JoinedEmail),
      skillTitle: extractTitle(row.skills as JoinedTitle),
      createdAt: row.created_at as string,
      isSecret: (row.is_secret as boolean | null) ?? false,
      replyCount: replyCountMap[row.id as string] ?? 0,
    }));

    return {
      data: rows,
      totalCount,
      page,
      pageSize,
      totalPages: Math.ceil(totalCount / pageSize),
    };
  }

  async getFeedbackReplies(feedbackId: string): Promise<FeedbackReplyRow[]> {
    const supabase = await createClient();
    const { data } = await supabase
      .from('feedback_replies')
      .select('id, feedback_id, user_id, content, created_at, profiles!feedback_replies_user_id_profiles_fkey(email)')
      .eq('feedback_id', feedbackId)
      .order('created_at', { ascending: false });

    if (!data) return [];
    return data.map((row) => ({
      id: row.id as string,
      feedbackId: row.feedback_id as string,
      userId: row.user_id as string,
      userName: extractEmail(row.profiles as JoinedEmail),
      content: row.content as string,
      createdAt: row.created_at as string,
    }));
  }

  async createFeedbackReply(userId: string, input: CreateFeedbackReplyInput): Promise<CreateFeedbackReplyResult> {
    const supabase = await createClient();
    const { error } = await supabase
      .from('feedback_replies')
      .insert({
        feedback_id: input.feedbackId,
        user_id: userId,
        content: input.content,
      });

    if (error) return { success: false, error: '댓글 등록에 실패했습니다.' };
    return { success: true };
  }

  async updateFeedbackReply(replyId: string, content: string): Promise<UpdateFeedbackReplyResult> {
    const supabase = await createClient();
    const { error } = await supabase
      .from('feedback_replies')
      .update({ content })
      .eq('id', replyId);

    if (error) return { success: false, error: '댓글 수정에 실패했습니다.' };
    return { success: true };
  }

  async deleteFeedbackReply(replyId: string): Promise<DeleteFeedbackReplyResult> {
    const supabase = await createClient();
    const { error } = await supabase
      .from('feedback_replies')
      .delete()
      .eq('id', replyId);

    if (error) return { success: false, error: '댓글 삭제에 실패했습니다.' };
    return { success: true };
  }

  // T009: getAllRoles
  async getAllRoles(): Promise<Role[]> {
    const supabase = await createClient();

    const { data } = await supabase
      .from('roles')
      .select('id, name, description')
      .order('name', { ascending: true });

    if (!data) return [];

    return data.map((row) => ({
      id: row.id as string,
      name: row.name as string,
      description: (row.description as string | null) ?? null,
    }));
  }

  // T010: updateMemberRole
  async updateMemberRole(memberId: string, roleId: string): Promise<void> {
    const supabase = await createClient();

    const { error } = await supabase
      .from('profiles')
      .update({ role_id: roleId })
      .eq('id', memberId);

    if (error) throw new Error('역할 변경에 실패했습니다');
  }

  // T011: getAdminCount
  async getAdminCount(): Promise<number> {
    const supabase = await createClient();

    const { data } = await supabase
      .from('profiles')
      .select('id, roles!inner(name)')
      .eq('roles.name', 'admin');

    return data?.length ?? 0;
  }

  // T012: getMemberRole
  async getMemberRole(memberId: string): Promise<string | null> {
    const supabase = await createClient();

    const { data } = await supabase
      .from('profiles')
      .select('roles(name)')
      .eq('id', memberId)
      .single();

    if (!data) return null;
    return extractName(data.roles as JoinedName) || null;
  }

  // T025: getPermissionsByRole
  async getPermissionsByRole(roleId: string): Promise<Permission[]> {
    const supabase = await createClient();

    const { data } = await supabase
      .from('role_permissions')
      .select('permissions(id, name, description)')
      .eq('role_id', roleId);

    if (!data) return [];

    return data.flatMap((row) => {
      const perms = row.permissions as
        | { id: string; name: string; description: string | null }
        | { id: string; name: string; description: string | null }[]
        | null;
      if (!perms) return [];
      const arr = Array.isArray(perms) ? perms : [perms];
      return arr.map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description ?? null,
      }));
    });
  }

  // T016: getCategories
  async getCategories(): Promise<CategoryOption[]> {
    const supabase = await createClient();

    const { data } = await supabase
      .from('categories')
      .select('id, name, icon')
      .order('sort_order', { ascending: true });

    if (!data) return [];

    return data.map((row) => ({
      id: row.id as string,
      name: row.name as string,
      icon: row.icon as string,
    }));
  }

  async getSkillById(id: string): Promise<GetSkillResult> {
    const supabase = await createClient();

    // skill 조회, templates 조회, 버전 이력 조회를 병렬 실행
    const [skillResult, templatesResult, versionHistoryResult] = await Promise.all([
      supabase
        .from('skills')
        .select('id, skill_code, title, description, version, category_id, status, markdown_file_path, markdown_content, created_at, tags, categories(id, name, icon)')
        .eq('id', id)
        .single(),
      supabase
        .from('skill_templates')
        .select('id, skill_id, file_name, file_path, file_size, file_type, created_at')
        .eq('skill_id', id)
        .order('created_at', { ascending: true }),
      supabase
        .from('skill_version_history')
        .select('version, changed_at, note')
        .eq('skill_id', id)
        .order('changed_at', { ascending: false }),
    ]);

    const { data: skill, error } = skillResult;
    const { data: templates } = templatesResult;

    if (error || !skill) {
      return { success: false, error: '스킬을 찾을 수 없습니다.' };
    }

    const category = skill.categories as { id: string; name: string; icon: string } | { id: string; name: string; icon: string }[] | null;
    const catObj = Array.isArray(category) ? category[0] : category;

    const templateRows: SkillTemplateRow[] = (templates ?? []).map((t) => ({
      id: t.id as string,
      skillId: t.skill_id as string,
      fileName: t.file_name as string,
      filePath: t.file_path as string,
      fileSize: t.file_size as number,
      fileType: t.file_type as string,
      createdAt: t.created_at as string,
    }));

    const versionHistory: VersionHistoryEntry[] = (versionHistoryResult.data ?? []).map((h) => ({
      version: h.version as string,
      changedAt: h.changed_at as string,
      note: (h.note as string | null) ?? null,
    }));

    return {
      success: true,
      skill: {
        id: skill.id as string,
        skillCode: skill.skill_code as string,
        title: skill.title as string,
        description: (skill.description as string) ?? '',
        categoryId: (skill.category_id as string) ?? '',
        categoryName: catObj?.name ?? '',
        categoryIcon: catObj?.icon ?? '',
        status: ((skill.status as string) === 'drafted' ? 'drafted' : 'published') as 'published' | 'drafted',
        version: (skill.version as string) ?? '1.0.0',
        tags: (skill.tags as string[] | null) ?? [],
        markdownFilePath: (skill.markdown_file_path as string) ?? '',
        markdownContent: (skill.markdown_content as string) ?? '',
        templates: templateRows,
        versionHistory,
        createdAt: skill.created_at as string,
      },
    };
  }

  async updateSkill(input: UpdateSkillInput): Promise<UpdateSkillResult> {
    const supabase = await createClient();

    const status = input.isPublished ? 'published' : 'drafted';
    const newVersion = input.version || '1.0.0';

    // auth 확인과 현재 버전 조회를 병렬 실행
    const [authResult, currentSkillResult] = await Promise.all([
      supabase.auth.getUser(),
      supabase
        .from('skills')
        .select('version, markdown_file_path')
        .eq('id', input.skillId)
        .single(),
    ]);

    if (!authResult.data.user) {
      return { success: false, error: '권한이 없습니다' };
    }

    const currentVersion = (currentSkillResult.data?.version as string) ?? '1.0.0';
    const existingMarkdownPath = (currentSkillResult.data?.markdown_file_path as string) ?? '';

    const normalizedTags = input.tags.map((t) => t.trim()).filter(Boolean);

    const updateResult = await supabase
      .from('skills')
      .update({
        category_id: input.categoryId,
        title: input.title,
        description: input.description,
        version: newVersion,
        status,
        tags: normalizedTags,
      })
      .eq('id', input.skillId);

    const { error: updateError } = updateResult;
    if (updateError) {
      return { success: false, error: '수정에 실패했습니다. 다시 시도해주세요' };
    }

    // 버전이 변경된 경우 이전 버전을 이력에 저장
    if (currentVersion !== newVersion) {
      await supabase.from('skill_version_history').insert({
        skill_id: input.skillId,
        version: currentVersion,
      });
    }

    // 마크다운 파일 처리 (existingMarkdownPath 는 이미 위에서 병렬로 조회함)
    const fileErrors: string[] = [];
    if (input.removeMarkdown) {
      if (existingMarkdownPath) {
        try {
          await deleteFile('skill-descriptions', existingMarkdownPath);
        } catch {
          // 기존 파일 삭제 실패는 무시 (이미 없을 수 있음)
        }
      }

      if (input.markdownFile) {
        // 새 마크다운 업로드
        const mdPath = sanitizeStoragePath(input.skillId, input.markdownFile.name);
        try {
          await uploadFile('skill-descriptions', mdPath, input.markdownFile);
          const arrayBuffer = await input.markdownFile.arrayBuffer();
          const content = new TextDecoder().decode(arrayBuffer);
          await supabase
            .from('skills')
            .update({ markdown_file_path: mdPath, markdown_content: content })
            .eq('id', input.skillId);
        } catch (err) {
          fileErrors.push(`마크다운 파일 업로드 실패: ${err instanceof Error ? err.message : String(err)}`);
        }
      } else {
        // 마크다운 완전 제거
        await supabase
          .from('skills')
          .update({ markdown_file_path: '', markdown_content: '' })
          .eq('id', input.skillId);
      }
    } else if (input.markdownFile) {
      // removeMarkdown이 false지만 새 파일이 있는 경우 (기존 없이 새로 추가)
      const mdPath = sanitizeStoragePath(input.skillId, input.markdownFile.name);
      try {
        await uploadFile('skill-descriptions', mdPath, input.markdownFile);
        const arrayBuffer = await input.markdownFile.arrayBuffer();
        const content = new TextDecoder().decode(arrayBuffer);
        await supabase
          .from('skills')
          .update({ markdown_file_path: mdPath, markdown_content: content })
          .eq('id', input.skillId);
      } catch (err) {
        fileErrors.push(`마크다운 파일 업로드 실패: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    // 삭제 대상 템플릿 파일 병렬 처리
    if (input.removedTemplateIds.length > 0) {
      const { data: toRemove } = await supabase
        .from('skill_templates')
        .select('id, file_path')
        .in('id', input.removedTemplateIds);

      await Promise.all(
        (toRemove ?? []).map((tmpl) =>
          deleteFile('skill-templates', tmpl.file_path as string).catch(() => {
            // 기존 파일 삭제 실패는 무시 (이미 없을 수 있음)
          }),
        ),
      );

      await supabase
        .from('skill_templates')
        .delete()
        .in('id', input.removedTemplateIds);
    }

    // 신규 템플릿 파일 병렬 업로드
    if (input.templateFiles && input.templateFiles.length > 0) {
      await Promise.all(
        input.templateFiles.map((file) => {
          const filePath = sanitizeStoragePath(input.skillId, file.name);
          const fileType = file.name.endsWith('.zip') ? '.zip' : '.md';
          return (async () => {
            await uploadFile('skill-templates', filePath, file);
            await supabase.from('skill_templates').insert({
              skill_id: input.skillId,
              file_name: file.name,
              file_path: filePath,
              file_size: file.size,
              file_type: fileType,
            });
          })().catch((err) => {
            fileErrors.push(`템플릿 파일(${file.name}) 업로드 실패: ${err instanceof Error ? err.message : String(err)}`);
          });
        }),
      );
    }

    if (fileErrors.length > 0) {
      return { success: false, error: `스킬은 수정되었으나 파일 업로드에 실패했습니다: ${fileErrors.join(', ')}` };
    }

    return { success: true, skillId: input.skillId };
  }

  // T015: createSkill
  async createSkill(input: CreateSkillInput): Promise<CreateSkillResult> {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: '권한이 없습니다' };
    }

    const status = input.isPublished ? 'published' : 'drafted';

    const normalizedTags = input.tags.map((t) => t.trim()).filter(Boolean);

    const { data: skill, error: insertError } = await supabase
      .from('skills')
      .insert({
        category_id: input.categoryId,
        title: input.title,
        description: input.description,
        version: input.version || '1.0.0',
        status,
        author_id: user.id,
        markdown_file_path: '',
        tags: normalizedTags,
      })
      .select('id')
      .single();

    if (insertError || !skill) {
      return { success: false, error: '저장에 실패했습니다. 다시 시도해주세요' };
    }

    const skillId = skill.id as string;

    // 마크다운 + 템플릿 파일 병렬 업로드
    const fileErrors: string[] = [];
    const uploadTasks: Promise<void>[] = [];

    if (input.markdownFile) {
      const mdFile = input.markdownFile;
      const mdPath = sanitizeStoragePath(skillId, mdFile.name);
      uploadTasks.push(
        (async () => {
          await uploadFile('skill-descriptions', mdPath, mdFile);
          const arrayBuffer = await mdFile.arrayBuffer();
          const content = new TextDecoder().decode(arrayBuffer);
          await supabase
            .from('skills')
            .update({ markdown_file_path: mdPath, markdown_content: content })
            .eq('id', skillId);
        })().catch((err) => {
          fileErrors.push(`마크다운 파일 업로드 실패: ${err instanceof Error ? err.message : String(err)}`);
        }),
      );
    }

    if (input.templateFiles && input.templateFiles.length > 0) {
      for (const file of input.templateFiles) {
        const filePath = sanitizeStoragePath(skillId, file.name);
        const fileType = file.name.endsWith('.zip') ? '.zip' : '.md';
        uploadTasks.push(
          (async () => {
            await uploadFile('skill-templates', filePath, file);
            await supabase.from('skill_templates').insert({
              skill_id: skillId,
              file_name: file.name,
              file_path: filePath,
              file_size: file.size,
              file_type: fileType,
            });
          })().catch((err) => {
            fileErrors.push(`템플릿 파일(${file.name}) 업로드 실패: ${err instanceof Error ? err.message : String(err)}`);
          }),
        );
      }
    }

    await Promise.all(uploadTasks);

    if (fileErrors.length > 0) {
      return { success: false, error: `스킬은 생성되었으나 파일 업로드에 실패했습니다: ${fileErrors.join(', ')}` };
    }

    return { success: true, skillId };
  }

  async deleteSkill(skillId: string): Promise<DeleteSkillResult> {
    const supabase = await createClient();

    // 스킬 존재 여부 확인 + 템플릿 파일 경로 조회를 병렬 실행
    const [skillResult, templatesResult] = await Promise.all([
      supabase
        .from('skills')
        .select('id, markdown_file_path')
        .eq('id', skillId)
        .single(),
      supabase
        .from('skill_templates')
        .select('id, file_path')
        .eq('skill_id', skillId),
    ]);

    const { data: skill, error: fetchError } = skillResult;
    const { data: templates } = templatesResult;

    if (fetchError || !skill) {
      return { success: false, error: '스킬을 찾을 수 없습니다' };
    }

    try {

      // 2. 피드백 삭제 + Storage 파일 삭제를 병렬 실행
      const markdownPath = skill.markdown_file_path as string | null;
      const cleanupTasks: Promise<void>[] = [
        // 피드백 로그 삭제
        Promise.resolve(
          supabase
            .from('skill_feedback_logs')
            .delete()
            .eq('skill_id', skillId),
        ).then(() => undefined),
        // 마크다운 파일 Storage 삭제
        ...(markdownPath
          ? [deleteFile('skill-descriptions', markdownPath).catch(() => { /* 이미 없을 수 있음 */ })]
          : []),
        // 템플릿 파일 Storage 삭제
        ...(templates ?? []).map((template) =>
          deleteFile('skill-templates', template.file_path).catch(() => { /* 이미 없을 수 있음 */ }),
        ),
      ];

      await Promise.all(cleanupTasks);

      // 3. 템플릿 DB 레코드 삭제
      if (templates && templates.length > 0) {
        await supabase
          .from('skill_templates')
          .delete()
          .eq('skill_id', skillId);
      }

      // 4. 스킬 레코드 삭제
      const { error: deleteError } = await supabase
        .from('skills')
        .delete()
        .eq('id', skillId);

      if (deleteError) {
        return { success: false, error: '스킬 삭제 중 오류가 발생했습니다' };
      }

      return { success: true };
    } catch {
      return { success: false, error: '스킬 삭제 중 오류가 발생했습니다' };
    }
  }
}
