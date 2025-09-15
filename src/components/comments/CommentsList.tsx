import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import {
  makeSelectCommentsByPost,
  selectMetaByPost,
  setListForPost,
  setMetaForPost,
  upsertMany,
  appendToListForPost,
  removeOne,
  upsertOne,
} from "@/features/comments/commentSlice";
import {
  deleteComment,
  listComments,
  updateComment,
} from "@/services/comments";
import { like, unlike } from "@/services/likes";
import Skeleton from "@/components/ui/Skeleton";
import { Link } from "react-router-dom";

export default function CommentsList({ postId }: { postId: string }) {
  const dispatch = useAppDispatch();
  const comments = useAppSelector(makeSelectCommentsByPost(postId));
  const meta = useAppSelector((s) => selectMetaByPost(s, postId));
  const meId = useAppSelector((s) => s.auth.user?.id);

  const [initialLoading, setInitialLoading] = useState(true);
  const [busyIds, setBusyIds] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState<Record<string, string>>({});
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (comments.length > 0) {
        setInitialLoading(false);
        return;
      }
      try {
        const res = await listComments({ postId, page: 1, limit: 10 });
        if (cancelled) return;
        dispatch(upsertMany(res.data));
        dispatch(setListForPost({ postId, ids: res.data.map((c) => c.id) }));
        dispatch(
          setMetaForPost({
            postId,
            page: res.page,
            limit: res.limit,
            total: res.total,
          })
        );
      } finally {
        if (!cancelled) setInitialLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId]);

  const hasMore = meta.page * meta.limit < meta.total;

  async function loadMore() {
    const next = meta.page + 1;
    const res = await listComments({ postId, page: next, limit: meta.limit });
    dispatch(upsertMany(res.data));
    dispatch(
      setMetaForPost({
        postId,
        page: res.page,
        limit: res.limit,
        total: res.total,
      })
    );
    dispatch(appendToListForPost({ postId, ids: res.data.map((c) => c.id) }));
  }

  async function onDelete(id: string) {
    if (!confirm("¿Eliminar comentario?")) return;
    await deleteComment(id);
    dispatch(removeOne(id));
    setEditing((prev) => {
      const { [id]: _, ...rest } = prev;
      return rest;
    });
    setSavingIds((prev) => {
      const n = new Set(prev);
      n.delete(id);
      return n;
    });
    setBusyIds((prev) => {
      const n = new Set(prev);
      n.delete(id);
      return n;
    });
  }

  async function toggleLike(commentId: string) {
    const c = comments.find((x) => x.id === commentId);
    if (!c) return;
    if (!meId) return;
    if (busyIds.has(commentId)) return;

    setBusyIds((prev) => new Set(prev).add(commentId));
    const prevLiked = c.likedByMe;
    const prevCount = c.likeCount;
    const nextLiked = !prevLiked;
    const nextCount = Math.max(0, prevCount + (nextLiked ? 1 : -1));
    dispatch(upsertOne({ ...c, likedByMe: nextLiked, likeCount: nextCount }));

    try {
      if (nextLiked) await like(commentId, "comment");
      else await unlike(commentId, "comment");
    } catch {
      dispatch(upsertOne({ ...c, likedByMe: prevLiked, likeCount: prevCount }));
    } finally {
      setBusyIds((prev) => {
        const n = new Set(prev);
        n.delete(commentId);
        return n;
      });
    }
  }

  function startEdit(id: string, current: string) {
    setEditing((prev) => ({ ...prev, [id]: current }));
  }
  function cancelEdit(id: string) {
    setEditing((prev) => {
      const { [id]: _, ...rest } = prev;
      return rest;
    });
  }
  function onEditChange(id: string, val: string) {
    setEditing((prev) => ({ ...prev, [id]: val }));
  }
  async function saveEdit(id: string) {
    const draft = editing[id]?.trim();
    if (!draft) return;
    if (savingIds.has(id)) return;

    const c = comments.find((x) => x.id === id);
    if (!c) return;

    setSavingIds((prev) => new Set(prev).add(id));

    const prev = c;
    dispatch(upsertOne({ ...c, content: draft }));

    try {
      const saved = await updateComment(id, draft);
      dispatch(
        upsertOne({
          ...saved,
          likeCount: prev.likeCount,
          likedByMe: prev.likedByMe,
        })
      );
      cancelEdit(id);
    } catch {
      dispatch(upsertOne(prev));
    } finally {
      setSavingIds((prev) => {
        const n = new Set(prev);
        n.delete(id);
        return n;
      });
    }
  }

  if (initialLoading) {
    return (
      <div style={{ display: "grid", gap: 12 }}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{ borderTop: "1px solid #1f2430", paddingTop: 8 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
              }}>
              <Skeleton style={{ width: 160, height: 14 }} />
              <Skeleton style={{ width: 64, height: 24, borderRadius: 8 }} />
            </div>
            <div style={{ marginTop: 8, display: "grid", gap: 6 }}>
              <Skeleton style={{ height: 12 }} />
              <Skeleton style={{ height: 12, width: "80%" }} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (comments.length === 0 && meta.total === 0) {
    return <p style={{ opacity: 0.8 }}>Sé el primero en comentar.</p>;
  }

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <ul style={{ display: "grid", gap: 8 }}>
        {comments.map((c) => {
          const isEditing = Object.prototype.hasOwnProperty.call(editing, c.id);
          const draft = editing[c.id] ?? "";

          return (
            <li
              key={c.id}
              style={{ borderTop: "1px solid #1f2430", paddingTop: 8 }}>
              <div
                style={{
                  display: "flex",
                  gap: 12,
                  alignItems: "center",
                  justifyContent: "space-between",
                }}>
                <div style={{ fontSize: 12, opacity: 0.8 }}>
                  {c.author?.username ? (
                    <>
                      <Link
                        to={`/profile/${c.author.id}`}
                        style={{ color: "inherit", textDecoration: "none" }}>
                        @{c.author.username}
                      </Link>
                      {" · "}
                    </>
                  ) : (
                    <>Anónimo · </>
                  )}
                  <time dateTime={c.createdAt}>
                    {new Date(c.createdAt).toLocaleString()}
                  </time>
                </div>
                <button
                  onClick={() => toggleLike(c.id)}
                  disabled={!meId || busyIds.has(c.id)}
                  title={c.likedByMe ? "Quitar me gusta" : "Me gusta"}>
                  {c.likedByMe ? "💜" : "🤍"} {c.likeCount}
                </button>
              </div>

              {isEditing ? (
                <div style={{ marginTop: 6, display: "grid", gap: 6 }}>
                  <textarea
                    value={draft}
                    onChange={(e) => onEditChange(c.id, e.target.value)}
                    rows={3}
                    onKeyDown={(e) => {
                      if (e.key === "Escape") {
                        e.preventDefault();
                        cancelEdit(c.id);
                      }
                      if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                        e.preventDefault();
                        saveEdit(c.id);
                      }
                    }}
                  />
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      onClick={() => saveEdit(c.id)}
                      disabled={savingIds.has(c.id) || !draft.trim()}>
                      {savingIds.has(c.id) ? "Guardando…" : "Guardar"}
                    </button>
                    <button
                      onClick={() => cancelEdit(c.id)}
                      disabled={savingIds.has(c.id)}>
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <p style={{ whiteSpace: "pre-wrap", margin: "4px 0 0" }}>
                  {c.content}
                </p>
              )}

              {meId === c.authorId && !isEditing && (
                <div style={{ marginTop: 6, display: "flex", gap: 8 }}>
                  <button onClick={() => startEdit(c.id, c.content)}>
                    Editar
                  </button>
                  <button onClick={() => onDelete(c.id)}>Eliminar</button>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      {hasMore && (
        <button onClick={loadMore} style={{ marginTop: 8 }}>
          Cargar más
        </button>
      )}
    </div>
  );
}
