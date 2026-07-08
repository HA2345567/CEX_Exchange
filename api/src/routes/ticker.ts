import {Router} from "express"

export const tickerRouter = Router();

tickerRouter.get("/",async(req ,res)=>{
    res.json([
        {
            "firstPrice" : "1000",
            "high": "1025",
            "lastPrice": "1008",
            "low": "995",
            "priceChange": "8",
            "priceChangePercent": "0.8",
            "quoteVolume": "500000",
            "symbol": "TATA_INR",
            "trades": "150",
            "volume": "500"
        }
    ]);
})
