import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

// ─── S3 / MinIO Client ───
// Reads config from ENV (S3_ENDPOINT, S3_REGION, S3_BUCKET, etc.)
// Supports both AWS S3 and MinIO (via endpoint override).

const endpoint = process.env.S3_ENDPOINT;
const region = process.env.S3_REGION ?? "us-east-1";
export const bucket = process.env.S3_BUCKET ?? "skills-hub";

export const s3Client = new S3Client({
  region,
  endpoint: endpoint ?? undefined,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID ?? "",
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? "",
  },
  forcePathStyle: !!endpoint,
});

/**
 * Upload a file to S3/MinIO.
 * Returns the public URL of the uploaded file.
 */
export async function uploadFile(key: string, body: Buffer, contentType: string): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: body,
    ContentType: contentType,
  });

  await s3Client.send(command);

  if (endpoint) {
    // MinIO: http://localhost:9000/bucket/key
    return `${endpoint}/${bucket}/${key}`;
  }
  return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
}
