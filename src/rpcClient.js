
import RPC from '@hyperswarm/rpc';
import DHT from 'hyperdht';
import crypto from 'crypto';

// Replace this with actual printed public key from scheduler_rpc.js
const serverPubKey = Buffer.from('1ccda702cae65d0153af229875c0ae7917d801533f1f09d9c22d0712355a275f', 'hex');
const dhtSeed = crypto.randomBytes(32);

(async () => {
  const dht = new DHT({
    port: 50001,
    keyPair: DHT.keyPair(dhtSeed),
    bootstrap: [{ host: '127.0.0.1', port: 30001 }]
  });
  await dht.ready();

  const rpc = new RPC({ dht });

  const payload = { pairs: ['BTC/USDT', 'ETH/USDT'] };
  const reqRaw = Buffer.from(JSON.stringify(payload), 'utf-8');

  const resRaw = await rpc.request(serverPubKey, 'getLatestPrices', reqRaw);
  const response = JSON.parse(resRaw.toString('utf-8'));

  console.log('[Client] Latest Prices:', response);

  const payloadHistorical = {
    pairs: ['BTC/USDT', 'ETH/USDT'],
    from: Date.now() - 60 * 60 * 1000, // 1 hour ago
    to: Date.now()
  };

  const reqRawHis = Buffer.from(JSON.stringify(payloadHistorical), 'utf-8');
  const resRawHis = await rpc.request(serverPubKey, 'getHistoricalPrices', reqRawHis);
  const data = JSON.parse(resRawHis.toString('utf-8'));

  console.log('[Client] Historical Prices:', data);



  await rpc.destroy();
  await dht.destroy();
})();