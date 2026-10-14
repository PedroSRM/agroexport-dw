-- ============================================================
-- DW Exportaciones Paraguay - Schema Dimensional (Star Schema)
-- Motor: DuckDB 1.5
-- Curso: 22891 - Data Warehouse - Universidad del Norte
-- ============================================================

-- ------------------------------------------------------------
-- DIMENSIÓN TIEMPO
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS dim_tiempo (
    id_tiempo   INTEGER PRIMARY KEY,
    fecha       DATE        NOT NULL,
    anio        INTEGER     NOT NULL,
    mes         INTEGER     NOT NULL,   -- 1..12
    nombre_mes  VARCHAR(20) NOT NULL,
    trimestre   INTEGER     NOT NULL,   -- 1..4
    semestre    INTEGER     NOT NULL    -- 1..2
);

-- ------------------------------------------------------------
-- DIMENSIÓN PRODUCTO
-- Fuente: F2 (Excel sintético) + F3 INE 8.2.1, 8.2.3, 8.2.8, 8.2.9
-- SCD Tipo 1 (sobrescribir)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS dim_producto (
    id_producto       INTEGER PRIMARY KEY,
    codigo_ncm        VARCHAR(10)    NOT NULL,
    capitulo_ncm      INTEGER        NOT NULL,   -- primeros 2 dígitos del NCM
    descripcion_ncm   VARCHAR(255)   NOT NULL,
    categoria         VARCHAR(100),              -- ej: Oleaginosas, Cereales, Carnes
    unidad_medida     VARCHAR(20),               -- ej: TON, KG, L
    precio_ref_usd_ton DECIMAL(12,2)             -- precio de referencia USD/tonelada
);

-- ------------------------------------------------------------
-- DIMENSIÓN DESTINO
-- Fuente: F1 (CSV sintético) + F3 INE 8.2.2
-- SCD Tipo 1 (sobrescribir)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS dim_destino (
    id_destino       INTEGER PRIMARY KEY,
    codigo_pais      CHAR(3)       NOT NULL,   -- ISO 3166-1 alpha-3
    nombre_pais      VARCHAR(100)  NOT NULL,
    region           VARCHAR(100),             -- ej: América del Sur, Europa
    bloque_comercial VARCHAR(50)               -- ej: MERCOSUR, UE, ASEAN
);

-- ------------------------------------------------------------
-- DIMENSIÓN EXPORTADOR
-- Fuente: F1 (CSV sintético)
-- SCD Tipo 2 (historial de cambios)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS dim_exportador (
    id_exportador   INTEGER PRIMARY KEY,   -- surrogate key
    ruc             VARCHAR(20)   NOT NULL,
    razon_social    VARCHAR(255)  NOT NULL,
    departamento    VARCHAR(100),
    tipo_empresa    VARCHAR(50),           -- ej: SA, SRL, Unipersonal
    -- Columnas SCD Tipo 2
    fecha_inicio    DATE          NOT NULL,
    fecha_fin       DATE,                  -- NULL = registro vigente
    es_vigente      BOOLEAN       NOT NULL DEFAULT TRUE
);

-- ------------------------------------------------------------
-- TABLA DE HECHOS: DESPACHO DE EXPORTACIÓN
-- Grano: un registro = un despacho individual de exportación
-- Fuente principal: F1 (CSV sintético)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS fact_despacho (
    id_despacho     BIGINT PRIMARY KEY,
    id_tiempo       INTEGER NOT NULL REFERENCES dim_tiempo(id_tiempo),
    id_producto     INTEGER NOT NULL REFERENCES dim_producto(id_producto),
    id_destino      INTEGER NOT NULL REFERENCES dim_destino(id_destino),
    id_exportador   INTEGER NOT NULL REFERENCES dim_exportador(id_exportador),
    -- Métricas
    fob_usd         DECIMAL(15,2)  NOT NULL,   -- valor FOB en dólares
    peso_kg         DECIMAL(15,3)  NOT NULL,   -- peso en kilogramos
    cantidad_bultos INTEGER                     -- unidades embarcadas
);
