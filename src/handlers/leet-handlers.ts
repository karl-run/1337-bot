import { App, GenericMessageEvent } from "@slack/bolt";

import { formatHours, getTimeParts, slackTsToDate } from "../utils/date-utils";
import { insertLeetMessage } from "../db/queries";
import { postOrUpdateDailyLeets } from "../slack/daily";

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
      await postOrUpdateDailyLeets(client, event.channel);
    }

    const isLeet = hour === 13 && minutes === 37;
    if (hour === 13 && minutes === 36) {
      const negativeOffset = 1000 - ms;
      await say({
        thread_ts: message.ts,
        text: `Premature leetjaculation <@${
          (message as any).user
        }>!!! Du var ${negativeOffset} millisekunder for tidlig! :hot_face:`,
      });
      return;
    }

    if (isLeet && seconds === 0) {
      await new Promise((resolve) => setTimeout(resolve, ms * 2));

      await say({
        thread_ts: message.ts,
        text: `En ekte leetoo, <@${
          (message as any).user
        }>! :leetoo: Du var ${ms} millisekunder inn i sekundet.`,
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
        )} is not 13:37. This Incident Will Be Reported.`,
      });
    }
  });
}

