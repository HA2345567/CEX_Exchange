"use client";
import { useEffect, useState } from "react";
import { getTicker } from "../utils/httpClient";
import { SignalingManager } from "../utils/SignalingManager";

type MarketTicker = {
  firstPrice: string | number;
  high: string | number;
  lastPrice: string | number;
  low: string | number;
  priceChange: string | number;
  priceChangePercent: string | number;
  quoteVolume: string | number;
  symbol: string;
  trades: string | number;
  volume: string | number;
};

export const MarketBar = ({ market }: { market: string }) => {
    const [ticker, setTicker] = useState<MarketTicker | null>(null);

    useEffect(() => {
        getTicker(market).then(setTicker);

        SignalingManager.getInstance().registerCallback("trade", (data: any) => {
            setTicker((prevTicker) => {
                if (!prevTicker) return null;
                const newPrice = Number(data.price);
                const prevHigh = Number(prevTicker.high) || 0;
                const prevLow = Number(prevTicker.low) || 0;
                const prevVolume = Number(prevTicker.volume) || 0;
                const qty = Number(data.quantity) || 0;
                
                const newHigh = prevHigh === 0 ? newPrice : Math.max(prevHigh, newPrice);
                const newLow = prevLow === 0 ? newPrice : Math.min(prevLow, newPrice);
                const newVolume = prevVolume + qty;

                const firstPrice = Number(prevTicker.firstPrice) || newPrice;
                const priceChange = newPrice - firstPrice;
                const priceChangePercent = firstPrice === 0 ? 0 : (priceChange / firstPrice) * 100;
                
                return {
                    ...prevTicker,
                    lastPrice: data.price,
                    high: newHigh.toString(),
                    low: newLow.toString(),
                    volume: newVolume.toString(),
                    priceChange: priceChange.toFixed(2),
                    priceChangePercent: priceChangePercent.toFixed(2),
                };
            });
        }, `TRADE-BAR-${market}`);

        SignalingManager.getInstance().sendMessage({"method":"SUBSCRIBE","params":[`trade@${market}`]});

        return () => {
            SignalingManager.getInstance().deRegisterCallback("trade", `TRADE-BAR-${market}`);
            SignalingManager.getInstance().sendMessage({"method":"UNSUBSCRIBE","params":[`trade@${market}`]});
        }
    }, [market])
    // 

    return <div>
        <div className="flex items-center flex-row relative w-full overflow-hidden border-b border-slate-800">
            <div className="flex items-center justify-between flex-row no-scrollbar overflow-auto pr-4">
                    <Ticker market={market} />
                    <div className="flex items-center flex-row space-x-8 pl-4">
                        <div className="flex flex-col h-full justify-center">
                            <p className={`font-medium tabular-nums text-greenText text-md text-green-500`}>${ticker?.lastPrice}</p>
                            <p className="font-medium text-sm tabular-nums">${ticker?.lastPrice}</p>
                        </div>
                        <div className="flex flex-col">
                            <p className={`font-medium text-xs text-slate-400 `}>24H Change</p>
                            <p className={` text-sm font-medium tabular-nums leading-5 text-greenText ${Number(ticker?.priceChange) > 0 ? "text-green-500" : "text-red-500"}`}>{Number(ticker?.priceChange) > 0 ? "+" : ""} {ticker?.priceChange} {Number(ticker?.priceChangePercent)?.toFixed(2)}%</p></div><div className="flex flex-col">
                                <p className="font-medium text-slate-400 text-sm">24H High</p>
                                <p className="text-sm font-medium tabular-nums leading-5  ">{ticker?.high}</p>
                                </div>
                                <div className="flex flex-col">
                                    <p className="font-medium  text-slate-400 text-sm">24H Low</p>
                                    <p className=" font-medium tabular-nums leading-5 text-sm ">{ticker?.low}</p>
                                </div>
                            <button type="button" className="font-medium transition-opacity hover:opacity-80 hover:cursor-pointer text-base text-left" data-rac="">
                                <div className="flex flex-col">
                                    <p className="font-medium  text-slate-400 text-sm">24H Volume</p>
                                    <p className="mt-1 font-medium tabular-nums leading-5 text-sm ">{ticker?.volume}
                                </p>
                            </div>
                        </button>
                    </div>
                </div>
            </div>
        </div>

}

function Ticker({ market }: { market: string }) {
    return (
        <div className="flex h-15 shrink-0 space-x-4">
            <div className="relative ml-2 -mr-4 flex flex-row">
                <img
                    alt="SOL Logo"
                    loading="lazy"
                    decoding="async"
                    data-nimg="1"
                    className="z-10 mt-4 h-6 w-6 rounded-full outline-baseBackgroundL1"
                    src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTVvBqZC_Q1TSYObZaMvK0DRFeHZDUtVMh08Q&s"
                />
                <img
                    alt="USDC Logo"
                    loading="lazy"
                    decoding="async"
                    data-nimg="1"
                    className="-ml-2 mt-4 h-6 w-6 rounded-full"
                    src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTVvBqZC_Q1TSYObZaMvK0DRFeHZDUtVMh08Q&s"
                />
            </div>
            <button type="button" className="react-aria-Button" data-rac="">
                <div className="flex cursor-pointer flex-row items-center justify-between rounded-lg p-3 hover:opacity-80">
                    <div className="flex flex-row items-center gap-2 undefined">
                        <div className="relative flex flex-row">
                            <p className="text-sm font-medium undefined">{market.replace("_", " / ")}</p>
                        </div>
                    </div>
                </div>
            </button>
        </div>
    );
}