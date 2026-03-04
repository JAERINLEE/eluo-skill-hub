'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { X, Info } from 'lucide-react';
import { getSkillDetailAction, getSkillFeedbacksAction } from '@/app/(portal)/dashboard/actions';
import type { SkillDetailPopup, FeedbackWithReplies } from '@/skill-detail/domain/types';
import SkillDetailHeader from './SkillDetailHeader';
import SkillDetailGuide from './SkillDetailGuide';
import FeedbackSection from './FeedbackSection';
import TemplateDownloadButton from './TemplateDownloadButton';

// --- Stale-While-Revalidate 캐시 ---
interface CachedSkillData {
  skill: SkillDetailPopup;
  feedbacks: FeedbackWithReplies[];
  hasMore: boolean;
  cachedAt: number;
}

const CACHE_TTL_MS = 5 * 60 * 1000; // 5분
const skillCache = new Map<string, CachedSkillData>();

interface SkillDetailModalProps {
  skillId: string;
  isViewer: boolean;
  onClose: () => void;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

export default function SkillDetailModal({
  skillId,
  isViewer,
  onClose,
}: SkillDetailModalProps) {
  const cached = skillCache.get(skillId);
  const hasFreshCache = cached && Date.now() - cached.cachedAt < CACHE_TTL_MS;

  const [skill, setSkill] = useState<SkillDetailPopup | null>(hasFreshCache ? cached.skill : null);
  const [feedbacks, setFeedbacks] = useState<FeedbackWithReplies[]>(hasFreshCache ? cached.feedbacks : []);
  const [hasMoreFeedbacks, setHasMoreFeedbacks] = useState(hasFreshCache ? cached.hasMore : false);
  const [feedbackOffset, setFeedbackOffset] = useState(hasFreshCache ? cached.feedbacks.length : 0);
  const [loadingMoreFeedbacks, setLoadingMoreFeedbacks] = useState(false);
  const [loading, setLoading] = useState(!hasFreshCache);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef(false);

  const applyFetchResult = useCallback((
    skillResult: Awaited<ReturnType<typeof getSkillDetailAction>>,
    feedbackResult: Awaited<ReturnType<typeof getSkillFeedbacksAction>>,
  ) => {
    if (abortRef.current) return;

    if (!skillResult.success) {
      // 캐시가 없을 때만 에러 표시 (캐시가 있으면 기존 데이터 유지)
      if (!skillCache.has(skillId)) {
        setError(skillResult.error);
      }
      setLoading(false);
      return;
    }

    setSkill(skillResult.skill);
    setError(null);

    if (feedbackResult.success) {
      setFeedbacks(feedbackResult.feedbacks);
      setHasMoreFeedbacks(feedbackResult.hasMore);
      setFeedbackOffset(feedbackResult.feedbacks.length);

      // 캐시 갱신
      skillCache.set(skillId, {
        skill: skillResult.skill,
        feedbacks: feedbackResult.feedbacks,
        hasMore: feedbackResult.hasMore,
        cachedAt: Date.now(),
      });
    }

    setLoading(false);
  }, [skillId]);

  const fetchFromServer = useCallback(async () => {
    const [skillResult, feedbackResult] = await Promise.all([
      getSkillDetailAction(skillId),
      getSkillFeedbacksAction(skillId),
    ]);
    applyFetchResult(skillResult, feedbackResult);
  }, [skillId, applyFetchResult]);

  const loadData = useCallback(async () => {
    abortRef.current = false;
    setError(null);

    // 캐시 히트: 즉시 표시 + 백그라운드 갱신
    if (hasFreshCache) {
      setLoading(false);
      fetchFromServer();
      return;
    }

    // 캐시 미스: 로딩 표시 후 fetch
    setLoading(true);
    await fetchFromServer();
  }, [hasFreshCache, fetchFromServer]);

  const loadMoreFeedbacks = useCallback(async () => {
    if (loadingMoreFeedbacks || !hasMoreFeedbacks) return;
    setLoadingMoreFeedbacks(true);

    const result = await getSkillFeedbacksAction(skillId, feedbackOffset);

    if (!abortRef.current && result.success) {
      setFeedbacks((prev) => {
        const updated = [...prev, ...result.feedbacks];
        // 캐시도 함께 업데이트
        const existing = skillCache.get(skillId);
        if (existing) {
          skillCache.set(skillId, {
            ...existing,
            feedbacks: updated,
            hasMore: result.hasMore,
            cachedAt: Date.now(),
          });
        }
        return updated;
      });
      setHasMoreFeedbacks(result.hasMore);
      setFeedbackOffset((prev) => prev + result.feedbacks.length);
    }

    setLoadingMoreFeedbacks(false);
  }, [skillId, feedbackOffset, hasMoreFeedbacks, loadingMoreFeedbacks]);

  useEffect(() => {
    loadData();
    return () => {
      abortRef.current = true;
    };
  }, [loadData]);

  // ESC key + body overflow lock
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const totalFileSize = skill?.templates.reduce((sum, t) => sum + t.fileSize, 0) ?? 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        background: 'rgba(0, 0, 127, 0.1)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-6xl max-h-[92vh] overflow-hidden rounded-2xl flex flex-col md:flex-row relative"
        style={{
          background: 'linear-gradient(135deg, #ffffff 0%, #f9f9f9 100%)',
          border: '1px solid rgba(255, 255, 255, 0.4)',
          boxShadow:
            'rgba(0, 0, 127, 0.04) 0px 0px 0px 1px, rgba(0, 0, 127, 0.08) 0px 10px 30px -5px',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 h-10 w-10 flex items-center justify-center rounded-full bg-white/80 hover:bg-white text-slate-500 hover:text-[#00007F] transition-all z-10 border border-slate-200/50 shadow-sm active:scale-95"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Left panel */}
        <div className="flex-1 overflow-y-auto p-8 md:p-14 scrollbar-hide">
          {loading ? (
            <SkillDetailSkeleton />
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <p className="text-lg font-medium mb-4">{error}</p>
              <button
                onClick={loadData}
                className="px-6 py-2 bg-[#00007F] text-white rounded-full text-sm font-bold hover:opacity-90 transition-opacity"
              >
                다시 시도
              </button>
            </div>
          ) : skill ? (
            <div className="space-y-16">
              <SkillDetailHeader skill={skill} />
              <SkillDetailGuide markdownContent={skill.markdownContent} />
              <FeedbackSection
                skillId={skillId}
                initialFeedbacks={feedbacks}
                hasMore={hasMoreFeedbacks}
                loadingMore={loadingMoreFeedbacks}
                onLoadMore={loadMoreFeedbacks}
              />
            </div>
          ) : null}
        </div>

        {/* Right sidebar */}
        <div className="w-full md:w-96 bg-[#F0F0F0]/50 border-t md:border-t-0 md:border-l border-slate-200/50 p-10 flex flex-col gap-6 backdrop-blur-md">
          <div>
            <h4 className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-slate-400 mb-5">
              실행하기
            </h4>
            <div className="space-y-4">
              <TemplateDownloadButton
                templates={skill?.templates ?? []}
                isViewer={isViewer}
              />
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-slate-200">
            <div className="p-6 bg-white/80 rounded-2xl border border-white shadow-sm">
              <h5 className="text-[11px] font-extrabold text-[#00007F] uppercase tracking-wider mb-5 flex items-center gap-2">
                <Info className="w-3.5 h-3.5" /> 스킬 상세 정보
              </h5>
              <div className="space-y-4 text-[13px] text-[#1a1a1a]">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">최근 업데이트</span>
                  <span className="font-bold">
                    {skill ? formatDate(skill.updatedAt) : '-'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">파일 크기</span>
                  <span className="font-bold">
                    {totalFileSize > 0 ? formatFileSize(totalFileSize) : '-'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">카테고리</span>
                  <span className="font-bold">{skill?.categoryName ?? '-'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SkillDetailSkeleton() {
  return (
    <div className="animate-pulse space-y-8">
      <div className="w-20 h-20 bg-slate-200 rounded-2xl" />
      <div className="h-10 w-3/4 bg-slate-200 rounded" />
      <div className="h-4 w-1/2 bg-slate-100 rounded" />
      <div className="space-y-3 mt-12">
        <div className="h-4 bg-slate-100 rounded w-full" />
        <div className="h-4 bg-slate-100 rounded w-5/6" />
        <div className="h-4 bg-slate-100 rounded w-4/6" />
      </div>
    </div>
  );
}
