'use client';

import { useState, useEffect } from 'react';
import { MessageSquareText, Loader2 } from 'lucide-react';
import type { FeedbackWithReplies } from '@/skill-detail/domain/types';
import FeedbackForm from './FeedbackForm';
import FeedbackList from './FeedbackList';

interface FeedbackSectionProps {
  skillId: string;
  initialFeedbacks: FeedbackWithReplies[];
  hasMore?: boolean;
  loadingMore?: boolean;
  onLoadMore?: () => void;
}

export default function FeedbackSection({
  skillId,
  initialFeedbacks,
  hasMore = false,
  loadingMore = false,
  onLoadMore,
}: FeedbackSectionProps) {
  const [feedbacks, setFeedbacks] = useState<FeedbackWithReplies[]>(initialFeedbacks);

  // Sync when parent loads more feedbacks
  useEffect(() => {
    setFeedbacks(initialFeedbacks);
  }, [initialFeedbacks]);

  function handleNewFeedback(feedback: FeedbackWithReplies) {
    setFeedbacks((prev) => [feedback, ...prev]);
  }

  function handleReplyAdded(feedbackId: string, reply: FeedbackWithReplies['replies'][number]) {
    setFeedbacks((prev) =>
      prev.map((f) =>
        f.id === feedbackId
          ? { ...f, replies: [...f.replies, reply] }
          : f
      )
    );
  }

  return (
    <section className="pt-8">
      <h3 className="text-xl font-bold mb-8 flex items-center gap-2.5 text-[#00007F]">
        <MessageSquareText className="w-5 h-5 text-[#00007F]/40" />
        피드백 및 리뷰
      </h3>
      <FeedbackForm skillId={skillId} onSubmit={handleNewFeedback} />
      <FeedbackList feedbacks={feedbacks} onReplyAdded={handleReplyAdded} />
      {hasMore && onLoadMore && (
        <div className="flex justify-center mt-6">
          <button
            onClick={onLoadMore}
            disabled={loadingMore}
            className="px-6 py-2.5 text-sm font-semibold text-[#00007F] bg-white border border-slate-200 rounded-full hover:bg-slate-50 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {loadingMore ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                로딩 중...
              </>
            ) : (
              '피드백 더 보기'
            )}
          </button>
        </div>
      )}
    </section>
  );
}
