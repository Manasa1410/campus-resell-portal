const tones = {
  available: "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-200 dark:ring-emerald-900",
  sold: "bg-slate-100 text-slate-700 ring-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-700",
  blue: "bg-blue-50 text-blue-700 ring-blue-200 dark:bg-blue-950/40 dark:text-blue-200 dark:ring-blue-900",
  purple: "bg-purple-50 text-purple-700 ring-purple-200 dark:bg-purple-950/40 dark:text-purple-200 dark:ring-purple-900",
  red: "bg-red-50 text-red-700 ring-red-200 dark:bg-red-950/40 dark:text-red-200 dark:ring-red-900",
};

const Badge = ({ tone = "blue", children, className = "" }) => (
  <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ring-1 ${tones[tone] || tones.blue} ${className}`}>
    {children}
  </span>
);

export default Badge;
