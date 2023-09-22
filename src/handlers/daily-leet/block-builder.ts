import * as R from "remeda";
import { toCategoryMarkdown } from "./message-formatters";
import { formatHoursWithSeconds } from "../../utils/date-utils";
import { ScoredDay } from "../score-engine";

export function scoredDayToBlocks(scoredDay: ScoredDay) {
  const leetCount = R.pipe(
    scoredDay,
    R.toPairs,
    R.flatMap(([, messages]) => messages),
  ).length;

  if (leetCount === 0) {
    return [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*Dagens leets*`,
        },
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `Ingen leets i dag :sadparrot:`,
        },
      },
      {
        type: "context",
        elements: [
          {
            type: "mrkdwn",
            text: `:letogun: sist oppdatert ${formatHoursWithSeconds(
              new Date(),
            )}`,
          },
        ],
      },
    ];
  }

  return R.compact([
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*Dagens leets*`,
      },
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: R.pipe(
          scoredDay,
          R.toPairs.strict,
          R.map(toCategoryMarkdown),
          R.join("\n"),
        ),
      },
    },
    {
      type: "context",
      elements: [
        {
          type: "mrkdwn",
          text: `:leetoo: ${leetCount} leets i dag, sist oppdatert ${formatHoursWithSeconds(
            new Date(),
          )}`,
        },
      ],
    },
  ]);
}
