'use client';

import { useState, useRef } from 'react';
import MarkdownPreview from './MarkdownPreview';

interface MarkdownFileUploadProps {
  file: File | undefined;
  onFileChange: (file: File | undefined) => void;
}

const MAX_FILE_SIZE = 1048576; // 1MB

export default function MarkdownFileUpload({ file, onFileChange }: MarkdownFileUploadProps) {
  const [markdownContent, setMarkdownContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (!selected.name.endsWith('.md')) {
      setError('.md 파일만 업로드 가능합니다.');
      setMarkdownContent('');
      onFileChange(undefined);
      return;
    }

    if (selected.size > MAX_FILE_SIZE) {
      setError('파일 크기는 1MB 이하여야 합니다.');
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
  };

  const handleRemove = () => {
    onFileChange(undefined);
    setMarkdownContent('');
    setError(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <label className="cursor-pointer">
          <span className="px-4 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 hover:border-slate-400 transition-colors">
            {file ? '파일 교체' : '파일 선택'}
          </span>
          <input
            ref={inputRef}
            type="file"
            accept=".md"
            className="hidden"
            onChange={handleFileSelect}
          />
        </label>
        {file && (
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
        )}
      </div>

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
