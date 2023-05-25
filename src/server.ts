import { App } from "@slack/bolt";
import { config } from "dotenv";

config();

const app = new App({
  token: process.env.BOT_TOKEN,
  appToken: process.env.APP_TOKEN,
  socketMode: true,
});

app.message("1337", async ({ message, say }) => {
  await say(`Hello ${message.ts}`);
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
