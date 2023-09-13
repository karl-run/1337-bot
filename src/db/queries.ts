import { GenericMessageEvent } from "@slack/bolt";

import { slackTsToDate } from "../utils/date-utils";

import { client } from "./client";
import { UserLeetRow } from "./types";

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
