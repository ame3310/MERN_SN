import { useEffect, useMemo, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import {
  appendToList,
  makeFeedKey,
  makeFollowingKey,
  makeSelectListByKey,
  selectMetaByKey,
  setListForKey,
  setMetaForKey,
  upsertMany,
  type FeedKey,
} from "@/features/posts/postSlice";
import { listFeed } from "@/services/posts";
import { listMyFollowingFeed } from "@/services/feeds";
import PostCard from "@/components/posts/PostCard";

type Tab = "all" | "following";

export default function HomePage() {
  const meId = useAppSelector((s) => s.auth.user?.id);
  const dispatch = useAppDispatch();
  const [tab, setTab] = useState<Tab>(meId ? "following" : "all");
  useEffect(() => {
    if (meId) setTab((t) => (t === "all" ? "following" : t));
  }, [meId]);

  const allKey = makeFeedKey();
  const followingKey = useMemo<FeedKey | null>(
    () => (meId ? makeFollowingKey(meId) : null),
    [meId]
  );

  const allPosts = useAppSelector(makeSelectListByKey(allKey));
  const allMeta = useAppSelector((s) => selectMetaByKey(s, allKey));

  const followingSelector = useMemo(
    () => (followingKey ? makeSelectListByKey(followingKey) : null),
    [followingKey]
  );
  const followingPosts = useAppSelector((s) =>
    followingKey && followingSelector ? followingSelector(s) : []
  );
  const followingMeta = useAppSelector((s) =>
    followingKey
      ? selectMetaByKey(s, followingKey)
      : { page: 0, limit: 10, total: 0 }
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (allPosts.length > 0) return;
      const res = await listFeed({ page: 1, limit: 10 });
      if (cancelled) return;
      dispatch(upsertMany(res.data));
      dispatch(setListForKey({ key: allKey, ids: res.data.map((p) => p.id) }));
      dispatch(
        setMetaForKey({
          key: allKey,
          page: res.page,
          limit: res.limit,
          total: res.total,
        })
      );
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (tab !== "following" || !followingKey) return;
    let cancelled = false;
    (async () => {
      if (followingPosts.length > 0) return;
      const res = await listMyFollowingFeed({ page: 1, limit: 10 });
      if (cancelled) return;
      dispatch(upsertMany(res.data));
      dispatch(
        setListForKey({ key: followingKey, ids: res.data.map((p) => p.id) })
      );
      dispatch(
        setMetaForKey({
          key: followingKey,
          page: res.page,
          limit: res.limit,
          total: res.total,
        })
      );
    })();
    return () => {
      cancelled = true;
    };
  }, [tab, followingKey, followingPosts.length, dispatch]);

  const activeKey = tab === "all" ? allKey : followingKey!;
  const activeList = tab === "all" ? allPosts : followingPosts;
  const activeMeta = tab === "all" ? allMeta : followingMeta;
  const hasMore = activeMeta.page * activeMeta.limit < activeMeta.total;

  async function loadMore() {
    const next = activeMeta.page + 1;
    if (tab === "all") {
      const res = await listFeed({ page: next, limit: activeMeta.limit });
      dispatch(upsertMany(res.data));
      dispatch(
        setMetaForKey({
          key: allKey,
          page: res.page,
          limit: res.limit,
          total: res.total,
        })
      );
      dispatch(appendToList({ key: allKey, ids: res.data.map((p) => p.id) }));
    } else {
      const res = await listMyFollowingFeed({
        page: next,
        limit: activeMeta.limit,
      });
      dispatch(upsertMany(res.data));
      dispatch(
        setMetaForKey({
          key: followingKey!,
          page: res.page,
          limit: res.limit,
          total: res.total,
        })
      );
      dispatch(
        appendToList({ key: followingKey!, ids: res.data.map((p) => p.id) })
      );
    }
  }

  return (
    <div className="home-page">
      <nav style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <button
          onClick={() => setTab("all")}
          disabled={tab === "all"}
          style={{ fontWeight: tab === "all" ? 700 : 400 }}>
          Todos
        </button>
        {meId && (
          <button
            onClick={() => setTab("following")}
            disabled={tab === "following"}
            style={{ fontWeight: tab === "following" ? 700 : 400 }}>
            Siguiendo
          </button>
        )}
      </nav>

      {activeList.length === 0 ? (
        <p style={{ opacity: 0.8 }}>
          {tab === "following"
            ? "Sigue a gente para ver sus posts en tu feed."
            : "No hay posts aún."}
        </p>
      ) : (
        <ul className="post-list" style={{ display: "grid", gap: 12 }}>
          {activeList.map((p) => (
            <li key={p.id}>
              <PostCard postId={p.id} />
            </li>
          ))}
        </ul>
      )}

      {hasMore && (
        <button onClick={loadMore} style={{ marginTop: 12 }}>
          Cargar más
        </button>
      )}
    </div>
  );
}
