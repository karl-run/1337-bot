import { Client } from "pg";
import { config } from "dotenv";
import { GenericMessageEvent, KnownEventFromType } from "@slack/bolt";
import { slackTsToDate } from "./date-utils";

config();

const client = new Client({
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

export async function getCurrentBotMessageTS(
  channelId: string,
): Promise<string | null> {
  const result = await client.query(
    `
            SELECT ts
            FROM bot_messages
            WHERE inserted_at::date = current_date
              AND channel = $1
            ORDER BY ts DESC
            LIMIT 1;
        `,
    [channelId],
  );

  if (result.rowCount > 0) {
    return result.rows[0].ts;
  } else {
    return null;
  }
}

export async function insertNewBotMessage(
  ts: string,
  channelId: string,
): Promise<void> {
  await client.query(
    `
            INSERT INTO bot_messages (ts, channel)
            VALUES ($1, $2);
        `,
    [ts, channelId],
  );
}

export async function insertLeetMessage(
  channelId: string,
  message: GenericMessageEvent,
) {
  console.info(`Inserting message for user ${(message as any).user}`);
  await client.query(
    `
            INSERT INTO leet_messages (ts, ts_as_date, channel, message)
            VALUES ($1, $2, $3, $4);
        `,
    [message.ts, slackTsToDate(message.ts), channelId, message],
  );
}

type UserLeetRow = {
  id: number;
  ts: string;
  channel: string;
  ts_as_date: Date;
  inserted_at: Date;
  message: GenericMessageEvent;
};

export async function getTodaysLeets(channelId: string) {
  const queryResult = await client.query(
    `
      SELECT *
      FROM leet_messages
      WHERE channel = $1
        AND ts_as_date > current_date
      ORDER BY ts_as_date DESC;
  `,
    [channelId],
  );

  return queryResult.rows as UserLeetRow[];
}

export async function getAllLeets(channelId: string): Promise<UserLeetRow[]> {
  const queryResult = await client.query(
    `
            SELECT *
            FROM leet_messages
            WHERE channel = $1
            ORDER BY ts_as_date DESC;
        `,
    [channelId],
  );

  return queryResult.rows as UserLeetRow[];
}
