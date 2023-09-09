import { App } from "@slack/bolt";
import { formatHours, getTimeParts, slackTsToDate } from "../date-utils";

export function configureLeetHandlers(app: App) {
  app.message("1337", async ({ message, say, event }) => {
    if (message.type !== "message") return;

    const time = slackTsToDate(message.ts);
    const [hour, minutes, seconds, ms] = getTimeParts(time);

    console.log(
      `Received leet at ${time.toISOString()} by user ${
        (message as any).user
      } in channel ${event.channel}`
    );
    console.log("Time:", hour, minutes, seconds, ms);

    const isLeet = hour === 13 && minutes === 37;
    if (hour === 13 && minutes === 36) {
      const negativeOffset = 1000 - ms;
      await say(
        `Premature leetjaculation av <@${
          (message as any).user
        }>!!! Du var ${negativeOffset}ms for tidlig :hot_face:`
      );
    }

    if (isLeet && seconds === 0) {
      await new Promise((resolve) => setTimeout(resolve, ms * 2));

      await say(
        `En ekte leetoo av <@${
          (message as any).user
        }>! :leetoo: Du var ${ms}ms over.`
      );
    } else if (isLeet) {
      await say(
        `Bra jobba <@${
          (message as any).user
        }>! Du var ${seconds} sekunder inn i minuttet.`
      );
    } else {
      await say(
        `<@${(message as any).user}>, ${formatHours(
          time
        )} is not 13:37. This Incident Will Be Reported`
      );
    }
  });
}
