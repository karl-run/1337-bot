import * as R from "remeda";
import * as db from "../../db/queries";
import { slackTsToDate, toReadableDatePeriod } from "../../utils/date-utils";
import { addDays, formatISO, isSameDay } from "date-fns";
import { GenericMessageEvent, KnownBlock } from "@slack/bolt";
import { createPermalink } from "../../utils/slack-utils";

export async function getTopStreak(channelId: string): Promise<KnownBlock[]> {
  const leets = await db.getAllLeets(channelId);

  const streaks = R.pipe(
    leets,
    R.map((it) => [slackTsToDate(it.ts), it.message] as const),
    R.filter(([date]) => date.getHours() === 13 && date.getMinutes() === 37),
    R.groupBy(([date]) => formatISO(date, { representation: "date" })),
    R.mapValues(
      R.createPipe(
        R.sortBy(([date]) => date.getMilliseconds()),
        R.first(),
      ),
    ),
    R.toPairs,
    R.sortBy(([dateKey]) => dateKey),
    R.map(([, tuple]) => tuple),
    reduceToStreak,
    R.filter((it) => it.length >= 3),
    R.sortBy([(it) => it.length, "desc"]),
    R.map(streakSetToStreakMetadata(channelId)),
  );

  return [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: "Top Streaks",
        emoji: true,
      },
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `${streaks
          .map(
            (it) =>
              `*${it.length} dager* streak av <@${
                it.user
              }> - ${toReadableDatePeriod(it.fom, it.tom)}\n${it.messages
                .map((msg) => `\t- ${msg.text} (<${msg.link}|link>)`)
                .join("\n")}`,
          )
          .join("\n")}`,
      },
    },
  ];
}

const reduceToStreak: (
  tuples: readonly (readonly [Date, GenericMessageEvent])[],
) => readonly GenericMessageEvent[][] = R.createPipe(
  R.reduce(toStreaks, {
    prevMetadata: [null, null],
    innerAcc: [],
  } satisfies ToStreaksReduceAccumulator),
  R.prop("innerAcc"),
);

type ToStreaksReduceAccumulator = {
  prevMetadata: [Date | null, string | null];
  innerAcc: readonly GenericMessageEvent[][];
};

function toStreaks(
  acc: ToStreaksReduceAccumulator,
  item: readonly [Date, GenericMessageEvent],
): ToStreaksReduceAccumulator {
  const { prevMetadata, innerAcc } = acc;
  const [date, message] = item;
  const [previousDate, previousUser] = prevMetadata;

  if (previousDate == null) {
    // First day in a streak
    return {
      prevMetadata: [date, message.user],
      innerAcc: [[message], ...innerAcc],
    } satisfies ToStreaksReduceAccumulator;
  }

  if (
    isSameDay(addDays(previousDate, 1), date) &&
    previousUser === message.user
  ) {
    // Is n+1 day and same user
    const [currentStreak, ...rest] = innerAcc;
    return {
      prevMetadata: [date, message.user],
      innerAcc: [[...currentStreak, message], ...rest],
    } satisfies ToStreaksReduceAccumulator;
  } else {
    // Day and/or user differs, reset streak
    return {
      prevMetadata: [null, null],
      innerAcc: [...innerAcc],
    } satisfies ToStreaksReduceAccumulator;
  }
}

function streakSetToStreakMetadata(channelId: string) {
  return (messages: readonly GenericMessageEvent[]) => {
    const [first, ...rest] = messages;
    const [last] = rest.slice(-1);
    return {
      user: first.user,
      channel: channelId,
      fom: slackTsToDate(first.ts),
      tom: slackTsToDate(last.ts),
      length: messages.length,
      messages: messages.map((it) => ({
        text: it.text,
        ts: it.ts,
        user: it.user,
        link: createPermalink(channelId, it.ts),
      })),
    };
  };
}
