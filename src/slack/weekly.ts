import { WebClient } from "@slack/web-api";
import { getWeekNumber } from "../utils/date-utils";
import { getWeeklyScoreboardBlocks } from "../leet/score-engine/blocks-week";

export async function postWeeklyScoreboard(
  client: WebClient,
  channelId: string,
) {
  console.log("Posting weekly scoreboard");

  await client.chat.postMessage({
    text: `Scoreboard for uke ${getWeekNumber(new Date())}`,
    channel: channelId,
    blocks: await getWeeklyScoreboardBlocks(channelId, new Date()),
  });
}
