export default function DashboardLoading() {
  return (
    <div className="theme-page">
      {/* Skeleton Nav */}
      <nav className="sticky top-0 z-50 theme-nav">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-theme-option-bg animate-pulse" />
            <div className="w-24 h-5 rounded-lg bg-theme-option-bg animate-pulse" />
          </div>
          <div className="flex items-center gap-3">
            <div className="w-20 h-8 rounded-lg bg-theme-option-bg animate-pulse hidden sm:block" />
            <div className="w-9 h-9 rounded-lg bg-theme-option-bg animate-pulse" />
          </div>
        </div>
      </nav>

      {/* Skeleton Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Back link skeleton */}
        <div className="w-40 h-4 rounded bg-theme-option-bg animate-pulse mb-6" />

        {/* Title skeleton */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-theme-option-bg animate-pulse" />
          <div className="space-y-2">
            <div className="w-48 h-7 rounded-lg bg-theme-option-bg animate-pulse" />
            <div className="w-64 h-4 rounded bg-theme-option-bg animate-pulse" />
          </div>
        </div>

        {/* Content cards skeleton */}
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-2xl p-6 theme-card animate-pulse">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-theme-option-bg" />
                <div className="flex-1 space-y-2">
                  <div className="w-3/4 h-4 rounded bg-theme-option-bg" />
                  <div className="w-1/2 h-3 rounded bg-theme-option-bg" />
                </div>
                <div className="w-16 h-8 rounded-lg bg-theme-option-bg" />
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
