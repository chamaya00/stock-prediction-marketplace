'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  ComposedChart,
} from 'recharts';

interface HistoricalPrice {
  date: string;
  close: number;
}

interface FuturePrediction {
  date: string;
  p5: number;
  p50: number;
  p95: number;
  count: number;
}

interface StockPredictionChartProps {
  symbol: string;
  name: string;
  historicalPrices: HistoricalPrice[];
  futurePredictions: FuturePrediction[];
  predictionCount: number;
}

export default function StockPredictionChart({
  symbol,
  name,
  historicalPrices,
  futurePredictions,
  predictionCount,
}: StockPredictionChartProps) {
  // Combine historical and future data
  const chartData = [
    ...historicalPrices.map((price) => ({
      date: price.date,
      actual: price.close,
      p5: null,
      p50: null,
      p95: null,
      type: 'historical',
    })),
    ...futurePredictions.map((pred) => ({
      date: pred.date,
      actual: null,
      p5: pred.p5,
      p50: pred.p50,
      p95: pred.p95,
      type: 'future',
      count: pred.count,
    })),
  ].sort((a, b) => a.date.localeCompare(b.date));

  if (chartData.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h3 className="text-xl font-semibold mb-2">
          {symbol} - {name}
        </h3>
        <div className="bg-gray-50 rounded-lg p-8 text-center text-gray-500">
          No data available for this stock
        </div>
      </div>
    );
  }

  // Format date for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload) return null;

    const data = payload[0]?.payload;
    if (!data) return null;

    return (
      <div className="bg-white border border-gray-300 rounded-lg p-3 shadow-lg">
        <p className="font-semibold mb-2">{formatDate(label)}</p>
        {data.type === 'historical' && data.actual && (
          <p className="text-sm text-blue-600">
            Actual: ${data.actual.toFixed(2)}
          </p>
        )}
        {data.type === 'future' && (
          <>
            <p className="text-sm text-green-600">
              P50 (Median): ${data.p50?.toFixed(2)}
            </p>
            <p className="text-sm text-green-400">
              P95: ${data.p95?.toFixed(2)}
            </p>
            <p className="text-sm text-yellow-600">
              P5: ${data.p5?.toFixed(2)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {data.count} prediction{data.count !== 1 ? 's' : ''}
            </p>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-semibold">
            {symbol} - {name}
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            {predictionCount} total prediction{predictionCount !== 1 ? 's' : ''} •
            {futurePredictions.length} future date{futurePredictions.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={400}>
        <ComposedChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="date"
            tickFormatter={formatDate}
            angle={-45}
            textAnchor="end"
            height={80}
            tick={{ fontSize: 11 }}
          />
          <YAxis
            label={{ value: 'Price ($)', angle: -90, position: 'insideLeft' }}
            tick={{ fontSize: 12 }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="line"
          />

          {/* Historical actual prices */}
          <Line
            type="monotone"
            dataKey="actual"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={false}
            name="Actual Price"
            connectNulls={false}
          />

          {/* Future predictions - P50 (median) */}
          <Line
            type="monotone"
            dataKey="p50"
            stroke="#10b981"
            strokeWidth={3}
            dot={{ r: 4, fill: '#10b981' }}
            name="P50 (Median)"
            connectNulls={false}
          />

          {/* Future predictions - P95 */}
          <Line
            type="monotone"
            dataKey="p95"
            stroke="#86efac"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={false}
            name="P95"
            connectNulls={false}
          />

          {/* Future predictions - P5 */}
          <Line
            type="monotone"
            dataKey="p5"
            stroke="#fbbf24"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={false}
            name="P5"
            connectNulls={false}
          />
        </ComposedChart>
      </ResponsiveContainer>

      <div className="mt-4 flex gap-4 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <div className="w-4 h-0.5 bg-blue-500"></div>
          <span>Historical Actual</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-0.5 bg-green-500"></div>
          <span>Predicted Median</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-0.5 bg-green-300" style={{ borderTop: '2px dashed' }}></div>
          <span>P95 (Upper)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-0.5 bg-yellow-500" style={{ borderTop: '2px dashed' }}></div>
          <span>P5 (Lower)</span>
        </div>
      </div>
    </div>
  );
}
