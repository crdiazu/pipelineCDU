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
} from 'lucide-react';
import { CommercialKpis } from '../utils/kpi';
import { CurrencyCode, formatCurrency } from '../data/pipeline';

interface Props {
  kpis: CommercialKpis;
  currency: CurrencyCode;
  exchangeRate: number;
  selectedBlock?: 'Todos' | 'Forecast' | 'Cotizaciones' | 'Conversión';
}

export const KpiCard: React.FC<Props> = ({
  kpis,
  currency,
  exchangeRate,
  selectedBlock = 'Todos',
}) => {
  const fmt = (val: number, compact = false) =>
    formatCurrency(val, currency, exchangeRate, compact);

  const cards = [
    {
      block: 'Forecast',
      title: 'Weighted Pipeline',
      formula: '∑(Valor Cotizado × % Probabilidad)',
      value: fmt(kpis.weightedPipeline, true),
      subValue: `Full: ${fmt(kpis.weightedPipeline, false)}`,
      badge: `${((kpis.weightedPipeline / kpis.quotaAmount) * 100).toFixed(1)}% vs Meta`,
      badgePositive: kpis.weightedPipeline >= kpis.quotaAmount,
      impact: 'Estimación realista de ingresos futuros para finanzas.',
      icon: TrendingUp,
    },
    {
      block: 'Forecast',
      title: 'Pipeline Coverage',
      formula: 'Pipeline Calificado / Cuota Restante',
      value: `${kpis.pipelineCoverage.toFixed(2)}×`,
      subValue: `Restante: ${fmt(kpis.remainingQuota, true)}`,
      badge: kpis.pipelineCoverage >= 3 ? 'Óptimo (≥3.0×)' : 'En construcción',
      badgePositive: kpis.pipelineCoverage >= 3,
      impact: 'Mide si hay suficiente volumen para cumplir la meta (ratio óptimo: 3× a 4×).',
      icon: Target,
    },
    {
      block: 'Forecast',
      title: 'Forecast Accuracy',
      formula: '(1 − |Forecast − Real| / Real) × 100',
      value: `${kpis.forecastAccuracy.toFixed(1)}%`,
      subValue: `Commit + Best Case: ${fmt(kpis.forecastTotal, true)}`,
      badge: 'Calibrado CDU',
      badgePositive: kpis.forecastAccuracy >= 80,
      impact: 'Precisión del equipo al comprometer cierres a la gerencia.',
      icon: Activity,
    },
    {
      block: 'Cotizaciones',
      title: 'Active Pipeline Value',
      formula: 'Suma total de cotizaciones vigentes',
      value: fmt(kpis.activePipelineValue, true),
      subValue: `${kpis.openDealsCount} oportunidades activas`,
      badge: `${(kpis.activePipelineValue / kpis.quotaAmount).toFixed(1)}× Meta`,
      badgePositive: true,
      impact: 'Mide la masa crítica de propuestas activas en el mercado.',
      icon: Briefcase,
    },
    {
      block: 'Cotizaciones',
      title: 'Margen Bruto Ponderado',
      formula: '∑(Margen $ × Prob.) / Venta Ponderada',
      value: `${kpis.weightedGrossMarginPct.toFixed(1)}%`,
      subValue: `Utilidad est.: ${fmt(kpis.weightedGrossMarginAmount, true)}`,
      badge: kpis.weightedGrossMarginPct >= 18 ? 'Sobre piso 18%' : 'Revisar descuento',
      badgePositive: kpis.weightedGrossMarginPct >= 18,
      impact: 'Evita cerrar volumen a expensas de la rentabilidad mínima requerida.',
      icon: Percent,
    },
    {
      block: 'Cotizaciones',
      title: 'Quote-to-Close Time',
      formula: 'Días promedio emisión → recepción OC',
      value: `${kpis.quoteToCloseDays} días`,
      subValue: 'Ciclo comercial medio B2B',
      badge: kpis.quoteToCloseDays <= 25 ? 'Velocidad ágil' : 'Ciclo consultivo',
      badgePositive: kpis.quoteToCloseDays <= 30,
      impact: 'Identifica cuellos de botella en la toma de decisión del cliente.',
      icon: Clock,
    },
    {
      block: 'Conversión',
      title: 'Win Rate Comercial',
      formula: '(Cotiz. Ganadas / Presentadas Cerradas) × 100',
      value: `${kpis.winRate.toFixed(1)}%`,
      subValue: `${kpis.wonDealsCount} Won / ${kpis.lostDealsCount} Lost`,
      badge: kpis.winRate >= 50 ? 'Alta efectividad' : 'Competitivo',
      badgePositive: kpis.winRate >= 40,
      impact: 'Eficacia en el cierre y competitividad de las ofertas.',
      icon: Award,
    },
    {
      block: 'Conversión',
      title: 'Average Deal Size',
      formula: 'Facturación Total / N° Deals Ganados',
      value: fmt(kpis.averageDealSizeWon, true),
      subValue: `Ticket medio Abierto: ${fmt(kpis.averageDealSizeOpen, true)}`,
      badge: 'Ticket Promedio',
      badgePositive: true,
      impact: 'Control del tamaño medio de las operaciones adjudicadas.',
      icon: BarChart3,
    },
  ];

  const visibleCards =
    selectedBlock === 'Todos'
      ? cards
      : cards.filter((c) => c.block === selectedBlock);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
      {visibleCards.map((c, i) => {
        const Icon = c.icon;
        return (
          <div
            key={i}
            className="group relative rounded-xl p-4 transition-all duration-200 border bg-white/90 border-[#DDD4C5] hover:border-[#2A5FFF]/50 dark:bg-[#101D38]/90 dark:border-slate-800/80 dark:hover:border-[#00B4D8]/50 shadow-sm flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded font-semibold bg-slate-100 text-slate-600 dark:bg-[#0B132B] dark:text-[#00B4D8] border border-slate-200 dark:border-[#00B4D8]/20">
                  {c.block}
                </span>
                <div className="p-1.5 rounded-lg bg-slate-100 text-[#2A5FFF] dark:bg-[#0B132B] dark:text-[#00B4D8]">
                  <Icon className="w-3.5 h-3.5" />
                </div>
              </div>

              <h3 className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {c.title}
              </h3>

              <div className="mt-1 flex items-baseline justify-between gap-2">
                <span className="text-xl font-serif font-bold tracking-tight text-slate-900 dark:text-white">
                  {c.value}
                </span>
                <span
                  className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                    c.badgePositive
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-[#C6F432] border border-emerald-500/20'
                      : 'bg-amber-500/10 text-amber-600 dark:text-amber-300 border border-amber-500/20'
                  }`}
                >
                  {c.badge}
                </span>
              </div>

              <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400 mt-1">
                {c.subValue}
              </p>
            </div>

            <div className="mt-3 pt-2.5 border-t border-slate-200/70 dark:border-slate-800/80">
              <p className="text-[10px] font-mono text-slate-400 dark:text-slate-500 truncate" title={c.formula}>
                ƒ: {c.formula}
              </p>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5 leading-snug">
                {c.impact}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default KpiCard;

