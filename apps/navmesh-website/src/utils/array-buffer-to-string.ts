export const arrayBufferToString = (buffer: ArrayBuffer): Promise<string> => {
  return new Promise((resolve, reject) => {
    var blob = new Blob([buffer], { type: 'text/plain' });
    var reader = new FileReader();
    reader.onload = function (evt) {
      resolve(evt.target!.result as string);
    };
    reader.readAsText(blob, 'utf-8');
  });
};
