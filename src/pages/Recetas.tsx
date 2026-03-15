import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  BookOpen,
  Plus,
  Pencil,
  Trash2,
  X,
  Save,
  Clock,
  DollarSign,
  Package,
  Layers,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  getArticulos,
  getMateriales,
  getCostosRecetas,
  getRecetaConLineas,
  createReceta,
  updateReceta,
  deleteReceta,
  upsertRecetaLinea,
  deleteRecetaLinea,
  type Articulo,
  type Material,
  type CostoReceta,
} from '../lib/supabaseClient';

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatMoney(value: number | null | undefined): string {
  if (value == null) return '$0.00';
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
  }).format(value);
}

function marginBadge(pct: number | null | undefined) {
  if (pct == null)
    return (
      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
        Sin precio
      </span>
    );
  if (pct >= 30)
    return (
      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-700">
        {pct.toFixed(1)}%
      </span>
    );
  if (pct >= 15)
    return (
      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">
        {pct.toFixed(1)}%
      </span>
    );
  return (
    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-100 text-red-700">
      {pct.toFixed(1)}%
    </span>
  );
}

// ─── Types for internal state ───────────────────────────────────────────────

interface RecetaDetail {
  id: string;
  articulo_id: string;
  nombre: string;
  tiempo_estandar_min: number;
  costo_minuto_taller: number;
  notas: string | null;
  articulos: { sku: string; nombre: string } | null;
  receta_lineas: Array<{
    id: string;
    material_id: string;
    cantidad: number;
    notas: string | null;
    materiales: { id: string; nombre: string; unidad: string; costo_unitario: number } | null;
  }>;
}

interface NuevaRecetaForm {
  articulo_id: string;
  tiempo_estandar_min: number;
  costo_minuto_taller: number;
  notas: string;
}

// ─── Component ──────────────────────────────────────────────────────────────

export function Recetas() {
  // Data state
  const [costos, setCostos] = useState<CostoReceta[]>([]);
  const [articulos, setArticulos] = useState<Articulo[]>([]);
  const [materiales, setMateriales] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);

  // UI state
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<RecetaDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [showNewForm, setShowNewForm] = useState(false);
  const [editingReceta, setEditingReceta] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ tiempo_estandar_min: 0, costo_minuto_taller: 0, notas: '' });

  // New material line state
  const [newLineMaterialId, setNewLineMaterialId] = useState('');
  const [newLineCantidad, setNewLineCantidad] = useState('');
  const [addingLine, setAddingLine] = useState(false);

  // New recipe form
  const [nuevaReceta, setNuevaReceta] = useState<NuevaRecetaForm>({
    articulo_id: '',
    tiempo_estandar_min: 0,
    costo_minuto_taller: 0,
    notas: '',
  });
  const [creatingReceta, setCreatingReceta] = useState(false);

  // ─── Data fetching ──────────────────────────────────────────────────────

  const loadData = useCallback(async () => {
    setLoading(true);
    const [costosRes, articulosRes, materialesRes] = await Promise.all([
      getCostosRecetas(),
      getArticulos(),
      getMateriales(),
    ]);
    if (costosRes.data) setCostos(costosRes.data);
    if (articulosRes.data) setArticulos(articulosRes.data);
    if (materialesRes.data) setMateriales(materialesRes.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Articulos without a recipe (for "Nueva Receta")
  const articulosSinReceta = useMemo(() => {
    const idsConReceta = new Set(costos.map((c) => c.articulo_id));
    return articulos.filter((a) => !idsConReceta.has(a.id));
  }, [articulos, costos]);

  // Summary stats
  const stats = useMemo(() => {
    const total = costos.length;
    const costoPromedio =
      total > 0 ? costos.reduce((s, c) => s + c.costo_total, 0) / total : 0;
    const margenPromedio =
      total > 0
        ? costos.filter((c) => c.margen_porcentaje != null).reduce((s, c) => s + (c.margen_porcentaje ?? 0), 0) /
          (costos.filter((c) => c.margen_porcentaje != null).length || 1)
        : 0;
    return { total, costoPromedio, margenPromedio };
  }, [costos]);

  // ─── Expand / load detail ───────────────────────────────────────────────

  const toggleExpand = async (costo: CostoReceta) => {
    if (expandedId === costo.receta_id) {
      setExpandedId(null);
      setDetail(null);
      setEditingReceta(null);
      return;
    }
    setExpandedId(costo.receta_id);
    setDetailLoading(true);
    setEditingReceta(null);
    const res = await getRecetaConLineas(costo.articulo_id);
    if (res.data) {
      setDetail(res.data as unknown as RecetaDetail);
    }
    setDetailLoading(false);
  };

  // ─── CRUD: Recipe ──────────────────────────────────────────────────────

  const handleCreateReceta = async () => {
    if (!nuevaReceta.articulo_id || nuevaReceta.tiempo_estandar_min <= 0) return;
    setCreatingReceta(true);
    const art = articulos.find((a) => a.id === nuevaReceta.articulo_id);
    await createReceta({
      articulo_id: nuevaReceta.articulo_id,
      nombre: art ? `Receta - ${art.nombre}` : 'Nueva receta',
      tiempo_estandar_min: nuevaReceta.tiempo_estandar_min,
      costo_minuto_taller: nuevaReceta.costo_minuto_taller,
      notas: nuevaReceta.notas || null,
    });
    setShowNewForm(false);
    setNuevaReceta({ articulo_id: '', tiempo_estandar_min: 0, costo_minuto_taller: 0, notas: '' });
    setCreatingReceta(false);
    await loadData();
  };

  const handleUpdateReceta = async (recetaId: string) => {
    await updateReceta(recetaId, {
      tiempo_estandar_min: editForm.tiempo_estandar_min,
      costo_minuto_taller: editForm.costo_minuto_taller,
      notas: editForm.notas || null,
    });
    setEditingReceta(null);
    await loadData();
    // Reload detail
    if (detail) {
      const res = await getRecetaConLineas(detail.articulo_id);
      if (res.data) setDetail(res.data as unknown as RecetaDetail);
    }
  };

  const handleDeleteReceta = async (recetaId: string) => {
    if (!confirm('Eliminar esta receta? Esta accion no se puede deshacer.')) return;
    await deleteReceta(recetaId);
    setExpandedId(null);
    setDetail(null);
    await loadData();
  };

  // ─── CRUD: Material lines ─────────────────────────────────────────────

  const handleAddLine = async () => {
    if (!detail || !newLineMaterialId || !newLineCantidad) return;
    setAddingLine(true);
    await upsertRecetaLinea({
      receta_id: detail.id,
      material_id: newLineMaterialId,
      cantidad: parseFloat(newLineCantidad),
      notas: null,
    });
    setNewLineMaterialId('');
    setNewLineCantidad('');
    setAddingLine(false);
    // Reload detail & costs
    const [detailRes] = await Promise.all([getRecetaConLineas(detail.articulo_id), loadData()]);
    if (detailRes.data) setDetail(detailRes.data as unknown as RecetaDetail);
  };

  const handleDeleteLine = async (lineaId: string) => {
    if (!detail) return;
    await deleteRecetaLinea(lineaId);
    const [detailRes] = await Promise.all([getRecetaConLineas(detail.articulo_id), loadData()]);
    if (detailRes.data) setDetail(detailRes.data as unknown as RecetaDetail);
  };

  // ─── Computed detail values ───────────────────────────────────────────

  const detailTotals = useMemo(() => {
    if (!detail) return { materiales: 0, manoObra: 0, total: 0 };
    const mat = detail.receta_lineas.reduce(
      (s, l) => s + l.cantidad * (l.materiales?.costo_unitario ?? 0),
      0
    );
    const mo = detail.tiempo_estandar_min * detail.costo_minuto_taller;
    return { materiales: mat, manoObra: mo, total: mat + mo };
  }, [detail]);

  // ─── Render ───────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BookOpen className="h-7 w-7 text-primary-600" />
            Recetas de Produccion (BOM)
          </h1>
          <p className="text-gray-500 mt-1">
            Lista de materiales y costos por articulo
          </p>
        </div>
        <button
          className="btn-primary flex items-center gap-2"
          onClick={() => setShowNewForm(true)}
        >
          <Plus className="h-4 w-4" />
          Nueva Receta
        </button>
      </div>

      {/* ── Summary Stats ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card flex items-center gap-4">
          <div className="p-3 bg-primary-100 rounded-xl">
            <Layers className="h-6 w-6 text-primary-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Total recetas</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="p-3 bg-blue-100 rounded-xl">
            <DollarSign className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Costo promedio</p>
            <p className="text-2xl font-bold text-gray-900">
              {formatMoney(stats.costoPromedio)}
            </p>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="p-3 bg-green-100 rounded-xl">
            <Package className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Margen promedio</p>
            <p className="text-2xl font-bold text-gray-900">
              {stats.margenPromedio.toFixed(1)}%
            </p>
          </div>
        </div>
      </div>

      {/* ── Efficiency tooltip / info ──────────────────────────────────── */}
      <div className="card bg-gradient-to-r from-primary-50 to-green-50 border-primary-100">
        <div className="flex items-start gap-3">
          <Clock className="h-5 w-5 text-primary-600 mt-0.5 shrink-0" />
          <div className="text-sm text-primary-800">
            <span className="font-semibold">Formula de Eficiencia:</span>{' '}
            Eficiencia % = (Piezas x SAM) / Tiempo Real x 100. El SAM
            (Standard Allowed Minutes) de cada receta define el tiempo
            estandar por pieza.
          </div>
        </div>
      </div>

      {/* ── Nueva Receta Form (modal-like) ─────────────────────────────── */}
      {showNewForm && (
        <div className="card border-2 border-primary-200 bg-primary-50/30">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Nueva Receta
            </h2>
            <button
              className="p-1 hover:bg-gray-200 rounded-lg transition-colors"
              onClick={() => setShowNewForm(false)}
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Articulo
              </label>
              <select
                className="input"
                value={nuevaReceta.articulo_id}
                onChange={(e) =>
                  setNuevaReceta((p) => ({ ...p, articulo_id: e.target.value }))
                }
              >
                <option value="">Seleccionar articulo...</option>
                {articulosSinReceta.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.sku} - {a.nombre}
                  </option>
                ))}
              </select>
              {articulosSinReceta.length === 0 && (
                <p className="text-xs text-gray-400 mt-1">
                  Todos los articulos ya tienen receta
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                SAM (min)
              </label>
              <input
                type="number"
                className="input"
                min={0}
                step={0.1}
                placeholder="Tiempo estandar en minutos"
                value={nuevaReceta.tiempo_estandar_min || ''}
                onChange={(e) =>
                  setNuevaReceta((p) => ({
                    ...p,
                    tiempo_estandar_min: parseFloat(e.target.value) || 0,
                  }))
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Costo por minuto ($/min)
              </label>
              <input
                type="number"
                className="input"
                min={0}
                step={0.01}
                placeholder="Costo minuto taller"
                value={nuevaReceta.costo_minuto_taller || ''}
                onChange={(e) =>
                  setNuevaReceta((p) => ({
                    ...p,
                    costo_minuto_taller: parseFloat(e.target.value) || 0,
                  }))
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notas
              </label>
              <input
                type="text"
                className="input"
                placeholder="Notas opcionales"
                value={nuevaReceta.notas}
                onChange={(e) =>
                  setNuevaReceta((p) => ({ ...p, notas: e.target.value }))
                }
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <button
              className="btn-secondary"
              onClick={() => setShowNewForm(false)}
            >
              Cancelar
            </button>
            <button
              className="btn-primary flex items-center gap-2"
              disabled={
                creatingReceta ||
                !nuevaReceta.articulo_id ||
                nuevaReceta.tiempo_estandar_min <= 0
              }
              onClick={handleCreateReceta}
            >
              <Save className="h-4 w-4" />
              {creatingReceta ? 'Guardando...' : 'Crear Receta'}
            </button>
          </div>
        </div>
      )}

      {/* ── Recipe Cards ───────────────────────────────────────────────── */}
      {costos.length === 0 ? (
        <div className="card text-center py-12">
          <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-lg">No hay recetas registradas</p>
          <p className="text-gray-400 text-sm mt-1">
            Crea una nueva receta para comenzar
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {costos.map((costo) => {
            const isExpanded = expandedId === costo.receta_id;

            return (
              <div key={costo.receta_id} className="card p-0 overflow-hidden">
                {/* ── Card header (clickable) ──────────────────────────── */}
                <button
                  className="w-full text-left p-5 hover:bg-gray-50 transition-colors"
                  onClick={() => toggleExpand(costo)}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2 bg-primary-100 rounded-lg shrink-0">
                        <BookOpen className="h-5 w-5 text-primary-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 truncate">
                          {costo.articulo_nombre}
                        </p>
                        <p className="text-sm text-gray-500">
                          SKU: {costo.sku}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 sm:gap-6 flex-wrap">
                      {/* SAM */}
                      <div className="text-center">
                        <p className="text-xs text-gray-400 uppercase tracking-wide">
                          SAM
                        </p>
                        <p className="font-semibold text-gray-700 flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5 text-gray-400" />
                          {costo.tiempo_estandar_min} min
                        </p>
                      </div>

                      {/* Cost breakdown */}
                      <div className="text-center">
                        <p className="text-xs text-gray-400 uppercase tracking-wide">
                          Materiales
                        </p>
                        <p className="font-medium text-gray-700">
                          {formatMoney(costo.costo_materiales)}
                        </p>
                      </div>

                      <div className="text-center">
                        <p className="text-xs text-gray-400 uppercase tracking-wide">
                          M. Obra
                        </p>
                        <p className="font-medium text-gray-700">
                          {formatMoney(costo.costo_mano_obra)}
                        </p>
                      </div>

                      <div className="text-center">
                        <p className="text-xs text-gray-400 uppercase tracking-wide">
                          Costo Total
                        </p>
                        <p className="font-bold text-gray-900">
                          {formatMoney(costo.costo_total)}
                        </p>
                      </div>

                      {/* Precio & Margen */}
                      <div className="text-center">
                        <p className="text-xs text-gray-400 uppercase tracking-wide">
                          Precio Venta
                        </p>
                        <p className="font-medium text-gray-700">
                          {costo.precio_venta
                            ? formatMoney(costo.precio_venta)
                            : '-'}
                        </p>
                      </div>

                      <div className="text-center">
                        <p className="text-xs text-gray-400 uppercase tracking-wide">
                          Margen
                        </p>
                        {marginBadge(costo.margen_porcentaje)}
                      </div>

                      {/* Chevron */}
                      <div className="shrink-0">
                        {isExpanded ? (
                          <ChevronUp className="h-5 w-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-gray-400" />
                        )}
                      </div>
                    </div>
                  </div>
                </button>

                {/* ── Expanded Detail ──────────────────────────────────── */}
                {isExpanded && (
                  <div className="border-t border-gray-100 bg-gray-50/50">
                    {detailLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin h-6 w-6 border-4 border-primary-500 border-t-transparent rounded-full" />
                      </div>
                    ) : detail ? (
                      <div className="p-5 space-y-5">
                        {/* ── Recipe info / edit ──────────────────────── */}
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                              {detail.articulos?.nombre ?? 'Receta'}
                            </h3>
                            <p className="text-sm text-gray-500">
                              SKU: {detail.articulos?.sku} | Receta ID:{' '}
                              {detail.id.slice(0, 8)}...
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {editingReceta !== detail.id ? (
                              <button
                                className="btn-secondary flex items-center gap-1 text-sm py-1.5 px-3"
                                onClick={() => {
                                  setEditingReceta(detail.id);
                                  setEditForm({
                                    tiempo_estandar_min: detail.tiempo_estandar_min,
                                    costo_minuto_taller: detail.costo_minuto_taller,
                                    notas: detail.notas ?? '',
                                  });
                                }}
                              >
                                <Pencil className="h-3.5 w-3.5" />
                                Editar
                              </button>
                            ) : (
                              <>
                                <button
                                  className="btn-primary flex items-center gap-1 text-sm py-1.5 px-3"
                                  onClick={() => handleUpdateReceta(detail.id)}
                                >
                                  <Save className="h-3.5 w-3.5" />
                                  Guardar
                                </button>
                                <button
                                  className="btn-secondary text-sm py-1.5 px-3"
                                  onClick={() => setEditingReceta(null)}
                                >
                                  Cancelar
                                </button>
                              </>
                            )}
                            <button
                              className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              title="Eliminar receta"
                              onClick={() => handleDeleteReceta(detail.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>

                        {/* ── Edit form inline ───────────────────────── */}
                        {editingReceta === detail.id && (
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-white rounded-lg border border-gray-200">
                            <div>
                              <label className="block text-xs font-medium text-gray-500 mb-1">
                                SAM (min)
                              </label>
                              <input
                                type="number"
                                className="input text-sm"
                                min={0}
                                step={0.1}
                                value={editForm.tiempo_estandar_min}
                                onChange={(e) =>
                                  setEditForm((p) => ({
                                    ...p,
                                    tiempo_estandar_min:
                                      parseFloat(e.target.value) || 0,
                                  }))
                                }
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-500 mb-1">
                                Costo/min ($/min)
                              </label>
                              <input
                                type="number"
                                className="input text-sm"
                                min={0}
                                step={0.01}
                                value={editForm.costo_minuto_taller}
                                onChange={(e) =>
                                  setEditForm((p) => ({
                                    ...p,
                                    costo_minuto_taller:
                                      parseFloat(e.target.value) || 0,
                                  }))
                                }
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-500 mb-1">
                                Notas
                              </label>
                              <input
                                type="text"
                                className="input text-sm"
                                value={editForm.notas}
                                onChange={(e) =>
                                  setEditForm((p) => ({
                                    ...p,
                                    notas: e.target.value,
                                  }))
                                }
                              />
                            </div>
                          </div>
                        )}

                        {/* ── Materials table ────────────────────────── */}
                        <div>
                          <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                            <Package className="h-4 w-4 text-gray-400" />
                            Materiales
                          </h4>
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="border-b border-gray-200">
                                  <th className="text-left py-2 px-3 text-gray-500 font-medium">
                                    Material
                                  </th>
                                  <th className="text-right py-2 px-3 text-gray-500 font-medium">
                                    Cantidad
                                  </th>
                                  <th className="text-center py-2 px-3 text-gray-500 font-medium">
                                    Unidad
                                  </th>
                                  <th className="text-right py-2 px-3 text-gray-500 font-medium">
                                    Costo Unit.
                                  </th>
                                  <th className="text-right py-2 px-3 text-gray-500 font-medium">
                                    Subtotal
                                  </th>
                                  <th className="w-10"></th>
                                </tr>
                              </thead>
                              <tbody>
                                {detail.receta_lineas.length === 0 && (
                                  <tr>
                                    <td
                                      colSpan={6}
                                      className="text-center py-4 text-gray-400"
                                    >
                                      Sin materiales. Agrega uno abajo.
                                    </td>
                                  </tr>
                                )}
                                {detail.receta_lineas.map((linea) => {
                                  const subtotal =
                                    linea.cantidad *
                                    (linea.materiales?.costo_unitario ?? 0);
                                  return (
                                    <tr
                                      key={linea.id}
                                      className="border-b border-gray-100 hover:bg-white transition-colors"
                                    >
                                      <td className="py-2 px-3 text-gray-900">
                                        {linea.materiales?.nombre ?? 'Desconocido'}
                                      </td>
                                      <td className="py-2 px-3 text-right text-gray-700">
                                        {linea.cantidad}
                                      </td>
                                      <td className="py-2 px-3 text-center text-gray-500">
                                        {linea.materiales?.unidad ?? '-'}
                                      </td>
                                      <td className="py-2 px-3 text-right text-gray-700">
                                        {formatMoney(
                                          linea.materiales?.costo_unitario ?? 0
                                        )}
                                      </td>
                                      <td className="py-2 px-3 text-right font-medium text-gray-900">
                                        {formatMoney(subtotal)}
                                      </td>
                                      <td className="py-2 px-1">
                                        <button
                                          className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                          title="Eliminar linea"
                                          onClick={() =>
                                            handleDeleteLine(linea.id)
                                          }
                                        >
                                          <Trash2 className="h-3.5 w-3.5" />
                                        </button>
                                      </td>
                                    </tr>
                                  );
                                })}

                                {/* ── Add material row ───────────────── */}
                                <tr className="bg-primary-50/40">
                                  <td className="py-2 px-3">
                                    <select
                                      className="input text-sm py-1.5"
                                      value={newLineMaterialId}
                                      onChange={(e) =>
                                        setNewLineMaterialId(e.target.value)
                                      }
                                    >
                                      <option value="">
                                        Seleccionar material...
                                      </option>
                                      {materiales.map((m) => (
                                        <option key={m.id} value={m.id}>
                                          {m.nombre}
                                        </option>
                                      ))}
                                    </select>
                                  </td>
                                  <td className="py-2 px-3">
                                    <input
                                      type="number"
                                      className="input text-sm py-1.5 text-right"
                                      min={0}
                                      step={0.01}
                                      placeholder="Cant."
                                      value={newLineCantidad}
                                      onChange={(e) =>
                                        setNewLineCantidad(e.target.value)
                                      }
                                    />
                                  </td>
                                  <td className="py-2 px-3 text-center text-gray-400 text-xs">
                                    {newLineMaterialId
                                      ? materiales.find(
                                          (m) => m.id === newLineMaterialId
                                        )?.unidad ?? '-'
                                      : '-'}
                                  </td>
                                  <td className="py-2 px-3 text-right text-gray-400 text-xs">
                                    {newLineMaterialId
                                      ? formatMoney(
                                          materiales.find(
                                            (m) => m.id === newLineMaterialId
                                          )?.costo_unitario ?? 0
                                        )
                                      : '-'}
                                  </td>
                                  <td colSpan={2} className="py-2 px-3">
                                    <button
                                      className="btn-primary text-xs py-1.5 px-3 w-full flex items-center justify-center gap-1"
                                      disabled={
                                        addingLine ||
                                        !newLineMaterialId ||
                                        !newLineCantidad
                                      }
                                      onClick={handleAddLine}
                                    >
                                      <Plus className="h-3.5 w-3.5" />
                                      {addingLine ? 'Agregando...' : 'Agregar'}
                                    </button>
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {/* ── Cost Summary ───────────────────────────── */}
                        <div className="bg-white rounded-lg border border-gray-200 p-4">
                          <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-1.5">
                            <DollarSign className="h-4 w-4 text-gray-400" />
                            Resumen de Costos
                          </h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-500">
                                Total materiales
                              </span>
                              <span className="font-medium text-gray-700">
                                {formatMoney(detailTotals.materiales)}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">
                                Mano de obra ({detail.tiempo_estandar_min} min x{' '}
                                {formatMoney(detail.costo_minuto_taller)}/min)
                              </span>
                              <span className="font-medium text-gray-700">
                                {formatMoney(detailTotals.manoObra)}
                              </span>
                            </div>
                            <div className="border-t border-gray-200 pt-2 flex justify-between">
                              <span className="font-semibold text-gray-900">
                                Costo Total
                              </span>
                              <span className="font-bold text-gray-900">
                                {formatMoney(detailTotals.total)}
                              </span>
                            </div>
                            {costo.precio_venta != null && (
                              <div className="flex justify-between pt-1">
                                <span className="text-gray-500">
                                  Margen ({formatMoney(costo.precio_venta)} -{' '}
                                  {formatMoney(detailTotals.total)})
                                </span>
                                <span className="font-semibold">
                                  {formatMoney(
                                    costo.precio_venta - detailTotals.total
                                  )}{' '}
                                  {marginBadge(
                                    detailTotals.total > 0
                                      ? ((costo.precio_venta -
                                          detailTotals.total) /
                                          costo.precio_venta) *
                                          100
                                      : null
                                  )}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-5 text-center text-gray-400">
                        No se pudo cargar el detalle de la receta.
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
