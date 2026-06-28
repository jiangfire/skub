import { NextRequest, NextResponse } from "next/server";
import { uploadFile } from "@/lib/s3";
import { requireSessionUser } from "@/lib/api/session";
import { withErrorHandler } from "@/lib/api/handler";

// ─── POST /api/upload — Upload a file ───
// Expects multipart/form-data with a "file" field.
// Returns { url: string } on success.

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/json",
  "application/yaml",
  "text/yaml",
  "text/plain",
  "application/pdf",
]);

export const POST = withErrorHandler(async (request: NextRequest) => {
  const user = await requireSessionUser();

  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ message: "未提供文件" }, { status: 400 });
  }

  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { message: `文件大小不能超过 ${MAX_FILE_SIZE / 1024 / 1024}MB` },
      { status: 400 },
    );
  }

  // Validate file type
  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json({ message: `不支持的文件类型: ${file.type}` }, { status: 400 });
  }

  // Generate unique key
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const ext = file.name.split(".").pop() ?? "";
  const key = `uploads/${user.id}/${timestamp}-${random}.${ext}`;

  // Read file buffer
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // Upload to S3/MinIO
  const url = await uploadFile(key, buffer, file.type);

  return NextResponse.json({
    url,
    key,
    name: file.name,
    size: file.size,
    type: file.type,
  });
});
