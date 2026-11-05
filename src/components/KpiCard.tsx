import React from 'react';
import {
  TrendingUp,
  Target,
  Activity,
  Briefcase,
  Percent,
  Clock,
  Award,
  BarChart3,
  Sparkles,
  Calculator,
} from 'lucide-react';
import { CommercialKpis, KpiKey } from '../utils/kpi';
import { CurrencyCode, formatCurrency } from '../data/pipeline';

interface Props {
  kpis: CommercialKpis;
  currency: CurrencyCode;
  exchangeRate: number;
  selectedBlock?: 'Todos' | 'Forecast' | 'Cotizaciones' | 'Conversión';
  activeKpi: KpiKey;
  onSelectKpi: (key: KpiKey) => void;
}

export const KpiCard: React.FC<Props> = ({
  kpis,
  currency,
  exchangeRate,
  selectedBlock = 'Todos',
  activeKpi,
  onSelectKpi,
}) => {
  const fmt = (val: number, compact = false) =>
    formatCurrency(val, currency, exchangeRate, compact);

  const cards: {
    key: KpiKey;
    block: 'Forecast' | 'Cotizaciones' | 'Conversión';
    title: string;
    formula: string;
    value: string;
    badge: string;
    badgePositive: boolean;
    icon: React.FC<{ className?: string }>;
  }[] = [
    {
      key: 'weightedPipeline',
      block: 'Forecast',
      title: 'Weighted Pipeline',
      formula: '∑ ( Monto × Prob% )',
      value: fmt(kpis.weightedPipeline, true),
      badge: `${((kpis.weightedPipeline / kpis.quotaAmount) * 100).toFixed(0)}% Meta`,
      badgePositive: kpis.weightedPipeline >= kpis.quotaAmount,
      icon: TrendingUp,
    },
    {
      key: 'pipelineCoverage',
      block: 'Forecast',
      title: 'Pipeline Coverage',
      formula: 'Pipeline ÷ Meta Faltante',
      value: `${kpis.pipelineCoverage.toFixed(2)}×`,
      badge: kpis.pipelineCoverage >= 3 ? 'Óptimo (≥3×)' : 'Construir',
      badgePositive: kpis.pipelineCoverage >= 3,
      icon: Target,
    },
    {
      key: 'forecastAccuracy',
      block: 'Forecast',
      title: 'Forecast Accuracy',
      formula: '1 - ( |Forecast - Real| ÷ Max )',
      value: `${kpis.forecastAccuracy.toFixed(1)}%`,
      badge: 'Calibrado',
      badgePositive: kpis.forecastAccuracy >= 80,
      icon: Activity,
    },
    {
      key: 'activePipelineValue',
      block: 'Cotizaciones',
      title: 'Active Pipeline Value',
      formula: '∑ Cotizaciones Vivas',
      value: fmt(kpis.activePipelineValue, true),
      badge: `${kpis.openDealsCount} Oportunidades`,
      badgePositive: true,
      icon: Briefcase,
    },
    {
      key: 'weightedGrossMarginPct',
      block: 'Cotizaciones',
      title: 'Margen Bruto Ponderado',
      formula: '∑ ( Margen $ × Prob ) ÷ Venta',
      value: `${kpis.weightedGrossMarginPct.toFixed(1)}%`,
      badge: kpis.weightedGrossMarginPct >= 20 ? 'Meta ≥20%' : 'Bajo',
      badgePositive: kpis.weightedGrossMarginPct >= 20,
      icon: Percent,
    },
    {
      key: 'averageSalesCycleDays',
      block: 'Cotizaciones',
      title: 'Ciclo de Venta (Días)',
      formula: '∑ Días a la OC ÷ Total',
      value: `${kpis.quoteToCloseDays} días`,
      badge: kpis.quoteToCloseDays <= 25 ? 'Ágil' : 'Consultivo',
      badgePositive: kpis.quoteToCloseDays <= 25,
      icon: Clock,
    },
    {
      key: 'winRatePct',
      block: 'Conversión',
      title: 'Win Rate Comercial',
      formula: 'Won ÷ ( Won + Lost ) × 100',
      value: `${kpis.winRate.toFixed(1)}%`,
      badge: `${kpis.wonDealsCount} Won / ${kpis.lostDealsCount} Lost`,
      badgePositive: kpis.winRate >= 50,
      icon: Award,
    },
    {
      key: 'averageDealSizeWon',
      block: 'Conversión',
      title: 'Ticket Promedio Won',
      formula: 'Facturado ÷ N° Facturas',
      value: fmt(kpis.averageDealSizeWon, true),
      badge: 'Por Operación',
      badgePositive: true,
      icon: BarChart3,
    },
  ];

  const visibleCards =
    selectedBlock === 'Todos'
      ? cards
      : cards.filter((c) => c.block === selectedBlock);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {visibleCards.map((c) => {
        const Icon = c.icon;
        const isSelected = activeKpi === c.key;
        return (
          <div
            key={c.key}
            onClick={() => onSelectKpi(c.key)}
            role="button"
            tabIndex={0}
            className={`group relative rounded-2xl p-4 sm:p-5 transition-all duration-200 border-2 cursor-pointer flex flex-col justify-between ${
              isSelected
                ? 'bg-[#2A5FFF]/10 border-[#2A5FFF] ring-4 ring-[#2A5FFF]/30 dark:bg-[#00B4D8]/15 dark:border-[#00B4D8] dark:ring-[#00B4D8]/40 shadow-xl scale-[1.02]'
                : 'bg-white border-slate-200 hover:border-[#2A5FFF]/60 dark:bg-[#101D38] dark:border-slate-800 dark:hover:border-[#00B4D8]/60 shadow-sm'
            }`}
          >
            <div>
              {/* Header with Block Pill and Icon */}
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-xs font-mono uppercase tracking-wider px-2 py-0.5 rounded-md font-bold bg-slate-100 text-slate-700 dark:bg-[#070C1C] dark:text-[#00B4D8] border border-slate-300 dark:border-slate-700">
                  {c.block}
                </span>
                <div
                  className={`p-2 rounded-xl transition ${
                    isSelected
                      ? 'bg-[#2A5FFF] text-white dark:bg-[#00B4D8] dark:text-[#0B132B]'
                      : 'bg-slate-100 text-[#2A5FFF] dark:bg-[#070C1C] dark:text-[#00B4D8]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
              </div>

              {/* Title (Grande y legible para la jefa) */}
              <h3 className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-100 line-clamp-1">
                {c.title}
              </h3>

              {/* Primary Value (Número Gigante de Alto Impacto) */}
              <div className="mt-2 flex items-baseline justify-between gap-2">
                <span className="text-2xl sm:text-3xl lg:text-4xl font-serif font-black tracking-tight text-slate-900 dark:text-white">
                  {c.value}
                </span>
                <span
                  className={`text-xs font-mono font-bold px-2 py-0.5 rounded-md ${
                    c.badgePositive
                      ? 'bg-emerald-500/15 text-emerald-700 dark:text-[#C6F432]'
                      : 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                  }`}
                >
                  {c.badge}
                </span>
              </div>
            </div>

            {/* FÓRMULA MATEMÁTICA DESTACADA (Modo Matemático) */}
            <div className="mt-3.5 pt-2.5 border-t border-slate-200 dark:border-slate-800">
              <div className="px-2.5 py-1.5 rounded-lg bg-slate-900 text-white dark:bg-[#070C1C] border border-[#2A5FFF]/30 dark:border-[#00B4D8]/40 flex items-center justify-between gap-1 shadow-inner">
                <div className="flex items-center gap-1.5 min-w-0">
                  <Calculator className="w-3.5 h-3.5 text-[#00B4D8] shrink-0" />
                  <span className="font-mono text-xs font-bold text-[#C6F432] truncate">
                    {c.formula}
                  </span>
                </div>
                {isSelected && (
                  <span className="text-[9px] font-mono font-bold uppercase px-1 py-0.2 rounded bg-[#00B4D8] text-[#0B132B] shrink-0">
                    Activo
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default KpiCard;
