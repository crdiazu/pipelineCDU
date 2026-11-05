import pipelineJson from './pipelineData.json';

export interface DealRow {
  id: string;
  code: string;
  client: string;
  opportunity: string;
  brand: string;
  businessType: 'Producto' | 'Servicio' | 'Proyecto' | 'Renovación' | string;
  estimatedAmount: number; // Monto neto CLP
  stage: string;
  probability: number; // 0 - 100
  pipelineEntryDate: string;
  pipelineEntryMonth: string;
  pipelineEntrySort: string;
  estimatedCloseDate: string;
  closeMonth: string;
  closeMonthSort: string;
  weightedPipeline: number;
  forecastCategory: 'Commit' | 'Best Case' | 'Pipeline' | string;
  status: 'Abierta' | 'Closed Won' | 'Closed Lost' | string;
  nextAction: string;
  nextActionDate: string;
  notes: string;
  estimatedMarginPct: number;
}

export type CurrencyCode = 'CLP' | 'USD';

export const DEFAULT_MONTHLY_QUOTA_CLP = 15000000; // CLP $15.000.000
export const DEFAULT_EXCHANGE_RATE = 950; // 1 USD = 950 CLP

export function loadPipeline(): DealRow[] {
  return pipelineJson as DealRow[];
}

export function formatCurrency(
  amountClp: number,
  currency: CurrencyCode,
  exchangeRate: number = DEFAULT_EXCHANGE_RATE,
  compact: boolean = false
): string {
  const value = currency === 'CLP' ? amountClp : amountClp / exchangeRate;

  if (compact) {
    if (currency === 'CLP') {
      if (Math.abs(value) >= 1_000_000) {
        return `$${(value / 1_000_000).toFixed(2).replace('.', ',')}M`;
      }
      if (Math.abs(value) >= 1_000) {
        return `$${Math.round(value / 1_000)}K`;
      }
      return `$${Math.round(value)}`;
    } else {
      if (Math.abs(value) >= 1_000_000) {
        return `US$${(value / 1_000_000).toFixed(2)}M`;
      }
      if (Math.abs(value) >= 1_000) {
        return `US$${(value / 1_000).toFixed(1)}K`;
      }
      return `US$${Math.round(value)}`;
    }
  }

  if (currency === 'CLP') {
    return 'CLP $' + Math.round(value).toLocaleString('es-CL');
  } else {
    return (
      'US$' +
      value.toLocaleString('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      })
    );
  }
}
