export type Touch = { identifier: string | number; target?: string | number };

// Native batches may contain changed touches from several buttons.
// Track starts only for this button; releases can safely remove any known ID.
export function updateTouches(
  held: ReadonlySet<string>,
  changed: readonly Touch[],
  down: boolean,
  target: number | null,
): Set<string> {
  const next = new Set(held);
  for (const touch of changed) {
    if (!down) next.delete(String(touch.identifier));
    else if (target !== null && String(touch.target) === String(target))
      next.add(String(touch.identifier));
  }
  return next;
}
