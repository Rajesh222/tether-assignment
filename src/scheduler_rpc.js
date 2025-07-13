
import path from 'path';
import fetch from 'node-fetch';
import Hypercore from 'hypercore';
import Hyperbee from 'hyperbee';
import RPC from '@hyperswarm/rpc';
import DHT from 'hyperdht';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const core = new Hypercore(path.resolve(__dirname, 'db', 'combined-core'));
const bee = new Hyperbee(core, { keyEncoding: 'utf-8', valueEncoding: 'json' });

const dhtSeed = crypto.randomBytes(32);
const rpcSeed = crypto.randomBytes(32);


async function getTop5CryptoPrices() {
  // Fetch top 5 coins by market cap in USD
  const topCoinsRes = await fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=5&page=1');
  const topCoins = await topCoinsRes.json();

  const results = [];
  for (const coin of topCoins) {
    // Fetch tickers for each coin
    const tickersRes = await fetch(`https://api.coingecko.com/api/v3/coins/${coin.id}/tickers`);
    const tickers = await tickersRes.json();

    // Filter for USDT pairs and sort by trust_score
    const filtered = (tickers.tickers || [])
      .filter(t => t.target === 'USDT')
      .sort((a, b) => (b.trust_score || 0) - (a.trust_score || 0))
      .slice(0, 3);

    // Calculate average price if available
    let avgPrice = null;
    if (filtered.length > 0) {
      avgPrice = filtered.reduce((sum, x) => sum + (x.last || 0), 0) / filtered.length;
    }

    results.push({
      pair: `${coin.symbol.toUpperCase()}/USDT`,
      price: avgPrice,
      timestamp: Date.now(),
      exchanges: filtered.map(x => x.market.name)
    });
  }

  return results;
}

(async () => {
  await bee.ready();

  // 🔁 Scheduler: fetch + store every 30s
  setInterval(async () => {
    try {
      const prices = await getTop5CryptoPrices();
      for (const data of prices) {
        const key = `${data.pair}:${data.timestamp}`;
        bee.put(key, {
          price: data.price,
          timestamp: data.timestamp,
          exchanges: data.exchanges
        });
      }

      console.log(`[✓] Stored prices at ${new Date().toLocaleTimeString()}`);
    } catch (err) {
      console.error('[X] Fetch error:', err);
    }
  }, 30000);

  // 🌐 RPC Server Setup
  const dht = new DHT({
    port: 40001,
    keyPair: DHT.keyPair(dhtSeed),
    bootstrap: [{ host: '127.0.0.1', port: 30001 }]
  });
  await dht.ready();

  const rpc = new RPC({ seed: rpcSeed, dht });
  const server = rpc.createServer();
  await server.listen();

  console.log('[RPC] Server public key:', server.publicKey.toString('hex'));

  server.respond('getLatestPrices', async reqRaw => {
    const { pairs } = JSON.parse(reqRaw.toString('utf-8'));
    const results = [];

    for await (const { key, value } of bee.createReadStream({ reverse: true })) {

      const [pair] = key.split(':');
      if (pairs.includes(pair) && !results.find(r => r.pair === pair)) {
        results.push({ pair, ...value });
      }
    }
    return Buffer.from(JSON.stringify(results), 'utf-8');
  });

  server.respond('getHistoricalPrices', async reqRaw => {
    const { pairs, from, to } = JSON.parse(reqRaw.toString('utf-8'));
    const results = [];

    for await (const { key, value } of bee.createReadStream()) {
      const [pair, timestampStr] = key.split(':');
      const timestamp = Number(timestampStr);

      if (
        pairs.includes(pair) &&
        timestamp >= from &&
        timestamp <= to
      ) {
        results.push({ pair, ...value });
      }
    }

    return Buffer.from(JSON.stringify(results), 'utf-8');
  });

})();