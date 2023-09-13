import * as R from "remeda";
import * as db from "../../db/queries";
import { initDb } from "../../db/client";
import { slackTsToDate } from "../../utils/date-utils";
import { addDays, formatISO, isSameDay } from "date-fns";
import { GenericMessageEvent } from "@slack/bolt";

export async function getTopStreak(channelId: string) {
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
    R.reduce(toStreaks, {
      prevMetadata: [null, null],
      innerAcc: [],
    } satisfies ToStreaksReduceAccumulator),
    R.prop("innerAcc"),
    R.filter((it) => it.length >= 5),
    R.sortBy([(it) => it.length, "desc"]),
    // TODO map to streak info
    R.map((it) => it.map((it) => [slackTsToDate(it.ts), it.user])),
  );

  console.log(streaks.length);

  // Bun.write("streaks.json", JSON.stringify(streaks, null, 2));
}

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
      innerAcc: [[...currentStreak, message], ...innerAcc],
    } satisfies ToStreaksReduceAccumulator;
  } else {
    // Day and/or user differs, reset streak
    return {
      prevMetadata: [null, null],
      innerAcc: [...innerAcc],
    } satisfies ToStreaksReduceAccumulator;
  }
}

// await initDb();
// await getTopStreak("C04N7R2F8B0");
