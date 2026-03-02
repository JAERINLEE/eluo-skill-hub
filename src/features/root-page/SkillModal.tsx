'use client';

import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import type { Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { submitFeedbackAction } from '@/app/actions/feedbackActions';
import type { SkillViewModel } from './types';

interface SkillModalProps {
  skill: SkillViewModel;
  isBookmarked: boolean;
  onClose: () => void;
  onToggleBookmark: (skillId: string) => void;
}

type FeedbackStatus = 'idle' | 'submitting' | 'success' | 'error';

const markdownComponents: Components = {
  h1: ({ children }) => (
    <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-8 mb-4 pb-2 border-b border-slate-200 dark:border-slate-700 first:mt-0">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-6 mb-3 pb-1.5 border-b border-slate-100 dark:border-slate-800 first:mt-0">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 mt-5 mb-2 first:mt-0">
      {children}
    </h3>
  ),
  h4: ({ children }) => (
    <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mt-4 mb-1.5">
      {children}
    </h4>
  ),
  p: ({ children }) => (
    <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-4 last:mb-0">
      {children}
    </p>
  ),
  ul: ({ children }) => (
    <ul className="list-disc list-outside pl-5 space-y-1.5 mb-4 text-sm text-slate-600 dark:text-slate-300">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal list-outside pl-5 space-y-1.5 mb-4 text-sm text-slate-600 dark:text-slate-300">
      {children}
    </ol>
  ),
  li: ({ children }) => <li className="leading-relaxed pl-1">{children}</li>,
  blockquote: ({ children }) => (
    <blockquote className="border-l-4 border-primary/40 pl-4 my-4 text-slate-500 dark:text-slate-400 italic text-sm bg-slate-50 dark:bg-slate-800/50 py-2 rounded-r-lg">
      {children}
    </blockquote>
  ),
  strong: ({ children }) => (
    <strong className="font-semibold text-slate-800 dark:text-slate-200">{children}</strong>
  ),
  em: ({ children }) => (
    <em className="italic text-slate-600 dark:text-slate-400">{children}</em>
  ),
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-primary hover:underline"
    >
      {children}
    </a>
  ),
  hr: () => <hr className="my-6 border-slate-200 dark:border-slate-700" />,
  table: ({ children }) => (
    <div className="overflow-x-auto mb-4 rounded-lg border border-slate-200 dark:border-slate-700">
      <table className="w-full text-sm border-collapse">{children}</table>
    </div>
  ),
  th: ({ children }) => (
    <th className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800 font-semibold text-left text-slate-700 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="px-4 py-2.5 text-slate-600 dark:text-slate-300 border-b border-slate-100 dark:border-slate-800 last:border-b-0">
      {children}
    </td>
  ),
  code: ({ className, children }) => {
    // rehype-highlight adds "hljs language-xxx" className to block code
    if (className?.includes('hljs') || className?.includes('language-')) {
      return <code className={className}>{children}</code>;
    }
    // Inline code
    return (
      <code className="bg-slate-100 dark:bg-slate-800 text-primary dark:text-blue-300 px-1.5 py-0.5 rounded text-[0.85em] font-mono">
        {children}
      </code>
    );
  },
  pre: ({ children }) => (
    <pre className="rounded-xl overflow-hidden mb-4 text-[13px] leading-relaxed shadow-sm border border-slate-200 dark:border-slate-700">
      {children}
    </pre>
  ),
};

export function SkillModal({ skill, isBookmarked, onClose, onToggleBookmark }: SkillModalProps) {
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [comment, setComment] = useState('');
  const [feedbackStatus, setFeedbackStatus] = useState<FeedbackStatus>('idle');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleSubmitFeedback = async () => {
    if (!selectedRating) return;

    setFeedbackStatus('submitting');
    try {
      await submitFeedbackAction(skill.id, selectedRating, comment || null);
      setFeedbackStatus('success');
      setSelectedRating(null);
      setComment('');
    } catch {
      setFeedbackStatus('error');
    }
  };

  const handleCopyToClipboard = async () => {
    const content = skill.markdownContent ?? skill.description;
    await navigator.clipboard.writeText(content);
  };

  const formattedDate = new Date(skill.createdAt).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={skill.name}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      {/* Overlay */}
      <div
        data-testid="modal-overlay"
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative z-10 w-full max-w-5xl max-h-[92vh] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl flex overflow-hidden">
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="닫기"
          className="absolute top-4 right-4 z-10 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
        >
          ✕
        </button>

        {/* Left: Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-8 pr-4">
          {/* Header */}
          <div className="mb-6">
            <div className="text-4xl mb-3">{skill.icon}</div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
              {skill.name}
            </h2>
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 text-xs font-bold uppercase rounded bg-primary/10 text-primary">
                {skill.categoryName}
              </span>
            </div>
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              {skill.description}
            </p>
          </div>

          {/* Markdown Content */}
          {skill.markdownContent && (
            <div className="mb-8">
              <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
                상세 설명
              </h3>
              <div className="space-y-0">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeHighlight]}
                  components={markdownComponents}
                >
                  {skill.markdownContent}
                </ReactMarkdown>
              </div>
            </div>
          )}

          {/* Feedback Section */}
          <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
            <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">
              피드백 및 리뷰
            </h3>

            {feedbackStatus === 'success' ? (
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg text-green-700 dark:text-green-400 text-sm font-medium">
                피드백이 성공적으로 제출되었습니다. 감사합니다!
              </div>
            ) : (
              <>
                <div className="flex gap-2 mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setSelectedRating(star)}
                      aria-label={`★ ${star}`}
                      aria-pressed={selectedRating === star}
                      className={`w-10 h-10 rounded-full text-lg transition-colors ${selectedRating !== null && star <= selectedRating
                        ? 'text-yellow-400'
                        : 'text-slate-300 dark:text-slate-600 hover:text-yellow-300'
                        }`}
                    >
                      ★
                    </button>
                  ))}
                </div>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="코멘트를 입력하세요 (선택사항)"
                  rows={3}
                  className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 mb-3"
                />
                <button
                  type="button"
                  onClick={handleSubmitFeedback}
                  disabled={!selectedRating || feedbackStatus === 'submitting'}
                  className="px-4 py-2 text-sm font-semibold bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {feedbackStatus === 'submitting' ? '제출 중...' : '피드백 제출'}
                </button>
                {feedbackStatus === 'error' && (
                  <p className="mt-2 text-sm text-red-500">제출에 실패했습니다. 다시 시도해주세요.</p>
                )}
              </>
            )}
          </div>
        </div>

        {/* Right: Side Panel */}
        <div className="w-60 flex-shrink-0 border-l border-slate-200 dark:border-slate-700 pt-16 px-6 pb-6 bg-slate-50 dark:bg-slate-800/50 overflow-y-auto">
          {/* Actions */}
          <div className="space-y-3 mb-8">
            <button
              type="button"
              onClick={() => onToggleBookmark(skill.id)}
              data-testid={isBookmarked ? 'bookmark-btn-active' : 'bookmark-btn-inactive'}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-sm transition-colors ${isBookmarked
                ? 'bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20'
                : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600'
                }`}
            >
              <span>{isBookmarked ? '🔖' : '🔖'}</span>
              {isBookmarked ? '북마크 해제' : '북마크 추가'}
            </button>

          </div>

          {/* Skill Metadata */}
          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
              스킬 정보
            </h3>
            <dl className="space-y-3">
              <div>
                <dt className="text-xs text-slate-400 dark:text-slate-500 mb-1">카테고리</dt>
                <dd className="text-sm font-medium text-slate-700 dark:text-slate-200">
                  {skill.categoryName || '—'}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-400 dark:text-slate-500 mb-1">최근 업데이트</dt>
                <dd className="text-sm font-medium text-slate-700 dark:text-slate-200">
                  {formattedDate}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
