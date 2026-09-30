import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";

const client = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.CLOUDFLARE_R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY!,
  },
});

const BUCKET = process.env.CLOUDFLARE_R2_BUCKET_NAME!;
export const R2_PUBLIC_URL = (process.env.CLOUDFLARE_R2_PUBLIC_URL ?? "").replace(/\/$/, "");

export async function r2Upload(
  buffer: Buffer,
  key: string,
  contentType: string
): Promise<string> {
  await client.send(
    new PutObjectCommand({ Bucket: BUCKET, Key: key, Body: buffer, ContentType: contentType })
  );
  return `${R2_PUBLIC_URL}/${key}`;
}

export async function r2Delete(url: string): Promise<void> {
  if (!url || !url.startsWith(R2_PUBLIC_URL)) return;
  const key = url.slice(R2_PUBLIC_URL.length + 1);
  if (!key) return;
  try {
    await client.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
  } catch {
    // File may already be gone
  }
}

export async function r2List(prefix: string): Promise<Array<{ name: string; url: string }>> {
  const res = await client.send(
    new ListObjectsV2Command({ Bucket: BUCKET, Prefix: prefix })
  );
  return (res.Contents ?? [])
    .filter((obj) => obj.Key && obj.Key !== prefix)
    .map((obj) => ({
      name: obj.Key!.slice(prefix.length),
      url: `${R2_PUBLIC_URL}/${obj.Key}`,
    }));
}
