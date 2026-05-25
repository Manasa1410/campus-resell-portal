const DropdownMenu = ({ children, align = "right", className = "" }) => (
  <div
    className={`absolute top-full z-40 mt-2 w-52 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 text-sm shadow-xl dark:border-slate-800 dark:bg-slate-900 ${
      align === "left" ? "left-0" : "right-0"
    } ${className}`}
  >
    {children}
  </div>
);

export const DropdownItem = ({ children, danger, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`block w-full px-4 py-2.5 text-left font-medium transition ${
      danger
        ? "text-red-600 hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-950/40"
        : "text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
    }`}
  >
    {children}
  </button>
);

export default DropdownMenu;
