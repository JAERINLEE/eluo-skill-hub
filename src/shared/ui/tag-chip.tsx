'use client';

interface TagChipProps {
  tag: string;
  onClick?: (tag: string) => void;
  onRemove?: (tag: string) => void;
  size?: 'sm' | 'md';
}

export default function TagChip({ tag, onClick, onRemove, size = 'sm' }: TagChipProps) {
  const sizeClasses = size === 'sm'
    ? 'text-xs px-2 py-0.5'
    : 'text-sm px-3 py-1';

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full bg-slate-100 text-slate-600 font-medium ${sizeClasses} ${onClick ? 'cursor-pointer hover:bg-slate-200 transition-colors' : ''}`}
      onClick={onClick ? () => onClick(tag) : undefined}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') onClick(tag); } : undefined}
    >
      <span>#{tag}</span>
      {onRemove && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onRemove(tag); }}
          className="ml-0.5 text-slate-400 hover:text-slate-700 transition-colors"
          aria-label={`${tag} 태그 삭제`}
        >
          &times;
        </button>
      )}
    </span>
  );
}
