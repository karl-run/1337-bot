import { Mock, describe, expect, test, mock, afterEach } from "bun:test";

import type { Commands } from "./commands";
import { createParser } from "./command-handlers";
import { WebClient } from "@slack/web-api";

describe("args parsing", () => {
  const mocks: Commands = {
    handleScoreboard: mock(),
    handleDebougge: mock(),
    handleStreaks: mock(),
    handleTop: mock(),
    handlePremature: mock(),
    handleRepars: mock(),
  };

  const testParse = createTestParser(mocks);

  afterEach(() => {
    (mocks.handleScoreboard as Mock<() => unknown>).mockReset();
    (mocks.handleDebougge as Mock<() => unknown>).mockReset();
    (mocks.handleStreaks as Mock<() => unknown>).mockReset();
    (mocks.handleTop as Mock<() => unknown>).mockReset();
    (mocks.handlePremature as Mock<() => unknown>).mockReset();
  });

  test("--help should give help", async () => {
    const result = await testParse("--help");

    expect(result).toStartWith("/1337 <command>");
  });

  test("missing command should throw", async () => {
    const doParse = async () => await testParse("");

    expect(doParse).toThrow(
      "Not enough non-option arguments: got 0, need at least 1",
    );
  });

  test("superfluous param should throw", async () => {
    const doParse = async () => await testParse("streaks whoop");

    expect(doParse).toThrow("Unknown argument: whoop");
  });

  test("debougge should handle debougge", async () => {
    await testParse("debougge");

    expect(mocks.handleDebougge).toHaveBeenCalledTimes(1);
  });

  test("streaks should handle streaks", async () => {
    await testParse("streaks");

    expect(mocks.handleStreaks).toHaveBeenCalledTimes(1);
  });

  test("top should handle top base case", async () => {
    await testParse("top");

    expect(mocks.handleTop).toHaveBeenCalledTimes(1);
    expect(lastParam(mocks.handleTop)).toBe(10);
  });

  test("top should handle top with count", async () => {
    await testParse("top --count=5");

    expect(mocks.handleTop).toHaveBeenCalledTimes(1);
    expect(lastParam(mocks.handleTop)).toBe(5);
  });

  test("top should handle top with non-number param", async () => {
    const doParse = async () => await testParse("top --count=whoop");

    expect(doParse).toThrow('"top --count=whoop", that\'s not a valid number');
    expect(mocks.handleTop).not.toHaveBeenCalled();
  });

  test("scoreboard should handle scoreboard base case", async () => {
    await testParse("scoreboard");

    expect(mocks.handleScoreboard).toHaveBeenCalledTimes(1);
    expect(lastParam(mocks.handleScoreboard)).toEqual({
      allTime: null,
      detailed: null,
      week: null,
      month: null,
    });
  });

  test("scoreboard should handle --all param", async () => {
    await testParse("scoreboard --all");

    expect(mocks.handleScoreboard).toHaveBeenCalledTimes(1);
    expect(lastParam(mocks.handleScoreboard)).toEqual({
      allTime: true,
      detailed: null,
      week: null,
      month: null,
    });
  });

  test("scoreboard should handle --month=value param", async () => {
    await testParse("scoreboard --month=2023.06");

    expect(mocks.handleScoreboard).toHaveBeenCalledTimes(1);
    expect(lastParam(mocks.handleScoreboard)).toEqual({
      allTime: null,
      detailed: null,
      week: null,
      month: "2023.06",
    });
  });

  test("scoreboard should be angry when --month=value param is bad date", async () => {
    const doParse = async () => await testParse("scoreboard --month=2023.13");

    expect(doParse).toThrow(
      '"2023.13", that\'s not a valid month on the format yyyy.mm',
    );
  });

  test("scoreboard should handle --detailed param", async () => {
    await testParse("scoreboard --detailed");

    expect(mocks.handleScoreboard).toHaveBeenCalledTimes(1);
    expect(lastParam(mocks.handleScoreboard)).toEqual({
      allTime: null,
      detailed: true,
      week: null,
      month: null,
    });
  });

  test("scoreboard should handle --detailed and --month param", async () => {
    await testParse("scoreboard --month=2023.07 --detailed");

    expect(mocks.handleScoreboard).toHaveBeenCalledTimes(1);
    expect(lastParam(mocks.handleScoreboard)).toEqual({
      allTime: null,
      detailed: true,
      week: null,
      month: "2023.07",
    });
  });

  describe("scoreboard should be angry at --all combined with either --detailed or --month param", () => {
    test("all combinations", async () => {
      const doParse = async () =>
        await testParse("scoreboard --all --month=2023.07 --detailed");

      expect(doParse).toThrow(
        "Arguments detailed and all are mutually exclusive",
      );
    });

    test("all+month combinations", async () => {
      const doParse = async () =>
        await testParse("scoreboard --all --month=2023.07");

      expect(doParse).toThrow("Arguments month and all are mutually exclusive");
    });

    test("all+detailed combinations", async () => {
      const doParse = async () =>
        await testParse("scoreboard --all --detailed");

      expect(doParse).toThrow(
        "Arguments detailed and all are mutually exclusive",
      );
    });

    test("all+week combinations", async () => {
      const doParse = async () => await testParse("scoreboard --all --week");

      expect(doParse).toThrow("Arguments week and all are mutually exclusive");
    });
  });

  describe("premature", () => {
    test("premature should handle premature base case", async () => {
      await testParse("premature");

      expect(mocks.handlePremature).toHaveBeenCalledTimes(1);
      expect(lastParam(mocks.handlePremature)).toEqual(false);
    });

    test("premature should handle premature with --worst", async () => {
      await testParse("premature --worst");

      expect(mocks.handlePremature).toHaveBeenCalledTimes(1);
      expect(lastParam(mocks.handlePremature)).toEqual(true);
    });
  });
});

function lastParam<T>(mock: (...args: any[]) => any): T {
  const forcedMock = mock as Mock<(...args: any[]) => any>;
  const lastCall = forcedMock.mock.lastCall;
  return lastCall[lastCall.length - 1];
}

function createTestParser(mocks: Commands) {
  return (command: string) =>
    new Promise((resolve, reject) => {
      createParser(
        mock().mockImplementation(() => ({
          text: command,
        }))(),
        mock() as unknown as WebClient,
        mocks,
      ).parse(command, (err, _, output) => {
        if (err) reject(err);
        else resolve(output);
      });
    });
}
