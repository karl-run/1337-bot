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

  return buildBlocks(channelId, topN, count);
}

function buildBlocks(
  channelId: string,
  messages: DateMessageTuple[],
  count: number,
): KnownBlock[] {
  return [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: `Top ${count} leetoos`,
        emoji: true,
      },
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text:
          messages.map(formatDateMessageTupleToLine(channelId)).join("\n") ||
          "Ingen leets i denne kanalen. :sadparrot:",
      },
    },
  ];
}

function formatDateMessageTupleToLine(channelId: string) {
  return ([date, message]: DateMessageTuple, index: number): string => {
    return `${index + 1}. ${date
      .getMilliseconds()
      .toFixed(0)
      .padStart(3, "0")}ms av <@${message.user}>: "${
      message.text
    }" ${formatDistanceToNowStrict(date, {
      locale: nb,
      addSuffix: true,
    })} (<${createPermalink(channelId, message.ts)}|link>)`;
  };
}
