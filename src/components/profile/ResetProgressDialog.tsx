import Dialog from "../ui/Dialog";

type ResetProgressDialogProps = {
  onCancel: () => void;
  onConfirm: () => void;
};

function ResetProgressDialog({
  onCancel,
  onConfirm,
}: ResetProgressDialogProps) {
  return (
    <Dialog
      open={true}
      title="Reset Progress?"
      description="This will permanently delete your saved rating, statistics, and game history on this device."
      onClose={onCancel}
    >
      <div className="reset-dialog-content">
        <p className="reset-dialog-warning">
          This action cannot be undone.
        </p>

        <div className="reset-dialog-actions">
          <button
            type="button"
            className="reset-cancel-button"
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
    </Dialog>
  );
}

export default ResetProgressDialog;