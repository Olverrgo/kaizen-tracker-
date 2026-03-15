-- ============================================
-- KAIZEN TRACKER - Schema Fase 1: Recetas/BOM
-- ============================================

-- Artículos (productos que fabricamos)
CREATE TABLE articulos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sku TEXT UNIQUE NOT NULL,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  unidad TEXT DEFAULT 'pieza', -- pieza, par, juego, metro
  precio_venta NUMERIC(10,2) DEFAULT 0,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Materiales / Insumos (tela, hilo, empaque, etc.)
CREATE TABLE materiales (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  unidad TEXT NOT NULL, -- metro, pieza, rollo, kg, cono
  costo_unitario NUMERIC(10,2) NOT NULL DEFAULT 0,
  stock_actual NUMERIC(10,2) DEFAULT 0,
  stock_minimo NUMERIC(10,2) DEFAULT 0,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Recetas de Producción (BOM - Bill of Materials)
CREATE TABLE recetas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  articulo_id UUID NOT NULL REFERENCES articulos(id) ON DELETE CASCADE,
  nombre TEXT, -- nombre opcional de la receta (ej: "Receta estándar")
  tiempo_estandar_min NUMERIC(8,2) NOT NULL DEFAULT 0, -- SAM en minutos
  costo_minuto_taller NUMERIC(8,4) NOT NULL DEFAULT 2.00, -- $/min operativo
  notas TEXT,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(articulo_id) -- una receta por artículo (por ahora)
);

-- Líneas de Receta (materiales que componen el artículo)
CREATE TABLE receta_lineas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  receta_id UUID NOT NULL REFERENCES recetas(id) ON DELETE CASCADE,
  material_id UUID NOT NULL REFERENCES materiales(id) ON DELETE RESTRICT,
  cantidad NUMERIC(10,4) NOT NULL, -- ej: 3.3 metros de tela
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Vista: Costo total por receta (materiales + mano de obra)
CREATE OR REPLACE VIEW v_costo_receta AS
SELECT
  r.id AS receta_id,
  r.articulo_id,
  a.sku,
  a.nombre AS articulo_nombre,
  r.tiempo_estandar_min,
  r.costo_minuto_taller,
  -- Costo de mano de obra
  (r.tiempo_estandar_min * r.costo_minuto_taller) AS costo_mano_obra,
  -- Costo de materiales
  COALESCE(SUM(rl.cantidad * m.costo_unitario), 0) AS costo_materiales,
  -- Costo total unitario
  (r.tiempo_estandar_min * r.costo_minuto_taller) + COALESCE(SUM(rl.cantidad * m.costo_unitario), 0) AS costo_total,
  -- Precio de venta y margen
  a.precio_venta,
  a.precio_venta - ((r.tiempo_estandar_min * r.costo_minuto_taller) + COALESCE(SUM(rl.cantidad * m.costo_unitario), 0)) AS margen,
  CASE
    WHEN a.precio_venta > 0 THEN
      ROUND(((a.precio_venta - ((r.tiempo_estandar_min * r.costo_minuto_taller) + COALESCE(SUM(rl.cantidad * m.costo_unitario), 0))) / a.precio_venta) * 100, 1)
    ELSE 0
  END AS margen_porcentaje
FROM recetas r
JOIN articulos a ON a.id = r.articulo_id
LEFT JOIN receta_lineas rl ON rl.receta_id = r.id
LEFT JOIN materiales m ON m.id = rl.material_id
WHERE r.activo = true
GROUP BY r.id, r.articulo_id, a.sku, a.nombre, r.tiempo_estandar_min, r.costo_minuto_taller, a.precio_venta;

-- Configuración del taller
CREATE TABLE config_taller (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  costo_hora_operativo NUMERIC(10,2) DEFAULT 120, -- $/hora
  costo_minuto NUMERIC(10,4) GENERATED ALWAYS AS (costo_hora_operativo / 60) STORED,
  horas_trabajo_dia NUMERIC(4,1) DEFAULT 8,
  meta_diaria NUMERIC(10,2) DEFAULT 500,
  moneda TEXT DEFAULT 'MXN',
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Insertar configuración inicial
INSERT INTO config_taller (costo_hora_operativo, horas_trabajo_dia, meta_diaria)
VALUES (120, 8, 500);

-- RLS (Row Level Security) - deshabilitado por ahora para desarrollo
ALTER TABLE articulos ENABLE ROW LEVEL SECURITY;
ALTER TABLE materiales ENABLE ROW LEVEL SECURITY;
ALTER TABLE recetas ENABLE ROW LEVEL SECURITY;
ALTER TABLE receta_lineas ENABLE ROW LEVEL SECURITY;
ALTER TABLE config_taller ENABLE ROW LEVEL SECURITY;

-- Políticas permisivas para desarrollo (ajustar en producción)
CREATE POLICY "allow_all" ON articulos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON materiales FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON recetas FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON receta_lineas FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON config_taller FOR ALL USING (true) WITH CHECK (true);

-- Trigger para updated_at automático
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_articulos_updated BEFORE UPDATE ON articulos FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_materiales_updated BEFORE UPDATE ON materiales FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_recetas_updated BEFORE UPDATE ON recetas FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_config_updated BEFORE UPDATE ON config_taller FOR EACH ROW EXECUTE FUNCTION update_updated_at();
