import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Save, Clock, DollarSign, Plus, RotateCcw } from 'lucide-react';
import { format } from 'date-fns';
import { Timer } from '../components/Timer';
import { useStore } from '../store/useStore';
import { formatCurrency, formatDuration, generateId, cn, getTodayString, formatDateShort } from '../lib/utils';
import type { Activity } from '../types';

export function ContinueActivity() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fromProject = searchParams.get('from') === 'project';
  const projectId = searchParams.get('projectId');
  const { activities, categories, projects, addActivity, addTimeToActivity, addIncomeToActivity, addTimeToProject, addIncomeToProject, timer, stopTimer, startTimer } = useStore();
  const project = projectId ? projects.find(p => p.id === projectId) : null;

  const activity = activities.find((a) => a.id === id);
  const category = categories.find((c) => c.id === activity?.categoryId);

  // Detect if this activity is from a different day
  const isCrossDayContinuation = useMemo(() => {
    if (!activity) return false;
    const d = activity.startTime instanceof Date
      ? activity.startTime
      : (activity.startTime?.toDate?.() || new Date(activity.startTime as any));
    return format(d, 'yyyy-MM-dd') !== getTodayString();
  }, [activity]);

  // Income tracking state
  const [newIncome, setNewIncome] = useState(0);
  const [newCosts, setNewCosts] = useState(0);
  const [incomeHistory, setIncomeHistory] = useState<{ income: number; costs: number; time: Date }[]>([]);

  // Manual time adjustment
  const [manualMinutes, setManualMinutes] = useState(0);
  const [addedManualMinutes, setAddedManualMinutes] = useState(0);

  // Start timer only if not already running for this activity
  useEffect(() => {
    if (activity && !(timer.isRunning && timer.currentActivityId === activity.id)) {
      if (!timer.isRunning) {
        startTimer(activity.id);
      }
    }
  }, [activity?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!activity) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <p className="text-gray-500">Actividad no encontrada</p>
        <button
          onClick={() => navigate(returnPath)}
          className="btn-primary mt-4"
        >
          {fromProject ? 'Volver al Proyecto' : 'Volver al Dashboard'}
        </button>
      </div>
    );
  }

  // Add manual time adjustment
  const handleAddManualTime = () => {
    if (manualMinutes > 0) {
      if (!isCrossDayContinuation) {
        addTimeToActivity(activity!.id, manualMinutes);
      }
      setAddedManualMinutes(prev => prev + manualMinutes);
      setManualMinutes(0);
    }
  };

  // Add income while working
  const handleAddIncome = () => {
    if (newIncome > 0 || newCosts > 0) {
      if (!isCrossDayContinuation) {
        // Same day: add directly to original activity
        addIncomeToActivity(activity!.id, newIncome, newCosts);
        const actProjectId = activity!.projectId || projectId;
        if (actProjectId) {
          addIncomeToProject(actProjectId, newIncome, newCosts);
        }
      }
      // Always track in local history (used for cross-day new activity creation)
      setIncomeHistory(prev => [...prev, { income: newIncome, costs: newCosts, time: new Date() }]);
      setNewIncome(0);
      setNewCosts(0);
    }
  };

  // Calculate session totals
  const sessionIncome = incomeHistory.reduce((sum, h) => sum + h.income, 0);
  const sessionCosts = incomeHistory.reduce((sum, h) => sum + h.costs, 0);

  // Compute real elapsed seconds (accounts for background time)
  const getRealElapsed = () => {
    let elapsed = timer.elapsedSeconds;
    if (timer.isRunning && timer.startTime) {
      elapsed += Math.floor((Date.now() - timer.startTime) / 1000);
    }
    return elapsed;
  };

  const returnPath = fromProject && projectId ? `/project/${projectId}` : '/';

  // Save time from elapsed seconds (called by Timer onComplete and Guardar button)
  const saveElapsedTime = (elapsedSeconds: number) => {
    const actProjectId = activity!.projectId || projectId;

    if (isCrossDayContinuation) {
      // Cross-day: create a NEW activity for today with session data
      const timerMinutes = elapsedSeconds > 0 ? Math.ceil(elapsedSeconds / 60) : 0;
      const totalSessionMinutes = timerMinutes + addedManualMinutes;

      // Pending income not yet in history
      const pendingIncome = newIncome > 0 || newCosts > 0
        ? [{ income: newIncome, costs: newCosts }]
        : [];
      const allIncome = [...incomeHistory, ...pendingIncome];
      const totalIncome = allIncome.reduce((s, h) => s + h.income, 0);
      const totalCosts = allIncome.reduce((s, h) => s + h.costs, 0);

      if (totalSessionMinutes > 0 || totalIncome > 0 || totalCosts > 0) {
        const now = new Date();
        const continuation: Activity = {
          id: generateId(),
          categoryId: activity!.categoryId,
          projectId: actProjectId || undefined,
          name: activity!.name,
          description: `Continuacion de actividad del ${formatDateShort(
            activity!.startTime instanceof Date
              ? activity!.startTime
              : (activity!.startTime?.toDate?.() || new Date(activity!.startTime as any))
          )}`,
          startTime: now as any,
          endTime: now as any,
          durationMinutes: totalSessionMinutes,
          income: totalIncome,
          costs: totalCosts,
          profit: totalIncome - totalCosts,
          isProductive: activity!.isProductive,
          createdAt: now as any,
        };

        addActivity(continuation);

        // Update project totals
        if (actProjectId) {
          if (totalSessionMinutes > 0) addTimeToProject(actProjectId, totalSessionMinutes);
          if (totalIncome > 0 || totalCosts > 0) addIncomeToProject(actProjectId, totalIncome, totalCosts);
        }
      }
    } else {
      // Same day: add to original activity as before
      if (newIncome > 0 || newCosts > 0) {
        addIncomeToActivity(activity!.id, newIncome, newCosts);
        if (actProjectId) {
          addIncomeToProject(actProjectId, newIncome, newCosts);
        }
      }

      if (elapsedSeconds > 0) {
        const additionalMinutes = Math.ceil(elapsedSeconds / 60);
        addTimeToActivity(activity!.id, additionalMinutes);
        if (actProjectId) {
          addTimeToProject(actProjectId, additionalMinutes);
        }
      }
    }

    navigate(returnPath);
  };

  const handleSave = () => {
    const realElapsed = getRealElapsed();
    stopTimer();
    saveElapsedTime(realElapsed);
  };

  const handleCancel = () => {
    stopTimer();
    navigate(returnPath);
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={handleCancel}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Continuar Actividad</h1>
          <p className="text-gray-500">
            {project ? (
              <>Proyecto: <span className="font-medium text-primary-600">{project.icon} {project.name}</span></>
            ) : (
              'Agrega mas tiempo a esta actividad'
            )}
          </p>
        </div>
      </div>

      {/* Cross-day notice */}
      {isCrossDayContinuation && (
        <div className="flex items-center gap-3 p-3 mb-4 rounded-xl bg-amber-50 border border-amber-200">
          <RotateCcw className="h-5 w-5 text-amber-600 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-amber-800">Continuacion de actividad anterior</p>
            <p className="text-xs text-amber-600">
              El tiempo e ingresos de esta sesion se registraran como actividad de hoy
            </p>
          </div>
        </div>
      )}

      {/* Activity Info */}
      <div className="card mb-6">
        <div className="flex items-center gap-4">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
            style={{ backgroundColor: `${category?.color}20` || '#f3f4f6' }}
          >
            {category?.icon || '📋'}
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-gray-900">{activity.name}</h2>
            <p className="text-gray-500">{category?.name || 'Sin categoria'}</p>
          </div>
          <div className="text-right">
            <p className={cn(
              'text-xl font-bold',
              activity.profit >= 0 ? 'text-green-600' : 'text-red-600'
            )}>
              {formatCurrency(activity.profit)}
            </p>
            <p className="text-sm text-gray-500">ganancia acumulada</p>
          </div>
        </div>
      </div>

      {/* Current Time */}
      <div className="card mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Clock className="h-5 w-5 text-primary-500" />
          <h3 className="text-lg font-semibold text-gray-900">Tiempo Registrado</h3>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Tiempo actual:</span>
            <span className="text-2xl font-bold text-gray-900">
              {formatDuration(activity.durationMinutes)}
            </span>
          </div>
        </div>

        {/* Manual Time Adjustment */}
        <div className="border-t border-gray-100 pt-4">
          <p className="text-sm font-medium text-gray-700 mb-2">
            Ajuste manual de tiempo
          </p>
          <p className="text-xs text-gray-500 mb-3">
            Si olvidaste iniciar el cronometro, agrega los minutos trabajados aqui.
          </p>

          <div className="flex items-center gap-2">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  value={manualMinutes || ''}
                  onChange={(e) => setManualMinutes(Math.max(0, parseInt(e.target.value) || 0))}
                  className="input text-center"
                  placeholder="0"
                />
                <span className="text-gray-500 text-sm whitespace-nowrap">minutos</span>
              </div>
            </div>
            <button
              onClick={handleAddManualTime}
              disabled={manualMinutes <= 0}
              className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
            >
              <Plus className="h-4 w-4" />
              Agregar
            </button>
          </div>

          {addedManualMinutes > 0 && (
            <div className="mt-3 text-sm text-blue-600 bg-blue-50 px-3 py-2 rounded-lg">
              +{addedManualMinutes} minutos agregados manualmente esta sesion
            </div>
          )}
        </div>
      </div>

      {/* Timer */}
      <div className="card mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
          Tiempo Adicional
        </h3>
        <Timer
          size="lg"
          confirmStop
          confirmMessage="Se detendrá la actividad y se guardará el tiempo registrado. ¿Continuar?"
          onComplete={saveElapsedTime}
        />

        {timer.elapsedSeconds > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-100 text-center">
            <p className="text-gray-600">
              Nuevo tiempo total:{' '}
              <span className="font-bold text-primary-600">
                {formatDuration(activity.durationMinutes + Math.ceil(timer.elapsedSeconds / 60))}
              </span>
            </p>
          </div>
        )}
      </div>

      {/* Income Section - Add while working */}
      <div className="card mb-6">
        <div className="flex items-center gap-3 mb-4">
          <DollarSign className="h-5 w-5 text-green-500" />
          <h3 className="text-lg font-semibold text-gray-900">Agregar Ingresos</h3>
        </div>

        <p className="text-sm text-gray-500 mb-4">
          Registra los ingresos mientras trabajas. Puedes agregar multiples veces.
        </p>

        <div className="grid grid-cols-2 gap-4 mb-4">
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
                value={newIncome || ''}
                onChange={(e) => setNewIncome(parseFloat(e.target.value) || 0)}
                className="input pl-7"
                placeholder="0.00"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Costos (opcional)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                $
              </span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={newCosts || ''}
                onChange={(e) => setNewCosts(parseFloat(e.target.value) || 0)}
                className="input pl-7"
                placeholder="0.00"
              />
            </div>
          </div>
        </div>

        <button
          onClick={handleAddIncome}
          disabled={newIncome === 0 && newCosts === 0}
          className="w-full flex items-center justify-center gap-2 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="h-4 w-4" />
          Agregar Ingreso
        </button>

        {/* Income History for this session */}
        {incomeHistory.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-sm font-medium text-gray-700 mb-2">Esta sesion:</p>
            <div className="space-y-2">
              {incomeHistory.map((h, i) => (
                <div key={i} className="flex items-center justify-between text-sm bg-gray-50 px-3 py-2 rounded-lg">
                  <span className="text-gray-500">
                    {h.time.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <div className="flex items-center gap-4">
                    {h.income > 0 && (
                      <span className="text-green-600">+{formatCurrency(h.income)}</span>
                    )}
                    {h.costs > 0 && (
                      <span className="text-red-500">-{formatCurrency(h.costs)}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between font-medium">
              <span className="text-gray-700">Total sesion:</span>
              <span className={cn(
                'text-lg',
                sessionIncome - sessionCosts >= 0 ? 'text-green-600' : 'text-red-600'
              )}>
                {formatCurrency(sessionIncome - sessionCosts)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-4">
        <button
          onClick={handleCancel}
          className="btn-secondary flex-1"
        >
          Cancelar
        </button>
        <button
          onClick={handleSave}
          disabled={getRealElapsed() === 0 && !timer.isRunning}
          className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save className="h-5 w-5" />
          Guardar Tiempo
        </button>
      </div>
    </div>
  );
}
