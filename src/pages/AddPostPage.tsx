import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { pMap } from "@/lib/concurrency";
import { uploadSigned, type UploadedAsset } from "@/lib/cloudinary";
import { getSignedBatch } from "@/services/uploads";
import api from "@/lib/api";
import { useAppDispatch } from "@/app/hooks";
import { upsertOne } from "@/features/posts/postSlice";
import { getPost } from "@/services/posts";

export default function AddPostPage() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  function onPickFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files ?? []);
    setFiles((prev) => {
      const seen = new Set(prev.map((f) => `${f.name}|${f.size}|${f.lastModified}`));
      const merged = [...prev];
      for (const f of picked) {
        const key = `${f.name}|${f.size}|${f.lastModified}`;
        if (!seen.has(key)) merged.push(f);
      }
      return merged.slice(0, 10);
    });
    // permite re-seleccionar el mismo archivo en la siguiente apertura del diálogo
    e.currentTarget.value = "";
  }

  function removeAt(i: number) {
    setFiles((prev) => prev.filter((_, j) => j !== i));
  }

  // Genera y limpia los ObjectURL de las miniaturas
  useEffect(() => {
    const urls = files.map((f) => URL.createObjectURL(f));
    setPreviews(urls);
    return () => {
      urls.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [files]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setErr(null);
    setSubmitting(true);

    try {
      if (files.length === 0) {
        setErr("Debes seleccionar al menos una imagen.");
        setSubmitting(false);
        return;
      }

      const signatures = await getSignedBatch({ kind: "post", count: files.length });
      const uploads: UploadedAsset[] = await pMap(
        files,
        (file, i) => uploadSigned(file, signatures[i]),
        4
      );

      const body = {
        title: title.trim() || undefined,
        content: content.trim() || undefined,
        images: uploads.map((u) => u.secureUrl),
      };

      const { data } = await api.post<{ id: string }>("/posts", body);
      const fresh = await getPost(data.id);
      dispatch(upsertOne(fresh));
      navigate(`/posts/${data.id}`);

      setTitle("");
      setContent("");
      setFiles([]);
      setPreviews([]);
    } catch (e: unknown) {
      const msg =
        typeof e === "object" && e && "message" in e
          ? String((e as { message?: string }).message)
          : "Error creando post";
      setErr(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <form onSubmit={onSubmit} style={{ display: "grid", gap: 12, maxWidth: 520 }}>
        <h2>Nuevo post</h2>

        <label>Título (opcional)</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} />

        <label>Contenido (opcional)</label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={4}
          maxLength={5000}
        />

        <label>Imágenes</label>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={onPickFiles}
        />
        {files.length > 0 && <small>{files.length} archivo(s) listo(s) para subir</small>}

        {files.length > 0 && (
          <div
            style={{
              display: "grid",
              gap: 8,
              gridTemplateColumns: "repeat(auto-fill, minmax(96px, 1fr))",
            }}
          >
            {files.map((f, i) => (
              <div key={`${f.name}-${i}`} style={{ position: "relative" }}>
                <img
                  src={previews[i]}
                  alt=""
                  style={{ width: "100%", aspectRatio: "1/1", objectFit: "cover", borderRadius: 8 }}
                />
                <button
                  type="button"
                  onClick={() => removeAt(i)}
                  title="Quitar"
                  style={{
                    position: "absolute",
                    top: 4,
                    right: 4,
                    border: "none",
                    background: "#0008",
                    color: "white",
                    width: 22,
                    height: 22,
                    borderRadius: 999,
                    cursor: "pointer",
                  }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        {err && <p style={{ color: "tomato" }}>{err}</p>}
        <button type="submit" disabled={submitting || files.length === 0}>
          {submitting ? "Subiendo…" : "Publicar"}
        </button>
      </form>
    </div>
  );
}
