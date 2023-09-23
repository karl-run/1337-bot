import * as R from "remeda";
import { format, utcToZonedTime } from "date-fns-tz";
import {
  getDate,
  getHours,
  getMilliseconds,
  getMinutes,
  getSeconds,
  isSameDay,
  isSameMonth,
  isSameYear,
} from "date-fns";
import nbLocale from "date-fns/locale/nb";

const OSLO_TZ = "Europe/Oslo";

export function slackTsToDate(ts: string | number): Date {
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

export const slackTsToMs: (ts: string) => number = R.createPipe(
  slackTsToDate,
  getMilliseconds,
);

export const slackTsToSeconds: (ts: string) => number = R.createPipe(
  slackTsToDate,
  getSeconds,
);

export const slackTsToDay: (ts: string) => number = R.createPipe(
  slackTsToDate,
  getDate,
);

export function formatHours(time: Date) {
  return format(time, "HH:mm", { timeZone: OSLO_TZ });
}

export function getMonthName(date: Date): string {
  return format(date, "MMMM", { locale: nbLocale });
}

export function formatHoursWithSeconds(time: Date) {
  return format(time, "HH:mm:ss", { timeZone: OSLO_TZ });
}

function toReadableDate(date: Date): string {
  return format(date, `d. MMMM yyyy`, { locale: nbLocale });
}

function toReadableDateNoYear(date: Date): string {
  return format(date, "d. MMMM", { locale: nbLocale });
}

export function toReadableDatePeriod(fom: Date, tom: Date): string {
  if (isSameDay(fom, tom)) {
    return toReadableDate(fom);
  } else if (isSameMonth(fom, tom)) {
    return `${getDate(fom)}. - ${toReadableDate(tom)}`;
  } else if (isSameYear(fom, tom)) {
    return `${toReadableDateNoYear(fom)} - ${toReadableDate(tom)}`;
  } else {
    return `${toReadableDate(fom)} - ${toReadableDate(tom)}`;
  }
}
