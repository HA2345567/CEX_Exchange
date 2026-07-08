import { Depth, KLine, Ticker } from "./types";
import axios from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api/v1";

export async function getTicker(market: string): Promise<Ticker> {
  const tickers = await getTickers();
  const ticker = tickers.find((t) => t.symbol === market);

  if (!ticker) {
    throw new Error(`No ticker found for ${market}`);
  }

  return ticker;
}

export async function getTickers(): Promise<Ticker[]> {
  try {
    const response = await axios.get<Ticker[]>(`${BASE_URL}/ticker`);
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error("Failed to fetch tickers", error);
    return [];
  }
}

export async function getDepth(market: string): Promise<Depth> {
  try {
    const response = await axios.get<Depth>(`${BASE_URL}/depth`, {
      params: { symbol: market },
    });
    return response.data;
  } catch (error) {
    console.error("Failed to fetch depth", error);
    return { bids: [], asks: [], lastUpdatedId: "0" };
  }
}

export async function getTrades(market: string): Promise<Depth> {
  try {
    const response = await axios.get<Depth>(`${BASE_URL}/trades`, {
      params: { market },
    });
    return response.data;
  } catch (error) {
    console.error("Failed to fetch trades", error);
    return { bids: [], asks: [], lastUpdatedId: "0" };
  }
}

export async function getKlines(
  market: string,
  interval: string,
  startTime: number,
  endTime: number,
): Promise<KLine[]> {
  try {
    const response = await axios.get<KLine[]>(`${BASE_URL}/kline`, {
      params: { market, interval, startTime, endTime },
    });
    const data: KLine[] = response.data;
    return data.sort((x, y) => (Number(x.end) < Number(y.end) ? -1 : 1));
  } catch (error) {
    console.error("Failed to fetch klines", error);
    return [];
  }
}

export async function createOrder(
  market: string,
  price: string,
  quantity: string,
  side: "buy" | "sell",
  userId: string = "5"
): Promise<any> {
  try {
    const response = await axios.post(`${BASE_URL}/order`, {
      market,
      price,
      quantity,
      side,
      userId,
    });
    return response.data;
  } catch (error) {
    console.error("Failed to create order", error);
    throw error;
  }
}