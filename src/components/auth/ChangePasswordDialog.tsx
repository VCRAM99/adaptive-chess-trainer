
import {
    useCallback,
    useState,
    type SubmitEvent,
  } from "react";
  
  import Dialog from "../ui/Dialog";
  import {
    updatePassword,
    verifyCurrentPassword,
  } from "../../lib/supabase/auth";
  
  type ChangePasswordDialogProps = {
    open: boolean;
    email: string;
    onClose: () => void;
  };
  
  export default function ChangePasswordDialog({
    open,
    email,
    onClose,
  }: ChangePasswordDialogProps) {
    const [currentPassword, setCurrentPassword] =
      useState("");
    const [newPassword, setNewPassword] =
      useState("");
    const [confirmPassword, setConfirmPassword] =
      useState("");
    const [isSubmitting, setIsSubmitting] =
      useState(false);
    const [errorMessage, setErrorMessage] =
      useState("");
    const [successMessage, setSuccessMessage] =
      useState("");
  
      const handleClose = useCallback(() => {
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setErrorMessage("");
        setSuccessMessage("");
        onClose();
      }, [onClose]);
  
    async function handleSubmit(
      event: SubmitEvent<HTMLFormElement>
    ) {
      event.preventDefault();
  
      if (isSubmitting) {
        return;
      }
  
      setErrorMessage("");
      setSuccessMessage("");
  
      if (newPassword !== confirmPassword) {
        setErrorMessage("New passwords do not match.");
        return;
      }
  
      if (newPassword === currentPassword) {
        setErrorMessage(
          "Choose a password different from your current password."
        );
        return;
      }
  
      setIsSubmitting(true);
  
      try {
        const { error: verificationError } =
          await verifyCurrentPassword(
            email,
            currentPassword
          );
  
        if (verificationError) {
          throw new Error(
            "Current password is incorrect."
          );
        }
  
        const { error: updateError } =
          await updatePassword(newPassword);
  
        if (updateError) {
          throw updateError;
        }
  
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
  
        setSuccessMessage(
          "Your password has been updated successfully."
        );
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Unable to change password."
        );
      } finally {
        setIsSubmitting(false);
      }
    }
  
    return (
      <Dialog
        open={open}
        title="Change Password"
        description="Update the password for your account."
        dismissible={!isSubmitting}
        onClose={handleClose}
      >
        <form
          className="auth-form"
          onSubmit={handleSubmit}
        >
          {!successMessage ? (
            <>
              <label className="auth-field">
                <span>Current Password</span>
                <input
                  type="password"
                  autoComplete="current-password"
                  required
                  value={currentPassword}
                  onChange={(event) =>
                    setCurrentPassword(event.target.value)
                  }
                />
              </label>
  
              <label className="auth-field">
                <span>New Password</span>
                <input
                  type="password"
                  autoComplete="new-password"
                  minLength={6}
                  required
                  value={newPassword}
                  onChange={(event) =>
                    setNewPassword(event.target.value)
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
                  : "Change Password"}
              </button>
            </>
          ) : (
            <>
              <p
                className="auth-message"
                role="status"
              >
                {successMessage}
              </p>
  
              <button
                type="button"
                className="auth-submit-button"
                onClick={handleClose}
              >
                Done
              </button>
            </>
          )}
        </form>
      </Dialog>
    );
  }
  