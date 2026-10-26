import React from 'react';

export interface RouteStop {
  id: string;
  name: string;
  countryCode?: string;
  flag?: string;
  dates?: string;
  status?: 'past' | 'current' | 'upcoming';
}

export interface RouteLineProps {
  stops: RouteStop[];
  orientation?: 'horizontal' | 'vertical';
  className?: string;
}

export const RouteLine: React.FC<RouteLineProps> = ({
  stops,
  orientation = 'horizontal',
  className = '',
}) => {
  if (orientation === 'vertical') {
    return (
      <div className={`relative pl-6 space-y-6 ${className}`}>
        {/* Continuous vertical dashed line */}
        <div className="absolute left-2.5 top-2 bottom-2 w-0.5 border-l-2 border-dashed border-sky-300 dark:border-sky-800" />

        {stops.map((stop, idx) => (
          <div key={stop.id || idx} className="relative flex items-start gap-3">
            {/* Dot */}
            <div
              className={`absolute -left-6 top-1 w-5 h-5 rounded-full border-2 flex items-center justify-center text-[10px] font-bold ${
                stop.status === 'current'
                  ? 'bg-sky-500 border-white ring-4 ring-sky-100 dark:ring-sky-950 text-white'
                  : stop.status === 'past'
                  ? 'bg-emerald-500 border-white text-white'
                  : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-500'
              }`}
            >
              {idx + 1}
            </div>
            <div>
              <div className="flex items-center gap-2">
                {stop.flag && <span className="text-base">{stop.flag}</span>}
                <span className="font-semibold text-sm text-slate-900 dark:text-slate-100">{stop.name}</span>
              </div>
              {stop.dates && <p className="text-xs text-slate-500 mt-0.5">{stop.dates}</p>}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={`flex items-center w-full overflow-x-auto py-4 ${className}`}>
      {stops.map((stop, idx) => (
        <React.Fragment key={stop.id || idx}>
          <div className="flex flex-col items-center min-w-[100px] text-center">
            <div
              className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold text-xs mb-1.5 transition-all ${
                stop.status === 'current'
                  ? 'bg-sky-500 border-sky-500 text-white ring-4 ring-sky-100 dark:ring-sky-950 shadow-md'
                  : stop.status === 'past'
                  ? 'bg-emerald-500 border-emerald-500 text-white'
                  : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-500'
              }`}
            >
              {stop.flag || idx + 1}
            </div>
            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[90px]">
              {stop.name}
            </span>
            {stop.dates && <span className="text-[10px] text-slate-500">{stop.dates}</span>}
          </div>

          {idx < stops.length - 1 && (
            <div className="flex-1 h-0.5 border-t-2 border-dashed border-sky-300 dark:border-sky-800 mx-2 min-w-[24px]" />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};
