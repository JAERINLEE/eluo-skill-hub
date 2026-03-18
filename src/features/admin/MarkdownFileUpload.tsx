'use client';

import { useState, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import MarkdownPreview from './MarkdownPreview';

interface MarkdownFileUploadProps {
  file: File | undefined;
  onFileChange: (file: File | undefined) => void;
  existingFileName?: string;
  existingContent?: string;
  onExistingRemoved?: () => void;
}

const MAX_FILE_SIZE = 52428800; // 50MB

export default function MarkdownFileUpload({ file, onFileChange, existingFileName, existingContent, onExistingRemoved }: MarkdownFileUploadProps) {
  const [markdownContent, setMarkdownContent] = useState(existingContent ?? '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [existingRemoved, setExistingRemoved] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const hasExisting = !!existingFileName && !existingRemoved;

  const readFile = (f: File) => {
    setIsLoading(true);
    setError(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (text.length === 0) {
        setError('빈 파일입니다. 내용이 있는 .md 파일을 업로드해주세요.');
      }
      setMarkdownContent(text);
      setIsLoading(false);
    };
    reader.onerror = () => {
      setError('파일을 읽는 중 오류가 발생했습니다.');
      setIsLoading(false);
    };
    reader.readAsText(f, 'utf-8');
  };

  const processFile = useCallback((selected: File) => {
    if (!selected.name.endsWith('.md')) {
      setError('.md 파일만 업로드 가능합니다.');
      setMarkdownContent('');
      onFileChange(undefined);
      return;
    }

    if (selected.size > MAX_FILE_SIZE) {
      toast.error(`"${selected.name}" 파일 용량이 50MB를 초과하여 업로드할 수 없습니다.`);
      setError('파일 용량이 50MB를 초과하여 업로드할 수 없습니다.');
      setMarkdownContent('');
      onFileChange(undefined);
      return;
    }

    if (selected.size === 0) {
      setError('빈 파일입니다. 내용이 있는 .md 파일을 업로드해주세요.');
      onFileChange(selected);
      setMarkdownContent('');
      return;
    }

    setError(null);
    onFileChange(selected);
    readFile(selected);
  }, [onFileChange]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    processFile(selected);
  };

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files[0];
    if (!droppedFile) return;
    processFile(droppedFile);
  }, [processFile]);

  const handleRemove = () => {
    onFileChange(undefined);
    setMarkdownContent('');
    setError(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const handleRemoveExisting = () => {
    setExistingRemoved(true);
    setMarkdownContent('');
    onExistingRemoved?.();
  };

  return (
    <div className="space-y-3">
      {hasExisting && !file ? (
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <span className="px-3 py-1.5 bg-slate-100 rounded-lg">{existingFileName}</span>
          <button
            type="button"
            className="text-slate-400 hover:text-red-500 transition-colors"
            onClick={handleRemoveExisting}
          >
            ×
          </button>
        </div>
      ) : file ? (
        <div className="flex items-center gap-3">
          <label className="cursor-pointer">
            <span className="px-4 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 hover:border-slate-400 transition-colors">
              파일 교체
            </span>
            <input
              ref={inputRef}
              type="file"
              accept=".md"
              className="hidden"
              onChange={handleFileSelect}
            />
          </label>
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <span>{file.name}</span>
            <button
              type="button"
              className="text-slate-400 hover:text-red-500 transition-colors"
              onClick={handleRemove}
            >
              ×
            </button>
          </div>
        </div>
      ) : (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`relative flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-8 transition-colors ${
            isDragging
              ? 'border-blue-400 bg-blue-50'
              : 'border-slate-300 bg-slate-50 hover:border-slate-400'
          }`}
        >
          <p className="text-sm text-slate-500">
            .md 파일을 여기에 드래그하거나
          </p>
          <label className="cursor-pointer">
            <span className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-600 hover:border-slate-400 transition-colors">
              파일 선택
            </span>
            <input
              ref={inputRef}
              type="file"
              accept=".md"
              className="hidden"
              onChange={handleFileSelect}
            />
          </label>
          <p className="text-xs text-slate-400">최대 50MB</p>
        </div>
      )}

      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}

      {isLoading && (
        <div className="flex items-center gap-2 text-sm text-slate-400 py-4">
          <span className="animate-spin">⏳</span>
          파일을 읽는 중...
        </div>
      )}

      {!isLoading && markdownContent && (
        <div className="max-h-[400px] overflow-y-auto border border-slate-200 rounded-xl p-4 bg-white">
          <MarkdownPreview content={markdownContent} />
        </div>
      )}
    </div>
  );
}
