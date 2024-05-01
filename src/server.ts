import { Cron } from "croner";
import { initDb } from "./db/client";
import { configureJokeHandlers } from "./handlers/joke-handlers";
import { configureLeetHandlers } from "./handlers/leet-handlers";
import { configureCommandHandlers } from "./handlers/command-handlers";
import { postOrUpdateDailyLeets } from "./slack/daily";
import { postWeeklyScoreboard } from "./slack/weekly";
import { app } from "./slack/slack";

(async () => {
  await initDb();

  configureJokeHandlers(app);
  configureLeetHandlers(app);
  configureCommandHandlers(app);

  await app.start(process.env.PORT ?? 3000);

  const dailyCron = new Cron("38 13 * * *", async () => {
    await postOrUpdateDailyLeets(app.client, "C04N7R2F8B0");
  });

  const sundayCron = new Cron("38 13 * * 0", async () => {
    await postWeeklyScoreboard(app.client, "C04N7R2F8B0");
  });

  console.log("⚡️ Bolt app is running!");
  console.log(
    `Cron job is running! Next run ${dailyCron.nextRun().toISOString()}`,
  );
  console.log(
    `Cron job is running! Next run ${sundayCron.nextRun().toISOString()}`,
  );
  process.on("SIGTERM", () => {
    app.stop().then(() => {
      dailyCron.stop();
      sundayCron.stop();

      console.info("Shutting down gracefully");
      process.exit(0);
    });
  });
})();
