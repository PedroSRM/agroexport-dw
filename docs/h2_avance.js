const {
  Document, Packer, Paragraph, TextRun,
  AlignmentType, Table, TableRow, TableCell, WidthType,
  BorderStyle, ShadingType, convertInchesToTwip,
} = require('docx');
const fs = require('fs');

// ─── Helpers (mismo estilo H1) ───────────────────────────────
function heading1(text) {
  return new Paragraph({
    children: [new TextRun({ text, bold: true, size: 26, color: '1F1F1F', font: 'Calibri' })],
    border: { bottom: { color: '999999', space: 1, value: BorderStyle.SINGLE, size: 6 } },
    spacing: { before: 360, after: 120 },
  });
}
function heading2(text) {
  return new Paragraph({
    children: [new TextRun({ text, bold: true, size: 22, color: '2F5496', font: 'Calibri' })],
    spacing: { before: 240, after: 60 },
  });
}
function body(text) {
  return new Paragraph({
    children: [new TextRun({ text, size: 22, font: 'Calibri' })],
    spacing: { before: 60, after: 60 },
    alignment: AlignmentType.JUSTIFIED,
  });
}
function bodyBold(label, value) {
  return new Paragraph({
    children: [
      new TextRun({ text: label, bold: true, size: 22, font: 'Calibri' }),
      new TextRun({ text: value, size: 22, font: 'Calibri' }),
    ],
    spacing: { before: 60, after: 60 },
    alignment: AlignmentType.JUSTIFIED,
  });
}
function bullet(text) {
  return new Paragraph({
    children: [new TextRun({ text, size: 22, font: 'Calibri' })],
    bullet: { level: 0 },
    spacing: { before: 40, after: 40 },
  });
}
function gap(sz = 100) {
  return new Paragraph({ children: [], spacing: { before: sz, after: 0 } });
}
function hrParagraph() {
  return new Paragraph({
    children: [],
    border: { bottom: { color: 'AAAAAA', space: 1, value: BorderStyle.SINGLE, size: 6 } },
    spacing: { before: 160, after: 160 },
  });
}
function twoColTable(rows, { colWidths = [3200, 5800] } = {}) {
  return new Table({
    columnWidths: colWidths,
    width: { size: 9000, type: WidthType.DXA },
    rows: rows.map(([label, value, isHeader]) =>
      new TableRow({
        children: [
          new TableCell({
            width: { size: colWidths[0], type: WidthType.DXA },
            shading: isHeader
              ? { type: ShadingType.CLEAR, color: '404040', fill: '404040' }
              : { type: ShadingType.CLEAR, color: 'F5F5F5', fill: 'F5F5F5' },
            children: [new Paragraph({
              children: [new TextRun({ text: label, bold: true, size: 20, color: isHeader ? 'FFFFFF' : '1F1F1F', font: 'Calibri' })],
              spacing: { before: 60, after: 60 },
            })],
          }),
          new TableCell({
            width: { size: colWidths[1], type: WidthType.DXA },
            shading: isHeader
              ? { type: ShadingType.CLEAR, color: '404040', fill: '404040' }
              : { type: ShadingType.CLEAR, color: 'FFFFFF', fill: 'FFFFFF' },
            children: [new Paragraph({
              children: [new TextRun({ text: value, size: 20, color: isHeader ? 'FFFFFF' : '333333', font: 'Calibri' })],
              spacing: { before: 60, after: 60 },
            })],
          }),
        ],
      })
    ),
  });
}

// Tabla de dimensiones del modelo
function dimTable(dims) {
  const cols = [1800, 1400, 2200, 1400, 2200];
  const headers = ['Tabla', 'Tipo', 'Columnas clave', 'SCD', 'Fuente'];
  const headerRow = new TableRow({
    children: headers.map((h, i) => new TableCell({
      width: { size: cols[i], type: WidthType.DXA },
      shading: { type: ShadingType.CLEAR, color: '404040', fill: '404040' },
      children: [new Paragraph({ children: [new TextRun({ text: h, bold: true, size: 19, color: 'FFFFFF', font: 'Calibri' })] })],
    })),
  });
  const dataRows = dims.map((d, i) => new TableRow({
    children: [d.tabla, d.tipo, d.clave, d.scd, d.fuente].map((val, ci) => new TableCell({
      width: { size: cols[ci], type: WidthType.DXA },
      shading: { type: ShadingType.CLEAR, color: i % 2 === 0 ? 'F5F5F5' : 'FFFFFF', fill: i % 2 === 0 ? 'F5F5F5' : 'FFFFFF' },
      children: [new Paragraph({ children: [new TextRun({ text: val, size: 19, font: 'Calibri' })], spacing: { before: 40, after: 40 } })],
    })),
  }));
  return new Table({
    columnWidths: cols,
    width: { size: 9000, type: WidthType.DXA },
    rows: [headerRow, ...dataRows],
  });
}

// Tabla de staging
function stagingTable(tabs) {
  const cols = [2200, 1400, 1600, 3800];
  const headers = ['Tabla staging', 'Filas', 'Fuente', 'Descripción'];
  const headerRow = new TableRow({
    children: headers.map((h, i) => new TableCell({
      width: { size: cols[i], type: WidthType.DXA },
      shading: { type: ShadingType.CLEAR, color: '404040', fill: '404040' },
      children: [new Paragraph({ children: [new TextRun({ text: h, bold: true, size: 19, color: 'FFFFFF', font: 'Calibri' })] })],
    })),
  });
  const dataRows = tabs.map((t, i) => new TableRow({
    children: [t.tabla, t.filas, t.fuente, t.desc].map((val, ci) => new TableCell({
      width: { size: cols[ci], type: WidthType.DXA },
      shading: { type: ShadingType.CLEAR, color: i % 2 === 0 ? 'F5F5F5' : 'FFFFFF', fill: i % 2 === 0 ? 'F5F5F5' : 'FFFFFF' },
      children: [new Paragraph({ children: [new TextRun({ text: val, size: 19, font: 'Calibri' })], spacing: { before: 40, after: 40 } })],
    })),
  }));
  return new Table({
    columnWidths: cols,
    width: { size: 9000, type: WidthType.DXA },
    rows: [headerRow, ...dataRows],
  });
}

// Recuadro placeholder para imagen
function imagePlaceholder(texto) {
  return new Table({
    columnWidths: [9000],
    width: { size: 9000, type: WidthType.DXA },
    rows: [new TableRow({
      children: [new TableCell({
        width: { size: 9000, type: WidthType.DXA },
        shading: { type: ShadingType.CLEAR, color: 'F0F0F0', fill: 'F0F0F0' },
        borders: {
          top:    { value: BorderStyle.DASHED, size: 6, color: '999999' },
          bottom: { value: BorderStyle.DASHED, size: 6, color: '999999' },
          left:   { value: BorderStyle.DASHED, size: 6, color: '999999' },
          right:  { value: BorderStyle.DASHED, size: 6, color: '999999' },
        },
        children: [
          new Paragraph({
            children: [new TextRun({ text: texto, size: 20, color: '888888', font: 'Calibri', italics: true })],
            alignment: AlignmentType.CENTER,
            spacing: { before: 400, after: 400 },
          }),
        ],
      })],
    })],
  });
}

// ─── Datos ────────────────────────────────────────────────────
const dims = [
  { tabla: 'fact_despacho', tipo: 'Hechos',     clave: 'id_despacho (PK)', scd: '—',       fuente: 'F1 (CSV sintético)' },
  { tabla: 'dim_tiempo',    tipo: 'Dimensión',   clave: 'id_tiempo (PK)',   scd: 'Tipo 1',  fuente: 'Generada en ETL' },
  { tabla: 'dim_producto',  tipo: 'Dimensión',   clave: 'id_producto (PK)', scd: 'Tipo 1',  fuente: 'F2 (Excel) + F3 INE' },
  { tabla: 'dim_destino',   tipo: 'Dimensión',   clave: 'id_destino (PK)',  scd: 'Tipo 1',  fuente: 'F1 + F3 INE 8.2.2' },
  { tabla: 'dim_exportador',tipo: 'Dimensión',   clave: 'id_exportador (PK)',scd:'Tipo 2',  fuente: 'F1 (CSV sintético)' },
];

const stagingTabs = [
  { tabla: 'stg_f1_despachos',    filas: '5.000', fuente: 'F1', desc: 'Despachos sintéticos de exportación 2023–2025' },
  { tabla: 'stg_f2_productos',    filas: '20',    fuente: 'F2', desc: 'Catálogo de productos NCM/MERCOSUR' },
  { tabla: 'stg_f3_exp_producto', filas: '26',    fuente: 'F3', desc: 'INE 8.2.1 — Exportaciones por producto y mes' },
  { tabla: 'stg_f3_exp_destino',  filas: '26',    fuente: 'F3', desc: 'INE 8.2.2 — Exportaciones por país y mes' },
  { tabla: 'stg_f3_precios_int',  filas: '26',    fuente: 'F3', desc: 'INE 8.2.3 — Precios internacionales soja/algodón' },
  { tabla: 'stg_f3_ncm_2020',     filas: '90',    fuente: 'F3', desc: 'INE 8.2.8 — Exportaciones por capítulo NCM 2020' },
  { tabla: 'stg_f3_ncm_2021',     filas: '89',    fuente: 'F3', desc: 'INE 8.2.9 — Exportaciones por capítulo NCM 2021' },
];

// ─── Documento ────────────────────────────────────────────────
const doc = new Document({
  styles: {
    default: { document: { run: { font: 'Calibri', size: 22 } } },
  },
  sections: [{
    properties: {
      page: {
        size: { width: 12240, height: 15840 },
        margin: {
          top:    convertInchesToTwip(1),
          bottom: convertInchesToTwip(1),
          left:   convertInchesToTwip(1.18),
          right:  convertInchesToTwip(1.18),
        },
      },
    },
    children: [

      // ── PORTADA ────────────────────────────────────────────
      gap(400),
      new Paragraph({
        children: [new TextRun({ text: 'UNIVERSIDAD DEL NORTE — PARAGUAY', bold: true, size: 22, color: '1F1F1F', font: 'Calibri' })],
        alignment: AlignmentType.CENTER, spacing: { before: 0, after: 60 },
      }),
      new Paragraph({
        children: [new TextRun({ text: 'Ingeniería Informática — Octavo Semestre', size: 20, color: '333333', font: 'Calibri' })],
        alignment: AlignmentType.CENTER, spacing: { before: 0, after: 60 },
      }),
      new Paragraph({
        children: [new TextRun({ text: 'Datawarehouse (22891)', size: 20, color: '333333', font: 'Calibri' })],
        alignment: AlignmentType.CENTER, spacing: { before: 0, after: 60 },
      }),
      gap(160),
      new Paragraph({
        children: [new TextRun({ text: 'TRABAJO PRÁCTICO — 2.º SEMESTRE 2026', bold: true, size: 36, color: '1F1F1F', font: 'Calibri' })],
        alignment: AlignmentType.CENTER, spacing: { before: 0, after: 100 },
      }),
      new Paragraph({
        children: [new TextRun({ text: 'H2 — Avance Intermedio', italics: true, size: 26, color: '1F1F1F', font: 'Calibri' })],
        alignment: AlignmentType.CENTER, spacing: { before: 0, after: 80 },
      }),
      gap(300),
      twoColTable([
        ['Campo', 'Detalle', true],
        ['Organización', 'AgroExport Paraguay S.A. (empresa ficticia)'],
        ['Docente', 'Lic. Walter Romero'],
        ['Materia', 'Datawarehouse — 22891 — 8.º Semestre'],
        ['Hito', 'H2 — Avance Intermedio'],
        ['Fecha de elaboración', 'Octubre 2026'],
        ['Modalidad', 'Individual'],
        ['Repositorio Git', 'https://github.com/PedroSRM/agroexport-dw'],
      ]),
      gap(600),

      // ── SECCIÓN 1 ──────────────────────────────────────────
      heading1('1. Modelo Dimensional — Star Schema'),
      body(
        'El modelo dimensional de AgroExport Paraguay S.A. sigue el esquema estrella (star schema). La tabla de hechos central registra cada despacho de exportación como un evento atómico, rodeada de cuatro dimensiones que describen el contexto de ese evento.'
      ),
      gap(80),
      heading2('1.1 Declaración del grano'),
      body(
        'El grano de la tabla de hechos fact_despacho es: un registro por despacho de exportación individual. Esto significa que cada fila representa un único envío de mercadería, de un exportador, hacia un destino, en una fecha determinada, con un código NCM específico. No se almacenan totales ni promedios en la tabla de hechos; toda agregación se realiza en tiempo de consulta.'
      ),
      gap(80),
      heading2('1.2 Resumen de tablas'),
      dimTable(dims),
      gap(100),
      heading2('1.3 Diagrama del esquema estrella'),
      body('A continuación se presenta el diagrama del modelo dimensional:'),
      gap(120),
      imagePlaceholder('[ Insertar aquí: docs/diagrama_star_schema.png ]'),
      gap(120),
      heading2('1.4 Dimensión con SCD Tipo 2: dim_exportador'),
      body(
        'La dimensión dim_exportador implementa Slowly Changing Dimension Tipo 2. La justificación es que los atributos de un exportador — razón social, departamento de operación y tipo de empresa — pueden cambiar a lo largo del tiempo (fusiones, cambios de domicilio fiscal, reconversión societaria). Con SCD Tipo 2 se mantiene el historial completo: cada versión del registro tiene fecha_inicio, fecha_fin y el indicador es_vigente, lo que permite que los hechos históricos sigan apuntando al estado del exportador vigente al momento del despacho.'
      ),
      body(
        'Las demás dimensiones usan SCD Tipo 1 (sobrescribir) dado que sus atributos no requieren historial: los nombres de países no cambian, los códigos NCM son estables y los atributos de tiempo son inmutables.'
      ),
      gap(80),
      heading2('1.5 Diccionario de datos — tabla de hechos'),
      twoColTable([
        ['Columna', 'Descripción', true],
        ['id_despacho',     'Clave primaria surrogate — identificador único del despacho'],
        ['id_tiempo',       'FK → dim_tiempo — fecha del despacho'],
        ['id_producto',     'FK → dim_producto — producto exportado (código NCM)'],
        ['id_destino',      'FK → dim_destino — país de destino'],
        ['id_exportador',   'FK → dim_exportador — empresa exportadora (SCD Tipo 2)'],
        ['fob_usd',         'Valor FOB del despacho en dólares estadounidenses (USD)'],
        ['peso_kg',         'Peso neto de la mercadería en kilogramos'],
        ['cantidad_bultos', 'Número de bultos o unidades embarcadas'],
      ]),

      // ── SECCIÓN 2 ──────────────────────────────────────────
      heading1('2. Fuentes de Datos y Staging Area'),
      heading2('2.1 Fuentes utilizadas'),
      body('El proyecto integra tres fuentes heterogéneas de datos:'),
      bullet('F1 — Despachos de exportación (CSV sintético): 5.000 registros generados con Python/Faker, estructurados sobre la nomenclatura real de la Aduana Nacional de Paraguay. Período 2023–2025.'),
      bullet('F2 — Catálogo de productos NCM (Excel .xlsx): 20 productos basados en la nomenclatura MERCOSUR real, con precios de referencia en USD/tonelada. Generado sintéticamente.'),
      bullet('F3 — Anuario Estadístico INE 2021 (5 CSV reales): Datos reales descargados del portal datos.gov.py. Incluye exportaciones por producto, por país de destino, precios internacionales y comercio exterior por capítulo NCM para los años 2020 y 2021.'),
      gap(80),
      body(
        'La incorporación de F3 fue sugerida por el docente como observación al H1 y se justifica porque enriquece el modelo con datos históricos reales que permiten contextualizar y validar los datos sintéticos generados para el período 2023–2025.'
      ),
      gap(80),
      heading2('2.2 Tablas cargadas en staging'),
      stagingTable(stagingTabs),
      gap(100),
      body(
        'La carga al staging se realizó sin transformaciones: los datos entran tal cual están en los archivos fuente. Esto sigue el principio de staging area como zona de aterrizaje puro, donde se preserva la fuente original antes de aplicar cualquier limpieza o transformación.'
      ),
      gap(80),
      heading2('2.3 Motor y archivo de base de datos'),
      twoColTable([
        ['Concepto', 'Detalle', true],
        ['Motor', 'DuckDB 1.5 (archivo único, motor columnar embebido)'],
        ['Archivo staging', 'data/staging/staging.duckdb'],
        ['Archivo DW', 'data/dw/agroexport.duckdb'],
        ['Cliente SQL', 'DBeaver Community 24.x'],
        ['ETL', 'Python 3.12 + pandas 2.2 + duckdb 1.5'],
      ]),

      // ── SECCIÓN 3 ──────────────────────────────────────────
      heading1('3. Proceso ETL — Estado Actual'),
      heading2('3.1 Descripción del pipeline'),
      body('El proceso ETL se implementó en cuatro scripts Python versionados en Git:'),
      bullet('gen_f1.py — Genera los 5.000 registros sintéticos de despachos (F1) y los guarda en data/raw/sintetico/f1_despachos.csv.'),
      bullet('gen_f2.py — Genera el catálogo de 20 productos (F2) y lo guarda en data/raw/sintetico/f2_productos.xlsx.'),
      bullet('staging_load.py — Carga F1, F2 y los 5 archivos de F3 al staging DuckDB sin transformaciones.'),
      bullet('etl_dw.py — Transforma y carga desde staging al modelo dimensional: construye las cuatro dimensiones y la tabla de hechos con resolución de claves sustitutas (surrogate keys).'),
      gap(80),
      heading2('3.2 Control de calidad — hallazgos'),
      body(
        'Durante la carga a la tabla de hechos se ejecutó una verificación de integridad referencial sobre las claves foráneas. El resultado fue el siguiente:'
      ),
      twoColTable([
        ['Concepto', 'Resultado', true],
        ['Registros fuente (F1)',         '5.000 despachos'],
        ['Registros cargados en fact',    '4.503 despachos (90,1 %)'],
        ['Registros descartados',         '497 (9,9 %)'],
        ['Motivo del descarte',           'Códigos NCM de F1 sin correspondencia en el catálogo F2 (id_producto nulo tras el join)'],
        ['id_destino nulos',              '0 — todos los países resolvieron correctamente'],
        ['id_exportador nulos',           '0 — todos los exportadores resolvieron correctamente'],
        ['Acción tomada',                 'Registros descartados (cuarentena); no se cargaron a fact_despacho'],
      ]),
      gap(80),
      body(
        'Este hallazgo demuestra que el proceso ETL detecta y filtra registros con integridad referencial rota, cumpliendo con el requisito de control de calidad del enunciado. Los 497 registros descartados representan la diferencia entre los 10 códigos NCM generados en F1 y el subconjunto de esos códigos presente en el catálogo F2. En la entrega final (H3) se corregirá este desajuste para lograr una carga del 100 %.'
      ),
      gap(80),
      heading2('3.3 Estado del repositorio Git'),
      body('El repositorio contiene los siguientes commits hasta este avance:'),
      bullet('feat: agrego DDL del esquema dimensional (star schema)'),
      bullet('feat: agrego scripts generadores de datos sintéticos F1 y F2'),
      bullet('feat: staging area cargado en DuckDB (F1, F2, F3)'),
      bullet('feat: ETL cargado al modelo dimensional — 4.503 hechos, 4 dimensiones'),
      bullet('feat: operaciones OLAP implementadas (roll-up, drill-down, slice, dice, pivot)'),

      // ── PIE ────────────────────────────────────────────────
      hrParagraph(),
      new Paragraph({
        children: [new TextRun({
          text: 'Universidad del Norte — Paraguay  |  Datawarehouse 22891  |  H2 — Avance Intermedio  |  2.º Semestre 2026',
          size: 16, color: '666666', font: 'Calibri',
        })],
        alignment: AlignmentType.CENTER,
        spacing: { before: 80, after: 0 },
      }),
    ],
  }],
});

Packer.toBuffer(doc).then((buffer) => {
  fs.writeFileSync('docs/H2_Avance_Intermedio.docx', buffer);
  console.log('Documento generado: docs/H2_Avance_Intermedio.docx');
});