import { unparse, parse } from "papaparse";

export const convertToCsvDataUri = <T extends unknown[]>(data: T): string => {
  const rowsString = unparse(data, { header: true });
  return "data:text/csv;charset=utf-8," + encodeURIComponent(rowsString);
};

export const convertToJsonDataUri = <T extends { [key: string]: string }>(
  data: T[],
  metaData: { [key: string]: string }
): string => {
  const contentConverted: { [key: string]: string } = {};
  for (const row of data) {
    if (row.key && row.characters) {
      contentConverted[row.key] = row.characters;
    }
  }
  const exportJson = {
    ...metaData,
    content: contentConverted,
  };
  return (
    "data:application/json;charset=utf-8," +
    encodeURIComponent(JSON.stringify(exportJson))
  );
};
