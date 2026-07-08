import { Router } from 'express';
import { Client } from 'pg';

const pgClient = new Client({
  user: 'your_user',
  host: 'localhost',
  database: 'my_database',
  password: 'your_password',
  port: 5432,
});

let pgReady = false;

async function ensurePgClient() {
  if (pgReady) return pgClient;

  try {
    await pgClient.connect();
    pgReady = true;
    return pgClient;
  } catch (error) {
    console.warn('Postgres not ready yet:', error);
    return null;
  }
}

export const klineRouter = Router();

klineRouter.get('/', async (req, res) => {
  const { market, interval, startTime, endTime } = req.query;
  const currency = (market as string)?.split("_")[1] || 'INR';

  let query;
  switch (interval) {
    case '1m':
      query = 'SELECT * FROM klines_1m WHERE bucket >= $1 AND bucket <= $2 AND currency_code = $3';
      break;
    case '1h':
      query = 'SELECT * FROM klines_1h WHERE bucket >= $1 AND bucket <= $2 AND currency_code = $3';
      break;
    case '1w':
      query = 'SELECT * FROM klines_1w WHERE bucket >= $1 AND bucket <= $2 AND currency_code = $3';
      break;
    default:
      return res.status(400).send('Invalid interval');
  }

  try {
    const client = await ensurePgClient();
    if (!client) {
      return res.status(503).json({ error: 'Database unavailable' });
    }

    console.log("kline query params:", { market, interval, startTime, endTime, currency, start: new Date(Number(startTime) * 1000), end: new Date(Number(endTime) * 1000) });
    const result = await client.query(query, [
      new Date(Number(startTime) * 1000),
      new Date(Number(endTime) * 1000),
      currency
    ]);
    console.log("kline query result count:", result.rows.length);

    res.json(
      result.rows.map((x) => ({
        close: x.close,
        end: x.bucket,
        high: x.high,
        low: x.low,
        open: x.open,
        quoteVolume: x.quoteVolume,
        start: x.start,
        trades: x.trades,
        volume: x.volume,
      })),
    );
  } catch (e) {
    console.log(e);
    res.status(500).send(e);
  }
});