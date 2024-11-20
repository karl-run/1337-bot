import { expect, describe, test } from "bun:test";

import { scoreLeets } from "./score";
import { UserLeetRow } from "../../db/types";
import { getTime } from "date-fns";

describe("score engine", () => {
  test("a single 2ms leet should give 2498 points", async () => {
    const [userA] = await scoreLeets([
      createLeet("user", "1337", createLeetooDate(2)),
    ]);

    // First bonus: 500
    // Leetoo bonus: 1000
    // Time bonus: 1000 - 2 = 998
    expect(userA.scoreSum).toBe(2498);
  });

  test("a single 1.5 second leet should give 2498 points", async () => {
    const [userA] = await scoreLeets([
      createLeet("user", "1337", createLeetDate(1.5)),
    ]);

    // First bonus: 500
    // Sub 3 second bonus 250
    expect(userA.scoreSum).toBe(750);
  });

  test("a single 37 second leet should give 527 points", async () => {
    const [userA] = await scoreLeets([
      createLeet("user", "1337", createLeetDate(37)),
    ]);

    // First bonus: 500
    // Post 3 second bonus 27
    expect(userA.scoreSum).toBe(527);
  });
});

describe("score engine - multiple leets", () => {
  test("only the leetoo should count", async () => {
    const [userA] = await scoreLeets([
      createLeet("user", "1337", createLeetooDate(123)),
      createLeet("user", "1337", createLeetDate(47)),
    ]);

    expect(userA.scoreSum).toBe(2377);
  });

  test("only the premature should count (leetoo)", async () => {
    const [userA] = await scoreLeets([
      createLeet("user", "1337", createPrematureDate(12)),
      createLeet("user", "1337", createLeetooDate(2)),
    ]);

    expect(userA.scoreSum).toBe(-5000);
  });

  test("only the premature should count (leet)", async () => {
    const [userA] = await scoreLeets([
      createLeet("user", "1337", createPrematureDate(12)),
      createLeet("user", "1337", createLeetDate(2)),
    ]);

    expect(userA.scoreSum).toBe(-5000);
  });

  test("only the first leet should count", async () => {
    const [userA] = await scoreLeets([
      createLeet("user", "1337", createLeetDate(4)),
      createLeet("user", "1337", createLeetDate(5)),
      createLeet("user", "1337", createLeetDate(6)),
      createLeet("user", "1337", createLeetDate(7)),
    ]);

    expect(userA.scoreSum).toBe(500 + 27);
  });

  test("only the first leet should count (sub 3s)", async () => {
    const [userA] = await scoreLeets([
      createLeet("user", "1337", createLeetDate(1.5)),
      createLeet("user", "1337", createLeetDate(7)),
    ]);

    expect(userA.scoreSum).toBe(500 + 250);
  });

  test("garbage before should be discounted", async () => {
    const [userA] = await scoreLeets([
      createLeet("user", "1337", createGarbage(32)),
      createLeet("user", "1337", createLeetDate(1.5)),
    ]);

    expect(userA.scoreSum).toBe(750);
  });

  test("garbage after should be discounted", async () => {
    const [userA] = await scoreLeets([
      createLeet("user", "1337", createLeetDate(1.5)),
      createLeet("user", "1337", createGarbage(39)),
    ]);

    expect(userA.scoreSum).toBe(750);
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

function createGarbage(minutes: number): Date {
  return new Date(2023, 5, 6, 13 - 2, minutes, 15, 169);
}

function createPrematureDate(ms: number): Date {
  return new Date(2023, 5, 6, 13 - 2, 36, 59, 1000 - ms);
}

function createLeetooDate(ms: number): Date {
  return new Date(2023, 5, 6, 13 - 2, 37, 0, ms);
}

function createLeetDate(s: number): Date {
  return new Date(2023, 5, 6, 13 - 2, 37, s, 137);
}
