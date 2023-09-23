import { WebClient } from "@slack/web-api";
import { App, GenericMessageEvent } from "@slack/bolt";

import {
  formatHours,
  getMonthName,
  getTimeParts,
  slackTsToDate,
} from "../utils/date-utils";
import {
  getCurrentBotMessageTS,
  getLeetForDay,
  insertLeetMessage,
  insertNewBotMessage,
} from "../db/queries";

import { scoredDayToBlocks } from "../leet/daily-leet/block-builder";
import { scoreDay } from "../leet/score-engine/score-day";
import { UserLeetRow } from "../db/types";
import { getMonthlyScoreboardBlocks } from "../leet/score-engine/blocks-month";

export function configureLeetHandlers(app: App) {
  app.message("1337", async ({ message, say, event, client }) => {
    if (message.type !== "message") return;
    if (message.subtype === "bot_message") return;

    const time = slackTsToDate(message.ts);

    console.log(
      `Received leet at ${time.toISOString()} by user ${
        (message as any).user
      } in channel ${event.channel}`,
    );

    const { hour, minutes, seconds, ms } = getTimeParts(time);
    await insertLeetMessage(event.channel, message as GenericMessageEvent);

    // Only update bot-summary after 13:38+
    if ((hour === 13 && minutes > 37) || hour > 13) {
      await postOrUpdate(client, event.channel);
    }

    const isLeet = hour === 13 && minutes === 37;
    if (hour === 13 && minutes === 36) {
      const negativeOffset = 1000 - ms;
      await say({
        thread_ts: message.ts,
        text: `Premature leetjaculation <@${
          (message as any).user
        }>!!! Du var ${negativeOffset}ms for tidlig :hot_face:`,
      });
      return;
    }

    if (isLeet && seconds === 0) {
      await new Promise((resolve) => setTimeout(resolve, ms * 2));

      await say({
        thread_ts: message.ts,
        text: `En ekte leetoo <@${
          (message as any).user
        }>! :leetoo: Du var ${ms}ms inn i sekundet.`,
      });
    } else if (isLeet) {
      await say({
        thread_ts: message.ts,
        text: `Bra jobba <@${
          (message as any).user
        }>! Du var ${seconds} sekunder inn i minuttet.`,
      });
    } else {
      await say({
        thread_ts: message.ts,
        text: `<@${(message as any).user}>, ${formatHours(
          time,
        )} is not 13:37. This Incident Will Be Reported`,
      });
    }
  });
}

export async function postOrUpdate(client: WebClient, channelId: string) {
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
