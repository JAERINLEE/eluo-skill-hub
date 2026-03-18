import { createClient } from '@/shared/infrastructure/supabase/server';

/**
 * 파일명에서 비-ASCII 문자(한글 등)를 제거하고 Storage에 안전한 경로를 생성한다.
 * 타임스탬프를 접두사로 붙여 충돌을 방지하며, 확장자는 유지한다.
 */
export function sanitizeStoragePath(directory: string, originalName: string): string {
  const dotIdx = originalName.lastIndexOf('.');
  const ext = dotIdx >= 0 ? originalName.slice(dotIdx) : '';
  const baseName = dotIdx >= 0 ? originalName.slice(0, dotIdx) : originalName;

  // ASCII 문자·숫자·하이픈·언더스코어만 남기고 제거
  const safe = baseName.replace(/[^a-zA-Z0-9_-]/g, '');
  const prefix = Date.now().toString(36);

  // safe가 비어있으면(전부 한글인 경우) prefix만 사용
  const fileName = safe ? `${prefix}_${safe}${ext}` : `${prefix}${ext}`;
  return `${directory}/${fileName}`;
}

function resolveContentType(fileName: string, browserType: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase();
  const mimeMap: Record<string, string> = {
    md: 'text/markdown',
    zip: 'application/zip',
    txt: 'text/plain',
  };
  if (ext && mimeMap[ext]) return mimeMap[ext];
  return browserType || 'application/octet-stream';
}

export async function uploadFile(
  bucket: string,
  path: string,
  file: File,
): Promise<{ path: string }> {
  const supabase = await createClient();
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const { error } = await supabase.storage.from(bucket).upload(path, buffer, {
    contentType: resolveContentType(file.name, file.type),
    upsert: true,
  });

  if (error) throw new Error(`파일 업로드 실패: ${error.message}`);
  return { path };
}

export async function getPublicUrl(bucket: string, path: string): Promise<string> {
  const supabase = await createClient();
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

export async function deleteFile(bucket: string, path: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.storage.from(bucket).remove([path]);
  if (error) throw new Error(`파일 삭제 실패: ${error.message}`);
}
