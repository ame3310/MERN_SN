import { useState } from "react";
import { useNavigate, useLocation, type Location } from "react-router-dom";
import axios, { AxiosError } from "axios";
import api from "@/lib/api";
import { useAppDispatch } from "@/app/hooks";
import { setCredentials } from "@/features/auth/authSlice";
import type { AuthRedirectState } from "@/routes/RequireAuth";
import "@/styles/LoginPage.scss";

type LoginResponse = {
  user: {
    id: string;
    username: string;
    email: string;
    role: "user" | "admin";
    avatarUrl?: string | null;
  };
  accessToken: string;
};

function getErrorMessage(err: unknown, fallback = "Error al iniciar sesión") {
  if (axios.isAxiosError(err)) {
    const ax = err as AxiosError<{ message?: string }>;
    return ax.response?.data?.message ?? ax.message ?? fallback;
  }
  return fallback;
}

export default function LoginPage() {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const loc = useLocation() as Location & { state?: AuthRedirectState };
  const from = loc.state?.from?.pathname ?? "/home";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      const { data } = await api.post<LoginResponse>("/auth/login", {
        email,
        password,
      });
      dispatch(setCredentials({ user: data.user, accessToken: data.accessToken }));
      navigate(from, { replace: true });
    } catch (e) {
      setErr(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  const canSubmit = email.trim() !== "" && password.trim() !== "" && !loading;

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={onSubmit}>
        <div className="login-head">
          <div className="logo" />
          <h1>Entrar</h1>
          <p>Accede con tu email</p>
        </div>

        <div className="field">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="tucorreo@ejemplo.com"
            value={email}
            onChange={(ev) => setEmail(ev.target.value)}
            required
          />
        </div>

        <div className="field">
          <label htmlFor="password">Contraseña</label>
          <div className="password-row">
            <input
              id="password"
              name="password"
              type={showPwd ? "text" : "password"}
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(ev) => setPassword(ev.target.value)}
              required
            />
            <button
              type="button"
              className="btn-ghost"
              onClick={() => setShowPwd((v) => !v)}
              aria-label={showPwd ? "Ocultar contraseña" : "Mostrar contraseña"}
            >
              {showPwd ? "Ocultar" : "Ver"}
            </button>
          </div>
        </div>

        {err && <p className="error">{err}</p>}

        <button className="btn-primary" type="submit" disabled={!canSubmit}>
          {loading ? "Entrando…" : "Entrar"}
        </button>

        <p className="muted">
          ¿No tienes cuenta? <a href="/register">Regístrate</a>
        </p>
      </form>
    </div>
  );
}
