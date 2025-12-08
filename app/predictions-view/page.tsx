'use client';

import { useEffect, useState } from 'react';
import StockPredictionChart from '@/components/StockPredictionChart';
import { Search, TrendingUp, Loader2 } from 'lucide-react';

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

interface StockData {
  stockId: string;
  symbol: string;
  name: string;
  sector: string | null;
  industry: string | null;
  historicalPrices: HistoricalPrice[];
  futurePredictions: FuturePrediction[];
  predictionCount: number;
}

export default function PredictionsViewPage() {
  const [stocks, setStocks] = useState<StockData[]>([]);
  const [filteredStocks, setFilteredStocks] = useState<StockData[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    // Filter stocks based on search query
    if (searchQuery.trim() === '') {
      setFilteredStocks(stocks);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = stocks.filter(
        (stock) =>
          stock.symbol.toLowerCase().includes(query) ||
          stock.name.toLowerCase().includes(query) ||
          (stock.sector && stock.sector.toLowerCase().includes(query)) ||
          (stock.industry && stock.industry.toLowerCase().includes(query))
      );
      setFilteredStocks(filtered);
    }
  }, [searchQuery, stocks]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/predictions/visualization');
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch data');
      }

      // Filter out stocks with no data
      const stocksWithData = result.data.filter(
        (stock: StockData) =>
          stock.historicalPrices.length > 0 || stock.futurePredictions.length > 0
      );

      setStocks(stocksWithData);
      setFilteredStocks(stocksWithData);
    } catch (err) {
      console.error('Error fetching prediction data:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-gray-600">Loading prediction data...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-600 font-semibold mb-2">Error loading data</p>
            <p className="text-red-500 text-sm">{error}</p>
            <button
              onClick={fetchData}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">
              Stock Predictions Visualization
            </h1>
          </div>
          <p className="text-gray-600">
            View aggregated predictions and historical prices for all stocks.
            Each chart shows actual closing prices and future prediction percentiles (P5, P50, P95).
          </p>
        </div>

        {/* Search Filter */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by symbol, name, sector, or industry..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="mt-2 text-sm text-gray-600">
            Showing {filteredStocks.length} of {stocks.length} stock{stocks.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Stock Charts */}
        {filteredStocks.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <Search className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg mb-2">No stocks found</p>
            <p className="text-gray-400 text-sm">
              {searchQuery.trim() !== ''
                ? 'Try adjusting your search query'
                : 'No prediction data available yet'}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredStocks.map((stock) => (
              <StockPredictionChart
                key={stock.stockId}
                symbol={stock.symbol}
                name={stock.name}
                historicalPrices={stock.historicalPrices}
                futurePredictions={stock.futurePredictions}
                predictionCount={stock.predictionCount}
              />
            ))}
          </div>
        )}

        {/* Legend Info */}
        {filteredStocks.length > 0 && (
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="font-semibold text-blue-900 mb-3">About the Chart</h3>
            <div className="space-y-2 text-sm text-blue-800">
              <p>
                <strong>Actual Price:</strong> Historical closing prices from the market
              </p>
              <p>
                <strong>P50 (Median):</strong> The middle value of all predictions for a given date
              </p>
              <p>
                <strong>P95:</strong> 95th percentile - only 5% of predictions are higher
              </p>
              <p>
                <strong>P5:</strong> 5th percentile - only 5% of predictions are lower
              </p>
              <p className="mt-3 text-xs text-blue-700">
                The prediction range between P5 and P95 represents where 90% of all predictions fall.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
