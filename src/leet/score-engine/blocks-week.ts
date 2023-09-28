import { KnownBlock } from "@slack/bolt";

import { getWeekNumber } from "../../utils/date-utils";

import { scoreWeek } from "./score-week";

export async function getWeeklyScoreboardBlocks(
  channelId: string,
  month: Date,
): Promise<KnownBlock[]> {
  const scoredMonth = await scoreWeek(channelId, month);

  return [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: `Scoreboard for uke ${getWeekNumber(month)}`,
        emoji: true,
      },
    },
    ...(scoredMonth.length === 0
      ? [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: "Ingen leet i denne uken :letoshake:",
            },
          } satisfies KnownBlock,
        ]
      : []),
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: scoredMonth
          .map((it, index) => `${index + 1}. <@${it.user}>: *${it.scoreSum}*`)
          .join("\n"),
      },
    } satisfies KnownBlock,
  ];
}
