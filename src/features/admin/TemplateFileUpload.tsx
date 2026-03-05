'use client';

import { useRef, useState } from 'react';
import { Paperclip, X } from 'lucide-react';
import type { SkillTemplateRow } from '@/admin/domain/types';

interface TemplateFileUploadProps {
  files: File[];
  onChange: (files: File[]) => void;
  error?: string;
  existingFiles?: SkillTemplateRow[];
  onExistingRemoved?: (ids: string[]) => void;
}

const MAX_COUNT = 5;
const MAX_SIZE = 204800; // 200KB

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  return `${(bytes / 1024).toFixed(1)}KB`;
}

export default function TemplateFileUpload({ files, onChange, error, existingFiles, onExistingRemoved }: TemplateFileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [removedExistingIds, setRemovedExistingIds] = useState<string[]>([]);

  const visibleExisting = (existingFiles ?? []).filter((f) => !removedExistingIds.includes(f.id));
  const totalCount = visibleExisting.length + files.length;

  const handleAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? []);
    const valid = selected.filter((f) => {
      if (!f.name.endsWith('.zip') && !f.name.endsWith('.md')) return false;
      if (f.size > MAX_SIZE) return false;
      return true;
    });
    const remainingSlots = MAX_COUNT - visibleExisting.length;
    const merged = [...files, ...valid].slice(0, remainingSlots);
    onChange(merged);
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleRemove = (index: number) => {
    onChange(files.filter((_, i) => i !== index));
  };

  const handleRemoveExisting = (id: string) => {
    const newRemovedIds = [...removedExistingIds, id];
    setRemovedExistingIds(newRemovedIds);
    onExistingRemoved?.(newRemovedIds);
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {visibleExisting.map((tmpl) => (
          <div
            key={tmpl.id}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 rounded-lg text-sm text-slate-700"
          >
            <Paperclip size={14} className="text-blue-400 shrink-0" />
            <span className="max-w-[160px] truncate">{tmpl.fileName}</span>
            <span className="text-slate-400 shrink-0">({formatSize(tmpl.fileSize)})</span>
            <button
              type="button"
              onClick={() => handleRemoveExisting(tmpl.id)}
              className="text-slate-400 hover:text-red-500 ml-1 shrink-0"
              aria-label={`${tmpl.fileName} 삭제`}
            >
              <X size={14} />
            </button>
          </div>
        ))}
        {files.map((file, i) => (
          <div
            key={`${file.name}-${i}`}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 rounded-lg text-sm text-slate-700"
          >
            <Paperclip size={14} className="text-slate-400 shrink-0" />
            <span className="max-w-[160px] truncate">{file.name}</span>
            <span className="text-slate-400 shrink-0">({formatSize(file.size)})</span>
            <button
              type="button"
              onClick={() => handleRemove(i)}
              className="text-slate-400 hover:text-red-500 ml-1 shrink-0"
              aria-label={`${file.name} 삭제`}
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>

      {totalCount < MAX_COUNT && (
        <label className="cursor-pointer inline-flex">
          <span className="px-4 py-2 rounded-lg border border-dashed border-slate-300 text-sm font-medium text-slate-500 hover:border-slate-500 hover:text-slate-700 transition-colors flex items-center gap-2">
            <Paperclip size={14} />
            파일 추가 ({totalCount}/{MAX_COUNT})
          </span>
          <input
            ref={inputRef}
            type="file"
            multiple
            accept=".zip,.md"
            className="hidden"
            onChange={handleAdd}
          />
        </label>
      )}

      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
