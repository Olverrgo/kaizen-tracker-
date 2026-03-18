import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Calendar, TrendingUp, Clock, FileText, Image, Edit2, X, ZoomIn, Play, RotateCcw } from 'lucide-react';
import { useStore } from '../store/useStore';
import { formatCurrency, formatDuration, formatDateShort, cn } from '../lib/utils';

// Helper to get date from activity (works with Date or Timestamp)
function getActivityDate(startTime: any): Date | null {
  if (!startTime) return null;
  if (startTime instanceof Date) return startTime;
  if (startTime?.toDate) return startTime.toDate();
  return new Date(startTime);
}

export function History() {
  const navigate = useNavigate();
  const { activities, categories, settings, timer } = useStore();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [expandedActivityId, setExpandedActivityId] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Get days in current month
  const daysInMonth = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  // Calculate profit for each day
  const dailyProfits = useMemo(() => {
    const profits: Record<string, number> = {};
    activities.forEach((activity) => {
      const date = getActivityDate(activity.startTime);
      if (date) {
        const dateString = format(date, 'yyyy-MM-dd');
        profits[dateString] = (profits[dateString] || 0) + activity.profit;
      }
    });
    return profits;
  }, [activities]);

  // Get activities for selected date (include running activity from other days if viewing today)
  const selectedDateActivities = useMemo(() => {
    if (!selectedDate) return [];
    const dayActs = activities.filter((a) => {
      const date = getActivityDate(a.startTime);
      return date && isSameDay(date, selectedDate);
    });

    // If viewing today and there's a running activity from another day, include it
    if (isSameDay(selectedDate, new Date()) && timer.isRunning && timer.currentActivityId) {
      const runningActivity = activities.find(a => a.id === timer.currentActivityId);
      if (runningActivity && !dayActs.some(a => a.id === runningActivity.id)) {
        return [runningActivity, ...dayActs];
      }
    }

    return dayActs;
  }, [activities, selectedDate, timer.isRunning, timer.currentActivityId]);

  // Monthly stats
  const monthlyStats = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const monthActivities = activities.filter((a) => {
      const date = getActivityDate(a.startTime);
      return date && date >= monthStart && date <= monthEnd;
    });

    const totalProfit = monthActivities.reduce((sum, a) => sum + a.profit, 0);
    const totalMinutes = monthActivities.reduce((sum, a) => sum + a.durationMinutes, 0);
    const daysWithGoal = Object.values(dailyProfits).filter(
      (p) => p >= settings.dailyProfitTarget
    ).length;

    return {
      totalProfit,
      totalMinutes,
      activitiesCount: monthActivities.length,
      daysWithGoal,
    };
  }, [activities, currentMonth, dailyProfits, settings.dailyProfitTarget]);

  const getCategoryById = (id: string) => categories.find((c) => c.id === id);

  const getColorForProfit = (profit: number): string => {
    if (profit >= settings.dailyProfitTarget) return 'bg-green-500';
    if (profit >= settings.dailyProfitTarget * 0.75) return 'bg-yellow-500';
    if (profit >= settings.dailyProfitTarget * 0.5) return 'bg-orange-500';
    if (profit > 0) return 'bg-red-300';
    return 'bg-gray-100';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Historial</h1>
        <p className="text-gray-500">Revisa tu progreso y actividades pasadas</p>
      </div>

      {/* Monthly Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-50">
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Ganancia del mes</p>
              <p className="text-xl font-bold text-gray-900">
                {formatCurrency(monthlyStats.totalProfit)}
              </p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-50">
              <Clock className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Tiempo trabajado</p>
              <p className="text-xl font-bold text-gray-900">
                {formatDuration(monthlyStats.totalMinutes)}
              </p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-50">
              <Calendar className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Dias con meta</p>
              <p className="text-xl font-bold text-gray-900">
                {monthlyStats.daysWithGoal}
              </p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-50">
              <TrendingUp className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Actividades</p>
              <p className="text-xl font-bold text-gray-900">
                {monthlyStats.activitiesCount}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2 card">
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() =>
                setCurrentMonth(
                  new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1)
                )
              }
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <h2 className="text-lg font-semibold text-gray-900 capitalize">
              {format(currentMonth, 'MMMM yyyy', { locale: es })}
            </h2>
            <button
              onClick={() =>
                setCurrentMonth(
                  new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1)
                )
              }
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          {/* Day Names */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'].map((day) => (
              <div
                key={day}
                className="text-center text-sm font-medium text-gray-500 py-2"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Empty cells for days before month starts */}
            {Array.from({
              length: (daysInMonth[0].getDay() + 6) % 7,
            }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square" />
            ))}

            {/* Day cells */}
            {daysInMonth.map((day) => {
              const dateString = format(day, 'yyyy-MM-dd');
              const profit = dailyProfits[dateString] || 0;
              const isSelected = selectedDate && isSameDay(day, selectedDate);
              const isToday = isSameDay(day, new Date());
              // Show running indicator if today has a running timer
              const hasRunning = isToday && timer.isRunning && timer.currentActivityId;

              return (
                <button
                  key={dateString}
                  onClick={() => setSelectedDate(day)}
                  className={cn(
                    'aspect-square rounded-lg flex flex-col items-center justify-center transition-all relative',
                    isSelected && 'ring-2 ring-primary-500 ring-offset-2',
                    isToday && 'font-bold',
                    'hover:bg-gray-50'
                  )}
                >
                  <span className="text-sm text-gray-700">
                    {format(day, 'd')}
                  </span>
                  <div className="flex items-center gap-0.5 mt-1">
                    {profit !== 0 && (
                      <div
                        className={cn(
                          'w-2 h-2 rounded-full',
                          getColorForProfit(profit)
                        )}
                      />
                    )}
                    {hasRunning && (
                      <div className="w-2 h-2 rounded-full bg-primary-500 animate-pulse" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="text-xs text-gray-500">Meta lograda</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <span className="text-xs text-gray-500">75%+</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-orange-500" />
              <span className="text-xs text-gray-500">50%+</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-red-300" />
              <span className="text-xs text-gray-500">&lt;50%</span>
            </div>
          </div>
        </div>

        {/* Selected Date Details */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {selectedDate
              ? format(selectedDate, "d 'de' MMMM", { locale: es })
              : 'Selecciona un dia'}
          </h3>

          {selectedDate ? (
            selectedDateActivities.length > 0 ? (
              <div className="space-y-3">
                {selectedDateActivities.map((activity) => {
                  const category = getCategoryById(activity.categoryId);
                  const isExpanded = expandedActivityId === activity.id;
                  const hasNotes = activity.notes && activity.notes.trim().length > 0;
                  const hasImages = activity.images && activity.images.length > 0;

                  const actDate = getActivityDate(activity.startTime);
                  const isContinuation = selectedDate && actDate && !isSameDay(actDate, selectedDate);
                  const isRunning = timer.isRunning && timer.currentActivityId === activity.id;

                  return (
                    <div
                      key={activity.id}
                      className={cn(
                        "rounded-lg overflow-hidden",
                        isRunning ? "bg-primary-50 border border-primary-200" : "bg-gray-50"
                      )}
                    >
                      {/* Continuation badge */}
                      {isContinuation && actDate && (
                        <div className="flex items-center gap-1.5 mx-3 mt-2 px-2 py-1 bg-amber-50 border border-amber-200 rounded-md w-fit">
                          <RotateCcw className="h-3 w-3 text-amber-600" />
                          <span className="text-xs font-medium text-amber-700">
                            Continuacion · Inicio: {formatDateShort(actDate)}
                          </span>
                        </div>
                      )}

                      {/* Header - clickable to expand */}
                      <button
                        onClick={() => setExpandedActivityId(isExpanded ? null : activity.id)}
                        className="w-full p-3 text-left hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <div
                            className={cn(
                              "w-2 h-2 rounded-full flex-shrink-0",
                              isRunning && "animate-pulse"
                            )}
                            style={{ backgroundColor: category?.color || '#6B7280' }}
                          />
                          <span className="font-medium text-gray-900 text-sm flex-1">
                            {activity.name}
                          </span>
                          {isRunning && (
                            <span className="text-xs font-medium text-primary-600 bg-primary-100 px-1.5 py-0.5 rounded">En curso</span>
                          )}
                          {/* Indicators for notes/images */}
                          {hasNotes && (
                            <FileText className="h-3.5 w-3.5 text-gray-400" />
                          )}
                          {hasImages && (
                            <Image className="h-3.5 w-3.5 text-gray-400" />
                          )}
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">
                            {formatDuration(activity.durationMinutes)}
                          </span>
                          <span
                            className={cn(
                              'font-medium',
                              activity.profit >= 0
                                ? 'text-green-600'
                                : 'text-red-600'
                            )}
                          >
                            {activity.profit >= 0 ? '+' : ''}
                            {formatCurrency(activity.profit)}
                          </span>
                        </div>
                      </button>

                      {/* Expanded content */}
                      {isExpanded && (
                        <div className="px-3 pb-3 border-t border-gray-200 pt-3 space-y-3">
                          {/* Description */}
                          {activity.description && (
                            <p className="text-sm text-gray-600">
                              {activity.description}
                            </p>
                          )}

                          {/* Notes */}
                          {hasNotes && (
                            <div className="bg-white rounded-lg p-2 border border-gray-200">
                              <div className="flex items-center gap-1.5 mb-1">
                                <FileText className="h-3.5 w-3.5 text-primary-500" />
                                <span className="text-xs font-medium text-gray-700">Notas</span>
                              </div>
                              <p className="text-sm text-gray-600 whitespace-pre-wrap">
                                {activity.notes}
                              </p>
                            </div>
                          )}

                          {/* Images */}
                          {hasImages && (
                            <div>
                              <div className="flex items-center gap-1.5 mb-2">
                                <Image className="h-3.5 w-3.5 text-primary-500" />
                                <span className="text-xs font-medium text-gray-700">
                                  Imagenes ({activity.images!.length})
                                </span>
                              </div>
                              <div className="grid grid-cols-3 gap-1">
                                {activity.images!.map((img) => (
                                  <button
                                    key={img.id}
                                    onClick={() => setPreviewImage(img.data)}
                                    className="aspect-square rounded overflow-hidden group relative"
                                  >
                                    <img
                                      src={img.data}
                                      alt={img.name}
                                      className="w-full h-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                      <ZoomIn className="h-4 w-4 text-white" />
                                    </div>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Action buttons */}
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => navigate(`/activity/continue/${activity.id}`)}
                              className="flex-1 flex items-center justify-center gap-2 py-2 bg-primary-50 text-primary-600 rounded-lg text-sm font-medium hover:bg-primary-100 transition-colors"
                            >
                              <Play className="h-4 w-4" />
                              Continuar
                            </button>
                            <button
                              onClick={() => navigate(`/activity/edit/${activity.id}`)}
                              className="flex-1 flex items-center justify-center gap-2 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                            >
                              <Edit2 className="h-4 w-4" />
                              Editar
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Day Total */}
                <div className="pt-3 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-700">Total</span>
                    <span className="font-bold text-gray-900">
                      {formatCurrency(
                        selectedDateActivities.reduce(
                          (sum, a) => sum + a.profit,
                          0
                        )
                      )}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-sm">
                No hay actividades en este dia
              </p>
            )
          ) : (
            <p className="text-gray-500 text-sm">
              Haz clic en un dia del calendario para ver las actividades
            </p>
          )}
        </div>
      </div>

      {/* Image Preview Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
        >
          <button
            onClick={() => setPreviewImage(null)}
            className="absolute top-4 right-4 p-2 bg-white rounded-full hover:bg-gray-100"
          >
            <X className="h-6 w-6" />
          </button>
          <img
            src={previewImage}
            alt="Preview"
            className="max-w-full max-h-full object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
