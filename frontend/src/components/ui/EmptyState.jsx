import Button from "./Button";

const EmptyState = ({ title, description, actionLabel, actionTo, icon }) => (
  <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900">
    <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-300">
      {icon}
    </div>
    <h3 className="text-lg font-bold text-slate-950 dark:text-white">{title}</h3>
    <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">{description}</p>
    {actionLabel && actionTo && (
      <Button as="a" href={actionTo} className="mt-5">
        {actionLabel}
      </Button>
    )}
  </div>
);

export default EmptyState;
