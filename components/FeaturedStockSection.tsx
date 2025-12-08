'use client';

import StockPredictionChart from './StockPredictionChart';
import { TrendingUp } from 'lucide-react';

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

interface FeaturedStockData {
  stockId: string;
  symbol: string;
  name: string;
  historicalPrices: HistoricalPrice[];
  futurePredictions: FuturePrediction[];
  predictionCount: number;
}

interface FeaturedStockSectionProps {
  stockData: FeaturedStockData | null;
}

export default function FeaturedStockSection({ stockData }: FeaturedStockSectionProps) {
  if (!stockData) {
    return null;
  }

  return (
    <section className="container mx-auto px-4 py-16">
      <div className="flex items-center gap-3 mb-6">
        <TrendingUp className="h-8 w-8 text-blue-600" />
        <h3 className="text-3xl font-bold text-gray-900">Featured Stock</h3>
      </div>
      <StockPredictionChart
        symbol={stockData.symbol}
        name={stockData.name}
        historicalPrices={stockData.historicalPrices}
        futurePredictions={stockData.futurePredictions}
        predictionCount={stockData.predictionCount}
      />
    </section>
  );
}
