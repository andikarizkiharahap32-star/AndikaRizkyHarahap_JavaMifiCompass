import React from 'react';

export type CardVariant = 'card' | 'flat' | 'raised' | 'sunken';
export type CardDensity = 'compact' | 'normal' | 'spacious';
export type CardRadius = 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  density?: CardDensity;
  radius?: CardRadius;
  hoverable?: boolean;
  interactive?: boolean;
  disabled?: boolean;
}

const variantClasses: Record<CardVariant, string> = {
  card: 'bg-paper border border-paper-edge border-b-2 text-primary',
  flat: 'bg-paper border border-paper-edge text-primary',
  raised: 'bg-paper border border-paper-edge border-b-4 text-primary',
  sunken: 'bg-sunken border border-paper-edge text-primary',
};

const densityClasses: Record<CardDensity, string> = {
  compact: 'p-4',
  normal: 'p-6',
  spacious: 'p-8',
};

const radiusClasses: Record<CardRadius, string> = {
  none: 'rounded-none',
  sm: 'rounded-sm',
  md: 'rounded-md',
  lg: 'rounded-lg',
  xl: 'rounded-xl',
  '2xl': 'rounded-2xl',
};

const interactiveClasses =
  'cursor-pointer hover:border-primary active:translate-y-0 active:bg-sunken transition-all duration-150 ease-out motion-safe:hover:-translate-y-1 motion-reduce:transform-none motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary';

const disabledClasses = 'opacity-60 cursor-not-allowed pointer-events-none';

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'card',
  density = 'normal',
  radius = '2xl',
  hoverable = false,
  interactive = false,
  disabled = false,
  className = '',
  onClick,
  onKeyDown,
  role,
  tabIndex,
  ...props
}) => {
  const isInteractive = (interactive || hoverable) && !disabled;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (isInteractive && onClick && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onClick(e as unknown as React.MouseEvent<HTMLDivElement>);
    }
    onKeyDown?.(e);
  };

  const classes = [
    variantClasses[variant],
    densityClasses[density],
    radiusClasses[radius],
    isInteractive ? interactiveClasses : '',
    disabled ? disabledClasses : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      role={isInteractive && !role ? 'button' : role}
      tabIndex={isInteractive && tabIndex === undefined ? 0 : tabIndex}
      aria-disabled={disabled ? true : undefined}
      onClick={disabled ? undefined : onClick}
      onKeyDown={handleKeyDown}
      className={classes}
      {...props}
    >
      {children}
    </div>
  );
};

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  className = '',
  ...props
}) => {
  const variants: Record<NonNullable<BadgeProps['variant']>, string> = {
    default: 'bg-sunken text-primary border border-paper-edge',
    success: 'bg-success-surface text-success border border-success/30',
    warning: 'bg-warning-surface text-warning border border-warning/30',
    danger: 'bg-danger-surface text-danger border border-danger/30',
    info: 'bg-primary-container text-on-primary border border-paper-edge',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
};
