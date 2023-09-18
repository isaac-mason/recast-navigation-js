export const readFile = (
  file: File
): Promise<{
  buffer: ArrayBuffer;
}> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onabort = () => reject('file reading was aborted');
    reader.onerror = () => reject('file reading has failed');

    reader.onload = async () => {
      const buffer = reader.result as ArrayBuffer;
      resolve({ buffer });
    };

    reader.readAsArrayBuffer(file);
  });
};
