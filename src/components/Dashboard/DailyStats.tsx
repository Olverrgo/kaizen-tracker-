import { Clock, DollarSign, TrendingDown, Activity } from 'lucide-react';
import { formatCurrency, formatDuration, cn } from '../../lib/utils';

interface DailyStatsProps {
  totalIncome: number;
  totalCosts: number;
  productiveMinutes: number;
  wastedMinutes: number;
  activitiesCount: number;
}

export function DailyStats({
  totalIncome,
  totalCosts,
  productiveMinutes,
  wastedMinutes,
  activitiesCount,
}: DailyStatsProps) {
  const totalMinutes = productiveMinutes + wastedMinutes;
  const productivePercentage =
    totalMinutes > 0 ? Math.round((productiveMinutes / totalMinutes) * 100) : 0;

  const stats = [
    {
      label: 'Ingresos',
      value: formatCurrency(totalIncome),
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      label: 'Costos',
      value: formatCurrency(totalCosts),
      icon: TrendingDown,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
    {
      label: 'Tiempo productivo',
      value: formatDuration(productiveMinutes),
      subtext: `${productivePercentage}% del total`,
      icon: Clock,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      label: 'Actividades',
      value: activitiesCount.toString(),
      subtext: 'completadas hoy',
      icon: Activity,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <div key={stat.label} className="card">
          <div className="flex items-center gap-3">
            <div className={cn('p-2 rounded-lg', stat.bgColor)}>
              <stat.icon className={cn('h-5 w-5', stat.color)} />
            </div>
            <div>
              <p className="text-sm text-gray-500">{stat.label}</p>
              <p className="text-xl font-bold text-gray-900">{stat.value}</p>
              {stat.subtext && (
                <p className="text-xs text-gray-400">{stat.subtext}</p>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
