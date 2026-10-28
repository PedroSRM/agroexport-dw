"""
etl_dw.py — ETL: staging → modelo dimensional (DuckDB)
Salida: data/dw/agroexport.duckdb
Cuarentena: data/dw/cuarentena.csv
"""
import duckdb
import pandas as pd
from pathlib import Path

STAGING_DB  = 'data/staging/staging.duckdb'
DW_DB       = 'data/dw/agroexport.duckdb'
DDL_PATH    = 'src/sql/schema_dw.sql'
CUARENTENA  = 'data/dw/cuarentena.csv'

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

# ── 2. dim_producto (con miembro "No definido" sk=-1) ─────────
print("Cargando dim_producto...")
df_prod = stg.execute("SELECT * FROM stg_f2_productos").df()

# Miembro "No definido" para NCM huérfanos
no_def_prod = pd.DataFrame([{
    'id_producto':       -1,
    'codigo_ncm':        'INDEFINIDO',
    'capitulo_ncm':      -1,
    'descripcion_ncm':   'No definido',
    'categoria':         'No definido',
    'unidad_medida':     'N/A',
    'precio_ref_usd_ton': 0.00,
}])
df_prod_final = pd.concat([no_def_prod, df_prod], ignore_index=True)
dw.execute("INSERT INTO dim_producto SELECT * FROM df_prod_final")
print(f"  dim_producto: {len(df_prod_final)} filas (incl. sk=-1)")

# ── 3. dim_destino (con miembro "No definido" sk=-1) ──────────
print("Cargando dim_destino...")
df_dest = stg.execute("""
    SELECT DISTINCT codigo_pais, nombre_pais, region, bloque_comercial
    FROM stg_f1_despachos
    ORDER BY codigo_pais
""").df()
df_dest.insert(0, 'id_destino', range(1, len(df_dest) + 1))

no_def_dest = pd.DataFrame([{
    'id_destino':      -1,
    'codigo_pais':     'N/D',
    'nombre_pais':     'No definido',
    'region':          'No definido',
    'bloque_comercial':'No definido',
}])
df_dest_final = pd.concat([no_def_dest, df_dest], ignore_index=True)
dw.execute("INSERT INTO dim_destino SELECT * FROM df_dest_final")
print(f"  dim_destino: {len(df_dest_final)} filas (incl. sk=-1)")

# ── 4. dim_exportador (SCD Tipo 2, con miembro "No definido" sk=-1) ──
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

no_def_exp = pd.DataFrame([{
    'id_exportador': -1,
    'ruc':           'N/D',
    'razon_social':  'No definido',
    'departamento':  'No definido',
    'tipo_empresa':  'No definido',
    'fecha_inicio':  pd.Timestamp('2023-01-01').date(),
    'fecha_fin':     None,
    'es_vigente':    True,
}])
df_exp_final = pd.concat([no_def_exp, df_exp], ignore_index=True)
dw.execute("INSERT INTO dim_exportador SELECT * FROM df_exp_final")
print(f"  dim_exportador: {len(df_exp_final)} filas (incl. sk=-1)")

# ── 5. fact_despacho con cuarentena ───────────────────────────
print("Cargando fact_despacho...")
df_f1 = stg.execute("SELECT * FROM stg_f1_despachos").df()
df_f1['fecha'] = pd.to_datetime(df_f1['fecha'])
df_f1['id_tiempo'] = df_f1['fecha'].dt.strftime('%Y%m%d').astype(int)

# Lookups
df_lookup_prod = dw.execute(
    "SELECT id_producto, codigo_ncm FROM dim_producto WHERE id_producto != -1"
).df()
df_f1 = df_f1.merge(df_lookup_prod, on='codigo_ncm', how='left')

df_lookup_dest = dw.execute(
    "SELECT id_destino, codigo_pais FROM dim_destino WHERE id_destino != -1"
).df()
df_f1 = df_f1.merge(df_lookup_dest, on='codigo_pais', how='left')

df_lookup_exp = dw.execute(
    "SELECT id_exportador, ruc FROM dim_exportador WHERE es_vigente = TRUE AND id_exportador != -1"
).df()
df_f1 = df_f1.rename(columns={'ruc_exportador': 'ruc'})
df_f1 = df_f1.merge(df_lookup_exp, on='ruc', how='left')

# ── Cuarentena: registros con FKs nulas ANTES de asignar sk=-1
mask_cuarentena = (
    df_f1['id_producto'].isnull() |
    df_f1['id_destino'].isnull() |
    df_f1['id_exportador'].isnull()
)
df_cuarentena = df_f1[mask_cuarentena].copy()

def motivo(row):
    motivos = []
    if pd.isnull(row['id_producto']):
        motivos.append(f"NCM huerfano: {row['codigo_ncm']}")
    if pd.isnull(row['id_destino']):
        motivos.append(f"pais sin lookup: {row['codigo_pais']}")
    if pd.isnull(row['id_exportador']):
        motivos.append(f"RUC sin lookup: {row['ruc']}")
    return ' | '.join(motivos)

if not df_cuarentena.empty:
    df_cuarentena = df_cuarentena.copy()
    df_cuarentena['motivo_rechazo'] = df_cuarentena.apply(motivo, axis=1)
    df_cuarentena.to_csv(CUARENTENA, index=False, encoding='utf-8')
    print(f"  Cuarentena: {len(df_cuarentena)} registros → {CUARENTENA}")

    # Desglose por motivo
    print("  Desglose cuarentena:")
    for m, cnt in df_cuarentena['motivo_rechazo'].value_counts().head(10).items():
        print(f"    {cnt:4d}  {m}")

# ── Asignar sk=-1 a FKs nulas (en lugar de descartar)
df_f1['id_producto']   = df_f1['id_producto'].fillna(-1)
df_f1['id_destino']    = df_f1['id_destino'].fillna(-1)
df_f1['id_exportador'] = df_f1['id_exportador'].fillna(-1)

# Construir fact
df_fact = df_f1[[
    'id_despacho', 'id_tiempo', 'id_producto',
    'id_destino', 'id_exportador',
    'fob_usd', 'peso_kg', 'cantidad_bultos'
]].copy()

df_fact = df_fact.astype({
    'id_despacho': int, 'id_tiempo': int, 'id_producto': int,
    'id_destino': int, 'id_exportador': int, 'cantidad_bultos': int
})

dw.execute("INSERT INTO fact_despacho SELECT * FROM df_fact")
print(f"  fact_despacho: {len(df_fact)} filas (todas incluidas, huerfanos → sk=-1)")

stg.close()
dw.close()

# ── Resumen final
total = len(df_fact)
cuarentena_n = len(df_cuarentena) if not df_cuarentena.empty else 0
print(f"""
ETL completado → {DW_DB}
  Total registros cargados : {total}
  Registros en cuarentena  : {cuarentena_n} (guardados en {CUARENTENA})
  Registros con sk=-1      : {cuarentena_n} (incluidos en fact con dim No definido)
""")