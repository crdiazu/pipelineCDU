import React from 'react';
import {
  SlidersHorizontal,
  RotateCcw,
  Calendar,
  Sparkles,
  Download,
  CheckCircle2,
  TrendingUp,
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
  const safeStart = Math.max(0, Math.min(rangeStartIdx, monthlySeries.length - 1));
  const safeEnd = Math.max(safeStart, Math.min(rangeEndIdx, monthlySeries.length - 1));

  // Determine indices for quick presets
  const idxJan2026 = monthlySeries.findIndex((m) => m.month === 'Enero 2026');
  const idxDec2026 = monthlySeries.findIndex((m) => m.month === 'Diciembre 2026');
  const idxOct2026 = monthlySeries.findIndex((m) => m.month === 'Octubre 2026');
  const idxNov2026 = monthlySeries.findIndex((m) => m.month === 'Noviembre 2026');
  const idxJan2027 = monthlySeries.findIndex((m) => m.month === 'Enero 2027');
  const idxDec2027 = monthlySeries.findIndex((m) => m.month === 'Diciembre 2027');

  const isFullRange =
    selectedPeriod === 'Todos' && safeStart === 0 && safeEnd === monthlySeries.length - 1;
  const isYear2026 =
    selectedPeriod === 'Todos' &&
    safeStart === (idxJan2026 >= 0 ? idxJan2026 : 0) &&
    safeEnd === (idxDec2026 >= 0 ? idxDec2026 : safeEnd);
  const isYear2027 =
    selectedPeriod === 'Todos' &&
    safeStart === (idxJan2027 >= 0 ? idxJan2027 : safeStart) &&
    safeEnd === (idxDec2027 >= 0 ? idxDec2027 : monthlySeries.length - 1);
  const isQ4 =
    selectedPeriod === 'Todos' &&
    safeStart === (idxOct2026 >= 0 ? idxOct2026 : safeStart) &&
    safeEnd === (idxDec2026 >= 0 ? idxDec2026 : safeEnd);
  const isNovCurrent = selectedPeriod === 'Noviembre 2026';

  const currentWindowLabel =
    selectedPeriod !== 'Todos'
      ? selectedPeriod
      : `${formatShortMonth(monthlySeries[safeStart]?.month || '')} → ${formatShortMonth(
          monthlySeries[safeEnd]?.month || ''
        )}`;

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

  return (
    <div className="sticky top-[53px] sm:top-[57px] z-20 backdrop-blur-md bg-[#FFFDF8]/95 dark:bg-[#070C1C]/95 border-b border-[#DDD4C5] dark:border-slate-800/90 px-3 sm:px-6 py-2 shadow-sm transition-colors">
      <div className="flex flex-col gap-2">
        {/* Top Control Bar: Title, Client Filter, Window Indicator & Quick Presets */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          {/* Left: Indicator, Window & Global Client Filter */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-[#2A5FFF]/10 text-[#2A5FFF] dark:bg-[#00B4D8]/15 dark:text-[#00B4D8] font-semibold">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span className="text-[11px] font-mono uppercase tracking-wider hidden sm:inline">
                Línea de Tiempo
              </span>
            </div>

            {/* Client Filter Dropdown */}
            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-[#101D38] px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-700">
              <Users className="w-3.5 h-3.5 text-[#2A5FFF] dark:text-[#00B4D8] shrink-0" />
              <select
                value={selectedClient}
                onChange={(e) => onSelectClient(e.target.value)}
                className="bg-transparent font-sans font-semibold text-xs text-slate-900 dark:text-white focus:outline-none cursor-pointer max-w-[130px] sm:max-w-[180px] truncate"
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

            {/* Window Indicator */}
            <div className="flex items-center gap-1.5 font-mono text-[11px]">
              <span className="text-slate-400 hidden md:inline">Ventana:</span>
              <span className="font-bold text-slate-900 dark:text-white px-2 py-0.5 rounded bg-slate-200/70 dark:bg-[#101D38] border border-slate-300/60 dark:border-slate-700">
                {currentWindowLabel}
              </span>
              <span className="text-emerald-700 dark:text-[#C6F432] font-semibold hidden lg:inline ml-1">
                Won: {fmt(activeWindowMetrics.won)}
              </span>
              {activeWindowMetrics.pipe > 0 && (
                <span className="text-[#2A5FFF] dark:text-[#00B4D8] font-semibold hidden lg:inline">
                  · Pipe: {fmt(activeWindowMetrics.pipe)}
                </span>
              )}
            </div>
          </div>

          {/* Right: Presets & Excel Download */}
          <div className="flex flex-wrap items-center gap-1.5">
            {/* Presets */}
            <button
              type="button"
              onClick={() => {
                onSelectPeriod('Todos');
                onRangeChange(0, monthlySeries.length - 1);
              }}
              className={`px-2 py-1 rounded-lg text-[10px] font-mono transition border ${
                isFullRange
                  ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900 dark:border-white font-bold'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400 dark:bg-[#101D38] dark:text-slate-300 dark:border-slate-700'
              }`}
            >
              Todo ({monthlySeries.length}M)
            </button>

            {idxJan2026 >= 0 && idxDec2026 >= 0 && (
              <button
                type="button"
                onClick={() => {
                  onSelectPeriod('Todos');
                  onRangeChange(idxJan2026, idxDec2026);
                }}
                className={`px-2 py-1 rounded-lg text-[10px] font-mono transition border ${
                  isYear2026
                    ? 'bg-[#2A5FFF] text-white border-[#2A5FFF] dark:bg-[#00B4D8] dark:text-[#0B132B] font-bold'
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
                  onRangeChange(idxJan2027, idxDec2027 >= 0 ? idxDec2027 : monthlySeries.length - 1);
                }}
                className={`px-2 py-1 rounded-lg text-[10px] font-mono transition border ${
                  isYear2027
                    ? 'bg-[#2A5FFF] text-white border-[#2A5FFF] dark:bg-[#00B4D8] dark:text-[#0B132B] font-bold'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400 dark:bg-[#101D38] dark:text-slate-300 dark:border-slate-700'
                }`}
              >
                Año 2027
              </button>
            )}

            {idxOct2026 >= 0 && idxDec2026 >= 0 && (
              <button
                type="button"
                onClick={() => {
                  onSelectPeriod('Todos');
                  onRangeChange(idxOct2026, idxDec2026);
                }}
                className={`px-2 py-1 rounded-lg text-[10px] font-mono transition border hidden md:inline-block ${
                  isQ4
                    ? 'bg-[#2A5FFF] text-white border-[#2A5FFF] dark:bg-[#00B4D8] dark:text-[#0B132B] font-bold'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400 dark:bg-[#101D38] dark:text-slate-300 dark:border-slate-700'
                }`}
              >
                Q4 '26
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                onSelectPeriod('Noviembre 2026');
                if (idxNov2026 >= 0) onRangeChange(idxNov2026, idxNov2026);
              }}
              className={`px-2 py-1 rounded-lg text-[10px] font-mono transition border flex items-center gap-1 ${
                isNovCurrent
                  ? 'bg-emerald-600 text-white border-emerald-600 dark:bg-[#C6F432] dark:text-[#0B132B] dark:border-[#C6F432] font-bold shadow-sm'
                  : 'bg-white text-slate-700 border-emerald-500/40 hover:border-emerald-500 dark:bg-[#101D38] dark:text-slate-200 dark:border-emerald-500/40'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-[#C6F432] animate-pulse" />
              Nov 26 (Actual)
            </button>

            {/* Excel Download link */}
            <a
              href="./CDU%20Pipeline%20Forecast%20-%20REPARADO.xlsx"
              download="CDU Pipeline Forecast - REPARADO.xlsx"
              title="Descargar libro maestro Excel (.xlsx) con 112 negocios y fórmulas nativas"
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-mono font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition shadow-sm"
            >
              <Download className="w-3 h-3" />
              <span>Excel ({totalDeals})</span>
            </a>
          </div>
        </div>

        {/* Bottom Track: All 24 Monthly Pill Buttons (Horizontal Flex / Scroll) */}
        <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto pb-1 pt-0.5 no-scrollbar scroll-smooth">
          {monthlySeries.map((m, idx) => {
            const isSingleSelected = selectedPeriod === m.month;
            const inRange =
              selectedPeriod === 'Todos' ? idx >= safeStart && idx <= safeEnd : isSingleSelected;
            const isBoundary =
              selectedPeriod === 'Todos' ? idx === safeStart || idx === safeEnd : isSingleSelected;
            const isCurrentMonth = m.month === 'Noviembre 2026';
            const hasActivity = m.closedWon > 0 || m.pipelineOpen > 0;

            return (
              <button
                key={m.month}
                type="button"
                onClick={() => {
                  if (selectedPeriod === m.month) {
                    onSelectPeriod('Todos');
                    onRangeChange(0, monthlySeries.length - 1);
                  } else {
                    onSelectPeriod(m.month);
                    onRangeChange(idx, idx);
                  }
                }}
                className={`group relative shrink-0 py-1 px-2 sm:px-2 rounded-lg text-[10.5px] font-mono transition-all border text-center flex items-center gap-1.5 ${
                  isBoundary
                    ? 'bg-[#2A5FFF] text-white border-[#2A5FFF] dark:bg-[#00B4D8] dark:text-[#0B132B] dark:border-[#00B4D8] font-bold shadow-md scale-[1.02]'
                    : inRange
                    ? 'bg-[#2A5FFF]/15 text-[#2A5FFF] border-[#2A5FFF]/40 dark:bg-[#00B4D8]/20 dark:text-[#00B4D8] dark:border-[#00B4D8]/40 font-medium'
                    : 'bg-white/70 text-slate-500 hover:text-slate-900 border-slate-200 hover:border-slate-300 dark:bg-[#0B132B]/60 dark:text-slate-400 dark:hover:text-white dark:border-slate-800'
                } ${isCurrentMonth && !inRange ? 'ring-1 ring-emerald-500/50' : ''}`}
                title={`${m.month} · Won: ${fmt(m.closedWon)} · Pipe: ${fmt(
                  m.pipelineOpen
                )} · Clic para filtrar`}
              >
                {/* Indicator dots for won and pipeline */}
                <div className="flex items-center gap-0.5">
                  {m.closedWon > 0 ? (
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isBoundary
                          ? 'bg-white dark:bg-[#0B132B]'
                          : 'bg-emerald-500 dark:bg-[#C6F432]'
                      }`}
                      title={`Facturado: ${fmt(m.closedWon)}`}
                    />
                  ) : m.pipelineOpen > 0 ? (
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isBoundary
                          ? 'bg-white/80 dark:bg-[#0B132B]/80'
                          : 'bg-[#2A5FFF] dark:text-[#00B4D8] bg-[#00B4D8]'
                      }`}
                      title={`Pipeline abierto: ${fmt(m.pipelineOpen)}`}
                    />
                  ) : (
                    <span className="w-1 h-1 rounded-full bg-slate-300/60 dark:bg-slate-700/60" />
                  )}
                </div>

                <span>{formatShortMonth(m.month)}</span>

                {isCurrentMonth && (
                  <span
                    className={`text-[8px] uppercase tracking-wider px-1 py-0.2 rounded font-bold ${
                      isBoundary
                        ? 'bg-white/30 text-white dark:bg-[#0B132B]/30 dark:text-[#0B132B]'
                        : 'bg-emerald-500/20 text-emerald-700 dark:bg-[#C6F432]/25 dark:text-[#C6F432]'
                    }`}
                  >
                    Hoy
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default PersistentTimeline;
