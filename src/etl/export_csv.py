"""
export_csv.py — Exporta tablas del DW a CSV para Power BI
Salida: data/export/
"""
import duckdb
import pandas as pd
from pathlib import Path

DW_DB      = 'data/dw/agroexport.duckdb'
EXPORT_DIR = Path('data/export')
EXPORT_DIR.mkdir(parents=True, exist_ok=True)

con = duckdb.connect(DW_DB, read_only=True)

tablas = [
    ('dim_tiempo',      'SELECT * FROM dim_tiempo ORDER BY id_tiempo'),
    ('dim_producto',    'SELECT * FROM dim_producto ORDER BY id_producto'),
    ('dim_destino',     'SELECT * FROM dim_destino ORDER BY id_destino'),
    ('dim_exportador',  'SELECT * FROM dim_exportador ORDER BY id_exportador'),
    ('fact_despacho',   'SELECT * FROM fact_despacho ORDER BY id_despacho'),
]

for nombre, sql in tablas:
    df = con.execute(sql).df()
    ruta = EXPORT_DIR / f'{nombre}.csv'
    df.to_csv(ruta, index=False, encoding='utf-8')
    print(f'  {nombre}: {len(df)} filas → {ruta}')

con.close()
print(f'\nExportacion completada → {EXPORT_DIR}')
print('Archivos listos para importar en Power BI.')