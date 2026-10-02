import {
    Chess,
  } from "chess.js";
  
  
  export type OpponentEndgameType =
    | "pawn"
    | "rook"
    | "minor"
    | "queen"
    | "mixed";
  
  
  export type EndgameMaterialProfile = {
    queens: number;
    rooks: number;
    bishops: number;
    knights: number;
    pawns: number;
  };
  
  
  export function getEndgameMaterialProfile(
    fen: string
  ): EndgameMaterialProfile {
    const game = new Chess(fen);
  
    const profile:
      EndgameMaterialProfile = {
        queens: 0,
        rooks: 0,
        bishops: 0,
        knights: 0,
        pawns: 0,
      };
  
    for (const rank of game.board()) {
      for (const piece of rank) {
        if (!piece) {
          continue;
        }
  
        switch (piece.type) {
          case "q":
            profile.queens += 1;
            break;
  
          case "r":
            profile.rooks += 1;
            break;
  
          case "b":
            profile.bishops += 1;
            break;
  
          case "n":
            profile.knights += 1;
            break;
  
          case "p":
            profile.pawns += 1;
            break;
        }
      }
    }
  
    return profile;
  }
  
  
  export function getOpponentEndgameType(
    fen: string
  ): OpponentEndgameType {
    const material =
      getEndgameMaterialProfile(fen);
  
    if (material.queens > 0) {
      return "queen";
    }
  
    if (material.rooks > 0) {
      return "rook";
    }
  
    if (
      material.bishops > 0 ||
      material.knights > 0
    ) {
      return "minor";
    }
  
    if (material.pawns > 0) {
      return "pawn";
    }
  
    return "mixed";
  }