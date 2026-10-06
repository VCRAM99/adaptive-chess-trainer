type ColorSelectionDialogProps = {
    onSelect: (
      color: "white" | "black"
    ) => void;
    onCancel?: () => void;
  };
  
  function ColorSelectionDialog({
    onSelect,
    onCancel,
  }: ColorSelectionDialogProps) {
    return (
      <div
        className="promotion-overlay"
        role="dialog"
        aria-modal="true"
        aria-labelledby="color-dialog-title"
      >
        <div className="promotion-dialog">
          <h2 id="color-dialog-title">
            Choose Your Side
          </h2>
  
          <div className="promotion-options">
            <button
              type="button"
              onClick={() =>
                onSelect("white")
              }
            >
              White
            </button>
  
            <button
              type="button"
              onClick={() =>
                onSelect("black")
              }
            >
              Black
            </button>
          </div>
  
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    );
  }
  
  export default ColorSelectionDialog;