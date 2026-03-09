'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, Zap, MessageSquare, BarChart3 } from 'lucide-react';

interface AdminSidebarProps {
  userName: string;
  userRole: string;
}

const navItems = [
  { label: '대시보드', href: '/admin', icon: LayoutDashboard },
  { label: '회원 관리', href: '/admin/members', icon: Users },
  { label: '스킬 관리', href: '/admin/skills', icon: Zap },
  { label: '피드백 관리', href: '/admin/feedbacks', icon: MessageSquare },
  { label: '통계분석', href: '/admin/analytics', icon: BarChart3 },
];

export default function AdminSidebar({ userName, userRole }: AdminSidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className="w-64 flex flex-col h-full shrink-0"
      style={{
        background: 'rgba(255,255,255,0.7)',
        backdropFilter: 'blur(12px)',
        borderRight: '1px solid rgba(0,0,128,0.1)',
      }}
    >
      <div className="p-6 flex-1">
        {/* Logo */}
        <Link href="/admin" className="flex items-center gap-2 mb-8">
          <div className="size-8 bg-[#000080] rounded-lg flex items-center justify-center">
            <Zap strokeWidth={2.5} className="size-4 text-[#FEFE01] fill-[#FEFE01]" />
          </div>
          <div>
            <h1 className="text-[#000080] font-bold text-lg leading-none">Eluo Hub</h1>
            <p className="text-[10px] text-[#000080]/60 uppercase tracking-widest font-semibold">
              Admin
            </p>
          </div>
        </Link>

        {/* Navigation */}
        <nav className="space-y-1">
          {navItems.map(({ label, href, icon: Icon }) => {
            const isActive =
              href === '/admin' ? pathname === '/admin' : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium transition-colors ${isActive
                  ? 'bg-[#000080] text-white shadow-lg shadow-[#000080]/20 font-semibold'
                  : 'text-[#000080]/70 hover:bg-[#000080]/5'
                  }`}
              >
                <Icon strokeWidth={2.5} className={`size-5 ${isActive ? 'text-[#FEFE01]' : 'text-[#000080]/60'}`} />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Profile at bottom */}
      <div className="p-6 border-t border-[#000080]/10">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-full bg-[#000080]/10 flex items-center justify-center shrink-0">
            <span className="text-sm font-bold text-[#000080]">
              {userName.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <p className="text-sm font-bold text-[#000080]">{userName}</p>
            <p className="text-xs text-[#000080]/50">{userRole}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
