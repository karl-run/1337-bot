import * as R from "remeda";
import { KnownBlock } from "@slack/bolt";
import { slackTsToDate, toReadableDatePeriod } from "../../utils/date-utils";
import { createPermalink } from "../../utils/slack-utils";
import { scoreAll } from "./score-all";
import { ScoredUser } from "./score";

export async function getAllTimeBlocks(
  channelId: string,
): Promise<KnownBlock[]> {
  const scoreALl = await scoreAll(channelId);
  const firstLeet = R.pipe(
    scoreALl,
    R.flatMap((it) => it.items),
    R.map((it) => +it.ts),
    R.minBy(R.identity),
    (it) => slackTsToDate(it),
  );

  return [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: `Scoreboard for ${toReadableDatePeriod(firstLeet, new Date())}`,
        emoji: true,
      },
    },
    ...(scoreALl.length === 0
      ? [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: "Ingen leets?! :letoshake:",
            },
          } satisfies KnownBlock,
        ]
      : []),
    ...scoreALl.flatMap((user, index) => {
      return [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text:
              `${index + 1}. <@${user.user}>: *${user.scoreSum}*\n` +
              [
                numberOfLeetsLine(user),
                averageScoreLine(user),
                bestScore(user, channelId),
                prematures(user),
              ]
                .map((it) => `    - ${it}`)
                .join("\n"),
          },
        } satisfies KnownBlock,
      ];
    }),
  ];
}

const numberOfLeetsLine = (user: ScoredUser) =>
  `${user.items.filter((it) => it.score !== 0).length} leets`;

const averageScoreLine = (user: ScoredUser) =>
  `${(user.scoreSum / user.items.length).toFixed(0)} poeng snitt`;

const bestScore = (user: ScoredUser, channelId: string) => {
  const best = R.maxBy(user.items, (it) => it.score);

  return `Høyeste score var "${best.text}" med ${
    best.score
  } poeng (<${createPermalink(channelId, best.ts)}|link>)`;
};

const prematures = (user: ScoredUser) => {
  const prematures = user.items.filter((it) => it.score < 0);

  return `Premature ejaculeets: ${prematures.length} (til sammen -${
    prematures.length * 5000
  } poeng).`;
};
