import { useEffect, useState } from "react";
import { useAppSelector } from "@/app/hooks";
import {
  listFollowers,
  listFollowing,
  follow as followApi,
  unfollow as unfollowApi,
  type PublicUserBasic,
} from "@/services/followers";

type Kind = "followers" | "following";

export default function PeopleList({ kind, userId }: { kind: Kind; userId: string }) {
  const meId = useAppSelector((s) => s.auth.user?.id);

  const [items, setItems] = useState<PublicUserBasic[]>([]);
  const [page, setPage] = useState(0);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [busyIds, setBusyIds] = useState<Set<string>>(new Set());

  const hasMore = page * limit < total;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const res =
          kind === "followers"
            ? await listFollowers({ userId, page: 1, limit })
            : await listFollowing({ userId, page: 1, limit });

        if (cancelled) return;
        setItems(res.data);
        setPage(res.page);
        setTotal(res.total);
      } catch {
        if (!cancelled) setErr("No se pudo cargar la lista.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [kind, userId, limit]);

  async function loadMore() {
    const next = page + 1;
    const res =
      kind === "followers"
        ? await listFollowers({ userId, page: next, limit })
        : await listFollowing({ userId, page: next, limit });
    setItems((prev) => {
      const seen = new Set(prev.map((u) => u.id));
      const add = res.data.filter((u) => !seen.has(u.id));
      return [...prev, ...add];
    });
    setPage(res.page);
    setTotal(res.total);
  }

  async function toggleFollow(u: PublicUserBasic) {
    if (!meId || busyIds.has(u.id)) return;
    setBusyIds((s) => new Set(s).add(u.id));

    const prev = !!u.isFollowedByMe;
    setItems((prevItems) =>
      prevItems.map((x) => (x.id === u.id ? { ...x, isFollowedByMe: !prev } : x))
    );

    try {
      if (prev) await unfollowApi(u.id);
      else await followApi(u.id);
    } catch {
      setItems((prevItems) =>
        prevItems.map((x) => (x.id === u.id ? { ...x, isFollowedByMe: prev } : x))
      );
    } finally {
      setBusyIds((s) => {
        const n = new Set(s);
        n.delete(u.id);
        return n;
      });
    }
  }

  if (loading) return <p>Cargando…</p>;
  if (err) return <p style={{ color: "tomato" }}>{err}</p>;
  if (items.length === 0) {
    return <p style={{ opacity: 0.8 }}>
      {kind === "followers" ? "Aún no tiene seguidores." : "Aún no sigue a nadie."}
    </p>;
  }

  return (
    <div style={{ display: "grid", gap: 10 }}>
      <ul style={{ display: "grid", gap: 8 }}>
        {items.map((u) => (
          <li key={u.id} style={{ display: "flex", justifyContent: "space-between", gap: 12, borderTop: "1px solid #1f2430", paddingTop: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {u.avatarUrl ? (
                <img src={u.avatarUrl} alt="" style={{ width: 32, height: 32, borderRadius: 16 }} />
              ) : (
                <div style={{ width: 32, height: 32, borderRadius: 16, background: "#333" }} />
              )}
              <a href={`/profile/${u.id}`} style={{ fontWeight: 600 }}>{u.username}</a>
            </div>
            {meId && meId !== u.id && (
              <button onClick={() => toggleFollow(u)} disabled={busyIds.has(u.id)}>
                {u.isFollowedByMe ? "Dejar de seguir" : "Seguir"}
              </button>
            )}
          </li>
        ))}
      </ul>

      {hasMore && (
        <button onClick={loadMore} style={{ marginTop: 8 }}>
          Cargar más
        </button>
      )}
    </div>
  );
}
