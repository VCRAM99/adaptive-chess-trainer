import Dialog from "./ui/Dialog";

type ConfirmActionDialogProps = {
  title: string;
  description: string;
  warning: string;
  confirmLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
};

export default function ConfirmActionDialog({
  title,
  description,
  warning,
  confirmLabel,
  onCancel,
  onConfirm,
}: ConfirmActionDialogProps) {
  return (
    <Dialog
      open={true}
      title={title}
      description={description}
      onClose={onCancel}
    >
      <div className="reset-dialog-content">
        <p className="reset-dialog-warning">{warning}</p>
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
            {confirmLabel}
          </button>
        </div>
      </div>
    </Dialog>
  );
}
