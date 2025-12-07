/**
 * Test script to verify Massive.com API is working
 * This doesn't require database - just tests the API
 */

const MASSIVE_API_KEY = process.env.MASSIVE_API_KEY || 'xOemxcCL3tf_K7H9sKRr8mWtZnJtAS5M';

interface MassiveBar {
  t: number;  // timestamp
  o: number;  // open
  h: number;  // high
  l: number;  // low
  c: number;  // close
  v: number;  // volume
}

interface MassiveResponse {
  ticker: string;
  queryCount: number;
  resultsCount: number;
  adjusted: boolean;
  results?: MassiveBar[];
  status: string;
  message?: string;
}

async function testAPI() {
  console.log('🧪 Testing Massive.com API...\n');

  const symbol = 'AAPL';

  // Get last 30 days of data for testing
  const to = new Date();
  to.setDate(to.getDate() - 1); // Yesterday
  const from = new Date();
  from.setDate(from.getDate() - 30); // 30 days ago

  const fromStr = from.toISOString().split('T')[0];
  const toStr = to.toISOString().split('T')[0];

  const url = `https://api.polygon.io/v2/aggs/ticker/${symbol}/range/1/day/${fromStr}/${toStr}?adjusted=true&sort=asc&apiKey=${MASSIVE_API_KEY}`;

  console.log(`📊 Fetching ${symbol} data...`);
  console.log(`📅 Date range: ${fromStr} to ${toStr}\n`);

  try {
    const response = await fetch(url);
    const data: MassiveResponse = await response.json();

    if (data.status === 'ERROR') {
      console.error(`❌ API Error: ${data.message}`);
      return;
    }

    if (data.status === 'OK' && data.results && data.results.length > 0) {
      console.log(`✅ Success! Received ${data.results.length} price bars\n`);

      console.log('📈 Sample data (last 5 days):');
      console.log('─'.repeat(80));
      console.log('Date          Open      High      Low       Close     Volume');
      console.log('─'.repeat(80));

      data.results.slice(-5).forEach(bar => {
        const date = new Date(bar.t).toISOString().split('T')[0];
        console.log(
          `${date}  ` +
          `$${bar.o.toFixed(2).padStart(8)}  ` +
          `$${bar.h.toFixed(2).padStart(8)}  ` +
          `$${bar.l.toFixed(2).padStart(8)}  ` +
          `$${bar.c.toFixed(2).padStart(8)}  ` +
          `${bar.v.toLocaleString().padStart(12)}`
        );
      });

      console.log('─'.repeat(80));
      console.log('\n✅ API is working correctly!');
      console.log(`\n📊 You can fetch data for all 50 stocks using the same endpoint`);
      console.log(`⏱️  Rate limit: 5 calls/minute (12 seconds between calls)`);
      console.log(`📦 Estimated time for 50 stocks: ~10 minutes`);

    } else {
      console.warn(`⚠️  No data returned`);
      console.log('Response:', JSON.stringify(data, null, 2));
    }

  } catch (error) {
    console.error(`❌ Fetch error:`, error instanceof Error ? error.message : 'Unknown error');
  }
}

testAPI().catch(console.error);
