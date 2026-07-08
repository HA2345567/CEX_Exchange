


export const AskTable = (
    { asks }: { asks: [string, string][] }
) => {

    let currentTotal = 0;
    const relevantAsks = asks.slice(0, 15);
    relevantAsks.reverse();

    const askWithTotal: [string, string, number][] = relevantAsks.map(([price, quantity]) => [price, quantity, currentTotal += Number(quantity)]);

    const maxTotal = relevantAsks.reduce((acc, [_, quantity]) => acc + Number(quantity), 0);
    askWithTotal.reverse();

    return <div>
        {askWithTotal.map(([price, quantity, total]) => <Ask key={price} maxTotal={maxTotal} price={price} quantity={quantity} total={total} />)}

    </div>
}

function Ask({ price, quantity, total, maxTotal }: { price: string, quantity: string, total: number, maxTotal: number }) {
    return <div
        style={{
            display: "flex",
            position: "relative",
            width: "100%",
            backgroundColor: "transparent",
            overflow: "hidden"
        }}>
        <div
            style={{
                position: "absolute",
                top: 0,
                right: 0,
                width: `${(100 * total) / maxTotal}%`,
                height: "100%",
                background: "rgba(239, 68, 68, 0.08)",
                transition: "width 0.3s ease-in-out",
            }}></div>

        <div className="flex justify-between text-xs w-full px-2 py-1 z-10 font-mono">
            <div className="w-1/3 text-left text-red-500 font-semibold">
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
}