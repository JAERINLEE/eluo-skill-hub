'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Textarea } from '@/shared/ui/textarea';
import { Switch } from '@/shared/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Button } from '@/shared/ui/button';
import type { CategoryOption, CreateSkillInput } from '@/admin/domain/types';
import { createSkill, getCategories } from '@/app/admin/skills/actions';
import TemplateFileUpload from './TemplateFileUpload';
import MarkdownFileUpload from './MarkdownFileUpload';
import CategoryIcon from './CategoryIcon';

interface SkillAddFormProps {
  categories?: CategoryOption[];
  onDirtyChange?: (isDirty: boolean) => void;
  onRequestDraftSave?: (input: CreateSkillInput) => void;
}

interface FormState {
  icon: string;
  categoryId: string;
  title: string;
  description: string;
  isPublished: boolean;
}

const INITIAL_STATE: FormState = {
  icon: '',
  categoryId: '',
  title: '',
  description: '',
  isPublished: false,
};

const EMOJI_GROUPS = [
  { label: '작업·개발', emojis: ['⚡', '🤖', '🛠️', '💻', '🔧', '🔌', '📡', '🧩'] },
  { label: '분석·데이터', emojis: ['📊', '📈', '📉', '🔍', '🧪', '💡', '📋', '🗂️'] },
  { label: '문서·글쓰기', emojis: ['📝', '📄', '✍️', '📚', '🗒️', '💬', '📣', '🌐'] },
  { label: '디자인·창작', emojis: ['🎨', '✏️', '🖼️', '🎭', '🎬', '📸', '🖌️', '✨'] },
];

function isDirtyState(state: FormState, markdownFile: File | undefined, templateFiles: File[]): boolean {
  return (
    state.icon !== '' ||
    state.categoryId !== '' ||
    state.title !== '' ||
    state.description !== '' ||
    state.isPublished !== false ||
    markdownFile !== undefined ||
    templateFiles.length > 0
  );
}

interface FieldErrors {
  title?: string;
  description?: string;
  categoryId?: string;
  markdownFile?: string;
  templateFiles?: string;
}

export default function SkillAddForm({ categories: initialCategories, onDirtyChange, onRequestDraftSave }: SkillAddFormProps) {
  const router = useRouter();
  const [categories, setCategories] = useState<CategoryOption[]>(initialCategories ?? []);
  const [categoriesLoading, setCategoriesLoading] = useState(!initialCategories);
  const [form, setForm] = useState<FormState>(INITIAL_STATE);
  const [markdownFile, setMarkdownFile] = useState<File | undefined>(undefined);
  const [templateFiles, setTemplateFiles] = useState<File[]>([]);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  const handleCloseEmojiPicker = useCallback((e: MouseEvent) => {
    if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target as Node)) {
      setShowEmojiPicker(false);
    }
  }, []);

  useEffect(() => {
    if (showEmojiPicker) {
      document.addEventListener('mousedown', handleCloseEmojiPicker);
    }
    return () => document.removeEventListener('mousedown', handleCloseEmojiPicker);
  }, [showEmojiPicker, handleCloseEmojiPicker]);

  useEffect(() => {
    if (initialCategories) return;
    getCategories().then((result) => {
      if (result.success) setCategories(result.categories);
      setCategoriesLoading(false);
    });
  }, [initialCategories]);

  const notifyDirty = (newForm: FormState, md: File | undefined, tmpl: File[]) => {
    onDirtyChange?.(isDirtyState(newForm, md, tmpl));
  };

  const updateField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    const newForm = { ...form, [key]: value };
    setForm(newForm);
    notifyDirty(newForm, markdownFile, templateFiles);
    if (fieldErrors[key as keyof FieldErrors]) {
      setFieldErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  };

  const handleMarkdownFileChange = (file: File | undefined) => {
    setMarkdownFile(file);
    notifyDirty(form, file, templateFiles);
  };

  const handleTemplateFilesChange = (files: File[]) => {
    setTemplateFiles(files);
    notifyDirty(form, markdownFile, files);
  };

  const buildInput = (overridePublished?: boolean): CreateSkillInput => ({
    icon: form.icon,
    categoryId: form.categoryId,
    title: form.title,
    description: form.description,
    isPublished: overridePublished ?? form.isPublished,
    markdownFile,
    templateFiles: templateFiles.length > 0 ? templateFiles : undefined,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('icon', form.icon);
      formData.append('categoryId', form.categoryId);
      formData.append('title', form.title);
      formData.append('description', form.description);
      formData.append('isPublished', String(form.isPublished));
      if (markdownFile) formData.append('markdownFile', markdownFile);
      for (const f of templateFiles) formData.append('templateFiles', f);

      const result = await createSkill(formData);
      if (result.success) {
        toast.success('스킬이 저장되었습니다');
        router.back();
        router.refresh();
      } else {
        if (result.fieldErrors) {
          setFieldErrors(result.fieldErrors as FieldErrors);
        } else {
          toast.error(result.error);
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // 외부에서 임시저장 요청 시 호출
  const handleDraftSaveRequest = () => {
    onRequestDraftSave?.(buildInput(false));
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col md:flex-row max-h-[92vh]">
      {/* 좌측 패널 — 아이콘 + 제목 + 상세 설명 */}
      <div className="flex-1 overflow-y-auto p-10 md:p-14 scrollbar-hide">
        {/* 아이콘 + 제목 */}
        <div className="mb-10 flex items-start gap-8">
          <div className="relative flex-shrink-0" ref={emojiPickerRef}>
            <button
              type="button"
              className="group size-28 bg-[#F0F0F0] rounded-3xl flex flex-col items-center justify-center border-2 border-dashed border-slate-300 hover:border-[#00007F] hover:bg-white transition-all overflow-hidden"
              onClick={() => setShowEmojiPicker((v) => !v)}
              title="이모지 선택"
            >
              {form.icon ? (
                <span className="text-5xl">{form.icon}</span>
              ) : (
                <>
                  <span className="text-4xl text-slate-400 group-hover:text-[#00007F]">+</span>
                  <span className="text-[12px] font-bold text-slate-400 mt-2 group-hover:text-[#00007F]">아이콘 선택</span>
                </>
              )}
            </button>
            {showEmojiPicker && (
              <div className="absolute left-0 top-36 z-50 bg-white border border-slate-200 rounded-xl shadow-xl p-3 w-64">
                {EMOJI_GROUPS.map((group) => (
                  <div key={group.label} className="mb-2">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">{group.label}</p>
                    <div className="flex flex-wrap gap-1">
                      {group.emojis.map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          className="w-8 h-8 text-xl rounded-lg hover:bg-slate-100 flex items-center justify-center transition-colors"
                          onClick={() => {
                            updateField('icon', emoji);
                            setShowEmojiPicker(false);
                          }}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="flex-1 pt-2">
            <label className="block text-[12px] font-extrabold uppercase tracking-wider text-slate-400 mb-3 ml-1">제목</label>
            <input
              id="title"
              value={form.title}
              onChange={(e) => updateField('title', e.target.value)}
              placeholder="스킬 명칭을 입력하세요"
              maxLength={100}
              className={`w-full text-2xl font-bold bg-transparent border-b-2 border-slate-100 focus:border-[#00007F] focus:ring-0 focus:outline-none placeholder:text-slate-300 transition-all pb-2 px-1 ${fieldErrors.title ? 'border-red-400' : ''}`}
            />
            {fieldErrors.title && (
              <p className="text-xs text-red-500 mt-1">{fieldErrors.title}</p>
            )}
          </div>
        </div>

        {/* 설명 */}
        <div className="space-y-10">
          <section>
            <label className="block text-[12px] font-extrabold uppercase tracking-wider text-slate-400 mb-3">
              설명 <span className="normal-case tracking-normal font-normal">({form.description.length}/500)</span>
            </label>
            <Textarea
              id="description"
              value={form.description}
              onChange={(e) => updateField('description', e.target.value)}
              placeholder="스킬에 대한 간단한 설명을 입력해주세요"
              draggable={false}
              maxLength={500}
              rows={3}
              className={fieldErrors.description ? 'border-red-400' : ''}
            />
            {fieldErrors.description && (
              <p className="text-xs text-red-500 mt-1">{fieldErrors.description}</p>
            )}
          </section>

          <section>
            <label className="flex items-center gap-2 text-sm font-bold text-[#1a1a1a] mb-4">
              상세 설명
            </label>
            <MarkdownFileUpload
              file={markdownFile}
              onFileChange={handleMarkdownFileChange}
            />
          </section>
        </div>
      </div>

      {/* 우측 사이드바 */}
      <div className="w-full md:w-96 bg-[#F0F0F0]/50 border-t md:border-t-0 md:border-l border-slate-200/50 p-10 flex flex-col gap-8 backdrop-blur-md">
        {/* 카테고리 */}
        <section>
          <label className="block text-[12px] font-extrabold uppercase tracking-[0.2em] text-slate-400 mb-5">카테고리</label>
          <Select value={form.categoryId} onValueChange={(v) => updateField('categoryId', v)} disabled={categoriesLoading}>
            <SelectTrigger id="categoryId" className={`w-full bg-white border border-slate-200 rounded-xl py-3.5 px-5 text-sm font-bold ${fieldErrors.categoryId ? 'border-red-400' : ''}`}>
              <SelectValue placeholder={categoriesLoading ? '로딩 중...' : '카테고리 선택'} />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  <span className="flex items-center gap-2">
                    <CategoryIcon icon={cat.icon} size={14} />
                    {cat.name}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {fieldErrors.categoryId && (
            <p className="text-xs text-red-500 mt-1">{fieldErrors.categoryId}</p>
          )}
        </section>

        {/* 템플릿 파일 업로드 */}
        <section>
          <label className="block text-[12px] font-extrabold uppercase tracking-[0.2em] text-slate-400 mb-5">템플릿 파일 업로드</label>
          <TemplateFileUpload
            files={templateFiles}
            onChange={handleTemplateFilesChange}
            error={fieldErrors.templateFiles}
          />
        </section>

        {/* 공개 여부 */}
        <section>
          <label className="block text-[12px] font-extrabold uppercase tracking-[0.2em] text-slate-400 mb-5">공개 여부</label>
          <div className="flex items-center justify-between bg-white rounded-xl p-4 border border-slate-100">
            <div>
              <p className="text-sm font-bold text-[#1a1a1a]">
                {form.isPublished ? '즉시 공개됩니다' : '초안으로 저장됩니다'}
              </p>
            </div>
            <Switch
              checked={form.isPublished}
              onCheckedChange={(v) => updateField('isPublished', v)}
              aria-label="공개 여부"
            />
          </div>
        </section>

        {/* 버튼 */}
        <div className="mt-auto pt-6 space-y-4">
          <Button
            type="submit"
            className="w-full flex items-center justify-center gap-3 bg-[#00007F] hover:brightness-120 text-white font-bold p-6 rounded-2xl shadow-lg shadow-[#00007F]/20 active:scale-[0.98] transition-all"
            disabled={isSubmitting}
          >
            <span className="text-base tracking-wide">{isSubmitting ? '저장 중...' : '스킬 저장하기'}</span>
          </Button>
          <button
            type="button"
            className="w-full py-4 text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors"
            onClick={handleDraftSaveRequest}
            disabled={isSubmitting}
          >
            임시저장
          </button>
        </div>

        {/* 보안 가이드 */}
        <div className="p-6 bg-white/60 rounded-2xl border border-white shadow-sm">
          <h5 className="text-[10px] font-extrabold text-[#00007F] uppercase tracking-wider mb-3 flex items-center gap-2">
            보안 가이드
          </h5>
          <p className="text-[12px] text-slate-500 leading-relaxed">
            등록된 모든 스킬은 사내 보안 가이드를 준수해야 하며, 위반 시 삭제될 수 있습니다.
          </p>
        </div>
      </div>
    </form>
  );
}
