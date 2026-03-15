import { TrendingUp, Target } from 'lucide-react';
import { formatCurrency, calculatePercentage, cn } from '../../lib/utils';

interface ProgressCardProps {
  currentProfit: number;
  targetProfit: number;
}

export function ProgressCard({ currentProfit, targetProfit }: ProgressCardProps) {
  const percentage = calculatePercentage(currentProfit, targetProfit);
  const remaining = Math.max(0, targetProfit - currentProfit);
  const isGoalReached = percentage >= 100;

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Target className="h-5 w-5 text-primary-500" />
          Meta del Dia
        </h2>
        <span
          className={cn(
            'text-sm font-medium px-3 py-1 rounded-full',
            isGoalReached
              ? 'bg-green-100 text-green-700'
              : 'bg-yellow-100 text-yellow-700'
          )}
        >
          {percentage}%
        </span>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="progress-bar">
          <div
            className={cn(
              'progress-bar-fill',
              isGoalReached && 'from-green-400 to-green-600'
            )}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-gray-500">Ganancia actual</p>
          <p className="text-2xl font-bold text-gray-900">
            {formatCurrency(currentProfit)}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-500">
            {isGoalReached ? 'Excedente' : 'Falta para meta'}
          </p>
          <p
            className={cn(
              'text-2xl font-bold',
              isGoalReached ? 'text-green-600' : 'text-gray-900'
            )}
          >
            {isGoalReached
              ? `+${formatCurrency(currentProfit - targetProfit)}`
              : formatCurrency(remaining)}
          </p>
        </div>
      </div>

      {/* Goal indicator */}
      <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
        <span className="text-sm text-gray-500">
          Meta: {formatCurrency(targetProfit)}
        </span>
        {isGoalReached && (
          <span className="flex items-center gap-1 text-sm text-green-600 font-medium">
            <TrendingUp className="h-4 w-4" />
            Meta alcanzada!
          </span>
        )}
      </div>
    </div>
  );
}
