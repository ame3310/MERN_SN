export type SignedUploadFields = {
  cloudName: string;
  apiKey: string;
  signature: string;
  timestamp: number;
  folder: string;
  publicId: string;
  overwrite?: boolean;
  resourceType?: "image" | "video" | "raw";
};

export type UploadedAsset = {
  publicId: string;
  version: number;
  secureUrl: string;
  bytes: number;
  width?: number;
  height?: number;
  format?: string;
};

export async function uploadSigned(
  file: File,
  signed: SignedUploadFields,
  opts?: { signal?: AbortSignal }
): Promise<UploadedAsset> {
  const resource = signed.resourceType ?? "image";
  const url = `https://api.cloudinary.com/v1_1/${signed.cloudName}/${resource}/upload`;

  const form = new FormData();
  form.set("file", file);
  form.set("api_key", signed.apiKey);
  form.set("timestamp", String(signed.timestamp));
  form.set("signature", signed.signature);
  form.set("folder", signed.folder);
  form.set("public_id", signed.publicId);
  if (signed.overwrite !== undefined)
    form.set("overwrite", String(signed.overwrite));

  const res = await fetch(url, {
    method: "POST",
    body: form,
    signal: opts?.signal,
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Upload failed: ${res.status} ${txt}`);
  }
  const data = (await res.json()) as {
    public_id: string;
    version: number;
    secure_url: string;
    bytes: number;
    width?: number;
    height?: number;
    format?: string;
  };

  return {
    publicId: data.public_id,
    version: data.version,
    secureUrl: data.secure_url,
    bytes: data.bytes,
    width: data.width,
    height: data.height,
    format: data.format,
  };
}

export function cldUrl(
  publicId: string,
  opts?: {
    cloudName?: string;
    resourceType?: "image" | "video" | "raw";
    version?: number;
    transform?: string;
    qAuto?: boolean;
    fAuto?: boolean;
  }
) {
  const cloud = opts?.cloudName ?? import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  if (!cloud) throw new Error("VITE_CLOUDINARY_CLOUD_NAME no definido");

  const resource = opts?.resourceType ?? "image";
  const pieces: string[] = [];
  if (opts?.transform) pieces.push(opts.transform);
  if (opts?.qAuto) pieces.push("q_auto");
  if (opts?.fAuto) pieces.push("f_auto");
  const tx = pieces.filter(Boolean).join(",");
  const txSeg = tx ? `${tx}/` : "";
  const vSeg = opts?.version ? `v${opts.version}/` : "";

  return `https://res.cloudinary.com/${cloud}/${resource}/upload/${txSeg}${vSeg}${publicId}`;
}

export const cldThumbUrl = (publicId: string, version?: number) =>
  cldUrl(publicId, { version, transform: "c_fill,w_800,h_800,q_auto,f_auto" });
