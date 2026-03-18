import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { PlusCircle, Sparkles } from 'lucide-react';
import { format, subDays } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  ProgressCard,
  DailyStats,
  RecentActivities,
  WeeklyChart,
  AISummaryModal,
} from '../components/Dashboard';
import { Timer } from '../components/Timer';
import { useStore } from '../store/useStore';
import { getTodayString, formatDate } from '../lib/utils';

export function Dashboard() {
  const { activities, categories, settings } = useStore();
  const today = getTodayString();
  const [showAISummary, setShowAISummary] = useState(false);

  // Filter today's activities
  const todayActivities = useMemo(() => {
    return activities.filter((a) => {
      const activityDate = a.startTime instanceof Date ? a.startTime : (a.startTime?.toDate?.() || new Date(a.startTime as any));
      if (!activityDate) return false;
      return format(activityDate, 'yyyy-MM-dd') === today;
    });
  }, [activities, today]);

  // Calculate today's metrics
  const todayMetrics = useMemo(() => {
    return todayActivities.reduce(
      (acc, activity) => ({
        totalIncome: acc.totalIncome + activity.income,
        totalCosts: acc.totalCosts + activity.costs,
        totalProfit: acc.totalProfit + activity.profit,
        productiveMinutes:
          acc.productiveMinutes +
          (activity.isProductive ? activity.durationMinutes : 0),
        wastedMinutes:
          acc.wastedMinutes +
          (!activity.isProductive ? activity.durationMinutes : 0),
      }),
      {
        totalIncome: 0,
        totalCosts: 0,
        totalProfit: 0,
        productiveMinutes: 0,
        wastedMinutes: 0,
      }
    );
  }, [todayActivities]);

  // Generate weekly chart data
  const weeklyData = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dateString = format(date, 'yyyy-MM-dd');
      const dayActivities = activities.filter((a) => {
        const activityDate = a.startTime instanceof Date ? a.startTime : (a.startTime?.toDate?.() || new Date(a.startTime as any));
        if (!activityDate) return false;
        return format(activityDate, 'yyyy-MM-dd') === dateString;
      });
      const profit = dayActivities.reduce((sum, a) => sum + a.profit, 0);

      days.push({
        date: dateString,
        dayName: format(date, 'EEE', { locale: es }),
        profit,
        target: settings.dailyProfitTarget,
      });
    }
    return days;
  }, [activities, settings.dailyProfitTarget]);

  // Kaizen tip of the day
  const kaizenTips = [
    'Pequenos cambios diarios generan grandes resultados',
    'Mide todo lo que puedas mejorar',
    'Elimina actividades que no agregan valor',
    'Cada minuto ahorrado suma a tu productividad',
    'La consistencia supera a la intensidad',
    'Revisa tus metricas al final del dia',
    'Identifica y reduce desperdicios de tiempo',
  ];
  const tipOfDay = kaizenTips[new Date().getDay()];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500">{formatDate(new Date())}</p>
        </div>
        <div className="flex items-center gap-3">
          {settings.aiCoachEnabled !== false && (
            <button
              onClick={() => setShowAISummary(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-primary-500 to-green-500 text-white hover:from-primary-600 hover:to-green-600 transition-all shadow-sm"
            >
              <Sparkles className="h-4 w-4" />
              Resumen IA
            </button>
          )}
          <Link
            to="/activity/new"
            className="btn-primary flex items-center gap-2"
          >
            <PlusCircle className="h-5 w-5" />
            Nueva Actividad
          </Link>
        </div>
      </div>

      {/* Kaizen Tip */}
      <div className="bg-gradient-to-r from-primary-50 to-green-50 border border-primary-100 rounded-xl p-4 flex items-center gap-3">
        <Sparkles className="h-6 w-6 text-primary-500 flex-shrink-0" />
        <div>
          <p className="text-sm font-medium text-primary-700">
            Tip Kaizen del dia
          </p>
          <p className="text-primary-600">{tipOfDay}</p>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Progress & Timer */}
        <div className="lg:col-span-2 space-y-6">
          <ProgressCard
            currentProfit={todayMetrics.totalProfit}
            targetProfit={settings.dailyProfitTarget}
          />
          <DailyStats
            totalIncome={todayMetrics.totalIncome}
            totalCosts={todayMetrics.totalCosts}
            productiveMinutes={todayMetrics.productiveMinutes}
            wastedMinutes={todayMetrics.wastedMinutes}
            activitiesCount={todayActivities.length}
          />
          <WeeklyChart
            data={weeklyData}
            targetProfit={settings.dailyProfitTarget}
          />
        </div>

        {/* Right Column - Timer & Recent */}
        <div className="space-y-6">
          {/* Quick Timer */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Cronometro Rapido
            </h2>
            <Timer
              size="md"
              onComplete={(seconds) => {
                console.log('Timer completed:', seconds);
              }}
            />
          </div>

          {/* Recent Activities */}
          <RecentActivities
            activities={todayActivities}
            categories={categories}
          />
        </div>
      </div>
      {/* AI Summary Modal */}
      <AISummaryModal
        isOpen={showAISummary}
        onClose={() => setShowAISummary(false)}
      />
    </div>
  );
}
