import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  FolderKanban,
  Clock,
  DollarSign,
  Target,
  TrendingUp,
  Pause,
  CheckCircle,
  XCircle,
  ChevronRight,
  Download,
  Upload
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { formatCurrency, formatDuration, cn } from '../lib/utils';
import type { Project, ProjectStatus } from '../types';

// Status configuration
const statusConfig: Record<ProjectStatus, { label: string; icon: React.ReactNode; color: string }> = {
  active: { label: 'Activo', icon: <TrendingUp className="h-4 w-4" />, color: '#22c55e' },
  paused: { label: 'Pausado', icon: <Pause className="h-4 w-4" />, color: '#f59e0b' },
  completed: { label: 'Completado', icon: <CheckCircle className="h-4 w-4" />, color: '#3b82f6' },
  cancelled: { label: 'Cancelado', icon: <XCircle className="h-4 w-4" />, color: '#ef4444' },
};

export function Projects() {
  const { projects, activities, setProjects } = useStore();
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'all'>('all');

  // Filter projects
  const filteredProjects = useMemo(() => {
    if (statusFilter === 'all') return projects;
    return projects.filter(p => p.status === statusFilter);
  }, [projects, statusFilter]);

  // Get activities for a project
  const getProjectActivities = (projectId: string) => {
    return activities.filter(a => a.projectId === projectId);
  };

  // Get current phase for a project
  const getCurrentPhase = (project: Project) => {
    return project.phases.find(p => p.id === project.currentPhaseId) || project.phases[0];
  };

  // Get phase progress
  const getPhaseProgress = (project: Project) => {
    const currentIndex = project.phases.findIndex(p => p.id === project.currentPhaseId);
    return Math.round(((currentIndex + 1) / project.phases.length) * 100);
  };

  // Calculate stats
  const stats = useMemo(() => {
    const active = projects.filter(p => p.status === 'active').length;
    const totalInvested = projects.reduce((sum, p) => sum + p.totalMinutes, 0);
    const totalExpectedIncome = projects.filter(p => p.status === 'active').reduce((sum, p) => sum + p.expectedIncome, 0);
    const totalActualIncome = projects.reduce((sum, p) => sum + p.actualIncome, 0);
    return { active, totalInvested, totalExpectedIncome, totalActualIncome };
  }, [projects]);

  // Export projects to JSON
  const handleExport = () => {
    const data = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      projects: projects,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kaizen-projects-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import projects from JSON
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.projects && Array.isArray(data.projects)) {
          const confirmImport = confirm(`Se importaran ${data.projects.length} proyectos. ¿Deseas continuar?`);
          if (confirmImport) {
            setProjects([...projects, ...data.projects]);
          }
        }
      } catch (error) {
        alert('Error al leer el archivo JSON');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Proyectos</h1>
          <p className="text-gray-500">Gestiona tus proyectos de inversion y desarrollo</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Export/Import */}
          <button
            onClick={handleExport}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600"
            title="Exportar proyectos"
          >
            <Download className="h-5 w-5" />
          </button>
          <label className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600 cursor-pointer" title="Importar proyectos">
            <Upload className="h-5 w-5" />
            <input type="file" accept=".json" onChange={handleImport} className="hidden" />
          </label>
          <Link
            to="/project/new"
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="h-5 w-5" />
            Nuevo Proyecto
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-50">
              <FolderKanban className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Proyectos activos</p>
              <p className="text-xl font-bold text-gray-900">{stats.active}</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-50">
              <Clock className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Tiempo invertido</p>
              <p className="text-xl font-bold text-gray-900">{formatDuration(stats.totalInvested)}</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-50">
              <Target className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Ingreso esperado</p>
              <p className="text-xl font-bold text-gray-900">{formatCurrency(stats.totalExpectedIncome)}</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-50">
              <DollarSign className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Ingreso real</p>
              <p className="text-xl font-bold text-gray-900">{formatCurrency(stats.totalActualIncome)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm text-gray-500">Filtrar:</span>
        <button
          onClick={() => setStatusFilter('all')}
          className={cn(
            'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
            statusFilter === 'all' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          )}
        >
          Todos ({projects.length})
        </button>
        {Object.entries(statusConfig).map(([key, config]) => {
          const count = projects.filter(p => p.status === key).length;
          return (
            <button
              key={key}
              onClick={() => setStatusFilter(key as ProjectStatus)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1',
                statusFilter === key ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              {config.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Projects List */}
      {filteredProjects.length === 0 ? (
        <div className="card text-center py-12">
          <FolderKanban className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 mb-4">
            {statusFilter === 'all'
              ? 'No tienes proyectos todavia'
              : `No hay proyectos con estado "${statusConfig[statusFilter].label}"`}
          </p>
          <Link
            to="/project/new"
            className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium"
          >
            <Plus className="h-4 w-4" />
            Crear primer proyecto
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredProjects.map((project) => {
            const currentPhase = getCurrentPhase(project);
            const status = statusConfig[project.status];
            const progress = getPhaseProgress(project);
            const projectActivities = getProjectActivities(project.id);

            return (
              <Link
                key={project.id}
                to={`/project/${project.id}`}
                className="card block hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div
                    className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                    style={{ backgroundColor: `${project.color}20` }}
                  >
                    {project.icon || '📦'}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-semibold text-gray-900 text-lg">{project.name}</h3>
                        <p className="text-sm text-gray-500 line-clamp-1">{project.description}</p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0" />
                    </div>

                    {/* Phase and Status */}
                    <div className="flex items-center gap-3 mt-3">
                      {currentPhase && (
                        <span
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium"
                          style={{ backgroundColor: `${currentPhase.color}20`, color: currentPhase.color }}
                        >
                          {currentPhase.icon}
                          {currentPhase.name}
                        </span>
                      )}
                      <span
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium"
                        style={{ backgroundColor: `${status.color}20`, color: status.color }}
                      >
                        {status.icon}
                        {status.label}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                        <span>Progreso ({project.phases.length} fases)</span>
                        <span>{progress}%</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${progress}%`, backgroundColor: currentPhase?.color || '#6b7280' }}
                        />
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-4 gap-4 mt-4 pt-4 border-t border-gray-100">
                      <div>
                        <p className="text-xs text-gray-500">Tiempo</p>
                        <p className="font-semibold text-gray-900">{formatDuration(project.totalMinutes)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Costos</p>
                        <p className="font-semibold text-red-600">{formatCurrency(project.totalCosts)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Ingreso</p>
                        <p className="font-semibold text-green-600">{formatCurrency(project.actualIncome)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Actividades</p>
                        <p className="font-semibold text-gray-900">{projectActivities.length}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
