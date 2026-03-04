'use client';

import { useRouter } from 'next/navigation';
import { LayoutDashboard, Bot, HelpCircle } from 'lucide-react';
import type { CategoryItem, SidebarTab } from '@/dashboard/domain/types';
import CategoryIcon from '@/features/admin/CategoryIcon';

interface DashboardSidebarProps {
  categories: CategoryItem[];
  activeTab: SidebarTab;
  onTabChange: (tab: SidebarTab) => void;
}

export default function DashboardSidebar({
  categories,
  activeTab,
  onTabChange,
}: DashboardSidebarProps) {
  const router = useRouter();

  const isDashboardActive = activeTab === 'dashboard';
  const isMyAgentsActive = activeTab === 'my-agents';

  function isCategoryActive(categoryId: string): boolean {
    return (
      typeof activeTab === 'object' &&
      activeTab.type === 'category' &&
      activeTab.categoryId === categoryId
    );
  }

  function handleDashboardClick() {
    onTabChange('dashboard');
    router.push('/dashboard');
  }

  function handleCategoryClick(cat: CategoryItem) {
    onTabChange({
      type: 'category',
      categoryId: cat.id,
      categoryName: cat.name,
    });
    router.push(`/dashboard?category=${cat.id}`);
  }

  function handleMyAgentsClick() {
    onTabChange('my-agents');
    router.push('/myagent');
  }

  return (
    <aside className="w-72 flex flex-col h-full shrink-0 text-white z-20 border-r border-white/10 bg-[rgba(0,0,127,0.9)] backdrop-blur-xl">
      <div className="p-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#FEFE01] rounded-xl flex items-center justify-center text-[#00007F] shadow-[0_0_15px_rgba(254,254,1,0.3)]">
            <LayoutDashboard size={20} />
          </div>
          <div>
            <h1 className="text-base font-bold leading-none text-white tracking-tight">
              AI SKILLS HUB
            </h1>
            <p className="text-[10px] text-[#FEFE01]/70 font-bold uppercase tracking-[0.2em] mt-1.5">
              ENTERPRISE PORTAL
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
        <div className="px-4 py-3 text-[11px] font-bold text-white/30 uppercase tracking-widest">
          Navigation
        </div>

        <button
          type="button"
          onClick={handleDashboardClick}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
            isDashboardActive
              ? 'bg-[#FEFE01] text-[#00007F] shadow-lg font-bold'
              : 'text-white/70 hover:text-[#FEFE01]'
          }`}
        >
          <LayoutDashboard size={22} />
          <span className="text-sm">대시보드</span>
        </button>

        <button
          type="button"
          onClick={handleMyAgentsClick}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
            isMyAgentsActive
              ? 'bg-[#FEFE01] text-[#00007F] shadow-lg font-bold'
              : 'text-white/70 hover:text-[#FEFE01]'
          }`}
        >
          <Bot size={22} />
          <span className="text-sm font-medium">내 에이전트</span>
        </button>

        <div className="pt-8 px-4 py-3 text-[11px] font-bold text-white/30 uppercase tracking-widest">
          Categories
        </div>

        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => handleCategoryClick(cat)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
              isCategoryActive(cat.id)
                ? 'bg-[#FEFE01] text-[#00007F] shadow-lg font-bold'
                : 'text-white/70 hover:text-[#FEFE01]'
            }`}
          >
            <CategoryIcon icon={cat.icon} size={22} />
            <span className="text-sm font-medium">{cat.name}</span>
          </button>
        ))}
      </nav>

      <div className="p-3 border-t border-white/10 bg-black/10">
        <div className="flex items-center gap-3 px-4 py-2 rounded-xl hover:bg-white/5 transition-colors cursor-pointer text-white/50 hover:text-white/80">
          <HelpCircle size={20} />
          <span className="text-sm font-medium">도움말 센터</span>
        </div>
      </div>
    </aside>
  );
}
