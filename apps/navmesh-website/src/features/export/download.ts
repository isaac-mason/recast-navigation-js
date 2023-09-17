export const download = (data: BlobPart, type: string, filename: string) => {
  const blob = new Blob([data], { type });

  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;

  link.click();
};
