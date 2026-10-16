"""
olap_queries.py — Operaciones OLAP sobre el DW de exportaciones
Motor: DuckDB 1.5
"""
import duckdb
import pandas as pd

DW_DB = 'data/dw/agroexport.duckdb'
con = duckdb.connect(DW_DB, read_only=True)

pd.set_option('display.float_format', '{:,.2f}'.format)
pd.set_option('display.max_columns', 10)
pd.set_option('display.width', 120)

# ── 1. ROLL-UP ────────────────────────────────────────────────
# De mes → trimestre → año (agregación hacia arriba en dim_tiempo)
print("\n=== ROLL-UP: FOB total por Año > Trimestre ===")
df = con.execute("""
    SELECT t.anio, t.trimestre,
           COUNT(*)              AS despachos,
           SUM(f.fob_usd)        AS fob_total_usd,
           SUM(f.peso_kg)/1000   AS toneladas
    FROM fact_despacho f
    JOIN dim_tiempo t ON f.id_tiempo = t.id_tiempo
    GROUP BY ROLLUP(t.anio, t.trimestre)
    ORDER BY t.anio NULLS LAST, t.trimestre NULLS LAST
""").df()
print(df.to_string(index=False))

# ── 2. DRILL-DOWN ─────────────────────────────────────────────
# De categoría → producto específico (bajamos al detalle de dim_producto)
print("\n=== DRILL-DOWN: Categoría → Producto (FOB 2024) ===")
df = con.execute("""
    SELECT p.categoria, p.descripcion_ncm,
           COUNT(*)       AS despachos,
           SUM(f.fob_usd) AS fob_total_usd
    FROM fact_despacho f
    JOIN dim_tiempo   t ON f.id_tiempo   = t.id_tiempo
    JOIN dim_producto p ON f.id_producto = p.id_producto
    WHERE t.anio = 2024
    GROUP BY p.categoria, p.descripcion_ncm
    ORDER BY p.categoria, fob_total_usd DESC
""").df()
print(df.to_string(index=False))

# ── 3. SLICE ──────────────────────────────────────────────────
# Fijamos una dimensión: solo exportaciones a Brasil
print("\n=== SLICE: Solo destino = Brasil (todos los años) ===")
df = con.execute("""
    SELECT t.anio, t.nombre_mes,
           COUNT(*)       AS despachos,
           SUM(f.fob_usd) AS fob_total_usd
    FROM fact_despacho f
    JOIN dim_tiempo  t ON f.id_tiempo  = t.id_tiempo
    JOIN dim_destino d ON f.id_destino = d.id_destino
    WHERE d.nombre_pais = 'Brasil'
    GROUP BY t.anio, t.mes, t.nombre_mes
    ORDER BY t.anio, t.mes
    LIMIT 12
""").df()
print(df.to_string(index=False))

# ── 4. DICE ───────────────────────────────────────────────────
# Combinamos filtros en varias dimensiones a la vez
print("\n=== DICE: Oleaginosas + MERCOSUR + 2023-2024 ===")
df = con.execute("""
    SELECT t.anio, d.nombre_pais, p.categoria,
           COUNT(*)       AS despachos,
           SUM(f.fob_usd) AS fob_total_usd
    FROM fact_despacho f
    JOIN dim_tiempo   t ON f.id_tiempo   = t.id_tiempo
    JOIN dim_producto p ON f.id_producto = p.id_producto
    JOIN dim_destino  d ON f.id_destino  = d.id_destino
    WHERE p.categoria      = 'Oleaginosas'
      AND d.bloque_comercial = 'MERCOSUR'
      AND t.anio BETWEEN 2023 AND 2024
    GROUP BY t.anio, d.nombre_pais, p.categoria
    ORDER BY t.anio, fob_total_usd DESC
""").df()
print(df.to_string(index=False))

# ── 5. PIVOT ──────────────────────────────────────────────────
# Países como columnas, años como filas
print("\n=== PIVOT: FOB por Año (filas) x País destino (columnas) ===")
df = con.execute("""
    PIVOT (
        SELECT t.anio, d.nombre_pais, SUM(f.fob_usd) AS fob
        FROM fact_despacho f
        JOIN dim_tiempo  t ON f.id_tiempo  = t.id_tiempo
        JOIN dim_destino d ON f.id_destino = d.id_destino
        GROUP BY t.anio, d.nombre_pais
    )
    ON nombre_pais
    USING SUM(fob)
    GROUP BY anio
    ORDER BY anio
""").df()
print(df.to_string(index=False))

con.close()
print("\nConsultas OLAP completadas.")