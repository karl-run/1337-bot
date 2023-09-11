import { format, utcToZonedTime } from "date-fns-tz";
import { getHours, getMilliseconds, getMinutes, getSeconds } from "date-fns";

const OSLO_TZ = "Europe/Oslo";

export function slackTsToDate(ts: string): Date {
  return utcToZonedTime(new Date(+ts * 1000), OSLO_TZ);
}

export function getTimeParts(time: Date): {
  hour: number;
  minutes: number;
  seconds: number;
  ms: number;
} {
  return {
    hour: getHours(time),
    minutes: getMinutes(time),
    seconds: getSeconds(time),
    ms: getMilliseconds(time),
  };
}

export function formatHours(time: Date) {
  return format(time, "HH:mm", { timeZone: OSLO_TZ });
}

export function formatHoursWithSeconds(time: Date) {
  return format(time, "HH:mm:ss", { timeZone: OSLO_TZ });
}
