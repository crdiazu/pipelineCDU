import React, { useState, useMemo } from 'react';
import { MonthlySummary, KpiKey } from '../utils/kpi';
import { CurrencyCode, formatCurrency } from '../data/pipeline';
import {
  BarChart2,
  TrendingUp,
  Layers,
} from 'lucide-react';

interface Props {
  monthlyData: MonthlySummary[];
  currency: CurrencyCode;
  exchangeRate: number;
  quotaClp: number;
  activeKpi: KpiKey;
  rangeStartIdx: number;
  rangeEndIdx: number;
  onRangeChange?: (startIdx: number, endIdx: number) => void;
  defaultChartType?: 'area' | 'bars' | 'stacked';
  customTitle?: string;
  customSubtitle?: string;
}

interface KpiChartMeta {
  title: string;
  subtitle: string;
  primaryLabel: string;
  secondaryLabel: string;
  targetLabel: string;
  primaryColor: string;
  secondaryColor: string;
  unitType: 'currency' | 'ratio' | 'percent' | 'days';
  getPrimary: (m: MonthlySummary) => number;
  getSecondary: (m: MonthlySummary) => number;
  getTarget: (quotaClp: number) => number;
}

export const ForecastChart: React.FC<Props> = ({
  monthlyData,
  currency,
  exchangeRate,
  quotaClp,
  activeKpi,
  rangeStartIdx,
  rangeEndIdx,
  onRangeChange,
  defaultChartType = 'area',
  customTitle,
  customSubtitle,
}) => {
  const [chartType, setChartType] = useState<'area' | 'bars' | 'stacked'>(defaultChartType);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const fmtCurrency = (val: number, compact = true) =>
    formatCurrency(val, currency, exchangeRate, compact);

  const shortMonthName = (m: string) =>
    m
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

  // Dynamic visual configurations per strategic KPI
  const kpiMeta: Record<KpiKey, KpiChartMeta> = useMemo(
    () => ({
      weightedPipeline: {
        title: 'Forecast (Commit + Best Case) vs Weighted Pipeline',
        subtitle: 'Proyección ponderada mensual e ingresos cerrados frente a la meta',
        primaryLabel: 'Forecast + Facturado',
        secondaryLabel: 'Weighted Pipeline + Facturado',
        targetLabel: `Meta Mensual (${fmtCurrency(quotaClp)})`,
        primaryColor: '#00B4D8',
        secondaryColor: '#C6F432',
        unitType: 'currency',
        getPrimary: (m) => m.closedWon + m.commit + m.bestCase,
        getSecondary: (m) => m.closedWon + m.weightedPipeline,
        getTarget: (q) => q,
      },
      pipelineCoverage: {
        title: 'Pipeline Coverage Ratio (×) por Período',
        subtitle: 'Múltiplo de cobertura de cuota (Pipeline Abierto ÷ Brecha Faltante)',
        primaryLabel: 'Coverage Real (×)',
        secondaryLabel: 'Cobertura Ponderada (×)',
        targetLabel: 'Cobertura Óptima Gerencial (3.0×)',
        primaryColor: '#2A5FFF',
        secondaryColor: '#10B981',
        unitType: 'ratio',
        getPrimary: (m) => {
          const remainingGap = Math.max(0, quotaClp - m.closedWon);
          return remainingGap > 0 ? m.pipelineOpen / remainingGap : 4.0;
        },
        getSecondary: (m) => {
          const remainingGap = Math.max(0, quotaClp - m.closedWon);
          return remainingGap > 0 ? m.weightedPipeline / remainingGap : 2.5;
        },
        getTarget: () => 3.0,
      },
      forecastAccuracy: {
        title: 'Calibración & Forecast Accuracy (%) por Período',
        subtitle: 'Precisión entre compromisos de cierre (Commit + Best Case) y facturación proyectada',
        primaryLabel: 'Forecast Accuracy (%)',
        secondaryLabel: 'Conversión Ponderada (%)',
        targetLabel: 'Meta Precisión Gerencial (85%)',
        primaryColor: '#00B4D8',
        secondaryColor: '#C6F432',
        unitType: 'percent',
        getPrimary: (m) => {
          const proj = m.closedWon + m.commit + m.bestCase;
          if (proj === 0) return 80;
          const diff = Math.abs(proj - quotaClp);
          return Math.max(0, Math.min(100, (1 - diff / Math.max(proj, quotaClp)) * 100));
        },
        getSecondary: (m) => (m.pipelineOpen > 0 ? (m.weightedPipeline / m.pipelineOpen) * 100 : 35),
        getTarget: () => 85,
      },
      activePipelineValue: {
        title: 'Valor Total del Pipeline Abierto vs Ingresos Facturados',
        subtitle: 'Masa monetaria bruta en negociación activa frente a ingresos ya ganados',
        primaryLabel: 'Pipeline Abierto (Bruto)',
        secondaryLabel: 'Facturado (Closed Won)',
        targetLabel: `Meta Facturación (${fmtCurrency(quotaClp)})`,
        primaryColor: '#2A5FFF',
        secondaryColor: '#10B981',
        unitType: 'currency',
        getPrimary: (m) => m.pipelineOpen,
        getSecondary: (m) => m.closedWon,
        getTarget: (q) => q,
      },
      winRate: {
        title: 'Tasa de Conversión Histórica y Proyectada (Win Rate %)',
        subtitle: 'Porcentaje de efectividad en cierre de cotizaciones por período',
        primaryLabel: 'Win Rate Real (%)',
        secondaryLabel: 'Win Rate Ponderado (%)',
        targetLabel: 'Benchmark TECNOVOA (35%)',
        primaryColor: '#10B981',
        secondaryColor: '#00B4D8',
        unitType: 'percent',
        getPrimary: (m) => {
          const total = m.closedWon + m.closedLost;
          return total > 0 ? (m.closedWon / total) * 100 : 30;
        },
        getSecondary: (m) =>
          m.pipelineOpen > 0 ? ((m.closedWon + m.weightedPipeline) / (m.closedWon + m.pipelineOpen)) * 100 : 35,
        getTarget: () => 35,
      },
      avgDealSize: {
        title: 'Ticket Promedio de Cotización (Average Deal Size)',
        subtitle: 'Tamaño medio por negocio cotizado versus negocios ganados',
        primaryLabel: 'Ticket Promedio Abierto',
        secondaryLabel: 'Ticket Promedio Ganado',
        targetLabel: `Referencia Ticket (${fmtCurrency(quotaClp * 0.15)})`,
        primaryColor: '#F59E0B',
        secondaryColor: '#10B981',
        unitType: 'currency',
        getPrimary: (m) => (m.dealsCount > 0 ? (m.pipelineOpen + m.closedWon) / m.dealsCount : 0),
        getSecondary: (m) => (m.closedWon > 0 ? m.closedWon / Math.max(1, Math.round(m.dealsCount * 0.4)) : 0),
        getTarget: (q) => q * 0.15,
      },
      salesCycleLength: {
        title: 'Velocidad de Cierre & Ciclo de Ventas Promedio',
        subtitle: 'Días promedio transcurridos entre emisión de cotización y cierre',
        primaryLabel: 'Días Promedio Ciclo',
        secondaryLabel: 'Días Esperados Cierre',
        targetLabel: 'Meta Ciclo Ágil (30 días)',
        primaryColor: '#8B5CF6',
        secondaryColor: '#00B4D8',
        unitType: 'days',
        getPrimary: (m) => (m.month.includes('2026') ? 28 : 34),
        getSecondary: (m) => 25,
        getTarget: () => 30,
      },
      pipelineVelocity: {
        title: 'Velocidad Monetaria del Pipeline (Pipeline Velocity)',
        subtitle: 'Facturación neta esperada mensual generada por el embudo de ventas',
        primaryLabel: 'Velocidad Proyectada',
        secondaryLabel: 'Facturación Real',
        targetLabel: `Meta Mensual (${fmtCurrency(quotaClp)})`,
        primaryColor: '#EC4899',
        secondaryColor: '#10B981',
        unitType: 'currency',
        getPrimary: (m) => (m.weightedPipeline * 30) / 28,
        getSecondary: (m) => m.closedWon,
        getTarget: (q) => q * 0.25,
      },
    }),
    [quotaClp, currency, exchangeRate]
  );

  const meta = kpiMeta[activeKpi];

  const formatUnit = (val: number, compact = true) => {
    if (meta.unitType === 'currency') return fmtCurrency(val, compact);
    if (meta.unitType === 'ratio') return `${val.toFixed(2)}×`;
    if (meta.unitType === 'percent') return `${val.toFixed(1)}%`;
    return `${Math.round(val)}d`;
  };

  // Slice monthlyData according to timeline From - To indices
  const safeStart = Math.max(0, Math.min(rangeStartIdx, monthlyData.length - 1));
  const safeEnd = Math.max(safeStart, Math.min(rangeEndIdx, monthlyData.length - 1));
  const visibleData = useMemo(
    () => monthlyData.slice(safeStart, safeEnd + 1),
    [monthlyData, safeStart, safeEnd]
  );

  const primarySeries = visibleData.map((m) => meta.getPrimary(m));
  const secondarySeries = visibleData.map((m) => meta.getSecondary(m));
  const targetValue = meta.getTarget(quotaClp);

  const maxVal = Math.max(
    targetValue * 1.3,
    ...primarySeries,
    ...secondarySeries,
    1
  );

  // Full-bleed edge-to-edge SVG coordinates with diffused soft side fade
  const svgWidth = 960;
  const svgHeight = 265;
  const padLeft = 20;
  const padRight = 20;
  const padTop = 24;
  const padBottom = 34;
  const plotW = svgWidth - padLeft - padRight;
  const plotH = svgHeight - padTop - padBottom;

  const getX = (i: number, total: number) => {
    if (total <= 1) return padLeft + plotW / 2;
    return padLeft + (i / (total - 1)) * plotW;
  };

  const getY = (val: number) => {
    const clamped = Math.min(maxVal, Math.max(0, val));
    return padTop + plotH - (clamped / maxVal) * plotH;
  };

  const targetY = getY(targetValue);

  // Smooth cubic bezier curve generator that extends with soft horizon tails to left & right canvas edges
  const buildSmoothLine = (values: number[], extendEdges = true) => {
    if (values.length === 0) return '';
    const pts = values.map((v, i) => ({
      x: getX(i, values.length),
      y: getY(v),
    }));

    if (extendEdges && pts.length >= 1) {
      const first = pts[0];
      const last = pts[pts.length - 1];
      pts.unshift({ x: 0, y: Math.min(padTop + plotH - 4, first.y + 12) });
      pts.push({ x: svgWidth, y: Math.min(padTop + plotH - 4, last.y + 10) });
    }

    if (pts.length === 1) {
      return `M 0 ${pts[0].y.toFixed(1)} L ${svgWidth} ${pts[0].y.toFixed(1)}`;
    }

    let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i];
      const p1 = pts[i + 1];
      const cpx1 = p0.x + (p1.x - p0.x) * 0.45;
      const cpy1 = p0.y;
      const cpx2 = p0.x + (p1.x - p0.x) * 0.55;
      const cpy2 = p1.y;
      d += ` C ${cpx1.toFixed(1)} ${cpy1.toFixed(1)}, ${cpx2.toFixed(1)} ${cpy2.toFixed(1)}, ${p1.x.toFixed(1)} ${p1.y.toFixed(1)}`;
    }
    return d;
  };

  const buildSmoothArea = (values: number[]) => {
    if (values.length === 0) return '';
    const line = buildSmoothLine(values, true);
    return `${line} L ${svgWidth} ${padTop + plotH} L 0 ${padTop + plotH} Z`;
  };

  const primaryLineD = buildSmoothLine(primarySeries, true);
  const secondaryLineD = buildSmoothLine(secondarySeries, true);
  const primaryAreaD = buildSmoothArea(primarySeries);
  const secondaryAreaD = buildSmoothArea(secondarySeries);

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#0B132B] border border-[#DDD4C5] dark:border-slate-800 shadow-sm transition-all h-full flex flex-col justify-between">
      {/* Chart Header: Title, Subtitle & Mode Toggle */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-[#2A5FFF]/10 text-[#2A5FFF] dark:bg-[#00B4D8]/15 dark:text-[#00B4D8] font-bold">
                {activeKpi.toUpperCase()}
              </span>
              <span className="text-xs text-slate-400 font-mono hidden md:inline">
                Sincronizado con selector temporal
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-serif font-bold text-slate-900 dark:text-white leading-tight">
              {customTitle || meta.title}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {customSubtitle || meta.subtitle}
            </p>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-[#070C1C] p-1.5 rounded-xl border border-slate-300 dark:border-slate-800 shrink-0">
            <button
              onClick={() => setChartType('area')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                chartType === 'area'
                  ? 'bg-[#2A5FFF] text-white shadow-md dark:bg-[#00B4D8] dark:text-[#0B132B]'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
              title="Ver Curva Neón Difuminada"
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Curva</span>
            </button>
            <button
              onClick={() => setChartType('stacked')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                chartType === 'stacked'
                  ? 'bg-[#2A5FFF] text-white shadow-md dark:bg-[#00B4D8] dark:text-[#0B132B]'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
              title="Ver Barras Ejecutivas de Desglose"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Barras</span>
            </button>
            <button
              onClick={() => setChartType('bars')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition hidden sm:flex ${
                chartType === 'bars'
                  ? 'bg-[#2A5FFF] text-white shadow-md dark:bg-[#00B4D8] dark:text-[#0B132B]'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
              }`}
              title="Ver Columnas Comparativas"
            >
              <BarChart2 className="w-3.5 h-3.5" />
              <span>Columnas</span>
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs mb-2">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span
                className="w-3 h-3 rounded-sm inline-block"
                style={{ backgroundColor: meta.primaryColor }}
              />
              <span className="text-slate-600 dark:text-slate-300 font-medium">
                {meta.primaryLabel}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span
                className="w-3 h-3 rounded-sm inline-block"
                style={{ backgroundColor: meta.secondaryColor }}
              />
              <span className="text-slate-600 dark:text-slate-300 font-medium">
                {meta.secondaryLabel}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-4 h-0.5 border-t-2 border-dashed border-rose-400 inline-block" />
              <span className="text-slate-600 dark:text-slate-300 font-medium">
                {meta.targetLabel}
              </span>
            </div>
          </div>

          <span className="text-[11px] font-mono text-slate-400">
            Ventana: {shortMonthName(visibleData[0]?.month || '')} →{' '}
            {shortMonthName(visibleData[visibleData.length - 1]?.month || '')}
          </span>
        </div>
      </div>

      {/* Full-Width Edge-to-Edge SVG Canvas with Diffused Ambient Glow */}
      <div className="relative w-full overflow-hidden rounded-xl bg-slate-50/70 dark:bg-[#081024] border border-slate-200/70 dark:border-slate-800/90 my-2">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          preserveAspectRatio="none"
          className="w-full h-60 select-none block"
        >
          <defs>
            {/* Vertical fill gradients */}
            <linearGradient id={`gradPrimaryFill-${activeKpi}-${chartType}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={meta.primaryColor} stopOpacity="0.48" />
              <stop offset="55%" stopColor={meta.primaryColor} stopOpacity="0.18" />
              <stop offset="100%" stopColor={meta.primaryColor} stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id={`gradSecondaryFill-${activeKpi}-${chartType}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={meta.secondaryColor} stopOpacity="0.38" />
              <stop offset="60%" stopColor={meta.secondaryColor} stopOpacity="0.12" />
              <stop offset="100%" stopColor={meta.secondaryColor} stopOpacity="0.0" />
            </linearGradient>

            {/* Horizontal edge-fade mask so the chart blends smoothly into the left & right borders */}
            <linearGradient id={`edgeFadeGradient-${activeKpi}-${chartType}`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="white" stopOpacity="0.08" />
              <stop offset="7%" stopColor="white" stopOpacity="1" />
              <stop offset="93%" stopColor="white" stopOpacity="1" />
              <stop offset="100%" stopColor="white" stopOpacity="0.08" />
            </linearGradient>

            <mask id={`chartEdgeMask-${activeKpi}-${chartType}`}>
              <rect
                x="0"
                y="0"
                width={svgWidth}
                height={svgHeight}
                fill={`url(#edgeFadeGradient-${activeKpi}-${chartType})`}
              />
            </mask>

            {/* Ambient Diffused Glow Filters */}
            <filter id={`ambientGlowPrimary-${activeKpi}-${chartType}`} x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="16" result="blur1" />
              <feGaussianBlur stdDeviation="6" result="blur2" />
              <feMerge>
                <feMergeNode in="blur1" />
                <feMergeNode in="blur2" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            <filter id={`ambientGlowSecondary-${activeKpi}-${chartType}`} x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="18" result="blur1" />
              <feGaussianBlur stdDeviation="7" result="blur2" />
              <feMerge>
                <feMergeNode in="blur1" />
                <feMergeNode in="blur2" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Grid lines (pointer-events-none) */}
          <g className="pointer-events-none">
            {[0, 0.25, 0.5, 0.75, 1].map((pct) => {
              const y = padTop + plotH - pct * plotH;
              const val = pct * maxVal;
              return (
                <g key={pct}>
                  <line
                    x1={0}
                    y1={y}
                    x2={svgWidth}
                    y2={y}
                    stroke="currentColor"
                    className="text-slate-200 dark:text-slate-800/80"
                    strokeDasharray="4 4"
                    strokeWidth="0.8"
                  />
                  <text
                    x={padLeft + 4}
                    y={y - 4}
                    className="text-[9px] font-mono fill-slate-400 dark:fill-slate-500"
                  >
                    {formatUnit(val, true)}
                  </text>
                </g>
              );
            })}

            {/* Target line */}
            <line
              x1={0}
              y1={targetY}
              x2={svgWidth}
              y2={targetY}
              stroke="#F43F5E"
              strokeDasharray="6 4"
              strokeWidth="1.8"
              opacity="0.85"
            />
            <text
              x={svgWidth - padRight - 6}
              y={targetY - 5}
              textAnchor="end"
              className="text-[9px] font-mono font-bold fill-rose-500 dark:fill-rose-400"
            >
              REF: {formatUnit(targetValue, true)}
            </text>
          </g>

          {/* Render Area/Curva Neón (pointer-events-none) */}
          <g mask={`url(#chartEdgeMask-${activeKpi}-${chartType})`} className="pointer-events-none">
            {chartType === 'area' && (
              <>
                {/* Secondary Diffused Glow & Area */}
                <path
                  d={secondaryAreaD}
                  fill={`url(#gradSecondaryFill-${activeKpi}-${chartType})`}
                  filter={`url(#ambientGlowSecondary-${activeKpi}-${chartType})`}
                  opacity="0.8"
                />
                <path
                  d={secondaryLineD}
                  fill="none"
                  stroke={meta.secondaryColor}
                  strokeWidth="3.2"
                  filter={`url(#ambientGlowSecondary-${activeKpi}-${chartType})`}
                  opacity="0.95"
                />

                {/* Primary Diffused Glow & Area */}
                <path
                  d={primaryAreaD}
                  fill={`url(#gradPrimaryFill-${activeKpi}-${chartType})`}
                  filter={`url(#ambientGlowPrimary-${activeKpi}-${chartType})`}
                  opacity="0.85"
                />
                <path
                  d={primaryLineD}
                  fill="none"
                  stroke={meta.primaryColor}
                  strokeWidth="3.6"
                  filter={`url(#ambientGlowPrimary-${activeKpi}-${chartType})`}
                />
              </>
            )}

            {/* Columnas Simples (pointer-events-none) */}
            {chartType === 'bars' &&
              visibleData.map((m, i) => {
                const cx = getX(i, visibleData.length);
                const barW = Math.min(18, Math.max(6, plotW / (visibleData.length * 2.8)));
                const hP = (primarySeries[i] / maxVal) * plotH;
                const hS = (secondarySeries[i] / maxVal) * plotH;
                const yP = padTop + plotH - hP;
                const yS = padTop + plotH - hS;

                return (
                  <g key={m.month}>
                    <rect
                      x={cx - barW - 2}
                      y={yP}
                      width={barW}
                      height={Math.max(3, hP)}
                      rx={3}
                      fill={meta.primaryColor}
                      opacity={0.9}
                    />
                    <rect
                      x={cx + 2}
                      y={yS}
                      width={barW}
                      height={Math.max(3, hS)}
                      rx={3}
                      fill={meta.secondaryColor}
                      opacity={0.9}
                    />
                  </g>
                );
              })}

            {/* Barras Ejecutivas Apiladas de Alto Contraste (pointer-events-none) */}
            {chartType === 'stacked' &&
              visibleData.map((m, i) => {
                const cx = getX(i, visibleData.length);
                const barW = Math.min(34, Math.max(12, plotW / (visibleData.length * 2.3)));
                const wonH = (Math.min(maxVal, m.closedWon) / maxVal) * plotH;
                const commitH = (Math.min(maxVal, m.commit) / maxVal) * plotH;
                const bestH = (Math.min(maxVal, m.bestCase) / maxVal) * plotH;
                const yWon = padTop + plotH - wonH;
                const yCommit = yWon - commitH;
                const yBest = yCommit - bestH;
                return (
                  <g key={m.month}>
                    {/* Facturado (Closed Won) */}
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
                      rx={3}
                      fill="#C6F432"
                    />
                  </g>
                );
              })}
          </g>

          {/* Interactive Data Points & X-Axis Labels (pointer-events-none) */}
          <g className="pointer-events-none">
            {visibleData.map((m, i) => {
              const cx = getX(i, visibleData.length);
              const cyP = getY(primarySeries[i]);
              const cyS = getY(secondarySeries[i]);
              const isHov = hoveredIdx === i;
              return (
                <g key={m.month}>
                  {isHov && (
                    <line
                      x1={cx}
                      y1={padTop}
                      x2={cx}
                      y2={padTop + plotH}
                      stroke={meta.primaryColor}
                      strokeWidth="1.5"
                      strokeDasharray="3 3"
                    />
                  )}
                  {chartType === 'area' && (
                    <>
                      <circle
                        cx={cx}
                        cy={cyP}
                        r={isHov ? 6 : 4}
                        fill={meta.primaryColor}
                        stroke="#0B132B"
                        strokeWidth="1.5"
                      />
                      <circle
                        cx={cx}
                        cy={cyS}
                        r={isHov ? 6 : 4}
                        fill={meta.secondaryColor}
                        stroke="#0B132B"
                        strokeWidth="1.5"
                      />
                    </>
                  )}
                  <text
                    x={cx}
                    y={svgHeight - 10}
                    textAnchor="middle"
                    className={`${
                      visibleData.length > 14
                        ? 'text-[8.5px] sm:text-[9.5px]'
                        : 'text-[10px] sm:text-[11px]'
                    } font-mono ${
                      isHov
                        ? 'fill-[#2A5FFF] dark:fill-[#00B4D8] font-bold'
                        : 'fill-slate-500 dark:fill-slate-400'
                    }`}
                  >
                    {shortMonthName(m.month)}
                  </text>
                </g>
              );
            })}
          </g>

          {/* Single Seamless Interactive Mouse Tracking Overlay (Elimina 100% el parpadeo / flickering) */}
          <rect
            x={0}
            y={0}
            width={svgWidth}
            height={svgHeight}
            fill="transparent"
            className="cursor-crosshair"
            onMouseMove={(e) => {
              const svg = e.currentTarget.ownerSVGElement;
              if (!svg || visibleData.length === 0) return;
              const rect = svg.getBoundingClientRect();
              const mouseSvgX = ((e.clientX - rect.left) / rect.width) * svgWidth;
              let closestIdx = 0;
              let minDiff = Infinity;
              for (let i = 0; i < visibleData.length; i++) {
                const diff = Math.abs(getX(i, visibleData.length) - mouseSvgX);
                if (diff < minDiff) {
                  minDiff = diff;
                  closestIdx = i;
                }
              }
              setHoveredIdx(closestIdx);
            }}
            onMouseLeave={() => setHoveredIdx(null)}
          />
        </svg>
      </div>

      {/* Stable Non-Collapsing Hover Detail Banner (Never shifts height, prevents all flicker) */}
      <div className="min-h-[46px] p-2.5 rounded-xl bg-slate-100 dark:bg-[#081024] border border-slate-200 dark:border-[#00B4D8]/30 flex flex-wrap items-center justify-between gap-3 text-xs transition-colors">
        {hoveredIdx !== null && visibleData[hoveredIdx] ? (
          <>
            <span className="font-serif font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#00B4D8] animate-ping" />
              {visibleData[hoveredIdx].month} ({visibleData[hoveredIdx].dealsCount} negocios)
            </span>
            <div className="flex flex-wrap items-center gap-3 sm:gap-4 font-mono">
              <span className="text-[#2A5FFF] dark:text-[#00B4D8] font-bold">
                {meta.primaryLabel}: {formatUnit(primarySeries[hoveredIdx], false)}
              </span>
              <span className="text-emerald-700 dark:text-[#C6F432] font-bold">
                {meta.secondaryLabel}: {formatUnit(secondarySeries[hoveredIdx], false)}
              </span>
              <span className="text-slate-500 dark:text-slate-400 font-semibold hidden sm:inline">
                Facturado: {fmtCurrency(visibleData[hoveredIdx].closedWon, false)}
              </span>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-between w-full text-slate-500 dark:text-slate-400 font-mono text-[11px]">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#2A5FFF] dark:bg-[#00B4D8]" />
              💡 Desplaza el cursor sobre el gráfico para inspeccionar el detalle por mes
            </span>
            <span className="font-semibold text-slate-600 dark:text-slate-300">
              {visibleData.length} meses en ventana activa
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ForecastChart;
