'use client';

import type { FeedbackReplyRow } from '@/admin/domain/types';

interface FeedbackRepliesProps {
  replies: FeedbackReplyRow[];
  loading: boolean;
}

export default function FeedbackReplies({ replies, loading }: FeedbackRepliesProps) {
  if (loading) {
    return (
      <div className="px-6 py-4 text-sm text-[#000080]/40 animate-pulse">
        댓글을 불러오는 중...
      </div>
    );
  }

  if (replies.length === 0) {
    return (
      <div className="px-6 py-4 text-sm text-[#000080]/40">
        댓글이 없습니다
      </div>
    );
  }

  return (
    <div className="px-6 py-3 space-y-3">
      {replies.map((reply) => (
        <div key={reply.id} className="flex gap-3 p-3 bg-[#000080]/3 rounded-lg">
          <div className="size-7 rounded-full bg-[#000080]/10 flex-shrink-0 flex items-center justify-center text-xs font-bold text-[#000080]/60">
            {reply.userName?.[0]?.toUpperCase() ?? '?'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold text-[#000080]/70">{reply.userName || '알 수 없음'}</span>
              <span className="text-xs text-[#000080]/40">
                {new Date(reply.createdAt).toLocaleDateString('ko-KR')}
              </span>
            </div>
            <p className="text-sm text-[#000080]/70 break-words">{reply.content}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
