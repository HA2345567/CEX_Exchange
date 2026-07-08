import fs from "fs"
import { RedisManager } from "../RedisManager";
import { Orderbook, type Fill, type Order } from "./orderbook";
import { CANCEL_ORDER, CREATE_ORDER, GET_DEPTH, GET_OPEN_ORDERS, ON_RAMP, type MessageFromApi } from "../types/fromApi";
import { ORDER_UPDATE, TRADE_ADDED } from "../types";

export const BASE_CURRENCY = "INR";

interface UserBalance {
    [key: string]: {
        available: number;
        locked: number;
    }
}

export class Engine {
    private orderbooks: Orderbook[] = [];
    private balances: Map<string, UserBalance> = new Map();

    constructor() {
        let snapshot = null
        try {
            if (process.env.WITH_SNAPSHOT === "true") {
                snapshot = fs.readFileSync("./snapshot.json");
            }
        } catch (e) {
            console.log("No snapshot found");
        }

        if (snapshot) {
            const snapshotSnapshot = JSON.parse(snapshot.toString());
            this.orderbooks = snapshotSnapshot.orderbooks.map((o: any) => new Orderbook(o.baseAsset, o.bids, o.asks, o.lastTradeId, o.currentPrice));
            this.balances = new Map(snapshotSnapshot.balances);
        } else {
            this.orderbooks = [new Orderbook(`TATA`, [], [], 0, 0)];
            this.setBaseBalance();
        }
        setInterval(() => {
            this.saveSnapshot();
        }, 1000 * 3);
    }

    saveSnapshot() {
        const snapshotSnapshot = {
            orderbooks: this.orderbooks.map(o => o.getSnapshot()),
            balances: Array.from(this.balances.entries())
        }
        fs.writeFileSync("./snapshot.json", JSON.stringify(snapshotSnapshot));
    }

    process({ message, clientId }: { message: MessageFromApi, clientId: string }) {
        switch (message.type) {
            case CREATE_ORDER:
                try {
                    const { executedQty , fills, orderId } = this.createOrder(message.data.market, message.data.price, message.data.quantity, message.data.side, message.data.userId);

                    RedisManager.getInstance().sendToApi(
                        clientId, {
                        type: "ORDER_PLACED",
                        payload: {
                            orderId,
                            executedQty,
                            fills
                        }
                    })

                } catch (e) {
                    console.log(e);
                    RedisManager.getInstance().sendToApi(clientId, {
                        type: "ORDER_CANCELLED",
                        payload: {
                            orderId: "",
                            exectuedQty: 0,
                            remainingQty: 0,
                        }
                    });
                }
                break;

            case CANCEL_ORDER:
                try {
                    const orderId = message.data.orderId;
                    const cancelMarket = message.data.market;
                    const cancelOrderbook = this.orderbooks.find(o => o.ticker() === cancelMarket);
                    const quoteAsset = cancelMarket.split("_")[1];

                    if (!quoteAsset) {
                        throw new Error("Invalid market format");
                    }

                    if (!cancelOrderbook) {
                        throw new Error("No orderbook found");
                    }

                    const order = cancelOrderbook.asks.find(o => o.orderId === orderId) || cancelOrderbook.bids.find(o => o.orderId === orderId);
                    if (!order) {
                        console.log("No order found");
                        throw new Error("No order found");
                    }

                    if (order.side === "buy") {
                        const price = cancelOrderbook.cancelBid(order)
                        const leftQuantity = (order.quantity - order.filled) * order.price;

                        const userBalance = this.balances.get(order.userId);
                        if (userBalance) {
                            if (!userBalance[BASE_CURRENCY]) {
                                userBalance[BASE_CURRENCY] = { available: 0, locked: 0 };
                            }
                            userBalance[BASE_CURRENCY].available += leftQuantity;
                            userBalance[BASE_CURRENCY].locked -= leftQuantity;
                        }

                        if (price) {
                            this.sendUpdatedDepthAt(price.toString(), cancelMarket);
                        }

                    } else {
                        const price = cancelOrderbook.cancelAsk(order)
                        const leftQuantity = order.quantity - order.filled;

                        const userBalance = this.balances.get(order.userId);
                        if (userBalance) {
                            if (!userBalance[quoteAsset]) {
                                userBalance[quoteAsset] = { available: 0, locked: 0 };
                            }
                            userBalance[quoteAsset].available += leftQuantity;
                            userBalance[quoteAsset].locked -= leftQuantity;
                        }

                        if (price) {
                            this.sendUpdatedDepthAt(price.toString(), cancelMarket);
                        }
                    }

                    RedisManager.getInstance().sendToApi(clientId, {
                        type: "ORDER_CANCELLED",
                        payload: {
                            orderId: orderId,
                            exectuedQty: 0,
                            remainingQty: 0
                        }
                    })

                } catch (e) {
                    console.log("Error while cancelling order");
                    console.log(e);
                }
                break;

            case GET_OPEN_ORDERS:
                try {
                    const openOrderbook = this.orderbooks.find(o => o.ticker() === message.data.market);
                    if (!openOrderbook) {
                        throw new Error("No orderbook found");
                    }

                    const openOrders = openOrderbook.getOpenOrders(message.data.userId);

                    RedisManager.getInstance().sendToApi(clientId, {
                        type: "ORDER_ORDERS",
                        payload: openOrders
                    });
                } catch (e) {
                    console.log(e);
                }
                break;

            case ON_RAMP:
                const userId = message.data.userId;
                const amount = Number(message.data.amount);
                this.onRamp(userId, amount);
                break;

            case GET_DEPTH:
                try {
                    const market = message.data.market;
                    const orderbook = this.orderbooks.find(o => o.ticker() === market);
                    if (!orderbook) {
                        throw new Error("No orderbook found");
                    }
                    RedisManager.getInstance().sendToApi(clientId, {
                        type: "DEPTH",
                        payload: orderbook.getDepth()
                    });

                } catch (e) {
                    console.log(e);
                    RedisManager.getInstance().sendToApi(clientId, {
                        type: "DEPTH",
                        payload: {
                            bids: [],
                            asks: []
                        }
                    })
                }
                break;
        }
    }

    addOrderbook(orderbook: Orderbook) {
        this.orderbooks.push(orderbook);
    }

    createOrder(market: string, price: string, quantity: string, side: "buy" | "sell", userId: string) {
        const orderbook = this.orderbooks.find(o => o.ticker() === market);
        const baseAsset = market.split("_")[0];
        const quoteAsset = market.split("_")[1];

        if (!baseAsset || !quoteAsset) {
            throw new Error("Invalid market format");
        }

        if (!orderbook) {
            throw new Error("No orderbook found");
        }

        this.checkAndLockFunds(baseAsset, quoteAsset, side, userId, price, quantity);

        const order: Order = {
            price: Number(price),
            quantity: Number(quantity),
            orderId: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
            filled: 0,
            side,
            userId
        }

        const { fills, executedQty } = orderbook.addOrder(order);
        this.updateBalance(userId, baseAsset, quoteAsset, side, fills, executedQty);
        this.createDbTrades(fills, market, userId);
        this.updateDbOrders(order, executedQty, fills, market);
        this.publisWsDepthUpdates(fills, price, side, market);
        this.publishWsTrades(fills, userId, market);

        return { executedQty, fills, orderId: order.orderId };
    }

    updateDbOrders(order: Order, executedQty: number, fills: Fill[], market: string) {
        RedisManager.getInstance().pushMessage({
            type: ORDER_UPDATE,
            data: {
                orderId: order.orderId,
                executedQty: executedQty,
                market: market,
                price: order.price.toString(),
                quantity: order.quantity.toString(),
                side: order.side,
            }
        });

        fills.forEach(fill => {
            RedisManager.getInstance().pushMessage({
                type: ORDER_UPDATE,
                data: {
                    orderId: fill.marketOrderId,
                    executedQty: fill.qty
                }
            });
        });
    }

    createDbTrades(fills: Fill[], market: string, userId: string) {
        fills.forEach(fill => {
            RedisManager.getInstance().pushMessage({
                type: TRADE_ADDED,
                data: {
                    market: market,
                    id: fill.tradeId.toString(),
                    isBuyerMaker: fill.otherUserId === userId,
                    price: fill.price,
                    quantity: fill.qty.toString(),
                    quoteQuantity: (fill.qty * Number(fill.price)).toString(),
                    timestamp: Date.now().toString(),
                }
            })
        })
    }

    publishWsTrades(fills: Fill[], userId: string, market: string) {
        fills.forEach(fill => {
            RedisManager.getInstance().publishMessage(`trade@${market}`, {
                stream: `trade@${market}`,
                data: {
                    e: "trade",
                    t: fill.tradeId,
                    m: fill.otherUserId === userId,
                    p: fill.price,
                    q: fill.qty.toString(),
                    s: market,
                }
            })
        })
    }

    sendUpdatedDepthAt(price: string, market: string) {
        const orderbook = this.orderbooks.find(o => o.ticker() === market);
        if (!orderbook) {
            return;
        }

        const depth = orderbook.getDepth();
        const updateBids = depth.bids.filter(x => Number(x[0]) === Number(price));
        const updateAsks = depth.asks.filter(x => Number(x[0]) === Number(price));

        RedisManager.getInstance().publishMessage(`depth@${market}`, {
            stream: `depth@${market}`,
            data: {
                a: updateAsks.length ? updateAsks : [[price, "0"]],
                b: updateBids.length ? updateBids : [[price, "0"]],
                e: "depth"
            }
        });
    }

    publisWsDepthUpdates(fills: Fill[], price: string, side: "buy" | "sell", market: string) {
        const orderbook = this.orderbooks.find(o => o.ticker() === market);
        if (!orderbook) return;

        const depth = orderbook.getDepth();
        if (side === "buy") {
            const updateAsks = depth.asks.filter(x => fills.map(f => Number(f.price)).includes(Number(x[0])));
            const updateBids = depth.bids.find(x => Number(x[0]) === Number(price));
            console.log("publish ws depth updates")
            RedisManager.getInstance().publishMessage(`depth@${market}`, {
                stream: `depth@${market}`,
                data: {
                    a: updateAsks,
                    b: updateBids ? [updateBids] : [],
                    e: "depth"
                }
            })
        }

        if (side === "sell") {
            const updatedBids = depth.bids.filter(x => fills.map(f => Number(f.price)).includes(Number(x[0])));
            const updateAsks = depth.asks.find(x => Number(x[0]) === Number(price));
            console.log("publish ws depth updates")
            RedisManager.getInstance().publishMessage(`depth@${market}`, {
                stream: `depth@${market}`,
                data: {
                    a: updateAsks ? [updateAsks] : [],
                    b: updatedBids,
                    e: "depth"
                }
            })
        }
    }

    updateBalance(userId: string, baseAsset: string, quoteAsset: string, side: "buy" | "sell", fills: Fill[], executedQty: number) {
        if (side === "buy") {
            fills.forEach(fill => {
                const otherBalance = this.balances.get(fill.otherUserId);
                const myBalance = this.balances.get(userId);

                if (otherBalance) {
                    if (!otherBalance[quoteAsset]) {
                        otherBalance[quoteAsset] = { available: 0, locked: 0 };
                    }
                    if (!otherBalance[baseAsset]) {
                        otherBalance[baseAsset] = { available: 0, locked: 0 };
                    }
                    otherBalance[quoteAsset].available += fill.qty * Number(fill.price);
                    otherBalance[baseAsset].locked -= fill.qty;
                }

                if (myBalance) {
                    if (!myBalance[quoteAsset]) {
                        myBalance[quoteAsset] = { available: 0, locked: 0 };
                    }
                    if (!myBalance[baseAsset]) {
                        myBalance[baseAsset] = { available: 0, locked: 0 };
                    }
                    myBalance[quoteAsset].locked -= fill.qty * Number(fill.price);
                    myBalance[baseAsset].available += fill.qty;
                }
            });
        } else {
            fills.forEach(fill => {
                const otherBalance = this.balances.get(fill.otherUserId);
                const myBalance = this.balances.get(userId);

                if (otherBalance) {
                    if (!otherBalance[quoteAsset]) {
                        otherBalance[quoteAsset] = { available: 0, locked: 0 };
                    }
                    if (!otherBalance[baseAsset]) {
                        otherBalance[baseAsset] = { available: 0, locked: 0 };
                    }
                    otherBalance[quoteAsset].locked -= fill.qty * Number(fill.price);
                    otherBalance[baseAsset].available += fill.qty;
                }

                if (myBalance) {
                    if (!myBalance[quoteAsset]) {
                        myBalance[quoteAsset] = { available: 0, locked: 0 };
                    }
                    if (!myBalance[baseAsset]) {
                        myBalance[baseAsset] = { available: 0, locked: 0 };
                    }
                    myBalance[quoteAsset].available += fill.qty * Number(fill.price);
                    myBalance[baseAsset].locked -= fill.qty;
                }
            });
        }
    }

    checkAndLockFunds(baseAsset: string, quoteAsset: string, side: "buy" | "sell", userId: string, price: string, quantity: string) {
        const userBalance = this.balances.get(userId);
        if (!userBalance) {
            throw new Error("User balance not found");
        }

        if (side === "buy") {
            if (!userBalance[quoteAsset]) {
                userBalance[quoteAsset] = { available: 0, locked: 0 };
            }
            const cost = Number(quantity) * Number(price);
            if (userBalance[quoteAsset].available < cost) {
                throw new Error("Insufficient funds");
            }
            userBalance[quoteAsset].available -= cost;
            userBalance[quoteAsset].locked += cost;
        } else {
            if (!userBalance[baseAsset]) {
                userBalance[baseAsset] = { available: 0, locked: 0 };
            }
            const qty = Number(quantity);
            if (userBalance[baseAsset].available < qty) {
                throw new Error("Insufficient funds");
            }
            userBalance[baseAsset].available -= qty;
            userBalance[baseAsset].locked += qty;
        }
    }

    onRamp(userId: string, amount: number) {
        const userBalance = this.balances.get(userId);
        if (!userBalance) {
            this.balances.set(userId, {
                [BASE_CURRENCY]: {
                    available: amount,
                    locked: 0
                }
            });
        } else {
            if (!userBalance[BASE_CURRENCY]) {
                userBalance[BASE_CURRENCY] = { available: 0, locked: 0 };
            }
            userBalance[BASE_CURRENCY].available += amount;
        }
    }

    setBaseBalance() {
        this.balances.set("1", {
            [BASE_CURRENCY]: {
                available: 1000000,
                locked: 0
            },
            "TATA": {
                available: 10000000,
                locked: 0
            }
        });

        this.balances.set("2", {
            [BASE_CURRENCY]: {
                available: 10000000,
                locked: 0
            },
            "TATA": {
                available: 10000000,
                locked: 0
            }
        });

        this.balances.set("5", {
            [BASE_CURRENCY]: {
                available: 10000000,
                locked: 0
            },
            "TATA": {
                available: 10000000,
                locked: 0
            }
        });
    }
}
