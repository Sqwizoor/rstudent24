/**
 * Upload an image file directly to Convex Storage
 * @param file The File or Blob object to upload
 * @param generateUploadUrlFn The Convex mutation to get an upload URL
 * @returns The storage ID of the uploaded file
 */
export async function uploadImageToConvex(
  file: File | Blob,
  generateUploadUrlFn: () => Promise<string>
): Promise<string> {
  // 1. Get a secure short-lived upload URL from Convex
  const postUrl = await generateUploadUrlFn();

  // 2. POST the file binary to the upload URL
  const result = await fetch(postUrl, {
    method: "POST",
    headers: { "Content-Type": file.type || "image/jpeg" },
    body: file,
  });

  if (!result.ok) {
    throw new Error(`Failed to upload image to Convex storage: ${result.statusText}`);
  }

  // 3. Extract the storage ID
  const { storageId } = await result.json();
  return storageId;
}

/**
 * Upload multiple files to Convex storage in parallel
 */
export async function uploadMultipleImagesToConvex(
  files: (File | Blob)[],
  generateUploadUrlFn: () => Promise<string>,
  onProgress?: (completed: number, total: number) => void
): Promise<string[]> {
  let completed = 0;
  const total = files.length;

  const storageIds = await Promise.all(
    files.map(async (file) => {
      const storageId = await uploadImageToConvex(file, generateUploadUrlFn);
      completed++;
      if (onProgress) onProgress(completed, total);
      return storageId;
    })
  );

  return storageIds;
}
