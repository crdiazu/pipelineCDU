import React from 'react';
import {
  SlidersHorizontal,
  Download,
  Users,
  X,
} from 'lucide-react';
import { MonthlySummary } from '../utils/kpi';
import { CurrencyCode, formatCurrency } from '../data/pipeline';

export interface PersistentTimelineProps {
  monthlySeries: MonthlySummary[];
  rangeStartIdx: number;
  rangeEndIdx: number;
  onRangeChange: (start: number, end: number) => void;
  selectedPeriod: string;
  onSelectPeriod: (period: string) => void;
  selectedClient: string;
  onSelectClient: (client: string) => void;
  clientList: { client: string; count: number; won: number; open: number }[];
  currency: CurrencyCode;
  exchangeRate: number;
  totalDeals: number;
}

export function formatShortMonth(m: string): string {
  return m
    .replace('Enero ', 'Ene ')
    .replace('Febrero ', 'Feb ')
    .replace('Marzo ', 'Mar ')
    .replace('Abril ', 'Abr ')
    .replace('Mayo ', 'May ')
    .replace('Junio ', 'Jun ')
    .replace('Julio ', 'Jul ')
    .replace('Agosto ', 'Ago ')
    .replace('Septiembre ', 'Sep ')
    .replace('Octubre ', 'Oct ')
    .replace('Noviembre ', 'Nov ')
    .replace('Diciembre ', 'Dic ');
}

export const PersistentTimeline: React.FC<PersistentTimelineProps> = ({
  monthlySeries,
  rangeStartIdx,
  rangeEndIdx,
  onRangeChange,
  selectedPeriod,
  onSelectPeriod,
  selectedClient,
  onSelectClient,
  clientList,
  currency,
  exchangeRate,
  totalDeals,
}) => {
  const maxIdx = Math.max(1, monthlySeries.length - 1);
  const safeStart = Math.max(0, Math.min(rangeStartIdx, maxIdx));
  const safeEnd = Math.max(safeStart, Math.min(rangeEndIdx, maxIdx));

  // Determine indices for quick presets
  const idxJan2026 = monthlySeries.findIndex((m) => m.month === 'Enero 2026');
  const idxDec2026 = monthlySeries.findIndex((m) => m.month === 'Diciembre 2026');
  const idxJan2027 = monthlySeries.findIndex((m) => m.month === 'Enero 2027');
  const idxDec2027 = monthlySeries.findIndex((m) => m.month === 'Diciembre 2027');
  const idxNov2026 = monthlySeries.findIndex((m) => m.month === 'Noviembre 2026');

  const isFullRange =
    selectedPeriod === 'Todos' && safeStart === 0 && safeEnd === maxIdx;
  const isYear2026 =
    selectedPeriod === 'Todos' &&
    safeStart === (idxJan2026 >= 0 ? idxJan2026 : 0) &&
    safeEnd === (idxDec2026 >= 0 ? idxDec2026 : safeEnd);
  const isYear2027 =
    selectedPeriod === 'Todos' &&
    safeStart === (idxJan2027 >= 0 ? idxJan2027 : safeStart) &&
    safeEnd === (idxDec2027 >= 0 ? idxDec2027 : maxIdx);
  const isNovCurrent = selectedPeriod === 'Noviembre 2026';

  // Calculate sum of closedWon and pipeline in the active window
  const activeWindowMetrics = React.useMemo(() => {
    let won = 0;
    let pipe = 0;
    if (selectedPeriod !== 'Todos') {
      const match = monthlySeries.find((m) => m.month === selectedPeriod);
      if (match) {
        won = match.closedWon;
        pipe = match.pipelineOpen;
      }
    } else {
      for (let i = safeStart; i <= safeEnd; i++) {
        if (monthlySeries[i]) {
          won += monthlySeries[i].closedWon;
          pipe += monthlySeries[i].pipelineOpen;
        }
      }
    }
    return { won, pipe };
  }, [monthlySeries, safeStart, safeEnd, selectedPeriod]);

  const fmt = (v: number) => formatCurrency(v, currency, exchangeRate, true);

  // Percentages for the dual slider track
  const leftPct = (safeStart / maxIdx) * 100;
  const rightPct = (safeEnd / maxIdx) * 100;
  const widthPct = Math.max(1, rightPct - leftPct);

  return (
    <div className="sticky top-[45px] z-20 backdrop-blur-md bg-[#FFFDF8]/95 dark:bg-[#070C1C]/95 border-b border-[#DDD4C5] dark:border-slate-800/90 px-3 sm:px-5 py-1.5 shadow-sm transition-colors">
      <div className="flex flex-col gap-1.5 w-full">
        {/* Compact Single-Deck Power BI Slicer & Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
          {/* Left: Client Filter & Summary */}
          <div className="flex flex-wrap items-center gap-1.5">
            <div className="flex items-center gap-1.5 bg-white dark:bg-[#101D38] px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-700 shadow-sm">
              <Users className="w-3.5 h-3.5 text-[#2A5FFF] dark:text-[#00B4D8] shrink-0" />
              <select
                value={selectedClient}
                onChange={(e) => onSelectClient(e.target.value)}
                className="bg-transparent font-sans font-bold text-xs text-slate-900 dark:text-white focus:outline-none cursor-pointer max-w-[150px] sm:max-w-[190px] truncate"
              >
                <option value="Todos" className="bg-white dark:bg-[#0B132B] text-slate-900 dark:text-white">
                  Todos los Clientes ({clientList.length})
                </option>
                {clientList.map((c) => (
                  <option
                    key={c.client}
                    value={c.client}
                    className="bg-white dark:bg-[#0B132B] text-slate-900 dark:text-white"
                  >
                    {c.client} ({c.count} ops)
                  </option>
                ))}
              </select>
              {selectedClient !== 'Todos' && (
                <button
                  type="button"
                  onClick={() => onSelectClient('Todos')}
                  title="Limpiar filtro de cliente"
                  className="p-0.5 rounded text-slate-400 hover:text-rose-500"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="hidden xl:flex items-center gap-1.5 font-mono text-[11px]">
              <span className="text-emerald-700 dark:text-[#C6F432] font-bold px-2 py-0.5 rounded bg-emerald-500/10 dark:bg-emerald-500/20">
                Won: {fmt(activeWindowMetrics.won)}
              </span>
              {activeWindowMetrics.pipe > 0 && (
                <span className="text-[#2A5FFF] dark:text-[#00B4D8] font-bold px-2 py-0.5 rounded bg-[#2A5FFF]/10 dark:bg-[#00B4D8]/20">
                  Pipe: {fmt(activeWindowMetrics.pipe)}
                </span>
              )}
            </div>
          </div>

          {/* Center: Inline Power BI Dual Range Slicer ([Desde] ◯━━━━━◯ [Hasta]) */}
          <div className="flex-1 min-w-[280px] max-w-3xl flex items-center gap-2.5 bg-white/90 dark:bg-[#0A1226] px-3 py-1 rounded-xl border border-slate-200 dark:border-slate-800 shadow-inner">
            {/* Box 1: DESDE */}
            <div className="flex items-center gap-1 bg-slate-50 dark:bg-[#111C38] border border-[#2A5FFF]/40 dark:border-[#00B4D8]/50 px-2 py-0.5 rounded-lg shrink-0">
              <span className="text-[10px] font-mono uppercase text-slate-400 font-bold">
                Desde:
              </span>
              <select
                value={safeStart}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  onSelectPeriod('Todos');
                  onRangeChange(val, Math.max(val, safeEnd));
                }}
                className="bg-transparent font-serif font-bold text-xs text-slate-900 dark:text-[#00B4D8] focus:outline-none cursor-pointer"
              >
                {monthlySeries.map((m, idx) => (
                  <option
                    key={m.month}
                    value={idx}
                    disabled={idx > safeEnd}
                    className="bg-white dark:bg-[#0B132B] text-slate-900 dark:text-white font-sans"
                  >
                    {formatShortMonth(m.month)}
                  </option>
                ))}
              </select>
            </div>

            {/* Dual Slider Track */}
            <div className="relative flex-1 flex items-center py-2">
              <div className="relative w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800">
                <div
                  style={{
                    left: `${leftPct}%`,
                    width: `${widthPct}%`,
                  }}
                  className="absolute h-full rounded-full bg-gradient-to-r from-[#2A5FFF] to-[#00B4D8] dark:from-[#00B4D8] dark:to-[#C6F432]"
                />
              </div>

              {/* Left Thumb */}
              <input
                type="range"
                min={0}
                max={maxIdx}
                value={safeStart}
                onChange={(e) => {
                  const val = Math.min(Number(e.target.value), safeEnd);
                  onSelectPeriod('Todos');
                  onRangeChange(val, safeEnd);
                }}
                className="absolute left-0 w-full h-2 appearance-none bg-transparent pointer-events-none cursor-grab active:cursor-grabbing z-20 
                [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[#2A5FFF] dark:[&::-webkit-slider-thumb]:border-[#00B4D8] [&::-webkit-slider-thumb]:shadow hover:[&::-webkit-slider-thumb]:scale-125 transition-transform
                [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-[#2A5FFF] dark:[&::-moz-range-thumb]:border-[#00B4D8] [&::-moz-range-thumb]:shadow"
                title={`Desde: ${monthlySeries[safeStart]?.month}`}
              />

              {/* Right Thumb */}
              <input
                type="range"
                min={0}
                max={maxIdx}
                value={safeEnd}
                onChange={(e) => {
                  const val = Math.max(Number(e.target.value), safeStart);
                  onSelectPeriod('Todos');
                  onRangeChange(safeStart, val);
                }}
                className="absolute left-0 w-full h-2 appearance-none bg-transparent pointer-events-none cursor-grab active:cursor-grabbing z-30 
                [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-emerald-600 dark:[&::-webkit-slider-thumb]:border-[#C6F432] [&::-webkit-slider-thumb]:shadow hover:[&::-webkit-slider-thumb]:scale-125 transition-transform
                [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-emerald-600 dark:[&::-moz-range-thumb]:border-[#C6F432] [&::-moz-range-thumb]:shadow"
                title={`Hasta: ${monthlySeries[safeEnd]?.month}`}
              />
            </div>

            {/* Box 2: HASTA */}
            <div className="flex items-center gap-1 bg-slate-50 dark:bg-[#111C38] border border-emerald-500/40 dark:border-[#C6F432]/50 px-2 py-0.5 rounded-lg shrink-0">
              <span className="text-[10px] font-mono uppercase text-slate-400 font-bold">
                Hasta:
              </span>
              <select
                value={safeEnd}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  onSelectPeriod('Todos');
                  onRangeChange(Math.min(safeStart, val), val);
                }}
                className="bg-transparent font-serif font-bold text-xs text-slate-900 dark:text-[#C6F432] focus:outline-none cursor-pointer"
              >
                {monthlySeries.map((m, idx) => (
                  <option
                    key={m.month}
                    value={idx}
                    disabled={idx < safeStart}
                    className="bg-white dark:bg-[#0B132B] text-slate-900 dark:text-white font-sans"
                  >
                    {formatShortMonth(m.month)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Right: Quick Range Presets & Excel Download */}
          <div className="flex flex-wrap items-center gap-1">
            <button
              type="button"
              onClick={() => {
                onSelectPeriod('Todos');
                onRangeChange(0, maxIdx);
              }}
              className={`px-2 py-1 rounded-lg text-[11px] font-mono transition border ${
                isFullRange
                  ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900 dark:border-white font-bold'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400 dark:bg-[#101D38] dark:text-slate-300 dark:border-slate-700'
              }`}
            >
              Todo (24M)
            </button>

            {idxJan2026 >= 0 && idxDec2026 >= 0 && (
              <button
                type="button"
                onClick={() => {
                  onSelectPeriod('Todos');
                  onRangeChange(idxJan2026, idxDec2026);
                }}
                className={`px-2 py-1 rounded-lg text-[11px] font-mono transition border ${
                  isYear2026
                    ? 'bg-[#2A5FFF] text-white border-[#2A5FFF] dark:bg-[#00B4D8] dark:text-[#0B132B] font-bold'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400 dark:bg-[#101D38] dark:text-slate-300 dark:border-slate-700'
                }`}
              >
                2026
              </button>
            )}

            {idxJan2027 >= 0 && (
              <button
                type="button"
                onClick={() => {
                  onSelectPeriod('Todos');
                  onRangeChange(idxJan2027, idxDec2027 >= 0 ? idxDec2027 : maxIdx);
                }}
                className={`px-2 py-1 rounded-lg text-[11px] font-mono transition border ${
                  isYear2027
                    ? 'bg-[#2A5FFF] text-white border-[#2A5FFF] dark:bg-[#00B4D8] dark:text-[#0B132B] font-bold'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400 dark:bg-[#101D38] dark:text-slate-300 dark:border-slate-700'
                }`}
              >
                2027
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                onSelectPeriod('Noviembre 2026');
                if (idxNov2026 >= 0) onRangeChange(idxNov2026, idxNov2026);
              }}
              className={`px-2 py-1 rounded-lg text-[11px] font-mono transition border flex items-center gap-1 ${
                isNovCurrent
                  ? 'bg-emerald-600 text-white border-emerald-600 dark:bg-[#C6F432] dark:text-[#0B132B] dark:border-[#C6F432] font-bold'
                  : 'bg-white text-slate-700 border-emerald-500/40 hover:border-emerald-500 dark:bg-[#101D38] dark:text-slate-200 dark:border-emerald-500/40'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-[#C6F432] animate-pulse" />
              Nov 26
            </button>

            <a
              href="./CDU%20Pipeline%20Forecast%20-%20REPARADO.xlsx"
              download="CDU Pipeline Forecast - REPARADO.xlsx"
              title="Descargar libro maestro Excel (.xlsx) con 112 negocios"
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition shadow-sm"
            >
              <Download className="w-3 h-3" />
              <span>Excel ({totalDeals})</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PersistentTimeline;
