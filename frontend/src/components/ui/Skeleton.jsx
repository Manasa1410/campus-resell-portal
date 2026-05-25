export const SkeletonBlock = ({ className = "" }) => (
  <div className={`animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800 ${className}`} />
);

export const ProductGridSkeleton = ({ count = 6 }) => (
  <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
    {Array.from({ length: count }).map((_, index) => (
      <div key={index} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-md dark:border-slate-800 dark:bg-slate-900">
        <SkeletonBlock className="h-52 rounded-none" />
        <div className="space-y-3 p-4">
          <SkeletonBlock className="h-4 w-3/4" />
          <SkeletonBlock className="h-4 w-1/3" />
          <SkeletonBlock className="h-10 w-full" />
        </div>
      </div>
    ))}
  </div>
);

export default SkeletonBlock;
