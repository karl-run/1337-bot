import { WebClient } from "@slack/web-api";
import { SlashCommand } from "@slack/bolt";

import {
  getMonthName,
  getTimeParts,
  parseYearMonth,
} from "../utils/date-utils";
import { getMonthlyScoreboardBlocks } from "../leet/score-engine/blocks-month";
import { getAllTimeBlocks } from "../leet/score-engine/blocks-all";
import { getTopStreak } from "../leet/streak";
import { getTopBlocks } from "../leet/top-10";

import { postOrUpdate } from "./leet-handlers";

export type Commands = typeof commands;
export const commands = {
  async handleDebougge(client: WebClient, command: SlashCommand) {
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

  async handleStreaks(command: SlashCommand, client: WebClient) {
    const topStreaksBlocks = await getTopStreak(command.channel_id);

    await client.chat.postMessage({
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

  async handleTop(command: SlashCommand, client: WebClient, count: number) {
    if (isNaN(count)) {
      await client.chat.postEphemeral({
        channel: command.channel_id,
        user: command.user_id,
        text: `:warning: ${count} er ikke et gyldig tall. :letogun:`,
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
    await client.chat.postMessage({
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
  },

  async handleScoreboard(
    command: SlashCommand,
    client: WebClient,
    {
      allTime,
      month,
      detailed,
    }: {
      allTime: boolean | null;
      detailed: boolean | null;
      month: string | null;
    },
  ) {
    const scoreBoardBlocks = allTime
      ? await getAllTimeBlocks(command.channel_id)
      : await getMonthlyScoreboardBlocks(
          command.channel_id,
          month ? parseYearMonth(month) : new Date(),
          detailed,
        );

    await client.chat.postMessage({
      text: allTime
        ? "Scoreboard for all time"
        : `Scoreboard for ${getMonthName(new Date())}`,
      channel: command.channel_id,
      blocks: [
        ...scoreBoardBlocks,
        {
          type: "context",
          elements: [
            {
              type: "mrkdwn",
              text: `Dette scoreboardet er bestilt av <@${command.user_id}>`,
            },
          ],
        },
      ],
    });
  },
} as const;
