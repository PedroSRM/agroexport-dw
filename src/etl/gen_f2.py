"""
gen_f2.py — Genera catálogo de productos sintético (F2)
Salida: data/raw/sintetico/f2_productos.xlsx
"""
import pandas as pd
from pathlib import Path

# Catálogo de productos basado en nomenclatura NCM/MERCOSUR
# Alineado con capítulos usados en F1 y datos INE 8.2.8 / 8.2.9
productos = [
    (1,  '1201000090', 12, 'Soja en grano, incluso quebrantada',          'Oleaginosas',   'TON',  420.0),
    (2,  '1201000010', 12, 'Soja para siembra',                            'Oleaginosas',   'TON',  480.0),
    (3,  '1507100000', 15, 'Aceite de soja en bruto',                      'Oleaginosas',   'TON',  890.0),
    (4,  '1507900000', 15, 'Aceite de soja refinado',                      'Oleaginosas',   'TON', 1050.0),
    (5,  '2304000000', 23, 'Harina y pellets de soja',                     'Oleaginosas',   'TON',  310.0),
    (6,  '1005900090', 10, 'Maíz, excepto para siembra',                   'Cereales',      'TON',  195.0),
    (7,  '1001990090', 10, 'Trigo blando',                                 'Cereales',      'TON',  220.0),
    (8,  '1006300000', 10, 'Arroz semiblanqueado o blanqueado',            'Cereales',      'TON',  410.0),
    (9,  '0201300000', 2,  'Carne bovina fresca deshuesada',               'Carnes',        'TON', 4200.0),
    (10, '0202300000', 2,  'Carne bovina congelada deshuesada',            'Carnes',        'TON', 3800.0),
    (11, '0203290000', 2,  'Carne porcina congelada',                      'Carnes',        'TON', 2900.0),
    (12, '4407100000', 44, 'Madera de coníferas aserrada',                 'Madera',        'M3',   180.0),
    (13, '4403990000', 44, 'Madera en bruto',                              'Madera',        'M3',    95.0),
    (14, '2716000000', 27, 'Energía eléctrica',                            'Energía',       'MWH',   55.0),
    (15, '5201000000', 52, 'Algodón sin cardar ni peinar',                 'Textiles',      'TON', 1100.0),
    (16, '5203000000', 52, 'Algodón cardado o peinado',                    'Textiles',      'TON', 1350.0),
    (17, '1701140000', 17, 'Azúcar de caña en bruto',                      'Agroindustria', 'TON',  320.0),
    (18, '1701990000', 17, 'Azúcar de caña refinada',                      'Agroindustria', 'TON',  480.0),
    (19, '2401100000', 24, 'Tabaco sin desvenar ni desnervar',             'Agroindustria', 'TON', 2800.0),
    (20, '2401200000', 24, 'Tabaco total o parcialmente desvenado',        'Agroindustria', 'TON', 3100.0),
]

columnas = [
    'id_producto', 'codigo_ncm', 'capitulo_ncm', 'descripcion_ncm',
    'categoria', 'unidad_medida', 'precio_ref_usd_ton'
]

df = pd.DataFrame(productos, columns=columnas)

out = Path('data/raw/sintetico/f2_productos.xlsx')
out.parent.mkdir(parents=True, exist_ok=True)
df.to_excel(out, index=False, sheet_name='catalogo_productos')
print(f"F2 generado: {len(df)} productos → {out}")