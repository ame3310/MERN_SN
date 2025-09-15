import api from "@/lib/api";
import { uploadSigned, type SignedUploadFields } from "@/lib/cloudinary";

export type SignParams = { kind: "post" | "avatar" };

export async function getSignedFields(params: SignParams) {
  const { data } = await api.get<SignedUploadFields>("/uploads/sign", { params });
  return data;
}

export async function getSignedBatch(params: SignParams & { count: number }) {
  const { data } = await api.post<{ items: SignedUploadFields[] }>("/uploads/sign-batch", params);
  return data.items;
}

export async function uploadWithSigned(file: File, signed: SignedUploadFields): Promise<string> {
  const asset = await uploadSigned(file, signed);
  return asset.secureUrl;
}

export async function uploadAvatar(file: File): Promise<string> {
  const [signed] = await getSignedBatch({ kind: "avatar", count: 1 });
  if (!signed) throw new Error("No signed data returned");
  const asset = await uploadSigned(file, signed);
  return asset.secureUrl;
}
