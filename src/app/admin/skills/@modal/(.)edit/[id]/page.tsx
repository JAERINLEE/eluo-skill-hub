import { createClient } from '@/shared/infrastructure/supabase/server';
import { SupabaseAdminRepository } from '@/admin/infrastructure/supabase-admin-repository';
import { GetSkillByIdUseCase } from '@/admin/application/get-skill-by-id-use-case';
import type { CategoryOption, GetSkillResult } from '@/admin/domain/types';
import SkillEditModal from '@/features/admin/SkillEditModal';
import Link from 'next/link';

interface EditSkillModalPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditSkillModalPage({ params }: EditSkillModalPageProps) {
  const { id } = await params;

  // verifyAdmin 1회 호출로 통합 (기존: getSkillById + getCategories 각각 내부에서 호출)
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="fixed inset-0 z-50 bg-[rgba(0,0,127,0.1)] backdrop-blur-[12px] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 text-center max-w-md">
          <p className="text-lg font-bold text-slate-900 mb-2">권한이 없습니다.</p>
          <p className="text-sm text-slate-500 mb-4">관리자 로그인이 필요합니다.</p>
          <Link
            href="/admin/skills"
            className="inline-block px-6 py-2 bg-[#00007F] text-white rounded-xl text-sm font-bold hover:brightness-110 transition-all"
          >
            돌아가기
          </Link>
        </div>
      </div>
    );
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('roles(name)')
    .eq('id', user.id)
    .single();

  const roles = profile?.roles as { name: string } | { name: string }[] | null;
  const roleName = Array.isArray(roles) ? roles[0]?.name : roles?.name;

  if (roleName !== 'admin') {
    return (
      <div className="fixed inset-0 z-50 bg-[rgba(0,0,127,0.1)] backdrop-blur-[12px] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 text-center max-w-md">
          <p className="text-lg font-bold text-slate-900 mb-2">관리자 권한이 필요합니다.</p>
          <Link
            href="/admin/skills"
            className="inline-block px-6 py-2 bg-[#00007F] text-white rounded-xl text-sm font-bold hover:brightness-110 transition-all"
          >
            돌아가기
          </Link>
        </div>
      </div>
    );
  }

  // 인증 완료 후 데이터 조회 (verifyAdmin 중복 없이 직접 repository 호출)
  const repository = new SupabaseAdminRepository();
  const [skillResult, categories] = await Promise.all([
    (async (): Promise<GetSkillResult> => {
      try {
        const useCase = new GetSkillByIdUseCase(repository);
        return useCase.execute(id);
      } catch {
        return { success: false, error: '스킬 조회 중 오류가 발생했습니다.' };
      }
    })(),
    repository.getCategories().catch((): CategoryOption[] => []),
  ]);

  if (!skillResult.success) {
    return (
      <div className="fixed inset-0 z-50 bg-[rgba(0,0,127,0.1)] backdrop-blur-[12px] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 text-center max-w-md">
          <p className="text-lg font-bold text-slate-900 mb-2">스킬을 찾을 수 없습니다.</p>
          <p className="text-sm text-slate-500 mb-4">{skillResult.error}</p>
          <Link
            href="/admin/skills"
            className="inline-block px-6 py-2 bg-[#00007F] text-white rounded-xl text-sm font-bold hover:brightness-110 transition-all"
          >
            목록으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <SkillEditModal
      skillId={id}
      initialData={skillResult.skill}
      categories={categories}
    />
  );
}
