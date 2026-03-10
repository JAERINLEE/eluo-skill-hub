'use client';

import { createContext, useCallback, useContext, useState } from 'react';
import { usePathname } from 'next/navigation';
import type { UserProfile, CategoryItem, SidebarTab } from '@/dashboard/domain/types';
import DashboardSidebar from './DashboardSidebar';
import DashboardHeader from './DashboardHeader';

const IsViewerContext = createContext<boolean>(false);
const IsAdminContext = createContext<boolean>(false);
const UserIdContext = createContext<string>('');

export function useIsViewer(): boolean {
  return useContext(IsViewerContext);
}

export function useIsAdmin(): boolean {
  return useContext(IsAdminContext);
}

export function useCurrentUserId(): string {
  return useContext(UserIdContext);
}

interface DashboardFilterState {
  activeTab: SidebarTab;
  searchQuery?: string;
  activeTag?: string;
}

interface DashboardFilterContextValue {
  filter: DashboardFilterState;
  setActiveTab: (tab: SidebarTab) => void;
  setSearchQuery: (query?: string) => void;
  setActiveTag: (tag?: string) => void;
}

const DashboardFilterContext = createContext<DashboardFilterContextValue | null>(null);

export function useDashboardFilter(): DashboardFilterContextValue {
  const ctx = useContext(DashboardFilterContext);
  if (!ctx) throw new Error('useDashboardFilter must be used within DashboardLayoutClient');
  return ctx;
}

interface DashboardLayoutClientProps {
  userProfile: UserProfile;
  categories: CategoryItem[];
  isViewer?: boolean;
  isAdmin?: boolean;
  userId?: string;
  initialCategoryId?: string;
  initialSearchQuery?: string;
  children: React.ReactNode;
}

export default function DashboardLayoutClient({
  userProfile,
  categories,
  isViewer = false,
  isAdmin = false,
  userId = '',
  initialCategoryId,
  initialSearchQuery,
  children,
}: DashboardLayoutClientProps) {
  const pathname = usePathname();

  const initialTab: SidebarTab = (() => {
    if (pathname === '/myagent') return 'my-agents';
    if (pathname === '/help') return 'help';
    if (initialCategoryId) {
      const cat = categories.find((c) => c.id === initialCategoryId);
      if (cat) {
        return { type: 'category' as const, categoryId: cat.id, categoryName: cat.name };
      }
    }
    return 'dashboard';
  })();

  const [filter, setFilter] = useState<DashboardFilterState>({
    activeTab: initialTab,
    searchQuery: initialSearchQuery,
  });

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = useCallback(() => {
    setSidebarOpen((prev) => !prev);
  }, []);

  const setActiveTab = useCallback((tab: SidebarTab) => {
    setFilter((prev) => ({ ...prev, activeTab: tab }));
  }, []);

  const setSearchQuery = useCallback((query?: string) => {
    setFilter((prev) => ({ ...prev, searchQuery: query }));
  }, []);

  const setActiveTag = useCallback((tag?: string) => {
    setFilter((prev) => ({ ...prev, activeTag: tag }));
  }, []);

  const breadcrumb =
    filter.activeTab === 'dashboard'
      ? '전체'
      : filter.activeTab === 'my-agents'
        ? '내 에이전트'
        : filter.activeTab === 'help'
          ? '도움말 센터'
          : filter.activeTab.categoryName;

  return (
    <IsViewerContext.Provider value={isViewer}>
      <IsAdminContext.Provider value={isAdmin}>
        <UserIdContext.Provider value={userId}>
          <DashboardFilterContext.Provider value={{ filter, setActiveTab, setSearchQuery, setActiveTag }}>
            <div className="flex h-screen overflow-hidden">
              {sidebarOpen && (
                <div
                  className="fixed inset-0 bg-black/50 z-40 md:hidden"
                  onClick={() => setSidebarOpen(false)}
                />
              )}
              <DashboardSidebar
                categories={categories}
                activeTab={filter.activeTab}
                onTabChange={setActiveTab}
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
              />
              <main className="flex-1 flex flex-col min-w-0 bg-[#F0F0F0] overflow-hidden relative">
                <DashboardHeader
                  breadcrumb={breadcrumb}
                  userProfile={userProfile}
                  onMenuToggle={toggleSidebar}
                />
                <div className="flex-1 overflow-y-auto p-4 md:p-10" style={{ scrollbarWidth: 'none' }}>
                  {children}
                </div>
              </main>
            </div>
          </DashboardFilterContext.Provider>
        </UserIdContext.Provider>
      </IsAdminContext.Provider>
    </IsViewerContext.Provider>
  );
}
