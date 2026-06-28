export interface FileNode {
  name: string;
  path?: string;
  children?: FileNode[];
  isDir: boolean;
  size?: number;
  mimeType?: string;
}

export function buildFileTree(
  files: Array<{ path: string; mimeType: string | null; size: number }>,
): FileNode[] {
  const root: FileNode = { name: "", isDir: true, children: [] };

  for (const file of files) {
    const parts = file.path.split("/").filter(Boolean);
    let current = root;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isLast = i === parts.length - 1;
      const existing = current.children?.find((c: FileNode) => c.name === part);

      if (isLast) {
        if (!existing) {
          current.children!.push({
            name: part,
            path: file.path,
            isDir: false,
            size: file.size,
            mimeType: file.mimeType ?? undefined,
          });
        }
      } else {
        if (!existing) {
          const newDir: FileNode = {
            name: part,
            isDir: true,
            children: [],
          };
          current.children!.push(newDir);
          current = newDir;
        } else {
          current = existing;
        }
      }
    }
  }

  return root.children ?? [];
}
