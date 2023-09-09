import { Client } from "pg";

const client = new Client({
  host: process.env.DATABASE_URL,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  port: 5432,
  database: "postgres",
});

export async function initDb() {
  await client.connect();

  await client.query(`
        CREATE TABLE IF NOT EXISTS messages (
            id SERIAL PRIMARY KEY,
            ts TIMESTAMP NOT NULL,
            channel VARCHAR(255) NOT NULL
        );
    `);
}

export async function getCurrentMessageTS(): Promise<string | null> {
  const result = await client.query(
    `
            SELECT ts FROM messages WHERE ts::date = current_date;
        `
  );

  if (result.rowCount > 0) {
    return result.rows[0].ts;
  } else {
    return null;
  }
}

export async function insertCurrentMessage(
  ts: string,
  channelId: string
): Promise<void> {
  await client.query(
    `
                INSERT INTO messages (ts, channel) VALUES ($1, $2);
            `,
    [ts, channelId]
  );
}
