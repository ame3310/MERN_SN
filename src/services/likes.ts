import api from "@/lib/api";

export type LikeTargetType = "post" | "comment";

export async function like(targetId: string, targetType: LikeTargetType) {
  await api.post("/likes", { targetId, targetType });
}

export async function unlike(targetId: string, targetType: LikeTargetType) {
  await api.delete("/likes", { data: { targetId, targetType } });
}

export async function getLikeCount(
  targetId: string,
  targetType: LikeTargetType
): Promise<number> {
  const { data } = await api.get<{ count: number }>("/likes/count", {
    params: { targetId, targetType },
  });
  return data.count;
}
