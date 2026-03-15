import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Save, Clock, DollarSign, AlertCircle, FileText, Image, FolderKanban } from 'lucide-react';
import { Timer } from '../components/Timer';
import { ImageUpload } from '../components/ui/ImageUpload';
import { useStore } from '../store/useStore';
import { generateId, formatCurrency, cn } from '../lib/utils';
import type { Activity, ImageAttachment } from '../types';

export function NewActivity() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedProjectId = searchParams.get('projectId');

  const { categories, projects, addActivity, addTimeToProject, addIncomeToProject, timer, stopTimer } = useStore();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    categoryId: categories[0]?.id || '',
    projectId: preselectedProjectId || '',
    income: 0,
    costs: 0,
    isProductive: true,
    wasteReason: '',
    notes: '',
  });

  const [images, setImages] = useState<ImageAttachment[]>([]);
  const [useTimer, setUseTimer] = useState(true);
  const [manualDuration, setManualDuration] = useState(0);

  const profit = formData.income - formData.costs;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let durationMinutes = manualDuration;
    if (useTimer && timer.elapsedSeconds > 0) {
      const { elapsedSeconds } = stopTimer();
      durationMinutes = Math.ceil(elapsedSeconds / 60);
    }

    const now = new Date();
    const newActivity: Activity = {
      id: generateId(),
      categoryId: formData.categoryId,
      projectId: formData.projectId || undefined,
      name: formData.name,
      description: formData.description,
      startTime: now as any,
      endTime: now as any,
      durationMinutes,
      income: formData.income,
      costs: formData.costs,
      profit,
      isProductive: formData.isProductive,
      wasteReason: formData.isProductive ? undefined : formData.wasteReason,
      notes: formData.notes || undefined,
      images: images.length > 0 ? images : undefined,
      createdAt: now as any,
    };

    addActivity(newActivity);

    // Update project totals if linked
    if (formData.projectId) {
      addTimeToProject(formData.projectId, durationMinutes);
      if (formData.income > 0 || formData.costs > 0) {
        addIncomeToProject(formData.projectId, formData.income, formData.costs);
      }
    }

    navigate(formData.projectId ? `/project/${formData.projectId}` : '/');
  };

  const handleTimerComplete = (seconds: number) => {
    setManualDuration(Math.ceil(seconds / 60));
    setUseTimer(false);
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nueva Actividad</h1>
          <p className="text-gray-500">Registra tu trabajo y ganancias</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Timer Section */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary-500" />
              Tiempo
            </h2>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={useTimer}
                onChange={(e) => setUseTimer(e.target.checked)}
                className="rounded border-gray-300 text-primary-500 focus:ring-primary-500"
              />
              Usar cronometro
            </label>
          </div>

          {useTimer ? (
            <Timer size="lg" onComplete={handleTimerComplete} />
          ) : (
            <div className="flex items-center gap-4">
              <label className="flex-1">
                <span className="block text-sm text-gray-600 mb-1">
                  Duracion (minutos)
                </span>
                <input
                  type="number"
                  min="0"
                  value={manualDuration}
                  onChange={(e) => setManualDuration(parseInt(e.target.value) || 0)}
                  className="input"
                  placeholder="Ej: 45"
                />
              </label>
            </div>
          )}
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
              placeholder="Ej: Reparacion de laptop"
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
                      borderColor: cat.color,
                      ...(formData.categoryId === cat.id && {
                        ringColor: cat.color,
                      }),
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

          {/* Project */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
              <FolderKanban className="h-4 w-4" />
              Proyecto (opcional)
            </label>
            {projects.filter(p => p.status === 'active').length > 0 ? (
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, projectId: '' }))}
                  className={cn(
                    'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                    !formData.projectId
                      ? 'bg-gray-900 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  )}
                >
                  Sin proyecto
                </button>
                {projects.filter(p => p.status === 'active').map((project) => (
                  <button
                    key={project.id}
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({ ...prev, projectId: project.id }))
                    }
                    className={cn(
                      'px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2',
                      formData.projectId === project.id
                        ? 'ring-2 ring-offset-2'
                        : 'hover:opacity-80'
                    )}
                    style={{
                      backgroundColor: `${project.color}20`,
                      color: project.color,
                    }}
                  >
                    <span>{project.icon}</span>
                    {project.name}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                No hay proyectos activos.
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
              placeholder="Detalles adicionales..."
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
              placeholder="Escribe notas detalladas sobre el trabajo realizado, observaciones, problemas encontrados, soluciones aplicadas..."
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
            <p className="text-xs text-gray-500 mt-2">
              Agrega fotos del trabajo realizado, antes/despues, evidencias, etc.
            </p>
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
                  placeholder="0.00"
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
                  placeholder="0.00"
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
                  placeholder="Ej: Esperas, interrupciones, errores..."
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
            Guardar Actividad
          </button>
        </div>
      </form>
    </div>
  );
}
