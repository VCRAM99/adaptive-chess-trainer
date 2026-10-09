import { useCallback, useState, type SubmitEvent } from "react";
import Dialog from "../ui/Dialog";
import GoogleIcon from "./GoogleIcon";

import {
  signInWithEmail,
  signUpWithEmail,
  sendPasswordResetEmail,
  signInWithGoogle,
} from "../../lib/supabase/auth";

type AuthView = "signin" | "signup" | "forgot";

type AuthDialogProps = {
  open: boolean;
  onClose: () => void;
};

export default function AuthDialog({ open, onClose }: AuthDialogProps) {
  const [view, setView] = useState<AuthView>("signin");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authError, setAuthError] = useState("");
  const [authMessage, setAuthMessage] = useState("");

  const title =
    view === "signin" ? "Sign In" : view === "signup" ? "Create Account" : "Reset Password";

  async function handleGoogleSignIn() {
    setAuthError("");

    try {
      const { error } = await signInWithGoogle();

      if (error) {
        throw error;
      }
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "Unable to sign in with Google.");
    }
  }

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting) return;

    setIsSubmitting(true);
    setAuthError("");
    setAuthMessage("");

    try {
      if (view === "forgot") {
        const { error } = await sendPasswordResetEmail(email.trim());

        if (error) {
          throw error;
        }

        setAuthMessage(
          "If an account exists for this email, you'll receive a password reset link.",
        );
      } else if (view === "signup") {
        const { data, error } = await signUpWithEmail(displayName.trim(), email.trim(), password);

        if (error) {
          throw error;
        }

        if (data.session) {
          handleClose();
        } else {
          setAuthMessage("Account request received. Check your email for a confirmation link.");
        }
      } else {
        const { error } = await signInWithEmail(email.trim(), password);

        if (error) {
          throw error;
        }

        handleClose();
      }
    } catch (error) {
      setAuthError(
        error instanceof Error ? error.message : "Authentication failed. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleClose = useCallback(() => {
    setView("signin");
    setDisplayName("");
    setEmail("");
    setPassword("");
    onClose();
  }, [onClose]);

  return (
    <Dialog
      open={open}
      title={title}
      description={
        view === "forgot"
          ? "Enter your email to receive a password reset link."
          : "Save your chess progress to your account."
      }
      onClose={handleClose}
    >
      <form className="auth-form" onSubmit={handleSubmit}>
        {view === "signup" && (
          <label className="auth-field">
            <span>Display Name</span>
            <input
              type="text"
              autoComplete="nickname"
              required
              maxLength={50}
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
            />
          </label>
        )}

        <label className="auth-field">
          <span>Email</span>
          <input
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>

        {view !== "forgot" && (
          <label className="auth-field">
            <span>Password</span>
            <input
              type="password"
              autoComplete={view === "signup" ? "new-password" : "current-password"}
              required
              minLength={6}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>
        )}

        {view === "signin" && (
          <button type="button" className="auth-text-button" onClick={() => setView("forgot")}>
            Forgot password?
          </button>
        )}

        {authError && (
          <p className="auth-error" role="alert">
            {authError}
          </p>
        )}

        {authMessage && (
          <p className="auth-message" role="status">
            {authMessage}
          </p>
        )}

        <button type="submit" className="auth-submit-button" disabled={isSubmitting}>
          {isSubmitting
            ? "Please wait..."
            : view === "signin"
              ? "Sign In"
              : view === "signup"
                ? "Create Account"
                : "Send Reset Email"}
        </button>

        {view !== "forgot" && (
          <>
            <div className="auth-divider">
              <span>OR</span>
            </div>

            <button type="button" className="auth-google-button" onClick={handleGoogleSignIn}>
              <GoogleIcon />
              <span>Continue with Google</span>
            </button>
          </>
        )}

        <div className="auth-footer">
          {view === "signin" && (
            <>
              <span>Don't have an account?</span>
              <button type="button" className="auth-text-button" onClick={() => setView("signup")}>
                Create Account
              </button>
            </>
          )}

          {view === "signup" && (
            <>
              <span>Already have an account?</span>
              <button type="button" className="auth-text-button" onClick={() => setView("signin")}>
                Sign In
              </button>
            </>
          )}

          {view === "forgot" && (
            <button type="button" className="auth-text-button" onClick={() => setView("signin")}>
              Back to Sign In
            </button>
          )}
        </div>
      </form>
    </Dialog>
  );
}
