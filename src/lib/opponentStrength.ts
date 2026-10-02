export type OpponentErrorProfile = {
    targetSkill: number;

    excellentWeight: number;
    goodWeight: number;
    inaccuracyWeight: number;
    mistakeWeight: number;
    blunderWeight: number;
};

export const MIN_OPPONENT_SKILL = 400;
export const MAX_OPPONENT_SKILL = 2400;

export type OpponentMoveQuality =
| "excellent"
| "good"
| "inaccuracy"
| "mistake"
| "blunder";

export function classifyOpponentMove(
centipawnLoss: number
): OpponentMoveQuality {
const loss =
    Math.max(0, centipawnLoss);

if (loss <= 10) {
    return "excellent";
}

if (loss <= 30) {
    return "good";
}

if (loss <= 80) {
    return "inaccuracy";
}

if (loss <= 180) {
    return "mistake";
}

return "blunder";
}

function clamp(
    value: number,
    min: number,
    max: number
    ): number {
    return Math.min(
        max,
        Math.max(min, value)
    );
}
  
function lerp(
    start: number,
    end: number,
    amount: number
): number {
    return (
    start +
    (end - start) * amount
    );
}

const LOW_SKILL_PROFILE = {
    excellentWeight: 30,
    goodWeight: 30,
    inaccuracyWeight: 22,
    mistakeWeight: 13,
    blunderWeight: 5,
};
  
const HIGH_SKILL_PROFILE = {
    excellentWeight: 82,
    goodWeight: 14,
    inaccuracyWeight: 3,
    mistakeWeight: 0.8,
    blunderWeight: 0.2,
};

export function getOpponentErrorProfile(
    targetSkill: number
  ): OpponentErrorProfile {
    const clampedSkill =
      clamp(
        targetSkill,
        MIN_OPPONENT_SKILL,
        MAX_OPPONENT_SKILL
      );
  
    const progress =
      (
        clampedSkill -
        MIN_OPPONENT_SKILL
      ) /
      (
        MAX_OPPONENT_SKILL -
        MIN_OPPONENT_SKILL
      );
  
    return {
      targetSkill: clampedSkill,
  
      excellentWeight:
        lerp(
          LOW_SKILL_PROFILE.excellentWeight,
          HIGH_SKILL_PROFILE.excellentWeight,
          progress
        ),
  
      goodWeight:
        lerp(
          LOW_SKILL_PROFILE.goodWeight,
          HIGH_SKILL_PROFILE.goodWeight,
          progress
        ),
  
      inaccuracyWeight:
        lerp(
          LOW_SKILL_PROFILE.inaccuracyWeight,
          HIGH_SKILL_PROFILE.inaccuracyWeight,
          progress
        ),
  
      mistakeWeight:
        lerp(
          LOW_SKILL_PROFILE.mistakeWeight,
          HIGH_SKILL_PROFILE.mistakeWeight,
          progress
        ),
  
      blunderWeight:
        lerp(
          LOW_SKILL_PROFILE.blunderWeight,
          HIGH_SKILL_PROFILE.blunderWeight,
          progress
        ),
    };
  }