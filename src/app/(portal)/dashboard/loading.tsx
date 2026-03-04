export default function DashboardLoading() {
  return (
    <>
      {/* Search bar skeleton */}
      <div className="max-w-4xl mx-auto mb-16">
        <div className="h-10 w-64 bg-slate-200 rounded-lg animate-pulse mb-8" />
        <div className="h-16 bg-white rounded-2xl animate-pulse border border-slate-100" />
      </div>

      {/* Grid skeleton */}
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="h-6 w-32 bg-slate-200 rounded-lg animate-pulse" />
            <div className="h-4 w-56 bg-slate-200 rounded-lg animate-pulse mt-2" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="bg-white/50 p-8 rounded-3xl border border-white/40 animate-pulse"
            >
              <div className="w-16 h-16 bg-slate-200 rounded-2xl mb-6" />
              <div className="h-5 w-3/4 bg-slate-200 rounded-lg mb-3" />
              <div className="space-y-2 mb-6">
                <div className="h-3 w-full bg-slate-200 rounded" />
                <div className="h-3 w-5/6 bg-slate-200 rounded" />
                <div className="h-3 w-2/3 bg-slate-200 rounded" />
              </div>
              <div className="pt-4 border-t border-slate-100">
                <div className="h-5 w-20 bg-slate-200 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
