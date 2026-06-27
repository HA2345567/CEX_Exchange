import {Router} from "express"

export const tickerRouter = Router();

tickerRouter.get("/",async(req ,res)=>{
    res.json({});
})
