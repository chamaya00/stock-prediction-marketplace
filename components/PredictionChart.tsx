'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface PredictionChartProps {
  prediction: {
    currentPrice: number;
    price7d?: number | null;
    price28d?: number | null;
    price60d?: number | null;
    price90d?: number | null;
    price180d?: number | null;
    price365d?: number | null;
    actualPrice7d?: number | null;
    actualPrice28d?: number | null;
    actualPrice60d?: number | null;
    actualPrice90d?: number | null;
    actualPrice180d?: number | null;
    actualPrice365d?: number | null;
    createdAt: Date | string;
  };
  stockSymbol: string;
}

export default function PredictionChart({ prediction, stockSymbol }: PredictionChartProps) {
  const timeframes = [
    { days: 0, label: 'Now', predicted: prediction.currentPrice, actual: prediction.currentPrice },
    { days: 7, label: '7d', predicted: prediction.price7d, actual: prediction.actualPrice7d },
    { days: 28, label: '28d', predicted: prediction.price28d, actual: prediction.actualPrice28d },
    { days: 60, label: '60d', predicted: prediction.price60d, actual: prediction.actualPrice60d },
    { days: 90, label: '90d', predicted: prediction.price90d, actual: prediction.actualPrice90d },
    { days: 180, label: '180d', predicted: prediction.price180d, actual: prediction.actualPrice180d },
    { days: 365, label: '365d', predicted: prediction.price365d, actual: prediction.actualPrice365d },
  ];

  const chartData = timeframes
    .filter(tf => tf.predicted !== null && tf.predicted !== undefined)
    .map(tf => ({
      name: tf.label,
      days: tf.days,
      Predicted: tf.predicted,
      Actual: tf.actual,
    }));

  if (chartData.length === 0) {
    return (
      <div className="bg-gray-50 rounded-lg p-8 text-center text-gray-500">
        No prediction data available
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg p-6">
      <h3 className="text-xl font-semibold mb-4">
        {stockSymbol} - Prediction vs Actual
      </h3>

      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="name"
            label={{ value: 'Timeframe', position: 'insideBottom', offset: -5 }}
          />
          <YAxis
            label={{ value: 'Price ($)', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip
            formatter={(value: any) => `$${value?.toFixed(2)}`}
            labelFormatter={(label) => `Timeframe: ${label}`}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="Predicted"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={{ r: 5 }}
            activeDot={{ r: 7 }}
          />
          <Line
            type="monotone"
            dataKey="Actual"
            stroke="#10b981"
            strokeWidth={2}
            dot={{ r: 5 }}
            activeDot={{ r: 7 }}
            connectNulls={false}
          />
        </LineChart>
      </ResponsiveContainer>

      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
        {chartData.map((data) => {
          if (data.Actual === null || data.Actual === undefined) return null;

          const difference = data.Actual - data.Predicted;
          const percentageError = Math.abs((difference / data.Actual) * 100);
          const isAccurate = percentageError < 5;

          return (
            <div key={data.name} className="bg-gray-50 rounded p-3">
              <div className="text-sm text-gray-600 mb-1">{data.name}</div>
              <div className="text-xs space-y-1">
                <div>Predicted: ${data.Predicted.toFixed(2)}</div>
                <div>Actual: ${data.Actual.toFixed(2)}</div>
                <div className={`font-semibold ${isAccurate ? 'text-green-600' : 'text-red-600'}`}>
                  {difference >= 0 ? '+' : ''}{difference.toFixed(2)} ({percentageError.toFixed(2)}%)
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
