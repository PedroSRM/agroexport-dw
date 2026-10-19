import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from pathlib import Path

ALTO_FILA = 0.42

def tabla(ax, x, y, titulo, campos, color_header, ancho=3.4):
    # Header
    ax.add_patch(mpatches.FancyBboxPatch(
        (x, y), ancho, ALTO_FILA, boxstyle="square,pad=0",
        facecolor=color_header, edgecolor='#222222', linewidth=1.5))
    ax.text(x + ancho/2, y + ALTO_FILA/2, titulo,
        ha='center', va='center', fontsize=9.5,
        fontweight='bold', color='white', family='monospace')
    # Filas
    for i, (campo, tipo, rol) in enumerate(campos):
        cy = y - ALTO_FILA * (i + 1)
        bg = '#FFFFFF' if i % 2 == 0 else '#F2F2F2'
        ax.add_patch(mpatches.FancyBboxPatch(
            (x, cy), ancho, ALTO_FILA, boxstyle="square,pad=0",
            facecolor=bg, edgecolor='#CCCCCC', linewidth=0.6))
        icono = '⬡' if rol == 'PK' else ('◈' if rol == 'FK' else ' ')
        color_i = '#B8860B' if rol == 'PK' else ('#1565C0' if rol == 'FK' else '#999')
        ax.text(x + 0.15, cy + ALTO_FILA/2, icono,
            ha='left', va='center', fontsize=7, color=color_i)
        ax.text(x + 0.45, cy + ALTO_FILA/2, campo,
            ha='left', va='center', fontsize=7.5, color='#1A1A1A')
        ax.text(x + ancho - 0.1, cy + ALTO_FILA/2, tipo,
            ha='right', va='center', fontsize=6.8, color='#777777')
    n = len(campos)
    alto_total = ALTO_FILA * (n + 1)
    ax.add_patch(mpatches.FancyBboxPatch(
        (x, y - ALTO_FILA * n), ancho, alto_total,
        boxstyle="square,pad=0",
        facecolor='none', edgecolor='#222222', linewidth=1.2))
    top    = y + ALTO_FILA
    bottom = y - ALTO_FILA * n
    cx     = x + ancho / 2
    return cx, top, cx, bottom   # cx_top, y_top, cx_bot, y_bot

fig, ax = plt.subplots(figsize=(18, 16))
ax.set_xlim(0, 18)
ax.set_ylim(0, 16)
ax.axis('off')
fig.patch.set_facecolor('#F8F8F8')

# ── Coordenadas base (x,y = esquina sup-izq del header) ───────
FX, FY = 7.3, 10.5   # fact  (8 campos → baja 3.36 → bottom=7.14)
TX, TY = 7.3, 14.8   # tiempo (7 campos → bottom=11.84) gap=0.94 ✓
PX, PY = 0.4, 10.5   # producto (7 campos → bottom=7.56)
DX, DY = 14.2, 10.5  # destino (5 campos → bottom=8.4)
EX, EY = 7.3,  6.5   # exportador (8 campos → bottom=3.14)

fact_campos = [
    ('id_despacho',    'BIGINT','PK'),
    ('id_tiempo',      'INT',   'FK'),
    ('id_producto',    'INT',   'FK'),
    ('id_destino',     'INT',   'FK'),
    ('id_exportador',  'INT',   'FK'),
    ('fob_usd',        'DEC',   ''),
    ('peso_kg',        'DEC',   ''),
    ('cantidad_bultos','INT',   ''),
]
_, f_top, f_cx, f_bot = tabla(ax, FX, FY, 'fact_despacho', fact_campos, '#1F3B6E')

dim_t = [
    ('id_tiempo',  'INT',  'PK'),
    ('fecha',      'DATE', ''),
    ('anio',       'INT',  ''),
    ('mes',        'INT',  ''),
    ('nombre_mes', 'VAR',  ''),
    ('trimestre',  'INT',  ''),
    ('semestre',   'INT',  ''),
]
_, _, t_cx, t_bot = tabla(ax, TX, TY, 'dim_tiempo', dim_t, '#2E7D32')

dim_p = [
    ('id_producto',        'INT','PK'),
    ('codigo_ncm',         'VAR',''),
    ('capitulo_ncm',       'INT',''),
    ('descripcion_ncm',    'VAR',''),
    ('categoria',          'VAR',''),
    ('unidad_medida',      'VAR',''),
    ('precio_ref_usd_ton', 'DEC',''),
]
p_cx, _, _, p_mid = tabla(ax, PX, PY, 'dim_producto', dim_p, '#6A1B9A')
p_right_mid = (PX + 3.4, FY - ALTO_FILA * 2.5)

dim_d = [
    ('id_destino',       'INT', 'PK'),
    ('codigo_pais',      'CHAR',''),
    ('nombre_pais',      'VAR', ''),
    ('region',           'VAR', ''),
    ('bloque_comercial', 'VAR', ''),
]
d_cx, _, _, _ = tabla(ax, DX, DY, 'dim_destino', dim_d, '#1565C0')

dim_e = [
    ('id_exportador','INT', 'PK'),
    ('ruc',          'VAR', ''),
    ('razon_social', 'VAR', ''),
    ('departamento', 'VAR', ''),
    ('tipo_empresa', 'VAR', ''),
    ('fecha_inicio', 'DATE',''),
    ('fecha_fin',    'DATE',''),
    ('es_vigente',   'BOOL',''),
]
_, e_top, e_cx, _ = tabla(ax, EX, EY, 'dim_exportador', dim_e, '#BF360C')

# ── Flechas ───────────────────────────────────────────────────
props = dict(arrowstyle='<-', color='#444444', lw=2.0)
MID_Y = FY - ALTO_FILA * 3.0   # altura fila id_destino en fact

# tiempo ↕ fact (vertical arriba)
ax.annotate('', xy=(f_cx, f_top), xytext=(t_cx, t_bot),
    arrowprops=props)
# producto → fact (horizontal)
ax.annotate('', xy=(FX, MID_Y), xytext=(PX + 3.4, MID_Y),
    arrowprops=props)
# destino → fact (horizontal)
ax.annotate('', xy=(FX + 3.4, MID_Y), xytext=(DX, MID_Y),
    arrowprops=props)
# exportador ↕ fact (vertical abajo)
ax.annotate('', xy=(f_cx, f_bot), xytext=(e_cx, e_top),
    arrowprops=props)

out = Path('docs/diagrama_star_schema.png')
out.parent.mkdir(parents=True, exist_ok=True)
plt.tight_layout(pad=1.5)
plt.savefig(out, dpi=150, bbox_inches='tight', facecolor='#F8F8F8')
print(f"Diagrama guardado → {out}")