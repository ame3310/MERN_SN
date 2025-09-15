import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { selectPostById, upsertOne } from "@/features/posts/postSlice";
import { like, unlike } from "@/services/likes";
import { favoritePost, unfavoritePost } from "@/services/favorites";
import { getPost, type PublicPostWithMeta } from "@/services/posts";
import { cldUrl } from "@/lib/cloudinary";

type Props = { postId: string };

// Si no empieza por http, lo tratamos como public_id de Cloudinary
function asImgSrc(first: string | undefined) {
  if (!first) return "";
  if (/^https?:\/\//i.test(first)) return first;
  return cldUrl(first, { transform: "c_fill,w_800,h_800", qAuto: true, fAuto: true });
}

export default function PostCard({ postId }: Props) {
  const dispatch = useAppDispatch();
  const post = useAppSelector((s) => selectPostById(s, postId));
  const [busyLike, setBusyLike] = useState(false);
  const [busyFav, setBusyFav] = useState(false);

  if (!post) return null;

  const imgSrc = useMemo(() => asImgSrc(post.images?.[0]), [post.images]);

  async function refresh() {
    const fresh = await getPost(post.id);
    dispatch(upsertOne(fresh));
  }

  const onToggleLike = async () => {
    if (busyLike) return;
    setBusyLike(true);

    const prev: PublicPostWithMeta = { ...post };
    const optimistic: PublicPostWithMeta = {
      ...post,
      likedByMe: !post.likedByMe,
      likeCount: post.likeCount + (post.likedByMe ? -1 : 1),
    };
    dispatch(upsertOne(optimistic));

    try {
      if (prev.likedByMe) await unlike(prev.id, "post");
      else await like(prev.id, "post");
      await refresh();
    } catch {
      dispatch(upsertOne(prev));
    } finally {
      setBusyLike(false);
    }
  };

  const onToggleFav = async () => {
    if (busyFav) return;
    setBusyFav(true);

    const prev: PublicPostWithMeta = { ...post };
    const optimistic: PublicPostWithMeta = {
      ...post,
      favoritedByMe: !post.favoritedByMe,
      favoriteCount: post.favoriteCount + (post.favoritedByMe ? -1 : 1),
    };
    dispatch(upsertOne(optimistic));

    try {
      if (prev.favoritedByMe) await unfavoritePost(prev.id);
      else await favoritePost(prev.id);
      await refresh();
    } catch {
      dispatch(upsertOne(prev));
    } finally {
      setBusyFav(false);
    }
  };

  return (
    <article
      className="post-card"
      style={{ border: "1px solid #222", borderRadius: 8, padding: 12, display: "grid", gap: 8 }}
    >
      <header style={{ display: "flex", justifyContent: "space-between" }}>
        <strong>{post.title ?? "(sin título)"}</strong>
        <small style={{ opacity: 0.7 }}>{new Date(post.createdAt).toLocaleString()}</small>
      </header>

      {imgSrc && (
        <Link to={`/posts/${post.id}`} state={{ post }}>
          <img src={imgSrc} alt="" style={{ width: "100%", height: "auto", borderRadius: 6 }} />
        </Link>
      )}

      {post.content && <p style={{ margin: 0 }}>{post.content}</p>}

      <footer style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <button onClick={onToggleLike} disabled={busyLike}>
          {post.likedByMe ? "💜 Quitar like" : "🤍 Dar like"} ({post.likeCount})
        </button>
        <button onClick={onToggleFav} disabled={busyFav}>
          {post.favoritedByMe ? "⭐ Quitar favorito" : "☆ Añadir a favoritos"} ({post.favoriteCount})
        </button>
        <Link to={`/posts/${post.id}`} state={{ post }}>Ver detalle</Link>
      </footer>
    </article>
  );
}
