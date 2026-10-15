"""
staging_load.py — Carga F1, F2 y F3 al staging area en DuckDB
Sin transformaciones: los datos entran tal cual están en los archivos.
Salida: data/staging/staging.duckdb
"""
import duckdb
import pandas as pd
from pathlib import Path

DB_PATH = 'data/staging/staging.duckdb'
Path('data/staging').mkdir(parents=True, exist_ok=True)

con = duckdb.connect(DB_PATH)

# ── F1: despachos sintéticos ──────────────────────────────────
print("Cargando F1...")
con.execute("""
    CREATE OR REPLACE TABLE stg_f1_despachos AS
    SELECT * FROM read_csv_auto('data/raw/sintetico/f1_despachos.csv')
""")
n = con.execute("SELECT COUNT(*) FROM stg_f1_despachos").fetchone()[0]
print(f"  stg_f1_despachos: {n} filas")

# ── F2: catálogo de productos ─────────────────────────────────
print("Cargando F2...")
df_f2 = pd.read_excel('data/raw/sintetico/f2_productos.xlsx', sheet_name='catalogo_productos')
con.execute("CREATE OR REPLACE TABLE stg_f2_productos AS SELECT * FROM df_f2")
n = con.execute("SELECT COUNT(*) FROM stg_f2_productos").fetchone()[0]
print(f"  stg_f2_productos: {n} filas")

# ── F3: INE Anuario 2021 ──────────────────────────────────────
print("Cargando F3...")

ine_files = {
    'stg_f3_exp_producto': 'data/raw/ine_anuario_2021/8.2.1.EXPORTACIONES REGISTRADAS (en miles de Dólares) POR PRODUCTOS, SEGÚN AÑO Y MES. PERIODO 2020-2021.csv',
    'stg_f3_exp_destino':  'data/raw/ine_anuario_2021/8.2.2.EXPORTACIONES REGISTRADAS CON EL MERCOSUR Y RESTO DEL MUNDO (en miles de Dólares) POR PAÍS, SEGÚN AÑO Y MES. PERIODO 2020-2021.csv',
    'stg_f3_precios_int':  'data/raw/ine_anuario_2021/8.2.3.PRECIOS INTERNACIONALES DE LA SOJA, EL ALGODÓN Y EL PETRÓLEO, SEGÚN AÑO Y MES. PERIODO 2020-2021.csv',
    'stg_f3_ncm_2020':     'data/raw/ine_anuario_2021/8.2.8.COMERCIO EXTERIOR DEL PARAGUAY CON EL MERCOSUR Y RESTO DEL MUNDO. EXPORTACIONES (en miles de US$ FOB) POR PAÍS, SEGÚN CAPÍTULO. AÑO 2020.csv',
    'stg_f3_ncm_2021':     'data/raw/ine_anuario_2021/8.2.9.COMERCIO EXTERIOR DEL PARAGUAY CON EL MERCOSUR Y RESTO DEL MUNDO. EXPORTACIONES (en miles de US$ FOB) POR PAÍS, SEGÚN CAPÍTULO. AÑO 2021.csv',
}

for tabla, archivo in ine_files.items():
    try:
        df = pd.read_csv(archivo, encoding='utf-8', sep=None, engine='python')
    except UnicodeDecodeError:
        df = pd.read_csv(archivo, encoding='latin-1', sep=None, engine='python')
    con.execute(f"CREATE OR REPLACE TABLE {tabla} AS SELECT * FROM df")
    n = con.execute(f"SELECT COUNT(*) FROM {tabla}").fetchone()[0]
    print(f"  {tabla}: {n} filas")

con.close()
print("\nStaging completo →", DB_PATH)