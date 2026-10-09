const DEBUG_ENABLED = import.meta.env.DEV;

export function devLog(label: string, data?: unknown): void {
  if (!DEBUG_ENABLED) return;

  console.log(`[Chess Trainer] ${label}`, data);
}
