/**
 * Identifies one played game in history.
 *
 * A new id is created when a game starts and is reused
 * through completion, review, and profile storage.
 * Legacy ids such as "game-1" stay valid and are not rewritten.
 */
export function createPersistentGameId(): string {
  return crypto.randomUUID();
}
