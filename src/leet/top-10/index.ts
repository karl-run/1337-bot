import { GenericMessageEvent, KnownBlock } from "@slack/bolt";
import { formatDistanceToNowStrict } from "date-fns";
import * as R from "remeda";
import { nb } from "date-fns/locale";

import { createPermalink } from "../../utils/slack-utils";
import { slackTsToDate } from "../../utils/date-utils";
import * as db from "../../db/queries";

type DateMessageTuple = readonly [Date, GenericMessageEvent];

export async function getTopBlocks(
  channelId: string,
  count: number = 10,
): Promise<KnownBlock[]> {
  const messages: DateMessageTuple[] = (await db.getAllLeets(channelId))
    .map((it): DateMessageTuple => [slackTsToDate(it.ts), it.message])
    .filter(
      ([date]) =>
        date.getHours() === 13 &&
        date.getMinutes() === 37 &&
        date.getSeconds() === 0,
    );

  const topN: DateMessageTuple[] = R.pipe(
    messages,
    R.sortBy([([date]) => date.getMilliseconds(), "asc"]),
    R.take(count),
  );

  return buildBlocks(channelId, `Top ${count} leetoos`, topN);
}

export async function getPrematures(
  channelId: string,
  direction: "asc" | "desc" = "asc",
  count: number = 10,
): Promise<KnownBlock[]> {
  const messages: DateMessageTuple[] = R.pipe(
    await db.getAllLeets(channelId),
    R.map((it): DateMessageTuple => [slackTsToDate(it.ts), it.message]),
    R.filter(
      ([date]) =>
        date.getHours() === 13 &&
        date.getMinutes() === 36 &&
        date.getSeconds() === 59,
    ),
    R.sortBy([([date]) => date.getMilliseconds(), direction]),
    R.take(count),
  );

  return buildBlocks(
    channelId,
    `Top 10 prematures (${
      direction === "desc" ? "nærmest 1337" : "lengst unna 1337"
    })`,
    messages,
    true,
  );
}

function buildBlocks(
  channelId: string,
  title: string,
  messages: DateMessageTuple[],
  premature: boolean = false,
): KnownBlock[] {
  return [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: title,
        emoji: true,
      },
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text:
          messages
            .map(formatDateMessageTupleToLine(channelId, premature))
            .join("\n") || "Ingen leets i denne kanalen. :sadparrot:",
      },
    },
  ];
}

function formatDateMessageTupleToLine(channelId: string, premature: boolean) {
  return ([date, message]: DateMessageTuple, index: number): string => {
    const lastPart = `av <@${message.user}>: "${
      message.text
    }" ${formatDistanceToNowStrict(date, {
      locale: nb,
      addSuffix: true,
    })} (<${createPermalink(channelId, message.ts)}|link>)`;

    if (premature) {
      return `${index + 1}. -${1000 - date.getMilliseconds()}ms ${lastPart}`;
    }

    return `${index + 1}. ${date
      .getMilliseconds()
      .toFixed(0)
      .padStart(3, "0")}ms av <@${message.user}>: "${
      message.text
    }" ${lastPart}`;
  };
}
