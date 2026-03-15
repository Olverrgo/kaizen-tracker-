import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Trash2, Clock, DollarSign, AlertCircle, FileText, Image } from 'lucide-react';
import { ImageUpload } from '../components/ui/ImageUpload';
import { useStore } from '../store/useStore';
import { formatCurrency, cn } from '../lib/utils';
import type { ImageAttachment } from '../types';

export function EditActivity() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { activities, categories, updateActivity, deleteActivity } = useStore();

  const activity = activities.find((a) => a.id === id);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    categoryId: '',
    income: 0,
    costs: 0,
    durationMinutes: 0,
    isProductive: true,
    wasteReason: '',
    notes: '',
  });

  const [images, setImages] = useState<ImageAttachment[]>([]);

  useEffect(() => {
    if (activity) {
      setFormData({
        name: activity.name,
        description: activity.description || '',
        categoryId: activity.categoryId,
        income: activity.income,
        costs: activity.costs,
        durationMinutes: activity.durationMinutes,
        isProductive: activity.isProductive,
        wasteReason: activity.wasteReason || '',
        notes: activity.notes || '',
      });
      setImages(activity.images || []);
    }
  }, [activity]);

  if (!activity) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <p className="text-gray-500">Actividad no encontrada</p>
        <button
          onClick={() => navigate('/')}
          className="btn-primary mt-4"
        >
          Volver al Dashboard
        </button>
      </div>
    );
  }

  const profit = formData.income - formData.costs;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    updateActivity(activity.id, {
      name: formData.name,
      description: formData.description,
      categoryId: formData.categoryId,
      income: formData.income,
      costs: formData.costs,
      profit,
      durationMinutes: formData.durationMinutes,
      isProductive: formData.isProductive,
      wasteReason: formData.isProductive ? undefined : formData.wasteReason,
      notes: formData.notes || undefined,
      images: images.length > 0 ? images : undefined,
    });

    navigate('/');
  };

  const handleDelete = () => {
    if (confirm('¿Estas seguro de eliminar esta actividad?')) {
      deleteActivity(activity.id);
      navigate('/');
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Editar Actividad</h1>
            <p className="text-gray-500">Modifica los detalles de la actividad</p>
          </div>
        </div>
        <button
          onClick={handleDelete}
          className="p-2 hover:bg-red-100 rounded-lg transition-colors text-red-500"
          title="Eliminar actividad"
        >
          <Trash2 className="h-5 w-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Time Section */}
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <Clock className="h-5 w-5 text-primary-500" />
            <h2 className="text-lg font-semibold text-gray-900">Tiempo</h2>
          </div>

          <div className="flex items-center gap-4">
            <label className="flex-1">
              <span className="block text-sm text-gray-600 mb-1">
                Duracion (minutos)
              </span>
              <input
                type="number"
                min="0"
                value={formData.durationMinutes}
                onChange={(e) => setFormData((prev) => ({
                  ...prev,
                  durationMinutes: parseInt(e.target.value) || 0
                }))}
                className="input"
              />
            </label>
            <div className="text-right pt-6">
              <p className="text-sm text-gray-500">
                = {Math.floor(formData.durationMinutes / 60)}h {formData.durationMinutes % 60}min
              </p>
            </div>
          </div>
        </div>

        {/* Activity Details */}
        <div className="card space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Detalles de la Actividad
          </h2>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre de la actividad *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              className="input"
              required
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Categoria
            </label>
            {categories.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({ ...prev, categoryId: cat.id }))
                    }
                    className={cn(
                      'px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2',
                      formData.categoryId === cat.id
                        ? 'ring-2 ring-offset-2'
                        : 'hover:opacity-80'
                    )}
                    style={{
                      backgroundColor: `${cat.color}20`,
                      color: cat.color,
                    }}
                  >
                    {cat.icon && <span>{cat.icon}</span>}
                    {cat.name}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                No hay categorias. Crea una en Configuracion.
              </p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripcion (opcional)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, description: e.target.value }))
              }
              className="input min-h-[80px]"
            />
          </div>
        </div>

        {/* Notes & Images Section */}
        <div className="card space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary-500" />
            Notas y Evidencias
          </h2>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notas del trabajo
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, notes: e.target.value }))
              }
              className="input min-h-[120px]"
              placeholder="Escribe notas detalladas sobre el trabajo realizado..."
            />
          </div>

          {/* Images */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Image className="h-4 w-4" />
              Imagenes del trabajo
            </label>
            <ImageUpload
              images={images}
              onChange={setImages}
              maxImages={5}
            />
          </div>
        </div>

        {/* Financial Details */}
        <div className="card space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary-500" />
            Finanzas
          </h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ingreso
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  $
                </span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.income}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      income: parseFloat(e.target.value) || 0,
                    }))
                  }
                  className="input pl-7"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Costos
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  $
                </span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.costs}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      costs: parseFloat(e.target.value) || 0,
                    }))
                  }
                  className="input pl-7"
                />
              </div>
            </div>
          </div>

          {/* Profit Preview */}
          <div className="bg-gray-50 rounded-lg p-4 flex items-center justify-between">
            <span className="text-gray-600">Ganancia neta:</span>
            <span
              className={cn(
                'text-2xl font-bold',
                profit >= 0 ? 'text-green-600' : 'text-red-600'
              )}
            >
              {profit >= 0 ? '+' : ''}
              {formatCurrency(profit)}
            </span>
          </div>
        </div>

        {/* Productivity */}
        <div className="card space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Productividad</h2>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="productive"
                checked={formData.isProductive}
                onChange={() =>
                  setFormData((prev) => ({ ...prev, isProductive: true }))
                }
                className="text-primary-500 focus:ring-primary-500"
              />
              <span className="text-sm font-medium text-gray-700">
                Tiempo productivo
              </span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="productive"
                checked={!formData.isProductive}
                onChange={() =>
                  setFormData((prev) => ({ ...prev, isProductive: false }))
                }
                className="text-red-500 focus:ring-red-500"
              />
              <span className="text-sm font-medium text-gray-700">
                Tiempo desperdiciado
              </span>
            </label>
          </div>

          {!formData.isProductive && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-lg p-3">
              <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <label className="block text-sm font-medium text-red-700 mb-1">
                  Razon del desperdicio
                </label>
                <input
                  type="text"
                  value={formData.wasteReason}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      wasteReason: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-red-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none text-sm"
                />
              </div>
            </div>
          )}
        </div>

        {/* Submit */}
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="btn-secondary flex-1"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={!formData.name}
            className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="h-5 w-5" />
            Guardar Cambios
          </button>
        </div>
      </form>
    </div>
  );
}
