"""
gen_f1.py — Genera datos sintéticos de despachos de exportación (F1)
Salida: data/raw/sintetico/f1_despachos.csv
"""
import pandas as pd
import numpy as np
from faker import Faker
import random
from pathlib import Path

fake = Faker('es_ES')
random.seed(42)
np.random.seed(42)

# --- Parámetros ---
N = 5000  # cantidad de despachos

# Países destino (alineados con INE 8.2.2)
PAISES = [
    ('ARG', 'Argentina', 'América del Sur', 'MERCOSUR'),
    ('BRA', 'Brasil', 'América del Sur', 'MERCOSUR'),
    ('URY', 'Uruguay', 'América del Sur', 'MERCOSUR'),
    ('CHN', 'China', 'Asia', 'Otro'),
    ('DEU', 'Alemania', 'Europa', 'UE'),
    ('NLD', 'Países Bajos', 'Europa', 'UE'),
    ('USA', 'Estados Unidos', 'América del Norte', 'Otro'),
    ('CHL', 'Chile', 'América del Sur', 'Otro'),
    ('ESP', 'España', 'Europa', 'UE'),
    ('ROU', 'Resto del Mundo', 'Varios', 'Otro'),
]

# Capítulos NCM más exportados por Paraguay
NCM_CAPS = [
    (12, '1201000090', 'Soja en grano', 'Oleaginosas', 'TON', 420.0),
    (15, '1507100000', 'Aceite de soja en bruto', 'Oleaginosas', 'TON', 890.0),
    (23, '2304000000', 'Harina y pellets de soja', 'Oleaginosas', 'TON', 310.0),
    (10, '1005900090', 'Maíz', 'Cereales', 'TON', 195.0),
    (2, '0201300000', 'Carne bovina fresca', 'Carnes', 'TON', 4200.0),
    (44, '4407100000', 'Madera aserrada', 'Madera', 'M3', 180.0),
    (27, '2716000000', 'Energía eléctrica', 'Energía', 'MWH', 55.0),
    (52, '5201000000', 'Algodón sin cardar', 'Textiles', 'TON', 1100.0),
    (17, '1701140000', 'Azúcar de caña', 'Agroindustria', 'TON', 320.0),
    (24, '2401100000', 'Tabaco sin elaborar', 'Agroindustria', 'TON', 2800.0),
]

# Departamentos de Paraguay
DEPTOS = [
    'Alto Paraná', 'Itapúa', 'Canindeyú', 'Caaguazú',
    'San Pedro', 'Concepción', 'Amambay', 'Central',
]

TIPOS_EMPRESA = ['SA', 'SRL', 'Unipersonal', 'Cooperativa']

# --- Generar exportadores (100 empresas) ---
exportadores = []
for i in range(1, 101):
    exportadores.append({
        'id_exportador': i,
        'ruc': f'{random.randint(800000, 9999999)}-{random.randint(1,9)}',
        'razon_social': fake.company(),
        'departamento': random.choice(DEPTOS),
        'tipo_empresa': random.choice(TIPOS_EMPRESA),
    })

# --- Generar despachos ---
fechas = pd.date_range('2023-01-01', '2025-12-31', freq='D')
registros = []
for i in range(1, N + 1):
    ncm = random.choice(NCM_CAPS)
    pais = random.choice(PAISES)
    exp = random.choice(exportadores)
    fecha = random.choice(fechas)
    peso = round(random.uniform(5, 5000), 3)
    fob = round(peso * ncm[5] * random.uniform(0.85, 1.15), 2)

    registros.append({
        'id_despacho': i,
        'fecha': fecha.strftime('%Y-%m-%d'),
        'ruc_exportador': exp['ruc'],
        'razon_social': exp['razon_social'],
        'departamento_exportador': exp['departamento'],
        'tipo_empresa': exp['tipo_empresa'],
        'codigo_ncm': ncm[1],
        'capitulo_ncm': ncm[0],
        'descripcion_ncm': ncm[2],
        'categoria': ncm[3],
        'unidad_medida': ncm[4],
        'codigo_pais': pais[0],
        'nombre_pais': pais[1],
        'region': pais[2],
        'bloque_comercial': pais[3],
        'fob_usd': fob,
        'peso_kg': peso * 1000,
        'cantidad_bultos': random.randint(1, 500),
    })

out = Path('data/raw/sintetico/f1_despachos.csv')
out.parent.mkdir(parents=True, exist_ok=True)
df = pd.DataFrame(registros)
df.to_csv(out, index=False, encoding='utf-8')
print(f"F1 generado: {len(df)} registros → {out}")