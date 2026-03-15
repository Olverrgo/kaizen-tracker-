import { useState, useEffect, useMemo } from 'react';
import {
  Layers,
  Plus,
  Pencil,
  Trash2,
  Search,
  X,
  Save,
  AlertTriangle,
} from 'lucide-react';
import { getMateriales, createMaterial, updateMaterial, deleteMaterial } from '../lib/supabaseClient';
import { formatCurrency } from '../lib/utils';

interface Material {
  id: string;
  nombre: string;
  unidad: string;
  costo_unitario: number;
  stock_actual: number;
  stock_minimo: number;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

interface MaterialForm {
  nombre: string;
  unidad: string;
  costo_unitario: string;
  stock_actual: string;
  stock_minimo: string;
}

const UNIDADES = [
  { value: 'metro', label: 'Metro' },
  { value: 'pieza', label: 'Pieza' },
  { value: 'rollo', label: 'Rollo' },
  { value: 'kg', label: 'Kilogramo' },
  { value: 'cono', label: 'Cono' },
  { value: 'litro', label: 'Litro' },
];

const emptyForm: MaterialForm = {
  nombre: '',
  unidad: 'metro',
  costo_unitario: '',
  stock_actual: '0',
  stock_minimo: '0',
};

export function Materiales() {
  const [materiales, setMateriales] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Material | null>(null);
  const [form, setForm] = useState<MaterialForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMateriales = async () => {
    setLoading(true);
    const { data, error } = await getMateriales();
    if (error) {
      setError('Error al cargar materiales');
    } else {
      setMateriales(data ?? []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchMateriales();
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return materiales;
    const q = search.toLowerCase();
    return materiales.filter(
      (m) =>
        m.nombre.toLowerCase().includes(q) ||
        m.unidad.toLowerCase().includes(q)
    );
  }, [materiales, search]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setError(null);
    setModalOpen(true);
  };

  const openEdit = (mat: Material) => {
    setEditing(mat);
    setForm({
      nombre: mat.nombre,
      unidad: mat.unidad,
      costo_unitario: String(mat.costo_unitario),
      stock_actual: String(mat.stock_actual),
      stock_minimo: String(mat.stock_minimo),
    });
    setError(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
    setForm(emptyForm);
    setError(null);
  };

  const handleSave = async () => {
    if (!form.nombre.trim()) {
      setError('El nombre es obligatorio');
      return;
    }
    if (!form.costo_unitario || Number(form.costo_unitario) < 0) {
      setError('El costo unitario debe ser un número válido');
      return;
    }

    setSaving(true);
    setError(null);

    const payload = {
      nombre: form.nombre.trim(),
      unidad: form.unidad,
      costo_unitario: Number(form.costo_unitario),
      stock_actual: Number(form.stock_actual) || 0,
      stock_minimo: Number(form.stock_minimo) || 0,
    };

    const { error: saveError } = editing
      ? await updateMaterial(editing.id, payload)
      : await createMaterial(payload);

    if (saveError) {
      setError(editing ? 'Error al actualizar material' : 'Error al crear material');
      setSaving(false);
      return;
    }

    setSaving(false);
    closeModal();
    fetchMateriales();
  };

  const handleDelete = async (mat: Material) => {
    if (!window.confirm(`¿Eliminar "${mat.nombre}"? Esta acción es reversible.`)) return;

    const { error: delError } = await deleteMaterial(mat.id);
    if (delError) {
      setError('Error al eliminar material');
      return;
    }
    fetchMateriales();
  };

  const getUnidadLabel = (value: string) =>
    UNIDADES.find((u) => u.value === value)?.label ?? value;

  const isStockBajo = (mat: Material) =>
    mat.stock_actual < mat.stock_minimo;

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center space-y-3">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary-200 border-t-primary-600 mx-auto" />
          <p className="text-sm text-gray-500">Cargando materiales...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Layers className="h-7 w-7 text-primary-600" />
          <h1 className="text-2xl font-bold text-gray-900">Materiales e Insumos</h1>
        </div>
        <button className="btn-primary flex items-center gap-2" onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Nuevo Material
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar por nombre o unidad..."
          className="input pl-10 w-full"
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

      {/* Error global */}
      {error && !modalOpen && (
        <div className="flex items-center gap-2 rounded-lg bg-danger-50 border border-danger-200 px-4 py-3 text-sm text-danger-700">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="card text-center py-12">
          <Layers className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">
            {search ? 'No se encontraron materiales' : 'Aún no hay materiales registrados'}
          </p>
          {!search && (
            <p className="text-sm text-gray-400 mt-1">
              Agrega tu primer material con el botón "Nuevo Material"
            </p>
          )}
        </div>
      ) : (
        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Nombre</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Unidad</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">Costo Unitario</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">Stock Actual</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">Stock Mínimo</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-600">Estado</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((mat) => (
                  <tr
                    key={mat.id}
                    className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3 font-medium text-gray-900">{mat.nombre}</td>
                    <td className="px-4 py-3 text-gray-600">{getUnidadLabel(mat.unidad)}</td>
                    <td className="px-4 py-3 text-right text-gray-900">
                      {formatCurrency(mat.costo_unitario)}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-900">{mat.stock_actual}</td>
                    <td className="px-4 py-3 text-right text-gray-500">{mat.stock_minimo}</td>
                    <td className="px-4 py-3 text-center">
                      {isStockBajo(mat) ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-danger-50 px-2.5 py-0.5 text-xs font-medium text-danger-700">
                          <AlertTriangle className="h-3 w-3" />
                          Bajo
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-success-50 px-2.5 py-0.5 text-xs font-medium text-success-700">
                          OK
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          className="btn-secondary p-1.5"
                          title="Editar"
                          onClick={() => openEdit(mat)}
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          className="btn-secondary p-1.5 text-danger-600 hover:text-danger-700 hover:bg-danger-50"
                          title="Eliminar"
                          onClick={() => handleDelete(mat)}
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
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={closeModal}
          />

          {/* Content */}
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">
                {editing ? 'Editar Material' : 'Nuevo Material'}
              </h2>
              <button
                className="text-gray-400 hover:text-gray-600"
                onClick={closeModal}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-lg bg-danger-50 border border-danger-200 px-3 py-2 text-sm text-danger-700">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            <div className="space-y-4">
              {/* Nombre */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre <span className="text-danger-500">*</span>
                </label>
                <input
                  type="text"
                  className="input w-full"
                  placeholder="Ej: Tela manta cruda"
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                />
              </div>

              {/* Unidad */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Unidad <span className="text-danger-500">*</span>
                </label>
                <select
                  className="input w-full"
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

              {/* Costo Unitario */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Costo Unitario (MXN) <span className="text-danger-500">*</span>
                </label>
                <input
                  type="number"
                  className="input w-full"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  value={form.costo_unitario}
                  onChange={(e) => setForm({ ...form, costo_unitario: e.target.value })}
                />
              </div>

              {/* Stock Actual / Stock Mínimo */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Stock Actual
                  </label>
                  <input
                    type="number"
                    className="input w-full"
                    placeholder="0"
                    min="0"
                    step="1"
                    value={form.stock_actual}
                    onChange={(e) => setForm({ ...form, stock_actual: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Stock Mínimo
                  </label>
                  <input
                    type="number"
                    className="input w-full"
                    placeholder="0"
                    min="0"
                    step="1"
                    value={form.stock_minimo}
                    onChange={(e) => setForm({ ...form, stock_minimo: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2">
              <button className="btn-secondary" onClick={closeModal} disabled={saving}>
                Cancelar
              </button>
              <button
                className="btn-primary flex items-center gap-2"
                onClick={handleSave}
                disabled={saving}
              >
                <Save className="h-4 w-4" />
                {saving ? 'Guardando...' : editing ? 'Actualizar' : 'Crear'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
