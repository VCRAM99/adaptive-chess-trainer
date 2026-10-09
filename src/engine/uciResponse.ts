export type UciResponse =
  { type: "ready" } | { type: "bestmove"; move: string } | { type: "other" };

export function parseUciResponse(message: string): UciResponse {
  const trimmed = message.trim();

  if (trimmed === "readyok") return { type: "ready" };

  const match = /^bestmove\s+(\S+)(?:\s+.*)?$/.exec(trimmed);

  if (match) {
    return {
      type: "bestmove",
      move: match[1],
    };
  }

  return { type: "other" };
}
