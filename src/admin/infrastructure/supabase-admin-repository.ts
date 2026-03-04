import { createClient } from '@/shared/infrastructure/supabase/server';
import { uploadFile, deleteFile } from '@/shared/infrastructure/supabase/storage';
import type {
  AdminRepository,
  CategoryOption,
  CreateSkillInput,
  CreateSkillResult,
  DashboardStats,
  DeleteSkillResult,
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
  UpdateSkillInput,
  UpdateSkillResult,
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
      .select('id, title, description, created_at, categories(name)')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (!data) return [];

    return data.map((row) => ({
      id: row.id as string,
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
      .select('id, title, description, icon, status, created_at, updated_at, categories(name, icon)', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
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
      title: row.title as string,
      description: (row.description as string | null) ?? null,
      icon: (row.icon as string) ?? '⚡',
      categoryName: extractCategoryName(row.categories as JoinedCategory),
      categoryIcon: extractCategoryIcon(row.categories as JoinedCategory),
      status: ((row.status as string) === 'drafted' ? 'drafted' : 'published') as 'published' | 'drafted',
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

    const [publishedResult, draftedResult] = await Promise.all([
      supabase.from('skills').select('id', { count: 'exact', head: true }).eq('status', 'published'),
      supabase.from('skills').select('id', { count: 'exact', head: true }).eq('status', 'drafted'),
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
        'id, rating, comment, created_at, profiles(email), skills(title)',
        { count: 'exact' }
      )
      .order('created_at', { ascending: false })
      .range(from, to);

    const totalCount = count ?? 0;
    const rows: FeedbackRow[] = (data ?? []).map((row) => ({
      id: row.id as string,
      rating: row.rating as number,
      comment: (row.comment as string | null) ?? null,
      userName: extractEmail(row.profiles as JoinedEmail),
      skillTitle: extractTitle(row.skills as JoinedTitle),
      createdAt: row.created_at as string,
    }));

    return {
      data: rows,
      totalCount,
      page,
      pageSize,
      totalPages: Math.ceil(totalCount / pageSize),
    };
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

    const { data: skill, error } = await supabase
      .from('skills')
      .select('id, title, description, icon, category_id, status, markdown_file_path, markdown_content, created_at, categories(id, name, icon)')
      .eq('id', id)
      .single();

    if (error || !skill) {
      return { success: false, error: '스킬을 찾을 수 없습니다.' };
    }

    const { data: templates } = await supabase
      .from('skill_templates')
      .select('id, skill_id, file_name, file_path, file_size, file_type, created_at')
      .eq('skill_id', id)
      .order('created_at', { ascending: true });

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

    return {
      success: true,
      skill: {
        id: skill.id as string,
        title: skill.title as string,
        description: (skill.description as string) ?? '',
        icon: (skill.icon as string) ?? '⚡',
        categoryId: (skill.category_id as string) ?? '',
        categoryName: catObj?.name ?? '',
        categoryIcon: catObj?.icon ?? '',
        status: ((skill.status as string) === 'drafted' ? 'drafted' : 'published') as 'published' | 'drafted',
        markdownFilePath: (skill.markdown_file_path as string) ?? '',
        markdownContent: (skill.markdown_content as string) ?? '',
        templates: templateRows,
        createdAt: skill.created_at as string,
      },
    };
  }

  async updateSkill(input: UpdateSkillInput): Promise<UpdateSkillResult> {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: '권한이 없습니다' };
    }

    const icon = input.icon.trim() || '⚡';
    const status = input.isPublished ? 'published' : 'drafted';

    // 스킬 기본 정보 업데이트
    const { error: updateError } = await supabase
      .from('skills')
      .update({
        icon,
        category_id: input.categoryId,
        title: input.title,
        description: input.description,
        status,
      })
      .eq('id', input.skillId);

    if (updateError) {
      return { success: false, error: '수정에 실패했습니다. 다시 시도해주세요' };
    }

    // 마크다운 파일 처리
    const fileErrors: string[] = [];
    if (input.removeMarkdown) {
      // 기존 마크다운 삭제
      const { data: existing } = await supabase
        .from('skills')
        .select('markdown_file_path')
        .eq('id', input.skillId)
        .single();

      const existingPath = (existing?.markdown_file_path as string) ?? '';
      if (existingPath) {
        try {
          await deleteFile('skill-descriptions', existingPath);
        } catch {
          // 기존 파일 삭제 실패는 무시 (이미 없을 수 있음)
        }
      }

      if (input.markdownFile) {
        // 새 마크다운 업로드
        const mdPath = `${input.skillId}/${input.markdownFile.name}`;
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
      const mdPath = `${input.skillId}/${input.markdownFile.name}`;
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
          const filePath = `${input.skillId}/${file.name}`;
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

    const icon = input.icon.trim() || '⚡';
    const status = input.isPublished ? 'published' : 'drafted';

    const { data: skill, error: insertError } = await supabase
      .from('skills')
      .insert({
        icon,
        category_id: input.categoryId,
        title: input.title,
        description: input.description,
        status,
        author_id: user.id,
        markdown_file_path: '',
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
      const mdPath = `${skillId}/${mdFile.name}`;
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
        const filePath = `${skillId}/${file.name}`;
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

    // 스킬 존재 여부 확인
    const { data: skill, error: fetchError } = await supabase
      .from('skills')
      .select('id, markdown_file_path')
      .eq('id', skillId)
      .single();

    if (fetchError || !skill) {
      return { success: false, error: '스킬을 찾을 수 없습니다' };
    }

    try {
      // 1. 템플릿 파일 경로 조회 (병렬 삭제를 위해 먼저 조회)
      const { data: templates } = await supabase
        .from('skill_templates')
        .select('id, file_path')
        .eq('skill_id', skillId);

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
