import React, { useState } from 'react';
import { MonthlySummary } from '../utils/kpi';
import { CurrencyCode, formatCurrency } from '../data/pipeline';
import { BarChart2, TrendingUp, Layers } from 'lucide-react';

interface Props {
  monthlyData: MonthlySummary[];
  currency: CurrencyCode;
  exchangeRate: number;
  quotaClp: number;
}

export const ForecastChart: React.FC<Props> = ({
  monthlyData,
  currency,
  exchangeRate,
  quotaClp,
}) => {
  const [chartType, setChartType] = useState<'area' | 'bars' | 'stacked'>('area');
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const fmt = (val: number, compact = true) =>
    formatCurrency(val, currency, exchangeRate, compact);

  const maxVal = Math.max(
    quotaClp * 1.25,
    ...monthlyData.map((m) =>
      Math.max(m.forecast + m.closedWon, m.weighted + m.closedWon, m.pipelineOpen * 0.65)
    )
  );

  const svgWidth = 760;
  const svgHeight = 250;
  const padLeft = 58;
  const padRight = 24;
  const padTop = 22;
  const padBottom = 36;
  const plotW = svgWidth - padLeft - padRight;
  const plotH = svgHeight - padTop - padBottom;

  const getX = (i: number) => {
    if (monthlyData.length <= 1) return padLeft + plotW / 2;
    return padLeft + (i / (monthlyData.length - 1)) * plotW;
  };

  const getY = (val: number) => {
    const clamped = Math.min(maxVal, Math.max(0, val));
    return padTop + plotH - (clamped / maxVal) * plotH;
  };

  const quotaY = getY(quotaClp);

  // Build SVG path for Area/Line mode
  const buildPath = (values: number[]) => {
    if (values.length === 0) return '';
    return values
      .map((v, i) => `${i === 0 ? 'M' : 'L'} ${getX(i).toFixed(1)} ${getY(v).toFixed(1)}`)
      .join(' ');
  };

  const buildArea = (values: number[]) => {
    if (values.length === 0) return '';
    const line = buildPath(values);
    const firstX = getX(0).toFixed(1);
    const lastX = getX(values.length - 1).toFixed(1);
    const bottomY = (padTop + plotH).toFixed(1);
    return `${line} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;
  };

  const forecastSeries = monthlyData.map((m) => m.forecast + m.closedWon);
  const weightedSeries = monthlyData.map((m) => m.weighted + m.closedWon);

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((t) => t * maxVal);

  return (
    <div className="rounded-xl p-5 border bg-white/95 border-[#DDD4C5] dark:bg-[#101D38]/90 dark:border-slate-800/80 shadow-sm flex flex-col justify-between h-full">
      {/* Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded bg-[#2A5FFF]/10 text-[#2A5FFF] dark:bg-[#00B4D8]/15 dark:text-[#00B4D8] font-semibold">
              Curva Comercial CDU
            </span>
            <span className="text-xs text-slate-400 dark:text-slate-500 font-mono">
              Regla Fiscal Corte Día 25
            </span>
          </div>
          <h2 className="text-lg font-serif font-bold text-slate-900 dark:text-white mt-1">
            Forecast (Commit + Best Case) vs Weighted Pipeline
          </h2>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-[#0B132B] p-1 rounded-lg border border-slate-200 dark:border-slate-800">
          <button
            onClick={() => setChartType('area')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition ${
              chartType === 'area'
                ? 'bg-white text-slate-900 shadow-sm dark:bg-[#101D38] dark:text-[#00B4D8]'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            Tendencia
          </button>
          <button
            onClick={() => setChartType('bars')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition ${
              chartType === 'bars'
                ? 'bg-white text-slate-900 shadow-sm dark:bg-[#101D38] dark:text-[#00B4D8]'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            Columnas
          </button>
          <button
            onClick={() => setChartType('stacked')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition ${
              chartType === 'stacked'
                ? 'bg-white text-slate-900 shadow-sm dark:bg-[#101D38] dark:text-[#00B4D8]'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Desglose
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs mb-2">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-[#00B4D8] inline-block" />
          <span className="text-slate-600 dark:text-slate-300 font-medium">
            Forecast + Facturado
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-[#C6F432] inline-block" />
          <span className="text-slate-600 dark:text-slate-300 font-medium">
            Weighted Pipeline + Facturado
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-4 h-0.5 border-t-2 border-dashed border-rose-400 inline-block" />
          <span className="text-slate-600 dark:text-slate-300 font-medium">
            Meta Mensual ({fmt(quotaClp, false)})
          </span>
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="relative w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-64 select-none overflow-visible"
        >
          <defs>
            <linearGradient id="gradForecast" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#00B4D8" stopOpacity="0.38" />
              <stop offset="100%" stopColor="#00B4D8" stopOpacity="0.02" />
            </linearGradient>
            <linearGradient id="gradWeighted" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#C6F432" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#C6F432" stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {/* Horizontal Grid Lines */}
          {yTicks.map((tick, idx) => {
            const y = getY(tick);
            return (
              <g key={idx}>
                <line
                  x1={padLeft}
                  y1={y}
                  x2={svgWidth - padRight}
                  y2={y}
                  stroke="currentColor"
                  className="text-slate-200 dark:text-slate-800"
                  strokeDasharray="3 3"
                  strokeWidth="1"
                />
                <text
                  x={padLeft - 8}
                  y={y + 4}
                  textAnchor="end"
                  className="text-[10px] font-mono fill-slate-400 dark:fill-slate-500"
                >
                  {fmt(tick, true)}
                </text>
              </g>
            );
          })}

          {/* Target Quota Line */}
          <line
            x1={padLeft}
            y1={quotaY}
            x2={svgWidth - padRight}
            y2={quotaY}
            stroke="#FB7185"
            strokeWidth="1.5"
            strokeDasharray="5 4"
          />
          <text
            x={svgWidth - padRight - 4}
            y={quotaY - 5}
            textAnchor="end"
            className="text-[10px] font-mono fill-rose-400 font-semibold"
          >
            META {fmt(quotaClp, true)}
          </text>

          {/* Chart Representations */}
          {chartType === 'area' && (
            <>
              <path d={buildArea(forecastSeries)} fill="url(#gradForecast)" />
              <path
                d={buildPath(forecastSeries)}
                fill="none"
                stroke="#00B4D8"
                strokeWidth="2.5"
              />

              <path d={buildArea(weightedSeries)} fill="url(#gradWeighted)" />
              <path
                d={buildPath(weightedSeries)}
                fill="none"
                stroke="#C6F432"
                strokeWidth="2.5"
              />

              {monthlyData.map((m, i) => {
                const cx = getX(i);
                const cyF = getY(forecastSeries[i]);
                const cyW = getY(weightedSeries[i]);
                return (
                  <g
                    key={m.month}
                    onMouseEnter={() => setHoveredIdx(i)}
                    onMouseLeave={() => setHoveredIdx(null)}
                    className="cursor-pointer"
                  >
                    <rect
                      x={cx - 28}
                      y={padTop}
                      width={56}
                      height={plotH}
                      fill="transparent"
                    />
                    <circle
                      cx={cx}
                      cy={cyF}
                      r={hoveredIdx === i ? 5.5 : 4}
                      fill="#00B4D8"
                      stroke="#0B132B"
                      strokeWidth="1.5"
                    />
                    <circle
                      cx={cx}
                      cy={cyW}
                      r={hoveredIdx === i ? 5.5 : 4}
                      fill="#C6F432"
                      stroke="#0B132B"
                      strokeWidth="1.5"
                    />
                  </g>
                );
              })}
            </>
          )}

          {chartType === 'bars' &&
            monthlyData.map((m, i) => {
              const cx = getX(i);
              const barW = 16;
              const yF = getY(forecastSeries[i]);
              const hF = padTop + plotH - yF;
              const yW = getY(weightedSeries[i]);
              const hW = padTop + plotH - yW;
              return (
                <g
                  key={m.month}
                  onMouseEnter={() => setHoveredIdx(i)}
                  onMouseLeave={() => setHoveredIdx(null)}
                  className="cursor-pointer"
                >
                  <rect
                    x={cx - barW - 2}
                    y={yF}
                    width={barW}
                    height={Math.max(2, hF)}
                    rx={3}
                    fill="#00B4D8"
                  />
                  <rect
                    x={cx + 2}
                    y={yW}
                    width={barW}
                    height={Math.max(2, hW)}
                    rx={3}
                    fill="#C6F432"
                  />
                </g>
              );
            })}

          {chartType === 'stacked' &&
            monthlyData.map((m, i) => {
              const cx = getX(i);
              const barW = 24;
              const wonH = (Math.min(maxVal, m.closedWon) / maxVal) * plotH;
              const commitH = (Math.min(maxVal, m.commit) / maxVal) * plotH;
              const bestH = (Math.min(maxVal, m.bestCase) / maxVal) * plotH;
              const yWon = padTop + plotH - wonH;
              const yCommit = yWon - commitH;
              const yBest = yCommit - bestH;
              return (
                <g
                  key={m.month}
                  onMouseEnter={() => setHoveredIdx(i)}
                  onMouseLeave={() => setHoveredIdx(null)}
                  className="cursor-pointer"
                >
                  {/* Closed Won */}
                  <rect
                    x={cx - barW / 2}
                    y={yWon}
                    width={barW}
                    height={Math.max(0, wonH)}
                    fill="#10B981"
                  />
                  {/* Commit */}
                  <rect
                    x={cx - barW / 2}
                    y={yCommit}
                    width={barW}
                    height={Math.max(0, commitH)}
                    fill="#00B4D8"
                  />
                  {/* Best Case */}
                  <rect
                    x={cx - barW / 2}
                    y={yBest}
                    width={barW}
                    height={Math.max(0, bestH)}
                    rx={2}
                    fill="#C6F432"
                  />
                </g>
              );
            })}

          {/* X Axis Labels */}
          {monthlyData.map((m, i) => {
            const cx = getX(i);
            const shortMonth = m.month
              .replace('Septiembre ', 'Sep ')
              .replace('Noviembre ', 'Nov ')
              .replace('Diciembre ', 'Dic ')
              .replace('Octubre ', 'Oct ')
              .replace('Agosto ', 'Ago ')
              .replace('Enero ', 'Ene ')
              .replace('Marzo ', 'Mar ');
            return (
              <text
                key={m.month}
                x={cx}
                y={svgHeight - 10}
                textAnchor="middle"
                className={`text-[11px] font-mono ${
                  hoveredIdx === i
                    ? 'fill-[#2A5FFF] dark:fill-[#00B4D8] font-bold'
                    : 'fill-slate-500 dark:fill-slate-400'
                }`}
              >
                {shortMonth}
              </text>
            );
          })}
        </svg>

        {/* Interactive Tooltip Summary Banner */}
        {hoveredIdx !== null && monthlyData[hoveredIdx] && (
          <div className="mt-2 p-2.5 rounded-lg bg-slate-100 dark:bg-[#0B132B] border border-slate-200 dark:border-[#00B4D8]/30 flex flex-wrap items-center justify-between gap-3 text-xs">
            <span className="font-serif font-bold text-slate-900 dark:text-white">
              {monthlyData[hoveredIdx].month} ({monthlyData[hoveredIdx].dealsCount} ops)
            </span>
            <div className="flex flex-wrap items-center gap-4 font-mono">
              <span className="text-emerald-600 dark:text-emerald-400">
                Facturado: {fmt(monthlyData[hoveredIdx].closedWon, false)}
              </span>
              <span className="text-[#2A5FFF] dark:text-[#00B4D8]">
                Forecast: {fmt(monthlyData[hoveredIdx].forecast, false)}
              </span>
              <span className="text-lime-700 dark:text-[#C6F432]">
                Weighted: {fmt(monthlyData[hoveredIdx].weighted, false)}
              </span>
              <span className="text-slate-500 dark:text-slate-400">
                Pipeline Abierto: {fmt(monthlyData[hoveredIdx].pipelineOpen, false)}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ForecastChart;
