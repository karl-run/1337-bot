import { getTodaysLeets } from "../db";
import {
  formatHours,
  formatHoursWithSeconds,
  getTimeParts,
  slackTsToDate,
} from "../date-utils";
import { formatDistanceStrict, set } from "date-fns";
import { nb } from "date-fns/locale";

function formatLeetos(rows: Awaited<ReturnType<typeof getTodaysLeets>>) {
  return rows
    .map((row) => {
      const { ms } = getTimeParts(slackTsToDate(row.ts));
      return `:letopet: <@${row.message.user}>: ${ms}ms`;
    })
    .join("\n");
}

function formatLeets(rows: Awaited<ReturnType<typeof getTodaysLeets>>) {
  return rows
    .map((row) => {
      const { seconds, ms } = getTimeParts(slackTsToDate(row.ts));
      return `:letojam: <@${row.message.user}>: ${seconds}s ${ms}ms`;
    })
    .join("\n");
}

function formatPrematureRows(rows: Awaited<ReturnType<typeof getTodaysLeets>>) {
  return rows
    .map((row) => {
      const { seconds, ms } = getTimeParts(slackTsToDate(row.ts));
      const negativeOffset = 1000 - ms;
      return `:letogun: <@${row.message.user}>: -${negativeOffset}ms for tidlig :hot_face:`;
    })
    .join("\n");
}

function formatLateRows(rows: Awaited<ReturnType<typeof getTodaysLeets>>) {
  return rows
    .map((row) => {
      const date = slackTsToDate(row.ts);
      const { minutes, seconds } = getTimeParts(date);
      return `:letoint: <@${
        row.message.user
      }>: ${minutes}m ${seconds}s (${formatHours(date)})`;
    })
    .join("\n");
}

function messageFormatters(rows: Awaited<ReturnType<typeof getTodaysLeets>>) {
  return rows
    .map((row) => {
      const leet = set(new Date(), {
        hours: 13,
        minutes: 37,
        seconds: 0,
        milliseconds: 0,
      });

      const date = slackTsToDate(row.ts);
      return `:letoshake: <@${row.message.user}>: ${formatDistanceStrict(
        leet,
        date,
        {
          locale: nb,
        },
      )} bom :roflrofl: (${formatHours(date)})`;
    })
    .join("\n");
}

export function toCategoryMarkdown([key, rows]) {
  switch (key) {
    case "leetos":
      return `*Ekte leetos*:\n${formatLeetos(rows)}`;
    case "leet":
      return `*Leets*:\n${formatLeets(rows)}`;
    case "premature":
      return `*Premature leets*:\n${formatPrematureRows(rows)}`;
    case "late":
      return `*For sent lol*:\n${formatLateRows(rows)}`;
    case "garbage":
      return `*wtf??*:\n${messageFormatters(rows)}`;
  }
}
