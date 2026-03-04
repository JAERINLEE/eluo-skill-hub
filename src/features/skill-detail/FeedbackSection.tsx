'use client';

import { useState } from 'react';
import { MessageSquareText } from 'lucide-react';
import type { FeedbackWithReplies } from '@/skill-detail/domain/types';
import FeedbackForm from './FeedbackForm';
import FeedbackList from './FeedbackList';

interface FeedbackSectionProps {
  skillId: string;
  initialFeedbacks: FeedbackWithReplies[];
}

export default function FeedbackSection({
  skillId,
  initialFeedbacks,
}: FeedbackSectionProps) {
  const [feedbacks, setFeedbacks] = useState<FeedbackWithReplies[]>(initialFeedbacks);

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
    </section>
  );
}
