import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { TrendingUp } from 'lucide-react';
import { formatCurrency } from '../../lib/utils';

interface ChartDataPoint {
  date: string;
  dayName: string;
  profit: number;
  target: number;
}

interface WeeklyChartProps {
  data: ChartDataPoint[];
  targetProfit: number;
}

export function WeeklyChart({ data, targetProfit }: WeeklyChartProps) {
  const avgProfit =
    data.length > 0
      ? data.reduce((sum, d) => sum + d.profit, 0) / data.length
      : 0;

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary-500" />
          Tendencia Semanal
        </h2>
        <div className="text-right">
          <p className="text-sm text-gray-500">Promedio diario</p>
          <p className="text-lg font-bold text-gray-900">
            {formatCurrency(avgProfit)}
          </p>
        </div>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="dayName"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#6B7280', fontSize: 12 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#6B7280', fontSize: 12 }}
              tickFormatter={(value) => `$${value}`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              }}
              formatter={(value) => [formatCurrency(value as number), 'Ganancia']}
              labelFormatter={(label) => `Dia: ${label}`}
            />
            <ReferenceLine
              y={targetProfit}
              stroke="#f59e0b"
              strokeDasharray="5 5"
              label={{
                value: `Meta: ${formatCurrency(targetProfit)}`,
                fill: '#f59e0b',
                fontSize: 11,
                position: 'right',
              }}
            />
            <Area
              type="monotone"
              dataKey="profit"
              stroke="#22c55e"
              strokeWidth={2}
              fill="url(#profitGradient)"
              dot={{ fill: '#22c55e', strokeWidth: 2 }}
              activeDot={{ r: 6, fill: '#16a34a' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span className="text-sm text-gray-600">Ganancia diaria</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-0.5 bg-yellow-500" style={{ borderStyle: 'dashed' }} />
          <span className="text-sm text-gray-600">Meta</span>
        </div>
      </div>
    </div>
  );
}
