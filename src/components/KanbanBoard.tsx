import React from 'react';
import { DealRow, CurrencyCode, formatCurrency } from '../data/pipeline';

interface Props {
  data: DealRow[];
  currency: CurrencyCode;
  exchangeRate: number;
  onSelectDeal: (deal: DealRow) => void;
}

const KANBAN_COLUMNS = [
  {
    key: 'Early',
    title: '1. Detección / Calificación',
    stages: ['Prospección', 'Levantamiento', 'Calificación'],
    accent: 'border-slate-500/40',
    badgeClass: 'bg-slate-500/15 text-slate-600 dark:text-slate-300',
  },
  {
    key: 'Cotización',
    title: '2. Cotización Activa',
    stages: ['Cotización'],
    accent: 'border-[#00B4D8]/50',
    badgeClass: 'bg-[#00B4D8]/15 text-[#0077B6] dark:text-[#00B4D8]',
  },
  {
    key: 'Propuesta',
    title: '3. Propuesta / Negociación',
    stages: ['Propuesta', 'Negociación'],
    accent: 'border-amber-500/50',
    badgeClass: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
  },
  {
    key: 'Cierre',
    title: '4. Aprobación / OC (Commit)',
    stages: ['Aprobación / OC'],
    accent: 'border-[#C6F432]/60',
    badgeClass: 'bg-emerald-500/15 text-emerald-700 dark:text-[#C6F432]',
  },
];

export const KanbanBoard: React.FC<Props> = ({
  data,
  currency,
  exchangeRate,
  onSelectDeal,
}) => {
  const openDeals = data.filter((d) => d.status === 'Abierta');
  const fmt = (val: number, compact = false) =>
    formatCurrency(val, currency, exchangeRate, compact);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      {KANBAN_COLUMNS.map((col) => {
        const items = openDeals
          .filter((d) => col.stages.includes(d.stage))
          .sort((a, b) => b.estimatedAmount - a.estimatedAmount);
        const totalCol = items.reduce((s, d) => s + d.estimatedAmount, 0);
        const weightedCol = items.reduce((s, d) => s + d.weightedPipeline, 0);

        return (
          <div
            key={col.key}
            className="rounded-xl border bg-white/95 border-[#DDD4C5] dark:bg-[#101D38]/90 dark:border-slate-800/80 flex flex-col max-h-[680px]"
          >
            {/* Column Header */}
            <div className={`p-3.5 border-b-2 ${col.accent} bg-slate-50/60 dark:bg-[#0B132B]/60 rounded-t-xl`}>
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-xs font-serif font-bold text-slate-900 dark:text-white">
                  {col.title}
                </h4>
                <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-full ${col.badgeClass}`}>
                  {items.length}
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] font-mono mt-1.5 text-slate-500 dark:text-slate-400">
                <span>Bruto: {fmt(totalCol, true)}</span>
                <span className="text-emerald-700 dark:text-[#C6F432]">
                  Pond: {fmt(weightedCol, true)}
                </span>
              </div>
            </div>

            {/* Cards List */}
            <div className="p-3 space-y-2.5 overflow-y-auto flex-1">
              {items.map((deal) => (
                <div
                  key={deal.id}
                  onClick={() => onSelectDeal(deal)}
                  className="p-3 rounded-lg border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#0B132B]/90 hover:border-[#2A5FFF] dark:hover:border-[#00B4D8] transition cursor-pointer shadow-sm"
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-[10px] font-mono font-semibold text-[#2A5FFF] dark:text-[#00B4D8]">
                      {deal.code}
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-[#101D38] text-slate-600 dark:text-slate-300">
                      {deal.probability}% · {deal.forecastCategory}
                    </span>
                  </div>

                  <div className="text-xs font-bold text-slate-900 dark:text-white">
                    {deal.client}
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 line-clamp-2 mt-0.5">
                    {deal.opportunity}
                  </p>

                  <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-[#101D38] text-slate-600 dark:text-slate-400 truncate max-w-[110px]">
                      {deal.brand}
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-900 dark:text-white">
                      {fmt(deal.estimatedAmount, false)}
                    </span>
                  </div>
                </div>
              ))}
              {items.length === 0 && (
                <p className="text-xs text-center text-slate-400 py-8">
                  Sin oportunidades en esta fase
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default KanbanBoard;

