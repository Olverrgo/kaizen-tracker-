import { useState, useEffect, useCallback } from 'react';
import { Package, Plus, Pencil, Trash2, Search, X, Save } from 'lucide-react';
import {
  getArticulos,
  createArticulo,
  updateArticulo,
  deleteArticulo,
} from '../lib/supabaseClient';

interface Articulo {
  id: string;
  sku: string;
  nombre: string;
  descripcion: string | null;
  unidad: string;
  precio_venta: number;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

type ArticuloForm = {
  sku: string;
  nombre: string;
  descripcion: string;
  unidad: string;
  precio_venta: string;
};

const UNIDADES = [
  { value: 'pieza', label: 'Pieza' },
  { value: 'par', label: 'Par' },
  { value: 'juego', label: 'Juego' },
  { value: 'metro', label: 'Metro' },
];

const emptyForm: ArticuloForm = {
  sku: '',
  nombre: '',
  descripcion: '',
  unidad: 'pieza',
  precio_venta: '',
};

function formatMXN(value: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(value);
}

export function Articulos() {
  const [articulos, setArticulos] = useState<Articulo[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ArticuloForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchArticulos = useCallback(async () => {
    setLoading(true);
    const { data, error } = await getArticulos();
    if (error) {
      setError('Error al cargar articulos');
    } else {
      setArticulos(data ?? []);
      setError(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchArticulos();
  }, [fetchArticulos]);

  const filtered = articulos.filter((a) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      a.nombre.toLowerCase().includes(q) ||
      a.sku.toLowerCase().includes(q)
    );
  });

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEdit(articulo: Articulo) {
    setEditingId(articulo.id);
    setForm({
      sku: articulo.sku,
      nombre: articulo.nombre,
      descripcion: articulo.descripcion ?? '',
      unidad: articulo.unidad,
      precio_venta: String(articulo.precio_venta),
    });
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingId(null);
    setForm(emptyForm);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.sku.trim() || !form.nombre.trim()) return;

    setSaving(true);
    setError(null);

    const payload = {
      sku: form.sku.trim(),
      nombre: form.nombre.trim(),
      descripcion: form.descripcion.trim() || null,
      unidad: form.unidad,
      precio_venta: parseFloat(form.precio_venta) || 0,
    };

    const { error: err } = editingId
      ? await updateArticulo(editingId, payload)
      : await createArticulo(payload);

    if (err) {
      setError(editingId ? 'Error al actualizar articulo' : 'Error al crear articulo');
    } else {
      closeModal();
      await fetchArticulos();
    }
    setSaving(false);
  }

  async function handleDelete(articulo: Articulo) {
    if (!confirm(`Eliminar "${articulo.nombre}"?`)) return;

    const { error: err } = await deleteArticulo(articulo.id);
    if (err) {
      setError('Error al eliminar articulo');
    } else {
      await fetchArticulos();
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary-100 rounded-lg">
            <Package className="h-6 w-6 text-primary-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Articulos</h1>
            <p className="text-sm text-gray-500">
              {articulos.length} articulo{articulos.length !== 1 ? 's' : ''} registrado{articulos.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <button className="btn-primary flex items-center gap-2" onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Nuevo Articulo
        </button>
      </div>

      {/* Error banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)}>
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar por nombre o SKU..."
          className="input pl-10"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {search && (
          <button
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            onClick={() => setSearch('')}
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="card">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full" />
            <span className="ml-3 text-gray-500">Cargando articulos...</span>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card">
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <Package className="h-12 w-12 mb-3" />
            {search ? (
              <p>No se encontraron articulos para "{search}"</p>
            ) : (
              <>
                <p className="font-medium text-gray-500">Sin articulos</p>
                <p className="text-sm mt-1">Crea tu primer articulo para comenzar</p>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="card overflow-hidden !p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">
                    SKU
                  </th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">
                    Nombre
                  </th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">
                    Unidad
                  </th>
                  <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">
                    Precio Venta
                  </th>
                  <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((articulo) => (
                  <tr
                    key={articulo.id}
                    className="hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <span className="font-mono text-sm bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                        {articulo.sku}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900">{articulo.nombre}</p>
                      {articulo.descripcion && (
                        <p className="text-sm text-gray-400 mt-0.5 truncate max-w-xs">
                          {articulo.descripcion}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600 capitalize">
                        {articulo.unidad}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-semibold text-gray-900">
                        {formatMXN(articulo.precio_venta)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(articulo)}
                          className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(articulo)}
                          className="p-2 text-gray-400 hover:text-danger-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={closeModal}
          />

          {/* Dialog */}
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-900">
                {editingId ? 'Editar Articulo' : 'Nuevo Articulo'}
              </h2>
              <button
                onClick={closeModal}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              {/* SKU */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  SKU <span className="text-danger-500">*</span>
                </label>
                <input
                  type="text"
                  className="input"
                  placeholder="Ej: TB-001"
                  value={form.sku}
                  onChange={(e) => setForm({ ...form, sku: e.target.value })}
                  required
                />
              </div>

              {/* Nombre */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre <span className="text-danger-500">*</span>
                </label>
                <input
                  type="text"
                  className="input"
                  placeholder="Nombre del articulo"
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  required
                />
              </div>

              {/* Descripcion */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripcion
                </label>
                <textarea
                  className="input resize-none"
                  rows={3}
                  placeholder="Descripcion opcional..."
                  value={form.descripcion}
                  onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                />
              </div>

              {/* Unidad */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Unidad
                </label>
                <select
                  className="input"
                  value={form.unidad}
                  onChange={(e) => setForm({ ...form, unidad: e.target.value })}
                >
                  {UNIDADES.map((u) => (
                    <option key={u.value} value={u.value}>
                      {u.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Precio Venta */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Precio de Venta (MXN)
                </label>
                <input
                  type="number"
                  className="input"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  value={form.precio_venta}
                  onChange={(e) => setForm({ ...form, precio_venta: e.target.value })}
                />
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  className="btn-secondary flex-1"
                  onClick={closeModal}
                  disabled={saving}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                  disabled={saving || !form.sku.trim() || !form.nombre.trim()}
                >
                  <Save className="h-4 w-4" />
                  {saving ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
