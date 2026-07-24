import assert from "node:assert/strict";
import test from "node:test";

import { resolveGranularity } from "@/lib/date-range";

test("defaults snapshot granularity to day", () => {
  assert.equal(resolveGranularity(undefined), "day");
  assert.equal(resolveGranularity(null), "day");
  assert.equal(resolveGranularity("invalid"), "day");
});

test("accepts every supported snapshot granularity", () => {
  assert.equal(resolveGranularity("hour"), "hour");
  assert.equal(resolveGranularity("day"), "day");
  assert.equal(resolveGranularity("week"), "week");
  assert.equal(resolveGranularity("month"), "month");
});
