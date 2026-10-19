const {
  Document, Packer, Paragraph, TextRun, HeadingLevel,
  AlignmentType, Table, TableRow, TableCell, WidthType,
  BorderStyle, ShadingType, NumberFormat, convertInchesToTwip,
  PageOrientation, Header, Footer, PageNumber, Tab,
  UnderlineType, LevelFormat
} = require('docx');
const fs = require('fs');

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
function body(text, opts = {}) {
  return new Paragraph({
    children: [new TextRun({ text, size: 22, font: 'Calibri', ...opts })],
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
function bullet(text, level = 0) {
  return new Paragraph({
    children: [new TextRun({ text, size: 22, font: 'Calibri' })],
    bullet: { level },
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
function preguntasTable(preguntas) {
  const headerRow = new TableRow({
    children: [
      new TableCell({
        width: { size: 600, type: WidthType.DXA },
        shading: { type: ShadingType.CLEAR, color: '404040', fill: '404040' },
        children: [new Paragraph({ children: [new TextRun({ text: '#', bold: true, size: 20, color: 'FFFFFF', font: 'Calibri' })] })],
      }),
      new TableCell({
        width: { size: 5400, type: WidthType.DXA },
        shading: { type: ShadingType.CLEAR, color: '404040', fill: '404040' },
        children: [new Paragraph({ children: [new TextRun({ text: 'Pregunta de negocio', bold: true, size: 20, color: 'FFFFFF', font: 'Calibri' })] })],
      }),
      new TableCell({
        width: { size: 3000, type: WidthType.DXA },
        shading: { type: ShadingType.CLEAR, color: '404040', fill: '404040' },
        children: [new Paragraph({ children: [new TextRun({ text: 'Indicador medible', bold: true, size: 20, color: 'FFFFFF', font: 'Calibri' })] })],
      }),
    ],
  });
  const dataRows = preguntas.map((p, i) =>
    new TableRow({
      children: [
        new TableCell({
          width: { size: 600, type: WidthType.DXA },
          shading: { type: ShadingType.CLEAR, color: i % 2 === 0 ? 'F5F5F5' : 'FFFFFF', fill: i % 2 === 0 ? 'F5F5F5' : 'FFFFFF' },
          children: [new Paragraph({ children: [new TextRun({ text: `P${i + 1}`, bold: true, size: 20, color: '2F5496', font: 'Calibri' })], alignment: AlignmentType.CENTER })],
        }),
        new TableCell({
          width: { size: 5400, type: WidthType.DXA },
          shading: { type: ShadingType.CLEAR, color: i % 2 === 0 ? 'F5F5F5' : 'FFFFFF', fill: i % 2 === 0 ? 'F5F5F5' : 'FFFFFF' },
          children: [new Paragraph({ children: [new TextRun({ text: p.pregunta, size: 20, font: 'Calibri' })], spacing: { before: 40, after: 40 } })],
        }),
        new TableCell({
          width: { size: 3000, type: WidthType.DXA },
          shading: { type: ShadingType.CLEAR, color: i % 2 === 0 ? 'F5F5F5' : 'FFFFFF', fill: i % 2 === 0 ? 'F5F5F5' : 'FFFFFF' },
          children: [new Paragraph({ children: [new TextRun({ text: p.indicador, size: 20, font: 'Calibri', italics: true })], spacing: { before: 40, after: 40 } })],
        }),
      ],
    })
  );
  return new Table({
    columnWidths: [600, 5400, 3000],
    width: { size: 9000, type: WidthType.DXA },
    rows: [headerRow, ...dataRows],
  });
}
function fuentesTable(fuentes) {
  const cols = [400, 2200, 1600, 1400, 1800, 1600];
  const headers = ['#', 'Nombre / Descripción', 'Formato', 'Origen', 'Volumen estimado', 'Uso en el DW'];
  const headerRow = new TableRow({
    children: headers.map((h, i) =>
      new TableCell({
        width: { size: cols[i], type: WidthType.DXA },
        shading: { type: ShadingType.CLEAR, color: '404040', fill: '404040' },
        children: [new Paragraph({ children: [new TextRun({ text: h, bold: true, size: 18, color: 'FFFFFF', font: 'Calibri' })] })],
      })
    ),
  });
  const dataRows = fuentes.map((f, i) =>
    new TableRow({
      children: [f.num, f.nombre, f.formato, f.origen, f.volumen, f.uso].map((val, ci) =>
        new TableCell({
          width: { size: cols[ci], type: WidthType.DXA },
          shading: { type: ShadingType.CLEAR, color: i % 2 === 0 ? 'F5F5F5' : 'FFFFFF', fill: i % 2 === 0 ? 'F5F5F5' : 'FFFFFF' },
          children: [new Paragraph({ children: [new TextRun({ text: val, size: 18, font: 'Calibri' })], spacing: { before: 40, after: 40 } })],
        })
      ),
    })
  );
  return new Table({
    columnWidths: cols,
    width: { size: 9000, type: WidthType.DXA },
    rows: [headerRow, ...dataRows],
  });
}

const preguntas = [
  { pregunta: '¿Cuál es el valor FOB total exportado por producto y mes durante el período analizado?', indicador: 'Valor FOB total (USD) por producto y mes' },
  { pregunta: '¿Qué países de destino concentran el mayor volumen exportado por categoría de producto?', indicador: 'Peso neto (toneladas) y valor FOB por país destino y categoría' },
  { pregunta: '¿Cuál es la evolución trimestral del peso neto exportado según el puerto de salida?', indicador: 'Toneladas exportadas por trimestre y puerto' },
  { pregunta: '¿Qué exportadores registran el mayor valor promedio por despacho y en qué rubro operan?', indicador: 'Valor FOB promedio por despacho, agrupado por exportador y rubro' },
  { pregunta: '¿Cómo varía la participación porcentual de cada producto en el total exportado a lo largo del año?', indicador: '% de participación por producto sobre el total FOB anual' },
  { pregunta: '¿En qué meses se concentran los picos de exportación y qué productos los explican?', indicador: 'Cantidad de despachos y valor FOB por mes; identificación del producto dominante' },
  { pregunta: '¿Cómo se compara el valor exportado por país de destino entre el año actual y el año anterior?', indicador: 'Variación interanual del valor FOB por país destino (absoluta y porcentual)' },
];

const fuentes = [
  { num: 'F1', nombre: 'Registros de despachos de exportación — Aduana Nacional / datos.gov.py', formato: 'CSV', origen: 'Real (fuente pública oficial)', volumen: '~3.000 a 4.000 registros reales; completado con datos sintéticos hasta ≥ 5.000', uso: 'Tabla de hechos principal (fact_despacho)' },
  { num: 'F2', nombre: 'Catálogo de productos y precios de referencia internacional', formato: 'Excel (.xlsx)', origen: 'Sintético (basado en nomenclatura MERCOSUR y cotizaciones del mercado)', volumen: '~200 productos con atributos y precios de referencia', uso: 'Dimensión producto (dim_producto)' },
  { num: 'F3', nombre: 'Anuario Estadístico INE 2021 — Comercio exterior', formato: 'CSV (5 archivos)', origen: 'Real — datos.gov.py (Instituto Nacional de Estadística)', volumen: '5 tablas de estadísticas anuales y mensuales 2020–2021', uso: 'Enriquecimiento dim_producto y dim_destino' },
];

const doc = new Document({
  styles: { default: { document: { run: { font: 'Calibri', size: 22 } } } },
  sections: [{
    properties: {
      page: {
        size: { width: 12240, height: 15840 },
        margin: { top: convertInchesToTwip(1), bottom: convertInchesToTwip(1), left: convertInchesToTwip(1.18), right: convertInchesToTwip(1.18) },
      },
    },
    children: [
      gap(400),
      new Paragraph({ children: [new TextRun({ text: 'UNIVERSIDAD DEL NORTE — PARAGUAY', bold: true, size: 22, color: '1F1F1F', font: 'Calibri' })], alignment: AlignmentType.CENTER, spacing: { before: 0, after: 60 } }),
      new Paragraph({ children: [new TextRun({ text: 'Ingeniería Informática — Octavo Semestre', size: 20, color: '333333', font: 'Calibri' })], alignment: AlignmentType.CENTER, spacing: { before: 0, after: 60 } }),
      new Paragraph({ children: [new TextRun({ text: 'Datawarehouse (22891)', size: 20, color: '333333', font: 'Calibri' })], alignment: AlignmentType.CENTER, spacing: { before: 0, after: 60 } }),
      gap(160),
      new Paragraph({ children: [new TextRun({ text: 'TRABAJO PRÁCTICO — 2.º SEMESTRE 2026', bold: true, size: 36, color: '1F1F1F', font: 'Calibri' })], alignment: AlignmentType.CENTER, spacing: { before: 0, after: 100 } }),
      new Paragraph({ children: [new TextRun({ text: 'H1 — Acta de Definición de Alcance', italics: true, size: 26, color: '1F1F1F', font: 'Calibri' })], alignment: AlignmentType.CENTER, spacing: { before: 0, after: 80 } }),
      gap(300),
      twoColTable([
        ['Campo', 'Detalle', true],
        ['Organización elegida', 'AgroExport Paraguay S.A. (empresa ficticia)'],
        ['Docente', 'Lic. Walter Romero'],
        ['Materia', 'Datawarehouse — 22891 — 8.º Semestre'],
        ['Hito', 'H1 — Lanzamiento y Definición de Alcance'],
        ['Fecha de elaboración', 'Octubre 2026'],
        ['Modalidad', 'Individual'],
        ['Repositorio Git', 'https://github.com/PedroSRM/agroexport-dw'],
      ]),
      gap(600),

      heading1('1. Descripción de la organización'),
      body('AgroExport Paraguay S.A. es una empresa ficticia creada para este trabajo práctico, ambientada en el sector de exportación de commodities agrícolas de Paraguay. El rubro fue elegido porque genera de forma natural un alto volumen de transacciones (despachos de exportación) y una variedad amplia de dimensiones de análisis: productos, destinos, puertos, exportadores y períodos de tiempo.'),
      body('La empresa opera como intermediaria comercial y logística entre productores agrícolas del interior del país y compradores internacionales. Su actividad principal es gestionar y registrar los despachos de exportación de granos y oleaginosas.'),
      gap(80),
      heading2('Ficha de la organización'),
      twoColTable([
        ['Atributo', 'Descripción', true],
        ['Nombre', 'AgroExport Paraguay S.A.'],
        ['Tipo', 'Empresa ficticia'],
        ['Rubro', 'Exportación de commodities agrícolas (soja, maíz, trigo, girasol)'],
        ['Tamaño', 'Mediana empresa — aproximadamente 60 empleados entre las sedes'],
        ['Sede central', 'Asunción, Paraguay'],
        ['Unidades operativas', 'Puerto Villeta, Puerto Encarnación, Puerto Ciudad del Este'],
        ['Período de análisis', '2023 – 2025'],
      ]),
      gap(100),
      body('La elección de una empresa ficticia del sector agroexportador está justificada por tres razones: (1) el volumen de despachos de exportación en Paraguay es alto y públicamente documentado, lo que permite usar datos reales de la Aduana Nacional como base; (2) el modelo dimensional resultante es representativo del tipo de análisis que hacen las empresas del sector real; y (3) el caso no está entre los prohibidos por el enunciado del TP.'),

      heading1('2. Rol del alumno y sponsor del proyecto'),
      twoColTable([
        ['Concepto', 'Descripción', true],
        ['Rol del alumno', 'Analista de datos / consultor de Business Intelligence interno'],
        ['Responsabilidades', 'Relevamiento de necesidades, diseño del modelo dimensional, construcción del ETL, generación de consultas OLAP y elaboración del dashboard'],
        ['Sponsor del proyecto', 'Gerente Comercial de AgroExport Paraguay S.A.'],
        ['Razón del sponsor', 'Es quien toma decisiones sobre qué productos exportar, a qué mercados y en qué volúmenes. El DW le da visibilidad consolidada para mejorar esas decisiones'],
      ]),
      gap(100),
      body('El Gerente Comercial fue identificado como sponsor porque es el principal consumidor de la información que el Data Warehouse va a producir. Las preguntas de negocio de la sección 4 están alineadas directamente con las decisiones que esa posición toma en el día a día de la empresa.'),

      heading1('3. Problema o necesidad de negocio'),
      heading2('3.1 Situación actual (problema)'),
      body('AgroExport Paraguay S.A. no tiene una visión consolidada de sus exportaciones. Los registros de despachos están distribuidos en planillas Excel generadas por el área operativa, y los datos de productos y precios de referencia se manejan en un archivo separado sin relación formal con los registros de despachos. Esta dispersión genera tres problemas concretos:'),
      bullet('No es posible cruzar automáticamente los datos de despachos con los precios de referencia para calcular indicadores de valor por producto.'),
      bullet('Los reportes se arman manualmente cada vez que el Gerente Comercial los necesita, lo que demora el análisis y genera inconsistencias entre versiones.'),
      bullet('No existe historial consolidado que permita comparar el desempeño entre períodos o entre puertos de salida.'),
      gap(80),
      heading2('3.2 Solución propuesta (el Data Warehouse)'),
      body('El Data Warehouse de AgroExport Paraguay S.A. va a integrar las tres fuentes de datos (registros de despachos, catálogo de productos y estadísticas INE), limpiarlas mediante un proceso ETL documentado y cargarlas en un modelo dimensional optimizado para consultas analíticas.'),
      body('El resultado es un repositorio histórico, centralizado y confiable que permite responder preguntas de negocio complejas en segundos, sin depender de la construcción manual de reportes.'),

      heading1('4. Preguntas de negocio'),
      body('Las siguientes siete preguntas guían el diseño del modelo dimensional, las consultas OLAP y las visualizaciones del dashboard. Cada una está ligada a un indicador medible y concreto.'),
      gap(100),
      preguntasTable(preguntas),
      gap(100),
      body('Estas preguntas cubren de forma natural los operadores de refinamiento OLAP requeridos por el enunciado: roll-up (P3, P7), drill-down (P1, P4), slice (P2, P6), dice (P5) y pivot implícito en P5 y P7.'),

      heading1('5. Fuentes de datos previstas'),
      heading2('5.1 Resumen de fuentes'),
      fuentesTable(fuentes),
      gap(100),
      heading2('5.2 Descripción detallada'),
      bodyBold('Fuente F1 — Registros de despachos (CSV): ', ''),
      body('Los datos de exportaciones paraguayas están disponibles de forma pública a través del portal datos.gov.py y del sitio web de la Aduana Nacional de Paraguay. Estos registros contienen información de despachos como: fecha de despacho, producto (código MERCOSUR/NCM), peso neto, valor FOB en dólares, país de destino y nombre del exportador. Dado que los portales públicos no exponen registros individuales en formato descargable para el período 2023–2025, la fuente F1 se genera sintéticamente respetando la estructura y nomenclatura real de la Aduana Nacional.'),
      bodyBold('Fuente F2 — Catálogo de productos (Excel): ', ''),
      body('Este archivo contiene el catálogo de productos: código NCM, descripción, categoría, unidad de medida y precio de referencia internacional en USD/tonelada. Es completamente sintético pero basado en la nomenclatura real MERCOSUR. El formato Excel fue elegido intencionalmente para satisfacer el requisito de heterogeneidad de fuentes.'),
      bodyBold('Fuente F3 — Anuario Estadístico INE 2021 (CSV reales): ', ''),
      body('Cinco archivos CSV descargados del portal datos.gov.py del Instituto Nacional de Estadística de Paraguay. Contienen estadísticas reales de exportaciones por producto, por país de destino, precios internacionales de soja/algodón y comercio exterior por capítulo NCM para los años 2020 y 2021. Esta fuente fue incorporada a sugerencia del docente como observación al H1, y se usa para enriquecer las dimensiones dim_producto y dim_destino con contexto real.'),
      gap(80),
      heading2('5.3 Volumen esperado'),
      twoColTable([
        ['Concepto', 'Detalle', true],
        ['Tabla de hechos principal', 'fact_despacho — despachos de exportación'],
        ['Volumen mínimo requerido', '5.000 filas (según enunciado del TP)'],
        ['Volumen objetivo', 'Entre 5.000 y 8.000 filas para el período 2023–2025'],
        ['Fuente primaria', 'F1 — Sintético estructurado sobre nomenclatura Aduana Nacional'],
        ['Grano declarado', 'Un registro por despacho de exportación individual'],
      ]),
      gap(80),
      heading2('5.4 Defectos previstos en el dataset'),
      body('El enunciado exige que el dataset incluya imperfecciones deliberadas para dar sentido a la etapa de transformación del ETL. Los defectos que se van a inyectar son:'),
      bullet('Valores nulos en el campo país de destino (registros sin destino declarado).'),
      bullet('Fechas en formatos mixtos (dd/mm/yyyy y yyyy-mm-dd) dentro del mismo archivo CSV.'),
      bullet('Nombres de exportadores con variaciones de mayúsculas y espacios adicionales.'),
      bullet('Códigos de producto NCM huérfanos: presentes en F1 pero sin correspondencia en el catálogo F2.'),
      bullet('Registros duplicados por reimportación errónea de archivos fuente.'),
      body('Todos los defectos serán cuantificados y documentados en el Anexo de Defectos del informe final.'),

      hrParagraph(),
      new Paragraph({
        children: [new TextRun({ text: 'Universidad del Norte — Paraguay  |  Datawarehouse 22891  |  H1 — Acta de Definición de Alcance  |  2.º Semestre 2026', size: 16, color: '666666', font: 'Calibri' })],
        alignment: AlignmentType.CENTER,
        spacing: { before: 80, after: 0 },
      }),
    ],
  }],
});

Packer.toBuffer(doc).then((buffer) => {
  fs.writeFileSync('docs/H1_Acta_Definicion_Alcance.docx', buffer);
  console.log('Documento generado: docs/H1_Acta_Definicion_Alcance.docx');
});