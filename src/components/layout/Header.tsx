import { Link, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { clearCredentials } from "@/features/auth/authSlice";
import api from "@/lib/api";

export default function Header() {
  const user = useAppSelector((s) => s.auth.user);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  async function logout() {
    try { await api.post("/auth/logout"); } catch {}
    dispatch(clearCredentials());
    navigate("/login", { replace: true });
  }

  return (
    <header className="header">
      <div className="container header__inner">
        <Link className="logo" to="/home">RRSS</Link>

        <nav className="nav">
          <Link to="/home">Home</Link>
          {user && <Link to="/posts/new">Nuevo post</Link>}
          {user ? (
            <>
              <Link to="/profile">Perfil</Link>
              <button onClick={logout} style={{ all: "unset", cursor: "pointer", opacity: .9 }}>Salir</button>
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
  );
}
