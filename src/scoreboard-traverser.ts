import * as R from "remeda";
import { WebClient } from "@slack/web-api";
import { ConversationsHistoryResponse } from "@slack/web-api";

type Message = ConversationsHistoryResponse["messages"][number];

type DateMessageTuple = readonly [Date, Message];

export async function traverseHistory(channelId: string, client: WebClient) {
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
    .filter(([date]) => date.getHours() === 13 && date.getMinutes() === 37);

  console.log("Total count", allMessages.length);
  createLeetDistributionPerSecondsCSV(allMessages);
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
