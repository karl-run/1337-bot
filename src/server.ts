import { App } from "@slack/bolt";
import { config } from "dotenv";
import { utcToZonedTime, format, getTimezoneOffset } from "date-fns-tz";
import { getHours, getMinutes, getMilliseconds, getSeconds } from "date-fns";

const OSLO = "Europe/Oslo";

config();

const app = new App({
  token: process.env.BOT_TOKEN,
  appToken: process.env.APP_TOKEN,
  socketMode: true,
});

app.message("137", async ({ message, say, event }) => {
  if (message.type !== "message") return;
  await say(`lol, klokka er jo ikke LET <@${
      (message as any).user
    }>! :letogun:`);
});

app.message("1337", async ({ message, say, event }) => {
  if (message.type !== "message") return;

  const time = utcToZonedTime(new Date(+message.ts * 1000), OSLO);
  const offsetHours = getTimezoneOffset(OSLO, time) / 1000 / 60 / 60;
  const [hour, minutes, seconds, ms] = [
    getHours(time),
    getMinutes(time),
    getSeconds(time),
    getMilliseconds(time),
  ];

  console.log(
    `Received leet at ${time.toISOString()} by user ${
      (message as any).user
    } in channel ${event.channel}`
  );
  console.log("Time:", hour, minutes, seconds, ms);
  console.log("Offset:", offsetHours);

  const isLeet = hour === 13 && minutes === 37;
  if (isLeet && seconds === 0) {
    await say(
      `En ekte leetoo av <@${
        (message as any).user
      }>! :leetoo: Du var ${ms}ms over.`
    );
  } else if (isLeet) {
    await say(
      `Bra jobba <@${(message as any).user}>! Du var ${getSeconds(
        time
      )} sekunder inn i minuttet.`
    );
  } else {
    await say(
      `${format(time, "HH:mm", {
        timeZone: OSLO,
      })} is not 13:37. This Incident Will Be Reported`
    );
  }
});

(async () => {
  await app.start(process.env.PORT ?? 3000);

  console.log("⚡️ Bolt app is running!");

  process.on("SIGTERM", () => {
    app.stop().then(() => {
      console.info("Shutting down gracefully");
      process.exit(0);
    });
  });
})();
