/**
 * Runs asynchronous operations sequentially.
 *
 * Each operation can return its own result.
 * Failed operations do not block later saves.
 */
export function createSaveQueue() {
  let pending: Promise<void> = Promise.resolve();

  return {
    enqueue<T>(operation: () => Promise<T>): Promise<T> {
      const result = pending.then(operation);

      pending = result.then(
        () => undefined,
        () => undefined,
      );

      return result;
    },

    waitForIdle(): Promise<void> {
      return pending;
    },
  };
}
