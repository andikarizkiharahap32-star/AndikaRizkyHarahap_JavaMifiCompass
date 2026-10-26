import React from 'react';

export interface MenuTicketChitProps {
  id: string;
  nameOriginal: string;
  nameId: string;
  nameEn: string;
  category: string;
  sourceDescription?: string;
  explainerId?: string;
  formattedLocal: string;
  formattedIdr: string;
  rateDate?: string;
  isHalal?: boolean;
  flags?: string[];
  className?: string;
}

/**
 * MenuTicketChit
 * Rendered in the Google Stitch tactile paper ticket format:
 * Crisp white card, subtle perforation line, dual-currency pricing (Local + IDR),
 * and transparent dietary indicators.
 */
export const MenuTicketChit: React.FC<MenuTicketChitProps> = ({
  nameOriginal,
  nameId,
  nameEn,
  category,
  sourceDescription,
  explainerId,
  formattedLocal,
  formattedIdr,
  rateDate,
  isHalal = true,
  flags = [],
  className = '',
}) => {
  return (
    <div
      className={`relative bg-white border border-[#D8DDD9] rounded-lg p-3.5 shadow-sm transition hover:shadow-md ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] uppercase font-mono tracking-wider font-semibold text-[#6B7570] bg-[#EDF0EE] px-1.5 py-0.5 rounded">
              {category}
            </span>
            {isHalal ? (
              <span className="text-[10px] font-bold text-[#047857] bg-[#D1FAE5] px-1.5 py-0.5 rounded-full">
                HALAL
              </span>
            ) : (
              <span className="text-[10px] font-bold text-[#B91C1C] bg-[#FEE2E2] px-1.5 py-0.5 rounded-full">
                NON-HALAL
              </span>
            )}
          </div>

          <h4 className="text-sm font-bold text-[#18215A] leading-tight">
            {nameId || nameEn}{' '}
            {nameOriginal && nameOriginal !== (nameId || nameEn) && (
              <span className="text-xs font-normal text-[#6B7570] ml-1">
                ({nameOriginal})
              </span>
            )}
          </h4>

          {explainerId && (
            <p className="text-xs text-[#475569] mt-1 leading-relaxed">
              {explainerId}
            </p>
          )}

          {sourceDescription && !explainerId && (
            <p className="text-xs text-[#64748B] mt-1 italic">
              {sourceDescription}
            </p>
          )}

          {flags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {flags.map((flag) => (
                <span
                  key={flag}
                  className="text-[9px] font-mono uppercase bg-[#F1F5F9] text-[#475569] px-1.5 py-0.2 rounded"
                >
                  {flag.replace(/_/g, ' ')}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Dual Currency Price Chit */}
        <div className="text-right flex-shrink-0 bg-[#EDF0EE] border border-[#D8DDD9] rounded-md px-2.5 py-1.5">
          <div className="text-sm font-extrabold font-mono text-[#18215A]">
            {formattedLocal}
          </div>
          <div className="text-[11px] font-bold text-[#059669]">
            ≈ {formattedIdr}
          </div>
          {rateDate && (
            <div className="text-[8px] font-mono text-[#6B7570] mt-0.5">
              Kurs {rateDate}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
