import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import PredictionChart from '@/components/PredictionChart';
import { format } from 'date-fns';
import Link from 'next/link';
import { ArrowLeft, Lock, Clock } from 'lucide-react';

export default async function PredictionDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/auth/signin');
  }

  const prediction = await prisma.prediction.findUnique({
    where: { id: params.id },
    include: {
      stock: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  if (!prediction) {
    notFound();
  }

  if (prediction.userId !== session.user.id) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-5xl">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-blue-600 hover:underline mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>

        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {prediction.stock.symbol} - {prediction.stock.name}
              </h1>
              <p className="text-gray-600 mt-1">
                Created: {format(new Date(prediction.createdAt), 'MMMM d, yyyy \'at\' h:mm a')}
              </p>
            </div>
            <div>
              {prediction.isLocked ? (
                <span className="flex items-center gap-2 bg-red-100 text-red-700 px-4 py-2 rounded-full font-semibold">
                  <Lock className="h-5 w-5" />
                  Locked
                </span>
              ) : (
                <span className="flex items-center gap-2 bg-yellow-100 text-yellow-700 px-4 py-2 rounded-full font-semibold">
                  <Clock className="h-5 w-5" />
                  Pending Lock
                </span>
              )}
            </div>
          </div>

          {prediction.stock.sector && (
            <div className="flex gap-4 text-sm text-gray-600">
              <span>Sector: {prediction.stock.sector}</span>
              {prediction.stock.industry && <span>Industry: {prediction.stock.industry}</span>}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Base Information</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Current Price (at prediction)</p>
              <p className="text-2xl font-bold text-gray-900">${prediction.currentPrice.toFixed(2)}</p>
            </div>
            {prediction.isLocked && prediction.lockedAt && (
              <div>
                <p className="text-sm text-gray-600">Locked At</p>
                <p className="text-lg font-semibold text-gray-900">
                  {format(new Date(prediction.lockedAt), 'MMM d, yyyy')}
                </p>
              </div>
            )}
          </div>
        </div>

        <PredictionChart prediction={prediction} stockSymbol={prediction.stock.symbol} />

        <div className="bg-white rounded-xl shadow-md p-6 mt-6">
          <h2 className="text-xl font-semibold mb-4">Detailed Predictions</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Timeframe</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Target Date</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Predicted</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Actual</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Accuracy</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                <PredictionRow
                  timeframe="7 Days"
                  targetDate={prediction.targetDate7d}
                  predicted={prediction.price7d}
                  actual={prediction.actualPrice7d}
                  accuracy={prediction.accuracy7d}
                />
                <PredictionRow
                  timeframe="28 Days"
                  targetDate={prediction.targetDate28d}
                  predicted={prediction.price28d}
                  actual={prediction.actualPrice28d}
                  accuracy={prediction.accuracy28d}
                />
                <PredictionRow
                  timeframe="60 Days"
                  targetDate={prediction.targetDate60d}
                  predicted={prediction.price60d}
                  actual={prediction.actualPrice60d}
                  accuracy={prediction.accuracy60d}
                />
                <PredictionRow
                  timeframe="90 Days"
                  targetDate={prediction.targetDate90d}
                  predicted={prediction.price90d}
                  actual={prediction.actualPrice90d}
                  accuracy={prediction.accuracy90d}
                />
                <PredictionRow
                  timeframe="180 Days"
                  targetDate={prediction.targetDate180d}
                  predicted={prediction.price180d}
                  actual={prediction.actualPrice180d}
                  accuracy={prediction.accuracy180d}
                />
                <PredictionRow
                  timeframe="365 Days"
                  targetDate={prediction.targetDate365d}
                  predicted={prediction.price365d}
                  actual={prediction.actualPrice365d}
                  accuracy={prediction.accuracy365d}
                />
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function PredictionRow({
  timeframe,
  targetDate,
  predicted,
  actual,
  accuracy,
}: {
  timeframe: string;
  targetDate: Date | null;
  predicted: number | null;
  actual: number | null;
  accuracy: number | null;
}) {
  if (!predicted) return null;

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-4 py-3 text-sm text-gray-900">{timeframe}</td>
      <td className="px-4 py-3 text-sm text-gray-600">
        {targetDate ? format(new Date(targetDate), 'MMM d, yyyy') : '-'}
      </td>
      <td className="px-4 py-3 text-sm font-semibold text-blue-600">
        ${predicted.toFixed(2)}
      </td>
      <td className="px-4 py-3 text-sm font-semibold text-green-600">
        {actual ? `$${actual.toFixed(2)}` : 'Pending'}
      </td>
      <td className="px-4 py-3 text-sm">
        {accuracy !== null ? (
          <span className={accuracy < 5 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
            {accuracy.toFixed(2)}% error
          </span>
        ) : (
          <span className="text-gray-500">-</span>
        )}
      </td>
    </tr>
  );
}
