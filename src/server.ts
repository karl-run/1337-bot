import { App } from "@slack/bolt";
import { config } from "dotenv";
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

  await postOrUpdate(app.client, "C059J1GNRQS");

  console.log("⚡️ Bolt app is running!");

  process.on("SIGTERM", () => {
    app.stop().then(() => {
      console.info("Shutting down gracefully");
      process.exit(0);
    });
  });
})();
