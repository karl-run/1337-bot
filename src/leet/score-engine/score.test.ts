// @ts-expect-error Tricksy typescript :)))
import { expect, describe, test } from "bun:test";

import { scoreLeets } from "./score";
import { UserLeetRow } from "../../db/types";
import { getTime } from "date-fns";

describe("score engine", () => {
  test("a single 2ms leet should give 2498 points", async () => {
    const result = await scoreLeets([
      createLeet("user", "1337", createLeetooDate(2)),
    ]);

    // First bonus: 500
    // Leetoo bonus: 1000
    // Time bonus: 1000 - 2 = 998
    expect(result[0].scoreSum).toBe(2498);
  });

  test("a single 1.5 second leet should give 2498 points", async () => {
    const result = await scoreLeets([
      createLeet("user", "1337", createLeetDate(1.5)),
    ]);

    // First bonus: 500
    // Sub 3 second bonus 250
    expect(result[0].scoreSum).toBe(750);
  });

  test("a single 37 second leet should give 527 points", async () => {
    const result = await scoreLeets([
      createLeet("user", "1337", createLeetDate(37)),
    ]);

    // First bonus: 500
    // Post 3 second bonus 27
    expect(result[0].scoreSum).toBe(527);
  });
});

function createLeet(user: string, text: string, ts: Date): UserLeetRow {
  return {
    channel: "test",
    ts: `${getTime(ts) / 1000}`,
    message: {
      user,
      text,
    } as UserLeetRow["message"],
  } as UserLeetRow;
}

function createLeetooDate(ms: number): Date {
  return new Date(2023, 5, 6, 13 - 2, 37, 0, ms);
}

function createLeetDate(s: number): Date {
  return new Date(2023, 5, 6, 13 - 2, 37, s, 137);
}
