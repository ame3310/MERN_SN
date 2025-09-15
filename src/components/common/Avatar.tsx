import { cldUrl } from "@/lib/cloudinary";

type AvatarProps = {
  src?: string;
  publicId?: string;
  size?: number;
  alt?: string;
  version?: number;
};

export default function Avatar({
  src,
  publicId,
  size = 40,
  alt = "",
  version,
}: AvatarProps) {
  const url =
    src ??
    (publicId
      ? cldUrl(publicId, {
          version,
          transform: `c_thumb,g_face,r_max,w_${size},h_${size}`,
          qAuto: true,
          fAuto: true,
        })
      : undefined);

  return (
    <img
      src={url}
      alt={alt}
      width={size}
      height={size}
      style={{ borderRadius: 999, objectFit: "cover", background: "#222" }}
    />
  );
}
