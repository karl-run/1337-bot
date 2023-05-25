import { App } from "@slack/bolt";
import { config } from "dotenv";
import { getMilliseconds, getSeconds } from "date-fns/fp";
import { format } from "date-fns";
import nb from "date-fns/locale/nb";

config();

const app = new App({
  token: process.env.BOT_TOKEN,
  appToken: process.env.APP_TOKEN,
  socketMode: true,
});

app.message("1337", async ({ message, say, event }) => {
  if (message.type !== "message") return;

  const time = new Date(+message.ts * 1000);

  console.log(
    `Received leet at ${time.toISOString()} by user ${(message as any).user}`
  );

  const isLeet = time.getHours() === 11 && time.getMinutes() === 37;
  if (isLeet && time.getSeconds() === 0) {
    await say(
      `En ekte leetoo av <@${
        (message as any).user
      }>! :leetoo: Du var ${getMilliseconds(time)}ms over.`
    );
  } else if (isLeet) {
    await say(
      `Bra jobba <@${(message as any).user}>! Du var ${getSeconds(
        time
      )} sekunder inn i minuttet.`
    );
  } else {
    await say(
      `Ikke 1337. :letogun:`
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
