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

/** Ensure the array to be in the correct length, fill in with `defaultValue` if too short */
export function maskArrayToLength<T>(
  array: T[],
  targetLength: number,
  defaultValue: T
): T[] {
  if (array.length > targetLength) {
    return array.slice(0, targetLength);
  } else if (array.length < targetLength) {
    return [...array, ...Array(targetLength - array.length).fill(defaultValue)];
  } else {
    return array;
  }
}

/**
 * This is much more efficient than manually converting a Blob or Uint8Array (e.g. `new Blob([uint8Array])`) to string / dataUri.
 */
export const downloadBlob = (blob: Blob, fileName: string) => {
  const link = document.createElement("a");
  // create a blobURI pointing to our Blob
  link.href = URL.createObjectURL(blob);
  link.download = fileName;
  // some browser needs the anchor to be in the doc
  document.body.append(link);
  link.click();
  link.remove();
  // in case the Blob uses a lot of memory
  setTimeout(() => URL.revokeObjectURL(link.href), 7000);
};
