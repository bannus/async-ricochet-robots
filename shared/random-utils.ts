/**
 * Seeded Random Number Generator
 * 
 * Provides a deterministic PRNG that can be seeded for reproducible results.
 * Used in tests to ensure consistent board generation.
 * 
 * In production, uses Date.now() as seed for truly random behavior.
 * In tests, use setSeed() to set a fixed seed for deterministic results.
 */

let seed = Date.now();

/**
 * Set the seed for the random number generator
 * @param newSeed The seed value (should be a positive integer)
 */
export function setSeed(newSeed: number): void {
  seed = newSeed;
}

/**
 * Get the current seed value
 */
export function getSeed(): number {
  return seed;
}

/**
 * Generate a random number between 0 (inclusive) and 1 (exclusive)
 * Uses Linear Congruential Generator (LCG) algorithm
 * 
 * @returns A pseudo-random number in [0, 1)
 */
export function random(): number {
  // LCG parameters from Numerical Recipes
  // These values ensure a full period for 32-bit integers
  seed = (seed * 1664525 + 1013904223) >>> 0; // >>> 0 ensures 32-bit unsigned
  return seed / 4294967296; // Normalize to [0, 1)
}

/**
 * Reset to a random seed (useful for production environments)
 */
export function resetToRandomSeed(): void {
  seed = Date.now();
}
