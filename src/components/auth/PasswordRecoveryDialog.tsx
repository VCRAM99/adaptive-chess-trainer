
import { useState, type SubmitEvent } from "react";
import Dialog from "../ui/Dialog";
import { updatePassword } from "../../lib/supabase/auth";

type PasswordRecoveryDialogProps = {
  open: boolean;
  onClose: () => void;
};

export default function PasswordRecoveryDialog({
  open,
  onClose,
}: PasswordRecoveryDialogProps) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");
  const [isSubmitting, setIsSubmitting] =
    useState(false);
  const [errorMessage, setErrorMessage] =
    useState("");

  async function handleSubmit(
    event: SubmitEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    setErrorMessage("");

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await updatePassword(password);

      if (error) {
        throw error;
      }

      setPassword("");
      setConfirmPassword("");
      onClose();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to update password."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog
      open={open}
      title="Set New Password"
      description="Choose a new password for your account."
      dismissible={!isSubmitting}
      onClose={onClose}
    >
      <form
        className="auth-form"
        onSubmit={handleSubmit}
      >
        <label className="auth-field">
          <span>New Password</span>
          <input
            type="password"
            autoComplete="new-password"
            minLength={6}
            required
            value={password}
            onChange={(event) =>
              setPassword(event.target.value)
            }
          />
        </label>

        <label className="auth-field">
          <span>Confirm New Password</span>
          <input
            type="password"
            autoComplete="new-password"
            minLength={6}
            required
            value={confirmPassword}
            onChange={(event) =>
              setConfirmPassword(event.target.value)
            }
          />
        </label>

        {errorMessage && (
          <p className="auth-error" role="alert">
            {errorMessage}
          </p>
        )}

        <button
          type="submit"
          className="auth-submit-button"
          disabled={isSubmitting}
        >
          {isSubmitting
            ? "Updating..."
            : "Update Password"}
        </button>
      </form>
    </Dialog>
  );
}
