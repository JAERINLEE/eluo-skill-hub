'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Textarea } from '@/shared/ui/textarea';
import { Switch } from '@/shared/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Button } from '@/shared/ui/button';
import type { CategoryOption, CreateSkillInput, SkillDetail, UpdateSkillInput, SkillTemplateRow } from '@/admin/domain/types';
import { createSkill, updateSkill as updateSkillAction, getCategories } from '@/app/admin/skills/actions';
import TemplateFileUpload from './TemplateFileUpload';
import MarkdownFileUpload from './MarkdownFileUpload';
import CategoryIcon from './CategoryIcon';
import TagInput from './TagInput';
import VersionHistoryList from './VersionHistoryList';

interface SkillAddFormProps {
  categories?: CategoryOption[];
  onDirtyChange?: (isDirty: boolean) => void;
  onRequestDraftSave?: (input: CreateSkillInput | UpdateSkillInput) => void;
  mode?: 'add' | 'edit';
  skillId?: string;
  initialData?: SkillDetail;
}

interface FormState {
  categoryId: string;
  title: string;
  description: string;
  version: string;
  tags: string[];
  isPublished: boolean;
}

const INITIAL_STATE: FormState = {
  categoryId: '',
  title: '',
  description: '',
  version: '1.0.0',
  tags: [],
  isPublished: false,
};

function isDirtyStateAdd(state: FormState, markdownFile: File | undefined, templateFiles: File[]): boolean {
  return (
    state.categoryId !== '' ||
    state.title !== '' ||
    state.description !== '' ||
    state.version !== '1.0.0' ||
    state.tags.length > 0 ||
    state.isPublished !== false ||
    markdownFile !== undefined ||
    templateFiles.length > 0
  );
}

function isDirtyStateEdit(
  state: FormState,
  initial: FormState,
  markdownFile: File | undefined,
  templateFiles: File[],
  removeMarkdown: boolean,
  removedTemplateIds: string[],
): boolean {
  return (
    state.categoryId !== initial.categoryId ||
    state.title !== initial.title ||
    state.description !== initial.description ||
    state.version !== initial.version ||
    JSON.stringify(state.tags) !== JSON.stringify(initial.tags) ||
    state.isPublished !== initial.isPublished ||
    markdownFile !== undefined ||
    removeMarkdown ||
    templateFiles.length > 0 ||
    removedTemplateIds.length > 0
  );
}

interface FieldErrors {
  title?: string;
  description?: string;
  categoryId?: string;
  markdownFile?: string;
  templateFiles?: string;
}

export default function SkillAddForm({ categories: initialCategories, onDirtyChange, onRequestDraftSave, mode = 'add', skillId, initialData }: SkillAddFormProps) {
  const router = useRouter();
  const isEditMode = mode === 'edit';

  const editInitialState: FormState = initialData
    ? {
      categoryId: initialData.categoryId,
      title: initialData.title,
      description: initialData.description,
      version: initialData.version ?? '1.0.0',
      tags: [...(initialData.tags ?? [])],
      isPublished: initialData.status === 'published',
    }
    : INITIAL_STATE;

  const [categories, setCategories] = useState<CategoryOption[]>(initialCategories ?? []);
  const [categoriesLoading, setCategoriesLoading] = useState(!initialCategories);
  const [form, setForm] = useState<FormState>(isEditMode ? editInitialState : INITIAL_STATE);
  const [markdownFile, setMarkdownFile] = useState<File | undefined>(undefined);
  const [templateFiles, setTemplateFiles] = useState<File[]>([]);
  const [removeMarkdown, setRemoveMarkdown] = useState(false);
  const [removedTemplateIds, setRemovedTemplateIds] = useState<string[]>([]);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  useEffect(() => {
    if (initialCategories) return;
    getCategories().then((result) => {
      if (result.success) setCategories(result.categories);
      setCategoriesLoading(false);
    });
  }, [initialCategories]);

  const notifyDirty = (newForm: FormState, md: File | undefined, tmpl: File[], rmMd?: boolean, rmTmplIds?: string[]) => {
    if (isEditMode) {
      onDirtyChange?.(isDirtyStateEdit(newForm, editInitialState, md, tmpl, rmMd ?? removeMarkdown, rmTmplIds ?? removedTemplateIds));
    } else {
      onDirtyChange?.(isDirtyStateAdd(newForm, md, tmpl));
    }
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

  const handleExistingMarkdownRemoved = () => {
    setRemoveMarkdown(true);
    notifyDirty(form, markdownFile, templateFiles, true, removedTemplateIds);
  };

  const handleTemplateFilesChange = (files: File[]) => {
    setTemplateFiles(files);
    notifyDirty(form, markdownFile, files);
  };

  const handleExistingTemplateRemoved = (ids: string[]) => {
    setRemovedTemplateIds(ids);
    notifyDirty(form, markdownFile, templateFiles, removeMarkdown, ids);
  };

  const buildInput = (overridePublished?: boolean): CreateSkillInput | UpdateSkillInput => {
    if (isEditMode && skillId) {
      return {
        skillId,
        categoryId: form.categoryId,
        title: form.title,
        description: form.description,
        version: form.version,
        tags: form.tags,
        isPublished: overridePublished ?? form.isPublished,
        markdownFile,
        removeMarkdown,
        templateFiles: templateFiles.length > 0 ? templateFiles : undefined,
        removedTemplateIds,
      };
    }
    return {
      categoryId: form.categoryId,
      title: form.title,
      description: form.description,
      version: form.version,
      tags: form.tags,
      isPublished: overridePublished ?? form.isPublished,
      markdownFile,
      templateFiles: templateFiles.length > 0 ? templateFiles : undefined,
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('categoryId', form.categoryId);
      formData.append('title', form.title);
      formData.append('description', form.description);
      formData.append('version', form.version);
      formData.append('tags', JSON.stringify(form.tags));
      formData.append('isPublished', String(form.isPublished));
      if (markdownFile) formData.append('markdownFile', markdownFile);
      for (const f of templateFiles) formData.append('templateFiles', f);

      if (isEditMode && skillId) {
        formData.append('skillId', skillId);
        formData.append('removeMarkdown', String(removeMarkdown));
        formData.append('removedTemplateIds', JSON.stringify(removedTemplateIds));

        const result = await updateSkillAction(formData);
        if (result.success) {
          toast.success('스킬이 수정되었습니다');
          router.back();
          router.refresh();
        } else {
          if (result.fieldErrors) {
            setFieldErrors(result.fieldErrors as FieldErrors);
          } else {
            toast.error(result.error);
          }
        }
      } else {
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
      {/* 좌측 패널 — 제목 + 상세 설명 */}
      <div className="flex-1 overflow-y-auto p-8 scrollbar-hide">
        {/* 제목 */}
        <div className="mb-10">
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

          {/* 태그 */}
          <section>
            <label className="block text-[12px] font-extrabold uppercase tracking-wider text-slate-400 mb-3">태그</label>
            <TagInput
              tags={form.tags}
              onChange={(tags) => {
                const newForm = { ...form, tags };
                setForm(newForm);
                notifyDirty(newForm, markdownFile, templateFiles);
              }}
            />
          </section>

          <section>
            <label className="flex items-center gap-2 text-sm font-bold text-[#1a1a1a] mb-4">
              상세 설명
            </label>
            <MarkdownFileUpload
              file={markdownFile}
              onFileChange={handleMarkdownFileChange}
              existingFileName={isEditMode && !removeMarkdown && initialData?.markdownFilePath ? initialData.markdownFilePath.split('/').pop() : undefined}
              existingContent={isEditMode && !removeMarkdown ? initialData?.markdownContent : undefined}
              onExistingRemoved={handleExistingMarkdownRemoved}
            />
          </section>
        </div>
      </div>

      {/* 우측 사이드바 */}
      <div className="w-full md:w-96 bg-[#F0F0F0]/50 border-t md:border-t-0 md:border-l border-slate-200/50 p-10 flex flex-col gap-8 backdrop-blur-md overflow-y-auto scrollbar-hide">
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

        {/* 버전 + 공개 여부 */}
        <section className="flex gap-4">
          <div className="flex-1">
            <label className="block text-[12px] font-extrabold uppercase tracking-[0.2em] text-slate-400 mb-5">버전</label>
            <input
              id="version"
              value={form.version}
              onChange={(e) => updateField('version', e.target.value)}
              placeholder="1.0.0"
              maxLength={20}
              className="w-full bg-white border border-slate-200 rounded-xl py-3.5 px-5 text-sm font-bold focus:border-[#00007F] focus:ring-0 focus:outline-none transition-all"
            />
          </div>
          <div className="flex-1">
            <label className="block text-[12px] font-extrabold uppercase tracking-[0.2em] text-slate-400 mb-5">공개 여부</label>
            <div className="flex items-center justify-between bg-white rounded-xl py-3.5 px-4 border border-slate-200">
              <p className="text-xs font-bold text-[#1a1a1a]">
                {form.isPublished ? '공개' : '초안'}
              </p>
              <Switch
                checked={form.isPublished}
                onCheckedChange={(v) => updateField('isPublished', v)}
                aria-label="공개 여부"
              />
            </div>
          </div>
        </section>

        {/* 템플릿 파일 업로드 */}
        <section>
          <label className="block text-[12px] font-extrabold uppercase tracking-[0.2em] text-slate-400 mb-5">템플릿 파일 업로드</label>
          <TemplateFileUpload
            files={templateFiles}
            onChange={handleTemplateFilesChange}
            error={fieldErrors.templateFiles}
            existingFiles={isEditMode ? initialData?.templates : undefined}
            onExistingRemoved={handleExistingTemplateRemoved}
          />
        </section>

        {/* 버전 이력 (수정 모드) */}
        {isEditMode && initialData?.versionHistory && (
          <section>
            <VersionHistoryList history={initialData.versionHistory} />
          </section>
        )}

        {/* 버튼 */}
        <div className="mt-auto pt-6 space-y-4">
          <Button
            type="submit"
            className="w-full flex items-center justify-center gap-3 bg-[#00007F] hover:brightness-120 text-white font-bold p-6 rounded-2xl shadow-lg shadow-[#00007F]/20 active:scale-[0.98] transition-all"
            disabled={isSubmitting}
          >
            <span className="text-base tracking-wide">{isSubmitting ? '저장 중...' : isEditMode ? '수정 저장하기' : '스킬 저장하기'}</span>
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


      </div>
    </form>
  );
}
