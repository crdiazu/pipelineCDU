# TECNOVOA | Dashboard Comercial & Forecast CDU

Aplicación interactiva en **React + Vite + TypeScript + Tailwind CSS** con estética corporativa editorial **TECNOVOA** (modo oscuro marino `#0B132B` / `#101D38` con acentos cian `#00B4D8` y verde lima `#C6F432`, y modo claro editorial papel `#F5F1E8` con acento cobalto `#2A5FFF`).

Alimentada directamente por los **62 registros reales** de la hoja **`CDU Pipeline Forecast - REPARADO.xlsx`** (aplicando la regla fiscal de corte día 25 de cada mes) y configurada con una meta mensual base de **CLP $15.000.000**.

## Módulos y KPIs Incluidos

1. **Gráfico Principal de Forecast & Weighted Pipeline**:
   - Comparativa mensual desde Agosto 2026 hasta Marzo 2027 (modos *Tendencia Área*, *Columnas* y *Desglose Apilado*).
   - Línea de referencia de Meta Mensual (**CLP $15.000.000**).
2. **Salud de Cuota y Balance Comercial**:
   - Proyección Total (`Facturado Closed Won + Weighted Pipeline`), barra de avance segmentada, brecha restante (*Gap*) y conteo de leads calificados.
3. **Matriz de 8 KPIs Estratégicos del Flujo Comercial**:
   - **Forecast**: `Weighted Pipeline`, `Pipeline Coverage`, `Forecast Accuracy`.
   - **Cotizaciones**: `Active Pipeline Value`, `Margen Bruto Ponderado`, `Quote-to-Close Time`.
   - **Conversión**: `Win Rate Comercial`, `Average Deal Size (Ticket Promedio)`.
4. **Tabla Interactiva de Cotizaciones & Oportunidades**:
   - Búsqueda en vivo por cliente, número de COT/Factura, fabricante o próxima acción.
   - Filtros por estado (`Abierta`, `Ganadas`, `Perdidas`), categoría de Forecast (`Commit`, `Best Case`, `Pipeline`) y tipo de negocio (`Producto`, `Proyecto`, `Servicio`, `Renovación`).
   - Ordenamiento dinámico por Monto Neto, Weighted Pipeline, Probabilidad y Fecha de Cierre / SLA.
5. **Tablero Kanban por Etapas** y **Jerarquía Corporativa por Cuenta Clave**.
6. **Controles Globales**:
   - Selector de período fiscal (Noviembre 2026, Diciembre 2026, etc. o Todos).
   - Switch de moneda en vivo (`CLP $` / `USD`).
   - Switch de tema (`Dark Mode TECNOVOA` / `Light Editorial`).

## Ejecución Local

```bash
npm install
npm run dev
```

## Compilación a Producción

```bash
npm run build
```
