import { redirect } from 'next/navigation';
import { createClient } from '@/shared/infrastructure/supabase/server';
import { SupabaseDashboardRepository } from '@/dashboard/infrastructure/supabase-dashboard-repository';
import { GetCategoriesUseCase } from '@/dashboard/application/get-categories-use-case';
import type { UserProfile, CategoryItem } from '@/dashboard/domain/types';
import DashboardLayoutClient from '@/features/dashboard/DashboardLayoutClient';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/signin');
  }

  const displayName =
    (user.user_metadata?.display_name as string | undefined) ?? user.email ?? '';

  const userProfile: UserProfile = {
    email: user.email ?? '',
    displayName,
  };

  const repository = new SupabaseDashboardRepository();
  const getCategoriesUseCase = new GetCategoriesUseCase(repository);
  const categories: CategoryItem[] = await getCategoriesUseCase.execute();

  return (
    <DashboardLayoutClient userProfile={userProfile} categories={categories}>
      {children}
    </DashboardLayoutClient>
  );
}
