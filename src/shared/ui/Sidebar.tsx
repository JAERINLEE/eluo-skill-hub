"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  AutoAwesomeIcon,
  DashboardIcon,
  SmartToyIcon,
  AddIcon,
  HelpOutlineIcon,
  getCategoryIcon,
} from "@/shared/ui/icons";

interface IconComponentProps {
  className?: string;
  size?: number;
}

interface MenuItem {
  label: string;
  href: string;
  icon: React.ComponentType<IconComponentProps>;
}

interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  icon: string;
  sortOrder: number;
}

interface SidebarProps {
  categories: CategoryItem[];
}

const MAIN_MENU: MenuItem[] = [
  { label: "대시보드", href: "/", icon: DashboardIcon },
  { label: "내 에이전트", href: "/myagent", icon: SmartToyIcon },
];

function NavItem({ item, isActive }: { item: MenuItem; isActive: boolean }) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      className={
        isActive
          ? "flex items-center gap-3 px-3 py-2 rounded-lg bg-primary/10 text-primary"
          : "flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
      }
    >
      <Icon size={24} />
      <span className="text-sm font-medium">{item.label}</span>
    </Link>
  );
}

function CategoryNavItem({
  category,
  isActive,
}: {
  category: CategoryItem;
  isActive: boolean;
}) {
  const Icon = getCategoryIcon(category.icon);

  return (
    <Link
      href={`/?category=${category.slug}`}
      className={
        isActive
          ? "flex items-center gap-3 px-3 py-2 rounded-lg bg-primary/10 text-primary"
          : "flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
      }
    >
      {Icon && <Icon size={24} />}
      <span className="text-sm font-medium">{category.name}</span>
    </Link>
  );
}

export function Sidebar({ categories }: SidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeCategory = searchParams.get("category");

  return (
    <aside className="w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col h-full shrink-0">
      {/* Logo area */}
      <div className="p-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white">
            <AutoAwesomeIcon size={24} />
          </div>
          <div>
            <h1 className="text-sm font-bold leading-none">AI 스킬 허브</h1>
            <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider mt-1">
              사내 포털
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-1">
        <div className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
          메인
        </div>
        {MAIN_MENU.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/" && !activeCategory
              : pathname === item.href;

          return <NavItem key={item.href} item={item} isActive={isActive} />;
        })}

        <div className="pt-6 px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
          카테고리
        </div>
        {categories.map((category) => (
          <CategoryNavItem
            key={category.id}
            category={category}
            isActive={pathname === "/" && activeCategory === category.slug}
          />
        ))}
      </nav>

      {/* Bottom actions */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800">

        <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer">
          <HelpOutlineIcon className="text-slate-500" size={24} />
          <span className="text-sm font-medium">도움말</span>
        </div>
      </div>
    </aside>
  );
}
