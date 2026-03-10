'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import type { FeedbackRow, FeedbackReplyRow, PaginatedResult } from '@/admin/domain/types';
import { Lock, MessageCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { getRepliesAction } from '@/app/admin/feedbacks/actions';
import FeedbackReplies from '@/features/admin/FeedbackReplies';
import FeedbackReplyForm from '@/features/admin/FeedbackReplyForm';

interface FeedbacksTableProps {
  result: PaginatedResult<FeedbackRow>;
}


export default function FeedbacksTable({ result }: FeedbacksTableProps) {
  const { data, page, totalPages } = result;

  const [expandedFeedbackId, setExpandedFeedbackId] = useState<string | null>(null);
  const [repliesMap, setRepliesMap] = useState<Record<string, FeedbackReplyRow[]>>({});
  const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});

  const loadReplies = useCallback(async (feedbackId: string) => {
    setLoadingMap((prev) => ({ ...prev, [feedbackId]: true }));
    try {
      const replies = await getRepliesAction(feedbackId);
      setRepliesMap((prev) => ({ ...prev, [feedbackId]: replies }));
    } finally {
      setLoadingMap((prev) => ({ ...prev, [feedbackId]: false }));
    }
  }, []);

  const handleRowClick = useCallback(async (feedbackId: string) => {
    if (expandedFeedbackId === feedbackId) {
      setExpandedFeedbackId(null);
      return;
    }

    setExpandedFeedbackId(feedbackId);
    if (!repliesMap[feedbackId]) {
      await loadReplies(feedbackId);
    }
  }, [expandedFeedbackId, repliesMap, loadReplies]);

  const handleReplyCreated = useCallback(async (feedbackId: string) => {
    await loadReplies(feedbackId);
  }, [loadReplies]);

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#000080]/5">
        <h3 className="text-lg font-bold text-[#000080] mb-4">피드백 목록</h3>
        <p className="text-sm text-[#000080]/40 text-center py-8">등록된 피드백이 없습니다</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-[#000080]/5 overflow-hidden">
      <div className="p-6 border-b border-[#000080]/5">
        <h3 className="text-lg font-bold text-[#000080]">피드백 목록</h3>
        <p className="text-xs text-[#000080]/40 mt-1">전체 {result.totalCount.toLocaleString()}건</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-[#000080]/5">
            <tr>
              <th className="px-6 py-3 text-xs font-bold text-[#000080]/50 uppercase tracking-wider">코멘트</th>
              <th className="px-6 py-3 text-xs font-bold text-[#000080]/50 uppercase tracking-wider">작성자</th>
              <th className="px-6 py-3 text-xs font-bold text-[#000080]/50 uppercase tracking-wider">대상 스킬</th>
              <th className="px-6 py-3 text-xs font-bold text-[#000080]/50 uppercase tracking-wider">비밀글</th>
              <th className="px-6 py-3 text-xs font-bold text-[#000080]/50 uppercase tracking-wider">댓글</th>
              <th className="px-6 py-3 text-xs font-bold text-[#000080]/50 uppercase tracking-wider">작성일</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#000080]/5">
            {data.map((feedback) => {
              const isExpanded = expandedFeedbackId === feedback.id;
              const replies = repliesMap[feedback.id] ?? [];
              const loading = loadingMap[feedback.id] ?? false;

              return (
                <>
                  <tr
                    key={feedback.id}
                    onClick={() => void handleRowClick(feedback.id)}
                    className="hover:bg-[#000080]/3 transition-colors cursor-pointer"
                  >
                    <td className="px-6 py-4 text-sm text-[#000080]/70 max-w-xs">
                      {feedback.comment ? (
                        <p className="truncate">{feedback.comment}</p>
                      ) : (
                        <span className="text-[#000080]/30 italic">없음</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-[#000080]/70">{feedback.userName}</td>
                    <td className="px-6 py-4 text-sm text-[#000080]/70">{feedback.skillTitle}</td>
                    <td className="px-6 py-4">
                      {feedback.isSecret ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#000080]/8 text-[#000080]/60 text-xs font-semibold">
                          <Lock className="w-3 h-3" />
                          비밀
                        </span>
                      ) : (
                        <span className="text-[#000080]/20 text-xs">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 text-sm text-[#000080]/60">
                        <MessageCircle className="w-3.5 h-3.5" />
                        {feedback.replyCount}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm text-[#000080]/60">
                          {new Date(feedback.createdAt).toLocaleDateString('ko-KR')}
                        </span>
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-[#000080]/40 flex-shrink-0" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-[#000080]/40 flex-shrink-0" />
                        )}
                      </div>
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr key={`${feedback.id}-accordion`} className="bg-[#000080]/2">
                      <td colSpan={6} className="pb-3">
                        <FeedbackReplies replies={replies} loading={loading} />
                        <FeedbackReplyForm
                          feedbackId={feedback.id}
                          onReplyCreated={() => void handleReplyCreated(feedback.id)}
                        />
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="px-6 py-4 border-t border-[#000080]/5 flex items-center justify-between">
        <p className="text-xs text-[#000080]/40">
          {page} / {totalPages} 페이지
        </p>
        <div className="flex items-center gap-2">
          {page > 1 && (
            <Link
              href={`?page=${page - 1}`}
              className="px-3 py-1.5 text-xs font-semibold text-[#000080] border border-[#000080]/20 rounded-lg hover:bg-[#000080]/5 transition-colors"
            >
              이전
            </Link>
          )}
          {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
            const pageNum = i + 1;
            return (
              <Link
                key={pageNum}
                href={`?page=${pageNum}`}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  pageNum === page
                    ? 'bg-[#000080] text-white'
                    : 'text-[#000080] border border-[#000080]/20 hover:bg-[#000080]/5'
                }`}
              >
                {pageNum}
              </Link>
            );
          })}
          {page < totalPages && (
            <Link
              href={`?page=${page + 1}`}
              className="px-3 py-1.5 text-xs font-semibold text-[#000080] border border-[#000080]/20 rounded-lg hover:bg-[#000080]/5 transition-colors"
            >
              다음
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
