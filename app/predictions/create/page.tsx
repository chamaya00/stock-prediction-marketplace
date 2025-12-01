'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, TrendingUp } from 'lucide-react';

export default function CreatePredictionPage() {
  const router = useRouter();
  const [stocks, setStocks] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStock, setSelectedStock] = useState<any>(null);
  const [currentPrice, setCurrentPrice] = useState('');
  const [predictions, setPredictions] = useState({
    price7d: '',
    price28d: '',
    price60d: '',
    price90d: '',
    price180d: '',
    price365d: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showStockList, setShowStockList] = useState(false);

  useEffect(() => {
    fetchStocks();
  }, []);

  const fetchStocks = async (search?: string) => {
    try {
      const url = search
        ? `/api/stocks?search=${encodeURIComponent(search)}&limit=20`
        : '/api/stocks?limit=50';
      const response = await fetch(url);
      const data = await response.json();
      setStocks(data.stocks || []);
    } catch (error) {
      console.error('Failed to fetch stocks:', error);
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setShowStockList(true);
    if (value.length >= 2) {
      fetchStocks(value);
    } else if (value.length === 0) {
      fetchStocks();
    }
  };

  const handleStockSelect = (stock: any) => {
    setSelectedStock(stock);
    setSearchTerm(`${stock.symbol} - ${stock.name}`);
    setShowStockList(false);
  };

  const handlePredictionChange = (timeframe: string, value: string) => {
    setPredictions({ ...predictions, [timeframe]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!selectedStock) {
      setError('Please select a stock');
      return;
    }

    if (!currentPrice || parseFloat(currentPrice) <= 0) {
      setError('Please enter a valid current price');
      return;
    }

    // At least one prediction is required
    const hasPrediction = Object.values(predictions).some(p => p && parseFloat(p) > 0);
    if (!hasPrediction) {
      setError('Please enter at least one price prediction');
      return;
    }

    setIsLoading(true);

    try {
      const predictionData = {
        stockId: selectedStock.id,
        currentPrice: parseFloat(currentPrice),
        price7d: predictions.price7d ? parseFloat(predictions.price7d) : undefined,
        price28d: predictions.price28d ? parseFloat(predictions.price28d) : undefined,
        price60d: predictions.price60d ? parseFloat(predictions.price60d) : undefined,
        price90d: predictions.price90d ? parseFloat(predictions.price90d) : undefined,
        price180d: predictions.price180d ? parseFloat(predictions.price180d) : undefined,
        price365d: predictions.price365d ? parseFloat(predictions.price365d) : undefined,
      };

      const response = await fetch('/api/predictions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(predictionData),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to create prediction');
        return;
      }

      router.push('/dashboard');
    } catch (error) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Create Prediction</h1>
          <p className="text-gray-600">
            Select a stock and enter your price predictions for multiple timeframes
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-md p-6 space-y-6">
          {/* Stock Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Stock *
            </label>
            <div className="relative">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  onFocus={() => setShowStockList(true)}
                  placeholder="Search by symbol or name (e.g., AAPL or Apple)"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {showStockList && stocks.length > 0 && (
                <div className="absolute z-10 w-full mt-2 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {stocks.map((stock) => (
                    <button
                      key={stock.id}
                      type="button"
                      onClick={() => handleStockSelect(stock)}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 transition border-b last:border-b-0"
                    >
                      <div className="font-semibold text-gray-900">{stock.symbol}</div>
                      <div className="text-sm text-gray-600">{stock.name}</div>
                      {stock.sector && (
                        <div className="text-xs text-gray-500">{stock.sector}</div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {selectedStock && (
              <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-700">
                  <span className="font-semibold">{selectedStock.symbol}</span> -{' '}
                  {selectedStock.name}
                </p>
              </div>
            )}
          </div>

          {/* Current Price */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Current Price (at time of prediction) *
            </label>
            <input
              type="number"
              step="0.01"
              value={currentPrice}
              onChange={(e) => setCurrentPrice(e.target.value)}
              placeholder="150.00"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {/* Predictions */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Price Predictions (enter at least one)
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <PredictionInput
                label="7 Days"
                value={predictions.price7d}
                onChange={(v) => handlePredictionChange('price7d', v)}
              />
              <PredictionInput
                label="28 Days"
                value={predictions.price28d}
                onChange={(v) => handlePredictionChange('price28d', v)}
              />
              <PredictionInput
                label="60 Days"
                value={predictions.price60d}
                onChange={(v) => handlePredictionChange('price60d', v)}
              />
              <PredictionInput
                label="90 Days"
                value={predictions.price90d}
                onChange={(v) => handlePredictionChange('price90d', v)}
              />
              <PredictionInput
                label="180 Days"
                value={predictions.price180d}
                onChange={(v) => handlePredictionChange('price180d', v)}
              />
              <PredictionInput
                label="365 Days"
                value={predictions.price365d}
                onChange={(v) => handlePredictionChange('price365d', v)}
              />
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              <strong>Note:</strong> Your predictions will be locked at the start of the next day
              and cannot be modified after that.
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Creating Prediction...' : 'Create Prediction'}
          </button>
        </form>
      </div>
    </div>
  );
}

function PredictionInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      <input
        type="number"
        step="0.01"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Optional"
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
    </div>
  );
}
