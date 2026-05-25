const Card = ({ as: Component = "div", className = "", children, hover = false, ...props }) => (
  <Component
    className={`rounded-xl border border-slate-200 bg-white shadow-md transition-all duration-200 dark:border-slate-800 dark:bg-slate-900 ${
      hover ? "hover:-translate-y-1 hover:shadow-lg" : ""
    } ${className}`}
    {...props}
  >
    {children}
  </Component>
);

export default Card;
