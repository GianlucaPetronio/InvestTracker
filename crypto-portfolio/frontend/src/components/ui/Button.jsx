import { forwardRef } from 'react';

const variants = {
  primary:
    'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-md hover:shadow-lg',
  secondary:
    'border-2 border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800',
  danger:
    'bg-red-600 hover:bg-red-700 text-white',
  ghost:
    'text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800',
};

const sizes = {
  sm: 'px-3 py-1.5 text-sm rounded-lg',
  md: 'px-5 py-2.5 text-sm rounded-lg',
  lg: 'px-6 py-3 text-base rounded-xl',
};

const Button = forwardRef(function Button(
  {
    as: Component = 'button',
    variant = 'primary',
    size = 'md',
    loading = false,
    disabled = false,
    className = '',
    children,
    ...props
  },
  ref
) {
  const isDisabled = disabled || loading;

  return (
    <Component
      ref={ref}
      disabled={Component === 'button' ? isDisabled : undefined}
      className={`inline-flex items-center justify-center gap-2 font-semibold transition-all duration-200 ${
        variants[variant] || variants.primary
      } ${sizes[size] || sizes.md} ${
        isDisabled ? 'opacity-50 cursor-not-allowed' : ''
      } ${className}`}
      {...props}
    >
      {loading && (
        <svg
          className="w-4 h-4 animate-spin"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {children}
    </Component>
  );
});

export default Button;
