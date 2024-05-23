import { ConversationsHistoryResponse } from "@slack/web-api";

import { app } from "../src/slack/slack";
import { slackTsToDate } from "../src/utils/date-utils";
import { formatDistanceToNow } from "date-fns";
import { insertLeetMessage } from "../src/db/queries";
import { GenericMessageEvent } from "@slack/bolt";
import { client, initDb } from "../src/db/client";

type Message = ConversationsHistoryResponse["messages"][0];

const CHANNEL_ID = "C04N7R2F8B0";

async function reparsAll() {
  console.info(`Starting repars of entire channel (${CHANNEL_ID})`);

  const firstPage = await app.client.conversations.history({
    channel: CHANNEL_ID,
    limit: 100,
  });
  const firstPageMessages: Message[] = firstPage.messages;

  console.info(
    `First page OK, ${firstPageMessages.length} messages found, has_more: ${firstPage.has_more}`,
  );
  const allMessages = [
    ...onlyLeet(firstPageMessages),
    ...(await traverseChannelPage(firstPage.response_metadata.next_cursor)),
  ];

  await initDb();
  for (const message of allMessages) {
    try {
      await insertLeetMessage(
        CHANNEL_ID,
        message as unknown as GenericMessageEvent,
      );
    } catch (e) {
      console.error(`Failed to insert ${message.ts}, reasen: ${e.message}`);
    }
  }
  await client.end();

  console.info(`Inserted or tried to insert ${allMessages.length} messages`);
}

let pages = 0;
async function traverseChannelPage(
  cursor: string,
  index = 0,
): Promise<Message[]> {
  console.info(`...traversing page ${index}`);

  const nextPage = await app.client.conversations.history({
    channel: CHANNEL_ID,
    cursor,
  });

  console.info(
    `Page ${index} (${formatDistanceToNow(
      slackTsToDate(nextPage.messages[0].ts),
    )}) OK, ${nextPage.messages.length} messages found, has_more: ${
      nextPage.has_more
    }`,
  );

  if (!nextPage.has_more || pages > 5) {
    const lastMessageTimeAgo = formatDistanceToNow(
      slackTsToDate(nextPage.messages[nextPage.messages.length - 1].ts),
    );
    console.info(
      `No more pages, we're done. Last message was ${lastMessageTimeAgo}`,
    );

    return onlyLeet(nextPage.messages);
  }

  // Don't DOS Slack
  await new Promise((resolve) => setTimeout(resolve, 32));

  return [
    ...onlyLeet(nextPage.messages),
    ...(await traverseChannelPage(
      nextPage.response_metadata.next_cursor,
      index + 1,
    )),
  ];
}

function onlyLeet(messages: Message[]): Message[] {
  return messages.filter(validLeetUserMessage);
}

function validLeetUserMessage(message: Message): boolean {
  if (message.bot_id) return false;
  if ("subtype" in message) return false;

  return message.text.includes("1337");
}

// @ts-ignore No bun config
await reparsAll();
