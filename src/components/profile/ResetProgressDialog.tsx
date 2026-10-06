type ResetProgressDialogProps = {
    onCancel: () => void;
    onConfirm: () => void;
  };
  
  function ResetProgressDialog({
    onCancel,
    onConfirm,
  }: ResetProgressDialogProps) {
    return (
      <div
        className="reset-dialog-backdrop"
        role="presentation"
      >
        <div
          className="reset-dialog"
          role="dialog"
          aria-modal="true"
          aria-labelledby="reset-progress-title"
          aria-describedby="reset-progress-description"
        >
          <h2 id="reset-progress-title">
            Reset Progress?
          </h2>
  
          <p id="reset-progress-description">
            This will permanently delete your
            saved rating, statistics, and game
            history on this device.
          </p>
  
          <p>
            This cannot be undone.
          </p>
  
          <div className="reset-dialog-actions">
            <button
              type="button"
              onClick={onCancel}
            >
              Cancel
            </button>
  
            <button
              type="button"
              className="reset-confirm-button"
              onClick={onConfirm}
            >
              Reset Progress
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  export default ResetProgressDialog;