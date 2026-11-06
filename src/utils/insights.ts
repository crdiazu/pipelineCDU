import { CommercialKpis, KpiKey } from './kpi';
import { n2, pct2, times2, days2 } from './format';

type Money = (v: number) => string;

/** Frase breve por tarjeta, calculada con reglas sobre los datos reales. */
export function kpiPhrase(key: KpiKey, k: CommercialKpis, money: Money): string {
  switch (key) {
    case 'weightedPipeline':
      return k.projectedAttainmentPct >= 100
        ? `Proyección supera la meta en ${pct2(k.projectedAttainmentPct - 100)}.`
        : `Cubre ${pct2(k.projectedAttainmentPct)} de la meta; faltan ${money(k.remainingQuota)}.`;
    case 'pipelineCoverage':
      return k.pipelineCoverage >= 3
        ? `Holgada: ${times2(k.pipelineCoverage)} sobre el piso de 3,00×.`
        : `Débil: ${times2(k.pipelineCoverage)}, bajo el piso de 3,00×.`;
    case 'forecastAccuracy':
      return k.forecastAccuracy >= 85
        ? `Pronóstico confiable (${pct2(k.forecastAccuracy)}).`
        : `Desvío relevante: precisión ${pct2(k.forecastAccuracy)}.`;
    case 'activePipelineValue':
      return `${n2(k.openDealsCount).replace(',00', '')} negocios abiertos por ${money(k.activePipelineValue)}.`;
    case 'weightedGrossMarginPct':
      return k.weightedGrossMarginPct >= 20
        ? `Margen sano: ${pct2(k.weightedGrossMarginPct)}.`
        : `Margen bajo el piso de 20,00%: ${pct2(k.weightedGrossMarginPct)}.`;
    case 'quoteToCloseDays':
      return k.quoteToCloseDays <= 30
        ? `Ciclo ágil: ${days2(k.quoteToCloseDays)} de cotización a cierre.`
        : `Ciclo lento: ${days2(k.quoteToCloseDays)}, sobre el límite de 30,00.`;
    case 'winRate':
      return k.winRate >= 50
        ? `De cada 100 cierres, ${n2(k.winRate)} se ganan.`
        : `Solo ${pct2(k.winRate)} de los cierres se gana.`;
    case 'averageDealSize':
      return `Ticket ganado ${money(k.averageDealSizeWon)} frente a ${money(k.averageDealSizeOpen)} en cartera.`;
  }
}

/** Frase resumen global del desempeño. */
export function overallPhrase(k: CommercialKpis, money: Money): string {
  const checks = [
    k.projectedAttainmentPct >= 100,
    k.pipelineCoverage >= 3,
    k.forecastAccuracy >= 85,
    k.weightedGrossMarginPct >= 20,
    k.quoteToCloseDays <= 30,
    k.winRate >= 50,
  ];
  const ok = checks.filter(Boolean).length;
  const tone = ok >= 5 ? 'sólido' : ok >= 3 ? 'intermedio' : 'en alerta';
  const weak = [
    !checks[0] && `ponderado a ${pct2(k.projectedAttainmentPct)} de la meta`,
    !checks[1] && `cobertura de ${times2(k.pipelineCoverage)}`,
    !checks[2] && `precisión de ${pct2(k.forecastAccuracy)}`,
    !checks[3] && `margen de ${pct2(k.weightedGrossMarginPct)}`,
    !checks[4] && `ciclo de ${days2(k.quoteToCloseDays)}`,
    !checks[5] && `tasa de cierre de ${pct2(k.winRate)}`,
  ].filter(Boolean) as string[];
  const tail = weak.length ? ` Por reforzar: ${weak.join(', ')}.` : ' Todos los indicadores están en meta.';
  return `Desempeño ${tone}: ${n2(ok).replace(',00', '')} de 6 indicadores en meta, con ${money(k.weightedPipeline)} ponderados y tasa de cierre de ${pct2(k.winRate)}.${tail}`;
}

