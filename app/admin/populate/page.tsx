'use client';

import { useState } from 'react';

export default function AdminPopulatePage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [adminSecret, setAdminSecret] = useState('');

  const handlePopulate = async () => {
    if (!adminSecret) {
      setError('Please enter admin secret');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(`/api/admin/populate-prices?secret=${encodeURIComponent(adminSecret)}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to populate prices');
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow-lg rounded-lg p-6">
          <h1 className="text-3xl font-bold mb-2">Stock Price Population</h1>
          <p className="text-gray-600 mb-6">
            Populate the database with 2 years of historical stock prices for all 50 S&P 500 stocks.
          </p>

          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h2 className="font-semibold text-blue-900 mb-2">⚠️ Before You Start</h2>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• This will take approximately <strong>10 minutes</strong> to complete</li>
              <li>• Fetches 2 years of daily OHLC data for 50 stocks</li>
              <li>• Uses Massive.com free tier (5 calls/minute)</li>
              <li>• Keep this page open until completion</li>
              <li>• Safe to run multiple times (skips duplicates)</li>
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
              disabled={loading}
            />
            <p className="text-xs text-gray-500 mt-1">
              Set this in your Vercel environment variables as <code>ADMIN_SECRET</code>
            </p>
          </div>

          <button
            onClick={handlePopulate}
            disabled={loading || !adminSecret}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Populating... This takes ~10 minutes
              </span>
            ) : (
              '🚀 Start Population'
            )}
          </button>

          {error && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <h3 className="font-semibold text-red-900 mb-1">❌ Error</h3>
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {result && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="font-semibold text-green-900 mb-3">✅ Population Complete!</h3>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-white p-3 rounded">
                  <p className="text-sm text-gray-600">Total Stocks</p>
                  <p className="text-2xl font-bold text-gray-900">{result.totalStocks}</p>
                </div>
                <div className="bg-white p-3 rounded">
                  <p className="text-sm text-gray-600">Successful</p>
                  <p className="text-2xl font-bold text-green-600">{result.successCount}</p>
                </div>
                <div className="bg-white p-3 rounded">
                  <p className="text-sm text-gray-600">Errors</p>
                  <p className="text-2xl font-bold text-red-600">{result.errorCount}</p>
                </div>
                <div className="bg-white p-3 rounded">
                  <p className="text-sm text-gray-600">Prices Inserted</p>
                  <p className="text-2xl font-bold text-blue-600">{result.totalPricesInserted.toLocaleString()}</p>
                </div>
              </div>

              <details className="mt-4">
                <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
                  View detailed results
                </summary>
                <div className="mt-2 max-h-96 overflow-y-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-3 py-2 text-left">Symbol</th>
                        <th className="px-3 py-2 text-left">Status</th>
                        <th className="px-3 py-2 text-right">Records</th>
                        <th className="px-3 py-2 text-right">Latest Close</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {result.results?.map((r: any) => (
                        <tr key={r.symbol} className={r.success ? '' : 'bg-red-50'}>
                          <td className="px-3 py-2 font-medium">{r.symbol}</td>
                          <td className="px-3 py-2">
                            {r.success ? (
                              <span className="text-green-600">✓</span>
                            ) : (
                              <span className="text-red-600">✗</span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-right">{r.pricesInserted || '-'}</td>
                          <td className="px-3 py-2 text-right">
                            {r.latestClose ? `$${r.latestClose.toFixed(2)}` : r.message}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </details>
            </div>
          )}
        </div>

        <div className="mt-6 bg-white shadow rounded-lg p-4">
          <h2 className="font-semibold mb-2">📊 What happens during population?</h2>
          <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
            <li>Fetches 2 years of daily OHLC data for each stock</li>
            <li>Respects API rate limits (12 seconds between stocks)</li>
            <li>Inserts ~500 price records per stock</li>
            <li>Total: ~25,000 price records for all 50 stocks</li>
            <li>Progress updates shown in real-time</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
