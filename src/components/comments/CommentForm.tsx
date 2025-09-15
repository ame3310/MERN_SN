import { useState } from "react";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { createComment, type PublicCommentWithMeta } from "@/services/comments";
import {
  upsertOne,
  appendToListForPost,
} from "@/features/comments/commentSlice";

export default function CommentForm({ postId }: { postId: string }) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const me = useAppSelector((s) => s.auth.user);
  const dispatch = useAppDispatch();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || busy) return;
    setBusy(true);
    try {
      const created: PublicCommentWithMeta = await createComment({
        postId,
        content: text.trim(),
      });
      dispatch(upsertOne(created));
      dispatch(appendToListForPost({ postId, ids: [created.id] }));
      setText("");
    } finally {
      setBusy(false);
    }
  }

  if (!me) return null;

  return (
    <form
      onSubmit={onSubmit}
      style={{ display: "grid", gap: 8, marginTop: 12 }}>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
        placeholder="Escribe un comentario…"
        required
      />
      <div>
        <button type="submit" disabled={busy || !text.trim()}>
          {busy ? "Publicando…" : "Comentar"}
        </button>
      </div>
    </form>
  );
}
