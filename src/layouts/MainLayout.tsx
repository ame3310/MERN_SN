import { Link, Outlet, useNavigate, useLocation } from "react-router-dom";
import "@/layouts/MainLayout.styles.scss";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { clearCredentials } from "@/features/auth/authSlice";
import AuthBootstrap from "@/routes/AuthBootstrap";
import api from "@/lib/api";
import SearchBar from "@/components/common/SearchBar";

export default function MainLayout() {
  const user = useAppSelector((s) => s.auth.user);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const searchBarKey = location.pathname.startsWith("/search")
    ? `search-${location.search}`
    : "reset";
  async function logout() {
    try {
      await api.post("/auth/logout");
    } catch {}
    dispatch(clearCredentials());
    navigate("/login", { replace: true });
  }

  return (
    <>
      <AuthBootstrap />
      <header className="header">
        <div className="container header__inner" style={{ gap: 16 }}>
          <Link to="/home" className="logo">
            RRSS
          </Link>

          <div className="header__search" style={{ flex: 1, maxWidth: 520 }}>
            <SearchBar key={searchBarKey} />
          </div>

          <nav className="nav" style={{ display: "flex", gap: 12 }}>
            <Link to="/home">Home</Link>

            {user ? (
              <>
                <Link to="/posts/new">Nuevo post</Link>
                <Link to="/profile">Perfil</Link>
                <button
                  onClick={logout}
                  style={{ all: "unset", cursor: "pointer", opacity: 0.9 }}>
                  Salir
                </button>
              </>
            ) : (
              <>
                <Link to="/login">Login</Link>
                <Link to="/register">Register</Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="container">
        <Outlet />
      </main>

      <footer
        style={{
          borderTop: "1px solid #2a2f3a",
          marginTop: 24,
          padding: "18px 0",
          color: "#cbd5e1",
        }}>
        <div
          style={{
            maxWidth: 980,
            margin: "0 auto",
            padding: "0 16px",
            display: "flex",
            gap: 12,
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
          }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span
              style={{
                width: 22,
                height: 22,
                borderRadius: 6,
                background:
                  "linear-gradient(135deg, rgba(124,58,237,.9), rgba(6,182,212,.9))",
                display: "inline-block",
              }}
            />
            <strong>RRSS</strong>
          </div>
        </div>
      </footer>
    </>
  );
}
