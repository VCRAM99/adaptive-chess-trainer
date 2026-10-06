import type {
    DifficultyFilter as DifficultyFilterValue,
  } from "../../lib/profile/statistics";
  
  type DifficultyFilterProps = {
    value: DifficultyFilterValue;
  
    onChange: (
      value: DifficultyFilterValue
    ) => void;
  };
  
  const DIFFICULTIES = [
    "easy",
    "medium",
    "hard",
  ] as const;
  
  function DifficultyFilter({
    value,
    onChange,
  }: DifficultyFilterProps) {
    function toggleDifficulty(
      difficulty:
        (typeof DIFFICULTIES)[number]
    ) {
      const selectedCount =
        Object.values(value).filter(
          Boolean
        ).length;
  
      // Always keep at least one
      // difficulty selected.
      if (
        value[difficulty] &&
        selectedCount === 1
      ) {
        return;
      }
  
      onChange({
        ...value,
        [difficulty]:
          !value[difficulty],
      });
    }
  
    return (
      <div className="difficulty-filter">
        <span className="difficulty-filter-label">
          Games Included
        </span>
  
        <div className="difficulty-filter-options">
          {DIFFICULTIES.map(
            (difficulty) => (
              <label
                key={difficulty}
                className="difficulty-filter-option"
              >
                <input
                  type="checkbox"
                  checked={
                    value[difficulty]
                  }
                  onChange={() =>
                    toggleDifficulty(
                      difficulty
                    )
                  }
                />
  
                <span>
                  {difficulty
                    .charAt(0)
                    .toUpperCase() +
                    difficulty.slice(1)}
                </span>
              </label>
            )
          )}
        </div>
      </div>
    );
  }
  
  export default DifficultyFilter;