const { Pool } = require('pg')

const poolConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DB_SSL === 'false' ? false : { rejectUnauthorized: false },
    }
  : {
      host: process.env.DB_HOST || '127.0.0.1',
      port: Number(process.env.DB_PORT) || 5432,
      database: process.env.DB_NAME || 'coffee_order_db',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD,
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    }

const pool = new Pool({
  ...poolConfig,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
})

pool.on('error', (error) => {
  console.error('Unexpected PostgreSQL pool error:', error.message)
})

async function checkDatabaseConnection() {
  const result = await pool.query('SELECT current_database() AS database, NOW() AS server_time')
  return result.rows[0]
}

async function initializeDatabase() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS menus (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      price INTEGER NOT NULL CHECK (price >= 0),
      visual TEXT NOT NULL DEFAULT 'ice',
      image_url TEXT,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS menu_options (
      menu_id TEXT NOT NULL REFERENCES menus(id) ON DELETE CASCADE,
      id TEXT NOT NULL,
      label TEXT NOT NULL,
      price INTEGER NOT NULL DEFAULT 0 CHECK (price >= 0),
      PRIMARY KEY (menu_id, id)
    );

    CREATE TABLE IF NOT EXISTS orders (
      id BIGSERIAL PRIMARY KEY,
      client_request_id TEXT UNIQUE,
      status TEXT NOT NULL DEFAULT 'received' CHECK (status IN ('received', 'making', 'complete')),
      total INTEGER NOT NULL CHECK (total >= 0),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id BIGSERIAL PRIMARY KEY,
      order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      menu_id TEXT NOT NULL REFERENCES menus(id),
      menu_name TEXT NOT NULL,
      base_price INTEGER NOT NULL,
      quantity INTEGER NOT NULL CHECK (quantity > 0),
      unit_price INTEGER NOT NULL,
      line_total INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS order_item_options (
      order_item_id BIGINT NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
      option_id TEXT NOT NULL,
      label TEXT NOT NULL,
      price INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (order_item_id, option_id)
    );
  `)

  await pool.query(`
    INSERT INTO menus (id, name, description, price, visual, stock)
    VALUES
      ('americano-ice', '아메리카노(ICE)', '깔끔하고 시원한 산미의 아이스 아메리카노', 4000, 'ice', 10),
      ('americano-hot', '아메리카노(HOT)', '깊고 고소한 향을 담은 따뜻한 아메리카노', 4000, 'hot', 7),
      ('cafe-latte', '카페라떼', '부드러운 우유와 에스프레소의 조화', 5000, 'latte', 4),
      ('vanilla-latte', '바닐라라떼', '은은한 바닐라 향을 더한 달콤한 라떼', 5500, 'vanilla', 0)
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO menu_options (menu_id, id, label, price)
    VALUES
      ('americano-ice', 'shot', '샷 추가', 500),
      ('americano-ice', 'syrup', '시럽 추가', 0),
      ('americano-hot', 'shot', '샷 추가', 500),
      ('americano-hot', 'syrup', '시럽 추가', 0),
      ('cafe-latte', 'shot', '샷 추가', 500),
      ('cafe-latte', 'syrup', '시럽 추가', 0),
      ('vanilla-latte', 'shot', '샷 추가', 500),
      ('vanilla-latte', 'syrup', '시럽 추가', 0)
    ON CONFLICT (menu_id, id) DO NOTHING;
  `)
}

module.exports = { pool, checkDatabaseConnection, initializeDatabase }
