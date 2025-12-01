'use client';

import { useState, useEffect } from 'react';
import { Award, TrendingUp } from 'lucide-react';
import Link from 'next/link';

export default function LeaderboardPage() {
  const [timeframe, setTimeframe] = useState('7d');
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, [timeframe]);

  const fetchLeaderboard = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/analysts/leaderboard?timeframe=${timeframe}`);
      const data = await response.json();
      setLeaderboard(data.leaderboard || []);
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <Award className="h-10 w-10 text-yellow-500" />
            Leaderboard
          </h1>
          <p className="text-gray-600">
            Top analysts ranked by prediction accuracy
          </p>
        </div>

        {/* Timeframe Selector */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">Select Timeframe</h3>
          <div className="flex flex-wrap gap-3">
            {['7d', '28d', '60d', '90d', '180d', '365d'].map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  timeframe === tf
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>

        {/* Leaderboard */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center text-gray-500">
              <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
              Loading leaderboard...
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <Award className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-lg">No data available for this timeframe yet</p>
              <p className="text-sm mt-2">
                Predictions need to be locked and reach their target dates before appearing here
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                      Rank
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                      Analyst
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                      Average Accuracy
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                      Predictions
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {leaderboard.map((entry, index) => (
                    <tr key={entry.user.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          {index === 0 && <span className="text-2xl mr-2">🥇</span>}
                          {index === 1 && <span className="text-2xl mr-2">🥈</span>}
                          {index === 2 && <span className="text-2xl mr-2">🥉</span>}
                          <span className="font-semibold text-gray-900">#{index + 1}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-semibold text-gray-900">{entry.user.name}</div>
                          {entry.user.bio && (
                            <div className="text-sm text-gray-600 truncate max-w-xs">
                              {entry.user.bio}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-lg font-bold ${
                              entry.averageAccuracy < 5
                                ? 'text-green-600'
                                : entry.averageAccuracy < 10
                                ? 'text-yellow-600'
                                : 'text-red-600'
                            }`}
                          >
                            {entry.averageAccuracy.toFixed(2)}%
                          </span>
                          <span className="text-sm text-gray-600">error</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-gray-900">{entry.predictionCount}</span>
                      </td>
                      <td className="px-6 py-4">
                        <Link
                          href={`/analysts/${entry.user.id}`}
                          className="text-blue-600 hover:underline font-medium"
                        >
                          View Profile
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Info Box */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>How accuracy is calculated:</strong> The percentage error between the predicted
            price and the actual closing price. Lower percentages indicate more accurate predictions.
          </p>
        </div>
      </div>
    </div>
  );
}
