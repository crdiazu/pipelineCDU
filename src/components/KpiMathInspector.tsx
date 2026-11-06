import React from 'react';
import { CommercialKpis, KpiKey } from '../utils/kpi';
import { CurrencyCode, formatCurrency } from '../data/pipeline';
import { n2 } from '../utils/format';
import {
  Calculator,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

interface Props {
  activeKpi: KpiKey;
  kpis: CommercialKpis;
  quotaClp: number;
  currency: CurrencyCode;
  exchangeRate: number;
  activePeriodLabel: string;
}

export const KpiMathInspector: React.FC<Props> = ({
  activeKpi,
  kpis,
  quotaClp,
  currency,
  exchangeRate,
  activePeriodLabel,
}) => {
  const fmt = (val: number, compact = false) =>
    formatCurrency(val, currency, exchangeRate, compact);
  const fmtCompact = (val: number) =>
    formatCurrency(val, currency, exchangeRate, true);

  const avgProb =
    kpis.activePipelineValue > 0
      ? Math.round((kpis.weightedPipeline / kpis.activePipelineValue) * 1000) / 10
      : 0;

  const details: Record<
    KpiKey,
    {
      badge: string;
      title: string;
      subtitle: string;
      formula: string;
      var1Label: string;
      var1Value: string;
      operator: string;
      var2Label: string;
      var2Value: string;
      resultLabel: string;
      resultValue: string;
      targetText: string;
      isGood: boolean;
      diagnosis: string;
    }
  > = {
    weightedPipeline: {
      badge: 'FÓRMULA DE PROBABILIDAD PONDERADA',
      title: 'Cartera Ponderada Comercial',
      subtitle: 'Multiplica cada cotización por su porcentaje real de probabilidad de cierre.',
      formula: 'P_ponderada = ∑ ( Monto Cotizadoᵢ × Probabilidadᵢ % )',
      var1Label: 'Cartera Bruta Total',
      var1Value: fmtCompact(kpis.activePipelineValue),
      operator: '×',
      var2Label: 'Probabilidad Media',
      var2Value: `${n2(avgProb)}%`,
      resultLabel: 'Resultado Ponderado',
      resultValue: fmt(kpis.weightedPipeline, false),
      targetText: `Meta: ${fmtCompact(kpis.quotaAmount)} (${n2(kpis.projectedAttainmentPct)}%)`,
      isGood: kpis.projectedAttainmentPct >= 100,
      diagnosis:
        kpis.projectedAttainmentPct >= 100
          ? `Supera la cuota comercial en ${n2(kpis.projectedAttainmentPct - 100)}%. Alta seguridad de cierre.`
          : `Faltan ${fmtCompact(kpis.remainingQuota)} para cubrir el 100% de la cuota del período.`,
    },
    pipelineCoverage: {
      badge: 'FÓRMULA DE COBERTURA DE META',
      title: 'Cobertura de Cuota (Ratio ×)',
      subtitle: 'Mide cuántas veces cabe la meta restante dentro de las cotizaciones activas.',
      formula: 'C_meta = Cartera Abierta Calificada ÷ Brecha de Meta Faltante',
      var1Label: 'Cartera Abierta',
      var1Value: fmtCompact(kpis.activePipelineValue),
      operator: '÷',
      var2Label: 'Meta por Cubrir',
      var2Value:
        kpis.remainingQuota > 0
          ? fmtCompact(kpis.remainingQuota)
          : fmtCompact(quotaClp),
      resultLabel: 'Múltiplo de Cobertura',
      resultValue: `${n2(kpis.pipelineCoverage)}× veces`,
      targetText: 'Estándar B2B: ≥ 3.0× veces',
      isGood: kpis.pipelineCoverage >= 3,
      diagnosis:
        kpis.pipelineCoverage >= 3
          ? 'Respaldo matemático óptimo: más de 3 pesos cotizados por cada peso de meta.'
          : 'Cobertura menor a 3.0×. Se recomienda ingresar nuevas cotizaciones.',
    },
    forecastAccuracy: {
      badge: 'FÓRMULA DE EXACTITUD COMERCIAL',
      title: 'Precisión del Pronóstico (%)',
      subtitle: 'Evalúa la cercanía entre el compromiso de venta y la facturación real.',
      formula: 'E_pronóstico = 1 − ( |Pronóstico − Facturado Real| ÷ Máximo )',
      var1Label: 'Compromiso + Mejor Caso',
      var1Value: fmtCompact(kpis.forecastTotal),
      operator: '⇄',
      var2Label: 'Facturado + Ponderado',
      var2Value: fmtCompact(kpis.projectedTotalAmount),
      resultLabel: 'Índice de Exactitud',
      resultValue: `${n2(kpis.forecastAccuracy)}%`,
      targetText: 'Meta Gerencial: ≥ 85.0%',
      isGood: kpis.forecastAccuracy >= 85,
      diagnosis:
        kpis.forecastAccuracy >= 85
          ? 'Pronóstico altamente confiable y calibrado con la facturación real.'
          : 'Desviación moderada; revisar negocios en Compromiso Firme.',
    },
    activePipelineValue: {
      badge: 'FÓRMULA DE SUMATORIA DE CARTERA',
      title: 'Valor Total en Cartera Activa',
      subtitle: 'Suma directa de todas las cotizaciones vigentes en negociación.',
      formula: 'V_cartera = ∑ ( Cotización Activa₁ + Cotización₂ + ... + Cotizaciónₙ )',
      var1Label: 'Negocios Abiertos',
      var1Value: `${kpis.openDealsCount} cotizaciones`,
      operator: '×',
      var2Label: 'Ticket Promedio Abierto',
      var2Value: fmtCompact(kpis.averageDealSizeOpen),
      resultLabel: 'Volumen Bruto en Cartera',
      resultValue: fmt(kpis.activePipelineValue, false),
      targetText: `${n2(kpis.qualifiedRatioPct)}% con probabilidad ≥ 40%`,
      isGood: kpis.activePipelineValue >= kpis.quotaAmount * 2,
      diagnosis: `Cartera activa distribuida en ${kpis.openDealsCount} oportunidades comerciales.`,
    },
    weightedGrossMarginPct: {
      badge: 'FÓRMULA DE RENTABILIDAD PONDERADA',
      title: 'Margen Bruto Ponderado (%)',
      subtitle: 'Utilidad bruta porcentual estimada sobre la cartera comercial.',
      formula: 'M_bruto = ∑ ( Margenᵢ % × Monto Ponderadoᵢ ) ÷ Cartera Ponderada',
      var1Label: 'Utilidad Bruta Estimada',
      var1Value: fmtCompact(kpis.weightedGrossMarginAmount),
      operator: '÷',
      var2Label: 'Cartera Ponderada',
      var2Value: fmtCompact(kpis.weightedPipeline),
      resultLabel: 'Margen Comercial',
      resultValue: `${n2(kpis.weightedGrossMarginPct)}%`,
      targetText: 'Piso Mínimo TECNOVOA: 18.0%',
      isGood: kpis.weightedGrossMarginPct >= 18,
      diagnosis:
        kpis.weightedGrossMarginPct >= 20
          ? 'Rentabilidad saludable por encima del piso corporativo del 18%.'
          : 'Margen ajustado; cuidar descuentos en hardware.',
    },
    quoteToCloseDays: {
      badge: 'FÓRMULA DE VELOCIDAD DE CIERRE',
      title: 'Ciclo de Cierre Comercial (Días)',
      subtitle: 'Promedio de días entre la emisión de la oferta y la Orden de Compra.',
      formula: 'D_ciclo = ∑ ( Fecha Orden de Compraᵢ − Fecha Cotizaciónᵢ ) ÷ n',
      var1Label: 'Negocios Evaluados',
      var1Value: `${kpis.totalDealsCount} operaciones`,
      operator: '÷',
      var2Label: 'Plazo Meta Ágil',
      var2Value: '30 días máx.',
      resultLabel: 'Velocidad Promedio',
      resultValue: `${n2(kpis.quoteToCloseDays)} días`,
      targetText: 'Estándar Ágil: ≤ 30 días',
      isGood: kpis.quoteToCloseDays <= 30,
      diagnosis:
        kpis.quoteToCloseDays <= 30
          ? 'Ciclo de decisión rápido y ágil en cuentas corporativas.'
          : 'Ciclo extenso; acelerar aprobaciones técnicas pendientes.',
    },
    winRate: {
      badge: 'FÓRMULA DE CONVERSIÓN DE VENTAS',
      title: 'Tasa de Cierre y Éxito (%)',
      subtitle: 'Proporción de propuestas ganadas sobre el total de negocios cerrados.',
      formula: 'T_éxito = [ Cotizaciones Ganadas ÷ ( Ganadas + Perdidas ) ] × 100',
      var1Label: 'Cotizaciones Ganadas',
      var1Value: `${kpis.wonDealsCount} cerradas`,
      operator: '÷',
      var2Label: 'Total Resueltas',
      var2Value: `${kpis.wonDealsCount + kpis.lostDealsCount} decididas`,
      resultLabel: 'Efectividad Comercial',
      resultValue: `${n2(kpis.winRate)}%`,
      targetText: `Facturado: ${fmtCompact(kpis.closedWonAmount)}`,
      isGood: kpis.winRate >= 50,
      diagnosis:
        kpis.winRate >= 50
          ? 'Alta competitividad: más de la mitad de las ofertas se transforman en OC.'
          : 'Oportunidad de mejora en conversión de ofertas.',
    },
    averageDealSize: {
      badge: 'FÓRMULA DE PROMEDIO ARITMÉTICO',
      title: 'Ticket Promedio por Venta',
      subtitle: 'Monto monetario promedio de cada negocio facturado.',
      formula: 'X̄_ticket = ∑ Facturación Total Ganada ÷ Número de Negocios Ganados',
      var1Label: 'Facturación Ganada',
      var1Value: fmtCompact(kpis.closedWonAmount),
      operator: '÷',
      var2Label: 'Negocios Facturados',
      var2Value: `${kpis.wonDealsCount} negocios`,
      resultLabel: 'Ticket Promedio Ganado',
      resultValue: fmt(kpis.averageDealSizeWon, false),
      targetText: `Ticket Abierto: ${fmtCompact(kpis.averageDealSizeOpen)}`,
      isGood: kpis.averageDealSizeWon >= kpis.averageDealSizeOpen * 0.5,
      diagnosis: `El ticket en cartera abierta promedia ${fmtCompact(kpis.averageDealSizeOpen)} por negocio.`,
    },
  };

  const d = details[activeKpi];

  return (
    <div className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-[#0B132B] border-2 border-[#2A5FFF] shadow-md flex flex-col justify-between h-full">
      {/* Encabezado */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <span className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase px-2 py-0.5 rounded-md bg-[#2A5FFF]/10 text-[#2A5FFF] font-bold">
            <Calculator className="w-3.5 h-3.5" />
            {d.badge}
          </span>
          <span className="text-[10px] font-mono text-slate-500 font-semibold truncate max-w-[140px]">
            {activePeriodLabel}
          </span>
        </div>

        <h3 className="text-base sm:text-lg font-serif font-black text-slate-900 dark:text-white leading-snug">
          {d.title}
        </h3>
        <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 leading-snug">
          {d.subtitle}
        </p>

        {/* CAJA BLANCA CON FÓRMULA EN CURSIVA GRANDE FULL MATEMÁTICO */}
        <div className="mt-2.5 p-3 rounded-xl bg-white border-2 border-[#2A5FFF] shadow-sm">
          <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-slate-500 mb-1">
            <span className="font-bold text-[#2A5FFF]">ECUACIÓN MATEMÁTICA APLICADA</span>
            <span
              style={{ fontFamily: "'Sora', 'Figtree', sans-serif" }}
              className="italic font-bold text-sm text-[#2A5FFF]"
            >
              ƒ(x)
            </span>
          </div>
          <p
            style={{ fontFamily: "'Sora', 'Figtree', sans-serif" }}
            className="text-lg sm:text-xl italic font-bold text-slate-950 leading-snug tracking-wide"
          >
            {d.formula}
          </p>
        </div>

        {/* Desglose de Variables (A * B) */}
        <div className="mt-2.5 grid grid-cols-7 items-center gap-1.5 bg-slate-50 dark:bg-[#101D38] p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
          <div className="col-span-3">
            <span className="text-[9px] font-mono uppercase text-slate-500 dark:text-slate-400 block font-bold truncate">
              {d.var1Label}
            </span>
            <span className="text-sm sm:text-base font-serif font-black text-slate-900 dark:text-white">
              {d.var1Value}
            </span>
          </div>

          <div className="col-span-1 flex justify-center">
            <span
              style={{ fontFamily: "'Sora', 'Figtree', sans-serif" }}
              className="w-7 h-7 rounded-full bg-white border border-[#2A5FFF]/40 text-[#2A5FFF] flex items-center justify-center text-base italic font-black shadow-sm"
            >
              {d.operator}
            </span>
          </div>

          <div className="col-span-3 text-right">
            <span className="text-[9px] font-mono uppercase text-slate-500 dark:text-slate-400 block font-bold truncate">
              {d.var2Label}
            </span>
            <span className="text-sm sm:text-base font-serif font-black text-slate-900 dark:text-white">
              {d.var2Value}
            </span>
          </div>
        </div>
      </div>

      {/* Resultado Final y Diagnóstico */}
      <div className="mt-2.5 pt-2.5 border-t border-slate-200 dark:border-slate-800">
        <div className="flex items-baseline justify-between gap-2 bg-emerald-50/90 dark:bg-emerald-950/30 px-3 py-2 rounded-xl border border-emerald-500/40">
          <div>
            <span className="text-[10px] font-mono uppercase font-bold text-emerald-800 dark:text-emerald-300 block">
              = {d.resultLabel}:
            </span>
            <span className="text-xl sm:text-2xl font-serif font-black text-slate-900 dark:text-white">
              {d.resultValue}
            </span>
          </div>
          <span className="text-[11px] font-mono font-bold text-emerald-800 dark:text-emerald-300 text-right">
            {d.targetText}
          </span>
        </div>

        <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300">
          {d.isGood ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
          )}
          <span className="font-medium leading-tight">{d.diagnosis}</span>
        </div>
      </div>
    </div>
  );
};

export default KpiMathInspector;
