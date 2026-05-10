import { ApiError } from "../../api/http";

/**
 * Maps API / network failures to safe user-visible copy.
 */
export function friendlyAuthError(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.status === 400) return err.message || "Check your email and password.";
    if (err.status === 401) return "Invalid email or password.";
    if (err.status === 409) return "That email is already registered.";
    return "Something went wrong. Try again.";
  }
  if (err instanceof TypeError) {
    return "Could not reach the server. Check your connection.";
  }
  return "Something went wrong. Try again.";
}
