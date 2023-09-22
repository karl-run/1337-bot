import { getTodaysLeets } from "../../db/queries";
import {
  formatHours,
  getTimeParts,
  slackTsToDate,
} from "../../utils/date-utils";
import { formatDistanceStrict, set } from "date-fns";
import { nb } from "date-fns/locale";
import { LeetStatus } from "./row-utils";
import { ScoredMessage } from "../score-engine";

type StatusScoredMessageTuple = [key: LeetStatus, rows: ScoredMessage[]];

function formatLeetos(rows: ScoredMessage[]) {
  return rows
    .map((row) => {
      const { ms } = getTimeParts(slackTsToDate(row.message.ts));
      return `:letopet: <@${row.message.message.user}>: ${ms}ms (+${row.points})`;
    })
    .join("\n");
}

function formatLeets(rows: ScoredMessage[]) {
  return rows
    .map((row) => {
      const { seconds, ms } = getTimeParts(slackTsToDate(row.message.ts));
      return `:letojam: <@${row.message.message.user}>: ${seconds}s ${ms}ms (+${row.points})`;
    })
    .join("\n");
}

function formatPrematureRows(rows: ScoredMessage[]) {
  return rows
    .map((row) => {
      const { seconds, ms } = getTimeParts(slackTsToDate(row.message.ts));
      const negativeOffset = 1000 - ms;
      return `:letogun: <@${row.message.message.user}>: -${negativeOffset}ms for tidlig :hot_face: (${row.points})`;
    })
    .join("\n");
}

function formatLateRows(rows: ScoredMessage[]) {
  return rows
    .map((row) => {
      const date = slackTsToDate(row.message.ts);
      const { minutes, seconds } = getTimeParts(date);
      return `:letoint: <@${
        row.message.message.user
      }>: ${minutes}m ${seconds}s (${formatHours(date)}) (+${row.points})`;
    })
    .join("\n");
}

function messageFormatters(rows: ScoredMessage[]) {
  return rows
    .map((row) => {
      const leet = set(new Date(), {
        hours: 13,
        minutes: 37,
        seconds: 0,
        milliseconds: 0,
      });

      const date = slackTsToDate(row.message.ts);
      return `:letoshake: <@${row.message.message.user}>: ${formatDistanceStrict(
        leet,
        date,
        {
          locale: nb,
        },
      )} bom :roflrofl: (${formatHours(date)}) (+${row.points})`;
    })
    .join("\n");
}

export function toCategoryMarkdown([key, rows]: StatusScoredMessageTuple) {
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
