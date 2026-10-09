import publicGpl from "../../public/licenses/stockfish-GPL-3.0.txt?raw";
import publicSource from "../../public/licenses/stockfish-corresponding-source.md?raw";
import gpl from "../../licenses/stockfish-GPL-3.0.txt?raw";
import sourceNote from "../../licenses/stockfish-corresponding-source.md?raw";
import { describe, expect, it } from "vitest";

describe("distributed Stockfish license files", () => {
  it("serves the same GPLv3 text that the repository publishes", () => {
    expect(publicGpl).toBe(gpl);
    expect(gpl.startsWith("                    GNU GENERAL PUBLIC LICENSE")).toBe(true);
    expect(gpl).toContain("END OF TERMS AND CONDITIONS");
  });

  it("serves the same corresponding-source note that the repository publishes", () => {
    expect(publicSource).toBe(sourceNote);
    expect(sourceNote).toContain("stockfish-19-lite-single.wasm");
    expect(sourceNote).toContain("v19.0.0.tar.gz");
  });
});
