'use client';

import { useState } from 'react';
import { Send, Lock, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useSubmitReply, useDeleteFeedback, useDeleteReply } from '@/skill-detail/hooks/use-skill-detail-queries';
import type { FeedbackWithReplies } from '@/skill-detail/domain/types';

interface FeedbackItemProps {
  feedback: FeedbackWithReplies;
  skillId: string;
  currentUserId: string;
  isAdmin: boolean;
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 1) return '방금 전';
  if (diffMinutes < 60) return `${diffMinutes}분 전`;
  if (diffHours < 24) return `${diffHours}시간 전`;
  if (diffDays < 7) return `${diffDays}일 전`;
  return date.toLocaleDateString('ko-KR');
}

export default function FeedbackItem({ feedback, skillId, currentUserId, isAdmin }: FeedbackItemProps) {
  const [replyContent, setReplyContent] = useState('');
  const { mutate: submitReply, isPending: submitting } = useSubmitReply(skillId);
  const { mutate: deleteFeedback, isPending: deleting } = useDeleteFeedback(skillId);
  const { mutate: deleteReply } = useDeleteReply(skillId);

  const isOwner = feedback.userId === currentUserId;
  const canViewSecret = isOwner || isAdmin;
  const canDelete = isOwner && !feedback.isDeleted;

  function handleReplySubmit() {
    if (!replyContent.trim()) {
      toast.warning('댓글 내용을 입력해주세요.');
      return;
    }

    submitReply(
      { feedbackId: feedback.id, content: replyContent.trim() },
      {
        onSuccess: (result) => {
          if (result.success) {
            setReplyContent('');
            toast.success('댓글이 등록되었습니다.');
          } else {
            toast.error(result.error);
          }
        },
      },
    );
  }

  function handleReplyDelete(replyId: string) {
    if (!confirm('댓글을 삭제하시겠습니까?')) return;

    deleteReply(replyId, {
      onSuccess: (result) => {
        if (result.success) {
          toast.success('댓글이 삭제되었습니다.');
        } else {
          toast.error(result.error);
        }
      },
    });
  }

  function handleDelete() {
    if (!confirm('피드백을 삭제하시겠습니까?')) return;

    deleteFeedback(feedback.id, {
      onSuccess: (result) => {
        if (result.success) {
          toast.success('피드백이 삭제되었습니다.');
        } else {
          toast.error(result.error);
        }
      },
    });
  }

  // 소프트 삭제된 피드백
  if (feedback.isDeleted) {
    return (
      <div className="flex gap-6 p-2">
        <div className="size-12 rounded-full bg-slate-100 ring-2 ring-white overflow-hidden flex-shrink-0 shadow-sm flex items-center justify-center text-lg font-bold text-slate-300">
          ?
        </div>
        <div className="flex-1">
          <p className="text-base text-slate-400 italic py-2">삭제된 댓글입니다.</p>

          {/* 대댓글은 유지 */}
          {feedback.replies.length > 0 && (
            <div className="mt-4 space-y-4 ml-2">
              {feedback.replies.map((reply) => {
                const replyIsOwner = reply.userId === currentUserId;
                const canViewReply = isOwner || isAdmin || replyIsOwner;
                const isMasked = feedback.isSecret && !canViewReply;

                return (
                  <div key={reply.id} className="flex gap-3 p-3 bg-slate-50 rounded-xl">
                    <div className="size-8 rounded-full bg-slate-200 flex-shrink-0 flex items-center justify-center text-xs font-bold text-slate-500">
                      {reply.userName?.[0]?.toUpperCase() ?? '?'}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-[#1a1a1a]">
                            {reply.userName ?? '익명'}
                          </span>
                          <span className="text-xs text-slate-400">
                            {formatRelativeTime(reply.createdAt)}
                          </span>
                        </div>
                        {replyIsOwner && (
                          <button
                            onClick={() => handleReplyDelete(reply.id)}
                            className="text-slate-400 hover:text-red-500 transition-colors"
                            title="삭제"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                      <p className={`text-sm ${
                        isMasked ? 'text-slate-400 italic' : 'text-[#1a1a1a] opacity-80'
                      }`}>
                        {isMasked ? '비밀글입니다.' : reply.content}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-6 p-2">
      <div className="size-12 rounded-full bg-slate-200 ring-2 ring-white overflow-hidden flex-shrink-0 shadow-sm flex items-center justify-center text-lg font-bold text-slate-500">
        {feedback.userName?.[0]?.toUpperCase() ?? '?'}
      </div>
      <div className="flex-1">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-base font-bold text-[#1a1a1a]">
              {feedback.userName ?? '익명'}
            </span>
            {feedback.isSecret && canViewSecret && (
              <Lock className="w-3.5 h-3.5 text-slate-400" />
            )}
          </div>
          <div className="flex items-center gap-3">
            {canDelete && (
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="text-slate-400 hover:text-red-500 transition-colors disabled:opacity-50"
                title="삭제"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
            <span className="text-xs text-slate-400">
              {formatRelativeTime(feedback.createdAt)}
            </span>
          </div>
        </div>
        {feedback.comment && (
          <p className={`text-base leading-relaxed ${
            feedback.isSecret && !canViewSecret
              ? 'text-slate-400 italic'
              : 'text-[#1a1a1a] opacity-80'
          }`}>
            {feedback.isSecret && !canViewSecret ? '비밀글입니다.' : feedback.comment}
          </p>
        )}

        {/* Replies */}
        {feedback.replies.length > 0 && (
          <div className="mt-4 space-y-4 ml-2">
            {feedback.replies.map((reply) => {
              const replyIsOwner = reply.userId === currentUserId;
              const canViewReply = isOwner || isAdmin || replyIsOwner;
              const isMasked = feedback.isSecret && !canViewReply;

              return (
                <div key={reply.id} className="flex gap-3 p-3 bg-slate-50 rounded-xl">
                  <div className="size-8 rounded-full bg-slate-200 flex-shrink-0 flex items-center justify-center text-xs font-bold text-slate-500">
                    {reply.userName?.[0]?.toUpperCase() ?? '?'}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-[#1a1a1a]">
                          {reply.userName ?? '익명'}
                        </span>
                        <span className="text-xs text-slate-400">
                          {formatRelativeTime(reply.createdAt)}
                        </span>
                      </div>
                      {replyIsOwner && (
                        <button
                          onClick={() => handleReplyDelete(reply.id)}
                          className="text-slate-400 hover:text-red-500 transition-colors"
                          title="삭제"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                    <p className={`text-sm ${
                      isMasked ? 'text-slate-400 italic' : 'text-[#1a1a1a] opacity-80'
                    }`}>
                      {isMasked ? '비밀글입니다.' : reply.content}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Reply input — hidden when viewer cannot read the secret feedback */}
        {!(feedback.isSecret && !canViewSecret) && (
          <div className="mt-4 ml-2 flex gap-2">
            <input
              type="text"
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleReplySubmit();
                }
              }}
              disabled={submitting}
              placeholder="댓글을 입력하세요..."
              className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#00007F]/10 focus:border-[#00007F] transition-all placeholder:text-slate-400"
            />
            <button
              onClick={handleReplySubmit}
              disabled={submitting || !replyContent.trim()}
              className="px-4 py-2.5 bg-[#00007F] text-white rounded-xl text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              등록
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
