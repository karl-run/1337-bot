import { WebClient } from "@slack/web-api";
import { App, GenericMessageEvent } from "@slack/bolt";

import { formatHours, getTimeParts, slackTsToDate } from "../date-utils";
import {
  getCurrentBotMessageTS,
  getTodaysLeets,
  insertLeetMessage,
  insertNewBotMessage,
} from "../db";

import { leetsToBlocks } from "./block-builder";

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
    await postOrUpdate(client, event.channel);

    const isLeet = hour === 13 && minutes === 37;
    if (hour === 13 && minutes === 36) {
      const negativeOffset = 1000 - ms;
      await say(
        `Premature leetjaculation av <@${
          (message as any).user
        }>!!! Du var ${negativeOffset}ms for tidlig :hot_face:`,
      );
    }

    if (isLeet && seconds === 0) {
      await new Promise((resolve) => setTimeout(resolve, ms * 2));

      await say(
        `En ekte leetoo av <@${
          (message as any).user
        }>! :leetoo: Du var ${ms}ms over.`,
      );
    } else if (isLeet) {
      await say(
        `Bra jobba <@${
          (message as any).user
        }>! Du var ${seconds} sekunder inn i minuttet.`,
      );
    } else {
      await say(
        `<@${(message as any).user}>, ${formatHours(
          time,
        )} is not 13:37. This Incident Will Be Reported`,
      );
    }
  });
}

export async function postOrUpdate(client: WebClient, channelId: string) {
  const { hour, minutes, seconds } = getTimeParts(new Date());

  console.log("Posting or updating");
  const existingTS = await getCurrentBotMessageTS(channelId);
  const todaysLeets = await getTodaysLeets(channelId);
  const blocks = leetsToBlocks(hour, minutes, seconds, todaysLeets);

  if (existingTS) {
    console.log(`Found existing ts: ${existingTS}`);

    await client.chat.update({
      channel: channelId,
      ts: existingTS,
      text: "Dagens leets",
      blocks,
    });
  } else {
    console.log("No existing ts found");

    const postedMessage = await client.chat.postMessage({
      channel: channelId,
      text: "Dagens leets",
      blocks,
    });

    console.log(`Posted message ${postedMessage.ts}`);

    await insertNewBotMessage(postedMessage.ts, channelId);
  }
}
