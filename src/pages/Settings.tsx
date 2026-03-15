import { useState } from 'react';
import { Plus, Trash2, Save, X } from 'lucide-react';
import { useStore } from '../store/useStore';
import { generateId, formatCurrency, cn } from '../lib/utils';
import type { Category } from '../types';

const PRESET_COLORS = [
  '#22c55e', // green
  '#3b82f6', // blue
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#f97316', // orange
];

const PRESET_ICONS = ['💼', '🛠️', '💻', '📱', '🚗', '📦', '🎨', '📝', '🏠', '⚡'];

export function Settings() {
  const { settings, updateSettings, categories, addCategory, deleteCategory } = useStore();

  const [newCategory, setNewCategory] = useState({
    name: '',
    color: PRESET_COLORS[0],
    icon: PRESET_ICONS[0],
    hourlyRateDefault: 0,
  });
  const [showNewCategoryForm, setShowNewCategoryForm] = useState(false);

  const handleAddCategory = () => {
    if (!newCategory.name.trim()) return;

    const category: Category = {
      id: generateId(),
      name: newCategory.name,
      color: newCategory.color,
      icon: newCategory.icon,
      hourlyRateDefault: newCategory.hourlyRateDefault,
      createdAt: new Date() as any,
    };

    addCategory(category);
    setNewCategory({
      name: '',
      color: PRESET_COLORS[0],
      icon: PRESET_ICONS[0],
      hourlyRateDefault: 0,
    });
    setShowNewCategoryForm(false);
  };

  const handleDeleteCategory = (id: string) => {
    if (confirm('Estas seguro de eliminar esta categoria?')) {
      deleteCategory(id);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Configuracion</h1>
        <p className="text-gray-500">Personaliza tu experiencia Kaizen</p>
      </div>

      {/* Goals Settings */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Metas y Objetivos
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Meta de ganancia diaria
            </label>
            <div className="relative max-w-xs">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                $
              </span>
              <input
                type="number"
                min="0"
                value={settings.dailyProfitTarget}
                onChange={(e) =>
                  updateSettings({
                    dailyProfitTarget: parseFloat(e.target.value) || 0,
                  })
                }
                className="input pl-7"
              />
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Actualmente: {formatCurrency(settings.dailyProfitTarget)} por dia
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Horas de trabajo por dia
            </label>
            <input
              type="number"
              min="1"
              max="24"
              value={settings.workingHoursPerDay}
              onChange={(e) =>
                updateSettings({
                  workingHoursPerDay: parseInt(e.target.value) || 8,
                })
              }
              className="input max-w-xs"
            />
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Categorias de Actividades
          </h2>
          <button
            onClick={() => setShowNewCategoryForm(true)}
            className="btn-primary flex items-center gap-2 text-sm"
          >
            <Plus className="h-4 w-4" />
            Nueva Categoria
          </button>
        </div>

        {/* Category List */}
        <div className="space-y-2">
          {categories.length === 0 && !showNewCategoryForm && (
            <p className="text-gray-500 text-center py-8">
              No hay categorias. Crea la primera para organizar tus actividades.
            </p>
          )}

          {categories.map((cat) => (
            <div
              key={cat.id}
              className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg"
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center text-lg"
                style={{ backgroundColor: `${cat.color}20` }}
              >
                {cat.icon}
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">{cat.name}</p>
                <p className="text-sm text-gray-500">
                  Tarifa: {formatCurrency(cat.hourlyRateDefault)}/hora
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDeleteCategory(cat.id)}
                  className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                  title="Eliminar"
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </button>
              </div>
            </div>
          ))}

          {/* New Category Form */}
          {showNewCategoryForm && (
            <div className="p-4 border-2 border-dashed border-primary-200 rounded-lg bg-primary-50/50">
              <h3 className="font-medium text-gray-900 mb-3">Nueva Categoria</h3>

              <div className="space-y-3">
                <input
                  type="text"
                  value={newCategory.name}
                  onChange={(e) =>
                    setNewCategory((prev) => ({ ...prev, name: e.target.value }))
                  }
                  className="input"
                  placeholder="Nombre de la categoria"
                  autoFocus
                />

                {/* Color Picker */}
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Color</label>
                  <div className="flex gap-2">
                    {PRESET_COLORS.map((color) => (
                      <button
                        key={color}
                        onClick={() =>
                          setNewCategory((prev) => ({ ...prev, color }))
                        }
                        className={cn(
                          'w-8 h-8 rounded-full transition-all',
                          newCategory.color === color &&
                            'ring-2 ring-offset-2 ring-gray-400'
                        )}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                {/* Icon Picker */}
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Icono</label>
                  <div className="flex gap-2 flex-wrap">
                    {PRESET_ICONS.map((icon) => (
                      <button
                        key={icon}
                        onClick={() =>
                          setNewCategory((prev) => ({ ...prev, icon }))
                        }
                        className={cn(
                          'w-10 h-10 rounded-lg bg-white border flex items-center justify-center text-lg transition-all',
                          newCategory.icon === icon
                            ? 'border-primary-500 ring-2 ring-primary-200'
                            : 'border-gray-200 hover:border-gray-300'
                        )}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Hourly Rate */}
                <div>
                  <label className="block text-sm text-gray-600 mb-1">
                    Tarifa por hora (opcional)
                  </label>
                  <div className="relative max-w-[200px]">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                      $
                    </span>
                    <input
                      type="number"
                      min="0"
                      value={newCategory.hourlyRateDefault}
                      onChange={(e) =>
                        setNewCategory((prev) => ({
                          ...prev,
                          hourlyRateDefault: parseFloat(e.target.value) || 0,
                        }))
                      }
                      className="input pl-7"
                      placeholder="0"
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => setShowNewCategoryForm(false)}
                    className="btn-secondary flex items-center gap-1 text-sm"
                  >
                    <X className="h-4 w-4" />
                    Cancelar
                  </button>
                  <button
                    onClick={handleAddCategory}
                    disabled={!newCategory.name.trim()}
                    className="btn-primary flex items-center gap-1 text-sm disabled:opacity-50"
                  >
                    <Save className="h-4 w-4" />
                    Guardar
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Danger Zone */}
      <div className="card border-red-200">
        <h2 className="text-lg font-semibold text-red-600 mb-4">
          Zona de Peligro
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          Estas acciones no se pueden deshacer. Ten cuidado.
        </p>
        <button
          onClick={() => {
            if (
              confirm(
                'Estas seguro de borrar TODOS los datos? Esta accion no se puede deshacer.'
              )
            ) {
              // Clear all data
              localStorage.removeItem('kaizen-storage');
              window.location.reload();
            }
          }}
          className="px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium"
        >
          Borrar todos los datos
        </button>
      </div>
    </div>
  );
}
