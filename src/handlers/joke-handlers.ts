import { App } from "@slack/bolt";

export function configureJokeHandlers(app: App) {
  app.message("137", async ({ message, say, event }) => {
    if (message.type !== "message") return;
    await say(
      `lol, klokka er jo ikke LET <@${(message as any).user}>! :letogun:`
    );
  });
}
