import { App } from "@slack/bolt";
import { postOrUpdate } from "./leet-handlers";
import { getTopBlocks } from "./top-10";
import { getTimeParts } from "../utils/date-utils";
import { getTopStreak } from "./streak";

export function configureCommandHandlers(app: App) {
  app.command(
    "/1337-debougge",
    async ({ command, ack, say, client, context }) => {
      await ack();

      const { hour, minutes } = getTimeParts(new Date());

      if ((hour === 13 && minutes >= 37) || hour > 13) {
        await postOrUpdate(client, command.channel_id);

        return;
      }

      await client.chat.postEphemeral({
        channel: command.channel_id,
        user: command.user_id,
        text: `:warning: Må du kødde med botten <@${command.user_id}>???`,
      });
    },
  );

  app.command(
    "/1337-streaks",
    async ({ command, ack, say, client, context }) => {
      const topStreaksBlocks = await getTopStreak(command.channel_id);

      await say({
        text: "Top Streaks",
        channel: command.channel_id,
        blocks: [
          ...topStreaksBlocks,
          {
            type: "context",
            elements: [
              {
                type: "mrkdwn",
                text: `Denne top streaks-listen er bestilt av <@${command.user_id}>`,
              },
            ],
          },
        ],
      });
    },
  );

  app.command("/1337-top", async ({ command, ack, say, client, context }) => {
    await ack();

    if (!command.text.trim()) {
      await client.chat.postEphemeral({
        channel: command.channel_id,
        user: command.user_id,
        text: `:warning: Du må si hvor stor top-listen skal være. F.eks \`/1337-top 10\`. :letogun:`,
      });
      return;
    }

    const commandInput = command.text.split(" ")[0];
    const count = +commandInput ?? 10;

    if (isNaN(count)) {
      await client.chat.postEphemeral({
        channel: command.channel_id,
        user: command.user_id,
        text: `:warning: ${commandInput} er ikke et gyldig tall. :letogun:`,
      });
      return;
    }

    if (count > 20) {
      await client.chat.postEphemeral({
        channel: command.channel_id,
        user: command.user_id,
        text: `:warning: Må du prøve å ødelegge botten / spamme kanalen?. :letogun:`,
      });
      return;
    }

    const blocks = await getTopBlocks(command.channel_id, count);

    await say({
      text: "Top 10 leets",
      channel: command.channel_id,
      blocks: [
        ...blocks,
        {
          type: "context",
          elements: [
            {
              type: "mrkdwn",
              text: `Denne top ${count} listen er bestilt av <@${command.user_id}>`,
            },
          ],
        },
      ],
    });
  });
}
