# TECNOVOA — Sistema de Gestión Comercial & Forecast B2B (CDU)

[![React 18](https://img.shields.io/badge/React-18.3-00B4D8?style=flat-square&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-2A5FFF?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?style=flat-square&logo=vite)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38BDF8?style=flat-square&logo=tailwindcss)](https://tailwindcss.com/)
[![Target Quota](https://img.shields.io/badge/Meta_Mensual-CLP_%2415.000.000-C6F432?style=flat-square)](#matriz-de-8-kpis-estratégicos)

> **Dashboard Ejecutivo B2B de Alta Densidad** diseñado para la gestión del flujo comercial, control de cotizaciones activas, *Weighted Pipeline* y proyección de cierres (*Forecast*) de la cartera **CDU (Cristian Díaz U.)** en **TECNOVOA**.

---

## 🌐 Enlaces de Despliegue

- **GitHub Pages (Live Demo):** [`https://crdiazu.github.io/pipelineCDU/`](https://crdiazu.github.io/pipelineCDU/) *(se actualiza automáticamente en cada push a `main` mediante GitHub Actions)*
- **Repositorio Oficial:** [`https://github.com/crdiazu/pipelineCDU`](https://github.com/crdiazu/pipelineCDU)
- **Compatible con Vercel / Netlify:** Configuración [`vercel.json`](./vercel.json) y rutas relativas (`base: './'`) listas para despliegue instantáneo en un clic.

---

## 🎯 Propósito y Arquitectura del Proyecto

Este repositorio traslada la operativa comercial consultiva TI de **TECNOVOA** (integración de infraestructura, ciberseguridad, licenciamiento, cómputo corporativo y servicios gestionados) desde la planilla maestra **`CDU Pipeline Forecast - REPARADO.xlsx`** hacia una **Single Page Application (SPA)** interactiva con estética corporativa y editorial.

### Reglas de Negocio Incorporadas
1. **Regla de Corte Fiscal (Día 25):** Toda oportunidad o factura cuya fecha supere el día 25 del mes se imputa automáticamente al período comercial siguiente (ej. `26-oct-2026` → `Noviembre 2026`), replicando con exactitud las fórmulas de la hoja `Pipeline` del libro Excel original.
2. **Meta Mensual de Referencia (`Quota`):** Fijada en **CLP \$15.000.000** netos mensuales (editable en vivo desde el panel lateral para simular distintos escenarios gerenciales).
3. **Conversión Bimoneda en Tiempo Real (`CLP $` / `USD`):** Switch global en la barra superior para alternar toda la interfaz entre Pesos Chilenos y Dólares Estadounidenses.
4. **Doble Identidad Visual (`Dark Corporate` / `Light Editorial`):**
   - **Modo Oscuro TECNOVOA:** Azul marino profundo (`#0B132B` / `#101D38`) con acentos en cian eléctrico (`#00B4D8`) y verde lima de alto contraste (`#C6F432`).
   - **Modo Claro Editorial:** Papel cálido (`#F5F1E8` / `#FFFDF8`), bordes sutiles (`#DDD4C5`), acento azul cobalto (`#2A5FFF`) y jerarquía tipográfica editorial (`Georgia` serif para titulares + `JetBrains Mono` para cifras financieras).

---

## 📊 Matriz de 8 KPIs Estratégicos

El motor analítico ([`src/utils/kpi.ts`](./src/utils/kpi.ts)) calcula en tiempo real los 8 indicadores clave exigidos por la gerencia comercial, divididos en tres bloques estratégicos:

| Bloque | KPI Comercial | Fórmula / Métrica Aplicada | Impacto Estratégico en TECNOVOA |
| :--- | :--- | :--- | :--- |
| **Forecast** | **Weighted Pipeline** | $\sum (\text{Monto Neto} \times \% \text{Probabilidad})$ | Estimación realista de ingresos futuros ponderados por etapa para finanzas. |
| **Forecast** | **Pipeline Coverage** | $\frac{\text{Pipeline Calificado Abierto}}{\text{Cuota Restante del Período}}$ | Mide si existe masa crítica suficiente para asegurar la meta (ratio óptimo: $3.0\times$ a $4.0\times$). |
| **Forecast** | **Forecast Accuracy** | $\left(1 - \frac{\|\text{Forecast} - \text{Proyección Real}\|}{\max(\text{Forecast}, \text{Real})}\right) \times 100$ | Calibración y precisión del KAM al comprometer cierres (*Commit + Best Case*) ante gerencia. |
| **Cotizaciones** | **Active Pipeline Value** | $\sum \text{Monto Neto de Oportunidades Abiertas}$ | Volumen bruto total de propuestas y cotizaciones vigentes en el mercado. |
| **Cotizaciones** | **Margen Bruto Ponderado** | $\frac{\sum (\text{Margen Estimado \$} \times \text{Probabilidad})}{\text{Weighted Pipeline}}$ | Protege la rentabilidad mínima (umbral del 18%) evitando cerrar volumen a costa del margen. |
| **Cotizaciones** | **Quote-to-Close Time** | $\text{Promedio de días } (\text{Fecha Cierre Est.} - \text{Fecha Ingreso})$ | Identifica cuellos de botella en el ciclo de aprobación de Orden de Compra (OC) del cliente. |
| **Conversión** | **Win Rate Comercial** | $\frac{\text{Operaciones Closed Won}}{\text{Closed Won} + \text{Closed Lost}} \times 100$ | Efectividad de cierre y competitividad técnica/económica de las propuestas presentadas. |
| **Conversión** | **Average Deal Size** | $\frac{\text{Facturación Total Cerrada}}{\text{N° de Deals Ganados}}$ | Control del ticket promedio adjudicado frente al ticket medio del pipeline abierto. |

---

## 🧩 Módulos Interactivos de la Interfaz

1. **Vista General & Salud de Cuota (`Dashboard`):**
   - **Gráfico Principal (`ForecastChart`):** Comparativa mensual entre *Forecast (Commit + Best Case)*, *Weighted Pipeline* y *Facturado (Closed Won)* frente a la línea de meta de **CLP \$15.000.000**, con tres modos de visualización (*Tendencia Área*, *Columnas Comparativas* y *Desglose Apilado*).
   - **Tarjeta de Salud de Cuota:** Barra de progreso multicapa (Facturado + Commit + Weighted), brecha restante (*Gap*) y porcentaje de oportunidades calificadas ($\ge 40\%$).
   - **Tarjetas Operativas Inferiores:** Embudo de distribución por etapa, bitácora de próximas acciones comerciales y cuadro gerencial de *Metas y Proyecciones*.
2. **Tablero Kanban de Ventas (`Pipeline Kanban`):**
   - Clasificación visual de las oportunidades abiertas en 4 columnas operativas: *1. Detección / Calificación*, *2. Cotización Activa*, *3. Propuesta / Negociación* y *4. Aprobación / OC (Commit)*.
3. **Matriz Interactiva de Cotizaciones (`SalesTable`):**
   - Tabla de alta densidad con los **62 registros reales** (clientes como *Positron Pharma*, *EDIFICIO SNAP*, *Puerto de Arica*, *MASSIVA*, *FAYMEX*, *Muni PAC*, *Hermanos Maristas*, *INN*, *Pluss Chile*, entre otros).
   - Búsqueda instantánea por texto, filtros por estado (`Abierta`, `Ganadas`, `Perdidas`), categoría de Forecast (`Commit`, `Best Case`, `Pipeline`) y tipo de negocio (`Producto`, `Proyecto`, `Servicio`, `Renovación`), además de alertas visuales de SLA y panel inspector lateral.
4. **Forecast & Jerarquía por Cuenta Clave (`Forecast`):**
   - Ranking corporativo de concentración de cartera por cliente, mostrando barras proporcionales de *Pipeline Bruto* vs *Weighted Pipeline* y sellos de fabricantes asociados (*Lenovo*, *Fortinet*, *Cisco*, *Huawei*, *Dell*, *Ubiquiti*, *Zebra*, *Attom*, *Microsoft*).

---

## 📁 Estructura del Repositorio

```text
pipelineCDU/
├── .github/
│   └── workflows/
│       └── deploy-pages.yml      # CI/CD automático hacia GitHub Pages
├── src/
│   ├── components/
│   │   ├── ForecastChart.tsx     # Gráfico SVG interactivo (Tendencia, Columnas y Apilado)
│   │   ├── KanbanBoard.tsx       # Tablero Kanban por etapas del embudo B2B
│   │   ├── KpiCard.tsx           # Matriz de 8 tarjetas KPI con fórmulas e impacto estratégico
│   │   └── SalesTable.tsx        # Tabla interactiva con filtros, ordenamiento y alertas SLA
│   ├── data/
│   │   ├── pipeline.ts           # Tipos TypeScript, formateador CLP/USD y constantes de cuota
│   │   └── pipelineData.json     # 62 registros sincronizados desde CDU Pipeline Forecast.xlsx
│   ├── utils/
│   │   └── kpi.ts                # Motor matemático de KPIs comerciales y series mensuales
│   ├── App.tsx                   # Layout principal, sidebar, controles globales y modal de alta
│   ├── index.css                 # Directivas Tailwind CSS
│   └── main.tsx                  # Punto de entrada React 18
├── index.html                    # Plantilla HTML con tipografías editoriales
├── package.json                  # Dependencias y scripts de construcción
├── tailwind.config.cjs           # Paleta corporativa TECNOVOA (Navy/Cyan + Editorial Paper)
├── tsconfig.json                 # Configuración TypeScript
├── vercel.json                   # Configuración lista para despliegue en Vercel
└── vite.config.ts                # Configuración de Vite (base './' compatible con GH Pages)
```

---

## 🚀 Instalación y Uso Local

### Prerrequisitos
- **Node.js** `v18+` o `v20+`
- **npm** `v9+`

### Pasos de Ejecución
```bash
# 1. Clonar el repositorio
git clone https://github.com/crdiazu/pipelineCDU.git
cd pipelineCDU

# 2. Instalar dependencias
npm install

# 3. Iniciar servidor de desarrollo (http://localhost:5173)
npm run dev

# 4. Generar bundle optimizado de producción en /dist
npm run build
```

---

## ☁️ Despliegue en GitHub Pages y Vercel

### GitHub Pages (Automático con GitHub Actions)
El repositorio incluye el flujo [`.github/workflows/deploy-pages.yml`](./.github/workflows/deploy-pages.yml). Para activarlo por primera vez en GitHub:
1. Entra a **`https://github.com/crdiazu/pipelineCDU/settings/pages`**.
2. En **Build and deployment > Source**, selecciona **GitHub Actions**.
3. El workflow compilará y publicará automáticamente el dashboard en **`https://crdiazu.github.io/pipelineCDU/`**.

### Vercel
1. Ingresa a [vercel.com/new](https://vercel.com/new) e importa el repositorio **`crdiazu/pipelineCDU`**.
2. Vercel detectará automáticamente la configuración de [`vercel.json`](./vercel.json) (`Vite`, comando `npm run build`, directorio `dist`).
3. Haz clic en **Deploy**.

---

**Desarrollado para TECNOVOA — Tecnología & Servicios B2B** · *Gestión de Cartera & Forecast CDU (Noviembre 2026)*.
