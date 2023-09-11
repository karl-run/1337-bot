import * as R from "remeda";
import { createProgressBar } from "../slack-utils";
import { rowToStatus } from "./row-utils";
import { toCategoryMarkdown } from "./message-formatters";
import { getTodaysLeets } from "../db";
import { formatHoursWithSeconds } from "../date-utils";

export function leetsToBlocks(
  minutes: number,
  seconds: number,
  todaysLeets: Awaited<ReturnType<typeof getTodaysLeets>>,
) {
  return R.compact([
    minutes === 37
      ? {
          type: "section",
          text: {
            type: "mrkdwn",
            text: createProgressBar((seconds / 59) * 100),
          },
        }
      : undefined,
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
