import { useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Edit2,
  Trash2,
  Clock,
  DollarSign,
  Plus,
  TrendingUp,
  Pause,
  Play,
  CheckCircle,
  XCircle,
  Target,
  FileText,
  ChevronRight
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { formatCurrency, formatDuration, cn } from '../lib/utils';
import type { ProjectStatus, CustomPhase } from '../types';

const statusConfig: Record<ProjectStatus, { label: string; icon: React.ReactNode; color: string }> = {
  active: { label: 'Activo', icon: <TrendingUp className="h-4 w-4" />, color: '#22c55e' },
  paused: { label: 'Pausado', icon: <Pause className="h-4 w-4" />, color: '#f59e0b' },
  completed: { label: 'Completado', icon: <CheckCircle className="h-4 w-4" />, color: '#3b82f6' },
  cancelled: { label: 'Cancelado', icon: <XCircle className="h-4 w-4" />, color: '#ef4444' },
};

export function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { projects, activities, updateProject, deleteProject, categories } = useStore();

  const project = projects.find(p => p.id === id);
  const projectActivities = useMemo(() =>
    activities.filter(a => a.projectId === id).sort((a, b) => {
      const dateA = a.createdAt instanceof Date ? a.createdAt : a.createdAt?.toDate?.() || new Date();
      const dateB = b.createdAt instanceof Date ? b.createdAt : b.createdAt?.toDate?.() || new Date();
      return dateB.getTime() - dateA.getTime();
    }),
    [activities, id]
  );

  const [showPhaseModal, setShowPhaseModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);

  if (!project) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <p className="text-gray-500">Proyecto no encontrado</p>
        <button onClick={() => navigate('/projects')} className="btn-primary mt-4">
          Volver a Proyectos
        </button>
      </div>
    );
  }

  // Get current phase
  const currentPhase = project.phases.find(p => p.id === project.currentPhaseId) || project.phases[0];
  const currentPhaseIndex = project.phases.findIndex(p => p.id === project.currentPhaseId);
  const status = statusConfig[project.status];
  const profit = project.actualIncome - project.totalCosts;
  const roi = project.totalCosts > 0 ? (profit / project.totalCosts * 100) : 0;

  const handleDelete = () => {
    if (confirm('¿Estas seguro de eliminar este proyecto? Las actividades vinculadas no se eliminaran.')) {
      deleteProject(project.id);
      navigate('/projects');
    }
  };

  const handlePhaseChange = (phaseId: string) => {
    updateProject(project.id, { currentPhaseId: phaseId });
    setShowPhaseModal(false);
  };

  const handleStatusChange = (newStatus: ProjectStatus) => {
    updateProject(project.id, { status: newStatus });
    setShowStatusModal(false);
  };

  const getCategoryById = (catId: string) => categories.find(c => c.id === catId);

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/projects')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          <div className="flex items-center gap-4">
            <div
              className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl"
              style={{ backgroundColor: `${project.color}20` }}
            >
              {project.icon}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
              <p className="text-gray-500">{project.description}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleDelete}
            className="p-2 hover:bg-red-100 rounded-lg transition-colors text-red-500"
          >
            <Trash2 className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Status and Phase Controls */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <button
          onClick={() => setShowPhaseModal(true)}
          className="card hover:shadow-md transition-shadow text-left"
        >
          <p className="text-sm text-gray-500 mb-2">Fase actual</p>
          <div className="flex items-center justify-between">
            {currentPhase && (
              <span
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium"
                style={{ backgroundColor: `${currentPhase.color}20`, color: currentPhase.color }}
              >
                {currentPhase.icon}
                {currentPhase.name}
              </span>
            )}
            <ChevronRight className="h-5 w-5 text-gray-400" />
          </div>
        </button>

        <button
          onClick={() => setShowStatusModal(true)}
          className="card hover:shadow-md transition-shadow text-left"
        >
          <p className="text-sm text-gray-500 mb-2">Estado</p>
          <div className="flex items-center justify-between">
            <span
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium"
              style={{ backgroundColor: `${status.color}20`, color: status.color }}
            >
              {status.icon}
              {status.label}
            </span>
            <ChevronRight className="h-5 w-5 text-gray-400" />
          </div>
        </button>
      </div>

      {/* Phase Progress - Custom Phases */}
      <div className="card mb-6">
        <h3 className="text-sm font-medium text-gray-700 mb-4">Progreso del Proyecto</h3>
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {project.phases.map((phase, index) => {
            const isComplete = index < currentPhaseIndex;
            const isCurrent = phase.id === project.currentPhaseId;

            return (
              <div key={phase.id} className="flex items-center">
                <button
                  onClick={() => handlePhaseChange(phase.id)}
                  className="flex flex-col items-center group"
                >
                  <div
                    className={cn(
                      'w-12 h-12 rounded-full flex items-center justify-center transition-all text-lg',
                      isComplete && 'bg-green-500 text-white',
                      isCurrent && 'ring-2 ring-offset-2',
                      !isComplete && !isCurrent && 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                    )}
                    style={isCurrent ? { backgroundColor: phase.color, color: 'white', borderColor: phase.color } : {}}
                  >
                    {isComplete ? <CheckCircle className="h-6 w-6" /> : phase.icon}
                  </div>
                  <p className={cn(
                    'text-xs mt-1 text-center max-w-[80px] truncate',
                    isCurrent ? 'font-medium text-gray-900' : 'text-gray-500'
                  )}>
                    {phase.name}
                  </p>
                </button>
                {index < project.phases.length - 1 && (
                  <div className={cn(
                    'w-8 h-1 mx-1 rounded',
                    index < currentPhaseIndex ? 'bg-green-500' : 'bg-gray-200'
                  )} />
                )}
              </div>
            );
          })}
        </div>
        <p className="text-xs text-gray-500 mt-2 text-center">
          Click en una fase para cambiar a ella
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-50">
              <Clock className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Tiempo invertido</p>
              <p className="text-xl font-bold text-gray-900">{formatDuration(project.totalMinutes)}</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-50">
              <DollarSign className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Costos</p>
              <p className="text-xl font-bold text-red-600">{formatCurrency(project.totalCosts)}</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-50">
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Ingreso</p>
              <p className="text-xl font-bold text-green-600">{formatCurrency(project.actualIncome)}</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-50">
              <Target className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">ROI</p>
              <p className={cn(
                'text-xl font-bold',
                roi >= 0 ? 'text-green-600' : 'text-red-600'
              )}>
                {roi >= 0 ? '+' : ''}{roi.toFixed(1)}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Expected vs Actual */}
      {project.expectedIncome > 0 && (
        <div className="card mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Meta de Ingreso</h3>
            <span className="text-sm text-gray-500">
              {((project.actualIncome / project.expectedIncome) * 100).toFixed(1)}% alcanzado
            </span>
          </div>
          <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 rounded-full transition-all"
              style={{ width: `${Math.min(100, (project.actualIncome / project.expectedIncome) * 100)}%` }}
            />
          </div>
          <div className="flex items-center justify-between mt-2 text-sm">
            <span className="text-gray-500">Actual: {formatCurrency(project.actualIncome)}</span>
            <span className="text-gray-500">Meta: {formatCurrency(project.expectedIncome)}/mes</span>
          </div>
        </div>
      )}

      {/* Activities */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Actividades del Proyecto</h3>
          <Link
            to={`/activity/new?projectId=${project.id}`}
            className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
          >
            <Plus className="h-4 w-4" />
            Agregar actividad
          </Link>
        </div>

        {projectActivities.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="h-10 w-10 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500 text-sm">No hay actividades en este proyecto</p>
            <Link
              to={`/activity/new?projectId=${project.id}`}
              className="inline-flex items-center gap-1 text-primary-600 hover:text-primary-700 font-medium text-sm mt-2"
            >
              <Plus className="h-4 w-4" />
              Registrar primera actividad
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {projectActivities.slice(0, 10).map((activity) => {
              const category = getCategoryById(activity.categoryId);
              return (
                <Link
                  key={activity.id}
                  to={`/activity/edit/${activity.id}`}
                  className="block p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: category?.color || '#6B7280' }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{activity.name}</p>
                      <p className="text-sm text-gray-500">
                        {formatDuration(activity.durationMinutes)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={cn(
                        'font-semibold',
                        activity.profit >= 0 ? 'text-green-600' : 'text-red-600'
                      )}>
                        {activity.profit >= 0 ? '+' : ''}{formatCurrency(activity.profit)}
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })}
            {projectActivities.length > 10 && (
              <p className="text-center text-sm text-gray-500 pt-2">
                Y {projectActivities.length - 10} actividades mas...
              </p>
            )}
          </div>
        )}
      </div>

      {/* Phase Modal */}
      {showPhaseModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowPhaseModal(false)}>
          <div className="bg-white rounded-xl max-w-md w-full p-6 max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Cambiar Fase</h3>
            <div className="space-y-2">
              {project.phases.map((phase, index) => (
                <button
                  key={phase.id}
                  onClick={() => handlePhaseChange(phase.id)}
                  className={cn(
                    'w-full p-3 rounded-lg flex items-center gap-3 transition-colors',
                    project.currentPhaseId === phase.id ? 'bg-primary-50 ring-2 ring-primary-500' : 'hover:bg-gray-50'
                  )}
                >
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold">
                    {index + 1}
                  </div>
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                    style={{ backgroundColor: `${phase.color}20` }}
                  >
                    {phase.icon}
                  </div>
                  <span className="font-medium text-gray-900 flex-1 text-left">{phase.name}</span>
                  {project.currentPhaseId === phase.id && <CheckCircle className="h-5 w-5 text-primary-500" />}
                </button>
              ))}
            </div>
            <button onClick={() => setShowPhaseModal(false)} className="btn-secondary w-full mt-4">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Status Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowStatusModal(false)}>
          <div className="bg-white rounded-xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Cambiar Estado</h3>
            <div className="space-y-2">
              {Object.entries(statusConfig).map(([key, config]) => (
                <button
                  key={key}
                  onClick={() => handleStatusChange(key as ProjectStatus)}
                  className={cn(
                    'w-full p-3 rounded-lg flex items-center gap-3 transition-colors',
                    project.status === key ? 'bg-primary-50 ring-2 ring-primary-500' : 'hover:bg-gray-50'
                  )}
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${config.color}20`, color: config.color }}
                  >
                    {config.icon}
                  </div>
                  <span className="font-medium text-gray-900">{config.label}</span>
                  {project.status === key && <CheckCircle className="h-5 w-5 text-primary-500 ml-auto" />}
                </button>
              ))}
            </div>
            <button onClick={() => setShowStatusModal(false)} className="btn-secondary w-full mt-4">
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
