import { Clock, ArrowRight, Play, Edit2, FileText, Image } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import type { Activity, Category } from '../../types';
import { formatCurrency, formatDuration, formatRelativeTime, cn } from '../../lib/utils';
import { useStore } from '../../store/useStore';

interface RecentActivitiesProps {
  activities: Activity[];
  categories: Category[];
}

export function RecentActivities({ activities, categories }: RecentActivitiesProps) {
  const navigate = useNavigate();
  const { startTimer } = useStore();

  const getCategoryById = (id: string) =>
    categories.find((c) => c.id === id);

  const handleContinue = (activity: Activity) => {
    // Start timer for this activity and navigate to continue page
    startTimer(activity.id);
    navigate(`/activity/continue/${activity.id}`);
  };

  const handleEdit = (activity: Activity) => {
    navigate(`/activity/edit/${activity.id}`);
  };

  if (activities.length === 0) {
    return (
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Actividades Recientes
        </h2>
        <div className="text-center py-8">
          <Clock className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No hay actividades hoy</p>
          <Link
            to="/activity/new"
            className="inline-flex items-center gap-1 text-primary-600 hover:text-primary-700 font-medium mt-2"
          >
            Registrar primera actividad
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">
          Actividades de Hoy
        </h2>
        <Link
          to="/history"
          className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
        >
          Ver todas
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="space-y-3">
        {activities.slice(0, 5).map((activity) => {
          const category = getCategoryById(activity.categoryId);

          const startTimeDate = activity.startTime instanceof Date
            ? activity.startTime
            : (activity.startTime?.toDate?.() || new Date(activity.startTime as any));

          return (
            <div
              key={activity.id}
              className="p-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-100"
            >
              <div className="flex items-center gap-3">
                {/* Category indicator */}
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: category?.color || '#6B7280' }}
                />

                {/* Activity info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-900 truncate">
                      {activity.name}
                    </p>
                    {/* Indicators for notes/images */}
                    {activity.notes && activity.notes.trim().length > 0 && (
                      <FileText className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                    )}
                    {activity.images && activity.images.length > 0 && (
                      <Image className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-sm text-gray-500">
                    {category?.name || 'Sin categoria'} • {formatDuration(activity.durationMinutes)}
                  </p>
                </div>

                {/* Profit */}
                <div className="text-right">
                  <p
                    className={cn(
                      'font-semibold',
                      activity.profit >= 0 ? 'text-green-600' : 'text-red-600'
                    )}
                  >
                    {activity.profit >= 0 ? '+' : ''}
                    {formatCurrency(activity.profit)}
                  </p>
                  <p className="text-xs text-gray-400">
                    {formatRelativeTime(startTimeDate)}
                  </p>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                <button
                  onClick={() => handleContinue(activity)}
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 bg-primary-50 text-primary-600 rounded-lg hover:bg-primary-100 transition-colors text-sm font-medium"
                >
                  <Play className="h-3.5 w-3.5" />
                  Continuar
                </button>
                <button
                  onClick={() => handleEdit(activity)}
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                  Editar
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
