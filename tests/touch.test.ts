import { test } from "node:test";
import assert from "node:assert/strict";
import { updateTouches } from "../src/game/touchInput";

test("batched touches isolate movement and jump and release independently", () => {
  const batch = [
    { identifier: "move", target: 11 },
    { identifier: "jump", target: 22 },
  ];
  let left = updateTouches(new Set(), batch, true, 11);
  let jump = updateTouches(new Set(), batch, true, 22);
  assert.deepEqual([...left], ["move"]);
  assert.deepEqual([...jump], ["jump"]);
  left = updateTouches(left, [batch[1]], false, 11);
  jump = updateTouches(jump, [batch[1]], false, 22);
  assert.equal(left.size, 1);
  assert.equal(jump.size, 0);
  assert.equal(updateTouches(left, [batch[0]], false, 11).size, 0);
});

test("two fingers on one control stay held until both release; unknown targets ignored", () => {
  const batch = [
    { identifier: "first", target: 11 },
    { identifier: "second", target: 11 },
  ];
  const held = updateTouches(new Set(), batch, true, 11);
  assert.equal(updateTouches(held, [batch[0]], false, 11).size, 1);
  assert.equal(held.size, 2);
  assert.deepEqual(
    [...updateTouches(new Set(), [{ identifier: 7, target: "11" }], true, 11)],
    ["7"],
  );
  assert.equal(updateTouches(new Set(), batch, true, null).size, 0);
});
