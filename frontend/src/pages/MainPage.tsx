import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import { MainHeader } from "../features/app/MainHeader";
import { MainDocumentWorkspace } from "../features/documents/MainDocumentWorkspace";
import { useLogoutMutation } from "../queries/authQueries";

export function MainPage() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const logoutMut = useLogoutMutation();

  function handleSignOut() {
    logoutMut.mutate(undefined, {
      onSettled: () => {
        setUser(null);
        navigate("/login", { replace: true });
      },
    });
  }

  return (
    <div className="flex h-svh flex-col text-left">
      <div className="px-5 py-4">
        <MainHeader email={user?.email ?? "—"} onSignOut={handleSignOut} />
      </div>
      <div className="flex min-h-0 flex-1 border-t border-zinc-200 dark:border-zinc-800">
        <MainDocumentWorkspace />
      </div>
    </div>
  );
}
