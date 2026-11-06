/** Formato numérico único del dashboard: exactamente 2 decimales, coma chilena. */
export const n2 = (v: number): string =>
  (Number.isFinite(v) ? v : 0).toLocaleString('es-CL', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export const pct2 = (v: number): string => `${n2(v)}%`;
export const times2 = (v: number): string => `${n2(v)}×`;
export const days2 = (v: number): string => `${n2(v)} días`;

