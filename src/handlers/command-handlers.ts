import { App, SlashCommand } from "@slack/bolt";
import yargs, { ParseCallback } from "yargs";

import { WebClient } from "@slack/web-api";

import { commands, Commands } from "./commands";
import { parseYearMonth } from "../utils/date-utils";
import { isValid } from "date-fns";

export function createParser(
  command: SlashCommand,
  client: WebClient,
  commands: Commands,
) {
  return yargs([])
    .scriptName("/1337")
    .version(false)
    .command("debougge", "debougges the bot (don't use >:()", () =>
      commands.handleDebougge(client, command),
    )
    .command("streaks", "gets all streaks of 3 or more days", () =>
      commands.handleStreaks(command, client),
    )
    .command(
      "top",
      "gets the top N fastest leets, e.g: `/1337 top 5`",
      (yargs) =>
        yargs.positional("count", {
          type: "number",
          description: "how many of the fastest leets to show",
          default: 10,
        }),
      (args) => {
        if (isNaN(args.count)) {
          throw new Error(
            `"${command.text.trim()}", that's not a valid number`,
          );
        }

        return commands.handleTop(command, client, args.count);
      },
    )
    .command(
      "scoreboard",
      "gets the scoreboard, either all time or detailed for current month",
      (yargs) =>
        yargs
          .option("all", {
            type: "boolean",
            description: "show all time scoreboard",
          })
          .option("detailed", {
            type: "boolean",
            conflicts: "all",
            description:
              "show reference to all leet-messages (only for monthly)",
          })
          .positional("month", {
            type: "string",
            conflicts: "all",
            description: "which month on the format yyyy.mm, example: 2023.08",
            demandOption: false,
          }),
      (yargs) => {
        if (yargs.month && !isValid(parseYearMonth(yargs.month))) {
          throw new Error(
            `"${yargs.month}", that's not a valid month on the format yyyy.mm`,
          );
        }

        return commands.handleScoreboard(command, client, {
          allTime: yargs.all ?? null,
          detailed: yargs.detailed ?? null,
          month: yargs.month ?? null,
        });
      },
    )
    .demandCommand()
    .strict()
    .help();
}

export function configureCommandHandlers(app: App) {
  app.command("/1337", async ({ command, ack, say, client, context }) => {
    await ack();

    const parser = createParser(command, client, commands);
    const handleParseResult: ParseCallback = async (err, argv, output) => {
      if (output.trim()) {
        await client.chat.postEphemeral({
          channel: command.channel_id,
          user: command.user_id,
          text: `\`\`\`\n${output}\n\`\`\``,
        });
      }
    };

    parser.parse(command.text.trim(), handleParseResult);
  });
}
