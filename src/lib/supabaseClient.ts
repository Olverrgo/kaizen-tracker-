import { supabase } from './supabase'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface Articulo {
  id: string
  sku: string
  nombre: string
  descripcion: string | null
  unidad: string
  precio_venta: number | null
  activo: boolean
  created_at: string
  updated_at: string
}

export interface Material {
  id: string
  nombre: string
  unidad: string
  costo_unitario: number
  stock_actual: number
  stock_minimo: number
  activo: boolean
  created_at: string
  updated_at: string
}

export interface Receta {
  id: string
  articulo_id: string
  nombre: string
  tiempo_estandar_min: number
  costo_minuto_taller: number
  notas: string | null
  activo: boolean
  created_at: string
  updated_at: string
}

export interface RecetaLinea {
  id: string
  receta_id: string
  material_id: string
  cantidad: number
  notas: string | null
  created_at: string
}

export interface ConfigTaller {
  id: string
  costo_hora_operativo: number
  costo_minuto: number
  horas_trabajo_dia: number
  meta_diaria: number
  moneda: string
  updated_at: string
}

export interface CostoReceta {
  receta_id: string
  articulo_id: string
  sku: string
  articulo_nombre: string
  tiempo_estandar_min: number
  costo_minuto_taller: number
  costo_mano_obra: number
  costo_materiales: number
  costo_total: number
  precio_venta: number | null
  margen: number | null
  margen_porcentaje: number | null
}

// ─── Articulos ───────────────────────────────────────────────────────────────

export async function getArticulos() {
  return supabase
    .from('articulos')
    .select('*')
    .eq('activo', true)
    .order('nombre')
}

export async function getArticulo(id: string) {
  return supabase
    .from('articulos')
    .select('*')
    .eq('id', id)
    .single()
}

export async function createArticulo(
  data: Omit<Articulo, 'id' | 'created_at' | 'updated_at' | 'activo'>
) {
  return supabase
    .from('articulos')
    .insert({ ...data, activo: true })
    .select()
    .single()
}

export async function updateArticulo(id: string, data: Partial<Articulo>) {
  return supabase
    .from('articulos')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
}

export async function deleteArticulo(id: string) {
  return supabase
    .from('articulos')
    .update({ activo: false, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
}

// ─── Materiales ──────────────────────────────────────────────────────────────

export async function getMateriales() {
  return supabase
    .from('materiales')
    .select('*')
    .eq('activo', true)
    .order('nombre')
}

export async function getMaterial(id: string) {
  return supabase
    .from('materiales')
    .select('*')
    .eq('id', id)
    .single()
}

export async function createMaterial(
  data: Omit<Material, 'id' | 'created_at' | 'updated_at' | 'activo'>
) {
  return supabase
    .from('materiales')
    .insert({ ...data, activo: true })
    .select()
    .single()
}

export async function updateMaterial(id: string, data: Partial<Material>) {
  return supabase
    .from('materiales')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
}

export async function deleteMaterial(id: string) {
  return supabase
    .from('materiales')
    .update({ activo: false, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
}

// ─── Recetas ─────────────────────────────────────────────────────────────────

export async function getRecetas() {
  return supabase
    .from('recetas')
    .select('*, articulos(sku, nombre)')
    .eq('activo', true)
    .order('nombre')
}

export async function getReceta(id: string) {
  return supabase
    .from('recetas')
    .select('*, articulos(sku, nombre)')
    .eq('id', id)
    .single()
}

export async function getRecetaConLineas(articuloId: string) {
  return supabase
    .from('recetas')
    .select(`
      *,
      articulos(sku, nombre),
      receta_lineas(
        id,
        material_id,
        cantidad,
        notas,
        created_at,
        materiales(id, nombre, unidad, costo_unitario)
      )
    `)
    .eq('articulo_id', articuloId)
    .eq('activo', true)
    .single()
}

export async function createReceta(
  data: Omit<Receta, 'id' | 'created_at' | 'updated_at' | 'activo'>
) {
  return supabase
    .from('recetas')
    .insert({ ...data, activo: true })
    .select()
    .single()
}

export async function updateReceta(id: string, data: Partial<Receta>) {
  return supabase
    .from('recetas')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
}

export async function deleteReceta(id: string) {
  return supabase
    .from('recetas')
    .update({ activo: false, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
}

// ─── Receta Lineas ───────────────────────────────────────────────────────────

export async function getRecetaLineas(recetaId: string) {
  return supabase
    .from('receta_lineas')
    .select('*, materiales(id, nombre, unidad, costo_unitario)')
    .eq('receta_id', recetaId)
    .order('created_at')
}

export async function upsertRecetaLinea(
  data: Omit<RecetaLinea, 'id' | 'created_at'> & { id?: string }
) {
  return supabase
    .from('receta_lineas')
    .upsert(data, { onConflict: 'id' })
    .select('*, materiales(id, nombre, unidad, costo_unitario)')
    .single()
}

export async function deleteRecetaLinea(id: string) {
  return supabase
    .from('receta_lineas')
    .delete()
    .eq('id', id)
}

// ─── Config Taller ───────────────────────────────────────────────────────────

export async function getConfigTaller() {
  return supabase
    .from('config_taller')
    .select('*')
    .limit(1)
    .single()
}

export async function updateConfigTaller(id: string, data: Partial<ConfigTaller>) {
  return supabase
    .from('config_taller')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
}

// ─── Vista: Costos de Recetas ────────────────────────────────────────────────

export async function getCostosRecetas() {
  return supabase
    .from('v_costo_receta')
    .select('*')
    .order('articulo_nombre')
}

export async function getCostoReceta(recetaId: string) {
  return supabase
    .from('v_costo_receta')
    .select('*')
    .eq('receta_id', recetaId)
    .single()
}
