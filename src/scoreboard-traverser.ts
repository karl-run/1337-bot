import * as R from "remeda";
import { ConversationsHistoryResponse, WebClient } from "@slack/web-api";
import { KnownBlock } from "@slack/bolt";
import * as fs from "fs";
import { formatDistanceToNow } from "date-fns";
import { nb } from "date-fns/locale";
import { createPermalink } from "./slack-utils";

type Message = ConversationsHistoryResponse["messages"][number];

type DateMessageTuple = readonly [Date, Message];

export async function traverseHistory(channelId: string, client: WebClient) {
  if (true) {
    const jason: DateMessageTuple[] = JSON.parse(
      fs.readFileSync("premature-leet-messages.json", "utf-8")
    ).map(([date, message]: [Date, Message]) => [new Date(date), message]);

    // console.log(jason);

    // console.log(typeof jason[0][0]);

    top10Leets(channelId, jason);
    return;
  }

  console.info("Fetching initial page");

  const traverser = nextPageTraverser(client, channelId);
  const initialPage = await client.conversations.history({
    channel: channelId,
  });

  const restOfMessages: Message[] = await traverser(
    initialPage.response_metadata.next_cursor
  );
  const allMessages: DateMessageTuple[] = [
    ...(initialPage.messages ?? []).filter(byNonBotLeetMessages),
    ...restOfMessages,
  ]
    .map((it) => [new Date(+it.ts * 1000), it] as const)
    .filter(([date]) => date.getHours() === 13 && date.getMinutes() === 36);

  /*
  fs.writeFileSync(
    "premature-leet-messages.json",
    JSON.stringify(allMessages, null, 2)
  );
   */

  // console.log("Total count", allMessages.length);
  // createLeetDistributionPerSecondsCSV(allMessages);
}

function nextPageTraverser(client: WebClient, channelId: string) {
  let pageCount = 0;

  const getNextPage = async (
    nextCursor: string | undefined
  ): Promise<Message[]> => {
    if (nextCursor == null) {
      console.info("Hit end cursor");
      return [];
    }

    console.info(`Fetching page ${++pageCount}`);

    const nextPage = await client.conversations.history({
      channel: channelId,
      cursor: nextCursor,
    });

    if (nextPage.response_metadata.next_cursor) {
      const nextNextPage = await getNextPage(
        nextPage.response_metadata.next_cursor
      );

      return [
        ...nextPage.messages.filter(byNonBotLeetMessages),
        ...nextNextPage,
      ];
    } else {
      console.info(`Hit leaf node at page ${pageCount}`);

      return nextPage.messages.filter(byNonBotLeetMessages);
    }
  };

  return getNextPage;
}

function byNonBotLeetMessages(message: Message) {
  return message.bot_id == null && message.text.includes("1337");
}

function createLeetDistributionPerSecondsCSV(messages: DateMessageTuple[]) {
  const createEmptySeconds = (it: Record<number, DateMessageTuple[]>) =>
    R.merge(R.fromPairs(R.range(0, 60).map((it) => [it, []])), it);

  const countPerSecondsCSV = R.pipe(
    messages,
    R.groupBy(([date]) => date.getSeconds()),
    createEmptySeconds,
    R.mapValues((messages) => messages.length),
    R.toPairs,
    R.sortBy(([seconds]) => +seconds),
    R.map(([seconds, count]) => `${seconds},${count}`),
    R.join("\n")
  );

  console.log(countPerSecondsCSV);
}

function top10Leets(channelId: string, messages: DateMessageTuple[]) {
  const top10 = R.pipe(
    messages,
    R.filter(([date]) => date.getSeconds() === 59),
    R.sortBy([([date]) => 1000 - date.getMilliseconds(), "desc"]),
    R.take(10)
  );

  console.log(JSON.stringify(createTop10Blocks(channelId, top10), null, 2));
}

function createTop10Blocks(
  channelId: string,
  messages: DateMessageTuple[]
): KnownBlock[] {
  const formatMessage = ([date, message]: DateMessageTuple): string =>
    `-${(1000 - date.getMilliseconds()).toFixed(0).padStart(3, "0")}ms av <@${
      message.user
    }>: "${message.text}" ${formatDistanceToNow(date, {
      locale: nb,
      addSuffix: true,
    })} (<${createPermalink(channelId, message.ts)}|meldingen>)`;

  return [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: "Top 10 leetoos",
        emoji: true,
      },
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: messages.map(formatMessage).join("\n"),
      },
    },
  ];
}
