import { useSearchParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import useDebouncedValue from "@/hooks/useDebouncedValue";

export default function SearchBar() {
  const [sp, setSp] = useSearchParams();
  const navigate = useNavigate();
  const [q, setQ] = useState(sp.get("q") ?? "");
  const debounced = useDebouncedValue(q, 400);

  useEffect(() => {
    const next = new URLSearchParams(sp);
    if (debounced) next.set("q", debounced);
    else next.delete("q");
    next.delete("page");
    setSp(next, { replace: true });
  }, [debounced]);

  useEffect(() => {
    if (debounced && !location.pathname.startsWith("/search")) {
      navigate(`/search?q=${encodeURIComponent(debounced)}`);
    }
  }, [debounced]);

  return (
    <input
      value={q}
      onChange={(e) => setQ(e.target.value)}
      placeholder="Buscar usuarios o posts…"
      className="w-full rounded-lg px-3 py-2 bg-zinc-800 text-zinc-50 outline-none"
      aria-label="Buscar"
    />
  );
}
