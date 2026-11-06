import React, { useState, useMemo } from 'react';
import { MonthlySummary, KpiKey } from '../utils/kpi';
import { CurrencyCode, formatCurrency } from '../data/pipeline';
import {
  BarChart2,
  TrendingUp,
  Layers,
  Activity,
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
  defaultChartType?: 'area' | 'stacked' | 'bars' | 'combo';
  customTitle?: string;
  customSubtitle?: string;
}

interface KpiChartMeta {
  badge: string;
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
  defaultChartType = 'area',
  customTitle,
  customSubtitle,
}) => {
  const [chartType, setChartType] = useState<'area' | 'stacked' | 'bars' | 'combo'>(defaultChartType);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const fmtCurrency = (val: number, compact = true) =>
    formatCurrency(Number(val) || 0, currency, exchangeRate, compact);

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

  // Configuración 100% en español para los 8 indicadores estratégicos
  const kpiMeta: Record<KpiKey, KpiChartMeta> = useMemo(
    () => ({
      weightedPipeline: {
        badge: 'CARTERA PONDERADA',
        title: 'Pronóstico Comercial vs Cartera Ponderada por Mes',
        subtitle: 'Proyección ponderada mensual e ingresos facturados frente a la meta comercial',
        primaryLabel: 'Pronóstico + Facturado',
        secondaryLabel: 'Ponderado + Facturado',
        targetLabel: `Meta Mensual (${fmtCurrency(quotaClp, true)})`,
        primaryColor: '#2A5FFF',
        secondaryColor: '#10B981',
        unitType: 'currency',
        getPrimary: (m) => (Number(m.forecast) || 0) + (Number(m.closedWon) || 0),
        getSecondary: (m) => (Number(m.weighted) || 0) + (Number(m.closedWon) || 0),
        getTarget: (q) => Number(q) || 15000000,
      },
      pipelineCoverage: {
        badge: 'COBERTURA DE CUOTA',
        title: 'Evolución de Cobertura de Cuota (Veces × sobre Meta)',
        subtitle: 'Relación entre volumen de oportunidades activas y cuota mensual (Óptimo ≥ 3.0×)',
        primaryLabel: 'Cobertura Total (× Meta)',
        secondaryLabel: 'Cobertura Ponderada (× Meta)',
        targetLabel: 'Nivel Óptimo (3.0×)',
        primaryColor: '#2A5FFF',
        secondaryColor: '#10B981',
        unitType: 'ratio',
        getPrimary: (m) => Number(m.coverageRatio) || 0,
        getSecondary: (m) =>
          Number((((Number(m.weighted) || 0) + (Number(m.closedWon) || 0)) / Math.max(1, quotaClp)).toFixed(2)),
        getTarget: () => 3.0,
      },
      forecastAccuracy: {
        badge: 'PRECISIÓN DE PRONÓSTICO',
        title: 'Calibración y Precisión del Pronóstico (%) por Período',
        subtitle: 'Exactitud entre compromisos de cierre y facturación real alcanzada',
        primaryLabel: 'Precisión del Pronóstico (%)',
        secondaryLabel: 'Conversión Ponderada (%)',
        targetLabel: 'Meta de Exactitud (85%)',
        primaryColor: '#2A5FFF',
        secondaryColor: '#10B981',
        unitType: 'percent',
        getPrimary: (m) => Number(m.accuracyPct) || 0,
        getSecondary: (m) => {
          const denom = (Number(m.pipelineOpen) || 0) + (Number(m.closedWon) || 0);
          return denom > 0
            ? Number(((((Number(m.weighted) || 0) + (Number(m.closedWon) || 0)) / denom) * 100).toFixed(1))
            : 75;
        },
        getTarget: () => 85,
      },
      activePipelineValue: {
        badge: 'VALOR EN CARTERA',
        title: 'Volumen de Cotizaciones Activas vs Ingresos Facturados',
        subtitle: 'Monto bruto total de ofertas abiertas frente a ventas ya cerradas por mes',
        primaryLabel: 'Cartera Abierta + Ganado',
        secondaryLabel: 'Cartera Ponderada',
        targetLabel: `Meta Mensual (${fmtCurrency(quotaClp, true)})`,
        primaryColor: '#0284C7',
        secondaryColor: '#10B981',
        unitType: 'currency',
        getPrimary: (m) => (Number(m.pipelineOpen) || 0) + (Number(m.closedWon) || 0),
        getSecondary: (m) => (Number(m.weighted) || 0) + (Number(m.closedWon) || 0),
        getTarget: (q) => Number(q) || 15000000,
      },
      weightedGrossMarginPct: {
        badge: 'MARGEN BRUTO PONDERADO',
        title: 'Rentabilidad y Margen Bruto Ponderado (%)',
        subtitle: 'Control de margen comercial sobre propuestas activas frente al piso del 18%',
        primaryLabel: 'Margen Ponderado (%)',
        secondaryLabel: 'Margen Objetivo (%)',
        targetLabel: 'Piso Mínimo (18%)',
        primaryColor: '#10B981',
        secondaryColor: '#2A5FFF',
        unitType: 'percent',
        getPrimary: (m) => Number(m.marginPct) || 0,
        getSecondary: () => 22.5,
        getTarget: () => 18.0,
      },
      quoteToCloseDays: {
        badge: 'CICLO DE CIERRE',
        title: 'Velocidad Comercial: Días de Ciclo de Cierre',
        subtitle: 'Días promedio desde emisión de cotización hasta recepción de Orden de Compra',
        primaryLabel: 'Días Promedio de Cierre',
        secondaryLabel: 'Referencia Venta Ágil',
        targetLabel: 'Plazo Máximo (30 días)',
        primaryColor: '#7C3AED',
        secondaryColor: '#0284C7',
        unitType: 'days',
        getPrimary: (m) => Number(m.avgCycleDays) || 0,
        getSecondary: () => 15,
        getTarget: () => 30,
      },
      winRate: {
        badge: 'TASA DE ÉXITO',
        title: 'Efectividad de Cierre Comercial (% Negocios Ganados)',
        subtitle: 'Porcentaje de adjudicación sobre oportunidades resueltas por período',
        primaryLabel: 'Tasa de Cierre (%)',
        secondaryLabel: 'Probabilidad Media Cartera (%)',
        targetLabel: 'Meta Competitiva (50%)',
        primaryColor: '#10B981',
        secondaryColor: '#2A5FFF',
        unitType: 'percent',
        getPrimary: (m) => Number(m.winRatePct) || 0,
        getSecondary: (m) =>
          (Number(m.pipelineOpen) || 0) > 0
            ? Number((((Number(m.weighted) || 0) / (Number(m.pipelineOpen) || 1)) * 100).toFixed(1))
            : 60,
        getTarget: () => 50,
      },
      averageDealSize: {
        badge: 'TICKET PROMEDIO',
        title: 'Evolución del Ticket Promedio por Negocio',
        subtitle: 'Tamaño monetario promedio por operación comercial en cada período',
        primaryLabel: 'Ticket Promedio Bruto',
        secondaryLabel: 'Ticket Promedio Ponderado',
        targetLabel: `Referencia (${fmtCurrency(quotaClp * 0.25, true)})`,
        primaryColor: '#D97706',
        secondaryColor: '#10B981',
        unitType: 'currency',
        getPrimary: (m) => Number(m.avgDealSize) || 0,
        getSecondary: (m) =>
          (Number(m.dealsCount) || 0) > 0
            ? Math.round(((Number(m.weighted) || 0) + (Number(m.closedWon) || 0)) / m.dealsCount)
            : 0,
        getTarget: (q) => (Number(q) || 15000000) * 0.25,
      },
    }),
    [quotaClp, currency, exchangeRate]
  );

  const meta = kpiMeta[activeKpi] || kpiMeta.weightedPipeline;

  const formatUnit = (val: number, compact = true) => {
    const clean = Number(val) || 0;
    if (meta.unitType === 'currency') return fmtCurrency(clean, compact);
    if (meta.unitType === 'ratio') return `${clean.toFixed(2)}×`;
    if (meta.unitType === 'percent') return `${clean.toFixed(1)}%`;
    return `${Math.round(clean)} días`;
  };

  // Slice monthlyData according to timeline From - To indices
  const safeStart = Math.max(0, Math.min(rangeStartIdx, Math.max(0, monthlyData.length - 1)));
  const safeEnd = Math.max(safeStart, Math.min(rangeEndIdx, Math.max(0, monthlyData.length - 1)));
  const visibleData = useMemo(
    () => monthlyData.slice(safeStart, safeEnd + 1),
    [monthlyData, safeStart, safeEnd]
  );

  const primarySeries = visibleData.map((m) => Number(meta.getPrimary(m)) || 0);
  const secondarySeries = visibleData.map((m) => Number(meta.getSecondary(m)) || 0);
  const targetValue = Number(meta.getTarget(quotaClp)) || 1;

  // Compute max value safely (never NaN)
  const stackedTotals = visibleData.map(
    (m) => (Number(m.closedWon) || 0) + (Number(m.commit) || 0) + (Number(m.bestCase) || 0)
  );
  const maxVal = Math.max(
    targetValue * 1.25,
    ...primarySeries,
    ...secondarySeries,
    ...(chartType === 'stacked' || chartType === 'combo' ? stackedTotals : [0]),
    1
  );

  const svgWidth = 960;
  const svgHeight = 205;
  const padLeft = 22;
  const padRight = 22;
  const padTop = 18;
  const padBottom = 26;
  const plotW = svgWidth - padLeft - padRight;
  const plotH = svgHeight - padTop - padBottom;

  const getX = (i: number, total: number) => {
    if (total <= 1) return padLeft + plotW / 2;
    return padLeft + (i / (total - 1)) * plotW;
  };

  const getY = (val: number) => {
    const clean = Number(val) || 0;
    const clamped = Math.min(maxVal, Math.max(0, clean));
    return padTop + plotH - (clamped / maxVal) * plotH;
  };

  const targetY = getY(targetValue);

  const buildSmoothLine = (values: number[], extendEdges = true) => {
    if (values.length === 0) return '';
    const pts = values.map((v, i) => ({
      x: getX(i, values.length),
      y: getY(v),
    }));

    if (extendEdges && pts.length >= 1) {
      const first = pts[0];
      const last = pts[pts.length - 1];
      pts.unshift({ x: 0, y: Math.min(padTop + plotH - 2, first.y + 8) });
      pts.push({ x: svgWidth, y: Math.min(padTop + plotH - 2, last.y + 8) });
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
    <div className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-[#0B132B] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between h-full">
      {/* Header con Botones para ver diferentes tipos de gráficos */}
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-md bg-[#2A5FFF]/10 text-[#2A5FFF] dark:bg-[#00B4D8]/15 dark:text-[#00B4D8] font-bold">
                {meta.badge}
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                {shortMonthName(visibleData[0]?.month || '')} → {shortMonthName(visibleData[visibleData.length - 1]?.month || '')}
              </span>
            </div>
            <h3 className="text-sm sm:text-base font-serif font-bold text-slate-900 dark:text-white mt-0.5">
              {customTitle || meta.title}
            </h3>
          </div>

          {/* 4 Botones para alternar tipo de visualización */}
          <div className="flex flex-wrap items-center gap-1 bg-slate-100 dark:bg-[#070C1C] p-1 rounded-xl border border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setChartType('area')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                chartType === 'area'
                  ? 'bg-[#2A5FFF] text-white shadow-sm dark:bg-[#00B4D8] dark:text-[#0B132B]'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-300'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>1. Curva Suave</span>
            </button>
            <button
              type="button"
              onClick={() => setChartType('stacked')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                chartType === 'stacked'
                  ? 'bg-[#2A5FFF] text-white shadow-sm dark:bg-[#00B4D8] dark:text-[#0B132B]'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-300'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>2. Barras Apiladas</span>
            </button>
            <button
              type="button"
              onClick={() => setChartType('bars')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                chartType === 'bars'
                  ? 'bg-[#2A5FFF] text-white shadow-sm dark:bg-[#00B4D8] dark:text-[#0B132B]'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-300'
              }`}
            >
              <BarChart2 className="w-3.5 h-3.5" />
              <span>3. Columnas</span>
            </button>
            <button
              type="button"
              onClick={() => setChartType('combo')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                chartType === 'combo'
                  ? 'bg-[#2A5FFF] text-white shadow-sm dark:bg-[#00B4D8] dark:text-[#0B132B]'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-300'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>4. Combinado</span>
            </button>
          </div>
        </div>

        {/* Leyenda en Español */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] mb-1.5">
          <div className="flex flex-wrap items-center gap-3">
            {(chartType === 'area' || chartType === 'bars' || chartType === 'combo') && (
              <>
                <div className="flex items-center gap-1.5">
                  <span
                    className="w-2.5 h-2.5 rounded-sm inline-block"
                    style={{ backgroundColor: meta.primaryColor }}
                  />
                  <span className="text-slate-700 dark:text-slate-300 font-medium">
                    {meta.primaryLabel}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span
                    className="w-2.5 h-2.5 rounded-sm inline-block"
                    style={{ backgroundColor: meta.secondaryColor }}
                  />
                  <span className="text-slate-700 dark:text-slate-300 font-medium">
                    {meta.secondaryLabel}
                  </span>
                </div>
              </>
            )}
            {(chartType === 'stacked' || chartType === 'combo') && (
              <>
                <div className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" />
                  <span className="text-slate-700 dark:text-slate-300 font-medium">Facturado Ganado</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#00B4D8] inline-block" />
                  <span className="text-slate-700 dark:text-slate-300 font-medium">Compromiso Firme</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-sm bg-amber-400 inline-block" />
                  <span className="text-slate-700 dark:text-slate-300 font-medium">Mejor Escenario</span>
                </div>
              </>
            )}
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-0.5 border-t-2 border-dashed border-rose-500 inline-block" />
              <span className="text-rose-600 dark:text-rose-400 font-medium">
                {meta.targetLabel}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Lienzo SVG Compacto y Sin Parpadeo */}
      <div className="relative w-full flex-1 min-h-[190px] overflow-hidden rounded-xl bg-slate-50 dark:bg-[#081024] border border-slate-200 dark:border-slate-800">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          preserveAspectRatio="none"
          className="absolute inset-0 w-full h-full select-none block"
        >
          <defs>
            <linearGradient id="gradPrimaryArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={meta.primaryColor} stopOpacity="0.38" />
              <stop offset="100%" stopColor={meta.primaryColor} stopOpacity="0.02" />
            </linearGradient>
            <linearGradient id="gradSecondaryArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={meta.secondaryColor} stopOpacity="0.30" />
              <stop offset="100%" stopColor={meta.secondaryColor} stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {/* Líneas de Grilla Horizontales */}
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
                    className="text-slate-200 dark:text-slate-800"
                    strokeDasharray="4 4"
                    strokeWidth="1"
                  />
                  <text
                    x={padLeft + 2}
                    y={y - 3}
                    className="text-[9px] font-mono font-semibold fill-slate-500 dark:fill-slate-400"
                  >
                    {formatUnit(val, true)}
                  </text>
                </g>
              );
            })}

            {/* Línea de Meta */}
            <line
              x1={0}
              y1={targetY}
              x2={svgWidth}
              y2={targetY}
              stroke="#F43F5E"
              strokeDasharray="6 4"
              strokeWidth="1.8"
            />
            <text
              x={svgWidth - padRight - 4}
              y={Math.max(12, targetY - 5)}
              textAnchor="end"
              className="text-[9px] font-mono font-bold fill-rose-600 dark:fill-rose-400"
            >
              META: {formatUnit(targetValue, true)}
            </text>
          </g>

          {/* Capas de Datos (Barras Apiladas / Columnas / Curvas) */}
          <g className="pointer-events-none">
            {/* Modo 2 o 4: Barras Apiladas de Desglose */}
            {(chartType === 'stacked' || chartType === 'combo') &&
              visibleData.map((m, i) => {
                const cx = getX(i, visibleData.length);
                const barW = Math.min(32, Math.max(10, plotW / (visibleData.length * 2.1)));
                const wonVal = Number(m.closedWon) || 0;
                const commitVal = Number(m.commit) || 0;
                const bestVal = Number(m.bestCase) || 0;

                const wonH = (Math.min(maxVal, wonVal) / maxVal) * plotH;
                const commitH = (Math.min(maxVal, commitVal) / maxVal) * plotH;
                const bestH = (Math.min(maxVal, bestVal) / maxVal) * plotH;

                const yWon = padTop + plotH - wonH;
                const yCommit = yWon - commitH;
                const yBest = yCommit - bestH;

                return (
                  <g key={m.month} opacity={chartType === 'combo' ? 0.65 : 0.95}>
                    <rect
                      x={cx - barW / 2}
                      y={yWon}
                      width={barW}
                      height={Math.max(0, wonH)}
                      fill="#10B981"
                      rx={2}
                    />
                    <rect
                      x={cx - barW / 2}
                      y={yCommit}
                      width={barW}
                      height={Math.max(0, commitH)}
                      fill="#00B4D8"
                      rx={2}
                    />
                    <rect
                      x={cx - barW / 2}
                      y={yBest}
                      width={barW}
                      height={Math.max(0, bestH)}
                      fill="#F59E0B"
                      rx={2}
                    />
                  </g>
                );
              })}

            {/* Modo 3: Columnas Comparativas */}
            {chartType === 'bars' &&
              visibleData.map((m, i) => {
                const cx = getX(i, visibleData.length);
                const barW = Math.min(16, Math.max(5, plotW / (visibleData.length * 2.8)));
                const hP = (primarySeries[i] / maxVal) * plotH;
                const hS = (secondarySeries[i] / maxVal) * plotH;
                const yP = padTop + plotH - hP;
                const yS = padTop + plotH - hS;

                return (
                  <g key={m.month}>
                    <rect
                      x={cx - barW - 1.5}
                      y={yP}
                      width={barW}
                      height={Math.max(2, hP)}
                      rx={2.5}
                      fill={meta.primaryColor}
                    />
                    <rect
                      x={cx + 1.5}
                      y={yS}
                      width={barW}
                      height={Math.max(2, hS)}
                      rx={2.5}
                      fill={meta.secondaryColor}
                    />
                  </g>
                );
              })}

            {/* Modo 1 o 4: Curva Suave */}
            {(chartType === 'area' || chartType === 'combo') && (
              <>
                {chartType === 'area' && (
                  <>
                    <path d={secondaryAreaD} fill="url(#gradSecondaryArea)" />
                    <path d={primaryAreaD} fill="url(#gradPrimaryArea)" />
                  </>
                )}
                <path
                  d={secondaryLineD}
                  fill="none"
                  stroke={meta.secondaryColor}
                  strokeWidth="2.8"
                />
                <path
                  d={primaryLineD}
                  fill="none"
                  stroke={meta.primaryColor}
                  strokeWidth="3.2"
                />
              </>
            )}
          </g>

          {/* Puntos de Datos y Etiquetas de Meses */}
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
                  {(chartType === 'area' || chartType === 'combo') && (
                    <>
                      <circle
                        cx={cx}
                        cy={cyP}
                        r={isHov ? 5.5 : 3.5}
                        fill={meta.primaryColor}
                        stroke="#FFFFFF"
                        strokeWidth="1.5"
                      />
                      <circle
                        cx={cx}
                        cy={cyS}
                        r={isHov ? 5.5 : 3.5}
                        fill={meta.secondaryColor}
                        stroke="#FFFFFF"
                        strokeWidth="1.5"
                      />
                    </>
                  )}
                  <text
                    x={cx}
                    y={svgHeight - 7}
                    textAnchor="middle"
                    className={`${
                      visibleData.length > 14 ? 'text-[8.5px]' : 'text-[10px]'
                    } font-mono ${
                      isHov
                        ? 'fill-[#2A5FFF] dark:fill-[#00B4D8] font-bold'
                        : 'fill-slate-600 dark:fill-slate-400'
                    }`}
                  >
                    {shortMonthName(m.month)}
                  </text>
                </g>
              );
            })}
          </g>

          {/* Capa Única de Seguimiento de Ratón (Cero Parpadeo) */}
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

      {/* Barra Inferior de Inspección con Altura Fija (Sin saltos de pantalla) */}
      <div className="mt-2 min-h-[36px] px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-[#081024] border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
        {hoveredIdx !== null && visibleData[hoveredIdx] ? (
          <>
            <span className="font-serif font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#2A5FFF] dark:bg-[#00B4D8]" />
              {visibleData[hoveredIdx].month} ({visibleData[hoveredIdx].dealsCount} cotizaciones)
            </span>
            <div className="flex flex-wrap items-center gap-3 font-mono text-[11px]">
              <span className="text-[#2A5FFF] dark:text-[#00B4D8] font-bold">
                {meta.primaryLabel}: {formatUnit(primarySeries[hoveredIdx], false)}
              </span>
              <span className="text-emerald-700 dark:text-emerald-400 font-bold">
                {meta.secondaryLabel}: {formatUnit(secondarySeries[hoveredIdx], false)}
              </span>
              <span className="text-slate-600 dark:text-slate-300 font-semibold hidden sm:inline">
                Facturado: {fmtCurrency(visibleData[hoveredIdx].closedWon, false)}
              </span>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-between w-full text-slate-500 dark:text-slate-400 font-mono text-[11px]">
            <span>
              💡 Pasa el cursor sobre el gráfico para inspeccionar cada mes en detalle
            </span>
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              {visibleData.length} meses activos
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ForecastChart;
