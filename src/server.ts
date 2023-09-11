import { App } from "@slack/bolt";
import { config } from "dotenv";
import { Cron } from "croner";
import { initDb } from "./db";
import { configureJokeHandlers } from "./handlers/joke-handlers";
import { configureLeetHandlers, postOrUpdate } from "./handlers/leet-handlers";

config();

const app = new App({
  token: process.env.BOT_TOKEN,
  appToken: process.env.APP_TOKEN,
  socketMode: true,
});

(async () => {
  await initDb();

  configureJokeHandlers(app);
  configureLeetHandlers(app);

  await app.start(process.env.PORT ?? 3000);

  const job = new Cron("38 11 * * *", async () => {
    await postOrUpdate(app.client, "C04N7R2F8B0");
  });

  console.log("⚡️ Bolt app is running!");

  process.on("SIGTERM", () => {
    app.stop().then(() => {
      job.stop();

      console.info("Shutting down gracefully");
      process.exit(0);
    });
  });
})();
