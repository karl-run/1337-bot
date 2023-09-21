import * as R from "remeda";
import { getLeetForDay } from "../../db/queries";
import { rowToStatus, LeetStatus } from "../daily-leet/row-utils";
import { UserLeetRow } from "../../db/types";
import {
  formatHours,
  getTimeParts,
  slackTsToDate,
  slackTsToMs,
  slackTsToSeconds,
} from "../../utils/date-utils";
import { formatDistanceStrict, set } from "date-fns";
import { nb } from "date-fns/locale";

type ScoredMessage = {
  points: number;
  message: UserLeetRow;
};

async function scoreDay(
  day: Date,
): Promise<Record<LeetStatus, ScoredMessage[]>> {
  const leetsForDay: UserLeetRow[] = await getLeetForDay("C04N7R2F8B0", day);
  const result: Record<LeetStatus, ScoredMessage[]> = R.pipe(
    leetsForDay,
    R.sortBy((row) => row.ts),
    R.groupBy(rowToStatus),
    (it) => {
      console.log(
        R.mapValues(it, (it) =>
          R.map(it, (it) => [it.message.user, it.message.text]),
        ),
      );
      return it;
    },
    (it) =>
      R.merge(
        {
          premature: [],
          leetos: [],
          leet: [],
          late: [],
          garbage: [],
        } satisfies Record<LeetStatus, UserLeetRow[]>,
        it,
      ),
    scoreLeetos,
    scorePrematures,
    scoreLeets,
    zeroTheRest,
  );

  return result;
}

function scoreLeetos(
  day: Record<LeetStatus, UserLeetRow[]>,
): Record<LeetStatus, (UserLeetRow | ScoredMessage)[]> {
  return {
    ...day,
    leetos: day.leetos.map((leet): ScoredMessage => {
      const firstBonus = leet.ts === day.leetos[0].ts ? 500 : 0;
      const points = firstBonus + 1000 + (1000 - slackTsToMs(leet.ts));

      return {
        points,
        message: leet,
      };
    }),
  };
}

function scorePrematures(
  day: Record<LeetStatus, UserLeetRow[]>,
): Record<LeetStatus, (UserLeetRow | ScoredMessage)[]> {
  return {
    ...day,
    premature: day.premature.map((it): ScoredMessage => {
      return {
        points: -5000,
        message: it,
      };
    }),
  };
}

function scoreLeets(
  day: Record<LeetStatus, UserLeetRow[]>,
): Record<LeetStatus, (UserLeetRow | ScoredMessage)[]> {
  return {
    ...day,
    leet: day.leet.map((it): ScoredMessage => {
      const firstBonus = day.leetos.length === 0 ? 500 : 0;
      const within3SecondsPoints = slackTsToSeconds(it.ts) <= 3 ? 250 : 0;

      return {
        points: firstBonus + within3SecondsPoints,
        message: it,
      };
    }),
  };
}

function zeroTheRest(
  day: Record<LeetStatus, UserLeetRow[]>,
): Record<LeetStatus, ScoredMessage[]> {
  const zeroMessage = (it: UserLeetRow): ScoredMessage => {
    return {
      points: 0,
      message: it,
    };
  };

  return {
    ...day,
    late: day.late.map(zeroMessage),
    garbage: day.garbage.map(zeroMessage),
  } as unknown as Record<LeetStatus, ScoredMessage[]>;
}

export function leetsToBlocksForScoredDay(
  todaysLeets: Record<LeetStatus, ScoredMessage[]>,
) {
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
          R.toPairs,
          R.filter(([_, rows]) => rows.length > 0),
          R.map(toCategoryMarkdown),
          R.join("\n"),
        ),
      },
    },
  ]);
}

export function toCategoryMarkdown([key, rows]: [
  LeetStatus,
  ScoredMessage[],
]): string {
  switch (key) {
    case "leetos":
      return `*Ekte leetos*:\n${formatLeetos(rows)}`;
    case "leet":
      return `*Leets*:\n${formatLeets(rows)}`;
    case "premature":
      return `*Premature leets*:\n${formatPrematureRows(rows)}`;
    case "late":
      return `*For sent lol*:\n${formatLateRows(rows)}`;
    case "garbage":
      return `*wtf??*:\n${messageFormatters(rows)}`;
  }
}

function formatLeetos(rows: ScoredMessage[]) {
  return rows
    .map((row) => {
      const { ms } = getTimeParts(slackTsToDate(row.message.ts));
      return `:letopet: <@${row.message.message.user}>: ${ms}ms (+${row.points})`;
    })
    .join("\n");
}

function formatLeets(rows: ScoredMessage[]) {
  return rows
    .map((row) => {
      const { seconds, ms } = getTimeParts(slackTsToDate(row.message.ts));
      return `:letojam: <@${row.message.message.user}>: ${seconds}s ${ms}ms (+${row.points})`;
    })
    .join("\n");
}

function formatPrematureRows(rows: ScoredMessage[]) {
  return rows
    .map((row) => {
      const { seconds, ms } = getTimeParts(slackTsToDate(row.message.ts));
      const negativeOffset = 1000 - ms;
      return `:letogun: <@${row.message.message.user}>: -${negativeOffset}ms for tidlig :hot_face: (${row.points})`;
    })
    .join("\n");
}

function formatLateRows(rows: ScoredMessage[]) {
  return rows
    .map((row) => {
      const date = slackTsToDate(row.message.ts);
      const { minutes, seconds } = getTimeParts(date);
      return `:letoint: <@${
        row.message.message.user
      }>: ${minutes}m ${seconds}s (${formatHours(date)}) (+${row.points})`;
    })
    .join("\n");
}

function messageFormatters(rows: ScoredMessage[]) {
  return rows
    .map((row) => {
      const leet = set(new Date(), {
        hours: 13,
        minutes: 37,
        seconds: 0,
        milliseconds: 0,
      });

      const date = slackTsToDate(row.message.ts);
      return `:letoshake: <@${
        row.message.message.user
      }>: ${formatDistanceStrict(leet, date, {
        locale: nb,
      })} bom :roflrofl: (${formatHours(date)}) (+${row.points})`;
    })
    .join("\n");
}

/*
used for bun run --watch to test this file
await initDb();
const result = await scoreDay(new Date());
console.log(leetsToBlocksForScoredDay(result));
 */
