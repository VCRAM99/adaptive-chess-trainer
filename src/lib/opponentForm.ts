export const MIN_OPPONENT_FORM = -50;
export const MAX_OPPONENT_FORM = 50;

export const OPPONENT_FORM_STEP = 10;
export const OPPONENT_FORM_REVERSION = 0.05;

export const MAX_OPPONENT_FORM_CPL_ADJUSTMENT = 20;

export function getOpponentFormCplAdjustment(
  form: number
): number {
  const clampedForm =
    clampOpponentForm(form);

  if (clampedForm === 0) {
    return 0;
  }

  return (
    -clampedForm /
    MAX_OPPONENT_FORM
  ) * MAX_OPPONENT_FORM_CPL_ADJUSTMENT;
}

export function clampOpponentForm(
  form: number
): number {
  return Math.max(
    MIN_OPPONENT_FORM,
    Math.min(
      MAX_OPPONENT_FORM,
      form
    )
  );
}

export function updateOpponentForm(
  currentForm: number,
  randomValue = Math.random()
): number {
  const normalizedRandom =
    Math.max(
      0,
      Math.min(1, randomValue)
    );

  const randomChange =
    (
      normalizedRandom * 2 - 1
    ) * OPPONENT_FORM_STEP;

  const meanReversion =
    -currentForm *
    OPPONENT_FORM_REVERSION;

  return clampOpponentForm(
    currentForm +
      meanReversion +
      randomChange
  );
}
