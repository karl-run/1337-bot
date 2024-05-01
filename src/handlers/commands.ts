import { WebClient } from "@slack/web-api";
import { KnownEventFromType, SlashCommand } from "@slack/bolt";

import {
  getMonthName,
  getTimeParts,
  getWeekNumber,
  parseYearMonth,
} from "../utils/date-utils";
import { getMonthlyScoreboardBlocks } from "../leet/score-engine/blocks-month";
import { getAllTimeBlocks } from "../leet/score-engine/blocks-all";
import { getTopStreak } from "../leet/streak";
import { getPrematures, getTopBlocks } from "../leet/top-10";

import { postOrUpdateDailyLeets } from "../slack/daily";
import { getWeeklyScoreboardBlocks } from "../leet/score-engine/blocks-week";
import { startOfDay } from "date-fns";
import { handleReceivedLeetMessage } from "./leet-handlers";

export type Commands = typeof commands;
export const commands = {
  async handleDebougge(client: WebClient, command: SlashCommand) {
    if (command.user_id !== "UA2QHC603") {
      await client.chat.postEphemeral({
        channel: command.channel_id,
        user: command.user_id,
        text: `:warning: Må du kødde med botten <@${command.user_id}>???`,
      });

      return;
    }

    const { hour, minutes } = getTimeParts(new Date());

    if ((hour === 13 && minutes >= 37) || hour > 13) {
      await postOrUpdateDailyLeets(client, command.channel_id);

      return;
    }

    await client.chat.postEphemeral({
      channel: command.channel_id,
      user: command.user_id,
      text: `:warning: Må du kødde med botten <@${command.user_id}>???`,
    });
  },

  async handleRepars(client: WebClient, command: SlashCommand) {
    if (command.user_id !== "UA2QHC603") {
      await client.chat.postEphemeral({
        channel: command.channel_id,
        user: command.user_id,
        text: `:warning: Må du kødde med botten <@${command.user_id}>???`,
      });

      return;
    }

    const messages = await client.conversations.history({
      channel: command.channel_id,
      oldest: `${startOfDay(new Date()).getTime() / 1000}`,
    });

    for (const message of messages.messages) {
      if (message.bot_profile != null || !message.text.includes("1337")) {
        continue;
      }

      try {
        await handleReceivedLeetMessage(
          message as KnownEventFromType<"message">,
          command.channel_id,
          client,
          ({ thread_ts, text }) =>
            client.chat.postMessage({
              channel: command.channel_id,
              thread_ts,
              text,
            }),
        );
      } catch (e) {
        console.error(e);
        continue;
      }
    }

    await client.chat.postEphemeral({
      channel: command.channel_id,
      user: command.user_id,
      text: `Reparsed today's messages (${messages.messages.length})`,
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

  async handlePremature(
    command: SlashCommand,
    client: WebClient,
    worst: boolean,
  ) {
    const prematureBlocks = await getPrematures(
      command.channel_id,
      worst ? "asc" : "desc",
    );

    await client.chat.postMessage({
      text: "Top 10 premature leets",
      channel: command.channel_id,
      blocks: [
        ...prematureBlocks,
        {
          type: "context",
          elements: [
            {
              type: "mrkdwn",
              text: `Denne top 10 premature listen er bestilt av <@${command.user_id}>`,
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
      week,
      detailed,
    }: {
      allTime: boolean | null;
      detailed: boolean | null;
      week: boolean | null;
      month: string | null;
    },
  ) {
    const scoreBoardBlocks = allTime
      ? await getAllTimeBlocks(command.channel_id)
      : week
      ? await getWeeklyScoreboardBlocks(command.channel_id, new Date())
      : await getMonthlyScoreboardBlocks(
          command.channel_id,
          month ? parseYearMonth(month) : new Date(),
          detailed,
        );

    await client.chat.postMessage({
      text: allTime
        ? "Scoreboard for all time"
        : week
        ? `Scoreboard for uke ${getWeekNumber(new Date())}`
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
