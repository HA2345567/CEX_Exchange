
export interface KLine{
    close: string,
    end : string,
    high: string,
    low: string,
    open: string,
    quotoVolume: string,
    start: string,
    trades: string,
    volume:string,
}

export interface Trade{
    "id": number,
    "isBuyerMaker":boolean,
    "price": string,
    "quantity": string,
    "quoteQunatity":string,
    "timestamp": number
}

export interface Depth{
    bids:[string,string][],
    asks:[string,string][],
    lastUpdatedId: string
}

export interface Ticker{
    "firstPrice" : string,
    "high": string,
    "lastPrice": string,
    "low": string,
    "priceChange":string,
    "priceChangePercent": string,
    "quoteVolume": string,
    "symbol": string,
    "trades": string,
    "volume": string,
}