import React from 'react';
import {
  SlidersHorizontal,
  RotateCcw,
  Calendar,
  Sparkles,
  Download,
  Users,
  X,
  ChevronDown,
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
    <div className="sticky top-[53px] sm:top-[57px] z-20 backdrop-blur-md bg-[#FFFDF8]/95 dark:bg-[#070C1C]/95 border-b border-[#DDD4C5] dark:border-slate-800/90 px-3 sm:px-6 py-2 shadow-sm transition-colors">
      <div className="flex flex-col gap-2 max-w-[1600px] mx-auto">
        {/* Top Mini Navigation Bar: Client Filter, Presets & Excel Download */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          {/* Left: Client Filter & Summary */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Client Filter Dropdown */}
            <div className="flex items-center gap-2 bg-white dark:bg-[#101D38] px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 shadow-sm">
              <Users className="w-4 h-4 text-[#2A5FFF] dark:text-[#00B4D8] shrink-0" />
              <select
                value={selectedClient}
                onChange={(e) => onSelectClient(e.target.value)}
                className="bg-transparent font-sans font-bold text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none cursor-pointer max-w-[160px] sm:max-w-[220px] truncate"
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
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Metrics in Active Range */}
            <div className="flex items-center gap-2 font-mono text-xs">
              <span className="text-emerald-700 dark:text-[#C6F432] font-bold px-2 py-0.5 rounded bg-emerald-500/10 dark:bg-emerald-500/20">
                Won: {fmt(activeWindowMetrics.won)}
              </span>
              {activeWindowMetrics.pipe > 0 && (
                <span className="text-[#2A5FFF] dark:text-[#00B4D8] font-bold px-2 py-0.5 rounded bg-[#2A5FFF]/10 dark:bg-[#00B4D8]/20 hidden sm:inline">
                  Pipe: {fmt(activeWindowMetrics.pipe)}
                </span>
              )}
            </div>
          </div>

          {/* Right: Quick Range Presets & Excel Download */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                onSelectPeriod('Todos');
                onRangeChange(0, maxIdx);
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono transition border ${
                isFullRange
                  ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900 dark:border-white font-bold shadow-sm'
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
                className={`px-2.5 py-1 rounded-lg text-xs font-mono transition border ${
                  isYear2026
                    ? 'bg-[#2A5FFF] text-white border-[#2A5FFF] dark:bg-[#00B4D8] dark:text-[#0B132B] font-bold shadow-sm'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400 dark:bg-[#101D38] dark:text-slate-300 dark:border-slate-700'
                }`}
              >
                Año 2026
              </button>
            )}

            {idxJan2027 >= 0 && (
              <button
                type="button"
                onClick={() => {
                  onSelectPeriod('Todos');
                  onRangeChange(idxJan2027, idxDec2027 >= 0 ? idxDec2027 : maxIdx);
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono transition border ${
                  isYear2027
                    ? 'bg-[#2A5FFF] text-white border-[#2A5FFF] dark:bg-[#00B4D8] dark:text-[#0B132B] font-bold shadow-sm'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400 dark:bg-[#101D38] dark:text-slate-300 dark:border-slate-700'
                }`}
              >
                Año 2027
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                onSelectPeriod('Noviembre 2026');
                if (idxNov2026 >= 0) onRangeChange(idxNov2026, idxNov2026);
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono transition border flex items-center gap-1.5 ${
                isNovCurrent
                  ? 'bg-emerald-600 text-white border-emerald-600 dark:bg-[#C6F432] dark:text-[#0B132B] dark:border-[#C6F432] font-bold shadow-sm'
                  : 'bg-white text-slate-700 border-emerald-500/40 hover:border-emerald-500 dark:bg-[#101D38] dark:text-slate-200 dark:border-emerald-500/40'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-[#C6F432] animate-pulse" />
              Nov 26 (Actual)
            </button>

            {/* Excel Download link */}
            <a
              href="./CDU%20Pipeline%20Forecast%20-%20REPARADO.xlsx"
              download="CDU Pipeline Forecast - REPARADO.xlsx"
              title="Descargar libro maestro Excel (.xlsx) con 112 negocios y fórmulas nativas"
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition shadow-sm ml-1"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Excel ({totalDeals})</span>
            </a>
          </div>
        </div>

        {/* POWER BI SLICER CARD (Réplica exacta visual de Slicer Power BI con Cajas Desde/Hasta + Deslizador Dual) */}
        <div className="p-3 sm:p-4 rounded-2xl bg-white/95 dark:bg-[#0A1226] border-2 border-slate-200 dark:border-slate-800 shadow-md">
          {/* Slicer Header & Range Display Boxes (Exact Power BI Style) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-[#2A5FFF] dark:text-[#00B4D8]" />
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Slicer de Rango Temporal
              </span>
              <span className="text-xs font-mono text-slate-400">
                ({safeEnd - safeStart + 1} de {monthlySeries.length} meses)
              </span>
            </div>

            {/* Power BI Dual Date Boxes */}
            <div className="flex items-center gap-3">
              {/* Box 1: DESDE */}
              <div className="flex items-center gap-2 bg-slate-50 dark:bg-[#111C38] border-2 border-[#2A5FFF]/50 dark:border-[#00B4D8]/60 px-3.5 py-1.5 rounded-xl shadow-inner">
                <span className="text-[11px] font-mono uppercase text-slate-500 dark:text-slate-400 font-bold">
                  Desde:
                </span>
                <select
                  value={safeStart}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    onSelectPeriod('Todos');
                    onRangeChange(val, Math.max(val, safeEnd));
                  }}
                  className="bg-transparent font-serif font-black text-sm sm:text-base text-slate-900 dark:text-[#00B4D8] focus:outline-none cursor-pointer"
                >
                  {monthlySeries.map((m, idx) => (
                    <option
                      key={m.month}
                      value={idx}
                      disabled={idx > safeEnd}
                      className="bg-white dark:bg-[#0B132B] text-slate-900 dark:text-white font-sans"
                    >
                      {m.month}
                    </option>
                  ))}
                </select>
              </div>

              <span className="text-slate-400 font-mono font-bold text-sm">→</span>

              {/* Box 2: HASTA */}
              <div className="flex items-center gap-2 bg-slate-50 dark:bg-[#111C38] border-2 border-emerald-500/50 dark:border-[#C6F432]/60 px-3.5 py-1.5 rounded-xl shadow-inner">
                <span className="text-[11px] font-mono uppercase text-slate-500 dark:text-slate-400 font-bold">
                  Hasta:
                </span>
                <select
                  value={safeEnd}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    onSelectPeriod('Todos');
                    onRangeChange(Math.min(safeStart, val), val);
                  }}
                  className="bg-transparent font-serif font-black text-sm sm:text-base text-slate-900 dark:text-[#C6F432] focus:outline-none cursor-pointer"
                >
                  {monthlySeries.map((m, idx) => (
                    <option
                      key={m.month}
                      value={idx}
                      disabled={idx < safeStart}
                      className="bg-white dark:bg-[#0B132B] text-slate-900 dark:text-white font-sans"
                    >
                      {m.month}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* DUAL-THUMB RANGE SLIDER TRACK (Power BI Slider Line with 2 Circular Knobs) */}
          <div className="relative w-full py-3 px-2">
            {/* Background Base Bar */}
            <div className="relative w-full h-3 rounded-full bg-slate-200 dark:bg-slate-800">
              {/* Highlighted Active Range Segment */}
              <div
                style={{
                  left: `${leftPct}%`,
                  width: `${widthPct}%`,
                }}
                className="absolute h-full rounded-full bg-gradient-to-r from-[#2A5FFF] to-[#00B4D8] dark:from-[#00B4D8] dark:to-[#C6F432] shadow-md transition-all"
              />
            </div>

            {/* Left Thumb Input */}
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
              className="absolute left-0 top-3 w-full h-3 appearance-none bg-transparent pointer-events-none cursor-grab active:cursor-grabbing z-20 
              [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:w-7 [&::-webkit-slider-thumb]:h-7 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-[#2A5FFF] dark:[&::-webkit-slider-thumb]:border-[#00B4D8] [&::-webkit-slider-thumb]:shadow-xl hover:[&::-webkit-slider-thumb]:scale-125 transition-transform
              [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:w-7 [&::-moz-range-thumb]:h-7 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-4 [&::-moz-range-thumb]:border-[#2A5FFF] dark:[&::-moz-range-thumb]:border-[#00B4D8] [&::-moz-range-thumb]:shadow-xl hover:[&::-moz-range-thumb]:scale-125 transition-transform"
              title={`Desde: ${monthlySeries[safeStart]?.month}`}
            />

            {/* Right Thumb Input */}
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
              className="absolute left-0 top-3 w-full h-3 appearance-none bg-transparent pointer-events-none cursor-grab active:cursor-grabbing z-30 
              [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:w-7 [&::-webkit-slider-thumb]:h-7 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-emerald-600 dark:[&::-webkit-slider-thumb]:border-[#C6F432] [&::-webkit-slider-thumb]:shadow-xl hover:[&::-webkit-slider-thumb]:scale-125 transition-transform
              [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:w-7 [&::-moz-range-thumb]:h-7 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-4 [&::-moz-range-thumb]:border-emerald-600 dark:[&::-moz-range-thumb]:border-[#C6F432] [&::-moz-range-thumb]:shadow-xl hover:[&::-moz-range-thumb]:scale-125 transition-transform"
              title={`Hasta: ${monthlySeries[safeEnd]?.month}`}
            />

            {/* Reference Tick Labels Below the Bar */}
            <div className="flex justify-between items-center text-[10px] sm:text-xs font-mono text-slate-400 mt-4 px-1 select-none">
              <span className="font-bold text-slate-700 dark:text-slate-200">Ene 2026</span>
              <span className="hidden sm:inline">Jul 2026</span>
              <span className="font-bold text-[#2A5FFF] dark:text-[#00B4D8]">Dic 2026 (Cierre Anual)</span>
              <span className="hidden sm:inline">Jun 2027</span>
              <span className="font-bold text-emerald-600 dark:text-[#C6F432]">Dic 2027</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PersistentTimeline;
