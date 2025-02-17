import { App, GenericMessageEvent, KnownEventFromType } from "@slack/bolt";

import { formatHours, getTimeParts, slackTsToDate } from "../utils/date-utils";
import { insertLeetMessage } from "../db/queries";
import { postOrUpdateDailyLeets } from "../slack/daily";
import { ChatPostMessageResponse, WebClient } from "@slack/web-api";

export async function handleReceivedLeetMessage(
  message: KnownEventFromType<"message">,
  channelSource: string,
  client: WebClient,
  reply: (args: {
    thread_ts: string;
    text: string;
  }) => Promise<ChatPostMessageResponse>,
) {
  if (message.type !== "message") return;
  if (message.subtype === "bot_message") return;

  const time = slackTsToDate(message.ts);

  console.log(
    `Received leet at ${time.toISOString()} by user ${
      (message as any).user
    } in channel ${channelSource}`,
  );

  const { hour, minutes, seconds, ms } = getTimeParts(time);
  await insertLeetMessage(channelSource, message as GenericMessageEvent);

  // Only update bot-summary after 13:38+
  if ((hour === 13 && minutes > 37) || hour > 13) {
    await postOrUpdateDailyLeets(client, channelSource);
  }

  const isLeet = hour === 13 && minutes === 37;
  if (hour === 13 && minutes === 36) {
    const negativeOffset = 1000 - ms;
    await reply({
      thread_ts: message.ts,
      text: `Premature leetjaculation <@${
        (message as any).user
      }>!!! Du var ${negativeOffset} ${ms === 1 ? "millisekund" : "millisekunder"} for tidlig! :hot_face:`,
    });
    return;
  }

  if (isLeet && seconds === 0) {
    await new Promise((resolve) => setTimeout(resolve, ms * 2));

    await reply({
      thread_ts: message.ts,
      text: `En ekte leetoo, <@${
        (message as any).user
      }>! :leetoo: Du var ${ms} ${ms === 1 ? "millisekund" : "millisekunder"} inn i sekundet.`,
    });
  } else if (isLeet) {
    await reply({
      thread_ts: message.ts,
      text: `Bra jobba <@${
        (message as any).user
      }>! Du var ${seconds} ${seconds === 1 ? "sekund" : "sekunder"} inn i minuttet.`,
    });
  } else {
    await reply({
      thread_ts: message.ts,
      text: `<@${(message as any).user}>, ${formatHours(
        time,
      )} is not 13:37. This Incident Will Be Reported.`,
    });
  }
}

export function configureLeetHandlers(app: App) {
  app.message("1337", async ({ message, say, event, client }) => {
    await handleReceivedLeetMessage(message, event.channel, client, say);
  });
}
