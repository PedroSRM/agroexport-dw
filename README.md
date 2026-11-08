# AgroExport Paraguay S.A. — Data Warehouse

**Curso:** 22891 · Taller de Base de Datos  
**Universidad:** Universidad del Norte, Paraguay  
**Docente:** Lic. Walter Romero  
**Alumno:** Pedro Ríos  
**Año:** 2026

---

## Descripción del proyecto

Data Warehouse para la empresa **AgroExport Paraguay S.A.**, orientado al análisis de despachos de exportación agrícola entre 2023 y 2025. Permite responder preguntas de negocio relacionadas con la evolución del valor FOB, concentración de productos, destinos geográficos, calidad de datos NCM y consistencia de precios internacionales.

---

## Arquitectura

| Componente | Tecnología |
|---|---|
| Motor DW | DuckDB 1.5 (archivo `.duckdb`) |
| ETL | Python 3.12 + pandas |
| Modelo dimensional | Esquema estrella (1 fact + 4 dims) |
| Visualización | Microsoft Power BI Desktop (.pbix) |

### Esquema estrella

```
                    dim_tiempo
                       │
dim_exportador ── fact_despacho ── dim_producto
                       │
                   dim_destino
```

**Tabla de hechos:** `fact_despacho`  
**Dimensiones:** `dim_tiempo` · `dim_producto` · `dim_destino` · `dim_exportador`

---

## Estructura del repositorio

```
agroexport-dw/
├── src/
│   └── etl/
│       ├── etl_agroexport.py        # Pipeline ETL principal
│       └── requirements.txt
├── data/
│   ├── raw/                         # Datos fuente originales (CSV)
│   ├── export/                      # Vistas exportadas para Power BI
│   └── quarantine/                  # Registros rechazados (NCM huérfano)
├── olap/
│   └── consultas_olap.sql           # 6 operadores OLAP documentados
├── dashboard/
│   └── AgroExport_DW.pbix           # Dashboard Power BI (3 páginas)
├── docs/
│   ├── H1_Informe.docx              # Hito 1: Análisis de requerimientos
│   ├── H2_Informe.docx              # Hito 2: Modelo dimensional + ETL
│   └── H3_Informe_Final_AgroExport.docx  # Hito 3: OLAP + Dashboard
└── presentacion/
    └── H3_Presentacion_AgroExport.pptx  # Presentación final H3
```

---

## Métricas clave del DW

| Métrica | Valor |
|---|---|
| Total de despachos cargados | 5.000 |
| Registros en cuarentena (NCM huérfano) | 497 (9,94 %) |
| Días en `dim_tiempo` | 1.095 (rango continuo 2023–2025) |
| Variación FOB vs. precio de referencia | +68,3 % |
| Crecimiento FOB interanual promedio | +52 % |
| Exportadores únicos (SCD-2) | — |

---

## Preguntas de negocio respondidas (H3)

| # | Pregunta | Dashboard |
|---|---|---|
| P1 | ¿Cómo evolucionó el FOB mensual vs. el año anterior? | Pág. 1 — Resumen |
| P2 | ¿Qué productos concentran el mayor valor y volumen? | Pág. 2 — Productos |
| P3 | ¿Hacia qué países y bloques se dirigen las exportaciones? | Pág. 1 + Pág. 2 |
| P4 | ¿Cuántos despachos tienen inconsistencias de codificación NCM? | Pág. 1 + Pág. 3 |
| P5 | ¿El FOB declarado es consistente con precios internacionales de referencia? | Pág. 3 — OLAP |

---

## Operadores OLAP implementados

| Operador | Descripción |
|---|---|
| Roll-up | FOB anual por categoría de producto |
| Drill-down | FOB mensual → semanal → diario |
| Slice | Filtro por año específico |
| Dice | Filtro multi-dimensión (año + país + categoría) |
| Pivot | Matriz categoría × año |
| Drill-across | Cruce `fact_despacho` ↔ `dim_producto.precio_ref_usd_ton` |

---

## Calidad de datos

- **Miembro "No definido"** (`sk = -1`) en todas las dimensiones para registros sin match
- **Cuarentena:** 497 registros con NCM `0201300000` sin entrada en catálogo → `data/quarantine/`
- **SCD Tipo 2** en `dim_exportador` (columna `es_vigente`)

---

## Ejecución del ETL

```powershell
# Instalar dependencias
pip install -r src/etl/requirements.txt

# Ejecutar pipeline
python src/etl/etl_agroexport.py
```

> **Nota:** el archivo `.duckdb` no está versionado. Para regenerarlo, colocar los CSV fuente en `data/raw/` y ejecutar el ETL.

---

## Hitos del proyecto

| Hito | Estado | Entregable |
|---|---|---|
| H1 — Análisis de requerimientos | ✅ Aprobado | `docs/H1_Informe.docx` |
| H2 — Modelo dimensional + ETL | ✅ Aprobado | `docs/H2_Informe.docx` |
| H3 — OLAP + Dashboard | 🔄 Entregado | `docs/H3_Informe_Final_AgroExport.docx` · `dashboard/AgroExport_DW.pbix` |
