import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { selectPostById, upsertOne } from "@/features/posts/postSlice";
import { getPost, type PublicPostWithMeta } from "@/services/posts";
import { like, unlike } from "@/services/likes";
import { favoritePost, unfavoritePost } from "@/services/favorites";
import CommentsList from "@/components/comments/CommentsList";
import CommentForm from "@/components/comments/CommentForm";
import { getUserById } from "@/services/users";

type LocState = { post?: PublicPostWithMeta } | null;

function asImgSrc(url?: string) {
  return url ?? "";
}

export default function PostDetailPage() {
  const { postId } = useParams<{ postId: string }>();
  if (!postId) return <p>Post no encontrado</p>;

  const dispatch = useAppDispatch();
  const state = useLocation().state as LocState;
  const prefilled = state?.post ?? null;

  const postFromStore = useAppSelector((s) => selectPostById(s, postId));
  const post = useMemo<PublicPostWithMeta | null>(
    () => postFromStore ?? prefilled,
    [postFromStore, prefilled]
  );

  const [loading, setLoading] = useState(!post);
  const [err, setErr] = useState<string | null>(null);
  const [busyLike, setBusyLike] = useState(false);
  const [busyFav, setBusyFav] = useState(false);

  const authorId = post?.author?.id ?? post?.authorId ?? null;
  const [authorName, setAuthorName] = useState<string | null>(
    post?.author?.username ?? null
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!authorName && authorId) {
        try {
          const u = await getUserById(authorId);
          if (!cancelled) setAuthorName(u.username);
        } catch {}
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [authorName, authorId]);

  useEffect(() => {
    if (prefilled) dispatch(upsertOne(prefilled));
  }, [dispatch, prefilled]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const fresh = await getPost(postId);
        if (!cancelled) dispatch(upsertOne(fresh));
      } catch {
        if (!cancelled) setErr("No se pudo cargar el post");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [dispatch, postId]);

  if (loading && !post) return <p>Cargando…</p>;
  if (!post) return <p>No se encontró el post.</p>;
  if (err) return <p style={{ color: "tomato" }}>{err}</p>;

  async function toggleLike() {
    if (busyLike) return;
    setBusyLike(true);
    const prev = postFromStore ?? post;
    const optimistic: PublicPostWithMeta = {
      ...prev,
      likedByMe: !prev.likedByMe,
      likeCount: prev.likeCount + (prev.likedByMe ? -1 : 1),
    };
    dispatch(upsertOne(optimistic));
    try {
      if (prev.likedByMe) await unlike(prev.id, "post");
      else await like(prev.id, "post");
      const fresh = await getPost(prev.id);
      dispatch(upsertOne(fresh));
    } catch {
      dispatch(upsertOne(prev));
    } finally {
      setBusyLike(false);
    }
  }

  async function toggleFavorite() {
    if (busyFav) return;
    setBusyFav(true);
    const prev = postFromStore ?? post;
    const optimistic: PublicPostWithMeta = {
      ...prev,
      favoritedByMe: !prev.favoritedByMe,
      favoriteCount: prev.favoriteCount + (prev.favoritedByMe ? -1 : 1),
    };
    dispatch(upsertOne(optimistic));
    try {
      if (prev.favoritedByMe) await unfavoritePost(prev.id);
      else await favoritePost(prev.id);
      const fresh = await getPost(prev.id);
      dispatch(upsertOne(fresh));
    } catch {
      dispatch(upsertOne(prev));
    } finally {
      setBusyFav(false);
    }
  }

  return (
    <div className="container" style={{ display: "grid", gap: 12 }}>
      <h2>{post.title ?? "(sin título)"}</h2>

      <small>
        {authorId && (post.author?.username || authorName) ? (
          <>
            por{" "}
            <Link to={`/profile/${authorId}`}>
              @{post.author?.username || authorName}
            </Link>{" "}
            ·{" "}
          </>
        ) : null}
        {new Date(post.createdAt).toLocaleString()}
      </small>

      {post.images?.length ? (
        <div
          style={{
            display: "grid",
            gap: 8,
            gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
          }}>
          {post.images.map((img) => (
            <img
              key={img}
              src={asImgSrc(img)}
              alt=""
              style={{
                width: "100%",
                aspectRatio: "4/3",
                objectFit: "cover",
                borderRadius: 10,
              }}
            />
          ))}
        </div>
      ) : null}

      {post.content && <p>{post.content}</p>}

      <div
        style={{
          display: "flex",
          gap: 12,
          borderTop: "1px solid #1f2430",
          paddingTop: 8,
        }}>
        <button onClick={toggleLike} disabled={busyLike}>
          {post.likedByMe ? "💜" : "🤍"} {post.likeCount}
        </button>
        <button onClick={toggleFavorite} disabled={busyFav}>
          {post.favoritedByMe ? "⭐" : "☆"} {post.favoriteCount}
        </button>
      </div>

      <section style={{ marginTop: 24 }}>
        <h3>Comentarios</h3>
        <CommentsList postId={postId} />
        <CommentForm postId={postId} />
      </section>
    </div>
  );
}
