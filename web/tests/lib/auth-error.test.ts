import { describe, test, expect } from "bun:test";
import { FirebaseError } from "firebase/app";
import { authErrorMessage } from "@/lib/auth-error";

describe("authErrorMessage", () => {
  test.each([
    ["auth/invalid-credential", "Invalid email or password."],
    ["auth/wrong-password", "Invalid email or password."],
    ["auth/too-many-requests", "Too many attempts. Please try again later."],
    ["auth/email-already-in-use", "An account with this email already exists."],
    ["auth/popup-closed-by-user", "The sign-in window was closed before finishing."],
    ["auth/cancelled-popup-request", "The sign-in window was closed before finishing."],
    [
      "auth/account-exists-with-different-credential",
      "This email already signed in another way. Use that method instead.",
    ],
    [
      "auth/network-request-failed",
      "We can't reach the sign-in service. Check your connection and try again.",
    ],
    ["auth/something-new", "Something went wrong. Please try again."],
  ])("maps %s to a plain sentence", (code, expected) => {
    expect(authErrorMessage(new FirebaseError(code, "firebase internals"))).toBe(expected);
  });

  test("anything that is not a Firebase error gets the generic sentence", () => {
    expect(authErrorMessage(new Error("auth/popup-closed-by-user"))).toBe(
      "Something went wrong. Please try again.",
    );
  });
});
