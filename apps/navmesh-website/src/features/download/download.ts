export const download = (data: BlobPart | Uint8Array, type: string, filename: string) => {
  let blobData: BlobPart;

  if (data instanceof Uint8Array) {
    // Copy Uint8Array to ensure concrete ArrayBuffer for Blob compatibility
    blobData = data.slice();
  } else {
    blobData = data;
  }

  const blob = new Blob([blobData], { type });

  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;

  link.click();
};
