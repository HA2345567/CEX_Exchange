# CEX Exchange

> A high-performance, real-time Centralized Cryptocurrency Exchange — built with a microservices architecture, sub-millisecond matching engine, live orderbooks, and a stunning professional trading UI.

![Exchange Screenshot](public/screenshot.png)

---

## 🚀 Features

- ⚡ **Sub-millisecond Matching Engine** — In-memory order matching with full price-time priority
- 📈 **Real-Time Candlestick Charts** — Powered by TradingView Lightweight Charts with live OHLCV updates
- 📊 **Live Orderbook** — Depth updates streamed via WebSocket with green/red bid/ask visualization
- 🔁 **Real-Time Market Data** — Live price, 24H high/low, volume, and change percentage
- 💸 **Limit & Market Orders** — Full buy/sell order placement and cancellation
- 🏦 **TimescaleDB Candles** — Historical OHLCV data stored in time-series materialized views (1m, 1h, 1w)
- 🤖 **Market Maker Bot** — Automated liquidity provider simulating realistic bid/ask spreads
- 🐳 **Dockerized Infrastructure** — One-command startup with Redis + TimescaleDB via Docker Compose

---

## 🏗️ Architecture

This exchange is built as a set of decoupled, independently scalable microservices communicating via **Redis pub/sub queues**.

```
┌─────────────────────────────────────────────────────────────────┐
│                          Client Browser                         │
│                     (Next.js Frontend)                          │
└─────────────┬───────────────────────────┬───────────────────────┘
              │ HTTP REST                 │ WebSocket
              ▼                           ▼
┌─────────────────────┐       ┌─────────────────────┐
│     API Server      │       │   WebSocket Server  │
│  (Express/Bun)      │       │      (ws/Bun)        │
└────────┬────────────┘       └──────────┬──────────┘
         │                               │
         │       Redis Pub/Sub           │
         └───────────┬───────────────────┘
                     │
         ┌───────────▼───────────────┐
         │     Matching Engine       │
         │  (In-Memory / TypeScript) │
         └───────────┬───────────────┘
                     │
         ┌───────────▼───────────────┐
         │      DB Processor         │
         │  (Trade Writer / Bun)     │
         └───────────┬───────────────┘
                     │
         ┌───────────▼───────────────┐
         │      TimescaleDB          │
         │  (PostgreSQL + klines)    │
         └───────────────────────────┘
```

### Microservices Overview

| Service | Tech | Responsibility |
|---|---|---|
| `frontend/` | Next.js 16, Lightweight Charts | Trading UI, real-time charts and orderbook |
| `api/` | Express, Bun | REST API for orders, depth, tickers, klines |
| `engine/` | TypeScript, Bun | In-memory order matching and trade execution |
| `ws/` | WebSocket, Bun | Real-time event broadcasting (depth, trades, tickers) |
| `db/` | Bun, pg | DB schema, seeding, TimescaleDB materialized views |
| `marketMaker/` | Axios, Bun | Simulates market liquidity with automated orders |

---

## 🖥️ Tech Stack

**Frontend**
- [Next.js 16](https://nextjs.org/) with App Router
- [Lightweight Charts](https://tradingview.github.io/lightweight-charts/) for candlestick charts
- WebSocket client for live orderbook and price streaming
- Vanilla CSS with modern glassmorphism design

**Backend**
- [Bun](https://bun.sh/) runtime across all microservices
- [Express](https://expressjs.com/) for HTTP API layer
- [Redis](https://redis.io/) for inter-service pub/sub messaging
- [TimescaleDB](https://www.timescale.com/) (PostgreSQL extension) for time-series OHLCV candles

---

## 📁 Project Structure

```
cex/
├── api/                  # REST API server (Express)
│   └── src/
│       ├── index.ts      # Entry point
│       ├── routes/       # order, depth, ticker, kline endpoints
│       └── RedisManager.ts
├── engine/               # Matching engine (in-memory)
│   └── src/
│       └── trade/
│           ├── Engine.ts    # Core matching logic
│           └── Orderbook.ts # Bid/Ask data structures
├── ws/                   # WebSocket server
│   └── src/index.ts
├── db/                   # Database layer
│   └── src/
│       ├── index.ts      # DB trade writer (listens Redis)
│       ├── seed-db.ts    # Seed historical price data
│       └── cron.ts       # Refresh materialized views
├── marketMaker/          # Automated market maker bot
│   └── src/index.ts
├── frontend/             # Next.js trading UI
│   └── app/
│       ├── components/   # MarketBar, Depth, SwapUi, etc.
│       ├── utils/        # ChartManager, SignalingManager
│       └── trade/        # Trading page
├── docker/
│   └── docker-compose.yml
└── public/
    └── screenshot.png
```

---

## ⚙️ Getting Started

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- [Bun](https://bun.sh/) v1.0+
- [Node.js](https://nodejs.org/) v18+

### 1. Clone the Repository

```bash
git clone https://github.com/HA2345567/CEX_Exchange.git
cd CEX_Exchange
```

### 2. Start Infrastructure (Redis + TimescaleDB)

```bash
cd docker
docker compose up -d
```

### 3. Seed the Database

```bash
cd db
bun install
bun run src/seed-db.ts
```

### 4. Start the Matching Engine

```bash
cd engine
bun install
bun run src/index.ts
```

### 5. Start the API Server

```bash
cd api
bun install
bun run src/index.ts
```

### 6. Start the WebSocket Server

```bash
cd ws
bun install
bun run src/index.ts
```

### 7. Start the DB Processor

```bash
cd db
bun run src/index.ts
# Also start the cron job for materialized view refresh:
bun run src/cron.ts
```

### 8. Start the Market Maker (Optional)

```bash
cd marketMaker
bun install
bun run src/index.ts
```

### 9. Start the Frontend

```bash
cd frontend
bun install
bun run dev
```

Open [http://localhost:3001](http://localhost:3001) in your browser.

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/depth?market=TATA_INR` | Get current orderbook depth |
| `GET` | `/api/v1/ticker?market=TATA_INR` | Get 24H ticker stats |
| `GET` | `/api/v1/kline?market=TATA_INR&interval=1h` | Get OHLCV candlestick data |
| `POST` | `/api/v1/order` | Place a new buy/sell order |
| `DELETE` | `/api/v1/order` | Cancel an existing order |
| `GET` | `/api/v1/order/open?userId=X&market=Y` | Get open orders for a user |

---

## 📡 WebSocket Subscriptions

Connect to `ws://localhost:3001` and subscribe:

```json
// Subscribe to orderbook depth updates
{ "method": "SUBSCRIBE", "params": ["depth@TATA_INR"] }

// Subscribe to live trade stream
{ "method": "SUBSCRIBE", "params": ["trade@TATA_INR"] }

// Subscribe to ticker updates
{ "method": "SUBSCRIBE", "params": ["ticker@TATA_INR"] }
```

---

## 📊 Database Schema

The `db` service manages:
- **`tata_prices`** — Raw trade records with price, quantity, currency, and timestamp
- **`klines_1m`** — 1-minute OHLCV materialized view (TimescaleDB continuous aggregate)
- **`klines_1h`** — 1-hour OHLCV materialized view
- **`klines_1w`** — 1-week OHLCV materialized view

---

## 📝 License

MIT License — feel free to fork, extend, and build on this project.

---

<p align="center">Built with ❤️ using TypeScript, Bun, Next.js, Redis, and TimescaleDB</p>
