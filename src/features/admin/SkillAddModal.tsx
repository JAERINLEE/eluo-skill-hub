'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useCallback, useState } from 'react';
import { X } from 'lucide-react';
import type { CreateSkillInput } from '@/admin/domain/types';
import DraftSaveDialog from './DraftSaveDialog';
import CloseConfirmDialog from './CloseConfirmDialog';
import SkillAddForm from './SkillAddForm';

export default function SkillAddModal() {
  const router = useRouter();
  const [isDirty, setIsDirty] = useState(false);
  const [showDraftDialog, setShowDraftDialog] = useState(false);
  const [showCloseDialog, setShowCloseDialog] = useState(false);
  const [pendingDraftInput, setPendingDraftInput] = useState<CreateSkillInput | null>(null);

  const handleCloseAttempt = useCallback(() => {
    if (isDirty) {
      setShowCloseDialog(true);
    } else {
      router.back();
    }
  }, [isDirty, router]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showDraftDialog || showCloseDialog) return;
        handleCloseAttempt();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleCloseAttempt, showDraftDialog, showCloseDialog]);

  const handleDraftSaveRequest = (input: CreateSkillInput) => {
    setPendingDraftInput(input);
    setShowDraftDialog(true);
  };

  return (
    <>
      {/* Overlay — 외부 클릭 무시 (FR-007) */}
      <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between p-6 border-b border-slate-100">
            <h2 className="text-xl font-black text-slate-900">새 스킬 추가하기</h2>
            <button
              type="button"
              onClick={handleCloseAttempt}
              className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              aria-label="닫기"
            >
              <X size={20} />
            </button>
          </div>
          <div className="p-6">
            <SkillAddForm
              onDirtyChange={setIsDirty}
              onRequestDraftSave={handleDraftSaveRequest}
            />
          </div>
        </div>
      </div>

      {/* 임시저장 다이얼로그 — 임시저장 버튼 전용 */}
      {showDraftDialog && (
        <DraftSaveDialog
          pendingInput={pendingDraftInput}
          onClose={() => {
            setShowDraftDialog(false);
            setPendingDraftInput(null);
          }}
        />
      )}

      {/* 닫기 확인 다이얼로그 — X 버튼 / ESC 전용 */}
      <CloseConfirmDialog
        open={showCloseDialog}
        onClose={() => setShowCloseDialog(false)}
        onDiscard={() => {
          setShowCloseDialog(false);
          router.back();
        }}
      />
    </>
  );
}
