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
  onRangeChange: (startIdx: number, endIdx: number) => void;
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
}) => {
  const [chartType, setChartType] = useState<'area' | 'bars' | 'stacked'>('area');
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const fmtCurrency = (val: number, compact = true) =>
    formatCurrency(val, currency, exchangeRate, compact);

  const kpiMeta: Record<KpiKey, KpiChartMeta> = useMemo(
    () => ({
      weightedPipeline: {
        title: 'Forecast (Commit + Best Case) vs Weighted Pipeline',
        subtitle: 'Proyección ponderada mensual e ingresos cerrados frente a la meta',
        primaryLabel: 'Forecast + Facturado',
        secondaryLabel: 'Weighted Pipeline + Facturado',
        targetLabel: `Meta Mensual (${fmtCurrency(quotaClp, false)})`,
        primaryColor: '#00B4D8',
        secondaryColor: '#C6F432',
        unitType: 'currency',
        getPrimary: (m) => m.forecast + m.closedWon,
        getSecondary: (m) => m.weighted + m.closedWon,
        getTarget: (q) => q,
      },
      pipelineCoverage: {
        title: 'Evolución de Pipeline Coverage (Ratio × sobre Meta)',
        subtitle: 'Relación entre volumen de oportunidades calificadas y cuota mensual (Óptimo ≥ 3.0×)',
        primaryLabel: 'Cobertura Total (× Meta)',
        secondaryLabel: 'Cobertura Ponderada (× Meta)',
        targetLabel: 'Ratio Óptimo B2B (3.0×)',
        primaryColor: '#00B4D8',
        secondaryColor: '#C6F432',
        unitType: 'ratio',
        getPrimary: (m) => m.coverageRatio,
        getSecondary: (m) =>
          Number(((m.weighted + m.closedWon) / Math.max(1, quotaClp)).toFixed(2)),
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
        getPrimary: (m) => m.accuracyPct,
        getSecondary: (m) =>
          m.pipelineOpen + m.closedWon > 0
            ? Number(
                (
                  ((m.weighted + m.closedWon) / (m.pipelineOpen + m.closedWon)) *
                  100
                ).toFixed(1)
              )
            : 75,
        getTarget: () => 85,
      },
      activePipelineValue: {
        title: 'Masa Crítica de Cotizaciones Vigentes (Active Pipeline)',
        subtitle: 'Volumen bruto total de ofertas abiertas vs valor ponderado por mes de cierre',
        primaryLabel: 'Pipeline Bruto Abierto',
        secondaryLabel: 'Weighted Pipeline',
        targetLabel: `Meta Mensual (${fmtCurrency(quotaClp, false)})`,
        primaryColor: '#38BDF8',
        secondaryColor: '#C6F432',
        unitType: 'currency',
        getPrimary: (m) => m.pipelineOpen + m.closedWon,
        getSecondary: (m) => m.weighted + m.closedWon,
        getTarget: (q) => q,
      },
      weightedGrossMarginPct: {
        title: 'Rentabilidad & Margen Bruto Ponderado (%)',
        subtitle: 'Control de margen comercial sobre propuestas activas frente al umbral mínimo del 18%',
        primaryLabel: 'Margen Bruto Ponderado (%)',
        secondaryLabel: 'Margen Objetivo TECNOVOA (%)',
        targetLabel: 'Piso Mínimo Rentabilidad (18%)',
        primaryColor: '#C6F432',
        secondaryColor: '#00B4D8',
        unitType: 'percent',
        getPrimary: (m) => m.marginPct,
        getSecondary: () => 22.5,
        getTarget: () => 18.0,
      },
      quoteToCloseDays: {
        title: 'Velocidad Comercial: Quote-to-Close Time (Días)',
        subtitle: 'Días promedio desde emisión de cotización hasta recepción de Orden de Compra (OC)',
        primaryLabel: 'Ciclo Promedio Cierre (Días)',
        secondaryLabel: 'Benchmark Venta Ágil (Días)',
        targetLabel: 'SLA Máximo Recomendado (30 días)',
        primaryColor: '#00B4D8',
        secondaryColor: '#C6F432',
        unitType: 'days',
        getPrimary: (m) => m.avgCycleDays,
        getSecondary: () => 15,
        getTarget: () => 30,
      },
      winRate: {
        title: 'Efectividad de Cierre: Win Rate Comercial (%)',
        subtitle: 'Porcentaje de adjudicación sobre oportunidades resueltas y calificadas por período',
        primaryLabel: 'Win Rate Efectivo (%)',
        secondaryLabel: 'Probabilidad Media Cartera (%)',
        targetLabel: 'Benchmark Competitivo B2B (50%)',
        primaryColor: '#C6F432',
        secondaryColor: '#00B4D8',
        unitType: 'percent',
        getPrimary: (m) => m.winRatePct,
        getSecondary: (m) =>
          m.pipelineOpen > 0
            ? Number(((m.weighted / m.pipelineOpen) * 100).toFixed(1))
            : 60,
        getTarget: () => 50,
      },
      averageDealSize: {
        title: 'Evolución del Ticket Promedio (Average Deal Size)',
        subtitle: 'Tamaño medio por operación comercial en cada período fiscal vs ticket ponderado',
        primaryLabel: 'Ticket Promedio Bruto',
        secondaryLabel: 'Ticket Promedio Ponderado',
        targetLabel: `Referencia 25% Meta (${fmtCurrency(quotaClp * 0.25, true)})`,
        primaryColor: '#00B4D8',
        secondaryColor: '#C6F432',
        unitType: 'currency',
        getPrimary: (m) => m.avgDealSize,
        getSecondary: (m) =>
          m.dealsCount > 0
            ? Math.round((m.weighted + m.closedWon) / m.dealsCount)
            : 0,
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
  const padLeft = 18;
  const padRight = 18;
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
    const bottomY = (padTop + plotH).toFixed(1);
    return `${line} L ${svgWidth} ${bottomY} L 0 ${bottomY} Z`;
  };

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((t) => t * maxVal);

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

  return (
    <div className="rounded-xl p-5 border bg-white/95 border-[#DDD4C5] dark:bg-[#101D38]/90 dark:border-slate-800/80 shadow-sm flex flex-col justify-between h-full">
      {/* Header & View Mode Controls */}
      <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded bg-[#2A5FFF]/10 text-[#2A5FFF] dark:bg-[#00B4D8]/15 dark:text-[#00B4D8] font-semibold">
              KPI Dinámico · {activeKpi}
            </span>
            <span className="text-xs text-slate-400 dark:text-slate-500 font-mono">
              Haz clic en cualquier tarjeta KPI abajo para cambiar este gráfico
            </span>
          </div>
          <h2 className="text-lg font-serif font-bold text-slate-900 dark:text-white mt-1">
            {meta.title}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {meta.subtitle}
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-[#070C1C] p-1.5 rounded-xl border border-slate-300 dark:border-slate-800">
          <button
            onClick={() => setChartType('area')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              chartType === 'area'
                ? 'bg-[#2A5FFF] text-white shadow-md dark:bg-[#00B4D8] dark:text-[#0B132B]'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            Curva Neón Difuminada
          </button>
          <button
            onClick={() => setChartType('bars')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              chartType === 'bars'
                ? 'bg-[#2A5FFF] text-white shadow-md dark:bg-[#00B4D8] dark:text-[#0B132B]'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <BarChart2 className="w-4 h-4" />
            Barras Ejecutivas
          </button>
          <button
            onClick={() => setChartType('stacked')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition hidden sm:flex ${
              chartType === 'stacked'
                ? 'bg-[#2A5FFF] text-white shadow-md dark:bg-[#00B4D8] dark:text-[#0B132B]'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Desglose
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
          Ventana activa: {shortMonthName(visibleData[0]?.month || '')} →{' '}
          {shortMonthName(visibleData[visibleData.length - 1]?.month || '')}
        </span>
      </div>

      {/* Full-Width Edge-to-Edge SVG Canvas with Diffused Ambient Glow */}
      <div className="relative w-full overflow-hidden rounded-xl bg-slate-50/70 dark:bg-[#081024] border border-slate-200/70 dark:border-slate-800/90">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          preserveAspectRatio="none"
          className="w-full h-64 select-none block"
        >
          <defs>
            {/* Vertical fill gradients */}
            <linearGradient id="gradPrimaryFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={meta.primaryColor} stopOpacity="0.48" />
              <stop offset="55%" stopColor={meta.primaryColor} stopOpacity="0.18" />
              <stop offset="100%" stopColor={meta.primaryColor} stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="gradSecondaryFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={meta.secondaryColor} stopOpacity="0.38" />
              <stop offset="60%" stopColor={meta.secondaryColor} stopOpacity="0.12" />
              <stop offset="100%" stopColor={meta.secondaryColor} stopOpacity="0.0" />
            </linearGradient>

            {/* Horizontal edge-fade mask so the chart blends smoothly into the left & right borders */}
            <linearGradient id="edgeFadeGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="white" stopOpacity="0.08" />
              <stop offset="7%" stopColor="white" stopOpacity="1" />
              <stop offset="93%" stopColor="white" stopOpacity="1" />
              <stop offset="100%" stopColor="white" stopOpacity="0.08" />
            </linearGradient>
            <mask id="edgeFadeMask">
              <rect x="0" y="0" width={svgWidth} height={svgHeight} fill="url(#edgeFadeGradient)" />
            </mask>

            {/* Soft neon glow filter for the curves */}
            <filter id="glowFilter" x="-10%" y="-20%" width="120%" height="140%">
              <feGaussianBlur stdDeviation="5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Subtle Ambient Radial Spotlights filling left, center & right zones */}
          <ellipse
            cx={svgWidth * 0.18}
            cy={padTop + plotH * 0.55}
            rx={220}
            ry={95}
            fill={meta.primaryColor}
            opacity="0.07"
          />
          <ellipse
            cx={svgWidth * 0.82}
            cy={padTop + plotH * 0.45}
            rx={240}
            ry={105}
            fill={meta.secondaryColor}
            opacity="0.07"
          />

          {/* Horizontal Grid Lines across full width */}
          {yTicks.map((tick, idx) => {
            const y = getY(tick);
            return (
              <g key={idx}>
                <line
                  x1={0}
                  y1={y}
                  x2={svgWidth}
                  y2={y}
                  stroke="currentColor"
                  className="text-slate-200/90 dark:text-slate-800/90"
                  strokeDasharray="3 3"
                  strokeWidth="1"
                />
                <text
                  x={10}
                  y={y - 5}
                  textAnchor="start"
                  className="text-[10px] font-mono fill-slate-400 dark:fill-slate-500"
                >
                  {formatUnit(tick, true)}
                </text>
              </g>
            );
          })}

          {/* Target Reference Line */}
          <line
            x1={0}
            y1={targetY}
            x2={svgWidth}
            y2={targetY}
            stroke="#FB7185"
            strokeWidth="1.5"
            strokeDasharray="6 4"
          />
          <text
            x={svgWidth - 12}
            y={Math.max(14, targetY - 6)}
            textAnchor="end"
            className="text-[10px] font-mono fill-rose-400 font-semibold"
          >
            REF: {formatUnit(targetValue, true)}
          </text>

          {/* Main Plotted Series with Edge-Fade Diffused Mask */}
          <g mask="url(#edgeFadeMask)">
            {chartType === 'area' && (
              <>
                <path d={buildSmoothArea(primarySeries)} fill="url(#gradPrimaryFill)" />
                <path
                  d={buildSmoothLine(primarySeries, true)}
                  fill="none"
                  stroke={meta.primaryColor}
                  strokeWidth="3"
                  filter="url(#glowFilter)"
                />

                <path d={buildSmoothArea(secondarySeries)} fill="url(#gradSecondaryFill)" />
                <path
                  d={buildSmoothLine(secondarySeries, true)}
                  fill="none"
                  stroke={meta.secondaryColor}
                  strokeWidth="2.5"
                  filter="url(#glowFilter)"
                />
              </>
            )}

            {chartType === 'bars' &&
              visibleData.map((m, i) => {
                const cx = getX(i, visibleData.length);
                const barW = Math.min(28, Math.max(14, plotW / (visibleData.length * 3.2)));
                const yP = getY(primarySeries[i]);
                const hP = padTop + plotH - yP;
                const yS = getY(secondarySeries[i]);
                const hS = padTop + plotH - yS;
                return (
                  <g
                    key={m.month}
                    onMouseEnter={() => setHoveredIdx(i)}
                    onMouseLeave={() => setHoveredIdx(null)}
                    className="cursor-pointer"
                  >
                    <rect
                      x={cx - barW - 3}
                      y={yP}
                      width={barW}
                      height={Math.max(3, hP)}
                      rx={4}
                      fill={meta.primaryColor}
                      opacity={0.9}
                    />
                    <rect
                      x={cx + 3}
                      y={yS}
                      width={barW}
                      height={Math.max(3, hS)}
                      rx={4}
                      fill={meta.secondaryColor}
                      opacity={0.9}
                    />
                  </g>
                );
              })}

            {chartType === 'stacked' &&
              visibleData.map((m, i) => {
                const cx = getX(i, visibleData.length);
                const barW = Math.min(36, Math.max(18, plotW / (visibleData.length * 2.5)));
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
                    <rect
                      x={cx - barW / 2}
                      y={yWon}
                      width={barW}
                      height={Math.max(0, wonH)}
                      fill="#10B981"
                    />
                    <rect
                      x={cx - barW / 2}
                      y={yCommit}
                      width={barW}
                      height={Math.max(0, commitH)}
                      fill="#00B4D8"
                    />
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

          {/* Interactive Data Points & X-Axis Labels */}
          {visibleData.map((m, i) => {
            const cx = getX(i, visibleData.length);
            const cyP = getY(primarySeries[i]);
            const cyS = getY(secondarySeries[i]);
            const isHov = hoveredIdx === i;
            return (
              <g
                key={m.month}
                onMouseEnter={() => setHoveredIdx(i)}
                onMouseLeave={() => setHoveredIdx(null)}
                className="cursor-pointer"
              >
                {isHov && (
                  <line
                    x1={cx}
                    y1={padTop}
                    x2={cx}
                    y2={padTop + plotH}
                    stroke={meta.primaryColor}
                    strokeWidth="1"
                    strokeDasharray="2 2"
                  />
                )}
                <rect
                  x={cx - 32}
                  y={padTop}
                  width={64}
                  height={plotH}
                  fill="transparent"
                />
                {chartType === 'area' && (
                  <>
                    <circle
                      cx={cx}
                      cy={cyP}
                      r={isHov ? 6 : 4.5}
                      fill={meta.primaryColor}
                      stroke="#0B132B"
                      strokeWidth="1.5"
                    />
                    <circle
                      cx={cx}
                      cy={cyS}
                      r={isHov ? 6 : 4.5}
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
        </svg>
      </div>

      {/* Interactive Hover Detail Banner */}
      {hoveredIdx !== null && visibleData[hoveredIdx] && (
        <div className="mt-2.5 p-2.5 rounded-lg bg-slate-100 dark:bg-[#0B132B] border border-slate-200 dark:border-[#00B4D8]/30 flex flex-wrap items-center justify-between gap-3 text-xs">
          <span className="font-serif font-bold text-slate-900 dark:text-white">
            {visibleData[hoveredIdx].month} ({visibleData[hoveredIdx].dealsCount} negocios)
          </span>
          <div className="flex flex-wrap items-center gap-4 font-mono">
            <span className="text-[#2A5FFF] dark:text-[#00B4D8] font-semibold">
              {meta.primaryLabel}: {formatUnit(primarySeries[hoveredIdx], false)}
            </span>
            <span className="text-emerald-700 dark:text-[#C6F432] font-semibold">
              {meta.secondaryLabel}: {formatUnit(secondarySeries[hoveredIdx], false)}
            </span>
            <span className="text-slate-500 dark:text-slate-400">
              Facturado: {fmtCurrency(visibleData[hoveredIdx].closedWon, false)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ForecastChart;
