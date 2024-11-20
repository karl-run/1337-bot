import * as R from "remeda";
import { LeetStatus, classifyRow } from "../daily-leet/row-utils";
import { slackTsToMs, slackTsToSeconds } from "../../utils/date-utils";

import { ScoredDay, ScoredMessage } from "./index";
import { UserLeetDay } from "./score";

export function scoreDay(leetsForDay: UserLeetDay[]): ScoredDay {
  return R.pipe(
    leetsForDay,
    R.sortBy((row) => row.validLeet.ts),
    R.groupBy((it) => classifyRow(it.validLeet)),
    (it) =>
      R.merge(
        {
          premature: [],
          leetos: [],
          leet: [],
          late: [],
          garbage: [],
        } satisfies Record<LeetStatus, UserLeetDay[]>,
        it,
      ),
    scoreLeetos,
    scorePrematures,
    scoreLeets,
    zeroTheRest,
  );
}

function scoreLeetos(
  day: Record<LeetStatus, UserLeetDay[]>,
): Record<LeetStatus, (UserLeetDay | ScoredMessage)[]> {
  return {
    ...day,
    leetos: day.leetos.map((leet): ScoredMessage => {
      const ms = slackTsToMs(leet.validLeet.ts);

      const omegaLeet = ms === 0;
      if (omegaLeet) {
        return {
          points: 13337,
          message: leet.validLeet,
        };
      }

      const firstBonus =
        leet.validLeet.ts === day.leetos[0].validLeet.ts ? 500 : 0;
      const points = firstBonus + 1000 + (1000 - ms);

      return {
        points,
        message: leet.validLeet,
      };
    }),
  };
}

function scorePrematures(
  day: Record<LeetStatus, UserLeetDay[]>,
): Record<LeetStatus, (UserLeetDay | ScoredMessage)[]> {
  return {
    ...day,
    premature: day.premature.map((it): ScoredMessage => {
      return {
        points: -5000,
        message: it.validLeet,
      };
    }),
  };
}

function scoreLeets(
  day: Record<LeetStatus, UserLeetDay[]>,
): Record<LeetStatus, (UserLeetDay | ScoredMessage)[]> {
  return {
    ...day,
    leet: day.leet.map((it): ScoredMessage => {
      const firstBonus = day.leetos.length === 0 ? 500 : 0;
      const within3SecondsPoints =
        slackTsToSeconds(it.validLeet.ts) <= 3 ? 250 : 27;

      return {
        points: firstBonus + within3SecondsPoints,
        message: it.validLeet,
      };
    }),
  };
}

function zeroTheRest(
  day: Record<LeetStatus, UserLeetDay[]>,
): Record<LeetStatus, ScoredMessage[]> {
  const zeroMessage = (it: UserLeetDay): ScoredMessage => {
    return {
      points: 0,
      message: it.validLeet,
    };
  };

  return {
    ...day,
    late: day.late.map(zeroMessage),
    garbage: day.garbage.map(zeroMessage),
  } as unknown as Record<LeetStatus, ScoredMessage[]>;
}
