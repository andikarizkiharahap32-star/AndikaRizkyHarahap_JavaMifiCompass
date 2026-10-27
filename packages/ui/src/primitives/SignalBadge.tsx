import React from 'react';

export interface SignalBadgeProps {
  strength?: 1 | 2 | 3 | 4;
  label?: string;
  className?: string;
}

export const SignalBadge: React.FC<SignalBadgeProps> = ({
  strength = 4,
  label,
  className = '',
}) => {
  const heights = ['h-1.5', 'h-2.5', 'h-3.5', 'h-4.5'];

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-sky-50 dark:bg-slate-800 text-sky-800 dark:text-sky-300 border border-sky-200 dark:border-sky-900 ${className}`}
      aria-label={`Signal strength ${strength} of 4`}
    >
      <div className="flex items-end gap-0.5 h-4" aria-hidden="true">
        {[1, 2, 3, 4].map((bar) => {
          const isActive = bar <= strength;
          return (
            <span
              key={bar}
              className={`w-1 rounded-sm transition-all duration-300 ${heights[bar - 1]} ${
                isActive
                  ? strength === 4
                    ? 'bg-emerald-500'
                    : strength === 3
                    ? 'bg-sky-500'
                    : strength === 2
                    ? 'bg-amber-500'
                    : 'bg-rose-500'
                  : 'bg-slate-300 dark:bg-slate-700'
              }`}
            />
          );
        })}
      </div>
      {label && <span>{label}</span>}
    </div>
  );
};
