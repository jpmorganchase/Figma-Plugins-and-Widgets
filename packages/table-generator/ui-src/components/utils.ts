export const downloadDataUri = (dataUri: string, fileName: string) => {
  const link = document.createElement("a");
  link.href = dataUri;
  link.download = fileName;
  // some browser needs the anchor to be in the doc
  document.body.append(link);
  link.click();
  link.remove();
  // in case the Blob uses a log of memory
  setTimeout(() => {
    URL.revokeObjectURL(link.href);
  }, 7000);
};
