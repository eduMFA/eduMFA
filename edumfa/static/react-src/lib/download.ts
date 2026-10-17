/** Offers `blob` as a file download through a temporary link. */
export function saveBlobAsFile(blob: Blob, filename: string): void {
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = objectUrl;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(objectUrl);
}

export function saveTextAsFile(
  text: string,
  filename: string,
  type = "text/plain"
): void {
  saveBlobAsFile(new Blob([text], { type }), filename);
}
