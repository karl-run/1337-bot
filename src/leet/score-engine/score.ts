import { UserLeetRow } from "../../db/types";
import * as R from "remeda";
import { slackTsToDay } from "../../utils/date-utils";
import { scoreDay } from "./score-day";
import { ScoredMessage } from ".";

type ScoredMessageSmol = {
  score: number;
  ts: string;
  user: string;
  text: string;
};

export type ScoredUser = {
  user: string;
  scoreSum: number;
  items: ScoredMessageSmol[];
};

export async function scoreLeets(leets: UserLeetRow[]): Promise<ScoredUser[]> {
  return R.pipe(
    leets,
    R.groupBy((row) => slackTsToDay(row.ts)),
    R.mapValues(scoreDay),
    R.values,
    R.flatMap(R.values),
    R.filter((it) => it.length > 0),
    R.flatten(),
    R.map(toSmolScoredMessage),
    R.groupBy((it) => it.user),
    R.mapValues(toTotalUserScore),
    R.values,
    R.sortBy([(it) => it.scoreSum, "desc"]),
    R.filter((it) => it.items.filter((it) => it.score !== 0).length > 0),
  );
}

const toTotalUserScore = (it: ScoredMessageSmol[]): ScoredUser => ({
  user: it[0].user,
  scoreSum: R.sumBy(it, (it) => it.score),
  items: it.filter((it) => it.score !== 0),
});

const toSmolScoredMessage = (message: ScoredMessage): ScoredMessageSmol => ({
  score: message.points,
  ts: message.message.ts,
  user: message.message.message.user,
  text: message.message.message.text,
});
