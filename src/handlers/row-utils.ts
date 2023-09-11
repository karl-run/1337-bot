import { getTimeParts, slackTsToDate } from "../date-utils";
import { getTodaysLeets } from "../db";

export function rowToStatus(
  row: Awaited<ReturnType<typeof getTodaysLeets>>[number],
) {
  const timeParts = getTimeParts(slackTsToDate(row.ts));

  if (timeParts.hour !== 13) {
    return "garbage";
  } else if (timeParts.minutes === 37 && timeParts.seconds === 0) {
    return "leetos";
  } else if (timeParts.minutes === 37) {
    return "leet";
  } else if (timeParts.minutes === 36) {
    return "premature";
  } else if (timeParts.minutes === 38) {
    return "late";
  }
}
