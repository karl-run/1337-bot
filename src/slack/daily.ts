import { WebClient } from "@slack/web-api";
import {
  getCurrentBotMessageTS,
  getLeetForDay,
  insertNewBotMessage,
} from "../db/queries";
import { UserLeetRow } from "../db/types";
import { scoreDay } from "../leet/score-engine/score-day";
import { scoredDayToBlocks } from "../leet/daily-leet/block-builder";
import { getMonthName } from "../utils/date-utils";
import { getMonthlyScoreboardBlocks } from "../leet/score-engine/blocks-month";

export async function postOrUpdateDailyLeets(
  client: WebClient,
  channelId: string,
) {
  console.log("Posting or updating");
  const existingTS = await getCurrentBotMessageTS(channelId);
  const leetsForDay: UserLeetRow[] = await getLeetForDay(channelId, new Date());
  const scoredDay = scoreDay(leetsForDay);
  const blocks = scoredDayToBlocks(scoredDay);

  if (existingTS) {
    console.log(`Found existing ts: ${existingTS}`);

    await client.chat.update({
      channel: channelId,
      ts: existingTS,
      text: "Dagens leets",
      blocks,
    });
    return;
  }

  console.log("No existing ts found");
  const postedMessage = await client.chat.postMessage({
    channel: channelId,
    text: "Dagens leets",
    blocks,
  });

  console.log(`Posted message ${postedMessage.ts}`);
  await insertNewBotMessage(postedMessage.ts, channelId);

  // Post current scoreboard to thread
  await client.chat.postMessage({
    text: `Scoreboard for ${getMonthName(new Date())}`,
    channel: channelId,
    thread_ts: postedMessage.ts,
    blocks: await getMonthlyScoreboardBlocks(channelId, new Date()),
  });
}
