// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from "vitest";

const signUp = vi.hoisted(() => vi.fn());
const resetPasswordForEmail = vi.hoisted(() => vi.fn());
const signInWithOAuth = vi.hoisted(() => vi.fn());

vi.mock("./client", () => ({
  supabase: {
    auth: {
      signUp,
      resetPasswordForEmail,
      signInWithOAuth,
    },
  },
}));

import { appRedirectUrl } from "../basePath";
import { sendPasswordResetEmail, signInWithGoogle, signUpWithEmail } from "./auth";

describe("authentication return URLs", () => {
  beforeEach(() => {
    signUp.mockReset();
    resetPasswordForEmail.mockReset();
    signInWithOAuth.mockReset();
    signUp.mockResolvedValue({ data: {}, error: null });
    resetPasswordForEmail.mockResolvedValue({ data: {}, error: null });
    signInWithOAuth.mockResolvedValue({ data: { url: "https://accounts.example" }, error: null });
  });

  it("sends email confirmation back to the app base path", async () => {
    await signUpWithEmail("Ada", "ada@example.com", "password");

    expect(signUp).toHaveBeenCalledWith({
      email: "ada@example.com",
      password: "password",
      options: {
        emailRedirectTo: appRedirectUrl(),
        data: {
          display_name: "Ada",
        },
      },
    });
  });

  it("sends password recovery back to the app base path", async () => {
    await sendPasswordResetEmail("ada@example.com");

    expect(resetPasswordForEmail).toHaveBeenCalledWith("ada@example.com", {
      redirectTo: appRedirectUrl(),
    });
  });

  it("sends Google sign-in back to the app base path", async () => {
    await signInWithGoogle();

    expect(signInWithOAuth).toHaveBeenCalledWith({
      provider: "google",
      options: {
        redirectTo: appRedirectUrl(),
      },
    });
  });
});
