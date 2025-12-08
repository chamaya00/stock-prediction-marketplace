import { TrendingUp, Users, Target, Award, Rocket, Trophy } from 'lucide-react';
import { isDemoMode } from '@/lib/mock-data';
import { prisma } from '@/lib/prisma';
import FeaturedStockSection from '@/components/FeaturedStockSection';

// Fetch AMD stock data for featured section
async function getFeaturedStockData() {
  try {
    const stock = await prisma.stock.findUnique({
      where: { symbol: 'AMD' },
      include: {
        predictions: {
          where: {
            isLocked: true,
          },
          select: {
            price7d: true,
            price28d: true,
            price60d: true,
            price90d: true,
            price180d: true,
            price365d: true,
            targetDate7d: true,
            targetDate28d: true,
            targetDate60d: true,
            targetDate90d: true,
            targetDate180d: true,
            targetDate365d: true,
          },
        },
        prices: {
          orderBy: {
            date: 'asc',
          },
          select: {
            date: true,
            close: true,
          },
        },
      },
    });

    if (!stock) return null;

    // Map to store predictions grouped by target date
    const predictionsByDate = new Map<string, number[]>();

    // Process all predictions
    stock.predictions.forEach((pred) => {
      const timeframes = [
        { price: pred.price7d, targetDate: pred.targetDate7d },
        { price: pred.price28d, targetDate: pred.targetDate28d },
        { price: pred.price60d, targetDate: pred.targetDate60d },
        { price: pred.price90d, targetDate: pred.targetDate90d },
        { price: pred.price180d, targetDate: pred.targetDate180d },
        { price: pred.price365d, targetDate: pred.targetDate365d },
      ];

      timeframes.forEach(({ price, targetDate }) => {
        if (price && targetDate) {
          const dateKey = targetDate.toISOString().split('T')[0];
          if (!predictionsByDate.has(dateKey)) {
            predictionsByDate.set(dateKey, []);
          }
          predictionsByDate.get(dateKey)!.push(price);
        }
      });
    });

    // Calculate percentiles for each date
    const futurePredictions = Array.from(predictionsByDate.entries())
      .map(([dateKey, predictions]) => {
        const sorted = [...predictions].sort((a, b) => a - b);
        const n = sorted.length;

        const p5 = sorted[Math.floor(n * 0.05)] || sorted[0];
        const p50 = sorted[Math.floor(n * 0.5)] || sorted[Math.floor(n / 2)];
        const p95 = sorted[Math.floor(n * 0.95)] || sorted[n - 1];

        return {
          date: dateKey,
          p5,
          p50,
          p95,
          count: n,
        };
      })
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      stockId: stock.id,
      symbol: stock.symbol,
      name: stock.name,
      historicalPrices: stock.prices.map((price) => ({
        date: price.date.toISOString().split('T')[0],
        close: price.close,
      })),
      futurePredictions,
      predictionCount: stock.predictions.length,
    };
  } catch (error) {
    console.error('Error fetching featured stock data:', error);
    return null;
  }
}

// Fetch top 10 analysts by 28-day accuracy
async function getTopAnalysts() {
  try {
    const twentyEightDaysAgo = new Date();
    twentyEightDaysAgo.setDate(twentyEightDaysAgo.getDate() - 28);

    // Get all users with their predictions from the last 28 days
    const users = await prisma.user.findMany({
      include: {
        predictions: {
          where: {
            isLocked: true,
            createdAt: {
              gte: twentyEightDaysAgo,
            },
            accuracy28d: {
              not: null,
            },
          },
          select: {
            accuracy28d: true,
          },
        },
      },
    });

    // Calculate average accuracy for each user
    const analystStats = users
      .map((user) => {
        const accuracies = user.predictions
          .map((p) => p.accuracy28d)
          .filter((acc): acc is number => acc !== null);

        if (accuracies.length === 0) return null;

        const avgAccuracy = accuracies.reduce((sum, acc) => sum + acc, 0) / accuracies.length;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          avgAccuracy: 100 - Math.abs(avgAccuracy), // Convert error to accuracy percentage
          predictionCount: accuracies.length,
        };
      })
      .filter((analyst): analyst is NonNullable<typeof analyst> => analyst !== null)
      .sort((a, b) => b.avgAccuracy - a.avgAccuracy)
      .slice(0, 10);

    return analystStats;
  } catch (error) {
    console.error('Error fetching top analysts:', error);
    return [];
  }
}

export default async function Home() {
  const isDemo = isDemoMode();
  const featuredStock = await getFeaturedStockData();
  const topAnalysts = await getTopAnalysts();

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Demo Mode Banner */}
      {isDemo && (
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3">
          <div className="container mx-auto px-4 flex items-center justify-center gap-3">
            <Rocket className="h-5 w-5" />
            <p className="font-semibold">
              Demo Mode: Viewing with placeholder data. Full features available after database setup.
            </p>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-5xl font-bold text-gray-900 mb-6">
          Build Your Reputation as a Stock Analyst
        </h2>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Make predictions on S&P 500 stocks and prove your forecasting accuracy.
          Track your performance and compete with other analysts.
        </p>
      </section>

      {/* Featured Stock */}
      {featuredStock && <FeaturedStockSection stockData={featuredStock} />}

      {/* Top Analysts */}
      {topAnalysts.length > 0 && (
        <section className="container mx-auto px-4 py-16">
          <div className="flex items-center gap-3 mb-6">
            <Trophy className="h-8 w-8 text-yellow-600" />
            <h3 className="text-3xl font-bold text-gray-900">Top Analysts</h3>
          </div>
          <p className="text-gray-600 mb-6">
            Leading analysts by accuracy over the last 28 days
          </p>
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Rank
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Analyst
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Accuracy
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Predictions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {topAnalysts.map((analyst, index) => (
                    <tr key={analyst.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {index === 0 && <Trophy className="h-5 w-5 text-yellow-500 mr-2" />}
                          {index === 1 && <Trophy className="h-5 w-5 text-gray-400 mr-2" />}
                          {index === 2 && <Trophy className="h-5 w-5 text-amber-700 mr-2" />}
                          <span className="text-sm font-medium text-gray-900">#{index + 1}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{analyst.name}</div>
                        <div className="text-sm text-gray-500">{analyst.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="text-sm font-semibold text-green-600">
                            {analyst.avgAccuracy.toFixed(2)}%
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {analyst.predictionCount}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* Features */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <FeatureCard
            icon={<Target className="h-12 w-12 text-blue-600" />}
            title="Make Predictions"
            description="Predict stock prices at 7, 28, 60, 90, 180, and 365-day intervals"
          />
          <FeatureCard
            icon={<TrendingUp className="h-12 w-12 text-green-600" />}
            title="Track Performance"
            description="See your predictions vs actual outcomes with detailed analytics"
          />
          <FeatureCard
            icon={<Award className="h-12 w-12 text-yellow-600" />}
            title="Build Reputation"
            description="Earn credibility through accurate predictions and consistency"
          />
          <FeatureCard
            icon={<Users className="h-12 w-12 text-purple-600" />}
            title="Compete Globally"
            description="Rank against analysts worldwide on our leaderboard"
          />
        </div>
      </section>

      {/* How It Works */}
      <section className="container mx-auto px-4 py-16 bg-white rounded-xl shadow-lg my-16">
        <h3 className="text-3xl font-bold text-center mb-12">How It Works</h3>
        <div className="grid md:grid-cols-3 gap-8">
          <Step number={1} title="Select a Stock" description="Choose from any S&P 500 company" />
          <Step number={2} title="Make Your Prediction" description="Enter price targets for multiple time horizons" />
          <Step number={3} title="Track & Improve" description="Predictions lock daily. Watch your accuracy grow" />
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t mt-20 py-8 bg-gray-50">
        <div className="container mx-auto px-4 text-center text-gray-600">
          <p>&copy; 2025 Stock Prediction Marketplace. Built for analysts, by analysts.</p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition">
      <div className="mb-4">{icon}</div>
      <h4 className="text-xl font-semibold mb-2">{title}</h4>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}

function Step({ number, title, description }: { number: number; title: string; description: string }) {
  return (
    <div className="text-center">
      <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
        {number}
      </div>
      <h4 className="text-xl font-semibold mb-2">{title}</h4>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}
