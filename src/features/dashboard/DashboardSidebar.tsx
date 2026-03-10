'use client';

import { useRouter, usePathname } from 'next/navigation';
import { LayoutDashboard, Bot, HelpCircle } from 'lucide-react';
import type { CategoryItem, SidebarTab } from '@/dashboard/domain/types';
import CategoryIcon from '@/features/admin/CategoryIcon';
import Image from 'next/image';
import { useTrackEvent } from '@/event-log/hooks/use-track-event';

interface DashboardSidebarProps {
  categories: CategoryItem[];
  activeTab: SidebarTab;
  onTabChange: (tab: SidebarTab) => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export default function DashboardSidebar({
  categories,
  activeTab,
  onTabChange,
  isOpen = false,
  onClose,
}: DashboardSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const trackEvent = useTrackEvent();

  const isDashboardActive = activeTab === 'dashboard';
  const isMyAgentsActive = activeTab === 'my-agents';
  const isHelpActive = activeTab === 'help';

  function isCategoryActive(categoryId: string): boolean {
    return (
      typeof activeTab === 'object' &&
      activeTab.type === 'category' &&
      activeTab.categoryId === categoryId
    );
  }

  function handleDashboardClick() {
    trackEvent('nav.sidebar_click', { tab: 'dashboard' });
    onTabChange('dashboard');
    onClose?.();
    if (pathname !== '/dashboard') {
      router.push('/dashboard');
    }
  }

  function handleCategoryClick(cat: CategoryItem) {
    trackEvent('nav.sidebar_click', { tab: `category:${cat.name}` });
    onTabChange({
      type: 'category',
      categoryId: cat.id,
      categoryName: cat.name,
    });
    onClose?.();
    if (pathname !== '/dashboard') {
      router.push('/dashboard');
    }
  }

  function handleMyAgentsClick() {
    trackEvent('nav.sidebar_click', { tab: 'my-agents' });
    onTabChange('my-agents');
    onClose?.();
    if (pathname !== '/myagent') {
      router.push('/myagent');
    }
  }

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 md:static md:z-20 w-72 flex flex-col h-full shrink-0 text-white border-r border-white/10 bg-[rgba(0,0,127,0.9)] backdrop-blur-xl transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}
    >
      <div className="p-8">
        <button
          type="button"
          onClick={handleDashboardClick}
          className="flex items-center gap-3 cursor-pointer">
          <div className="w-10 h-10 bg-[#FEFE01] rounded-xl flex items-center justify-center text-[#00007F] shadow-[0_0_15px_rgba(254,254,1,0.3)]">
            <Image
              src="/eluo-logo.svg"
              alt="ELUO logo"
              width={28}
              height={28}
              priority
            />
          </div>
          <div className="text-left">
            <h1 className="text-base font-bold leading-none text-white tracking-tight">
              ELUO HUB
            </h1>
            <p className="text-[10px] text-[#FEFE01]/70 font-bold uppercase tracking-[0.2em] mt-1.5">
              ENTERPRISE PORTAL
            </p>
          </div>
        </button>
      </div>

      <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
        <div className="px-4 py-3 text-[11px] font-bold text-white/30 uppercase tracking-widest">
          Categories
        </div>

        <button
          type="button"
          onClick={handleDashboardClick}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${isDashboardActive
            ? 'bg-[#FEFE01] text-[#00007F] shadow-lg font-bold'
            : 'text-white/70 hover:text-[#FEFE01] hover:bg-white/10 cursor-pointer'
            }`}
        >
          <LayoutDashboard size={22} />
          <span className="text-sm">전체</span>
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => handleCategoryClick(cat)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${isCategoryActive(cat.id)
              ? 'bg-[#FEFE01] text-[#00007F] shadow-lg font-bold'
              : 'text-white/70 hover:text-[#FEFE01] hover:bg-white/10 cursor-pointer'
              }`}
          >
            <CategoryIcon icon={cat.icon} size={22} />
            <span className="text-sm font-medium">{cat.name}</span>
          </button>
        ))}

        <div className="pt-8 px-4 py-3 text-[11px] font-bold text-white/30 uppercase tracking-widest">
          Navigation
        </div>

        <button
          type="button"
          onClick={handleMyAgentsClick}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${isMyAgentsActive
            ? 'bg-[#FEFE01] text-[#00007F] shadow-lg font-bold'
            : 'text-white/70 hover:text-[#FEFE01] hover:bg-white/10 cursor-pointer'
            }`}
        >
          <Bot size={22} />
          <span className="text-sm font-medium">내 에이전트</span>
        </button>
      </nav>

      <div className="p-3 border-t border-white/10 bg-black/10">
        <button
          type="button"
          onClick={() => {
            trackEvent('nav.sidebar_click', { tab: 'help' });
            onTabChange('help');
            onClose?.();
            if (pathname !== '/help') {
              router.push('/help');
            }
          }}
          className={`w-full flex items-center gap-3 px-4 py-2 rounded-xl transition-all duration-300 ${isHelpActive
            ? 'bg-[#FEFE01] text-[#00007F] shadow-lg font-bold'
            : 'text-white/50 hover:text-white/80 hover:bg-white/10 cursor-pointer'
            }`}
        >
          <HelpCircle size={20} />
          <span className="text-sm font-medium">도움말 센터</span>
        </button>
      </div>
    </aside>
  );
}
