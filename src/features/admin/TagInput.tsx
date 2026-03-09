'use client';

import { useState, type KeyboardEvent } from 'react';

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  maxTags?: number;
  maxLength?: number;
}

export default function TagInput({ tags, onChange, maxTags = 10, maxLength = 30 }: TagInputProps) {
  const [inputValue, setInputValue] = useState('');

  const addTag = (raw: string) => {
    // '#' 제거, 공백 제거
    const normalized = raw.replace(/^#/, '').trim();
    if (!normalized) return;
    if (normalized.length > maxLength) return;
    if (tags.length >= maxTags) return;

    // 중복 방지 (대소문자 무시)
    const lower = normalized.toLowerCase();
    if (tags.some((t) => t.toLowerCase() === lower)) return;

    onChange([...tags, normalized]);
  };

  const removeTag = (index: number) => {
    onChange(tags.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      if (inputValue.trim()) {
        // 쉼표로 여러 태그 한번에 입력 지원
        const parts = inputValue.split(',');
        for (const part of parts) {
          addTag(part);
        }
        setInputValue('');
      }
    } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
      removeTag(tags.length - 1);
    }
  };

  const handleBlur = () => {
    if (inputValue.trim()) {
      const parts = inputValue.split(',');
      for (const part of parts) {
        addTag(part);
      }
      setInputValue('');
    }
  };

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-2">
        {tags.map((tag, index) => (
          <span
            key={`${tag}-${index}`}
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 text-slate-700 text-sm font-medium rounded-full"
          >
            <span>#{tag}</span>
            <button
              type="button"
              onClick={() => removeTag(index)}
              className="ml-0.5 text-slate-400 hover:text-slate-700 transition-colors text-base leading-none"
              aria-label={`${tag} 태그 삭제`}
            >
              &times;
            </button>
          </span>
        ))}
      </div>
      {tags.length < maxTags && (
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          placeholder={tags.length === 0 ? '태그 입력 후 Enter (예: 마케팅)' : '태그 추가...'}
          maxLength={maxLength}
          className="w-full bg-transparent border-b border-slate-200 focus:border-[#00007F] focus:ring-0 focus:outline-none text-sm py-2 px-1 placeholder:text-slate-300 transition-all"
        />
      )}
      <p className="text-[11px] text-slate-400 mt-1">{tags.length}/{maxTags}개</p>
    </div>
  );
}
