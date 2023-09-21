import { getTimeParts, slackTsToDate } from "../../utils/date-utils";
import { getTodaysLeets } from "../../db/queries";

export type LeetStatus = "leetos" | "leet" | "premature" | "late" | "garbage";

export function rowToStatus(
  row: Awaited<ReturnType<typeof getTodaysLeets>>[number],
): LeetStatus {
  const timeParts = getTimeParts(slackTsToDate(row.ts));

  if (timeParts.minutes === 37 && timeParts.seconds === 0) {
    return "leetos";
  } else if (timeParts.minutes === 37) {
    return "leet";
  } else if (timeParts.minutes === 36) {
    return "premature";
  } else if (timeParts.minutes === 38) {
    return "late";
  } else {
    return "garbage";
  }
}
