import * as R from "remeda";
import { rowToStatus } from "./row-utils";
import { toCategoryMarkdown } from "./message-formatters";
import { getTodaysLeets } from "../../db/queries";
import { formatHoursWithSeconds } from "../../utils/date-utils";

export function leetsToBlocks(
  hour: number,
  minutes: number,
  seconds: number,
  todaysLeets: Awaited<ReturnType<typeof getTodaysLeets>>,
) {
  if (todaysLeets.length === 0) {
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
          todaysLeets,
          R.sortBy((row) => row.ts),
          R.groupBy(rowToStatus),
          R.toPairs,
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
          text: `:leetoo: ${
            todaysLeets.length
          } leets i dag, sist oppdatert ${formatHoursWithSeconds(new Date())}`,
        },
      ],
    },
  ]);
}
