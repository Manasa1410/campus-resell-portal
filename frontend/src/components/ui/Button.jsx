const variants = {
  primary: "bg-blue-600 text-white shadow-md shadow-blue-100 hover:bg-blue-700 dark:shadow-none",
  secondary: "border border-slate-200 bg-white text-slate-800 hover:border-blue-200 hover:text-blue-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100",
  dark: "bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950",
  danger: "border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200",
  ghost: "text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white",
};

const sizes = {
  sm: "px-3 py-2 text-xs",
  md: "px-4 py-2.5 text-sm",
  lg: "px-5 py-3 text-sm",
};

const Button = ({ as: Component = "button", variant = "primary", size = "md", className = "", children, ...props }) => (
  <Component
    className={`inline-flex items-center justify-center gap-2 rounded-xl font-bold transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 disabled:pointer-events-none disabled:opacity-50 ${variants[variant]} ${sizes[size]} ${className}`}
    {...props}
  >
    {children}
  </Component>
);

export default Button;
