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
    { id: "easy", label: "Casual" },
    { id: "medium", label: "Echo" },
    { id: "hard", label: "Train" },
  ] as const;
  
  function DifficultyFilter({
    value,
    onChange,
  }: DifficultyFilterProps) {
    function toggleDifficulty(
      difficulty: (typeof DIFFICULTIES)[number]["id"]
    ) {
      const selectedCount =
        Object.values(value).filter(Boolean).length;
  
      if (value[difficulty] && selectedCount === 1) {
        return;
      }
  
      onChange({
        ...value,
        [difficulty]: !value[difficulty],
      });
    }
  
    return (
      <div className="difficulty-filter">
        <div className="difficulty-filter-heading">
          <span className="difficulty-filter-label">
            Games Included
          </span>
  
          <span className="difficulty-filter-description">
            Select which modes count toward your statistics
          </span>
        </div>
  
        <div
          className="difficulty-filter-options"
          role="group"
          aria-label="Games included in statistics"
        >
          {DIFFICULTIES.map((difficulty) => {
            const isSelected = value[difficulty.id];
  
            return (
              <button
                key={difficulty.id}
                type="button"
                className={
                  isSelected
                    ? "difficulty-filter-option difficulty-filter-option--selected"
                    : "difficulty-filter-option"
                }
                aria-pressed={isSelected}
                onClick={() =>
                  toggleDifficulty(difficulty.id)
                }
              >
                {difficulty.label}
              </button>
            );
          })}
        </div>
      </div>
    );
  }
  
  export default DifficultyFilter;
  