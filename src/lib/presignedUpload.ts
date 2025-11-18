export interface PresignResult { uploadUrl: string; publicUrl: string; key: string; }

export async function getPresignedUrl(file: File, folder = 'properties'): Promise<PresignResult> {
  const res = await fetch('/api/uploads/sign', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fileName: file.name, contentType: file.type, folder })
  });
  if (!res.ok) throw new Error('Failed to presign');
  return res.json();
}

export async function uploadWithPresigned(file: File, presign: PresignResult): Promise<string> {
  const putRes = await fetch(presign.uploadUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } });
  if (!putRes.ok) throw new Error('Failed direct upload');
  return presign.publicUrl;
}
