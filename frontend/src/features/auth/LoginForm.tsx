import { useState, type FormEvent } from "react";
import { login, register } from "../../api/auth";
import { friendlyAuthError } from "./authErrors";

type AuthMode = "signin" | "signup";

const inputClassName =
  "rounded-lg border border-zinc-200 bg-white px-2.5 py-2 text-base text-zinc-900 outline-offset-1 focus:outline-2 focus:outline-violet-500/50 disabled:opacity-65 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100";

type LoginFormProps = {
  /** Called after a successful sign-in or sign-up+sign-in (session cookie set). */
  onAuthenticated: () => Promise<void>;
};

export function LoginForm({ onAuthenticated }: LoginFormProps) {
  const [mode, setMode] = useState<AuthMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (mode === "signup") {
        await register(email, password);
        await login(email, password);
      } else {
        await login(email, password);
      }
      await onAuthenticated();
    } catch (err) {
      setError(friendlyAuthError(err));
    } finally {
      setSubmitting(false);
    }
  }

  function switchMode(next: AuthMode) {
    setMode(next);
    setError(null);
  }

  return (
    <div className="w-full max-w-[22rem] rounded-xl border border-zinc-200 bg-white p-7 shadow-lg shadow-black/10 dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-black/40">
      <h1 className="mb-1.5 mt-0 text-2xl font-medium tracking-tight text-zinc-900 dark:text-zinc-100">
        {mode === "signin" ? "Sign in" : "Create account"}
      </h1>
      <p className="mb-5 mt-0 text-[0.95rem] text-zinc-600 dark:text-zinc-400">
        {mode === "signin" ? "Welcome back." : "Create your account to continue."}
      </p>

      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <label className="flex flex-col gap-1.5 text-[0.9rem] font-normal text-zinc-900 dark:text-zinc-100">
          Email
          <input
            className={inputClassName}
            type="email"
            autoComplete="email"
            value={email}
            onChange={(ev) => setEmail(ev.target.value)}
            required
            disabled={submitting}
          />
        </label>
        <label className="flex flex-col gap-1.5 text-[0.9rem] font-normal text-zinc-900 dark:text-zinc-100">
          Password
          <input
            className={inputClassName}
            type="password"
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
            value={password}
            onChange={(ev) => setPassword(ev.target.value)}
            required
            minLength={8}
            maxLength={72}
            disabled={submitting}
          />
        </label>

        {error ? (
          <p className="m-0 text-[0.9rem] text-orange-700 dark:text-orange-400">{error}</p>
        ) : null}

        <button
          type="submit"
          className="mt-1 cursor-pointer rounded-full border border-violet-400/50 bg-violet-500/10 px-3.5 py-2.5 text-base font-normal text-zinc-900 hover:brightness-105 disabled:cursor-default disabled:opacity-65 dark:border-violet-400/50 dark:text-zinc-100"
          disabled={submitting}
        >
          {submitting ? "Please wait…" : mode === "signin" ? "Sign in" : "Sign up"}
        </button>
      </form>

      <p className="mt-5 mb-0 text-[0.9rem] text-zinc-600 dark:text-zinc-400">
        {mode === "signin" ? (
          <>
            No account?{" "}
            <button
              type="button"
              className="cursor-pointer border-0 bg-transparent p-0 text-violet-600 underline disabled:cursor-default disabled:opacity-65 dark:text-violet-400"
              onClick={() => switchMode("signup")}
              disabled={submitting}
            >
              Sign up
            </button>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <button
              type="button"
              className="cursor-pointer border-0 bg-transparent p-0 text-violet-600 underline disabled:cursor-default disabled:opacity-65 dark:text-violet-400"
              onClick={() => switchMode("signin")}
              disabled={submitting}
            >
              Sign in
            </button>
          </>
        )}
      </p>
    </div>
  );
}
