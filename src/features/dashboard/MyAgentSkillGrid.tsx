'use client';

import Link from 'next/link';
import { Bookmark } from 'lucide-react';
import { useBookmarkedSkills } from '@/bookmark/hooks/use-bookmark-queries';
import DashboardSkillCard from './DashboardSkillCard';

interface MyAgentSkillGridProps {
  userId: string;
}

export default function MyAgentSkillGrid({ userId }: MyAgentSkillGridProps) {
  const { data: skills } = useBookmarkedSkills(userId);

  const isEmpty = !skills || skills.length === 0;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-xl font-bold text-[#00007F]">내 에이전트</h3>
          <p className="text-sm text-slate-500 mt-1">
            북마크한 스킬 목록입니다.
          </p>
        </div>
      </div>

      {isEmpty ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <Bookmark size={48} className="mb-4" />
          <p className="text-lg font-medium">북마크한 스킬이 없습니다</p>
          <p className="text-sm mt-2">
            대시보드에서 스킬을 북마크하면 여기에 표시됩니다.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {skills.map((skill) => (
            <Link key={skill.id} href={`/skills/${skill.id}`} scroll={false}>
              <DashboardSkillCard
                skill={skill}
                isBookmarked={true}
                userId={userId}
              />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
