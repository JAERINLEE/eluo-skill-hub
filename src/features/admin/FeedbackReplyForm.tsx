'use client';

import { useState } from 'react';
import { Send } from 'lucide-react';
import { toast } from 'sonner';
import { createReplyAction } from '@/app/admin/feedbacks/actions';

interface FeedbackReplyFormProps {
  feedbackId: string;
  onReplyCreated: () => void;
}

export default function FeedbackReplyForm({ feedbackId, onReplyCreated }: FeedbackReplyFormProps) {
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    const trimmed = content.trim();
    if (!trimmed) {
      toast.warning('댓글 내용을 입력해주세요.');
      return;
    }

    setSubmitting(true);
    try {
      const result = await createReplyAction(feedbackId, trimmed);
      if (result.success) {
        setContent('');
        toast.success('댓글이 등록되었습니다.');
        onReplyCreated();
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error('댓글 등록 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="px-6 py-3 border-t border-[#000080]/5">
      <div className="flex gap-2">
        <input
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              void handleSubmit();
            }
          }}
          disabled={submitting}
          placeholder="댓글을 입력하세요..."
          className="flex-1 bg-white border border-[#000080]/10 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#000080]/10 focus:border-[#000080]/30 transition-all placeholder:text-[#000080]/30"
        />
        <button
          onClick={() => void handleSubmit()}
          disabled={submitting || !content.trim()}
          className="px-4 py-2 bg-[#000080] text-white rounded-lg text-xs font-bold hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
        >
          <Send className="w-3.5 h-3.5" />
          등록
        </button>
      </div>
    </div>
  );
}
