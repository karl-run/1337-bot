import { getLeetsForMonth } from "../../db/queries";

import { ScoredUser, scoreLeets } from "./score";

export async function scoreMonth(
  channelId: string,
  date: Date,
): Promise<ScoredUser[]> {
  return scoreLeets(await getLeetsForMonth(channelId, date));
}
