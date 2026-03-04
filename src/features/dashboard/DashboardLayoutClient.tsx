'use client';

import { useCallback } from 'react';
import { useSearchParams, usePathname } from 'next/navigation';
import type { UserProfile, CategoryItem, SidebarTab } from '@/dashboard/domain/types';
import DashboardSidebar from './DashboardSidebar';
import DashboardHeader from './DashboardHeader';

interface DashboardLayoutClientProps {
  userProfile: UserProfile;
  categories: CategoryItem[];
  children: React.ReactNode;
}

export default function DashboardLayoutClient({
  userProfile,
  categories,
  children,
}: DashboardLayoutClientProps) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const categoryId = searchParams.get('category');

  const activeTab: SidebarTab = (() => {
    if (pathname === '/myagent') return 'my-agents';
    if (categoryId) {
      const cat = categories.find((c) => c.id === categoryId);
      if (cat) {
        return { type: 'category' as const, categoryId: cat.id, categoryName: cat.name };
      }
    }
    return 'dashboard';
  })();

  const handleTabChange = useCallback((_tab: SidebarTab) => {
    // Navigation is handled by router.push in DashboardSidebar
  }, []);

  const breadcrumb =
    activeTab === 'dashboard'
      ? 'DASHBOARD'
      : activeTab === 'my-agents'
        ? '내 에이전트'
        : activeTab.categoryName;

  return (
    <div className="flex h-screen overflow-hidden">
      <DashboardSidebar
        categories={categories}
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />
      <main className="flex-1 flex flex-col min-w-0 bg-[#F0F0F0] overflow-hidden relative">
        <DashboardHeader breadcrumb={breadcrumb} userProfile={userProfile} />
        <div className="flex-1 overflow-y-auto p-10" style={{ scrollbarWidth: 'none' }}>
          {children}
        </div>
      </main>
    </div>
  );
}
