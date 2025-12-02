import { prisma } from '@/lib/prisma';
import { mockPredictions, isDemoMode } from '@/lib/mock-data';
import Link from 'next/link';
import { Lock, Clock, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export default async function DashboardPage() {
  // Demo mode - show sample data
  if (isDemoMode()) {
    const predictions = mockPredictions.filter(p => p.userId === 'user-1');
    const stats = {
      total: predictions.length,
      locked: predictions.filter(p => p.isLocked).length,
      pending: predictions.filter(p => !p.isLocked).length,
    };

    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          {/* Demo Mode Banner */}
          <div className="bg-blue-100 border border-blue-300 rounded-lg p-4 mb-6 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-blue-900">Demo Mode Active</h3>
              <p className="text-sm text-blue-800">
                Viewing placeholder data. Set up a database to use the full app with real data.
              </p>
            </div>
          </div>

          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Dashboard (Demo)</h1>
            <p className="text-gray-600">Welcome to the Stock Prediction Marketplace!</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <StatCard title="Total Predictions" value={stats.total} icon="📊" />
            <StatCard title="Locked Predictions" value={stats.locked} icon="🔒" />
            <StatCard title="Pending Predictions" value={stats.pending} icon="⏳" />
          </div>

          <div className="bg-blue-600 text-white rounded-xl p-8 mb-8">
            <h2 className="text-2xl font-bold mb-2">Explore the Platform</h2>
            <p className="mb-4 opacity-90">
              Browse stocks, view predictions, and check the leaderboard (demo data)
            </p>
            <Link
              href="/predictions/create"
              className="inline-block bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition"
            >
              View Prediction Form
            </Link>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-2xl font-bold mb-6">Sample Predictions</h2>
            <div className="space-y-4">
              {predictions.map((prediction) => (
                <PredictionCard key={prediction.id} prediction={prediction} />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Production - fetch user's actual data
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-6 text-center">
            <p className="text-lg text-yellow-900">
              Please sign in to view your dashboard
            </p>
            <Link href="/auth/signin" className="text-blue-600 hover:underline font-semibold mt-2 inline-block">
              Sign In →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Get user from database
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="bg-red-100 border border-red-300 rounded-lg p-6 text-center">
            <p className="text-lg text-red-900">User not found. Please sign in again.</p>
            <Link href="/auth/signin" className="text-blue-600 hover:underline font-semibold mt-2 inline-block">
              Sign In →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Fetch user's predictions
  const predictions = await prisma.prediction.findMany({
    where: { userId: user.id },
    include: {
      stock: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  const stats = {
    total: predictions.length,
    locked: predictions.filter((p: any) => p.isLocked).length,
    pending: predictions.filter((p: any) => !p.isLocked).length,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Dashboard</h1>
          <p className="text-gray-600">Welcome back, {user.name}!</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <StatCard title="Total Predictions" value={stats.total} icon="📊" />
          <StatCard title="Locked Predictions" value={stats.locked} icon="🔒" />
          <StatCard title="Pending Predictions" value={stats.pending} icon="⏳" />
        </div>

        <div className="bg-blue-600 text-white rounded-xl p-8 mb-8">
          <h2 className="text-2xl font-bold mb-2">Make a New Prediction</h2>
          <p className="mb-4 opacity-90">
            Select a stock and predict its future prices
          </p>
          <Link
            href="/predictions/create"
            className="inline-block bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition"
          >
            Create Prediction
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-2xl font-bold mb-6">Your Predictions</h2>
          {predictions.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="text-lg mb-2">No predictions yet</p>
              <p>Create your first prediction to get started!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {predictions.map((prediction: any) => (
                <PredictionCard key={prediction.id} prediction={prediction} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon }: { title: string; value: number; icon: string }) {
  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
        </div>
        <div className="text-4xl">{icon}</div>
      </div>
    </div>
  );
}

function PredictionCard({ prediction }: { prediction: any }) {
  const timeframes = [
    { days: 7, price: prediction.price7d, actual: prediction.actualPrice7d, accuracy: prediction.accuracy7d },
    { days: 28, price: prediction.price28d, actual: prediction.actualPrice28d, accuracy: prediction.accuracy28d },
    { days: 60, price: prediction.price60d, actual: prediction.actualPrice60d, accuracy: prediction.accuracy60d },
    { days: 90, price: prediction.price90d, actual: prediction.actualPrice90d, accuracy: prediction.accuracy90d },
    { days: 180, price: prediction.price180d, actual: prediction.actualPrice180d, accuracy: prediction.accuracy180d },
    { days: 365, price: prediction.price365d, actual: prediction.actualPrice365d, accuracy: prediction.accuracy365d },
  ].filter(t => t.price !== null);

  return (
    <div className="border rounded-lg p-4 hover:bg-gray-50 transition">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {prediction.stock.symbol} - {prediction.stock.name}
          </h3>
          <p className="text-sm text-gray-600">
            Created: {format(new Date(prediction.createdAt), 'MMM d, yyyy')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {prediction.isLocked ? (
            <span className="flex items-center gap-1 bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm">
              <Lock className="h-4 w-4" />
              Locked
            </span>
          ) : (
            <span className="flex items-center gap-1 bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-sm">
              <Clock className="h-4 w-4" />
              Pending
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {timeframes.map((tf) => (
          <div key={tf.days} className="bg-gray-50 rounded p-3">
            <p className="text-xs text-gray-600 mb-1">{tf.days}d</p>
            <p className="font-semibold text-gray-900">${tf.price?.toFixed(2)}</p>
            {tf.actual && (
              <div className="text-xs mt-1">
                <p className="text-gray-600">Actual: ${tf.actual.toFixed(2)}</p>
                {tf.accuracy !== null && (
                  <p className={tf.accuracy! < 5 ? 'text-green-600' : 'text-red-600'}>
                    {tf.accuracy!.toFixed(2)}% error
                  </p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-3 text-sm text-gray-600">
        Current Price at Prediction: ${prediction.currentPrice.toFixed(2)}
      </div>
    </div>
  );
}
