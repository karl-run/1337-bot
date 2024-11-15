import { test, expect } from "bun:test";
import { addNanos } from "./index";

test("a 000ms should add nanos", () => {
  const nanoTs = "1731674220000169";

  expect(addNanos(new Date(+nanoTs / 1000), { ts: nanoTs } as any)).toEqual(
    "(169ns)",
  );
});

test("a 001ms should NOT add nanos", () => {
  const nanoTs = "1731674220001169";

  expect(addNanos(new Date(+nanoTs / 1000), { ts: nanoTs } as any)).toEqual("");
});
