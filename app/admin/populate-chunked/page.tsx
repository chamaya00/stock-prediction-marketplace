'use client';

import { useState, useEffect } from 'react';

interface Progress {
  totalStocks: number;
  completed: number;
  remaining: number;
  totalPrices: number;
  percentComplete: number;
}

interface StockResult {
  symbol: string;
  name: string;
  pricesInserted: number;
  latestClose: number;
  latestDate: string;
  success?: boolean;
  error?: string;
}

export default function AdminPopulateChunkedPage() {
  const [adminSecret, setAdminSecret] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [results, setResults] = useState<StockResult[]>([]);
  const [currentStock, setCurrentStock] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const processNextStock = async () => {
    try {
      const response = await fetch('/api/admin/populate-chunk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ secret: adminSecret })
      });

      const data = await response.json();

      if (!response.ok && response.status === 401) {
        setError('Invalid admin secret');
        setIsRunning(false);
        return false;
      }

      if (data.completed) {
        setCompleted(true);
        setProgress(data.progress || {
          totalStocks: data.totalStocks,
          completed: data.stocksCompleted,
          remaining: 0,
          totalPrices: data.totalPrices,
          percentComplete: 100
        });
        return false; // Stop processing
      }

      if (data.error) {
        setResults(prev => [...prev, {
          symbol: data.symbol || 'Unknown',
          name: '',
          pricesInserted: 0,
          latestClose: 0,
          latestDate: '',
          success: false,
          error: data.error
        }]);
        setProgress(data.progress);
        return true; // Continue to next
      }

      if (data.success) {
        setCurrentStock(data.symbol);
        setResults(prev => [...prev, data]);
        setProgress(data.progress);
        return true; // Continue to next
      }

      return true;

    } catch (err) {
      console.error('Error processing stock:', err);
      setError(err instanceof Error ? err.message : 'Network error');
      return false; // Stop on network error
    }
  };

  const startPopulation = async () => {
    if (!adminSecret) {
      setError('Please enter admin secret');
      return;
    }

    setIsRunning(true);
    setError(null);
    setResults([]);
    setCompleted(false);
    setIsPaused(false);

    let shouldContinue = true;
    let callCount = 0;

    while (shouldContinue && !isPaused) {
      shouldContinue = await processNextStock();
      callCount++;

      if (shouldContinue && !isPaused) {
        // Wait 13 seconds between calls to respect rate limit (5 calls/min = 12 sec minimum)
        await new Promise(resolve => setTimeout(resolve, 13000));
      }
    }

    setIsRunning(false);
    if (isPaused) {
      setError('Population paused. Click Resume to continue.');
    }
  };

  const pausePopulation = () => {
    setIsPaused(true);
    setIsRunning(false);
  };

  const resumePopulation = () => {
    setIsPaused(false);
    startPopulation();
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow-lg rounded-lg p-6">
          <h1 className="text-3xl font-bold mb-2">Stock Price Population (Free Tier)</h1>
          <p className="text-gray-600 mb-6">
            Populate the database with 2 years of historical stock prices - optimized for Vercel free tier!
          </p>

          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h2 className="font-semibold text-blue-900 mb-2">ℹ️ How This Works</h2>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Processes <strong>one stock at a time</strong> to fit Vercel's 10-second limit</li>
              <li>• Takes approximately <strong>10-13 minutes total</strong> (50 stocks × 13 seconds)</li>
              <li>• Respects Massive.com rate limits (5 calls/minute)</li>
              <li>• Progress saved in database - you can pause and resume!</li>
              <li>• Keep this page open while running</li>
            </ul>
          </div>

          <div className="mb-6">
            <label htmlFor="adminSecret" className="block text-sm font-medium text-gray-700 mb-2">
              Admin Secret
            </label>
            <input
              type="password"
              id="adminSecret"
              value={adminSecret}
              onChange={(e) => setAdminSecret(e.target.value)}
              placeholder="Enter admin secret"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isRunning}
            />
          </div>

          <div className="flex gap-3 mb-6">
            {!isRunning && !completed && !isPaused && (
              <button
                onClick={startPopulation}
                disabled={!adminSecret}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                🚀 Start Population
              </button>
            )}

            {isRunning && (
              <button
                onClick={pausePopulation}
                className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                ⏸️ Pause
              </button>
            )}

            {isPaused && (
              <button
                onClick={resumePopulation}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                ▶️ Resume
              </button>
            )}
          </div>

          {progress && (
            <div className="mb-6">
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium">Progress</span>
                <span className="text-gray-600">
                  {progress.completed} / {progress.totalStocks} stocks
                  ({progress.percentComplete}%)
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                <div
                  className="bg-blue-600 h-4 transition-all duration-300 flex items-center justify-center text-xs text-white font-semibold"
                  style={{ width: `${progress.percentComplete}%` }}
                >
                  {progress.percentComplete > 10 && `${progress.percentComplete}%`}
                </div>
              </div>
              <div className="mt-2 text-sm text-gray-600 text-center">
                {isRunning && currentStock && (
                  <span className="inline-flex items-center">
                    <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing {currentStock}...
                  </span>
                )}
                {completed && '✅ All stocks populated!'}
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                <div className="bg-gray-50 p-2 rounded text-center">
                  <div className="text-gray-600">Remaining</div>
                  <div className="text-lg font-bold text-gray-900">{progress.remaining}</div>
                </div>
                <div className="bg-gray-50 p-2 rounded text-center">
                  <div className="text-gray-600">Total Prices</div>
                  <div className="text-lg font-bold text-blue-600">{progress.totalPrices.toLocaleString()}</div>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <h3 className="font-semibold text-red-900 mb-1">❌ Error</h3>
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {results.length > 0 && (
            <div className="mt-6">
              <h3 className="font-semibold mb-3">Recent Results</h3>
              <div className="max-h-96 overflow-y-auto border rounded-lg">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-100 sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left">Symbol</th>
                      <th className="px-3 py-2 text-left">Name</th>
                      <th className="px-3 py-2 text-right">Records</th>
                      <th className="px-3 py-2 text-right">Latest Close</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {results.slice().reverse().map((result, idx) => (
                      <tr key={idx} className={result.error ? 'bg-red-50' : ''}>
                        <td className="px-3 py-2 font-medium">{result.symbol}</td>
                        <td className="px-3 py-2 text-gray-600">{result.name}</td>
                        <td className="px-3 py-2 text-right">
                          {result.error ? (
                            <span className="text-red-600 text-xs">{result.error}</span>
                          ) : (
                            result.pricesInserted.toLocaleString()
                          )}
                        </td>
                        <td className="px-3 py-2 text-right">
                          {result.latestClose ? `$${result.latestClose.toFixed(2)}` : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {completed && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="font-semibold text-green-900 mb-2">✅ Population Complete!</h3>
              <p className="text-sm text-green-800">
                Successfully populated {progress?.completed} stocks with {progress?.totalPrices.toLocaleString()} price records.
                Your prediction platform is ready to use!
              </p>
            </div>
          )}
        </div>

        <div className="mt-6 bg-white shadow rounded-lg p-4">
          <h2 className="font-semibold mb-2">💡 Tips</h2>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Keep this tab open for the entire 10-13 minute duration</li>
            <li>• You can pause and resume if needed - progress is saved in the database</li>
            <li>• Each stock takes ~13 seconds (API call + rate limit wait)</li>
            <li>• If interrupted, just click Start again - it will resume where it left off</li>
            <li>• Works perfectly on Vercel free tier (10-second function limit)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
