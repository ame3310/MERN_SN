import { useParams, Link } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { getUserById, type PublicUser } from "@/services/users";
import { listFeed } from "@/services/posts";
import {
  upsertMany,
  makeFeedKey,
  makeFavoritesKey,
  makeSelectListByKey,
  setListForKey,
  setMetaForKey,
  selectMetaByKey,
  appendToList,
} from "@/features/posts/postSlice";
import { follow, unfollow } from "@/services/followers";
import { listFavoritePostsOfUser } from "@/services/favorites";
import PeopleList from "@/components/follow/PeopleList";
import AvatarUploader from "@/components/profile/AvatarUploader";

type Tab = "posts" | "favorites" | "followers" | "following";
type PublicUserWithFollow = PublicUser & { isFollowedByMe?: boolean };

function hasIsFollowedByMe(u: PublicUser | PublicUserWithFollow): u is PublicUserWithFollow {
  return Object.prototype.hasOwnProperty.call(u, "isFollowedByMe");
}

export default function UserProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  if (!userId) return <p>Usuario no encontrado</p>;
  const uid = userId;

  const meId = useAppSelector((s) => s.auth.user?.id);
  const dispatch = useAppDispatch();
  const [profile, setProfile] = useState<PublicUser | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("posts");

  const postsKey = useMemo(() => makeFeedKey({ authorId: uid }), [uid]);
  const selectPosts = useMemo(() => makeSelectListByKey(postsKey), [postsKey]);
  const posts = useAppSelector(selectPosts);
  const meta = useAppSelector((s) => selectMetaByKey(s, postsKey));
  const hasMore = meta.page * meta.limit < meta.total;

  const [loadingPosts, setLoadingPosts] = useState<boolean>(false);
  const loadingMoreRef = useRef(false);

  const favKey = useMemo(() => makeFavoritesKey(uid), [uid]);
  const selectFavs = useMemo(() => makeSelectListByKey(favKey), [favKey]);
  const favs = useAppSelector(selectFavs);
  const favMeta = useAppSelector((s) => selectMetaByKey(s, favKey));
  const [loadingFavs, setLoadingFavs] = useState(false);

  const [busyFollow, setBusyFollow] = useState(false);
  const [iFollow, setIFollow] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setErr(null);
        setLoadingProfile(true);
        const u = await getUserById(uid);
        if (cancelled) return;
        setProfile(u);
        if (hasIsFollowedByMe(u) && typeof u.isFollowedByMe === "boolean") {
          setIFollow(u.isFollowedByMe);
        }
      } catch {
        if (!cancelled) setErr("No se pudo cargar el perfil");
      } finally {
        if (!cancelled) setLoadingProfile(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [uid]);

  async function fetchUserPosts(page: number, limit: number) {
    return listFeed({ page, limit, authorId: uid });
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoadingPosts(true);
        setErr(null);
        dispatch(setListForKey({ key: postsKey, ids: [] }));
        dispatch(setMetaForKey({ key: postsKey, page: 0, limit: 12, total: 0 }));
        const res = await fetchUserPosts(1, 12);
        if (cancelled) return;
        dispatch(upsertMany(res.data));
        dispatch(setListForKey({ key: postsKey, ids: res.data.map((p) => p.id) }));
        dispatch(setMetaForKey({ key: postsKey, page: res.page, limit: res.limit, total: res.total }));
      } catch {
        if (!cancelled) setErr("No se pudo cargar los posts");
      } finally {
        if (!cancelled) setLoadingPosts(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [uid, postsKey, dispatch]);

  async function loadMore() {
    if (loadingMoreRef.current) return;
    if (!hasMore) return;
    loadingMoreRef.current = true;
    try {
      const next = meta.page + 1;
      const res = await fetchUserPosts(next, meta.limit || 12);
      dispatch(upsertMany(res.data));
      dispatch(appendToList({ key: postsKey, ids: res.data.map((p) => p.id) }));
      dispatch(setMetaForKey({ key: postsKey, page: res.page, limit: res.limit, total: res.total }));
    } finally {
      loadingMoreRef.current = false;
    }
  }

  useEffect(() => {
    if (tab !== "favorites") return;
    if (favMeta.page > 0 || favs.length > 0) return;
    let cancelled = false;
    (async () => {
      try {
        setLoadingFavs(true);
        const res = await listFavoritePostsOfUser({ userId: uid, page: 1, limit: 12 });
        if (cancelled) return;
        dispatch(upsertMany(res.data));
        dispatch(setListForKey({ key: favKey, ids: res.data.map((p) => p.id) }));
        dispatch(setMetaForKey({ key: favKey, page: res.page, limit: res.limit, total: res.total }));
      } catch {
      } finally {
        if (!cancelled) setLoadingFavs(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tab, uid, favKey, favMeta.page, favs.length, dispatch]);

  const listToRender = tab === "favorites" ? favs : posts;

  async function onFollowToggle() {
    if (!meId || meId === uid || busyFollow) return;
    try {
      setBusyFollow(true);
      if (iFollow) {
        await unfollow(uid);
        setIFollow(false);
      } else {
        await follow(uid);
        setIFollow(true);
      }
    } finally {
      setBusyFollow(false);
    }
  }

  return (
    <div>
      <header style={{ marginBottom: 12 }}>
        {loadingProfile ? (
          <h2>Cargando perfil…</h2>
        ) : err ? (
          <h2 style={{ color: "tomato" }}>{err}</h2>
        ) : profile ? (
          <>
            <h2>
              {profile.username} {meId === uid ? "(tú)" : ""}
            </h2>
            <div style={{ opacity: 0.8, marginBottom: 6 }}>
              Followers: {profile.followersCount ?? 0} · Siguiendo: {profile.followingCount ?? 0}
            </div>
            {meId === uid && (
              <div style={{ margin: "12px 0" }}>
                <AvatarUploader current={profile.avatarUrl ?? null} onUpdated={(u) => setProfile(u)} />
              </div>
            )}
            {meId && meId !== uid && (
              <button onClick={onFollowToggle} disabled={busyFollow}>
                {iFollow ? "Siguiendo" : "Seguir"}
              </button>
            )}
          </>
        ) : (
          <h2>Usuario no encontrado</h2>
        )}
      </header>

      <nav style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <button onClick={() => setTab("posts")} style={{ fontWeight: tab === "posts" ? 700 : 400 }}>
          Posts
        </button>
        <button onClick={() => setTab("favorites")} style={{ fontWeight: tab === "favorites" ? 700 : 400 }}>
          Favoritos
        </button>
        <button onClick={() => setTab("followers")} style={{ fontWeight: tab === "followers" ? 700 : 400 }}>
          Seguidores
        </button>
        <button onClick={() => setTab("following")} style={{ fontWeight: tab === "following" ? 700 : 400 }}>
          Siguiendo
        </button>
      </nav>

      <section>
        {tab === "followers" && <PeopleList kind="followers" userId={uid} />}
        {tab === "following" && <PeopleList kind="following" userId={uid} />}

        {(tab === "posts" || tab === "favorites") && (
          <>
            {tab === "posts" && loadingPosts && <p>Cargando posts…</p>}
            {tab === "favorites" && loadingFavs && <p>Cargando favoritos…</p>}

            {!loadingPosts && !loadingFavs && listToRender.length === 0 ? (
              <p style={{ opacity: 0.8 }}>
                {tab === "posts" ? "Este usuario todavía no tiene posts." : "Este usuario no tiene favoritos."}
              </p>
            ) : null}

            {listToRender.length > 0 && (
              <ul
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                  gap: 12,
                  listStyle: "none",
                  padding: 0,
                }}
              >
                {listToRender.map((p) => (
                  <li key={p.id} style={{ border: "1px solid #333", borderRadius: 8, padding: 10 }}>
                    <div style={{ opacity: 0.8, fontSize: 12, marginBottom: 6 }}>
                      {(() => {
                        const authorUsername = p.author?.username ?? profile?.username ?? null;
                        const authorLinkId = p.author?.id ?? p.authorId ?? uid;
                        return authorUsername ? (
                          <Link to={`/profile/${authorLinkId}`} style={{ color: "inherit" }}>
                            @{authorUsername}
                          </Link>
                        ) : (
                          "Anónimo"
                        );
                      })()}{" "}
                      · {p.createdAt ? new Date(p.createdAt).toLocaleString() : ""}
                    </div>

                    <Link to={`/posts/${p.id}`} style={{ color: "inherit", textDecoration: "none" }}>
                      {p.images?.[0] ? (
                        <img
                          src={p.images[0]}
                          alt=""
                          width={320}
                          height={180}
                          style={{ width: "100%", height: "auto", borderRadius: 8, objectFit: "cover" }}
                        />
                      ) : (
                        <div style={{ width: "100%", height: 180, borderRadius: 8, background: "#2a2a2a" }} />
                      )}
                      {p.title && <h3 style={{ margin: "8px 0 4px" }}>{p.title}</h3>}
                      {p.content && <p style={{ margin: 0, opacity: 0.9 }}>{p.content}</p>}
                    </Link>
                  </li>
                ))}
              </ul>
            )}

            {tab === "posts" && hasMore && (
              <button onClick={loadMore} style={{ marginTop: 12 }}>
                Cargar más
              </button>
            )}
          </>
        )}
      </section>
    </div>
  );
}
