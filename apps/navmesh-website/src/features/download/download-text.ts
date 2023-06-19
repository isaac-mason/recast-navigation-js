export const downloadText = (text: string, type: string, filename: string) => {
  const blob = new Blob([text], { type });

  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;

  link.click();
};
