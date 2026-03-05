'use server';

import { requireAdmin } from '@/shared/infrastructure/supabase/auth';
import { SupabaseAdminRepository } from '@/admin/infrastructure/supabase-admin-repository';
import { CreateSkillUseCase } from '@/admin/application/create-skill-use-case';
import { DeleteSkillUseCase } from '@/admin/application/delete-skill-use-case';
import { GetSkillByIdUseCase } from '@/admin/application/get-skill-by-id-use-case';
import { UpdateSkillUseCase } from '@/admin/application/update-skill-use-case';
import type { CategoryOption, CreateSkillResult, DeleteSkillResult, GetSkillResult, UpdateSkillResult } from '@/admin/domain/types';
import { revalidatePath } from 'next/cache';

export async function createSkill(formData: FormData): Promise<CreateSkillResult> {
  try {
    await requireAdmin();
  } catch {
    return { success: false, error: '권한이 없습니다' };
  }

  const icon = (formData.get('icon') as string | null) ?? '';
  const categoryId = (formData.get('categoryId') as string | null) ?? '';
  const title = (formData.get('title') as string | null) ?? '';
  const description = (formData.get('description') as string | null) ?? '';
  const isPublished = formData.get('isPublished') === 'true';
  const markdownFileRaw = formData.get('markdownFile');
  const markdownFile = markdownFileRaw instanceof File && markdownFileRaw.size > 0 ? markdownFileRaw : undefined;

  // 유효성 검사
  const fieldErrors: Record<string, string> = {};
  if (!title.trim() || title.length > 100) {
    fieldErrors.title = title.trim() ? '제목은 100자 이하여야 합니다' : '제목을 입력해주세요';
  }
  if (!description.trim() || description.length > 500) {
    fieldErrors.description = description.trim() ? '설명은 500자 이하여야 합니다' : '설명을 입력해주세요';
  }
  if (!categoryId) {
    fieldErrors.categoryId = '카테고리를 선택해주세요';
  }

  if (markdownFile) {
    if (!markdownFile.name.endsWith('.md')) {
      fieldErrors.markdownFile = '.md 파일만 업로드 가능합니다';
    } else if (markdownFile.size > 1048576) {
      fieldErrors.markdownFile = '파일 크기는 1MB 이하여야 합니다';
    }
  }

  // 템플릿 파일 처리
  const templateFiles: File[] = [];
  const templateFileEntries = formData.getAll('templateFiles');
  for (const entry of templateFileEntries) {
    if (!(entry instanceof File) || entry.size === 0) continue;
    if (!entry.name.endsWith('.zip') && !entry.name.endsWith('.md')) {
      fieldErrors.templateFiles = '.zip 또는 .md 파일만 업로드 가능합니다';
      break;
    }
    if (entry.size > 204800) {
      fieldErrors.templateFiles = '템플릿 파일 크기는 200KB 이하여야 합니다';
      break;
    }
    templateFiles.push(entry);
  }
  if (templateFiles.length > 5) {
    fieldErrors.templateFiles = '템플릿 파일은 최대 5개까지 업로드 가능합니다';
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { success: false, error: '입력값을 확인해주세요', fieldErrors };
  }

  const repository = new SupabaseAdminRepository();
  const useCase = new CreateSkillUseCase(repository);

  const result = await useCase.execute({
    icon,
    categoryId,
    title,
    description,
    isPublished,
    markdownFile,
    templateFiles: templateFiles.length > 0 ? templateFiles : undefined,
  });

  if (result.success) {
    revalidatePath('/admin/skills');
    revalidatePath('/admin');
  }

  return result;
}

export async function getSkillById(id: string): Promise<GetSkillResult> {
  try {
    await requireAdmin();
  } catch {
    return { success: false, error: '관리자 권한이 필요합니다.' };
  }

  try {
    const repository = new SupabaseAdminRepository();
    const useCase = new GetSkillByIdUseCase(repository);
    return useCase.execute(id);
  } catch {
    return { success: false, error: '스킬 조회 중 오류가 발생했습니다.' };
  }
}

export async function updateSkill(formData: FormData): Promise<UpdateSkillResult> {
  try {
    await requireAdmin();
  } catch {
    return { success: false, error: '관리자 권한이 필요합니다.' };
  }

  const skillId = (formData.get('skillId') as string | null) ?? '';
  const icon = (formData.get('icon') as string | null) ?? '';
  const categoryId = (formData.get('categoryId') as string | null) ?? '';
  const title = (formData.get('title') as string | null) ?? '';
  const description = (formData.get('description') as string | null) ?? '';
  const isPublished = formData.get('isPublished') === 'true';
  const removeMarkdown = formData.get('removeMarkdown') === 'true';
  const markdownFileRaw = formData.get('markdownFile');
  const markdownFile = markdownFileRaw instanceof File && markdownFileRaw.size > 0 ? markdownFileRaw : undefined;
  const removedTemplateIdsRaw = (formData.get('removedTemplateIds') as string | null) ?? '[]';

  let removedTemplateIds: string[] = [];
  try {
    removedTemplateIds = JSON.parse(removedTemplateIdsRaw) as string[];
  } catch {
    removedTemplateIds = [];
  }

  if (!skillId) {
    return { success: false, error: '스킬 ID가 필요합니다.' };
  }

  // 유효성 검사 (createSkill과 동일)
  const fieldErrors: Record<string, string> = {};
  if (!title.trim() || title.length > 100) {
    fieldErrors.title = title.trim() ? '제목은 100자 이하여야 합니다' : '제목을 입력해주세요';
  }
  if (!description.trim() || description.length > 500) {
    fieldErrors.description = description.trim() ? '설명은 500자 이하여야 합니다' : '설명을 입력해주세요';
  }
  if (!categoryId) {
    fieldErrors.categoryId = '카테고리를 선택해주세요';
  }

  if (markdownFile) {
    if (!markdownFile.name.endsWith('.md')) {
      fieldErrors.markdownFile = '.md 파일만 업로드 가능합니다';
    } else if (markdownFile.size > 1048576) {
      fieldErrors.markdownFile = '파일 크기는 1MB 이하여야 합니다';
    }
  }

  const templateFiles: File[] = [];
  const templateFileEntries = formData.getAll('templateFiles');
  for (const entry of templateFileEntries) {
    if (!(entry instanceof File) || entry.size === 0) continue;
    if (!entry.name.endsWith('.zip') && !entry.name.endsWith('.md')) {
      fieldErrors.templateFiles = '.zip 또는 .md 파일만 업로드 가능합니다';
      break;
    }
    if (entry.size > 204800) {
      fieldErrors.templateFiles = '템플릿 파일 크기는 200KB 이하여야 합니다';
      break;
    }
    templateFiles.push(entry);
  }
  if (templateFiles.length > 5) {
    fieldErrors.templateFiles = '템플릿 파일은 최대 5개까지 업로드 가능합니다';
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { success: false, error: '입력값을 확인해주세요', fieldErrors };
  }

  const repository = new SupabaseAdminRepository();
  const useCase = new UpdateSkillUseCase(repository);

  const result = await useCase.execute({
    skillId,
    icon,
    categoryId,
    title,
    description,
    isPublished,
    markdownFile,
    removeMarkdown,
    templateFiles: templateFiles.length > 0 ? templateFiles : undefined,
    removedTemplateIds,
  });

  if (result.success) {
    revalidatePath('/admin/skills');
    revalidatePath('/admin');
  }

  return result;
}

export async function deleteSkill(skillId: string): Promise<DeleteSkillResult> {
  try {
    await requireAdmin();
  } catch {
    return { success: false, error: '권한이 없습니다' };
  }

  if (!skillId) {
    return { success: false, error: '스킬 ID가 필요합니다' };
  }

  try {
    const repository = new SupabaseAdminRepository();
    const useCase = new DeleteSkillUseCase(repository);
    const result = await useCase.execute(skillId);

    if (result.success) {
      revalidatePath('/admin/skills');
      revalidatePath('/admin');
      }

    return result;
  } catch {
    return { success: false, error: '스킬 삭제 중 오류가 발생했습니다' };
  }
}

export async function getCategories(): Promise<{ success: true; categories: CategoryOption[] } | { success: false; error: string }> {
  try {
    const repository = new SupabaseAdminRepository();
    const categories = await repository.getCategories();
    return { success: true, categories };
  } catch {
    return { success: false, error: '카테고리를 불러오는데 실패했습니다' };
  }
}
