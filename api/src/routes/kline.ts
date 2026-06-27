import {Router} from 'express';
import {Client} from 'pg';

const pgClient = new Client({
    user: 'your_user',
    host: 'localhost',
    database: 'my_database',
    password: 'your_password',
    port: 5432,
});

pgClient.connect();

export const klineRouter = Router();

klineRouter.get("/",async(req ,res)=>{
    const {market,interval,startTime, endTime} = req.query;

    let query;
    switch(interval){
        
    }
})