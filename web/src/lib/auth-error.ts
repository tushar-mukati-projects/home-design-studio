import { FirebaseError } from "firebase/app";

export const MIN_PASSWORD_LENGTH = 8;

const INVALID_CREDENTIALS = "Invalid email or password.";
const POPUP_CLOSED = "The sign-in window was closed before finishing.";

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  "auth/invalid-credential": INVALID_CREDENTIALS,
  "auth/user-not-found": INVALID_CREDENTIALS,
  "auth/wrong-password": INVALID_CREDENTIALS,
  "auth/too-many-requests": "Too many attempts. Please try again later.",
  "auth/email-already-in-use": "An account with this email already exists.",
  "auth/weak-password": `Password is too weak. Please use at least ${MIN_PASSWORD_LENGTH} characters.`,
  "auth/invalid-email": "Please enter a valid email address.",
  "auth/popup-closed-by-user": POPUP_CLOSED,
  "auth/cancelled-popup-request": POPUP_CLOSED,
  "auth/popup-blocked": "Your browser blocked the sign-in window. Allow pop-ups and try again.",
  "auth/account-exists-with-different-credential":
    "This email already signed in another way. Use that method instead.",
  "auth/network-request-failed":
    "We can't reach the sign-in service. Check your connection and try again.",
};

const DEFAULT_AUTH_ERROR = "Something went wrong. Please try again.";

export const authErrorMessage = (error: unknown): string =>
  error instanceof FirebaseError
    ? (AUTH_ERROR_MESSAGES[error.code] ?? DEFAULT_AUTH_ERROR)
    : DEFAULT_AUTH_ERROR;
