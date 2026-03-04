import { MessageCircle } from 'lucide-react';
import type { FeedbackWithReplies, FeedbackReply } from '@/skill-detail/domain/types';
import FeedbackItem from './FeedbackItem';

interface FeedbackListProps {
  feedbacks: FeedbackWithReplies[];
  onReplyAdded: (feedbackId: string, reply: FeedbackReply) => void;
}

export default function FeedbackList({ feedbacks, onReplyAdded }: FeedbackListProps) {
  if (feedbacks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-slate-400">
        <MessageCircle className="w-10 h-10 mb-3" />
        <p className="text-sm">아직 피드백이 없습니다. 첫 번째 피드백을 남겨보세요.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {feedbacks.map((feedback) => (
        <FeedbackItem
          key={feedback.id}
          feedback={feedback}
          onReplyAdded={onReplyAdded}
        />
      ))}
    </div>
  );
}
