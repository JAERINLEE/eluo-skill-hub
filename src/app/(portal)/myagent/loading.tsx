export default function MyAgentLoading() {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <div className="h-7 w-32 bg-slate-200 rounded animate-pulse" />
        <div className="h-4 w-48 bg-slate-100 rounded animate-pulse mt-2" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="bg-[rgba(0,0,127,0.05)] p-8 rounded-3xl border border-white/40"
          >
            <div className="w-16 h-16 bg-slate-200 rounded-2xl animate-pulse mb-6" />
            <div className="h-5 w-3/4 bg-slate-200 rounded animate-pulse mb-3" />
            <div className="h-4 w-full bg-slate-100 rounded animate-pulse mb-2" />
            <div className="h-4 w-2/3 bg-slate-100 rounded animate-pulse mb-6" />
            <div className="pt-4 border-t border-[#00007F]/5">
              <div className="h-5 w-20 bg-slate-100 rounded-full animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
