import * as R from "remeda";
import { LeetStatus, classifyRow } from "../daily-leet/row-utils";
import { UserLeetRow } from "../../db/types";
import { slackTsToMs, slackTsToSeconds } from "../../utils/date-utils";

import { ScoredDay, ScoredMessage } from "./index";

export function scoreDay(leetsForDay: UserLeetRow[]): ScoredDay {
  return R.pipe(
    leetsForDay,
    R.sortBy((row) => row.ts),
    R.groupBy(classifyRow),
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
}

function scoreLeetos(
  day: Record<LeetStatus, UserLeetRow[]>,
): Record<LeetStatus, (UserLeetRow | ScoredMessage)[]> {
  return {
    ...day,
    leetos: day.leetos.map((leet): ScoredMessage => {
      const ms = slackTsToMs(leet.ts);

      const omegaLeet = ms === 0;
      if (omegaLeet) {
        return {
          points: 13337,
          message: leet,
        };
      }

      const firstBonus = leet.ts === day.leetos[0].ts ? 500 : 0;
      const points = firstBonus + 1000 + (1000 - ms);

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
      const within3SecondsPoints = slackTsToSeconds(it.ts) <= 3 ? 250 : 27;

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
