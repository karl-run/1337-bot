import { KnownBlock } from "@slack/bolt";
import { getMonthName, slackTsToDay } from "../../utils/date-utils";
import { scoreMonth } from "./score-month";
import { createPermalink } from "../../utils/slack-utils";
import { getYear } from "date-fns";

export async function getMonthlyScoreboardBlocks(
  channelId: string,
  month: Date,
  detailed = false,
): Promise<KnownBlock[]> {
  const scoredMonth = await scoreMonth(channelId, month);

  return [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: `Scoreboard for ${getMonthName(month)} ${getYear(month)}`,
        emoji: true,
      },
    },
    ...(scoredMonth.length === 0
      ? [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: "Ingen leet i denne måneden :letoshake:",
            },
          } satisfies KnownBlock,
        ]
      : []),
    ...(!detailed
      ? [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: scoredMonth
                .map(
                  (it, index) =>
                    `${index + 1}. <@${it.user}>: *${it.monthlyScore}*`,
                )
                .join("\n"),
            },
          } satisfies KnownBlock,
        ]
      : scoredMonth.flatMap((user, index) => {
          console.log("wtf???", user);
          return [
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: `${index + 1}. <@${user.user}>: *${user.monthlyScore}*`,
              },
            } satisfies KnownBlock,
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: user.items
                  .filter((it) => it.score !== 0)
                  .map(
                    (it) =>
                      ` - ${slackTsToDay(it.ts)}. \`${scoreWithPlus(
                        it.score,
                      )}\`: ${it.text} (<${createPermalink(
                        channelId,
                        it.ts,
                      )}|link>)`,
                  )
                  .join("\n"),
              },
            } satisfies KnownBlock,
          ];
        })),
  ];
}

const scoreWithPlus = (score: number) => (score > 0 ? `+${score}` : score);
