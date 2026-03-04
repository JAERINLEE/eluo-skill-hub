'use server';

import { createClient } from '@/shared/infrastructure/supabase/server';
import { revalidatePath } from 'next/cache';
import { SupabaseAdminRepository } from '@/admin/infrastructure/supabase-admin-repository';
import { UpdateMemberRoleUseCase } from '@/admin/application/update-member-role-use-case';

export interface UpdateMemberRoleState {
  success: boolean;
  error?: string;
}

export async function updateMemberRole(
  memberId: string,
  roleId: string
): Promise<UpdateMemberRoleState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: '인증되지 않은 사용자입니다' };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('roles(name)')
    .eq('id', user.id)
    .single();

  const rolesRaw = profile?.roles;
  const rolesTyped = rolesRaw as { name: string } | { name: string }[] | null | undefined;
  const roleName = !rolesTyped
    ? 'user'
    : Array.isArray(rolesTyped)
      ? (rolesTyped[0]?.name ?? 'user')
      : rolesTyped.name;

  if (roleName !== 'admin') {
    return { success: false, error: '관리자 권한이 필요합니다' };
  }

  try {
    const repository = new SupabaseAdminRepository();
    const useCase = new UpdateMemberRoleUseCase(repository);
    await useCase.execute({ currentUserId: user.id, memberId, roleId });
    revalidatePath('/admin/members');
    revalidatePath('/admin');
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : '역할 변경에 실패했습니다';
    return { success: false, error: message };
  }
}
