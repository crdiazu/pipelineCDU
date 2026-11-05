import React from 'react';
import {
  TrendingUp,
  Target,
  Activity,
  Briefcase,
  Percent,
  Clock,
  Award,
  Sparkles,
  Calculator,
  Equal,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { CommercialKpis, KpiKey } from '../utils/kpi';
import { CurrencyCode, formatCurrency } from '../data/pipeline';

export interface KpiMathInspectorProps {
  activeKpi: KpiKey;
  kpis: CommercialKpis;
  quotaClp: number;
  currency: CurrencyCode;
  exchangeRate: number;
  activePeriodLabel: string;
}

interface MathFormulaConfig {
  title: string;
  badge: string;
  mathExpression: string;
  operatorSymbol: string;
  var1Label: string;
  var1Value: string;
  var2Label: string;
  var2Value: string;
  resultLabel: string;
  resultValue: string;
  diagnostic: string;
  isPositive: boolean;
  benchmark: string;
  formulaDescription: string;
}

export const KpiMathInspector: React.FC<KpiMathInspectorProps> = ({
  activeKpi,
  kpis,
  quotaClp,
  currency,
  exchangeRate,
  activePeriodLabel,
}) => {
  const fmt = (v: number, compact = false) =>
    formatCurrency(v, currency, exchangeRate, compact);

  const getFormulaConfig = (): MathFormulaConfig => {
    switch (activeKpi) {
      case 'weightedPipeline': {
        const attainment = (kpis.weightedPipeline / quotaClp) * 100;
        return {
          title: 'Weighted Pipeline (Ponderado)',
          badge: 'Fórmula de Probabilidad Ponderada',
          mathExpression: 'Weighted = ∑ ( Monto Cotizado × % Probabilidad )',
          operatorSymbol: '×',
          var1Label: 'Pipeline Bruto Total',
          var1Value: fmt(kpis.activePipelineValue, true),
          var2Label: 'Factor Probabilidad Ponderado',
          var2Value: `${(
            (kpis.weightedPipeline / Math.max(1, kpis.activePipelineValue)) *
            100
          ).toFixed(1)}%`,
          resultLabel: 'Ingreso Esperado Ponderado',
          resultValue: fmt(kpis.weightedPipeline, false),
          diagnostic:
            attainment >= 100
              ? `Supera la cuota en un ${(attainment - 100).toFixed(1)}%. Alta probabilidad de cumplimiento.`
              : `Representa el ${attainment.toFixed(1)}% de la meta mensual. Requiere acelerar cierres.`,
          isPositive: attainment >= 100,
          benchmark: `Meta: ${fmt(quotaClp, true)} (Cobertura ${attainment.toFixed(1)}%)`,
          formulaDescription:
            'Alinea las finanzas multiplicando cada oportunidad por su certeza de cierre.',
        };
      }

      case 'pipelineCoverage': {
        const denom = kpis.remainingQuota > 0 ? kpis.remainingQuota : quotaClp;
        return {
          title: 'Pipeline Coverage Ratio',
          badge: 'Ratio de Cobertura de Meta',
          mathExpression: 'Coverage (×) = Pipeline Total ÷ Meta Faltante',
          operatorSymbol: '÷',
          var1Label: 'Pipeline Activo Disponible',
          var1Value: fmt(kpis.activePipelineValue, true),
          var2Label: 'Meta Restante por Cumplir',
          var2Value: fmt(denom, true),
          resultLabel: 'Multiplicador de Cobertura',
          resultValue: `${kpis.pipelineCoverage.toFixed(2)}×`,
          diagnostic:
            kpis.pipelineCoverage >= 3.0
              ? 'Cobertura ÓPTIMA (≥3.0×). Hay suficiente colchón para absorber descartes.'
              : 'Cobertura en riesgo (<3.0×). Se deben prospectar más negocios.',
          isPositive: kpis.pipelineCoverage >= 3.0,
          benchmark: 'Benchmark Gerencial: 3.0× a 4.0× de cuota',
          formulaDescription:
            'Determina si el inventario de cotizaciones es suficiente para llegar a la meta.',
        };
      }

      case 'forecastAccuracy': {
        return {
          title: 'Forecast Accuracy (Precisión)',
          badge: 'Calibración de Compromiso Gerencial',
          mathExpression: 'Accuracy (%) = 1 - ( |Forecast - Real| ÷ Max ) × 100',
          operatorSymbol: '⇄',
          var1Label: 'Forecast Comprometido (Commit + Best Case)',
          var1Value: fmt(kpis.forecastTotal, true),
          var2Label: 'Facturación Real + Pipeline Activo',
          var2Value: fmt(kpis.closedWonAmount + kpis.commitAmount, true),
          resultLabel: 'Precisión de Calibración',
          resultValue: `${kpis.forecastAccuracy.toFixed(1)}%`,
          diagnostic:
            kpis.forecastAccuracy >= 85
              ? 'Excelente calibración gerencial (≥85%). Compromisos comerciales altamente certeros.'
              : 'Desviación en compromisos. Ajustar fechas estimadas de cierre.',
          isPositive: kpis.forecastAccuracy >= 80,
          benchmark: 'Tolerancia Gerencial: ≥85.0%',
          formulaDescription:
            'Mide qué tan certera es la promesa de cierre frente a la facturación real.',
        };
      }

      case 'activePipelineValue': {
        return {
          title: 'Active Pipeline Value',
          badge: 'Inventario Activo de Cotizaciones',
          mathExpression: 'Pipeline = ∑ Cotizaciones Abiertas Vigentes',
          operatorSymbol: '∑',
          var1Label: 'Cantidad de Oportunidades Abiertas',
          var1Value: `${kpis.openDealsCount} negocios`,
          var2Label: 'Ticket Promedio de Cotización',
          var2Value: fmt(kpis.averageDealSizeOpen, true),
          resultLabel: 'Valor Bruto del Pipeline',
          resultValue: fmt(kpis.activePipelineValue, false),
          diagnostic: `${(
            kpis.activePipelineValue / quotaClp
          ).toFixed(1)} veces la meta mensual de ventas. Masa crítica sólida.`,
          isPositive: true,
          benchmark: `Capacidad Instalada: ${kpis.openDealsCount} propuestas en negociación`,
          formulaDescription:
            'Suma total de propuestas económicas vivas emitidas en el período.',
        };
      }

      case 'weightedGrossMarginPct': {
        return {
          title: 'Margen Bruto Ponderado',
          badge: 'Rentabilidad Ponderada de Cartera',
          mathExpression: 'Margen % = ∑ ( Margen $ × Prob% ) ÷ Venta Ponderada',
          operatorSymbol: '÷',
          var1Label: 'Margen Bruto Estimado ($)',
          var1Value: fmt(
            kpis.weightedPipeline * (kpis.weightedGrossMarginPct / 100),
            true
          ),
          var2Label: 'Venta Neta Ponderada ($)',
          var2Value: fmt(kpis.weightedPipeline, true),
          resultLabel: 'Margen Comercial Promedio',
          resultValue: `${kpis.weightedGrossMarginPct.toFixed(1)}%`,
          diagnostic:
            kpis.weightedGrossMarginPct >= 20.0
              ? 'Margen saludable por encima del umbral mínimo del 20%.'
              : 'Margen estrecho (<20%). Cuidar tipo de cambio en productos importados.',
          isPositive: kpis.weightedGrossMarginPct >= 20.0,
          benchmark: 'Piso Comercial TECNOVOA: 20.0%',
          formulaDescription:
            'Porcentaje de ganancia neta proyectada sobre el portafolio cotizado.',
        };
      }

      case 'averageSalesCycleDays': {
        return {
          title: 'Ciclo Promedio de Venta',
          badge: 'Velocidad de Cierre de Negocios',
          mathExpression: 'Días = ( ∑ ( Fecha Cierre - Fecha Ingreso ) ) ÷ N',
          operatorSymbol: '÷',
          var1Label: 'Días Totales Acumulados',
          var1Value: `${kpis.averageSalesCycleDays * kpis.totalDealsCount} días`,
          var2Label: 'Total de Operaciones Analizadas',
          var2Value: `${kpis.totalDealsCount} operaciones`,
          resultLabel: 'Velocidad Promedio a la OC',
          resultValue: `${kpis.averageSalesCycleDays} días`,
          diagnostic:
            kpis.averageSalesCycleDays <= 21
              ? 'Velocidad ágil (menor a 3 semanas entre cotización y orden de compra).'
              : 'Ciclo extendido. Identificar cuellos de botella con clientes corporativos.',
          isPositive: kpis.averageSalesCycleDays <= 25,
          benchmark: 'Estándar Hardware B2B: 15 a 25 días',
          formulaDescription:
            'Tiempo calendario promedio desde que entra la solicitud hasta la factura.',
        };
      }

      case 'winRatePct': {
        const totalClosed = kpis.wonDealsCount + kpis.lostDealsCount;
        return {
          title: 'Win Rate (Tasa de Éxito)',
          badge: 'Efectividad de Cierre Histórica',
          mathExpression: 'Win Rate (%) = Ganados ÷ ( Ganados + Perdidos ) × 100',
          operatorSymbol: '÷',
          var1Label: 'Negocios Ganados (Closed Won)',
          var1Value: `${kpis.wonDealsCount} facturas`,
          var2Label: 'Total Negocios Resueltos',
          var2Value: `${totalClosed} cerrados`,
          resultLabel: 'Porcentaje de Efectividad',
          resultValue: `${kpis.winRatePct.toFixed(1)}%`,
          diagnostic:
            kpis.winRatePct >= 60
              ? 'Tasa de cierre superior al promedio de la industria B2B (≥60%).'
              : 'Baja conversión. Revisar cotizaciones rechazadas por precio.',
          isPositive: kpis.winRatePct >= 50,
          benchmark: 'Meta Gerencial: ≥60.0% de cierres',
          formulaDescription:
            'Proporción de cotizaciones convertidas exitosamente en ventas reales.',
        };
      }

      case 'averageDealSizeWon': {
        return {
          title: 'Ticket Promedio Cerrado',
          badge: 'Dimensión de Venta por Factura',
          mathExpression: 'Ticket = Facturado Total ÷ N° de Facturas',
          operatorSymbol: '÷',
          var1Label: 'Facturación Acumulada',
          var1Value: fmt(kpis.closedWonAmount, true),
          var2Label: 'Facturas Emitidas',
          var2Value: `${kpis.wonDealsCount} facturas`,
          resultLabel: 'Monto Promedio por Operación',
          resultValue: fmt(kpis.averageDealSizeWon, false),
          diagnostic:
            'Refleja compras recurrentes de consumibles mezcladas con proyectos medianos.',
          isPositive: true,
          benchmark: `Facturado: ${fmt(kpis.closedWonAmount, true)}`,
          formulaDescription:
            'Importe neto promedio facturado en cada transacción comercial cerrada.',
        };
      }

      default:
        return {
          title: 'Proyección Comercial',
          badge: 'Salud de Cuota',
          mathExpression: 'Proyección = Facturado + Weighted Pipeline',
          operatorSymbol: '+',
          var1Label: 'Facturado Won',
          var1Value: fmt(kpis.closedWonAmount, true),
          var2Label: 'Weighted Pipe',
          var2Value: fmt(kpis.weightedPipeline, true),
          resultLabel: 'Proyección Total',
          resultValue: fmt(kpis.projectedTotalAmount, false),
          diagnostic: `${kpis.projectedAttainmentPct.toFixed(1)}% de la meta mensual.`,
          isPositive: kpis.projectedAttainmentPct >= 100,
          benchmark: `Meta: ${fmt(quotaClp, true)}`,
          formulaDescription: 'Suma de ingresos seguros más probabilidad.',
        };
    }
  };

  const cfg = getFormulaConfig();

  return (
    <div className="rounded-2xl p-5 sm:p-6 border bg-white/95 border-[#DDD4C5] dark:bg-[#101D38]/95 dark:border-slate-800 shadow-md flex flex-col justify-between h-full transition-all">
      <div className="space-y-4">
        {/* Top Header Badge */}
        <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-[#2A5FFF] dark:text-[#00B4D8]" />
            <span className="text-xs font-mono uppercase tracking-wider font-bold text-[#2A5FFF] dark:text-[#00B4D8]">
              {cfg.badge}
            </span>
          </div>
          <span className="text-xs font-mono text-slate-500 dark:text-slate-400 font-semibold">
            {activePeriodLabel}
          </span>
        </div>

        {/* Title */}
        <div>
          <h3 className="text-xl sm:text-2xl font-serif font-bold text-slate-900 dark:text-white leading-tight">
            {cfg.title}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {cfg.formulaDescription}
          </p>
        </div>

        {/* PROMINENT MATHEMATICAL FORMULA BOX (Modo Matemático con Letra Grande) */}
        <div className="p-4 rounded-xl bg-slate-900 text-white dark:bg-[#070C1C] border-2 border-[#2A5FFF]/40 dark:border-[#00B4D8]/50 shadow-inner">
          <div className="flex items-center justify-between mb-1.5 text-[10px] font-mono uppercase tracking-widest text-[#00B4D8] font-bold">
            <span>Fórmula Matemática Aplicada</span>
            <span>ƒ(x)</span>
          </div>
          <div className="text-sm sm:text-base md:text-lg font-mono font-bold text-[#C6F432] dark:text-[#C6F432] tracking-wide break-words py-1">
            {cfg.mathExpression}
          </div>
        </div>

        {/* MATHEMATICAL VARIABLE BREAKDOWN (Letras Grandes para lectura fácil) */}
        <div className="grid grid-cols-5 gap-2 items-center p-3.5 rounded-xl bg-slate-50 dark:bg-[#0B132B] border border-slate-200 dark:border-slate-800">
          {/* Variable 1 */}
          <div className="col-span-2">
            <span className="text-[11px] font-mono uppercase text-slate-500 dark:text-slate-400 block truncate font-medium">
              {cfg.var1Label}
            </span>
            <span className="text-lg sm:text-xl font-mono font-bold text-slate-900 dark:text-white">
              {cfg.var1Value}
            </span>
          </div>

          {/* Operator */}
          <div className="text-center font-mono font-bold text-xl sm:text-2xl text-[#2A5FFF] dark:text-[#00B4D8]">
            {cfg.operatorSymbol}
          </div>

          {/* Variable 2 */}
          <div className="col-span-2 text-right">
            <span className="text-[11px] font-mono uppercase text-slate-500 dark:text-slate-400 block truncate font-medium">
              {cfg.var2Label}
            </span>
            <span className="text-lg sm:text-xl font-mono font-bold text-slate-900 dark:text-white">
              {cfg.var2Value}
            </span>
          </div>
        </div>

        {/* RESULT BLOCK (Números Gigantes de Alta Legibilidad) */}
        <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 dark:bg-[#C6F432]/10 flex items-center justify-between">
          <div>
            <span className="text-xs font-mono uppercase font-bold text-emerald-800 dark:text-[#C6F432] block">
              Resultado Matemático:
            </span>
            <span className="text-2xl sm:text-3xl md:text-4xl font-serif font-black text-slate-900 dark:text-white tracking-tight">
              {cfg.resultValue}
            </span>
          </div>
          <div className="text-right font-mono text-xs text-slate-600 dark:text-slate-300">
            <span className="block font-semibold">{cfg.benchmark}</span>
          </div>
        </div>
      </div>

      {/* Diagnostic & Guidance */}
      <div className="pt-3 mt-3 border-t border-slate-200 dark:border-slate-800 flex items-start gap-2.5">
        {cfg.isPositive ? (
          <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-[#C6F432] shrink-0 mt-0.5" />
        ) : (
          <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
        )}
        <p className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200 leading-snug">
          {cfg.diagnostic}
        </p>
      </div>
    </div>
  );
};

export default KpiMathInspector;
