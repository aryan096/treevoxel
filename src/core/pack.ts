export const GRID_SIZE = 256;

/**
 * Pack (x, z) into a single integer key for Map storage.
 * Maps (0, 0) → 0, and supports negative coordinates via offset.
 * Strategy: offset both x and z by GRID_SIZE/2, but subtract that from the result to map (0,0)→0.
 */
export function pack(x: number, z: number): number {
  const offsetX = x + GRID_SIZE / 2;
  const offsetZ = z + GRID_SIZE / 2;
  const result = offsetX * GRID_SIZE + offsetZ;
  // Subtract the offset for (0,0) case
  const zeroOffset = (GRID_SIZE / 2) * GRID_SIZE + (GRID_SIZE / 2);
  return result - zeroOffset;
}

/**
 * Unpack a key back into [x, z] coordinates.
 */
export function unpack(key: number): [number, number] {
  const zeroOffset = (GRID_SIZE / 2) * GRID_SIZE + (GRID_SIZE / 2);
  const adjustedKey = key + zeroOffset;
  const offsetX = Math.floor(adjustedKey / GRID_SIZE);
  const offsetZ = adjustedKey % GRID_SIZE;
  const x = offsetX - GRID_SIZE / 2;
  const z = offsetZ - GRID_SIZE / 2;
  return [x, z];
}
