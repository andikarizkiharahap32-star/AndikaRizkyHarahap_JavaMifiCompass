import React from 'react';

export interface SignalLoaderProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  label?: string;
}

export const SignalLoader: React.FC<SignalLoaderProps> = ({
  size = 'md',
  className = '',
  label,
}) => {
  const sizeClasses = {
    sm: { bar: 'w-1', container: 'h-4 gap-0.5' },
    md: { bar: 'w-1.5', container: 'h-6 gap-1' },
    lg: { bar: 'w-2', container: 'h-8 gap-1.5' },
  }[size];

  return (
    <div className={`inline-flex flex-col items-center justify-center gap-2 ${className}`}>
      <div className={`flex items-end ${sizeClasses.container}`} role="status" aria-label="Loading connection">
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className={`${sizeClasses.bar} bg-sky-500 rounded-sm animate-pulse`}
            style={{
              height: `${25 * (i + 1)}%`,
              animationDelay: `${i * 150}ms`,
              animationDuration: '1s',
            }}
          />
        ))}
      </div>
      {label && <p className="text-xs text-slate-500 font-medium">{label}</p>}
    </div>
  );
};
