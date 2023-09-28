import { getLeetsForWeek } from "../../db/queries";

import { ScoredUser, scoreLeets } from "./score";

export async function scoreWeek(
  channelId: string,
  date: Date,
): Promise<ScoredUser[]> {
  return scoreLeets(await getLeetsForWeek(channelId, date));
}
