const Loader = () => {
  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <div className="w-full max-w-4xl space-y-6">
        <div className="h-10 w-48 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
        <div className="grid gap-6 md:grid-cols-3">
          <div className="h-64 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
          <div className="h-64 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800 md:col-span-2" />
        </div>
      </div>
    </div>
  );
};

export default Loader;
