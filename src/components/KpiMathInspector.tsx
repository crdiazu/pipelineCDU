import React, { useState } from 'react';
import { CommercialKpis, KpiKey } from '../utils/kpi';
import { CurrencyCode, formatCurrency, DealRow } from '../data/pipeline';
import { n2 } from '../utils/format';
import { getKpiCardsList } from './KpiCard';
import { KpiTree, KpiMiniGraph } from './KpiGraphs';
import { kpiPhrase } from '../utils/insights';
import {
  Calculator,
  CheckCircle2,
  AlertTriangle,
  GitFork,
  FunctionSquare,
  Sparkles,
} from 'lucide-react';

interface Props {
  activeKpi: KpiKey;
  kpis: CommercialKpis;
  deals: DealRow[];
  quotaClp: number;
  currency: CurrencyCode;
  exchangeRate: number;
  activePeriodLabel: string;
}

export const KpiMathInspector: React.FC<Props> = ({
  activeKpi,
  kpis,
  deals,
  quotaClp,
  currency,
  exchangeRate,
  activePeriodLabel,
}) => {
  const [subView, setSubView] = useState<'formula' | 'arbol'>('formula');

  const fmt = (val: number, compact = false) =>
    formatCurrency(val, currency, exchangeRate, compact);
  const fmtCompact = (val: number) =>
    formatCurrency(val, currency, exchangeRate, true);

  const avgProb =
    kpis.activePipelineValue > 0
      ? Math.round((kpis.weightedPipeline / kpis.activePipelineValue) * 1000) / 10
      : 0;

  // Obtenemos los datos de la tarjeta que "subió"
  const allCards = getKpiCardsList(kpis, currency, exchangeRate);
  const currentCard = allCards.find((c) => c.key === activeKpi) || allCards[0];
  const Icon = currentCard.icon;

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
      targetText: 'Estándar B2B: ≥ 3,00× veces',
      isGood: kpis.pipelineCoverage >= 3,
      diagnosis:
        kpis.pipelineCoverage >= 3
          ? 'Respaldo matemático óptimo: más de 3 pesos cotizados por cada peso de meta.'
          : 'Cobertura menor a 3,00×. Se recomienda ingresar nuevas cotizaciones.',
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
      targetText: 'Meta Gerencial: ≥ 85,00%',
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
      isGood: kpis.activePipelineValue >= quotaClp * 2,
      diagnosis: `Cartera activa distribuida en ${kpis.openDealsCount} oportunidades comerciales.`,
    },
    weightedGrossMarginPct: {
      badge: 'FÓRMULA DE MARGEN PONDERADO',
      title: 'Margen Bruto Ponderado (%)',
      subtitle: 'Promedio ponderado del margen esperado por cada oportunidad comercial.',
      formula: 'M_ponderado = ∑ ( Margenᵢ % × Cartera Ponderadaᵢ ) ÷ Cartera Ponderada Total',
      var1Label: 'Masa de Margen Estimada',
      var1Value: fmtCompact(kpis.weightedGrossMarginAmount),
      operator: '÷',
      var2Label: 'Cartera Ponderada',
      var2Value: fmtCompact(kpis.weightedPipeline),
      resultLabel: 'Margen Bruto Ponderado',
      resultValue: `${n2(kpis.weightedGrossMarginPct)}%`,
      targetText: 'Piso Rentabilidad: ≥ 20,00%',
      isGood: kpis.weightedGrossMarginPct >= 20,
      diagnosis:
        kpis.weightedGrossMarginPct >= 20
          ? 'Mezcla comercial sana con margen sobre el umbral corporativo de 20%.'
          : 'Margen bajo el objetivo; priorizar servicios y proyectos de mayor margen.',
    },
    quoteToCloseDays: {
      badge: 'FÓRMULA DE VELOCIDAD DE VENTA',
      title: 'Ciclo de Cierre Comercial (Días)',
      subtitle: 'Días transcurridos promedio desde la emisión de la cotización hasta la OC.',
      formula: 'D_ciclo = ∑ ( Fecha Aprobación / OCᵢ − Fecha Ingreso Cotizaciónᵢ ) ÷ Total Negocios',
      var1Label: 'Suma de Días de Ciclo',
      var1Value: `${n2(kpis.quoteToCloseDays * (kpis.wonDealsCount || 1))} días`,
      operator: '÷',
      var2Label: 'Negocios Analizados',
      var2Value: `${kpis.wonDealsCount || 1} ganados`,
      resultLabel: 'Duración Media de Cierre',
      resultValue: `${n2(kpis.quoteToCloseDays)} días`,
      targetText: 'Estándar Ágil: ≤ 30,00 días',
      isGood: kpis.quoteToCloseDays <= 30,
      diagnosis:
        kpis.quoteToCloseDays <= 30
          ? 'Ciclo de conversión ágil y dentro del parámetro operativo saludable.'
          : 'Ciclo superior a 30 días; monitorear aprobaciones de orden de compra.',
    },
    winRate: {
      badge: 'FÓRMULA DE EFECTIVIDAD COMERCIAL',
      title: 'Tasa de Conversión a Éxito (Win Rate %)',
      subtitle: 'Porcentaje de cotizaciones cerradas que terminaron en Orden de Compra.',
      formula: 'T_éxito = Negocios Ganados ÷ ( Negocios Ganados + Negocios Perdidos )',
      var1Label: 'Negocios Ganados',
      var1Value: `${kpis.wonDealsCount} negocios`,
      operator: '÷',
      var2Label: 'Negocios Cerrados Totales',
      var2Value: `${kpis.wonDealsCount + kpis.lostDealsCount} cerrados`,
      resultLabel: 'Tasa de Éxito Comercial',
      resultValue: `${n2(kpis.winRate)}%`,
      targetText: 'Estándar Industria: ≥ 50,00%',
      isGood: kpis.winRate >= 50,
      diagnosis:
        kpis.winRate >= 50
          ? 'Excelente tasa de conversión: la mayoría de los negocios evaluados se cierran.'
          : 'Tasa de conversión bajo el 50%; auditar causales de cotizaciones descartadas.',
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
    <div className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-[#0B132B] border-2 border-[#0758a6] shadow-lg flex flex-col justify-between h-full transition-all">
      {/* 1. Header con Miniatura de la Tarjeta Subida + Selector de Modo */}
      <div>
        <div className="flex items-center justify-between gap-2 pb-2.5 mb-2.5 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-[#0758a6] text-white shadow-sm">
              <Icon className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] font-mono uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-950/70 text-[#0758a6] dark:text-[#3fc3e8]">
                  {currentCard.blockLabel}
                </span>
                <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${currentCard.badgeColor}`}>
                  {currentCard.badge}
                </span>
              </div>
              <div className="flex items-baseline gap-2 mt-0.5">
                <h3 className="text-sm sm:text-base font-serif font-black text-slate-900 dark:text-white">
                  {currentCard.title}
                </h3>
                <span className="text-sm sm:text-base font-serif font-black text-[#0758a6] dark:text-[#3fc3e8]">
                  {currentCard.mainValue}
                </span>
              </div>
            </div>
          </div>

          {/* Toggle de Análisis: Fórmula o Grafo Árbol */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-[#101D38] p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs shrink-0">
            <button
              onClick={() => setSubView('formula')}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg font-bold transition ${
                subView === 'formula'
                  ? 'bg-white text-[#0758a6] shadow-sm dark:bg-[#0758a6] dark:text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
              title="Ver Desglose Matemático y Ecuación"
            >
              <FunctionSquare className="w-3.5 h-3.5" />
              <span>Fórmula</span>
            </button>
            <button
              onClick={() => setSubView('arbol')}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg font-bold transition ${
                subView === 'arbol'
                  ? 'bg-white text-[#0758a6] shadow-sm dark:bg-[#0758a6] dark:text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
              title="Ver Árbol Radial de Círculos y Relaciones"
            >
              <GitFork className="w-3.5 h-3.5" />
              <span>Árbol</span>
            </button>
          </div>
        </div>

        {/* 2. Frase de Desempeño Resumen de esta tarjeta específica */}
        <div className="mb-2 px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-[#0e1c3a] border border-slate-200/80 dark:border-slate-800 text-[11px] text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-[#00add7] shrink-0" />
          <span className="font-medium truncate">
            {kpiPhrase(activeKpi, kpis, fmtCompact)}
          </span>
        </div>

        {/* 3. Contenido Central Alternable: Fórmula O Árbol Radial */}
        {subView === 'formula' ? (
          <div>
            {/* CAJA BLANCA CON FÓRMULA EN CURSIVA GRANDE FULL MATEMÁTICO */}
            <div className="p-3 rounded-xl bg-white border-2 border-[#0758a6] shadow-sm">
              <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-slate-500 mb-1">
                <span className="font-bold text-[#0758a6]">ECUACIÓN MATEMÁTICA APLICADA</span>
                <span
                  style={{ fontFamily: "'Sora', 'Figtree', sans-serif" }}
                  className="italic font-bold text-sm text-[#0758a6]"
                >
                  ƒ(x)
                </span>
              </div>
              <p
                style={{ fontFamily: "'Sora', 'Figtree', sans-serif" }}
                className="text-base sm:text-lg italic font-bold text-slate-950 leading-snug tracking-wide"
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
                  className="w-7 h-7 rounded-full bg-white border border-[#0758a6]/40 text-[#0758a6] flex items-center justify-center text-base italic font-black shadow-sm"
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
        ) : (
          <div className="p-2 rounded-xl bg-slate-50 dark:bg-[#081024] border border-slate-200 dark:border-slate-800">
            <KpiTree
              kpiKey={activeKpi}
              deals={deals}
              kpis={kpis}
              quotaClp={quotaClp}
              money={fmtCompact}
            />
          </div>
        )}
      </div>

      {/* 4. Resultado Final y Diagnóstico */}
      <div className="mt-2.5 pt-2 border-t border-slate-200 dark:border-slate-800">
        <div className="flex items-baseline justify-between gap-2 bg-emerald-50/90 dark:bg-emerald-950/30 px-3 py-1.5 rounded-xl border border-emerald-500/40">
          <div>
            <span className="text-[10px] font-mono uppercase font-bold text-emerald-800 dark:text-emerald-300 block">
              = {d.resultLabel}:
            </span>
            <span className="text-lg sm:text-xl font-serif font-black text-slate-900 dark:text-white">
              {d.resultValue}
            </span>
          </div>
          <span className="text-[11px] font-mono font-bold text-emerald-800 dark:text-emerald-300 text-right">
            {d.targetText}
          </span>
        </div>

        <div className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300">
          {d.isGood ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
          )}
          <span className="font-medium leading-tight truncate">{d.diagnosis}</span>
        </div>
      </div>
    </div>
  );
};

export default KpiMathInspector;
