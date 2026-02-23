export default function Card({
  children,
  hover = false,
  noPadding = false,
  header,
  className = '',
}) {
  return (
    <div
      className={`bg-white dark:bg-slate-800 rounded-xl border border-gray-200/50 dark:border-slate-700 shadow-sm dark:shadow-lg dark:shadow-black/20 transition-all duration-200 ${
        hover ? 'hover:shadow-md hover:-translate-y-0.5' : ''
      } ${className}`}
    >
      {header && (
        <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-700">
          {typeof header === 'string' ? (
            <h2 className="text-lg font-semibold text-gray-800 dark:text-slate-100">
              {header}
            </h2>
          ) : (
            header
          )}
        </div>
      )}
      {noPadding ? children : <div className="p-6">{children}</div>}
    </div>
  );
}
