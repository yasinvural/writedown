import { useNavigate } from "react-router-dom";
import { logout } from "../api/auth";
import { useAuth } from "../auth/useAuth";
import { MainHeader } from "../features/app/MainHeader";
import { MainWorkspacePlaceholder } from "../features/app/MainWorkspacePlaceholder";

export function MainPage() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();

  async function handleSignOut() {
    try {
      await logout();
    } catch {
      // Still clear local auth view if cookie clear failed on server.
    }
    setUser(null);
    navigate("/login", { replace: true });
  }

  return (
    <div className="flex flex-1 flex-col px-5 py-6 pb-8 text-left">
      <MainHeader email={user?.email ?? "—"} onSignOut={handleSignOut} />
      <MainWorkspacePlaceholder />
    </div>
  );
}
