import { useMemo } from 'react';
import { format, subDays, startOfWeek, endOfWeek } from 'date-fns';
import { Target, TrendingUp, Award, Flame } from 'lucide-react';
import { useStore } from '../store/useStore';
import { formatCurrency, cn } from '../lib/utils';

// Helper to get date from activity
function getActivityDate(startTime: any): Date | null {
  if (!startTime) return null;
  if (startTime instanceof Date) return startTime;
  if (startTime?.toDate) return startTime.toDate();
  return new Date(startTime);
}

export function Goals() {
  const { activities, settings } = useStore();

  // Calculate streak (consecutive days meeting goal)
  const streak = useMemo(() => {
    let count = 0;
    for (let i = 0; i < 365; i++) {
      const date = subDays(new Date(), i);
      const dateString = format(date, 'yyyy-MM-dd');
      const dayProfit = activities
        .filter((a) => {
          const activityDate = getActivityDate(a.startTime);
          return activityDate && format(activityDate, 'yyyy-MM-dd') === dateString;
        })
        .reduce((sum, a) => sum + a.profit, 0);

      if (dayProfit >= settings.dailyProfitTarget) {
        count++;
      } else if (i > 0) {
        break;
      }
    }
    return count;
  }, [activities, settings.dailyProfitTarget]);

  // Calculate weekly stats
  const weeklyStats = useMemo(() => {
    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });

    const weekActivities = activities.filter((a) => {
      const date = getActivityDate(a.startTime);
      return date && date >= weekStart && date <= weekEnd;
    });

    const totalProfit = weekActivities.reduce((sum, a) => sum + a.profit, 0);
    const weeklyTarget = settings.dailyProfitTarget * 7;
    const achievement = weeklyTarget > 0 ? Math.round((totalProfit / weeklyTarget) * 100) : 0;

    return {
      totalProfit,
      weeklyTarget,
      achievement,
      daysCount: 7,
    };
  }, [activities, settings.dailyProfitTarget]);

  // Kaizen improvement suggestions
  const suggestions = useMemo(() => {
    const tips = [];

    // Check time efficiency
    const avgDuration = activities.length > 0
      ? activities.reduce((sum, a) => sum + a.durationMinutes, 0) / activities.length
      : 0;

    if (avgDuration > 120) {
      tips.push({
        title: 'Considera dividir actividades largas',
        description: 'Las actividades de mas de 2 horas pueden beneficiarse de pausas',
        icon: '⏰',
      });
    }

    // Check waste
    const wastedActivities = activities.filter((a) => !a.isProductive);
    if (wastedActivities.length > activities.length * 0.2) {
      tips.push({
        title: 'Reduce el tiempo no productivo',
        description: 'Mas del 20% de tus actividades son marcadas como desperdicio',
        icon: '🎯',
      });
    }

    // Check profitability
    const avgProfit = activities.length > 0
      ? activities.reduce((sum, a) => sum + a.profit, 0) / activities.length
      : 0;

    if (avgProfit < settings.dailyProfitTarget / 5) {
      tips.push({
        title: 'Enfocate en actividades de alto valor',
        description: 'Tu ganancia promedio por actividad podria mejorar',
        icon: '💰',
      });
    }

    // Default tips
    if (tips.length === 0) {
      tips.push({
        title: 'Sigue asi!',
        description: 'Tu productividad se ve bien. Mantente enfocado en la mejora continua',
        icon: '✨',
      });
    }

    return tips;
  }, [activities, settings.dailyProfitTarget]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Metas Kaizen</h1>
        <p className="text-gray-500">Tu progreso hacia la mejora continua</p>
      </div>

      {/* Streak & Achievement Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Streak */}
        <div className="card bg-gradient-to-br from-orange-50 to-yellow-50 border-orange-100">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-orange-100 rounded-xl">
              <Flame className="h-8 w-8 text-orange-500" />
            </div>
            <div>
              <p className="text-sm text-orange-600 font-medium">Racha actual</p>
              <p className="text-4xl font-bold text-orange-700">{streak}</p>
              <p className="text-sm text-orange-600">dias consecutivos</p>
            </div>
          </div>
        </div>

        {/* Weekly Progress */}
        <div className="card bg-gradient-to-br from-primary-50 to-green-50 border-primary-100">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary-100 rounded-xl">
              <TrendingUp className="h-8 w-8 text-primary-500" />
            </div>
            <div>
              <p className="text-sm text-primary-600 font-medium">Esta semana</p>
              <p className="text-4xl font-bold text-primary-700">
                {weeklyStats.achievement}%
              </p>
              <p className="text-sm text-primary-600">de tu meta semanal</p>
            </div>
          </div>
        </div>

        {/* Daily Target */}
        <div className="card bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-xl">
              <Target className="h-8 w-8 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-blue-600 font-medium">Meta diaria</p>
              <p className="text-4xl font-bold text-blue-700">
                {formatCurrency(settings.dailyProfitTarget)}
              </p>
              <p className="text-sm text-blue-600">objetivo de ganancia</p>
            </div>
          </div>
        </div>
      </div>

      {/* Weekly Progress Bar */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Progreso Semanal
          </h2>
          <span className="text-sm text-gray-500">
            {formatCurrency(weeklyStats.totalProfit)} / {formatCurrency(weeklyStats.weeklyTarget)}
          </span>
        </div>

        <div className="h-6 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={cn(
              'h-full transition-all duration-500',
              weeklyStats.achievement >= 100
                ? 'bg-gradient-to-r from-green-400 to-green-600'
                : 'bg-gradient-to-r from-primary-400 to-primary-600'
            )}
            style={{ width: `${Math.min(weeklyStats.achievement, 100)}%` }}
          />
        </div>

        <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
          <span>0%</span>
          <span>50%</span>
          <span>100%</span>
        </div>
      </div>

      {/* Kaizen Suggestions */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Award className="h-5 w-5 text-primary-500" />
          <h2 className="text-lg font-semibold text-gray-900">
            Sugerencias de Mejora
          </h2>
        </div>

        <div className="space-y-3">
          {suggestions.map((tip, index) => (
            <div
              key={index}
              className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg"
            >
              <span className="text-2xl">{tip.icon}</span>
              <div>
                <p className="font-medium text-gray-900">{tip.title}</p>
                <p className="text-sm text-gray-500">{tip.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 1% Daily Improvement */}
      <div className="card bg-gradient-to-r from-gray-900 to-gray-800 text-white">
        <div className="flex items-center gap-4">
          <div className="text-5xl">🎯</div>
          <div>
            <h3 className="text-xl font-bold">Filosofia Kaizen</h3>
            <p className="text-gray-300 mt-1">
              Mejora un 1% cada dia. En un ano, seras 37 veces mejor.
            </p>
            <p className="text-2xl font-bold mt-2 text-primary-400">
              1.01<sup>365</sup> = 37.78
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
