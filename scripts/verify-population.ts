import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyPopulation() {
  try {
    console.log('🔍 Verifying Database Population...\n');

    // Get total counts
    const totalStocks = await prisma.stock.count();
    const totalPrices = await prisma.stockPrice.count();

    console.log('📊 Overall Statistics:');
    console.log(`   Total Stocks: ${totalStocks}`);
    console.log(`   Total Price Records: ${totalPrices.toLocaleString()}`);
    console.log(`   Average Records per Stock: ${Math.round(totalPrices / totalStocks)}\n`);

    // Get per-stock statistics
    console.log('📈 Per-Stock Breakdown:\n');
    console.log('Symbol'.padEnd(8) + 'Name'.padEnd(35) + 'Records'.padEnd(10) + 'Latest Date'.padEnd(15) + 'Earliest Date');
    console.log('─'.repeat(85));

    const stocks = await prisma.stock.findMany({
      include: {
        prices: {
          select: {
            date: true,
          },
          orderBy: {
            date: 'desc',
          },
        },
      },
      orderBy: {
        symbol: 'asc',
      },
    });

    let stocksWithData = 0;
    let stocksWithoutData = 0;

    for (const stock of stocks) {
      const priceCount = stock.prices.length;

      if (priceCount > 0) {
        stocksWithData++;
        const latestDate = stock.prices[0]?.date.toISOString().split('T')[0] || 'N/A';
        const earliestDate = stock.prices[priceCount - 1]?.date.toISOString().split('T')[0] || 'N/A';

        console.log(
          stock.symbol.padEnd(8) +
          stock.name.substring(0, 33).padEnd(35) +
          priceCount.toString().padEnd(10) +
          latestDate.padEnd(15) +
          earliestDate
        );
      } else {
        stocksWithoutData++;
        console.log(
          stock.symbol.padEnd(8) +
          stock.name.substring(0, 33).padEnd(35) +
          '0'.padEnd(10) +
          'No data'.padEnd(15) +
          'No data'
        );
      }
    }

    console.log('\n📋 Summary:');
    console.log(`   ✅ Stocks with data: ${stocksWithData}`);
    console.log(`   ❌ Stocks without data: ${stocksWithoutData}`);

    if (stocksWithoutData === 0 && totalPrices > 20000) {
      console.log('\n🎉 SUCCESS! Database is fully populated with historical data.');
    } else if (stocksWithoutData > 0) {
      console.log(`\n⚠️  WARNING: ${stocksWithoutData} stocks are missing price data.`);
    } else {
      console.log('\n⚠️  WARNING: Total price records seem low. Expected ~25,000 records.');
    }

  } catch (error) {
    console.error('❌ Error verifying database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyPopulation();
