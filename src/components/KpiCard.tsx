import React from 'react';
import { CommercialKpis, KpiKey } from '../utils/kpi';
import { CurrencyCode, formatCurrency } from '../data/pipeline';
import {
  TrendingUp,
  Target,
  Activity,
  Briefcase,
  Percent,
  Clock,
  Award,
  DollarSign,
} from 'lucide-react';

interface Props {
  kpis: CommercialKpis;
  currency: CurrencyCode;
  exchangeRate: number;
  selectedBlock: 'Todos' | 'Forecast' | 'Cotizaciones' | 'Conversión';
  activeKpi: KpiKey;
  onSelectKpi: (key: KpiKey) => void;
}

export const KpiCard: React.FC<Props> = ({
  kpis,
  currency,
  exchangeRate,
  selectedBlock,
  activeKpi,
  onSelectKpi,
}) => {
  const fmt = (val: number, compact = true) =>
    formatCurrency(val, currency, exchangeRate, compact);

  const cards = [
    {
      key: 'weightedPipeline' as KpiKey,
      block: 'Forecast',
      blockLabel: 'PRONÓSTICO',
      title: 'Cartera Ponderada',
      mainValue: fmt(kpis.weightedPipeline, true),
      badge: `${kpis.projectedAttainmentPct}% Meta`,
      badgeColor:
        kpis.projectedAttainmentPct >= 100
          ? 'bg-emerald-500/15 text-emerald-700 border-emerald-500/40'
          : 'bg-amber-500/15 text-amber-700 border-amber-500/40',
      mathFormula: 'P = ∑ ( Montoᵢ × Probᵢ% )',
      icon: TrendingUp,
    },
    {
      key: 'pipelineCoverage' as KpiKey,
      block: 'Forecast',
      blockLabel: 'PRONÓSTICO',
      title: 'Cobertura de Cuota',
      mainValue: `${kpis.pipelineCoverage}×`,
      badge: kpis.pipelineCoverage >= 3 ? 'Óptimo (≥3×)' : 'Reforzar (<3×)',
      badgeColor:
        kpis.pipelineCoverage >= 3
          ? 'bg-emerald-500/15 text-emerald-700 border-emerald-500/40'
          : 'bg-rose-500/15 text-rose-700 border-rose-500/40',
      mathFormula: 'C = Cartera Abierta ÷ Meta Faltante',
      icon: Target,
    },
    {
      key: 'forecastAccuracy' as KpiKey,
      block: 'Forecast',
      blockLabel: 'PRONÓSTICO',
      title: 'Precisión de Pronóstico',
      mainValue: `${kpis.forecastAccuracy}%`,
      badge: kpis.forecastAccuracy >= 85 ? 'Exacto (≥85%)' : 'En Ajuste',
      badgeColor:
        kpis.forecastAccuracy >= 85
          ? 'bg-emerald-500/15 text-emerald-700 border-emerald-500/40'
          : 'bg-amber-500/15 text-amber-700 border-amber-500/40',
      mathFormula: 'E = 1 − ( |Pronóstico − Real| ÷ Máx )',
      icon: Activity,
    },
    {
      key: 'activePipelineValue' as KpiKey,
      block: 'Cotizaciones',
      blockLabel: 'COTIZACIONES',
      title: 'Valor Total en Cartera',
      mainValue: fmt(kpis.activePipelineValue, true),
      badge: `${kpis.openDealsCount} Activas`,
      badgeColor: 'bg-blue-500/15 text-blue-700 border-blue-500/40',
      mathFormula: 'V = ∑ Cotizaciones Vigentes',
      icon: Briefcase,
    },
    {
      key: 'weightedGrossMarginPct' as KpiKey,
      block: 'Cotizaciones',
      blockLabel: 'COTIZACIONES',
      title: 'Margen Bruto Ponderado',
      mainValue: `${kpis.weightedGrossMarginPct}%`,
      badge: kpis.weightedGrossMarginPct >= 20 ? 'Sano (≥20%)' : 'Piso 18%',
      badgeColor: 'bg-emerald-500/15 text-emerald-700 border-emerald-500/40',
      mathFormula: 'M = ∑ ( Margenᵢ × Pondᵢ ) ÷ Total',
      icon: Percent,
    },
    {
      key: 'quoteToCloseDays' as KpiKey,
      block: 'Cotizaciones',
      blockLabel: 'COTIZACIONES',
      title: 'Ciclo de Cierre (Días)',
      mainValue: `${kpis.quoteToCloseDays} días`,
      badge: kpis.quoteToCloseDays <= 30 ? 'Ágil (≤30d)' : 'Lento (>30d)',
      badgeColor:
        kpis.quoteToCloseDays <= 30
          ? 'bg-emerald-500/15 text-emerald-700 border-emerald-500/40'
          : 'bg-amber-500/15 text-amber-700 border-amber-500/40',
      mathFormula: 'D = ∑ ( Fecha OC − Emisión ) ÷ n',
      icon: Clock,
    },
    {
      key: 'winRate' as KpiKey,
      block: 'Conversión',
      blockLabel: 'CONVERSIÓN',
      title: 'Tasa de Cierre (Éxito)',
      mainValue: `${kpis.winRate}%`,
      badge: `${kpis.wonDealsCount} Ganadas`,
      badgeColor:
        kpis.winRate >= 50
          ? 'bg-emerald-500/15 text-emerald-700 border-emerald-500/40'
          : 'bg-amber-500/15 text-amber-700 border-amber-500/40',
      mathFormula: 'T = Ganadas ÷ ( Ganadas + Perdidas )',
      icon: Award,
    },
    {
      key: 'averageDealSize' as KpiKey,
      block: 'Conversión',
      blockLabel: 'CONVERSIÓN',
      title: 'Ticket Promedio Venta',
      mainValue: fmt(kpis.averageDealSizeWon, true),
      badge: `Abierto: ${fmt(kpis.averageDealSizeOpen, true)}`,
      badgeColor: 'bg-blue-500/15 text-blue-700 border-blue-500/40',
      mathFormula: 'X̄ = ∑ Facturación Ganada ÷ n',
      icon: DollarSign,
    },
  ];

  const visibleCards =
    selectedBlock === 'Todos'
      ? cards
      : cards.filter((c) => c.block === selectedBlock);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {visibleCards.map((c) => {
        const Icon = c.icon;
        const isActive = activeKpi === c.key;
        return (
          <div
            key={c.key}
            role="button"
            tabIndex={0}
            onClick={() => onSelectKpi(c.key)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSelectKpi(c.key);
              }
            }}
            className={`group relative px-3.5 py-2.5 rounded-2xl transition-all duration-150 cursor-pointer select-none flex flex-col justify-between ${
              isActive
                ? 'bg-blue-50/70 dark:bg-[#132347] border-2 border-[#2A5FFF] shadow-md ring-2 ring-[#2A5FFF]/20'
                : 'bg-white dark:bg-[#0E172E] border border-slate-200 dark:border-slate-800 hover:border-[#2A5FFF]'
            }`}
          >
            {/* Cabecera Compacta */}
            <div>
              <div className="flex items-center justify-between gap-1 mb-1">
                <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold">
                  {c.blockLabel}
                </span>
                <div className="flex items-center gap-1.5">
                  <span
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${c.badgeColor}`}
                  >
                    {c.badge}
                  </span>
                  <div
                    className={`p-1 rounded-lg ${
                      isActive
                        ? 'bg-[#2A5FFF] text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-[#2A5FFF] dark:text-[#00B4D8]'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>

              {/* Título y Valor Principal */}
              <div className="flex items-baseline justify-between gap-2 my-1">
                <h3 className="text-xs sm:text-sm font-serif font-bold text-slate-800 dark:text-slate-100 truncate">
                  {c.title}
                </h3>
                <span className="text-xl sm:text-2xl font-serif font-black tracking-tight text-slate-900 dark:text-white shrink-0">
                  {c.mainValue}
                </span>
              </div>
            </div>

            {/* FÓRMULA EN CURSIVA GRANDE FULL MATEMÁTICO CON FONDO BLANCO */}
            <div
              className={`mt-1.5 px-2.5 py-1.5 rounded-xl bg-white border-2 transition-all flex items-center justify-between gap-1.5 shadow-sm ${
                isActive
                  ? 'border-[#2A5FFF] ring-2 ring-[#2A5FFF]/15'
                  : 'border-slate-300 group-hover:border-[#2A5FFF]/60'
              }`}
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <span
                  style={{ fontFamily: "'EB Garamond', Georgia, serif" }}
                  className="text-sm sm:text-base italic font-bold text-[#2A5FFF] shrink-0"
                >
                  ƒ(x):
                </span>
                <span
                  style={{ fontFamily: "'EB Garamond', Georgia, serif" }}
                  className="text-sm sm:text-[15px] italic font-bold text-slate-900 tracking-wide truncate"
                >
                  {c.mathFormula}
                </span>
              </div>
              {isActive && (
                <span className="text-[9px] font-mono uppercase bg-[#2A5FFF] text-white px-1.5 py-0.5 rounded font-black shrink-0">
                  ACTIVO
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default KpiCard;
