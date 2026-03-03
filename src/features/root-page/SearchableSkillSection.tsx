'use client';

import { useMemo, useState } from 'react';
import { SearchBar } from './SearchBar';
import { SkillCardGrid } from './SkillCardGrid';
import type { SkillViewModel } from './types';

interface SearchableSkillSectionProps {
  skills: SkillViewModel[];
  initialBookmarkedIds: string[];
}

export function SearchableSkillSection({ skills, initialBookmarkedIds }: SearchableSkillSectionProps) {
  const [query, setQuery] = useState('');

  const filteredSkills = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return skills;
    return skills.filter(
      (skill) =>
        skill.name.toLowerCase().includes(q) ||
        skill.description.toLowerCase().includes(q) ||
        skill.categoryName.toLowerCase().includes(q),
    );
  }, [skills, query]);

  const title = query.trim()
    ? `"${query}" 검색 결과 (${filteredSkills.length}개)`
    : '추천 에이전트';

  return (
    <>
      <SearchBar query={query} onQueryChange={setQuery} />
      {filteredSkills.length === 0 ? (
        <div className="max-w-6xl mx-auto text-center py-16 text-slate-400">
          <p className="text-lg font-medium mb-1">검색 결과가 없습니다</p>
          <p className="text-sm">&ldquo;{query}&rdquo;에 해당하는 스킬이 없습니다.</p>
        </div>
      ) : (
        <SkillCardGrid
          skills={filteredSkills}
          initialBookmarkedIds={initialBookmarkedIds}
          title={title}
        />
      )}
    </>
  );
}
