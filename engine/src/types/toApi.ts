import type { Order } from "../trade/orderbook";


export const CREATE_ORDER = "CREATE_ORDER";
export const CANCEL_ORDER = "CANCEL_ORDER";
export const ON_RAMP = "ON_RAMP";

export const GET_DPETH = "GET_DEPTH";

export type MessageToApi={
    type: "DEPTH",
    payload: {
        bids: [string,string][],
        asks: [string, string][],
    }
} |{
    type: "ORDER_PLACED",
    payload:{
        orderId: string,
        executedQty:number,
        fills:{
            price: string,
            qty : number,
            tradeId: number

        }[]
    }
} | {
    type: "ORDER_CANCELLED",
    payload:{
        orderId: string,
        exectuedQty:number;
        remainingQty: number;
    }
} | {
    type: "ORDER_ORDERS",
    payload:Order[]
}