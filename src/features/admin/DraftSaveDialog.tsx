'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/shared/ui/alert-dialog';
import { createSkill, updateSkill } from '@/app/admin/skills/actions';
import type { CreateSkillInput, UpdateSkillInput } from '@/admin/domain/types';

interface DraftSaveDialogProps {
  pendingInput: CreateSkillInput | UpdateSkillInput | null;
  onClose: () => void;
  onSaved?: () => void;
  mode?: 'add' | 'edit';
  skillId?: string;
}

export default function DraftSaveDialog({ pendingInput, onClose, onSaved, mode = 'add', skillId }: DraftSaveDialogProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);

  const handleDraftSave = async () => {
    if (!pendingInput) {
      onClose();
      return;
    }

    setIsSaving(true);
    try {
      const formData = new FormData();
      formData.append('categoryId', pendingInput.categoryId);
      formData.append('title', pendingInput.title);
      formData.append('description', pendingInput.description);
      formData.append('version', pendingInput.version);
      formData.append('tags', JSON.stringify(pendingInput.tags));
      formData.append('isPublished', 'false');
      if (pendingInput.markdownFile) formData.append('markdownFile', pendingInput.markdownFile);
      for (const f of pendingInput.templateFiles ?? []) formData.append('templateFiles', f);

      if (mode === 'edit' && skillId) {
        formData.append('skillId', skillId);
        const editInput = pendingInput as UpdateSkillInput;
        formData.append('removeMarkdown', String(editInput.removeMarkdown));
        formData.append('removedTemplateIds', JSON.stringify(editInput.removedTemplateIds));

        const result = await updateSkill(formData);
        if (result.success) {
          toast.success('임시저장되었습니다');
          onSaved?.();
          router.back();
          router.refresh();
        } else {
          toast.error(result.error);
          onClose();
        }
      } else {
        const result = await createSkill(formData);
        if (result.success) {
          toast.success('임시저장되었습니다');
          onSaved?.();
          router.back();
          router.refresh();
        } else {
          toast.error(result.error);
          onClose();
        }
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AlertDialog open onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>임시저장</AlertDialogTitle>
          <AlertDialogDescription>
            입력한 내용을 초안으로 저장합니다.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>취소</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDraftSave}
            disabled={isSaving}
            className="bg-[#000080] hover:bg-[#000070] text-white"
          >
            {isSaving ? '저장 중...' : '임시저장'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
