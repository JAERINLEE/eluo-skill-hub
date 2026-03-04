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
      {/* Overlay — glass-overlay backdrop */}
      <div className="fixed inset-0 z-50 bg-[rgba(0,0,127,0.1)] backdrop-blur-[12px] flex items-center justify-center p-4">
        <div className="bg-gradient-to-br from-white to-[#f9f9f9] border border-white/40 rounded-3xl w-full max-w-5xl max-h-[92vh] overflow-hidden relative" style={{ boxShadow: 'rgba(0, 0, 127, 0.04) 0px 0px 0px 1px, rgba(0, 0, 127, 0.08) 0px 10px 30px -5px' }}>
          <button
            type="button"
            onClick={handleCloseAttempt}
            className="absolute top-6 right-6 h-10 w-10 flex items-center justify-center rounded-full bg-white/80 hover:bg-white text-slate-500 hover:text-[#00007F] transition-all z-20 border border-slate-200/50 shadow-sm active:scale-95"
            aria-label="닫기"
          >
            <X size={20} />
          </button>
          <SkillAddForm
            onDirtyChange={setIsDirty}
            onRequestDraftSave={handleDraftSaveRequest}
          />
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
