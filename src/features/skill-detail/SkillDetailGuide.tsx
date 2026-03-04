'use client';

import { Lightbulb, BookOpen } from 'lucide-react';
import NotionStyleMarkdown from '@/shared/components/NotionStyleMarkdown';

interface SkillDetailGuideProps {
  markdownContent: string | null;
}

export default function SkillDetailGuide({ markdownContent }: SkillDetailGuideProps) {
  return (
    <section>
      <h3 className="text-xl font-bold mb-6 flex items-center gap-2.5 text-[#00007F]">
        <Lightbulb className="w-5 h-5 text-[#00007F]/40" />
        사용 방법
      </h3>
      {markdownContent ? (
        <NotionStyleMarkdown content={markdownContent} />
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-slate-400 bg-white/60 rounded-2xl border border-white">
          <BookOpen className="w-10 h-10 mb-3" />
          <p className="text-sm">아직 상세 가이드가 등록되지 않았습니다.</p>
        </div>
      )}
    </section>
  );
}
