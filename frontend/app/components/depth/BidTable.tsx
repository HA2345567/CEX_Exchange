

export const BidTable=(
    {bids}: {bids:[string,string][]})=>{
        let currentTotal =0;
        const releventBids = bids.slice(0,15);
        const bidsWithTotal: [string,  string , number][] = releventBids.map(([price, quantity]) => [price,quantity,currentTotal += Number(quantity)]);
        const maxTotal = releventBids.reduce((acc,[_, quantity]) => acc + Number(quantity),0); 


        return <div>
            {bidsWithTotal?.map(([price,quantity,total]) => <Bid key={price} maxTotal={maxTotal} total={total} price={price} quantity={quantity}
        />)}
        </div>
}

 function Bid({price,quantity,total,maxTotal}:{price: string,quantity:string,total:number,maxTotal:number}) {
    return (
        <div
        style={{
            display:"flex",
            position:"relative",
            width:"100%",
            backgroundColor:"transparent",
            overflow:"hidden",
        }}>
            <div 
            style={{
                position:"absolute",
                top:0,
                right:0,
                width:`${(100*total)/maxTotal}%`,
                height:"100%",
                background:"rgba(16, 185, 129, 0.08)",
                transition:"width 0.3s ease-in-out",
            }}>

            </div>
              <div className="flex justify-between text-xs w-full px-2 py-1 z-10 font-mono">
                <div className="w-1/3 text-left text-green-500 font-semibold">
                    {price}
                </div>
                <div className="w-1/3 text-right text-slate-300">
                    {quantity}
                </div>
                <div className="w-1/3 text-right text-slate-400">
                    {total?.toFixed(2)}
                </div>


              </div>

        </div>
    )
 }
