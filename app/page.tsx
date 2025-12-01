import Link from 'next/link';
import { TrendingUp, Users, Target, Award } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-8 w-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">Stock Prediction Marketplace</h1>
          </div>
          <nav className="flex gap-4">
            <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">
              Dashboard
            </Link>
            <Link href="/leaderboard" className="text-gray-600 hover:text-gray-900">
              Leaderboard
            </Link>
            <Link href="/auth/signin" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
              Sign In
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-5xl font-bold text-gray-900 mb-6">
          Build Your Reputation as a Stock Analyst
        </h2>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Make predictions on S&P 500 stocks and prove your forecasting accuracy.
          Track your performance and compete with other analysts.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/auth/signup"
            className="bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-blue-700 transition"
          >
            Get Started
          </Link>
          <Link
            href="/leaderboard"
            className="bg-white text-blue-600 px-8 py-3 rounded-lg text-lg font-semibold border-2 border-blue-600 hover:bg-blue-50 transition"
          >
            View Leaderboard
          </Link>
        </div>
      </section>

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
