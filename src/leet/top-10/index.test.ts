import { test, expect } from "bun:test";
import { addNanos, sortByMsThenNs } from "./index";
import * as R from "remeda";

test("a 000ms should add nanos", () => {
  const nanoTs = "1731674220000169";

  expect(addNanos(new Date(+nanoTs / 1000), { ts: nanoTs } as any)).toEqual(
    "(169ns)",
  );
});

test("a 001ms should NOT add nanos", () => {
  const nanoTs = "1731674220001169";

  expect(addNanos(new Date(+nanoTs / 1000), { ts: nanoTs } as any)).toEqual(" ");
});

test("sortByMsThenNs", () => {
  const ts = [
    "1731674220000169",
    "1731674220000049",
    "1677847020016259",
    "1731674220000369",
  ];
  const messages = ts.map(
    (ts) => [new Date(+ts / 1000), { ts } as any] as const,
  );

  const sorted = sortByMsThenNs(messages, 3);

  expect(sorted.map((it) => it[1].ts)).toEqual([
    "1731674220000049",
    "1731674220000169",
    "1731674220000369",
  ]);
});
