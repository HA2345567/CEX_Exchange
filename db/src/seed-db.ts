const { Client } = require('pg');

const client = new Client({
    user: 'your_user',
    host: 'localhost',
    database: 'my_database',
    password: 'your_password',
    port: 5432,
});

async function initializeDB() {
    await client.connect();

    await client.query(`
        DROP TABLE IF EXISTS "tata_prices" CASCADE;
        CREATE TABLE "tata_prices"(
            time            TIMESTAMP WITH TIME ZONE NOT NULL,
            price   DOUBLE PRECISION,
            volume      DOUBLE PRECISION,
            currency_code   VARCHAR (10)
        );
        
        SELECT create_hypertable('tata_prices', 'time', 'price', 2);
    `);

    await client.query(`
        CREATE MATERIALIZED VIEW IF NOT EXISTS klines_1m AS
        SELECT
            time_bucket('1 minute', time) AS bucket,
            first(price, time) AS open,
            max(price) AS high,
            min(price) AS low,
            last(price, time) AS close,
            sum(volume) AS volume,
            currency_code
        FROM tata_prices
        GROUP BY bucket, currency_code;
    `);

    await client.query(`
        CREATE MATERIALIZED VIEW IF NOT EXISTS klines_1h AS
        SELECT
            time_bucket('1 hour', time) AS bucket,
            first(price, time) AS open,
            max(price) AS high,
            min(price) AS low,
            last(price, time) AS close,
            sum(volume) AS volume,
            currency_code
        FROM tata_prices
        GROUP BY bucket, currency_code;
    `);

    await client.query(`
        CREATE MATERIALIZED VIEW IF NOT EXISTS klines_1w AS
        SELECT
            time_bucket('1 week', time) AS bucket,
            first(price, time) AS open,
            max(price) AS high,
            min(price) AS low,
            last(price, time) AS close,
            sum(volume) AS volume,
            currency_code
        FROM tata_prices
        GROUP BY bucket, currency_code;
    `);

    console.log("Generating seed price data...");
    const now = new Date();
    for (let i = 200; i >= 0; i--) {
        const hourTime = now.getTime() - i * 60 * 60 * 1000;
        const basePrice = 1000 + Math.sin(i / 10) * 15;
        
        // Insert 4 points per hour to get distinct open, close, high, and low values
        for (let j = 0; j < 4; j++) {
            const time = new Date(hourTime + j * 15 * 60 * 1000);
            const price = basePrice + (j - 1.5) * (3 + Math.random() * 2) + (Math.random() - 0.5) * 4;
            const volume = 10 + Math.random() * 50;
            await client.query(`INSERT INTO tata_prices (time, price, volume, currency_code) VALUES ($1, $2, $3, $4)`, [
                time,
                price,
                volume,
                'INR'
            ]);
        }
    }

    console.log("Refreshing materialized views...");
    await client.query('REFRESH MATERIALIZED VIEW klines_1m');
    await client.query('REFRESH MATERIALIZED VIEW klines_1h');
    await client.query('REFRESH MATERIALIZED VIEW klines_1w');

    await client.end();
    console.log("Database initialized and populated successfully");
}

initializeDB().catch(console.error);
