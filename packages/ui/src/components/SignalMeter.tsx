import React from 'react';

export interface SignalMeterProps {
  usedMb: number;
  totalMb?: number | null; // null = unlimited
  className?: string;
  label?: string;
}

export const SignalMeter: React.FC<SignalMeterProps> = ({
  usedMb,
  totalMb,
  className = '',
  label = 'Data Usage',
}) => {
  const isUnlimited = totalMb === null || totalMb === undefined;
  const percentage = isUnlimited ? 0 : Math.min(100, Math.round((usedMb / totalMb) * 100));

  const formatData = (mb: number) => {
    if (mb >= 1024) {
      return `${(mb / 1024).toFixed(1)} GB`;
    }
    return `${mb} MB`;
  };

  const getMeterColor = (pct: number) => {
    if (pct >= 90) return 'bg-rose-500';
    if (pct >= 75) return 'bg-amber-500';
    return 'bg-sky-500';
  };

  return (
    <div className={`p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</span>
        <span className="text-xs font-semibold text-sky-600 dark:text-sky-400">
          {isUnlimited ? `${formatData(usedMb)} used (Unlimited)` : `${percentage}% used`}
        </span>
      </div>

      <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 overflow-hidden p-0.5">
        <div
          className={`h-full rounded-full transition-all duration-500 ${getMeterColor(percentage)}`}
          style={{ width: isUnlimited ? '100%' : `${percentage}%` }}
        />
      </div>

      <div className="flex justify-between items-center mt-2 text-xs text-slate-500">
        <span>{formatData(usedMb)} used</span>
        <span>{isUnlimited ? '∞ Unlimited' : `${formatData(totalMb)} total`}</span>
      </div>
    </div>
  );
};
