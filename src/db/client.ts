import { Client } from "pg";

export const client = new Client({
  host: process.env.DATABASE_URL,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  port: 5432,
  database: "postgres",
});

export async function initDb() {
  console.log("Connecting to database");
  await client.connect();
  console.log("Connected to database");

  await client.query(`
      CREATE TABLE IF NOT EXISTS bot_messages
      (
          id          SERIAL PRIMARY KEY,
          ts          VARCHAR(255)                        NOT NULL,
          channel     VARCHAR(255)                        NOT NULL,
          inserted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
      );

      CREATE TABLE IF NOT EXISTS leet_messages
      (
          id          SERIAL PRIMARY KEY,
          ts          VARCHAR(255)                        NOT NULL,
          channel     VARCHAR(255)                        NOT NULL,
          ts_as_date  TIMESTAMP                           NOT NULL,
          inserted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
          message     JSONB                               NOT NULL
      );

      CREATE INDEX IF NOT EXISTS leet_messages_channel_idx ON leet_messages (channel);
  `);
}
