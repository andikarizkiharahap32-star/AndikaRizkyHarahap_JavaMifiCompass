import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  className = '',
  disabled,
  type = 'button',
  ...props
}) => {
  // Base styles strictly honoring DESIGN.md (rounded token, min-h-12 house touch-target, focus ring)
  const baseStyles =
    'inline-flex items-center justify-center font-bold font-sans uppercase tracking-wider rounded transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer select-none';

  // Semantic token color variants (P16-WS01 to WS03, WS21 to WS26)
  const variants = {
    primary:
      'bg-primary hover:bg-primary-hover active:bg-primary-pressed text-on-primary border border-primary',
    secondary:
      'bg-surface hover:bg-paper active:bg-surface text-primary border border-paper-edge',
    outline:
      'bg-transparent hover:bg-paper active:bg-surface text-primary border border-paper-edge',
    ghost:
      'bg-transparent hover:bg-paper active:bg-surface text-secondary hover:text-primary border border-transparent',
    danger:
      'bg-danger hover:bg-danger text-on-error active:bg-danger border border-danger',
  };

  // Touch target sizing (P16-WS12, WS31 - minimum 48px house touch target across all sizes)
  const sizes = {
    sm: 'min-h-12 h-12 px-4 text-xs',
    md: 'min-h-12 h-12 px-6 text-xs',
    lg: 'min-h-13 h-13 px-8 text-sm',
  };

  const isDisabled = disabled || isLoading;

  return (
    <button
      type={type}
      aria-busy={isLoading}
      aria-disabled={isDisabled}
      disabled={isDisabled}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {isLoading ? (
        <span className="inline-flex items-center gap-2" role="status" aria-live="polite">
          <svg
            className="animate-spin motion-reduce:animate-none h-4 w-4 shrink-0 text-current"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
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
          <span className="sr-only">Loading...</span>
          <span>{children}</span>
        </span>
      ) : (
        children
      )}
    </button>
  );
};
