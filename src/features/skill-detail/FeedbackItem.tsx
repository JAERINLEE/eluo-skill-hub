'use client';

import { useState } from 'react';
import { Star, Send } from 'lucide-react';
import { toast } from 'sonner';
import { submitFeedbackReplyAction } from '@/app/(portal)/dashboard/actions';
import type { FeedbackWithReplies, FeedbackReply } from '@/skill-detail/domain/types';

interface FeedbackItemProps {
  feedback: FeedbackWithReplies;
  onReplyAdded: (feedbackId: string, reply: FeedbackReply) => void;
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

export default function FeedbackItem({ feedback, onReplyAdded }: FeedbackItemProps) {
  const [replyContent, setReplyContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleReplySubmit() {
    if (!replyContent.trim()) {
      toast.warning('댓글 내용을 입력해주세요.');
      return;
    }

    setSubmitting(true);

    const result = await submitFeedbackReplyAction({
      feedbackId: feedback.id,
      content: replyContent.trim(),
    });

    setSubmitting(false);

    if (result.success) {
      onReplyAdded(feedback.id, result.reply);
      setReplyContent('');
      toast.success('댓글이 등록되었습니다.');
    } else {
      toast.error(result.error);
    }
  }

  return (
    <div className="flex gap-6 p-2">
      <div className="size-12 rounded-full bg-slate-200 ring-2 ring-white overflow-hidden flex-shrink-0 shadow-sm flex items-center justify-center text-lg font-bold text-slate-500">
        {feedback.userName?.[0]?.toUpperCase() ?? '?'}
      </div>
      <div className="flex-1">
        <div className="flex items-center justify-between mb-2">
          <span className="text-base font-bold text-[#1a1a1a]">
            {feedback.userName ?? '익명'}
          </span>
          <span className="text-xs text-slate-400">
            {formatRelativeTime(feedback.createdAt)}
          </span>
        </div>
        <div className="flex items-center gap-1 mb-3">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={`w-4 h-4 ${
                star <= feedback.rating
                  ? 'text-[#00007F] fill-current'
                  : 'text-slate-300'
              }`}
            />
          ))}
        </div>
        {feedback.comment && (
          <p className="text-base text-[#1a1a1a] leading-relaxed opacity-80">
            {feedback.comment}
          </p>
        )}

        {/* Replies */}
        {feedback.replies.length > 0 && (
          <div className="mt-4 space-y-4 ml-2">
            {feedback.replies.map((reply) => (
              <div key={reply.id} className="flex gap-3 p-3 bg-slate-50 rounded-xl">
                <div className="size-8 rounded-full bg-slate-200 flex-shrink-0 flex items-center justify-center text-xs font-bold text-slate-500">
                  {reply.userName?.[0]?.toUpperCase() ?? '?'}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-bold text-[#1a1a1a]">
                      {reply.userName ?? '익명'}
                    </span>
                    <span className="text-xs text-slate-400">
                      {formatRelativeTime(reply.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm text-[#1a1a1a] opacity-80">{reply.content}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Reply input */}
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
      </div>
    </div>
  );
}
