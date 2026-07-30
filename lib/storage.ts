import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

const UPLOAD_ROOT = path.join(process.cwd(), "uploads");

export async function saveUploadedVideo(file: File): Promise<{
  storageKey: string;
  absolutePath: string;
}> {
  await mkdir(UPLOAD_ROOT, { recursive: true });

  const ext = path.extname(file.name) || ".mp4";
  const storageKey = `${randomUUID()}${ext}`;
  const absolutePath = path.join(UPLOAD_ROOT, storageKey);

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(absolutePath, buffer);

  return { storageKey, absolutePath };
}

export function absolutePathForKey(storageKey: string): string {
  return path.join(UPLOAD_ROOT, storageKey);
}
