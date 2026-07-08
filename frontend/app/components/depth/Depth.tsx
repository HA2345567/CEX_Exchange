"use client"

import { useEffect, useState } from "react";
import { AskTable } from "./AskTable";
import { BidTable } from "./BidTable";
// import { TableHeader } from "../TableHeader";
import { SignalingManager } from "@/app/utils/SignalingManager";
import { getDepth, getTicker } from "@/app/utils/httpClient";

export const Depth=(
    {market}: {
        market: string
    }
)=>{
    const [bids,setBids] = useState<[string,string][]>();
    const [asks,setAsks] = useState<[string,string][]>();
    const [price,setPrice] = useState<string>();
    const [baseAsset, quoteAsset] = market.split("_");

    useEffect(()=>{
        SignalingManager.getInstance().registerCallback("depth",(data:any)=> {
            console.log("depth has been updated");
            
            setBids((originalBids)=>{
                const bidsAfterUpdate = [...(originalBids || [])];

                for(let i=0;i< bidsAfterUpdate.length;i++){
                    for(let j=0;j<data.bids.length;j++){
                        if(bidsAfterUpdate[i][0] === data.bids[j][0]){
                            bidsAfterUpdate[i][1]  = data.bids[j][1];
                            if(Number(bidsAfterUpdate[i][1]) === 0){
                                bidsAfterUpdate.splice(i,1);
                            }
                            break;
                        }
                    }
                }

                for(let j=0;j<data.bids.length;j++){
                    if(Number(data.bids[j][1]) !== 0 && !bidsAfterUpdate.map(x => x[0]).includes(data.bids[j][0])){
                        bidsAfterUpdate.push(data.bids[j]);
                        break;
                    }
                }
                bidsAfterUpdate.sort((x,y) => Number(y[0]) > Number(x[0]) ? -1 :1);
                return bidsAfterUpdate;
            });

            setAsks((originalAsks)=>{
                const asksAfterUpdate = [...(originalAsks || [])];

                for(let i =0;i<asksAfterUpdate.length;i++){
                    for(let j=0;j< data.asks.length;j++){
                        if(asksAfterUpdate[i][0] === data.asks[j][0]){
                            asksAfterUpdate[i][1] = data.asks[j][1];
                            if(Number(asksAfterUpdate[i][1]) === 0){
                                asksAfterUpdate.splice(i,1);
                            }
                            break;
                        }
                    }
                }

                for(let j=0;j < data.asks.length;j++){
                    if(Number(data.asks[j][1] ) !== 0 && !asksAfterUpdate.map(x => x[0]).includes(data.asks[j][0])){
                        asksAfterUpdate.push(data.asks[j]);
                        break;

                    }
                }
                asksAfterUpdate.sort((x,y) => Number(y[0]) > Number(x[0]) ? 1 : -1);
                return asksAfterUpdate

            });
        },`DEPTH-${market}`);

        SignalingManager.getInstance().registerCallback("ticker", (data: any) => {
            if (data.lastPrice) {
                setPrice(data.lastPrice);
            }
        }, `TICKER-DEPTH-${market}`);

        SignalingManager.getInstance().sendMessage({
            "method": "SUBSCRIBE",
            "params": [`depth@${market}`, `ticker.${market}`]
        });

        getDepth(market).then(d=> {
            setBids(d.bids.reverse());
            setAsks(d.asks);
        })

        getTicker(market).then(t => setPrice(t.lastPrice));

        return()=>{
            SignalingManager.getInstance().sendMessage({"method":"UNSUBSCRIBE","params":[`depth@${market}`, `ticker.${market}`]});
            SignalingManager.getInstance().deRegisterCallback("depth", `DEPTH-${market}`);
            SignalingManager.getInstance().deRegisterCallback("ticker", `TICKER-DEPTH-${market}`);
    }
  },[])

  useEffect(() => {
      if (bids && bids.length > 0 && asks && asks.length > 0) {
          const highestBid = Number(bids[0][0]);
          const lowestAsk = Number(asks[0][0]);
          setPrice(((highestBid + lowestAsk) / 2).toFixed(1));
      } else if (bids && bids.length > 0) {
          setPrice(bids[0][0]);
      } else if (asks && asks.length > 0) {
          setPrice(asks[0][0]);
      }
  }, [bids, asks]);

  return <div className="flex flex-col w-full h-full text-slate-300">
    <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-slate-500 px-2 py-1.5 border-b border-slate-800/60 mb-1">
      <div className="w-1/3 text-left">Price ({quoteAsset})</div>
      <div className="w-1/3 text-right">Size ({baseAsset})</div>
      <div className="w-1/3 text-right">Total ({baseAsset})</div>
    </div>
    
    <div className="flex flex-col overflow-hidden">
      {asks && <AskTable asks={asks}/>}
    </div>
    
    {price && (
      <div className="text-md font-bold text-center my-2.5 text-white border-y border-slate-800/80 py-2 bg-slate-900/40 font-mono tracking-wide">
        {price}
      </div>
    )}
    
    <div className="flex flex-col overflow-hidden">
      {bids &&  <BidTable bids={bids} />}
    </div>
  </div>
}