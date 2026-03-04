'use client';

interface FrontmatterCardProps {
  metadata: Record<string, unknown>;
}

function formatValue(value: unknown): React.ReactNode {
  if (Array.isArray(value)) {
    return (
      <div className="flex flex-wrap gap-1.5">
        {value.map((item, i) => (
          <span
            key={i}
            className="inline-block bg-white/80 border border-[#e2e0dc] text-xs px-2 py-0.5 rounded-md text-[#37352f]"
          >
            {String(item)}
          </span>
        ))}
      </div>
    );
  }

  return (
    <span className="text-[#37352f] truncate block" title={String(value)}>
      {String(value)}
    </span>
  );
}

export default function FrontmatterCard({ metadata }: FrontmatterCardProps) {
  const entries = Object.entries(metadata);

  if (entries.length === 0) return null;

  return (
    <div className="bg-[#f7f6f3] border border-[#e2e0dc] rounded-xl p-4 mb-6">
      <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
        {entries.map(([key, value]) => (
          <div key={key} className="contents">
            <span className="text-[#9b9a97] font-medium whitespace-nowrap">
              {key}
            </span>
            {formatValue(value)}
          </div>
        ))}
      </div>
    </div>
  );
}
