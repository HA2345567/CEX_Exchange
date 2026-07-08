"use client";
import { useState, useEffect } from "react";
import { createOrder, getTicker } from "../utils/httpClient";

export function SwapUI({ market }: {market: string}) {
    const [price, setPrice] = useState('0');
    const [quantity, setQuantity] = useState('0');
    const [activeTab, setActiveTab] = useState('buy');
    const [type, setType] = useState('limit');
    const [statusMessage, setStatusMessage] = useState<{ text: string; error: boolean } | null>(null);

    const [baseAsset, quoteAsset] = market.split("_");

    useEffect(() => {
        getTicker(market).then(t => {
            setPrice(t.lastPrice);
        }).catch(console.error);
    }, [market]);

    const handleSubmit = async () => {
        setStatusMessage(null);
        try {
            const data = await createOrder(
                market,
                price,
                quantity,
                activeTab as "buy" | "sell",
                "5" // Default user ID
            );
            console.log("Order created:", data);
            setStatusMessage({ text: `Order placed successfully! ID: ${data.orderId || 'filled'}`, error: false });
        } catch (error: any) {
            console.error("Order failed:", error);
            setStatusMessage({ text: "Failed to place order. Check balance.", error: true });
        }
    };

    return <div>
        <div className="flex flex-col">
            <div className="flex flex-row h-15">
                <BuyButton activeTab={activeTab} setActiveTab={setActiveTab} />
                <SellButton activeTab={activeTab} setActiveTab={setActiveTab} />
            </div>
            <div className="flex flex-col gap-1">
                <div className="px-3">
                    <div className="flex flex-row flex-0 gap-5 undefined">
                        <LimitButton type={type} setType={setType} />
                        <MarketButton type={type} setType={setType} />                       
                    </div>
                </div>
                <div className="flex flex-col px-3">
                    <div className="flex flex-col flex-1 gap-3 text-baseTextHighEmphasis">
                        <div className="flex flex-col gap-3">
                            <div className="flex items-center justify-between flex-row">
                                <p className="text-xs font-normal text-baseTextMedEmphasis">Available Balance</p>
                                <p className="font-medium text-xs text-white">10,000,000 {activeTab === 'buy' ? quoteAsset : baseAsset}</p>
                            </div>
                        </div>
                        <div className="flex flex-col gap-2">
                            <p className="text-xs font-normal text-slate-400">
                                Price
                            </p>
                            <div className="flex flex-col relative">
                                <input 
                                    step="0.01" 
                                    placeholder="0" 
                                    className="h-12 rounded-lg border-2 border-solid border-slate-700 bg-background pr-12 text-right text-2xl leading-9 text-white placeholder-slate-500 ring-0 transition focus:border-blue-500 focus:ring-0" 
                                    type="text" 
                                    value={price} 
                                    onChange={(e) => setPrice(e.target.value)}
                                />
                                <div className="flex flex-row absolute right-1 top-1 p-2">
                                    <div className="relative text-xs text-slate-400 font-bold">
                                        {quoteAsset}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col gap-2 mt-2">
                        <p className="text-xs font-normal text-slate-400">
                            Quantity
                        </p>
                        <div className="flex flex-col relative">
                            <input 
                                step="0.01" 
                                placeholder="0" 
                                className="h-12 rounded-lg border-2 border-solid border-slate-700 bg-background pr-12 text-right text-2xl leading-9 text-white placeholder-slate-500 ring-0 transition focus:border-blue-500 focus:ring-0" 
                                type="text" 
                                value={quantity} 
                                onChange={(e) => setQuantity(e.target.value)}
                            />
                            <div className="flex flex-row absolute right-1 top-1 p-2">
                                <div className="relative text-xs text-slate-400 font-bold">
                                    {baseAsset}
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end flex-row">
                            <p className="font-medium pr-2 text-xs text-slate-400">≈ {(Number(price) * Number(quantity)).toFixed(2)} {quoteAsset}</p>
                        </div>
                        <div className="flex justify-center flex-row mt-2 gap-3">
                            <div 
                                className="flex items-center justify-center flex-row rounded-full px-4 py-1.5 text-xs cursor-pointer bg-slate-800 hover:bg-slate-700 text-white"
                                onClick={() => setQuantity("10")}
                            >
                                10
                            </div>
                            <div 
                                className="flex items-center justify-center flex-row rounded-full px-4 py-1.5 text-xs cursor-pointer bg-slate-800 hover:bg-slate-700 text-white"
                                onClick={() => setQuantity("50")}
                            >
                                50
                            </div>
                            <div 
                                className="flex items-center justify-center flex-row rounded-full px-4 py-1.5 text-xs cursor-pointer bg-slate-800 hover:bg-slate-700 text-white"
                                onClick={() => setQuantity("100")}
                            >
                                100
                            </div>
                            <div 
                                className="flex items-center justify-center flex-row rounded-full px-4 py-1.5 text-xs cursor-pointer bg-slate-800 hover:bg-slate-700 text-white"
                                onClick={() => setQuantity("1000")}
                            >
                                1000
                            </div>
                        </div>
                    </div>

                    <button 
                        type="button" 
                        className={`font-semibold focus:ring-blue-200 focus:none focus:outline-none text-center h-12 rounded-xl text-base px-4 py-2 my-4 text-white active:scale-98 cursor-pointer ${
                            activeTab === 'buy' ? 'bg-green-600 hover:bg-green-500' : 'bg-red-600 hover:bg-red-500'
                        }`} 
                        onClick={handleSubmit}
                    >
                        {activeTab === 'buy' ? 'Buy' : 'Sell'}
                    </button>

                    {statusMessage && (
                        <div className={`text-xs text-center font-bold pb-2 ${statusMessage.error ? 'text-red-500' : 'text-green-500'}`}>
                            {statusMessage.text}
                        </div>
                    )}

                    <div className="flex justify-between flex-row mt-1">
                        <div className="flex flex-row gap-2 text-white">
                            <div className="flex items-center">
                                <input className="form-checkbox rounded border border-solid border-slate-700 bg-base-950 font-light text-transparent shadow-none shadow-transparent outline-none ring-0 ring-transparent cursor-pointer h-5 w-5" id="postOnly" type="checkbox" data-rac="" />
                                <label className="ml-2 text-xs">Post Only</label>
                            </div>
                            <div className="flex items-center">
                                <input className="form-checkbox rounded border border-solid border-slate-700 bg-base-950 font-light text-transparent shadow-none shadow-transparent outline-none ring-0 ring-transparent cursor-pointer h-5 w-5" id="ioc" type="checkbox" data-rac="" />
                                <label className="ml-2 text-xs">IOC</label>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>;
}

function LimitButton({ type, setType }: { type: string, setType: any }) {
    return <div className="flex flex-col cursor-pointer justify-center py-2" onClick={() => setType('limit')}>
    <div className={`text-sm font-medium py-1 border-b-2 ${type === 'limit' ? "border-blue-500 text-white" : "border-transparent text-slate-400 hover:border-white hover:text-white"}`}>
        Limit
    </div>
</div>
}

function MarketButton({ type, setType }: { type: string, setType: any }) {
    return  <div className="flex flex-col cursor-pointer justify-center py-2" onClick={() => setType('market')}>
    <div className={`text-sm font-medium py-1 border-b-2 ${type === 'market' ? "border-blue-500 text-white" : "border-b-2 border-transparent text-slate-400 hover:border-white hover:text-white"} `}>
        Market
    </div>
    </div>
}

function BuyButton({ activeTab, setActiveTab }: { activeTab: string, setActiveTab: any }) {
    return <div className={`flex flex-col -mb-0.5 flex-1 cursor-pointer justify-center border-b-2 p-4 ${activeTab === 'buy' ? 'border-b-green-500 bg-green-950/20' : 'border-b-slate-800 hover:border-b-slate-700'}`} onClick={() => setActiveTab('buy')}>
        <p className="text-center text-sm font-semibold text-green-500">
            Buy
        </p>
    </div>
}

function SellButton({ activeTab, setActiveTab }: { activeTab: string, setActiveTab: any }) {
    return <div className={`flex flex-col -mb-0.5 flex-1 cursor-pointer justify-center border-b-2 p-4 ${activeTab === 'sell' ? 'border-b-red-500 bg-red-950/20' : 'border-b-slate-800 hover:border-b-slate-700'}`} onClick={() => setActiveTab('sell')}>
        <p className="text-center text-sm font-semibold text-red-500">
            Sell
        </p>
    </div>
}