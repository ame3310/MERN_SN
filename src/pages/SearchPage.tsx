import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  searchAll,
  searchUsers as fetchUsers,
  searchPosts as fetchPosts,
  type SearchType,
} from "@/services/search";
import type { PublicUserForSearch, PublicPost } from "@/types/search";
import axios, { AxiosError } from "axios";

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

function getErr(err: unknown, fallback = "Error buscando") {
  if (axios.isAxiosError(err)) {
    const ax = err as AxiosError<{ message?: string; error?: string }>;
    return ax.response?.data?.message ?? ax.response?.data?.error ?? ax.message ?? fallback;
  }
  return fallback;
}

export default function SearchPage() {
  const qParams = useQuery();
  const navigate = useNavigate();

  const [users, setUsers] = useState<PublicUserForSearch[] | null>(null);
  const [posts, setPosts] = useState<PublicPost[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const q = (qParams.get("q") ?? "").trim();
  const type = (qParams.get("type") ?? "all") as SearchType;
  const page = Number(qParams.get("page") ?? 1);
  const limit = Number(qParams.get("limit") ?? 20);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setLoading(true);
      setErr(null);
      setUsers(null);
      setPosts(null);
      try {
        if (!q) return;
        if (type === "all") {
          const r = await searchAll({ q, page, limit, type: "all" });
          if (!cancelled) {
            setUsers(r.users?.data ?? []);
            setPosts(r.posts?.data ?? []);
          }
        } else if (type === "users") {
          const r = await fetchUsers({ q, page, limit });
          if (!cancelled) setUsers(r.data);
        } else {
          const r = await fetchPosts({ q, page, limit });
          if (!cancelled) setPosts(r.data);
        }
      } catch (e: unknown) {
        if (!cancelled) setErr(getErr(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [q, type, page, limit]);

  function changeType(next: SearchType) {
    const p = new URLSearchParams(qParams);
    p.set("type", next);
    p.set("page", "1");
    navigate(`/search?${p.toString()}`, { replace: true });
  }

  return (
    <section>
      <h1>Buscar</h1>

      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        {(["all", "users", "posts"] as const).map((t) => (
          <button
            key={t}
            onClick={() => changeType(t)}
            style={{
              padding: "4px 10px",
              borderRadius: 8,
              border: "1px solid #666",
              opacity: type === t ? 1 : 0.7,
            }}
          >
            {t === "all" ? "Todo" : t === "users" ? "Usuarios" : "Posts"}
          </button>
        ))}
      </div>

      {loading && <p>Cargando…</p>}
      {err && <p style={{ color: "tomato" }}>{err}</p>}
      {!loading && !err && !q && <p>Escribe algo para buscar.</p>}

      {type !== "posts" && users && (
        <>
          <h2>Usuarios</h2>
          {users.length === 0 ? (
            <p>Sin usuarios.</p>
          ) : (
            <ul
              style={{
                display: "grid",
                gap: 8,
                listStyle: "none",
                padding: 0,
              }}
            >
              {users.map((u) => (
                <li key={u.id}>
                  <Link
                    to={`/profile/${u.id}`}
                    style={{
                      display: "flex",
                      gap: 8,
                      alignItems: "center",
                      textDecoration: "none",
                      color: "inherit",
                      padding: "6px 0",
                    }}
                  >
                    {u.avatarUrl ? (
                      <img
                        src={u.avatarUrl}
                        width={28}
                        height={28}
                        style={{ borderRadius: "50%", objectFit: "cover" }}
                        alt={u.username}
                      />
                    ) : (
                      <div
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: "50%",
                          background: "#333",
                        }}
                      />
                    )}
                    <strong>@{u.username}</strong>
                    {u.bio && <span style={{ opacity: 0.7 }}>— {u.bio}</span>}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      {type !== "users" && posts && (
        <>
          <h2>Posts</h2>
          {posts.length === 0 ? (
            <p>Sin posts.</p>
          ) : (
            <ul
              style={{
                display: "grid",
                gap: 12,
                listStyle: "none",
                padding: 0,
              }}
            >
              {posts.map((p) => (
                <li key={p.id} style={{ borderTop: "1px solid #333", paddingTop: 8 }}>
                  <div style={{ opacity: 0.8, fontSize: 12, marginBottom: 6 }}>
                    {p.author?.username ? `@${p.author.username}` : "Anónimo"} ·{" "}
                    {p.createdAt ? new Date(p.createdAt).toLocaleString() : ""}
                  </div>

                  <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                    {p.images?.[0] ? (
                      <img
                        src={p.images[0]}
                        alt=""
                        width={96}
                        height={96}
                        style={{ borderRadius: 8, objectFit: "cover" }}
                      />
                    ) : (
                      <div
                        style={{
                          width: 96,
                          height: 96,
                          borderRadius: 8,
                          background: "#2a2a2a",
                        }}
                      />
                    )}

                    <div style={{ flex: 1 }}>
                      <Link to={`/posts/${p.id}`} style={{ color: "inherit", textDecoration: "none" }}>
                        {p.title && <h3 style={{ margin: "0 0 6px" }}>{p.title}</h3>}
                        {p.content && <p style={{ margin: 0, opacity: 0.9 }}>{p.content}</p>}
                      </Link>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  );
}
