import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios, { AxiosError } from "axios";
import api from "@/lib/api";
import { useAppDispatch } from "@/app/hooks";
import { setCredentials, type User } from "@/features/auth/authSlice";

type AuthResponse = { user: User; accessToken: string };
type ErrorBody = { message?: string; error?: string };

function getErr(err: unknown, fallback = "Error al registrarse"): string {
  if (axios.isAxiosError(err)) {
    const ax = err as AxiosError<ErrorBody>;
    const body = ax.response?.data;
    const msg = body?.message ?? body?.error ?? ax.message;
    return msg || fallback;
  }
  return fallback;
}

function isAuthResponse(data: unknown): data is AuthResponse {
  return (
    typeof data === "object" &&
    data !== null &&
    "accessToken" in data &&
    "user" in data
  );
}

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  async function onSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      const reg = await api.post<AuthResponse | Record<string, unknown>>(
        "/auth/register",
        { email, username, password }
      );

      if (isAuthResponse(reg.data)) {
        const data = reg.data;
        dispatch(setCredentials({ user: data.user, accessToken: data.accessToken }));
      } else {
        const { data } = await api.post<AuthResponse>("/auth/login", { email, password });
        dispatch(setCredentials({ user: data.user, accessToken: data.accessToken }));
      }

      navigate("/home", { replace: true });
    } catch (e) {
      setErr(getErr(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      style={{ display: "grid", gap: 8, maxWidth: 380, margin: "24px auto" }}
    >
      <h2>Crear cuenta</h2>

      <label>Email</label>
      <input
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        type="email"
        required
      />

      <label>Usuario</label>
      <input
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        required
      />

      <label>Contraseña</label>
      <input
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        type="password"
        required
      />

      {err && <p style={{ color: "tomato" }}>{err}</p>}

      <button type="submit" disabled={loading}>
        {loading ? "Creando…" : "Registrarme"}
      </button>

      <p style={{ marginTop: 8 }}>
        ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
      </p>
    </form>
  );
}
