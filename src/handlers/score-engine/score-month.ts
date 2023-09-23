import * as R from "remeda";
import { getLeetsForMonth } from "../../db/queries";
import { slackTsToDay } from "../../utils/date-utils";
import { scoreDay } from "./score-day";

export async function scoreMonth(channelId: string, date: Date) {
  return R.pipe(
    await getLeetsForMonth(channelId, date),
    R.groupBy((row) => slackTsToDay(row.ts)),
    R.mapValues(scoreDay),
    R.values,
    R.flatMap(R.values),
    R.filter((it) => it.length > 0),
    R.flatten(),
    R.map((it) => ({
      score: it.points,
      ts: it.message.ts,
      user: it.message.message.user,
      text: it.message.message.text,
    })),
    R.groupBy((it) => it.user),
    R.mapValues((it) => ({
      user: it[0].user,
      monthlyScore: R.sumBy(it, (it) => it.score),
      items: it,
    })),
    R.values,
    R.sortBy([(it) => it.monthlyScore, "desc"]),
    R.filter((it) => it.items.filter((it) => it.score !== 0).length > 0),
  );
}
