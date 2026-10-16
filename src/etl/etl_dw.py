"""
etl_dw.py — ETL: staging → modelo dimensional (DuckDB)
Salida: data/dw/agroexport.duckdb
"""
import duckdb
import pandas as pd
from pathlib import Path

STAGING_DB = 'data/staging/staging.duckdb'
DW_DB      = 'data/dw/agroexport.duckdb'
DDL_PATH   = 'src/sql/schema_dw.sql'

Path('data/dw').mkdir(parents=True, exist_ok=True)

stg = duckdb.connect(STAGING_DB, read_only=True)
dw  = duckdb.connect(DW_DB)

# Crear tablas del DW
with open(DDL_PATH, 'r', encoding='utf-8') as f:
    dw.execute(f.read())

print("Esquema creado en DW.")

# ── 1. dim_tiempo ─────────────────────────────────────────────
print("Cargando dim_tiempo...")
fechas = stg.execute("SELECT DISTINCT fecha FROM stg_f1_despachos").df()
fechas['fecha'] = pd.to_datetime(fechas['fecha'])
fechas = fechas.sort_values('fecha').reset_index(drop=True)

MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
         'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

rows = []
for i, row in fechas.iterrows():
    f = row['fecha']
    rows.append({
        'id_tiempo':  int(f.strftime('%Y%m%d')),
        'fecha':      f.date(),
        'anio':       f.year,
        'mes':        f.month,
        'nombre_mes': MESES[f.month - 1],
        'trimestre':  (f.month - 1) // 3 + 1,
        'semestre':   1 if f.month <= 6 else 2,
    })

df_tiempo = pd.DataFrame(rows)
dw.execute("INSERT INTO dim_tiempo SELECT * FROM df_tiempo")
print(f"  dim_tiempo: {len(df_tiempo)} filas")

# ── 2. dim_producto ───────────────────────────────────────────
print("Cargando dim_producto...")
df_prod = stg.execute("SELECT * FROM stg_f2_productos").df()
df_prod = df_prod.rename(columns={'precio_ref_usd_ton': 'precio_ref_usd_ton'})
dw.execute("INSERT INTO dim_producto SELECT * FROM df_prod")
print(f"  dim_producto: {len(df_prod)} filas")

# ── 3. dim_destino ────────────────────────────────────────────
print("Cargando dim_destino...")
df_dest = stg.execute("""
    SELECT DISTINCT codigo_pais, nombre_pais, region, bloque_comercial
    FROM stg_f1_despachos
    ORDER BY codigo_pais
""").df()
df_dest.insert(0, 'id_destino', range(1, len(df_dest) + 1))
dw.execute("INSERT INTO dim_destino SELECT * FROM df_dest")
print(f"  dim_destino: {len(df_dest)} filas")

# ── 4. dim_exportador (SCD Tipo 2) ────────────────────────────
print("Cargando dim_exportador...")
df_exp = stg.execute("""
    SELECT DISTINCT ruc_exportador AS ruc, razon_social,
                    departamento_exportador AS departamento, tipo_empresa
    FROM stg_f1_despachos
    ORDER BY ruc_exportador
""").df()
df_exp.insert(0, 'id_exportador', range(1, len(df_exp) + 1))
df_exp['fecha_inicio'] = pd.Timestamp('2023-01-01').date()
df_exp['fecha_fin']    = None
df_exp['es_vigente']   = True
dw.execute("INSERT INTO dim_exportador SELECT * FROM df_exp")
print(f"  dim_exportador: {len(df_exp)} filas")

# ── 5. fact_despacho ──────────────────────────────────────────
print("Cargando fact_despacho...")
df_f1 = stg.execute("SELECT * FROM stg_f1_despachos").df()
df_f1['fecha'] = pd.to_datetime(df_f1['fecha'])
df_f1['id_tiempo'] = df_f1['fecha'].dt.strftime('%Y%m%d').astype(int)

# Lookup id_producto
df_lookup_prod = dw.execute(
    "SELECT id_producto, codigo_ncm FROM dim_producto"
).df()
df_f1 = df_f1.merge(df_lookup_prod, on='codigo_ncm', how='left')

# Lookup id_destino
df_lookup_dest = dw.execute(
    "SELECT id_destino, codigo_pais FROM dim_destino"
).df()
df_f1 = df_f1.merge(df_lookup_dest, on='codigo_pais', how='left')

# Lookup id_exportador
df_lookup_exp = dw.execute(
    "SELECT id_exportador, ruc FROM dim_exportador WHERE es_vigente = TRUE"
).df()
df_f1 = df_f1.rename(columns={'ruc_exportador': 'ruc'})
df_f1 = df_f1.merge(df_lookup_exp, on='ruc', how='left')

# Construir fact
df_fact = df_f1[[
    'id_despacho', 'id_tiempo', 'id_producto',
    'id_destino', 'id_exportador',
    'fob_usd', 'peso_kg', 'cantidad_bultos'
]].copy()

# Control de calidad: detectar NULLs en FKs
nulos = df_fact[['id_producto','id_destino','id_exportador']].isnull().sum()
print(f"  Nulos en FKs: {nulos.to_dict()}")

df_fact = df_fact.dropna(subset=['id_producto','id_destino','id_exportador'])
df_fact = df_fact.astype({
    'id_despacho': int, 'id_tiempo': int, 'id_producto': int,
    'id_destino': int, 'id_exportador': int, 'cantidad_bultos': int
})

dw.execute("INSERT INTO fact_despacho SELECT * FROM df_fact")
print(f"  fact_despacho: {len(df_fact)} filas")

stg.close()
dw.close()
print("\nETL completado → ", DW_DB)