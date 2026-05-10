import { Navigate } from "react-router-dom";
import { LoginForm } from "../features/auth/LoginForm";
import { useAuth } from "../auth/useAuth";

export function LoginPage() {
  const { user, loading, refresh } = useAuth();

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center px-4 py-8 text-left">
        <p className="m-0 text-zinc-600 dark:text-zinc-400">Loading…</p>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-8 text-left">
      <LoginForm onAuthenticated={refresh} />
    </div>
  );
}
