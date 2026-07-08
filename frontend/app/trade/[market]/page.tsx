
"use client";

import { MarketBar } from "@/app/components/MarketBar";
import { SwapUI } from "@/app/components/SwapUi";
import { TradeView } from "@/app/components/TradeView";
import { Depth } from "@/app/components/depth/Depth";
import { useParams } from "next/navigation";


export default function Page(){
    const {market} = useParams();

    return<div className="flex flex-row flex-1 text-white">
        <div className="flex flex-col flex-1">
            <MarketBar  market={market as string}/> 
            <div className="flex flex-row h-[600px] border-y border-slate-800">
                <div className="flex flex-col flex-1">
                    <TradeView market={market as string}/>

                </div>
                <div className="flex flex-col w-80 border-l border-slate-800 p-2 overflow-y-auto">
                    <Depth market={market as string}/>
                </div>
                <div className="flex flex-col w-80 border-l border-slate-800">
                    <SwapUI market={market as string}/>

                </div>

            </div>
            </div> 

    </div>
}