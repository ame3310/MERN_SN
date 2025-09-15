import { useRef, useState } from "react";
import { uploadAvatar } from "@/services/uploads";
import { updateMe, type PublicUser } from "@/services/users";

type Props = {
  current?: string | null;
  onUpdated?: (u: PublicUser) => void;
};

export default function AvatarUploader({ current = null, onUpdated }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [preview, setPreview] = useState<string | null>(current);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setErr(null);
    const tmpUrl = URL.createObjectURL(file);
    setPreview(tmpUrl);
    setBusy(true);

    try {
      const url = await uploadAvatar(file);
      const me = await updateMe({ avatarUrl: url });
      onUpdated?.(me);
      URL.revokeObjectURL(tmpUrl);
      setPreview(url);
    } catch (ex) {
      const msg = ex instanceof Error ? ex.message : "Error subiendo el avatar";
      setErr(msg);
      URL.revokeObjectURL(tmpUrl);
      setPreview(current);
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <img
        src={preview ?? "/avatar-placeholder.png"}
        alt="avatar"
        width={72}
        height={72}
        style={{ borderRadius: "50%", objectFit: "cover", background: "#222" }}
      />
      <input ref={inputRef} type="file" accept="image/*" onChange={onChange} disabled={busy} />
      {busy && <span>Subiendo…</span>}
      {err && <span style={{ color: "tomato" }}>{err}</span>}
    </div>
  );
}
