import { prisma } from "@/lib/prisma";
import { mkdir, writeFile, rm } from "fs/promises";
import { join, normalize, sep } from "path";
import { cwd } from "process";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const AdmZip = require("adm-zip");

const SKILL_UPLOAD_DIR = join(cwd(), "uploads", "skills");

// Ensure the skill's file directory exists
export async function ensureSkillDir(skillId: string): Promise<string> {
  const dir = join(SKILL_UPLOAD_DIR, skillId, "files");
  await mkdir(dir, { recursive: true });
  return dir;
}

export async function ensureSkillZipDir(skillId: string): Promise<string> {
  const dir = join(SKILL_UPLOAD_DIR, skillId);
  await mkdir(dir, { recursive: true });
  return dir;
}

// Extract ZIP and populate SkillFile records
export async function processSkillZip(
  skillId: string,
  zipBuffer: Buffer,
): Promise<{ fileCount: number; zipUrl: string }> {
  const skillDir = await ensureSkillZipDir(skillId);
  const filesDir = await ensureSkillDir(skillId);

  // Save original ZIP
  const zipPath = join(skillDir, "original.zip");
  await writeFile(zipPath, zipBuffer);

  // Delete existing SkillFile records for this skill
  await prisma.skillFile.deleteMany({ where: { skillId } });

  // Delete existing extracted files
  try {
    await rm(filesDir, { recursive: true, force: true });
  } catch {
    // ignore
  }
  await mkdir(filesDir, { recursive: true });

  // Extract ZIP
  const zip = new AdmZip(zipBuffer);
  const zipEntries = zip.getEntries();

  const textExtensions = new Set([
    ".md",
    ".txt",
    ".yaml",
    ".yml",
    ".json",
    ".js",
    ".ts",
    ".tsx",
    ".jsx",
    ".py",
    ".sh",
    ".bash",
    ".zsh",
    ".bat",
    ".ps1",
    ".css",
    ".html",
    ".xml",
    ".svg",
    ".env",
    ".gitignore",
    ".dockerignore",
    ".toml",
    ".ini",
    ".cfg",
    ".conf",
  ]);

  let fileCount = 0;

  for (const entry of zipEntries) {
    const entryPath = normalizePath(entry.entryName);
    if (!entryPath || entryPath.startsWith("..") || entryPath.includes(".." + sep)) {
      continue; // skip unsafe paths
    }

    if (entry.isDirectory) {
      const dirPath = join(filesDir, entryPath);
      await mkdir(dirPath, { recursive: true });
      continue;
    }

    // Write file to disk
    const filePath = join(filesDir, entryPath);
    const fileDir = filePath.substring(0, filePath.lastIndexOf(sep));
    await mkdir(fileDir, { recursive: true });
    await writeFile(filePath, entry.getData());

    const ext = entryPath.includes(".")
      ? entryPath.substring(entryPath.lastIndexOf(".")).toLowerCase()
      : "";
    const isText = textExtensions.has(ext);
    const content = isText ? entry.getData().toString("utf-8") : null;
    const size = entry.header?.compressedSize ?? entry.getData().length;

    await prisma.skillFile.create({
      data: {
        skillId,
        path: entryPath,
        content,
        mimeType: getMimeType(ext),
        size,
      },
    });

    fileCount++;
  }

  // Update skill's zipUrl
  const zipUrl = `/api/skills/${skillId}/download`;
  await prisma.skill.update({
    where: { id: skillId },
    data: { zipUrl },
  });

  return { fileCount, zipUrl };
}

// Get file content for display
export async function getSkillFileContent(
  skillId: string,
  filePath: string,
): Promise<string | null> {
  const safePath = normalizePath(filePath);
  if (!safePath || safePath.includes("..")) return null;

  const record = await prisma.skillFile.findUnique({
    where: { skillId_path: { skillId, path: safePath } },
  });

  return record?.content ?? null;
}

// Re-create ZIP from extracted files for download.
// If no uploaded files exist but the skill has skillMd content,
// generates a minimal ZIP containing just SKILL.md.
export async function createDownloadZip(skillId: string): Promise<Buffer | null> {
  const filesDir = join(SKILL_UPLOAD_DIR, skillId, "files");
  const originalZip = join(SKILL_UPLOAD_DIR, skillId, "original.zip");

  // 1. Try to serve the original uploaded ZIP first
  try {
    const { stat } = await import("fs/promises");
    const s = await stat(originalZip);
    if (s.isFile()) {
      const { readFile } = await import("fs/promises");
      return await readFile(originalZip);
    }
  } catch {
    // original doesn't exist, fall through
  }

  // 2. Try to rebuild ZIP from extracted files on disk
  async function addDir(zip: InstanceType<typeof AdmZip>, dir: string, base = "") {
    const { readdir, stat } = await import("fs/promises");
    let entries: string[];
    try {
      entries = await readdir(dir);
    } catch {
      return;
    }
    for (const entry of entries) {
      const fullPath = join(dir, entry);
      const statResult = await stat(fullPath);
      const zipPath = base ? `${base}/${entry}` : entry;
      if (statResult.isDirectory()) {
        await addDir(zip, fullPath, zipPath);
      } else {
        const { readFile } = await import("fs/promises");
        const data = await readFile(fullPath);
        zip.addFile(zipPath, data);
      }
    }
  }

  try {
    const { readdir } = await import("fs/promises");
    const entries = await readdir(filesDir);
    if (entries.length > 0) {
      const zip = new AdmZip();
      await addDir(zip, filesDir);
      return zip.toBuffer();
    }
  } catch {
    // files dir doesn't exist, fall through to skillMd fallback
  }

  // 3. Fallback: build a ZIP from the skillMd field stored in the database
  const skill = await prisma.skill.findUnique({
    where: { id: skillId },
    select: { slug: true, skillMd: true },
  });

  if (skill?.skillMd) {
    const zip = new AdmZip();
    const folderName = skill.slug;
    zip.addFile(`${folderName}/SKILL.md`, Buffer.from(skill.skillMd, "utf-8"));
    return zip.toBuffer();
  }

  return null;
}

function normalizePath(p: string): string {
  return normalize(p)
    .replace(/^[A-Za-z]:/, "")
    .replace(/^[/\\]+/, "");
}

function getMimeType(ext: string): string {
  const map: Record<string, string> = {
    ".md": "text/markdown",
    ".txt": "text/plain",
    ".yaml": "text/yaml",
    ".yml": "text/yaml",
    ".json": "application/json",
    ".js": "text/javascript",
    ".ts": "text/typescript",
    ".py": "text/x-python",
    ".sh": "text/x-shellscript",
    ".html": "text/html",
    ".css": "text/css",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".webp": "image/webp",
  };
  return map[ext] ?? "application/octet-stream";
}
